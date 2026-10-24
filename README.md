# Vaultwork — Premium Web3 Bounty Marketplace & Complete Backend

Vaultwork is a production-grade Web3 bounty marketplace connecting decentralized protocols, foundations, and founders with elite smart contract, zero-knowledge, and fullstack developers.

The platform implements a **dual-role account model** where any registered builder can simultaneously commission new bounties as a Creator and submit proposals to other projects as a Developer without artificial account mode barriers or mutually exclusive roles.

---

## 🏗 Architecture & Technologies

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, React Router v7, Lucide React, Sonner toasts
- **Authentication**: Supabase Auth (Email + Password signup, login, session recovery, password reset)
- **Database**: Supabase PostgreSQL with version-controlled SQL migrations
- **Security & Authorization**: Comprehensive Row Level Security (RLS) on all exposed tables, protected profile field database triggers, and `SECURITY DEFINER` atomic RPC transactions
- **Testing**: Automated integration test suites powered by Vitest (`npm test`)

---

## 🗄 Database Schema & Migrations

Database migrations are located in `supabase/migrations/` and unified into `supabase/schema.sql` for turnkey execution.

### 1. `profiles`
References `auth.users(id) ON DELETE CASCADE`.
- `id` (UUID PK): Matches authenticated user ID.
- `username` (TEXT UNIQUE NOT NULL): Public handle.
- `display_name` (TEXT NOT NULL): Public display name.
- `avatar_url` (TEXT): Profile photo.
- `bio` (TEXT): Developer/creator background.
- `skills` (TEXT[]): Technical skill tags.
- `github_url`, `portfolio_url`, `wallet_address` (TEXT): Identity & Web3 links.
- `bounties_completed` (INT DEFAULT 0): Completed delivery counter.
- `total_earned_usd` (NUMERIC DEFAULT 0): Lifetime milestone earnings.
- `created_at`, `updated_at` (TIMESTAMPTZ).
> **Security Guard**: Database trigger `trg_guard_profile_fields` prevents client updates from tampering with `bounties_completed` or `total_earned_usd`. Only internal system RPC operations can increment these metrics.

### 2. `bounties`
Bounty specifications, rewards, and status.
- `id` (UUID PK): Auto-generated UUID.
- `creator_id` (UUID NOT NULL REFERENCES profiles): Bounty author.
- `title`, `short_summary`, `description` (TEXT): Work specifications.
- `category` (TEXT): Enum-constrained category (`Smart Contracts`, `Frontend / UI`, `Fullstack`, `Security / Audit`, `Design / UX`, `DeFi / Protocol`, `DevOps / Infra`).
- `skills` (TEXT[]): Technical skill requirements (indexed with GIN).
- `reward_amount` (NUMERIC NOT NULL CHECK > 0), `reward_currency` (USDC, USDT, ETH, SOL).
- `deadline` (TIMESTAMPTZ NOT NULL).
- `deliverables`, `acceptance_criteria` (TEXT NOT NULL).
- `status` (TEXT): Lifecycle state (`draft`, `open`, `in_progress`, `in_review`, `completed`, `cancelled`).
- `assigned_developer_id` (UUID REFERENCES profiles): Selected builder.
- `applications_count` (INT DEFAULT 0): Auto-maintained via database trigger.

### 3. `applications`
Developer proposals submitted to open bounties.
- `id` (UUID PK): Auto-generated.
- `bounty_id` (UUID NOT NULL REFERENCES bounties ON DELETE CASCADE).
- `developer_id` (UUID NOT NULL REFERENCES profiles ON DELETE CASCADE).
- `cover_letter`, `relevant_experience` (TEXT NOT NULL).
- `estimated_delivery_days` (INT NOT NULL CHECK 1..180).
- `portfolio_link` (TEXT), `links` (TEXT[]).
- `status` (TEXT): (`pending`, `accepted`, `rejected`, `withdrawn`).
- **Constraints**: `UNIQUE (bounty_id, developer_id)` ensures developers can only submit one proposal per bounty. Self-applications are rejected by RLS.

### 4. `assignments`
Explicit relation representing the active bounty engagement.
- `id` (UUID PK).
- `bounty_id` (UUID NOT NULL REFERENCES bounties UNIQUE).
- `developer_id` (UUID NOT NULL REFERENCES profiles).
- `status` (TEXT): (`active`, `completed`, `cancelled`).
- `assigned_at`, `completed_at` (TIMESTAMPTZ).

