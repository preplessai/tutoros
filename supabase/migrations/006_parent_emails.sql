CREATE TABLE IF NOT EXISTS parent_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL DEFAULT 'Weekly Tutoring Update',
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE parent_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutors manage own emails" ON parent_emails
  FOR ALL
  USING (tutor_id = auth.uid());
