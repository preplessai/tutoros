<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { dayPlanStore } from '$lib/stores/dayPlan.svelte';
	import { resourceStore } from '$lib/stores/resource.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { studentStore } from '$lib/stores/student.svelte';
	import { formatDateLong } from '$lib/lib/date';
	import { exportDayPlan, exportDayPlanJson, openExport, downloadJson } from '$lib/lib/export';
	import type { ExportDayPlanJson } from '$lib/lib/export';
	import { parseImportJson } from '$lib/lib/export';
	import TaskList from './TaskList.svelte';
	import ResourceList from '$lib/components/resources/ResourceList.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import ErrorDisplay from '$lib/components/ui/ErrorDisplay.svelte';
	import AiResourcePicker from '$lib/components/resources/AiResourcePicker.svelte';

	let { dayId }: { dayId: string } = $props();

	let showAiPicker = $state(false);
	let studentForPicker = $state<import('$lib/lib/types').Student | null>(null);

	// Fetch student info when day loads, for AI Resource Picker
	$effect(() => {
		const day = dayPlanStore.currentDay;
		if (day && day.week_id && !studentForPicker) {
			fetchStudentForDay(day.week_id);
		}
	});

	async function fetchStudentForDay(weekId: string) {
		try {
			const { supabase } = await import('$lib/lib/supabase');
			const { data: week } = await supabase
				.from('plan_weeks')
				.select('plan_id')
				.eq('id', weekId)
				.single();
			if (week) {
				const { data: plan } = await supabase
					.from('weekly_plans')
					.select('student_id')
					.eq('id', week.plan_id)
					.single();
				if (plan) {
					const student = await studentStore.fetchOne(plan.student_id);
					studentForPicker = student;
				}
			}
		} catch {
			/* silently ignore — student not needed for core functionality */
		}
	}

	onMount(async () => {
		await dayPlanStore.fetchDay(dayId);
		if (dayPlanStore.currentDay) {
			await resourceStore.fetchByDay(dayId);
		}
	});

	function allResources() {
		return Object.values(resourceStore.resourcesByTask).flat();
	}

	async function handleRemoveResource(id: string) {
		await resourceStore.remove(id);
	}

	// Export dropdown
	let showExportMenu = $state(false);

	function handleExportPage() {
		if (!dayPlanStore.currentDay) return;
		openExport(exportDayPlan(dayPlanStore.currentDay, dayPlanStore.tasks, allResources()));
		showExportMenu = false;
	}

	function handleExportJson() {
		if (!dayPlanStore.currentDay) return;
		const json = JSON.stringify(
			exportDayPlanJson(dayPlanStore.currentDay, dayPlanStore.tasks, allResources()),
			null,
			2
		);
		const filename = `day-plan-${dayPlanStore.currentDay.date}.json`;
		downloadJson(json, filename);
		showExportMenu = false;
	}

	// Import
	let importInput = $state<HTMLInputElement>();
	let importing = $state(false);

	function triggerImport() {
		importInput?.click();
	}

	async function handleImport(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;

		importing = true;
		try {
			const text = await file.text();
			const parsed = parseImportJson(text);

			if (parsed.type !== 'day_plan') {
				throw new Error('This file is a week plan export. Import it from the week view instead.');
			}

			const data = parsed.data as ExportDayPlanJson;
			const weekId = dayPlanStore.currentDay?.week_id;
			if (!weekId) throw new Error('Could not determine which week to import into.');

			await dayPlanStore.importFromJson(weekId, data);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Unknown error';
			// toast handled in importFromJson for parse errors won't have it yet
			const { toast } = await import('$lib/stores/toast.svelte');
			toast.error('Import failed: ' + message);
		} finally {
			importing = false;
			// Reset file input so same file can be re-imported
			if (importInput) importInput.value = '';
		}
	}

	function closeExportMenu() {
		showExportMenu = false;
	}

	// Close export menu on outside click
	function handleExportBlur(e: FocusEvent) {
		// Delay to let click on menu items fire first
		setTimeout(() => {
			showExportMenu = false;
		}, 150);
	}
</script>

{#if dayPlanStore.loading}
	<div class="flex justify-center py-12"><Spinner size="lg" /></div>
{:else if dayPlanStore.error}
	<ErrorDisplay
		status={dayPlanStore.error.status}
		message={dayPlanStore.error.message}
		compact
	/>
{:else if dayPlanStore.currentDay}
	<div class="space-y-6">
		<div>
			<div class="flex items-center gap-2">
				<h1 class="text-xl font-bold text-[var(--color-text-primary)]">
					{formatDateLong(dayPlanStore.currentDay.date)}
				</h1>
				{#if dayPlanStore.currentDay.energy_level}
					<Badge
						variant={dayPlanStore.currentDay.energy_level === 'high'
							? 'success'
							: dayPlanStore.currentDay.energy_level === 'medium'
								? 'info'
								: 'warning'}
					>
						{dayPlanStore.currentDay.energy_level}
					</Badge>
				{/if}
			</div>
			{#if dayPlanStore.currentDay.struggle_areas}
				<p class="mt-1 text-sm text-[var(--color-text-secondary)]">
					Focus: {dayPlanStore.currentDay.struggle_areas.join(', ')}
				</p>
			{/if}
		</div>

		<TaskList tasks={dayPlanStore.tasks} />

		<!-- Saved Resources -->
		<ResourceList resources={allResources()} onRemove={handleRemoveResource} />

		<div class="flex flex-wrap gap-3 border-t border-[var(--color-border)] pt-4">
			<Button
				variant="secondary"
				size="sm"
				onclick={() => goto(`/dashboard/resources/search?dayPlanId=${dayId}`)}
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/></svg
				>
				Find Resources
			</Button>

			<Button variant="secondary" size="sm" onclick={() => (showAiPicker = true)}>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
				</svg>
				AI Pick Best
			</Button>

			{#if (auth.profile?.subscription_tier || 'free') !== 'free'}
				<!-- Export dropdown -->
				<div class="relative" onfocusout={handleExportBlur}>
					<Button variant="secondary" size="sm" onclick={() => (showExportMenu = !showExportMenu)}>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/></svg
						>
						Export
						<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"
							><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"
							/></svg
						>
					</Button>
					{#if showExportMenu}
						<div
							class="absolute left-0 z-50 mt-1 min-w-[180px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] py-1 shadow-lg"
						>
							<button
								onclick={handleExportPage}
								class="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-secondary)]"
							>
								<svg class="h-4 w-4 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"
									><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
									/></svg
								>
								Printable Page
							</button>
							<button
								onclick={handleExportJson}
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

				<!-- Import -->
				<Button variant="ghost" size="sm" onclick={triggerImport} loading={importing}>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
						><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
						/></svg
					>
					Import
				</Button>
				<input
					type="file"
					accept=".json"
					bind:this={importInput}
					onchange={handleImport}
					class="hidden"
				/>
			{/if}
		</div>

		<AiResourcePicker
			dayId={dayId}
			tasks={dayPlanStore.tasks}
			student={studentForPicker}
			open={showAiPicker}
			onclose={() => (showAiPicker = false)}
		/>
	</div>
{/if}
