<script lang="ts">
	let { label, name, value = '', placeholder = 'Select...', options = [], error = '', hint = '', required = false, disabled = false, onchange }: {
		label?: string;
		name: string;
		value?: string;
		placeholder?: string;
		options: { value: string; label: string }[];
		error?: string;
		hint?: string;
		required?: boolean;
		disabled?: boolean;
		onchange?: (e: Event) => void;
	} = $props();
</script>

<div class="space-y-1.5">
	{#if label}
		<label for={name} class="block text-sm font-medium text-[var(--color-text-primary)]">
			{label}
			{#if required}<span class="text-[var(--color-error)] ml-0.5">*</span>{/if}
		</label>
	{/if}
	<select
		{name}
		id={name}
		{disabled}
		{required}
		{onchange}
		class="clay-input w-full text-sm appearance-none
			disabled:opacity-50 disabled:pointer-events-none
			bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%238B7E74%22%20d%3D%22M6%208L1%203h10z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.75rem] bg-[right_0.75rem_center] bg-no-repeat
			{error ? '!border-[var(--color-error)] focus:!border-[var(--color-error)]' : ''}"
	>
		<option value="" disabled>{placeholder}</option>
		{#each options as opt}
			<option value={opt.value} selected={opt.value === value}>{opt.label}</option>
		{/each}
	</select>
	{#if error}
		<p class="text-sm text-[var(--color-error)]">{error}</p>
	{:else if hint}
		<p class="text-sm text-[var(--color-text-tertiary)]">{hint}</p>
	{/if}
</div>
