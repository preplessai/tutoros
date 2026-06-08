<script lang="ts">
	import AuthCallback from '$lib/components/auth/AuthCallback.svelte';
</script>

<svelte:head><title>Signing in... — Prepless AI</title></svelte:head>

<div class="flex min-h-[80vh] items-center justify-center bg-[var(--color-surface-secondary)]">
	<AuthCallback />
</div>
