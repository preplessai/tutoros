<script lang="ts">
	import RegisterForm from '$lib/components/auth/RegisterForm.svelte';
</script>

<svelte:head><title>Create Account — TutorOS</title></svelte:head>

<div class="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[var(--color-surface-secondary)]">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<h1 class="text-2xl font-bold text-[var(--color-text-primary)]">Get started for free</h1>
			<p class="mt-2 text-sm text-[var(--color-text-secondary)]">Create your TutorOS account</p>
		</div>
		<div class="bg-[var(--color-surface-elevated)] rounded-2xl border border-[var(--color-border)] shadow-sm p-6 md:p-8">
			<RegisterForm />
		</div>
		<p class="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
			Already have an account? <a href="/auth/login" class="font-medium text-[var(--color-primary-500)] hover:text-[var(--color-primary-400)]">Sign in</a>
		</p>
	</div>
</div>
