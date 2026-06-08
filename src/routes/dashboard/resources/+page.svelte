<script lang="ts">
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
</script>

<svelte:head><title>Resources — Prepless AI</title></svelte:head>

<div>
	<h1 class="mb-6 text-2xl font-bold text-[var(--color-text-primary)]">Resources</h1>
	<EmptyState
		icon="search"
		title="Resource Library"
		description="Resources you assign to tasks will appear here for easy access. Open a day plan and click 'Find Resources' to get started."
	/>
</div>
