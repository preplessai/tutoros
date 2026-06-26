<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { canUseFeature } from '$lib/lib/constants';
	import { supabase } from '$lib/lib/supabase';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Select from '$lib/components/ui/Select.svelte';

	const tier = $derived(auth.profile?.subscription_tier || 'free');
	const canViewProgress = $derived(canUseFeature(tier, 'progress_reports'));
	const isEnterprise = $derived(tier === 'enterprise');
	const authReady = $derived(!auth.loading);

	interface Student {
		id: string;
		name: string;
		grade: string | null;
	}

	interface DayWithTasks {
		id: string;
		date: string;
		day_of_week: string;
		energy_level: string | null;
		struggle_areas: string[] | null;
		week_id: string;
		plan_tasks: Array<{
			id: string;
			completed: boolean;
			duration_minutes: number;
		}>;
	}

	interface WeekInfo {
		id: string;
		week_number: number;
	}

	interface StudentProgress {
		student: Student;
		totalTasks: number;
		completedTasks: number;
		completionRate: number;
		totalDays: number;
		totalMinutes: number;
		struggleAreas: string[];
		weeks: Array<{
			weekNumber: number;
			totalTasks: number;
			completedTasks: number;
			completionRate: number;
		}>;
	}

	let students = $state<Student[]>([]);
	let selectedStudentId = $state<string>('');
	let compareAll = $state(false);
	let loading = $state(true);
	let progressLoading = $state(false);
	let progress = $state<StudentProgress[]>([]);
	let initialLoadDone = $state(false);

	onMount(async () => {
		if (!canViewProgress) {
			loading = false;
			return;
		}

		const { data } = await supabase
			.from('students')
			.select('id, name, grade')
			.eq('tutor_id', auth.user?.id)
			.order('name');

		students = (data || []) as Student[];
		loading = false;

		if (students.length > 0) {
			selectedStudentId = students[0].id;
		}
		initialLoadDone = true;
	});

	$effect(() => {
		if (initialLoadDone && (selectedStudentId || compareAll)) {
			void selectedStudentId;
			void compareAll;
			fetchProgress();
		}
	});

	async function fetchProgress() {
		progressLoading = true;

		const idsToFetch = compareAll
			? students.map((s) => s.id)
			: selectedStudentId
				? [selectedStudentId]
				: [];

		const results: StudentProgress[] = [];

		for (const studentId of idsToFetch) {
			const student = students.find((s) => s.id === studentId);
			if (!student) continue;

			const { data: plans } = await supabase
				.from('weekly_plans')
				.select('id')
				.eq('student_id', studentId);

			const planIds = (plans || []).map((p) => p.id);
			if (planIds.length === 0) {
				results.push({
					student,
					totalTasks: 0,
					completedTasks: 0,
					completionRate: 0,
					totalDays: 0,
					totalMinutes: 0,
					struggleAreas: [],
					weeks: []
				});
				continue;
			}

			const { data: weeks } = await supabase
				.from('plan_weeks')
				.select('id, week_number')
				.in('plan_id', planIds)
				.order('week_number');

			const weeksData = (weeks || []) as WeekInfo[];
			const weekIds = weeksData.map((w) => w.id);

			const { data: days } = await supabase
				.from('plan_days')
				.select(
					'id, date, day_of_week, energy_level, struggle_areas, week_id, plan_tasks(id, completed, duration_minutes)'
				)
				.in('week_id', weekIds)
				.order('date');

			const daysData = (days || []) as unknown as DayWithTasks[];

			let totalTasks = 0;
			let completedTasks = 0;
			let totalMinutes = 0;
			const struggleSet = new Set<string>();

			const weekMap = new Map<string, { total: number; completed: number }>();
			for (const week of weeksData) {
				weekMap.set(week.id, { total: 0, completed: 0 });
			}

			for (const day of daysData) {
				if (day.struggle_areas) {
					for (const area of day.struggle_areas) {
						struggleSet.add(area);
					}
				}

				const weekStats = weekMap.get(day.week_id);
				for (const task of day.plan_tasks || []) {
					totalTasks++;
					totalMinutes += task.duration_minutes;
					if (task.completed) completedTasks++;
					if (weekStats) {
						weekStats.total++;
						if (task.completed) weekStats.completed++;
					}
				}
			}

			const weeklyBreakdown = weeksData.map((w) => {
				const stats = weekMap.get(w.id) || { total: 0, completed: 0 };
				return {
					weekNumber: w.week_number,
					totalTasks: stats.total,
					completedTasks: stats.completed,
					completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
				};
			});

			results.push({
				student,
				totalTasks,
				completedTasks,
				completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
				totalDays: daysData.length,
				totalMinutes,
				struggleAreas: Array.from(struggleSet).sort(),
				weeks: weeklyBreakdown
			});
		}

		progress = results;
		progressLoading = false;
	}
