-- ====================================================================
-- VAULTWORK — COMPREHENSIVE PRODUCTION POSTGRESQL SCHEMA
-- ====================================================================
-- Deployment Target: Supabase PostgreSQL (SQL Editor or CLI)
-- Idempotency: Safe for both fresh installations and existing databases.
-- Preserves existing tables, constraints, and data (zero destructive drops).
--
-- Includes:
--   1. Extensions & Custom Types
--   2. Core Tables, Constraints, Foreign Keys & Checks
--   3. Performance & GIN Indexes
--   4. Triggers (Applications Count, Profiles Sync, Timestamps, Profile Guards)
--   5. Granular Row Level Security (RLS) Policies with strict WITH CHECK
--   6. Atomic SECURITY DEFINER Workflow Functions (Selection, Submissions, Reviews)
--   7. Least-Privilege Function Permissions (REVOKE from PUBLIC, GRANT to authenticated)
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. EXTENSIONS
-- --------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- --------------------------------------------------------------------
-- 2. CORE TABLES & CONSTRAINTS
-- --------------------------------------------------------------------

-- A. PROFILES TABLE
-- Directly mapped to Supabase auth.users(id)
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

-- B. BOUNTIES TABLE
-- Main bounty marketplace entities
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

-- C. APPLICATIONS TABLE
-- Developer proposals for commissioned bounties
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

-- D. ASSIGNMENTS TABLE
-- Explicit 1-to-1 active engagement record per bounty
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

-- E. SUBMISSIONS TABLE
-- Milestone deliverables and revision rounds
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

-- F. NOTIFICATIONS TABLE
-- Real-time user workflow alerts
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

-- G. ACTIVITY_EVENTS TABLE
-- Immutable audit log for transparency
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

-- --------------------------------------------------------------------
-- 3. PERFORMANCE & DISCOVERY INDEXES
-- --------------------------------------------------------------------
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

-- --------------------------------------------------------------------
-- 4. TRIGGERS & GUARD FUNCTIONS
-- --------------------------------------------------------------------

-- A. Applications Count Auto-Sync (Handles INSERT, DELETE, and UPDATE of status)
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
    -- Transitioning to withdrawn -> decrement
    IF OLD.status != 'withdrawn' AND NEW.status = 'withdrawn' THEN
      UPDATE public.bounties
      SET applications_count = GREATEST(0, applications_count - 1)
      WHERE id = NEW.bounty_id;
    -- Transitioning from withdrawn back to active -> increment
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

-- B. Auto-create Profile upon Supabase Auth Signup
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

-- D. Guard Profile Protected Fields (Prevent arbitrary escalation of completed stats)
CREATE OR REPLACE FUNCTION public.guard_profile_protected_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('vaultwork.internal_system_operation', true) IS DISTINCT FROM 'true' THEN
    NEW.bounties_completed := OLD.bounties_completed;
    NEW.total_earned_usd := OLD.total_earned_usd;
    NEW.id := OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guard_profile_fields ON public.profiles;
CREATE TRIGGER trg_guard_profile_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_protected_fields();

-- --------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- --------------------------------------------------------------------
-- Idempotent RLS: drop and recreate to guarantee zero policy conflict errors

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

-- A. PROFILES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- B. BOUNTIES
DROP POLICY IF EXISTS "Published bounties are viewable by everyone" ON public.bounties;
CREATE POLICY "Published bounties are viewable by everyone" 
  ON public.bounties FOR SELECT 
  USING (status != 'draft' OR auth.uid() = creator_id);

DROP POLICY IF EXISTS "Authenticated users can create bounties" ON public.bounties;
CREATE POLICY "Authenticated users can create bounties" 
  ON public.bounties FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Creators can update their own bounties" ON public.bounties;
CREATE POLICY "Creators can update their own bounties" 
  ON public.bounties FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- C. APPLICATIONS
