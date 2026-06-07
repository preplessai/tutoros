<script lang="ts">
	import Sidebar from './Sidebar.svelte';
	let { children } = $props();
</script>

<div class="flex relative">
	<Sidebar />
	<main class="flex-1 min-h-[calc(100vh-4rem)] bg-[var(--color-surface)] relative">
		<!-- Subtle decorative blobs -->
		<div class="fixed top-1/3 -right-40 w-[400px] h-[400px] rounded-full bg-[var(--color-primary-50)]/20 blur-3xl pointer-events-none"></div>
		<div class="fixed bottom-0 left-1/3 w-[300px] h-[300px] rounded-full bg-[var(--color-accent-100)]/10 blur-3xl pointer-events-none"></div>

		<div class="p-6 lg:p-8 relative">
			{@render children?.()}
		</div>
	</main>
</div>
