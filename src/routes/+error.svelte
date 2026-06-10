<script lang="ts">
	import { page } from '$app/stores';
	import ErrorDisplay from '$lib/components/ui/ErrorDisplay.svelte';
	import Button from '$lib/components/ui/Button.svelte';
</script>

<svelte:head><title>{$page.status} — Prepless AI</title></svelte:head>

<ErrorDisplay
	status={$page.status}
	message={$page.error?.message || ''}
	actions={goHome}
/>

{#snippet goHome()}
	<Button variant="primary" href="/">Back to Home</Button>
	<Button variant="secondary" href="/dashboard">Dashboard</Button>
{/snippet}
