<script lang="ts">
	let { src, name = '', size = 'md', ...rest }: Record<string, any> = $props();

	const sizes: Record<string, string> = {
		xs: 'h-6 w-6 text-xs',
		sm: 'h-8 w-8 text-sm',
		md: 'h-10 w-10 text-base',
		lg: 'h-12 w-12 text-lg',
		xl: 'h-16 w-16 text-xl'
	};

	const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
</script>

{#if src}
	<img {src} alt={name} class={`${sizes[size]} rounded-full object-cover ring-2 ring-[var(--color-surface-elevated)]`} {...rest} />
{:else}
	<div class={`${sizes[size]} rounded-full bg-gradient-to-br from-[var(--color-primary-400)] to-[var(--color-accent-400)] flex items-center justify-center text-white font-semibold ring-2 ring-[var(--color-surface-elevated)]`} {...rest}>
		{initials}
	</div>
{/if}
