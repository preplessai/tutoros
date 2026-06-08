<script lang="ts">
	import PricingGrid from '$lib/components/subscription/PricingGrid.svelte';
</script>

<svelte:head><title>Pricing — Prepless AI</title></svelte:head>

<section class="bg-[var(--color-surface)] py-20 md:py-28">
	<div class="container-page">
		<div class="mb-16 animate-fade-in-up text-center">
			<h1
				class="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-text-primary)] md:text-5xl"
			>
				Simple, transparent pricing
			</h1>
			<p class="mx-auto mt-4 max-w-xl text-lg text-[var(--color-text-secondary)]">
				Choose the plan that fits your tutoring business. Upgrade anytime.
			</p>
		</div>
		<PricingGrid />
	</div>
</section>
