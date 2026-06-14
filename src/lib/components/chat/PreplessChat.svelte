<script lang="ts">
	import { supabase } from '$lib/lib/supabase';
	import { api } from '$lib/lib/api';
	import { creditStore } from '$lib/stores/credits.svelte';
	import { studentStore } from '$lib/stores/student.svelte';
	import { planStore } from '$lib/stores/plan.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import ChatMessage from './ChatMessage.svelte';
	import ChangeConfirmation from './ChangeConfirmation.svelte';
	import type { PlanChangeProposal, PlanWeek } from '$lib/lib/types';

	let {
		studentId,
		planId
	}: {
		studentId: string;
		planId?: string;
	} = $props();

	let messages: { role: 'user' | 'assistant'; content: string }[] = $state([]);
	let inputText = $state('');
	let loading = $state(false);
	let pendingProposal = $state<PlanChangeProposal | null>(null);
	let executingMutations = $state(false);
	let chatContainer: HTMLDivElement | undefined = $state();

	// Build student context from already-loaded store data (avoids triggering global loading)
	let studentContext = $derived.by(() => {
		const s = studentStore.students.find((st) => st.id === studentId) || studentStore.current;
		if (!s) return null;
		return {
			id: s.id,
			name: s.name,
			grade: s.grade,
			subjects: s.subjects,
			diagnosticData: s.diagnostic_data || undefined,
			extraInfo: s.extra_info || undefined
		};
	});

	// Build plan context from store
	let planContext = $derived.by(() => {
		if (!planId) return null;
		const p = planStore.current;
		const weeks = p?.id === planId ? planStore.weeks : [];
		if (weeks.length === 0) return null;
		return {
			id: planId,
			weeks: weeks.map((w: PlanWeek) => ({
				id: w.id,
				weekNumber: w.week_number,
				theme: w.theme,
				focusAreas: w.focus_areas,
				notes: w.notes
			}))
		};
	});

	// Fetch credits + plan context on mount
	let contextLoaded = $state(false);
	$effect(() => {
		creditStore.fetch();
		if (planId && !contextLoaded) {
			contextLoaded = true;
			planStore.fetchOne(planId);
		}
	});

	async function sendMessage() {
		const text = inputText.trim();
		if (!text || loading) return;

		if (!studentContext) {
			toast.error('Student data not available. Please refresh the page.');
			return;
		}

		pendingProposal = null;
		inputText = '';
		messages = [...messages, { role: 'user', content: text }];
		loading = true;

		try {
			await creditStore.fetch();

			if (!creditStore.hasEnough(0.5)) {
				messages = [
					...messages,
					{
						role: 'assistant',
						content:
							'Insufficient credits. Please upgrade your plan or purchase more credits to continue using the AI chat.'
					}
				];
				return;
			}

			const credited = await creditStore.useCredits(0.5, 'ai_chat_message');
			if (!credited) {
				messages = [
					...messages,
					{
						role: 'assistant',
						content: 'Failed to deduct credits. Please try again or upgrade your plan.'
					}
				];
				return;
			}

			const response = await api.preplessChat({
				messages: messages.map((m) => ({ role: m.role, content: m.content })),
				studentContext: studentContext,
				planContext: planContext || undefined
			});

			if (response.intent === 'info' || response.intent === 'unknown') {
				messages = [...messages, { role: 'assistant', content: response.message }];
			} else if (response.proposedChanges) {
				messages = [...messages, { role: 'assistant', content: response.message }];
				pendingProposal = response.proposedChanges;
			} else {
				messages = [...messages, { role: 'assistant', content: response.message }];
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'An error occurred';
			messages = [...messages, { role: 'assistant', content: `Error: ${msg}` }];
		} finally {
			loading = false;
			scrollToBottom();
		}
	}

	async function approveChanges() {
		if (!pendingProposal) return;
		executingMutations = true;
		try {
			for (const mutation of pendingProposal.mutations) {
				if (mutation.action === 'update') {
					const id = mutation.data.id as string;
					if (!id) {
						toast.error('Invalid mutation: missing id');
						continue;
					}
					const { error } = await supabase.from(mutation.table).update(mutation.data).eq('id', id);
					if (error) throw error;
				} else if (mutation.action === 'insert') {
					const { error } = await supabase.from(mutation.table).insert(mutation.data);
					if (error) throw error;
				}
			}

			if (planId) await planStore.fetchOne(planId);

			messages = [
				...messages,
				{
					role: 'assistant',
					content: "Changes applied! Anything else you'd like to adjust?"
				}
			];
			pendingProposal = null;
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'An error occurred';
			toast.error('Failed to apply changes: ' + msg);
		} finally {
			executingMutations = false;
			scrollToBottom();
		}
	}

	function rejectChanges() {
		messages = [
			...messages,
			{ role: 'assistant', content: "Changes rejected. Let me know if you'd like to try something else." }
		];
		pendingProposal = null;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}

	function scrollToBottom() {
		if (chatContainer) {
			requestAnimationFrame(() => {
				chatContainer!.scrollTop = chatContainer!.scrollHeight;
			});
		}
	}
</script>

<div class="flex h-full flex-col">
	<div bind:this={chatContainer} class="flex-1 space-y-3 overflow-y-auto p-4">
		{#if messages.length === 0}
			<div class="flex h-full items-center justify-center">
				<p class="max-w-sm text-center text-sm text-[var(--color-text-tertiary)]">
					Ask me anything about your student's plan! I can help adjust themes, add tasks, suggest
					resources, or provide learning recommendations.
				</p>
			</div>
		{:else}
			{#each messages as msg}
				<ChatMessage role={msg.role} content={msg.content} />
			{/each}
		{/if}

		{#if loading}
			<div class="flex items-center gap-2 text-sm text-[var(--color-text-tertiary)]">
				<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
				</svg>
				Prepless AI is thinking...
			</div>
		{/if}
	</div>

	{#if pendingProposal}
		<div class="border-t border-[var(--color-border)] p-4">
			<ChangeConfirmation
				proposal={pendingProposal}
				loading={executingMutations}
				onapprove={approveChanges}
				onreject={rejectChanges}
			/>
		</div>
	{/if}

	<div class="border-t border-[var(--color-border)] p-4">
		<div class="flex items-end gap-3">
			<textarea
				bind:value={inputText}
				onkeydown={handleKeydown}
				placeholder="Ask Prepless AI..."
				rows="1"
				maxlength="5000"
				disabled={loading || executingMutations}
				class="flex-1 resize-none rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface-primary)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:ring-2 focus:ring-[var(--color-primary-400)] focus:outline-none disabled:opacity-50"
			></textarea>
			<button
				onclick={sendMessage}
				disabled={!inputText.trim() || loading || executingMutations}
				class="inline-flex flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-500)] p-3 text-white transition-colors hover:bg-[var(--color-primary-600)] active:bg-[var(--color-primary-700)] disabled:pointer-events-none disabled:opacity-50"
				aria-label="Send message"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<line x1="22" y1="2" x2="11" y2="13" />
					<polygon points="22 2 15 22 11 13 2 9 22 2" />
				</svg>
			</button>
		</div>
	</div>
</div>
