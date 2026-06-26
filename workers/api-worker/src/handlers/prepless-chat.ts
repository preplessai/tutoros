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
 * Counts braces/brackets to find the true end of the JSON structure.
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

		if (escaped) {
			escaped = false;
			continue;
		}

		if (ch === '\\' && inString) {
			escaped = true;
			continue;
		}

		if (ch === '"') {
			inString = !inString;
			continue;
		}

		if (inString) continue;

		if (ch === openChar) {
			depth++;
		} else if (ch === closeChar) {
			depth--;
			if (depth === 0) {
				return text.slice(0, i + 1);
			}
		}
	}

	// If we never balanced, return the original text (parser will handle the error)
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
			{
				messages: input.messages,
				studentContext: input.studentContext,
				planContext: input.planContext
			},
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

		// Extract JSON from AI response.
		// Strategy: try direct parse first (AI returns clean JSON),
		// then markdown code block extraction, then brace-balanced extraction.
		let jsonStr = result.text.trim();

		// Strip markdown code fences if present
		const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
		if (fenceMatch) {
			jsonStr = fenceMatch[1].trim();
		} else if (jsonStr.startsWith('{') || jsonStr.startsWith('[')) {
			// Looks like clean JSON — extract balanced braces/brackets
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

		// Auto-wrap: if AI returned a raw JSON array (ignored system prompt format),
		// wrap it into the expected { message, intent, proposedChanges } shape.
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

		// Validate AI response shape with Zod
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

		return Response.json({
			message: data.message,
			intent: data.intent,
			proposedChanges: data.proposedChanges ?? null,
			provider: result.provider
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Internal error';
		return Response.json({ error: message }, { status: 500 });
	}
}
