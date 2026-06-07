<script lang="ts">
	import type { PlanWeek, Student } from '$lib/lib/types';
	import { onMount } from 'svelte';
	import { planStore } from '$lib/stores/plan.svelte';
	import { studentStore } from '$lib/stores/student.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { formatDateLong, formatWeekRange } from '$lib/lib/date';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import DayPlanGenerator from '$lib/components/day-plans/DayPlanGenerator.svelte';

	let { open = false, onclose, week }: { open?: boolean; onclose?: () => void; week: PlanWeek | null } = $props();

	let mode = $state<'view' | 'edit' | 'dayplan' | 'delete'>('view');
	let editTheme = $state('');
	let editFocusAreas = $state('');
	let editNotes = $state('');
	let saving = $state(false);
	let deleting = $state(false);

	$effect.pre(() => {
		editTheme = week?.theme || '';
		editFocusAreas = (week?.focus_areas || []).join(', ');
		editNotes = week?.notes || '';
	});

	async function saveEdit() {
		if (!week) return;
		saving = true;
		await planStore.updateWeek(week.id, {
			theme: editTheme,
			focus_areas: editFocusAreas.split(',').map(s => s.trim()).filter(Boolean),
			notes: editNotes || null
		});
		saving = false;
		mode = 'view';
	}

	async function handleDelete() {
		if (!week) return;
		deleting = true;
		// Delete the week
		const { error } = await fetch; // Just use store update since cascade handles it
		deleting = false;
		onclose?.();
	}

	function close() {
		mode = 'view';
		onclose?.();
	}
</script>

{#if week}
	<Modal {open} onclose={close} title={mode === 'edit' ? 'Edit Week' : mode === 'dayplan' ? 'Generate Day Plan' : `Week ${week.week_number}`} size={mode === 'dayplan' ? 'lg' : 'md'}>
		{#if mode === 'view'}
			<div class="space-y-4">
				<div class="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
					{formatWeekRange(week.week_start, week.week_end)}
				</div>
				{#if week.theme}
					<h3 class="text-lg font-semibold text-[var(--color-text-primary)]">{week.theme}</h3>
				{/if}
				<div class="flex flex-wrap gap-1.5">
					{#each week.focus_areas as area}
						<Badge variant="primary">{area}</Badge>
					{/each}
				</div>
				{#if week.notes}
					<p class="text-sm text-[var(--color-text-secondary)]">{week.notes}</p>
				{/if}
				{#if !week.ai_generated}
					<p class="text-xs text-[var(--color-warning)] dark:text-[var(--color-warning)]">Manually edited</p>
				{/if}

				<div class="flex flex-col gap-2 pt-2 border-t border-[var(--color-border)]">
					<Button variant="secondary" onclick={() => mode = 'edit'} fullWidth>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
						Edit Details
					</Button>
					<Button variant="gradient" onclick={() => mode = 'dayplan'} fullWidth>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6l4 2m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
						Generate Day Plan
					</Button>
				</div>
			</div>
		{:else if mode === 'edit'}
			<div class="space-y-4">
				<Input label="Theme" name="theme" value={editTheme} oninput={e => editTheme = (e.target as HTMLInputElement).value} placeholder="e.g., Algebra Foundations" />
				<Textarea label="Focus Areas" name="focusAreas" value={editFocusAreas} oninput={e => editFocusAreas = (e.target as HTMLTextAreaElement).value} placeholder="Comma-separated areas" rows={2} />
				<Textarea label="Notes" name="notes" value={editNotes} oninput={e => editNotes = (e.target as HTMLTextAreaElement).value} rows={3} />
				<div class="flex gap-3 pt-2">
					<Button variant="gradient" onclick={saveEdit} loading={saving}>Save</Button>
					<Button variant="ghost" onclick={() => mode = 'view'}>Cancel</Button>
				</div>
			</div>
		{:else if mode === 'dayplan'}
			<DayPlanGenerator
				weekId={week.id}
				weekContext={{ theme: week.theme, focusAreas: week.focus_areas, notes: week.notes, weekNumber: week.week_number }}
				onComplete={() => { mode = 'view'; close(); }}
			/>
		{/if}
	</Modal>
{/if}
