<script lang="ts">
	import type { PlanTask } from '$lib/lib/types';
	import { dayPlanStore } from '$lib/stores/dayPlan.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { canUseFeature } from '$lib/lib/constants';
	import Toggle from '$lib/components/ui/Toggle.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';

	let { task }: { task: PlanTask } = $props();

	const tier = $derived(auth.profile?.subscription_tier || 'free');
	const canTrackHomework = $derived(canUseFeature(tier, 'homework_tracking'));

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

<div
	class="group flex gap-3 rounded-lg p-3 transition-colors hover:bg-[var(--color-surface-secondary)]/50"
>
	{#if canTrackHomework}
		<Toggle checked={task.completed} onchange={toggleComplete} />
	{:else}
		<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-border)] bg-[var(--color-surface-secondary)]" title="Upgrade to Starter for homework tracking">
			<svg class="h-3 w-3 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
			</svg>
		</div>
	{/if}

	{#if editing}
		<div class="flex-1 space-y-2">
			<Input
				name="editTitle"
				value={editTitle}
				oninput={(e) => (editTitle = (e.target as HTMLInputElement).value)}
			/>
			<Textarea
				name="editDesc"
				value={editDescription}
				oninput={(e) => (editDescription = (e.target as HTMLTextAreaElement).value)}
				rows={2}
			/>
			<Input
				name="editDuration"
				type="number"
				value={editDuration}
				oninput={(e) => (editDuration = parseInt((e.target as HTMLInputElement).value))}
				label="Minutes"
			/>
			<div class="flex gap-2">
				<button
					onclick={saveEdit}
					class="cursor-pointer text-sm font-medium text-[var(--color-primary-500)] hover:text-[var(--color-primary-400)]"
					>Save</button
				>
				<button
					onclick={() => (editing = false)}
					class="cursor-pointer text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-secondary)]"
					>Cancel</button
				>
			</div>
		</div>
	{:else}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="min-w-0 flex-1" ondblclick={() => (editing = true)} role="button" tabindex={0}>
			<div class="flex items-center gap-2">
				<h4
					class={`text-sm font-medium ${task.completed ? 'text-[var(--color-text-tertiary)] line-through' : 'text-[var(--color-text-primary)]'}`}
				>
					{task.title}
				</h4>
				<span class="shrink-0 text-xs text-[var(--color-text-tertiary)]"
					>{task.duration_minutes}min</span
				>
			</div>
			{#if task.description}
				<p
					class={`mt-0.5 text-xs ${task.completed ? 'text-[var(--color-text-tertiary)] line-through' : 'text-[var(--color-text-secondary)]'}`}
				>
					{task.description}
				</p>
			{/if}
		</div>
		<button
			onclick={() => (editing = true)}
			class="cursor-pointer p-1 text-[var(--color-text-tertiary)] opacity-0 transition-all group-hover:opacity-100 hover:text-[var(--color-text-secondary)]"
			title="Edit"
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
				><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
				/></svg
			>
		</button>
	{/if}
</div>
