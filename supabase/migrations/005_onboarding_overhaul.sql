-- ═══════════════════════════════════════
-- Onboarding Overhaul — Duration, Homework, Diagnostic Data
-- ═══════════════════════════════════════

-- ── Students: new optional fields ──
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS diagnostic_data TEXT,
  ADD COLUMN IF NOT EXISTS extra_info TEXT;

-- ── Weekly Plans: duration replaces required dates ──
ALTER TABLE public.weekly_plans
  ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT '3 months';

ALTER TABLE public.weekly_plans
  ALTER COLUMN start_date DROP NOT NULL,
  ALTER COLUMN end_date DROP NOT NULL;

-- ── Plan Weeks: dates become optional (week-number-only display) ──
ALTER TABLE public.plan_weeks
  ALTER COLUMN week_start DROP NOT NULL,
  ALTER COLUMN week_end DROP NOT NULL;

-- ── New: Weekly Homework Items ──
CREATE TABLE IF NOT EXISTS public.plan_week_homework (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID NOT NULL REFERENCES public.plan_weeks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plan_week_homework ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutors can manage own week homework" ON public.plan_week_homework
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.plan_weeks
      JOIN public.weekly_plans ON weekly_plans.id = plan_weeks.plan_id
      WHERE plan_weeks.id = plan_week_homework.week_id
      AND weekly_plans.tutor_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_plan_week_homework_week ON public.plan_week_homework(week_id);

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
