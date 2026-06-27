<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { planStore } from '$lib/stores/plan.svelte';
	import { studentStore } from '$lib/stores/student.svelte';
	import { GRADES, SUBJECTS, DURATIONS, SESSION_MINUTES_OPTIONS } from '$lib/lib/constants';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Card from '$lib/components/ui/Card.svelte';

	let step = $state(0);
	const steps = ['Student', 'Schedule', 'Goals & Summary'];

	let studentId = $state('');
	let grade = $state('');
	let selectedSubjects = $state<string[]>([]);
	let timePerSession = $state(60);
	let sessionsPerWeek = $state(2);
	let duration = $state('3 months');
	let customEndDate = $state('');
	let goals = $state('');
	let generating = $state(false);

	let selectedStudent = $derived(studentStore.students.find((s) => s.id === studentId));

	onMount(async () => {
		await studentStore.fetchAll();
		const studentIdParam = $page.url.searchParams.get('studentId');
		if (studentIdParam) {
			const student = studentStore.students.find((s) => s.id === studentIdParam);
			if (student) {
				studentId = studentIdParam;
				grade = student.grade;
				selectedSubjects = student.subjects || [];
				step = 1; // Skip student selection
			}
		}
	});

	function toggleSubject(s: string) {
		selectedSubjects = selectedSubjects.includes(s)
			? selectedSubjects.filter((x) => x !== s)
			: [...selectedSubjects, s];
	}

	function canProceed(): boolean {
		if (step === 0) return !!studentId;
		if (step === 1)
			return timePerSession > 0 && sessionsPerWeek > 0 && (duration !== 'custom' || !!customEndDate);
		return true;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!canProceed()) return;

		generating = true;

		const startDate = new Date().toISOString().split('T')[0];

		let endDate: string;
		if (duration === 'custom') {
			endDate = customEndDate;
		} else {
			const days = duration === '3 months' ? 90 : duration === '6 months' ? 180 : 365;
			const d = new Date();
			d.setDate(d.getDate() + days);
			endDate = d.toISOString().split('T')[0];
		}

		const student = selectedStudent;

		const planId = await planStore.generateAndSave({
			studentId,
			grade,
			subjects: selectedSubjects,
			timePerSession,
			sessionsPerWeek,
			duration,
			startDate,
			endDate,
			goals,
			diagnosticData: student?.diagnostic_data || undefined,
			extraInfo: student?.extra_info || undefined,
			preferredResourceSites: student?.preferred_resource_sites || undefined
		});

		if (planId) goto(`/dashboard/students/${studentId}?tab=timeline`);
	}
</script>

