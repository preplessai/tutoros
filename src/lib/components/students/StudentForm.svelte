<script lang="ts">
	import { onMount } from 'svelte';
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
	let preferredSites = $state<PreferredResourceSite[]>(editStudent?.preferred_resource_sites || RESOURCE_SITES.map(s => ({ name: s.name, url: s.url, enabled: true })));
	let saving = $state(false);

	function toggleSubject(subject: string) {
		if (selectedSubjects.includes(subject)) {
			selectedSubjects = selectedSubjects.filter(s => s !== subject);
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
		if (!name.trim() || selectedSubjects.length === 0) return;
		saving = true;

		const data = { name: name.trim(), grade, subjects: selectedSubjects, learning_style: learningStyle || null, notes: notes || null, preferred_resource_sites: preferredSites };

		if (editStudent) {
			await studentStore.update(editStudent.id, data);
		} else {
			await studentStore.create(data);
		}

		saving = false;
		goto('/dashboard/students');
	}
</script>

<form onsubmit={handleSubmit} class="space-y-8">
	<Input label="Student Name" name="name" placeholder="Full name" required bind:value={name} />

	<Select label="Grade" name="grade" options={GRADES.map(g => ({ value: g, label: g }))} value={grade} onchange={e => grade = (e.target as HTMLSelectElement).value} />

	<div>
		<label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Subjects <span class="text-[var(--color-error)]">*</span></label>
		<div class="flex flex-wrap gap-2">
			{#each SUBJECTS as subject}
				<button type="button" onclick={() => toggleSubject(subject)} class={`px-3 py-1.5 text-sm rounded-lg border transition-all cursor-pointer
					${selectedSubjects.includes(subject) ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-100)] bg-[var(--color-primary-100)] text-[var(--color-primary-700)] text-[var(--color-primary-700)]' : 'border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:border-[var(--color-border-strong)]'}`}>
					{subject}
				</button>
			{/each}
		</div>
		{#if selectedSubjects.length === 0}
			<p class="text-sm text-[var(--color-error)] mt-1">Select at least one subject</p>
		{/if}
	</div>

	<Select label="Learning Style" name="learningStyle" placeholder="Select (optional)" options={[
		{ value: 'visual', label: 'Visual' },
		{ value: 'auditory', label: 'Auditory' },
		{ value: 'hands-on', label: 'Hands-on' },
		{ value: 'reading/writing', label: 'Reading/Writing' },
		{ value: 'mixed', label: 'Mixed' }
	]} value={learningStyle} onchange={e => learningStyle = (e.target as HTMLSelectElement).value} />

	<Textarea label="Notes" name="notes" placeholder="Any notes about this student..." value={notes} oninput={e => notes = (e.target as HTMLTextAreaElement).value} rows={3} />

	<div>
		<label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-3">Preferred Resource Sites</label>
		<div class="space-y-2">
			{#each preferredSites as site, i}
				<Toggle label={site.name} checked={site.enabled} onchange={() => toggleSite(i)} />
			{/each}
		</div>
	</div>

	<div class="flex gap-3 pt-4">
		<Button type="submit" variant="gradient" loading={saving}>
							{editStudent ? 'Save Changes' : 'Create Student'}
		</Button>
		<Button variant="ghost" href="/dashboard/students">Cancel</Button>
	</div>
</form>
