<script lang="ts">
	import type { WeeklyPlan } from '$lib/lib/types';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { formatDateShort } from '$lib/lib/date';

	let { plan, onclick }: { plan: WeeklyPlan; onclick?: () => void } = $props();
</script>

<Card {onclick} hover>
	<div class="flex items-start justify-between gap-3">
		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-2 mb-1">
				<h3 class="font-semibold text-[var(--color-text-primary)] truncate">{plan.title}</h3>
				<Badge variant={plan.status === 'active' ? 'success' : 'default'}>{plan.status}</Badge>
			</div>
			<p class="text-sm text-[var(--color-text-secondary)]">{plan.grade} • {plan.subjects.slice(0, 3).join(', ')}</p>
			<div class="flex items-center gap-3 mt-3 text-xs text-[var(--color-text-tertiary)]">
				<span>{formatDateShort(plan.start_date)} — {formatDateShort(plan.end_date)}</span>
				<span>{plan.time_per_session}min × {plan.sessions_per_week}/wk</span>
			</div>
		</div>
		<svg class="h-5 w-5 text-[var(--color-text-tertiary)] shrink-0 mt-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
	</div>
</Card>
