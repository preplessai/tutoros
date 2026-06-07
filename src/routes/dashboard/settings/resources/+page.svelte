<script lang="ts">
	import { RESOURCE_SITES } from '$lib/lib/constants';
	import Toggle from '$lib/components/ui/Toggle.svelte';
	import Card from '$lib/components/ui/Card.svelte';
</script>

<svelte:head><title>Resource Sites — TutorOS</title></svelte:head>

<div class="space-y-6 max-w-2xl">
	<div>
		<h1 class="text-2xl font-bold text-[var(--color-text-primary)]">Resource Sites</h1>
		<p class="mt-1 text-sm text-[var(--color-text-secondary)]">Choose which learning platforms the AI can search. These are defaults for new students.</p>
	</div>

	<Card>
		<div class="space-y-3">
			{#each RESOURCE_SITES as site}
				<div class="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)]">
					<div>
						<p class="text-sm font-medium text-[var(--color-text-secondary)]">{site.name}</p>
						<p class="text-xs text-[var(--color-text-tertiary)]">{site.url}</p>
					</div>
					<Toggle checked={true} label="Enabled" />
				</div>
			{/each}
		</div>
	</Card>
</div>
