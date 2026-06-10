-- ═══════════════════════════════════════
-- Credits System — Non-expiring + Refreshing
-- ═══════════════════════════════════════

-- ── Add credit columns to profiles ──
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS non_expiring_credits INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refreshing_credits INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refreshing_reset_at TIMESTAMPTZ;

-- Migrate existing ai_credits → non_expiring_credits (one-time grant)
UPDATE public.profiles
  SET non_expiring_credits = ai_credits
  WHERE ai_credits > 0 AND non_expiring_credits = 0;

-- ── Credit Transactions (audit log) ──
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('non_expiring', 'refreshing')),
  reason TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.credit_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_credit_transactions_user ON public.credit_transactions(user_id, created_at DESC);

-- ── Function: use_credits ──
-- Deducts credits (refreshing first, then non-expiring).
-- Returns TRUE if sufficient credits, FALSE otherwise.
CREATE OR REPLACE FUNCTION public.use_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT DEFAULT 'plan_generation'
) RETURNS BOOLEAN AS $$
DECLARE
  v_refreshing INTEGER;
  v_non_expiring INTEGER;
  v_from_refreshing INTEGER;
  v_from_non_expiring INTEGER;
BEGIN
  -- Lock row to prevent race conditions
  SELECT refreshing_credits, non_expiring_credits
  INTO v_refreshing, v_non_expiring
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check total balance
  IF (COALESCE(v_refreshing, 0) + COALESCE(v_non_expiring, 0)) < p_amount THEN
    RETURN FALSE;
  END IF;

  -- Deduct from refreshing first
  v_from_refreshing := LEAST(COALESCE(v_refreshing, 0), p_amount);
  v_from_non_expiring := p_amount - v_from_refreshing;

  -- Update balances
  UPDATE public.profiles
  SET
    refreshing_credits = refreshing_credits - v_from_refreshing,
    non_expiring_credits = non_expiring_credits - v_from_non_expiring,
    updated_at = now()
  WHERE id = p_user_id;

  -- Log transactions
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

-- ── Function: add_credits ──
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id UUID,
  p_amount INTEGER,
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

-- ── Function: refresh_credits ──
-- Resets refreshing_credits to p_amount if reset_at has passed.
-- Called on login or before credit check.
CREATE OR REPLACE FUNCTION public.refresh_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_interval INTERVAL DEFAULT '1 month'
) RETURNS VOID AS $$
DECLARE
  v_reset_at TIMESTAMPTZ;
BEGIN
  SELECT refreshing_reset_at INTO v_reset_at
  FROM public.profiles
  WHERE id = p_user_id;

  -- Refresh if never reset or reset time has passed
  IF v_reset_at IS NULL OR v_reset_at <= now() THEN
    UPDATE public.profiles
    SET
      refreshing_credits = p_amount,
      refreshing_reset_at = now() + p_interval,
      updated_at = now()
    WHERE id = p_user_id;

    INSERT INTO public.credit_transactions (user_id, amount, category, reason)
    VALUES (p_user_id, p_amount, 'refreshing', 'subscription_refresh');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Grant free tier credits to new profiles ──
CREATE OR REPLACE FUNCTION public.grant_signup_credits()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET non_expiring_credits = 5
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_credits ON public.profiles;
CREATE TRIGGER on_profile_created_credits
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.grant_signup_credits();

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
