<script lang="ts">
	import RegisterForm from '$lib/components/auth/RegisterForm.svelte';
</script>

<svelte:head><title>Create Account — Prepless AI</title></svelte:head>

<div
	class="flex min-h-[80vh] items-center justify-center bg-[var(--color-surface-secondary)] px-4 py-12"
>
	<div class="w-full max-w-md">
		<div class="mb-8 text-center">
			<h1 class="text-2xl font-bold text-[var(--color-text-primary)]">Get started for free</h1>
			<p class="mt-2 text-sm text-[var(--color-text-secondary)]">Create your Prepless AI account</p>
		</div>
		<div
			class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 shadow-sm md:p-8"
		>
			<RegisterForm />
		</div>
		<p class="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
			Already have an account? <a
				href="/auth/login"
				class="font-medium text-[var(--color-primary-500)] hover:text-[var(--color-primary-400)]"
				>Sign in</a
			>
		</p>
	</div>
</div>
