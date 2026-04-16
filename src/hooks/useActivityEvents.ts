import { useState, useCallback, useEffect } from 'react'
import { BACKEND_URL, apiFetch } from '../config'

// ─── Toggle mock vs real API ───────────────────────────────────────────────
const USE_MOCK_DATA = true

// ─── Types ─────────────────────────────────────────────────────────────────
export type EventType =
  | 'TicketPurchased'
  | 'RaffleCreated'
  | 'WinnerPicked'
  | 'RaffleExpired'
  | 'UnderfilledPrizeReturned'
  | 'PlatformFeeCollected'
  | 'FeeChangeProposed'

export type ActivityFilter = 'all' | EventType

interface TicketPurchasedData {
  raffle_id: number
  buyer: string
  ticket_count: number
}
interface RaffleCreatedData {
  raffle_id: number
  host: string
  prize_asset: string
  prize_type: string
  prize_amount_or_token_id: string
  expiry: number
  prize_symbol: string
  decimals: number
}
interface WinnerPickedData {
  raffle_id: number
  winner: string
}
interface RaffleExpiredData {
  raffle_id: number
}
interface UnderfilledData {
  raffle_id: number
  host: string
  prize_amount_or_token_id: string
}
interface FeeCollectedData {
  raffle_id: number
  amount: string
}
interface FeeChangeProposedData {
  new_fee_bps: string
  effective_at: string
}

export type EventData =
  | TicketPurchasedData
  | RaffleCreatedData
  | WinnerPickedData
  | RaffleExpiredData
  | UnderfilledData
  | FeeCollectedData
  | FeeChangeProposedData

export interface ActivityEvent {
  id: number
  event_type: EventType
  source: string
  block_number: number
  log_index: number
  tx_hash: string
  event_data: EventData
  created_at: string
}

export interface ActivityPage {
  current_page: number
  data: ActivityEvent[]
  last_page: number
  next_page_url: string | null
  per_page: number
  total: number
}

// ─── Mock data ─────────────────────────────────────────────────────────────
function hoursAgo(h: number): string {
  const d = new Date(Date.now() - h * 60 * 60 * 1000)
  return d.toISOString().replace('T', ' ').slice(0, 19)
}

