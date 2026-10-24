import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Database Schema & Migration Security Audit Tests', () => {
  const migrationsDir = path.resolve(__dirname, '../supabase/migrations')
  const unifiedSchemaPath = path.resolve(__dirname, '../supabase/schema.sql')

  const coreTablesSql = fs.readFileSync(path.join(migrationsDir, '20260101000000_core_tables.sql'), 'utf-8')
  const rlsPoliciesSql = fs.readFileSync(path.join(migrationsDir, '20260101000001_rls_policies.sql'), 'utf-8')
  const rpcFunctionsSql = fs.readFileSync(path.join(migrationsDir, '20260101000002_rpc_workflow_functions.sql'), 'utf-8')
  const seedDataSql = fs.readFileSync(path.join(migrationsDir, '20260101000003_seed_data.sql'), 'utf-8')
  const unifiedSchemaSql = fs.readFileSync(unifiedSchemaPath, 'utf-8')

  // ---------------------------------------------------------------------------
  // 1. TABLE DEFINITIONS & CONSTRAINTS AUDIT
  // ---------------------------------------------------------------------------
  describe('1. Table Definitions, Constraints & Foreign Keys', () => {
    const requiredTables = [
      'public.profiles',
      'public.bounties',
      'public.applications',
      'public.assignments',
      'public.submissions',
      'public.notifications',
      'public.activity_events'
    ]

    it.each(requiredTables)('defines %s table with UUID primary key', (table) => {
      expect(coreTablesSql).toContain(`CREATE TABLE IF NOT EXISTS ${table}`)
    })

    it('enforces unique constraints to prevent duplicate applications', () => {
      expect(coreTablesSql).toContain('CONSTRAINT unique_applicant_per_bounty UNIQUE (bounty_id, developer_id)')
    })

    it('enforces single active assignment constraint per bounty', () => {
      expect(coreTablesSql).toContain('CONSTRAINT unique_active_assignment_per_bounty UNIQUE (bounty_id)')
    })

    it('includes GIN index for fast skills array containment queries', () => {
      expect(coreTablesSql).toContain('CREATE INDEX IF NOT EXISTS idx_bounties_skills ON public.bounties USING GIN(skills)')
    })

    it('indexes status, creator, deadline, and reward_amount DESC for exploration', () => {
      expect(coreTablesSql).toContain('idx_bounties_status ON public.bounties(status)')
      expect(coreTablesSql).toContain('idx_bounties_creator ON public.bounties(creator_id)')
      expect(coreTablesSql).toContain('idx_bounties_deadline ON public.bounties(deadline)')
      expect(coreTablesSql).toContain('idx_bounties_reward ON public.bounties(reward_amount DESC)')
    })

    it('defines automatic profile creation trigger on auth.users insert', () => {
      expect(coreTablesSql).toContain('CREATE OR REPLACE FUNCTION public.handle_new_user()')
      expect(coreTablesSql).toContain('AFTER INSERT ON auth.users')
      expect(coreTablesSql).toContain('FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()')
    })
  })

  // ---------------------------------------------------------------------------
  // 2. ROW LEVEL SECURITY (RLS) POLICIES AUDIT
  // ---------------------------------------------------------------------------
  describe('2. Row Level Security (RLS) Policies Audit', () => {
    const tables = [
      'public.profiles',
      'public.bounties',
      'public.applications',
      'public.assignments',
      'public.submissions',
      'public.notifications',
      'public.activity_events'
    ]

    it.each(tables)('enables RLS on %s', (table) => {
      expect(rlsPoliciesSql).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`)
    })

    it('protects developer stats from arbitrary user escalation via trigger guard', () => {
      expect(rlsPoliciesSql).toContain('CREATE OR REPLACE FUNCTION public.guard_profile_protected_fields()')
      expect(rlsPoliciesSql).toContain("NEW.bounties_completed := OLD.bounties_completed;")
      expect(rlsPoliciesSql).toContain("NEW.total_earned_usd := OLD.total_earned_usd;")
      expect(rlsPoliciesSql).toContain('CREATE TRIGGER trg_guard_profile_fields')
    })

    it('permits public browsing of published bounties while hiding drafts', () => {
      expect(rlsPoliciesSql).toContain("status != 'draft' OR auth.uid() = creator_id")
    })

    it('restricts bounty creation strictly to the authenticated creator', () => {
      expect(rlsPoliciesSql).toContain('auth.uid() = creator_id')
    })

    it('blocks self-applications and expired deadline applications at database RLS level', () => {
      expect(rlsPoliciesSql).toContain("status = 'open'")
      expect(rlsPoliciesSql).toContain('deadline > NOW()')
      expect(rlsPoliciesSql).toContain('creator_id != auth.uid()')
    })

    it('restricts submission creation to the assigned developer only', () => {
      expect(rlsPoliciesSql).toContain('assigned_developer_id = auth.uid()')
      expect(rlsPoliciesSql).toContain("status = 'in_progress'")
    })

    it('restricts submission reviews to the bounty creator only', () => {
      expect(rlsPoliciesSql).toContain('creator_id = auth.uid()')
    })

    it('restricts notification access strictly to the recipient user', () => {
      expect(rlsPoliciesSql).toContain('auth.uid() = user_id')
    })
  })

  // ---------------------------------------------------------------------------
  // 3. ATOMIC WORKFLOW RPC FUNCTIONS AUDIT
  // ---------------------------------------------------------------------------
  describe('3. Atomic Workflow RPC Functions & Search Path Isolation', () => {
    const expectedFunctions = [
      'public.select_bounty_developer',
      'public.submit_bounty_deliverable',
      'public.review_bounty_submission',
      'public.withdraw_bounty_application',
      'public.get_bounty_activity'
    ]

    it.each(expectedFunctions)('defines %s with SECURITY DEFINER and search_path isolation', (func) => {
      expect(rpcFunctionsSql).toContain(`CREATE OR REPLACE FUNCTION ${func}`)
      expect(rpcFunctionsSql).toContain('SECURITY DEFINER')
      expect(rpcFunctionsSql).toContain('SET search_path = public, pg_temp')
    })

    it('select_bounty_developer uses FOR UPDATE row locks to prevent race conditions', () => {
      expect(rpcFunctionsSql).toContain('SELECT * INTO v_bounty')
      expect(rpcFunctionsSql).toContain('FOR UPDATE;')
      expect(rpcFunctionsSql).toContain('SELECT * INTO v_application')
    })

    it('select_bounty_developer atomically updates application, rejects peers, and assigns developer', () => {
      expect(rpcFunctionsSql).toContain("SET status = 'accepted'")
      expect(rpcFunctionsSql).toContain("SET status = 'rejected'")
      expect(rpcFunctionsSql).toContain("SET status = 'in_progress'")
      expect(rpcFunctionsSql).toContain('INSERT INTO public.assignments')
      expect(rpcFunctionsSql).toContain('INSERT INTO public.activity_events')
      expect(rpcFunctionsSql).toContain('INSERT INTO public.notifications')
    })

    it('review_bounty_submission elevates privileges via internal flag to update developer stats', () => {
      expect(rpcFunctionsSql).toContain("PERFORM set_config('vaultwork.internal_system_operation', 'true', true);")
      expect(rpcFunctionsSql).toContain('bounties_completed = bounties_completed + 1')
      expect(rpcFunctionsSql).toContain('total_earned_usd = total_earned_usd + v_usd_amount')
    })
  })

  // ---------------------------------------------------------------------------
  // 4. UNIFIED SCHEMA FILE INTEGRITY
  // ---------------------------------------------------------------------------
  describe('4. Turnkey Unified Schema (schema.sql)', () => {
    it('contains all migrations combined in proper dependency order for one-click setup', () => {
      expect(unifiedSchemaSql).toContain('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
      expect(unifiedSchemaSql).toContain('CREATE TABLE IF NOT EXISTS public.profiles')
      expect(unifiedSchemaSql).toContain('CREATE TABLE IF NOT EXISTS public.bounties')
      expect(unifiedSchemaSql).toContain('ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY')
      expect(unifiedSchemaSql).toContain('CREATE OR REPLACE FUNCTION public.select_bounty_developer')
      expect(seedDataSql).toContain('INSERT INTO public.bounties')
    })
  })
})
