<script lang="ts">
	import { page } from '$app/stores';
	import DayPlanView from '$lib/components/day-plans/DayPlanView.svelte';
</script>

<svelte:head><title>Day Plan — TutorOS</title></svelte:head>

<DayPlanView dayId={$page.params.dayPlanId} />
