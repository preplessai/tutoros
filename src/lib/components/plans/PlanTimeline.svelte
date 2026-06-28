<script lang="ts">
	import type { PlanWeek, PlanWeekHomework } from '$lib/lib/types';
	import { planStore } from '$lib/stores/plan.svelte';
	import { supabase } from '$lib/lib/supabase';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import WeekPopup from '$lib/components/plans/WeekPopup.svelte';

	let homeworkByWeek = $state<Record<string, PlanWeekHomework[]>>({});
	let loading = $state(true);
	let lastPlanId = $state<string | null>(null);

	let activeWeek = $state<PlanWeek | null>(null);
	let popupOpen = $state(false);
	let popupOpenedAt = $state(0);

	function openPopup(week: PlanWeek) {
		activeWeek = week;
		popupOpen = true;
		popupOpenedAt = Date.now();
	}

	function closePopup() {
		const elapsed = Date.now() - popupOpenedAt;
		if (elapsed < 300) return;
		popupOpen = false;
		activeWeek = null;
	}

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

		for (const week of planStore.weeks) {
			const { data } = await supabase
				.from('plan_week_homework')
				.select('*')
				.eq('week_id', week.id)
				.order('sort_order');
			if (data) map[week.id] = data as PlanWeekHomework[];
		}
		homeworkByWeek = map;
		loading = false;
	}

	async function toggleCompleted(weekId: string, item: PlanWeekHomework) {
		const updated = !item.completed;
		await supabase.from('plan_week_homework').update({ completed: updated }).eq('id', item.id);
		homeworkByWeek[weekId] = homeworkByWeek[weekId].map((h) =>
			h.id === item.id ? { ...h, completed: updated } : h
		);
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
			<div style="animation: fade-in-up 0.4s ease-out {i * 60}ms both">
				<button
					type="button"
					onclick={() => openPopup(week)}
					class="w-full cursor-pointer rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5 text-left transition-all hover:border-[var(--color-border-strong)] hover:shadow-md"
				>
					<div class="flex items-center gap-3">
						<div
							class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
							style="background:{accent}"
						>
							{week.week_number}
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-sm font-semibold text-[var(--color-text-primary)]">
								{week.theme || `Week ${week.week_number}`}
							</p>
							{#if week.focus_areas?.length > 0}
								<p class="mt-0.5 text-xs text-[var(--color-text-secondary)]">
									{week.focus_areas.join(' &middot; ')}
								</p>
							{/if}
						</div>
						<svg
							class="h-5 w-5 shrink-0 text-[var(--color-text-tertiary)]"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5l7 7-7 7"
							/>
						</svg>
					</div>

					<!-- Homework -->
					{#if homeworkByWeek[week.id]?.length > 0}
						<div class="mt-4 space-y-1.5 border-t border-[var(--color-border)] pt-4">
							{#each homeworkByWeek[week.id] as hw (hw.id)}
								<div
									class="flex items-start gap-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 py-2.5"
									onclick={(e: MouseEvent) => e.stopPropagation()}
									onkeydown={(e: KeyboardEvent) => e.stopPropagation()}
								>
									<button
										type="button"
										onclick={() => toggleCompleted(week.id, hw)}
										class="mt-0.5 shrink-0 cursor-pointer"
									>
										{#if hw.completed}
											<svg
												class="h-4 w-4 text-[var(--color-success)]"
												fill="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
												/>
											</svg>
										{:else}
											<div class="h-4 w-4 rounded border border-[var(--color-border-strong)]"></div>
										{/if}
									</button>
									<div class="min-w-0 flex-1">
										<span
											class="text-sm font-medium text-[var(--color-text-primary)]"
											class:line-through={hw.completed}
										>
											{hw.title}
										</span>
										{#if hw.description}
											<p class="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
												{hw.description}
											</p>
										{/if}
										{#if hw.url}
											<a
												href={hw.url}
												target="_blank"
												rel="noopener noreferrer"
												class="mt-1 inline-flex items-center gap-1 text-xs text-[var(--color-primary-500)] hover:underline"
												onclick={(e: MouseEvent) => e.stopPropagation()}
											>
												<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
													/>
												</svg>
												{hw.url}
											</a>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<p class="mt-3 text-xs text-[var(--color-text-tertiary)]">No homework assigned.</p>
					{/if}
				</button>
			</div>
		{/each}
	{/if}
</div>

<WeekPopup open={popupOpen} onclose={closePopup} week={activeWeek} />
