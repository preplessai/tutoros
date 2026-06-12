<script lang="ts">
	import type { PlanWeek } from '$lib/lib/types';
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
</script>

<Card {onclick} hover padding={false}>
	<button
		{onclick}
		class={`w-full cursor-pointer rounded-[inherit] p-5 text-left transition-all ${active ? 'ring-2 ring-[var(--color-primary-500)] ring-offset-2 ring-offset-[var(--color-surface)]' : ''}`}
	>
		<div class="mb-3 flex items-start justify-between">
			<div class="flex items-center gap-2">
				<div
					class="shadow-clay-sm flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold text-white"
					style="background:{accentColor}"
				>
					{week.week_number}
				</div>
				<span
					class="text-xs font-semibold tracking-wider text-[var(--color-text-tertiary)] uppercase"
					>Week {week.week_number}</span
				>
			</div>
			{#if !week.ai_generated}
				<Badge variant="warning">Edited</Badge>
			{/if}
		</div>

		<h3
			class="mb-2 line-clamp-1 font-[family-name:var(--font-heading)] text-base font-semibold text-[var(--color-text-primary)]"
		>
			{week.theme || 'Week ' + week.week_number}
		</h3>

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
	</button>
</Card>