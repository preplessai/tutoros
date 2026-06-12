import { preplessChatSchema } from '../lib/validate';
import { callAI } from '../lib/ai';

// @ts-ignore - wrangler raw text import
import systemPrompt from '../prompts/prepless-chat.txt';

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
		const jsonMatch =
			result.text.match(/```(?:json)?\s*([\s\S]*?)```/) || result.text.match(/(\{[\s\S]*\})/);
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

		// Normalize intent values
		const intent = responseData.intent || 'info';
		const mappedIntent =
			intent === 'edit_plan' || intent === 'edit_day' || intent === 'add_resources' || intent === 'add_homework'
				? intent
				: 'info';

		return Response.json({
			message: responseData.message || '',
			intent: mappedIntent,
			proposedChanges: responseData.proposedChanges || null,
			provider: result.provider
		});
	} catch (err: any) {
		return Response.json({ error: err.message || 'Internal error' }, { status: 500 });
	}
}
