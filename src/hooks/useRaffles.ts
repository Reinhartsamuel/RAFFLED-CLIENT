import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { type Address } from 'viem'
import { useRaffleCount } from './useRaffleContract'
import { queryClient } from '../config/evm.config'

/**
 * Raffle data structure parsed from on-chain
 */
export interface ParsedRaffle {
  raffleId: number
  host: Address
  expiry: number
  status: 0 | 1 | 2 // 0=OPEN, 1=CANCELLED, 2=COMPLETED
  prizeAsset: Address
  ticketsSold: number
  paymentAsset: Address
  prizeAmount: bigint
  ticketPrice: bigint
  maxCap: number
  timeRemaining: number // seconds
  isExpired: boolean
  isFilled: boolean
  progressPercent: number
}

/**
 * Fetch all raffles on-chain
 * Uses React Query for caching and automatic refetching
 */
export function useAllRaffles() {
  const { data: raffleCount = 0n } = useRaffleCount()
  const count = Number(raffleCount)

  return useQuery({
    queryKey: ['raffles', count],
    queryFn: async (): Promise<ParsedRaffle[]> => {
      if (count === 0) return []

      const raffles: ParsedRaffle[] = []

      // Placeholder implementation - would fetch raffles from contract
      // This needs to be implemented with actual wagmi hooks
      // For now, return empty array

      return raffles
    },
    staleTime: 30_000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * Get raffles created by a specific user
 */
export function useUserRaffles(userAddress: Address | undefined) {
  const { data: allRaffles = [] } = useAllRaffles()

  return {
    raffles: allRaffles.filter((r) => r.host === userAddress),
    isLoading: false,
    totalCreated: allRaffles.filter((r) => r.host === userAddress).length,
    activeRaffles: allRaffles.filter((r) => r.host === userAddress && !r.isExpired),
  }
}

/**
 * Get filtered raffles (active, ended, by type)
 */
export function useFilteredRaffles(filters?: {
  status?: 'active' | 'ended' | 'all'
  type?: 'nft' | 'crypto' | 'all'
}) {
  const { data: allRaffles = [] } = useAllRaffles()

  return allRaffles.filter((raffle) => {
    // Status filter
    if (filters?.status === 'active' && raffle.isExpired) return false
    if (filters?.status === 'ended' && !raffle.isExpired) return false

    return true
  })
}

/**
 * Get leaderboard for a raffle (top buyers by ticket count)
 * This would need to be indexed from TicketPurchased events
 */
export function useRaffleLeaderboard(raffleId: number | undefined) {

  return useQuery({
    queryKey: ['leaderboard', raffleId],
    queryFn: async () => {
      if (!raffleId) return []

      // In a real implementation, this would query indexed events
      // or call a backend API that has indexed TicketPurchased events
      // For now, returning empty array
      return []
    },
    enabled: !!raffleId,
    staleTime: 60_000, // Leaderboard updates less frequently
  })
}

/**
 * Get user's tickets for a specific raffle
 * Counts how many times user appears in participants array
 */
export function useUserTickets(raffleId: number | undefined) {
  const { address: userAddress } = useAccount()
  const { data: raffleCount = 0n } = useRaffleCount()
  const count = Number(raffleCount)

  // This would need to iterate through participants array
  // In a real implementation, this should be indexed or cached

  return useQuery({
    queryKey: ['userTickets', raffleId, userAddress, count],
    queryFn: async () => {
      if (!raffleId || !userAddress) return 0

      // Placeholder - would iterate through participants array
      // and count occurrences of userAddress
      return 0
    },
    enabled: !!raffleId && !!userAddress,
    staleTime: 30_000,
  })
}

/**
 * Get raffle statistics
 */
export function useRaffleStats() {
  const { data: raffles = [] } = useAllRaffles()
  const { address: userAddress } = useAccount()

  return {
    totalRaffles: raffles.length,
    activeRaffles: raffles.filter((r) => !r.isExpired).length,
    endedRaffles: raffles.filter((r) => r.isExpired).length,
    userCreatedRaffles: raffles.filter((r) => r.host === userAddress).length,
    totalPrizePool: raffles.reduce((sum, r) => sum + r.prizeAmount, 0n),
  }
}

/**
 * Invalidate raffle cache to force refetch
 */
export function useInvalidateRaffles() {
  return {
    invalidateAll: async () => {
      await queryClient.invalidateQueries({ queryKey: ['raffles'] })
    },
    invalidateRaffle: async (raffleId: number) => {
      await queryClient.invalidateQueries({ queryKey: ['raffle', raffleId] })
    },
  }
}
