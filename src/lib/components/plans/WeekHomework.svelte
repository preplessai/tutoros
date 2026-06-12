<script lang="ts">
	import { supabase } from '$lib/lib/supabase';
	import type { PlanWeekHomework } from '$lib/lib/types';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';

	let { weekId }: { weekId: string } = $props();

	let homework = $state<PlanWeekHomework[]>([]);
	let loading = $state(true);
	let adding = $state(false);

	let newTitle = $state('');
	let newDescription = $state('');
	let newUrl = $state('');

	async function loadHomework() {
		loading = true;
		const { data } = await supabase
			.from('plan_week_homework')
			.select('*')
			.eq('week_id', weekId)
			.order('sort_order', { ascending: true });
		if (data) homework = data as PlanWeekHomework[];
		loading = false;
	}

	$effect(() => {
		loadHomework();
	});

	async function toggleCompleted(item: PlanWeekHomework) {
		const updated = !item.completed;
		await supabase
			.from('plan_week_homework')
			.update({ completed: updated })
			.eq('id', item.id);
		item.completed = updated;
	}

	async function deleteItem(id: string) {
		await supabase
			.from('plan_week_homework')
			.delete()
			.eq('id', id);
		homework = homework.filter((h) => h.id !== id);
	}

	async function addItem() {
		if (!newTitle.trim()) return;
		const sortOrder = homework.length > 0 ? Math.max(...homework.map((h) => h.sort_order)) + 1 : 1;
		const { data } = await supabase
			.from('plan_week_homework')
			.insert({
				week_id: weekId,
				title: newTitle.trim(),
				description: newDescription.trim() || null,
				url: newUrl.trim() || null,
				completed: false,
				sort_order: sortOrder
			})
			.select()
			.single();
		if (data) {
			homework = [...homework, data as PlanWeekHomework];
		}
		newTitle = '';
		newDescription = '';
		newUrl = '';
		adding = false;
	}

	function cancelAdd() {
		newTitle = '';
		newDescription = '';
		newUrl = '';
		adding = false;
	}
</script>

<div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
	<h4 class="mb-3 text-sm font-semibold tracking-wider text-[var(--color-text-secondary)] uppercase">
		Homework
	</h4>

	{#if loading}
		<div class="flex items-center justify-center py-4">
			<svg class="h-5 w-5 animate-spin text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
			</svg>
		</div>
	{:else if homework.length === 0 && !adding}
		<p class="mb-3 text-sm text-[var(--color-text-tertiary)]">No homework assigned yet.</p>
	{:else}
		<div class="mb-3 space-y-1.5">
			{#each homework as item (item.id)}
				<div class="flex items-start gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2">
					<button
						onclick={() => toggleCompleted(item)}
						class="mt-0.5 shrink-0 cursor-pointer"
						aria-label="Toggle completion"
					>
						{#if item.completed}
							<svg class="h-4 w-4 text-[var(--color-success)]" fill="currentColor" viewBox="0 0 24 24">
								<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
							</svg>
						{:else}
							<div class="h-4 w-4 rounded border border-[var(--color-border-strong)]"></div>
						{/if}
					</button>
					<div class="min-w-0 flex-1">
						<span class="block text-sm font-medium text-[var(--color-text-primary)]"
							>{item.title}</span
						>
						{#if item.description}
							<p class="mt-0.5 text-xs text-[var(--color-text-tertiary)]">{item.description}</p>
						{/if}
						{#if item.url}
							<a
								href={item.url}
								target="_blank"
								rel="noopener noreferrer"
								class="mt-0.5 inline-block text-xs text-[var(--color-primary-500)] hover:underline"
							>
								{item.url}
							</a>
						{/if}
					</div>
					<button
						onclick={() => deleteItem(item.id)}
						class="shrink-0 cursor-pointer rounded p-1 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-error-bg)] hover:text-[var(--color-error)]"
						aria-label="Delete homework"
					>
						<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							/></svg
						>
					</button>
				</div>
			{/each}
		</div>
	{/if}

	{#if adding}
		<div class="space-y-2 border-t border-[var(--color-border)] pt-3">
			<Input
				label="Title"
				name="homeworkTitle"
				placeholder="Homework title"
				value={newTitle}
				oninput={(e) => (newTitle = (e.target as HTMLInputElement).value)}
			/>
			<Textarea
				label="Description (optional)"
				name="homeworkDescription"
				placeholder="Description..."
				value={newDescription}
				oninput={(e) => (newDescription = (e.target as HTMLTextAreaElement).value)}
				rows={2}
			/>
			<Input
				label="URL (optional)"
				name="homeworkUrl"
				placeholder="https://..."
				value={newUrl}
				oninput={(e) => (newUrl = (e.target as HTMLInputElement).value)}
			/>
			<div class="flex gap-2">
				<Button variant="gradient" size="sm" onclick={addItem}>Save</Button>
				<Button variant="ghost" size="sm" onclick={cancelAdd}>Cancel</Button>
			</div>
		</div>
	{:else}
		<Button variant="secondary" size="sm" onclick={() => (adding = true)} fullWidth>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
				><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg
			>
			Add Homework
		</Button>
	{/if}
</div>
