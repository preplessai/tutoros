<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth.svelte';
	import { creditStore } from '$lib/stores/credits.svelte';
	import { stripeApi } from '$lib/lib/stripe';
	import { toast } from '$lib/stores/toast.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';

	let managingSubscription = $state(false);

	onMount(() => {
		creditStore.fetch();

		// Check for successful checkout redirect
		if ($page.url.searchParams.get('checkout') === 'success') {
			toast.success('Subscription updated successfully!');
			window.history.replaceState({}, '', '/dashboard/settings');
		}
	});

	async function handleManageSubscription() {
		managingSubscription = true;
		try {
			const { url } = await stripeApi.createPortalSession();
			window.location.href = url;
		} catch {
			toast.error('Failed to open subscription portal');
		} finally {
			managingSubscription = false;
		}
	}

	function getTierBadgeVariant(
		tier: string | null | undefined
	): 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' {
		if (tier === 'starter') return 'primary';
		if (tier === 'pro') return 'success';
		if (tier === 'enterprise') return 'info';
		return 'default';
	}

	function getTierLabel(tier: string | null | undefined): string {
		if (tier === 'free') return 'Free';
		if (tier === 'starter') return 'Starter';
		if (tier === 'pro') return 'Pro';
		if (tier === 'enterprise') return 'Enterprise';
		return 'Free';
	}

	function getStatusBadgeVariant(
		status: string | null | undefined
	): 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' {
		if (status === 'active') return 'success';
		if (status === 'past_due') return 'warning';
		if (status === 'canceled') return 'error';
		if (status === 'trialing') return 'info';
		return 'default';
	}
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

	<!-- Subscription -->
	<Card>
		<h3 class="mb-4 font-semibold text-[var(--color-text-primary)]">Subscription</h3>
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<div>
					<div class="text-sm text-[var(--color-text-secondary)]">Current Plan</div>
					<div class="mt-0.5 flex items-center gap-2">
						<span class="text-lg font-semibold text-[var(--color-text-primary)]">
							{getTierLabel(auth.profile?.subscription_tier)}
						</span>
						<Badge variant={getTierBadgeVariant(auth.profile?.subscription_tier)}>
							{auth.profile?.subscription_tier || 'free'}
						</Badge>
					</div>
				</div>
			</div>

			{#if (auth.profile?.subscription_tier || 'free') !== 'free'}
				<hr class="border-[var(--color-border)]" />

				<div class="space-y-2">
					<div class="flex items-center justify-between text-sm">
						<span class="text-[var(--color-text-secondary)]">Status</span>
						<Badge variant={getStatusBadgeVariant(auth.profile?.subscription_status)}>
							{auth.profile?.subscription_status || 'unknown'}
						</Badge>
					</div>

					{#if auth.profile?.subscription_period_end}
						<div class="flex items-center justify-between text-sm">
							<span class="text-[var(--color-text-secondary)]">Current period ends</span>
							<span class="text-[var(--color-text-primary)]">
								{new Date(auth.profile.subscription_period_end).toLocaleDateString('en-US', {
									year: 'numeric',
									month: 'long',
									day: 'numeric'
								})}
							</span>
						</div>
					{/if}

					{#if auth.profile?.cancel_at_period_end}
						<div
							class="rounded-lg bg-[var(--color-warning-bg)] p-3 text-sm text-[var(--color-warning)]"
						>
							Your subscription will end on {new Date(
								auth.profile.subscription_period_end!
							).toLocaleDateString('en-US', {
								year: 'numeric',
								month: 'long',
								day: 'numeric'
							})} and won't renew.
						</div>
					{/if}
				</div>

				<hr class="border-[var(--color-border)]" />
			{/if}

			<div class="flex flex-wrap gap-3">
				{#if auth.profile?.subscription_tier === 'free'}
					<Button variant="gradient" href="/pricing">
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 10V3L4 14h7v7l9-11h-7z"
							/>
						</svg>
						Upgrade to Pro
					</Button>
				{:else if auth.profile?.cancel_at_period_end}
					<Button variant="gradient" href="/pricing">Resubscribe</Button>
				{:else}
					<Button
						variant="secondary"
						onclick={handleManageSubscription}
						loading={managingSubscription}
					>
						Manage Subscription
					</Button>
				{/if}
			</div>
		</div>
	</Card>

	<!-- Credits -->
	<Card>
		<h3 class="mb-4 font-semibold text-[var(--color-text-primary)]">Credits</h3>

		<div class="mb-4 flex items-center gap-4">
			<div
				class="flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--color-primary-900)]"
			>
				<svg
					class="h-8 w-8 text-[var(--color-primary-500)]"
					fill="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"
					/>
				</svg>
			</div>
			<div>
				<div class="text-2xl font-bold text-[var(--color-text-primary)]">
					{creditStore.total % 1 === 0 ? creditStore.total : creditStore.total.toFixed(1)}
				</div>
				<div class="text-xs text-[var(--color-text-secondary)]">total credits available</div>
			</div>
		</div>

		<div
			class="space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
		>
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<div class="h-2 w-2 rounded-full bg-[var(--color-primary-500)]"></div>
					<span class="text-sm text-[var(--color-text-primary)]">Non-expiring</span>
				</div>
				<div class="text-right">
					<div class="text-sm font-semibold text-[var(--color-text-primary)]">
						{creditStore.nonExpiring % 1 === 0
							? creditStore.nonExpiring
							: creditStore.nonExpiring.toFixed(1)}
					</div>
					<div class="text-xs text-[var(--color-text-tertiary)]">never expire</div>
				</div>
			</div>

			<hr class="border-[var(--color-border)]" />

			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<div class="h-2 w-2 rounded-full bg-[var(--color-info)]"></div>
					<span class="text-sm text-[var(--color-text-primary)]">Refreshing</span>
				</div>
				<div class="text-right">
					<div class="text-sm font-semibold text-[var(--color-text-primary)]">
						{creditStore.refreshing % 1 === 0
							? creditStore.refreshing
							: creditStore.refreshing.toFixed(1)}
					</div>
					{#if auth.profile?.subscription_tier === 'free'}
						<span class="text-xs text-[var(--color-text-tertiary)]"
							>upgrade for monthly credits</span
						>
					{:else}
						<span class="text-xs text-[var(--color-text-tertiary)]">reset monthly</span>
					{/if}
				</div>
			</div>
		</div>

		<div class="mt-4 flex gap-3">
			<Button variant="primary" href="/pricing">
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 6v6m0 0v6m0-6h6m-6 0H6"
					/>
				</svg>
				Buy More Credits
			</Button>
			<Button variant="secondary" onclick={() => creditStore.fetch()}>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
					/>
				</svg>
				Refresh
			</Button>
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
