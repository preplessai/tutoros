<script lang="ts">
	import type { PlanWeek, PlanDay, PlanTask } from '$lib/lib/types';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';

	let {
		week,
		active = false,
		onclick
	}: { week: PlanWeek; active?: boolean; onclick?: () => void } = $props();

	const colors = [
		'var(--color-primary-500)',
		'var(--color-accent-500)',
		'var(--color-success)',
		'var(--color-primary-400)',
		'var(--color-accent-400)',
		'var(--color-warning)'
	];
	let accentColor = $derived(colors[(week.week_number - 1) % colors.length]);

	function handleClick(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		onclick?.();
	}
</script>

<Card hover padding={false}>
	<button
		type="button"
		onclick={handleClick}
		class="w-full cursor-pointer rounded-[inherit] p-4 text-left transition-all"
	>
		<div class="flex items-center gap-4">
			<!-- Week number badge -->
			<div
				class="shadow-clay-sm flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
				style="background:{accentColor}"
			>
				{week.week_number}
			</div>

			<!-- Content -->
			<div class="min-w-0 flex-1">
				<div class="flex items-center gap-2">
					<h3 class="truncate font-[family-name:var(--font-heading)] text-base font-semibold text-[var(--color-text-primary)]">
						{week.theme || `Week ${week.week_number}`}
					</h3>
					{#if !week.ai_generated}
						<Badge variant="warning">Edited</Badge>
					{/if}
				</div>

				{#if week.focus_areas.length > 0}
					<div class="mt-1.5 flex flex-wrap gap-1">
						{#each week.focus_areas.slice(0, 4) as area}
							<Badge variant="primary">{area}</Badge>
						{/each}
						{#if week.focus_areas.length > 4}
							<Badge>+{week.focus_areas.length - 4}</Badge>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Chevron -->
			<svg class="h-5 w-5 shrink-0 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"
				><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
		</div>
	</button>
</Card>
