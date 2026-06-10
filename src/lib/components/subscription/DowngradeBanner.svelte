<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { planStore } from '$lib/stores/plan.svelte';
	import { supabase } from '$lib/lib/supabase';
	import { downloadJson } from '$lib/lib/export';

	let daysRemaining = $state(0);
	let periodEnd = $state('');
	let truncationDate = $state('');
	let exportLoading = $state(false);

	$effect(() => {
		const p = auth.profile;
		if (p?.downgraded_at && p?.data_truncation_date) {
			const now = new Date();
			const trunc = new Date(p.data_truncation_date);
			const diff = Math.ceil((trunc.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
			daysRemaining = Math.max(0, diff);

			if (p.subscription_period_end) {
				periodEnd = new Date(p.subscription_period_end).toLocaleDateString('en-US', {
					year: 'numeric', month: 'long', day: 'numeric'
				});
			}
			truncationDate = trunc.toLocaleDateString('en-US', {
				year: 'numeric', month: 'long', day: 'numeric'
			});
		}
	});

	async function downloadAllData() {
		exportLoading = true;
		try {
			await planStore.fetchAll();
			const allPlans = planStore.plans;

			// Fetch full data for each plan and export as combined JSON
			const exports: any[] = [];
			for (const plan of allPlans) {
				// Fetch weeks
				const { data: weeks } = await supabase.from('plan_weeks').select('*').eq('plan_id', plan.id).order('week_number');
				if (!weeks) continue;

				const weeksData = [];
				for (const week of weeks) {
					const { data: days } = await supabase.from('plan_days').select('*').eq('week_id', week.id).order('date');
					if (!days) continue;

					const daysData = [];
					for (const day of days) {
						const { data: tasks } = await supabase.from('plan_tasks').select('*').eq('day_id', day.id).order('sort_order');
						daysData.push({ ...day, tasks: tasks || [] });
					}
					weeksData.push({ ...week, days: daysData });
				}
				exports.push({
					plan: { id: plan.id, title: plan.title, grade: plan.grade, subjects: plan.subjects },
					weeks: weeksData
				});
			}

			const json = JSON.stringify({
				type: 'data_export',
				exported_at: new Date().toISOString(),
				plans: exports
			}, null, 2);

			downloadJson(json, `prepless-data-export-${new Date().toISOString().split('T')[0]}.json`);

			const { toast } = await import('$lib/stores/toast.svelte');
			toast.success('All data exported successfully');
		} catch (err: unknown) {
			const { toast } = await import('$lib/stores/toast.svelte');
			toast.error('Export failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
		} finally {
			exportLoading = false;
		}
	}

	let dismissed = $state(false);
</script>

{#if !dismissed && auth.profile?.downgraded_at && daysRemaining >= 0}
	<div class="rounded-xl border-2 border-[var(--color-warning)] bg-[var(--color-warning-bg)] p-4 md:p-5">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
			<div class="flex items-start gap-3">
				<svg class="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-warning)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
				</svg>
				<div>
					<p class="font-semibold text-[var(--color-text-primary)]">
						Subscription canceled
					</p>
					{#if daysRemaining > 0}
						<p class="mt-1 text-sm text-[var(--color-text-secondary)]">
							Your access continues until <strong>{periodEnd}</strong>.
							After that, your data will be trimmed to fit the free tier limits on <strong>{truncationDate}</strong>
							({daysRemaining} days remaining after period end).
							Download your data now to avoid losing anything.
						</p>
					{:else}
						<p class="mt-1 text-sm text-[var(--color-text-secondary)]">
							Your grace period has ended. Some of your data may have been trimmed to fit free tier limits.
						</p>
					{/if}
				</div>
			</div>
			<div class="flex items-center gap-2 sm:shrink-0">
				{#if daysRemaining > 0}
					<Button variant="secondary" size="sm" onclick={downloadAllData} loading={exportLoading}>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
						Download Data
					</Button>
					<Button variant="gradient" size="sm" href="/pricing">
						Reactivate
					</Button>
				{:else}
					<Button variant="gradient" size="sm" href="/pricing">
						Upgrade Again
					</Button>
				{/if}
				<button
					onclick={() => dismissed = true}
					class="rounded-lg p-1.5 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)]"
					aria-label="Dismiss"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		</div>
	</div>
{/if}
