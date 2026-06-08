<script lang="ts">
	let {
		label,
		name,
		value = '',
		error = '',
		required = false,
		onchange
	}: Record<string, any> = $props();
</script>

<div class="space-y-1.5">
	{#if label}
		<label for={name} class="block text-sm font-medium text-[var(--color-text-primary)]">
			{label}
			{#if required}<span class="ml-0.5 text-[var(--color-error)]">*</span>{/if}
		</label>
	{/if}
	<input
		type="date"
		{name}
		id={name}
		{value}
		{required}
		{onchange}
		class="w-full clay-input text-sm
			{error ? '!border-[var(--color-error)] focus:!border-[var(--color-error)]' : ''}"
	/>
	{#if error}
		<p class="text-sm text-[var(--color-error)]">{error}</p>
	{/if}
</div>
