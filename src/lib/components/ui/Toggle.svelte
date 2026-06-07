<script lang="ts">
	let { label, checked = false, disabled = false, onchange, name }: Record<string, any> = $props();
</script>

<label class="inline-flex items-center gap-2.5 cursor-pointer group">
	<input
		type="checkbox"
		{name}
		{checked}
		{disabled}
		{onchange}
		class="sr-only peer"
	/>
	<div class="relative w-9 h-5 rounded-full transition-colors duration-200
		{checked ? 'bg-[var(--color-primary-500)]' : 'bg-[var(--color-border-strong)]'}
		peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
		after:content-[''] after:absolute after:top-0.5 after:left-0.5
		after:w-4 after:h-4 after:rounded-full after:bg-white
		after:shadow-sm after:transition-transform after:duration-200
		{checked ? 'after:translate-x-4' : 'after:translate-x-0'}">
	</div>
	{#if label}
		<span class="text-sm text-[var(--color-text-secondary)] group-has-[:disabled]:opacity-50">{label}</span>
	{/if}
</label>
