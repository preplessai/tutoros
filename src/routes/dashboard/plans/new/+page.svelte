<script lang="ts">
	import PlanForm from '$lib/components/plans/PlanForm.svelte';
	import Card from '$lib/components/ui/Card.svelte';
</script>

<svelte:head><title>Create Plan — TutorOS</title></svelte:head>

<div>
	<h1 class="text-2xl font-bold text-[var(--color-text-primary)] mb-6">Create Weekly Plan</h1>
	<Card><PlanForm /></Card>
</div>
