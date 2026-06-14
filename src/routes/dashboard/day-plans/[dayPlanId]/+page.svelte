<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { supabase } from '$lib/lib/supabase';
	import DayPlanView from '$lib/components/day-plans/DayPlanView.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let studentId = $state<string | null>(null);
	let loading = $state(true);

	onMount(async () => {
		const dayPlanId = $page.params.dayPlanId;

		// Fetch the ownership chain: day → week → plan → student
		const { data: day } = await supabase
			.from('plan_days')
			.select('week_id')
			.eq('id', dayPlanId)
			.single();

		if (day) {
			const { data: week } = await supabase
				.from('plan_weeks')
				.select('plan_id')
				.eq('id', day.week_id)
				.single();

			if (week) {
				const { data: plan } = await supabase
					.from('weekly_plans')
					.select('student_id')
					.eq('id', week.plan_id)
					.single();

				if (plan) {
					studentId = plan.student_id;
				}
			}
		}
		loading = false;
	});
</script>

<svelte:head><title>Day Plan — Prepless AI</title></svelte:head>

<div class="space-y-4">
	{#if !loading && studentId}
		<Button variant="ghost" size="sm" href={`/dashboard/students/${studentId}?tab=dayplans`}>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
			</svg>
			Back to Student
		</Button>
	{/if}

	<DayPlanView dayId={$page.params.dayPlanId} />
</div>
