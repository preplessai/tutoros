<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
</script>

<svelte:head><title>TutorOS — AI-Powered Tutoring Schedules</title></svelte:head>

<!-- ═══════════════ HERO ═══════════════ -->
<section class="relative overflow-hidden pt-8 pb-20 md:pt-16 md:pb-32">
	<!-- Decorative blobs -->
	<div class="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-[var(--color-primary-100)]/40 blur-3xl animate-float"></div>
	<div class="absolute top-1/3 -left-20 w-[300px] h-[300px] rounded-full bg-[var(--color-accent-100)]/30 blur-3xl" style="animation: float 4s ease-in-out 1s infinite"></div>
	<div class="absolute bottom-0 right-1/4 w-[200px] h-[200px] rounded-full bg-[var(--color-primary-50)]/60 blur-2xl" style="animation: float 5s ease-in-out 2s infinite"></div>

	<div class="container-page relative">
		<div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
			<!-- Left: Text -->
			<div class="max-w-xl animate-fade-in-left">
				<div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-primary-100)] text-[var(--color-primary-700)] text-sm font-medium mb-6 shadow-clay-sm">
					<span class="relative flex h-2 w-2">
						<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent-500)] opacity-75"></span>
						<span class="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-accent-500)]"></span>
					</span>
					AI-powered scheduling for tutors
				</div>

				<h1 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-[var(--color-text-primary)] leading-[1.08] font-[family-name:var(--font-heading)]">
					Tutoring plans that
					<span class="relative inline-block">
						<span class="bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-accent-500)] bg-clip-text text-transparent">write themselves</span>
						<svg class="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none"><path d="M0 4 Q100 0 200 4" stroke="var(--color-accent-400)" stroke-width="3" stroke-linecap="round" opacity="0.6"/></svg>
					</span>
				</h1>

				<p class="mt-6 text-lg md:text-xl text-[var(--color-text-secondary)] leading-relaxed max-w-lg">
					AI generates personalized weekly schedules, detailed day plans, and curated resources. You stay in control — adjust, edit, perfect.
				</p>

				<!-- Trust indicators -->
				<div class="flex items-center gap-6 mt-8">
					<div class="flex -space-x-2">
						{[...Array(4)].map(() => '')}
						{#each ['#A18072','#D4C5BC','#E8924E','#7CA37C'] as color}
							<div class="h-9 w-9 rounded-full border-2 border-[var(--color-surface)] flex items-center justify-center text-[10px] font-bold text-white" style="background:{color}">
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
							</div>
						{/each}
					</div>
					<div>
						<div class="flex items-center gap-1 text-[var(--color-warning)]">
							{#each Array(5) as _}
								<svg class="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
							{/each}
							<span class="text-sm font-medium text-[var(--color-text-secondary)] ml-1">4.9</span>
						</div>
						<p class="text-xs text-[var(--color-text-tertiary)]">from 200+ tutors</p>
					</div>
				</div>

				<div class="mt-8 flex flex-col sm:flex-row gap-4">
					<Button variant="gradient" size="xl" href="/auth/register">Get started free</Button>
					<Button variant="outline" size="xl" href="/pricing">See plans & pricing</Button>
				</div>
			</div>

			<!-- Right: Visual card stack -->
			<div class="hidden lg:block relative animate-fade-in-right">
				<!-- Floating card stack -->
				<div class="relative mx-auto max-w-sm">
					<!-- Back card -->
					<div class="clay-card absolute -top-4 left-4 right-4 h-64 rounded-3xl opacity-50 -rotate-3" style="background:var(--color-primary-100)"></div>
					<!-- Middle card -->
					<div class="clay-card absolute -top-2 left-2 right-2 h-64 rounded-3xl opacity-75 rotate-1" style="background:var(--color-surface-elevated)"></div>
					<!-- Front card -->
					<div class="clay-card relative p-6 rounded-3xl">
						<div class="flex items-center gap-3 mb-5">
							<div class="h-10 w-10 rounded-xl bg-gradient-to-br from-[var(--color-primary-400)] to-[var(--color-accent-400)] flex items-center justify-center">
								<svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
							</div>
							<div>
								<h4 class="text-sm font-semibold text-[var(--color-text-primary)]">Algebra Foundations</h4>
								<p class="text-xs text-[var(--color-text-tertiary)]">Week 1 of 8</p>
							</div>
						</div>
						<div class="space-y-2.5">
							<div class="h-3 bg-[var(--color-surface-tertiary)] rounded-full w-full"></div>
							<div class="h-3 bg-[var(--color-surface-tertiary)] rounded-full w-3/4"></div>
							<div class="h-3 bg-[var(--color-primary-100)] rounded-full w-1/2"></div>
						</div>
						<div class="grid grid-cols-3 gap-2 mt-5">
							{#each [1,2,3] as _}
								<div class="h-16 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)]"></div>
							{/each}
						</div>
					</div>
				</div>

				<!-- Floating badges -->
				<div class="absolute -bottom-4 -left-6 animate-float" style="animation-delay:0.5s">
					<div class="clay-card px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-medium">
						<span class="h-2 w-2 rounded-full bg-[var(--color-success)]"></span>
						<span class="text-[var(--color-text-secondary)]">Plan generated</span>
					</div>
				</div>
				<div class="absolute -top-2 -right-4 animate-float" style="animation-delay:1.5s">
					<div class="clay-card px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-medium">
						<svg class="h-3.5 w-3.5 text-[var(--color-accent-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
						<span class="text-[var(--color-text-secondary)]">AI powered</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- ═══════════════ STATS BANNER ═══════════════ -->
<section class="py-12 bg-[var(--color-surface-secondary)] border-y-2 border-[var(--color-border)]">
	<div class="container-page">
		<div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center stagger-children">
			{#each [
				{ value: '500+', label: 'Tutors' },
				{ value: '15k+', label: 'Plans Generated' },
				{ value: '8+', label: 'Resource Sites' },
				{ value: '97%', label: 'Satisfaction' }
			] as stat}
				<div>
					<div class="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] font-[family-name:var(--font-heading)]">{stat.value}</div>
					<div class="text-sm text-[var(--color-text-secondary)] mt-1">{stat.label}</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ═══════════════ HOW IT WORKS ═══════════════ -->
<section class="py-20 md:py-28 bg-[var(--color-surface)]">
	<div class="container-page">
		<div class="text-center mb-16 animate-fade-in-up">
			<h2 class="text-3xl md:text-5xl font-bold text-[var(--color-text-primary)] font-[family-name:var(--font-heading)]">Three steps to your first plan</h2>
			<p class="mt-4 text-lg text-[var(--color-text-secondary)] max-w-xl mx-auto">From student profile to AI-generated schedule in minutes.</p>
		</div>

		<div class="relative max-w-4xl mx-auto">
			<!-- Connecting line (desktop) -->
			<div class="hidden md:block absolute top-12 left-[16.67%] right-[16.67%] h-0.5">
				<div class="h-full bg-gradient-to-r from-[var(--color-primary-300)] via-[var(--color-accent-400)] to-[var(--color-primary-300)] rounded-full" style="mask-image:linear-gradient(to right, transparent, black 20%, black 80%, transparent)"></div>
			</div>

			<div class="grid md:grid-cols-3 gap-8 relative stagger-children">
				{#each [
					{ step: '01', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', title: 'Add Student', desc: 'Enter student grade, subjects, and learning style. One click setup.' },
					{ step: '02', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', title: 'Set Goals', desc: 'Pick dates, targets, and preferences. AI handles the rest.' },
					{ step: '03', icon: 'M13 10V3L4 14h7v7l9-11h-7z', title: 'Get Schedule', desc: 'AI generates a complete multi-week plan. Review, edit, done.' }
				] as item}
					<div class="relative flex flex-col items-center text-center">
						<div class="relative z-10 h-24 w-24 rounded-3xl bg-[var(--color-surface-elevated)] shadow-clay-md border-2 border-[var(--color-border)] flex items-center justify-center mb-6">
							<svg class="h-10 w-10 text-[var(--color-primary-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={item.icon}/></svg>
							<span class="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-[var(--color-accent-500)] text-white text-xs font-bold flex items-center justify-center shadow-clay-sm">{item.step}</span>
						</div>
						<h3 class="text-lg font-semibold text-[var(--color-text-primary)] font-[family-name:var(--font-heading)]">{item.title}</h3>
						<p class="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">{item.desc}</p>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>

<!-- ═══════════════ FEATURES (ZIGZAG) ═══════════════ -->
<section id="features" class="py-20 md:py-28 bg-[var(--color-surface-secondary)]">
	<div class="container-page">
		<div class="text-center mb-16 animate-fade-in-up">
			<h2 class="text-3xl md:text-5xl font-bold text-[var(--color-text-primary)] font-[family-name:var(--font-heading)]">Everything a tutor needs</h2>
			<p class="mt-4 text-lg text-[var(--color-text-secondary)] max-w-xl mx-auto">Powerful features wrapped in a simple, beautiful interface.</p>
		</div>

		<div class="space-y-16 md:space-y-24">
			{#each [
				{ icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', title: 'Weekly Plans', desc: 'Multi-week schedules with themes, focus areas, and daily breakdowns. AI adapts to each student\'s pace.', color: 'primary' },
				{ icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Day Plans', desc: 'Time-blocked sessions with review, homework help, learning, and practice sections. Energy-aware scheduling.', color: 'accent' },
				{ icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9', title: 'Smart Resources', desc: 'Auto-suggest videos, articles, and practice from Khan Academy, IXL, W3Schools, and more — filtered by topic.', color: 'sage' },
				{ icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', title: 'Adjust & Edit', desc: 'Change dates, subjects, or goals and AI regenerates. Or manually edit any detail. Flexibility built in.', color: 'accent' }
			] as feature, i}
				<div class="grid md:grid-cols-2 gap-10 lg:gap-16 items-center {i % 2 === 1 ? 'md:grid-flow-dense' : ''}">
					<!-- Visual -->
					<div class={`${i % 2 === 1 ? 'md:col-start-2' : ''}`}>
						<div class="relative">
							<div class="h-60 md:h-72 rounded-3xl bg-[var(--color-surface-elevated)] shadow-clay-lg border-2 border-[var(--color-border)] flex items-center justify-center overflow-hidden">
								<div class="h-20 w-20 rounded-2xl {feature.color === 'primary' ? 'bg-[var(--color-primary-100)]' : feature.color === 'accent' ? 'bg-[var(--color-accent-100)]' : 'bg-[var(--color-success-bg)]'} flex items-center justify-center">
									<svg class="h-10 w-10 {feature.color === 'primary' ? 'text-[var(--color-primary-500)]' : feature.color === 'accent' ? 'text-[var(--color-accent-500)]' : 'text-[var(--color-success)]'}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={feature.icon}/></svg>
								</div>
							</div>
							<!-- Decorative accent -->
							<div class="absolute -z-10 top-4 {i % 2 === 1 ? '-right-4' : '-left-4'} w-full h-full rounded-3xl bg-[var(--color-primary-100)]/40"></div>
						</div>
					</div>
					<!-- Text -->
					<div class={i % 2 === 1 ? 'md:col-start-1' : ''}>
						<div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium {feature.color === 'primary' ? 'bg-[var(--color-primary-100)] text-[var(--color-primary-700)]' : feature.color === 'accent' ? 'bg-[var(--color-accent-100)] text-[var(--color-accent-700)]' : 'bg-[var(--color-success-bg)] text-[var(--color-success)]'} mb-4">
							Feature {i + 1}
						</div>
						<h3 class="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] font-[family-name:var(--font-heading)]">{feature.title}</h3>
						<p class="mt-4 text-lg text-[var(--color-text-secondary)] leading-relaxed">{feature.desc}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ═══════════════ TESTIMONIALS ═══════════════ -->
<section class="py-20 md:py-28 bg-[var(--color-surface)]">
	<div class="container-page">
		<div class="text-center mb-16 animate-fade-in-up">
			<h2 class="text-3xl md:text-5xl font-bold text-[var(--color-text-primary)] font-[family-name:var(--font-heading)]">Loved by tutors</h2>
			<p class="mt-4 text-lg text-[var(--color-text-secondary)] max-w-xl mx-auto">See what tutors are saying about TutorOS.</p>
		</div>

		<div class="grid md:grid-cols-3 gap-8 stagger-children">
			{#each [
				{ quote: 'TutorOS saves me 5+ hours every week. The AI plans are surprisingly good, and I can tweak anything in seconds.', name: 'Sarah M.', role: 'Math Tutor, 6 years', color: 'var(--color-primary-100)' },
				{ quote: 'My students love having a clear schedule. The day plans with time blocks make sessions so much more productive.', name: 'James K.', role: 'Science Tutor, 3 years', color: 'var(--color-accent-100)' },
				{ quote: 'The resource suggestions are a game-changer. No more hunting for practice problems — it just finds them.', name: 'Priya R.', role: 'SAT Prep Coach', color: 'var(--color-success-bg)' }
			] as testimonial}
				<div class="clay-card p-6 relative">
					<!-- Quote mark -->
					<svg class="h-8 w-8 text-[var(--color-text-tertiary)]/30 mb-4" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
					<p class="text-sm text-[var(--color-text-secondary)] leading-relaxed italic">"{testimonial.quote}"</p>
					<div class="flex items-center gap-3 mt-5 pt-4 border-t border-[var(--color-border)]">
						<div class="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-[var(--color-text-primary)]" style="background:{testimonial.color}">
							{testimonial.name[0]}
						</div>
						<div>
							<p class="text-sm font-semibold text-[var(--color-text-primary)]">{testimonial.name}</p>
							<p class="text-xs text-[var(--color-text-tertiary)]">{testimonial.role}</p>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ═══════════════ FINAL CTA ═══════════════ -->
<section class="relative overflow-hidden py-24 md:py-32 bg-gradient-to-br from-[var(--color-primary-600)] via-[var(--color-primary-700)] to-[var(--color-accent-700)]">
	<!-- Decorative circles -->
	<div class="absolute top-10 right-10 w-64 h-64 rounded-full bg-white/5 blur-2xl"></div>
	<div class="absolute bottom-10 left-10 w-48 h-48 rounded-full bg-white/5 blur-2xl"></div>

	<div class="container-page relative text-center">
		<h2 class="text-3xl md:text-5xl lg:text-6xl font-bold text-white font-[family-name:var(--font-heading)] leading-tight">
			Start planning smarter today
		</h2>
		<p class="mt-6 text-lg md:text-xl text-[var(--color-primary-100)] max-w-xl mx-auto">
			Free to start. No credit card. Create your first AI-powered tutoring plan in less than 5 minutes.
		</p>
		<div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
			<Button variant="secondary" size="xl" href="/auth/register">Get started free</Button>
			<span class="text-sm text-[var(--color-primary-200)]">or <a href="/pricing" class="underline underline-offset-2 hover:text-white transition-colors">view pricing</a></span>
		</div>
	</div>
</section>
