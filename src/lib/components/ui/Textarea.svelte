<script lang="ts">
	let { label, name, value = '', placeholder = '', error = '', hint = '', rows = 4, required = false, disabled = false, onchange, oninput }: Record<string, any> = $props();
</script>

<div class="space-y-1.5">
	{#if label}
		<label for={name} class="block text-sm font-medium text-[var(--color-text-primary)]">
			{label}
			{#if required}<span class="text-[var(--color-error)] ml-0.5">*</span>{/if}
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
		class="clay-input w-full text-sm resize-y
			disabled:opacity-50 disabled:pointer-events-none
			{error ? '!border-[var(--color-error)] focus:!border-[var(--color-error)]' : ''}"
	>{value}</textarea>
	{#if error}
		<p class="text-sm text-[var(--color-error)]">{error}</p>
	{:else if hint}
		<p class="text-sm text-[var(--color-text-tertiary)]">{hint}</p>
	{/if}
</div>
