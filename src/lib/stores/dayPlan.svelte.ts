import type { PlanDay, PlanTask } from '$lib/lib/types';
import type { AiGeneratedDayPlan } from '$lib/lib/types';
import { supabase } from '$lib/lib/supabase';
import { api } from '$lib/lib/api';
import { toast } from './toast.svelte';

let currentDay = $state<PlanDay | null>(null);
let tasks = $state<PlanTask[]>([]);
let weekDays = $state<PlanDay[]>([]);
let loading = $state(false);
let generating = $state(false);

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

	async fetchDay(dayId: string) {
		loading = true;
		const { data: day } = await supabase.from('plan_days').select('*').eq('id', dayId).single();
		if (day) currentDay = day as PlanDay;

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
			// Delete tasks first, then the day (cascade should handle, but explicit is safer)
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
	}
};
