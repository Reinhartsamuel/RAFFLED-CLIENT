import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { base } from '@reown/appkit/networks'
import { QueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'

// ──────────────────────────────────────────────────────────────────────
// Contract Addresses
// ──────────────────────────────────────────────────────────────────────

export const CONTRACTS = {
  RaffleManager: {
    base: (import.meta.env.VITE_RAFFLE_MANAGER_ADDRESS_BASE || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  },
  MockUSDC: {
    base: '0x49f49CfE89050a8F8E48d3A31E33a8e26Bc80D1d' as const,
  },
} as const

// ──────────────────────────────────────────────────────────────────────
// Wagmi & Reown Setup
// ──────────────────────────────────────────────────────────────────────

// Use the SAME project ID as the working example (appkit-connect-wallet2)
const projectId = '8fae13c2c3be9ccf19dbf5a66ec12f04'

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Set networks - Base ONLY (like working example)
export const networks = [base]

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  ssr: true,
} as any)

export const metadata = {
  name: 'Raffled',
  description: 'On-chain raffles powered by Chainlink VRF',
  url: import.meta.env.VITE_BASE_URL || 'http://localhost:5173',
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
}

// Create wagmi config
export const wagmiConfig = wagmiAdapter.wagmiConfig

// Initialize AppKit hook - call this once in a component rendered INSIDE providers
export function useInitAppKit() {
  const [initialized, setInitialized] = useState(false)
  
  useEffect(() => {
    if (!initialized) {
      createAppKit({
        adapters: [wagmiAdapter],
        networks: [base],
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
      setInitialized(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized])
  
  return initialized
}

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
  if (chainId === 8453) {
    return CONTRACTS.RaffleManager.base
  }
  // Default to Base mainnet
  return CONTRACTS.RaffleManager.base
}

/**
 * Get MockUSDC contract address for the current network
 */
export function getMockUSDCAddress(chainId: number): `0x${string}` {
  if (chainId === 8453) {
    return CONTRACTS.MockUSDC.base
  }
  // Default to Base mainnet
  return CONTRACTS.MockUSDC.base
}

/**
 * Check if the current chain is supported (Base mainnet only)
 */
export function isSupportedChain(chainId: number): boolean {
  return chainId === 8453
}

/**
 * Get network name from chain ID
 */
export function getNetworkName(chainId: number): string {
  if (chainId === 8453) {
    return 'Base'
  }
  return 'Unknown'
}
