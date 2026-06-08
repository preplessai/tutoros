<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { dayPlanStore } from '$lib/stores/dayPlan.svelte';
	import { resourceStore } from '$lib/stores/resource.svelte';
	import { formatDateLong } from '$lib/lib/date';
	import TaskList from './TaskList.svelte';
	import ResourceList from '$lib/components/resources/ResourceList.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';

	let { dayId }: { dayId: string } = $props();

	onMount(async () => {
		await dayPlanStore.fetchDay(dayId);
		await resourceStore.fetchByDay(dayId);
	});

	function allResources() {
		return Object.values(resourceStore.resourcesByTask).flat();
	}

	async function handleRemoveResource(id: string) {
		await resourceStore.remove(id);
	}
</script>

{#if dayPlanStore.loading}
	<div class="flex justify-center py-12"><Spinner size="lg" /></div>
{:else if dayPlanStore.currentDay}
	<div class="space-y-6">
		<div>
			<div class="flex items-center gap-2">
				<h1 class="text-xl font-bold text-[var(--color-text-primary)]">
					{formatDateLong(dayPlanStore.currentDay.date)}
				</h1>
				{#if dayPlanStore.currentDay.energy_level}
					<Badge
						variant={dayPlanStore.currentDay.energy_level === 'high'
							? 'success'
							: dayPlanStore.currentDay.energy_level === 'medium'
								? 'info'
								: 'warning'}
					>
						{dayPlanStore.currentDay.energy_level}
					</Badge>
				{/if}
			</div>
			{#if dayPlanStore.currentDay.struggle_areas}
				<p class="mt-1 text-sm text-[var(--color-text-secondary)]">
					Focus: {dayPlanStore.currentDay.struggle_areas.join(', ')}
				</p>
			{/if}
		</div>

		<TaskList tasks={dayPlanStore.tasks} />

		<!-- Saved Resources -->
		<ResourceList resources={allResources()} onRemove={handleRemoveResource} />

		<div class="flex gap-3 border-t border-[var(--color-border)] pt-4">
			<Button
				variant="secondary"
				size="sm"
				onclick={() => goto(`/dashboard/resources/search?dayPlanId=${dayId}`)}
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/></svg
				>
				Find Resources
			</Button>
		</div>
	</div>
{/if}
