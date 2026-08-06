import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { type Address } from 'viem'
import { ponderQuery } from '../utils/ponder'
import type { PonderRaffle, PonderParticipant, PonderPage } from '../types/evm.types'
import { queryClient } from '../config/evm.config'

/**
 * Enriched raffle: Ponder data + derived display fields.
 */
export interface EnrichedRaffle extends PonderRaffle {
  raffleIdNum: number
  expiryNum: number
  timeRemaining: number
  isExpired: boolean
  isFilled: boolean
  progressPercent: number
}

/**
 * Compute display fields (timeRemaining, isExpired, etc.) from Ponder data.
 * Use in components that consume useAllRaffles().
 */
export function enrichRaffle(r: PonderRaffle, now?: number): EnrichedRaffle {
  const ts = now ?? Math.floor(Date.now() / 1000)
  const expiryNum = Number(r.expiry)
  const totalTickets = Number(r.totalTickets)
  const maxCap = Number(r.maxCap)
  return {
    ...r,
    raffleIdNum: Number(r.id),
    expiryNum,
    timeRemaining: Math.max(0, expiryNum - ts),
    isExpired: ts >= expiryNum,
    isFilled: totalTickets >= maxCap,
    progressPercent: maxCap > 0 ? Math.min(100, (totalTickets / maxCap) * 100) : 0,
  }
}

/**
 * Fetch all raffles from Ponder GraphQL.
 * ⚠️ 0 RPC calls. Requires Ponder indexer running.
 */
export function useAllRaffles() {
  return useQuery({
    queryKey: ['ponder', 'raffles'],
    queryFn: async () => {
      const data = await ponderQuery<{ raffles: PonderPage<PonderRaffle> }>(`
        query AllRaffles {
          raffles(orderBy: "createdAt", orderDirection: "desc", limit: 100) {
            items {
              id host prizeAsset prizeType prizeAmountOrTokenId
              prizeSymbol prizeDecimals ticketPrice maxCap totalTickets
              expiry status underfilled winner
              vrfRequestId createdAt resolvedAt
            }
          }
        }
      `)
      return data.raffles.items
    },
    // Short staleness + interval poll so new raffles appear almost immediately
    // after creation (Ponder picks them up within ~2-3s of mining).
    staleTime: 5_000,
    refetchInterval: 20_000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * Get raffles created by a specific user (host).
 */
export function useUserRaffles(userAddress: Address | undefined) {
  const { data: allRaffles = [] } = useAllRaffles()
  const enriched = allRaffles.map((r) => enrichRaffle(r))
  const mine = userAddress
    ? enriched.filter((r) => r.host.toLowerCase() === userAddress.toLowerCase())
    : []

  return {
    raffles: mine,
    isLoading: false,
    totalCreated: mine.length,
    activeRaffles: mine.filter((r) => !r.isExpired),
  }
}

/**
 * Get filtered raffles (active, ended, by prize type) from Ponder.
 */
export function useFilteredRaffles(filters?: {
  status?: 'active' | 'ended' | 'all'
  type?: 'nft' | 'crypto' | 'all'
}) {
  const { data: allRaffles = [], ...rest } = useAllRaffles()
  const now = Math.floor(Date.now() / 1000)
  const filtered = allRaffles.filter((r) => {
    if (filters?.status === 'active' && now >= Number(r.expiry)) return false
    if (filters?.status === 'ended' && now < Number(r.expiry)) return false
    if (filters?.type === 'nft' && r.prizeType !== 'ERC721') return false
    if (filters?.type === 'crypto' && r.prizeType !== 'ERC20') return false
    return true
  })
  return { data: filtered, ...rest }
}

/**
 * Get leaderboard for a raffle (top buyers by ticket count) from Ponder.
 */
export function useRaffleLeaderboard(raffleId: number | undefined) {
  return useQuery({
    queryKey: ['ponder', 'leaderboard', raffleId],
    queryFn: async () => {
      if (!raffleId) return []
      const data = await ponderQuery<{ participants: PonderPage<PonderParticipant> }>(`
        query Leaderboard($raffleId: BigInt!) {
          participants(
            where: { raffleId: $raffleId }
            orderBy: "ticketCount"
            orderDirection: "desc"
            limit: 20
          ) {
            items {
              user ticketCount isWinner
            }
          }
        }
      `, { raffleId: String(raffleId) })
      return data.participants.items
    },
    enabled: !!raffleId,
    staleTime: 60_000,
  })
}

/**
 * Get user's tickets for a specific raffle from Ponder.
 */
export function useUserTickets(raffleId: number | undefined) {
  const { address: userAddress } = useAccount()
  return useQuery({
    queryKey: ['ponder', 'participant', raffleId, userAddress],
    queryFn: async () => {
      if (!raffleId || !userAddress) return 0
      const data = await ponderQuery<{ participants: PonderPage<PonderParticipant> }>(`
        query UserTickets($raffleId: BigInt!, $user: String!) {
          participants(where: { raffleId: $raffleId, user: $user }) {
            items {
              ticketCount
            }
          }
        }
      `, { raffleId: String(raffleId), user: userAddress.toLowerCase() })
      return data.participants.items.reduce((sum, p) => sum + Number(p.ticketCount), 0)
    },
    enabled: !!raffleId && !!userAddress,
    staleTime: 15_000,
  })
}

/**
 * Get raffle statistics from Ponder.
 */
export function useRaffleStats() {
  const { data: raffles = [] } = useAllRaffles()
  const { address: userAddress } = useAccount()
  const now = Math.floor(Date.now() / 1000)
  return {
    totalRaffles: raffles.length,
    activeRaffles: raffles.filter((r) => now < Number(r.expiry)).length,
    endedRaffles: raffles.filter((r) => now >= Number(r.expiry)).length,
    userCreatedRaffles: raffles.filter((r) => r.host.toLowerCase() === userAddress?.toLowerCase()).length,
    totalPrizePool: raffles.reduce((sum, r) => sum + BigInt(r.prizeAmountOrTokenId), 0n),
  }
}

/**
 * Invalidate raffle cache to force refetch.
 */
export function useInvalidateRaffles() {
  return {
    invalidateAll: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ponder', 'raffles'] })
    },
    invalidateRaffle: async (raffleId: number) => {
      await queryClient.invalidateQueries({ queryKey: ['ponder', 'leaderboard', raffleId] })
      await queryClient.invalidateQueries({ queryKey: ['ponder', 'participant', raffleId] })
    },
  }
}
