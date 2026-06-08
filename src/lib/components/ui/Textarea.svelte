<script lang="ts">
	let {
		label,
		name,
		value = $bindable(''),
		placeholder = '',
		error = '',
		hint = '',
		rows = 4,
		required = false,
		disabled = false,
		onchange,
		oninput,
		...rest
	} = $props();
</script>

<div class="space-y-1.5">
	{#if label}
		<label for={name} class="block text-sm font-medium text-[var(--color-text-primary)]">
			{label}
			{#if required}<span class="ml-0.5 text-[var(--color-error)]">*</span>{/if}
		</label>
	{/if}
	<textarea
		{name}
		id={name}
		{placeholder}
		{rows}
		{disabled}
		{required}
		{onchange}
		{oninput}
		class="w-full resize-y clay-input text-sm
			disabled:pointer-events-none disabled:opacity-50
			{error ? '!border-[var(--color-error)] focus:!border-[var(--color-error)]' : ''}">{value}</textarea
	>
	{#if error}
		<p class="text-sm text-[var(--color-error)]">{error}</p>
	{:else if hint}
		<p class="text-sm text-[var(--color-text-tertiary)]">{hint}</p>
	{/if}
</div>
