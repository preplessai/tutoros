<script lang="ts">
	import type { PlanTask, Student, ResourceType } from '$lib/lib/types';
	import { onMount } from 'svelte';
	import { api } from '$lib/lib/api';
	import { resourceStore } from '$lib/stores/resource.svelte';
	import { creditStore } from '$lib/stores/credits.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';

	let {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		dayId = '',
		tasks = [] as PlanTask[],
		student,
		open = false,
		onclose
	}: {
		dayId: string; // eslint-disable-line svelte/no-unused-props
		tasks: PlanTask[];
		student: Student | null;
		open: boolean;
		onclose?: () => void;
	} = $props();

	interface RecommendedResource {
		taskId: string;
		title: string;
		url: string;
		source: string;
		type: ResourceType;
		description: string;
		relevance: string;
	}

	let loading = $state(false);
	let error = $state<string | null>(null);
	let resources = $state<RecommendedResource[]>([]);
	let saving = $state<Set<string>>(new Set());
	let savingAll = $state(false);

	onMount(async () => {
		await creditStore.fetch();
		if (open) {
			await fetchRecommendations();
		}
	});

	async function fetchRecommendations() {
		if (!student) return;
		if (loading) return;

		// Credit check
		if (!(await creditStore.hasEnoughAfterFetch(0.5))) {
			toast.error('Insufficient credits. Upgrade your plan or purchase more credits.');
			onclose?.();
			return;
		}

		// Deduct credits BEFORE calling the AI API
		const ok = await creditStore.useCredits(0.5, 'ai_pick_resources');
		if (!ok) {
			toast.error('Insufficient credits. Upgrade your plan or purchase more credits.');
			onclose?.();
			return;
		}

		loading = true;
		error = null;
		resources = [];

		try {
			const result = await api.pickResources({
				tasks: tasks.map((t) => ({
					id: t.id,
					title: t.title,
					description: t.description,
					section: t.section
				})),
				studentContext: {
					grade: student.grade,
					subjects: student.subjects,
					preferredSites: (student.preferred_resource_sites?.filter((s) => s.enabled) || []).map(
						(s) => ({ name: s.name, url: s.url })
					)
				}
			});

			resources = result.resources as RecommendedResource[];
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Failed to get AI recommendations';
			error = message;
			toast.error(message);
		} finally {
			loading = false;
		}
	}

	async function saveResource(r: RecommendedResource) {
		if (saving.has(r.taskId + r.url)) return;

		saving = new Set(saving).add(r.taskId + r.url);
		try {
			await resourceStore.save(r.taskId, {
				title: r.title,
				url: r.url,
				source: r.source,
				type: r.type,
				description: r.description
			});
			toast.success('Resource saved');
		} catch {
			// toast handled in store
		} finally {
			const next = new Set(saving);
			next.delete(r.taskId + r.url);
			saving = next;
		}
	}

	async function saveAll() {
		savingAll = true;
		for (const r of resources) {
			await saveResource(r);
		}
		savingAll = false;
		toast.success('All resources saved');
	}

	function getTypeLabel(type: ResourceType): string {
		const labels: Record<ResourceType, string> = {
			video: 'Video',
			article: 'Article',
			practice: 'Practice',
			interactive: 'Interactive'
		};
		return labels[type] || type;
	}

	function getTypeVariant(type: ResourceType): string {
		const variants: Record<ResourceType, string> = {
			video: 'info',
			article: 'default',
			practice: 'success',
			interactive: 'warning'
		};
		return variants[type] || 'default';
	}
</script>

<Modal
	{open}
	{onclose}
	title="AI Recommended Resources"
	description="AI-curated educational resources for each task"
	size="xl"
>
	{#if loading}
		<div class="flex flex-col items-center justify-center py-12">
			<Spinner size="lg" />
			<p class="mt-4 text-sm text-[var(--color-text-secondary)]">
				Analyzing tasks and finding the best resources...
			</p>
		</div>
	{:else if error}
		<div class="flex flex-col items-center justify-center py-12">
			<svg
				class="h-12 w-12 text-[var(--color-error)]"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
				/></svg
			>
			<p class="mt-4 text-sm text-[var(--color-text-secondary)]">{error}</p>
			<Button variant="secondary" size="sm" onclick={fetchRecommendations} class="mt-4">
				Try Again
			</Button>
		</div>
	{:else if resources.length === 0}
		<div class="flex flex-col items-center justify-center py-12">
			<svg
				class="h-12 w-12 text-[var(--color-text-tertiary)]"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
				/></svg
			>
			<p class="mt-4 text-sm text-[var(--color-text-secondary)]">No resources found.</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#if resources.length > 0}
				<div class="flex justify-end">
					<Button variant="primary" size="sm" onclick={saveAll} loading={savingAll}>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
							/></svg
						>
						Save All
					</Button>
				</div>
			{/if}

			{#each tasks as task (task.id)}
				{@const taskResources = resources.filter((r) => r.taskId === task.id)}
				{#if taskResources.length > 0}
					<div
						class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4"
					>
						<h4 class="mb-3 font-medium text-[var(--color-text-primary)]">{task.title}</h4>
						<div class="space-y-3">
							{#each taskResources as r (r.url)}
								<div
									class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-3"
								>
									<div class="flex items-start justify-between gap-3">
										<div class="min-w-0 flex-1">
											<a
												href={r.url}
												target="_blank"
												rel="noopener noreferrer"
												class="text-sm font-medium break-words text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] hover:underline"
											>
												{r.title}
											</a>
											<div class="mt-1.5 flex flex-wrap gap-1.5">
												<Badge variant="default">{r.source}</Badge>
												<Badge variant={getTypeVariant(r.type)}>{getTypeLabel(r.type)}</Badge>
											</div>
											<p class="mt-1.5 text-xs text-[var(--color-text-secondary)]">
												{r.description}
											</p>
											<p class="mt-1 text-xs text-[var(--color-text-tertiary)] italic">
												{r.relevance}
											</p>
										</div>
										<Button
											variant="outline"
											size="sm"
											onclick={() => saveResource(r)}
											loading={saving.has(r.taskId + r.url)}
										>
											Save
										</Button>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</Modal>
