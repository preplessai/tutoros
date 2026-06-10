<script lang="ts">
	import type { PlanWeek, PlanTask } from '$lib/lib/types';
	import { planStore } from '$lib/stores/plan.svelte';
	import { dayPlanStore } from '$lib/stores/dayPlan.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { supabase } from '$lib/lib/supabase';
	import { formatDateLong, formatDateShort } from '$lib/lib/date';
	import { exportDayPlan, exportDayPlanJson, openExport, downloadJson } from '$lib/lib/export';
	import type { ExportDayPlanJson } from '$lib/lib/export';
	import { parseImportJson } from '$lib/lib/export';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import DayPlanGenerator from '$lib/components/day-plans/DayPlanGenerator.svelte';
	import DayPlanView from '$lib/components/day-plans/DayPlanView.svelte';
	import { canUseFeature } from '$lib/lib/constants';

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
		if (week) dayPlanStore.fetchDaysForWeek(week.id);
	}

	// ── Per-day export ──

	let exportDayMenuFor = $state<string | null>(null);

	function handleExportBlur() {
		setTimeout(() => { exportDayMenuFor = null; }, 150);
	}

	async function exportDayPage(dayId: string, e: Event) {
		e.stopPropagation();
		await dayPlanStore.fetchDay(dayId);
		const day = dayPlanStore.currentDay;
		const tasks = dayPlanStore.tasks;
		if (!day) return;
		const { data: resources } = await supabase.from('resources').select('*').in('task_id', tasks.map(t => t.id));
		openExport(exportDayPlan(day, tasks, (resources || []) as any));
		exportDayMenuFor = null;
	}

	async function exportDayJson(dayId: string, e: Event) {
		e.stopPropagation();
		await dayPlanStore.fetchDay(dayId);
		const day = dayPlanStore.currentDay;
		const tasks = dayPlanStore.tasks;
		if (!day) return;
		const { data: resources } = await supabase.from('resources').select('*').in('task_id', tasks.map(t => t.id));
		const json = JSON.stringify(exportDayPlanJson(day, tasks, (resources || []) as any), null, 2);
		downloadJson(json, `day-plan-${day.date}.json`);
		exportDayMenuFor = null;
	}

	// ── Import Day Plan ──

	let importDayInput = $state<HTMLInputElement>();
	let importingDay = $state(false);

	function triggerImportDay() {
		importDayInput?.click();
	}

	async function handleImportDay(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		if (!week) return;

		importingDay = true;
		try {
			const text = await file.text();
			const parsed = parseImportJson(text);

			if (parsed.type !== 'day_plan') {
				throw new Error('This file is a week plan export. Import it using the "Import Week" button on the plan page instead.');
			}

			const data = parsed.data as ExportDayPlanJson;
			await dayPlanStore.importFromJson(week.id, data);
			dayPlanStore.fetchDaysForWeek(week.id);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Unknown error';
			const { toast } = await import('$lib/stores/toast.svelte');
			toast.error('Import failed: ' + message);
		} finally {
			importingDay = false;
			if (importDayInput) importDayInput.value = '';
		}
	}

	const sizes = { view: 'md', edit: 'md', dayplan: 'lg', view_day: 'xl' } as const;
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

									{#if canUseFeature(auth.profile?.subscription_tier || 'free', 'day_plans')}
										<!-- Per-day export dropdown -->
										<div class="relative" onfocusout={handleExportBlur}>
											<button
												onclick={(e: Event) => { e.stopPropagation(); exportDayMenuFor = exportDayMenuFor === day.id ? null : day.id; }}
												aria-label="Export day plan"
												class="shrink-0 cursor-pointer rounded-lg p-2 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-primary-500)]"
											>
												<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
													><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
													/></svg
												>
											</button>
											{#if exportDayMenuFor === day.id}
												<div class="absolute right-0 z-50 mt-1 min-w-[160px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] py-1 shadow-lg">
													<button
														onclick={(e: Event) => exportDayPage(day.id, e)}
														class="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-secondary)]"
													>
														<svg class="h-4 w-4 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"
															><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
															/></svg
														>
														Printable Page
													</button>
													<button
														onclick={(e: Event) => exportDayJson(day.id, e)}
														class="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-secondary)]"
													>
														<svg class="h-4 w-4 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"
															><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
															/></svg
														>
														JSON File
													</button>
												</div>
											{/if}
										</div>
									{/if}

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

					{#if canUseFeature(auth.profile?.subscription_tier || 'free', 'day_plans')}
						<Button variant="ghost" size="sm" onclick={triggerImportDay} loading={importingDay} fullWidth>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
								><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
								/></svg
							>
							Import Day Plan
						</Button>
						<input type="file" accept=".json" bind:this={importDayInput} onchange={handleImportDay} class="hidden" />
					{:else}
						<Button variant="ghost" size="sm" href="/pricing" fullWidth>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
								><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
								/></svg
							>
							Upgrade to Import
						</Button>
					{/if}
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
