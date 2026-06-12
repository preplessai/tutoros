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

		// Extract JSON from AI response (it may be wrapped in markdown code blocks)
		// Use non-greedy regex to match the first complete JSON object
		const jsonMatch =
			result.text.match(/```(?:json)?\s*([\s\S]*?)```/) || result.text.match(/(\{[\s\S]*?\})/);
		const jsonStr = jsonMatch ? jsonMatch[1].trim() : result.text.trim();

		let responseData;
		try {
			responseData = JSON.parse(jsonStr);
		} catch {
			return Response.json(
				{ error: 'Failed to parse AI response', raw: result.text.slice(0, 500) },
				{ status: 500 }
			);
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
