-- ====================================================================
-- MIGRATION 000000: CORE TABLES, INDEXES & TRIGGERS
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  github_url TEXT,
  portfolio_url TEXT,
  wallet_address TEXT,
  bounties_completed INT DEFAULT 0 CHECK (bounties_completed >= 0),
  total_earned_usd NUMERIC DEFAULT 0 CHECK (total_earned_usd >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BOUNTIES TABLE
CREATE TABLE IF NOT EXISTS public.bounties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) >= 5 AND char_length(title) <= 200),
  short_summary TEXT NOT NULL CHECK (char_length(short_summary) >= 10 AND char_length(short_summary) <= 300),
  description TEXT NOT NULL CHECK (char_length(description) >= 20),
  category TEXT NOT NULL CHECK (category IN (
    'Smart Contracts', 
    'Frontend / UI', 
    'Fullstack', 
    'Security / Audit', 
    'Design / UX', 
    'DeFi / Protocol', 
    'DevOps / Infra'
  )),
  skills TEXT[] NOT NULL DEFAULT '{}',
  reward_amount NUMERIC NOT NULL CHECK (reward_amount > 0),
  reward_currency TEXT NOT NULL DEFAULT 'USDC' CHECK (reward_currency IN ('USDC', 'USDT', 'ETH', 'SOL')),
  deadline TIMESTAMPTZ NOT NULL,
  deliverables TEXT NOT NULL,
  acceptance_criteria TEXT NOT NULL,
  repo_url TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'draft', 
    'open', 
    'in_progress', 
    'in_review', 
    'completed', 
    'cancelled'
  )),
  assigned_developer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  applications_count INT DEFAULT 0 CHECK (applications_count >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id UUID NOT NULL REFERENCES public.bounties(id) ON DELETE CASCADE,
  developer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cover_letter TEXT NOT NULL CHECK (char_length(cover_letter) >= 20),
  relevant_experience TEXT NOT NULL,
  estimated_delivery_days INT NOT NULL CHECK (estimated_delivery_days > 0 AND estimated_delivery_days <= 180),
  portfolio_link TEXT,
  links TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 
    'accepted', 
    'rejected', 
    'withdrawn'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_applicant_per_bounty UNIQUE (bounty_id, developer_id)
);

-- 4. ASSIGNMENTS TABLE (Dedicated relation for active assignment & historical record)
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id UUID NOT NULL REFERENCES public.bounties(id) ON DELETE CASCADE,
  developer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_active_assignment_per_bounty UNIQUE (bounty_id)
);

-- 5. SUBMISSIONS TABLE (Workroom iterations & deliverables)
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id UUID NOT NULL REFERENCES public.bounties(id) ON DELETE CASCADE,
  developer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  submission_notes TEXT NOT NULL,
  deliverable_urls TEXT[] NOT NULL DEFAULT '{}',
  github_pr_url TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
    'submitted', 
    'revision_requested', 
    'approved'
  )),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'application_received', 
    'application_accepted', 
    'application_rejected', 
    'work_submitted', 
    'revision_requested', 
    'bounty_completed'
  )),
  link TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ACTIVITY_EVENTS TABLE (Audit log of all workflow actions)
CREATE TABLE IF NOT EXISTS public.activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id UUID NOT NULL REFERENCES public.bounties(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'bounty_created',
    'application_submitted',
    'developer_selected',
    'work_submitted',
    'revision_requested',
    'work_approved',
    'application_withdrawn',
    'bounty_cancelled'
  )),
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_bounties_creator ON public.bounties(creator_id);
CREATE INDEX IF NOT EXISTS idx_bounties_status ON public.bounties(status);
CREATE INDEX IF NOT EXISTS idx_bounties_category ON public.bounties(category);
CREATE INDEX IF NOT EXISTS idx_bounties_deadline ON public.bounties(deadline);
CREATE INDEX IF NOT EXISTS idx_bounties_reward ON public.bounties(reward_amount DESC);
CREATE INDEX IF NOT EXISTS idx_bounties_skills ON public.bounties USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_applications_bounty ON public.applications(bounty_id);
CREATE INDEX IF NOT EXISTS idx_applications_developer ON public.applications(developer_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_assignments_bounty ON public.assignments(bounty_id);
CREATE INDEX IF NOT EXISTS idx_assignments_developer ON public.assignments(developer_id);
CREATE INDEX IF NOT EXISTS idx_submissions_bounty ON public.submissions(bounty_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_activity_events_bounty ON public.activity_events(bounty_id, created_at DESC);

-- 9. TRIGGERS

-- A. Auto update applications_count on bounties
CREATE OR REPLACE FUNCTION public.handle_bounty_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status != 'withdrawn' THEN
      UPDATE public.bounties
      SET applications_count = applications_count + 1
      WHERE id = NEW.bounty_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status != 'withdrawn' THEN
      UPDATE public.bounties
      SET applications_count = GREATEST(0, applications_count - 1)
      WHERE id = OLD.bounty_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'withdrawn' AND NEW.status = 'withdrawn' THEN
      UPDATE public.bounties
      SET applications_count = GREATEST(0, applications_count - 1)
      WHERE id = NEW.bounty_id;
    ELSIF OLD.status = 'withdrawn' AND NEW.status != 'withdrawn' THEN
      UPDATE public.bounties
      SET applications_count = applications_count + 1
      WHERE id = NEW.bounty_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS on_application_change ON public.applications;
CREATE TRIGGER on_application_change
  AFTER INSERT OR UPDATE OR DELETE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_bounty_applications_count();

-- B. Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    username, 
    display_name, 
    avatar_url
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- C. Generic updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_bounties_updated_at ON public.bounties;
CREATE TRIGGER trg_bounties_updated_at
  BEFORE UPDATE ON public.bounties
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_applications_updated_at ON public.applications;
CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_submissions_updated_at ON public.submissions;
CREATE TRIGGER trg_submissions_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
