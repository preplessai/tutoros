import { z } from 'zod';
import { createStripeClient, CREDIT_PACKS, supabasePatch } from '../lib/stripe';

const schema = z.object({
  mode: z.enum(['subscription', 'payment']),
  priceId: z.string().optional(),
  creditPack: z.enum(['5', '10', '20']).optional(),
  tier: z.enum(['starter', 'pro', 'enterprise']).optional()
});

export async function handleCreateCheckoutSession(
  request: Request,
  env: Record<string, string>
): Promise<Response> {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }

    const { mode, priceId, creditPack, tier } = parsed.data;
    const stripe = createStripeClient(env);
    const appUrl = env['APP_URL'] || 'http://localhost:5173';

    // Get user info from context (set by auth middleware)
    // Access via request — we stored it differently. Let's use headers instead.
    // The middleware sets these, but we need to access them. Use a custom header or body param.
    // For now, get userId from the request — actually we can't access Hono context from raw handler.
    // Solution: extract from Authorization header directly or get from Hono context.
    // Since we use raw Request, extract userId from auth header:
    const authHeader = request.headers.get('Authorization') || '';
    let userId = '';
    let userEmail = '';

    // We need the userId. Get it from Supabase auth validation
    const supabaseUrl = env['SUPABASE_URL'] || '';
    const anonKey = env['SUPABASE_ANON_KEY'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');

    if (token && supabaseUrl && anonKey) {
      const userResp = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: { Authorization: `Bearer ${token}`, apikey: anonKey }
      });
      if (userResp.ok) {
        const user = await userResp.json() as { id: string; email?: string };
        userId = user.id;
        userEmail = user.email || '';
      }
    }

    if (!userId) {
      return Response.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const successUrl = `${appUrl}/dashboard/settings?checkout=success`;
    const cancelUrl = `${appUrl}/pricing?checkout=canceled`;

    if (mode === 'subscription') {
      if (!tier) {
        return Response.json({ error: 'tier required for subscription mode' }, { status: 400 });
      }

      // Resolve priceId from tier if not provided directly
      const priceEnvKey = tier === 'starter' ? 'STRIPE_PRICE_STARTER'
        : tier === 'pro' ? 'STRIPE_PRICE_PRO'
        : 'STRIPE_PRICE_ENTERPRISE';
      const resolvedPriceId = priceId || env[priceEnvKey];

      if (!resolvedPriceId) {
        return Response.json({ error: `No Stripe Price ID configured for ${tier} tier` }, { status: 500 });
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: resolvedPriceId, quantity: 1 }],
        client_reference_id: userId,
        customer_email: userEmail || undefined,
        metadata: { type: 'subscription', tier },
        success_url: successUrl,
        cancel_url: cancelUrl
      });

      return Response.json({ url: session.url });
    }

    // Payment mode (credit packs)
    if (mode === 'payment') {
      if (!creditPack) {
        return Response.json({ error: 'creditPack required for payment mode' }, { status: 400 });
      }

      const pack = CREDIT_PACKS[creditPack];
      if (!pack) {
        return Response.json({ error: 'Invalid credit pack' }, { status: 400 });
      }

      // Look up user's current tier for bonus credits
      const serviceKey = env['SUPABASE_SERVICE_ROLE_KEY'] || '';
      let userTier = 'free';
      if (serviceKey && supabaseUrl) {
        const profileResp = await fetch(
          `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=subscription_tier`,
          { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
        );
        if (profileResp.ok) {
          const profiles = await profileResp.json() as Array<{ subscription_tier: string }>;
          if (profiles.length > 0) userTier = profiles[0].subscription_tier;
        }
      }

      const credits = pack.credits[userTier] || pack.credits.free;

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${credits} AI Credits`,
              description: `Pack of ${credits} non-expiring AI credits (${userTier} tier bonus)`
            },
            unit_amount: pack.amount
          },
          quantity: 1
        }],
        client_reference_id: userId,
        customer_email: userEmail || undefined,
        metadata: {
          type: 'credit_pack',
          credits: String(credits),
          amount_cents: String(pack.amount),
          credit_pack: creditPack
        },
        success_url: successUrl,
        cancel_url: cancelUrl
      });

      return Response.json({ url: session.url });
    }

    return Response.json({ error: 'Invalid mode' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[create-checkout-session]', message);
    return Response.json({ error: message }, { status: 500 });
  }
}
