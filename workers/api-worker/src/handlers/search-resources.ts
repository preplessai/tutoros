import { searchResourcesSchema } from '../lib/validate';

// ── DuckDuckGo HTML search (free, no API key) ──

interface DdgResult {
	title: string;
	url: string;
	snippet: string;
}

/**
 * POST to DDG HTML endpoint and parse results.
 * Uses site: operators to filter to preferred sites.
 */
async function searchDdg(
	query: string,
	preferredSites?: { name: string; url: string }[]
): Promise<DdgResult[]> {
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

	const resp = await fetch('https://html.duckduckgo.com/html/', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'User-Agent': 'Mozilla/5.0 (compatible; PreplessAI/1.0)'
		},
		body: new URLSearchParams({ q: searchQuery }).toString()
	});

	if (!resp.ok) return [];

	const html = await resp.text();

	return parseDdgHtml(html);
}

/**
 * Parse DuckDuckGo HTML results page.
 * Extracts title, redirect URL (uddg= param), and snippet.
 */
function parseDdgHtml(html: string): DdgResult[] {
	const results: DdgResult[] = [];

	// Split on result__body blocks
	const bodyParts = html.split(/class="result__body"/g);
	bodyParts.shift(); // remove content before first result

	for (const part of bodyParts) {
		try {
			// Extract title + redirect link
			const titleMatch = part.match(
				/<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/
			);
			if (!titleMatch) continue;

			const rawTitle = titleMatch[2].replace(/<[^>]*>/g, '').trim();
			const title = decodeHtmlEntities(rawTitle);
			const rawHref = titleMatch[1];

			// Extract snippet
			const snippetMatch = part.match(
				/<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/
			);
			const rawSnippet = snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, '').trim() : '';
			const snippet = decodeHtmlEntities(rawSnippet);

			// Extract real URL from DDG redirect
			const url = extractDdgUrl(rawHref);

			if (url && title) {
				results.push({ title, url, snippet });
			}
		} catch {
			// Skip malformed result
		}
	}

	return results;
}

/**
 * DuckDuckGo wraps result URLs in redirects:
 * //duckduckgo.com/l/?uddg=ENCODED_URL&rut=...
 * Decode the real destination URL.
 */
function extractDdgUrl(href: string): string {
	try {
		const uddgMatch = href.match(/uddg=([^&]+)/);
		if (uddgMatch) {
			return decodeURIComponent(uddgMatch[1]);
		}
		// If no uddg param, maybe it's a direct URL
		if (href.startsWith('http')) return href;
		if (href.startsWith('//')) return `https:${href}`;
	} catch {
		// fall through
	}
	return '';
}

function decodeHtmlEntities(text: string): string {
	return text
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#x27;/g, "'")
		.replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));
}

// ── Resource type classification from URL patterns ──

function classifyResourceType(url: string, title: string): string {
	const combined = `${url.toLowerCase()} ${title.toLowerCase()}`;

	if (
		/\/video\//.test(combined) ||
		/watch\b/.test(combined) ||
		/youtube\.com/.test(combined) ||
		/\/v\//.test(combined)
	)
		return 'video';

	if (
		/\/exercise\b/.test(combined) ||
		/\bpractice\b/.test(combined) ||
		/\bquiz\b/.test(combined) ||
		/\btest\b/.test(combined) ||
		/\bproblems?\b/.test(combined) ||
		/\/e\//.test(combined) ||
		/ixl\.com/.test(combined)
	)
		return 'practice';

	if (
		/calculator/.test(combined) ||
		/interactive/.test(combined) ||
		/simulation/.test(combined) ||
		/explore/.test(combined) ||
		/desmos\.com/.test(combined)
	)
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

// ── Handler ──

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
		const maxResults = input.maxResults || 5;

		// Search DDG with site filters
		let results = await searchDdg(input.query, input.preferredSites);

		// Fallback: retry without site filters if nothing found
		if (results.length === 0 && input.preferredSites && input.preferredSites.length > 0) {
			results = await searchDdg(input.query);
		}

		// Map to expected response format
		const resources = results.slice(0, maxResults).map((r) => ({
			title: r.title,
			url: r.url,
			source: guessSource(r.url, input.preferredSites),
			type: classifyResourceType(r.url, r.title),
			description: r.snippet || null
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
