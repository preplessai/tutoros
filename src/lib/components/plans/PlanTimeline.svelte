<script lang="ts">
	import type { PlanWeek, PlanTask } from '$lib/lib/types';
	import { planStore } from '$lib/stores/plan.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { canUseFeature } from '$lib/lib/constants';
	import { supabase } from '$lib/lib/supabase';
	import { exportWeek, exportWeekJson, openExport, downloadJson } from '$lib/lib/export';
	import type { ExportWeekJson } from '$lib/lib/export';
	import { parseImportJson } from '$lib/lib/export';
	import WeekCard from './WeekCard.svelte';
	import WeekPopup from './WeekPopup.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { goto } from '$app/navigation';
	import { stripeApi } from '$lib/lib/stripe';

	let activeWeek = $state<PlanWeek | null>(null);
	let popupOpen = $state(false);
	let scrollEl = $state<HTMLDivElement>();

	function openPopup(week: PlanWeek) {
		activeWeek = week;
		popupOpen = true;
	}

	function closePopup() {
		popupOpen = false;
		activeWeek = null;
	}

	function scrollLeft() {
		scrollEl?.scrollBy({ left: -320, behavior: 'smooth' });
	}
	function scrollRight() {
		scrollEl?.scrollBy({ left: 320, behavior: 'smooth' });
	}

	// ── Export Plan (all weeks) ──

	let showExportMenu = $state(false);

	function handleExportBlur() {
		setTimeout(() => { showExportMenu = false; }, 150);
	}

	async function fetchAllWeeksData(): Promise<{ week: PlanWeek; days: { day: import('$lib/lib/types').PlanDay; tasks: PlanTask[] }[] }[]> {
		const weeks = planStore.weeks;
		const result = await Promise.all(
			weeks.map(async (week) => {
				const { data: days } = await supabase
					.from('plan_days')
					.select('*')
					.eq('week_id', week.id)
					.order('date');
				const daysWithTasks = await Promise.all(
					(days || []).map(async (day) => {
						const { data: tasks } = await supabase
							.from('plan_tasks')
							.select('*')
							.eq('day_id', day.id)
							.order('sort_order');
						return { day: day as import('$lib/lib/types').PlanDay, tasks: (tasks as PlanTask[]) || [] };
					})
				);
				return { week, days: daysWithTasks };
			})
		);
		return result;
	}

	async function handleExportPage() {
		const allData = await fetchAllWeeksData();
		const planTitle = planStore.current?.title || 'Plan';

		// Build combined HTML
		const css = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',-apple-system,sans-serif;background:#0C0E0F;color:#EDEFEF;padding:40px;line-height:1.6}h1{font-family:'Instrument Serif',Georgia,serif;font-size:28px;color:#00E5A0;margin-bottom:4px}h2{font-family:'Instrument Serif',Georgia,serif;font-size:22px;color:#EDEFEF;margin:24px 0 12px 0;border-bottom:1px solid rgba(237,239,239,0.1);padding-bottom:8px}@media print{body{background:#fff;color:#000;padding:20px}h1{color:#000}}`;
		const weeksHtml = allData.map(({ week, days }) => {
			// Strip outer HTML wrapper from exportWeek, keep body content
			const full = exportWeek(week, days);
			const bodyMatch = full.match(/<body>(.*)<\/body>/s);
			return bodyMatch ? bodyMatch[1] : '';
		}).join('');

		const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${planTitle}</title><style>${css}</style></head><body><h1>${planTitle}</h1>${weeksHtml}</body></html>`;
		openExport(html);
		showExportMenu = false;
	}

	async function handleExportJson() {
		const allData = await fetchAllWeeksData();
		const planTitle = planStore.current?.title || 'Plan';
		// Export as week_plan format so it can be re-imported.
		// Use first week's metadata, merge all days from all weeks.
		const firstWeek = allData[0]?.week;
		const allDays = allData.flatMap(({ days }) => days);
		const exportData: ExportWeekJson = {
			type: 'week_plan',
			version: 1,
			exported_at: new Date().toISOString(),
			week: {
				week_number: firstWeek?.week_number ?? 1,
				week_start: firstWeek?.week_start ?? '',
				week_end: allData[allData.length - 1]?.week.week_end ?? firstWeek?.week_end ?? '',
				theme: planTitle,
				focus_areas: firstWeek?.focus_areas ?? [],
				notes: firstWeek?.notes ?? null
			},
			days: allData.flatMap(({ week, days }) =>
				days.map(({ day, tasks }) => ({
					date: day.date,
					day_of_week: day.day_of_week,
					energy_level: day.energy_level,
					recent_progress: day.recent_progress,
					struggle_areas: day.struggle_areas,
					grades_context: day.grades_context,
					tasks: tasks.map((t) => ({
						section: t.section,
						title: t.title,
						description: t.description,
						duration_minutes: t.duration_minutes
					}))
				}))
			)
		};
		const json = JSON.stringify(exportData, null, 2);
		const filename = `${planTitle.toLowerCase().replace(/\s+/g, '-')}.json`;
		downloadJson(json, filename);
		showExportMenu = false;
	}

	// ── Import Week ──

	let importWeekInput = $state<HTMLInputElement>();
	let importingWeek = $state(false);

	function triggerImportWeek() {
		importWeekInput?.click();
	}

	async function handleImportWeek(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;

		importingWeek = true;
		try {
			const text = await file.text();
			const parsed = parseImportJson(text);

			if (parsed.type === 'week_plan') {
				await planStore.importWeekFromJson((parsed.data as ExportWeekJson));
			} else if (parsed.type === 'day_plan') {
				throw new Error('This file is a day plan export. Import it from the week popup instead.');
			} else {
				throw new Error('Unrecognized export format.');
			}
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Unknown error';
			const { toast } = await import('$lib/stores/toast.svelte');
			toast.error('Import failed: ' + message);
		} finally {
			importingWeek = false;
			if (importWeekInput) importWeekInput.value = '';
		}
	}

	let managingSubscription = $state(false);

	async function handleManageSubscription() {
		managingSubscription = true;
		try {
			const { url } = await stripeApi.createPortalSession();
			window.location.href = url;
		} catch (err: unknown) {
			const { toast } = await import('$lib/stores/toast.svelte');
			toast.error('Failed to open subscription portal');
		} finally {
			managingSubscription = false;
		}
	}
</script>

<div class="space-y-6">
	<!-- Header with breadcrumb -->
	<div>
		<nav class="mb-2 flex items-center gap-2 text-sm text-[var(--color-text-tertiary)]">
			<a href="/dashboard" class="no-underline transition-colors hover:text-[var(--color-text-primary)]"
				>Dashboard</a
			>
			<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
				><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg
			>
			<a
				href="/dashboard/plans"
				class="no-underline transition-colors hover:text-[var(--color-text-primary)]">Plans</a
			>
			<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
				><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg
			>
			<span class="truncate text-[var(--color-text-secondary)]"
				>{planStore.current?.title || 'Timeline'}</span
			>
		</nav>

		<div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<h1
					class="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-text-primary)] md:text-3xl"
				>
					{planStore.current?.title || 'Plan'}
				</h1>
				<div class="mt-2 flex flex-wrap items-center gap-2">
					{#if planStore.current}
						<span
							class="inline-flex items-center gap-1 rounded-lg bg-[var(--color-primary-100)] px-2 py-0.5 text-xs font-medium text-[var(--color-primary-700)]"
							>{planStore.current.grade}</span
						>
						{#each planStore.current.subjects.slice(0, 3) as subj (subj)}
							<span
								class="inline-flex items-center gap-1 rounded-lg bg-[var(--color-surface-tertiary)] px-2 py-0.5 text-xs font-medium text-[var(--color-text-secondary)]"
								>{subj}</span
							>
						{/each}
						<span class="text-xs text-[var(--color-text-tertiary)]"
							>{planStore.weeks.length} weeks</span
						>
					{/if}
				</div>
			</div>
			<div class="flex flex-wrap gap-2">
				{#if canUseFeature(auth.profile?.subscription_tier || 'free', 'plan_regeneration')}
					<Button
						variant="secondary"
						size="sm"
						href={`/dashboard/plans/${planStore.current?.id}/adjust`}>Adjust Plan</Button
					>
				{:else}
					<Button variant="secondary" size="sm" href="/pricing">
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
						</svg>
						Upgrade to Adjust
					</Button>
				{/if}

				<!-- Subscription-aware buttons -->
				{#if auth.profile?.subscription_tier === 'free'}
					<Button variant="gradient" size="sm" href="/pricing">Upgrade to Pro</Button>
				{:else if auth.profile?.cancel_at_period_end}
					<Button variant="gradient" size="sm" href="/pricing">Resubscribe</Button>
				{:else if auth.profile?.subscription_status === 'active'}
					<Button variant="secondary" size="sm" onclick={handleManageSubscription} loading={managingSubscription}>Manage Plan</Button>
				{/if}

				{#if (auth.profile?.subscription_tier || 'free') !== 'free'}
					<!-- Export Plan dropdown -->
					<div class="relative" onfocusout={handleExportBlur}>
						<Button variant="secondary" size="sm" onclick={() => (showExportMenu = !showExportMenu)}>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
								><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/></svg
							>
							Export Plan
							<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"
								><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"
								/></svg
							>
						</Button>
						{#if showExportMenu}
							<div class="absolute right-0 z-50 mt-1 min-w-[180px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] py-1 shadow-lg">
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

					<Button variant="ghost" size="sm" onclick={triggerImportWeek} loading={importingWeek}>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
							><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
							/></svg
						>
						Import Week
					</Button>
					<input type="file" accept=".json" bind:this={importWeekInput} onchange={handleImportWeek} class="hidden" />
				{/if}

				<Button variant="outline" size="sm" href="/dashboard/plans">All Plans</Button>
			</div>
		</div>
	</div>

	{#if planStore.loading}
		<div class="flex justify-center py-20"><Spinner size="lg" /></div>
	{:else if planStore.weeks.length === 0}
		<EmptyState
			icon="calendar"
			title="No weeks generated"
			description="Something went wrong with the plan generation. Try adjusting the plan."
			action={{
				label: 'Adjust Plan',
				onclick: () => goto(`/dashboard/plans/${planStore.current?.id}/adjust`)
			}}
		/>
	{:else}
		<!-- Horizontal Scroll Timeline -->
		<div class="relative">
			<!-- Scroll arrows -->
			<button
				onclick={scrollLeft}
				aria-label="Scroll timeline left"
				class="shadow-clay-md hover:shadow-clay-lg absolute top-1/2 left-0 z-10 -ml-5 hidden h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-2 border-[var(--color-border)] bg-[var(--color-surface-elevated)] transition-all md:flex"
			>
				<svg
					class="h-5 w-5 text-[var(--color-text-secondary)]"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/></svg
				>
			</button>
			<button
				onclick={scrollRight}
				aria-label="Scroll timeline right"
				class="shadow-clay-md hover:shadow-clay-lg absolute top-1/2 right-0 z-10 -mr-5 hidden h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-2 border-[var(--color-border)] bg-[var(--color-surface-elevated)] transition-all md:flex"
			>
				<svg
					class="h-5 w-5 text-[var(--color-text-secondary)]"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 5l7 7-7 7"
					/></svg
				>
			</button>

			<!-- Scroll container -->
			<div
				bind:this={scrollEl}
				class="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-4 md:mx-0 md:px-0"
				style="scrollbar-width: thin; scrollbar-color: var(--color-border) transparent"
			>
				{#each planStore.weeks as week, i (week.id)}
					<div
						class="w-[280px] shrink-0 snap-start sm:w-[320px]"
						style="animation: fade-in-up 0.4s ease-out {i * 60}ms both"
					>
						<WeekCard {week} active={activeWeek?.id === week.id} onclick={() => openPopup(week)} />
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<WeekPopup open={popupOpen} onclose={closePopup} week={activeWeek} />
