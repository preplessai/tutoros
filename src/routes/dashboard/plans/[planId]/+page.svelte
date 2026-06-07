<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { planStore } from '$lib/stores/plan.svelte';
	import PlanTimeline from '$lib/components/plans/PlanTimeline.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';

	onMount(() => { planStore.fetchOne($page.params.planId); });
</script>

<svelte:head><title>{planStore.current?.title || 'Plan'} — Prepless AI</title></svelte:head>

{#if planStore.loading && !planStore.current}
	<div class="flex justify-center py-16"><Spinner size="lg" /></div>
{:else}
	<PlanTimeline />
{/if}
