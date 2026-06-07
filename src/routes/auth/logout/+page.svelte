<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';

	onMount(async () => {
		await auth.signOut();
		goto('/');
	});
</script>

<svelte:head><title>Signing out... — Prepless AI</title></svelte:head>

<div class="min-h-[80vh] flex items-center justify-center bg-[var(--color-surface-secondary)]">
	<p class="text-sm text-[var(--color-text-secondary)]">Signing out...</p>
</div>
