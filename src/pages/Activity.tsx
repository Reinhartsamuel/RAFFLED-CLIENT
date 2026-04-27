import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useActivityEvents,
  type ActivityFilter,
  type ActivityEvent,
  type EventType,
} from '../hooks/useActivityEvents'
import { fadeInUp, staggerContainer, staggerItem } from '../utils/animations'

// ─── Helpers ───────────────────────────────────────────────────────────────
function truncate(addr: string): string {
  if (!addr || addr.length < 10) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function timeAgo(dateStr: string): string {
  const ts = new Date(dateStr.replace(' ', 'T')).getTime()
  const seconds = Math.floor((Date.now() - ts) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

// ─── Event row data ─────────────────────────────────────────────────────────
interface RowData {
  label: string
  address: string | null
  detail: string
  raffleId: number
}

function getRowData(event: ActivityEvent): RowData {
  const d = event.event_data as unknown as Record<string, unknown>
  switch (event.event_type) {
    case 'TicketPurchased':
      return {
        label: 'JOIN',
        address: String(d.buyer),
        detail: `${d.ticket_count} ticket${Number(d.ticket_count) !== 1 ? 's' : ''}`,
        raffleId: Number(d.raffle_id),
      }
    case 'RaffleCreated':
      return {
        label: 'CREATED',
        address: String(d.host),
        detail: String(d.prize_symbol || 'ERC-20'),
        raffleId: Number(d.raffle_id),
      }
    case 'WinnerPicked':
      return {
        label: 'WINNER',
        address: String(d.winner),
        detail: '—',
        raffleId: Number(d.raffle_id),
      }
    case 'RaffleExpired':
      return {
        label: 'EXPIRED',
        address: null,
        detail: '—',
        raffleId: Number(d.raffle_id),
      }
    case 'UnderfilledPrizeReturned':
      return {
        label: 'RETURNED',
        address: String(d.host),
        detail: String(d.prize_amount_or_token_id),
        raffleId: Number(d.raffle_id),
      }
    case 'PlatformFeeCollected':
      return {
        label: 'FEE',
        address: null,
        detail: String(d.amount),
        raffleId: Number(d.raffle_id),
      }
    default:
      return { label: String(event.event_type), address: null, detail: '—', raffleId: 0 }
  }
}

// ─── Badge color map ─────────────────────────────────────────────────────────
const BADGE_STYLES: Record<string, string> = {
  JOIN: 'bg-[#FFB800]/15 text-[#FFB800] border border-[#FFB800]/30',
  CREATED: 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30',
  WINNER: 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30',
  EXPIRED: 'bg-[#555555]/20 text-[#555555] border border-[#555555]/30',
  RETURNED: 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30',
  FEE: 'bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30',
}

const ROW_ACCENT: Record<string, string> = {
  JOIN: 'border-l-[#FFB800]/50',
  CREATED: 'border-l-[#3B82F6]/50',
  WINNER: 'border-l-[#22C55E]/50',
  EXPIRED: 'border-l-[#333333]',
  RETURNED: 'border-l-[#EF4444]/50',
  FEE: 'border-l-[#8B5CF6]/50',
}

// ─── Filter tabs config ──────────────────────────────────────────────────────
const FILTERS: { id: ActivityFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'TicketPurchased', label: 'Join' },
  { id: 'RaffleCreated', label: 'Created' },
  { id: 'WinnerPicked', label: 'Winner' },
  { id: 'RaffleExpired', label: 'Expired' },
  { id: 'UnderfilledPrizeReturned', label: 'Returned' },
]

const EVENT_TYPE_COLORS: Record<EventType, string> = {
  TicketPurchased: '#FFB800',
  RaffleCreated: '#3B82F6',
  WinnerPicked: '#22C55E',
  RaffleExpired: '#555555',
  UnderfilledPrizeReturned: '#EF4444',
  PlatformFeeCollected: '#8B5CF6',
  FeeChangeProposed: '#8B5CF6',
}

// ─── Activity Row ────────────────────────────────────────────────────────────
function ActivityRow({ event }: { event: ActivityEvent }) {
  const row = getRowData(event)
  const badge = BADGE_STYLES[row.label] ?? BADGE_STYLES.FEE
  const accentBorder = ROW_ACCENT[row.label] ?? 'border-l-[#333333]'

  return (
    <motion.div
      variants={staggerItem}
      className={`grid grid-cols-[110px_64px_minmax(0,140px)_1fr_72px] gap-4 px-4 py-3.5 border-b border-[#111111] border-l-2 ${accentBorder} hover:bg-[#0a0a0a] transition-colors group`}
    >
      {/* Type badge */}
      <div className="flex items-center">
        <span
          className={`inline-flex items-center font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${badge}`}
        >
          {row.label}
        </span>
      </div>

      {/* Raffle ID */}
      <div className="flex items-center">
        <span className="font-mono text-xs text-[#555555] group-hover:text-[#999999] transition-colors">
          #{row.raffleId}
        </span>
      </div>

      {/* Address */}
      <div className="flex items-center min-w-0">
        {row.address ? (
          <span className="font-mono text-xs text-[#999999] truncate group-hover:text-[#F5F5F5] transition-colors">
            {truncate(row.address)}
          </span>
        ) : (
          <span className="font-mono text-xs text-[#333333]">—</span>
        )}
      </div>

      {/* Details */}
      <div className="flex items-center min-w-0">
        <span className="font-mono text-xs text-[#555555] truncate">{row.detail}</span>
      </div>

      {/* Time */}
      <div className="flex items-center justify-end">
        <span className="font-mono text-[10px] text-[#333333] group-hover:text-[#555555] transition-colors whitespace-nowrap">
          {timeAgo(event.created_at)}
        </span>
      </div>
    </motion.div>
  )
}

// ─── Stats bar ────────────────────────────────────────────────────────────────
function StatsBar({ events }: { events: ActivityEvent[] }) {
  const counts = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.event_type] = (acc[e.event_type] ?? 0) + 1
    return acc
  }, {})

  const items = [
    { type: 'TicketPurchased' as EventType, label: 'Tickets sold' },
    { type: 'RaffleCreated' as EventType, label: 'Raffles created' },
    { type: 'WinnerPicked' as EventType, label: 'Winners picked' },
  ]

  return (
    <div className="grid grid-cols-3 gap-px bg-[#1f1f1f] rounded-xl overflow-hidden border border-[#1f1f1f]">
      {items.map(({ type, label }) => (
        <div key={type} className="bg-[#0a0a0a] px-5 py-4 flex flex-col gap-1">
          <span
            className="font-sans font-bold text-xl"
            style={{ color: EVENT_TYPE_COLORS[type] }}
          >
            {counts[type] ?? 0}
          </span>
          <span className="font-mono text-[10px] text-[#777777] uppercase tracking-widest">
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function ActivityPage() {
  const [filter, setFilter] = useState<ActivityFilter>('all')
  const { events, loading, hasMore, loadMore, total } = useActivityEvents(filter)

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* ── Header ── */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="flex items-start justify-between"
      >
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-sans font-bold text-2xl text-[#F5F5F5]">
              Platform Activity
            </h2>
            {/* Live indicator */}
            <span className="relative flex h-2 w-2 mt-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]" />
            </span>
            <span className="font-mono text-[10px] text-[#22C55E] uppercase tracking-widest">
              Live
            </span>
          </div>
          <p className="font-mono text-xs text-[#555555] mt-1">
            {total} events · Real-time blockchain feed
          </p>
        </div>
      </motion.div>

      {/* ── Stats ── */}
      <motion.div variants={fadeInUp} initial="initial" animate="animate">
        <StatsBar events={events} />
      </motion.div>

      {/* ── Filter Tabs ── */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="flex items-center gap-0 border-b border-[#1f1f1f] overflow-x-auto"
      >
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`font-mono text-[11px] uppercase tracking-wider px-4 py-2.5 border-b-2 transition-all whitespace-nowrap flex-shrink-0 ${
              filter === f.id
                ? 'border-[#FFB800] text-[#FFB800]'
                : 'border-transparent text-[#555555] hover:text-[#999999]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </motion.div>

      {/* ── Table ── */}
      <div className="border border-[#1f1f1f] rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[110px_64px_minmax(0,140px)_1fr_72px] gap-4 px-4 py-3 border-b border-[#1a1a1a] bg-[#080808]">
          {['Type', 'Raffle', 'Address', 'Details', 'Time'].map((col, i) => (
            <span
              key={col}
              className={`font-mono text-[9px] uppercase tracking-widest text-[#333333] ${
                i === 4 ? 'text-right' : ''
              }`}
            >
              {col}
            </span>
          ))}
        </div>

        {/* Rows */}
        <AnimatePresence mode="wait">
          {loading && events.length === 0 ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-16 text-center"
            >
              <div className="font-mono text-xs text-[#333333] uppercase tracking-widest animate-pulse">
                Loading activity...
              </div>
            </motion.div>
          ) : events.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-16 text-center"
            >
              <p className="font-mono text-sm text-[#333333]">No events found.</p>
            </motion.div>
          ) : (
            <motion.div
              key={filter}
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {events.map((event) => (
                <ActivityRow key={`${event.id}-${event.block_number}-${event.log_index}`} event={event} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Load More */}
        {hasMore && !loading && events.length > 0 && (
          <div className="border-t border-[#111111] p-4 text-center">
            <button
              onClick={loadMore}
              className="font-mono text-xs uppercase tracking-wider px-6 py-2.5 border border-[#2a2a2a] text-[#555555] hover:border-[#FFB800] hover:text-[#FFB800] rounded-lg transition-all"
            >
              Load more ↓
            </button>
          </div>
        )}

        {loading && events.length > 0 && (
          <div className="border-t border-[#111111] p-4 text-center">
            <span className="font-mono text-xs text-[#333333] uppercase tracking-widest animate-pulse">
              Loading...
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityPage
