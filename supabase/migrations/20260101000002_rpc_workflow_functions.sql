-- ====================================================================
-- MIGRATION 000002: ATOMIC WORKFLOW RPC FUNCTIONS
-- ====================================================================

-- 1. ATOMIC DEVELOPER SELECTION & ASSIGNMENT
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

  -- 1. Lock the bounty row for update to prevent concurrent assignment attempts
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
    RAISE EXCEPTION 'Bounty is not open for applicant selection (current status: %)', v_bounty.status;
  END IF;

  -- 2. Verify and lock the application
  SELECT * INTO v_application
  FROM public.applications
  WHERE id = p_application_id AND bounty_id = p_bounty_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found for this bounty.';
  END IF;

  IF v_application.status != 'pending' THEN
    RAISE EXCEPTION 'Application is not in pending status (current status: %)', v_application.status;
  END IF;

  -- 3. Update the selected application
  UPDATE public.applications
  SET status = 'accepted', updated_at = NOW()
  WHERE id = p_application_id;

  -- 4. Reject other pending applications for this bounty
  UPDATE public.applications
  SET status = 'rejected', updated_at = NOW()
  WHERE bounty_id = p_bounty_id AND id != p_application_id AND status = 'pending';

  -- 5. Upsert into assignments table
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

  -- 6. Update the bounty record
  UPDATE public.bounties
  SET assigned_developer_id = v_application.developer_id,
      status = 'in_progress',
      updated_at = NOW()
  WHERE id = p_bounty_id;

  -- 7. Record activity event
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

  -- 8. Create notification for the selected developer
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

-- 2. SUBMIT BOUNTY DELIVERABLE (WORKROOM)
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

  -- Insert new submission iteration
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

  -- Transition bounty to in_review
  UPDATE public.bounties
  SET status = 'in_review', updated_at = NOW()
  WHERE id = p_bounty_id;

  -- Record activity
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

  -- Notify bounty creator
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

-- 3. REVIEW SUBMISSION (APPROVE OR REQUEST REVISIONS)
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

  -- Update submission status & feedback
  UPDATE public.submissions
  SET status = p_status,
      feedback = p_feedback,
      updated_at = NOW()
  WHERE id = p_submission_id;

  IF p_status = 'approved' THEN
    -- Complete bounty
    UPDATE public.bounties
    SET status = 'completed', updated_at = NOW()
    WHERE id = p_bounty_id;

    -- Complete assignment
    UPDATE public.assignments
    SET status = 'completed', completed_at = NOW()
    WHERE bounty_id = p_bounty_id;

    -- Calculate USD amount estimate for profile metrics
    v_usd_amount := CASE 
      WHEN v_bounty.reward_currency IN ('USDC', 'USDT') THEN v_bounty.reward_amount
      WHEN v_bounty.reward_currency = 'ETH' THEN v_bounty.reward_amount * 3200
      WHEN v_bounty.reward_currency = 'SOL' THEN v_bounty.reward_amount * 180
      ELSE v_bounty.reward_amount
    END;

    -- Increment developer profile metrics securely
    PERFORM set_config('vaultwork.internal_system_operation', 'true', true);

    UPDATE public.profiles
    SET bounties_completed = bounties_completed + 1,
        total_earned_usd = total_earned_usd + v_usd_amount
    WHERE id = v_submission.developer_id;

    -- Record activity
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
      jsonb_build_object('submission_id', p_submission_id)
    );

    -- Notify developer
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      link
    )
    VALUES (
      v_submission.developer_id,
      'Work Approved & Escrow Released! 💰',
      format('Your deliverables for "%s" have been approved! %s %s has been released.', v_bounty.title, v_bounty.reward_amount, v_bounty.reward_currency),
      'bounty_completed',
      format('/work/%s', p_bounty_id)
    );

  ELSIF p_status = 'revision_requested' THEN
    -- Return bounty to in_progress
    UPDATE public.bounties
    SET status = 'in_progress', updated_at = NOW()
    WHERE id = p_bounty_id;

    -- Record activity
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

    -- Notify developer
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

-- 4. WITHDRAW PROPOSAL
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

  UPDATE public.applications
  SET status = 'withdrawn', updated_at = NOW()
  WHERE id = p_application_id;

  -- Decrement applications count
  UPDATE public.bounties
  SET applications_count = GREATEST(0, applications_count - 1)
  WHERE id = v_application.bounty_id;

  -- Record activity
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

-- 5. FETCH BOUNTY AUDIT ACTIVITY
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