DROP POLICY IF EXISTS "Applicants and creators can view applications" ON public.applications;
CREATE POLICY "Applicants and creators can view applications" 
  ON public.applications FOR SELECT 
  TO authenticated
  USING (
    auth.uid() = developer_id OR EXISTS (
      SELECT 1 FROM public.bounties WHERE id = applications.bounty_id AND creator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Developers can apply to open bounties" ON public.applications;
CREATE POLICY "Developers can apply to open bounties" 
  ON public.applications FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid() = developer_id AND
    EXISTS (
      SELECT 1 FROM public.bounties
      WHERE id = bounty_id 
        AND status = 'open' 
        AND deadline > NOW() 
        AND creator_id != auth.uid()
    )
  );

-- Developers can withdraw their own proposals (status can only transition to withdrawn)
DROP POLICY IF EXISTS "Applicants can withdraw their own proposals" ON public.applications;
CREATE POLICY "Applicants can withdraw their own proposals" 
  ON public.applications FOR UPDATE 
  TO authenticated
  USING (auth.uid() = developer_id)
  WITH CHECK (auth.uid() = developer_id AND status = 'withdrawn');

-- Bounty creators can manage applicant statuses
DROP POLICY IF EXISTS "Creators can update applications on their bounties" ON public.applications;
CREATE POLICY "Creators can update applications on their bounties" 
  ON public.applications FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bounties 
      WHERE id = applications.bounty_id AND creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bounties 
      WHERE id = applications.bounty_id AND creator_id = auth.uid()
    )
  );

-- D. ASSIGNMENTS
-- Only visible to the creator and the assigned developer.
-- Mutation is strictly restricted to SECURITY DEFINER RPCs (no direct client INSERT/UPDATE).
DROP POLICY IF EXISTS "Involved participants can view assignment" ON public.assignments;
CREATE POLICY "Involved participants can view assignment" 
  ON public.assignments FOR SELECT 
  TO authenticated
  USING (
    auth.uid() = developer_id OR EXISTS (
      SELECT 1 FROM public.bounties WHERE id = assignments.bounty_id AND creator_id = auth.uid()
    )
  );

-- E. SUBMISSIONS
DROP POLICY IF EXISTS "View submissions for involved parties" ON public.submissions;
CREATE POLICY "View submissions for involved parties" 
  ON public.submissions FOR SELECT 
  TO authenticated
  USING (
    auth.uid() = developer_id OR EXISTS (
      SELECT 1 FROM public.bounties WHERE id = submissions.bounty_id AND creator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Assigned developer can submit deliverables" ON public.submissions;
CREATE POLICY "Assigned developer can submit deliverables" 
  ON public.submissions FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid() = developer_id AND EXISTS (
      SELECT 1 FROM public.bounties 
      WHERE id = submissions.bounty_id 
        AND assigned_developer_id = auth.uid() 
        AND status = 'in_progress'
    )
  );

DROP POLICY IF EXISTS "Creator can review deliverables" ON public.submissions;
CREATE POLICY "Creator can review deliverables" 
  ON public.submissions FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bounties 
      WHERE id = submissions.bounty_id AND creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bounties 
      WHERE id = submissions.bounty_id AND creator_id = auth.uid()
    )
  );

-- F. NOTIFICATIONS
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" 
  ON public.notifications FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can mark own notifications as read" ON public.notifications;
CREATE POLICY "Users can mark own notifications as read" 
  ON public.notifications FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- G. ACTIVITY EVENTS
DROP POLICY IF EXISTS "Participants can view activity" ON public.activity_events;
CREATE POLICY "Participants can view activity" 
  ON public.activity_events FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bounties
      WHERE id = activity_events.bounty_id AND (
        creator_id = auth.uid() OR 
        assigned_developer_id = auth.uid() OR
        status != 'draft'
      )
    )
  );

-- --------------------------------------------------------------------
-- 6. ATOMIC WORKFLOW RPC FUNCTIONS
-- --------------------------------------------------------------------

