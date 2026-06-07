import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authenticate } from './lib/auth';
import { handleGenerateWeeklyPlan } from './handlers/generate-weekly-plan';
import { handleAdjustPlan } from './handlers/adjust-plan';
import { handleGenerateDayPlan } from './handlers/generate-day-plan';
import { handleSearchResources } from './handlers/search-resources';

const app = new Hono();

// CORS — allow requests from the static site
app.use('*', cors({
	origin: ['http://localhost:5173', 'http://localhost:4173', 'https://prepless-ai.pages.dev'],
	allowMethods: ['GET', 'POST', 'OPTIONS'],
	allowHeaders: ['Content-Type', 'Authorization'],
	maxAge: 86400
}));

// Auth middleware — applied to all /api/* routes
app.use('/api/*', async (c, next) => {
	// Skip auth for health check
	if (c.req.path === '/api/health') return next();

	const user = await authenticate(c.req.raw);
	if (!user) {
		return c.json({ error: 'Unauthorized — valid Supabase token required' }, 401);
	}

	// Attach user to request context
	(c as any).set('userId', user.userId);
	(c as any).set('userEmail', user.email);
	return next();
});

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok' }));

// AI endpoints
app.post('/api/generate-weekly-plan', async (c) => handleGenerateWeeklyPlan(c.req.raw));
app.post('/api/adjust-plan', async (c) => handleAdjustPlan(c.req.raw));
app.post('/api/generate-day-plan', async (c) => handleGenerateDayPlan(c.req.raw));
app.post('/api/search-resources', async (c) => handleSearchResources(c.req.raw));

// 404
app.all('*', (c) => c.json({ error: 'Not found' }, 404));

export default app;
