import { Profile, Bounty, Application, Submission, Notification } from '../types/database'

export const DEMO_USER: Profile = {
  id: '00000000-0000-0000-0000-000000000001',
  username: 'satoshi_builder',
  display_name: 'Satoshi Builder',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  bio: 'Fullstack Web3 Engineer & Protocol Designer. Crafting cryptographic primitives and high-polish decentralized products.',
  skills: ['Solidity', 'TypeScript', 'React', 'Rust', 'Foundry', 'Tailwind CSS', 'Next.js', 'ZK Proofs'],
  github_url: 'https://github.com/satoshibuilder',
  portfolio_url: 'https://satoshi.vaultwork.eth',
  wallet_address: '0x71C...498B',
  created_at: '2025-01-15T10:00:00Z',
  bounties_completed: 8,
  total_earned_usd: 34500
}

export const MOCK_PROFILES: Record<string, Profile> = {
  [DEMO_USER.id]: DEMO_USER,
  'creator-1': {
    id: 'creator-1',
    username: 'uniswap_labs',
    display_name: 'Uniswap Ecosystem Guild',
    avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    bio: 'Fostering permissionless AMM architecture and innovative liquidity primitives across Ethereum L2s.',
    skills: ['Solidity', 'AMM', 'DeFi', 'Foundry'],
    github_url: 'https://github.com/uniswap',
    portfolio_url: 'https://uniswap.org',
    wallet_address: '0x1A4...9F21',
    created_at: '2024-08-10T14:30:00Z',
    bounties_completed: 42,
    total_earned_usd: 198000
  },
  'creator-2': {
    id: 'creator-2',
    username: 'aave_grants',
    display_name: 'Aave Grants DAO',
    avatar_url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=150&auto=format&fit=crop&q=80',
    bio: 'Community-led grants program funding developers and researchers expanding the Aave liquidity protocol.',
    skills: ['Solidity', 'Lending', 'Governance', 'Security'],
    github_url: 'https://github.com/aave',
    portfolio_url: 'https://aavegrants.org',
    wallet_address: '0x3D2...8E11',
    created_at: '2024-09-01T12:00:00Z',
    bounties_completed: 31,
    total_earned_usd: 145000
  },
  'creator-3': {
    id: 'creator-3',
    username: 'arbitrum_foundation',
    display_name: 'Arbitrum Foundation',
    avatar_url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=150&auto=format&fit=crop&q=80',
    bio: 'Accelerating layer-2 adoption through open-source tooling, Nitro scaling, and Stylus Rust SDKs.',
    skills: ['Rust', 'Nitro', 'Rollups', 'WebAssembly'],
    github_url: 'https://github.com/arbitrum',
    portfolio_url: 'https://arbitrum.foundation',
    wallet_address: '0x992...33B1',
    created_at: '2024-11-05T09:15:00Z',
    bounties_completed: 55,
    total_earned_usd: 280000
  },
  'dev-1': {
    id: 'dev-1',
    username: 'alex_sol',
    display_name: 'Alex Vance',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    bio: 'Zero-knowledge cryptography enthusiast and EVM gas golf champion. 5+ years building DeFi.',
    skills: ['Solidity', 'Circom', 'Foundry', 'TypeScript', 'Rust'],
    github_url: 'https://github.com/alexvance-zk',
    portfolio_url: 'https://alexvance.dev',
    wallet_address: '0x44B...190E',
    created_at: '2024-10-12T16:20:00Z',
    bounties_completed: 15,
    total_earned_usd: 54000
  },
  'dev-2': {
    id: 'dev-2',
    username: 'elena_chain',
    display_name: 'Elena Rostova',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    bio: 'Senior Frontend & Smart Contract Engineer. Specializing in WebSockets, Viem, Wagmi, and modern UI.',
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Viem', 'Next.js'],
    github_url: 'https://github.com/elenarostova',
    portfolio_url: 'https://elena.web3.bio',
    wallet_address: '0x88F...421C',
    created_at: '2024-12-01T11:45:00Z',
    bounties_completed: 11,
    total_earned_usd: 38200
  }
}

