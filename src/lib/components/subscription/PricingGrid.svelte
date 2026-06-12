<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import { stripeApi } from '$lib/lib/stripe';
	import { auth } from '$lib/stores/auth.svelte';
	import { toast } from '$lib/stores/toast.svelte';

	const plans = [
		{
			name: 'Free',
			tier: 'free',
			price: '$0',
			period: 'forever',
			description: 'Try it out, see if it fits',
			cta: 'Get started free',
			href: '/auth/register',
			variant: 'outline' as const,
			credits: '5',
			creditLabel: 'one-time',
			features: [
				'1 student profile',
				'5 AI credits (one-time, never expire)',
				'AI onboarding with diagnostic',
				'Learning plan with resource links',
				'Game plan generation (1 credit)',
				'Parent email auto-draft (1 credit)'
			],
			missing: [
				'Homework completion tracking',
				'Plan regeneration',
				'Weekly adaptation',
				'Student progress reports'
			]
		},
		{
			name: 'Starter',
			tier: 'starter',
			price: '$49',
			period: 'per month',
			description: 'For tutors getting serious',
			cta: 'Subscribe',
			variant: 'outline' as const,
			credits: '15',
			creditLabel: 'per month',
			features: [
				'Up to 4 students',
				'15 AI credits/month (refreshes)',
				'Everything in Free',
				'Homework completion tracking',
				'Learning plan regeneration',
				'Resource links in all plans',
				'Email support (24h)'
			]
		},
		{
			name: 'Pro',
			tier: 'pro',
			price: '$89',
			period: 'per month',
			description: 'For tutors who mean business',
			cta: 'Subscribe',
			variant: 'gradient' as const,
			highlighted: true,
			credits: '30',
			creditLabel: 'per month',
			features: [
				'Up to 8 students',
				'30 AI credits/month (refreshes)',
				'Everything in Starter',
				'Game plan adapts to struggles',
				'Weekly plan adaptation',
				'Student progress reports',
				'Priority AI generation',
				'Priority support (4h)',
				'Bonus credits on top-ups'
			]
		},
		{
			name: 'Enterprise',
			tier: 'enterprise',
			price: '$149',
			period: 'per month',
			description: 'For tutoring centers',
			cta: 'Subscribe',
			variant: 'outline' as const,
			credits: 'Unlimited',
			creditLabel: 'per month',
			features: [
				'Up to 20 students',
				'Unlimited AI credits/month',
				'Everything in Pro',
				'Cross-student progress reports',
				'Best top-up rates',
				'Dedicated support (1h)'
			]
		}
	];

	const payAsYouGoPacks = [
		{
			amount: '$5',
			id: '5',
			creditsFree: '4 credits',
			creditsStarter: '6 credits',
			creditsPro: '7 credits',
			creditsEnterprise: '8 credits',
			rateFree: '$1.25/credit',
			rateStarter: '$0.83/credit',
			ratePro: '$0.71/credit',
			rateEnterprise: '$0.63/credit'
		},
		{
			amount: '$10',
			id: '10',
			creditsFree: '9 credits',
			creditsStarter: '13 credits',
			creditsPro: '15 credits',
			creditsEnterprise: '18 credits',
			rateFree: '$1.11/credit',
			rateStarter: '$0.77/credit',
			ratePro: '$0.67/credit',
			rateEnterprise: '$0.56/credit'
		},
		{
			amount: '$20',
			id: '20',
			creditsFree: '20 credits',
			creditsStarter: '30 credits',
			creditsPro: '35 credits',
			creditsEnterprise: '40 credits',
			rateFree: '$1.00/credit',
			rateStarter: '$0.67/credit',
			ratePro: '$0.57/credit',
			rateEnterprise: '$0.50/credit'
		}
	];

	let loadingBtn = $state<string | null>(null);

	async function handleSubscribe(tier: 'starter' | 'pro' | 'enterprise') {
		loadingBtn = tier;
		try {
			const { url } = await stripeApi.createCheckoutSession({ mode: 'subscription', tier });
			if (url) window.location.href = url;
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to start checkout');
		} finally {
			loadingBtn = null;
		}
	}

	async function handleBuyCredits(creditPack: string) {
		if (!auth.isAuthenticated) {
			window.location.href = '/auth/register';
			return;
		}
		loadingBtn = `pack-${creditPack}`;
		try {
			const { url } = await stripeApi.createCheckoutSession({ mode: 'payment', creditPack });
			if (url) window.location.href = url;
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to start checkout');
		} finally {
			loadingBtn = null;
		}
	}
