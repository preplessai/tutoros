import { generateDayPlanSchema } from '../lib/validate';
import { callAI } from '../lib/ai';

// @ts-expect-error - wrangler raw text import
import systemPrompt from '../prompts/day-plan.txt';

export async function handleGenerateDayPlan(
	request: Request,
	env: Record<string, string>
): Promise<Response> {
	try {
		const body = await request.json();
		const parsed = generateDayPlanSchema.safeParse(body);

		if (!parsed.success) {
			return Response.json(
				{ error: 'Invalid request', details: parsed.error.flatten() },
				{ status: 400 }
			);
		}

		const input = parsed.data;
		const userMessage = JSON.stringify(input, null, 2);

		const result = await callAI({
			systemPrompt,
			userMessage,
			maxTokens: 4096,
			temperature: 0.7,
			env
		});

		const jsonMatch =
			result.text.match(/```(?:json)?\s*([\s\S]*?)```/) || result.text.match(/(\{[\s\S]*\})/);
		const jsonStr = jsonMatch ? jsonMatch[1].trim() : result.text.trim();

		let dayPlan;
		try {
			dayPlan = JSON.parse(jsonStr);
		} catch {
			return Response.json(
				{ error: 'Failed to parse AI response', raw: result.text.slice(0, 500) },
				{ status: 500 }
			);
		}

		return Response.json({ dayPlan: dayPlan.dayPlan || dayPlan, provider: result.provider });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Internal error';
		return Response.json({ error: message }, { status: 500 });
	}
}
