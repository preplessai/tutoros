-- ═══════════════════════════════════════
-- Student Onboarding Fields — Contact, Parent, Learning Platforms
-- ═══════════════════════════════════════

-- ── Student contact info ──
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS parent_name TEXT,
  ADD COLUMN IF NOT EXISTS parent_email TEXT,
  ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS learning_platforms TEXT[] DEFAULT '{}';

-- ── Comment on columns for PostgREST schema ──
COMMENT ON COLUMN public.students.email IS 'Student email/contact';
COMMENT ON COLUMN public.students.parent_name IS 'Parent or guardian name';
COMMENT ON COLUMN public.students.parent_email IS 'Parent email for weekly assignment notifications';
COMMENT ON COLUMN public.students.preferred_contact_method IS 'Preferred contact method: email, sms, or both';
COMMENT ON COLUMN public.students.learning_platforms IS 'Learning platforms student uses: Khan Academy, IXL, etc.';

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
