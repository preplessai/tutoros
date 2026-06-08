<script lang="ts">
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';

	const navItems = [
		{
			href: '/dashboard',
			label: 'Overview',
			icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
		},
		{
			href: '/dashboard/plans',
			label: 'Plans',
			icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'
		},
		{
			href: '/dashboard/students',
			label: 'Students',
			icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
		},
		{
			href: '/dashboard/resources',
			label: 'Resources',
			icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9'
		},
		{
			href: '/dashboard/settings',
			label: 'Settings',
			icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'
		}
	];
</script>

<aside
	class="hidden min-h-[calc(100vh-4rem)] w-64 border-r-2 border-[var(--color-border)] bg-[var(--color-surface-secondary)] lg:flex lg:flex-col"
>
	<!-- User mini profile -->
	<div class="border-b border-[var(--color-border)] px-4 pt-5 pb-4">
		<div class="flex items-center gap-3">
			<Avatar name={auth.profile?.display_name || auth.user?.email || 'Tutor'} size="sm" />
			<div class="min-w-0">
				<p class="truncate text-sm font-semibold text-[var(--color-text-primary)]">
					{auth.profile?.display_name || 'Tutor'}
				</p>
				<p class="truncate text-xs text-[var(--color-text-tertiary)]">{auth.user?.email}</p>
			</div>
		</div>
	</div>

	<!-- Navigation -->
	<nav class="flex-1 space-y-1 px-3 py-4">
		{#each navItems as item}
			{@const isActive =
				$page.url.pathname === item.href ||
				($page.url.pathname.startsWith(item.href + '/') && item.href !== '/dashboard')}
			<a
				href={item.href}
				class={`group flex items-center gap-3 rounded-xl px-3 py-2.5 font-[family-name:var(--font-body)] text-sm font-medium no-underline transition-all duration-200
					${
						isActive
							? 'shadow-clay-sm bg-[var(--color-primary-100)] text-[var(--color-primary-700)]'
							: 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)]'
					}`}
			>
				<svg
					class="h-5 w-5 shrink-0 {isActive ? '' : 'group-hover:scale-110'} transition-transform"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={item.icon} />
				</svg>
				{item.label}
				{#if isActive}
					<div class="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--color-primary-500)]"></div>
				{/if}
			</a>
		{/each}
	</nav>

	<!-- Bottom CTA -->
	<div class="border-t-2 border-[var(--color-border)] p-4">
		<a
			href="/dashboard/plans/new"
			class="shadow-clay-sm flex w-full animate-breathe items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-accent-500)] px-4 py-2.5 text-sm font-medium text-white no-underline transition-all hover:from-[var(--color-primary-600)] hover:to-[var(--color-accent-600)] active:scale-[0.97]"
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
				><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 4v16m8-8H4"
				/></svg
			>
			New Plan
		</a>
	</div>
</aside>
