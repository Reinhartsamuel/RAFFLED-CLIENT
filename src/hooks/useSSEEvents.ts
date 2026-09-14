import { useEffect, useCallback } from 'react'
import { API_URL } from '../config'
import type { ActivityEvent } from './useActivityEvents'

// ─── Singleton module-level state ─────────────────────────────────────────
// One SSE connection shared across all hook consumers.
let sseSource: EventSource | null = null
const listeners = new Set<(event: ActivityEvent) => void>()

// ─── Real SSE connection helpers ───────────────────────────────────────────
function buildSSEUrl(): string {
  const url = new URL(`${API_URL}/events/stream`)
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
      const eventData: Omit<ActivityEvent, 'source'> = JSON.parse(e.data)
      // Add 'source' field since backend doesn't include it
      const event: ActivityEvent = { ...eventData, source: 'sse' }
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
    openSSEConnection()
    // Do not close the singleton on component unmount —
    // only close it when the app fully unloads
    return () => {}
  }, [])

  const subscribe = useCallback((cb: (event: ActivityEvent) => void) => {
    listeners.add(cb)
    return () => {
      listeners.delete(cb)
    }
  }, [])

  return { subscribe, isConnected: !!sseSource }
}
