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
				'update_task',
				'adjust_schedule',
				'add_resources',
				'add_homework',
				'update_week',
				'update_day',
				'edit_plan'
			]),
			description: z.string().nullable(),
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

/**
 * Extract a balanced JSON object or array from text that may have trailing content.
 */
function extractBalancedJSON(text: string): string {
	const firstChar = text[0];
	if (firstChar !== '{' && firstChar !== '[') return text;

	const openChar = firstChar;
	const closeChar = firstChar === '{' ? '}' : ']';
	let depth = 0;
	let inString = false;
	let escaped = false;

	for (let i = 0; i < text.length; i++) {
		const ch = text[i];

		if (escaped) {
			escaped = false;
			continue;
		}
		if (ch === '\\' && inString) {
			escaped = true;
			continue;
		}
		if (ch === '"') {
			inString = !inString;
			continue;
		}
		if (inString) continue;

		if (ch === openChar) {
			depth++;
		} else if (ch === closeChar) {
			depth--;
			if (depth === 0) return text.slice(0, i + 1);
		}
	}

	return text;
}

export async function handlePreplessChat(
	request: Request,
	env: Record<string, string>
): Promise<Response> {
	console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
	console.log('🔮 [prepless-chat] Request received');
	try {
		const body = (await request.json()) as Record<string, unknown>;
		console.log('📥 [prepless-chat] Request parsed successfully');
		console.log('  messages count:', (body.messages as unknown[] | undefined)?.length);
		console.log('  studentContext present:', !!body.studentContext);
		console.log('  planContext present:', !!body.planContext);
		if (body.planContext) {
			const pc = body.planContext as Record<string, unknown>;
			console.log('  planContext.id:', pc.id);
			console.log('  planContext.weeks count:', (pc.weeks as unknown[] | undefined)?.length);
		}

		const parsed = preplessChatSchema.safeParse(body);

		if (!parsed.success) {
			console.error(
				'❌ [prepless-chat] Request validation failed:',
				JSON.stringify(parsed.error.flatten(), null, 2)
			);
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

		console.log('📏 [prepless-chat] Sizes:');
		console.log('  systemPrompt length:', systemPrompt.length, 'chars');
		console.log('  userMessage length:', userMessage.length, 'chars');
		console.log('  total input:', systemPrompt.length + userMessage.length, 'chars');

		const result = await callAI({
			systemPrompt,
			userMessage,
			maxTokens: 4096,
			temperature: 0.7,
			env
		});

		console.log('🤖 [prepless-chat] AI response received');
		console.log('  provider:', result.provider);
		console.log('  raw length:', result.text.length, 'chars');
		console.log('  raw text (first 500 chars):', result.text.slice(0, 500));
		console.log('  raw text (last 200 chars):', result.text.slice(-200));

		// Extract JSON from AI response
		let jsonStr = result.text.trim();
		console.log('🔍 [prepless-chat] JSON extraction:');
		console.log('  trimmed starts with:', jsonStr.slice(0, 50));

		const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
		if (fenceMatch) {
			console.log('  ✅ Found code fence (markdown block)');
			jsonStr = fenceMatch[1].trim();
			console.log('  extracted from fence (first 200):', jsonStr.slice(0, 200));
		} else if (jsonStr.startsWith('{') || jsonStr.startsWith('[')) {
			const beforeBalanced = jsonStr;
			jsonStr = extractBalancedJSON(jsonStr);
			if (jsonStr.length !== beforeBalanced.length) {
				console.log(
					'  ✅ Balanced extraction trimmed',
					beforeBalanced.length - jsonStr.length,
					'trailing chars'
				);
			} else {
				console.log('  ✅ Text starts with', jsonStr[0], '— no trailing content to trim');
			}
		} else {
			console.warn('  ⚠️ Text does NOT start with { or [ and no code fence found');
			console.warn('  First 100 chars:', jsonStr.slice(0, 100));
		}
		console.log('  Final jsonStr length:', jsonStr.length);

		let responseData: unknown;
		try {
			responseData = JSON.parse(jsonStr);
			console.log('✅ [prepless-chat] JSON.parse succeeded');
			console.log('  Parsed type:', Array.isArray(responseData) ? 'array' : typeof responseData);
			if (
				typeof responseData === 'object' &&
				responseData !== null &&
				!Array.isArray(responseData)
			) {
				const obj = responseData as Record<string, unknown>;
				console.log('  Top-level keys:', Object.keys(obj));
				console.log('  intent:', obj.intent);
				console.log('  message present:', typeof obj.message === 'string');
				console.log(
					'  proposedChanges present:',
					obj.proposedChanges !== undefined && obj.proposedChanges !== null
				);
				if (obj.proposedChanges && typeof obj.proposedChanges === 'object') {
					const pc = obj.proposedChanges as Record<string, unknown>;
					console.log('  proposedChanges.type:', pc.type);
					console.log('  proposedChanges.description:', pc.description);
					console.log(
						'  proposedChanges.mutations count:',
						Array.isArray(pc.mutations) ? pc.mutations.length : 'not an array'
					);
				}
			}
		} catch (parseErr) {
			console.error('❌ [prepless-chat] JSON.parse FAILED');
			console.error('  Error:', (parseErr as Error).message);
			console.error('  jsonStr (first 500):', jsonStr.slice(0, 500));
			return Response.json(
				{ error: 'Failed to parse AI response', raw: result.text.slice(0, 800) },
				{ status: 500 }
			);
		}

		// Auto-wrap raw JSON arrays into structured format
		if (Array.isArray(responseData)) {
			console.log('🔄 [prepless-chat] Auto-wrapping raw array response');
			console.log('  Array length:', (responseData as unknown[]).length);
			console.log('  First item:', JSON.stringify((responseData as unknown[])[0]).slice(0, 200));
			const items = responseData as Record<string, unknown>[];
			responseData = {
				message: `Here are ${items.length} suggestion${items.length !== 1 ? 's' : ''}.`,
				intent: 'add_homework',
				proposedChanges: {
					type: 'add_homework',
					description: `Adding ${items.length} homework item${items.length !== 1 ? 's' : ''}`,
					mutations: items.map((item) => ({
						table: 'plan_week_homework',
						action: 'insert',
						data: item
					}))
				}
			};
			console.log('  Wrapped into:', JSON.stringify(responseData).slice(0, 300));
		}

		// Validate response shape with Zod
		console.log('🔬 [prepless-chat] Running Zod validation...');
		const validated = chatResponseSchema.safeParse(responseData);
		if (!validated.success) {
			const flat = validated.error.flatten();
			const fieldErrors = Object.entries(flat.fieldErrors)
				.map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`)
				.join('; ');
			console.error('❌ [prepless-chat] Zod validation FAILED');
			console.error('  Field errors:', JSON.stringify(flat.fieldErrors, null, 2));
			console.error('  Form errors:', JSON.stringify(flat.formErrors, null, 2));
			console.error('  Received data shape:', JSON.stringify(responseData, null, 2).slice(0, 1000));
			console.error('  Raw AI text (first 800):', result.text.slice(0, 800));
			return Response.json(
				{
					error: `AI response failed validation${fieldErrors ? ` — ${fieldErrors}` : ''}`,
					details: flat,
					raw: result.text.slice(0, 800)
				},
				{ status: 500 }
			);
		}

		console.log('✅ [prepless-chat] Zod validation passed');
		const data = validated.data;

		// Usage-based credit cost (frontier model pricing: ~Gemini/GLM tier)
		// 1 token ≈ 4 characters. Input: $0.10/M tokens. Output: $0.40/M tokens.
		// 1 credit ≈ $0.10 (rough equivalence)
		const inputChars = systemPrompt.length + userMessage.length;
		const outputChars = result.text.length;
		const inputTokens = inputChars / 4;
		const outputTokens = outputChars / 4;
		const rawCost = inputTokens * 0.0001 + outputTokens * 0.0004;
		const creditCost = Math.max(0.05, Math.round(rawCost * 100) / 100);

		console.log('💰 [prepless-chat] Credit calculation:');
		console.log('  inputChars:', inputChars, '→ inputTokens:', inputTokens.toFixed(0));
		console.log('  outputChars:', outputChars, '→ outputTokens:', outputTokens.toFixed(0));
		console.log('  rawCost:', rawCost.toFixed(4), '→ creditCost:', creditCost);

		console.log('📤 [prepless-chat] Returning response:');
		console.log('  intent:', data.intent);
		console.log('  message length:', data.message.length);
		console.log('  proposedChanges:', data.proposedChanges ? 'present' : 'null');
		console.log('  provider:', result.provider);
		console.log('  creditCost:', creditCost);
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

		return Response.json({
			message: data.message,
			intent: data.intent,
			proposedChanges: data.proposedChanges ?? null,
			provider: result.provider,
			creditCost
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Internal error';
		console.error('💥 [prepless-chat] Unhandled exception');
		console.error('  Message:', message);
		console.error('  Error:', err);
		if (err instanceof Error && err.stack) {
			console.error('  Stack:', err.stack);
		}
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		return Response.json({ error: message }, { status: 500 });
	}
}
