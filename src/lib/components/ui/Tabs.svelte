<script lang="ts">
	let {
		tabs,
		activeTab = '',
		onchange
	}: {
		tabs: { value: string; label: string; count?: number }[];
		activeTab?: string;
		onchange?: (value: string) => void;
	} = $props();
</script>

<div class="border-b-2 border-[var(--color-border)]">
	<nav class="-mb-[2px] flex gap-1 overflow-x-auto" role="tablist">
		{#each tabs as tab}
			<button
				role="tab"
				aria-selected={activeTab === tab.value}
				onclick={() => onchange?.(tab.value)}
				class={`cursor-pointer border-b-2 px-4 py-3 font-[family-name:var(--font-body)] text-sm font-medium whitespace-nowrap transition-all duration-200
					${
						activeTab === tab.value
							? 'border-[var(--color-primary-500)] text-[var(--color-primary-600)]'
							: 'border-transparent text-[var(--color-text-tertiary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-secondary)]'
					}`}
			>
				{tab.label}
				{#if tab.count !== undefined}
					<span
						class={`ml-1.5 rounded-full px-2 py-0.5 text-xs font-medium
						${activeTab === tab.value ? 'bg-[var(--color-primary-100)] text-[var(--color-primary-700)]' : 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]'}`}
					>
						{tab.count}
					</span>
				{/if}
			</button>
		{/each}
	</nav>
</div>
