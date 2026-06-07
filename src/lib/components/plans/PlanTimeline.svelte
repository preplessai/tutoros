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

	function scrollLeft() { scrollEl?.scrollBy({ left: -320, behavior: 'smooth' }); }
	function scrollRight() { scrollEl?.scrollBy({ left: 320, behavior: 'smooth' }); }
</script>

<div class="space-y-6">
	<!-- Header with breadcrumb -->
	<div>
		<nav class="flex items-center gap-2 text-sm text-[var(--color-text-tertiary)] mb-2">
			<a href="/dashboard" class="hover:text-[var(--color-text-primary)] transition-colors no-underline">Dashboard</a>
			<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
			<a href="/dashboard/plans" class="hover:text-[var(--color-text-primary)] transition-colors no-underline">Plans</a>
			<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
			<span class="text-[var(--color-text-secondary)] truncate">{planStore.current?.title || 'Timeline'}</span>
		</nav>

		<div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
			<div>
				<h1 class="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] font-[family-name:var(--font-heading)]">{planStore.current?.title || 'Plan'}</h1>
				<div class="flex flex-wrap items-center gap-2 mt-2">
					{#if planStore.current}
						<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-[var(--color-primary-100)] text-[var(--color-primary-700)]">{planStore.current.grade}</span>
						{#each planStore.current.subjects.slice(0, 3) as subj}
							<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]">{subj}</span>
						{/each}
						<span class="text-xs text-[var(--color-text-tertiary)]">{planStore.weeks.length} weeks</span>
					{/if}
				</div>
			</div>
			<div class="flex gap-2">
				<Button variant="secondary" size="sm" href={`/dashboard/plans/${planStore.current?.id}/adjust`}>Adjust Plan</Button>
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
			action={{ label: 'Adjust Plan', onclick: () => goto(`/dashboard/plans/${planStore.current?.id}/adjust`) }}
		/>
	{:else}
		<!-- Horizontal Scroll Timeline -->
		<div class="relative">
			<!-- Scroll arrows -->
			<button onclick={scrollLeft} aria-label="Scroll timeline left" class="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-[var(--color-surface-elevated)] shadow-clay-md border-2 border-[var(--color-border)] items-center justify-center hover:shadow-clay-lg transition-all cursor-pointer -ml-5">
				<svg class="h-5 w-5 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
			</button>
			<button onclick={scrollRight} aria-label="Scroll timeline right" class="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-[var(--color-surface-elevated)] shadow-clay-md border-2 border-[var(--color-border)] items-center justify-center hover:shadow-clay-lg transition-all cursor-pointer -mr-5">
				<svg class="h-5 w-5 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
			</button>

			<!-- Scroll container -->
			<div
				bind:this={scrollEl}
				class="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-4 px-4 md:mx-0 md:px-0"
				style="scrollbar-width: thin; scrollbar-color: var(--color-border) transparent"
			>
				{#each planStore.weeks as week, i}
					<div class="snap-start shrink-0 w-[280px] sm:w-[320px]" style="animation: fade-in-up 0.4s ease-out {i * 60}ms both">
						<WeekCard {week} active={activeWeek?.id === week.id} onclick={() => openPopup(week)} />
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<WeekPopup open={popupOpen} onclose={closePopup} week={activeWeek} />
