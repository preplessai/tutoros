import { supabase } from '$lib/lib/supabase';
import { auth } from './auth.svelte';
import { toast } from './toast.svelte';
import { SUBSCRIPTION_TIERS } from '$lib/lib/constants';

let nonExpiring = $state(0);
let refreshing = $state(0);
let loading = $state(false);

export const creditStore = {
	get nonExpiring() { return nonExpiring; },
	get refreshing() { return refreshing; },
	get total() { return nonExpiring + refreshing; },
	get loading() { return loading; },

	async fetch() {
		if (!auth.user?.id) return;
		loading = true;
		const { data } = await supabase
			.from('profiles')
			.select('non_expiring_credits, refreshing_credits, refreshing_reset_at, subscription_tier')
			.eq('id', auth.user.id)
			.single();

		if (data) {
			// Auto-refresh credits if subscription-based and reset time passed
			if (data.subscription_tier !== 'free' && data.refreshing_reset_at) {
				const resetAt = new Date(data.refreshing_reset_at);
				if (resetAt <= new Date()) {
					const tierConfig = SUBSCRIPTION_TIERS[data.subscription_tier as keyof typeof SUBSCRIPTION_TIERS];
					const refreshAmount = tierConfig?.monthlyCredits || 30;
					await supabase.rpc('refresh_credits', {
						p_user_id: auth.user.id,
						p_amount: refreshAmount
					});
					// Re-fetch after refresh
					const { data: refreshed } = await supabase
						.from('profiles')
						.select('non_expiring_credits, refreshing_credits')
						.eq('id', auth.user.id)
						.single();
					if (refreshed) {
						nonExpiring = refreshed.non_expiring_credits || 0;
						refreshing = refreshed.refreshing_credits || 0;
						loading = false;
						return;
					}
				}
			}
			nonExpiring = data.non_expiring_credits || 0;
			refreshing = data.refreshing_credits || 0;
		}
		loading = false;
	},

	/**
	 * Check if user has enough credits. Deducts refreshing first, then non-expiring.
	 * Returns true if deduction succeeded, false if insufficient credits.
	 */
	async useCredits(amount: number, reason: string = 'plan_generation'): Promise<boolean> {
		if (!auth.user?.id) return false;

		try {
			const { data: success, error } = await supabase.rpc('use_credits', {
				p_user_id: auth.user.id,
				p_amount: amount,
				p_reason: reason
			});

			if (error) throw error;

			if (success) {
				// Optimistic local update — re-fetch to stay accurate
				await this.fetch();
				return true;
			}

			toast.error('Insufficient credits. Please upgrade or purchase more credits.');
			return false;
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Unknown error';
			toast.error('Credit check failed: ' + message);
			return false;
		}
	},

	/**
	 * Check if user has enough credits without deducting.
	 */
	hasEnough(amount: number): boolean {
		return nonExpiring + refreshing >= amount;
	}
};
