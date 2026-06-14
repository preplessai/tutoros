// Shared Zod schemas for API validation

import { z } from 'zod';

export const dayOfWeekSchema = z.enum([
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
	'sunday'
]);

export const taskSectionSchema = z.enum([
	'review_struggles',
	'homework_help',
	'project_help',
	'learn_new',
	'practice',
	'wrap_up'
]);

export const resourceTypeSchema = z.enum(['video', 'article', 'practice', 'interactive']);

// POST /api/generate-weekly-plan
export const generateWeeklyPlanSchema = z.object({
	studentId: z.string(),
	grade: z.string(),
	subjects: z.array(z.string()),
	timePerSession: z.number().int().positive(),
	sessionsPerWeek: z.number().int().positive(),
	duration: z.string(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	goals: z.string(),
	learningStyle: z.string().optional(),
	diagnosticData: z.string().optional(),
	extraInfo: z.string().optional()
});

// POST /api/adjust-plan
export const adjustPlanSchema = z.object({
	currentPlan: z.unknown(),
	changes: z.object({
		unavailableDates: z.array(z.string()).optional(),
		newTargetDates: z
			.array(z.object({ subject: z.string(), targetDate: z.string() }))
			.optional(),
		newSubjects: z.array(z.string()).optional(),
		removedSubjects: z.array(z.string()).optional(),
		gradeChange: z.string().optional(),
		goalUpdates: z.string().optional(),
		scheduleChanges: z
			.object({ timePerSession: z.number().int().positive().optional(), sessionsPerWeek: z.number().int().positive().optional() })
			.optional(),
		focusAreaUpdates: z.string().optional(),
		contextUpdates: z.string().optional()
	})
});

// POST /api/generate-day-plan
export const generateDayPlanSchema = z.object({
	weekContext: z.object({
		theme: z.string().nullable(),
		focusAreas: z.array(z.string()),
		weekNotes: z.string().nullable(),
		weekNumber: z.number().int().positive()
	}),
	dayContext: z.object({
		date: z.string(),
		dayOfWeek: dayOfWeekSchema
	}),
	studentContext: z.object({
		grade: z.string(),
		subjects: z.array(z.string()),
		learningStyle: z.string().optional(),
		recentProgress: z.string().optional(),
		grades: z.string().optional(),
		struggleAreas: z.string().optional(),
		energyLevel: z.enum(['low', 'medium', 'high']).optional(),
		extraInfo: z.string().optional()
	})
});

// POST /api/search-resources
export const searchResourcesSchema = z.object({
	query: z.string().min(1),
	subjects: z.array(z.string()),
	grade: z.string(),
	preferredSites: z.array(z.object({ name: z.string(), url: z.string() })),
	maxResults: z.number().int().positive().max(20).optional()
});

// POST /api/pick-resources
export const pickResourcesSchema = z.object({
	tasks: z.array(
		z.object({
			id: z.string(),
			title: z.string(),
			description: z.string().nullable(),
			section: z.string()
		})
	),
	studentContext: z.object({
		grade: z.string(),
		subjects: z.array(z.string()),
		preferredSites: z.array(z.object({ name: z.string(), url: z.string() }))
	}),
	maxPerTask: z.number().optional().default(2)
});

// POST /api/prepless-chat
export const preplessChatSchema = z.object({
	messages: z.array(
		z.object({
			role: z.enum(['user', 'assistant']),
			content: z.string()
		})
	),
	studentContext: z.object({
		id: z.string(),
		name: z.string(),
		grade: z.string(),
		subjects: z.array(z.string()),
		diagnosticData: z.string().optional(),
		extraInfo: z.string().optional()
	}),
	planContext: z
		.object({
			id: z.string(),
			weeks: z.array(
				z.object({
					id: z.string(),
					weekNumber: z.number(),
					theme: z.string().nullable(),
					focusAreas: z.array(z.string()),
					notes: z.string().nullable()
				})
			)
		})
		.optional()
});

// POST /api/prepless-chat response validation
export const chatResponseSchema = z.object({
	message: z.string(),
	intent: z.enum(['info', 'edit_plan', 'edit_day', 'add_resources', 'add_homework', 'unknown']),
	proposedChanges: z
		.object({
			type: z.enum([
				'week_theme',
				'focus_areas',
				'add_task',
				'remove_task',
				'adjust_schedule',
				'add_resources',
				'add_homework'
			]),
			description: z.string(),
			mutations: z.array(
				z.object({
					table: z.enum(['plan_weeks', 'plan_days', 'plan_tasks', 'resources', 'plan_week_homework']),
					action: z.enum(['update', 'insert']),
					data: z.record(z.unknown())
				})
			)
		})
		.nullable()
		.optional()
});

// POST /api/pick-resources response validation
export const pickResourcesResponseSchema = z.object({
	resources: z.array(
		z.object({
			taskId: z.string(),
			title: z.string(),
			url: z.string(),
			source: z.string(),
			type: resourceTypeSchema,
			description: z.string(),
			relevance: z.string()
		})
	)
});
