export async function handleCreatePortalSession(
	request: Request,
	env: Record<string, string>
): Promise<Response> {
	try {
		const supabaseUrl = env['SUPABASE_URL'] || '';
		const anonKey = env['SUPABASE_ANON_KEY'] || '';
		const serviceKey = env['SUPABASE_SERVICE_ROLE_KEY'] || '';
		const appUrl = env['APP_URL'] || 'http://localhost:5173';

		// Extract user from auth
		const authHeader = request.headers.get('Authorization') || '';
		const token = authHeader.replace(/^Bearer\s+/i, '');

		let userId = '';
		if (token && supabaseUrl && anonKey) {
			const userResp = await fetch(`${supabaseUrl}/auth/v1/user`, {
				headers: { Authorization: `Bearer ${token}`, apikey: anonKey }
			});
			if (userResp.ok) {
				const user = (await userResp.json()) as { id: string };
				userId = user.id;
			}
		}

		if (!userId) {
			return Response.json({ error: 'User not authenticated' }, { status: 401 });
		}

		// Get stripe_customer_id
		let customerId = '';
		if (serviceKey && supabaseUrl) {
			const profileResp = await fetch(
				`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=stripe_customer_id`,
				{ headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
			);
			if (profileResp.ok) {
				const profiles = (await profileResp.json()) as Array<{ stripe_customer_id: string | null }>;
				if (profiles.length > 0 && profiles[0].stripe_customer_id) {
					customerId = profiles[0].stripe_customer_id;
				}
			}
		}

		if (!customerId) {
			return Response.json(
				{ error: 'No Stripe customer found. Make a purchase first.' },
				{ status: 400 }
			);
		}

		// Import Stripe dynamically — actually we need the stripe client
		const { createStripeClient } = await import('../lib/stripe');
		const stripe = createStripeClient(env);

		const session = await stripe.billingPortal.sessions.create({
			customer: customerId,
			return_url: `${appUrl}/dashboard/settings`
		});

		return Response.json({ url: session.url });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Unknown error';
		console.error('[create-portal-session]', message);
		return Response.json({ error: message }, { status: 500 });
	}
}
