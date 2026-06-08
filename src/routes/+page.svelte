<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import { scrollReveal } from '$lib/actions/scrollReveal.svelte';

	const testimonials = [
		{
			quote:
				'Prepless AI saves me 5+ hours every week. The AI plans are surprisingly good, and I can tweak anything in seconds.',
			name: 'Sarah M.',
			role: 'Math Tutor, 6 years',
			color: 'var(--color-primary-100)'
		},
		{
			quote:
				'My students love having a clear schedule. The day plans with time blocks make sessions so much more productive.',
			name: 'James K.',
			role: 'Science Tutor, 3 years',
			color: 'var(--color-accent-100)'
		},
		{
			quote:
				'The resource suggestions are a game-changer. No more hunting for practice problems — it just finds them.',
			name: 'Priya R.',
			role: 'SAT Prep Coach',
			color: 'var(--color-success-bg)'
		},
		{
			quote:
				'I was spending hours every Sunday planning. Now I generate a full plan in under 5 minutes and my weekends are mine again.',
			name: 'David L.',
			role: 'English Tutor, 8 years',
			color: 'var(--color-accent-100)'
		},
		{
			quote:
				'The AI somehow gets what my students need before I do. It catches gaps I would have missed.',
			name: 'Maria G.',
			role: 'Physics & Calc Tutor',
			color: 'var(--color-primary-100)'
		},
		{
			quote:
				'My tutoring business grew 3x since using Prepless AI. The professionalism of the plans impresses parents.',
			name: 'Kenji T.',
			role: 'Test Prep Coach, 5 years',
			color: 'var(--color-success-bg)'
		}
	];

	// Duplicate for seamless infinite scroll
	const marqueeItems = [...testimonials, ...testimonials];
</script>

<svelte:head><title>Prepless AI — AI-Powered Tutoring Schedules</title></svelte:head>

