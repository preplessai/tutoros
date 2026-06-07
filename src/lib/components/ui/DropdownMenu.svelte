<script lang="ts">
	import { onMount } from 'svelte';

	let { items, children: triggerSlot }: {
		items: { label: string; href?: string; onclick?: () => void; danger?: boolean; icon?: string }[];
		children?: any;
	} = $props();

	let open = $state(false);
	let el: HTMLDivElement;

	onMount(() => {
		function handleClick(e: MouseEvent) {
			if (el && !el.contains(e.target as Node)) open = false;
		}
		document.addEventListener('click', handleClick);
		return () => document.removeEventListener('click', handleClick);
	});

	function handleItemClick(item: (typeof items)[0]) {
		open = false;
		item.onclick?.();
	}
</script>

<div bind:this={el} class="relative inline-block">
	<button onclick={() => (open = !open)} class="cursor-pointer">
		{@render triggerSlot?.()}
	</button>

	{#if open}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="absolute right-0 top-full mt-2 w-56 rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-clay-lg z-50 py-1 animate-scale-in origin-top-right">
			{#each items as item}
				{#if item.href}
					<a href={item.href} class={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
						${item.danger ? 'text-[var(--color-error)] hover:bg-[var(--color-error-bg)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]'}`}>
						{item.label}
					</a>
				{:else}
					<button onclick={() => handleItemClick(item)} class={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left cursor-pointer
						${item.danger ? 'text-[var(--color-error)] hover:bg-[var(--color-error-bg)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]'}`}>
						{item.label}
					</button>
				{/if}
			{/each}
		</div>
	{/if}
</div>
