<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';

	let { children } = $props();

	onMount(() => {
		if (!auth.loading && !auth.isAuthenticated) {
			goto('/auth/login');
		}
	});
</script>

{#if auth.loading}
	<div class="flex items-center justify-center min-h-[60vh]">
		<Spinner size="lg" />
	</div>
{:else if auth.isAuthenticated}
	{@render children?.()}
{/if}