<!-- ═══════════════ HERO ═══════════════ -->
<section class="relative overflow-hidden pt-8 pb-20 md:pt-16 md:pb-32">
	<!-- Decorative blobs -->
	<div
		class="absolute -top-40 -right-40 h-[500px] w-[500px] animate-float rounded-full bg-[var(--color-primary-100)]/40 blur-3xl"
	></div>
	<div
		class="absolute top-1/3 -left-20 h-[300px] w-[300px] rounded-full bg-[var(--color-accent-100)]/30 blur-3xl"
		style="animation: float 4s ease-in-out 1s infinite"
	></div>
	<div
		class="absolute right-1/4 bottom-0 h-[200px] w-[200px] rounded-full bg-[var(--color-primary-50)]/60 blur-2xl"
		style="animation: float 5s ease-in-out 2s infinite"
	></div>

	<div class="relative container-page">
		<div class="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
			<!-- Left: Text -->
			<div class="max-w-xl animate-fade-in-left">
				<div
					class="shadow-clay-sm mb-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-100)] px-4 py-1.5 text-sm font-medium text-[var(--color-primary-700)]"
				>
					<span class="relative flex h-2 w-2">
						<span
							class="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent-500)] opacity-75"
						></span>
						<span class="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-accent-500)]"
						></span>
					</span>
					AI-powered scheduling for tutors
				</div>

				<h1
					class="font-[family-name:var(--font-heading)] text-4xl leading-[1.08] font-bold tracking-tight text-[var(--color-text-primary)] sm:text-5xl md:text-6xl lg:text-7xl"
				>
					Tutoring plans that
					<span class="relative inline-block">
						<span
							class="bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-accent-500)] bg-clip-text text-transparent"
							>write themselves</span
						>
						<svg class="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none"
							><path
								d="M0 4 Q100 0 200 4"
								stroke="var(--color-accent-400)"
								stroke-width="3"
								stroke-linecap="round"
								opacity="0.6"
							/></svg
						>
					</span>
				</h1>

				<p
					class="mt-6 max-w-lg text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl"
				>
					AI generates personalized weekly schedules, detailed day plans, and curated resources. You
					stay in control — adjust, edit, perfect.
				</p>

				<!-- Trust indicators -->
				<div class="mt-8 flex items-center gap-6">
					<div class="flex -space-x-2">
						{#each ['#A18072', '#D4C5BC', '#E8924E', '#7CA37C'] as color}
							<div
								class="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[var(--color-surface)] text-[10px] font-bold text-white"
								style="background:{color}"
							>
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
									/></svg
								>
							</div>
						{/each}
					</div>
					<div>
						<div class="flex items-center gap-1 text-[var(--color-warning)]">
							{#each Array(5) as _}
								<svg class="h-4 w-4 fill-current" viewBox="0 0 20 20"
									><path
										d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
									/></svg
								>
							{/each}
							<span class="ml-1 text-sm font-medium text-[var(--color-text-secondary)]">4.9</span>
						</div>
						<p class="text-xs text-[var(--color-text-tertiary)]">from 200+ tutors</p>
					</div>
				</div>

				<div class="mt-8 flex flex-col gap-4 sm:flex-row">
					<Button variant="gradient" size="xl" href="/auth/register">Get started free</Button>
					<Button variant="outline" size="xl" href="/pricing">See plans & pricing</Button>
				</div>
			</div>

			<!-- Right: Visual card stack -->
			<div class="animate-fade-in-right relative hidden lg:block">
				<!-- Floating card stack -->
				<div class="relative mx-auto max-w-sm">
					<!-- Back card -->
					<div
						class="absolute -top-4 right-4 left-4 h-64 -rotate-3 clay-card rounded-3xl opacity-50"
						style="background:var(--color-primary-100)"
					></div>
					<!-- Middle card -->
					<div
						class="absolute -top-2 right-2 left-2 h-64 rotate-1 clay-card rounded-3xl opacity-75"
						style="background:var(--color-surface-elevated)"
					></div>
					<!-- Front card -->
					<div class="relative clay-card rounded-3xl p-6">
						<div class="mb-5 flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary-400)] to-[var(--color-accent-400)]"
							>
								<svg
									class="h-5 w-5 text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
									/></svg
								>
							</div>
							<div>
								<h4 class="text-sm font-semibold text-[var(--color-text-primary)]">
									Algebra Foundations
								</h4>
								<p class="text-xs text-[var(--color-text-tertiary)]">Week 1 of 8</p>
							</div>
						</div>
						<div class="space-y-2.5">
							<div class="h-3 w-full rounded-full bg-[var(--color-surface-tertiary)]"></div>
							<div class="h-3 w-3/4 rounded-full bg-[var(--color-surface-tertiary)]"></div>
							<div class="h-3 w-1/2 rounded-full bg-[var(--color-primary-100)]"></div>
						</div>
						<div class="mt-5 grid grid-cols-3 gap-2">
							{#each [1, 2, 3] as _}
								<div
									class="h-16 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)]"
								></div>
							{/each}
						</div>
					</div>
				</div>

				<!-- Floating badges -->
				<div
					class="absolute -bottom-4 -left-6 animate-breathe animate-float"
					style="animation-delay:0.5s"
				>
					<div class="flex items-center gap-2 clay-card rounded-xl px-3 py-2 text-xs font-medium">
						<span class="h-2 w-2 animate-pulse-soft rounded-full bg-[var(--color-success)]"></span>
						<span class="text-[var(--color-text-secondary)]">Plan generated</span>
					</div>
				</div>
				<div
					class="absolute -top-2 -right-4 animate-breathe animate-float"
					style="animation-delay:1.5s"
				>
					<div class="flex items-center gap-2 clay-card rounded-xl px-3 py-2 text-xs font-medium">
						<svg
							class="h-3.5 w-3.5 animate-pulse-soft text-[var(--color-accent-500)]"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 10V3L4 14h7v7l9-11h-7z"
							/></svg
						>
						<span class="text-[var(--color-text-secondary)]">AI powered</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- ═══════════════ STATS BANNER ═══════════════ -->
<section class="border-y-2 border-[var(--color-border)] bg-[var(--color-surface-secondary)] py-12">
	<div class="container-page">
		<div class="grid stagger-children grid-cols-2 gap-8 text-center md:grid-cols-4">
			{#each [{ value: '500+', label: 'Tutors' }, { value: '15k+', label: 'Plans Generated' }, { value: '8+', label: 'Resource Sites' }, { value: '97%', label: 'Satisfaction' }] as stat}
				<div use:scrollReveal>
					<div
						class="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-text-primary)] md:text-4xl"
					>
						{stat.value}
					</div>
					<div class="mt-1 text-sm text-[var(--color-text-secondary)]">{stat.label}</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ═══════════════ HOW IT WORKS ═══════════════ -->
<section class="bg-[var(--color-surface)] py-20 md:py-28">
	<div class="container-page">
		<div class="mb-16 text-center" use:scrollReveal>
			<h2
				class="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-text-primary)] md:text-5xl"
			>
				Three steps to your first plan
			</h2>
			<p class="mx-auto mt-4 max-w-xl text-lg text-[var(--color-text-secondary)]">
				From student profile to AI-generated schedule in minutes.
			</p>
		</div>

		<div class="relative mx-auto max-w-4xl">
			<!-- Connecting line (desktop) -->
			<div class="absolute top-12 right-[16.67%] left-[16.67%] hidden h-0.5 md:block">
				<div
					class="h-full rounded-full bg-gradient-to-r from-[var(--color-primary-300)] via-[var(--color-accent-400)] to-[var(--color-primary-300)]"
					style="mask-image:linear-gradient(to right, transparent, black 20%, black 80%, transparent)"
				></div>
			</div>

			<div class="relative grid gap-8 md:grid-cols-3">
				{#each [{ step: '01', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', title: 'Add Student', desc: 'Enter student grade, subjects, and learning style. One click setup.' }, { step: '02', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', title: 'Set Goals', desc: 'Pick dates, targets, and preferences. AI handles the rest.' }, { step: '03', icon: 'M13 10V3L4 14h7v7l9-11h-7z', title: 'Get Schedule', desc: 'AI generates a complete multi-week plan. Review, edit, done.' }] as item}
					<div
						class="relative flex flex-col items-center text-center"
						use:scrollReveal={{ delay: item.step === '01' ? 0 : item.step === '02' ? 0.1 : 0.2 }}
					>
						<div
							class="shadow-clay-md relative z-10 mb-6 flex h-24 w-24 animate-breathe-border items-center justify-center rounded-3xl border-2 border-[var(--color-border)] bg-[var(--color-surface-elevated)]"
						>
							<svg
								class="h-10 w-10 text-[var(--color-primary-500)]"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="1.5"
									d={item.icon}
								/></svg
							>
							<span
								class="shadow-clay-sm absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-accent-500)] text-xs font-bold text-white"
								>{item.step}</span
							>
						</div>
						<h3
							class="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-text-primary)]"
						>
							{item.title}
						</h3>
						<p class="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
							{item.desc}
						</p>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>

<!-- ═══════════════ FEATURES (ZIGZAG) ═══════════════ -->
<section id="features" class="bg-[var(--color-surface-secondary)] py-20 md:py-28">
	<div class="container-page">
		<div class="mb-16 text-center" use:scrollReveal>
			<h2
				class="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-text-primary)] md:text-5xl"
			>
				Everything a tutor needs
			</h2>
			<p class="mx-auto mt-4 max-w-xl text-lg text-[var(--color-text-secondary)]">
				Powerful features wrapped in a simple, beautiful interface.
			</p>
		</div>

		<div class="space-y-16 md:space-y-24">
			{#each [{ icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', title: 'Weekly Plans', desc: "Multi-week schedules with themes, focus areas, and daily breakdowns. AI adapts to each student's pace.", color: 'primary' }, { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Day Plans', desc: 'Time-blocked sessions with review, homework help, learning, and practice sections. Energy-aware scheduling.', color: 'accent' }, { icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9', title: 'Smart Resources', desc: 'Auto-suggest videos, articles, and practice from Khan Academy, IXL, W3Schools, and more — filtered by topic.', color: 'sage' }, { icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', title: 'Adjust & Edit', desc: 'Change dates, subjects, or goals and AI regenerates. Or manually edit any detail. Flexibility built in.', color: 'accent' }] as feature, i}
				<div
					class="grid items-center gap-10 md:grid-cols-2 lg:gap-16 {i % 2 === 1
						? 'md:grid-flow-dense'
						: ''}"
				>
					<!-- Visual -->
					<div
						class={i % 2 === 1 ? 'md:col-start-2' : ''}
						use:scrollReveal={{ direction: i % 2 === 1 ? 'fade-left' : 'fade-up', delay: 0.05 }}
					>
						<div class="relative">
							<div
								class="shadow-clay-lg flex h-60 items-center justify-center overflow-hidden rounded-3xl border-2 border-[var(--color-border)] bg-[var(--color-surface-elevated)] md:h-72"
							>
								<div
									class="h-20 w-20 rounded-2xl {feature.color === 'primary'
										? 'bg-[var(--color-primary-100)]'
										: feature.color === 'accent'
											? 'bg-[var(--color-accent-100)]'
											: 'bg-[var(--color-success-bg)]'} flex animate-breathe items-center justify-center"
									style="animation-delay:{i * 1.2}s"
								>
									<svg
										class="h-10 w-10 {feature.color === 'primary'
											? 'text-[var(--color-primary-500)]'
											: feature.color === 'accent'
												? 'text-[var(--color-accent-500)]'
												: 'text-[var(--color-success)]'}"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="1.5"
											d={feature.icon}
										/></svg
									>
								</div>
							</div>
							<!-- Decorative accent -->
							<div
								class="absolute top-4 -z-10 {i % 2 === 1
									? '-right-4'
									: '-left-4'} h-full w-full rounded-3xl bg-[var(--color-primary-100)]/40"
							></div>
						</div>
					</div>
					<!-- Text -->
					<div
						class={i % 2 === 1 ? 'md:col-start-1' : ''}
						use:scrollReveal={{ direction: i % 2 === 1 ? 'fade-left' : 'fade-up', delay: 0.15 }}
					>
						<div
							class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium {feature.color ===
							'primary'
								? 'bg-[var(--color-primary-100)] text-[var(--color-primary-700)]'
								: feature.color === 'accent'
									? 'bg-[var(--color-accent-100)] text-[var(--color-accent-700)]'
									: 'bg-[var(--color-success-bg)] text-[var(--color-success)]'} mb-4"
						>
							Feature {i + 1}
						</div>
						<h3
							class="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-text-primary)] md:text-3xl"
						>
							{feature.title}
						</h3>
						<p class="mt-4 text-lg leading-relaxed text-[var(--color-text-secondary)]">
							{feature.desc}
						</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ═══════════════ TESTIMONIALS — INFINITE HORIZONTAL SCROLL ═══════════════ -->
<section class="overflow-hidden bg-[var(--color-surface)] py-20 md:py-28">
	<div class="container-page mb-12">
		<div class="text-center" use:scrollReveal>
			<h2
				class="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-text-primary)] md:text-5xl"
			>
				Loved by tutors
			</h2>
			<p class="mx-auto mt-4 max-w-xl text-lg text-[var(--color-text-secondary)]">
				See what tutors are saying about Prepless AI. Hover to pause.
			</p>
		</div>
	</div>

	<!-- Marquee track 1 — leftward -->
	<div class="group mb-6 marquee-track" style="--marquee-speed: 35s">
		{#each marqueeItems as testimonial, i}
			<div class="mx-3 w-[340px] shrink-0">
				<div class="relative h-full clay-card p-6">
					<svg
						class="mb-4 h-8 w-8 text-[var(--color-text-tertiary)]/30"
						fill="currentColor"
						viewBox="0 0 24 24"
						><path
							d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"
						/></svg
					>
					<p class="text-sm leading-relaxed text-[var(--color-text-secondary)] italic">
						"{testimonial.quote}"
					</p>
					<div class="mt-5 flex items-center gap-3 border-t border-[var(--color-border)] pt-4">
						<div
							class="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-[var(--color-text-primary)]"
							style="background:{testimonial.color}"
						>
							{testimonial.name[0]}
						</div>
						<div>
							<p class="text-sm font-semibold text-[var(--color-text-primary)]">
								{testimonial.name}
							</p>
							<p class="text-xs text-[var(--color-text-tertiary)]">{testimonial.role}</p>
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>
</section>

<!-- ═══════════════ FINAL CTA ═══════════════ -->
<section
	class="relative overflow-hidden bg-gradient-to-br from-[var(--color-primary-600)] via-[var(--color-primary-700)] to-[var(--color-accent-700)] py-24 md:py-32"
>
	<!-- Decorative circles -->
	<div class="absolute top-10 right-10 h-64 w-64 rounded-full bg-white/5 blur-2xl"></div>
	<div class="absolute bottom-10 left-10 h-48 w-48 rounded-full bg-white/5 blur-2xl"></div>

	<div class="relative container-page text-center">
		<div use:scrollReveal>
			<h2
				class="font-[family-name:var(--font-heading)] text-3xl leading-tight font-bold text-white md:text-5xl lg:text-6xl"
			>
				Start planning smarter today
			</h2>
			<p class="mx-auto mt-6 max-w-xl text-lg text-[var(--color-primary-100)] md:text-xl">
				Free to start. No credit card. Create your first AI-powered tutoring plan in less than 5
				minutes.
			</p>
			<div class="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
				<Button variant="secondary" size="xl" href="/auth/register">Get started free</Button>
				<span class="text-sm text-[var(--color-primary-200)]"
					>or <a
						href="/pricing"
						class="underline underline-offset-2 transition-colors hover:text-white">view pricing</a
					></span
				>
			</div>
		</div>
	</div>
</section>
