<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		goto('/dashboard');
	});
</script>

<p class="py-10 text-center text-sm text-[var(--color-text-tertiary)]">
	Learning plans are created automatically during student onboarding.
</p>
