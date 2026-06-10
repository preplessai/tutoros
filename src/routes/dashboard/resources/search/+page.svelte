<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { api } from '$lib/lib/api';
	import { resourceStore } from '$lib/stores/resource.svelte';
	import { dayPlanStore } from '$lib/stores/dayPlan.svelte';
	import { creditStore } from '$lib/stores/credits.svelte';
	import { RESOURCE_SITES } from '$lib/lib/constants';
	import type { AiGeneratedResources, PlanTask } from '$lib/lib/types';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import SearchResultCard from '$lib/components/resources/SearchResultCard.svelte';
	import { toast } from '$lib/stores/toast.svelte';

	// URL params
	let dayPlanId = $state('');
	let initialTaskId = $state('');
	let dayTitle = $state('');

	// Search state
	let query = $state('');
	let preferredSites = $state<{ name: string; url: string; enabled: boolean }[]>(
		RESOURCE_SITES.map((s) => ({ ...s, enabled: true }))
	);
	let searchResults = $state<AiGeneratedResources['resources']>([]);
	let savedUrls = $state<Set<string>>(new Set());
	let searching = $state(false);
	let searched = $state(false);

	// Task selection
	let tasks = $state<PlanTask[]>([]);
	let selectedTaskId = $state('');

	$effect(() => {
		dayPlanId = $page.url.searchParams.get('dayPlanId') || '';
		initialTaskId = $page.url.searchParams.get('taskId') || '';
		selectedTaskId = initialTaskId;
		const q = $page.url.searchParams.get('query');
		if (q) query = q;
	});

	onMount(async () => {
		if (dayPlanId) {
			await dayPlanStore.fetchDay(dayPlanId);
			tasks = dayPlanStore.tasks;
			if (dayPlanStore.currentDay) {
				dayTitle = new Date(dayPlanStore.currentDay.date + 'T00:00:00').toLocaleDateString(
					'en-US',
					{ month: 'long', day: 'numeric', year: 'numeric' }
				);
			}
		}

		// Auto-search if query param present
		if (query.trim()) {
			handleSearch();
		}
	});

	async function handleSearch() {
		if (!query.trim()) return;
		searching = true;
		searched = true;

		try {
			// Credit check — 0.1 per search
			if (!creditStore.hasEnough(0.1)) {
				toast.error('Insufficient credits. Upgrade your plan or purchase more credits.');
				searching = false;
				return;
			}

			const enabledSites = preferredSites.filter((s) => s.enabled);
			const result = await api.searchResources({
				query: query.trim(),
				subjects: [],
				grade: '',
				preferredSites:
					enabledSites.length > 0
						? enabledSites.map((s) => ({ name: s.name, url: s.url }))
						: RESOURCE_SITES.map((s) => ({ name: s.name, url: s.url })),
				maxResults: 8
			});
			searchResults = result.resources;
			// Deduct 0.1 credits on successful search
			await creditStore.useCredits(0.1, 'resource_search');
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Unknown error';
			toast.error('Search failed: ' + message);
		} finally {
			searching = false;
		}
	}

	async function handleSave(resource: (typeof searchResults)[0]) {
		if (!selectedTaskId) {
			toast.error('Select a task first');
			return;
		}

		const saved = await resourceStore.save(selectedTaskId, {
			title: resource.title,
			url: resource.url,
			source: resource.source,
			type: resource.type,
			description: resource.description
		});

		if (saved) {
			savedUrls = new Set([...savedUrls, resource.url]);
		}
	}

	function toggleSite(index: number) {
		preferredSites = preferredSites.map((s, i) =>
			i === index ? { ...s, enabled: !s.enabled } : s
		);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleSearch();
	}
</script>

<svelte:head><title>Search Resources — Prepless AI</title></svelte:head>

<div class="mx-auto max-w-5xl space-y-6">
	<!-- Header -->
	<div>
		{#if dayPlanId}
			<a
				href={`/dashboard/day-plans/${dayPlanId}`}
				class="mb-2 inline-flex items-center gap-1 text-sm text-[var(--color-text-tertiary)] no-underline transition-colors hover:text-[var(--color-text-primary)]"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/></svg
				>
				Back to {dayTitle || 'Day Plan'}
			</a>
		{/if}
		<h1
			class="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-text-primary)]"
		>
			Find Resources
		</h1>
		<p class="mt-1 text-sm text-[var(--color-text-secondary)]">
			Search across learning platforms for real resources to assign to tasks.
		</p>
	</div>

	<!-- Search Form -->
	<Card>
		<div class="space-y-4">
			<div class="flex gap-3">
				<div class="flex-1">
					<Input
						name="searchQuery"
						value={query}
						oninput={(e) => (query = (e.target as HTMLInputElement).value)}
						onkeydown={handleKeydown}
						placeholder="e.g., quadratic equations, photosynthesis, subject-verb agreement..."
					/>
				</div>
				<Button variant="gradient" onclick={handleSearch} loading={searching} size="lg">
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/></svg
					>
					Search
				</Button>
			</div>

			<!-- Preferred site chips -->
			<div>
				<span
					class="mb-2 block text-xs font-semibold tracking-wider text-[var(--color-text-tertiary)] uppercase"
					>Search Sites</span
				>
				<div class="flex flex-wrap gap-2">
					{#each preferredSites as site, i (site.name)}
						<button
							onclick={() => toggleSite(i)}
							class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-2 px-3 py-1 text-xs font-medium transition-all {site.enabled
								? 'border-[var(--color-primary-400)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)]'
								: 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-tertiary)] opacity-60'}"
						>
							{site.name}
							{#if site.enabled}
								<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="3"
										d="M5 13l4 4L19 7"
									/></svg
								>
							{/if}
						</button>
					{/each}
				</div>
			</div>

			<!-- Task selector -->
			{#if tasks.length > 0}
				<div class="max-w-xs">
					<Select
						label="Save resources to task"
						name="taskSelector"
						value={selectedTaskId}
						onchange={(e) => (selectedTaskId = (e.target as HTMLSelectElement).value)}
						options={[
							{ value: '', label: 'Select a task...' },
							...tasks.map((t) => ({
								value: t.id,
								label: `${t.title} (${t.duration_minutes}min)`
							}))
						]}
					/>
				</div>
			{/if}
		</div>
	</Card>

	<!-- Results -->
	{#if searching}
		<div class="flex justify-center py-12"><Spinner size="lg" /></div>
	{:else if searched && searchResults.length > 0}
		<div class="space-y-3">
			<h2 class="text-lg font-semibold text-[var(--color-text-primary)]">
				{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
			</h2>
			<div class="space-y-3">
				{#each searchResults as resource (resource.url)}
					<SearchResultCard
						title={resource.title}
						url={resource.url}
						source={resource.source}
						type={resource.type}
						description={resource.description}
						saved={savedUrls.has(resource.url)}
						onsave={() => handleSave(resource)}
					/>
				{/each}
			</div>
		</div>
	{:else if searched}
		<EmptyState
			icon="search"
			title="No resources found"
			description="Try a different query or disable site filters for broader results."
		/>
	{/if}
</div>
