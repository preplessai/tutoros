<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		status = 500,
		title = '',
		message = '',
		compact = false,
		actions
	}: {
		status?: number;
		title?: string;
		message?: string;
		compact?: boolean;
		actions?: Snippet;
	} = $props();

	const defaultTitles: Record<number, string> = {
		400: 'Bad Request',
		401: 'Unauthorized',
		403: 'Access Denied',
		404: 'Not Found',
		500: 'Server Error',
		502: 'Bad Gateway',
		503: 'Service Unavailable'
	};

	const defaultMessages: Record<number, string> = {
		401: 'Please sign in to access this page.',
		403: "You don't have permission to view this content.",
		404: "The page you're looking for doesn't exist or has been moved.",
		500: 'Something went wrong. Please try again later.'
	};

	let displayTitle = $derived(title || defaultTitles[status] || 'Error');
	let displayMessage = $derived(
		message || defaultMessages[status] || 'An unexpected error occurred.'
	);

	const iconPaths: Record<number, string> = {
		401: 'M12 15v2m0-8v4m0 0a9 9 0 110-18 9 9 0 010 18z',
		403: 'M12 15v2m0-8v4m0 0a9 9 0 110-18 9 9 0 010 18z',
		404: 'M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
	};

	const defaultIcon =
		'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z';
	let iconPath = $derived(iconPaths[status] || defaultIcon);
</script>

<div
	class={compact
		? 'rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-6'
		: 'flex min-h-[60vh] items-center justify-center'}
>
	<div class={compact ? '' : 'mx-auto max-w-md text-center'}>
		<!-- Icon -->
		<div class="mb-4 flex justify-center">
			<div
				class="flex h-16 w-16 items-center justify-center rounded-2xl {status === 403 ||
				status === 401
					? 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]'
					: status === 404
						? 'bg-[var(--color-info-bg)] text-[var(--color-info)]'
						: 'bg-[var(--color-error-bg)] text-[var(--color-error)]'}"
			>
				<svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={iconPath} />
				</svg>
			</div>
		</div>

		<!-- Status code -->
		{#if !compact}
			<div class="mb-1 font-mono text-sm font-medium text-[var(--color-primary-500)]">{status}</div>
		{/if}

		<!-- Title -->
		<h2
			class="{compact
				? 'text-lg'
				: 'text-2xl'} font-[family-name:var(--font-heading)] text-[var(--color-text-primary)]"
		>
			{displayTitle}
		</h2>

		<!-- Message -->
		<p class="mt-2 text-sm text-[var(--color-text-secondary)]">
			{displayMessage}
		</p>

		<!-- Actions slot -->
		{#if !compact && actions}
			<div class="mt-6 flex items-center justify-center gap-3">
				{@render actions()}
			</div>
		{/if}
	</div>
</div>
