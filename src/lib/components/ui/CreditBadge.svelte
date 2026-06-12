<script lang="ts">
	import { creditStore } from '$lib/stores/credits.svelte';

	let {
		compact = false
	}: {
		compact?: boolean;
	} = $props();
</script>

{#if compact}
	<button
		class="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-primary-500)]"
		title={`${creditStore.nonExpiring} non-expiring · ${creditStore.refreshing} refreshing`}
	>
		<svg
			class="h-3.5 w-3.5 text-[var(--color-primary-500)]"
			fill="currentColor"
			viewBox="0 0 24 24"
		>
			<path
				d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"
			/>
		</svg>
		<span>{creditStore.total % 1 === 0 ? creditStore.total : creditStore.total.toFixed(1)}</span>
	</button>
{:else}
	<div
		class="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-4 py-2.5"
	>
		<svg class="h-5 w-5 text-[var(--color-primary-500)]" fill="currentColor" viewBox="0 0 24 24">
			<path
				d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"
			/>
		</svg>
		<div>
			<div class="text-sm font-medium text-[var(--color-text-primary)]">
				{creditStore.total} credits
			</div>
			<div class="text-xs text-[var(--color-text-tertiary)]">
				{creditStore.nonExpiring} permanent · {creditStore.refreshing} monthly
			</div>
		</div>
	</div>
{/if}
