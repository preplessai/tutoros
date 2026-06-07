import type { PlanDay, PlanTask } from '$lib/lib/types';
import type { AiGeneratedDayPlan } from '$lib/lib/types';
import { supabase } from '$lib/lib/supabase';
import { api } from '$lib/lib/api';
import { toast } from './toast.svelte';

let currentDay = $state<PlanDay | null>(null);
let tasks = $state<PlanTask[]>([]);
let loading = $state(false);
let generating = $state(false);

export const dayPlanStore = {
	get currentDay() { return currentDay; },
	get tasks() { return tasks; },
	get loading() { return loading; },
	get generating() { return generating; },

	async fetchDay(dayId: string) {
		loading = true;
		const { data: day } = await supabase.from('plan_days').select('*').eq('id', dayId).single();
		if (day) currentDay = day as PlanDay;

		const { data: ts } = await supabase.from('plan_tasks').select('*').eq('day_id', dayId).order('sort_order');
		if (ts) tasks = ts as PlanTask[];

		loading = false;
	},

	async generateAndSave(weekId: string, dayDate: string, dayOfWeek: string, weekContext: any, studentContext: any): Promise<string | null> {
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
			const { data: day, error: dayErr } = await supabase.from('plan_days').insert({
				week_id: weekId,
				date: dayDate,
				day_of_week: dayOfWeek,
				energy_level: studentContext.energyLevel || null,
				recent_progress: studentContext.recentProgress || null,
				struggle_areas: studentContext.struggleAreas || null,
				grades_context: studentContext.grades || null,
				ai_raw_response: result
			}).select().single();

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
		} catch (err: any) {
			toast.error('Failed to generate day plan: ' + err.message);
			return null;
		} finally {
			generating = false;
		}
	},

	async updateTask(taskId: string, updates: Partial<PlanTask>) {
		await supabase.from('plan_tasks').update({ ...updates, ai_generated: false }).eq('id', taskId);
		tasks = tasks.map(t => t.id === taskId ? { ...t, ...updates, ai_generated: false } : t);
	},

	async toggleTaskComplete(taskId: string, completed: boolean) {
		await supabase.from('plan_tasks').update({ completed }).eq('id', taskId);
		tasks = tasks.map(t => t.id === taskId ? { ...t, completed } : t);
	}
};
