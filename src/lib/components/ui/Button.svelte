<script lang="ts">
	let { onclick, type = 'button', variant = 'primary', size = 'md', disabled = false, loading = false, href, fullWidth = false, children, ...rest } = $props();

	const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-400)] disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

	const variants: Record<string, string> = {
		primary: 'bg-[var(--color-primary-500)] text-[var(--color-text-inverse)] hover:bg-[var(--color-primary-600)] active:bg-[var(--color-primary-700)] shadow-clay active:shadow-clay-pressed active:scale-[0.97]',
		secondary: 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-primary-100)] active:bg-[var(--color-primary-200)] shadow-clay active:shadow-clay-pressed active:scale-[0.97]',
		outline: 'border-2 border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] active:bg-[var(--color-surface-tertiary)]',
		ghost: 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] active:bg-[var(--color-surface-tertiary)]',
		danger: 'bg-[var(--color-error)] text-white hover:opacity-90 active:opacity-80 shadow-clay active:shadow-clay-pressed active:scale-[0.97]',
		gradient: 'bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-accent-500)] text-white hover:from-[var(--color-primary-600)] hover:to-[var(--color-accent-600)] shadow-clay'
	};

	const sizes: Record<string, string> = {
		sm: 'text-sm px-3 py-1.5 gap-1.5',
		md: 'text-sm px-5 py-2.5',
		lg: 'text-base px-6 py-3',
		xl: 'text-base px-8 py-4 rounded-2xl'
	};
</script>

{#if href}
	<a {href} class={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''}`} {...rest}>
		{#if loading}
			<Spinner size="sm" />
		{/if}
		{@render children?.()}
	</a>
{:else}
	<button {type} {disabled} class={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''}`} {onclick} {...rest}>
		{#if loading}
			<svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
			</svg>
		{/if}
		{@render children?.()}
	</button>
{/if}
