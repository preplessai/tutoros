<script lang="ts">
	import { planStore } from '$lib/stores/plan.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { goto } from '$app/navigation';
	import { SUBJECTS, GRADES } from '$lib/lib/constants';
	import Select from '$lib/components/ui/Select.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';

	let unavailableDates = $state<string[]>([]);
	let newDateStr = $state('');
	let newSubjects = $state<string[]>([]);
	let removedSubjects = $state<string[]>([]);
	let goalUpdates = $state('');
	let gradeChange = $state('');
	let changedTimePerSession = $state('');
	let changedSessionsPerWeek = $state('');
	let editFocusAreaUpdates = $state('');
	let editContextUpdates = $state('');

	function addUnavailableDate() {
		if (!newDateStr) return;
		unavailableDates = [...unavailableDates, newDateStr];
		newDateStr = '';
	}

	function removeDate(index: number) {
		unavailableDates = unavailableDates.filter((_, i) => i !== index);
	}

	function toggleNewSubject(s: string) {
		newSubjects = newSubjects.includes(s)
			? newSubjects.filter((x) => x !== s)
			: [...newSubjects, s];
	}

	function toggleRemovedSubject(s: string) {
		removedSubjects = removedSubjects.includes(s)
			? removedSubjects.filter((x) => x !== s)
			: [...removedSubjects, s];
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		const changes: any = {};

		if (unavailableDates.length) changes.unavailableDates = unavailableDates;
		if (newSubjects.length) changes.newSubjects = newSubjects;
		if (removedSubjects.length) changes.removedSubjects = removedSubjects;
		if (goalUpdates.trim()) changes.goalUpdates = goalUpdates.trim();
		if (gradeChange) changes.gradeChange = gradeChange;

		if (editFocusAreaUpdates.trim()) changes.focusAreaUpdates = editFocusAreaUpdates.trim();
		if (editContextUpdates.trim()) changes.contextUpdates = editContextUpdates.trim();

		if (changedTimePerSession || changedSessionsPerWeek) {
			changes.scheduleChanges = {};
			if (changedTimePerSession)
				changes.scheduleChanges.timePerSession = parseInt(changedTimePerSession);
			if (changedSessionsPerWeek)
				changes.scheduleChanges.sessionsPerWeek = parseInt(changedSessionsPerWeek);
		}

		if (Object.keys(changes).length === 0) {
			toast.warning('No changes specified');
			return;
		}

		const currentPlan = planStore.current;
		if (!currentPlan) return;

		const success = await planStore.adjustPlan(currentPlan.id, changes);
		if (success) goto(`/dashboard/plans/${currentPlan.id}`);
	}
</script>

<form onsubmit={handleSubmit} class="max-w-2xl space-y-8">
	<div>
		<label class="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]"
			>Unavailable Dates</label
		>
		<div class="mb-3 space-y-2">
			{#each unavailableDates as d, i}
				<div
					class="flex items-center gap-2 rounded-lg bg-[var(--color-surface-secondary)] p-2 text-sm"
				>
					<span class="text-[var(--color-text-secondary)]">{d}</span>
					<button
						type="button"
						onclick={() => removeDate(i)}
						class="ml-auto cursor-pointer text-[var(--color-error)]">&times;</button
					>
				</div>
			{/each}
		</div>
		<div class="flex gap-2">
			<DatePicker
				name="unavailableDate"
				value={newDateStr}
				onchange={(e) => (newDateStr = (e.target as HTMLInputElement).value)}
			/>
			<Button type="button" variant="secondary" size="sm" onclick={addUnavailableDate}>Add</Button>
		</div>
	</div>

	<div>
		<label class="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]"
			>Add New Subjects</label
		>
		<div class="flex flex-wrap gap-2">
			{#each SUBJECTS as subject}
				<button
					type="button"
					onclick={() => toggleNewSubject(subject)}
					class={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-all
					${newSubjects.includes(subject) ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-100)] bg-[var(--color-primary-100)] text-[var(--color-primary-700)] text-[var(--color-primary-700)]' : 'border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'}`}
				>
					{subject}
				</button>
			{/each}
		</div>
	</div>

	<div>
		<label class="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]"
			>Remove Subjects</label
		>
		<div class="flex flex-wrap gap-2">
			{#each planStore.current?.subjects || [] as subject}
				<button
					type="button"
					onclick={() => toggleRemovedSubject(subject)}
					class={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-all
					${removedSubjects.includes(subject) ? 'border-[var(--color-error)] bg-[var(--color-error-bg)] text-[var(--color-error)] line-through' : 'border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'}`}
				>
					{subject}
				</button>
			{/each}
		</div>
	</div>

	<Select
		label="Change Grade (optional)"
		name="gradeChange"
		options={GRADES.map((g) => ({ value: g, label: g }))}
		bind:value={gradeChange}
	/>

	<Textarea
		label="Goal Updates"
		name="goalUpdates"
		value={goalUpdates}
		oninput={(e) => (goalUpdates = (e.target as HTMLTextAreaElement).value)}
		placeholder="Updated goals or focus areas..."
		rows={3}
	/>

	<div class="grid gap-4 md:grid-cols-2">
		<Input
			label="Minutes per Session (new)"
			name="changedTime"
			type="number"
			placeholder="Leave blank to keep"
			value={changedTimePerSession}
			oninput={(e) => (changedTimePerSession = (e.target as HTMLInputElement).value)}
		/>
		<Input
			label="Sessions per Week (new)"
			name="changedSessions"
			type="number"
			placeholder="Leave blank to keep"
			value={changedSessionsPerWeek}
			oninput={(e) => (changedSessionsPerWeek = (e.target as HTMLInputElement).value)}
		/>
	</div>

	<Textarea
		label="Focus Areas to Change"
		name="focusAreaUpdates"
		value={editFocusAreaUpdates}
		oninput={(e) => (editFocusAreaUpdates = (e.target as HTMLTextAreaElement).value)}
		placeholder="Specify which topics to emphasize or add..."
		rows={2}
	/>

	<Textarea
		label="Updated Diagnostic Context"
		name="contextUpdates"
		value={editContextUpdates}
		oninput={(e) => (editContextUpdates = (e.target as HTMLTextAreaElement).value)}
		placeholder="Any new information about the student's progress or needs..."
		rows={2}
	/>

	<Button type="submit" variant="gradient" size="lg" loading={planStore.generating} fullWidth>
		{planStore.generating ? 'Adjusting with AI...' : 'Adjust Plan'}
	</Button>
</form>
