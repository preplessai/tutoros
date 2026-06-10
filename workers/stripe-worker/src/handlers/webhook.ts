import { createStripeClient, supabasePatch, supabaseRpc } from '../lib/stripe';

export async function handleWebhook(
  request: Request,
  env: Record<string, string>
): Promise<Response> {
  try {
    const stripe = createStripeClient(env);
    const webhookSecret = env['STRIPE_WEBHOOK_SECRET'] || '';
    const signature = request.headers.get('stripe-signature') || '';

    if (!webhookSecret) {
      console.error('[webhook] STRIPE_WEBHOOK_SECRET not set');
      return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const payload = await request.text();

    let event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[webhook] Signature verification failed:', message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const supabaseUrl = env['SUPABASE_URL'] || '';
    const serviceKey = env['SUPABASE_SERVICE_ROLE_KEY'] || '';

    if (!supabaseUrl || !serviceKey) {
      console.error('[webhook] Supabase config missing');
      return Response.json({ error: 'Server config missing' }, { status: 500 });
    }

    console.log(`[webhook] Processing event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.client_reference_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string | undefined;
        const metadata = session.metadata || {};
        const sessionId = session.id;

        if (!userId) {
          console.log('[webhook] No client_reference_id, skipping');
          break;
        }

        // Idempotency check — see if we already processed this session
        const checkResp = await fetch(
          `${supabaseUrl}/rest/v1/purchases?stripe_session_id=eq.${sessionId}&select=id`,
          { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
        );
        if (checkResp.ok) {
          const existing = await checkResp.json() as Array<{ id: string }>;
          if (existing.length > 0) {
            console.log(`[webhook] Session ${sessionId} already processed, skipping`);
            break;
          }
        }

        if (metadata.type === 'subscription') {
          // Update profile with subscription info
          const subscription = subscriptionId
            ? await stripe.subscriptions.retrieve(subscriptionId).catch(() => null)
            : null;

          await supabasePatch(supabaseUrl, serviceKey, 'profiles', userId, {
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_tier: metadata.tier || 'pro',
            subscription_status: subscription?.status || 'active',
            subscription_period_end: subscription ? new Date(subscription.current_period_end * 1000).toISOString() : null,
            cancel_at_period_end: false
          });

          // Grant monthly credits
          const creditsAmount = parseInt(env[`CREDITS_${(metadata.tier || 'pro').toUpperCase()}`] || '30');
          await supabaseRpc(supabaseUrl, serviceKey, 'refresh_credits', {
            p_user_id: userId,
            p_amount: creditsAmount
          });

          // Record purchase
          await fetch(`${supabaseUrl}/rest/v1/purchases`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: serviceKey,
              Authorization: `Bearer ${serviceKey}`,
              Prefer: 'return=minimal'
            },
            body: JSON.stringify({
              user_id: userId,
              stripe_session_id: sessionId,
              amount: session.amount_total || 0,
              currency: session.currency || 'usd',
              type: 'subscription',
              description: `${metadata.tier} subscription`,
              credits_added: creditsAmount,
              metadata
            })
          });
        } else if (metadata.type === 'credit_pack') {
          // Add non-expiring credits
          const credits = parseFloat(metadata.credits || '0');
          await supabaseRpc(supabaseUrl, serviceKey, 'add_credits', {
            p_user_id: userId,
            p_amount: credits,
            p_category: 'non_expiring',
            p_reason: `stripe_purchase_${sessionId}`
          });

          // Update customer ID if not set
          await supabasePatch(supabaseUrl, serviceKey, 'profiles', userId, {
            stripe_customer_id: customerId
          });

          // Record purchase
          await fetch(`${supabaseUrl}/rest/v1/purchases`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: serviceKey,
              Authorization: `Bearer ${serviceKey}`,
              Prefer: 'return=minimal'
            },
            body: JSON.stringify({
              user_id: userId,
              stripe_session_id: sessionId,
              stripe_payment_intent_id: session.payment_intent as string || null,
              amount: session.amount_total || 0,
              currency: session.currency || 'usd',
              type: 'credit_pack',
              description: `${credits} credit pack`,
              credits_added: credits,
              metadata
            })
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        const status = subscription.status;
        const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
        const cancelAtPeriodEnd = subscription.cancel_at_period_end;

        // Find user by stripe_customer_id
        const profileResp = await fetch(
          `${supabaseUrl}/rest/v1/profiles?stripe_customer_id=eq.${customerId}&select=id,cancel_at_period_end`,
          { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
        );
        if (!profileResp.ok) break;
        const profiles = await profileResp.json() as Array<{ id: string; cancel_at_period_end: boolean }>;
        if (profiles.length === 0) break;

        const userId = profiles[0].id;
        const wasCanceling = profiles[0].cancel_at_period_end;

        const updates: Record<string, unknown> = {
          subscription_status: status,
          subscription_period_end: periodEnd,
          cancel_at_period_end: cancelAtPeriodEnd
        };

        // If subscription just set to cancel at period end (user initiated cancellation)
        if (cancelAtPeriodEnd && !wasCanceling) {
          updates['downgraded_at'] = new Date().toISOString();
          // 14 days after period end
          const truncationDate = new Date(subscription.current_period_end * 1000);
          truncationDate.setDate(truncationDate.getDate() + 14);
          updates['data_truncation_date'] = truncationDate.toISOString();
        }

        // If user re-enabled (cancel_at_period_end changed from true to false)
        if (!cancelAtPeriodEnd && wasCanceling) {
          updates['downgraded_at'] = null;
          updates['data_truncation_date'] = null;
        }

        await supabasePatch(supabaseUrl, serviceKey, 'profiles', userId, updates);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        // Find user
        const profileResp = await fetch(
          `${supabaseUrl}/rest/v1/profiles?stripe_customer_id=eq.${customerId}&select=id`,
          { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
        );
        if (!profileResp.ok) break;
        const profiles = await profileResp.json() as Array<{ id: string }>;
        if (profiles.length === 0) break;

        const userId = profiles[0].id;

        // Set to free tier with grace period
        const truncationDate = new Date();
        truncationDate.setDate(truncationDate.getDate() + 14);

        await supabasePatch(supabaseUrl, serviceKey, 'profiles', userId, {
          subscription_tier: 'free',
          subscription_status: 'canceled',
          cancel_at_period_end: false,
          downgraded_at: new Date().toISOString(),
          data_truncation_date: truncationDate.toISOString()
        });
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const customerId = invoice.customer as string;
        const subscriptionId = invoice.subscription as string | undefined;

        if (!subscriptionId) break;

        // Find user
        const profileResp = await fetch(
          `${supabaseUrl}/rest/v1/profiles?stripe_customer_id=eq.${customerId}&select=id,subscription_tier`,
          { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
        );
        if (!profileResp.ok) break;
        const profiles = await profileResp.json() as Array<{ id: string; subscription_tier: string }>;
        if (profiles.length === 0) break;

        const userId = profiles[0].id;
        const tier = profiles[0].subscription_tier;

        // Refresh credits for the new billing period
        if (tier !== 'free') {
          const creditsAmount = parseInt(env[`CREDITS_${tier.toUpperCase()}`] || (tier === 'enterprise' ? '100' : '30'));
          await supabaseRpc(supabaseUrl, serviceKey, 'refresh_credits', {
            p_user_id: userId,
            p_amount: creditsAmount
          });
        }

        // Update period end from invoice
        if (invoice.period_end) {
          await supabasePatch(supabaseUrl, serviceKey, 'profiles', userId, {
            subscription_period_end: new Date(invoice.period_end * 1000).toISOString()
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer as string;

        const profileResp = await fetch(
          `${supabaseUrl}/rest/v1/profiles?stripe_customer_id=eq.${customerId}&select=id`,
          { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
        );
        if (!profileResp.ok) break;
        const profiles = await profileResp.json() as Array<{ id: string }>;
        if (profiles.length === 0) break;

        await supabasePatch(supabaseUrl, serviceKey, 'profiles', profiles[0].id, {
          subscription_status: 'past_due'
        });
        break;
      }

      default:
        console.log(`[webhook] Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[webhook]', message);
    return Response.json({ error: message }, { status: 500 });
  }
}
