<script lang="ts">
	import { onMount } from 'svelte';
	import { studentStore } from '$lib/stores/student.svelte';
	import { planStore } from '$lib/stores/plan.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	onMount(() => {
		studentStore.fetchAll();
		planStore.fetchAll();
	});

	let stats = $derived([
		{
			label: 'Active Plans',
			value: planStore.plans.filter((p) => p.status === 'active').length,
			trend: '+0 this month',
			icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
			color: 'var(--color-primary-100)',
			iconColor: 'var(--color-primary-600)',
			accent: 'var(--color-primary-500)'
		},
		{
			label: 'Students',
			value: studentStore.students.length,
			trend: '+0 this month',
			icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
			color: 'var(--color-accent-100)',
			iconColor: 'var(--color-accent-600)',
			accent: 'var(--color-accent-500)'
		},
		{
			label: 'Sessions This Week',
			value: '0',
			trend: 'upcoming',
			icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
			color: 'var(--color-success-bg)',
			iconColor: 'var(--color-success)',
			accent: 'var(--color-success)'
		},
		{
			label: 'Resources Found',
			value: '0',
			trend: 'search ready',
			icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
			color: 'var(--color-info-bg)',
			iconColor: 'var(--color-info)',
			accent: 'var(--color-info)'
		}
	]);
</script>

<svelte:head><title>Dashboard — Prepless AI</title></svelte:head>

