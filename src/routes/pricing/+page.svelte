<script lang="ts">
	import PricingGrid from '$lib/components/subscription/PricingGrid.svelte';
</script>

<svelte:head><title>Pricing — TutorOS</title></svelte:head>

<section class="py-20 md:py-28 bg-[var(--color-surface)]">
	<div class="container-page">
		<div class="text-center mb-16 animate-fade-in-up">
			<h1 class="text-3xl md:text-5xl font-bold text-[var(--color-text-primary)] font-[family-name:var(--font-heading)]">Simple, transparent pricing</h1>
			<p class="mt-4 text-lg text-[var(--color-text-secondary)] max-w-xl mx-auto">Choose the plan that fits your tutoring business. Upgrade anytime.</p>
		</div>
		<PricingGrid />
	</div>
</section>
