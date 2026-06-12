import type { WeeklyPlan, PlanWeek, PlanTask } from '$lib/lib/types';
import type { AiGeneratedPlan } from '$lib/lib/types';
import { supabase } from '$lib/lib/supabase';
import { api } from '$lib/lib/api';
import { creditStore } from './credits.svelte';
import { toast } from './toast.svelte';
import { auth } from './auth.svelte';
import { SUBSCRIPTION_TIERS } from '$lib/lib/constants';

let plans = $state<WeeklyPlan[]>([]);
let current = $state<WeeklyPlan | null>(null);
let weeks = $state<PlanWeek[]>([]);
let loading = $state(false);
let generating = $state(false);

async function getTutorId(): Promise<string> {
	const { data } = await supabase.auth.getSession();
	const userId = data.session?.user?.id;
	if (!userId) throw new Error('Not authenticated');
	return userId;
}

export const planStore = {
	get plans() {
		return plans;
	},
	get current() {
		return current;
	},
	get weeks() {
		return weeks;
	},
	get loading() {
		return loading;
	},
	get generating() {
		return generating;
	},

	async fetchAll() {
		loading = true;
		const { data } = await supabase
			.from('weekly_plans')
			.select('*')
			.order('created_at', { ascending: false });
		if (data) plans = data as WeeklyPlan[];
		loading = false;
	},

	async fetchOne(id: string) {
		loading = true;
		const { data: plan } = await supabase.from('weekly_plans').select('*').eq('id', id).single();
		if (plan) current = plan as WeeklyPlan;

		const { data: ws } = await supabase
			.from('plan_weeks')
			.select('*')
			.eq('plan_id', id)
			.order('week_number');
		if (ws) weeks = ws as PlanWeek[];

		loading = false;
	},

	async generateAndSave(request: any): Promise<string | null> {
		generating = true;
		try {
			// Credit check before API call
			if (!creditStore.hasEnough(1)) {
				toast.error('Insufficient credits. Upgrade your plan or purchase more credits.');
				generating = false;
				return null;
			}

			// Check plan limit
			const tier = auth.profile?.subscription_tier || 'free';
			const maxPlans = SUBSCRIPTION_TIERS[tier]?.maxPlans;
			if (maxPlans !== undefined && maxPlans !== Infinity) {
				const { count, error: countErr } = await supabase
					.from('weekly_plans')
					.select('*', { count: 'exact', head: true })
					.eq('tutor_id', await getTutorId());
				if (!countErr && count !== null && count >= maxPlans) {
					toast.error(
						`You've reached the maximum of ${maxPlans} plans for the ${SUBSCRIPTION_TIERS[tier].name} tier. Upgrade to create more.`
					);
					generating = false;
					return null;
				}
			}

			const result: AiGeneratedPlan = await api.generateWeeklyPlan({
				studentId: request.studentId,
				grade: request.grade,
				subjects: request.subjects,
				timePerSession: request.timePerSession,
				sessionsPerWeek: request.sessionsPerWeek,
				duration: request.duration,
				startDate: request.startDate,
				endDate: request.endDate,
				goals: request.goals,
				diagnosticData: request.diagnosticData,
				extraInfo: request.extraInfo
			});
			const tutorId = await getTutorId();

			// Insert plan
			const { data: plan, error: planErr } = await supabase
				.from('weekly_plans')
				.insert({
					student_id: request.studentId,
					tutor_id: tutorId,
					title: `${request.subjects[0] || 'Tutoring'} Plan`,
					grade: request.grade,
					subjects: request.subjects,
					time_per_session: request.timePerSession,
					sessions_per_week: request.sessionsPerWeek,
					duration: request.duration,
					start_date: request.startDate,
					end_date: request.endDate,
					goals: request.goals,
					ai_raw_response: result,
					status: 'active'
				})
				.select()
				.single();

			if (planErr) throw planErr;

			// Insert weeks and days
			for (const week of result.plan.weeks) {
				const { data: weekRow } = await supabase
					.from('plan_weeks')
					.insert({
						plan_id: plan.id,
						week_number: week.weekNumber,
						week_start: week.weekStart,
						week_end: week.weekEnd,
						theme: week.theme,
						focus_areas: week.focusAreas,
						notes: week.notes,
						sort_order: week.weekNumber
					})
					.select()
					.single();

				if (weekRow) {
					for (const day of week.days) {
						const { data: dayRow } = await supabase
							.from('plan_days')
							.insert({
								week_id: weekRow.id,
								date: day.date,
								day_of_week: day.dayOfWeek,
								sort_order: week.days.indexOf(day)
							})
							.select()
							.single();

						if (dayRow) {
							for (const task of day.tasks) {
								await supabase.from('plan_tasks').insert({
									day_id: dayRow.id,
									section: task.section,
									sort_order: day.tasks.indexOf(task),
									title: task.title,
									description: task.description,
									duration_minutes: task.durationMinutes
								});
							}
						}
					}
				}
			}

			// Deduct credit on success
			await creditStore.useCredits(1, 'weekly_plan_generation');

			toast.success('Plan generated successfully');
			return plan.id;
		} catch (err: any) {
			toast.error('Failed to generate plan: ' + err.message);
			return null;
		} finally {
			generating = false;
		}
	},

	async adjustPlan(planId: string, changes: any): Promise<boolean> {
		generating = true;
		try {
			// Credit check
			if (!creditStore.hasEnough(1)) {
				toast.error('Insufficient credits. Upgrade your plan or purchase more credits.');
				generating = false;
				return false;
			}

			const result: AiGeneratedPlan = await api.adjustPlan({
				currentPlan: current?.ai_raw_response || {},
				changes
			});

			// Delete old weeks/days/tasks
			const { data: oldWeeks } = await supabase
				.from('plan_weeks')
				.select('id')
				.eq('plan_id', planId);
			if (oldWeeks) {
				const weekIds = oldWeeks.map((w) => w.id);
				for (const wid of weekIds) {
					const { data: oldDays } = await supabase
						.from('plan_days')
						.select('id')
						.eq('week_id', wid);
					if (oldDays) {
						for (const did of oldDays) {
							await supabase.from('plan_tasks').delete().eq('day_id', did.id);
						}
						await supabase.from('plan_days').delete().eq('week_id', wid);
					}
					await supabase.from('plan_weeks').delete().eq('plan_id', planId);
				}
			}

			// Insert new
			for (const week of result.plan.weeks) {
				const { data: weekRow } = await supabase
					.from('plan_weeks')
					.insert({
						plan_id: planId,
						week_number: week.weekNumber,
						week_start: week.weekStart,
						week_end: week.weekEnd,
						theme: week.theme,
						focus_areas: week.focusAreas,
						notes: week.notes,
						sort_order: week.weekNumber
					})
					.select()
					.single();

				if (weekRow) {
					for (const day of week.days) {
						const { data: dayRow } = await supabase
							.from('plan_days')
							.insert({
								week_id: weekRow.id,
								date: day.date,
								day_of_week: day.dayOfWeek,
								sort_order: week.days.indexOf(day)
							})
							.select()
							.single();

						if (dayRow) {
							for (const task of day.tasks) {
								await supabase.from('plan_tasks').insert({
									day_id: dayRow.id,
									section: task.section,
									sort_order: day.tasks.indexOf(task),
									title: task.title,
									description: task.description,
									duration_minutes: task.durationMinutes
								});
							}
						}
					}
				}
			}

			await supabase.from('weekly_plans').update({ ai_raw_response: result }).eq('id', planId);
			await this.fetchOne(planId);

			// Deduct credit on success
			await creditStore.useCredits(1, 'plan_adjustment');

			toast.success('Plan adjusted');
			return true;
		} catch (err: any) {
			toast.error('Failed to adjust plan: ' + err.message);
			return false;
		} finally {
			generating = false;
		}
	},

	async remove(id: string) {
		const { error } = await supabase.from('weekly_plans').delete().eq('id', id);
		if (error) {
			toast.error('Failed to delete plan');
			return false;
		}
		toast.success('Plan deleted');
		plans = plans.filter((p) => p.id !== id);
		if (current?.id === id) current = null;
		return true;
	},

	async updateWeek(weekId: string, updates: Partial<PlanWeek>) {
		await supabase
			.from('plan_weeks')
			.update({ ...updates, ai_generated: false })
			.eq('id', weekId);
		await this.fetchOne(current!.id);
		toast.success('Week updated');
	},

	async updateTask(taskId: string, updates: Partial<PlanTask>) {
		await supabase
			.from('plan_tasks')
			.update({ ...updates, ai_generated: false })
			.eq('id', taskId);
	},

	/** Import a week from parsed JSON into the current plan */
	async importWeekFromJson(data: {
		week: {
			week_number: number;
			week_start: string;
			week_end: string;
			theme: string | null;
			focus_areas: string[];
			notes: string | null;
		};
		days: {
			date: string;
			day_of_week: string;
			energy_level: string | null;
			recent_progress: string | null;
			struggle_areas: string[] | null;
			grades_context: string | null;
			tasks: {
				section: string;
				title: string;
				description: string | null;
				duration_minutes: number;
			}[];
		}[];
	}): Promise<string | null> {
		if (!current) {
			toast.error('No plan loaded');
			return null;
		}

		try {
			const { data: weekRow, error: weekErr } = await supabase
				.from('plan_weeks')
				.insert({
					plan_id: current.id,
					week_number: data.week.week_number,
					week_start: data.week.week_start,
					week_end: data.week.week_end,
					theme: data.week.theme,
					focus_areas: data.week.focus_areas,
					notes: data.week.notes,
					ai_generated: false,
					sort_order: data.week.week_number
				})
				.select()
				.single();

			if (weekErr) throw weekErr;

			for (const day of data.days) {
				const { data: dayRow, error: dayErr } = await supabase
					.from('plan_days')
					.insert({
						week_id: weekRow.id,
						date: day.date,
						day_of_week: day.day_of_week,
						energy_level: day.energy_level,
						recent_progress: day.recent_progress,
						struggle_areas: day.struggle_areas,
						grades_context: day.grades_context,
						ai_generated: false,
						sort_order: data.days.indexOf(day)
					})
					.select()
					.single();

				if (dayErr) throw dayErr;

				for (const task of day.tasks) {
					await supabase.from('plan_tasks').insert({
						day_id: dayRow.id,
						section: task.section,
						sort_order: day.tasks.indexOf(task),
						title: task.title,
						description: task.description,
						duration_minutes: task.duration_minutes
					});
				}
			}

			await this.fetchOne(current.id);
			toast.success('Week imported');
			return weekRow.id;
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Unknown error';
			toast.error('Failed to import week: ' + message);
			return null;
		}
	}
};
