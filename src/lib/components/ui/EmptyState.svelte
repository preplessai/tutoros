<script lang="ts">
	let { icon = 'default', title, description, action }: {
		icon?: 'default' | 'search' | 'calendar' | 'document' | 'students';
		title: string;
		description: string;
		action?: { label: string; onclick: () => void };
	} = $props();

	const icons: Record<string, string> = {
		default: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4',
		search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
		calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
		document: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
		students: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
	};
</script>

<div class="flex flex-col items-center justify-center py-12 px-6 text-center animate-fade-in">
	<div class="h-16 w-16 rounded-2xl bg-[var(--color-surface-tertiary)] flex items-center justify-center mb-4 shadow-clay-sm">
		<svg class="h-8 w-8 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={icons[icon] || icons.default} />
		</svg>
	</div>
	<h3 class="text-base font-semibold text-[var(--color-text-primary)] font-[family-name:var(--font-heading)]">{title}</h3>
	<p class="text-sm text-[var(--color-text-secondary)] mt-1 max-w-sm">{description}</p>
	{#if action}
		<button onclick={action.onclick} class="mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[var(--color-primary-500)] rounded-xl hover:bg-[var(--color-primary-600)] transition-colors shadow-clay-sm cursor-pointer active:scale-[0.97]">
			{action.label}
		</button>
	{/if}
</div>
