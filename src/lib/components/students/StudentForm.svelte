<script lang="ts">
	import type { Student } from '$lib/lib/types';
	import {
		GRADES,
		SUBJECTS,
		LEARNING_PLATFORMS,
		DURATIONS,
		SESSION_MINUTES_OPTIONS
	} from '$lib/lib/constants';
	import { studentStore } from '$lib/stores/student.svelte';
	import { planStore } from '$lib/stores/plan.svelte';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';

	let { editStudent, onsave }: { editStudent?: Student | null; onsave?: () => void } = $props();

	const isEdit = !!editStudent;

	// ── Student fields ──
	let name = $state(editStudent?.name || '');
	let studentEmail = $state(editStudent?.email || '');
	let parentName = $state(editStudent?.parent_name || '');
	let parentEmail = $state(editStudent?.parent_email || '');
	let preferredContactMethod = $state(editStudent?.preferred_contact_method || '');
	let grade = $state(editStudent?.grade || '');
	let selectedSubjects = $state<string[]>(editStudent?.subjects || []);
	let selectedPlatforms = $state<string[]>(editStudent?.learning_platforms || []);
	let diagnosticData = $state(editStudent?.diagnostic_data || '');
	let extraInfo = $state(editStudent?.extra_info || '');
	let notes = $state(editStudent?.notes || '');

	// ── Plan fields (only for new student onboarding) ──
	let goal = $state('');
	let sessionsPerWeek = $state(2);
	let timePerSession = $state(60);
	let duration = $state('');
	let customEndDate = $state('');

	let step = $state(1);
	let saving = $state(false);
	let errors = $state<string[]>([]);

	const contactMethodOptions = [
		{ value: 'student_email', label: 'Student Email' },
		{ value: 'parent_email', label: 'Parent Email' }
	];

	function toggleSubject(subject: string) {
		if (selectedSubjects.includes(subject)) {
			selectedSubjects = selectedSubjects.filter((s) => s !== subject);
		} else {
			selectedSubjects = [...selectedSubjects, subject];
		}
	}

	function togglePlatform(platform: string) {
		if (selectedPlatforms.includes(platform)) {
			selectedPlatforms = selectedPlatforms.filter((p) => p !== platform);
		} else {
			selectedPlatforms = [...selectedPlatforms, platform];
		}
	}

	function computeEndDate(): string {
		if (!duration || duration === 'custom') return customEndDate;
		if (duration === '1 session') return new Date().toISOString().split('T')[0];
		const days = duration === '3 months' ? 90 : duration === '6 months' ? 180 : 365;
		const d = new Date();
		d.setDate(d.getDate() + days);
		return d.toISOString().split('T')[0];
	}

	function validateStep1(): boolean {
		errors = [];
		if (!name.trim()) errors = [...errors, 'Student name is required.'];
		return errors.length === 0;
	}

	function goToStep2() {
		if (validateStep1()) {
			step = 2;
		}
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		errors = [];

		if (!name.trim()) errors = [...errors, 'Student name is required.'];
		if (!grade) errors = [...errors, 'Grade is required.'];
		if (selectedSubjects.length === 0) errors = [...errors, 'Select at least one subject.'];
		if (!isEdit && !goal.trim()) errors = [...errors, 'Goal is required.'];
		if (errors.length > 0) return;

		saving = true;
		try {
			const studentData = {
				name: name.trim(),
				email: studentEmail.trim() || null,
				grade,
				subjects: selectedSubjects,
				diagnostic_data: diagnosticData.trim() || null,
				extra_info: extraInfo.trim() || null,
				notes: notes.trim() || null,
				parent_name: parentName.trim() || null,
				parent_email: parentEmail.trim() || null,
				preferred_contact_method: (preferredContactMethod || 'student_email') as 'student_email' | 'parent_email',
				learning_platforms: selectedPlatforms,
				preferred_resource_sites: [],
				learning_style: null
			};

			if (editStudent) {
				await studentStore.update(editStudent.id, studentData);
				onsave?.();
			} else {
				const created = await studentStore.create(studentData);
				if (!created) {
					errors = ['Failed to create student. Check console for details.'];
					saving = false;
					return;
				}

				const startDate = new Date().toISOString().split('T')[0];
				const endDate = computeEndDate();

				const planId = await planStore.generateAndSave({
					studentId: created.id,
					grade,
					subjects: selectedSubjects,
					timePerSession,
					sessionsPerWeek,
					duration,
					startDate,
					endDate,
					goals: goal.trim(),
					diagnosticData: diagnosticData.trim() || undefined,
					extraInfo: extraInfo.trim() || undefined,
					preferredResourceSites: []
				});

				if (planId) {
					goto(`/dashboard/students/${created.id}?tab=timeline`);
				}
			}
		} catch (err: any) {
			console.error('[StudentForm] Error:', err);
			errors = [err?.message || 'Unexpected error.'];
		} finally {
			saving = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="space-y-8">
	{#if errors.length > 0}
		<div class="space-y-1 rounded-xl border border-[var(--color-error)]/30 bg-[var(--color-error-bg)] p-4">
			{#each errors as err}
				<p class="flex items-start gap-2 text-sm text-[var(--color-error)]">
					<svg class="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"
						><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
						/></svg
					>
					{err}
				</p>
			{/each}
		</div>
	{/if}

	<!-- Step indicators -->
	{#if !isEdit}
		<div class="flex items-center gap-2">
			<div class="flex items-center gap-1.5 {step === 1 ? '' : 'opacity-50'}">
				<span class="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary-500)] text-xs font-bold text-white">1</span>
				<span class="text-sm font-medium text-[var(--color-text-primary)]">Contact Info</span>
			</div>
			<div class="h-px w-8 bg-[var(--color-border)]"></div>
			<div class="flex items-center gap-1.5 {step === 2 ? '' : 'opacity-50'}">
				<span class="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary-500)] text-xs font-bold text-white">2</span>
				<span class="text-sm font-medium text-[var(--color-text-primary)]">Plan Info</span>
			</div>
		</div>
	{/if}

	{#if !isEdit}
		<!-- ═══ Step 1: Basic Student Info ═══ -->
		{#if step === 1}
			<section class="space-y-5">
				<h2 class="font-[family-name:var(--font-heading)] text-lg font-bold text-[var(--color-text-primary)]">
					Basic Student Info
				</h2>

				<Input label="Student Name" name="name" placeholder="Full name" required bind:value={name} />

				<Input label="Student Email / Contact" name="studentEmail" type="email" placeholder="student@example.com" bind:value={studentEmail} />

				<Input label="Parent / Guardian Name" name="parentName" placeholder="Parent full name" bind:value={parentName} />

				<Input label="Parent Email / Contact" name="parentEmail" type="email" placeholder="parent@example.com" bind:value={parentEmail} />

				<Select
					label="Preferred Contact Method (for updates, progress reports, homework)"
					name="preferredContactMethod"
					options={contactMethodOptions}
					value={preferredContactMethod}
					onchange={(e) => (preferredContactMethod = (e.target as HTMLSelectElement).value)}
				/>

			</section>

			<div class="flex gap-3 pt-4 border-t border-[var(--color-border)]">
				<Button type="button" variant="gradient" size="lg" onclick={goToStep2}>
					Next: Plan Info
				</Button>
				<Button variant="ghost" href="/dashboard">Cancel</Button>
			</div>
		{/if}

		<!-- ═══ Step 2: Plan Info ═══ -->
		{#if step === 2}
			<section class="space-y-5">
				<h2 class="font-[family-name:var(--font-heading)] text-lg font-bold text-[var(--color-text-primary)]">
					Plan Info
				</h2>

				<Select
					label="Grade Level"
					name="grade"
					options={GRADES.map((g) => ({ value: g, label: g }))}
					value={grade}
					onchange={(e) => (grade = (e.target as HTMLSelectElement).value)}
					required
				/>

				<div>
					<label class="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
						Subjects <span class="text-[var(--color-error)]">*</span>
					</label>
					<div class="flex flex-wrap gap-2">
						{#each SUBJECTS as subject}
							<button
								type="button"
								onclick={() => toggleSubject(subject)}
								class={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-all
								${selectedSubjects.includes(subject)
									? 'border-[var(--color-primary-500)] bg-[var(--color-primary-100)] text-[var(--color-primary-700)]'
									: 'border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'}`}
							>
								{subject}
							</button>
						{/each}
					</div>
				</div>

				<div>
					<label class="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
						Preferred Learning Platforms
					</label>
					<div class="flex flex-wrap gap-2">
						{#each LEARNING_PLATFORMS as platform}
							<button
								type="button"
								onclick={() => togglePlatform(platform.name)}
								class={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-all
								${selectedPlatforms.includes(platform.name)
									? 'border-[var(--color-accent-500)] bg-[var(--color-accent-100)] text-[var(--color-accent-700)]'
									: 'border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'}`}
							>
								{platform.name}
							</button>
						{/each}
					</div>
				</div>

				<Textarea
					label="Goal"
					name="goal"
					placeholder="e.g., Improve Algebra grade from B to A by semester end, ace the TAG prep test, master quadratic equations..."
					bind:value={goal}
					rows={3}
					required
				/>

				<div>
					<label class="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
						Timeframe
					</label>
					<div class="grid gap-4 sm:grid-cols-3">
						<Select
							label="Duration"
							name="duration"
							options={DURATIONS.map((d) => ({ value: d.value, label: d.label }))}
							value={duration}
							onchange={(e) => (duration = (e.target as HTMLSelectElement).value)}
						/>
						<Select
							label="Sessions / Week"
							name="sessionsPerWeek"
							options={[1, 2, 3, 4, 5, 6, 7].map((n) => ({ value: n.toString(), label: n.toString() }))}
							value={sessionsPerWeek.toString()}
							onchange={(e) => (sessionsPerWeek = parseInt((e.target as HTMLSelectElement).value))}
						/>
						<Select
							label="Minutes / Session"
							name="timePerSession"
							options={SESSION_MINUTES_OPTIONS.map((n) => ({ value: n.toString(), label: `${n} min` }))}
							value={timePerSession.toString()}
							onchange={(e) => (timePerSession = parseInt((e.target as HTMLSelectElement).value))}
						/>
					</div>
					{#if duration === 'custom'}
						<div class="mt-3">
							<Input
								label="Custom End Date"
								name="customEndDate"
								type="date"
								bind:value={customEndDate}
							/>
						</div>
					{/if}
				</div>

				<Textarea
					label="Student Diagnostic Results (if any)"
					name="diagnosticData"
					placeholder="e.g., PSAT score 1150 (Math: 580, Reading: 570), failed Algebra quiz on quadratic equations, currently at grade level in Chemistry..."
					bind:value={diagnosticData}
					rows={3}
				/>

				<Textarea
					label="Anything else I need to know about this student?"
					name="extraInfo"
					placeholder="Learning style, pace, preferences, strengths, challenges, attention span, motivation level, or any other relevant information..."
					bind:value={extraInfo}
					rows={3}
				/>
			</section>

			<div class="flex gap-3 pt-4 border-t border-[var(--color-border)]">
				<Button type="submit" variant="gradient" size="lg" loading={saving} disabled={saving}>
					{saving ? 'Creating Student & Plan...' : 'Create Student & Generate Plan'}
				</Button>
				<Button type="button" variant="ghost" onclick={() => (step = 1)}>Back</Button>
				<Button variant="ghost" href="/dashboard">Cancel</Button>
			</div>
		{/if}
	{:else}
		<!-- ═══ Edit mode: all fields in one page ═══ -->
		<section class="space-y-5">
			<h2 class="font-[family-name:var(--font-heading)] text-lg font-bold text-[var(--color-text-primary)]">
				Basic Contact Info
			</h2>

			<Input label="Student Name" name="name" placeholder="Full name" required bind:value={name} />

			<Input label="Student Email / Contact" name="studentEmail" type="email" placeholder="student@example.com" bind:value={studentEmail} />

			<Input label="Parent / Guardian Name" name="parentName" placeholder="Parent full name" bind:value={parentName} />

			<Input label="Parent Email / Contact" name="parentEmail" type="email" placeholder="parent@example.com" bind:value={parentEmail} />

			<Select
				label="Preferred Contact Method (for updates, progress reports, homework)"
				name="preferredContactMethod"
				options={contactMethodOptions}
				value={preferredContactMethod}
				onchange={(e) => (preferredContactMethod = (e.target as HTMLSelectElement).value)}
			/>

			<Select
				label="Grade Level"
				name="grade"
				options={GRADES.map((g) => ({ value: g, label: g }))}
				value={grade}
				onchange={(e) => (grade = (e.target as HTMLSelectElement).value)}
				required
			/>

			<div>
				<label class="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
					Subjects <span class="text-[var(--color-error)]">*</span>
				</label>
				<div class="flex flex-wrap gap-2">
					{#each SUBJECTS as subject}
						<button
							type="button"
							onclick={() => toggleSubject(subject)}
							class={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-all
							${selectedSubjects.includes(subject)
								? 'border-[var(--color-primary-500)] bg-[var(--color-primary-100)] text-[var(--color-primary-700)]'
								: 'border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'}`}
						>
							{subject}
						</button>
					{/each}
				</div>
			</div>

			<div>
				<label class="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
					Preferred Learning Platforms
				</label>
				<div class="flex flex-wrap gap-2">
					{#each LEARNING_PLATFORMS as platform}
						<button
							type="button"
							onclick={() => togglePlatform(platform.name)}
							class={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-all
							${selectedPlatforms.includes(platform.name)
								? 'border-[var(--color-accent-500)] bg-[var(--color-accent-100)] text-[var(--color-accent-700)]'
								: 'border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'}`}
						>
							{platform.name}
						</button>
					{/each}
				</div>
			</div>

			<Textarea
				label="Previous Diagnostic Data (if any)"
				name="diagnosticData"
				placeholder="Any previous test scores, assessments, or diagnostic results..."
				bind:value={diagnosticData}
				rows={3}
			/>

			<Textarea
				label="Anything else I should know about this student?"
				name="extraInfo"
				placeholder="Learning style, pace, preferences, strengths, challenges..."
				bind:value={extraInfo}
				rows={3}
			/>

			<Textarea
				label="Notes"
				name="notes"
				placeholder="Any notes about this student..."
				bind:value={notes}
				rows={3}
			/>
		</section>

		<div class="flex gap-3 pt-4 border-t border-[var(--color-border)]">
			<Button type="submit" variant="gradient" size="lg" loading={saving} disabled={saving}>
				{isEdit ? 'Save Changes' : saving ? 'Creating Student & Plan...' : 'Create Student & Generate Plan'}
			</Button>
			<Button variant="ghost" href="/dashboard">Cancel</Button>
		</div>
	{/if}
</form>
