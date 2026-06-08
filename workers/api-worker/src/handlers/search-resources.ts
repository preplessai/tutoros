import { searchResourcesSchema } from '../lib/validate';
import { callAI } from '../lib/ai';

export async function handleSearchResources(request: Request, env: Record<string, string>): Promise<Response> {
	try {
		const body = await request.json();
		const parsed = searchResourcesSchema.safeParse(body);

		if (!parsed.success) {
			return Response.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
		}

		const input = parsed.data;

		const systemPrompt = `You are a learning resource finder. Given a topic, subject, and grade level, suggest relevant, high-quality learning resources from the preferred sites listed. Return ONLY valid JSON.

For each resource, provide:
- title: Resource title
- url: Direct URL to the resource (construct plausible URLs based on the source site)
- source: The source site name
- type: One of "video", "article", "practice", "interactive"
- description: Brief description of what this resource covers

Be specific — link to actual topics, not just homepages. For Khan Academy, link to specific courses/lessons. For W3Schools, link to specific tutorial pages. For IXL, link to specific skill pages.`;

		const userMessage = JSON.stringify({
			query: input.query,
			subjects: input.subjects,
			grade: input.grade,
			preferredSites: input.preferredSites,
			maxResults: input.maxResults || 5
		}, null, 2);

		const result = await callAI({
			systemPrompt,
			userMessage,
			maxTokens: 2048,
			temperature: 0.5,
			env
		});

		const jsonMatch = result.text.match(/```(?:json)?\s*([\s\S]*?)```/) || result.text.match(/(\{[\s\S]*\})/);
		const jsonStr = jsonMatch ? jsonMatch[1].trim() : result.text.trim();

		let data;
		try {
			data = JSON.parse(jsonStr);
		} catch {
			return Response.json({ error: 'Failed to parse AI response', raw: result.text.slice(0, 500) }, { status: 500 });
		}

		return Response.json({ resources: data.resources || [], provider: result.provider });
	} catch (err: any) {
		return Response.json({ error: err.message || 'Internal error' }, { status: 500 });
	}
}
