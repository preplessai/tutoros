<script lang="ts">
	import type { ResourceType } from '$lib/lib/types';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let {
		title,
		url,
		source,
		type,
		description,
		saved = false,
		onsave
	}: {
		title: string;
		url: string;
		source: string;
		type: ResourceType;
		description: string | null;
		saved?: boolean;
		onsave?: () => void;
	} = $props();

	const typeBadge: Record<string, string> = {
		video: 'primary',
		article: 'info',
		practice: 'success',
		interactive: 'warning'
	};

	let saving = $state(false);

	async function handleSave() {
		if (saving || saved) return;
		saving = true;
		onsave?.();
		saving = false;
	}
</script>

<div
	class="hover:shadow-clay-md flex flex-col gap-3 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 transition-shadow"
>
	<div class="flex items-start gap-3">
		<div class="min-w-0 flex-1">
			<a
				href={url}
				target="_blank"
				rel="noopener noreferrer"
				class="text-sm font-semibold text-[var(--color-primary-600)] no-underline hover:underline"
			>
				{title}
			</a>
			<div class="mt-1.5 flex flex-wrap items-center gap-1.5">
				<Badge variant={typeBadge[type] || 'default'}>{type}</Badge>
				<span class="text-xs text-[var(--color-text-tertiary)]">{source}</span>
			</div>
			{#if description}
				<p class="mt-2 line-clamp-2 text-xs text-[var(--color-text-secondary)]">{description}</p>
			{/if}
		</div>
		<Button
			variant={saved ? 'secondary' : 'gradient'}
			size="sm"
			onclick={handleSave}
			disabled={saved || saving}
		>
			{#if saved}
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 13l4 4L19 7"
					/></svg
				>
				Saved
			{:else if saving}
				Saving...
			{:else}
				Save to Task
			{/if}
		</Button>
	</div>
</div>
