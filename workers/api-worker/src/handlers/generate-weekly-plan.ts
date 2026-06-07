import { generateWeeklyPlanSchema } from '../lib/validate';
import { callAI } from '../lib/ai';

// @ts-ignore - wrangler raw text import
import systemPrompt from '../prompts/weekly-plan.txt';

export async function handleGenerateWeeklyPlan(request: Request): Promise<Response> {
	try {
		const body = await request.json();
		const parsed = generateWeeklyPlanSchema.safeParse(body);

		if (!parsed.success) {
			return Response.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
		}

		const input = parsed.data;
		const userMessage = JSON.stringify({
			grade: input.grade,
			subjects: input.subjects,
			timePerSession: input.timePerSession,
			sessionsPerWeek: input.sessionsPerWeek,
			startDate: input.startDate,
			endDate: input.endDate,
			importantDates: input.importantDates,
			goals: input.goals,
			learningStyle: input.learningStyle
		}, null, 2);

		const response = await callAI({
			systemPrompt,
			userMessage,
			maxTokens: 8192,
			temperature: 0.7
		});

		// Extract JSON from AI response (it may be wrapped in markdown code blocks)
		const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/) || response.match(/(\{[\s\S]*\})/);
		const jsonStr = jsonMatch ? jsonMatch[1].trim() : response.trim();

		let plan;
		try {
			plan = JSON.parse(jsonStr);
		} catch {
			return Response.json({ error: 'Failed to parse AI response', raw: response.slice(0, 500) }, { status: 500 });
		}

		return Response.json({ plan: plan.plan || plan, rawPrompt: `${systemPrompt.slice(0, 200)}...` });
	} catch (err: any) {
		return Response.json({ error: err.message || 'Internal error' }, { status: 500 });
	}
}
