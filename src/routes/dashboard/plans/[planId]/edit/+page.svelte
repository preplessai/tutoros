<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { planStore } from '$lib/stores/plan.svelte';
	import PlanTimeline from '$lib/components/plans/PlanTimeline.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';

	onMount(() => {
		planStore.fetchOne($page.params.planId);
	});
</script>

<svelte:head><title>Edit Plan — Prepless AI</title></svelte:head>

<div>
	<div class="mb-6 flex items-center gap-4">
		<Button variant="ghost" size="sm" href={`/dashboard/plans/${$page.params.planId}`}
			>← Back to Plan</Button
		>
	</div>
	<h1 class="mb-2 text-2xl font-bold text-[var(--color-text-primary)]">Edit Plan</h1>
	<p class="mb-6 text-sm text-[var(--color-text-secondary)]">
		Click on any week to edit its details. Changes are saved automatically.
	</p>

	{#if planStore.loading}
		<div class="flex justify-center py-12"><Spinner size="lg" /></div>
	{:else}
		<PlanTimeline />
	{/if}
</div>
