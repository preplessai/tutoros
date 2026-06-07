<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
</script>

<svelte:head><title>Dashboard — TutorOS</title></svelte:head>

<div class="space-y-8 page-enter">
	<!-- Welcome Banner -->
	<div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--color-primary-600)] via-[var(--color-primary-700)] to-[var(--color-accent-700)] p-6 md:p-8">
		<div class="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 blur-2xl"></div>
		<div class="absolute bottom-0 left-1/2 w-32 h-32 rounded-full bg-white/5 blur-xl"></div>
		<div class="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
			<div>
				<h1 class="text-2xl md:text-3xl font-bold text-white font-[family-name:var(--font-heading)]">Welcome back!</h1>
				<p class="mt-1 text-[var(--color-primary-100)]">Here's your tutoring overview for today.</p>
			</div>
			<div class="flex gap-3">
				<Button variant="secondary" size="sm" href="/dashboard/plans/new">New Plan</Button>
				<Button variant="ghost" size="sm" href="/dashboard/students/new">
					<span class="text-white/90">Add Student</span>
				</Button>
			</div>
		</div>
	</div>

	<!-- Stats Grid -->
	<div class="grid md:grid-cols-4 gap-4 stagger-children">
		{#each [
			{ label: 'Active Plans', value: '0', trend: '+0 this month', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', color: 'var(--color-primary-100)', iconColor: 'var(--color-primary-600)', accent: 'var(--color-primary-500)' },
			{ label: 'Students', value: '0', trend: '+0 this month', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', color: 'var(--color-accent-100)', iconColor: 'var(--color-accent-600)', accent: 'var(--color-accent-500)' },
			{ label: 'Sessions This Week', value: '0', trend: 'upcoming', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: 'var(--color-success-bg)', iconColor: 'var(--color-success)', accent: 'var(--color-success)' },
			{ label: 'Resources Found', value: '0', trend: 'search ready', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9', color: 'var(--color-info-bg)', iconColor: 'var(--color-info)', accent: 'var(--color-info)' }
		] as stat}
			<Card>
				<div class="flex items-start gap-4">
					<div class="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-clay-sm" style="background:{stat.color}">
						<svg class="h-6 w-6" style="color:{stat.iconColor}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={stat.icon}/></svg>
					</div>
					<div class="min-w-0">
						<p class="text-sm text-[var(--color-text-secondary)] truncate">{stat.label}</p>
						<p class="text-2xl font-bold text-[var(--color-text-primary)] mt-0.5">{stat.value}</p>
						<div class="flex items-center gap-1 mt-1.5">
							<div class="h-1.5 flex-1 rounded-full bg-[var(--color-surface-tertiary)] overflow-hidden">
								<div class="h-full rounded-full w-1/4" style="background:{stat.accent}"></div>
							</div>
							<span class="text-[10px] text-[var(--color-text-tertiary)] shrink-0">{stat.trend}</span>
						</div>
					</div>
				</div>
			</Card>
		{/each}
	</div>

	<!-- Quick Actions + Recent -->
	<div class="grid lg:grid-cols-3 gap-6">
		<!-- Quick Actions -->
		<div class="lg:col-span-1">
			<Card>
				<h3 class="font-semibold text-[var(--color-text-primary)] mb-4 font-[family-name:var(--font-heading)]">Quick Actions</h3>
				<div class="space-y-2">
					{#each [
						{ label: 'Create Weekly Plan', href: '/dashboard/plans/new', icon: 'M12 4v16m8-8H4', color: 'var(--color-primary-100)', iconC: 'var(--color-primary-600)' },
						{ label: 'Add New Student', href: '/dashboard/students/new', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z', color: 'var(--color-accent-100)', iconC: 'var(--color-accent-600)' },
						{ label: 'Browse Resources', href: '/dashboard/resources', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', color: 'var(--color-success-bg)', iconC: 'var(--color-success)' },
						{ label: 'Manage Settings', href: '/dashboard/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', color: 'var(--color-surface-tertiary)', iconC: 'var(--color-text-secondary)' }
					] as action}
						<a href={action.href} class="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--color-surface-secondary)] transition-colors group no-underline">
							<div class="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 group-hover:shadow-clay-sm transition-shadow" style="background:{action.color}">
								<svg class="h-4.5 w-4.5" style="color:{action.iconC}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={action.icon}/></svg>
							</div>
							<span class="text-sm font-medium text-[var(--color-text-primary)]">{action.label}</span>
							<svg class="h-4 w-4 ml-auto text-[var(--color-text-tertiary)] group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
						</a>
					{/each}
				</div>
			</Card>
		</div>

		<!-- Recent + Upcoming -->
		<div class="lg:col-span-2 space-y-6">
			<Card>
				<div class="flex items-center justify-between mb-4">
					<h3 class="font-semibold text-[var(--color-text-primary)] font-[family-name:var(--font-heading)]">Recent Plans</h3>
					<a href="/dashboard/plans" class="text-sm text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)] font-medium no-underline">View all</a>
				</div>
				<div class="py-8 text-center">
					<div class="h-16 w-16 rounded-2xl bg-[var(--color-surface-tertiary)] flex items-center justify-center mx-auto mb-4 shadow-clay-sm">
						<svg class="h-8 w-8 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
					</div>
					<p class="text-sm font-medium text-[var(--color-text-primary)]">No plans yet</p>
					<p class="text-xs text-[var(--color-text-secondary)] mt-1 mb-4">Create your first AI-powered weekly plan.</p>
					<Button variant="primary" size="sm" href="/dashboard/plans/new">Create Plan</Button>
				</div>
			</Card>

			<Card>
				<div class="flex items-center justify-between mb-4">
					<h3 class="font-semibold text-[var(--color-text-primary)] font-[family-name:var(--font-heading)]">Upcoming Sessions</h3>
					<a href="/dashboard/plans" class="text-sm text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)] font-medium no-underline">View all</a>
				</div>
				<div class="divide-y divide-[var(--color-border)]">
					<div class="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
						<div class="h-8 w-8 rounded-lg bg-[var(--color-surface-tertiary)] flex items-center justify-center text-xs font-bold text-[var(--color-text-tertiary)]">—</div>
						<div class="flex-1">
							<p class="text-sm text-[var(--color-text-secondary)]">No upcoming sessions</p>
						</div>
					</div>
				</div>
			</Card>
		</div>
	</div>
</div>
