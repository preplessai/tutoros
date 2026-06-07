<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { planStore } from '$lib/stores/plan.svelte';
	import { studentStore } from '$lib/stores/student.svelte';
	import { GRADES, SUBJECTS } from '$lib/lib/constants';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import Card from '$lib/components/ui/Card.svelte';

	let step = $state(0);
	const steps = ['Student', 'Subjects', 'Schedule', 'Goals'];

	let studentId = $state(($page.url.searchParams.get('studentId') || ''));
	let grade = $state('');
	let selectedSubjects = $state<string[]>([]);
	let timePerSession = $state(60);
	let sessionsPerWeek = $state(2);
	let startDate = $state('');
	let endDate = $state('');
	let importantDates = $state<{ date: string; label: string; type: string }[]>([]);
	let goals = $state('');
	let learningStyle = $state('');
	let newDateLabel = $state('');
	let newDateValue = $state('');
	let newDateType = $state('exam');

	onMount(() => { studentStore.fetchAll(); });

	function addImportantDate() {
		if (!newDateValue || !newDateLabel) return;
		importantDates = [...importantDates, { date: newDateValue, label: newDateLabel.trim(), type: newDateType }];
		newDateLabel = ''; newDateValue = '';
	}

	function removeDate(index: number) {
		importantDates = importantDates.filter((_, i) => i !== index);
	}

	function toggleSubject(s: string) {
		selectedSubjects = selectedSubjects.includes(s) ? selectedSubjects.filter(x => x !== s) : [...selectedSubjects, s];
	}

	function canProceed(): boolean {
		if (step === 0) return !!studentId;
		if (step === 1) return selectedSubjects.length > 0;
		if (step === 2) return !!startDate && !!endDate && timePerSession > 0 && sessionsPerWeek > 0;
		return true;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!canProceed()) return;

		const planId = await planStore.generateAndSave({
			studentId, grade, subjects: selectedSubjects,
			timePerSession, sessionsPerWeek, startDate, endDate,
			importantDates, goals, learningStyle
		});
		if (planId) goto(`/dashboard/plans/${planId}`);
	}
</script>

