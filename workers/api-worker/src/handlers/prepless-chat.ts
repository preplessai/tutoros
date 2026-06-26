import { z } from 'zod';
import { preplessChatSchema } from '../lib/validate';
import { callAI } from '../lib/ai';

// @ts-expect-error - wrangler raw text import
import systemPrompt from '../prompts/prepless-chat.txt';

const chatResponseSchema = z.object({
	message: z.string(),
	intent: z.enum(['info', 'edit_plan', 'edit_day', 'add_resources', 'add_homework', 'unknown']),
	proposedChanges: z
		.object({
			type: z.enum([
				'week_theme',
				'focus_areas',
				'add_task',
				'remove_task',
				'adjust_schedule',
				'add_resources',
				'add_homework'
			]),
			description: z.string(),
			mutations: z.array(
				z.object({
					table: z.enum([
						'plan_weeks',
						'plan_days',
						'plan_tasks',
						'resources',
						'plan_week_homework'
					]),
					action: z.enum(['update', 'insert']),
					data: z.record(z.unknown())
				})
			)
		})
		.nullable()
		.optional()
});

/**
 * Extract a balanced JSON object or array from text that may have trailing content.
 */
function extractBalancedJSON(text: string): string {
	const firstChar = text[0];
	if (firstChar !== '{' && firstChar !== '[') return text;

	const openChar = firstChar;
	const closeChar = firstChar === '{' ? '}' : ']';
	let depth = 0;
	let inString = false;
	let escaped = false;

	for (let i = 0; i < text.length; i++) {
		const ch = text[i];

		if (escaped) { escaped = false; continue; }
		if (ch === '\\' && inString) { escaped = true; continue; }
		if (ch === '"') { inString = !inString; continue; }
		if (inString) continue;

		if (ch === openChar) {
			depth++;
		} else if (ch === closeChar) {
			depth--;
			if (depth === 0) return text.slice(0, i + 1);
		}
	}

	return text;
}

export async function handlePreplessChat(
	request: Request,
	env: Record<string, string>
): Promise<Response> {
	try {
		const body = await request.json();
		const parsed = preplessChatSchema.safeParse(body);

		if (!parsed.success) {
			return Response.json(
				{ error: 'Invalid request', details: parsed.error.flatten() },
				{ status: 400 }
			);
		}

		const input = parsed.data;
		const userMessage = JSON.stringify(
			{ messages: input.messages, studentContext: input.studentContext, planContext: input.planContext },
			null,
			2
		);

		const result = await callAI({
			systemPrompt,
			userMessage,
			maxTokens: 4096,
			temperature: 0.7,
			env
		});

		// Extract JSON from AI response
		let jsonStr = result.text.trim();

		const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
		if (fenceMatch) {
			jsonStr = fenceMatch[1].trim();
		} else if (jsonStr.startsWith('{') || jsonStr.startsWith('[')) {
			jsonStr = extractBalancedJSON(jsonStr);
		}

		let responseData;
		try {
			responseData = JSON.parse(jsonStr);
		} catch {
			return Response.json(
				{ error: 'Failed to parse AI response', raw: result.text.slice(0, 500) },
				{ status: 500 }
			);
		}

		// Auto-wrap raw JSON arrays into structured format
		if (Array.isArray(responseData)) {
			const items = responseData as Record<string, unknown>[];
			responseData = {
				message: `Here are ${items.length} suggestion${items.length !== 1 ? 's' : ''}.`,
				intent: 'add_homework',
				proposedChanges: {
					type: 'add_homework',
					description: `Adding ${items.length} homework item${items.length !== 1 ? 's' : ''}`,
					mutations: items.map((item) => ({
						table: 'plan_week_homework',
						action: 'insert',
						data: item
					}))
				}
			};
		}

		// Validate response shape with Zod
		const validated = chatResponseSchema.safeParse(responseData);
		if (!validated.success) {
			return Response.json(
				{
					error: 'AI response failed validation',
					details: validated.error.flatten(),
					raw: result.text.slice(0, 500)
				},
				{ status: 500 }
			);
		}

		const data = validated.data;

		// Usage-based credit cost (frontier model pricing: ~Gemini/GLM tier)
		// 1 token ≈ 4 characters. Input: $0.10/M tokens. Output: $0.40/M tokens.
		// 1 credit ≈ $0.10 (rough equivalence)
		const inputChars = systemPrompt.length + userMessage.length;
		const outputChars = result.text.length;
		const inputTokens = inputChars / 4;
		const outputTokens = outputChars / 4;
		const rawCost = inputTokens * 0.0001 + outputTokens * 0.0004;
		const creditCost = Math.max(0.05, Math.round(rawCost * 100) / 100);

		return Response.json({
			message: data.message,
			intent: data.intent,
			proposedChanges: data.proposedChanges ?? null,
			provider: result.provider,
			creditCost
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Internal error';
		return Response.json({ error: message }, { status: 500 });
	}
}
