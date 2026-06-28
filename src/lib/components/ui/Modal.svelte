<script lang="ts">
	let {
		open = false,
		onclose,
		title = '',
		description = '',
		size = 'md',
		children
	}: {
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
		if (e.key === 'Escape' && onclose) {
			console.log("['Modal] Escape key pressed — closing");
			onclose();
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		e.stopPropagation();
		const isBackdrop = (e.target as HTMLElement).dataset.backdrop === 'true';
		console.log(
			"['Modal] Backdrop clicked. target:",
			(e.target as HTMLElement).tagName,
			'isBackdrop:',
			isBackdrop
		);
		if (isBackdrop && onclose) onclose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		data-backdrop="true"
		onclick={handleBackdropClick}
		class="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-[var(--color-text-primary)]/30 p-4 backdrop-blur-sm"
		role="dialog"
		tabindex="-1"
		aria-modal="true"
		aria-label={title || 'Dialog'}
	>
		<div
			class={`${sizes[size]} shadow-clay-xl flex max-h-[85vh] w-full animate-scale-in flex-col clay-card`}
			onclick={(e: MouseEvent) => e.stopPropagation()}
		>
			{#if title || onclose}
				<div
					class="flex items-center justify-between border-b-2 border-[var(--color-border)] px-6 py-4"
				>
					<div>
						{#if title}
							<h2
								class="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-text-primary)]"
							>
								{title}
							</h2>
						{/if}
						{#if description}
							<p class="mt-0.5 text-sm text-[var(--color-text-secondary)]">{description}</p>
						{/if}
					</div>
					{#if onclose}
						<button
							onclick={onclose}
							aria-label="Close dialog"
							class="cursor-pointer rounded-xl p-1.5 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)]"
						>
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/></svg
							>
						</button>
					{/if}
				</div>
			{/if}
			<div class="overflow-y-auto px-6 py-4">
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}
