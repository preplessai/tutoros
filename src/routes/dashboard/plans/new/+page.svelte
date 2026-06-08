<script lang="ts">
	import PlanForm from '$lib/components/plans/PlanForm.svelte';
	import Card from '$lib/components/ui/Card.svelte';
</script>

<svelte:head><title>Create Plan — Prepless AI</title></svelte:head>

<div>
	<h1 class="mb-6 text-2xl font-bold text-[var(--color-text-primary)]">Create Weekly Plan</h1>
	<Card><PlanForm /></Card>
</div>
