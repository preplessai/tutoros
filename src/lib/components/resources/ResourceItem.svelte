<script lang="ts">
	import type { Resource } from '$lib/lib/types';
	import Badge from '$lib/components/ui/Badge.svelte';

	let { resource, onremove }: { resource: Resource; onremove?: () => void } = $props();

	const typeBadge: Record<string, string> = {
		video: 'primary',
		article: 'info',
		practice: 'success',
		interactive: 'warning'
	};
</script>

<div class="flex items-start gap-3 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] hover:shadow-sm transition-shadow group">
	<a href={resource.url} target="_blank" rel="noopener noreferrer" class="flex-1 min-w-0 no-underline">
		<div class="flex items-center gap-2">
			<h5 class="text-sm font-medium text-[var(--color-primary-500)] text-[var(--color-primary-500)] hover:underline truncate">{resource.title}</h5>
			<Badge variant={typeBadge[resource.type] || 'default'}>{resource.type}</Badge>
		</div>
		<div class="flex items-center gap-2 mt-1 text-xs text-[var(--color-text-secondary)]">
			<span>{resource.source}</span>
		</div>
		{#if resource.description}
			<p class="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2">{resource.description}</p>
		{/if}
	</a>
	{#if onremove}
		<button onclick={onremove} class="opacity-0 group-hover:opacity-100 p-1 text-[var(--color-error)] hover:text-[var(--color-error)] transition-all cursor-pointer shrink-0" title="Remove">
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
		</button>
	{/if}
</div>
