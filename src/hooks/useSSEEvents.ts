import { useEffect, useCallback } from 'react'
import { BACKEND_URL } from '../config'
import type { ActivityEvent } from './useActivityEvents'

// ─── Toggle mock vs real SSE ───────────────────────────────────────────────
const USE_MOCK_DATA = false;

// ─── Singleton module-level state ─────────────────────────────────────────
// One SSE connection shared across all hook consumers.
let sseSource: EventSource | null = null
const listeners = new Set<(event: ActivityEvent) => void>()

// ─── Mock SSE events ───────────────────────────────────────────────────────
const MOCK_SSE_EVENTS: ActivityEvent[] = [
  {
    id: 200,
    event_type: 'TicketPurchased',
    source: 'sse',
    block_number: 39001000,
    log_index: 1,
    tx_hash: '0xlive001',
    event_data: { raffle_id: 12, buyer: '0xA1B2C3D4E5F6789012345678901234567890ABCD', ticket_count: 7 },
    created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
  },
  {
    id: 201,
    event_type: 'RaffleCreated',
    source: 'sse',
    block_number: 39001010,
    log_index: 0,
    tx_hash: '0xlive002',
    event_data: {
      raffle_id: 13,
      host: '0xB2C3D4E5F6789012345678901234567890ABCDE1',
      prize_asset: '0x0000000000000000000000000000000000000001',
      prize_type: 'ERC20',
      prize_amount_or_token_id: '10000000000',
      expiry: Math.floor(Date.now() / 1000) + 86400,
      prize_symbol: 'BTC',
      decimals: 8,
    },
    created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
  },
  {
    id: 202,
    event_type: 'WinnerPicked',
    source: 'sse',
    block_number: 39001020,
    log_index: 2,
    tx_hash: '0xlive003',
    event_data: { raffle_id: 11, winner: '0xC3D4E5F6789012345678901234567890ABCDEF01' },
    created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
  },
  {
    id: 203,
    event_type: 'TicketPurchased',
    source: 'sse',
    block_number: 39001030,
    log_index: 3,
    tx_hash: '0xlive004',
    event_data: { raffle_id: 13, buyer: '0xD4E5F6789012345678901234567890ABCDEF0123', ticket_count: 1 },
    created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
  },
  {
    id: 204,
    event_type: 'RaffleExpired',
    source: 'sse',
    block_number: 39001040,
    log_index: 0,
    tx_hash: '0xlive005',
    event_data: { raffle_id: 9 },
    created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
  },
]

let mockIndex = 0
let mockTimer: ReturnType<typeof setInterval> | null = null

function startMockSSE() {
  if (mockTimer) return
  mockTimer = setInterval(() => {
    const event = { ...MOCK_SSE_EVENTS[mockIndex % MOCK_SSE_EVENTS.length] }
    // refresh timestamp so it always shows "just now"
    event.created_at = new Date().toISOString().replace('T', ' ').slice(0, 19)
    event.id = 200 + mockIndex
    listeners.forEach((cb) => cb(event))
    mockIndex++
  }, 6000)
}

function stopMockSSE() {
  if (mockTimer) {
    clearInterval(mockTimer)
    mockTimer = null
  }
}

// ─── Real SSE connection helpers ───────────────────────────────────────────
function buildSSEUrl(): string {
  const url = new URL(`${BACKEND_URL}/events/stream`)
  const lastId = sessionStorage.getItem('sse_last_event_id')
  if (lastId) {
    const [block, logIndex] = lastId.split(':')
    if (block) url.searchParams.set('last_block', block)
    if (logIndex) url.searchParams.set('last_log_index', logIndex)
  }
  return url.toString()
}

function openSSEConnection() {
  if (sseSource) return

  const source = new EventSource(buildSSEUrl())
  sseSource = source

  source.addEventListener('event_log', (e: MessageEvent) => {
    // Store cursor in sessionStorage for resume on hard refresh
    if (e.lastEventId) {
      sessionStorage.setItem('sse_last_event_id', e.lastEventId)
    }
    try {
      const event: ActivityEvent = JSON.parse(e.data)
      listeners.forEach((cb) => cb(event))
    } catch {
      // ignore malformed data
    }
  })

  source.onerror = () => {
    // EventSource auto-reconnects natively. Close and null so next
    // mount attempt can rebuild the URL with the latest cursor.
    source.close()
    sseSource = null
    // Re-open after a short delay to respect the new cursor
    setTimeout(() => {
      if (listeners.size > 0) openSSEConnection()
    }, 3000)
  }
}

// ─── Hook ──────────────────────────────────────────────────────────────────
export function useSSEEvents() {
  useEffect(() => {
    if (USE_MOCK_DATA) {
      startMockSSE()
      return () => {
        // Only stop mock SSE when there are no more listeners
        // (handled by subscribe cleanup)
      }
    }

    openSSEConnection()
    // Do not close the singleton on component unmount —
    // only close it when the app fully unloads
    return () => {}
  }, [])

  const subscribe = useCallback((cb: (event: ActivityEvent) => void) => {
    listeners.add(cb)
    return () => {
      listeners.delete(cb)
      // When all listeners are gone, stop mock SSE to avoid leaks
      if (USE_MOCK_DATA && listeners.size === 0) {
        stopMockSSE()
      }
    }
  }, [])

  return { subscribe }
}
