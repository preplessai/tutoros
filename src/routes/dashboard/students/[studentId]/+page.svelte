<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { studentStore } from '$lib/stores/student.svelte';
	import { planStore } from '$lib/stores/plan.svelte';
	import { supabase } from '$lib/lib/supabase';
	import { auth } from '$lib/stores/auth.svelte';
	import { canUseFeature } from '$lib/lib/constants';
	import { formatDateShort } from '$lib/lib/date';
	import PlanTimeline from '$lib/components/plans/PlanTimeline.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import Tabs from '$lib/components/ui/Tabs.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import PreplessChat from '$lib/components/chat/PreplessChat.svelte';
	import EmailTab from '$lib/components/emails/EmailTab.svelte';
	import StudentForm from '$lib/components/students/StudentForm.svelte';
	import type { PlanDay, WeeklyPlan } from '$lib/lib/types';

	let tab = $state('timeline');
	let deleting = $state(false);
	let plansLoading = $state(false);
	let studentPlans = $state<WeeklyPlan[]>([]);
	let selectedPlanId = $state<string | null>(null);
	let dayPlansData = $state<Record<string, Array<PlanDay & { energy_level: string | null }>>>({});
	let dayPlansLoading = $state(false);
	let progressData = $state<{
		totalTasks: number;
		completedTasks: number;
		completionRate: number;
		totalDays: number;
		totalMinutes: number;
		struggleAreas: string[];
	} | null>(null);
	let progressLoading = $state(false);
	let settingsSaved = $state(false);

	const tier = $derived(auth.profile?.subscription_tier || 'free');

	const tabs = [
		{ value: 'timeline', label: 'Timeline' },
		{ value: 'dayplans', label: 'Day Plans' },
		{ value: 'progress', label: 'Progress' },
		{ value: 'emails', label: 'Emails' },
		{ value: 'prepless-ai', label: 'Prepless AI' },
		{ value: 'settings', label: 'Settings' }
	];

	onMount(() => {
		// Read tab from URL
		const urlTab = $page.url.searchParams.get('tab');
		if (urlTab && tabs.some((t) => t.value === urlTab)) {
			tab = urlTab;
		}

		studentStore.fetchOne($page.params.studentId);
		fetchStudentPlans();
	});

	function setTab(t: string) {
		tab = t;
		// Update URL without navigation
		const url = new URL(window.location.href);
		url.searchParams.set('tab', t);
		window.history.replaceState({}, '', url.toString());
	}

	async function fetchStudentPlans() {
		plansLoading = true;
		const { data } = await supabase
			.from('weekly_plans')
			.select('*')
			.eq('student_id', $page.params.studentId)
			.order('created_at', { ascending: false });
		studentPlans = (data || []) as WeeklyPlan[];

		// Reset selectedPlanId if the old plan is gone, or set to first if not set
		if (studentPlans.length > 0) {
			if (selectedPlanId === null || !studentPlans.some((p) => p.id === selectedPlanId)) {
				selectedPlanId = studentPlans[0].id;
			}
		} else {
			selectedPlanId = null;
		}

		plansLoading = false;
	}

	async function handleDelete() {
		if (!confirm('Delete this student and all their plans? This cannot be undone.')) return;
		deleting = true;
		await studentStore.remove($page.params.studentId);
		goto('/dashboard/students');
	}

	async function fetchDaysForPlan(
		planId: string
	): Promise<Array<PlanDay & { energy_level: string | null }>> {
		const { data: weeks } = await supabase.from('plan_weeks').select('id').eq('plan_id', planId);

		const weekIds = (weeks || []).map((w) => w.id);
		if (weekIds.length === 0) return [];

		const { data: days } = await supabase
			.from('plan_days')
			.select('*')
			.in('week_id', weekIds)
			.order('date', { ascending: false });

		return (days || []) as Array<PlanDay & { energy_level: string | null }>;
	}

	async function fetchStudentProgress(studentId: string) {
		const { data: plans } = await supabase
			.from('weekly_plans')
			.select('id')
			.eq('student_id', studentId);

		const planIds = (plans || []).map((p) => p.id);
		if (planIds.length === 0) {
			return {
				totalTasks: 0,
				completedTasks: 0,
				completionRate: 0,
				totalDays: 0,
				totalMinutes: 0,
				struggleAreas: [] as string[]
			};
		}

		const { data: weeks } = await supabase.from('plan_weeks').select('id').in('plan_id', planIds);

		const weekIds = (weeks || []).map((w) => w.id);
		if (weekIds.length === 0) {
			return {
				totalTasks: 0,
				completedTasks: 0,
				completionRate: 0,
				totalDays: 0,
				totalMinutes: 0,
				struggleAreas: [] as string[]
			};
		}

		const { data: homeworkItems } = await supabase
			.from('plan_week_homework')
			.select('completed, week_id')
			.in('week_id', weekIds);

		const { data: days } = await supabase
			.from('plan_days')
			.select('id, struggle_areas, plan_tasks(id, completed, duration_minutes)')
			.in('week_id', weekIds);

		let totalTasks = 0;
		let completedTasks = 0;
		let totalMinutes = 0;
		const struggleSet = new Set<string>();

		for (const day of days || []) {
			if (day.struggle_areas) {
				for (const area of day.struggle_areas) struggleSet.add(area);
			}
			for (const task of day.plan_tasks || []) {
				totalTasks++;
				totalMinutes += task.duration_minutes || 0;
				if (task.completed) completedTasks++;
			}
		}

		for (const hw of homeworkItems || []) {
			totalTasks++;
			if (hw.completed) completedTasks++;
		}

		return {
			totalTasks,
			completedTasks,
			completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
			totalDays: (days || []).length,
			totalMinutes,
			struggleAreas: Array.from(struggleSet).sort()
		};
	}

	// Load initial plan for timeline
	$effect(() => {
		if (tab === 'timeline' && selectedPlanId && studentPlans.length > 0) {
			planStore.fetchOne(selectedPlanId);
		}
	});

	// Fetch day plans for all plans when Day Plans tab is active
	$effect(() => {
		if (tab === 'dayplans' && studentPlans.length > 0 && Object.keys(dayPlansData).length === 0) {
			dayPlansLoading = true;
			(async () => {
				const result: Record<string, Array<PlanDay & { energy_level: string | null }>> = {};
				for (const plan of studentPlans) {
					const days = await fetchDaysForPlan(plan.id);
					result[plan.id] = days;
				}
				dayPlansData = result;
				dayPlansLoading = false;
			})();
		}
	});

	// Fetch progress data when Progress tab is active
	$effect(() => {
		if (
			tab === 'progress' &&
			studentStore.current &&
			canUseFeature(tier, 'progress_reports') &&
			!progressData
		) {
			progressLoading = true;
			(async () => {
				const result = await fetchStudentProgress($page.params.studentId);
				progressData = result;
				progressLoading = false;
			})();
		}
	});

	// Reload student after settings save
	$effect(() => {
		if (settingsSaved) {
			studentStore.fetchOne($page.params.studentId);
			settingsSaved = false;
		}
	});
