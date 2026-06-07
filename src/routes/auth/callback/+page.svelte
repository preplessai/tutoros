<script lang="ts">
	import AuthCallback from '$lib/components/auth/AuthCallback.svelte';
</script>

<svelte:head><title>Signing in... — TutorOS</title></svelte:head>

<div class="min-h-[80vh] flex items-center justify-center bg-[var(--color-surface-secondary)]">
	<AuthCallback />
</div>
