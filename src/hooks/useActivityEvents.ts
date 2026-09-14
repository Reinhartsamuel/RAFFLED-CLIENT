import { useState, useCallback, useEffect } from 'react'
import { API_URL, apiFetch, getAuthToken } from '../config'

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

// ─── Hook ──────────────────────────────────────────────────────────────────
export function useActivityEvents(filter: ActivityFilter) {
  const [allEvents, setAllEvents] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState<EventSummary[]>([])

  const fetchPage = useCallback(async (pageNum: number, currentFilter: ActivityFilter) => {
    setLoading(true)
    try {
      const url = new URL(`${API_URL}/events`)
      url.searchParams.set('per_page', String(PAGE_SIZE))
      url.searchParams.set('page', String(pageNum))
      url.searchParams.set('sort_by', 'created_at')
      url.searchParams.set('sort_dir', 'desc')
      if (currentFilter !== 'all') {
        url.searchParams.set('event_type', currentFilter)
      }
      const token = getAuthToken()
      const res = await apiFetch(url.toString(), {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })
      if (!res.ok) throw new Error(`Events HTTP ${res.status}`)
      const data: ActivityPage = await res.json()
      setAllEvents((prev) => (pageNum === 1 ? data.data : [...prev, ...data.data]))
      setHasMore(data.current_page < data.last_page)
      setTotal(Number(data.total ?? 0))
      setPage(data.current_page)
    } catch (err) {
      console.error('Failed to fetch activity events:', err)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch summary (once, not tied to filter)
  useEffect(() => {
    let cancelled = false
    const fetchSummary = async () => {
      try {
        const res = await apiFetch(`${API_URL}/events/summary`, {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        })
        if (!res.ok) return
        const data: EventSummary[] = await res.json()
        if (!cancelled) setSummary(data)
      } catch (err) {
        console.error('Failed to fetch event summary:', err)
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
