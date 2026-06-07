/**
 * Fetch content from a URL. Used for resource searching.
 * Basic implementation — can be extended with real web search APIs.
 */
export async function fetchUrl(url: string): Promise<string | null> {
	try {
		const res = await fetch(url, {
			headers: { 'User-Agent': 'TutorOS/1.0' },
			redirect: 'follow'
		});

		if (!res.ok) return null;

		const contentType = res.headers.get('content-type') || '';
		if (contentType.includes('text/html') || contentType.includes('text/plain')) {
			const text = await res.text();
			// Truncate to avoid token limits
			return text.slice(0, 8000);
		}

		return null;
	} catch {
		return null;
	}
}