<form onsubmit={handleSubmit} class="max-w-3xl">
	<!-- Step Progress Indicator -->
	<div class="mb-10">
		<div class="flex items-center justify-between">
			{#each steps as label, i}
				<button type="button" onclick={() => { if (i < step || (i > 0 && canProceed())) step = i; }} class="flex flex-col items-center gap-2 group cursor-pointer">
					<div class={`h-10 w-10 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-300
						${i < step ? 'bg-[var(--color-success)] text-white shadow-clay-sm' :
							i === step ? 'bg-[var(--color-primary-500)] text-white shadow-clay-md scale-110' :
							'bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]'}`}>
						{#if i < step}
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
						{:else}
							{i + 1}
						{/if}
					</div>
					<span class={`text-xs font-medium transition-colors ${i === step ? 'text-[var(--color-primary-600)]' : i < step ? 'text-[var(--color-success)]' : 'text-[var(--color-text-tertiary)]'}`}>{label}</span>
				</button>

				{#if i < steps.length - 1}
					<div class="flex-1 h-0.5 mx-3 rounded-full transition-colors duration-300 {i < step ? 'bg-[var(--color-success)]' : 'bg-[var(--color-surface-tertiary)]'}"></div>
				{/if}
			{/each}
		</div>
	</div>

	<!-- Step 0: Student -->
	{#if step === 0}
		<div class="animate-fade-in-up space-y-6">
			<h2 class="text-xl font-bold text-[var(--color-text-primary)] font-[family-name:var(--font-heading)]">Who are you planning for?</h2>
			<p class="text-sm text-[var(--color-text-secondary)]">Select a student or <a href="/dashboard/students/new" class="text-[var(--color-primary-500)] font-medium">create a new one</a> first.</p>

			<div class="grid sm:grid-cols-2 gap-4">
				{#each studentStore.students as s}
					<button type="button" onclick={() => { studentId = s.id; grade = s.grade; selectedSubjects = s.subjects || []; learningStyle = s.learning_style || ''; }} class={`text-left p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer
						${studentId === s.id ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-100)] shadow-clay-sm' : 'border-[var(--color-border)] bg-[var(--color-surface-elevated)] hover:border-[var(--color-border-strong)]'}`}>
						<div class="flex items-center gap-3">
							<div class="h-10 w-10 rounded-xl bg-gradient-to-br from-[var(--color-primary-400)] to-[var(--color-accent-400)] flex items-center justify-center text-white font-bold text-sm">{s.name[0]}</div>
							<div>
								<p class="font-semibold text-[var(--color-text-primary)] text-sm">{s.name}</p>
								<p class="text-xs text-[var(--color-text-secondary)]">{s.grade}{#if s.subjects?.length} · {s.subjects.slice(0,2).join(', ')}{/if}</p>
							</div>
							{#if studentId === s.id}
								<svg class="h-5 w-5 ml-auto text-[var(--color-primary-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
							{/if}
						</div>
					</button>
				{/each}
			</div>

			{#if studentStore.students.length === 0}
				<div class="text-center py-10">
					<div class="h-16 w-16 rounded-2xl bg-[var(--color-surface-tertiary)] flex items-center justify-center mx-auto mb-4">
						<svg class="h-8 w-8 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
					</div>
					<p class="text-sm text-[var(--color-text-secondary)]">No students yet. Create one first.</p>
					<div class="mt-4">
						<Button variant="primary" size="sm" href="/dashboard/students/new">Add Student</Button>
					</div>
				</div>
			{/if}

			<Select label="Grade" name="grade" options={GRADES.map(g => ({ value: g, label: g }))} value={grade} onchange={e => grade = (e.target as HTMLSelectElement).value} required />
		</div>
	{/if}

	<!-- Step 1: Subjects -->
	{#if step === 1}
		<div class="animate-fade-in-up space-y-6">
			<h2 class="text-xl font-bold text-[var(--color-text-primary)] font-[family-name:var(--font-heading)]">What subjects to cover?</h2>
			<p class="text-sm text-[var(--color-text-secondary)]">Pick the subjects for this tutoring plan.</p>

			<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
				{#each SUBJECTS as subject}
					<button type="button" onclick={() => toggleSubject(subject)} class={`px-3 py-2.5 text-sm rounded-xl border-2 font-medium transition-all duration-200 cursor-pointer
						${selectedSubjects.includes(subject) ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-100)] text-[var(--color-primary-700)] shadow-clay-sm' : 'border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'}`}>
						{subject}
					</button>
				{/each}
			</div>

			<Select label="Learning Style" name="learningStyle" placeholder="Select (optional)" options={[
				{ value: 'visual', label: 'Visual — learns best by seeing' }, { value: 'auditory', label: 'Auditory — learns best by hearing' },
				{ value: 'hands-on', label: 'Hands-on — learns by doing' }, { value: 'reading/writing', label: 'Reading/Writing' }, { value: 'mixed', label: 'Mixed' }
			]} value={learningStyle} onchange={e => learningStyle = (e.target as HTMLSelectElement).value} />
		</div>
	{/if}

	<!-- Step 2: Schedule -->
	{#if step === 2}
		<div class="animate-fade-in-up space-y-6">
			<h2 class="text-xl font-bold text-[var(--color-text-primary)] font-[family-name:var(--font-heading)]">When does tutoring happen?</h2>
			<p class="text-sm text-[var(--color-text-secondary)]">Set up the session schedule and plan duration.</p>

			<div class="grid md:grid-cols-2 gap-4">
				<Input label="Minutes per Session" name="timePerSession" type="number" min="15" max="480" value={timePerSession} oninput={e => timePerSession = parseInt((e.target as HTMLInputElement).value)} required />
				<Input label="Sessions per Week" name="sessionsPerWeek" type="number" min="1" max="14" value={sessionsPerWeek} oninput={e => sessionsPerWeek = parseInt((e.target as HTMLInputElement).value)} required />
			</div>

			<div class="grid md:grid-cols-2 gap-4">
				<DatePicker label="Start Date" name="startDate" value={startDate} onchange={e => startDate = (e.target as HTMLInputElement).value} required />
				<DatePicker label="End Date" name="endDate" value={endDate} onchange={e => endDate = (e.target as HTMLInputElement).value} required />
			</div>

			<div>
				<label class="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Important Dates <span class="text-[var(--color-text-tertiary)] font-normal">(exams, holidays)</span></label>
				<div class="space-y-2 mb-3">
					{#each importantDates as d, i}
						<div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-surface-secondary)] text-sm border border-[var(--color-border)]">
							<span class="font-medium text-[var(--color-text-primary)]">{d.date}</span>
							<span class="text-[var(--color-text-tertiary)]">—</span>
							<span class="text-[var(--color-text-secondary)]">{d.label}</span>
							<span class="px-1.5 py-0.5 rounded-lg text-xs bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)] capitalize">{d.type}</span>
							<button type="button" onclick={() => removeDate(i)} class="ml-auto text-[var(--color-error)] hover:opacity-70 cursor-pointer font-bold">&times;</button>
						</div>
					{/each}
				</div>
				<div class="flex flex-wrap gap-2">
					<Input name="newDateLabel" value={newDateLabel} oninput={e => newDateLabel = (e.target as HTMLInputElement).value} placeholder="e.g. Math Exam" />
					<DatePicker name="newDate" value={newDateValue} onchange={e => newDateValue = (e.target as HTMLInputElement).value} />
					<select class="clay-input text-sm" bind:value={newDateType}>
						<option value="exam">Exam</option>
						<option value="holiday">Holiday</option>
						<option value="other">Other</option>
					</select>
					<Button type="button" variant="secondary" size="sm" onclick={addImportantDate}>Add</Button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Step 3: Goals + Submit -->
	{#if step === 3}
		<div class="animate-fade-in-up space-y-6">
			<h2 class="text-xl font-bold text-[var(--color-text-primary)] font-[family-name:var(--font-heading)]">What are the goals?</h2>
			<p class="text-sm text-[var(--color-text-secondary)]">Tell the AI what this student needs to achieve. Be specific for best results.</p>

			<Textarea label="Goals & Target Outcomes" name="goals" placeholder="Example: Improve Algebra grade from B to A by end of semester. Master quadratic equations. Prepare for state standardized test in May. Build confidence in word problems." value={goals} oninput={e => goals = (e.target as HTMLTextAreaElement).value} rows={5} />

			<Card>
				<h4 class="text-sm font-semibold text-[var(--color-text-primary)] mb-3 font-[family-name:var(--font-heading)]">Plan Summary</h4>
				<div class="grid grid-cols-2 gap-3 text-sm">
					<div><span class="text-[var(--color-text-tertiary)]">Student:</span> <span class="font-medium text-[var(--color-text-primary)]">{studentStore.students.find(s => s.id === studentId)?.name || '—'}</span></div>
					<div><span class="text-[var(--color-text-tertiary)]">Grade:</span> <span class="font-medium text-[var(--color-text-primary)]">{grade || '—'}</span></div>
					<div><span class="text-[var(--color-text-tertiary)]">Subjects:</span> <span class="font-medium text-[var(--color-text-primary)]">{selectedSubjects.join(', ') || '—'}</span></div>
					<div><span class="text-[var(--color-text-tertiary)]">Schedule:</span> <span class="font-medium text-[var(--color-text-primary)]">{timePerSession}min × {sessionsPerWeek}/wk</span></div>
					<div class="col-span-2"><span class="text-[var(--color-text-tertiary)]">Dates:</span> <span class="font-medium text-[var(--color-text-primary)]">{startDate} — {endDate || '—'}</span></div>
				</div>
			</Card>
		</div>
	{/if}

	<!-- Navigation -->
	<div class="flex items-center justify-between mt-8 pt-6 border-t border-[var(--color-border)]">
		<button type="button" onclick={() => step = Math.max(0, step - 1)} class={`text-sm font-medium transition-colors cursor-pointer ${step === 0 ? 'text-[var(--color-text-tertiary)] pointer-events-none' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}>
			← Back
		</button>

		<div class="flex items-center gap-3">
			<span class="text-xs text-[var(--color-text-tertiary)]">Step {step + 1} of {steps.length}</span>
			{#if step < steps.length - 1}
				<Button type="button" variant="primary" onclick={() => step = Math.min(steps.length - 1, step + 1)} disabled={!canProceed()}>
					Continue
				</Button>
			{:else}
				<Button type="submit" variant="gradient" size="lg" loading={planStore.generating}>
					{planStore.generating ? 'Generating with AI...' : 'Generate Weekly Plan'}
				</Button>
			{/if}
		</div>
	</div>
</form>
