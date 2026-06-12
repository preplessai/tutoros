import { generateWeeklyPlanSchema } from '../lib/validate';
import { callAI } from '../lib/ai';

// @ts-expect-error - wrangler raw text import
import systemPrompt from '../prompts/weekly-plan.txt';

export async function handleGenerateWeeklyPlan(
	request: Request,
	env: Record<string, string>
): Promise<Response> {
	try {
		const body = await request.json();
		const parsed = generateWeeklyPlanSchema.safeParse(body);

		if (!parsed.success) {
			return Response.json(
				{ error: 'Invalid request', details: parsed.error.flatten() },
				{ status: 400 }
			);
		}

		const input = parsed.data;
		const userMessage = JSON.stringify(
			{
				grade: input.grade,
				subjects: input.subjects,
				timePerSession: input.timePerSession,
				sessionsPerWeek: input.sessionsPerWeek,
				duration: input.duration,
				startDate: input.startDate,
				endDate: input.endDate,
				goals: input.goals,
				learningStyle: input.learningStyle,
				diagnosticData: input.diagnosticData,
				extraInfo: input.extraInfo
			},
			null,
			2
		);

		const result = await callAI({
			systemPrompt,
			userMessage,
			maxTokens: 8192,
			temperature: 0.7,
			env
		});

		// Extract JSON from AI response (it may be wrapped in markdown code blocks)
		const jsonMatch =
			result.text.match(/```(?:json)?\s*([\s\S]*?)```/) || result.text.match(/(\{[\s\S]*\})/);
		const jsonStr = jsonMatch ? jsonMatch[1].trim() : result.text.trim();

		let plan;
		try {
			plan = JSON.parse(jsonStr);
		} catch {
			return Response.json(
				{ error: 'Failed to parse AI response', raw: result.text.slice(0, 500) },
				{ status: 500 }
			);
		}

		return Response.json({ plan: plan.plan || plan, provider: result.provider });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Internal error';
		return Response.json({ error: message }, { status: 500 });
	}
}
