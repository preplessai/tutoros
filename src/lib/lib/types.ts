// ── Database Types ──

export interface Profile {
	id: string;
	email: string;
	display_name: string | null;
	avatar_url: string | null;
	subscription_tier: 'free' | 'starter' | 'pro' | 'enterprise';
	stripe_customer_id: string | null;
	stripe_subscription_id: string | null;
	subscription_status:
		| 'active'
		| 'past_due'
		| 'canceled'
		| 'incomplete'
		| 'trialing'
		| 'unpaid'
		| null;
	subscription_period_end: string | null;
	cancel_at_period_end: boolean | null;
	downgraded_at: string | null;
	data_truncation_date: string | null;
	created_at: string;
	updated_at: string;
}

export interface Student {
	id: string;
	tutor_id: string;
	name: string;
	grade: string;
	subjects: string[];
	learning_style: string | null;
	diagnostic_data: string | null;
	extra_info: string | null;
	notes: string | null;
	preferred_resource_sites: PreferredResourceSite[];
	created_at: string;
	updated_at: string;
}

export interface PreferredResourceSite {
	name: string;
	url: string;
	enabled: boolean;
}

export interface ImportantDate {
	date: string;
	label: string;
	type: 'exam' | 'holiday' | 'other';
}

export type PlanStatus = 'active' | 'archived';

export interface WeeklyPlan {
	id: string;
	student_id: string;
	tutor_id: string;
	title: string;
	grade: string;
	subjects: string[];
	time_per_session: number;
	sessions_per_week: number;
	duration: string;
	start_date: string | null;
	end_date: string | null;
	important_dates: ImportantDate[];
	goals: string;
	learning_style: string;
	ai_raw_response: unknown;
	status: PlanStatus;
	created_at: string;
	updated_at: string;
}

export interface PlanWeek {
	id: string;
	plan_id: string;
	week_number: number;
	week_start: string | null;
	week_end: string | null;
	theme: string | null;
	focus_areas: string[];
	notes: string | null;
	ai_generated: boolean;
	sort_order: number;
	created_at: string;
	updated_at: string;
}

export type DayOfWeek =
	| 'monday'
	| 'tuesday'
	| 'wednesday'
	| 'thursday'
	| 'friday'
	| 'saturday'
	| 'sunday';
export type EnergyLevel = 'low' | 'medium' | 'high';

export interface PlanDay {
	id: string;
	week_id: string;
	date: string;
	day_of_week: DayOfWeek;
	energy_level: EnergyLevel | null;
	recent_progress: string | null;
	struggle_areas: string[] | null;
	grades_context: string | null;
	ai_raw_response: unknown | null;
	ai_generated: boolean;
	sort_order: number;
	created_at: string;
	updated_at: string;
}

export type TaskSection =
	| 'review_struggles'
	| 'homework_help'
	| 'project_help'
	| 'learn_new'
	| 'practice'
	| 'wrap_up';

export interface PlanTask {
	id: string;
	day_id: string;
	section: TaskSection;
	sort_order: number;
	title: string;
	description: string | null;
	duration_minutes: number;
	completed: boolean;
	ai_generated: boolean;
	created_at: string;
	updated_at: string;
}

export type ResourceType = 'video' | 'article' | 'practice' | 'interactive';

export interface Resource {
	id: string;
	task_id: string;
	title: string;
	url: string;
	source: string;
	type: ResourceType;
	description: string | null;
	ai_generated: boolean;
	created_at: string;
}

// ── API Types ──

export interface GenerateWeeklyPlanRequest {
	studentId: string;
	grade: string;
	subjects: string[];
	timePerSession: number;
	sessionsPerWeek: number;
	duration: string;
	startDate?: string;
	endDate?: string;
	goals: string;
	learningStyle?: string;
	diagnosticData?: string;
	extraInfo?: string;
	preferredResourceSites?: PreferredResourceSite[];
}

export interface AdjustPlanRequest {
	currentPlan: unknown;
	changes: {
		unavailableDates?: string[];
		newTargetDates?: { subject: string; targetDate: string }[];
		newSubjects?: string[];
		removedSubjects?: string[];
		gradeChange?: string;
		goalUpdates?: string;
		scheduleChanges?: { timePerSession?: number; sessionsPerWeek?: number };
	};
}

