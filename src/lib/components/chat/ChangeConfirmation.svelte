<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';

	let {
		proposal,
		loading = false,
		onapprove,
		onreject
	}: {
		proposal: import('$lib/lib/types').PlanChangeProposal;
		loading?: boolean;
		onapprove?: () => void;
		onreject?: () => void;
	} = $props();
</script>

<Card>
	<div class="space-y-4">
		<h3 class="text-sm font-semibold text-[var(--color-text-primary)]">
			Proposed Change: {proposal.type.replace(/_/g, ' ')}
		</h3>

		<p class="text-sm text-[var(--color-text-secondary)]">
			{proposal.description}
		</p>

		{#if proposal.mutations.length > 0}
			<div class="space-y-2">
				<h4 class="text-xs font-medium tracking-wider text-[var(--color-text-tertiary)] uppercase">
					Changes ({proposal.mutations.length})
				</h4>

				{#each proposal.mutations as mutation}
					<div class="space-y-1 rounded-lg bg-[var(--color-surface-secondary)] p-3 text-xs">
						<div class="flex items-center gap-2">
							<span
								class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
								{mutation.action === 'update'
									? 'bg-[var(--color-warning-100)] text-[var(--color-warning-700)]'
									: 'bg-[var(--color-primary-100)] text-[var(--color-primary-700)]'}"
							>
								{mutation.action === 'update' ? 'Update' : 'Insert'}
							</span>
							<span class="font-medium text-[var(--color-text-primary)]">
								{mutation.table}
							</span>
						</div>
						<div class="text-[var(--color-text-secondary)]">
							{#each Object.entries(mutation.data) as [key, value]}
								<div class="flex gap-2">
									<span class="min-w-20 font-medium text-[var(--color-text-tertiary)]">{key}:</span>
									<span class="truncate"
										>{typeof value === 'string' ? value : JSON.stringify(value)}</span
									>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<div class="flex justify-end gap-3 pt-2">
			<Button variant="ghost" onclick={onreject} disabled={loading}>Reject</Button>
			<Button variant="gradient" onclick={onapprove} {loading}>Approve</Button>
		</div>
	</div>
</Card>
