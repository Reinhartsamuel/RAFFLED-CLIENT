import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { type Address } from 'viem'
import { API_URL, apiFetch, getAuthToken } from '../config'
import type { BackendRaffle } from '../interfaces/BackendRaffle'
import { queryClient } from '../config/evm.config'
import { safeBigInt } from '../utils/safeBigInt'

export type RaffleUIStatus = 'OPEN' | 'PENDING_VRF' | 'COMPLETED' | 'CANCELLED'

/**
 * Backend raffle + derived display fields.
 */
export interface EnrichedRaffle extends Omit<BackendRaffle, 'status' | 'type'> {
  raffleIdNum: number
  contractRaffleId: number
  host: string
  prizeType: 'ERC20' | 'ERC721'
  prizeSymbol: string
  prizeDecimals: number
  prizeAmountOrTokenId: string
  ticketPrice: string
  maxCap: number
  totalTickets: number
  expiryNum: number
  timeRemaining: number
  isExpired: boolean
  isFilled: boolean
  progressPercent: number
  status: RaffleUIStatus
}

export interface BackendLeaderboardEntry {
  user_address: string
  tickets: number
  total_spent_raw?: string
}

export interface RaffleDetailResponse {
  raffle: BackendRaffle | null
  yourTickets: number
}

export function authHeaders(): HeadersInit {
  const token = getAuthToken()
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

export function parseBackendDate(value?: string): number {
  if (!value) return 0
  const normalized = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`
  const ts = new Date(normalized).getTime()
  return Number.isNaN(ts) ? 0 : Math.floor(ts / 1000)
}

function isNftRaffle(r: BackendRaffle): boolean {
  return r.prize_type === 'erc721' || r.type === 'nft'
}

function mapStatus(raw: string | undefined, isExpired: boolean): RaffleUIStatus {
  const status = (raw || '').toLowerCase()
  if (status === 'open') return 'OPEN'
  if (status === 'pending_vrf' || status === 'pending') return 'PENDING_VRF'
  if (status === 'completed') return 'COMPLETED'
  if (status === 'cancelled' || status === 'canceled') return 'CANCELLED'
  return isExpired ? 'COMPLETED' : 'OPEN'
}

/**
 * Compute display fields (expiry, progress, status label) from backend data.
 */
export function enrichRaffle(r: BackendRaffle, now?: number): EnrichedRaffle {
  const ts = now ?? Math.floor(Date.now() / 1000)
  const expiryNum = parseBackendDate(r.expire_at || r.ends_at)
  const totalTickets = Number(r.sold_tickets ?? 0)
  const maxCap = Number(r.max_tickets ?? 0)
  const isExpired = expiryNum > 0 && ts >= expiryNum
  const nft = isNftRaffle(r)
  return {
    ...r,
    raffleIdNum: Number(r.id),
    contractRaffleId: Number(r.contract_raffle_id ?? r.id),
    host: r.owner_address ?? '',
    prizeType: nft ? 'ERC721' : 'ERC20',
    prizeSymbol: r.prize_asset_symbol || (nft ? 'NFT' : 'TOKEN'),
    prizeDecimals: Number(r.prize_asset_decimals ?? 6),
    prizeAmountOrTokenId: r.prize_amount_or_token_id ?? r.prize_amount ?? '0',
    ticketPrice: r.ticket_price_amount ?? '0',
    maxCap,
    totalTickets,
    expiryNum,
    timeRemaining: Math.max(0, expiryNum - ts),
    isExpired,
    isFilled: maxCap > 0 && totalTickets >= maxCap,
    progressPercent: maxCap > 0 ? Math.min(100, (totalTickets / maxCap) * 100) : 0,
    status: mapStatus(r.status, isExpired),
  }
}

async function fetchAllRaffles(): Promise<BackendRaffle[]> {
  const headers = authHeaders()
  const all: BackendRaffle[] = []
  let page = 1
  let lastPage = 1
  do {
    const url = new URL(`${API_URL}/raffles`)
    url.searchParams.set('per_page', '100')
    url.searchParams.set('page', String(page))
    const res = await apiFetch(url.toString(), { headers })
    if (!res.ok) throw new Error(`Raffles HTTP ${res.status}`)
    const body = await res.json()
    all.push(...((body.data ?? []) as BackendRaffle[]))
    lastPage = Number(body.last_page ?? 1)
    page += 1
  } while (page <= lastPage && page <= 10)
  return all
}

/**
 * Fetch all raffles from the backend API.
 */
export function useAllRaffles() {
  return useQuery({
    queryKey: ['raffles'],
    queryFn: fetchAllRaffles,
    staleTime: 30_000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
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
 * Get filtered raffles (active, ended, by prize type) from the backend.
 */
export function useFilteredRaffles(filters?: {
  status?: 'active' | 'ended' | 'all'
  type?: 'nft' | 'crypto' | 'all'
}) {
  const { data: allRaffles = [], ...rest } = useAllRaffles()
  const now = Math.floor(Date.now() / 1000)
  const filtered = allRaffles.filter((r) => {
    const expiry = parseBackendDate(r.expire_at || r.ends_at)
    if (filters?.status === 'active' && expiry > 0 && now >= expiry) return false
    if (filters?.status === 'ended' && (expiry === 0 || now < expiry)) return false
    if (filters?.type === 'nft' && !isNftRaffle(r)) return false
    if (filters?.type === 'crypto' && isNftRaffle(r)) return false
    return true
  })
  return { data: filtered, ...rest }
}

/**
 * Get a raffle's detail + the authenticated user's ticket count.
 */
export function useRaffleDetail(raffleId: number | undefined) {
  return useQuery({
    queryKey: ['raffle', raffleId],
    enabled: raffleId !== undefined,
    queryFn: async (): Promise<RaffleDetailResponse> => {
      const res = await apiFetch(`${API_URL}/raffles/${raffleId}`, { headers: authHeaders() })
      if (res.status === 404) return { raffle: null, yourTickets: 0 }
      if (!res.ok) throw new Error(`Raffle HTTP ${res.status}`)
      const body = await res.json()
      return {
        raffle: (body.raffle ?? null) as BackendRaffle | null,
        yourTickets: Number(body.your_tickets ?? 0),
      }
    },
    staleTime: 15_000,
    retry: 1,
  })
}

/**
 * Get leaderboard for a raffle (top buyers by ticket count) from the backend.
 */
export function useRaffleLeaderboard(raffleId: number | undefined) {
  return useQuery({
    queryKey: ['leaderboard', raffleId],
    enabled: raffleId !== undefined,
    queryFn: async (): Promise<BackendLeaderboardEntry[]> => {
      const res = await apiFetch(`${API_URL}/raffles/${raffleId}/leaderboard?per_page=10`, {
        headers: authHeaders(),
      })
      if (!res.ok) return []
      const body = await res.json()
      return (body.data ?? []) as BackendLeaderboardEntry[]
    },
    staleTime: 60_000,
  })
}

/**
 * Get raffle statistics from the backend.
 */
export function useRaffleStats() {
  const { data: raffles = [] } = useAllRaffles()
  const { address: userAddress } = useAccount()
  const enriched = raffles.map((r) => enrichRaffle(r))
  return {
    totalRaffles: enriched.length,
    activeRaffles: enriched.filter((r) => !r.isExpired).length,
    endedRaffles: enriched.filter((r) => r.isExpired).length,
    userCreatedRaffles: enriched.filter((r) => r.host.toLowerCase() === userAddress?.toLowerCase()).length,
    totalPrizePool: raffles.reduce(
      (sum, r) => sum + safeBigInt(r.prize_amount_or_token_id ?? r.prize_amount ?? '0'),
      0n
    ),
  }
}

/**
 * Invalidate raffle cache to force refetch.
 */
export function useInvalidateRaffles() {
  return {
    invalidateAll: async () => {
      await queryClient.invalidateQueries({ queryKey: ['raffles'] })
    },
    invalidateRaffle: async (raffleId: number) => {
      await queryClient.invalidateQueries({ queryKey: ['raffle', raffleId] })
      await queryClient.invalidateQueries({ queryKey: ['leaderboard', raffleId] })
    },
  }
}
