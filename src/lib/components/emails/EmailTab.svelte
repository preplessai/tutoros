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
	let saving = $state(false);
	let tableMissing = $state(false);

	// Editor state
	let subject = $state('');
	let body = $state('');
	let mode = $state<'edit' | 'preview'>('edit');
	let editExistingId = $state<string | null>(null);

	onMount(async () => {
		if (!canEmail) {
			loading = false;
			return;
		}
		await fetchEmails();
	});

	async function fetchEmails() {
		loading = true;
		const { data, error } = await supabase
			.from('parent_emails')
			.select('*')
			.eq('student_id', studentId)
			.order('created_at', { ascending: false });

		if (error) {
			const code = (error as unknown as Record<string, unknown>).code;
			if (code === '42P01' || code === 'PGRST205') {
				tableMissing = true;
			} else {
				console.error('[EmailTab] Fetch failed:', error.message);
			}
		}
		if (data) emails = data as ParentEmail[];
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
			if (!credited) return;

			const result = await api.generateEmail({
				studentId
			});

			// Populate editor - do NOT auto-save
			subject = result.subject;
			body = result.body;
			editExistingId = null;
			mode = 'edit';
			toast.success('Email generated! Review and save when ready.');
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'An error occurred';
			toast.error('Failed to generate email: ' + msg);
		} finally {
			generating = false;
		}
	}

	async function saveEmail() {
		if (!subject.trim() || !body.trim()) {
			toast.error('Subject and body are required.');
			return;
		}

		saving = true;
		try {
			let result;

			if (editExistingId) {
				result = await supabase
					.from('parent_emails')
					.update({ subject: subject.trim(), body, updated_at: new Date().toISOString() })
					.eq('id', editExistingId)
					.select()
					.single();
			} else {
				result = await supabase
					.from('parent_emails')
					.insert({
						tutor_id: auth.user?.id,
						student_id: studentId,
						subject: subject.trim(),
						body,
						status: 'draft'
					})
					.select()
					.single();
			}

			if (result.error) {
				const code = (result.error as unknown as Record<string, unknown>).code;
				if (code === '42P01' || code === 'PGRST205') {
					tableMissing = true;
					toast.error('parent_emails table not found. Run migration 006 in Supabase SQL Editor.');
				} else {
					toast.error('Failed to save: ' + result.error.message);
				}
				return;
			}

			const saved = result.data as ParentEmail;
			if (editExistingId) {
				emails = emails.map((e) => (e.id === editExistingId ? saved : e));
			} else {
				emails = [saved, ...emails];
				editExistingId = saved.id;
			}

			toast.success('Email saved!');
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Unknown error';
			toast.error('Save failed: ' + msg);
		} finally {
			saving = false;
		}
	}

	function editEmail(email: ParentEmail) {
		subject = email.subject;
		body = email.body;
		editExistingId = email.id;
		mode = 'edit';
	}

	function discardEditor() {
		subject = '';
		body = '';
		editExistingId = null;
		mode = 'edit';
	}

	async function copyAsHTML() {
		if (!body.trim()) {
			toast.error('Nothing to copy.');
			return;
		}

		const now = new Date().toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});

		const htmlBody = markdownToHTML(body);

		const fullHTML = '<!DOCTYPE html>' +
