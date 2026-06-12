import { pickResourcesSchema } from '../lib/validate';
import { callAI } from '../lib/ai';

// @ts-ignore - wrangler raw text import
import systemPrompt from '../prompts/pick-resources.txt';

export async function handlePickResources(
	request: Request,
	env: Record<string, string>
): Promise<Response> {
	try {
		const body = await request.json();
		const parsed = pickResourcesSchema.safeParse(body);

		if (!parsed.success) {
			return Response.json(
				{ error: 'Invalid request', details: parsed.error.flatten() },
				{ status: 400 }
			);
		}

		const input = parsed.data;

		const userMessage = JSON.stringify(
			{
				tasks: input.tasks.map((t) => ({
					id: t.id,
					title: t.title,
					description: t.description,
					section: t.section
				})),
				studentContext: {
					grade: input.studentContext.grade,
					subjects: input.studentContext.subjects,
					preferredSites: input.studentContext.preferredSites
				},
				maxPerTask: input.maxPerTask
			},
			null,
			2
		);

		const result = await callAI({
			systemPrompt,
			userMessage,
			maxTokens: 4096,
			temperature: 0.3,
			env
		});

		// Extract JSON from AI response (it may be wrapped in markdown code blocks)
		const jsonMatch =
			result.text.match(/```(?:json)?\s*([\s\S]*?)```/) || result.text.match(/(\{[\s\S]*\})/);
		const jsonStr = jsonMatch ? jsonMatch[1].trim() : result.text.trim();

		let data: { resources: unknown[] };
		try {
			data = JSON.parse(jsonStr);
		} catch {
			return Response.json(
				{ error: 'Failed to parse AI response', raw: result.text.slice(0, 500) },
				{ status: 500 }
			);
		}

		const resources = Array.isArray(data.resources) ? data.resources : [];

		return Response.json({ resources, provider: result.provider });
	} catch (err: any) {
		return Response.json({ error: err.message || 'Internal error' }, { status: 500 });
	}
}
