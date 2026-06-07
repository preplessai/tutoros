<script lang="ts">
	let { variant = 'default', children }: {
		variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
		children?: any;
	} = $props();

	const variants: Record<string, string> = {
		default: 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]',
		primary: 'bg-[var(--color-primary-100)] text-[var(--color-primary-700)]',
		success: 'bg-[var(--color-success-bg)] text-[var(--color-success)] border border-[var(--color-success-border)]',
		warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)] border border-[var(--color-warning-border)]',
		error: 'bg-[var(--color-error-bg)] text-[var(--color-error)] border border-[var(--color-error-border)]',
		info: 'bg-[var(--color-info-bg)] text-[var(--color-info)] border border-[var(--color-info-border)]'
	};
</script>

<span class={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
	{@render children?.()}
</span>