'<html lang="en">' +
'<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>' + escapeHTML(subject || 'Tutoring Update') + '</title></head>' +
'<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">' +
'<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:24px 0;"><tr><td align="center">' +
'<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">' +
'<tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">' +
'<h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Prepless AI Tutoring Update</h1>' +
'<p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">' + now + '</p>' +
'</td></tr>' +
'<tr><td style="padding:32px 40px;">' + htmlBody + '</td></tr>' +
'<tr><td style="padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">' +
'<p style="margin:0;color:#9ca3af;font-size:12px;">Sent via <a href="https://prepless.ai" style="color:#6366f1;text-decoration:none;">Prepless AI</a> - Your AI-powered tutoring planner</p>' +
'</td></tr>' +
'</table></td></tr></table></body></html>';

		try {
			await navigator.clipboard.write([
				new ClipboardItem({
					'text/html': new Blob([fullHTML], { type: 'text/html' }),
					'text/plain': new Blob([body], { type: 'text/plain' })
				})
			]);
			toast.success('Email copied as formatted HTML!');
		} catch {
			try {
				await navigator.clipboard.writeText(body);
				toast.success('Email body copied (plain text).');
			} catch {
				toast.error('Failed to copy to clipboard');
			}
		}
	}

	// Simple markdown to HTML converter
	function markdownToHTML(md: string): string {
		let html = md
			.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
			.replace(/\*(.+?)\*/g, '<em>$1</em>')
			.replace(/^### (.+)$/gm, '<h3 style="margin:16px 0 8px;font-size:16px;color:#1f2937;">$1</h3>')
			.replace(/^## (.+)$/gm, '<h2 style="margin:20px 0 10px;font-size:18px;color:#1f2937;">$1</h2>')
			.replace(/^# (.+)$/gm, '<h1 style="margin:24px 0 12px;font-size:20px;color:#111827;">$1</h1>')
			.replace(/^- (.+)$/gm, '<li style="margin-bottom:4px;color:#374151;">$1</li>')
			.replace(/^\d+\.\s(.+)$/gm, '<li style="margin-bottom:4px;color:#374151;">$1</li>')
			.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#6366f1;text-decoration:underline;">$1</a>')
			.replace(/\n\n/g, '</p><p style="margin:0 0 12px;color:#374151;line-height:1.6;">')
			.replace(/\n/g, '<br>');

		html = '<p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.6;">' + html + '</p>';
		html = html.replace(/((?:<li[^>]*>.*?<\/li>)+)/g, '<ul style="margin:0 0 12px;padding-left:20px;">$1</ul>');

		return html;
	}

	function escapeHTML(str: string): string {
		return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}

	function insertMarkdown(wrapper: string, placeholder: string) {
		const textarea = document.querySelector('.email-editor-textarea') as HTMLTextAreaElement;
		if (!textarea) {
			body += wrapper.replace('$1', placeholder);
			return;
		}

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const selected = body.slice(start, end) || placeholder;
		const before = body.slice(0, start);
		const after = body.slice(end);

		body = before + wrapper.replace('$1', selected) + after;

		requestAnimationFrame(() => {
			const newCursor = start + wrapper.replace('$1', selected).length;
			textarea.focus();
			textarea.setSelectionRange(newCursor, newCursor);
		});
	}

	function previewBody(body: string): string {
		if (body.length <= 120) return body;
		return body.slice(0, 120) + '...';
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

	function statusVariant(status: string): string {
		switch (status) {
			case 'sent':
				return 'success';
			case 'failed':
				return 'error';
			default:
				return 'default';
		}
	}
</script>

{#if !canEmail}
	<Card>
		<div class="py-8 text-center">
			<svg class="mx-auto h-12 w-12 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
		<div class="flex items-center justify-between">
			<h3 class="text-lg font-semibold text-[var(--color-text-primary)]">Parent Emails</h3>
			{#if !subject && !body}
				<Button variant="gradient" size="sm" onclick={generateEmail} loading={generating}>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
					</svg>
					Generate Update Email
				</Button>
			{/if}
		</div>

		{#if tableMissing}
			<Card>
				<div class="rounded-lg bg-[var(--color-warning-bg)] p-4 text-sm text-[var(--color-warning-text)]">
					<p class="font-medium">Database table not found</p>
					<p class="mt-1">Run <code class="rounded bg-[var(--color-surface)] px-1 font-mono text-xs">supabase/migrations/006_parent_emails.sql</code> in the Supabase SQL Editor to create the parent_emails table.</p>
				</div>
			</Card>
		{/if}

		{#if subject || body}
			<Card>
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-[var(--color-text-secondary)]">
							{editExistingId ? 'Editing draft' : 'New draft'}
						</span>
						<div class="flex items-center gap-2">
							<button
								onclick={() => (mode = 'edit')}
								class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors {mode === 'edit'
									? 'bg-[var(--color-primary-100)] text-[var(--color-primary-700)]'
									: 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-secondary)]'}"
							>
								Edit
							</button>
							<button
								onclick={() => (mode = 'preview')}
								class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors {mode === 'preview'
									? 'bg-[var(--color-primary-100)] text-[var(--color-primary-700)]'
									: 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-secondary)]'}"
							>
								Preview
							</button>
						</div>
					</div>

					<input
						type="text"
						bind:value={subject}
						placeholder="Email subject..."
						class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:border-[var(--color-primary-400)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-400)]"
					/>

					{#if mode === 'edit'}
						<div class="flex flex-wrap gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-2 py-1.5">
							<button onclick={() => insertMarkdown('**$1**', 'bold text')} class="rounded px-2 py-1 text-xs font-bold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]" title="Bold (Ctrl+B)">
								B
							</button>
							<button onclick={() => insertMarkdown('*$1*', 'italic text')} class="rounded px-2 py-1 text-xs italic text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]" title="Italic (Ctrl+I)">
								I
							</button>
							<span class="mx-0.5 w-px bg-[var(--color-border)]"></span>
							<button onclick={() => insertMarkdown('## $1', 'Heading')} class="rounded px-2 py-1 text-xs font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]" title="Heading 2">
								H2
							</button>
							<button onclick={() => insertMarkdown('### $1', 'Subheading')} class="rounded px-2 py-1 text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]" title="Heading 3">
								H3
							</button>
							<span class="mx-0.5 w-px bg-[var(--color-border)]"></span>
							<button onclick={() => insertMarkdown('- $1', 'list item')} class="rounded px-2 py-1 text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]" title="Bullet list">
								&bull; List
							</button>
							<button onclick={() => insertMarkdown('1. $1', 'list item')} class="rounded px-2 py-1 text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]" title="Numbered list">
								1. List
							</button>
							<span class="mx-0.5 w-px bg-[var(--color-border)]"></span>
							<button onclick={() => insertMarkdown('[$1](https://...)', 'link text')} class="rounded px-2 py-1 text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]" title="Insert link">
								&#128279;
							</button>
						</div>

						<textarea
							bind:value={body}
							placeholder="Write your email in markdown...&#10;&#10;## Student Progress&#10;This week we covered...&#10;&#10;## Next Steps&#10;- Topic 1&#10;- Topic 2"
							rows="16"
							class="email-editor-textarea w-full resize-y rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-primary)] px-3 py-2.5 font-mono text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:border-[var(--color-primary-400)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-400)]"
						></textarea>
					{:else}
						<div class="min-h-[12rem] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-primary)] px-4 py-3 text-sm">
							{#if body}
								{@html markdownToHTML(body)}
							{:else}
								<span class="italic text-[var(--color-text-tertiary)]">Nothing to preview yet.</span>
							{/if}
						</div>
					{/if}

					<div class="flex flex-wrap items-center gap-2">
						<Button variant="gradient" size="sm" onclick={saveEmail} loading={saving}>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
							</svg>
							Save Draft
						</Button>
						<Button variant="outline" size="sm" onclick={copyAsHTML}>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
							</svg>
							Copy as HTML
						</Button>
						<Button variant="ghost" size="sm" onclick={generateEmail} loading={generating}>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
							Regenerate
						</Button>
						<button
							onclick={discardEditor}
							class="ml-auto text-sm text-[var(--color-text-tertiary)] underline hover:text-[var(--color-text-secondary)]"
						>
							Discard
						</button>
					</div>
				</div>
			</Card>
		{/if}

		{#if emails.length === 0 && !subject && !body}
			<EmptyState
				icon="mail"
				title="No emails yet"
				description="Generate a parent update email to share progress with your student's family."
			/>
		{:else if emails.length > 0}
			<div class="space-y-2">
				<h4 class="text-sm font-semibold text-[var(--color-text-secondary)]">Saved Drafts</h4>
				{#each emails as email}
					<button
						onclick={() => editEmail(email)}
						class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-primary)] p-3 text-left transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-secondary)]"
					>
						<div class="flex items-start justify-between gap-4">
							<div class="min-w-0 flex-1">
								<h5 class="truncate text-sm font-medium text-[var(--color-text-primary)]">
									{email.subject}
								</h5>
								<p class="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
									{previewBody(email.body)}
								</p>
							</div>
							<div class="flex shrink-0 items-center gap-2">
								<Badge variant={statusVariant(email.status)}>{email.status}</Badge>
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
