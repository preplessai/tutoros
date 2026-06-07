<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { planStore } from '$lib/stores/plan.svelte';
	import PlanTimeline from '$lib/components/plans/PlanTimeline.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';

	onMount(() => { planStore.fetchOne($page.params.planId); });
</script>

<svelte:head><title>Edit Plan — TutorOS</title></svelte:head>

<div>
	<div class="flex items-center gap-4 mb-6">
		<Button variant="ghost" size="sm" href={`/dashboard/plans/${$page.params.planId}`}>← Back to Plan</Button>
	</div>
	<h1 class="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Edit Plan</h1>
	<p class="text-sm text-[var(--color-text-secondary)] mb-6">Click on any week to edit its details. Changes are saved automatically.</p>

	{#if planStore.loading}
		<div class="flex justify-center py-12"><Spinner size="lg" /></div>
	{:else}
		<PlanTimeline />
	{/if}
</div>
