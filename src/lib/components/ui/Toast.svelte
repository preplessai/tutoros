<script lang="ts">
	import { toast, type Toast as ToastType } from '$lib/stores/toast.svelte';

	function typeIcon(type: ToastType['type']): string {
		const map: Record<string, string> = {
			success: 'M5 13l4 4L19 7',
			error: 'M6 18L18 6M6 6l12 12',
			warning: 'M12 9v4m0 4h.01',
			info: 'M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z'
		};
		return map[type] || map.info;
	}

	function typeClasses(type: ToastType['type']): string {
		const map: Record<string, string> = {
			success:
				'border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success)]',
			error:
				'border-[var(--color-error-border)] bg-[var(--color-error-bg)] text-[var(--color-error)]',
			warning:
				'border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
			info: 'border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info)]'
		};
		return map[type] || map.info;
	}
</script>

{#each toast.toasts as t (t.id)}
	<div
		class={`shadow-clay-md flex animate-slide-in-right items-center gap-3 rounded-xl border-2 px-4 py-3 ${typeClasses(t.type)}`}
	>
		<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={typeIcon(t.type)} />
		</svg>
		<p class="flex-1 text-sm font-medium">{t.message}</p>
		<button
			onclick={() => toast.remove(t.id)}
			aria-label="Dismiss"
			class="shrink-0 cursor-pointer rounded-lg p-0.5 transition-colors hover:bg-black/5"
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
				><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12"
				/></svg
			>
		</button>
	</div>
{/each}

<style>
	@keyframes slide-in-right {
		from {
			opacity: 0;
			transform: translateX(100%);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}
	.animate-slide-in-right {
		animation: slide-in-right 0.3s ease-out;
	}
</style>
