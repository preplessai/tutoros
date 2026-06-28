<script lang="ts">
	import { onMount } from 'svelte';
	import { studentStore } from '$lib/stores/student.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	onMount(() => {
		studentStore.fetchAll();
	});
</script>

<svelte:head><title>Dashboard — Prepless AI</title></svelte:head>

<div class="page-enter space-y-8">
	<!-- Welcome Banner -->
	<div
		class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--color-primary-600)] via-[var(--color-primary-700)] to-[var(--color-accent-700)] p-6 md:p-8"
	>
		<div class="absolute top-0 right-0 h-48 w-48 rounded-full bg-white/5 blur-2xl"></div>
		<div class="absolute bottom-0 left-1/2 h-32 w-32 rounded-full bg-white/5 blur-xl"></div>
		<div class="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div>
				<h1
					class="font-[family-name:var(--font-heading)] text-2xl font-bold text-white md:text-3xl"
				>
					Welcome back!
				</h1>
				<p class="mt-1 text-[var(--color-primary-100)]">Here's your tutoring overview for today.</p>
			</div>
			<div class="flex gap-3">
				<Button variant="gradient" size="sm" href="/dashboard/students/new">
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/></svg
					>
					Add New Student
				</Button>
			</div>
		</div>
	</div>

	<!-- Students Section -->
	<div>
		<h2
			class="mb-4 font-[family-name:var(--font-heading)] text-xl font-bold text-[var(--color-text-primary)]"
		>
			Your Students
		</h2>

		{#if studentStore.loading}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each Array(3) as _}
					<div class="h-40 animate-pulse rounded-2xl bg-[var(--color-surface-secondary)] p-6"></div>
				{/each}
			</div>
		{:else if studentStore.students.length === 0}
			<Card>
				<div class="py-10 text-center">
					<div
						class="shadow-clay-sm mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-surface-tertiary)]"
					>
						<svg
							class="h-8 w-8 text-[var(--color-text-tertiary)]"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
							/></svg
						>
					</div>
					<p class="text-sm font-medium text-[var(--color-text-primary)]">No students yet</p>
					<p class="mt-1 mb-4 text-xs text-[var(--color-text-secondary)]">
						Add your first student to generate an AI-powered tutoring plan.
					</p>
					<Button variant="gradient" size="sm" href="/dashboard/students/new"
						>Add Your First Student</Button
					>
				</div>
			</Card>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each studentStore.students as student, i (student.id)}
					<div style="animation: fade-in-up 0.4s ease-out {i * 60}ms both">
						<Card hover padding={false}>
							<a
								href="/dashboard/students/{student.id}?tab=timeline"
								class="block rounded-[inherit] p-5 no-underline"
							>
								<div class="flex items-start justify-between">
									<div class="flex items-center gap-3">
										<div
											class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary-400)] to-[var(--color-accent-400)] text-sm font-bold text-white"
										>
											{student.name[0]}
										</div>
										<div>
											<p class="text-sm font-semibold text-[var(--color-text-primary)]">
												{student.name}
											</p>
											<div class="mt-1 flex flex-wrap items-center gap-1.5">
												<span
													class="inline-flex items-center rounded-md bg-[var(--color-primary-100)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-primary-700)]"
													>{student.grade}</span
												>
												{#each student.subjects.slice(0, 2) as subj}
													<span
														class="inline-flex items-center rounded-md bg-[var(--color-surface-tertiary)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-secondary)]"
														>{subj}</span
													>
												{/each}
												{#if student.subjects.length > 2}
													<span class="text-[10px] text-[var(--color-text-tertiary)]"
														>+{student.subjects.length - 2}</span
													>
												{/if}
											</div>
										</div>
									</div>
									<svg
										class="h-4 w-4 shrink-0 text-[var(--color-text-tertiary)] transition-transform group-hover:translate-x-0.5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 5l7 7-7 7"
										/></svg
									>
								</div>
								{#if student.learning_platforms && student.learning_platforms.length > 0}
									<div class="mt-3 flex flex-wrap gap-1">
										{#each student.learning_platforms.slice(0, 3) as platform}
											<span
												class="rounded-md bg-[var(--color-accent-100)] px-1.5 py-0.5 text-[9px] font-medium text-[var(--color-accent-700)]"
												>{platform}</span
											>
										{/each}
										{#if student.learning_platforms.length > 3}
											<span class="text-[9px] text-[var(--color-text-tertiary)]"
												>+{student.learning_platforms.length - 3} more</span
											>
										{/if}
									</div>
								{/if}
							</a>
						</Card>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
