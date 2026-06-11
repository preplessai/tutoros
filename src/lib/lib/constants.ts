export const SECTION_LABELS: Record<string, string> = {
	review_struggles: 'Review Struggle Areas',
	homework_help: 'Homework Help',
	project_help: 'Project Help',
	learn_new: 'Learn Something New',
	practice: 'Practice',
	wrap_up: 'Wrap Up'
};

export const SECTION_COLORS: Record<string, string> = {
	review_struggles: 'border-l-[var(--color-error)] bg-[var(--color-error-bg)]',
	homework_help: 'border-l-[var(--color-warning)] bg-[var(--color-warning-bg)]',
	project_help: 'border-l-[var(--color-primary-500)] bg-[var(--color-primary-900)]',
	learn_new: 'border-l-[var(--color-info)] bg-[var(--color-info-bg)]',
	practice: 'border-l-[var(--color-success)] bg-[var(--color-success-bg)]',
	wrap_up: 'border-l-[var(--color-text-tertiary)] bg-[var(--color-surface-tertiary)]'
};

export const SECTION_BADGE_COLORS: Record<string, string> = {
	review_struggles: 'danger',
	homework_help: 'warning',
	project_help: 'purple',
	learn_new: 'primary',
	practice: 'success',
	wrap_up: 'default'
};

export const DAYS_OF_WEEK = [
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
	'sunday'
] as const;

export const GRADES = [
	'Kindergarten',
	'1st',
	'2nd',
	'3rd',
	'4th',
	'5th',
	'6th',
	'7th',
	'8th',
	'9th',
	'10th',
	'11th',
	'12th',
	'College Freshman',
	'College Sophomore',
	'College Junior',
	'College Senior'
];

export const SUBJECTS = [
	'Mathematics',
	'Algebra',
	'Geometry',
	'Trigonometry',
	'Calculus',
	'Statistics',
	'English',
	'Literature',
	'Writing',
	'Biology',
	'Chemistry',
	'Physics',
	'Computer Science',
	'History',
	'Geography',
	'Social Studies',
	'Economics',
	'Foreign Language',
	'Art',
	'Music'
];

export const RESOURCE_SITES = [
	{ name: 'Khan Academy', url: 'https://www.khanacademy.org' },
	{ name: 'W3Schools', url: 'https://www.w3schools.com' },
	{ name: 'IXL', url: 'https://www.ixl.com' },
	{ name: 'Quizlet', url: 'https://quizlet.com' },
	{ name: 'CK-12', url: 'https://www.ck12.org' },
	{ name: 'Desmos', url: 'https://www.desmos.com' },
	{ name: 'Brilliant', url: 'https://brilliant.org' },
	{ name: 'Wolfram Alpha', url: 'https://www.wolframalpha.com' }
];

export const SUBSCRIPTION_TIERS = {
	free: {
		name: 'Free',
		maxStudents: 1,
		maxPlans: 1,
		monthlyCredits: 0,
		features: ['game_plan', 'parent_email', 'resource_links']
	},
	starter: {
		name: 'Starter',
		maxStudents: 4,
		maxPlans: Infinity,
		monthlyCredits: 15,
		features: [
			'game_plan', 'parent_email', 'resource_links',
			'homework_tracking', 'plan_regeneration'
		]
	},
	pro: {
		name: 'Pro',
		maxStudents: 8,
		maxPlans: Infinity,
		monthlyCredits: 30,
		features: [
			'game_plan', 'parent_email', 'resource_links',
			'homework_tracking', 'plan_regeneration',
			'struggle_aware', 'weekly_adaptation', 'progress_reports'
		]
	},
	enterprise: {
		name: 'Enterprise',
		maxStudents: 20,
		maxPlans: Infinity,
		monthlyCredits: 75, // hard cap, displayed as "unlimited"
		features: [
			'game_plan', 'parent_email', 'resource_links',
			'homework_tracking', 'plan_regeneration',
			'struggle_aware', 'weekly_adaptation', 'progress_reports'
		]
	}
};

export function canUseFeature(tier: string, feature: string): boolean {
	const tierConfig = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];
	if (!tierConfig) return false;
	return tierConfig.features.includes(feature);
}
