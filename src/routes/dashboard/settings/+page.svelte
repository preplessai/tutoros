<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
</script>

<svelte:head><title>Settings — Prepless AI</title></svelte:head>

<div class="max-w-2xl space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-[var(--color-text-primary)]">Settings</h1>
		<p class="mt-1 text-sm text-[var(--color-text-secondary)]">
			Manage your account and preferences.
		</p>
	</div>

	<Card>
		<h3 class="mb-4 font-semibold text-[var(--color-text-primary)]">Profile</h3>
		<div class="space-y-3 text-sm">
			<div class="flex justify-between">
				<span class="text-[var(--color-text-secondary)]">Email</span>
				<span class="text-[var(--color-text-secondary)]">{auth.user?.email || '—'}</span>
			</div>
			<div class="flex justify-between">
				<span class="text-[var(--color-text-secondary)]">Name</span>
				<span class="text-[var(--color-text-secondary)]">{auth.profile?.display_name || '—'}</span>
			</div>
			<div class="flex justify-between">
				<span class="text-[var(--color-text-secondary)]">Plan</span>
				<Badge variant={auth.profile?.subscription_tier === 'pro' ? 'success' : 'default'}
					>{auth.profile?.subscription_tier || 'free'}</Badge
				>
			</div>
		</div>
	</Card>

	<Card>
		<h3 class="mb-4 font-semibold text-[var(--color-text-primary)]">Resource Sites</h3>
		<p class="mb-4 text-sm text-[var(--color-text-secondary)]">
			Configure default resource sites for new students. Per-student overrides available in student
			settings.
		</p>
		<Button variant="secondary" href="/dashboard/settings/resources">Configure Sites</Button>
	</Card>

	<Card>
		<h3 class="mb-4 font-semibold text-[var(--color-error)]">Danger Zone</h3>
		<p class="mb-4 text-sm text-[var(--color-text-secondary)]">Sign out of your account.</p>
		<Button variant="danger" href="/auth/logout">Sign Out</Button>
	</Card>
</div>
