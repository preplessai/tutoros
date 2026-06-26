import { supabase } from '$lib/lib/supabase';
import { auth } from './auth.svelte';
import { toast } from './toast.svelte';
import { SUBSCRIPTION_TIERS } from '$lib/lib/constants';

let nonExpiring = $state(0);
let refreshing = $state(0);
let loading = $state(false);

export const creditStore = {
	get nonExpiring() {
		return nonExpiring;
	},
	get refreshing() {
		return refreshing;
	},
	get total() {
		return nonExpiring + refreshing;
	},
	get loading() {
		return loading;
	},

	async fetch() {
		if (!auth.user?.id) return;
		loading = true;
		try {
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
						const tierConfig =
							SUBSCRIPTION_TIERS[data.subscription_tier as keyof typeof SUBSCRIPTION_TIERS];
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
		} catch {
			nonExpiring = 0;
			refreshing = 0;
		}
		loading = false;
	},

	/**
	 * Deducts credits atomically via RPC. Returns true if deduction succeeded.
	 */
	async useCredits(amount: number, reason: string = 'plan_generation'): Promise<boolean> {
		if (!auth.user?.id) {
			console.error('[credits] useCredits blocked — no auth user');
			return false;
		}

		const params = {
			p_user_id: auth.user.id,
			p_amount: amount,
			p_reason: reason
		};

		try {
			console.log('[credits] Calling use_credits RPC:', JSON.stringify(params));

			const { data: success, error } = await supabase.rpc('use_credits', params);

			if (error) {
				const code = (error as unknown as Record<string, unknown>).code;
				const msg = error.message;
				const details = (error as unknown as Record<string, unknown>).details;
				const hint = (error as unknown as Record<string, unknown>).hint;

				console.error('[credits] RPC error:', { code, message: msg, details, hint });

				if (code === 'PGRST202') {
					toast.error(
						'Credits system not configured. Run migration 003_credits_system.sql in the Supabase SQL Editor.'
					);
				} else if (msg?.includes('syntax')) {
					toast.error(`Credit system error. Check Supabase logs. Code: ${code}`);
				} else {
					toast.error(`Credit operation failed: ${msg} (${code || 'unknown'})`);
				}
				return false;
			}

			if (success) {
				await this.fetch();
				return true;
			}

			toast.error('Insufficient credits. Upgrade your plan or purchase more credits.');
			return false;
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Unknown error';
			console.error('[credits] Exception:', err);
			toast.error('Credit check failed: ' + message);
			return false;
		}
	},

	/**
	 * Check if user has enough credits without deducting.
	 */
	hasEnough(amount: number): boolean {
		return nonExpiring + refreshing >= amount;
	},

	/**
	 * Fetch latest credits then check if user has enough.
	 */
	async hasEnoughAfterFetch(amount: number): Promise<boolean> {
		await this.fetch();
		return this.hasEnough(amount);
	}
};
