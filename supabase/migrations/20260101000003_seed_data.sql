-- ====================================================================
-- MIGRATION 000003: SEED DATA FIXTURES
-- ====================================================================

-- Insert sample profiles (matching UUIDs if created in auth or standalone demo)
INSERT INTO public.profiles (
  id,
  username,
  display_name,
  avatar_url,
  bio,
  skills,
  github_url,
  portfolio_url,
  wallet_address,
  bounties_completed,
  total_earned_usd
)
VALUES 
  (
    '00000000-0000-0000-0000-000000000001',
    'satoshi_builder',
    'Satoshi Builder',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'Fullstack Web3 Engineer & Protocol Designer. Crafting cryptographic primitives and high-polish decentralized products.',
    ARRAY['Solidity', 'TypeScript', 'React', 'Rust', 'Foundry', 'Tailwind CSS', 'ZK Proofs'],
    'https://github.com/satoshibuilder',
    'https://satoshi.vaultwork.eth',
    '0x71C2a8B87e452a23C4498B9d8E7A034179e83120',
    8,
    34500
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'uniswap_labs',
    'Uniswap Ecosystem Guild',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    'Fostering permissionless AMM architecture and innovative liquidity primitives across Ethereum L2s.',
    ARRAY['Solidity', 'AMM', 'DeFi', 'Foundry'],
    'https://github.com/uniswap',
    'https://uniswap.org',
    '0x1A4F9E2b781B840901e1bB4513E8fE1a98079F21',
    42,
    198000
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'aave_grants',
    'Aave Grants DAO',
    'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=150&auto=format&fit=crop&q=80',
    'Community-led grants program funding developers and researchers expanding the Aave liquidity protocol.',
    ARRAY['Solidity', 'Lending', 'Governance', 'Security'],
    'https://github.com/aave',
    'https://aavegrants.org',
    '0x3D2c9F818a7bB700c2E5616a2F091De6F2B8E11C',
    31,
    145000
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'alex_sol',
    'Alex Vance',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    'Zero-knowledge cryptography enthusiast and EVM gas golf champion. 5+ years building DeFi.',
    ARRAY['Solidity', 'Circom', 'Foundry', 'TypeScript', 'Rust'],
    'https://github.com/alexvance-zk',
    'https://alexvance.dev',
    '0x44B1270921CcD840810B8D4e21a81E4801C190E5',
    15,
    54000
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    'elena_chain',
    'Elena Rostova',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    'Senior Frontend & Smart Contract Engineer. Specializing in WebSockets, Viem, Wagmi, and modern UI.',
    ARRAY['React', 'TypeScript', 'Tailwind CSS', 'Viem', 'Next.js'],
    'https://github.com/elenarostova',
    'https://elena.web3.bio',
    '0x88F021B903829C170942F18e98C710182E4421C9',
    11,
    38200
  )
ON CONFLICT (id) DO NOTHING;

-- Insert sample bounties
INSERT INTO public.bounties (
  id,
  creator_id,
  title,
  short_summary,
  description,
  category,
  skills,
  reward_amount,
  reward_currency,
  deadline,
  deliverables,
  acceptance_criteria,
  repo_url,
  status,
  assigned_developer_id,
  applications_count
)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000002',
    'Uniswap V4 Custom Dynamic Fee Hook for Volatility Hedging',
    'Architect a production-grade Uniswap v4 Hook implementing TWAP-based volatility surge pricing to protect liquidity providers.',
    'Implement beforeSwap and afterSwap lifecycle callbacks in Solidity with TWAP volatility calculation and sub-18,000 gas constraint.',
    'DeFi / Protocol',
    ARRAY['Solidity', 'Uniswap v4', 'Foundry', 'Gas Optimization'],
    7500,
    'USDC',
    NOW() + INTERVAL '14 days',
    '- GitHub repository with Foundry suite\n- Fuzz test suite & gas benchmark report\n- Deployment scripts',
    '- Passes CI with zero warnings\n- Gas delta verified under 18k units\n- Slither audit clean',
    'https://github.com/uniswap/v4-template',
    'open',
    NULL,
    1
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000003',
    'Interactive Zero-Knowledge Groth16 SnarkJS React Component Suite',
    'Interactive in-browser client proving suite with WebAssembly multi-threading, Circom circuit verification and visual memory profiling.',
    'React 19 / TypeScript SDK compatible with modern Vite and Next.js applications with Web Worker offloading for witness generation.',
    'Frontend / UI',
    ARRAY['React', 'TypeScript', 'SnarkJS', 'Circom', 'Web Workers', 'Tailwind CSS'],
    4200,
    'USDC',
    NOW() + INTERVAL '9 days',
    '- NPM package monorepo\n- Interactive Storybook documentation\n- Example demo app proving Merkle membership',
    '- Responsive across mobile and desktop\n- Proves 10-depth Merkle tree in < 2.5s\n- Strict TypeScript',
    'https://github.com/aave/zk-portal-bounty',
    'open',
    NULL,
    0
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000001',
    'Cross-Chain State Sync Bridge Relayer & Monitoring Telemetry Dashboard',
    'Build a fullstack telemetry dashboard and alerting service monitoring optimistic state sync packets between Arbitrum and Base.',
    'Next.js / Vite dashboard connecting to RPC nodes with live packet latency metrics and automated alerts.',
    'Fullstack',
    ARRAY['TypeScript', 'React', 'Node.js', 'LayerZero', 'Tailwind CSS'],
    6000,
    'USDC',
    NOW() + INTERVAL '5 days',
    '- Fullstack dashboard source code\n- Automated RPC heartbeat crawler script\n- Setup instructions',
    '- Live packet latency metrics updated via WebSockets\n- Zero missed alerts in 48-hour soak test',
    'https://github.com/satoshibuilder/state-sync-dashboard',
    'in_review',
    '00000000-0000-0000-0000-000000000005',
    1
  )
ON CONFLICT (id) DO NOTHING;

-- Insert active assignment for bounty 3
INSERT INTO public.assignments (
  bounty_id,
  developer_id,
  status,
  assigned_at
)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '00000000-0000-0000-0000-000000000005',
  'active',
  NOW() - INTERVAL '5 days'
)
ON CONFLICT (bounty_id) DO NOTHING;
