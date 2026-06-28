<script lang="ts">
	import type { PlanDay, PlanTask, Resource } from '$lib/lib/types';
	import type { PlanWeek } from '$lib/lib/types';
	import { supabase } from '$lib/lib/supabase';
	import { toast } from '$lib/stores/toast.svelte';

	let {
		sessionNumber,
		day,
		week,
		onupdate
	}: {
		sessionNumber: number;
		day: PlanDay;
		week: PlanWeek;
		onupdate?: () => void;
	} = $props();

	let tasks = $state<PlanTask[]>([]);
	let resources = $state<Resource[]>([]);
	let loaded = $state(false);
	let expanded = $state(false);
	let completed = $state(day.completed);

	$effect(() => {
		completed = day.completed;
	});

	function toggleExpanded() {
		expanded = !expanded;
		if (!loaded) loadTasks();
	}

	async function loadTasks() {
		if (loaded) return;
		const { data: taskData } = await supabase
			.from('plan_tasks')
			.select('*')
			.eq('day_id', day.id)
			.order('sort_order');

		if (taskData) {
			tasks = taskData as PlanTask[];
			const taskIds = tasks.map((t) => t.id);
			if (taskIds.length > 0) {
				const { data: resData } = await supabase
					.from('resources')
					.select('*')
					.in('task_id', taskIds);
				if (resData) resources = resData as Resource[];
			}
		}
		loaded = true;
	}

	async function toggleSessionCompleted(e: MouseEvent) {
		e.stopPropagation();
		const newVal = !completed;
		await supabase.from('plan_days').update({ completed: newVal }).eq('id', day.id);
		completed = newVal;
		onupdate?.();
	}

	async function toggleTaskCompleted(task: PlanTask) {
		const newVal = !task.completed;
		await supabase.from('plan_tasks').update({ completed: newVal }).eq('id', task.id);
		task.completed = newVal;
	}

	async function handleAddResource(taskId: string) {
		const url = prompt('Resource URL:');
		if (!url?.trim()) return;
		const title = prompt('Resource title:');
		if (!title?.trim()) return;

		const { data } = await supabase
			.from('resources')
			.insert({
				task_id: taskId,
				title: title.trim(),
				url: url.trim(),
				ai_generated: false
			})
			.select()
			.single();
		if (data) resources = [...resources, data as Resource];
		toast.success('Resource added');
	}

	async function handleDeleteResource(resId: string) {
		await supabase.from('resources').delete().eq('id', resId);
		resources = resources.filter((r) => r.id !== resId);
	}

	const resourcesByTask = $derived(
		resources.reduce(
			(acc, r) => {
				if (!acc[r.task_id]) acc[r.task_id] = [];
				acc[r.task_id].push(r);
				return acc;
			},
			{} as Record<string, Resource[]>
		)
	);
</script>

<div
	onclick={toggleExpanded}
	onkeydown={(e: KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') toggleExpanded();
	}}
	role="button"
	tabindex="0"
	class="cursor-pointer rounded-2xl border p-4 text-left transition-all hover:border-[var(--color-border-strong)] {completed
		? 'border-[var(--color-error)]/20 bg-[var(--color-error)]/5 opacity-50'
		: 'border-[var(--color-border)] bg-[var(--color-surface-elevated)]'}"
