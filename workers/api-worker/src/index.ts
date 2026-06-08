import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authenticate } from './lib/auth';
import { handleGenerateWeeklyPlan } from './handlers/generate-weekly-plan';
import { handleAdjustPlan } from './handlers/adjust-plan';
import { handleGenerateDayPlan } from './handlers/generate-day-plan';
import { handleSearchResources } from './handlers/search-resources';

const app = new Hono();

// CORS — reflect request origin for auth-gated endpoints
app.use(
	'*',
	cors({
		origin: (origin) => {
			// Allow localhost, common dev ports, and any prepless domain
			const allowed = ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:8787'];
			if (allowed.includes(origin)) return origin;
			// Allow any prepless-ai domain (pages.dev, custom domains)
			if (origin.includes('prepless')) return origin;
			// Allow any origin in development; in production, restrict as needed
			return origin;
		},
		allowMethods: ['GET', 'POST', 'OPTIONS'],
		allowHeaders: ['Content-Type', 'Authorization'],
		maxAge: 86400
	})
);

// Auth middleware — applied to all /api/* routes
app.use('/api/*', async (c, next) => {
	// Skip auth for health check and debug
	if (c.req.path === '/api/health' || c.req.path === '/api/debug') return next();

	const user = await authenticate(c.req.raw, c.env as Record<string, string>);
	if (!user) {
		return c.json({ error: 'Unauthorized — valid Supabase token required' }, 401);
	}

	// Attach user to request context
	(c as any).set('userId', user.userId);
	(c as any).set('userEmail', user.email || '');
	return next();
});

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok' }));

// Debug — verify env vars and Supabase connectivity
app.get('/api/debug', async (c) => {
	const env = c.env as Record<string, string>;
	const supabaseUrl = env['SUPABASE_URL'] || '';
	const anonKey = env['SUPABASE_ANON_KEY'] || '';
	const groqKey = env['GROQ_API_KEY_1'] || '';
	const deepseekKey = env['SK_API_KEY_DEV'] || '';

	let authStatus = 'not checked';
	if (supabaseUrl && anonKey) {
		try {
			// Test the actual endpoint we use for auth validation
			const resp = await fetch(`${supabaseUrl}/auth/v1/user`, {
				headers: { apikey: anonKey }
			});
			// Without a token, this should return 401 or 403 — that's fine, it means the endpoint is reachable
			authStatus = `reachable (${resp.status})`;
		} catch (e: any) {
			authStatus = `error: ${e.message}`;
		}
	}

	return c.json({
		env: {
			SUPABASE_URL: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NOT SET',
			SUPABASE_ANON_KEY: anonKey ? 'SET (length ' + anonKey.length + ')' : 'NOT SET',
			GROQ_API_KEY_1: groqKey ? 'SET (length ' + groqKey.length + ')' : 'NOT SET',
			SK_API_KEY_DEV: deepseekKey ? 'SET (length ' + deepseekKey.length + ')' : 'NOT SET'
		},
		authEndpoint: authStatus
	});
});

// AI endpoints — pass env so handlers can access API keys
app.post('/api/generate-weekly-plan', async (c) =>
	handleGenerateWeeklyPlan(c.req.raw, c.env as Record<string, string>)
);
app.post('/api/adjust-plan', async (c) =>
	handleAdjustPlan(c.req.raw, c.env as Record<string, string>)
);
app.post('/api/generate-day-plan', async (c) =>
	handleGenerateDayPlan(c.req.raw, c.env as Record<string, string>)
);
app.post('/api/search-resources', async (c) =>
	handleSearchResources(c.req.raw, c.env as Record<string, string>)
);

// 404
app.all('*', (c) => c.json({ error: 'Not found' }, 404));

export default app;
