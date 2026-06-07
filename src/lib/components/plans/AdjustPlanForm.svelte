<script lang="ts">
	import { planStore } from '$lib/stores/plan.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { goto } from '$app/navigation';
	import { SUBJECTS } from '$lib/lib/constants';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';

	let unavailableDates = $state<string[]>([]);
	let newDateStr = $state('');
	let newSubjects = $state<string[]>([]);
	let removedSubjects = $state<string[]>([]);
	let goalUpdates = $state('');
	let changedTimePerSession = $state('');
	let changedSessionsPerWeek = $state('');

	function addUnavailableDate() {
		if (!newDateStr) return;
		unavailableDates = [...unavailableDates, newDateStr];
		newDateStr = '';
	}

	function removeDate(index: number) {
		unavailableDates = unavailableDates.filter((_, i) => i !== index);
	}

	function toggleNewSubject(s: string) {
		newSubjects = newSubjects.includes(s) ? newSubjects.filter(x => x !== s) : [...newSubjects, s];
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		const changes: any = {};

		if (unavailableDates.length) changes.unavailableDates = unavailableDates;
		if (newSubjects.length) changes.newSubjects = newSubjects;
		if (removedSubjects.length) changes.removedSubjects = removedSubjects;
		if (goalUpdates.trim()) changes.goalUpdates = goalUpdates.trim();

		if (changedTimePerSession || changedSessionsPerWeek) {
			changes.scheduleChanges = {};
			if (changedTimePerSession) changes.scheduleChanges.timePerSession = parseInt(changedTimePerSession);
			if (changedSessionsPerWeek) changes.scheduleChanges.sessionsPerWeek = parseInt(changedSessionsPerWeek);
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

<form onsubmit={handleSubmit} class="space-y-8 max-w-2xl">
	<div>
		<label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Unavailable Dates</label>
		<div class="space-y-2 mb-3">
			{#each unavailableDates as d, i}
				<div class="flex items-center gap-2 p-2 rounded-lg bg-[var(--color-surface-secondary)] text-sm">
					<span class="text-[var(--color-text-secondary)]">{d}</span>
					<button type="button" onclick={() => removeDate(i)} class="ml-auto text-[var(--color-error)] cursor-pointer">&times;</button>
				</div>
			{/each}
		</div>
		<div class="flex gap-2">
			<DatePicker name="unavailableDate" value={newDateStr} onchange={e => newDateStr = (e.target as HTMLInputElement).value} />
			<Button type="button" variant="secondary" size="sm" onclick={addUnavailableDate}>Add</Button>
		</div>
	</div>

	<div>
		<label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Add New Subjects</label>
		<div class="flex flex-wrap gap-2">
			{#each SUBJECTS as subject}
				<button type="button" onclick={() => toggleNewSubject(subject)} class={`px-3 py-1.5 text-sm rounded-lg border transition-all cursor-pointer
					${newSubjects.includes(subject) ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-100)] bg-[var(--color-primary-100)] text-[var(--color-primary-700)] text-[var(--color-primary-700)]' : 'border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'}`}>
					{subject}
				</button>
			{/each}
		</div>
	</div>

	<Textarea label="Goal Updates" name="goalUpdates" value={goalUpdates} oninput={e => goalUpdates = (e.target as HTMLTextAreaElement).value} placeholder="Updated goals or focus areas..." rows={3} />

	<div class="grid md:grid-cols-2 gap-4">
		<Input label="Minutes per Session (new)" name="changedTime" type="number" placeholder="Leave blank to keep" value={changedTimePerSession} oninput={e => changedTimePerSession = (e.target as HTMLInputElement).value} />
		<Input label="Sessions per Week (new)" name="changedSessions" type="number" placeholder="Leave blank to keep" value={changedSessionsPerWeek} oninput={e => changedSessionsPerWeek = (e.target as HTMLInputElement).value} />
	</div>

	<Button type="submit" variant="gradient" size="lg" loading={planStore.generating} fullWidth>
					{planStore.generating ? 'Adjusting with AI...' : 'Adjust Plan'}
	</Button>
</form>
