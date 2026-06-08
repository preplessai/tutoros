<script lang="ts">
	import { planStore } from '$lib/stores/plan.svelte';
	import { supabase } from '$lib/lib/supabase';
	import { api } from '$lib/lib/api';
	import { toast } from '$lib/stores/toast.svelte';
	import type { AiGeneratedResources, Resource } from '$lib/lib/types';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';

	let { onClose }: { onClose?: () => void } = $props();

	let query = $state('');
	let searchResults = $state<AiGeneratedResources['resources']>([]);
	let searching = $state(false);
	let searched = $state(false);

	async function handleSearch() {
		if (!query.trim()) return;
		searching = true;
		searched = true;

		try {
			const plan = planStore.current;
			const result = await api.searchResources({
				query: query.trim(),
				subjects: plan?.subjects || [],
				grade: plan?.grade || '',
				preferredSites: [
					{ name: 'Khan Academy', url: 'https://www.khanacademy.org' },
					{ name: 'W3Schools', url: 'https://www.w3schools.com' },
					{ name: 'IXL', url: 'https://www.ixl.com' }
				],
				maxResults: 3
			});
			searchResults = result.resources;
		} catch (err: any) {
			toast.error('Search failed: ' + err.message);
		} finally {
			searching = false;
		}
	}
</script>

<div class="space-y-4">
	<h3 class="text-lg font-semibold text-[var(--color-text-primary)]">Search Resources</h3>
	<p class="text-sm text-[var(--color-text-secondary)]">
		AI-powered search across learning platforms for relevant practice materials.
	</p>

	<div class="flex gap-2">
		<Input
			name="resourceQuery"
			value={query}
			oninput={(e) => (query = (e.target as HTMLInputElement).value)}
			placeholder="e.g., quadratic equations practice"
		/>
		<Button variant="gradient" onclick={handleSearch} loading={searching}>Search</Button>
	</div>

	{#if searched && searchResults.length > 0}
		<div class="mt-4 space-y-2">
			{#each searchResults as resource, i}
				<div
					class="flex items-start gap-3 rounded-lg border border-[var(--color-border)] p-3 transition-shadow hover:shadow-sm"
				>
					<a
						href={resource.url}
						target="_blank"
						rel="noopener noreferrer"
						class="min-w-0 flex-1 no-underline"
					>
						<h5 class="text-sm font-medium text-[var(--color-primary-500)] hover:underline">
							{resource.title}
						</h5>
						<p class="mt-0.5 text-xs text-[var(--color-text-secondary)]">
							{resource.source} · {resource.type}
						</p>
					</a>
				</div>
			{/each}
		</div>
	{:else if searched && searchResults.length === 0}
		<p class="text-sm text-[var(--color-text-secondary)]">
			No resources found. Try a different query.
		</p>
	{/if}
</div>
