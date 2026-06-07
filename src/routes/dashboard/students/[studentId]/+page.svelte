<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { studentStore } from '$lib/stores/student.svelte';
	import { goto } from '$app/navigation';
	import StudentForm from '$lib/components/students/StudentForm.svelte';
	import StudentSettings from '$lib/components/students/StudentSettings.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import Tabs from '$lib/components/ui/Tabs.svelte';

	let tab = $state('profile');
	let deleting = $state(false);

	onMount(() => {
		studentStore.fetchOne($page.params.studentId);
	});

	async function handleDelete() {
		if (!confirm('Delete this student and all their plans? This cannot be undone.')) return;
		deleting = true;
		await studentStore.remove($page.params.studentId);
		goto('/dashboard/students');
	}
</script>

<svelte:head><title>{studentStore.current?.name || 'Student'} — Prepless AI</title></svelte:head>

{#if studentStore.loading}
	<div class="flex justify-center py-12"><Spinner size="lg" /></div>
{:else if studentStore.current}
	{@const s = studentStore.current}
	<div class="space-y-6">
		<div class="flex items-start justify-between">
			<div>
				<h1 class="text-2xl font-bold text-[var(--color-text-primary)]">{s.name}</h1>
				<div class="flex items-center gap-2 mt-1">
					<Badge variant="info">{s.grade}</Badge>
					{#each s.subjects.slice(0, 3) as subject}
						<Badge variant="primary">{subject}</Badge>
					{/each}
				</div>
			</div>
			<div class="flex gap-2">
				<Button variant="gradient" size="sm" href={`/dashboard/plans/new?studentId=${s.id}`}>
					New Plan
				</Button>
				<Button variant="danger" size="sm" onclick={handleDelete} loading={deleting}>
					Delete
				</Button>
			</div>
		</div>

		<Tabs tabs={[
			{ value: 'profile', label: 'Profile' },
			{ value: 'settings', label: 'Settings' }
		]} activeTab={tab} onchange={t => tab = t} />

		{#if tab === 'profile'}
			<Card>
				<StudentForm editStudent={s} />
			</Card>
		{:else if tab === 'settings'}
			<Card>
				<StudentSettings student={s} />
			</Card>
			<div class="mt-6">
				<Button variant="gradient" href={`/dashboard/plans/new?studentId=${s.id}`}>
					Create Plan for {s.name}
				</Button>
			</div>
		{/if}
	</div>
{/if}
