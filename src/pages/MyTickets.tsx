import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BACKEND_URL, getAuthToken, apiFetch } from '../config/index'
import { fadeInUp, staggerContainer, staggerItem } from '../utils/animations'

interface PurchasedRaffle {
  id: number
  contract_raffle_id: number
  title: string
  status: 'open' | 'completed' | string
  tickets_bought: number
  image_url: string
}

interface MyTicketStats {
  active_entries: number
  total_wins: number
  total_spent: number
}

function TicketCard({ raffle }: { raffle: PurchasedRaffle }) {
  const navigate = useNavigate()
  const cardRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect()
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        })
      }
    }
    if (isHovered) {
      window.addEventListener('mousemove', handleMouseMove)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [isHovered])

  const isActive = raffle.status === 'open'

  return (
    <motion.div
      ref={cardRef}
      variants={staggerItem}
      className="relative bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#1f1f1f] cursor-pointer"
      style={{
        borderColor: isHovered ? 'rgba(255, 184, 0, 0.3)' : '#1f1f1f',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate(`/app/raffle/${raffle.id}`)}
      whileHover={{
        y: -4,
        boxShadow: '0 16px 32px rgba(0, 0, 0, 0.4), 0 0 16px rgba(255, 184, 0, 0.1)',
      }}
    >
      {isHovered && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            background: `radial-gradient(circle 180px at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 184, 0, 0.06), transparent)`,
          }}
        />
      )}

      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <img
          src={raffle.image_url}
          alt={raffle.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />

        {isActive && (
          <div className="absolute top-3 right-3">
            <span className="flex items-center gap-1 bg-[#050505]/80 backdrop-blur-sm rounded-full px-2 py-1 border border-[#1f1f1f]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="font-mono text-[9px] text-[#22C55E] uppercase tracking-wider">Live</span>
            </span>
          </div>
        )}

        {!isActive && (
          <div className="absolute top-3 right-3">
            <span className="bg-[#050505]/80 backdrop-blur-sm rounded-full px-2 py-1 border border-[#1f1f1f]">
              <span className="font-mono text-[9px] text-[#555555] uppercase tracking-wider">Ended</span>
            </span>
          </div>
        )}

        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="font-mono text-[13px] sm:text-[15px] font-bold text-[#F5F5F5] truncate">
            {raffle.title}
          </h3>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[9px] sm:text-[10px] text-[#555555] uppercase tracking-wider">Tickets:</span>
          </div>
          <span className="font-mono text-[13px] sm:text-[15px] font-bold text-[#FFB800]">
            {raffle.tickets_bought.toString().padStart(2, '0')}
          </span>
        </div>

        <button
          className="mt-3 w-full font-mono text-xs sm:text-sm uppercase tracking-wider px-4 py-2 border border-[#FFB800]/40 text-[#FFB800] hover:bg-[#FFB800]/10 rounded-md transition-all"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/app/raffle/${raffle.id}`)
          }}
        >
          View Details
        </button>
      </div>
    </motion.div>
  )
}

function StatsCard({
  label,
  value,
  sublabel,
  icon,
  iconColor = 'text-[#FFB800]',
}: {
  label: string
  value: string | number
  sublabel?: string
  icon: string
  iconColor?: string
}) {
  return (
    <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] sm:text-xs text-[#555555] uppercase tracking-wider">{label}</span>
        <span className={`text-lg ${iconColor}`}>{icon}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className="font-mono text-2xl sm:text-3xl font-bold text-[#F5F5F5]">{value}</span>
        {sublabel && (
          <span className="font-mono text-sm sm:text-base text-[#999999] mb-1">{sublabel}</span>
        )}
      </div>
    </div>
  )
}

export default function MyTickets() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState<PurchasedRaffle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = getAuthToken()
      const res = await apiFetch(`${BACKEND_URL}/raffles/my-tickets`, {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })
      if (!res.ok) throw new Error('Failed to fetch tickets')
      const data = await res.json()
      setTickets(data.data || [])
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const activeEntries = tickets.filter((t) => t.status === 'open').length
  const completedEntries = tickets.filter((t) => t.status !== 'open').length

  const liveTickets = tickets.filter((t) => t.status === 'open')
  const historyTickets = tickets.filter((t) => t.status !== 'open')

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between pb-4 border-b border-[#1f1f1f]"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-48 bg-[#1a1a1a] rounded animate-pulse" />
            <div className="h-6 w-8 bg-[#1a1a1a] rounded animate-pulse" />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-5 animate-pulse">
              <div className="flex justify-between mb-3">
                <div className="h-3 w-24 bg-[#1a1a1a] rounded" />
                <div className="h-5 w-5 bg-[#1a1a1a] rounded" />
              </div>
              <div className="h-8 w-16 bg-[#1a1a1a] rounded" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl overflow-hidden animate-pulse">
              <div className="aspect-[16/10] w-full bg-[#111111]" />
              <div className="p-4 space-y-3">
                <div className="flex justify-between">
                  <div className="h-3 w-16 bg-[#1a1a1a] rounded" />
                  <div className="h-5 w-8 bg-[#1a1a1a] rounded" />
                </div>
                <div className="h-9 w-full bg-[#1a1a1a] rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-dashed border-[#EF4444]/30 rounded-xl py-16 text-center bg-[#0a0a0a]"
        >
          <p className="font-mono text-sm text-[#EF4444] mb-2">Error loading tickets</p>
          <p className="font-mono text-xs text-[#555555] mb-4">{error}</p>
          <button
            className="font-mono text-xs uppercase tracking-wider px-5 py-2.5 border border-[#FFB800] text-[#FFB800] hover:bg-[#FFB800]/10 rounded-lg transition-all"
            onClick={fetchTickets}
          >
            Retry
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* ---- Header ---- */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="flex items-center justify-between pb-4 border-b border-[#1f1f1f]"
      >
        <div className="flex items-center gap-3">
          <h1 className="font-mono font-bold text-3xl sm:text-4xl text-[#F5F5F5]">MY_TICKETS</h1>
          <span className="inline-flex items-center justify-center bg-[#FFB800] text-[#050505] text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full">
            {tickets.length}
          </span>
        </div>
      </motion.div>

      {/* ---- Stats ---- */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <motion.div variants={staggerItem}>
          <StatsCard
            label="Active Entries"
            value={activeEntries.toString().padStart(2, '0')}
            icon="⊞"
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatsCard
            label="Total Wins"
            value={completedEntries.toString().padStart(2, '0')}
            sublabel="entries completed"
            icon="⚡"
            iconColor="text-[#22C55E]"
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatsCard
            label="Total Spent"
            value={tickets.reduce((acc, t) => acc + t.tickets_bought, 0)}
            sublabel="tickets purchased"
            icon="◎"
          />
        </motion.div>
      </motion.div>

      {/* ---- Live Entries ---- */}
      <section>
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="flex items-center gap-2 mb-6"
        >
          <div className="w-1.5 h-6 bg-[#FFB800] rounded-sm" />
          <h2 className="font-mono font-bold text-2xl sm:text-3xl text-[#F5F5F5]">LIVE_ENTRIES</h2>
        </motion.div>

        <AnimatePresence mode="wait">
          {liveTickets.length === 0 ? (
            <motion.div
              key="live-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="border border-dashed border-[#1f1f1f] rounded-xl py-12 text-center bg-[#0a0a0a]"
            >
              <p className="font-mono text-sm text-[#333333]">No active entries right now.</p>
              <button
                className="mt-4 font-mono text-xs uppercase tracking-wider px-5 py-2.5 border border-[#2a2a2a] text-[#555555] hover:border-[#FFB800] hover:text-[#FFB800] rounded-lg transition-all"
                onClick={() => navigate('/app')}
              >
                Browse raffles →
              </button>
            </motion.div>
          ) : (
            <motion.div
              key={`live-grid-${liveTickets.length}`}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {liveTickets.map((raffle) => (
                <TicketCard key={raffle.id} raffle={raffle} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ---- Raffle History ---- */}
      {historyTickets.length > 0 && (
        <section>
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            className="flex items-center gap-2 mb-6"
          >
            <div className="w-1.5 h-6 bg-[#333333] rounded-sm" />
            <h2 className="font-mono font-bold text-2xl sm:text-3xl text-[#F5F5F5]">RAFFLE_HISTORY</h2>
          </motion.div>

          <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1f1f1f]">
                    <th className="font-mono text-[10px] sm:text-xs text-[#555555] uppercase tracking-wider text-left px-4 sm:px-6 py-3">Raffle</th>
                    <th className="font-mono text-[10px] sm:text-xs text-[#555555] uppercase tracking-wider text-left px-4 sm:px-6 py-3 hidden sm:table-cell">Prize</th>
                    <th className="font-mono text-[10px] sm:text-xs text-[#555555] uppercase tracking-wider text-left px-4 sm:px-6 py-3">Tickets</th>
                    <th className="font-mono text-[10px] sm:text-xs text-[#555555] uppercase tracking-wider text-left px-4 sm:px-6 py-3 hidden sm:table-cell">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {historyTickets.map((raffle, idx) => (
                    <motion.tr
                      key={raffle.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.3 }}
                      className="border-b border-[#1f1f1f]/50 last:border-b-0 hover:bg-[#111111]/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/app/raffle/${raffle.id}`)}
                    >
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-3">
                          {raffle.image_url && (
                            <img
                              src={raffle.image_url}
                              alt={raffle.title}
                              className="w-8 h-8 rounded-md object-cover flex-shrink-0"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none'
                              }}
                            />
                          )}
                          <span className="font-mono text-[11px] sm:text-xs font-bold text-[#F5F5F5] truncate max-w-[120px] sm:max-w-[200px]">
                            {raffle.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                        <span className="font-mono text-xs text-[#999999]">{raffle.tickets_bought} tix</span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <span className="font-mono text-xs font-bold text-[#FFB800]">
                          {raffle.tickets_bought}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                        <span className={`inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${
                          raffle.status === 'completed'
                            ? 'text-[#22C55E] bg-[#22C55E]/10'
                            : 'text-[#555555] bg-[#1f1f1f]'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            raffle.status === 'completed' ? 'bg-[#22C55E]' : 'bg-[#555555]'
                          }`} />
                          {raffle.status === 'completed' ? 'Ended' : raffle.status}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ---- Total Empty ---- */}
      {tickets.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-dashed border-[#1f1f1f] rounded-xl py-16 text-center bg-[#0a0a0a]"
        >
          <p className="font-mono text-sm text-[#333333] mb-4">No tickets purchased yet.</p>
          <button
            className="font-mono text-xs uppercase tracking-wider px-5 py-2.5 border border-[#FFB800] text-[#FFB800] hover:bg-[#FFB800]/10 rounded-lg transition-all"
            onClick={() => navigate('/app')}
          >
            Browse raffles →
          </button>
        </motion.div>
      )}
    </div>
  )
}
