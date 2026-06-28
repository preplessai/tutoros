<script lang="ts">
	import type { PlanWeekHomework } from '$lib/lib/types';
	import { planStore } from '$lib/stores/plan.svelte';
	import { supabase } from '$lib/lib/supabase';
	import Spinner from '$lib/components/ui/Spinner.svelte';

	let homeworkByWeek = $state<Record<string, PlanWeekHomework[]>>({});
	let crossedOutWeeks = $state<Set<string>>(new Set());
	let loading = $state(true);
	let lastPlanId = $state<string | null>(null);

	$effect(() => {
		const planId = planStore.current?.id;
		if (planId && planId !== lastPlanId) {
			lastPlanId = planId;
			fetchHomework();
		}
	});

	async function fetchHomework() {
		loading = true;
		const map: Record<string, PlanWeekHomework[]> = {};
		const crossed = new Set<string>();

		for (const week of planStore.weeks) {
			const { data } = await supabase
				.from('plan_week_homework')
				.select('*')
				.eq('week_id', week.id)
				.order('sort_order');
			if (data) {
				const items = data as PlanWeekHomework[];
				map[week.id] = items;
				if (items.length > 0 && items.every((h) => h.completed)) {
					crossed.add(week.id);
				}
			}
		}
		homeworkByWeek = map;
		crossedOutWeeks = crossed;
		loading = false;
	}

	async function toggleCompleted(weekId: string, item: PlanWeekHomework) {
		const updated = !item.completed;
		await supabase.from('plan_week_homework').update({ completed: updated }).eq('id', item.id);
		homeworkByWeek[weekId] = homeworkByWeek[weekId].map((h) =>
			h.id === item.id ? { ...h, completed: updated } : h
		);
		updateCrossedState(weekId);
	}

	async function toggleCrossOut(weekId: string) {
		const items = homeworkByWeek[weekId] || [];
		const complete = !crossedOutWeeks.has(weekId);

		for (const item of items) {
			await supabase.from('plan_week_homework').update({ completed: complete }).eq('id', item.id);
		}
		homeworkByWeek[weekId] = items.map((h) => ({ ...h, completed: complete }));

		if (complete) {
			crossedOutWeeks = new Set([...crossedOutWeeks, weekId]);
		} else {
			const next = new Set(crossedOutWeeks);
			next.delete(weekId);
			crossedOutWeeks = next;
		}
	}

	function updateCrossedState(weekId: string) {
		const items = homeworkByWeek[weekId] || [];
		if (items.length > 0 && items.every((h) => h.completed)) {
			crossedOutWeeks = new Set([...crossedOutWeeks, weekId]);
		} else {
			const next = new Set(crossedOutWeeks);
			next.delete(weekId);
			crossedOutWeeks = next;
		}
	}

	const colors = [
		'var(--color-primary-500)',
		'var(--color-accent-500)',
		'var(--color-success)',
		'var(--color-primary-400)',
		'var(--color-accent-400)',
		'var(--color-warning)'
	];
</script>

<div class="space-y-4">
	{#if planStore.loading || loading}
		<div class="flex justify-center py-20"><Spinner size="lg" /></div>
	{:else if planStore.weeks.length === 0}
		<p class="py-10 text-center text-sm text-[var(--color-text-tertiary)]">No weeks yet.</p>
	{:else}
		{#each planStore.weeks as week, i (week.id)}
			{@const accent = colors[i % colors.length]}
			{@const hw = homeworkByWeek[week.id] || []}
			{@const crossed = crossedOutWeeks.has(week.id)}
			<div style="animation: fade-in-up 0.4s ease-out {i * 60}ms both" class="rounded-2xl border p-5 {crossed ? 'border-[var(--color-error)]/20 bg-[var(--color-error)]/5 opacity-50' : 'border-[var(--color-border)] bg-[var(--color-surface-elevated)]'}">
				<div class="flex items-start gap-3">
					<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white {crossed ? 'bg-[var(--color-error)]' : ''}" style={crossed ? '' : `background:${accent}`}>
						{#if crossed}
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
							</svg>
						{:else}
							{week.week_number}
						{/if}
					</div>
					<div class="min-w-0 flex-1">
						<p class="text-sm font-semibold text-[var(--color-text-primary)]" class:line-through={crossed}>
							{week.theme || `Week ${week.week_number}`}
						</p>
						{#if week.focus_areas?.length > 0}
							<p class="mt-0.5 text-xs text-[var(--color-text-secondary)]" class:line-through={crossed}>
								{week.focus_areas.join(' &middot; ')}
							</p>
						{/if}
					</div>
					<button type="button" onclick={() => toggleCrossOut(week.id)} class="shrink-0 cursor-pointer rounded-lg p-1.5 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-error-bg)] hover:text-[var(--color-error)]" aria-label="Cross out week" title="Cross out this week">
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
						</svg>
					</button>
				</div>

				<div class="mt-4 space-y-1.5 border-t border-[var(--color-border)] pt-4">
					{#if hw.length > 0}
						{#each hw as item (item.id)}
							<div class="flex items-start gap-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 py-2.5">
								<button type="button" onclick={() => toggleCompleted(week.id, item)} class="mt-0.5 shrink-0 cursor-pointer">
									{#if item.completed}
										<svg class="h-4 w-4 text-[var(--color-success)]" fill="currentColor" viewBox="0 0 24 24">
											<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
										</svg>
									{:else}
										<div class="h-4 w-4 rounded border border-[var(--color-border-strong)]"></div>
									{/if}
								</button>
								<div class="min-w-0 flex-1">
									<span class="text-sm font-medium text-[var(--color-text-primary)]" class:line-through={item.completed}>{item.title}</span>
									{#if item.description}
										<p class="mt-0.5 text-xs text-[var(--color-text-tertiary)]">{item.description}</p>
									{/if}
									{#if item.url}
										<a href={item.url} target="_blank" rel="noopener noreferrer" class="mt-1 inline-flex items-center gap-1 text-xs text-[var(--color-primary-500)] hover:underline">
											<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
											</svg>
											{item.url}
										</a>
									{/if}
								</div>
							</div>
						{/each}
					{:else}
						<p class="text-xs text-[var(--color-text-tertiary)]">No homework assigned yet.</p>
					{/if}
				</div>
			</div>
		{/each}
	{/if}
</div>
