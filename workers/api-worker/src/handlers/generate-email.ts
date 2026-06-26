import { generateEmailSchema, generateEmailResponseSchema } from '../lib/validate';
import { callAI } from '../lib/ai';

// @ts-expect-error - wrangler raw text import
import systemPrompt from '../prompts/parent-email.txt';

export async function handleGenerateEmail(
	request: Request,
	env: Record<string, string>
): Promise<Response> {
	try {
		const body = await request.json();
		const parsed = generateEmailSchema.safeParse(body);

		if (!parsed.success) {
			return Response.json(
				{ error: 'Invalid request', details: parsed.error.flatten() },
				{ status: 400 }
			);
		}

		const input = parsed.data;

		// Fetch student data from Supabase
		const supabaseUrl = env['SUPABASE_URL'] || '';
		const anonKey = env['SUPABASE_ANON_KEY'] || '';

		if (!supabaseUrl || !anonKey) {
			return Response.json({ error: 'Supabase not configured' }, { status: 500 });
		}

		const authHeader = request.headers.get('Authorization') || '';

		// Fetch student info
		const studentRes = await fetch(
			`${supabaseUrl}/rest/v1/students?id=eq.${input.studentId}&select=id,name,grade,subjects`,
			{
				headers: {
					Authorization: authHeader,
					apikey: anonKey
				}
			}
		);

		if (!studentRes.ok) {
			return Response.json({ error: 'Failed to fetch student data' }, { status: 500 });
		}

		const students = (await studentRes.json()) as Array<{
			id: string;
			name: string;
			grade: string;
			subjects: string[];
		}>;

		if (students.length === 0) {
			return Response.json({ error: 'Student not found' }, { status: 404 });
		}

		const student = students[0];

		// Fetch plan weeks and homework completion stats
		let planData: {
			title?: string;
			duration?: string;
			weeks: Array<{
				weekNumber: number;
				focusAreas: string[];
				completedHomework: number;
				totalHomework: number;
			}>;
			totalTasks?: number;
			completedTasks?: number;
			completionRate?: number;
			totalMinutes?: number;
		} = { weeks: [] };

		if (input.planId) {
			// Fetch the plan
			const planRes = await fetch(
				`${supabaseUrl}/rest/v1/weekly_plans?id=eq.${input.planId}&select=id,title,duration`,
				{
					headers: {
						Authorization: authHeader,
						apikey: anonKey
					}
				}
			);

			if (planRes.ok) {
				const plans = (await planRes.json()) as Array<{
					id: string;
					title: string;
					duration: string;
				}>;

				if (plans.length > 0) {
					planData.title = plans[0].title;
					planData.duration = plans[0].duration;
				}
			}

			// Fetch plan weeks with their focus areas
			const weeksRes = await fetch(
				`${supabaseUrl}/rest/v1/plan_weeks?plan_id=eq.${input.planId}&select=id,week_number,focus_areas&order=week_number.asc`,
				{
					headers: {
						Authorization: authHeader,
						apikey: anonKey
					}
				}
			);

			if (weeksRes.ok) {
				const weeks = (await weeksRes.json()) as Array<{
					id: string;
					week_number: number;
					focus_areas: string[];
				}>;

				for (const week of weeks) {
					// Fetch homework for this week
					const homeworkRes = await fetch(
						`${supabaseUrl}/rest/v1/plan_week_homework?week_id=eq.${week.id}&select=id,completed`,
						{
							headers: {
								Authorization: authHeader,
								apikey: anonKey
							}
						}
					);

					let completedHomework = 0;
					let totalHomework = 0;

					if (homeworkRes.ok) {
						const homeworkItems = (await homeworkRes.json()) as Array<{
							id: string;
							completed: boolean;
						}>;
						totalHomework = homeworkItems.length;
						completedHomework = homeworkItems.filter((h) => h.completed).length;
					}

					planData.weeks.push({
						weekNumber: week.week_number,
						focusAreas: week.focus_areas || [],
						completedHomework,
						totalHomework
					});
				}
			}

			// Fetch overall completion stats from plan_days + plan_tasks
			const daysRes = await fetch(
				`${supabaseUrl}/rest/v1/plan_days?select=id,struggle_areas,plan_tasks(id,completed,duration_minutes)&plan_id=eq.${input.planId}`,
				{
					headers: {
						Authorization: authHeader,
						apikey: anonKey
					}
				}
			);

			if (daysRes.ok) {
				const days = (await daysRes.json()) as Array<{
					id: string;
					struggle_areas: string[] | null;
					plan_tasks: Array<{
						id: string;
						completed: boolean;
						duration_minutes: number;
					}>;
				}>;

				let totalTasks = 0;
				let completedTasks = 0;
				let totalMinutes = 0;

				for (const day of days) {
					for (const task of day.plan_tasks || []) {
						totalTasks++;
						totalMinutes += task.duration_minutes || 0;
						if (task.completed) completedTasks++;
					}
				}

				planData.totalTasks = totalTasks;
				planData.completedTasks = completedTasks;
				planData.completionRate =
					totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
				planData.totalMinutes = totalMinutes;
			}
		}

		// Build user message for AI
		const userMessage = JSON.stringify(
			{
				student: {
					name: student.name,
					grade: student.grade,
					subjects: student.subjects
				},
				plan: planData.title
					? {
							title: planData.title,
							duration: planData.duration,
							weeks: planData.weeks,
							stats: {
								totalTasks: planData.totalTasks,
								completedTasks: planData.completedTasks,
								completionRate: planData.completionRate,
								totalMinutes: planData.totalMinutes
							}
						}
					: null,
				focusAreas: input.focusAreas,
				additionalNotes: input.additionalNotes
			},
			null,
			2
		);

		const result = await callAI({
			systemPrompt,
			userMessage,
			maxTokens: 2048,
			temperature: 0.7,
			env
		});

		// Extract JSON from AI response (may be wrapped in markdown code blocks)
		const jsonMatch =
			result.text.match(/```(?:json)?\s*([\s\S]*?)```/) || result.text.match(/(\{[\s\S]*?\})/);
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

		// Validate AI response shape with Zod
		const validated = generateEmailResponseSchema.safeParse(responseData);
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

		return Response.json({
			subject: validated.data.subject,
			body: validated.data.body,
			provider: result.provider
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Internal error';
		return Response.json({ error: message }, { status: 500 });
	}
}
