import { adjustPlanSchema } from '../lib/validate';
import { callAI } from '../lib/ai';

// @ts-ignore
import systemPrompt from '../prompts/adjust-plan.txt';

export async function handleAdjustPlan(request: Request, env: Record<string, string>): Promise<Response> {
	try {
		const body = await request.json();
		const parsed = adjustPlanSchema.safeParse(body);

		if (!parsed.success) {
			return Response.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
		}

		const { currentPlan, changes } = parsed.data;

		const userMessage = JSON.stringify({
			currentPlan,
			changesRequested: changes
		}, null, 2);

		const result = await callAI({
			systemPrompt,
			userMessage,
			maxTokens: 8192,
			temperature: 0.5,
			env
		});

		const jsonMatch = result.text.match(/```(?:json)?\s*([\s\S]*?)```/) || result.text.match(/(\{[\s\S]*\})/);
		const jsonStr = jsonMatch ? jsonMatch[1].trim() : result.text.trim();

		let plan;
		try {
			plan = JSON.parse(jsonStr);
		} catch {
			return Response.json({ error: 'Failed to parse AI response', raw: result.text.slice(0, 500) }, { status: 500 });
		}

		return Response.json({ plan: plan.plan || plan, provider: result.provider });
	} catch (err: any) {
		return Response.json({ error: err.message || 'Internal error' }, { status: 500 });
	}
}
