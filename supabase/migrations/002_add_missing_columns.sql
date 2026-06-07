-- ═══════════════════════════════════════
-- Add missing columns to existing tables
-- ═══════════════════════════════════════

-- plan_weeks: add sort_order, ai_generated
ALTER TABLE public.plan_weeks
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN NOT NULL DEFAULT true;

-- plan_days: add sort_order, ai_generated
ALTER TABLE public.plan_days
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN NOT NULL DEFAULT true;

-- plan_tasks: add ai_generated
ALTER TABLE public.plan_tasks
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN NOT NULL DEFAULT true;

-- resources: add ai_generated
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN NOT NULL DEFAULT true;

-- profiles: add insert policy (missing from first run)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
