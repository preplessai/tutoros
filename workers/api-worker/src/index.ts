import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handleGenerateWeeklyPlan } from './handlers/generate-weekly-plan';
import { handleAdjustPlan } from './handlers/adjust-plan';
import { handleGenerateDayPlan } from './handlers/generate-day-plan';
import { handleSearchResources } from './handlers/search-resources';

const app = new Hono();

// CORS — allow requests from the static site
app.use('*', cors({
	origin: ['http://localhost:5173', 'http://localhost:4173', 'https://tutoros.pages.dev'],
	allowMethods: ['POST', 'OPTIONS'],
	allowHeaders: ['Content-Type'],
	maxAge: 86400
}));

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
