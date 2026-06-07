<script lang="ts">
	import LoginForm from '$lib/components/auth/LoginForm.svelte';
</script>

<svelte:head><title>Sign In — Prepless AI</title></svelte:head>

<div class="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[var(--color-surface-secondary)]">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<h1 class="text-2xl font-bold text-[var(--color-text-primary)]">Welcome back</h1>
			<p class="mt-2 text-sm text-[var(--color-text-secondary)]">Sign in to your Prepless AI account</p>
		</div>
		<div class="bg-[var(--color-surface-elevated)] rounded-2xl border border-[var(--color-border)] shadow-sm p-6 md:p-8">
			<LoginForm />
		</div>
		<p class="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
			Don't have an account? <a href="/auth/register" class="font-medium text-[var(--color-primary-500)] hover:text-[var(--color-primary-400)]">Create one</a>
		</p>
	</div>
</div>
