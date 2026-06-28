<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/lib/supabase';
	import { api } from '$lib/lib/api';
	import { creditStore } from '$lib/stores/credits.svelte';
	import { studentStore } from '$lib/stores/student.svelte';
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

	// Plan selector state
	interface PlanOption {
		id: string;
		label: string;
		grade: string;
	}
	let availablePlans = $state<PlanOption[]>([]);
	let selectedOption = $state<string>('all'); // 'all' | planId
	let planContext = $state<{
		id: string;
		weeks: Array<{
			id: string;
			weekNumber: number;
			theme: string | null;
			focusAreas: string[];
			notes: string | null;
		}>;
	} | null>(null);
	let plansLoaded = $state(false);

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

	onMount(async () => {
		creditStore.fetch();
		await fetchAvailablePlans();

		// Set initial selection: passed planId, first available plan, or 'all'
		if (planId && availablePlans.some((p) => p.id === planId)) {
			selectedOption = planId;
		} else if (availablePlans.length === 1) {
			selectedOption = availablePlans[0].id;
		}

		if (selectedOption !== 'all') {
			await loadPlanContext(selectedOption);
		} else if (availablePlans.length === 0) {
			// No plans at all — work with just student context
			planContext = null;
		} else {
			await loadAllPlanContexts();
		}

		plansLoaded = true;
	});

	async function fetchAvailablePlans() {
		const { data } = await supabase
			.from('weekly_plans')
			.select('id, title, grade, student_id')
			.eq('student_id', studentId)
			.order('created_at', { ascending: false });

		if (data) {
			availablePlans = (data as Array<{ id: string; title: string; grade: string }>).map((p) => ({
				id: p.id,
				label: p.title || `${p.grade} Plan`,
				grade: p.grade
			}));
		}
	}

	async function loadPlanContext(planIdToLoad: string) {
		const { data: weeks } = await supabase
			.from('plan_weeks')
			.select('id, week_number, theme, focus_areas, notes')
			.eq('plan_id', planIdToLoad)
			.order('week_number');

		if (weeks && weeks.length > 0) {
			planContext = {
				id: planIdToLoad,
				weeks: weeks.map((w: Record<string, unknown>) => ({
					id: w.id as string,
					weekNumber: w.week_number as number,
					theme: (w.theme as string) || null,
					focusAreas: (w.focus_areas as string[]) || [],
					notes: (w.notes as string) || null
				}))
			};
		} else {
			planContext = { id: planIdToLoad, weeks: [] };
		}
	}

	async function loadAllPlanContexts() {
		if (availablePlans.length === 0) {
			planContext = null;
			return;
		}

		const planIds = availablePlans.map((p) => p.id);
		const { data: weeks } = await supabase
			.from('plan_weeks')
			.select('id, week_number, theme, focus_areas, notes, plan_id')
			.in('plan_id', planIds)
			.order('week_number');

		if (weeks && weeks.length > 0) {
			// Group weeks by plan and use a synthetic id
			const allWeeks = (weeks as Array<Record<string, unknown>>).map((w) => ({
				id: w.id as string,
				weekNumber: w.week_number as number,
				theme: (w.theme as string) || null,
				focusAreas: (w.focus_areas as string[]) || [],
				notes: (w.notes as string) || null,
				planId: w.plan_id as string
			}));

			planContext = {
				id: 'all',
				weeks: allWeeks.map((w) => ({
					id: w.id,
					weekNumber: w.weekNumber,
					theme: w.theme,
					focusAreas: w.focusAreas,
					notes: w.notes
				}))
			};
		} else {
			planContext = { id: 'all', weeks: [] };
		}
	}

	async function handlePlanChange(e: Event) {
		const value = (e.target as HTMLSelectElement).value;
		selectedOption = value;
		if (value === 'all') {
			await loadAllPlanContexts();
		} else {
			await loadPlanContext(value);
		}
	}

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
			console.group('%c🔮 PreplessChat.sendMessage', 'color: #a78bfa; font-weight: bold');
			console.log('📤 User message:', text);
			console.log('👤 Student context:', studentContext);
			console.log('📋 Plan context:', planContext);
			console.log('💬 Full conversation length:', messages.length, 'messages (including current)');

			await creditStore.fetch();
			console.log('💰 Credits after fetch:', creditStore.credits, 'available, needs 0.5');

			if (!creditStore.hasEnough(0.5)) {
				console.warn('❌ Insufficient credits — aborting');
				console.groupEnd();
				messages = [
					...messages,
					{
						role: 'assistant',
						content:
							'Insufficient credits. Please upgrade your plan or purchase more credits to continue using the AI chat.'
					}
				];
				loading = false;
				scrollToBottom();
				return;
			}

			const credited = await creditStore.useCredits(0.5, 'ai_chat_message');
			console.log('💰 Credit deduction result:', credited);
			if (!credited) {
				console.warn('❌ Credit deduction failed — aborting');
				console.groupEnd();
				messages = [
					...messages,
					{
						role: 'assistant',
						content: 'Failed to deduct credits. Please try again or upgrade your plan.'
					}
				];
				loading = false;
				scrollToBottom();
				return;
			}

			console.log('🚀 Calling API /api/prepless-chat...');
			const requestBody = {
				messages: messages.map((m) => ({ role: m.role, content: m.content })),
				studentContext: studentContext,
				planContext: planContext || undefined
			};
			console.log(
				'📦 Request body (first 3000 chars):',
				JSON.stringify(requestBody, null, 2).slice(0, 3000)
			);

			const response = await api.preplessChat(requestBody);

			console.log('✅ API response received');
			console.log('  intent:', response.intent);
			console.log('  message (first 500 chars):', response.message?.slice(0, 500));
			console.log('  creditCost:', response.creditCost);
			console.log('  proposedChanges present:', !!response.proposedChanges);
			if (response.proposedChanges) {
				console.log('  proposedChanges.type:', response.proposedChanges.type);
				console.log('  proposedChanges.description:', response.proposedChanges.description);
				console.log(
					'  proposedChanges.mutations count:',
					response.proposedChanges.mutations?.length
				);
				console.log('  proposedChanges (full):', JSON.stringify(response.proposedChanges, null, 2));
			}

			if (response.intent === 'info' || response.intent === 'unknown') {
				console.log('ℹ️ Info/unknown intent — showing message only');
				messages = [...messages, { role: 'assistant', content: response.message }];
			} else if (response.proposedChanges) {
				console.log('🔧 Edit intent with proposedChanges — showing ChangeConfirmation');
				messages = [...messages, { role: 'assistant', content: response.message }];
				pendingProposal = response.proposedChanges;
			} else {
				console.warn('⚠️ Non-info intent but NO proposedChanges object');
				console.warn('  intent was:', response.intent);
				console.warn('  full response keys:', Object.keys(response));
				messages = [...messages, { role: 'assistant', content: response.message }];
			}
			console.groupEnd();
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'An error occurred';
			console.group('%c💥 PreplessChat ERROR', 'color: #ef4444; font-weight: bold');
			console.error('Error message:', msg);
			console.error('Error constructor:', (err as Error)?.constructor?.name ?? typeof err);
			console.error('Full error object:', err);
			if (err instanceof Error && err.stack) {
				console.error('Stack trace:', err.stack);
			}
			// Try to extract more from the error
			try {
				console.error('Error JSON:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
			} catch {
				console.error('(could not serialize error)');
			}
			console.groupEnd();
			messages = [...messages, { role: 'assistant', content: `Error: ${msg}` }];
		} finally {
			loading = false;
			scrollToBottom();
		}
	}

	async function approveChanges() {
		if (!pendingProposal) return;

		console.group('%c✅ PreplessChat.approveChanges', 'color: #34d399; font-weight: bold');
		console.log('📋 Proposal type:', pendingProposal.type);
		console.log('📋 Proposal description:', pendingProposal.description);
		console.log('📋 Total mutations:', pendingProposal.mutations.length);

		executingMutations = true;
		const succeeded: string[] = [];
		const failed: string[] = [];

		for (let i = 0; i < pendingProposal.mutations.length; i++) {
			const mutation = pendingProposal.mutations[i];
			console.group(`🔨 Mutation ${i + 1}/${pendingProposal.mutations.length}`);
			console.log('  table:', mutation.table);
			console.log('  action:', mutation.action);
			console.log('  data keys:', Object.keys(mutation.data));
			console.log('  data:', JSON.stringify(mutation.data, null, 2));

			if (mutation.action === 'update') {
				const id = mutation.data.id as string;
				if (!id) {
					console.error('  ❌ Update mutation missing "id" in data');
					failed.push('Update mutation missing id');
					console.groupEnd();
					continue;
				}
				console.log(`  📡 supabase.from('${mutation.table}').update(...).eq('id', '${id}')`);
				// Log the actual update payload (exclude id since it's in the WHERE)
				const updatePayload = { ...mutation.data };
				delete updatePayload.id;
				console.log('  📦 Update payload:', JSON.stringify(updatePayload, null, 2));
				try {
					const { error } = await supabase.from(mutation.table).update(mutation.data).eq('id', id);
					if (error) {
						console.error(`  ❌ Supabase error:`, error);
						console.error(
							`     code: ${error.code}, message: ${error.message}, details: ${error.details}`
						);
						failed.push(`${mutation.table}(${id}): ${error.message}`);
					} else {
						console.log(`  ✅ Updated ${mutation.table} row ${id}`);
						succeeded.push(`${mutation.table}(${id})`);
					}
				} catch (err: unknown) {
					const msg = err instanceof Error ? err.message : 'Unknown error';
					console.error(`  ❌ Exception during update:`, err);
					failed.push(`${mutation.table}(${id}): ${msg}`);
				}
			} else if (mutation.action === 'insert') {
				console.log(`  📡 supabase.from('${mutation.table}').insert(...)`);
				console.log('  📦 Insert payload:', JSON.stringify(mutation.data, null, 2));
				try {
					const { error } = await supabase.from(mutation.table).insert(mutation.data);
					if (error) {
						console.error(`  ❌ Supabase insert error:`, error);
						console.error(
							`     code: ${error.code}, message: ${error.message}, details: ${error.details}`
						);
						failed.push(`Insert into ${mutation.table}: ${error.message}`);
					} else {
						console.log(`  ✅ Inserted into ${mutation.table}`);
						succeeded.push(`Insert into ${mutation.table}`);
					}
				} catch (err: unknown) {
					const msg = err instanceof Error ? err.message : 'Unknown error';
					console.error(`  ❌ Exception during insert:`, err);
					failed.push(`Insert into ${mutation.table}: ${msg}`);
				}
			} else {
				console.error(`  ❌ Unknown action: "${(mutation as Record<string, unknown>).action}"`);
				failed.push(`Unknown action: ${(mutation as Record<string, unknown>).action}`);
			}
			console.groupEnd();
		}

		console.log('📊 Mutation results — succeeded:', succeeded.length, 'failed:', failed.length);
		if (succeeded.length > 0) console.log('  ✅', succeeded);
		if (failed.length > 0) console.warn('  ❌', failed);

		// Refresh plan context after mutations
		console.log('🔄 Refreshing plan context...');
		if (selectedOption === 'all') {
			await loadAllPlanContexts();
		} else if (selectedOption) {
			await loadPlanContext(selectedOption);
		}
		console.log('🔄 Plan context refreshed');

		if (failed.length === 0) {
			console.log('🎉 All mutations succeeded!');
			toast.success(`All ${succeeded.length} change(s) applied successfully.`);
			messages = [
				...messages,
				{ role: 'assistant', content: "Changes applied! Anything else you'd like to adjust?" }
			];
		} else if (succeeded.length > 0) {
			console.warn('⚠️ Partial success — some mutations failed');
			toast.warning(`${succeeded.length} change(s) succeeded, ${failed.length} failed.`);
			messages = [
				...messages,
				{
					role: 'assistant',
					content:
						`Some changes applied (${succeeded.length} succeeded, ${failed.length} failed). ` +
						'The successful changes are already saved. You may want to retry the failed ones.'
				}
			];
		} else {
			console.error('💀 All mutations failed!');
			toast.error(`All ${failed.length} change(s) failed.`);
			messages = [
				...messages,
				{ role: 'assistant', content: 'None of the changes could be applied. Please try again.' }
			];
		}

		pendingProposal = null;
		executingMutations = false;
		scrollToBottom();
		console.groupEnd();
	}

	function rejectChanges() {
		console.log('🚫 Changes rejected by user');
		messages = [
			...messages,
			{
				role: 'assistant',
				content: "Changes rejected. Let me know if you'd like to try something else."
			}
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
	<!-- Plan selector bar -->
	{#if plansLoaded && availablePlans.length > 0}
		<div class="border-b border-[var(--color-border)] px-4 py-2">
			<select
				value={selectedOption}
				onchange={handlePlanChange}
				class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-primary-400)] focus:ring-1 focus:ring-[var(--color-primary-400)] focus:outline-none"
			>
				<option value="all">All Plans ({availablePlans.length})</option>
				{#each availablePlans as plan}
					<option value={plan.id}>{plan.label}</option>
				{/each}
			</select>
		</div>
	{/if}

	<div bind:this={chatContainer} class="flex-1 space-y-3 overflow-y-auto p-4">
		{#if messages.length === 0}
			<div class="flex h-full items-center justify-center">
				<p class="max-w-sm text-center text-sm text-[var(--color-text-tertiary)]">
					Ask me anything about your student's plan! I can help adjust themes, add tasks, suggest
					resources, or provide learning recommendations.
					{#if planContext}
						<br /><br />
						<span class="text-xs">
							{selectedOption === 'all'
								? `Context: all ${availablePlans.length} plan(s) loaded.`
								: 'Context: 1 plan loaded.'}
						</span>
					{/if}
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
					<circle
						class="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						stroke-width="4"
					/>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
					/>
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