export const INITIAL_BOUNTIES: Bounty[] = [
  {
    id: 'bounty-1',
    creator_id: 'creator-1',
    title: 'Uniswap V4 Custom Dynamic Fee Hook for Volatility Hedging',
    short_summary: 'Architect a production-grade Uniswap v4 Hook implementing TWAP-based volatility surge pricing to protect liquidity providers.',
    description: `### Overview
Uniswap v4's singleton and hook architecture allows custom pools to calculate swap fees dynamically before and after trades. We are seeking an experienced Solidity engineer to implement a production-ready Dynamic Volatility Fee Hook.

### Objectives
1. Implement \`beforeSwap\` and \`afterSwap\` lifecycle callbacks.
2. Calculate short-window Geometric TWAP volatility metrics on-chain.
3. Automatically adjust pool fee between 0.05% (low volatility) and 1.00% (high volatility surge).
4. Maintain strict gas constraints (< 18,000 additional gas per swap).

### Technical Requirements
- Written in modern Solidity (^0.8.24) using Foundry.
- 100% test branch coverage with fuzzing tests (minimum 10,000 runs).
- NatSpec documentation for all public and internal routines.
- Adherence to Solady gas-optimized math libraries.`,
    category: 'DeFi / Protocol',
    skills: ['Solidity', 'Uniswap v4', 'Foundry', 'Gas Optimization'],
    reward_amount: 7500,
    reward_currency: 'USDC',
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    deliverables: '- GitHub repository with clean Foundry suite\n- Comprehensive fuzz test suite & gas benchmark report\n- Deployment script targeting Sepolia & Arbitrum Sepolia',
    acceptance_criteria: '- Passes all CI tests with zero warnings\n- Gas delta verified under 18k units\n- Slither audit report with zero High or Medium severity findings',
    repo_url: 'https://github.com/uniswap/v4-template',
    status: 'open',
    assigned_developer_id: null,
    applications_count: 4,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    creator: MOCK_PROFILES['creator-1']
  },
  {
    id: 'bounty-2',
    creator_id: 'creator-2',
    title: 'Interactive Zero-Knowledge Groth16 SnarkJS React Component Suite',
    short_summary: 'Interactive in-browser client proving suite with WebAssembly multi-threading, Circom circuit verification and visual memory profiling.',
    description: `### Overview
Aave Grants is commissioning a reusable React/TypeScript component library enabling Web3 applications to generate and verify Groth16 zero-knowledge proofs directly in the browser via SnarkJS and WebAssembly.

### Scope
- React 19 / TypeScript SDK compatible with modern Vite and Next.js applications.
- Web Worker offloading for witness generation and proof computation (zero UI freeze).
- Dynamic progress bar tracking cryptographic round calculations.
- Clean Tailwind UI component conforming to dark theme design systems.`,
    category: 'Frontend / UI',
    skills: ['React', 'TypeScript', 'SnarkJS', 'Circom', 'Web Workers', 'Tailwind CSS'],
    reward_amount: 4200,
    reward_currency: 'USDC',
    deadline: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
    deliverables: '- Published NPM package (or production-ready standalone monorepo)\n- Storybook documentation with live interactive playground\n- Example demo app proving Merkle membership',
    acceptance_criteria: '- Responsive across mobile and desktop\n- Proves 10-depth Merkle tree membership in < 2.5s on modern M-series / Intel i7\n- Clean TypeScript types with zero `any`',
    repo_url: 'https://github.com/aave/zk-portal-bounty',
    status: 'open',
    assigned_developer_id: null,
    applications_count: 3,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    creator: MOCK_PROFILES['creator-2']
  },
  {
    id: 'bounty-3',
    creator_id: 'creator-3',
    title: 'ERC-4337 Smart Account Session Key Delegation Module',
    short_summary: 'Secure ephemeral session key validation module for modular smart contract accounts with granular spend and contract call limits.',
    description: `### Context
Account Abstraction enables automated user experiences via session keys. We need an ERC-7579 / ERC-4337 compatible validation module that lets users issue time-bounded, permission-scoped keys to AI agents or companion devices.

### Detailed Scope
1. Validation module verifying ECDSA and Passkey (WebAuthn secp256r1) signatures.
2. Granular permissions: target contract address whitelist, daily spend quota, gas payment limits.
3. Emergency revoke transaction callable by the root account.`,
    category: 'Smart Contracts',
    skills: ['Solidity', 'ERC-4337', 'Account Abstraction', 'EIP-712'],
    reward_amount: 3.5,
    reward_currency: 'ETH',
    deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    deliverables: '- Foundry test suite & smart contract contracts/\n- SDK helper for frontend session creation and message hashing\n- Formal security checklist and invariant tests',
    acceptance_criteria: '- Verified compatibility with Biconomy and Safe smart accounts\n- Validated signature replay protection across chains',
    repo_url: 'https://github.com/arbitrum/session-keys',
    status: 'in_progress',
    assigned_developer_id: 'dev-1',
    applications_count: 5,
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    creator: MOCK_PROFILES['creator-3'],
    assigned_developer: MOCK_PROFILES['dev-1']
  },
  {
    id: 'bounty-4',
    creator_id: DEMO_USER.id,
    title: 'Cross-Chain State Sync Bridge Relayer & Monitoring Telemetry Dashboard',
    short_summary: 'Build a fullstack telemetry dashboard and alerting service monitoring optimistic state sync packets between Arbitrum and Base.',
    description: `### Overview
As creator of this bounty, we are tracking bridge packet latencies, pending challenge windows, and relayer rebalancing health.

### Deliverables
- Next.js / Vite dashboard connecting to RPC nodes
- Visual status timeline of every message transit
- Discord/Telegram webhook alert trigger upon delayed message finalization`,
    category: 'Fullstack',
    skills: ['TypeScript', 'React', 'Node.js', 'LayerZero', 'Tailwind CSS'],
    reward_amount: 6000,
    reward_currency: 'USDC',
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    deliverables: '- Fullstack dashboard source code\n- Automated RPC heartbeat crawler script\n- Setup instructions and Docker compose file',
    acceptance_criteria: '- Live packet latency metrics updated via WebSockets\n- Zero missed alerts in 48-hour soak test',
    repo_url: 'https://github.com/satoshibuilder/state-sync-dashboard',
    status: 'in_review',
    assigned_developer_id: 'dev-2',
    applications_count: 4,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    creator: DEMO_USER,
    assigned_developer: MOCK_PROFILES['dev-2']
  },
  {
    id: 'bounty-5',
    creator_id: 'creator-1',
    title: 'Formal Verification of Liquid Staking Vault Reentrancy Protection',
    short_summary: 'Perform mathematical specification and automated rule verification against yield rebasing attack vectors and cross-function reentrancy.',
    description: `### Goal
Verify that the liquid staking vault cannot be drained through rounding manipulations or flash-loan-induced price divergence. Use Certora Prover or Halmos to create mathematical invariance specifications.`,
    category: 'Security / Audit',
    skills: ['Certora', 'Solidity', 'Formal Methods', 'Security'],
    reward_amount: 12000,
    reward_currency: 'USDC',
    deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
    deliverables: '- Formal CVL specification files\n- Certora Prover run report with all rules verified\n- Written security summary with threat model',
    acceptance_criteria: '- Mathematical proof that vault share redemption value is non-decreasing\n- Zero false positives or unverified axioms',
    repo_url: 'https://github.com/uniswap/vault-formal-specs',
    status: 'open',
    assigned_developer_id: null,
    applications_count: 2,
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    creator: MOCK_PROFILES['creator-1']
  },
  {
    id: 'bounty-6',
    creator_id: 'creator-2',
    title: 'High-Throughput Solana Micro-Bounty Settlement Program',
    short_summary: 'Anchor program with PDA state compression for batch payout of high-frequency development micro-tasks with minimal rent exemption.',
    description: `### Scope
Build an Anchor 0.30+ program implementing compact escrow vaults for Solana micro-bounties. Utilize state compression / Merkle trees to keep rent costs sub-cent per task.`,
    category: 'Smart Contracts',
    skills: ['Rust', 'Anchor', 'Solana', 'Sealevel'],
    reward_amount: 65,
    reward_currency: 'SOL',
    deadline: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(),
    deliverables: '- Anchor program in Rust\n- TypeScript client SDK with tests on local validator\n- Benchmarking report detailing rent and compute units',
    acceptance_criteria: '- Compute units below 25,000 for standard claim instruction\n- Passes security audit checks with Anchor best practices',
    repo_url: 'https://github.com/aave/solana-bounty-settler',
    status: 'open',
    assigned_developer_id: null,
    applications_count: 3,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    creator: MOCK_PROFILES['creator-2']
  },
  {
    id: 'bounty-7',
    creator_id: 'creator-3',
    title: 'Decentralized Escrow Milestone Dispute Protocol & UI Kit',
    short_summary: 'Design and prototype a modular arbitration UI allowing multi-sig jurors to inspect code deliverables, diffs and test logs during disputes.',
    description: `Completed project that established the UX standard for decentralized dispute settlement on Vaultwork.`,
    category: 'Design / UX',
    skills: ['Figma', 'UI/UX', 'Tailwind CSS', 'Design Systems'],
    reward_amount: 45,
    reward_currency: 'SOL',
    deadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    deliverables: '- Interactive Figma design system\n- React + Tailwind component primitives\n- Usability test report with 5 Web3 developers',
    acceptance_criteria: '- Fully responsive mobile & desktop views\n- Accessibility WCAG AA compliance verified',
    repo_url: 'https://github.com/arbitrum/dispute-ui-kit',
    status: 'completed',
    assigned_developer_id: DEMO_USER.id,
    applications_count: 6,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    creator: MOCK_PROFILES['creator-3'],
    assigned_developer: DEMO_USER
  }
]

