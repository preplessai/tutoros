<script lang="ts">
	import type { PlanWeek } from '$lib/lib/types';
	import { formatWeekRange } from '$lib/lib/date';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';

	let { week, active = false, onclick }: { week: PlanWeek; active?: boolean; onclick?: () => void } = $props();

	const colors = ['var(--color-primary-500)', 'var(--color-accent-500)', 'var(--color-success)', 'var(--color-primary-400)', 'var(--color-accent-400)', 'var(--color-warning)'];
	let accentColor = $derived(colors[(week.week_number - 1) % colors.length]);
</script>

<Card {onclick} hover padding={false}>
	<button onclick={onclick} class={`w-full text-left p-5 transition-all cursor-pointer rounded-[inherit] ${active ? 'ring-2 ring-[var(--color-primary-500)] ring-offset-2 ring-offset-[var(--color-surface)]' : ''}`}>
		<div class="flex items-start justify-between mb-3">
			<div class="flex items-center gap-2">
				<div class="h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-clay-sm" style="background:{accentColor}">
					{week.week_number}
				</div>
				<span class="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">Week {week.week_number}</span>
			</div>
			{#if !week.ai_generated}
				<Badge variant="warning">Edited</Badge>
			{/if}
		</div>

		<h3 class="text-base font-semibold text-[var(--color-text-primary)] line-clamp-1 mb-2 font-[family-name:var(--font-heading)]">
			{week.theme || 'Week ' + week.week_number}
		</h3>

		<div class="flex items-center gap-1.5 text-xs text-[var(--color-text-tertiary)] mb-4">
			<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
			{formatWeekRange(week.week_start, week.week_end)}
		</div>

		{#if week.focus_areas.length > 0}
			<div class="flex flex-wrap gap-1.5">
				{#each week.focus_areas.slice(0, 3) as area}
					<Badge variant="primary">{area}</Badge>
				{/each}
				{#if week.focus_areas.length > 3}
					<Badge>+{week.focus_areas.length - 3}</Badge>
				{/if}
			</div>
		{:else}
			<div class="h-6"></div>
		{/if}

		<div class="mt-4 h-1 bg-[var(--color-surface-tertiary)] rounded-full overflow-hidden">
			<div class="h-full rounded-full transition-all duration-500" style="background:{accentColor}; width: {Math.min((week.week_number / 8) * 100, 100)}%"></div>
		</div>
	</button>
</Card>
