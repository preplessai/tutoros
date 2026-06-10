import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authenticate } from './lib/auth';
import { handleCreateCheckoutSession } from './handlers/create-checkout-session';
import { handleCreatePortalSession } from './handlers/create-portal-session';
import { handleWebhook } from './handlers/webhook';

const app = new Hono();

// CORS — reflect request origin
app.use('*', cors({
  origin: (origin) => {
    const allowed = [
      'http://localhost:5173',
      'http://localhost:4173',
      'http://localhost:8787'
    ];
    if (allowed.includes(origin)) return origin;
    if (origin.includes('prepless')) return origin;
    return origin;
  },
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
}));

// Webhook — NO auth (Stripe signs the payload)
app.post('/api/stripe/webhook', async (c) => handleWebhook(c.req.raw, c.env as Record<string, string>));

// Auth middleware for all other /api/stripe/* routes
app.use('/api/stripe/*', async (c, next) => {
  // Skip webhook (already handled above)
  if (c.req.path === '/api/stripe/webhook') return next();

  const env = c.env as Record<string, string>;

  // Skip auth in local dev
  if (env['DISABLE_AUTH'] === 'true') {
    (c as any).set('userId', 'dev-user');
    (c as any).set('userEmail', 'dev@localhost');
    return next();
  }

  const user = await authenticate(c.req.raw, env);
  if (!user) {
    return c.json({ error: 'Unauthorized — valid Supabase token required' }, 401);
  }

  (c as any).set('userId', user.userId);
  (c as any).set('userEmail', user.email || '');
  return next();
});

// Checkout endpoints (auth required)
app.post('/api/stripe/create-checkout-session', async (c) => handleCreateCheckoutSession(c.req.raw, c.env as Record<string, string>));
app.post('/api/stripe/create-portal-session', async (c) => handleCreatePortalSession(c.req.raw, c.env as Record<string, string>));

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok' }));

// 404
app.all('*', (c) => c.json({ error: 'Not found' }, 404));

export default app;