-- A. Select Developer & Assign to Bounty
-- Concurrency safe with row locks (FOR UPDATE)
CREATE OR REPLACE FUNCTION public.select_bounty_developer(
  p_bounty_id UUID,
  p_application_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_bounty RECORD;
  v_application RECORD;
  v_creator_id UUID := auth.uid();
BEGIN
  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  -- 1. Lock bounty row for update to eliminate race conditions
  SELECT * INTO v_bounty
  FROM public.bounties
  WHERE id = p_bounty_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bounty not found.';
  END IF;

  IF v_bounty.creator_id != v_creator_id THEN
    RAISE EXCEPTION 'Unauthorized: only the bounty creator can select a developer.';
  END IF;

  IF v_bounty.status != 'open' THEN
    RAISE EXCEPTION 'Bounty is not open for selection (status: %)', v_bounty.status;
  END IF;

  -- 2. Lock and verify application
  SELECT * INTO v_application
  FROM public.applications
  WHERE id = p_application_id AND bounty_id = p_bounty_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found for this bounty.';
  END IF;

  IF v_application.status != 'pending' THEN
    RAISE EXCEPTION 'Application is not in pending status (status: %)', v_application.status;
  END IF;

  -- 3. Accept application
  UPDATE public.applications
  SET status = 'accepted', updated_at = NOW()
  WHERE id = p_application_id;

  -- 4. Reject other pending applications for this bounty
  UPDATE public.applications
  SET status = 'rejected', updated_at = NOW()
  WHERE bounty_id = p_bounty_id AND id != p_application_id AND status = 'pending';

  -- 5. Upsert active assignment record
  INSERT INTO public.assignments (
    bounty_id,
    developer_id,
    status,
    assigned_at
  )
  VALUES (
    p_bounty_id,
    v_application.developer_id,
    'active',
    NOW()
  )
  ON CONFLICT (bounty_id) DO UPDATE
  SET developer_id = EXCLUDED.developer_id,
      status = 'active',
      assigned_at = NOW();

  -- 6. Transition bounty status to in_progress
  UPDATE public.bounties
  SET assigned_developer_id = v_application.developer_id,
      status = 'in_progress',
      updated_at = NOW()
  WHERE id = p_bounty_id;

  -- 7. Record audit activity
  INSERT INTO public.activity_events (
    bounty_id,
    actor_id,
    event_type,
    details
  )
  VALUES (
    p_bounty_id,
    v_creator_id,
    'developer_selected',
    jsonb_build_object(
      'developer_id', v_application.developer_id,
      'application_id', p_application_id
    )
  );

  -- 8. Notify the selected developer
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    link
  )
  VALUES (
    v_application.developer_id,
    'Proposal Accepted! 🎉',
    format('Your proposal for "%s" was accepted. Head to the Workroom to start building.', v_bounty.title),
    'application_accepted',
    format('/work/%s', p_bounty_id)
  );

  RETURN jsonb_build_object(
    'success', true,
    'bounty_id', p_bounty_id,
    'developer_id', v_application.developer_id
  );
END;
$$;

