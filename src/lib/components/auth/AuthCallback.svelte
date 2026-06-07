<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/lib/supabase';
	import { toast } from '$lib/stores/toast.svelte';
	import { goto } from '$app/navigation';

	let { onComplete }: { onComplete?: () => void } = $props();

	onMount(async () => {
		// Handle OAuth callback — supabase-js auto-detects hash
		const { data, error } = await supabase.auth.getSession();

		if (error) {
			toast.error('Authentication failed. Please try again.');
			goto('/auth/login');
			return;
		}

		if (data.session) {
			toast.success('Signed in successfully');
			onComplete?.();
			goto('/dashboard');
		}
	});
</script>

<div class="flex flex-col items-center justify-center gap-4">
	<svg class="animate-spin h-8 w-8 text-[var(--color-primary-500)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
		<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
		<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
	</svg>
	<p class="text-sm text-[var(--color-text-secondary)]">Completing sign in...</p>
</div>
