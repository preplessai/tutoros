<script lang="ts">
	import type { PlanWeek } from '$lib/lib/types';
	import { planStore } from '$lib/stores/plan.svelte';
	import WeekCard from './WeekCard.svelte';
	import WeekPopup from './WeekPopup.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { goto } from '$app/navigation';

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
			<div class="flex gap-2">
				<Button
					variant="secondary"
					size="sm"
					href={`/dashboard/plans/${planStore.current?.id}/adjust`}>Adjust Plan</Button
				>
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
