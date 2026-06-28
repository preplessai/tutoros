<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { studentStore } from '$lib/stores/student.svelte';
	import { planStore } from '$lib/stores/plan.svelte';
	import {
		GRADES,
		SUBJECTS,
		LEARNING_PLATFORMS,
		DURATIONS,
		SESSION_MINUTES_OPTIONS
	} from '$lib/lib/constants';
	import Button from '$lib/components/ui/Button.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';

	let step = $state(1);
	let saving = $state(false);
	let errors = $state<string[]>([]);

	let grade = $state('');
	let selectedSubjects = $state<string[]>([]);
	let selectedPlatforms = $state<string[]>([]);
	let diagnosticData = $state('');
	let extraInfo = $state('');

	let goal = $state('');
	let duration = $state('');
	let sessionsPerWeekStr = $state('2');
	let timePerSessionStr = $state('60');

	let sessionsPerWeek = $derived(parseInt(sessionsPerWeekStr) || 2);
	let timePerSession = $derived(parseInt(timePerSessionStr) || 60);

	onMount(() => {
		studentStore.fetchOne($page.params.studentId);
	});

	$effect(() => {
		const s = studentStore.current;
		if (s) {
			grade = s.grade || '';
			selectedSubjects = s.subjects || [];
			selectedPlatforms = s.learning_platforms || [];
			diagnosticData = s.diagnostic_data || '';
			extraInfo = s.extra_info || '';
		}
	});

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

	function goToStep2() {
		errors = [];
		if (!grade) errors = [...errors, 'Grade is required.'];
		if (selectedSubjects.length === 0) errors = [...errors, 'Select at least one subject.'];
		if (!goal.trim()) errors = [...errors, 'Goal is required.'];
		if (errors.length === 0) step = 2;
	}

	async function handleSubmit() {
		saving = true;
		try {
			// Update student with any changed fields
			await studentStore.update($page.params.studentId, {
				grade,
				subjects: selectedSubjects,
				learning_platforms: selectedPlatforms,
				diagnostic_data: diagnosticData.trim() || null,
				extra_info: extraInfo.trim() || null
			});

			const startDate = new Date().toISOString().split('T')[0];
			const d = new Date();
			d.setDate(d.getDate() + 90);
			const endDate = d.toISOString().split('T')[0];

			const planId = await planStore.generateAndSave({
				studentId: $page.params.studentId,
				grade,
				subjects: selectedSubjects,
				timePerSession,
				sessionsPerWeek,
				duration: duration || '3 months',
				startDate,
				endDate,
				goals: goal.trim(),
				diagnosticData: diagnosticData.trim() || undefined,
				extraInfo: extraInfo.trim() || undefined,
				preferredResourceSites: []
			});

			if (planId) {
				goto(`/dashboard/students/${$page.params.studentId}?tab=timeline`);
			}
		} catch (err: any) {
			errors = [err.message || 'Failed to generate plan'];
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head><title>Complete Onboarding — Prepless AI</title></svelte:head>

<div class="max-w-2xl">
	<div class="mb-6 flex items-center gap-3">
		<a href="/dashboard/students/{$page.params.studentId}" class="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">&larr; Back</a>
		<h1 class="text-xl font-bold text-[var(--color-text-primary)]">
			Complete Onboarding
			{#if studentStore.current}
				<span class="text-[var(--color-text-tertiary)]">— {studentStore.current.name}</span>
			{/if}
		</h1>
	</div>

	{#if studentStore.loading}
		<div class="flex justify-center py-12"><Spinner size="md" /></div>
	{:else if !studentStore.current}
		<p class="text-sm text-[var(--color-text-tertiary)]">Student not found.</p>
	{:else}
		<div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6">
			{#if errors.length > 0}
				<div class="mb-6 space-y-1 rounded-xl border border-[var(--color-error)]/30 bg-[var(--color-error-bg)] p-4">
					{#each errors as err}
						<p class="flex items-start gap-2 text-sm text-[var(--color-error)]">{err}</p>
					{/each}
				</div>
			{/if}

			<!-- Step indicators -->
			<div class="mb-6 flex items-center gap-1.5">
				<div class="flex items-center gap-1.5 {step === 1 ? '' : 'opacity-50'}">
					<span class="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary-500)] text-xs font-bold text-white">1</span>
					<span class="text-sm font-medium text-[var(--color-text-primary)]">Plan Setup</span>
				</div>
				<div class="h-px w-6 bg-[var(--color-border)]"></div>
				<div class="flex items-center gap-1.5 {step === 2 ? '' : 'opacity-50'}">
					<span class="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary-500)] text-xs font-bold text-white">2</span>
					<span class="text-sm font-medium text-[var(--color-text-primary)]">Preferences</span>
				</div>
			</div>

			{#if step === 1}
				<section class="space-y-5">
					<Select label="Grade Level" name="grade" options={GRADES.map((g) => ({ value: g, label: g }))} bind:value={grade} required />

					<div>
						<label class="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">Subjects <span class="text-[var(--color-error)]">*</span></label>
						<div class="flex flex-wrap gap-2">
							{#each SUBJECTS as subject}
								<button type="button" onclick={() => toggleSubject(subject)}
									class={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-all ${selectedSubjects.includes(subject) ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-100)] text-[var(--color-primary-700)]' : 'border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'}`}
								>{subject}</button>
							{/each}
						</div>
					</div>

					<Textarea label="Goal" name="goal" placeholder="e.g., Improve Algebra grade from B to A by semester end..." bind:value={goal} rows={3} required />

					<div>
						<label class="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">Timeframe</label>
						<div class="grid gap-4 sm:grid-cols-3">
							<Select label="Duration" name="duration" options={DURATIONS.map((d) => ({ value: d.value, label: d.label }))} bind:value={duration} />
							<Select label="Sessions / Week" name="sessionsPerWeek" options={[1,2,3,4,5,6,7].map((n) => ({ value: n.toString(), label: n.toString() }))} bind:value={sessionsPerWeekStr} />
							<Select label="Minutes / Session" name="timePerSession" options={SESSION_MINUTES_OPTIONS.map((n) => ({ value: n.toString(), label: `${n} min` }))} bind:value={timePerSessionStr} />
						</div>
					</div>
				</section>

				<div class="mt-6 flex gap-3 border-t border-[var(--color-border)] pt-4">
					<Button type="button" variant="gradient" size="lg" onclick={goToStep2}>Next: Preferences</Button>
					<Button variant="ghost" href={`/dashboard/students/${$page.params.studentId}`}>Cancel</Button>
				</div>
			{/if}

			{#if step === 2}
				<section class="space-y-5">
					<div>
						<label class="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">Preferred Learning Platforms</label>
						<div class="flex flex-wrap gap-2">
							{#each LEARNING_PLATFORMS as platform}
								<button type="button" onclick={() => togglePlatform(platform.name)}
									class={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-all ${selectedPlatforms.includes(platform.name) ? 'border-[var(--color-accent-500)] bg-[var(--color-accent-100)] text-[var(--color-accent-700)]' : 'border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'}`}
								>{platform.name}</button>
							{/each}
						</div>
					</div>

					<Textarea label="Student Diagnostic Results (if any)" name="diagnosticData" placeholder="e.g., PSAT score 1150..." bind:value={diagnosticData} rows={3} />
					<Textarea label="Anything else to know about this student?" name="extraInfo" placeholder="Learning style, pace, preferences, strengths, challenges..." bind:value={extraInfo} rows={3} />
				</section>

				<div class="mt-6 flex gap-3 border-t border-[var(--color-border)] pt-4">
					<Button type="button" variant="gradient" size="lg" onclick={handleSubmit} loading={saving} disabled={saving}>
						{saving ? 'Generating Plan...' : 'Generate Learning Plan'}
					</Button>
					<Button type="button" variant="ghost" onclick={() => (step = 1)}>Back</Button>
					<Button variant="ghost" href={`/dashboard/students/${$page.params.studentId}`}>Cancel</Button>
				</div>
			{/if}
		</div>
	{/if}
</div>
