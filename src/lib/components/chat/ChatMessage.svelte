<script lang="ts">
	let { role, content }: { role: 'user' | 'assistant'; content: string } = $props();
</script>

<div
	class="max-w-[80%] px-4 py-2.5 text-sm whitespace-pre-wrap rounded-xl
	{role === 'user'
		? 'ml-auto bg-[var(--color-primary-100)] text-[var(--color-primary-700)] rounded-br-sm'
		: 'mr-auto bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] rounded-bl-sm'}"
>
	{content}
</div>
