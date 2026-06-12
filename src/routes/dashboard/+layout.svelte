<script lang="ts">
	import DashboardLayout from '$lib/components/layout/DashboardLayout.svelte';
	import AuthGuard from '$lib/components/layout/AuthGuard.svelte';
	let { children } = $props();
</script>

<AuthGuard>
	<DashboardLayout>
		{@render children?.()}
	</DashboardLayout>
</AuthGuard>