export interface GenerateDayPlanRequest {
	weekContext: {
		theme: string | null;
		focusAreas: string[];
		weekNotes: string | null;
		weekNumber: number;
	};
	dayContext: {
		date: string;
		dayOfWeek: DayOfWeek;
	};
	studentContext: {
		grade: string;
		subjects: string[];
		learningStyle?: string;
		recentProgress?: string;
		grades?: string;
		struggleAreas?: string;
		energyLevel?: EnergyLevel;
		extraInfo?: string;
	};
}

export interface SearchResourcesRequest {
	query: string;
	subjects: string[];
	grade: string;
	preferredSites: { name: string; url: string }[];
	maxResults?: number;
}

export interface AiGeneratedPlan {
	plan: {
		weeks: {
			weekNumber: number;
			weekStart: string;
			weekEnd: string;
			theme: string;
			focusAreas: string[];
			notes: string;
			days: {
				date: string;
				dayOfWeek: DayOfWeek;
				tasks: {
					section: TaskSection;
					title: string;
					description: string;
					durationMinutes: number;
				}[];
			}[];
		}[];
	};
	rawPrompt?: string;
}

export interface AiGeneratedDayPlan {
	dayPlan: {
		tasks: {
			section: TaskSection;
			title: string;
			description: string;
			durationMinutes: number;
		}[];
	};
}

export interface AiGeneratedResources {
	resources: {
		title: string;
		url: string;
		source: string;
		type: ResourceType;
		description: string;
	}[];
}

// ── Homework ──

export interface PlanWeekHomework {
	id: string;
	week_id: string;
	title: string;
	description: string | null;
	url: string | null;
	completed: boolean;
	sort_order: number;
	created_at: string;
	updated_at: string;
}

// ── Prepless AI Chat ──

export interface ChatMessage {
	role: 'user' | 'assistant';
	content: string;
}

export interface PlanChangeProposal {
	type:
		| 'week_theme'
		| 'focus_areas'
		| 'add_task'
		| 'remove_task'
		| 'adjust_schedule'
		| 'add_resources'
		| 'add_homework';
	description: string;
	mutations: PlanMutation[];
}

export interface PlanMutation {
	table: 'plan_weeks' | 'plan_days' | 'plan_tasks' | 'resources' | 'plan_week_homework';
	action: 'update' | 'insert';
	data: Record<string, unknown>;
}

export interface PreplessChatRequest {
	messages: ChatMessage[];
	studentContext: {
		id: string;
		name: string;
		grade: string;
		subjects: string[];
		diagnosticData?: string;
		extraInfo?: string;
	};
	planContext?: {
		id: string;
		weeks: Array<{
			id: string;
			weekNumber: number;
			theme: string | null;
			focusAreas: string[];
			notes: string | null;
		}>;
	};
}

export interface PreplessChatResponse {
	message: string;
	intent: 'info' | 'edit_plan' | 'edit_day' | 'add_resources' | 'unknown';
	proposedChanges?: PlanChangeProposal;
}

// ── Parent Emails ──

export interface ParentEmail {
	id: string;
	tutor_id: string;
	student_id: string;
	subject: string;
	body: string;
	status: 'draft' | 'sent' | 'failed';
	sent_at: string | null;
	created_at: string;
	updated_at: string;
}

export interface GenerateEmailRequest {
	studentId: string;
	planId?: string;
	focusAreas?: string[];
	additionalNotes?: string;
}

export interface GenerateEmailResponse {
	subject: string;
	body: string;
}

// ── AI Resource Picker ──

export interface AiPickResourcesRequest {
	tasks: Array<{
		id: string;
		title: string;
		description: string | null;
		section: string;
	}>;
	studentContext: {
		grade: string;
		subjects: string[];
		preferredSites: Array<{ name: string; url: string }>;
	};
	maxPerTask?: number;
}

export interface AiPickResourcesResponse {
	resources: Array<{
		taskId: string;
		title: string;
		url: string;
		source: string;
		type: ResourceType;
		description: string;
		relevance: string;
	}>;
}
