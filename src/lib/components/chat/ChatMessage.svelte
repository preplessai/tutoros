<script lang="ts">
	let { role, content }: { role: 'user' | 'assistant'; content: string } = $props();
</script>

<div
	class="max-w-[80%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap
	{role === 'user'
		? 'ml-auto rounded-br-sm bg-[var(--color-primary-100)] text-[var(--color-primary-700)]'
		: 'mr-auto rounded-bl-sm bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)]'}"
>
	{content}
</div>
