<script lang="ts">
	import type { Student, PreferredResourceSite } from '$lib/lib/types';
	import { GRADES, SUBJECTS, RESOURCE_SITES } from '$lib/lib/constants';
	import { studentStore } from '$lib/stores/student.svelte';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Toggle from '$lib/components/ui/Toggle.svelte';

	let { editStudent }: { editStudent?: Student | null } = $props();

	let name = $state(editStudent?.name || '');
	let grade = $state(editStudent?.grade || '');
	let selectedSubjects = $state<string[]>(editStudent?.subjects || []);
	let learningStyle = $state(editStudent?.learning_style || '');
	let notes = $state(editStudent?.notes || '');
	let preferredSites = $state<PreferredResourceSite[]>(
		editStudent?.preferred_resource_sites ||
			RESOURCE_SITES.map((s) => ({ name: s.name, url: s.url, enabled: true }))
	);
	let saving = $state(false);
	let errors = $state<string[]>([]);

	function toggleSubject(subject: string) {
		if (selectedSubjects.includes(subject)) {
			selectedSubjects = selectedSubjects.filter((s) => s !== subject);
		} else {
			selectedSubjects = [...selectedSubjects, subject];
		}
	}

	function toggleSite(index: number) {
		preferredSites[index].enabled = !preferredSites[index].enabled;
		preferredSites = [...preferredSites];
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		errors = [];

		if (!name.trim()) errors = [...errors, 'Student name is required.'];
		if (!grade) errors = [...errors, 'Grade is required.'];
		if (selectedSubjects.length === 0) errors = [...errors, 'Select at least one subject.'];
		if (errors.length > 0) return;

		saving = true;
		try {
			const data = {
				name: name.trim(),
				grade,
				subjects: selectedSubjects,
				learning_style: learningStyle || null,
				notes: notes || null,
				preferred_resource_sites: preferredSites
			};

			if (editStudent) {
				await studentStore.update(editStudent.id, data);
			} else {
				const created = await studentStore.create(data);
				if (!created) {
					errors = ['Failed to create student. Check console for details.'];
					return;
				}
			}

			goto('/dashboard/students');
		} catch (err: any) {
			errors = [err?.message || 'Unexpected error saving student.'];
		} finally {
			saving = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="space-y-8">
	{#if errors.length > 0}
		<div
			class="space-y-1 rounded-xl border border-[var(--color-error)]/30 bg-[var(--color-error-bg)] p-4"
		>
			{#each errors as err}
				<p class="flex items-start gap-2 text-sm text-[var(--color-error)]">
					<svg class="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
						/></svg
					>
					{err}
				</p>
			{/each}
		</div>
	{/if}

	<Input label="Student Name" name="name" placeholder="Full name" required bind:value={name} />

	<Select
		label="Grade"
		name="grade"
		options={GRADES.map((g) => ({ value: g, label: g }))}
		value={grade}
		onchange={(e) => (grade = (e.target as HTMLSelectElement).value)}
	/>

	<div>
		<label class="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]"
			>Subjects <span class="text-[var(--color-error)]">*</span></label
		>
		<div class="flex flex-wrap gap-2">
			{#each SUBJECTS as subject}
				<button
					type="button"
					onclick={() => toggleSubject(subject)}
					class={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-all
					${selectedSubjects.includes(subject) ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-100)] text-[var(--color-primary-700)]' : 'border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'}`}
				>
					{subject}
				</button>
			{/each}
		</div>
	</div>

	<Select
		label="Learning Style"
		name="learningStyle"
		placeholder="Select (optional)"
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
		label="Notes"
		name="notes"
		placeholder="Any notes about this student..."
		value={notes}
		oninput={(e) => (notes = (e.target as HTMLTextAreaElement).value)}
		rows={3}
	/>

	<div>
		<label class="mb-3 block text-sm font-medium text-[var(--color-text-secondary)]"
			>Preferred Resource Sites</label
		>
		<div class="space-y-2">
			{#each preferredSites as site, i}
				<Toggle label={site.name} checked={site.enabled} onchange={() => toggleSite(i)} />
			{/each}
		</div>
	</div>

	<div class="flex gap-3 pt-4">
		<Button type="submit" variant="gradient" loading={saving} disabled={saving}>
			{editStudent ? 'Save Changes' : 'Create Student'}
		</Button>
		<Button variant="ghost" href="/dashboard/students">Cancel</Button>
	</div>
</form>
