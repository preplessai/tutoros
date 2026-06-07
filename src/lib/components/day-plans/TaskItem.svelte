<script lang="ts">
	import type { PlanTask } from '$lib/lib/types';
	import { dayPlanStore } from '$lib/stores/dayPlan.svelte';
	import Toggle from '$lib/components/ui/Toggle.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';

	let { task }: { task: PlanTask } = $props();

	let editing = $state(false);
	let editTitle = $state('');
	let editDescription = $state('');
	let editDuration = $state(0);

	$effect.pre(() => {
		editTitle = task.title;
		editDescription = task.description || '';
		editDuration = task.duration_minutes;
	});

	async function saveEdit() {
		await dayPlanStore.updateTask(task.id, {
			title: editTitle,
			description: editDescription || null,
			duration_minutes: editDuration
		});
		editing = false;
	}

	async function toggleComplete() {
		await dayPlanStore.toggleTaskComplete(task.id, !task.completed);
	}
</script>

<div class="group flex gap-3 p-3 rounded-lg hover:bg-[var(--color-surface-secondary)]/50 transition-colors">
	<Toggle checked={task.completed} onchange={toggleComplete} />

	{#if editing}
		<div class="flex-1 space-y-2">
			<Input name="editTitle" value={editTitle} oninput={e => editTitle = (e.target as HTMLInputElement).value} />
			<Textarea name="editDesc" value={editDescription} oninput={e => editDescription = (e.target as HTMLTextAreaElement).value} rows={2} />
			<Input name="editDuration" type="number" value={editDuration} oninput={e => editDuration = parseInt((e.target as HTMLInputElement).value)} label="Minutes" />
			<div class="flex gap-2">
				<button onclick={saveEdit} class="text-sm text-[var(--color-primary-500)] hover:text-[var(--color-primary-400)] font-medium cursor-pointer">Save</button>
				<button onclick={() => editing = false} class="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-secondary)] cursor-pointer">Cancel</button>
			</div>
		</div>
	{:else}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="flex-1 min-w-0" ondblclick={() => editing = true} role="button" tabindex={0}>
			<div class="flex items-center gap-2">
				<h4 class={`text-sm font-medium ${task.completed ? 'line-through text-[var(--color-text-tertiary)]' : 'text-[var(--color-text-primary)]'}`}>{task.title}</h4>
				<span class="text-xs text-[var(--color-text-tertiary)] shrink-0">{task.duration_minutes}min</span>
			</div>
			{#if task.description}
				<p class={`text-xs mt-0.5 ${task.completed ? 'line-through text-[var(--color-text-tertiary)]' : 'text-[var(--color-text-secondary)]'}`}>{task.description}</p>
			{/if}
		</div>
		<button onclick={() => editing = true} class="opacity-0 group-hover:opacity-100 p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-all cursor-pointer" title="Edit">
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
		</button>
	{/if}
</div>
