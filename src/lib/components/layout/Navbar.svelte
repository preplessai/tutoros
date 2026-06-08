<script lang="ts">
	import { auth, theme } from '$lib/stores/auth.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte';

	function handleLogout() {
		auth.signOut();
		window.location.href = '/';
	}
</script>

<header
	class="sticky top-0 z-40 border-b-2 border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-md"
>
	<div class="container-page flex h-16 items-center justify-between">
		<a
			href="/"
			class="flex items-center gap-2.5 font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-text-primary)] no-underline"
		>
			<div
				class="shadow-clay-sm flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary-400)] to-[var(--color-accent-400)]"
			>
				<svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
					/>
				</svg>
			</div>
			Prepless AI
		</a>

		<nav class="hidden items-center gap-1 md:flex">
			<a
				href="/pricing"
				class="rounded-xl px-3 py-2 font-[family-name:var(--font-body)] text-sm text-[var(--color-text-secondary)] no-underline transition-colors hover:text-[var(--color-text-primary)]"
				>Pricing</a
			>
			{#if auth.isAuthenticated}
				<a
					href="/dashboard"
					class="rounded-xl px-3 py-2 font-[family-name:var(--font-body)] text-sm text-[var(--color-text-secondary)] no-underline transition-colors hover:text-[var(--color-text-primary)]"
					>Dashboard</a
				>
			{/if}
		</nav>

		<div class="flex items-center gap-3">
			<button
				onclick={theme.toggle}
				class="cursor-pointer rounded-xl p-2 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)]"
				aria-label="Toggle theme"
			>
				{#if theme.dark}
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
						/></svg
					>
				{:else}
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
						/></svg
					>
				{/if}
			</button>

			{#if auth.isAuthenticated}
				<DropdownMenu
					items={[
						{ label: 'Dashboard', href: '/dashboard' },
						{ label: 'Settings', href: '/dashboard/settings' },
						{ label: 'Sign out', onclick: handleLogout, danger: true }
					]}
				>
					<Avatar name={auth.profile?.display_name || auth.user?.email || 'User'} size="sm" />
				</DropdownMenu>
			{:else}
				<a
					href="/auth/login"
					class="shadow-clay-sm inline-flex items-center rounded-xl bg-[var(--color-primary-500)] px-5 py-2 text-sm font-medium text-white no-underline transition-colors hover:bg-[var(--color-primary-600)] active:scale-[0.97]"
					>Sign in</a
				>
			{/if}
		</div>
	</div>
</header>
