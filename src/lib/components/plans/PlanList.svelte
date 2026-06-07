<script lang="ts">
	import { onMount } from 'svelte';
	import { planStore } from '$lib/stores/plan.svelte';
	import { goto } from '$app/navigation';
	import PlanCard from './PlanCard.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';

	onMount(() => { planStore.fetchAll(); });
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-[var(--color-text-primary)]">Weekly Plans</h1>
			<p class="mt-1 text-sm text-[var(--color-text-secondary)]">{planStore.plans.length} plan{planStore.plans.length !== 1 ? 's' : ''}</p>
		</div>
		<Button variant="gradient" href="/dashboard/plans/new">Create Plan</Button>
	</div>

	{#if planStore.loading}
		<div class="flex justify-center py-12"><Spinner size="lg" /></div>
	{:else if planStore.plans.length === 0}
		<EmptyState
			icon="calendar"
			title="No plans yet"
			description="Create your first AI-powered weekly plan to get started."
			action={{ label: 'Create Plan', onclick: () => goto('/dashboard/plans/new') }}
		/>
	{:else}
		<div class="space-y-3">
			{#each planStore.plans as plan}
				<PlanCard {plan} onclick={() => goto(`/dashboard/plans/${plan.id}`)} />
			{/each}
		</div>
	{/if}
</div>
