<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';

	const plans = [
		{
			name: 'Free',
			price: '$0',
			period: 'forever',
			description: 'Perfect for getting started',
			cta: 'Get started',
			href: '/auth/register',
			variant: 'outline' as const,
			features: [
				'Up to 3 students',
				'5 weekly plans',
				'Basic AI scheduling',
				'Manual plan editing',
				'Email support'
			],
			missing: [
				'Day plans',
				'Resource search',
				'Plan adjustment',
				'Priority AI generation'
			]
		},
		{
			name: 'Pro',
			price: '$19',
			period: 'per month',
			description: 'For serious tutors who want it all',
			cta: 'Start Pro trial',
			href: '/auth/register?tier=pro',
			variant: 'gradient' as const,
			highlighted: true,
			features: [
				'Unlimited students',
				'Unlimited weekly plans',
				'Advanced AI scheduling',
				'Day plans with AI',
				'Plan adjustment & regeneration',
				'Resource search (Khan Academy, IXL, W3Schools, etc.)',
				'Manual plan editing',
				'Priority AI generation',
				'Priority support'
			]
		},
		{
			name: 'Enterprise',
			price: '$49',
			period: 'per month',
			description: 'For tutoring centers and teams',
			cta: 'Contact us',
			href: 'mailto:enterprise@tutoros.com',
			variant: 'outline' as const,
			features: [
				'Everything in Pro',
				'Unlimited tutors',
				'Team dashboard',
				'Shared student profiles',
				'Custom AI model tuning',
				'API access',
				'Dedicated support',
				'Custom integrations'
			]
		}
	];
</script>

<div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
	{#each plans as plan}
		<Card padding={false} hover={plan.highlighted}>
			<div class={plan.highlighted ? 'p-0.5 rounded-xl bg-gradient-to-b from-[var(--color-primary-500)] to-[var(--color-accent-500)]' : ''}>
				<div class={`p-6 ${plan.highlighted ? 'bg-[var(--color-surface-elevated)] rounded-[0.625rem]' : ''}`}>
					{#if plan.highlighted}
						<div class="inline-block px-2.5 py-0.5 rounded-full bg-[var(--color-primary-100)] bg-[var(--color-primary-100)] text-[var(--color-primary-700)] text-[var(--color-primary-700)] text-xs font-medium mb-3">Most popular</div>
					{/if}
					<h3 class="text-lg font-semibold text-[var(--color-text-primary)]">{plan.name}</h3>
					<p class="text-sm text-[var(--color-text-secondary)] mt-1">{plan.description}</p>
					<div class="mt-4">
						<span class="text-4xl font-bold text-[var(--color-text-primary)]">{plan.price}</span>
						<span class="text-sm text-[var(--color-text-secondary)]">/{plan.period}</span>
					</div>
					<div class="mt-6">
						<Button variant={plan.variant} size="lg" fullWidth href={plan.href}>{plan.cta}</Button>
					</div>
				</div>
			</div>
			<div class="p-6 pt-0">
				<ul class="space-y-3">
					{#each plan.features as feature}
						<li class="flex items-start gap-2.5 text-sm">
							<svg class="h-5 w-5 text-[var(--color-success)] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
							<span class="text-[var(--color-text-secondary)]">{feature}</span>
						</li>
					{/each}
					{#each (plan.missing || []) as missing}
						<li class="flex items-start gap-2.5 text-sm">
							<svg class="h-5 w-5 text-[var(--color-text-tertiary)] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
							<span class="text-[var(--color-text-tertiary)]">{missing}</span>
						</li>
					{/each}
				</ul>
			</div>
		</Card>
	{/each}
</div>
