import { generateWeeklyPlanSchema } from '../lib/validate';
import { callAI } from '../lib/ai';

// @ts-expect-error - wrangler raw text import
import systemPrompt from '../prompts/weekly-plan.txt';

function extractJson(text: string): string {
	// Strategy 1: markdown code block
	const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
	if (fence) return fence[1].trim();

	// Strategy 2: find the outermost JSON object
	const firstBrace = text.indexOf('{');
	if (firstBrace === -1) return text.trim();

	// Walk the string tracking depth to find matching closing brace
	let depth = 0;
	let inString = false;
	let escaped = false;
	for (let i = firstBrace; i < text.length; i++) {
		const ch = text[i];
		if (escaped) { escaped = false; continue; }
		if (ch === '\\' && inString) { escaped = true; continue; }
		if (ch === '"') { inString = !inString; continue; }
		if (inString) continue;
		if (ch === '{') depth++;
		else if (ch === '}') { depth--; if (depth === 0) return text.slice(firstBrace, i + 1).trim(); }
	}
	return text.slice(firstBrace).trim();
}

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
				timePerSession: input.timePerSession || 60,
				sessionsPerWeek: input.sessionsPerWeek || 2,
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

		const jsonStr = extractJson(result.text);

		let plan;
		try {
			plan = JSON.parse(jsonStr);
		} catch {
			return Response.json(
				{ error: 'Failed to parse AI response', raw: result.text.slice(0, 500), extracted: jsonStr.slice(0, 500) },
				{ status: 500 }
			);
		}

		return Response.json({ plan: plan.plan || plan, provider: result.provider });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Internal error';
		return Response.json({ error: message }, { status: 500 });
	}
}
