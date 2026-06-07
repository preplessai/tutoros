<script lang="ts">
	let { tabs, activeTab = '', onchange }: {
		tabs: { value: string; label: string; count?: number }[];
		activeTab?: string;
		onchange?: (value: string) => void;
	} = $props();
</script>

<div class="border-b-2 border-[var(--color-border)]">
	<nav class="flex gap-1 -mb-[2px] overflow-x-auto" role="tablist">
		{#each tabs as tab}
			<button
				role="tab"
				aria-selected={activeTab === tab.value}
				onclick={() => onchange?.(tab.value)}
				class={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 cursor-pointer font-[family-name:var(--font-body)]
					${activeTab === tab.value
						? 'border-[var(--color-primary-500)] text-[var(--color-primary-600)]'
						: 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'}`}
			>
				{tab.label}
				{#if tab.count !== undefined}
					<span class={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-medium
						${activeTab === tab.value ? 'bg-[var(--color-primary-100)] text-[var(--color-primary-700)]' : 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]'}`}>
						{tab.count}
					</span>
				{/if}
			</button>
		{/each}
	</nav>
</div>