<form onsubmit={handleSubmit} class="max-w-3xl">
	<!-- Step Progress Indicator -->
	<div class="mb-10">
		<div class="flex items-center justify-between">
			{#each steps as label, i}
				{#if i === 0 && studentId}
					<!-- Skip showing student step if pre-selected -->
				{:else}
					<button
						type="button"
						onclick={() => {
							if (i < step || (i > 0 && canProceed())) step = i;
						}}
						class="group flex cursor-pointer flex-col items-center gap-2"
					>
						<div
							class={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold transition-all duration-300
							${i < step ? 'shadow-clay-sm bg-[var(--color-success)] text-white' : i === step ? 'shadow-clay-md scale-110 bg-[var(--color-primary-500)] text-white' : 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]'}`}
						>
							{#if i < step}
								<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
									><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
							{:else}
								{i + 1}
							{/if}
						</div>
						<span class={`text-xs font-medium transition-colors ${i === step ? 'text-[var(--color-primary-600)]' : i < step ? 'text-[var(--color-success)]' : 'text-[var(--color-text-tertiary)]'}`}>
							{label}
						</span>
					</button>

					{#if i < steps.length - 1 && !(i === 0 && studentId)}
						<div class="mx-3 h-0.5 flex-1 rounded-full transition-colors duration-300 {i < step ? 'bg-[var(--color-success)]' : 'bg-[var(--color-surface-tertiary)]'}"></div>
					{/if}
				{/if}
			{/each}
		</div>
	</div>

	<!-- Step 0: Student -->
	{#if step === 0}
		<div class="animate-fade-in-up space-y-6">
			<h2 class="font-[family-name:var(--font-heading)] text-xl font-bold text-[var(--color-text-primary)]">
				Who are you planning for?
			</h2>
			<p class="text-sm text-[var(--color-text-secondary)]">
				Select an existing student or <a href="/dashboard/students/new" class="font-medium text-[var(--color-primary-500)]">add a new one</a> first.
			</p>

			<div class="grid gap-4 sm:grid-cols-2">
				{#each studentStore.students as s}
					<button
						type="button"
						onclick={() => {
							studentId = s.id;
							grade = s.grade;
							selectedSubjects = s.subjects || [];
						}}
						class={`cursor-pointer rounded-2xl border-2 p-4 text-left transition-all duration-200
						${studentId === s.id ? 'shadow-clay-sm border-[var(--color-primary-500)] bg-[var(--color-primary-100)]' : 'border-[var(--color-border)] bg-[var(--color-surface-elevated)] hover:border-[var(--color-border-strong)]'}`}
					>
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary-400)] to-[var(--color-accent-400)] text-sm font-bold text-white">
								{s.name[0]}
							</div>
							<div>
								<p class="text-sm font-semibold text-[var(--color-text-primary)]">{s.name}</p>
								<p class="text-xs text-[var(--color-text-secondary)]">
									{s.grade}{#if s.subjects?.length} · {s.subjects.slice(0, 2).join(', ')}{/if}
								</p>
							</div>
							{#if studentId === s.id}
								<svg class="ml-auto h-5 w-5 text-[var(--color-primary-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"
									><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
							{/if}
						</div>
					</button>
				{/each}
			</div>

			{#if studentStore.students.length === 0}
				<div class="py-10 text-center">
					<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-surface-tertiary)]">
						<svg class="h-8 w-8 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"
							><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
					</div>
					<p class="text-sm text-[var(--color-text-secondary)]">No students yet. Create one first.</p>
					<div class="mt-4">
						<Button variant="gradient" size="sm" href="/dashboard/students/new">Add Student</Button>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Step 1: Schedule -->
	{#if step === 1}
		<div class="animate-fade-in-up space-y-6">
			<h2 class="font-[family-name:var(--font-heading)] text-xl font-bold text-[var(--color-text-primary)]">What subjects to cover?</h2>
			<p class="text-sm text-[var(--color-text-secondary)]">Pick the subjects for this tutoring plan.</p>

			<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
				{#each SUBJECTS as subject}
					<button
						type="button"
						onclick={() => toggleSubject(subject)}
						class={`cursor-pointer rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all duration-200
						${selectedSubjects.includes(subject) ? 'shadow-clay-sm border-[var(--color-primary-500)] bg-[var(--color-primary-100)] text-[var(--color-primary-700)]' : 'border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'}`}
					>
						{subject}
					</button>
				{/each}
			</div>

			<h2 class="pt-4 font-[family-name:var(--font-heading)] text-xl font-bold text-[var(--color-text-primary)]">Set the schedule</h2>
			<p class="text-sm text-[var(--color-text-secondary)]">How often and for how long?</p>

			<div class="grid gap-4 md:grid-cols-3">
				<Select
					label="Sessions per Week"
					name="sessionsPerWeek"
					options={[1, 2, 3, 4, 5, 6, 7].map((n) => ({ value: n.toString(), label: n.toString() }))}
					value={sessionsPerWeek.toString()}
					onchange={(e) => (sessionsPerWeek = parseInt((e.target as HTMLSelectElement).value))}
				/>
				<Select
					label="Minutes per Session"
					name="timePerSession"
					options={SESSION_MINUTES_OPTIONS.map((n) => ({ value: n.toString(), label: `${n} min` }))}
					value={timePerSession.toString()}
					onchange={(e) => (timePerSession = parseInt((e.target as HTMLSelectElement).value))}
				/>
				<Select
					label="Duration"
					name="duration"
					options={DURATIONS.map((d) => ({ value: d.value, label: d.label }))}
					value={duration}
					onchange={(e) => (duration = (e.target as HTMLSelectElement).value)}
				/>
			</div>
			{#if duration === 'custom'}
				<Input label="Custom End Date" name="customEndDate" type="date" bind:value={customEndDate} />
			{/if}
		</div>
	{/if}

	<!-- Step 2: Goals & Summary -->
	{#if step === 2}
		<div class="animate-fade-in-up space-y-6">
			<h2 class="font-[family-name:var(--font-heading)] text-xl font-bold text-[var(--color-text-primary)]">What are the goals?</h2>
			<p class="text-sm text-[var(--color-text-secondary)]">Tell the AI what this student needs to achieve. Be specific for best results.</p>

			<Textarea
				label="Goals & Target Outcomes"
				name="goals"
				placeholder="Example: Improve Algebra grade from B to A by end of semester. Master quadratic equations. Prepare for state standardized test in May. Build confidence in word problems."
				value={goals}
				oninput={(e) => (goals = (e.target as HTMLTextAreaElement).value)}
				rows={5}
			/>

			<Card>
				<h4 class="mb-3 font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--color-text-primary)]">Plan Summary</h4>
				<div class="grid grid-cols-2 gap-3 text-sm">
					<div>
						<span class="text-[var(--color-text-tertiary)]">Student:</span>
						<span class="font-medium text-[var(--color-text-primary)]">{selectedStudent?.name || '—'}</span>
					</div>
					<div>
						<span class="text-[var(--color-text-tertiary)]">Grade:</span>
						<span class="font-medium text-[var(--color-text-primary)]">{grade || '—'}</span>
					</div>
					<div>
						<span class="text-[var(--color-text-tertiary)]">Subjects:</span>
						<span class="font-medium text-[var(--color-text-primary)]">{selectedSubjects.join(', ') || '—'}</span>
					</div>
					<div>
						<span class="text-[var(--color-text-tertiary)]">Schedule:</span>
						<span class="font-medium text-[var(--color-text-primary)]">{sessionsPerWeek}×/wk · {timePerSession}min</span>
					</div>
					<div class="col-span-2">
						<span class="text-[var(--color-text-tertiary)]">Duration:</span>
						<span class="font-medium text-[var(--color-text-primary)]">{duration === 'custom' ? customEndDate : duration}</span>
					</div>
				</div>
				{#if selectedStudent?.extra_info}
					<div class="mt-3 border-t border-[var(--color-border)] pt-3">
						<span class="text-xs font-medium tracking-wider text-[var(--color-text-tertiary)] uppercase">About this student</span>
						<p class="mt-1 text-sm text-[var(--color-text-secondary)]">{selectedStudent.extra_info}</p>
					</div>
				{/if}
			</Card>
		</div>
	{/if}

	<!-- Navigation -->
	<div class="mt-8 flex items-center justify-between border-t border-[var(--color-border)] pt-6">
		<button
			type="button"
			onclick={() => (step = Math.max(0, step - 1))}
			class={`cursor-pointer text-sm font-medium transition-colors ${step === 0 ? 'pointer-events-none text-[var(--color-text-tertiary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
		>
			← Back
		</button>

		<div class="flex items-center gap-3">
			<span class="text-xs text-[var(--color-text-tertiary)]">Step {step + 1} of {steps.length}</span>
			{#if step < steps.length - 1}
				<Button type="button" variant="primary" onclick={() => (step = Math.min(steps.length - 1, step + 1))} disabled={!canProceed()}>
					Continue
				</Button>
			{:else}
				<Button type="submit" variant="gradient" size="lg" loading={generating}>
					{generating ? 'Generating...' : 'Generate Plan'}
				</Button>
			{/if}
		</div>
	</div>
</form>
