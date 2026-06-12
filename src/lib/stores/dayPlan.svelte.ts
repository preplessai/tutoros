import type { PlanDay, PlanTask } from '$lib/lib/types';
import type { AiGeneratedDayPlan } from '$lib/lib/types';
import { supabase } from '$lib/lib/supabase';
import { api } from '$lib/lib/api';
import { auth } from './auth.svelte';
import { creditStore } from './credits.svelte';
import { toast } from './toast.svelte';

let currentDay = $state<PlanDay | null>(null);
let tasks = $state<PlanTask[]>([]);
let weekDays = $state<PlanDay[]>([]);
let loading = $state(false);
let generating = $state(false);
let error = $state<{ status: number; message: string } | null>(null);

export const dayPlanStore = {
	get currentDay() {
		return currentDay;
	},
	get tasks() {
		return tasks;
	},
	get weekDays() {
		return weekDays;
	},
	get loading() {
		return loading;
	},
	get generating() {
		return generating;
	},
	get error() {
		return error;
	},

	async fetchDay(dayId: string) {
		loading = true;
		error = null;

		// Fetch day with ownership check via join
		const { data: day, error: dayErr } = await supabase
			.from('plan_days')
			.select('*, plan_weeks!inner(plan_id)')
			.eq('id', dayId)
			.single();

		if (dayErr || !day) {
			currentDay = null;
			tasks = [];
			loading = false;
			error = { status: 404, message: 'This day plan could not be found.' };
			return;
		}

		// Check ownership: plan_day → plan_week → weekly_plan.tutor_id
		const weekData = day.plan_weeks as { plan_id: string } | undefined;
		if (weekData?.plan_id) {
			const { data: plan } = await supabase
				.from('weekly_plans')
				.select('tutor_id')
				.eq('id', weekData.plan_id)
				.single();

			if (!plan || plan.tutor_id !== auth.user?.id) {
				currentDay = null;
				tasks = [];
				loading = false;
				error = {
					status: 403,
					message: "You don't have permission to view this day plan."
				};
				return;
			}
		}

		currentDay = day as unknown as PlanDay;

		const { data: ts } = await supabase
			.from('plan_tasks')
			.select('*')
			.eq('day_id', dayId)
			.order('sort_order');
		if (ts) tasks = ts as PlanTask[];

		loading = false;
	},

	async fetchDaysForWeek(weekId: string) {
		const { data } = await supabase
			.from('plan_days')
			.select('*')
			.eq('week_id', weekId)
			.order('date');
		if (data) weekDays = data as PlanDay[];
	},

	async generateAndSave(
		weekId: string,
		dayDate: string,
		dayOfWeek: string,
		weekContext: {
			theme: string | null;
			focusAreas: string[];
			notes: string | null;
			weekNumber: number;
		},
		studentContext: {
			grade: string;
			subjects: string[];
			learningStyle: string;
			recentProgress: string;
			grades: string;
			struggleAreas: string;
			energyLevel: 'low' | 'medium' | 'high';
		}
	): Promise<string | null> {
		generating = true;
		try {
			// Credit check before API call
			if (!creditStore.hasEnough(1)) {
				toast.error('Insufficient credits. Upgrade your plan or purchase more credits.');
				generating = false;
				return null;
			}

			const result: AiGeneratedDayPlan = await api.generateDayPlan({
				weekContext: {
					theme: weekContext.theme,
					focusAreas: weekContext.focusAreas,
					weekNotes: weekContext.notes,
					weekNumber: weekContext.weekNumber
				},
				dayContext: { date: dayDate, dayOfWeek },
				studentContext
			});

			// Insert day plan
			const { data: day, error: dayErr } = await supabase
				.from('plan_days')
				.insert({
					week_id: weekId,
					date: dayDate,
					day_of_week: dayOfWeek,
					energy_level: studentContext.energyLevel || null,
					recent_progress: studentContext.recentProgress || null,
					struggle_areas: studentContext.struggleAreas
						? studentContext.struggleAreas
								.split(/[,\n]/)
								.map((s: string) => s.trim())
								.filter(Boolean)
						: null,
					grades_context: studentContext.grades || null,
					ai_raw_response: result
				})
				.select()
				.single();

			if (dayErr) throw dayErr;

			// Insert tasks
			for (const task of result.dayPlan.tasks) {
				await supabase.from('plan_tasks').insert({
					day_id: day.id,
					section: task.section,
					sort_order: result.dayPlan.tasks.indexOf(task),
					title: task.title,
					description: task.description,
					duration_minutes: task.durationMinutes
				});
			}

			// Deduct credit on success
			await creditStore.useCredits(1, 'day_plan_generation');

			toast.success('Day plan generated');
			await this.fetchDay(day.id);
			return day.id;
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Unknown error';
			toast.error('Failed to generate day plan: ' + message);
			return null;
		} finally {
			generating = false;
		}
	},

	async deleteDay(dayId: string): Promise<boolean> {
		try {
			await supabase.from('plan_tasks').delete().eq('day_id', dayId);
			await supabase.from('plan_days').delete().eq('id', dayId);
			weekDays = weekDays.filter((d) => d.id !== dayId);
			if (currentDay?.id === dayId) {
				currentDay = null;
				tasks = [];
			}
			toast.success('Day plan deleted');
			return true;
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Unknown error';
			toast.error('Failed to delete day plan: ' + message);
			return false;
		}
	},

	async updateTask(taskId: string, updates: Partial<PlanTask>) {
		await supabase
			.from('plan_tasks')
			.update({ ...updates, ai_generated: false })
			.eq('id', taskId);
		tasks = tasks.map((t) => (t.id === taskId ? { ...t, ...updates, ai_generated: false } : t));
	},

	async toggleTaskComplete(taskId: string, completed: boolean) {
		await supabase.from('plan_tasks').update({ completed }).eq('id', taskId);
		tasks = tasks.map((t) => (t.id === taskId ? { ...t, completed } : t));
	},

	/** Import a day plan from parsed JSON into a given week */
	async importFromJson(
		weekId: string,
		data: {
			day: {
				date: string;
				day_of_week: string;
				energy_level: string | null;
				recent_progress: string | null;
				struggle_areas: string[] | null;
				grades_context: string | null;
			};
			tasks: {
				section: string;
				title: string;
				description: string | null;
				duration_minutes: number;
			}[];
		}
	): Promise<string | null> {
		try {
			const { data: day, error: dayErr } = await supabase
				.from('plan_days')
				.insert({
					week_id: weekId,
					date: data.day.date,
					day_of_week: data.day.day_of_week,
					energy_level: data.day.energy_level,
					recent_progress: data.day.recent_progress,
					struggle_areas: data.day.struggle_areas,
					grades_context: data.day.grades_context,
					ai_generated: false
				})
				.select()
				.single();

			if (dayErr) throw dayErr;

			for (const task of data.tasks) {
				await supabase.from('plan_tasks').insert({
					day_id: day.id,
					section: task.section,
					sort_order: data.tasks.indexOf(task),
					title: task.title,
					description: task.description,
					duration_minutes: task.duration_minutes
				});
			}

			toast.success('Day plan imported');
			return day.id;
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Unknown error';
			toast.error('Failed to import day plan: ' + message);
			return null;
		}
	}
};
