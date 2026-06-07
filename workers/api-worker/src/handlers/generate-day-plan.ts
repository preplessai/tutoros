import { generateDayPlanSchema } from '../lib/validate';
import { callAI } from '../lib/ai';

// @ts-ignore
import systemPrompt from '../prompts/day-plan.txt';

export async function handleGenerateDayPlan(request: Request): Promise<Response> {
	try {
		const body = await request.json();
		const parsed = generateDayPlanSchema.safeParse(body);

		if (!parsed.success) {
			return Response.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
		}

		const input = parsed.data;
		const userMessage = JSON.stringify(input, null, 2);

		const response = await callAI({
			systemPrompt,
			userMessage,
			maxTokens: 4096,
			temperature: 0.7
		});

		const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/) || response.match(/(\{[\s\S]*\})/);
		const jsonStr = jsonMatch ? jsonMatch[1].trim() : response.trim();

		let dayPlan;
		try {
			dayPlan = JSON.parse(jsonStr);
		} catch {
			return Response.json({ error: 'Failed to parse AI response', raw: response.slice(0, 500) }, { status: 500 });
		}

		return Response.json({ dayPlan: dayPlan.dayPlan || dayPlan });
	} catch (err: any) {
		return Response.json({ error: err.message || 'Internal error' }, { status: 500 });
	}
}