>
	<div class="flex items-start gap-3">
		<!-- Session number -->
		<div
			class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
			class:bg-gradient-to-br={!completed}
			class:from-[var(--color-primary-500)]={!completed}
			class:to-[var(--color-accent-500)]={!completed}
			class:bg-[var(--color-error)]={completed}
		>
			{#if completed}
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2.5"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			{:else}
				{sessionNumber}
			{/if}
		</div>

		<!-- Info -->
		<div class="min-w-0 flex-1">
			<p
				class="text-sm font-semibold text-[var(--color-text-primary)]"
				class:line-through={completed}
			>
				Session {sessionNumber} — {week.theme || `Week ${week.week_number}`}
			</p>
			{#if week.focus_areas?.length > 0}
				<p class="mt-1 text-xs text-[var(--color-text-secondary)]" class:line-through={completed}>
					{week.focus_areas.join(', ')}
				</p>
			{/if}
		</div>

		<!-- X button -->
		<button
			type="button"
			onclick={toggleSessionCompleted}
			class="shrink-0 cursor-pointer rounded-lg p-1.5 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-error-bg)] hover:text-[var(--color-error)]"
			aria-label={completed ? 'Mark session incomplete' : 'Mark session complete'}
			title="Cross out session"
		>
			<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12"
				/>
			</svg>
		</button>
	</div>

	<!-- Expanded: Tasks & Resources -->
	{#if expanded}
		<div
			class="mt-4 space-y-2 border-t border-[var(--color-border)] pt-4"
			onclick={(e: Event) => e.stopPropagation()}
		>
			{#if tasks.length === 0}
				<p class="text-sm text-[var(--color-text-tertiary)]">No tasks assigned yet.</p>
			{:else}
				{#each tasks as task (task.id)}
					<div
						class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-3"
					>
						<!-- Task header with checkbox -->
						<div class="flex items-start gap-2.5">
							<button
								type="button"
								onclick={() => toggleTaskCompleted(task)}
								class="mt-0.5 shrink-0 cursor-pointer"
							>
								{#if task.completed}
									<svg
										class="h-4 w-4 text-[var(--color-success)]"
										fill="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
										/>
									</svg>
								{:else}
									<div class="h-4 w-4 rounded border border-[var(--color-border-strong)]"></div>
								{/if}
							</button>
							<div class="min-w-0 flex-1">
								<span
									class="text-sm font-medium text-[var(--color-text-primary)]"
									class:line-through={task.completed}
								>
									{task.title}
								</span>
								{#if task.description}
									<p class="mt-0.5 text-xs text-[var(--color-text-tertiary)]">{task.description}</p>
								{/if}
							</div>
							{#if task.duration_minutes}
								<span class="shrink-0 text-xs text-[var(--color-text-tertiary)]"
									>{task.duration_minutes} min</span
								>
							{/if}
						</div>

						<!-- Resources for this task -->
						{#if resourcesByTask[task.id]?.length > 0}
							<div class="mt-2 ml-7 space-y-1">
								{#each resourcesByTask[task.id] as res (res.id)}
									<div
										class="flex items-center gap-2 rounded-md bg-[var(--color-surface)] px-2.5 py-1.5"
									>
										<svg
											class="h-3.5 w-3.5 shrink-0 text-[var(--color-text-tertiary)]"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
											/>
										</svg>
										<a
											href={res.url}
											target="_blank"
											rel="noopener noreferrer"
											class="min-w-0 flex-1 truncate text-xs text-[var(--color-primary-500)] hover:underline"
										>
											{res.title || res.url}
										</a>
										<button
											type="button"
											onclick={() => handleDeleteResource(res.id)}
											class="shrink-0 cursor-pointer rounded p-0.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)]"
											aria-label="Remove resource"
										>
											<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M6 18L18 6M6 6l12 12"
												/>
											</svg>
										</button>
									</div>
								{/each}
							</div>
						{/if}

						<!-- Add resource button -->
						<button
							type="button"
							onclick={() => handleAddResource(task.id)}
							class="mt-1.5 ml-7 flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-primary-500)]"
						>
							<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 4v16m8-8H4"
								/>
							</svg>
							Add link
						</button>
					</div>
				{/each}
			{/if}
		</div>
	{:else if !loaded}
		<div class="mt-2" onclick={(e: Event) => e.stopPropagation()}>
			<span class="text-xs text-[var(--color-text-tertiary)]">Click to expand</span>
		</div>
	{/if}
</div>
