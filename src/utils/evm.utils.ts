import { formatUnits, parseUnits, getAddress, type Address } from 'viem'

/**
 * Format address for display (0x1234...5678)
 */
export function formatAddress(address: Address, chars = 4): string {
  try {
    const checksummed = getAddress(address)
    return `${checksummed.slice(0, 2 + chars)}...${checksummed.slice(-chars)}`
  } catch {
    return address
  }
}

/**
 * Format token amount with appropriate decimals
 */
export function formatTokenAmount(
  amount: bigint,
  decimals: number = 18,
  displayDecimals: number = 2
): string {
  const formatted = formatUnits(amount, decimals)
  const num = Number(formatted)

  if (num === 0) return '0'
  if (num < 0.01) return num.toExponential(2)

  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: displayDecimals,
  })
}

/**
 * Parse human readable amount to bigint
 */
export function parseTokenAmount(amount: string, decimals: number = 18): bigint {
  try {
    return parseUnits(amount, decimals)
  } catch {
    return BigInt(0)
  }
}

/**
 * Format timestamp to readable date
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Calculate time remaining from Unix timestamp
 */
export function getTimeRemaining(expiryTimestamp: number): {
  remaining: number
  days: number
  hours: number
  minutes: number
  isExpired: boolean
} {
  const now = Math.floor(Date.now() / 1000)
  const remaining = Math.max(0, expiryTimestamp - now)
  const isExpired = remaining === 0

  const days = Math.floor(remaining / 86400)
  const hours = Math.floor((remaining % 86400) / 3600)
  const minutes = Math.floor((remaining % 3600) / 60)

  return { remaining, days, hours, minutes, isExpired }
}

/**
 * Format time remaining as readable string
 * e.g. "2 days, 3 hours"
 */
export function formatTimeRemaining(expiryTimestamp: number): string {
  const { days, hours, minutes, isExpired } = getTimeRemaining(expiryTimestamp)

  if (isExpired) return 'Ended'

  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)

  return parts.length > 0 ? parts.join(' ') : 'Less than a minute'
}

/**
 * Format progress percentage with color
 */
export function getProgressColor(percentage: number): 'success' | 'warning' | 'danger' {
  if (percentage >= 80) return 'danger'
  if (percentage >= 50) return 'warning'
  return 'success'
}

/**
 * Check if address is valid Ethereum address
 */
export function isValidAddress(address: string): boolean {
  try {
    getAddress(address)
    return true
  } catch {
    return false
  }
}

/**
 * Check if chain ID is supported
 */
export function isSupportedChain(chainId: number): boolean {
  return [84532, 8453].includes(chainId) // Base Sepolia, Base
}

/**
 * Format transaction hash for display
 */
export function formatTxHash(hash: string, chars = 6): string {
  return `${hash.slice(0, 2 + chars)}...${hash.slice(-chars)}`
}

/**
 * Get blockchain explorer URL for transaction
 */
export function getExplorerUrl(hash: string, chainId: number): string {
  const explorers: { [key: number]: string } = {
    84532: 'https://sepolia.basescan.org', // Base Sepolia
    8453: 'https://basescan.org', // Base
  }

  const explorer = explorers[chainId] || 'https://etherscan.io'
  return `${explorer}/tx/${hash}`
}

/**
 * Get blockchain explorer URL for address
 */
export function getAddressExplorerUrl(address: Address, chainId: number): string {
  const explorers: { [key: number]: string } = {
    84532: 'https://sepolia.basescan.org', // Base Sepolia
    8453: 'https://basescan.org', // Base
  }

  const explorer = explorers[chainId] || 'https://etherscan.io'
  return `${explorer}/address/${address}`
}

/**
 * Parse error message from contract revert
 */
export function parseErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message

    // Parse common error patterns
    if (message.includes('InvalidParams')) return 'Invalid parameters provided'
    if (message.includes('RaffleNotOpen')) return 'This raffle is not open'
    if (message.includes('MaxCapReached')) return 'Maximum tickets reached'
    if (message.includes('InsufficientPayment')) return 'Insufficient payment amount'
    if (message.includes('RaffleNotExpired')) return 'Raffle has not expired yet'
    if (message.includes('CannotCancelFilledRaffle')) return 'Cannot cancel a filled raffle'
    if (message.includes('User rejected')) return 'You rejected the transaction'

    return message
  }

  return 'An unknown error occurred'
}

/**
 * Convert duration in days to seconds
 */
export function daysToSeconds(days: number): number {
  return days * 24 * 60 * 60
}

/**
 * Convert duration in seconds to days
 */
export function secondsToDays(seconds: number): number {
  return seconds / (24 * 60 * 60)
}

/**
 * Validate raffle parameters
 */
export function validateRaffleParams(params: {
  prizeAmount: string
  ticketPrice: string
  maxCap: string
  duration: string
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  const prizeAmount = Number(params.prizeAmount)
  const ticketPrice = Number(params.ticketPrice)
  const maxCap = Number(params.maxCap)
  const duration = Number(params.duration)

  if (isNaN(prizeAmount) || prizeAmount <= 0) {
    errors.push('Prize amount must be a positive number')
  }

  if (isNaN(ticketPrice) || ticketPrice <= 0) {
    errors.push('Ticket price must be a positive number')
  }

  if (isNaN(maxCap) || maxCap <= 0 || !Number.isInteger(maxCap)) {
    errors.push('Max tickets must be a positive integer')
  }

  if (maxCap > 1_000_000) {
    errors.push('Max tickets cannot exceed 1,000,000')
  }

  if (isNaN(duration) || duration <= 0 || !Number.isInteger(duration)) {
    errors.push('Duration must be a positive integer')
  }

  if (duration > 365) {
    errors.push('Duration cannot exceed 365 days')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Format large numbers with K, M, B suffix
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + 'B'
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M'
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K'
  }
  return num.toString()
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      const delay = baseDelay * Math.pow(2, i)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw new Error('Max retries exceeded')
}
