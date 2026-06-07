<script lang="ts">
	import type { PlanTask } from '$lib/lib/types';
	import SectionLabel from './SectionLabel.svelte';
	import TaskItem from './TaskItem.svelte';

	let { tasks }: { tasks: PlanTask[] } = $props();

	// Group tasks by section
	let sections = $derived(Object.entries(
		tasks.reduce((acc, task) => {
			if (!acc[task.section]) acc[task.section] = [];
			acc[task.section].push(task);
			return acc;
		}, {} as Record<string, PlanTask[]>)
	));
</script>

<div class="space-y-6">
	{#each sections as [section, sectionTasks]}
		<div class="space-y-2">
			<SectionLabel {section} />
			<div class="space-y-1">
				{#each sectionTasks as task}
					<TaskItem {task} />
				{/each}
			</div>
		</div>
	{/each}
</div>
