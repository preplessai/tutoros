import Stripe from 'stripe';

export function createStripeClient(env: Record<string, string>): Stripe {
	const key = env['STRIPE_SECRET_KEY'];
	if (!key) throw new Error('STRIPE_SECRET_KEY not set in environment');
	return new Stripe(key, {
		apiVersion: '2025-02-24.acacia',
		httpClient: Stripe.createFetchHttpClient()
	});
}

// Credit pack definitions — maps dollar amount to credits by tier
export const CREDIT_PACKS: Record<string, { amount: number; credits: Record<string, number> }> = {
	'5': { amount: 500, credits: { free: 4, starter: 6, pro: 7, enterprise: 8 } },
	'10': { amount: 1000, credits: { free: 9, starter: 13, pro: 15, enterprise: 18 } },
	'20': { amount: 2000, credits: { free: 20, starter: 30, pro: 35, enterprise: 40 } }
};

// Supabase REST helpers — calls PostgREST directly with service_role key
export async function supabasePatch(
	supabaseUrl: string,
	serviceRoleKey: string,
	table: string,
	userId: string,
	updates: Record<string, unknown>
): Promise<Response> {
	return fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${userId}`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			apikey: serviceRoleKey,
			Authorization: `Bearer ${serviceRoleKey}`,
			Prefer: 'return=minimal'
		},
		body: JSON.stringify(updates)
	});
}

export async function supabaseRpc(
	supabaseUrl: string,
	serviceRoleKey: string,
	fn: string,
	body: Record<string, unknown>
): Promise<Response> {
	return fetch(`${supabaseUrl}/rest/v1/rpc/${fn}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			apikey: serviceRoleKey,
			Authorization: `Bearer ${serviceRoleKey}`
		},
		body: JSON.stringify(body)
	});
}