</script>

<!-- Plan cards -->
<div class="mx-auto grid max-w-5xl gap-8 md:grid-cols-4">
	{#each plans as plan}
		<Card padding={false} hover={plan.highlighted}>
			<div
				class={plan.highlighted
					? 'rounded-xl bg-gradient-to-b from-[var(--color-primary-500)] to-[var(--color-accent-500)] p-0.5'
					: ''}
			>
				<div
					class={`p-5 ${plan.highlighted ? 'rounded-[0.625rem] bg-[var(--color-surface-elevated)]' : ''}`}
				>
					{#if plan.highlighted}
						<div
							class="mb-3 inline-block rounded-full bg-[var(--color-primary-100)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-primary-700)]"
						>
							Most popular
						</div>
					{/if}
					<h3 class="text-lg font-semibold text-[var(--color-text-primary)]">{plan.name}</h3>
					<p class="mt-1 text-sm text-[var(--color-text-secondary)]">{plan.description}</p>
					<div class="mt-4">
						<span class="text-4xl font-bold text-[var(--color-text-primary)]">{plan.price}</span>
						<span class="text-sm text-[var(--color-text-secondary)]">/{plan.period}</span>
					</div>

					<!-- Credit badge -->
					<div
						class="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 {plan.highlighted
							? 'bg-[var(--color-accent-100)] text-[var(--color-accent-700)]'
							: 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]'}"
					>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 10V3L4 14h7v7l9-11h-7z"
							/></svg
						>
						<span class="text-sm font-bold">{plan.credits} AI credits</span>
						<span class="text-xs opacity-75">{plan.creditLabel}</span>
					</div>

					<div class="mt-5">
						{#if plan.tier === 'free' || !auth.isAuthenticated}
							<Button variant={plan.variant} size="lg" fullWidth href={plan.href}>{plan.cta}</Button
							>
						{:else}
							<Button
								variant={plan.variant}
								size="lg"
								fullWidth
								loading={loadingBtn === plan.tier}
								onclick={() => handleSubscribe(plan.tier as 'starter' | 'pro' | 'enterprise')}
								>{plan.cta}</Button
							>
						{/if}
					</div>
				</div>
			</div>
			<div class="p-5 pt-0">
				<ul class="space-y-3">
					{#each plan.features as feature}
						<li class="flex items-start gap-2.5 text-sm">
							<svg
								class="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-success)]"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/></svg
							>
							<span class="text-[var(--color-text-secondary)]">{feature}</span>
						</li>
					{/each}
					{#each plan.missing || [] as missing}
						<li class="flex items-start gap-2.5 text-sm">
							<svg
								class="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-text-tertiary)]"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/></svg
							>
							<span class="text-[var(--color-text-tertiary)]">{missing}</span>
						</li>
					{/each}
				</ul>
			</div>
		</Card>
	{/each}
</div>

<!-- ═══════════════ PAY-AS-YOU-GO ═══════════════ -->
<div class="mx-auto mt-24 max-w-3xl">
	<div class="mb-10 text-center">
		<div
			class="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent-100)] px-3 py-1 text-xs font-medium text-[var(--color-accent-700)]"
		>
			Flexible
		</div>
		<h2
			class="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-text-primary)] md:text-3xl"
		>
			Pay-as-you-go credit packs
		</h2>
		<p class="mx-auto mt-3 max-w-lg text-base text-[var(--color-text-secondary)]">
			Need more credits? Top up anytime. Credits never expire. Paid members get <strong
				class="text-[var(--color-accent-600)]">25–40% more credits</strong
			> per pack.
		</p>
	</div>

	<div class="clay-card p-6 md:p-8">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b-2 border-[var(--color-border)]">
						<th
							class="px-4 py-3 text-left font-[family-name:var(--font-heading)] font-semibold text-[var(--color-text-primary)]"
							>Pack</th
						>
						<th class="px-3 py-3 text-center font-semibold text-[var(--color-text-secondary)]"
							>Free</th
						>
						<th class="px-3 py-3 text-center font-semibold text-[var(--color-text-secondary)]"
							>Starter</th
						>
						<th class="px-3 py-3 text-center font-semibold text-[var(--color-text-primary)]">
							<span class="inline-flex items-center gap-1">
								Pro
								<span
									class="rounded-md bg-[var(--color-primary-100)] px-1.5 py-0.5 text-[10px] text-[var(--color-primary-700)]"
									>Best value</span
								>
							</span>
						</th>
						<th class="px-3 py-3 text-center font-semibold text-[var(--color-text-secondary)]"
							>Enterprise</th
						>
					</tr>
				</thead>
				<tbody>
					{#each payAsYouGoPacks as pack}
						<tr
							class="cursor-pointer border-b border-[var(--color-border)] transition-colors last:border-0 hover:bg-[var(--color-surface-secondary)]"
							onclick={() => handleBuyCredits(pack.id)}
							role="button"
							tabindex="0"
						>
							<td class="px-4 py-4">
								<div class="text-base font-bold text-[var(--color-text-primary)]">
									{pack.amount}
								</div>
								<div class="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
									one-time purchase
								</div>
							</td>
							<td class="px-3 py-4 text-center">
								<div class="font-medium text-[var(--color-text-primary)]">{pack.creditsFree}</div>
								<div class="text-xs text-[var(--color-text-tertiary)]">{pack.rateFree}</div>
							</td>
							<td class="px-3 py-4 text-center">
								<div class="font-medium text-[var(--color-text-primary)]">
									{pack.creditsStarter}
								</div>
								<div class="text-xs text-[var(--color-text-tertiary)]">{pack.rateStarter}</div>
							</td>
							<td class="bg-[var(--color-primary-50)]/50 px-3 py-4 text-center">
								<div class="font-bold text-[var(--color-primary-700)]">{pack.creditsPro}</div>
								<div class="text-xs text-[var(--color-primary-600)]">{pack.ratePro}</div>
							</td>
							<td class="px-3 py-4 text-center">
								<div class="font-medium text-[var(--color-text-primary)]">
									{pack.creditsEnterprise}
								</div>
								<div class="text-xs text-[var(--color-text-tertiary)]">{pack.rateEnterprise}</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div class="mt-6 border-t border-[var(--color-border)] pt-6">
			<div class="grid gap-4 text-center text-xs text-[var(--color-text-tertiary)] sm:grid-cols-3">
				<div>
					<span class="block font-medium text-[var(--color-text-secondary)]">1 credit =</span>
					1 AI plan generation<br />or 1 day plan generation<br />or 1 resource search
				</div>
				<div>
					<span class="block font-medium text-[var(--color-text-secondary)]">Credits</span>
					purchased credits never expire<br />use anytime<br />no monthly commitment
				</div>
				<div>
					<span class="block font-medium text-[var(--color-text-secondary)]">Powered by</span>
					DeepSeek & Groq<br />~$0.01 cost per generation
				</div>
			</div>
		</div>
	</div>
</div>

<!-- ═══════════════ HOW CREDITS WORK ═══════════════ -->
<div class="mx-auto mt-20 max-w-2xl">
	<h3
		class="mb-6 text-center font-[family-name:var(--font-heading)] text-lg font-bold text-[var(--color-text-primary)]"
	>
		How credits work
	</h3>
	<div class="grid gap-6 sm:grid-cols-3">
		<div class="text-center">
			<div
				class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary-100)]"
			>
				<svg
					class="h-6 w-6 text-[var(--color-primary-600)]"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 6v6m0 0v6m0-6h6m-6 0H6"
					/></svg
				>
			</div>
			<p class="text-sm font-medium text-[var(--color-text-primary)]">Generate</p>
			<p class="mt-1 text-xs text-[var(--color-text-secondary)]">
				Each AI plan, day plan, or resource search costs <strong>1 credit</strong>
			</p>
		</div>
		<div class="text-center">
			<div
				class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-accent-100)]"
			>
				<svg
					class="h-6 w-6 text-[var(--color-accent-600)]"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
					/></svg
				>
			</div>
			<p class="text-sm font-medium text-[var(--color-text-primary)]">Refresh</p>
			<p class="mt-1 text-xs text-[var(--color-text-secondary)]">
				Starter, Pro & Enterprise credits <strong>refresh monthly</strong>. Unused credits don't
				roll over
			</p>
		</div>
		<div class="text-center">
			<div
				class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-success-bg)]"
			>
				<svg
					class="h-6 w-6 text-[var(--color-success)]"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
					/></svg
				>
			</div>
			<p class="text-sm font-medium text-[var(--color-text-primary)]">Top up</p>
			<p class="mt-1 text-xs text-[var(--color-text-secondary)]">
				Buy extra credit packs anytime. <strong>Never expire.</strong> Paid members get bonus credits
			</p>
		</div>
	</div>
</div>
