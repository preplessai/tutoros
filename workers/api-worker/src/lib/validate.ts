import { z } from 'zod';

const importantDateSchema = z.object({
	date: z.string(),
	label: z.string(),
	type: z.enum(['exam', 'holiday', 'other'])
});

const taskSectionSchema = z.enum([
	'review_struggles',
	'homework_help',
	'project_help',
	'learn_new',
	'practice',
	'wrap_up'
]);

const dayOfWeekSchema = z.enum([
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
	'sunday'
]);

// POST /api/generate-weekly-plan
export const generateWeeklyPlanSchema = z.object({
	grade: z.string().min(1),
	subjects: z.array(z.string()).min(1),
	timePerSession: z.number().int().positive().max(480),
	sessionsPerWeek: z.number().int().positive().max(14),
	startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	importantDates: z.array(importantDateSchema),
	goals: z.string(),
	learningStyle: z.string()
});

// POST /api/adjust-plan
export const adjustPlanSchema = z.object({
	currentPlan: z.unknown(),
	changes: z.object({
		unavailableDates: z.array(z.string()).optional(),
		newTargetDates: z.array(z.object({ subject: z.string(), targetDate: z.string() })).optional(),
		newSubjects: z.array(z.string()).optional(),
		removedSubjects: z.array(z.string()).optional(),
		gradeChange: z.string().optional(),
		goalUpdates: z.string().optional(),
		scheduleChanges: z
			.object({
				timePerSession: z.number().int().positive().max(480).optional(),
				sessionsPerWeek: z.number().int().positive().max(14).optional()
			})
			.optional()
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
		learningStyle: z.string(),
		recentProgress: z.string(),
		grades: z.string(),
		struggleAreas: z.string(),
		energyLevel: z.enum(['low', 'medium', 'high'])
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
