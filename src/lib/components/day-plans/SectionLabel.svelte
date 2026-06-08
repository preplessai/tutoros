<script lang="ts">
	import { SECTION_LABELS, SECTION_COLORS } from '$lib/lib/constants';

	let { section }: { section: string } = $props();

	let label = $derived(SECTION_LABELS[section] || section);
	let colorClass = $derived(
		SECTION_COLORS[section] ||
			'border-l-[var(--color-border-strong)] bg-[var(--color-surface-secondary)]'
	);
</script>

<div class={`border-l-2 pl-3 ${colorClass}`}>
	<span class="text-xs font-semibold tracking-wider text-[var(--color-text-secondary)] uppercase"
		>{label}</span
	>
</div>