-- B. Submit Deliverables to Workroom
CREATE OR REPLACE FUNCTION public.submit_bounty_deliverable(
  p_bounty_id UUID,
  p_notes TEXT,
  p_deliverable_urls TEXT[] DEFAULT '{}',
  p_github_pr_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_bounty RECORD;
  v_developer_id UUID := auth.uid();
  v_submission_id UUID;
BEGIN
  IF v_developer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  SELECT * INTO v_bounty
  FROM public.bounties
  WHERE id = p_bounty_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bounty not found.';
  END IF;

  IF v_bounty.assigned_developer_id != v_developer_id THEN
    RAISE EXCEPTION 'Unauthorized: you are not the assigned developer for this bounty.';
  END IF;

  IF v_bounty.status != 'in_progress' AND v_bounty.status != 'in_review' THEN
    RAISE EXCEPTION 'Deliverables can only be submitted when bounty is in progress.';
  END IF;

  INSERT INTO public.submissions (
    bounty_id,
    developer_id,
    submission_notes,
    deliverable_urls,
    github_pr_url,
    status
  )
  VALUES (
    p_bounty_id,
    v_developer_id,
    p_notes,
    p_deliverable_urls,
    p_github_pr_url,
    'submitted'
  )
  RETURNING id INTO v_submission_id;

  -- Transition bounty status to in_review
  UPDATE public.bounties
  SET status = 'in_review', updated_at = NOW()
  WHERE id = p_bounty_id;

  INSERT INTO public.activity_events (
    bounty_id,
    actor_id,
    event_type,
    details
  )
  VALUES (
    p_bounty_id,
    v_developer_id,
    'work_submitted',
    jsonb_build_object(
      'submission_id', v_submission_id,
      'github_pr_url', p_github_pr_url
    )
  );

  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    link
  )
  VALUES (
    v_bounty.creator_id,
    'Deliverable Ready for Review',
    format('New deliverables have been submitted for "%s". Review in the Workroom.', v_bounty.title),
    'work_submitted',
    format('/work/%s', p_bounty_id)
  );

  RETURN jsonb_build_object(
    'success', true,
    'submission_id', v_submission_id,
    'bounty_id', p_bounty_id
  );
END;
$$;

-- C. Review Submission (Approve Milestone or Request Revisions)
-- Accurate, honest wording: marks milestone completed without false claims of on-chain escrow
CREATE OR REPLACE FUNCTION public.review_bounty_submission(
  p_submission_id UUID,
  p_bounty_id UUID,
  p_status TEXT,
  p_feedback TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_bounty RECORD;
  v_submission RECORD;
  v_creator_id UUID := auth.uid();
  v_usd_amount NUMERIC;
BEGIN
  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  IF p_status NOT IN ('approved', 'revision_requested') THEN
    RAISE EXCEPTION 'Invalid review status. Must be "approved" or "revision_requested".';
  END IF;

  SELECT * INTO v_bounty
  FROM public.bounties
  WHERE id = p_bounty_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bounty not found.';
  END IF;

  IF v_bounty.creator_id != v_creator_id THEN
    RAISE EXCEPTION 'Unauthorized: only the creator can review submissions.';
  END IF;

  SELECT * INTO v_submission
  FROM public.submissions
  WHERE id = p_submission_id AND bounty_id = p_bounty_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission record not found for this bounty.';
  END IF;

  UPDATE public.submissions
  SET status = p_status,
      feedback = p_feedback,
      updated_at = NOW()
  WHERE id = p_submission_id;

  IF p_status = 'approved' THEN
    -- Transition bounty to completed
    UPDATE public.bounties
    SET status = 'completed', updated_at = NOW()
    WHERE id = p_bounty_id;

    -- Mark assignment completed
    UPDATE public.assignments
    SET status = 'completed', completed_at = NOW()
    WHERE bounty_id = p_bounty_id;

    -- USD conversion for profile metrics
    v_usd_amount := CASE 
      WHEN v_bounty.reward_currency IN ('USDC', 'USDT') THEN v_bounty.reward_amount
      WHEN v_bounty.reward_currency = 'ETH' THEN v_bounty.reward_amount * 3200
      WHEN v_bounty.reward_currency = 'SOL' THEN v_bounty.reward_amount * 180
      ELSE v_bounty.reward_amount
    END;

    -- Elevate privileges for trigger bypass
    PERFORM set_config('vaultwork.internal_system_operation', 'true', true);

    UPDATE public.profiles
    SET bounties_completed = bounties_completed + 1,
        total_earned_usd = total_earned_usd + v_usd_amount
    WHERE id = v_submission.developer_id;

    INSERT INTO public.activity_events (
      bounty_id,
      actor_id,
      event_type,
      details
    )
    VALUES (
      p_bounty_id,
      v_creator_id,
      'work_approved',
      jsonb_build_object(
        'submission_id', p_submission_id,
        'milestone_status', 'completed_and_reward_credited'
      )
    );

    -- Honest notification without false claims of on-chain escrow
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      link
    )
    VALUES (
      v_submission.developer_id,
      'Deliverables Approved! 🏆',
      format('Your deliverables for "%s" have been approved! %s %s has been credited to your milestone earnings.', v_bounty.title, v_bounty.reward_amount, v_bounty.reward_currency),
      'bounty_completed',
      format('/work/%s', p_bounty_id)
    );

  ELSIF p_status = 'revision_requested' THEN
    -- Return bounty to in_progress
    UPDATE public.bounties
    SET status = 'in_progress', updated_at = NOW()
    WHERE id = p_bounty_id;

    INSERT INTO public.activity_events (
      bounty_id,
      actor_id,
      event_type,
      details
    )
    VALUES (
      p_bounty_id,
      v_creator_id,
      'revision_requested',
      jsonb_build_object(
        'submission_id', p_submission_id,
        'feedback', p_feedback
      )
    );

    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      link
    )
    VALUES (
      v_submission.developer_id,
      'Revisions Requested',
      format('The creator requested revisions for "%s". See feedback in the Workroom.', v_bounty.title),
      'revision_requested',
      format('/work/%s', p_bounty_id)
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'status', p_status,
    'bounty_id', p_bounty_id,
    'submission_id', p_submission_id
  );
