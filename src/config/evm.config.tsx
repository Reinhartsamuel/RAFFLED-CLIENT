import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { base, baseSepolia } from '@reown/appkit/networks'
import { QueryClient } from '@tanstack/react-query'

// ──────────────────────────────────────────────────────────────────────
// Contract Addresses
// ──────────────────────────────────────────────────────────────────────

export const CONTRACTS = {
  RaffleManager: {
    baseSepolia: (import.meta.env.VITE_RAFFLE_MANAGER_ADDRESS_SEPOLIA || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    base: (import.meta.env.VITE_RAFFLE_MANAGER_ADDRESS_BASE || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  },
  MockUSDC: {
    baseSepolia: (import.meta.env.VITE_MOCK_USDC_ADDRESS_SEPOLIA || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    base: '0x49f49CfE89050a8F8E48d3A31E33a8e26Bc80D1d' as const,
  },
} as const

// ──────────────────────────────────────────────────────────────────────
// Wagmi & Reown Setup
// ──────────────────────────────────────────────────────────────────────

const projectId = import.meta.env.VITE_PROJECT_ID || 'b56e18d47c72ab683b10814fe9495694'

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Set networks - Base mainnet first (like working example)
export const networks = [base, baseSepolia]

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  ssr: false,
})

export const metadata = {
  name: 'Raffled',
  description: 'On-chain raffles powered by Chainlink VRF',
  url: import.meta.env.VITE_BASE_URL || 'http://localhost:5173',
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
}

// Create wagmi config
export const wagmiConfig = wagmiAdapter.wagmiConfig

// Create AppKit instance - Base mainnet first (like working example)
createAppKit({
  adapters: [wagmiAdapter],
  networks: [base, baseSepolia],
  projectId,
  metadata,
  features: {
    analytics: true,
  },
  themeVariables: {
    '--w3m-accent': '#DFFF00',
    '--w3m-color-mix': '#000000',
    '--w3m-color-mix-strength': 25,
    '--w3m-border-radius-master': '0px',
    '--w3m-font-family': "'JetBrains Mono', monospace",
  },
  themeMode: 'dark',
})

// ──────────────────────────────────────────────────────────────────────
// React Query Setup
// ──────────────────────────────────────────────────────────────────────

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 seconds
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
    },
  },
})

// ──────────────────────────────────────────────────────────────────────
// Helper Functions
// ──────────────────────────────────────────────────────────────────────

/**
 * Get the RaffleManager contract address for the current network
 */
export function getRaffleManagerAddress(chainId: number): `0x${string}` {
  if (chainId === 84532) {
    return CONTRACTS.RaffleManager.baseSepolia
  }
  if (chainId === 8453) {
    return CONTRACTS.RaffleManager.base
  }
  return CONTRACTS.RaffleManager.baseSepolia
}

/**
 * Get MockUSDC contract address for the current network
 */
export function getMockUSDCAddress(chainId: number): `0x${string}` {
  if (chainId === 84532) {
    return CONTRACTS.MockUSDC.baseSepolia
  }
  if (chainId === 8453) {
    return CONTRACTS.MockUSDC.base
  }
  return CONTRACTS.MockUSDC.baseSepolia
}

/**
 * Check if the current chain is supported
 */
export function isSupportedChain(chainId: number): boolean {
  return chainId === 84532 || chainId === 8453
}

/**
 * Get network name from chain ID
 */
export function getNetworkName(chainId: number): string {
  if (chainId === 84532) {
    return 'Base Sepolia'
  }
  if (chainId === 8453) {
    return 'Base'
  }
  return 'Unknown'
}