export const INITIAL_APPLICATIONS: Application[] = [
  {
    id: 'app-1',
    bounty_id: 'bounty-1',
    developer_id: DEMO_USER.id,
    cover_letter: 'I have engineered multiple Uniswap v3 and v4 hook prototypes, including a dynamic fee hook based on pool utilization for the ETHGlobal hackathon. I specialize in assembly-level gas optimization in Foundry.',
    relevant_experience: 'Lead Smart Contract Engineer at DeFi Syndicate. Audited over 15 protocols and authored gas-saving patterns for AMMs.',
    estimated_delivery_days: 7,
    portfolio_link: 'https://github.com/satoshibuilder',
    links: ['https://github.com/satoshibuilder/v4-hook-examples'],
    status: 'pending',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    developer: DEMO_USER,
    bounty: INITIAL_BOUNTIES[0]
  },
  {
    id: 'app-2',
    bounty_id: 'bounty-4',
    developer_id: 'dev-2',
    cover_letter: 'I have built real-time WebSockets telemetry tools for LayerZero and Wormhole bridges. I can deliver a stunning dark-mode dashboard with sub-second RPC latency updates.',
    relevant_experience: 'Senior Frontend Engineer with 4 years in DeFi dashboards and real-time state monitoring.',
    estimated_delivery_days: 6,
    portfolio_link: 'https://github.com/elenarostova',
    links: ['https://elena.web3.bio'],
    status: 'accepted',
    created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    developer: MOCK_PROFILES['dev-2'],
    bounty: INITIAL_BOUNTIES[3]
  },
  {
    id: 'app-3',
    bounty_id: 'bounty-4',
    developer_id: 'dev-1',
    cover_letter: 'I can build the telemetry crawler and backend indexing service using Node.js and SQLite with instant push notifications.',
    relevant_experience: 'Fullstack developer with extensive backend bridge experience.',
    estimated_delivery_days: 8,
    portfolio_link: 'https://github.com/alexvance-zk',
    links: [],
    status: 'rejected',
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    developer: MOCK_PROFILES['dev-1'],
    bounty: INITIAL_BOUNTIES[3]
  },
  {
    id: 'app-4',
    bounty_id: 'bounty-7',
    developer_id: DEMO_USER.id,
    cover_letter: 'I developed this comprehensive dispute kit with clean atomic design and accessible contrast.',
    relevant_experience: 'UX architect for multiple Web3 DAOs.',
    estimated_delivery_days: 14,
    portfolio_link: 'https://github.com/satoshibuilder',
    links: [],
    status: 'accepted',
    created_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    developer: DEMO_USER,
    bounty: INITIAL_BOUNTIES[6]
  }
]

