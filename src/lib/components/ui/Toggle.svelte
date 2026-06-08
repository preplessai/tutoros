<script lang="ts">
	let { label, checked = $bindable(false), disabled = false, onchange, name } = $props();
</script>

<label class="group inline-flex cursor-pointer items-center gap-2.5">
	<input type="checkbox" {name} {checked} {disabled} {onchange} class="peer sr-only" />
	<div
		class="relative h-5 w-9 rounded-full transition-colors duration-200
		{checked ? 'bg-[var(--color-primary-500)]' : 'bg-[var(--color-border-strong)]'}
		peer-disabled:cursor-not-allowed peer-disabled:opacity-50
		after:absolute after:top-0.5 after:left-0.5 after:h-4
		after:w-4 after:rounded-full after:bg-white after:shadow-sm
		after:transition-transform after:duration-200 after:content-['']
		{checked ? 'after:translate-x-4' : 'after:translate-x-0'}"
	></div>
	{#if label}
		<span class="text-sm text-[var(--color-text-secondary)] group-has-[:disabled]:opacity-50"
			>{label}</span
		>
	{/if}
</label>
