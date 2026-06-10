import type { WeeklyPlan, PlanWeek, PlanDay, PlanTask } from '$lib/lib/types';
import type { AiGeneratedPlan } from '$lib/lib/types';
import { supabase } from '$lib/lib/supabase';
import { api } from '$lib/lib/api';
import { creditStore } from './credits.svelte';
import { toast } from './toast.svelte';
import { toISODate } from '$lib/lib/date';

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
	get plans() { return plans; },
	get current() { return current; },
	get weeks() { return weeks; },
	get loading() { return loading; },
	get generating() { return generating; },

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

			const result: AiGeneratedPlan = await api.generateWeeklyPlan(request);
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
					start_date: request.startDate,
					end_date: request.endDate,
					important_dates: request.importantDates,
					goals: request.goals,
					learning_style: request.learningStyle,
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
				}
				await supabase.from('plan_weeks').delete().eq('plan_id', planId);
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
	}
};