</script>

<svelte:head><title>Progress — Prepless AI</title></svelte:head>

<div class="max-w-5xl space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-[var(--color-text-primary)]">Progress Reports</h1>
		<p class="mt-1 text-sm text-[var(--color-text-secondary)]">
			Track student completion, struggle areas, and weekly progress.
		</p>
	</div>

	{#if !authReady}
		<div class="flex justify-center py-12"><Spinner size="lg" /></div>
	{:else if !canViewProgress}
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
					Progress reports are available on the <strong>Pro</strong> and <strong>Enterprise</strong> plans.
				</p>
				<div class="mt-4">
					<Button variant="gradient" href="/pricing">Upgrade to Pro</Button>
				</div>
			</div>
		</Card>
	{:else if loading}
		<div class="flex justify-center py-12"><Spinner size="lg" /></div>
	{:else if students.length === 0}
		<EmptyState
			icon="users"
			title="No students yet"
			description="Add a student to start tracking progress."
			action={{ label: 'Add Student', href: '/dashboard/students/new' }}
		/>
	{:else}
		<!-- Controls -->
		<div class="flex flex-wrap items-end gap-4">
			<div class="min-w-[200px]">
				<Select
					label="Student"
					name="student"
					options={students.map((s) => ({ value: s.id, label: s.name }))}
					value={selectedStudentId}
					onchange={(e) => {
						selectedStudentId = (e.target as HTMLSelectElement).value;
						compareAll = false;
					}}
					disabled={compareAll}
				/>
			</div>
			{#if isEnterprise}
				<label
					class="flex cursor-pointer items-center gap-2 pb-1 text-sm text-[var(--color-text-secondary)]"
				>
					<input type="checkbox" bind:checked={compareAll} class="h-4 w-4 rounded" />
					Compare all students
				</label>
			{/if}
		</div>

		{#if progressLoading}
			<div class="flex justify-center py-8"><Spinner size="md" /></div>
		{:else}
			<div
				class="grid gap-6 {compareAll ? 'lg:grid-cols-2' : ''}"
				style={compareAll && progress.length > 2
					? 'grid-template-columns: repeat(auto-fit, minmax(320px, 1fr))'
					: ''}
			>
				{#each progress as sp}
					<div class="space-y-4">
						{#if compareAll && progress.length > 1}
							<h2 class="text-lg font-semibold text-[var(--color-text-primary)]">
								{sp.student.name}
							</h2>
						{/if}

						<!-- Summary cards -->
						<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
							<Card padding={false}>
								<div class="p-4 text-center">
									<div class="text-2xl font-bold text-[var(--color-text-primary)]">
										{sp.completionRate}%
									</div>
									<div class="mt-1 text-xs text-[var(--color-text-secondary)]">Completion</div>
									<div class="mt-2 h-1.5 w-full rounded-full bg-[var(--color-surface-tertiary)]">
										<div
											class="h-1.5 rounded-full transition-all {sp.completionRate >= 80
												? 'bg-[var(--color-success)]'
												: sp.completionRate >= 50
													? 'bg-[var(--color-warning)]'
													: 'bg-[var(--color-error)]'}"
											style="width: {sp.completionRate}%"
										></div>
									</div>
								</div>
							</Card>

							<Card padding={false}>
								<div class="p-4 text-center">
									<div class="text-2xl font-bold text-[var(--color-text-primary)]">
										{sp.completedTasks}<span
											class="text-sm font-normal text-[var(--color-text-tertiary)]"
											>/{sp.totalTasks}</span
										>
									</div>
									<div class="mt-1 text-xs text-[var(--color-text-secondary)]">Tasks done</div>
								</div>
							</Card>

							<Card padding={false}>
								<div class="p-4 text-center">
									<div class="text-2xl font-bold text-[var(--color-text-primary)]">
										{sp.totalDays}
									</div>
									<div class="mt-1 text-xs text-[var(--color-text-secondary)]">Days planned</div>
								</div>
							</Card>

							<Card padding={false}>
								<div class="p-4 text-center">
									<div class="text-2xl font-bold text-[var(--color-text-primary)]">
										{sp.totalMinutes}
									</div>
									<div class="mt-1 text-xs text-[var(--color-text-secondary)]">Minutes planned</div>
								</div>
							</Card>
						</div>

						<!-- Struggle areas -->
						{#if sp.struggleAreas.length > 0}
							<Card>
								<h3 class="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
									Struggle Areas
								</h3>
								<div class="flex flex-wrap gap-2">
									{#each sp.struggleAreas as area}
										<Badge variant="warning">{area}</Badge>
									{/each}
								</div>
							</Card>
						{/if}

						<!-- Weekly breakdown -->
						{#if sp.weeks.length > 0}
							<Card>
								<h3 class="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
									Weekly Breakdown
								</h3>
								<div class="overflow-x-auto">
									<table class="w-full text-sm">
										<thead>
											<tr
												class="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-tertiary)] uppercase"
											>
												<th class="px-3 py-2 font-medium">Week</th>
												<th class="px-3 py-2 font-medium">Tasks</th>
												<th class="px-3 py-2 font-medium">Done</th>
												<th class="px-3 py-2 font-medium">Rate</th>
											</tr>
										</thead>
										<tbody>
											{#each sp.weeks as week}
												<tr class="border-b border-[var(--color-border)] last:border-0">
													<td class="px-3 py-2.5 text-[var(--color-text-primary)]"
														>Week {week.weekNumber}</td
													>
													<td class="px-3 py-2.5 text-[var(--color-text-secondary)]"
														>{week.totalTasks}</td
													>
													<td class="px-3 py-2.5 text-[var(--color-text-secondary)]"
														>{week.completedTasks}</td
													>
													<td class="px-3 py-2.5">
														<div class="flex items-center gap-2">
															<div
																class="h-1.5 w-16 rounded-full bg-[var(--color-surface-tertiary)]"
															>
																<div
																	class="h-1.5 rounded-full {week.completionRate >= 80
																		? 'bg-[var(--color-success)]'
																		: week.completionRate >= 50
																			? 'bg-[var(--color-warning)]'
																			: 'bg-[var(--color-error)]'}"
																	style="width: {week.completionRate}%"
																></div>
															</div>
															<span class="text-xs text-[var(--color-text-secondary)]"
																>{week.completionRate}%</span
															>
														</div>
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							</Card>
						{:else}
							<Card>
								<div class="py-6 text-center text-sm text-[var(--color-text-secondary)]">
									No weeks generated yet. Create a plan to start tracking.
								</div>
							</Card>
						{/if}
					</div>
				{/each}
			</div>

			{#if progress.length === 0 && !progressLoading}
				<Card>
					<div class="py-6 text-center text-sm text-[var(--color-text-secondary)]">
						Select a student to view their progress.
					</div>
				</Card>
			{/if}
		{/if}
	{/if}
</div>
