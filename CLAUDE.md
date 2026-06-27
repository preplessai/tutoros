# CLAUDE.md

## Project overview

**Prepless AI** — AI-powered tutoring platform that generates personalized weekly schedules, day plans, and resource suggestions for tutors. Tutors add students, set goals, and the AI produces complete multi-week tutoring plans with time-blocked sessions.

## Tech stack

- **Frontend:** Svelte 5 (runes) + SvelteKit in SPA mode (`@sveltejs/adapter-static`, `ssr: false`)
- **Styling:** Tailwind CSS v4 via `@tailwindcss/vite`
- **Package manager:** Bun (`bun.lock`)
- **Backend:** Two Cloudflare Workers using Hono
  - `workers/api-worker` — AI generation endpoints (plans, day plans, resources, chat, emails)
  - `workers/stripe-worker` — Stripe checkout/portal/billing webhooks
- **Database:** Supabase (PostgreSQL) with Row-Level Security
- **Auth:** Supabase Auth (email/password, session persisted in localStorage)
- **AI providers:** Groq (primary, `llama-3.3-70b-versatile`) with DeepSeek (`deepseek-chat`) fallback on rate-limit

## Commands

```bash
bun dev           # Start dev server (http://localhost:5173)
bun run build     # Production build
bun run preview   # Preview production build
bun run check     # Type-check with svelte-check
bun run lint      # Prettier + ESLint
bun run format    # Prettier write
```

## Source structure

```
src/
  lib/
    components/
      auth/          LoginForm, RegisterForm, AuthCallback
      chat/          PreplessChat (AI chat with plan mutations), ChatMessage, ChangeConfirmation
      day-plans/     DayPlanGenerator, DayPlanView, TaskItem, TaskList, SectionLabel
      emails/        EmailTab (parent email generation)
      layout/        Navbar, Footer, Sidebar, DashboardLayout, AuthGuard
      plans/         PlanForm, PlanCard, WeekCard, PlanTimeline, AdjustPlanForm, WeekPopup, WeekHomework
      resources/     ResourceSearchForm, SearchResultCard, ResourceList, AiResourcePicker, ResourceItem
      students/      StudentForm, StudentCard, StudentList, StudentSettings
      subscription/  PricingGrid, ConfirmDialog, DowngradeBanner
      ui/            Button, Card, Modal, Input, Select, Textarea, Toggle, Tabs, DatePicker,
                     Badge, CreditBadge, Avatar, DropdownMenu, Spinner, Toast, ToastContainer,
                     EmptyState, ErrorDisplay
    stores/          Svelte 5 rune stores ($state-based reactive state)
      auth.svelte.ts, credits.svelte.ts, plan.svelte.ts, student.svelte.ts,
      resource.svelte.ts, dayPlan.svelte.ts, toast.svelte.ts
    lib/
      api.ts         API client — calls api-worker endpoints
      supabase.ts    Supabase client init (autoRefresh, persistSession)
      types.ts       All TypeScript interfaces (DB types, API request/response types)
      constants.ts   App constants
      date.ts        Date utilities
      export.ts      Export utilities
      stripe.ts      Stripe helper (checkout/portal redirects)
    actions/
      scrollReveal.svelte.ts   Svelte 5 action for scroll-triggered animations
  routes/
    +page.svelte              Landing page (hero, features, testimonials, CTA)
    +layout.svelte            Root layout (Navbar, Footer, ToastContainer, auth/theme init)
    layout.css                Global styles + CSS custom properties
    auth/          login, register, logout, callback
    dashboard/     +layout.ts (SPA mode, prerender), +page.svelte (dashboard home)
      plans/       new, [planId], [planId]/edit, [planId]/adjust
      students/    new, [studentId]
      day-plans/   [dayPlanId]
      resources/   search
      settings/    resources
      progress/
      settings/
    legal/         privacy, terms, disclaimer
    pricing/       +page.svelte
workers/
  api-worker/src/
    index.ts           Hono router with CORS + Supabase auth middleware
    lib/ai.ts          Groq/DeepSeek AI client with rate-limit handling
    lib/auth.ts        Supabase JWT verification
    lib/fetcher.ts     HTTP fetch wrapper
    lib/validate.ts    Zod validation schemas
    handlers/          generate-weekly-plan, adjust-plan, generate-day-plan,
                       search-resources, pick-resources, prepless-chat, generate-email
  stripe-worker/src/
    index.ts           Hono router with CORS + auth (webhook excluded)
    lib/stripe.ts      Stripe SDK init
    lib/auth.ts        Supabase JWT verification
    handlers/          create-checkout-session, create-portal-session, webhook
supabase/migrations/   9 migration files (001 through 009)
```

## Data model (core tables, all RLS-protected)

```
profiles (id, display_name, subscription_tier, ai_credits, stripe_*, ...)
  └── students (id, tutor_id, name, grade, subjects[], learning_style, preferred_resource_sites, ...)
       └── weekly_plans (id, student_id, title, grade, subjects[], duration, goals, status, ...)
            └── plan_weeks (id, plan_id, week_number, theme, focus_areas[], ...)
                 ├── plan_days (id, week_id, date, day_of_week, energy_level, ...)
                 │    └── plan_tasks (id, day_id, section, title, description, duration_minutes, ...)
                 │         └── resources (id, task_id, title, url, source, type, ...)
                 └── plan_week_homework (id, week_id, title, description, url, completed)
```

## Key patterns

- **SPA only:** The entire dashboard is client-rendered (`ssr: false`, `prerender: true`). API calls go through the Cloudflare Worker, not SvelteKit server routes.
- **Svelte 5 runes:** All stores use `$state` runes (reactive class instances with getters). No legacy Svelte stores.
- **Auth flow:** Supabase `onAuthStateChange` listener in `auth.svelte.ts`. Protected routes use `AuthGuard.svelte` wrapper. API calls attach Supabase JWT via `Authorization: Bearer` header.
- **AI credit system:** Each AI call costs credits. Credits are checked/enforced server-side in the API worker. Free tier gets 3 credits/month.
- **Stripe tiers:** free, starter, pro, enterprise — managed via stripe-worker webhooks syncing to Supabase `profiles` table.
- **Tailwind v4:** Uses CSS-first configuration (`@import "tailwindcss"`), no `tailwind.config.js`.
