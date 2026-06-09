import { searchResourcesSchema } from '../lib/validate';

/**
 * Brave Search API handler.
 * Free tier: 2,000 queries/month. API key stored as secret.
 * Docs: https://api.search.brave.com/app/documentation/web-search/query
 */

interface BraveWebResult {
	title: string;
	url: string;
	description: string;
	type?: string;
	age?: string;
}

interface BraveSearchResponse {
	web?: {
		results?: BraveWebResult[];
	};
}

async function searchBrave(
	query: string,
	apiKey: string,
	preferredSites?: { name: string; url: string }[],
	count = 10
): Promise<BraveWebResult[]> {
	// Build query with site: filters
	let searchQuery = query;
	if (preferredSites && preferredSites.length > 0) {
		const siteFilters = preferredSites
			.map((s) => {
				try {
					return `site:${new URL(s.url).hostname}`;
				} catch {
					return '';
				}
			})
			.filter(Boolean)
			.join(' OR ');
		if (siteFilters) {
			searchQuery = `${query} (${siteFilters})`;
		}
	}

	const params = new URLSearchParams({
		q: searchQuery,
		count: String(count),
		search_lang: 'en',
		safesearch: 'moderate'
	});

	const resp = await fetch(
		`https://api.search.brave.com/res/v1/web/search?${params.toString()}`,
		{
			headers: {
				'Accept': 'application/json',
				'Accept-Encoding': 'gzip',
				'X-Subscription-Token': apiKey
			}
		}
	);

	if (!resp.ok) {
		console.error('[brave] search failed:', resp.status, resp.statusText);
		return [];
	}

	const data = (await resp.json()) as BraveSearchResponse;
	return data.web?.results || [];
}

function classifyResourceType(url: string, title: string): string {
	const combined = `${url.toLowerCase()} ${title.toLowerCase()}`;

	if (/\/video\//.test(combined) || /watch\b/.test(combined) || /youtube\.com/.test(combined) || /\/v\//.test(combined))
		return 'video';

	if (/\/exercise\b/.test(combined) || /\bpractice\b/.test(combined) || /\bquiz\b/.test(combined) || /\btest\b/.test(combined) || /\bproblems?\b/.test(combined) || /\/e\//.test(combined) || /ixl\.com/.test(combined))
		return 'practice';

	if (/calculator/.test(combined) || /interactive/.test(combined) || /simulation/.test(combined) || /explore/.test(combined) || /desmos\.com/.test(combined))
		return 'interactive';

	return 'article';
}

function guessSource(url: string, preferredSites?: { name: string; url: string }[]): string {
	if (preferredSites) {
		for (const site of preferredSites) {
			try {
				if (url.includes(new URL(site.url).hostname)) return site.name;
			} catch {
				// skip
			}
		}
	}
	try {
		return new URL(url).hostname.replace('www.', '');
	} catch {
		return 'Unknown';
	}
}

export async function handleSearchResources(
	request: Request,
	env: Record<string, string>
): Promise<Response> {
	try {
		const body = await request.json();
		const parsed = searchResourcesSchema.safeParse(body);

		if (!parsed.success) {
			return Response.json(
				{ error: 'Invalid request', details: parsed.error.flatten() },
				{ status: 400 }
			);
		}

		const input = parsed.data;
		const apiKey = env['BRAVE_API_KEY'] || '';

		if (!apiKey) {
			return Response.json(
				{ error: 'BRAVE_API_KEY not configured' },
				{ status: 500 }
			);
		}

		const maxResults = input.maxResults || 5;

		// Search with site filters
		let results = await searchBrave(input.query, apiKey, input.preferredSites, maxResults);

		// Fallback: retry without site filters
		if (results.length === 0 && input.preferredSites && input.preferredSites.length > 0) {
			results = await searchBrave(input.query, apiKey, undefined, maxResults);
		}

		const resources = results.map((r) => ({
			title: r.title,
			url: r.url,
			source: guessSource(r.url, input.preferredSites),
			type: classifyResourceType(r.url, r.title),
			description: r.description || null
		}));

		// Deduplicate by URL
		const seen = new Set<string>();
		const unique = resources.filter((r) => {
			if (seen.has(r.url)) return false;
			seen.add(r.url);
			return true;
		});

		return Response.json({ resources: unique });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Internal error';
		return Response.json({ error: message }, { status: 500 });
	}
}
