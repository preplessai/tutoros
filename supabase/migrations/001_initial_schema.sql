-- ═══════════════════════════════════════
-- Prepless AI — Initial Database Schema
-- ═══════════════════════════════════════

-- ── Profiles (auto-created on signup) ──
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  ai_credits INTEGER NOT NULL DEFAULT 3,
  ai_credits_refresh_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Students ──
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  subjects TEXT[] NOT NULL DEFAULT '{}',
  learning_style TEXT,
  preferred_resource_sites JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutors can manage own students" ON public.students
  FOR ALL USING (auth.uid() = tutor_id);

-- ── Weekly Plans ──
CREATE TABLE public.weekly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  grade TEXT NOT NULL,
  subjects TEXT[] NOT NULL DEFAULT '{}',
  time_per_session INTEGER NOT NULL DEFAULT 60,
  sessions_per_week INTEGER NOT NULL DEFAULT 2,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  important_dates JSONB DEFAULT '[]'::jsonb,
  goals TEXT,
  learning_style TEXT,
  ai_raw_response JSONB,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.weekly_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutors can manage own plans" ON public.weekly_plans
  FOR ALL USING (auth.uid() = tutor_id);

-- ── Plan Weeks ──
CREATE TABLE public.plan_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.weekly_plans(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  theme TEXT,
  focus_areas TEXT[] DEFAULT '{}',
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  ai_generated BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(plan_id, week_number)
);

ALTER TABLE public.plan_weeks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutors can manage own plan weeks" ON public.plan_weeks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.weekly_plans
      WHERE weekly_plans.id = plan_weeks.plan_id
      AND weekly_plans.tutor_id = auth.uid()
    )
  );

-- ── Plan Days ──
CREATE TABLE public.plan_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID NOT NULL REFERENCES public.plan_weeks(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  day_of_week TEXT,
  energy_level TEXT,
  recent_progress TEXT,
  struggle_areas TEXT[] DEFAULT '{}',
  grades_context TEXT,
  ai_raw_response JSONB,
  sort_order INTEGER NOT NULL DEFAULT 0,
  ai_generated BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plan_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutors can manage own plan days" ON public.plan_days
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.plan_weeks
      JOIN public.weekly_plans ON weekly_plans.id = plan_weeks.plan_id
      WHERE plan_weeks.id = plan_days.week_id
      AND weekly_plans.tutor_id = auth.uid()
    )
  );

-- ── Plan Tasks ──
CREATE TABLE public.plan_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES public.plan_days(id) ON DELETE CASCADE,
  section TEXT NOT NULL CHECK (section IN ('review_struggles', 'homework_help', 'project_help', 'learn_new', 'practice', 'wrap_up')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  completed BOOLEAN NOT NULL DEFAULT false,
  ai_generated BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plan_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutors can manage own plan tasks" ON public.plan_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.plan_days
      JOIN public.plan_weeks ON plan_weeks.id = plan_days.week_id
      JOIN public.weekly_plans ON weekly_plans.id = plan_weeks.plan_id
      WHERE plan_days.id = plan_tasks.day_id
      AND weekly_plans.tutor_id = auth.uid()
    )
  );

-- ── Resources ──
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.plan_tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  source TEXT,
  type TEXT CHECK (type IN ('video', 'article', 'practice', 'interactive')),
  description TEXT,
  ai_generated BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutors can manage own resources" ON public.resources
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.plan_tasks
      JOIN public.plan_days ON plan_days.id = plan_tasks.day_id
      JOIN public.plan_weeks ON plan_weeks.id = plan_days.week_id
      JOIN public.weekly_plans ON weekly_plans.id = plan_weeks.plan_id
      WHERE plan_tasks.id = resources.task_id
      AND weekly_plans.tutor_id = auth.uid()
    )
  );

-- ── Indexes ──
CREATE INDEX idx_students_tutor ON public.students(tutor_id);
CREATE INDEX idx_weekly_plans_tutor ON public.weekly_plans(tutor_id);
CREATE INDEX idx_weekly_plans_student ON public.weekly_plans(student_id);
CREATE INDEX idx_plan_weeks_plan ON public.plan_weeks(plan_id);
CREATE INDEX idx_plan_days_week ON public.plan_days(week_id);
CREATE INDEX idx_plan_tasks_day ON public.plan_tasks(day_id);
CREATE INDEX idx_resources_task ON public.resources(task_id);
