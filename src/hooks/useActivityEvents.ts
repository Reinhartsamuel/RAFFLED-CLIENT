import { useState, useCallback, useEffect } from 'react'
import { ponderQuery } from '../utils/ponder'
import type { PonderEvent, PonderPage } from '../types/evm.types'

export interface EventSummary {
  event_type: string
  count: number
}

// ─── Types ─────────────────────────────────────────────────────────────────
export type EventType =
  | 'TicketPurchased'
  | 'RaffleCreated'
  | 'WinnerPicked'
  | 'RaffleExpired'
  | 'UnderfilledPrizeReturned'
  | 'UnderfilledPayout'
  | 'PlatformFeeCollected'
  | 'FeeChangeProposed'
  | 'NFTPrizeAwarded'
  | 'TokenPrizeAwarded'

export type ActivityFilter = 'all' | EventType

export interface ActivityEvent {
  id: number
  event_type: EventType
  source: string
  block_number: number
  log_index: number
  tx_hash: string
  event_data: Record<string, unknown>
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

const PAGE_SIZE = 20

// ─── Ponder → ActivityEvent mapping ─────────────────────────────────────────
function camelToSnake(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase()
}

function mapData(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(data ?? {})) {
    out[camelToSnake(k)] = v
  }
  return out
}

function toActivityEvent(e: PonderEvent, index: number): ActivityEvent {
  const logIndex = Number(e.id.split('-').pop() ?? 0) || 0
  const tsMs = Number(e.blockTimestamp) * 1000
  return {
    id: index + 1,
    event_type: e.eventName as EventType,
    source: 'ponder',
    block_number: Number(e.blockTimestamp),
    log_index: logIndex,
    tx_hash: e.txHash,
    event_data: mapData(e.data as Record<string, unknown>),
    created_at: new Date(tsMs).toISOString().replace('T', ' ').slice(0, 19),
  }
}

/**
 * Convert a Ponder event into the app's ActivityEvent shape.
 * Used by activity feed, EventToast, and any other consumer.
 */
export function ponderEventToActivity(e: PonderEvent, index = 0): ActivityEvent {
  return toActivityEvent(e, index)
}

// ─── Hook ──────────────────────────────────────────────────────────────────
export function useActivityEvents(filter: ActivityFilter) {
  const [allEvents, setAllEvents] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [summary, setSummary] = useState<EventSummary[]>([])

  // Ponder has no total-count query in the plan's shape — report loaded count
  const total = allEvents.length

  const fetchPage = useCallback(async (pageNum: number, currentFilter: ActivityFilter) => {
    setLoading(true)
    try {
      const where = currentFilter !== 'all' ? `where: { eventName: "${currentFilter}" }` : ''
      const data = await ponderQuery<{ events: PonderPage<PonderEvent> }>(`
        query ActivityEvents($limit: Int!, $offset: Int!) {
          events(
            ${where ? where + '\n' : ''}orderBy: "blockTimestamp"
            orderDirection: "desc"
            limit: $limit
            offset: $offset
          ) {
            items {
              id eventName raffleId from data txHash blockTimestamp
            }
          }
        }
      `, { limit: PAGE_SIZE, offset: (pageNum - 1) * PAGE_SIZE })
      const mapped = data.events.items.map((e, i) => toActivityEvent(e, (pageNum - 1) * PAGE_SIZE + i))
      setAllEvents((prev) => (pageNum === 1 ? mapped : [...prev, ...mapped]))
      setHasMore(mapped.length === PAGE_SIZE)
      setPage(pageNum)
    } catch (err) {
      console.error('Failed to fetch activity events from Ponder:', err)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch summary counts from the latest 100 events (Ponder 0.17 has no
  // aggregate queries) — good enough for the stats bar.
  useEffect(() => {
    let cancelled = false
    const fetchSummary = async () => {
      try {
        const data = await ponderQuery<{ events: PonderPage<PonderEvent> }>(`
          query RecentEvents($limit: Int!) {
            events(orderBy: "blockTimestamp", orderDirection: "desc", limit: $limit) {
              items {
                id eventName raffleId from data txHash blockTimestamp
              }
            }
          }
        `, { limit: 100 })
        const grouped = new Map<string, number>()
        data.events.items.forEach((e) => {
          grouped.set(e.eventName, (grouped.get(e.eventName) ?? 0) + 1)
        })
        if (!cancelled) {
          setSummary(Array.from(grouped.entries()).map(([event_type, count]) => ({ event_type, count })))
        }
      } catch (err) {
        console.error('Failed to fetch event summary from Ponder:', err)
      }
    }
    fetchSummary()
    return () => { cancelled = true }
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

  return { events: allEvents, loading, hasMore, loadMore, total, summary }
}