### 5. `submissions`
Workroom deliverable packages and revision history.
- `id` (UUID PK).
- `bounty_id` (UUID NOT NULL REFERENCES bounties).
- `developer_id` (UUID NOT NULL REFERENCES profiles).
- `submission_notes` (TEXT NOT NULL), `deliverable_urls` (TEXT[]), `github_pr_url` (TEXT).
- `status` (TEXT): (`submitted`, `revision_requested`, `approved`).
- `feedback` (TEXT): Creator review comments.

### 6. `notifications`
Real-time user alerts and updates.
- `id` (UUID PK), `user_id` (UUID NOT NULL REFERENCES profiles).
- `title`, `message`, `type`, `link`, `read` (BOOLEAN DEFAULT FALSE).

### 7. `activity_events`
Immutable audit log of all critical state transitions.
- `bounty_id`, `actor_id`, `event_type`, `details` (JSONB), `created_at`.

---

## 🔒 Row Level Security (RLS) Policies

All 7 tables have Row Level Security enabled:

| Table | SELECT | INSERT | UPDATE | DELETE |
| :--- | :--- | :--- | :--- | :--- |
| `profiles` | Public (all users) | System trigger on signup | Owner only (`auth.uid() = id`) | Disallowed |
| `bounties` | Published (`status != 'draft'`) or Creator | Authenticated creator (`auth.uid() = creator_id`) | Creator only (`auth.uid() = creator_id`) | Creator only |
| `applications` | Applicant or Bounty Creator | Developer applying to open bounty (`creator_id != auth.uid()`) | Applicant (withdraw) or Creator (review) | Applicant |
| `assignments` | Creator or Assigned Developer | Security Definer RPC | Security Definer RPC | Disallowed |
| `submissions` | Creator or Assigned Developer | Assigned Developer (`status = 'in_progress'`) | Creator (review) | Disallowed |
| `notifications` | Recipient user only (`auth.uid() = user_id`) | System / RPC | Recipient user only (mark as read) | Recipient user |
| `activity_events`| Participants & Public for published bounties | System / RPC | Disallowed (Immutable) | Disallowed |

---

## ⚡ Atomic PostgreSQL RPC Workflow Functions

Critical transitions are secured by server-side `SECURITY DEFINER` functions with search path isolation (`SET search_path = public, pg_temp`):

1. **`select_bounty_developer(p_bounty_id, p_application_id)`**:
   - Executes `SELECT ... FROM public.bounties FOR UPDATE` to lock the bounty row and prevent race conditions.
   - Enforces creator authorization and checks `status = 'open'`.
   - Atomically updates the chosen application to `accepted`.
   - Atomically transitions all other pending applications for that bounty to `rejected`.
   - Inserts the `assignments` row and transitions bounty status to `in_progress`.
   - Records an `activity_event` and dispatches a notification to the selected developer.

2. **`submit_bounty_deliverable(p_bounty_id, p_notes, p_deliverable_urls, p_github_pr_url)`**:
   - Verifies caller is the assigned developer (`assigned_developer_id = auth.uid()`).
   - Inserts submission iteration.
   - Transitions bounty to `in_review`.
   - Records audit event and notifies creator.

3. **`review_bounty_submission(p_submission_id, p_bounty_id, p_status, p_feedback)`**:
   - Verifies caller is the bounty creator.
   - If `status = 'revision_requested'`: returns bounty to `in_progress`, saves feedback, and alerts developer.
   - If `status = 'approved'`: marks bounty and assignment as `completed`, temporarily sets configuration flag to update developer's protected metrics (`bounties_completed += 1`, `total_earned_usd += reward`), and alerts developer of escrow release.

4. **`withdraw_bounty_application(p_application_id)`**:
   - Allows an applicant to withdraw their pending proposal before selection.

5. **`get_bounty_activity(p_bounty_id)`**:
   - Returns chronological audit log of milestones and actions for the bounty workroom.

---

## 🛡 Smart-Contract Escrow Boundary

Vaultwork distinguishes transparently between simulated application workflows and genuine decentralized on-chain contracts:
- **Current State**: Milestone escrow status is tracked securely in the database with strict RLS and cryptographic authentication.
- **Smart Contract Roadmap**:
  - ERC-20 / USDC deposit and milestone release smart contract on Arbitrum One & Base.
  - Multi-signature or arbitration timeout clauses for dispute resolution.
  - Event indexers reconciling on-chain vault deposits with database assignments.
