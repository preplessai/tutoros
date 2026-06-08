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

<div
	class="group flex items-start gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3 transition-shadow hover:shadow-sm"
>
	<a
		href={resource.url}
		target="_blank"
		rel="noopener noreferrer"
		class="min-w-0 flex-1 no-underline"
	>
		<div class="flex items-center gap-2">
			<h5 class="truncate text-sm font-medium text-[var(--color-primary-500)] hover:underline">
				{resource.title}
			</h5>
			<Badge variant={typeBadge[resource.type] || 'default'}>{resource.type}</Badge>
		</div>
		<div class="mt-1 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
			<span>{resource.source}</span>
		</div>
		{#if resource.description}
			<p class="mt-1 line-clamp-2 text-xs text-[var(--color-text-secondary)]">
				{resource.description}
			</p>
		{/if}
	</a>
	{#if onremove}
		<button
			onclick={onremove}
			class="shrink-0 cursor-pointer p-1 text-[var(--color-error)] opacity-0 transition-all group-hover:opacity-100 hover:text-[var(--color-error)]"
			title="Remove"
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
				><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12"
				/></svg
			>
		</button>
	{/if}
</div>
