<script lang="ts">
	import type { Student } from '$lib/lib/types';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';

	let { student, onclick }: { student: Student; onclick?: () => void } = $props();
</script>

<Card {onclick} hover>
	<div class="flex items-start justify-between gap-4">
		<div class="flex-1 min-w-0">
			<h3 class="font-semibold text-[var(--color-text-primary)] truncate">{student.name}</h3>
			<p class="text-sm text-[var(--color-text-secondary)] mt-0.5">{student.grade}</p>
			<div class="flex flex-wrap gap-1 mt-3">
				{#each student.subjects.slice(0, 4) as subject}
					<Badge variant="primary">{subject}</Badge>
				{/each}
				{#if student.subjects.length > 4}
					<Badge>+{student.subjects.length - 4}</Badge>
				{/if}
			</div>
		</div>
		<svg class="h-5 w-5 text-[var(--color-text-tertiary)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
	</div>
</Card>
