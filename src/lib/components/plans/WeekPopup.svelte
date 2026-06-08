<script lang="ts">
	import type { PlanWeek } from '$lib/lib/types';
	import { planStore } from '$lib/stores/plan.svelte';
	import { dayPlanStore } from '$lib/stores/dayPlan.svelte';
	import { formatDateLong, formatDateShort } from '$lib/lib/date';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import DayPlanGenerator from '$lib/components/day-plans/DayPlanGenerator.svelte';
	import DayPlanView from '$lib/components/day-plans/DayPlanView.svelte';

	let {
		open = false,
		onclose,
		week
	}: { open?: boolean; onclose?: () => void; week: PlanWeek | null } = $props();

	let mode = $state<'view' | 'edit' | 'dayplan' | 'view_day'>('view');
	let selectedDayId = $state<string | null>(null);
	let editTheme = $state('');
	let editFocusAreas = $state('');
	let editNotes = $state('');
	let saving = $state(false);

	// Fetch existing day plans when week changes
	$effect.pre(() => {
		if (week) {
			mode = 'view';
			selectedDayId = null;
			editTheme = week.theme || '';
			editFocusAreas = (week.focus_areas || []).join(', ');
			editNotes = week.notes || '';
			dayPlanStore.fetchDaysForWeek(week.id);
		}
	});

	async function saveEdit() {
		if (!week) return;
		saving = true;
		await planStore.updateWeek(week.id, {
			theme: editTheme,
			focus_areas: editFocusAreas
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean),
			notes: editNotes || null
		});
		saving = false;
		mode = 'view';
	}

	async function handleDeleteDay(dayId: string, e: Event) {
		e.stopPropagation();
		await dayPlanStore.deleteDay(dayId);
		if (week) dayPlanStore.fetchDaysForWeek(week.id);
	}

	function viewDay(dayId: string) {
		selectedDayId = dayId;
		mode = 'view_day';
	}

	function close() {
		mode = 'view';
		selectedDayId = null;
		onclose?.();
	}

	function onDayPlanGenerated() {
		mode = 'view';
		selectedDayId = null;
		// Refresh day list
		if (week) dayPlanStore.fetchDaysForWeek(week.id);
	}

	const sizes = { view: 'md', edit: 'md', dayplan: 'lg', view_day: 'lg' } as const;
</script>

{#if week}
	<Modal
		{open}
		onclose={close}
		title={mode === 'edit'
			? 'Edit Week'
			: mode === 'dayplan'
				? 'Generate Day Plan'
				: mode === 'view_day'
					? dayPlanStore.currentDay
						? formatDateLong(dayPlanStore.currentDay.date)
						: 'Day Plan'
					: `Week ${week.week_number}`}
		size={sizes[mode]}
	>
		{#if mode === 'view'}
			<div class="space-y-4">
				<div class="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
						/></svg
					>
					{formatDateShort(week.week_start)} — {formatDateShort(week.week_end)}
				</div>
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
				{#if !week.ai_generated}
					<p class="text-xs text-[var(--color-warning)]">Manually edited</p>
				{/if}

				<!-- Existing Day Plans -->
				{#if dayPlanStore.weekDays.length > 0}
					<div class="border-t border-[var(--color-border)] pt-4">
						<h4
							class="mb-2 text-sm font-semibold tracking-wider text-[var(--color-text-secondary)] uppercase"
						>
							Day Plans
						</h4>
						<div class="space-y-1.5">
							{#each dayPlanStore.weekDays as day (day.id)}
								<div class="flex items-center gap-2">
									<button
										onclick={() => viewDay(day.id)}
										class="group flex-1 cursor-pointer rounded-lg border border-[var(--color-border)] px-3 py-2 text-left transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-secondary)]"
									>
										<div class="flex items-center gap-2">
											<svg
												class="h-4 w-4 shrink-0 text-[var(--color-text-tertiary)] transition-colors group-hover:text-[var(--color-primary-500)]"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												><path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
												/></svg
											>
											<span class="text-sm font-medium text-[var(--color-text-primary)]"
												>{formatDateLong(day.date)}</span
											>
											<span class="text-xs text-[var(--color-text-tertiary)] capitalize"
												>{day.day_of_week}</span
											>
										</div>
									</button>
									<button
										onclick={(e: Event) => handleDeleteDay(day.id, e)}
										aria-label="Delete day plan"
										class="shrink-0 cursor-pointer rounded-lg p-2 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-error-bg)] hover:text-[var(--color-error)]"
									>
										<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
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
					</div>
				{/if}

				<div class="flex flex-col gap-2 border-t border-[var(--color-border)] pt-2">
					<Button variant="secondary" onclick={() => (mode = 'edit')} fullWidth>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
							/></svg
						>
						Edit Details
					</Button>
					<Button variant="gradient" onclick={() => (mode = 'dayplan')} fullWidth>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 6v6l4 2m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							/></svg
						>
						Generate Day Plan
					</Button>
				</div>
			</div>
		{:else if mode === 'edit'}
			<div class="space-y-4">
				<Input
					label="Theme"
					name="theme"
					value={editTheme}
					oninput={(e) => (editTheme = (e.target as HTMLInputElement).value)}
					placeholder="e.g., Algebra Foundations"
				/>
				<Textarea
					label="Focus Areas"
					name="focusAreas"
					value={editFocusAreas}
					oninput={(e) => (editFocusAreas = (e.target as HTMLTextAreaElement).value)}
					placeholder="Comma-separated areas"
					rows={2}
				/>
				<Textarea
					label="Notes"
					name="notes"
					value={editNotes}
					oninput={(e) => (editNotes = (e.target as HTMLTextAreaElement).value)}
					rows={3}
				/>
				<div class="flex gap-3 pt-2">
					<Button variant="gradient" onclick={saveEdit} loading={saving}>Save</Button>
					<Button variant="ghost" onclick={() => (mode = 'view')}>Cancel</Button>
				</div>
			</div>
		{:else if mode === 'dayplan'}
			<DayPlanGenerator
				weekId={week.id}
				weekContext={{
					theme: week.theme,
					focusAreas: week.focus_areas,
					notes: week.notes,
					weekNumber: week.week_number
				}}
				onComplete={onDayPlanGenerated}
			/>
		{:else if mode === 'view_day' && selectedDayId}
			<div class="space-y-4">
				<DayPlanView dayId={selectedDayId} />
				<div class="flex gap-3 border-t border-[var(--color-border)] pt-2">
					<Button variant="ghost" onclick={() => (mode = 'view')}>← Back to Week</Button>
				</div>
			</div>
		{/if}
	</Modal>
{/if}
