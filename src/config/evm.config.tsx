import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { base, baseSepolia } from '@reown/appkit/networks'
import { QueryClient } from '@tanstack/react-query'
import { robinhoodChainTestnet } from './chains/robinhood/robinhoodChainTestnet'
import { robinhoodChain } from './chains/robinhood/robinhoodChain'

// ──────────────────────────────────────────────────────────────────────
// Contract Addresses
// ──────────────────────────────────────────────────────────────────────
export const CONTRACTS = {
  RaffleManager: {
    baseSepolia: '0xc17eee20B4990021bE9cc8eCB7833706465bb8b9' as const,
    base: (import.meta.env.VITE_RAFFLE_MANAGER_ADDRESS_BASE || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  },
  WinrCore: {
    robinhoodChain: import.meta.env.VITE_WINR_CORE_MAINNET_ADDRESS as `0x${string}`,
    robinhoodChainTestnet:import.meta.env.VITE_WINR_CORE_TESTNET_ADDRESS as `0x${string}`,
  },
  MockUSDC: {
    baseSepolia: (import.meta.env.VITE_MOCK_USDC_ADDRESS_SEPOLIA || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    base: '0x49f49CfE89050a8F8E48d3A31E33a8e26Bc80D1d' as const,
    robinhoodChain: '' as const,
    robinhoodChainTestnet: import.meta.env.VITE_MOCK_USDC_ADDRESS_ROBINHOOD_TESTNET as `0x${string}`
  },
} as const

// ──────────────────────────────────────────────────────────────────────
// Wagmi & Reown Setup
// ──────────────────────────────────────────────────────────────────────

const projectId = import.meta.env.VITE_PROJECT_ID || 'b56e18d47c72ab683b10814fe9495694'
const baseSepoliaRpcUrl = import.meta.env.VITE_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'
const robinhoodTestnetRpcUrl = import.meta.env.VITE_ROBINHOOD_TESTNET_RPC_URL
const robinhoodMainnetRpcUrl = import.meta.env.VITE_ROBINHOOD_MAINNET_RPC_URL
const baseMainnetRpcUrl = import.meta.env.VITE_BASE_RPC_URL || 'https://mainnet.base.org'


if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Set networks - Base mainnet first (like working example)
export const networks = [baseSepolia, robinhoodChainTestnet]

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  ssr: false,
})

export const metadata = {
  name: 'Winr.fun',
  description: 'Robinhood On-chain raffles powered by Quiver VRF',
  url: import.meta.env.VITE_BASE_URL || 'https://winr.fun',
  icons: ['https://raffled.tuttilabs.xyz/favicon.ico'],
}

// Create wagmi config
export const wagmiConfig = wagmiAdapter.wagmiConfig

// Create AppKit instance - Base mainnet first (like working example)
createAppKit({
  adapters: [wagmiAdapter],
  networks: [robinhoodChainTestnet],
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
  // Enable EIP-6963 multi-wallet discovery (avoids window.ethereum conflicts)
  enableEIP6963: true,
  // Disable injected wallet detection (uses EIP-6963 instead of window.ethereum)
  enableInjected: false,
  customRpcUrls: {
    'eip155:84532': [
      {
        url: baseSepoliaRpcUrl
      }
    ],
    'eip155:46630': [
      {
        url: robinhoodTestnetRpcUrl
      }
    ],
    'eip155:4663': [
      {
        url: robinhoodMainnetRpcUrl
      }
    ],
    // 'eip155:8453': [
    //   {
    //     url: baseMainnetRpcUrl
    //   }
    // ]
  }
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
  switch (chainId) {
    case 84532:
      return CONTRACTS.RaffleManager.baseSepolia
    case 8453:
      return CONTRACTS.RaffleManager.base
    case 46630:
      return CONTRACTS.WinrCore.robinhoodChainTestnet
    case 4663:
      return CONTRACTS.WinrCore.robinhoodChain
    default:
      return CONTRACTS.WinrCore.robinhoodChainTestnet
  }
}

/**
 * Get MockUSDC contract address for the current network
 */
export function getMockUSDCAddress(chainId: number): `0x${string}` {
  switch (chainId) {
    case 84532:
      return CONTRACTS.MockUSDC.baseSepolia
    case 8453:
      return CONTRACTS.MockUSDC.base
    case 46630:
      return CONTRACTS.MockUSDC.robinhoodChainTestnet
    default:
      return CONTRACTS.MockUSDC.baseSepolia
  }
}

/**
 * Get network name from chain ID
 */
export function getNetworkName(chainId: number): string {
  switch (chainId) {
    case 84532:
      return 'Base Sepolia'
    case 8453:
      return 'Base'
    case 46630:
      return 'Robinhood Chain Testnet'
    case 4663:
      return 'Robinhood Chain'
    default:
      return 'Unknown'
  }
}
