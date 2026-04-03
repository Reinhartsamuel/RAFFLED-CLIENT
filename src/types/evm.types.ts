import type { Address } from 'viem'

/**
 * Raffle status enum — RaffleManager3 only has OPEN and COMPLETED.
 */
export enum RaffleStatus {
  OPEN = 0,
  COMPLETED = 1,
}

/**
 * Prize type enum — distinguishes ERC-20 token prizes from ERC-721 NFT prizes.
 */
export enum PrizeType {
  ERC20 = 0,
  ERC721 = 1,
}

/**
 * On-chain raffle data structure (RaffleManager3 layout).
 * Tuple indices returned by raffles(id):
 * [0] host
 * [1] expiry
 * [2] status
 * [3] underfilled
 * [4] prizeType       ← NEW in v3
 * [5] prizeAsset
 * [6] ticketsSold
 * [7] prizeAmountOrTokenId  ← renamed from prizeAmount
 * [8] ticketPrice
 * [9] maxCap
 */
export interface OnChainRaffle {
  raffleId: number
  host: Address
  expiry: number // Unix timestamp
  status: RaffleStatus
  prizeType: PrizeType
  prizeAsset: Address
  ticketsSold: number
  prizeAmountOrTokenId: bigint // ERC-20 amount OR ERC-721 tokenId
  ticketPrice: bigint
  maxCap: number
}

/**
 * Enhanced raffle with calculated fields
 */
export interface RaffleWithMetadata extends OnChainRaffle {
  title?: string
  description?: string
  imageUrl?: string
  ipfsMetadataHash?: string
  createdAt?: number
  timeRemaining: number
  isExpired: boolean
  isFilled: boolean
  progressPercent: number
  winner?: Address
}

/**
 * Transaction state for UI feedback
 */
export type TransactionState = 'idle' | 'pending' | 'success' | 'error'

/**
 * Transaction details for displaying to user
 */
export interface TransactionDetails {
  state: TransactionState
  hash?: string
  error?: Error
  confirmation?: number // 0-100 percent
}

/**
 * Approval flow state
 */
export enum ApprovalStep {
  NOT_STARTED = 'not_started',
  APPROVING = 'approving',
  APPROVED = 'approved',
  FAILED = 'failed',
}

/**
 * Create raffle form data
 */
export interface CreateRaffleFormData {
  prizeType: PrizeType
  prizeAsset: Address | ''
  prizeAmount: string       // ERC-20 only
  prizeTokenId: string      // ERC-721 only
  ticketPrice: string
  maxCap: string
  duration: string // in days
  title: string
  description: string
  image?: File
}

/**
 * Purchase tickets form data
 */
export interface PurchaseTicketsFormData {
  raffleId: number
  quantity: number
  agreeToTerms: boolean
}

/**
 * RaffleCreated event (RaffleManager3)
 */
export interface RaffleCreatedEvent {
  raffleId: bigint
  host: Address
  prizeAsset: Address
  prizeType: PrizeType
  prizeAmountOrTokenId: bigint
  expiry: number
}

export interface TicketPurchasedEvent {
  raffleId: bigint
  buyer: Address
  ticketCount: bigint
  blockNumber: number
  transactionHash: string
}

export interface WinnerPickedEvent {
  raffleId: bigint
  winner: Address
  blockNumber: number
  transactionHash: string
}

/**
 * User raffle data (for my raffles view)
 */
export interface UserRaffleData {
  raffle: RaffleWithMetadata
  ticketsSold: number
  totalRevenue: bigint // ticketPrice * ticketsSold
  participants: Address[]
  winner?: Address
}

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
  rank: number
  address: Address
  tickets: number
  spent: bigint
}
