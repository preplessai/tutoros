-- Add completed column to plan_days for session-level cross-out
ALTER TABLE public.plan_days
  ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT false;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
