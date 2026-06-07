<script lang="ts">
	import type { Resource } from '$lib/lib/types';
	import ResourceItem from './ResourceItem.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';

	let { resources, onRemove }: { resources: Resource[]; onRemove?: (id: string) => void } = $props();
</script>

{#if resources.length === 0}
	<EmptyState icon="search" title="No resources assigned" description="Search and assign learning resources to this task." />
{:else}
	<div class="space-y-2">
		<h4 class="text-sm font-semibold text-[var(--color-text-secondary)]">Assigned Resources</h4>
		{#each resources as resource}
			<ResourceItem {resource} onremove={onRemove ? () => onRemove(resource.id) : undefined} />
		{/each}
	</div>
{/if}
