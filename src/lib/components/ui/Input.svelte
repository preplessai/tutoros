<script lang="ts">
	let { label, name, type = 'text', value = '', placeholder = '', error = '', hint = '', required = false, disabled = false, onchange, oninput, ...rest } = $props();
</script>

<div class="space-y-1.5">
	{#if label}
		<label for={name} class="block text-sm font-medium text-[var(--color-text-primary)] font-[family-name:var(--font-body)]">
			{label}
			{#if required}<span class="text-[var(--color-error)] ml-0.5">*</span>{/if}
		</label>
	{/if}
	<input
		{type}
		{name}
		id={name}
		{placeholder}
		{value}
		{disabled}
		{required}
		{onchange}
		{oninput}
		class="clay-input w-full text-sm
			disabled:opacity-50 disabled:pointer-events-none
			{error ? '!border-[var(--color-error)] focus:!border-[var(--color-error)] focus:!ring-[var(--color-error)]/20' : ''}"
		{...rest}
	/>
	{#if error}
		<p class="text-sm text-[var(--color-error)]">{error}</p>
	{:else if hint}
		<p class="text-sm text-[var(--color-text-tertiary)]">{hint}</p>
	{/if}
</div>
