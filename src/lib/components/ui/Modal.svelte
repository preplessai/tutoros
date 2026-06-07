<script lang="ts">
	let { open = false, onclose, title = '', description = '', size = 'md', children }: {
		open?: boolean;
		onclose?: () => void;
		title?: string;
		description?: string;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		children?: any;
	} = $props();

	const sizes: Record<string, string> = {
		sm: 'max-w-sm',
		md: 'max-w-lg',
		lg: 'max-w-2xl',
		xl: 'max-w-4xl'
	};

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && onclose) onclose();
	}

	function handleBackdropClick(e: MouseEvent) {
		if ((e.target as HTMLElement).dataset.backdrop === 'true' && onclose) onclose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		data-backdrop="true"
		onclick={handleBackdropClick}
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-text-primary)]/30 backdrop-blur-sm animate-fade-in"
		role="dialog"
		tabindex="-1"
		aria-modal="true"
		aria-label={title || 'Dialog'}
	>
		<div class={`${sizes[size]} w-full clay-card shadow-clay-xl animate-scale-in max-h-[85vh] flex flex-col`}>
			{#if title || onclose}
				<div class="flex items-center justify-between px-6 py-4 border-b-2 border-[var(--color-border)]">
					<div>
						{#if title}
							<h2 class="text-lg font-semibold text-[var(--color-text-primary)] font-[family-name:var(--font-heading)]">{title}</h2>
						{/if}
						{#if description}
							<p class="text-sm text-[var(--color-text-secondary)] mt-0.5">{description}</p>
						{/if}
					</div>
					{#if onclose}
						<button onclick={onclose} aria-label="Close dialog" class="p-1.5 rounded-xl text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors cursor-pointer">
							<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
						</button>
					{/if}
				</div>
			{/if}
			<div class="px-6 py-4 overflow-y-auto">
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}
