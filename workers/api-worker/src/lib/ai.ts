import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;

function getClient(): Anthropic {
	if (!client) {
		// Worker secrets / env vars
		const apiKey = (globalThis as any).ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || '';
		client = new Anthropic({ apiKey });
	}
	return client;
}

interface AiCallOptions {
	systemPrompt: string;
	userMessage: string;
	maxTokens?: number;
	temperature?: number;
}

export async function callAI(options: AiCallOptions): Promise<string> {
	const anthropic = getClient();

	const msg = await anthropic.messages.create({
		model: 'claude-sonnet-4-6',
		max_tokens: options.maxTokens ?? 4096,
		temperature: options.temperature ?? 0.7,
		system: options.systemPrompt,
		messages: [{ role: 'user', content: options.userMessage }]
	});

	const text = msg.content
		.filter((block) => block.type === 'text')
		.map((block) => block.text)
		.join('\n');

	return text;
}