</script>

<svelte:head><title>{studentStore.current?.name || 'Student'} — Prepless AI</title></svelte:head>

{#if studentStore.loading}
	<div class="flex justify-center py-12"><Spinner size="lg" /></div>
{:else if studentStore.current}
	{@const s = studentStore.current}
	<div class="space-y-6">
		<!-- Header -->
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div class="min-w-0">
				<h1 class="truncate text-2xl font-bold text-[var(--color-text-primary)]">{s.name}</h1>
				<div class="mt-1 flex flex-wrap items-center gap-2">
					<Badge variant="info">{s.grade}</Badge>
					{#each s.subjects.slice(0, 4) as subject}
						<Badge variant="primary">{subject}</Badge>
					{/each}
					{#if s.subjects.length > 4}
						<span class="text-xs text-[var(--color-text-tertiary)]"
							>+{s.subjects.length - 4} more</span
						>
					{/if}
				</div>
			</div>
			<div class="flex gap-2">
				<Button variant="gradient" size="sm" href={`/dashboard/plans/new?studentId=${s.id}`}>
					New Plan
				</Button>
				<Button variant="danger" size="sm" onclick={handleDelete} loading={deleting}>Delete</Button>
			</div>
		</div>

		<!-- Tab bar -->
		<Tabs {tabs} activeTab={tab} onchange={(t: string) => setTab(t)} />

		<!-- ═══ Timeline Tab ═══ -->
		{#if tab === 'timeline'}
			{#if plansLoading}
				<div class="flex justify-center py-12"><Spinner size="md" /></div>
			{:else if studentPlans.length === 0}
				<EmptyState
					icon="calendar"
					title="No plans yet"
					description="Create a learning plan for {s.name} to get started."
					action={{ label: 'Create Plan', href: `/dashboard/plans/new?studentId=${s.id}` }}
				/>
			{:else}
				<!-- Plan selector -->
				<div class="flex flex-wrap items-center gap-3">
					<label class="text-sm text-[var(--color-text-secondary)]">Plan:</label>
					<select
						class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-1.5 text-sm text-[var(--color-text-primary)]"
						bind:value={selectedPlanId}
						onchange={() => {
							if (selectedPlanId) planStore.fetchOne(selectedPlanId);
						}}
					>
						{#each studentPlans as plan}
							<option value={plan.id}
								>{plan.title} — {plan.grade} • {plan.subjects.join(', ')}</option
							>
						{/each}
					</select>
				</div>

				<div class="mt-4">
					<PlanTimeline />
				</div>
		{/if}
		{/if}

		<!-- ═══ Day Plans Tab ═══ -->
		{#if tab === 'dayplans'}
			{#if plansLoading || dayPlansLoading}
				<div class="flex justify-center py-12"><Spinner size="md" /></div>
			{:else if studentPlans.length === 0}
				<EmptyState
					icon="calendar"
					title="No plans yet"
					description="Create a learning plan first, then generate day plans within each week."
					action={{
						label: 'Create Plan',
						href: `/dashboard/plans/new?studentId=${$page.params.studentId}`
					}}
				/>
			{:else}
				{#each studentPlans as plan}
					{@const days = dayPlansData[plan.id] || []}
					<div class="mb-8">
						<h2 class="mb-3 text-lg font-semibold text-[var(--color-text-primary)]">
							{plan.title}
						</h2>
						{#if days.length === 0}
							<p class="text-sm text-[var(--color-text-tertiary)]">
								No day plans yet. Generate them from the plan timeline.
							</p>
							<a
								href="?tab=timeline"
								class="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-1.5 text-sm font-medium text-[var(--color-primary-500)] no-underline transition-colors hover:bg-[var(--color-surface-secondary)]"
							>
								View Plan Timeline to Generate Day Plans
							</a>
						{:else}
							<div class="grid gap-1.5">
								{#each days as day}
									<a
										href="/dashboard/day-plans/{day.id}"
										class="group flex items-center gap-3 rounded-lg border border-[var(--color-border)] px-4 py-2.5 no-underline transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-secondary)]"
									>
										<svg
											class="h-4 w-4 shrink-0 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-primary-500)]"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
											/>
										</svg>
										<span class="flex-1 text-sm font-medium text-[var(--color-text-primary)]"
											>{formatDateShort(day.date)} — {day.day_of_week}</span
										>
										<span class="text-xs text-[var(--color-text-tertiary)] capitalize"
											>{day.energy_level || '—'}</span
										>
										<svg
											class="h-4 w-4 text-[var(--color-text-tertiary)] transition-transform group-hover:translate-x-0.5"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M9 5l7 7-7 7"
											/>
										</svg>
									</a>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
		{/if}
		{/if}

		<!-- ═══ Progress Tab ═══ -->
		{#if tab === 'progress'}
			{#if canUseFeature(tier, 'progress_reports')}
				{#if progressLoading}
					<div class="flex justify-center py-12"><Spinner size="md" /></div>
				{:else if progressData && progressData.totalTasks > 0}
					<div class="space-y-6">
						<!-- Summary cards -->
						<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
							<Card padding={false}>
								<div class="p-4 text-center">
									<div class="text-2xl font-bold text-[var(--color-text-primary)]">
										{progressData.completionRate}%
									</div>
									<div class="mt-1 text-xs text-[var(--color-text-secondary)]">Completion</div>
									<div class="mt-2 h-1.5 w-full rounded-full bg-[var(--color-surface-tertiary)]">
										<div
											class="h-1.5 rounded-full {progressData.completionRate >= 80
												? 'bg-[var(--color-success)]'
												: progressData.completionRate >= 50
													? 'bg-[var(--color-warning)]'
													: 'bg-[var(--color-error)]'}"
											style="width: {progressData.completionRate}%"
										></div>
									</div>
								</div>
							</Card>
							<Card padding={false}>
								<div class="p-4 text-center">
									<div class="text-2xl font-bold text-[var(--color-text-primary)]">
										{progressData.completedTasks}<span
											class="text-sm font-normal text-[var(--color-text-tertiary)]"
											>/{progressData.totalTasks}</span
										>
									</div>
									<div class="mt-1 text-xs text-[var(--color-text-secondary)]">Tasks done</div>
								</div>
							</Card>
							<Card padding={false}>
								<div class="p-4 text-center">
									<div class="text-2xl font-bold text-[var(--color-text-primary)]">
										{progressData.totalDays}
									</div>
									<div class="mt-1 text-xs text-[var(--color-text-secondary)]">Days planned</div>
								</div>
							</Card>
							<Card padding={false}>
								<div class="p-4 text-center">
									<div class="text-2xl font-bold text-[var(--color-text-primary)]">
										{progressData.totalMinutes}
									</div>
									<div class="mt-1 text-xs text-[var(--color-text-secondary)]">Minutes planned</div>
								</div>
							</Card>
						</div>

						<!-- Struggle areas -->
						{#if progressData.struggleAreas.length > 0}
							<Card>
								<h3 class="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
									Struggle Areas
								</h3>
								<div class="flex flex-wrap gap-2">
									{#each progressData.struggleAreas as area}
										<Badge variant="warning">{area}</Badge>
									{/each}
								</div>
							</Card>
						{/if}
					</div>
				{:else}
					<EmptyState
						icon="chart"
						title="No data yet"
						description="Create a plan and generate day plans to start tracking progress."
					/>
				{/if}
			{:else}
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
								d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
							/>
						</svg>
						<h2 class="mt-4 text-lg font-semibold text-[var(--color-text-primary)]">Pro Feature</h2>
						<p class="mt-2 text-sm text-[var(--color-text-secondary)]">
							Progress reports are available on <strong>Pro</strong> and <strong>Enterprise</strong> plans.
						</p>
						<div class="mt-4">
							<Button variant="gradient" href="/pricing">Upgrade to Pro</Button>
						</div>
					</div>
				</Card>
		{/if}
		{/if}

		<!-- ═══ Emails Tab ═══ -->
		{#if tab === 'emails'}
			<EmailTab studentId={$page.params.studentId} />
		{/if}

		<!-- ═══ Prepless AI Tab ═══ -->
		{#if tab === 'prepless-ai'}
			<PreplessChat studentId={s.id} planId={selectedPlanId ?? undefined} />
		{/if}

		<!-- ═══ Settings Tab ═══ -->
		{#if tab === 'settings'}
			<div class="max-w-2xl rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6">
				<h2 class="mb-6 text-lg font-semibold text-[var(--color-text-primary)]">
					Edit {s.name}'s Profile
				</h2>
				<StudentForm editStudent={s} onsave={() => (settingsSaved = true)} />
			</div>
		{/if}
	</div>

	<!-- Floating Edit Pencil → Prepless AI -->
	{#if tab !== 'prepless-ai' && tab !== 'settings'}
		<button
			onclick={() => setTab('prepless-ai')}
			class="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-success)] text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl active:scale-95"
			aria-label="Edit plan with Prepless AI"
			title="Edit plan with Prepless AI"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="22"
				height="22"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
			</svg>
		</button>
	{/if}
{/if}
