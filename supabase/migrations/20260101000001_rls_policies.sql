-- ====================================================================
-- MIGRATION 000001: COMPREHENSIVE ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- 1. ENABLE RLS ON EVERY EXPOSED TABLE
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

-- 2. GUARD PROTECTED PROFILE FIELDS (Prevent arbitrary user escalation of completed bounties / earned amount)
CREATE OR REPLACE FUNCTION public.guard_profile_protected_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- If not running from an internal security definer function, preserve protected fields
  IF current_setting('vaultwork.internal_system_operation', true) IS DISTINCT FROM 'true' THEN
    NEW.bounties_completed := OLD.bounties_completed;
    NEW.total_earned_usd := OLD.total_earned_usd;
    NEW.id := OLD.id; -- ID can never be changed
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guard_profile_fields ON public.profiles;
CREATE TRIGGER trg_guard_profile_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_protected_fields();

-- 3. PROFILES POLICIES
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

-- 4. BOUNTIES POLICIES
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

-- 5. APPLICATIONS POLICIES
DROP POLICY IF EXISTS "Applicants and bounty creators can view applications" ON public.applications;
CREATE POLICY "Applicants and bounty creators can view applications"
  ON public.applications FOR SELECT
  TO authenticated
  USING (
    auth.uid() = developer_id OR
    EXISTS (
      SELECT 1 FROM public.bounties 
      WHERE id = applications.bounty_id AND creator_id = auth.uid()
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

-- Applicants can withdraw their own proposals (status can only transition to withdrawn)
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

-- 6. ASSIGNMENTS POLICIES
DROP POLICY IF EXISTS "Involved participants can view assignment" ON public.assignments;
CREATE POLICY "Involved participants can view assignment"
  ON public.assignments FOR SELECT
  TO authenticated
  USING (
    auth.uid() = developer_id OR
    EXISTS (
      SELECT 1 FROM public.bounties 
      WHERE id = assignments.bounty_id AND creator_id = auth.uid()
    )
  );

-- 7. SUBMISSIONS POLICIES
DROP POLICY IF EXISTS "Involved participants can view deliverables" ON public.submissions;
CREATE POLICY "Involved participants can view deliverables"
  ON public.submissions FOR SELECT
  TO authenticated
  USING (
    auth.uid() = developer_id OR
    EXISTS (
      SELECT 1 FROM public.bounties 
      WHERE id = submissions.bounty_id AND creator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Assigned developer can submit deliverables" ON public.submissions;
CREATE POLICY "Assigned developer can submit deliverables"
  ON public.submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = developer_id AND
    EXISTS (
      SELECT 1 FROM public.bounties 
      WHERE id = bounty_id AND assigned_developer_id = auth.uid() AND status = 'in_progress'
    )
  );

DROP POLICY IF EXISTS "Creator can review submissions" ON public.submissions;
CREATE POLICY "Creator can review submissions"
  ON public.submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bounties 
      WHERE id = submissions.bounty_id AND creator_id = auth.uid()
    )
  );

-- 8. NOTIFICATIONS POLICIES
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

-- 9. ACTIVITY_EVENTS POLICIES
DROP POLICY IF EXISTS "Participants can view activity on related bounties" ON public.activity_events;
CREATE POLICY "Participants can view activity on related bounties"
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
