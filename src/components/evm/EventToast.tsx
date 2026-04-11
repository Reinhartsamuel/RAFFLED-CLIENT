import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSSEEvents } from '../../hooks/useSSEEvents'
import type { ActivityEvent, EventType } from '../../hooks/useActivityEvents'

// ─── Types ─────────────────────────────────────────────────────────────────
interface ToastItem {
  id: string
  event: ActivityEvent
}

// ─── Color map ─────────────────────────────────────────────────────────────
const EVENT_COLORS: Record<EventType, { border: string; badge: string; dot: string; icon: string }> = {
  TicketPurchased: {
    border: 'border-[#FFB800]/25',
    badge: 'bg-[#FFB800]/15 text-[#FFB800] border border-[#FFB800]/30',
    dot: 'bg-[#FFB800]',
    icon: '🎟',
  },
  WinnerPicked: {
    border: 'border-[#22C55E]/25',
    badge: 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30',
    dot: 'bg-[#22C55E]',
    icon: '🏆',
  },
  RaffleCreated: {
    border: 'border-[#3B82F6]/25',
    badge: 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30',
    dot: 'bg-[#3B82F6]',
    icon: '✦',
  },
  RaffleExpired: {
    border: 'border-[#555555]/40',
    badge: 'bg-[#555555]/20 text-[#999999] border border-[#555555]/30',
    dot: 'bg-[#555555]',
    icon: '⌛',
  },
  UnderfilledPrizeReturned: {
    border: 'border-[#EF4444]/25',
    badge: 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30',
    dot: 'bg-[#EF4444]',
    icon: '↩',
  },
  PlatformFeeCollected: {
    border: 'border-[#555555]/40',
    badge: 'bg-[#555555]/20 text-[#999999] border border-[#555555]/30',
    dot: 'bg-[#8B5CF6]',
    icon: '◈',
  },
}

// ─── Message formatting ─────────────────────────────────────────────────────
function truncate(addr: string): string {
  if (!addr || addr.length < 10) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function formatMessage(event: ActivityEvent): { title: string; subtitle: string; label: string } {
  const d = event.event_data as Record<string, unknown>
  switch (event.event_type) {
    case 'TicketPurchased': {
      const count = Number(d.ticket_count)
      return {
        label: 'JOIN',
        title: `${truncate(String(d.buyer))} purchased ${count} ticket${count !== 1 ? 's' : ''}`,
        subtitle: `Raffle #${d.raffle_id}`,
      }
    }
    case 'WinnerPicked':
      return {
        label: 'WINNER',
        title: `Winner picked`,
        subtitle: `Raffle #${d.raffle_id} → ${truncate(String(d.winner))}`,
      }
    case 'RaffleCreated': {
      const symbol = String(d.prize_symbol || 'Token')
      return {
        label: 'NEW',
        title: `New ${symbol} raffle created`,
        subtitle: `by ${truncate(String(d.host))}`,
      }
    }
    case 'RaffleExpired':
      return {
        label: 'EXPIRED',
        title: `Raffle #${d.raffle_id} expired`,
        subtitle: 'No winner drawn',
      }
    case 'UnderfilledPrizeReturned':
      return {
        label: 'RETURNED',
        title: `Prize returned to host`,
        subtitle: `Raffle #${d.raffle_id}`,
      }
    case 'PlatformFeeCollected':
      return {
        label: 'FEE',
        title: `Platform fee collected`,
        subtitle: `Raffle #${d.raffle_id}`,
      }
    default:
      return { label: 'EVENT', title: String(event.event_type), subtitle: '' }
  }
}

// ─── Animation variants ─────────────────────────────────────────────────────
const toastVariants = {
  initial: { opacity: 0, x: 80, scale: 0.94 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    x: 80,
    scale: 0.94,
    transition: { duration: 0.2, ease: [0.55, 0, 1, 0.45] },
  },
}

// ─── Individual toast card ─────────────────────────────────────────────────
const DISMISS_MS = 5000

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem
  onDismiss: (id: string) => void
}) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), DISMISS_MS)
    return () => clearTimeout(t)
  }, [toast.id, onDismiss])

  const colors = EVENT_COLORS[toast.event.event_type] ?? EVENT_COLORS.PlatformFeeCollected
  const { title, subtitle, label } = formatMessage(toast.event)

  return (
    <motion.div
      layout
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`pointer-events-auto w-72 sm:w-80 bg-[#0d0d0d] border ${colors.border} rounded-xl overflow-hidden shadow-2xl shadow-black/70 cursor-pointer select-none`}
      onClick={() => onDismiss(toast.id)}
      title="Click to dismiss"
    >
      <div className="px-4 pt-4 pb-3">
        {/* Top row: dot + label + icon */}
        <div className="flex items-center gap-2 mb-2">
          {/* Pulsing live dot */}
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${colors.dot}`}
            />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${colors.dot}`} />
          </span>
          <span
            className={`font-mono text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${colors.badge}`}
          >
            {label}
          </span>
          <span className="ml-auto text-base leading-none">{colors.icon}</span>
        </div>

        {/* Title */}
        <p className="font-sans text-sm font-semibold text-[#F5F5F5] leading-snug pr-4">
          {title}
        </p>

        {/* Subtitle */}
        {subtitle && (
          <p className="font-mono text-xs text-[#555555] mt-1 truncate">{subtitle}</p>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-[#1a1a1a] w-full">
        <div
          className="h-full"
          style={{
            width: '100%',
            background: colors.dot.replace('bg-', '').includes('[')
              ? colors.dot.replace('bg-', '').replace('[', '').replace(']', '')
              : '#FFB800',
            animation: `toast-shrink ${DISMISS_MS}ms linear forwards`,
          }}
        />
      </div>

      {/* Inline keyframe style */}
      <style>{`
        @keyframes toast-shrink {
          from { width: 100%; }
          to   { width: 0%;   }
        }
      `}</style>
    </motion.div>
  )
}

// ─── Container (mount once at app root) ────────────────────────────────────
export function EventToastContainer() {
  const { subscribe } = useSSEEvents()
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      setToasts((prev) => {
        const newToast: ToastItem = {
          id: `${event.id}-${Date.now()}`,
          event,
        }
        // Newest first, max 3 visible
        return [newToast, ...prev].slice(0, 3)
      })
    })
    return unsubscribe
  }, [subscribe])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3 items-end pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </AnimatePresence>
    </div>
  )
}
