<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/lib/supabase';
	import { api } from '$lib/lib/api';
	import { creditStore } from '$lib/stores/credits.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { canUseFeature } from '$lib/lib/constants';
	import type { PlanWeekHomework } from '$lib/lib/types';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import { toast } from '$lib/stores/toast.svelte';

	let { weekId }: { weekId: string } = $props();

	let homework = $state<PlanWeekHomework[]>([]);
	let loading = $state(true);
	let adding = $state(false);
	let aiSuggesting = $state(false);

	let newTitle = $state('');
	let newDescription = $state('');
	let newUrl = $state('');

	onMount(() => {
		creditStore.fetch();
		loadHomework();
	});

	async function loadHomework() {
		loading = true;
		const { data } = await supabase
			.from('plan_week_homework')
			.select('*')
			.eq('week_id', weekId)
			.order('sort_order', { ascending: true });
		if (data) homework = data as PlanWeekHomework[];
		loading = false;
	}

	async function toggleCompleted(item: PlanWeekHomework) {
		const updated = !item.completed;
		await supabase.from('plan_week_homework').update({ completed: updated }).eq('id', item.id);
		item.completed = updated;
	}

	async function deleteItem(id: string) {
		await supabase.from('plan_week_homework').delete().eq('id', id);
		homework = homework.filter((h) => h.id !== id);
	}

	async function addItem() {
		if (!newTitle.trim()) return;
		const sortOrder = homework.length > 0 ? Math.max(...homework.map((h) => h.sort_order)) + 1 : 1;
		const { data } = await supabase
			.from('plan_week_homework')
			.insert({
				week_id: weekId,
				title: newTitle.trim(),
				description: newDescription.trim() || null,
				url: newUrl.trim() || null,
				completed: false,
				sort_order: sortOrder
			})
			.select()
			.single();
		if (data) {
			homework = [...homework, data as PlanWeekHomework];
		}
		newTitle = '';
		newDescription = '';
		newUrl = '';
		adding = false;
	}

	function cancelAdd() {
		newTitle = '';
		newDescription = '';
		newUrl = '';
		adding = false;
	}

	async function aiSuggestHomework() {
		aiSuggesting = true;
		try {
			// Fresh credit check and lock before any async work
			await creditStore.fetch();
			if (!creditStore.hasEnough(0.5)) {
				toast.error('Insufficient credits. Upgrade your plan or purchase more credits.');
				aiSuggesting = false;
				return;
			}

			const credited = await creditStore.useCredits(0.5, 'ai_suggest_homework');
			if (!credited) {
				aiSuggesting = false;
				return;
			}

			const { data: week } = await supabase
				.from('plan_weeks')
				.select('week_number, theme, focus_areas, notes, plan_id')
				.eq('id', weekId)
				.single();

			const weekContext = week
				? `Week ${week.week_number}${week.theme ? ` - Theme: ${week.theme}` : ''}${week.focus_areas?.length > 0 ? `, Focus: ${week.focus_areas.join(', ')}` : ''}${week.notes ? `, Notes: ${week.notes}` : ''}`
				: '';

			// Fetch plan to get grade/subjects for context
			let planGrade = '';
			let planSubjects: string[] = [];
			if (week?.plan_id) {
				const { data: plan } = await supabase
					.from('weekly_plans')
					.select('grade, subjects')
					.eq('id', week.plan_id)
					.single();
				if (plan) {
					planGrade = plan.grade;
					planSubjects = plan.subjects;
				}
			}

			const response = await api.preplessChat({
				messages: [
					{
						role: 'user',
						content: `Suggest 3 homework assignments for ${weekContext}. Grade: ${planGrade}. Subjects: ${planSubjects.join(', ')}. Return ONLY a JSON array: [{"title":"...","description":"...","url":"..."}]. No markdown wrapping.`
					}
				],
				studentContext: {
					id: '',
					name: '',
					grade: planGrade,
					subjects: planSubjects
				}
			});

			// Parse homework suggestions from response
			let raw = response.message;
			const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
			if (fenceMatch) raw = fenceMatch[1];

			let suggestions: Array<{ title: string; description?: string; url?: string }> = [];
			try {
				suggestions = JSON.parse(raw);
			} catch {
				const arrMatch = raw.match(/\[\s*\{[\s\S]*\}\s*\]/);
				if (arrMatch) {
					try { suggestions = JSON.parse(arrMatch[0]); } catch { /* fall through */ }
				}
			}

			if (!Array.isArray(suggestions) || suggestions.length === 0) {
				toast.error('Could not parse AI suggestions. Try adding homework manually.');
				aiSuggesting = false;
				return;
			}

			for (const s of suggestions) {
				const sortOrder = homework.length > 0 ? Math.max(...homework.map((h) => h.sort_order)) + 1 : 1;
				const { data } = await supabase
					.from('plan_week_homework')
					.insert({
						week_id: weekId,
						title: s.title?.trim() || 'Untitled',
						description: s.description?.trim() || null,
						url: s.url?.trim() || null,
						completed: false,
						sort_order: sortOrder
					})
					.select()
					.single();
				if (data) homework = [...homework, data as PlanWeekHomework];
			}

			toast.success(`Added ${suggestions.length} AI-suggested homework items!`);
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Unknown error';
			toast.error('AI suggestion failed: ' + msg);
		} finally {
			aiSuggesting = false;
		}
	}