- **Transparency Notice**: The UI and API do not claim trustless on-chain finality until the genuine audited contract is deployed on mainnet. No private keys are ever collected or stored.

---

## 🚀 Setup & Installation

### 1. Prerequisites
- Node.js 18+ (tested on Node v22)
- npm 9+

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Provide your Supabase credentials:
```ini
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
*(If left empty, Vaultwork automatically runs in offline sandbox mode with full local storage simulation).*

### 4. Supabase Database Setup
1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Run the migrations in order:
   - `supabase/migrations/20260101000000_core_tables.sql`
   - `supabase/migrations/20260101000001_rls_policies.sql`
   - `supabase/migrations/20260101000002_rpc_workflow_functions.sql`
   - *(Optional demo data)*: `supabase/migrations/20260101000003_seed_data.sql`
   *(Or run the combined turnkey script: `supabase/schema.sql`)*.
4. **Auth Redirect URLs**:
   In **Authentication > URL Configuration > Redirect URLs**, add:
   - `http://localhost:5173/reset-password`
   - `http://localhost:5173/auth/callback`
   - `https://your-production-domain.com/reset-password`

### 5. Running the Application
```bash
# Start local development server
npm run dev

# Run automated backend & security test suite
npm test

# Build production bundle
npm run build

# Preview production build
npm run preview
```

---

## 🧪 Testing & Multi-Account Acceptance Checklist

### Automated Test Suite
Run the 55 automated integration tests:
```bash
npm test
```
The test suite validates:
1. Multi-account registration and profile isolation.
2. Dual-role functionality (user acting as creator and developer).
3. Search queries, category filters, skill array containment, reward ranges, sorting, and pagination.
4. Proposal constraints: duplicate prevention, self-application rejection, expired deadline rejection.
5. Concurrency-safe developer selection and peer rejection via atomic RPCs.
6. Deliverable submission, revision requests, resubmissions, and final approval.
7. RLS security rules, protected profile fields, and workroom privacy.

### Manual Two-Account Acceptance Checklist

| Step | Action | Account A (Creator) | Account B (Developer) |
| :--- | :--- | :--- | :--- |
| **1** | Registration & Login | Signs up as `creator@vaultwork.xyz` | Signs up as `developer@vaultwork.xyz` in separate window/incognito |
| **2** | Commission Bounty | Navigates to `/bounties/new`, fills in title, criteria, 2,500 USDC reward, future deadline, and publishes | — |
| **3** | Explore & Discover | — | Refreshes `/bounties`, searches for bounty by keyword/skill, opens details page |
| **4** | Submit Proposal | — | Fills out proposal with experience and timeline; clicks **Submit Proposal** |
| **5** | Review Proposal | Receives toast & notification; navigates to `/dashboard` or bounty detail to review proposal | Sees proposal marked `pending` in `/my-work` |
| **6** | Select Developer | Clicks **Select Candidate**; atomic RPC executes | Receives **Proposal Accepted! 🎉** notification; bounty moves to **Active Work** |
| **7** | Submit Deliverables | — | Opens `/work/:id`, submits GitHub PR link & deliverable notes |
| **8** | Request Revision | Inspects work in `/work/:id`, requests revision with comments | Receives **Revision Requested** notification; updates deliverables and resubmits |
| **9** | Approve & Complete | Reviews revised submission, clicks **Approve & Release Payment** | Work approved with celebratory confetti; profile earnings incremented |
| **10**| Security Verifications| Cannot select developer twice; unauthorized third parties cannot access private workroom | Cannot edit Account A's bounty or tamper with earnings metrics |

---

## 🔧 Troubleshooting Guide

### 1. `new row violates row-level security policy for table "bounties"`
- **Cause**: Trying to insert a bounty where `creator_id` does not match the authenticated session UID.
- **Fix**: Ensure user is logged in before creating bounties (`auth.uid() = creator_id`).

### 2. `Creators cannot apply to their own bounties`
- **Cause**: Attempting to submit a proposal to a bounty where `creator_id = auth.uid()`.
- **Fix**: Use a separate developer user account to apply.

### 3. `Failed to fetch / Connection Refused`
- **Cause**: Missing or incorrect `VITE_SUPABASE_URL` in `.env`.
- **Fix**: Check that `.env` has your valid project URL and anon key, then restart the Vite dev server.

### 4. `Password reset email not received`
- **Cause**: Redirect URL not whitelisted in Supabase dashboard.
- **Fix**: Add `http://localhost:5173/reset-password` under **Authentication > URL Configuration > Redirect URLs**.
