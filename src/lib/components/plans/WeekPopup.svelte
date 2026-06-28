<script lang="ts">
	import type { PlanWeek } from '$lib/lib/types';
	import { planStore } from '$lib/stores/plan.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import WeekHomework from '$lib/components/plans/WeekHomework.svelte';

	let {
		open = false,
		onclose,
		week
	}: { open?: boolean; onclose?: () => void; week: PlanWeek | null } = $props();

	let mode = $state<'view' | 'edit'>('view');
	let editTheme = $state('');
	let editFocusAreas = $state('');
	let editNotes = $state('');
	let saving = $state(false);

	$effect(() => {
		if (week && open) {
			mode = 'view';
			editTheme = week.theme || '';
			editFocusAreas = (week.focus_areas || []).join(', ');
			editNotes = week.notes || '';
		}
	});

	async function saveEdit() {
		if (!week) return;
		saving = true;
		await planStore.updateWeek(week.id, {
			theme: editTheme,
			focus_areas: editFocusAreas.split(',').map((s) => s.trim()).filter(Boolean),
			notes: editNotes || null
		});
		saving = false;
		mode = 'view';
	}

	function close() {
		mode = 'view';
		onclose?.();
	}
</script>

{#if week}
	<Modal {open} onclose={close} title={mode === 'edit' ? 'Edit Week' : `Week ${week.week_number}`} size="md">
		{#if mode === 'view'}
			<div class="space-y-4">
				{#if week.theme}
					<h3 class="text-lg font-semibold text-[var(--color-text-primary)]">{week.theme}</h3>
				{/if}
				<div class="flex flex-wrap gap-1.5">
					{#each week.focus_areas as area (area)}
						<Badge variant="primary">{area}</Badge>
					{/each}
				</div>
				{#if week.notes}
					<p class="text-sm text-[var(--color-text-secondary)]">{week.notes}</p>
				{/if}

				<WeekHomework weekId={week.id} />

				<Button variant="secondary" onclick={() => (mode = 'edit')} fullWidth>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
					</svg>
					Edit Details
				</Button>
			</div>
		{:else}
			<div class="space-y-4">
				<Input label="Theme" name="theme" value={editTheme} oninput={(e) => (editTheme = (e.target as HTMLInputElement).value)} placeholder="e.g., Algebra Foundations" />
				<Textarea label="Focus Areas" name="focusAreas" value={editFocusAreas} oninput={(e) => (editFocusAreas = (e.target as HTMLTextAreaElement).value)} placeholder="Comma-separated areas" rows={2} />
				<Textarea label="Notes" name="notes" value={editNotes} oninput={(e) => (editNotes = (e.target as HTMLTextAreaElement).value)} rows={3} />
				<div class="flex gap-3 pt-2">
					<Button variant="gradient" onclick={saveEdit} loading={saving}>Save</Button>
					<Button variant="ghost" onclick={() => (mode = 'view')}>Cancel</Button>
				</div>
			</div>
		{/if}
	</Modal>
{/if}
