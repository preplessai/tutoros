<script lang="ts">
	let { label, name, value = '', error = '', required = false, onchange }: Record<string, any> = $props();
</script>

<div class="space-y-1.5">
	{#if label}
		<label for={name} class="block text-sm font-medium text-[var(--color-text-primary)]">
			{label}
			{#if required}<span class="text-[var(--color-error)] ml-0.5">*</span>{/if}
		</label>
	{/if}
	<input
		type="date"
		{name}
		id={name}
		{value}
		{required}
		{onchange}
		class="clay-input w-full text-sm
			{error ? '!border-[var(--color-error)] focus:!border-[var(--color-error)]' : ''}"
	/>
	{#if error}
		<p class="text-sm text-[var(--color-error)]">{error}</p>
	{/if}
</div>
