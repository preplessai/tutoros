<script lang="ts">
	import StudentForm from '$lib/components/students/StudentForm.svelte';
</script>

<svelte:head><title>Add Student — Prepless AI</title></svelte:head>

<div>
	<h1 class="mb-6 text-2xl font-bold text-[var(--color-text-primary)]">Add Student</h1>
	<div
		class="max-w-2xl rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6"
	>
		<StudentForm />
	</div>
</div>
