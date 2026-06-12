/**
 * AI client — Groq primary, DeepSeek fallback.
 *
 * Groq free tier limits (per console.groq.com/docs/rate-limits):
 *   - 30 RPM, 1,000 RPD for most models (llama-3.3-70b-versatile)
 *   - Rate limits reset: RPM every ~60s, RPD at UTC midnight
 *   - 429 responses include Retry-After header
 *
 * On 429 we block Groq for the Retry-After duration and route to DeepSeek.
 * Module-level state: survives across requests within same Worker instance.
 */

// ── Rate-limit state (per Worker instance) ──
let groqBlockedUntil = 0;
let groqConsecutiveFailures = 0;

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const DEEPSEEK_MODEL = 'deepseek-chat';

interface AiCallOptions {
	systemPrompt: string;
	userMessage: string;
	maxTokens?: number;
	temperature?: number;
	env: Record<string, string>;
}

interface ProviderResult {
	text: string;
	provider: 'groq' | 'deepseek';
}

interface ChatCompletionResponse {
	choices?: { message?: { content?: string } }[];
}

function groqAvailable(): boolean {
	return Date.now() >= groqBlockedUntil;
}

function blockGroq(retryAfterSeconds: number) {
	groqBlockedUntil = Date.now() + retryAfterSeconds * 1000;
	groqConsecutiveFailures++;
	console.log(
		`[ai] Groq blocked for ${retryAfterSeconds}s (until ${new Date(groqBlockedUntil).toISOString()}). ` +
			`Consecutive failures: ${groqConsecutiveFailures}`
	);
}

function unblockGroq() {
	if (groqConsecutiveFailures > 0) {
		console.log('[ai] Groq recovered — unblocking');
	}
	groqBlockedUntil = 0;
	groqConsecutiveFailures = 0;
}

// ── Groq call (OpenAI-compatible) ──

async function callGroq(options: AiCallOptions): Promise<string> {
	const apiKey = options.env['GROQ_API_KEY_1'] || '';
	if (!apiKey) throw new Error('GROQ_API_KEY_1 not configured');

	const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model: GROQ_MODEL,
			messages: [
				{ role: 'system', content: options.systemPrompt },
				{ role: 'user', content: options.userMessage }
			],
			max_tokens: options.maxTokens ?? 4096,
			temperature: options.temperature ?? 0.7
		})
	});

	if (!resp.ok) {
		if (resp.status === 429) {
			const retryAfter = resp.headers.get('Retry-After');
			const waitSeconds = retryAfter ? parseInt(retryAfter, 10) : 60;

			blockGroq(waitSeconds);
			throw new Error('GROQ_RATE_LIMITED');
		}

		const body = await resp.text().catch(() => '');
		throw new Error(`Groq API error ${resp.status}: ${body.slice(0, 300)}`);
	}

	const data = (await resp.json()) as ChatCompletionResponse;
	const content = data?.choices?.[0]?.message?.content;
	if (!content) throw new Error('Groq returned empty response');

	unblockGroq();
	return content;
}

// ── DeepSeek call (OpenAI-compatible) ──

async function callDeepSeek(options: AiCallOptions): Promise<string> {
	const apiKey = options.env['SK_API_KEY_DEV'] || '';
	if (!apiKey) throw new Error('SK_API_KEY_DEV not configured');

	const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model: DEEPSEEK_MODEL,
			messages: [
				{ role: 'system', content: options.systemPrompt },
				{ role: 'user', content: options.userMessage }
			],
			max_tokens: options.maxTokens ?? 4096,
			temperature: options.temperature ?? 0.7
		})
	});

	if (!resp.ok) {
		const body = await resp.text().catch(() => '');
		throw new Error(`DeepSeek API error ${resp.status}: ${body.slice(0, 300)}`);
	}

	const data = (await resp.json()) as ChatCompletionResponse;
	const content = data?.choices?.[0]?.message?.content;
	if (!content) throw new Error('DeepSeek returned empty response');

	return content;
}

// ── Main entry: Groq first, fall back to DeepSeek ──

export async function callAI(options: AiCallOptions): Promise<ProviderResult> {
	if (groqAvailable()) {
		try {
			const text = await callGroq(options);
			return { text, provider: 'groq' };
		} catch (err: unknown) {
			if (err instanceof Error && err.message === 'GROQ_RATE_LIMITED') {
				console.log('[ai] Groq rate-limited, falling back to DeepSeek');
			} else {
				const message = err instanceof Error ? err.message : String(err);
				console.warn(`[ai] Groq error (will try DeepSeek): ${message}`);
			}
		}
	} else {
		const remaining = Math.ceil((groqBlockedUntil - Date.now()) / 1000);
		console.log(`[ai] Groq still blocked for ${remaining}s, using DeepSeek directly`);
	}

	const text = await callDeepSeek(options);
	return { text, provider: 'deepseek' };
}