<div class="page-enter space-y-8">
	<!-- Welcome Banner -->
	<div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--color-primary-600)] via-[var(--color-primary-700)] to-[var(--color-accent-700)] p-6 md:p-8">
		<div class="absolute top-0 right-0 h-48 w-48 rounded-full bg-white/5 blur-2xl"></div>
		<div class="absolute bottom-0 left-1/2 h-32 w-32 rounded-full bg-white/5 blur-xl"></div>
		<div class="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div>
				<h1 class="font-[family-name:var(--font-heading)] text-2xl font-bold text-white md:text-3xl">
					Welcome back!
				</h1>
				<p class="mt-1 text-[var(--color-primary-100)]">Here's your tutoring overview for today.</p>
			</div>
			<div class="flex gap-3">
				<Button variant="gradient" size="sm" href="/dashboard/students/new">
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
						><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
					Add New Student
				</Button>
			</div>
		</div>
	</div>

	<!-- Stats Grid -->
	<div class="grid stagger-children gap-4 md:grid-cols-4">
		{#each stats as stat}
			<Card>
				<div class="flex items-start gap-4">
					<div class="shadow-clay-sm flex h-12 w-12 shrink-0 animate-breathe items-center justify-center rounded-2xl" style="background:{stat.color}">
						<svg class="h-6 w-6" style="color:{stat.iconColor}" fill="none" viewBox="0 0 24 24" stroke="currentColor"
							><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={stat.icon}/></svg>
					</div>
					<div class="min-w-0">
						<p class="truncate text-sm text-[var(--color-text-secondary)]">{stat.label}</p>
						<p class="mt-0.5 text-2xl font-bold text-[var(--color-text-primary)]">{stat.value}</p>
						<div class="mt-1.5 flex items-center gap-1">
							<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-tertiary)]">
								<div class="h-full w-1/4 rounded-full" style="background:{stat.accent}"></div>
							</div>
							<span class="shrink-0 text-[10px] text-[var(--color-text-tertiary)]">{stat.trend}</span>
						</div>
					</div>
				</div>
			</Card>
		{/each}
	</div>

	<!-- Quick Actions -->
	<Card>
		<h3 class="mb-4 font-[family-name:var(--font-heading)] font-semibold text-[var(--color-text-primary)]">Quick Actions</h3>
		<div class="grid gap-2 sm:grid-cols-4">
			{#each [
				{ label: 'Create Weekly Plan', href: '/dashboard/plans/new', icon: 'M12 4v16m8-8H4', color: 'var(--color-primary-100)', iconC: 'var(--color-primary-600)' },
				{ label: 'Add New Student', href: '/dashboard/students/new', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z', color: 'var(--color-accent-100)', iconC: 'var(--color-accent-600)' },
				{ label: 'Browse Resources', href: '/dashboard/resources', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', color: 'var(--color-success-bg)', iconC: 'var(--color-success)' },
				{ label: 'Manage Settings', href: '/dashboard/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', color: 'var(--color-surface-tertiary)', iconC: 'var(--color-text-secondary)' }
			] as action}
				<a href={action.href} class="group flex items-center gap-3 rounded-xl p-3 no-underline transition-colors hover:bg-[var(--color-surface-secondary)]">
					<div class="group-hover:shadow-clay-sm flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-shadow" style="background:{action.color}">
						<svg class="h-4.5 w-4.5" style="color:{action.iconC}" fill="none" viewBox="0 0 24 24" stroke="currentColor"
							><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={action.icon}/></svg>
					</div>
					<span class="text-sm font-medium text-[var(--color-text-primary)]">{action.label}</span>
					<svg class="ml-auto h-4 w-4 text-[var(--color-text-tertiary)] transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
						><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
				</a>
			{/each}
		</div>
	</Card>

	<!-- Students Section -->
	<div>
		<div class="mb-4 flex items-center justify-between">
			<h2 class="font-[family-name:var(--font-heading)] text-xl font-bold text-[var(--color-text-primary)]">
				Your Students
			</h2>
			<Button variant="primary" size="sm" href="/dashboard/students/new">
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
					><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
				Add New Student
			</Button>
		</div>

		{#if studentStore.loading}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each Array(3) as _}
					<div class="animate-pulse rounded-2xl bg-[var(--color-surface-secondary)] p-6 h-40"></div>
				{/each}
			</div>
		{:else if studentStore.students.length === 0}
			<Card>
				<div class="py-10 text-center">
					<div class="shadow-clay-sm mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-surface-tertiary)]">
						<svg class="h-8 w-8 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"
							><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
					</div>
					<p class="text-sm font-medium text-[var(--color-text-primary)]">No students yet</p>
					<p class="mt-1 mb-4 text-xs text-[var(--color-text-secondary)]">Add your first student to generate an AI-powered tutoring plan.</p>
					<Button variant="gradient" size="sm" href="/dashboard/students/new">Add Your First Student</Button>
				</div>
			</Card>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each studentStore.students as student, i (student.id)}
					<div style="animation: fade-in-up 0.4s ease-out {i * 60}ms both">
						<Card hover padding={false}>
							<a href="/dashboard/students/{student.id}?tab=timeline" class="block rounded-[inherit] p-5 no-underline">
								<div class="flex items-start justify-between">
									<div class="flex items-center gap-3">
										<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary-400)] to-[var(--color-accent-400)] text-sm font-bold text-white">
											{student.name[0]}
										</div>
										<div>
											<p class="text-sm font-semibold text-[var(--color-text-primary)]">{student.name}</p>
											<div class="mt-1 flex flex-wrap items-center gap-1.5">
												<span class="inline-flex items-center rounded-md bg-[var(--color-primary-100)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-primary-700)]">{student.grade}</span>
												{#each student.subjects.slice(0, 2) as subj}
													<span class="inline-flex items-center rounded-md bg-[var(--color-surface-tertiary)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-secondary)]">{subj}</span>
												{/each}
												{#if student.subjects.length > 2}
													<span class="text-[10px] text-[var(--color-text-tertiary)]">+{student.subjects.length - 2}</span>
												{/if}
											</div>
										</div>
									</div>
									<svg class="h-4 w-4 shrink-0 text-[var(--color-text-tertiary)] transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
										><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
								</div>
								{#if student.learning_platforms && student.learning_platforms.length > 0}
									<div class="mt-3 flex flex-wrap gap-1">
										{#each student.learning_platforms.slice(0, 3) as platform}
											<span class="rounded-md bg-[var(--color-accent-100)] px-1.5 py-0.5 text-[9px] font-medium text-[var(--color-accent-700)]">{platform}</span>
										{/each}
										{#if student.learning_platforms.length > 3}
											<span class="text-[9px] text-[var(--color-text-tertiary)]">+{student.learning_platforms.length - 3} more</span>
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

	<!-- Recent Plans -->
	{#if planStore.plans.length > 0}
		<Card>
			<div class="mb-4 flex items-center justify-between">
				<h3 class="font-[family-name:var(--font-heading)] font-semibold text-[var(--color-text-primary)]">Recent Plans</h3>
				<a href="/dashboard/plans" class="text-sm font-medium text-[var(--color-primary-500)] no-underline hover:text-[var(--color-primary-600)]">View all</a>
			</div>
			<div class="divide-y divide-[var(--color-border)]">
				{#each planStore.plans.slice(0, 3) as plan}
					<div class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
						<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-surface-tertiary)] text-xs font-bold text-[var(--color-text-tertiary)]">
							{plan.subjects[0]?.[0] || 'P'}
						</div>
						<div class="flex-1 min-w-0">
							<p class="truncate text-sm font-medium text-[var(--color-text-primary)]">{plan.title}</p>
							<p class="text-xs text-[var(--color-text-secondary)]">{plan.grade} · {plan.subjects.slice(0, 2).join(', ')}</p>
						</div>
						<a href="/dashboard/plans/{plan.id}" class="shrink-0 text-xs font-medium text-[var(--color-primary-500)] no-underline hover:text-[var(--color-primary-600)]">Open →</a>
					</div>
				{/each}
			</div>
		</Card>
	{/if}
</div>
