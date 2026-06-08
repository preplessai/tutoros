<script lang="ts">
	import { onMount } from 'svelte';
	import { dayPlanStore } from '$lib/stores/dayPlan.svelte';
	import { formatDateLong } from '$lib/lib/date';
	import TaskList from './TaskList.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import ResourceSearchForm from '$lib/components/resources/ResourceSearchForm.svelte';

	let { dayId }: { dayId: string } = $props();
	let showResourceSearch = $state(false);

	onMount(() => {
		dayPlanStore.fetchDay(dayId);
	});
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
					Focus: {dayPlanStore.currentDay.struggle_areas}
				</p>
			{/if}
		</div>

		<TaskList tasks={dayPlanStore.tasks} />

		<div class="flex gap-3 border-t border-[var(--color-border)] pt-4">
			<Button
				variant="secondary"
				size="sm"
				onclick={() => (showResourceSearch = !showResourceSearch)}
			>
				{showResourceSearch ? 'Close Resource Search' : 'Find Resources'}
			</Button>
		</div>

		{#if showResourceSearch}
			<ResourceSearchForm onClose={() => (showResourceSearch = false)} />
		{/if}
	</div>
{/if}
