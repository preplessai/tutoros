-- ═══════════════════════════════════════
-- Stripe Subscriptions — Tiers, Purchases, Data Truncation
-- ═══════════════════════════════════════

-- ── Add subscription columns to profiles ──
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT,
  ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS downgraded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS data_truncation_date TIMESTAMPTZ;

-- Add CHECK constraint for subscription_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_subscription_status_check'
    AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_subscription_status_check
      CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'incomplete', 'trialing', 'unpaid'));
  END IF;
END;
$$;

-- ── Purchases table ──
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  type TEXT NOT NULL CHECK (type IN ('subscription', 'credit_pack')),
  description TEXT,
  credits_added NUMERIC(10,1) DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own purchases" ON public.purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX idx_purchases_user ON public.purchases(user_id, created_at DESC);

-- ── Function: truncate_user_data ──
-- Truncates excess student/plan data when downgrading to free tier.
CREATE OR REPLACE FUNCTION public.truncate_user_data(
  p_user_id UUID,
  p_target_tier TEXT
) RETURNS JSON AS $$
DECLARE
  v_student_count BIGINT;
  v_plan_count BIGINT;
  v_students_deleted BIGINT;
  v_plans_deleted BIGINT;
BEGIN
  -- If target tier is pro or enterprise, no truncation needed
  IF p_target_tier IN ('pro', 'enterprise') THEN
    RETURN json_build_object('students_deleted', 0, 'plans_deleted', 0);
  END IF;

  -- Count current students and plans
  SELECT COUNT(*) INTO v_student_count FROM public.students WHERE tutor_id = p_user_id;

  SELECT COUNT(*) INTO v_plan_count
  FROM public.weekly_plans wp
  JOIN public.students s ON s.id = wp.student_id
  WHERE s.tutor_id = p_user_id;

  -- Truncate students: keep newest 3 (cascades to plans, weeks, days, tasks, resources)
  DELETE FROM public.students
  WHERE id IN (
    SELECT id FROM public.students
    WHERE tutor_id = p_user_id
    ORDER BY created_at ASC
    LIMIT greatest(0, v_student_count - 3)
  );
  v_students_deleted := greatest(0, v_student_count - 3);

  -- Re-count plans after student cascade deletion, then trim excess
  SELECT COUNT(*) INTO v_plan_count
  FROM public.weekly_plans wp
  JOIN public.students s ON s.id = wp.student_id
  WHERE s.tutor_id = p_user_id;

  DELETE FROM public.weekly_plans
  WHERE id IN (
    SELECT wp.id FROM public.weekly_plans wp
    JOIN public.students s ON s.id = wp.student_id
    WHERE s.tutor_id = p_user_id
    ORDER BY wp.created_at ASC
    LIMIT greatest(0, v_plan_count - 5)
  );
  v_plans_deleted := greatest(0, v_plan_count - 5);

  RETURN json_build_object(
    'students_deleted', v_students_deleted,
    'plans_deleted', v_plans_deleted
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Function: check_subscription_limits ──
-- Checks whether a user is within their tier's data limits.
CREATE OR REPLACE FUNCTION public.check_subscription_limits(
  p_user_id UUID
) RETURNS TABLE(
  within_limits BOOLEAN,
  student_count BIGINT,
  plan_count BIGINT,
  max_students BIGINT,
  max_plans BIGINT
) AS $$
DECLARE
  v_tier TEXT;
  v_student_count BIGINT;
  v_plan_count BIGINT;
  v_max_students BIGINT;
  v_max_plans BIGINT;
BEGIN
  -- Read subscription tier
  SELECT subscription_tier INTO v_tier FROM public.profiles WHERE id = p_user_id;

  -- Count students and active plans
  SELECT COUNT(*) INTO v_student_count FROM public.students WHERE tutor_id = p_user_id;

  SELECT COUNT(*) INTO v_plan_count
  FROM public.weekly_plans wp
  JOIN public.students s ON s.id = wp.student_id
  WHERE s.tutor_id = p_user_id AND wp.status = 'active';

  -- Determine limits based on tier
  IF v_tier = 'free' THEN
    v_max_students := 3;
    v_max_plans := 5;
  ELSE
    v_max_students := NULL;
    v_max_plans := NULL;
  END IF;

  RETURN QUERY
  SELECT
    (v_max_students IS NULL OR v_student_count <= v_max_students)
    AND (v_max_plans IS NULL OR v_plan_count <= v_max_plans) AS within_limits,
    v_student_count,
    v_plan_count,
    v_max_students,
    v_max_plans;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Function: process_data_truncations ──
-- Processes pending data truncations for users past their grace period.
CREATE OR REPLACE FUNCTION public.process_data_truncations()
RETURNS VOID AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id FROM public.profiles
    WHERE data_truncation_date IS NOT NULL
      AND data_truncation_date <= now()
  LOOP
    PERFORM public.truncate_user_data(r.id, 'free');
    UPDATE public.profiles
    SET downgraded_at = NULL, data_truncation_date = NULL
    WHERE id = r.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
