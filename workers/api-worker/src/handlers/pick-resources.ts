import { z } from 'zod';
import { pickResourcesSchema } from '../lib/validate';
import { callAI } from '../lib/ai';

// @ts-expect-error - wrangler raw text import
import systemPrompt from '../prompts/pick-resources.txt';

const pickResourcesResponseSchema = z.object({
	resources: z.array(
		z.object({
			taskId: z.string(),
			title: z.string(),
			url: z.string(),
			source: z.string(),
			type: z.enum(['video', 'article', 'practice', 'interactive']),
			description: z.string(),
			relevance: z.string()
		})
	)
});

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
		// Use non-greedy regex to match the first complete JSON object
		const jsonMatch =
			result.text.match(/```(?:json)?\s*([\s\S]*?)```/) || result.text.match(/(\{[\s\S]*?\})/);
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

		// Validate AI response shape with Zod
		const validated = pickResourcesResponseSchema.safeParse(data);
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

		const validResources = validated.data.resources;

		// Deduplicate by URL
		const seenUrls = new Set<string>();
		const deduped = validResources.filter((r) => {
			if (seenUrls.has(r.url)) return false;
			seenUrls.add(r.url);
			return true;
		});

		// Enforce maxPerTask limit: group by taskId, take only maxPerTask per task
		const perTask = new Map<string, typeof deduped>();
		for (const resource of deduped) {
			if (!perTask.has(resource.taskId)) {
				perTask.set(resource.taskId, []);
			}
			const group = perTask.get(resource.taskId)!;
			if (group.length < input.maxPerTask) {
				group.push(resource);
			}
		}

		const limitedResources = Array.from(perTask.values()).flat();

		return Response.json({ resources: limitedResources, provider: result.provider });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Internal error';
		return Response.json({ error: message }, { status: 500 });
	}
}
