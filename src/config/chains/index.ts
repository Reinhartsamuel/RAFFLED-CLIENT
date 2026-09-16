import { baseSepolia } from 'viem/chains'
import { robinhoodChain } from './robinhood/robinhoodChain'
import { robinhoodChainTestnet } from './robinhood/robinhoodChainTestnet'

export { robinhoodChain, robinhoodChainTestnet }

/**
 * Canonical chain metadata. This is the single source of truth for chain names
 * and block explorer URLs — do not hardcode explorers anywhere else.
 */
export interface ChainMetadata {
  id: number
  name: string
  explorerUrl: string
}

interface ExplorerLike {
  id: number
  name: string
  blockExplorers?: { default?: { url?: string } }
}

function toMetadata(chain: ExplorerLike): ChainMetadata {
  return {
    id: chain.id,
    name: chain.name,
    explorerUrl: chain.blockExplorers?.default?.url?.replace(/\/+$/, '') ?? '',
  }
}

export const CHAIN_METADATA: Record<number, ChainMetadata> = {
  [baseSepolia.id]: toMetadata(baseSepolia),
  [robinhoodChainTestnet.id]: toMetadata(robinhoodChainTestnet),
  [robinhoodChain.id]: toMetadata(robinhoodChain),
}

/**
 * Chain the app falls back to when the connected wallet is on an unconfigured chain.
 */
export const DEFAULT_CHAIN = robinhoodChainTestnet
export const DEFAULT_CHAIN_ID = Number(DEFAULT_CHAIN.id)

export function getChainMetadata(chainId: number | undefined): ChainMetadata {
  if (chainId !== undefined && CHAIN_METADATA[chainId]) return CHAIN_METADATA[chainId]
  return CHAIN_METADATA[DEFAULT_CHAIN_ID]
}

export function getNetworkName(chainId: number | undefined): string {
  return getChainMetadata(chainId).name
}

/**
 * Block explorer base URL (no trailing slash) for the given chain, falling back
 * to the default chain so we never link to a stale explorer.
 */
export function getExplorerBaseUrl(chainId: number | undefined): string {
  return getChainMetadata(chainId).explorerUrl
}

export function getTxExplorerUrl(chainId: number | undefined, hash: string): string {
  return `${getExplorerBaseUrl(chainId)}/tx/${hash}`
}

export function getAddressExplorerUrl(chainId: number | undefined, address: string): string {
  return `${getExplorerBaseUrl(chainId)}/address/${address}`
}

export function getTokenExplorerUrl(chainId: number | undefined, token: string): string {
  return `${getExplorerBaseUrl(chainId)}/token/${token}`
}

/**
 * Explorer base URL for the default (active) chain — use this for data that is
 * not tied to the connected wallet, e.g. backend-indexed raffle records.
 */
export const DEFAULT_EXPLORER_URL = getExplorerBaseUrl(DEFAULT_CHAIN_ID)