const MOCK_EVENTS: ActivityEvent[] = [
  {
    id: 101,
    event_type: 'TicketPurchased',
    source: 'webhook',
    block_number: 39000200,
    log_index: 5,
    tx_hash: '0xaaa111bbb222ccc333',
    event_data: { raffle_id: 12, buyer: '0x3fA5B9d0c1E7F234a56B789Cd01EfAb23456789', ticket_count: 5 } as TicketPurchasedData,
    created_at: hoursAgo(0.05),
  },
  {
    id: 100,
    event_type: 'RaffleCreated',
    source: 'webhook',
    block_number: 39000190,
    log_index: 2,
    tx_hash: '0xbbb222ccc333ddd444',
    event_data: {
      raffle_id: 12,
      host: '0x9aB4cD5eF6789AbCdEf1234567890AbCdEf1234',
      prize_asset: '0x0000000000000000000000000000000000000001',
      prize_type: 'ERC20',
      prize_amount_or_token_id: '1000000000',
      expiry: Math.floor(Date.now() / 1000) + 86400,
      prize_symbol: 'USDC',
      decimals: 6,
    } as RaffleCreatedData,
    created_at: hoursAgo(0.2),
  },
  {
    id: 99,
    event_type: 'TicketPurchased',
    source: 'webhook',
    block_number: 39000180,
    log_index: 8,
    tx_hash: '0xccc333ddd444eee555',
    event_data: { raffle_id: 11, buyer: '0x1234AbCdEf5678901234AbCdEf5678901234AbCd', ticket_count: 2 } as TicketPurchasedData,
    created_at: hoursAgo(0.5),
  },
  {
    id: 98,
    event_type: 'WinnerPicked',
    source: 'webhook',
    block_number: 39000170,
    log_index: 1,
    tx_hash: '0xddd444eee555fff666',
    event_data: { raffle_id: 10, winner: '0xDeAdBeEf1234567890AbCdEf1234567890AbCdEf' } as WinnerPickedData,
    created_at: hoursAgo(1),
  },
  {
    id: 97,
    event_type: 'TicketPurchased',
    source: 'webhook',
    block_number: 39000160,
    log_index: 4,
    tx_hash: '0xeee555fff666aaa777',
    event_data: { raffle_id: 11, buyer: '0x5678AbCdEf901234567890AbCdEf901234567890', ticket_count: 10 } as TicketPurchasedData,
    created_at: hoursAgo(1.5),
  },
  {
    id: 96,
    event_type: 'RaffleCreated',
    source: 'webhook',
    block_number: 39000150,
    log_index: 0,
    tx_hash: '0xfff666aaa777bbb888',
    event_data: {
      raffle_id: 11,
      host: '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12',
      prize_asset: '0x0000000000000000000000000000000000000002',
      prize_type: 'ERC721',
      prize_amount_or_token_id: '42',
      expiry: Math.floor(Date.now() / 1000) + 172800,
      prize_symbol: 'BAYC',
      decimals: 0,
    } as RaffleCreatedData,
    created_at: hoursAgo(2),
  },
  {
    id: 95,
    event_type: 'TicketPurchased',
    source: 'webhook',
    block_number: 39000140,
    log_index: 7,
    tx_hash: '0xaaa888bbb999ccc000',
    event_data: { raffle_id: 10, buyer: '0xFaCeBooK1234567890AbCdEf1234567890AbCdEf', ticket_count: 1 } as TicketPurchasedData,
    created_at: hoursAgo(3),
  },
  {
    id: 94,
    event_type: 'RaffleExpired',
    source: 'webhook',
    block_number: 39000130,
    log_index: 3,
    tx_hash: '0xbbb999ccc000ddd111',
    event_data: { raffle_id: 9 } as RaffleExpiredData,
    created_at: hoursAgo(4),
  },
  {
    id: 93,
    event_type: 'TicketPurchased',
    source: 'webhook',
    block_number: 39000120,
    log_index: 6,
    tx_hash: '0xccc000ddd111eee222',
    event_data: { raffle_id: 10, buyer: '0x9B8a7C6d5E4f3A2B1c0D9e8F7A6b5C4d3E2f1A0B', ticket_count: 3 } as TicketPurchasedData,
    created_at: hoursAgo(5),
  },
  {
    id: 92,
    event_type: 'WinnerPicked',
    source: 'webhook',
    block_number: 39000110,
    log_index: 2,
    tx_hash: '0xddd111eee222fff333',
    event_data: { raffle_id: 8, winner: '0xC0fFeE1234567890AbCdEf1234567890AbCdEf12' } as WinnerPickedData,
    created_at: hoursAgo(6),
  },
  {
    id: 91,
    event_type: 'PlatformFeeCollected',
    source: 'webhook',
    block_number: 39000100,
    log_index: 9,
    tx_hash: '0xeee222fff333aaa444',
    event_data: { raffle_id: 8, amount: '50000000' } as FeeCollectedData,
    created_at: hoursAgo(6),
  },
  {
    id: 90,
    event_type: 'UnderfilledPrizeReturned',
    source: 'webhook',
    block_number: 39000090,
    log_index: 1,
    tx_hash: '0xfff333aaa444bbb555',
    event_data: {
      raffle_id: 7,
      host: '0x1A2b3C4d5E6f7A8b9C0d1E2f3A4B5C6D7E8F9A0B',
      prize_amount_or_token_id: '500000000',
    } as UnderfilledData,
    created_at: hoursAgo(8),
  },
  {
    id: 89,
    event_type: 'RaffleCreated',
    source: 'webhook',
    block_number: 39000080,
    log_index: 0,
    tx_hash: '0xaaa555bbb666ccc777',
    event_data: {
      raffle_id: 10,
      host: '0x0A1b2C3d4E5f6A7b8C9d0E1f2A3B4C5D6E7F8A9B',
      prize_asset: '0x0000000000000000000000000000000000000003',
      prize_type: 'ERC20',
      prize_amount_or_token_id: '5000000000',
      expiry: Math.floor(Date.now() / 1000) + 43200,
      prize_symbol: 'WETH',
      decimals: 18,
    } as RaffleCreatedData,
    created_at: hoursAgo(10),
  },
  {
    id: 88,
    event_type: 'TicketPurchased',
    source: 'webhook',
    block_number: 39000070,
    log_index: 5,
    tx_hash: '0xbbb666ccc777ddd888',
    event_data: { raffle_id: 9, buyer: '0x2B3c4D5e6F7a8B9c0D1e2F3a4B5c6D7e8F9a0B1C', ticket_count: 8 } as TicketPurchasedData,
    created_at: hoursAgo(12),
  },
  {
    id: 87,
    event_type: 'TicketPurchased',
    source: 'webhook',
    block_number: 39000060,
    log_index: 3,
    tx_hash: '0xccc777ddd888eee999',
    event_data: { raffle_id: 8, buyer: '0x4D5e6F7a8B9c0D1e2F3a4B5c6D7e8F9a0B1C2D3E', ticket_count: 15 } as TicketPurchasedData,
    created_at: hoursAgo(15),
  },
  {
    id: 86,
    event_type: 'WinnerPicked',
    source: 'webhook',
    block_number: 39000050,
    log_index: 2,
    tx_hash: '0xddd888eee999fff000',
    event_data: { raffle_id: 6, winner: '0x6F7a8B9c0D1e2F3a4B5c6D7e8F9a0B1C2D3E4F5A' } as WinnerPickedData,
    created_at: hoursAgo(18),
  },
  {
    id: 85,
    event_type: 'RaffleExpired',
    source: 'webhook',
    block_number: 39000040,
    log_index: 4,
    tx_hash: '0xeee999fff000aaa111',
    event_data: { raffle_id: 5 } as RaffleExpiredData,
    created_at: hoursAgo(22),
  },
  {
    id: 84,
    event_type: 'TicketPurchased',
    source: 'webhook',
    block_number: 39000030,
    log_index: 6,
    tx_hash: '0xfff000aaa111bbb222',
    event_data: { raffle_id: 6, buyer: '0x8B9c0D1e2F3a4B5c6D7e8F9a0B1C2D3E4F5A6B7C', ticket_count: 4 } as TicketPurchasedData,
    created_at: hoursAgo(24),
  },
]

