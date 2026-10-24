# Vaultwork — Premium Web3 Bounty Marketplace

Vaultwork is a production-minded Web3-inspired bounty marketplace connecting visionary protocols, DAOs, and founders with elite smart contract, zero-knowledge, and fullstack engineers. 

Built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS**, and **Framer Motion**, it supports dual-role user accounts where every registered builder can seamlessly commission new bounties and apply to other projects with dedicated milestone workrooms.

---

## 🚀 Key Features

### 1. Dual-Role Architecture
- A single account functions as both **Bounty Creator** and **Developer**.
- Dedicated **Creator Hub** (`/dashboard`) to manage commissioned bounties, track candidate proposals, and inspect deliverables.
- Dedicated **Developer Hub** (`/my-work`) to track proposal statuses (pending, accepted, rejected, withdrawn), work deadlines, and completed milestones.

### 2. Milestone Workroom (`/work/:id`)
- Private, permission-scoped collaborative workspaces for assigned developers and creators.
- **Milestone Lifecycle State Machine**: Funded → Assigned → Work Underway → In Review → Approved & Completed.
- GitHub Pull Request, demo URL, and changelog submission.
- Creator review workflows: structured revision requests with feedback, or instant milestone approval and escrow payout with celebratory particle confetti.

### 3. Public Discovery & Discovery Feed (`/bounties`)
- Real-time search across title, description, and technical skill tags.
- Category filtering (`Smart Contracts`, `Frontend / UI`, `Fullstack`, `Security / Audit`, `Design / UX`, `DeFi / Protocol`, `DevOps / Infra`).
- Sorting by newest, highest reward, and nearest deadline.
- Loading skeletons, empty state illustrations, and countdown indicators.

### 4. Verified Bounty Creation (`/bounties/new`)
- Structured multi-section bounty wizard with client-side Zod validation.
- Interactive keyboard-driven technical skills tagging input.
- Clear deliverables and acceptance criteria requirements.
- Save as draft or publish immediately to the network.

### 5. Web3 Wallet & Escrow Simulation
- Interactive wallet modal supporting MetaMask, Phantom (Solana), Coinbase Wallet, and WalletConnect.
- Network switching across Arbitrum One, Ethereum Mainnet, Base, and Solana.
- Address truncation, clipboard copy, and balance tracking.
- Escrow integrity notices ensuring full transparency between testnet contracts and live database state.

### 6. Supabase Integration & Interactive Sandbox
- Complete PostgreSQL schema provided in `supabase/schema.sql` with Row-Level Security (RLS) policies, triggers, and relational foreign keys.
- Automatic detection of `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Built-in persistent local sandbox mode with 1-click test personas (`Creator`, `Developer`, `Dual-Role Builder`) allowing instant evaluation without requiring external database setup.

---

## 🛠 Tech Stack

- **Framework**: React 19 with TypeScript
- **Bundler & Tooling**: Vite 8
- **Styling**: Tailwind CSS v4 with bespoke charcoal & teal visual design system
- **Motion**: Framer Motion
- **Routing**: React Router v7
- **Forms & Validation**: React Hook Form + Zod
- **Icons**: Lucide React + custom SVG brand primitives
- **Notifications**: Sonner toast system
- **Backend**: Supabase (PostgreSQL + Auth + Storage) with localStorage fallback sandbox

---

## 📦 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended; developed and tested on Node v22)
- npm (v9+)

### Installation
```bash
# Clone or navigate to the project directory
cd vault

# Install dependencies
npm install
```

### Environment Configuration
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```

If connecting to your live Supabase project:
```ini
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-public-anon-key
```

> **Note**: If `.env` is left blank or not configured, Vaultwork automatically activates **Interactive Sandbox Mode** with persistent local database state and realistic seed data, allowing you to test every feature immediately.

### Running in Development
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production
```bash
npm run build
```

### Previewing the Production Build
```bash
npm run preview
```

---

## 🗄 Database Setup (Supabase)

To connect your own Supabase instance:
1. Create a free project at [supabase.com](https://supabase.com).
2. Open your project's **SQL Editor**.
3. Copy and execute the contents of `supabase/schema.sql`.
4. Grab your Project URL and Anon Key from **Project Settings > API**.
5. Add them to your `.env` file and restart Vite.

---

## 🎨 Visual Design Tokens

- **Primary Background**: Deep Charcoal (`#101413`)
- **Secondary Surfaces**: Surface Slate (`#191F1D`)
- **Card Surfaces**: Card Charcoal (`#1E2623`)
- **Borders**: Charcoal Gray (`#25302C` / `#2B3632`)
- **Primary Accent**: Electric Teal (`#24D6B1`)
- **Accent Hover**: Vivid Mint (`#1EC09E`)
- **Main Text**: Warm Off-White (`#F4F5F1`)
- **Muted Text**: Mineral Gray (`#8E9894`)
- **Typography**: Display (`Outfit`), Sans (`Plus Jakarta Sans`), Monospace (`JetBrains Mono`)
