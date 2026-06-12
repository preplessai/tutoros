<script lang="ts">
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth.svelte';
	import { studentStore } from '$lib/stores/student.svelte';
	import { onMount } from 'svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';

	let studentsExpanded = $state(false);

	const isStudentRoute = $derived($page.url.pathname.startsWith('/dashboard/students/'));

	const overviewActive = $derived($page.url.pathname === '/dashboard');
	const studentsActive = $derived($page.url.pathname === '/dashboard/students' || isStudentRoute);
	const settingsActive = $derived($page.url.pathname === '/dashboard/settings');

	onMount(() => {
		studentStore.fetchAll();
	});
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
		<!-- Overview -->
		<a
			href="/dashboard"
			class={`group flex items-center gap-3 rounded-xl px-3 py-2.5 font-[family-name:var(--font-body)] text-sm font-medium no-underline transition-all duration-200 ${
				overviewActive
					? 'shadow-clay-sm bg-[var(--color-primary-100)] text-[var(--color-primary-700)]'
					: 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)]'
			}`}
		>
			<svg
				class="h-5 w-5 shrink-0 {overviewActive ? '' : 'group-hover:scale-110'} transition-transform"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
				/>
			</svg>
			Overview
			{#if overviewActive}
				<div class="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--color-primary-500)]"></div>
			{/if}
		</a>

		<!-- Students (expandable) -->
		<button
			onclick={() => (studentsExpanded = !studentsExpanded)}
			class={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-[family-name:var(--font-body)] text-sm font-medium no-underline transition-all duration-200 ${
				studentsActive
					? 'shadow-clay-sm bg-[var(--color-primary-100)] text-[var(--color-primary-700)]'
					: 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)]'
			}`}
		>
			<svg
				class="h-5 w-5 shrink-0 {studentsActive ? '' : 'group-hover:scale-110'} transition-transform"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
				/>
			</svg>
			<span class="flex-1 text-left">Students</span>
			<svg
				class="h-4 w-4 transition-transform duration-200 {studentsExpanded || isStudentRoute ? 'rotate-0' : '-rotate-90'}"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</button>

		<!-- Student children -->
		{#if studentsExpanded || isStudentRoute}
			{#if studentStore.loading}
				<div class="px-10 py-1.5 text-xs text-[var(--color-text-tertiary)]">Loading students...</div>
			{:else if studentStore.students.length === 0}
				<div class="px-10 py-1.5 text-xs text-[var(--color-text-tertiary)]">No students yet</div>
			{:else}
				{#each studentStore.students as student}
					{@const studentActive = $page.url.pathname === `/dashboard/students/${student.id}`}
					<a
						href={`/dashboard/students/${student.id}`}
						class={`group flex items-center gap-2 rounded-xl px-10 py-1.5 text-sm font-medium no-underline transition-all duration-200 ${
							studentActive
								? 'text-[var(--color-primary-700)]'
								: 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
						}`}
					>
						<Avatar name={student.name} size="xs" />
						<span class="min-w-0 flex-1 truncate">{student.name}</span>
						<Badge variant="primary">{student.grade}</Badge>
					</a>
				{/each}
			{/if}
		{/if}

		<!-- Settings -->
		<a
			href="/dashboard/settings"
			class={`group mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 font-[family-name:var(--font-body)] text-sm font-medium no-underline transition-all duration-200 ${
				settingsActive
					? 'shadow-clay-sm bg-[var(--color-primary-100)] text-[var(--color-primary-700)]'
					: 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)]'
			}`}
		>
			<svg
				class="h-5 w-5 shrink-0 {settingsActive ? '' : 'group-hover:scale-110'} transition-transform"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
				/>
			</svg>
			Settings
			{#if settingsActive}
				<div class="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--color-primary-500)]"></div>
			{/if}
		</a>
	</nav>

	<!-- Bottom CTA -->
	<div class="border-t-2 border-[var(--color-border)] p-4">
		<a
			href="/dashboard/students/new"
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
			New Student
		</a>
	</div>
</aside>
