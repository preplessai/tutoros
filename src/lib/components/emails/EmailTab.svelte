<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/lib/supabase';
	import { api } from '$lib/lib/api';
	import { auth } from '$lib/stores/auth.svelte';
	import { creditStore } from '$lib/stores/credits.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { canUseFeature } from '$lib/lib/constants';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import type { ParentEmail } from '$lib/lib/types';

	let {
		studentId
	}: {
		studentId: string;
	} = $props();

	const tier = $derived(auth.profile?.subscription_tier || 'free');
	const canEmail = $derived(canUseFeature(tier, 'parent_email'));

	let emails = $state<ParentEmail[]>([]);
	let loading = $state(true);
	let generating = $state(false);
	let selectedEmail = $state<ParentEmail | null>(null);
	let copiedId = $state<string | null>(null);

	onMount(async () => {
		if (!canEmail) {
			loading = false;
			return;
		}
		await fetchEmails();
	});

	async function fetchEmails() {
		loading = true;
		const { data } = await supabase
			.from('parent_emails')
			.select('*')
			.eq('student_id', studentId)
			.order('created_at', { ascending: false });
		emails = (data || []) as ParentEmail[];
		loading = false;
	}

	async function generateEmail() {
		if (!canEmail) return;
		generating = true;

		try {
			await creditStore.fetch();

			if (!creditStore.hasEnough(0.5)) {
				toast.error('Insufficient credits. Please upgrade your plan or purchase more credits.');
				return;
			}

			const credited = await creditStore.useCredits(0.5, 'parent_email');
			if (!credited) {
				toast.error('Failed to deduct credits. Please try again or upgrade your plan.');
				return;
			}

			const result = await api.generateEmail({
				studentId
			});

			// Save to database
			const { data, error } = await supabase
				.from('parent_emails')
				.insert({
					tutor_id: auth.user?.id,
					student_id: studentId,
					subject: result.subject,
					body: result.body,
					status: 'draft'
				})
				.select()
				.single();

			if (error) {
				toast.error('Failed to save email: ' + error.message);
				return;
			}

			emails = [data as ParentEmail, ...emails];
			selectedEmail = data as ParentEmail;
			toast.success('Email draft generated!');
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'An error occurred';
			toast.error('Failed to generate email: ' + msg);
		} finally {
			generating = false;
		}
	}

	async function copyBody(email: ParentEmail) {
		try {
			await navigator.clipboard.writeText(email.body);
			copiedId = email.id;
			toast.success('Email body copied to clipboard!');
			setTimeout(() => {
				copiedId = null;
			}, 2000);
		} catch {
			toast.error('Failed to copy to clipboard');
		}
	}

	function previewBody(body: string): string {
		if (body.length <= 150) return body;
		return body.slice(0, 150) + '...';
	}

	function statusColor(status: string): string {
		switch (status) {
			case 'sent':
				return 'success';
			case 'failed':
				return 'error';
			default:
				return 'default';
		}
	}

	function formatDate(dateStr: string): string {
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

{#if !canEmail}
	<Card>
		<div class="py-8 text-center">
			<svg
				class="mx-auto h-12 w-12 text-[var(--color-text-tertiary)]"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
				/>
			</svg>
			<h2 class="mt-4 text-lg font-semibold text-[var(--color-text-primary)]">Pro Feature</h2>
			<p class="mt-2 text-sm text-[var(--color-text-secondary)]">
				Parent email updates are available on all paid plans.
			</p>
			<div class="mt-4">
				<Button variant="gradient" href="/pricing">Upgrade to Pro</Button>
			</div>
		</div>
	</Card>
{:else if loading}
	<div class="flex justify-center py-12"><Spinner size="md" /></div>
{:else}
	<div class="space-y-4">
		<!-- Action bar -->
		<div class="flex items-center justify-between">
			<h3 class="text-lg font-semibold text-[var(--color-text-primary)]">Parent Emails</h3>
			<Button variant="gradient" size="sm" onclick={generateEmail} loading={generating}>
				Generate Update Email
			</Button>
		</div>

		{#if emails.length === 0}
			<EmptyState
				icon="mail"
				title="No emails yet"
				description="Generate a parent update email to share progress with your student's family."
			/>
		{:else}
			<!-- Selected email detail -->
			{#if selectedEmail}
				<Card>
					<div class="space-y-3">
						<div class="flex items-start justify-between gap-4">
							<div class="min-w-0">
								<h4 class="text-base font-semibold text-[var(--color-text-primary)]">
									{selectedEmail.subject}
								</h4>
								<p class="text-xs text-[var(--color-text-tertiary)]">
									{formatDate(selectedEmail.created_at)}
								</p>
							</div>
							<div class="flex shrink-0 items-center gap-2">
								<Badge variant={statusColor(selectedEmail.status)}>
									{selectedEmail.status}
								</Badge>
							</div>
						</div>
						<div
							class="whitespace-pre-wrap rounded-lg bg-[var(--color-surface-secondary)] p-4 text-sm text-[var(--color-text-primary)]"
						>
							{selectedEmail.body}
						</div>
						<div class="flex items-center gap-2">
							<Button
								variant="secondary"
								size="sm"
								onclick={() => copyBody(selectedEmail)}
							>
								{copiedId === selectedEmail.id ? 'Copied!' : 'Copy to Clipboard'}
							</Button>
							<div class="relative group">
								<Button variant="secondary" size="sm" disabled>
									Send
								</Button>
								<span
									class="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-[var(--color-surface-elevated)] px-2 py-1 text-xs text-[var(--color-text-secondary)] shadow-lg group-hover:block"
								>
									Email sending coming soon
								</span>
							</div>
							<button
								onclick={() => (selectedEmail = null)}
								class="ml-auto text-sm text-[var(--color-text-tertiary)] underline hover:text-[var(--color-text-secondary)]"
							>
								Close
							</button>
						</div>
					</div>
				</Card>
			{/if}

			<!-- Email list -->
			<div class="space-y-2">
				{#each emails as email}
					<button
						onclick={() => (selectedEmail = email)}
						class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-primary)] p-4 text-left transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-secondary)]"
					>
						<div class="flex items-start justify-between gap-4">
							<div class="min-w-0 flex-1">
								<h4 class="truncate text-sm font-medium text-[var(--color-text-primary)]">
									{email.subject}
								</h4>
								<p class="mt-1 text-xs text-[var(--color-text-tertiary)]">
									{previewBody(email.body)}
								</p>
							</div>
							<div class="flex shrink-0 items-center gap-2">
								<Badge variant={statusColor(email.status)}>{email.status}</Badge>
								<span class="text-xs text-[var(--color-text-tertiary)]">
									{formatDate(email.created_at)}
								</span>
							</div>
						</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>
{/if}
