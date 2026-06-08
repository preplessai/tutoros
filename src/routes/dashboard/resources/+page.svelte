<script lang="ts">
	import { onMount } from 'svelte';
	import { resourceStore } from '$lib/stores/resource.svelte';
	import { supabase } from '$lib/lib/supabase';
	import type { Resource } from '$lib/lib/types';
	import { formatDateShort } from '$lib/lib/date';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';

	interface ResourceWithContext extends Resource {
		task_title?: string;
		day_date?: string;
		day_id?: string;
	}

	let resources = $state<ResourceWithContext[]>([]);
	let loading = $state(true);

	onMount(async () => {
		const { data } = await supabase
			.from('resources')
			.select('*, plan_tasks!inner(title, day_id, plan_days!inner(date))')
			.order('created_at', { ascending: false });

		if (data) {
			resources = (data as Record<string, unknown>[]).map((r) => ({
				...r,
				task_title: (r.plan_tasks as Record<string, unknown>)?.title as string,
				day_date: ((r.plan_tasks as Record<string, unknown>)?.plan_days as Record<string, unknown>)
					?.date as string,
				day_id: (r.plan_tasks as Record<string, unknown>)?.day_id as string
			})) as ResourceWithContext[];
		}
		loading = false;
	});

	async function handleRemove(id: string) {
		await resourceStore.remove(id);
		resources = resources.filter((r) => r.id !== id);
	}

	const typeBadge: Record<string, string> = {
		video: 'primary',
		article: 'info',
		practice: 'success',
		interactive: 'warning'
	};
</script>

<svelte:head><title>Resources — Prepless AI</title></svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-[var(--color-text-primary)]">Resource Library</h1>
		<p class="mt-1 text-sm text-[var(--color-text-secondary)]">
			All resources you've saved across day plans.
		</p>
	</div>

	{#if loading}
		<div class="flex justify-center py-12"><Spinner size="lg" /></div>
	{:else if resources.length === 0}
		<EmptyState
			icon="search"
			title="No resources saved"
			description="Open a day plan and click 'Find Resources' to search and save learning materials."
		/>
	{:else}
		<div class="space-y-3">
			{#each resources as resource (resource.id)}
				<div
					class="hover:shadow-clay-md flex items-start gap-4 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 transition-shadow"
				>
					<div class="min-w-0 flex-1">
						<a
							href={resource.url}
							target="_blank"
							rel="noopener noreferrer"
							class="text-sm font-semibold text-[var(--color-primary-600)] no-underline hover:underline"
						>
							{resource.title}
						</a>
						<div class="mt-1.5 flex flex-wrap items-center gap-1.5">
							<Badge variant={typeBadge[resource.type] || 'default'}>{resource.type}</Badge>
							<span class="text-xs text-[var(--color-text-tertiary)]">{resource.source}</span>
						</div>
						{#if resource.description}
							<p class="mt-2 line-clamp-2 text-xs text-[var(--color-text-secondary)]">
								{resource.description}
							</p>
						{/if}
						<div
							class="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-tertiary)]"
						>
							{#if resource.task_title}
								<span>Task: {resource.task_title}</span>
							{/if}
							{#if resource.day_date}
								<span>· {formatDateShort(resource.day_date)}</span>
							{/if}
							{#if resource.day_id}
								<a
									href={`/dashboard/day-plans/${resource.day_id}`}
									class="text-[var(--color-primary-500)] no-underline hover:underline"
								>
									View Day Plan →
								</a>
							{/if}
						</div>
					</div>
					<button
						onclick={() => handleRemove(resource.id)}
						aria-label="Remove resource"
						class="shrink-0 cursor-pointer rounded-lg p-2 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-error-bg)] hover:text-[var(--color-error)]"
					>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							/></svg
						>
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>