END;
$$;

-- D. Withdraw Application
-- Note: Trigger on_application_change handles applications_count decrement automatically
CREATE OR REPLACE FUNCTION public.withdraw_bounty_application(
  p_application_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_application RECORD;
  v_developer_id UUID := auth.uid();
BEGIN
  IF v_developer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  SELECT * INTO v_application
  FROM public.applications
  WHERE id = p_application_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found.';
  END IF;

  IF v_application.developer_id != v_developer_id THEN
    RAISE EXCEPTION 'Unauthorized: only the applicant can withdraw their proposal.';
  END IF;

  IF v_application.status != 'pending' THEN
    RAISE EXCEPTION 'Only pending applications can be withdrawn.';
  END IF;

  -- Updating status to 'withdrawn' automatically invokes on_application_change trigger
  UPDATE public.applications
  SET status = 'withdrawn', updated_at = NOW()
  WHERE id = p_application_id;

  INSERT INTO public.activity_events (
    bounty_id,
    actor_id,
    event_type,
    details
  )
  VALUES (
    v_application.bounty_id,
    v_developer_id,
    'application_withdrawn',
    jsonb_build_object('application_id', p_application_id)
  );

  RETURN jsonb_build_object(
    'success', true,
    'application_id', p_application_id
  );
END;
$$;

-- E. Fetch Bounty Audit Activity
CREATE OR REPLACE FUNCTION public.get_bounty_activity(p_bounty_id UUID)
RETURNS TABLE (
  id UUID,
  event_type TEXT,
  actor_name TEXT,
  actor_username TEXT,
  details JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT 
    ae.id,
    ae.event_type,
    p.display_name AS actor_name,
    p.username AS actor_username,
    ae.details,
    ae.created_at
  FROM public.activity_events ae
  JOIN public.profiles p ON p.id = ae.actor_id
  WHERE ae.bounty_id = p_bounty_id
  ORDER BY ae.created_at DESC;
$$;

-- --------------------------------------------------------------------
-- 7. FUNCTION PERMISSIONS (LEAST PRIVILEGE)
-- --------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.select_bounty_developer(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.select_bounty_developer(UUID, UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.submit_bounty_deliverable(UUID, TEXT, TEXT[], TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_bounty_deliverable(UUID, TEXT, TEXT[], TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.review_bounty_submission(UUID, UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_bounty_submission(UUID, UUID, TEXT, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.withdraw_bounty_application(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.withdraw_bounty_application(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_bounty_activity(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_bounty_activity(UUID) TO authenticated, anon;
