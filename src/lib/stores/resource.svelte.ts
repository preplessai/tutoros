import type { Resource, ResourceType } from '$lib/lib/types';
import { supabase } from '$lib/lib/supabase';
import { toast } from './toast.svelte';

let resourcesByTask = $state<Record<string, Resource[]>>({});
let loading = $state(false);

export const resourceStore = {
	get resourcesByTask() {
		return resourcesByTask;
	},
	get loading() {
		return loading;
	},

	/** Fetch resources for all tasks in a day plan */
	async fetchByDay(dayId: string) {
		loading = true;

		// Get task IDs for this day
		const { data: tasks } = await supabase.from('plan_tasks').select('id').eq('day_id', dayId);

		if (!tasks || tasks.length === 0) {
			resourcesByTask = {};
			loading = false;
			return;
		}

		const taskIds = tasks.map((t) => t.id);

		const { data: resources } = await supabase
			.from('resources')
			.select('*')
			.in('task_id', taskIds)
			.order('created_at');

		if (resources) {
			// Group by task_id
			const grouped: Record<string, Resource[]> = {};
			for (const res of resources as Resource[]) {
				if (!grouped[res.task_id]) grouped[res.task_id] = [];
				grouped[res.task_id].push(res);
			}
			resourcesByTask = grouped;
		}

		loading = false;
	},

	/** Fetch resources for a specific task */
	async fetchByTask(taskId: string): Promise<Resource[]> {
		const { data } = await supabase
			.from('resources')
			.select('*')
			.eq('task_id', taskId)
			.order('created_at');

		const list = (data as Resource[]) || [];
		resourcesByTask = { ...resourcesByTask, [taskId]: list };
		return list;
	},

	/** Save a resource to a task */
	async save(
		taskId: string,
		resource: {
			title: string;
			url: string;
			source: string;
			type: ResourceType;
			description: string | null;
		}
	): Promise<Resource | null> {
		try {
			const { data, error } = await supabase
				.from('resources')
				.insert({
					task_id: taskId,
					title: resource.title,
					url: resource.url,
					source: resource.source,
					type: resource.type,
					description: resource.description || null,
					ai_generated: false
				})
				.select()
				.single();

			if (error) throw error;

			const saved = data as Resource;

			// Update local state
			const current = resourcesByTask[taskId] || [];
			resourcesByTask = { ...resourcesByTask, [taskId]: [...current, saved] };

			toast.success('Resource saved to task');
			return saved;
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Unknown error';
			toast.error('Failed to save resource: ' + message);
			return null;
		}
	},

	/** Remove a saved resource */
	async remove(resourceId: string): Promise<boolean> {
		try {
			const { error } = await supabase.from('resources').delete().eq('id', resourceId);
			if (error) throw error;

			// Remove from local state
			for (const taskId of Object.keys(resourcesByTask)) {
				resourcesByTask[taskId] = resourcesByTask[taskId].filter((r) => r.id !== resourceId);
			}

			toast.success('Resource removed');
			return true;
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Unknown error';
			toast.error('Failed to remove resource: ' + message);
			return false;
		}
	},

	/** Fetch all saved resources (for resource library page) */
	async fetchAll(): Promise<Resource[]> {
		loading = true;
		const { data } = await supabase
			.from('resources')
			.select('*')
			.order('created_at', { ascending: false });

		loading = false;
		return (data as Resource[]) || [];
	}
};
