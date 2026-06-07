<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { planStore } from '$lib/stores/plan.svelte';
	import AdjustPlanForm from '$lib/components/plans/AdjustPlanForm.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	onMount(() => { planStore.fetchOne($page.params.planId); });
</script>

<svelte:head><title>Adjust Plan — Prepless AI</title></svelte:head>

<div>
	<div class="flex items-center gap-4 mb-6">
		<Button variant="ghost" size="sm" href={`/dashboard/plans/${$page.params.planId}`}>← Back to Plan</Button>
	</div>
	<h1 class="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Adjust Plan</h1>
	<p class="text-sm text-[var(--color-text-secondary)] mb-6">Make changes and let AI regenerate the schedule.</p>

	{#if planStore.loading && !planStore.current}
		<div class="flex justify-center py-12"><Spinner size="lg" /></div>
	{:else}
		<Card><AdjustPlanForm /></Card>
	{/if}
</div>
