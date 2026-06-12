<script lang="ts">
	import { planStore } from '$lib/stores/plan.svelte';
	import { studentStore } from '$lib/stores/student.svelte';
	import { dayPlanStore } from '$lib/stores/dayPlan.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { canUseFeature } from '$lib/lib/constants';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';

	let {
		weekId,
		weekContext,
		onComplete
	}: {
		weekId: string;
		weekContext: {
			theme: string | null;
			focusAreas: string[];
			notes: string | null;
			weekNumber: number;
		};
		onComplete?: () => void;
	} = $props();

	let dayDate = $state('');
	let grades = $state('');
	let struggleAreas = $state('');

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		const plan = planStore.current;
		if (!plan || !dayDate) return;

		const dayOfWeek = new Date(dayDate + 'T00:00:00')
			.toLocaleDateString('en-US', { weekday: 'long' })
			.toLowerCase();

		const studentContext = {
			grade: plan.grade,
			subjects: plan.subjects,
			grades,
			struggleAreas,
			extraInfo:
				studentStore.students.find((s) => s.id === plan.student_id)?.extra_info || undefined
		};

		const dayId = await dayPlanStore.generateAndSave(
			weekId,
			dayDate,
			dayOfWeek,
			weekContext,
			studentContext
		);
		if (dayId) onComplete?.();
	}
</script>

<form onsubmit={handleSubmit} class="space-y-5">
	<p class="text-sm text-[var(--color-text-secondary)]">
		Create a detailed plan for a single day within this week.
	</p>

	<DatePicker
		label="Day Date"
		name="dayDate"
		value={dayDate}
		onchange={(e) => (dayDate = (e.target as HTMLInputElement).value)}
		required
	/>

	<Input
		label="Current Grades"
		name="grades"
		value={grades}
		oninput={(e) => (grades = (e.target as HTMLInputElement).value)}
		placeholder="e.g., B+ in Algebra, A- in Chemistry"
	/>

	{#if canUseFeature(auth.profile?.subscription_tier || 'free', 'struggle_aware')}
		<Textarea
			label="Areas of Struggle"
			name="struggleAreas"
			value={struggleAreas}
			oninput={(e) => (struggleAreas = (e.target as HTMLTextAreaElement).value)}
			placeholder="Specific topics or skills the student finds difficult"
			rows={2}
		/>
	{:else}
		<div
			class="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-3 text-center"
		>
			<p class="text-sm text-[var(--color-text-secondary)]">
				<svg
					class="inline h-4 w-4 align-text-bottom"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
					/>
				</svg>
				Struggle-aware planning is a <strong>Pro</strong> feature.
				<a href="/pricing" class="ml-1 font-medium text-[var(--color-primary-500)] underline"
					>Upgrade →</a
				>
			</p>
		</div>
	{/if}

	<Button type="submit" variant="gradient" size="lg" loading={dayPlanStore.generating} fullWidth>
		{dayPlanStore.generating ? 'Generating...' : 'Generate Day Plan'}
	</Button>
</form>
