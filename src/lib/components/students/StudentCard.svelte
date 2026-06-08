<script lang="ts">
	import type { Student } from '$lib/lib/types';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';

	let { student, onclick }: { student: Student; onclick?: () => void } = $props();
</script>

<Card {onclick} hover>
	<div class="flex items-start justify-between gap-4">
		<div class="min-w-0 flex-1">
			<h3 class="truncate font-semibold text-[var(--color-text-primary)]">{student.name}</h3>
			<p class="mt-0.5 text-sm text-[var(--color-text-secondary)]">{student.grade}</p>
			<div class="mt-3 flex flex-wrap gap-1">
				{#each student.subjects.slice(0, 4) as subject}
					<Badge variant="primary">{subject}</Badge>
				{/each}
				{#if student.subjects.length > 4}
					<Badge>+{student.subjects.length - 4}</Badge>
				{/if}
			</div>
		</div>
		<svg
			class="h-5 w-5 shrink-0 text-[var(--color-text-tertiary)]"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			><path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M9 5l7 7-7 7"
			/></svg
		>
	</div>
</Card>