</script>

<div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
	<h4 class="mb-3 text-sm font-semibold tracking-wider text-[var(--color-text-secondary)] uppercase">
		Homework
	</h4>

	{#if loading}
		<div class="flex items-center justify-center py-4">
			<svg class="h-5 w-5 animate-spin text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
			</svg>
		</div>
	{:else if homework.length === 0 && !adding}
		<p class="mb-3 text-sm text-[var(--color-text-tertiary)]">No homework assigned yet.</p>
	{:else}
		<div class="mb-3 space-y-1.5">
			{#each homework as item (item.id)}
				<div class="flex items-start gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2">
					<button onclick={() => toggleCompleted(item)} class="mt-0.5 shrink-0 cursor-pointer" aria-label="Toggle completion">
						{#if item.completed}
							<svg class="h-4 w-4 text-[var(--color-success)]" fill="currentColor" viewBox="0 0 24 24">
								<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
							</svg>
						{:else}
							<div class="h-4 w-4 rounded border border-[var(--color-border-strong)]"></div>
						{/if}
					</button>
					<div class="min-w-0 flex-1">
						<span class="block text-sm font-medium text-[var(--color-text-primary)]">{item.title}</span>
						{#if item.description}
							<p class="mt-0.5 text-xs text-[var(--color-text-tertiary)]">{item.description}</p>
						{/if}
						{#if item.url}
							<a href={item.url} target="_blank" rel="noopener noreferrer" class="mt-0.5 inline-block text-xs text-[var(--color-primary-500)] hover:underline">
								{item.url}
							</a>
						{/if}
					</div>
					<button onclick={() => deleteItem(item.id)} class="shrink-0 cursor-pointer rounded p-1 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-error-bg)] hover:text-[var(--color-error)]" aria-label="Delete homework">
						<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
					</button>
				</div>
			{/each}
		</div>
	{/if}

	{#if adding}
		<div class="space-y-2 border-t border-[var(--color-border)] pt-3">
			<Input label="Title" name="homeworkTitle" placeholder="Homework title" value={newTitle} oninput={(e) => (newTitle = (e.target as HTMLInputElement).value)} />
			<Textarea label="Description (optional)" name="homeworkDescription" placeholder="Description..." value={newDescription} oninput={(e) => (newDescription = (e.target as HTMLTextAreaElement).value)} rows={2} />
			<Input label="URL (optional)" name="homeworkUrl" placeholder="https://..." value={newUrl} oninput={(e) => (newUrl = (e.target as HTMLInputElement).value)} />
			<div class="flex gap-2">
				<Button variant="gradient" size="sm" onclick={addItem}>Save</Button>
				<Button variant="ghost" size="sm" onclick={cancelAdd}>Cancel</Button>
			</div>
		</div>
	{:else}
		<div class="flex flex-col gap-2">
			<Button variant="secondary" size="sm" onclick={() => (adding = true)} fullWidth>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
				Add Homework
			</Button>
			{#if canUseFeature(auth.profile?.subscription_tier || 'free', 'plan_regeneration')}
				<Button variant="outline" size="sm" onclick={aiSuggestHomework} loading={aiSuggesting} fullWidth>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
					</svg>
					AI Suggest
				</Button>
			{/if}
			<a href="/dashboard/resources/search" class="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] px-4 py-2 text-xs font-medium text-[var(--color-primary-600)] no-underline transition-colors hover:bg-[var(--color-surface-secondary)]">
				<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
				Find Resources
			</a>
		</div>
	{/if}
</div>
