import { PUBLIC_STRIPE_WORKER_URL } from '$env/static/public';
import { supabase } from './supabase';

const BASE_URL = PUBLIC_STRIPE_WORKER_URL || 'http://localhost:8788';

async function getAuthHeaders(): Promise<Record<string, string>> {
	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	try {
		const { data } = await supabase.auth.getSession();
		const token = data.session?.access_token;
		if (token) {
			headers['Authorization'] = `Bearer ${token}`;
		}
	} catch {
		/* unauthenticated — let worker reject if required */
	}
	return headers;
}

async function post<T>(path: string, body: unknown): Promise<T> {
	const headers = await getAuthHeaders();
	const res = await fetch(`${BASE_URL}${path}`, {
		method: 'POST',
		headers,
		body: JSON.stringify(body)
	});

	if (!res.ok) {
		const err = await res.json().catch(() => ({ error: res.statusText }));
		throw new Error(err.error || `Request failed with status ${res.status}`);
	}

	return res.json();
}

export const stripeApi = {
	createCheckoutSession(params: {
		mode: 'subscription' | 'payment';
		priceId?: string;
		creditPack?: string;
		tier?: string;
	}): Promise<{ url: string }> {
		return post('/api/stripe/create-checkout-session', params);
	},

	createPortalSession(): Promise<{ url: string }> {
		return post('/api/stripe/create-portal-session', {});
	}
};
