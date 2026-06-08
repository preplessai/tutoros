<script lang="ts">
	import { onMount } from 'svelte';
	import { studentStore } from '$lib/stores/student.svelte';
	import StudentCard from './StudentCard.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		studentStore.fetchAll();
	});
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-[var(--color-text-primary)]">Students</h1>
			<p class="mt-1 text-sm text-[var(--color-text-secondary)]">
				{studentStore.students.length} student{studentStore.students.length !== 1 ? 's' : ''}
			</p>
		</div>
		<Button variant="gradient" href="/dashboard/students/new">Add Student</Button>
	</div>

	{#if studentStore.loading}
		<div class="flex justify-center py-12"><Spinner size="lg" /></div>
	{:else if studentStore.students.length === 0}
		<EmptyState
			icon="students"
			title="No students yet"
			description="Add your first student to start creating schedules."
			action={{ label: 'Add Student', onclick: () => goto('/dashboard/students/new') }}
		/>
	{:else}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each studentStore.students as student}
				<StudentCard {student} onclick={() => goto(`/dashboard/students/${student.id}`)} />
			{/each}
		</div>
	{/if}
</div>