const MOCK_PAGE_SIZE = 10

// ─── Hook ──────────────────────────────────────────────────────────────────
export function useActivityEvents(filter: ActivityFilter) {
  const [allEvents, setAllEvents] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)

  const fetchPage = useCallback(async (pageNum: number, currentFilter: ActivityFilter) => {
    setLoading(true)
    try {
      if (USE_MOCK_DATA) {
        await new Promise((r) => setTimeout(r, 300)) // simulate network
        const source =
          currentFilter === 'all'
            ? MOCK_EVENTS
            : MOCK_EVENTS.filter((e) => e.event_type === currentFilter)
        const start = (pageNum - 1) * MOCK_PAGE_SIZE
        const slice = source.slice(start, start + MOCK_PAGE_SIZE)
        setAllEvents((prev) => (pageNum === 1 ? slice : [...prev, ...slice]))
        setHasMore(start + MOCK_PAGE_SIZE < source.length)
        setTotal(source.length)
        setPage(pageNum)
      } else {
        const url = new URL(`${BACKEND_URL}/events`)
        url.searchParams.set('per_page', '20')
        url.searchParams.set('page', String(pageNum))
        if (currentFilter !== 'all') {
          url.searchParams.set('event_type', currentFilter)
        }
        const res = await apiFetch(url.toString(), {
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        })
        const data: ActivityPage = await res.json()
        setAllEvents((prev) =>
          pageNum === 1 ? data.data : [...prev, ...data.data]
        )
        setHasMore(data.current_page < data.last_page)
        setTotal(data.total)
        setPage(data.current_page)
      }
    } catch (err) {
      console.error('Failed to fetch activity events:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Reset to page 1 whenever the filter changes
  useEffect(() => {
    setAllEvents([])
    setPage(1)
    setHasMore(true)
    fetchPage(1, filter)
  }, [filter, fetchPage])

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchPage(page + 1, filter)
    }
  }, [loading, hasMore, page, filter, fetchPage])

  return { events: allEvents, loading, hasMore, loadMore, total }
}
