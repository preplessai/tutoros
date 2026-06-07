<script lang="ts">
	import StudentForm from '$lib/components/students/StudentForm.svelte';
</script>

<svelte:head><title>Add Student — TutorOS</title></svelte:head>

<div>
	<h1 class="text-2xl font-bold text-[var(--color-text-primary)] mb-6">Add Student</h1>
	<div class="max-w-2xl bg-[var(--color-surface-elevated)] rounded-xl border border-[var(--color-border)] p-6">
		<StudentForm />
	</div>
</div>
