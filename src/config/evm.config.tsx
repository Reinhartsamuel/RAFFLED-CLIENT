import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { base } from '@reown/appkit/networks'
import { QueryClient } from '@tanstack/react-query'

// Project ID from working example
const projectId = '8fae13c2c3be9ccf19dbf5a66ec12f04'
export const networks = [base]

const metadata = {
  name: 'Raffled',
  description: 'On-chain raffles powered by Chainlink VRF',
  url: window.location.origin,
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
}

// Contract addresses
export const CONTRACTS = {
  RaffleManager: {
    base: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  },
  MockUSDC: {
    base: '0x49f49CfE89050a8F8E48d3A31E33a8e26Bc80D1d' as const,  },
} as const

// Create adapter and providers (exactly like working example)
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
})

export const wagmiConfig = wagmiAdapter.wagmiConfig
export const queryClient = new QueryClient()

// Initialize AppKit with analytics disabled to avoid blocking issues
createAppKit({
  adapters: [wagmiAdapter],
  networks: networks as any,
  projectId,
  metadata,
  features: {
    analytics: false,
  },
})

// Helper functions
export function getRaffleManagerAddress(chainId: number): `0x${string}` {
  if (chainId === 8453) {
    return CONTRACTS.RaffleManager.base
  }
  return CONTRACTS.RaffleManager.base
}

export function getMockUSDCAddress(chainId: number): `0x${string}` {
  if (chainId === 8453) {
    return CONTRACTS.MockUSDC.base
  }
  return CONTRACTS.MockUSDC.base
}

export function isSupportedChain(chainId: number): boolean {
  return chainId === 8453
}

export function getNetworkName(chainId: number): string {
  if (chainId === 8453) {
    return 'Base'
  }
  return 'Unknown'
}
