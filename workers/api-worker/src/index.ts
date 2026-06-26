import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authenticate } from './lib/auth';
import { handleGenerateWeeklyPlan } from './handlers/generate-weekly-plan';
import { handleAdjustPlan } from './handlers/adjust-plan';
import { handleGenerateDayPlan } from './handlers/generate-day-plan';
import { handleSearchResources } from './handlers/search-resources';
import { handlePickResources } from './handlers/pick-resources';
import { handlePreplessChat } from './handlers/prepless-chat';
import { handleGenerateEmail } from './handlers/generate-email';

const app = new Hono();

// CORS — reflect request origin for auth-gated endpoints
app.use(
	'*',
	cors({
		origin: (origin) => {
			const allowed = ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:8787'];
			if (allowed.includes(origin)) return origin;
			if (origin.includes('prepless')) return origin;
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

	// Skip auth in local dev (set DISABLE_AUTH=true in .dev.vars)
	if ((c.env as Record<string, string>)['DISABLE_AUTH'] === 'true') {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(c as any).set('userId', 'dev-user');
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(c as any).set('userEmail', 'dev@localhost');
		return next();
	}

	const user = await authenticate(c.req.raw, c.env as Record<string, string>);
	if (!user) {
		return c.json({ error: 'Unauthorized — valid Supabase token required' }, 401);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(c as any).set('userId', user.userId);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
			const resp = await fetch(`${supabaseUrl}/auth/v1/user`, {
				headers: { apikey: anonKey }
			});
			authStatus = `reachable (${resp.status})`;
		} catch (e: unknown) {
			authStatus = `error: ${(e as Error).message}`;
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
app.post('/api/pick-resources', async (c) =>
	handlePickResources(c.req.raw, c.env as Record<string, string>)
);
app.post('/api/prepless-chat', async (c) =>
	handlePreplessChat(c.req.raw, c.env as Record<string, string>)
);
app.post('/api/generate-email', async (c) =>
	handleGenerateEmail(c.req.raw, c.env as Record<string, string>)
);

// 404
app.all('*', (c) => c.json({ error: 'Not found' }, 404));

export default app;
