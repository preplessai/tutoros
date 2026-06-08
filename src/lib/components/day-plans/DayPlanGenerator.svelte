<script lang="ts">
	import { onMount } from 'svelte';
	import { planStore } from '$lib/stores/plan.svelte';
	import { studentStore } from '$lib/stores/student.svelte';
	import { dayPlanStore } from '$lib/stores/dayPlan.svelte';
	import { GRADES } from '$lib/lib/constants';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
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
	let recentProgress = $state('');
	let grades = $state('');
	let struggleAreas = $state('');
	let energyLevel = $state('medium');
	let learningStyle = $state('visual');

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
			learningStyle,
			recentProgress,
			grades,
			struggleAreas,
			energyLevel: energyLevel as 'low' | 'medium' | 'high'
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

	<Select
		label="Energy Level"
		name="energyLevel"
		options={[
			{ value: 'low', label: 'Low — passive, review-focused' },
			{ value: 'medium', label: 'Medium — typical session' },
			{ value: 'high', label: 'High — ready for challenges' }
		]}
		value={energyLevel}
		onchange={(e) => (energyLevel = (e.target as HTMLSelectElement).value)}
	/>

	<Select
		label="Learning Style"
		name="learningStyle"
		options={[
			{ value: 'visual', label: 'Visual' },
			{ value: 'auditory', label: 'Auditory' },
			{ value: 'hands-on', label: 'Hands-on' },
			{ value: 'reading/writing', label: 'Reading/Writing' },
			{ value: 'mixed', label: 'Mixed' }
		]}
		value={learningStyle}
		onchange={(e) => (learningStyle = (e.target as HTMLSelectElement).value)}
	/>

	<Textarea
		label="Recent School Progress"
		name="recentProgress"
		value={recentProgress}
		oninput={(e) => (recentProgress = (e.target as HTMLTextAreaElement).value)}
		placeholder="What has the student covered recently? Any recent test scores?"
		rows={2}
	/>

	<Input
		label="Current Grades"
		name="grades"
		value={grades}
		oninput={(e) => (grades = (e.target as HTMLInputElement).value)}
		placeholder="e.g., B+ in Algebra, A- in Chemistry"
	/>

	<Textarea
		label="Areas of Struggle"
		name="struggleAreas"
		value={struggleAreas}
		oninput={(e) => (struggleAreas = (e.target as HTMLTextAreaElement).value)}
		placeholder="Specific topics or skills the student finds difficult"
		rows={2}
	/>

	<Button type="submit" variant="gradient" size="lg" loading={dayPlanStore.generating} fullWidth>
		{dayPlanStore.generating ? 'Generating...' : 'Generate Day Plan'}
	</Button>
</form>
