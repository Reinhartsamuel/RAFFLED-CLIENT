import type { Address } from 'viem'

/**
 * Raffle status enum
 */
export enum RaffleStatus {
  OPEN = 0,
  CANCELLED = 1,
  COMPLETED = 2,
}

/**
 * On-chain raffle data structure
 */
export interface OnChainRaffle {
  raffleId: number
  host: Address
  expiry: number // Unix timestamp
  status: RaffleStatus
  prizeAsset: Address
  ticketsSold: number
  paymentAsset: Address // address(0) for ETH
  prizeAmount: bigint
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
  prizeAsset: Address | ''
  prizeAmount: string
  paymentAsset: Address | ''
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
 * Raffle event types
 */
export interface RaffleCreatedEvent {
  raffleId: bigint
  host: Address
  prizeAsset: Address
  prizeAmount: bigint
  paymentAsset: Address
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

export interface RaffleCancelledEvent {
  raffleId: bigint
  blockNumber: number
  transactionHash: string
}

export interface RefundClaimedEvent {
  raffleId: bigint
  claimer: Address
  amount: bigint
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
