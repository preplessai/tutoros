<script lang="ts">
	import Sidebar from './Sidebar.svelte';
	import DowngradeBanner from '$lib/components/subscription/DowngradeBanner.svelte';

	let { children } = $props();
</script>

<div class="relative flex">
	<Sidebar />
	<main class="relative min-h-[calc(100vh-4rem)] min-w-0 flex-1 bg-[var(--color-surface)]">
		<!-- Subtle decorative blobs -->
		<div
			class="pointer-events-none fixed top-1/3 -right-40 h-[400px] w-[400px] rounded-full bg-[var(--color-primary-50)]/20 blur-3xl"
		></div>
		<div
			class="pointer-events-none fixed bottom-0 left-1/3 h-[300px] w-[300px] rounded-full bg-[var(--color-accent-100)]/10 blur-3xl"
		></div>

		<DowngradeBanner />
		<div class="relative p-6 lg:p-8">
			{@render children?.()}
		</div>
	</main>
</div>
