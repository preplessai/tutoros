-- Fix: PGRST203 — function overload ambiguity after 007
-- Old INTEGER version still exists alongside new NUMERIC version.
-- PostgreSQL CREATE OR REPLACE only replaces same-signature functions.

BEGIN;

-- 1. Drop ALL overloaded versions explicitly
DROP FUNCTION IF EXISTS public.use_credits(UUID, INTEGER, TEXT);
DROP FUNCTION IF EXISTS public.use_credits(UUID, NUMERIC, TEXT);
DROP FUNCTION IF EXISTS public.refresh_credits(UUID, INTEGER, INTERVAL);
DROP FUNCTION IF EXISTS public.refresh_credits(UUID, NUMERIC, INTERVAL);
DROP FUNCTION IF EXISTS public.add_credits(UUID, INTEGER, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.add_credits(UUID, NUMERIC, TEXT, TEXT);

-- 2. Alter columns to NUMERIC
ALTER TABLE public.profiles
  ALTER COLUMN non_expiring_credits TYPE NUMERIC(10,1),
  ALTER COLUMN refreshing_credits TYPE NUMERIC(10,1);

-- 3. Create single NUMERIC versions
CREATE OR REPLACE FUNCTION public.use_credits(
  p_user_id UUID,
  p_amount NUMERIC,
  p_reason TEXT DEFAULT 'plan_generation'
) RETURNS BOOLEAN AS $$
DECLARE
  v_refreshing NUMERIC;
  v_non_expiring NUMERIC;
  v_from_refreshing NUMERIC;
  v_from_non_expiring NUMERIC;
BEGIN
  SELECT refreshing_credits, non_expiring_credits
  INTO v_refreshing, v_non_expiring
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN RETURN FALSE; END IF;
  IF (COALESCE(v_refreshing, 0) + COALESCE(v_non_expiring, 0)) < p_amount THEN
    RETURN FALSE;
  END IF;

  v_from_refreshing := LEAST(COALESCE(v_refreshing, 0), p_amount);
  v_from_non_expiring := p_amount - v_from_refreshing;

  UPDATE public.profiles
  SET refreshing_credits = refreshing_credits - v_from_refreshing,
      non_expiring_credits = non_expiring_credits - v_from_non_expiring,
      updated_at = now()
  WHERE id = p_user_id;

  IF v_from_refreshing > 0 THEN
    INSERT INTO public.credit_transactions (user_id, amount, category, reason)
    VALUES (p_user_id, -v_from_refreshing, 'refreshing', p_reason);
  END IF;
  IF v_from_non_expiring > 0 THEN
    INSERT INTO public.credit_transactions (user_id, amount, category, reason)
    VALUES (p_user_id, -v_from_non_expiring, 'non_expiring', p_reason);
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.refresh_credits(
  p_user_id UUID,
  p_amount NUMERIC,
  p_interval INTERVAL DEFAULT '1 month'
) RETURNS VOID AS $$
DECLARE
  v_reset_at TIMESTAMPTZ;
BEGIN
  SELECT refreshing_reset_at INTO v_reset_at
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_reset_at IS NULL OR v_reset_at <= now() THEN
    UPDATE public.profiles
    SET refreshing_credits = p_amount,
        refreshing_reset_at = now() + p_interval,
        updated_at = now()
    WHERE id = p_user_id;

    INSERT INTO public.credit_transactions (user_id, amount, category, reason)
    VALUES (p_user_id, p_amount, 'refreshing', 'subscription_refresh');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id UUID,
  p_amount NUMERIC,
  p_category TEXT,
  p_reason TEXT DEFAULT 'manual_grant'
) RETURNS VOID AS $$
BEGIN
  IF p_category = 'non_expiring' THEN
    UPDATE public.profiles
    SET non_expiring_credits = non_expiring_credits + p_amount,
        updated_at = now()
    WHERE id = p_user_id;
  ELSIF p_category = 'refreshing' THEN
    UPDATE public.profiles
    SET refreshing_credits = refreshing_credits + p_amount,
        updated_at = now()
    WHERE id = p_user_id;
  END IF;

  INSERT INTO public.credit_transactions (user_id, amount, category, reason)
  VALUES (p_user_id, p_amount, p_category, p_reason);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

NOTIFY pgrst, 'reload schema';
