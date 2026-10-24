-- ====================================================================
-- VAULTWORK — SUPABASE DATABASE SCHEMA
-- Execute this script in your Supabase Project's SQL Editor
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM OR CHECK CONSTRAINTS
-- We use TEXT columns with check constraints for maximum interoperability.

-- 3. PROFILES TABLE
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
  bounties_completed INT DEFAULT 0,
  total_earned_usd NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BOUNTIES TABLE
CREATE TABLE IF NOT EXISTS public.bounties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  short_summary TEXT NOT NULL,
  description TEXT NOT NULL,
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
  applications_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id UUID NOT NULL REFERENCES public.bounties(id) ON DELETE CASCADE,
  developer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cover_letter TEXT NOT NULL,
  relevant_experience TEXT NOT NULL,
  estimated_delivery_days INT NOT NULL CHECK (estimated_delivery_days > 0),
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

-- 6. SUBMISSIONS TABLE (Workroom deliverables)
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

-- 7. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  link TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_bounties_creator ON public.bounties(creator_id);
CREATE INDEX IF NOT EXISTS idx_bounties_status ON public.bounties(status);
CREATE INDEX IF NOT EXISTS idx_bounties_category ON public.bounties(category);
CREATE INDEX IF NOT EXISTS idx_bounties_deadline ON public.bounties(deadline);
CREATE INDEX IF NOT EXISTS idx_applications_bounty ON public.applications(bounty_id);
CREATE INDEX IF NOT EXISTS idx_applications_developer ON public.applications(developer_id);
CREATE INDEX IF NOT EXISTS idx_submissions_bounty ON public.submissions(bounty_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);

-- 9. TRIGGERS & FUNCTIONS

-- Auto update applications_count on bounties
CREATE OR REPLACE FUNCTION public.handle_bounty_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.bounties
    SET applications_count = applications_count + 1
    WHERE id = NEW.bounty_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.bounties
    SET applications_count = GREATEST(0, applications_count - 1)
    WHERE id = OLD.bounty_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_application_change ON public.applications;
CREATE TRIGGER on_application_change
  AFTER INSERT OR DELETE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_bounty_applications_count();

-- Auto-create profile on signup
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
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/identicon/svg?seed=' || NEW.id)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can view profiles, owners can update their own
CREATE POLICY "Public profiles are viewable by everyone." 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile." 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Bounties: Viewable if not draft or if owner; insertable by auth users; updatable by creator
CREATE POLICY "Published bounties are viewable by everyone" 
  ON public.bounties FOR SELECT USING (status != 'draft' OR auth.uid() = creator_id);

CREATE POLICY "Authenticated users can create bounties" 
  ON public.bounties FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own bounties" 
  ON public.bounties FOR UPDATE USING (auth.uid() = creator_id);

-- Applications: Bounty creators can view all applications to their bounty; developers view their own
CREATE POLICY "Applicants can view own applications" 
  ON public.applications FOR SELECT 
  USING (auth.uid() = developer_id OR EXISTS (
    SELECT 1 FROM public.bounties WHERE id = applications.bounty_id AND creator_id = auth.uid()
  ));

CREATE POLICY "Developers can submit applications to open bounties" 
  ON public.applications FOR INSERT 
  WITH CHECK (
    auth.uid() = developer_id AND
    auth.uid() != (SELECT creator_id FROM public.bounties WHERE id = bounty_id)
  );

CREATE POLICY "Creators can update application status or applicants can withdraw" 
  ON public.applications FOR UPDATE 
  USING (
    auth.uid() = developer_id OR 
    EXISTS (SELECT 1 FROM public.bounties WHERE id = applications.bounty_id AND creator_id = auth.uid())
  );

-- Submissions: Creator and assigned developer can view and manage
CREATE POLICY "View submissions for involved parties" 
  ON public.submissions FOR SELECT 
  USING (
    auth.uid() = developer_id OR 
    EXISTS (SELECT 1 FROM public.bounties WHERE id = submissions.bounty_id AND creator_id = auth.uid())
  );

CREATE POLICY "Assigned developer can submit deliverables" 
  ON public.submissions FOR INSERT 
  WITH CHECK (
    auth.uid() = developer_id AND 
    EXISTS (SELECT 1 FROM public.bounties WHERE id = submissions.bounty_id AND assigned_developer_id = auth.uid())
  );

CREATE POLICY "Creator can review deliverables" 
  ON public.submissions FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM public.bounties WHERE id = submissions.bounty_id AND creator_id = auth.uid())
  );

-- Notifications: Users only see their own notifications
CREATE POLICY "Users can view and update own notifications" 
  ON public.notifications FOR ALL USING (auth.uid() = user_id);
