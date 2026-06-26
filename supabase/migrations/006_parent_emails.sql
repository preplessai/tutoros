-- Parent email drafts table
-- Stores markdown-formatted email drafts for parent updates

CREATE TABLE IF NOT EXISTS parent_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL DEFAULT 'Weekly Tutoring Update',
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE parent_emails ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if re-running migration
DROP POLICY IF EXISTS "Tutors manage own emails" ON parent_emails;

CREATE POLICY "Tutors manage own emails" ON parent_emails
  FOR ALL
  USING (tutor_id = auth.uid());