export const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-1',
    bounty_id: 'bounty-4',
    developer_id: 'dev-2',
    submission_notes: `Initial release v1.0.0 ready for review! 
- Integrated Arbitrum and Base websocket listeners
- Interactive packet latency graph with Recharts
- Docker compose with automated relayer health monitoring service
- All unit and integration tests passing (98% coverage)`,
    deliverable_urls: [
      'https://state-sync-preview.vercel.app',
      'https://github.com/elenarostova/state-sync-dashboard'
    ],
    github_pr_url: 'https://github.com/satoshibuilder/state-sync-dashboard/pull/14',
    status: 'submitted',
    feedback: null,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    developer: MOCK_PROFILES['dev-2']
  },
  {
    id: 'sub-2',
    bounty_id: 'bounty-7',
    developer_id: DEMO_USER.id,
    submission_notes: 'All Figma components and React primitives exported and documented.',
    deliverable_urls: ['https://github.com/arbitrum/dispute-ui-kit'],
    github_pr_url: 'https://github.com/arbitrum/dispute-ui-kit/pull/1',
    status: 'approved',
    feedback: 'Exceptional work. Clean architecture, accessible color contrast and zero bugs.',
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    developer: DEMO_USER
  }
]

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    user_id: DEMO_USER.id,
    title: 'Workroom Submission Ready',
    message: 'Elena Rostova submitted deliverables for "Cross-Chain State Sync Bridge Relayer & Monitoring Telemetry Dashboard". Please review the work.',
    type: 'work_submitted',
    link: '/work/bounty-4',
    read: false,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'notif-2',
    user_id: DEMO_USER.id,
    title: 'New Applicant on your Bounty',
    message: 'Alex Vance applied for "Cross-Chain State Sync Bridge Relayer & Monitoring Telemetry Dashboard".',
    type: 'application_received',
    link: '/bounties/bounty-4',
    read: false,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'notif-3',
    user_id: DEMO_USER.id,
    title: 'Bounty Approved & Escrow Released!',
    message: 'Your work on "Decentralized Escrow Milestone Dispute Protocol & UI Kit" was approved by Arbitrum Foundation. 45 SOL released!',
    type: 'bounty_completed',
    link: '/work/bounty-7',
    read: true,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  }
]
