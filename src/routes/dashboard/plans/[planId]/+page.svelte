<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { planStore } from '$lib/stores/plan.svelte';
	import { supabase } from '$lib/lib/supabase';
	import PlanTimeline from '$lib/components/plans/PlanTimeline.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';

	let allPlans = $state<Array<{ id: string; title: string; grade: string; subjects: string[] }>>(
		[]
	);

	onMount(async () => {
		planStore.fetchOne($page.params.planId);

		// Fetch all plans for the dropdown
		const { data } = await supabase
			.from('weekly_plans')
			.select('id, title, grade, subjects')
			.order('created_at', { ascending: false });
		if (data) allPlans = data;
	});

	function switchPlan(e: Event) {
		const planId = (e.target as HTMLSelectElement).value;
		if (planId) goto(`/dashboard/plans/${planId}`);
	}
</script>

<svelte:head><title>{planStore.current?.title || 'Plan'} — Prepless AI</title></svelte:head>

<div class="space-y-6">
	{#if allPlans.length > 1}
		<div class="flex flex-wrap items-center gap-3">
			<label for="plan-select" class="text-sm font-medium text-[var(--color-text-secondary)]"
				>Plan:</label
			>
			<select
				id="plan-select"
				class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-1.5 text-sm text-[var(--color-text-primary)]"
				value={$page.params.planId}
				onchange={switchPlan}
			>
				{#each allPlans as plan}
					<option value={plan.id}>{plan.title} — {plan.grade} • {plan.subjects.join(', ')}</option>
				{/each}
			</select>
		</div>
	{/if}

	{#if planStore.loading && !planStore.current}
		<div class="flex justify-center py-16"><Spinner size="lg" /></div>
	{:else}
		<PlanTimeline />
	{/if}
</div>
