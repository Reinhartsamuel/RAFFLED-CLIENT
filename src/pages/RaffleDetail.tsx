import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppKitAccount } from '@reown/appkit/react'
import { formatUnits } from 'viem'
import { motion } from 'framer-motion'
import { BACKEND_URL, getAuthToken, apiFetch } from '../config/index'
import { BuyTicketsModal } from '../components/evm/BuyTicketsModal'
import { useConfig } from 'wagmi'
import { readContract } from 'wagmi/actions'
import { staggerContainer, staggerItem, fadeInUp } from '../utils/animations'
import { safeBigInt } from '../utils/safeBigInt'

interface LeaderboardEntry {
  user_address: string
  tickets: string
  total_spent_raw?: string
}

interface RaffleDetailData {
  id: number
  title: string
  description: string
  prize_type?: 'erc20' | 'erc721'
  prize_amount: string
  prize_asset_symbol: string
  prize_asset_decimals?: number
  ticket_price_usd: string
  ticket_price_amount: string
  max_tickets: number
  tickets_sold?: number
  ends_at: string
  status: string
  image_url?: string
  prize_tx_hash?: string
  contract_address?: string
  creator_address?: string
  created_at?: string
  payment_asset: string
  payment_asset_symbol?: string
  payment_asset_decimals?: number
  type?: string
  underfilled?: boolean
  winner_address?: string | null
  winner_picked_tx_hash?: string | null
  official_raffle?: boolean
  free_raffle?: boolean
}

export function RaffleDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isConnected, address } = useAppKitAccount()
  const config = useConfig()

  const [raffle, setRaffle] = useState<RaffleDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [balanceData, setBalanceData] = useState<bigint | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)

  useEffect(() => {
    const fetchRaffleDetail = async () => {
      try {
        setLoading(true)
        setError(null)

        const authToken = getAuthToken()
        const res = await apiFetch(`${BACKEND_URL}/raffles/${id as string}`, {
          method: 'GET',
          headers: {
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        })

        if (!res.ok) throw new Error('Failed to fetch raffle details')

        const data = await res.json()
        const raw = data.raffle
        if (raw) {
          const normalized: RaffleDetailData = {
            id: raw.id,
            title: raw.title,
            description: raw.description,
            prize_type: raw.type === 'nft' ? 'erc721' : 'erc20',
            prize_amount: raw.prize_amount_or_token_id ?? raw.prize_amount ?? '0',
            prize_asset_symbol: raw.prize_asset_symbol ?? '',
            prize_asset_decimals: Number(raw.prize_asset_decimals ?? 6),
            ticket_price_usd: raw.ticket_price_usd ?? '0',
            ticket_price_amount: raw.ticket_price_amount ?? '0',
            max_tickets: Number(raw.max_tickets ?? 0),
            tickets_sold: Number(raw.sold_tickets ?? raw.tickets_sold ?? 0),
            ends_at: raw.expire_at ?? raw.ends_at ?? '',
            status: raw.status ?? '',
            image_url: raw.image_url,
            prize_tx_hash: raw.raffle_tx_hash ?? raw.prize_tx_hash,
            contract_address: raw.contract_address,
            creator_address: raw.owner_address ?? raw.creator_address,
            created_at: raw.created_at,
            payment_asset: raw.payment_asset ?? raw.prize_asset ?? '',
            payment_asset_symbol: raw.payment_asset_symbol ?? raw.prize_asset_symbol ?? 'USDC',
            payment_asset_decimals: Number(raw.payment_asset_decimals ?? raw.prize_asset_decimals ?? 6),
            type: raw.type,
            underfilled: raw.underfilled,
            winner_address: raw.winner_address,
            winner_picked_tx_hash: raw.winner_picked_tx_hash,
            official_raffle: raw.official_raffle,
            free_raffle: raw.free_raffle,
          }
          setRaffle(normalized)
        } else {
          setRaffle(null)
        }

        if (address && (raw?.prize_asset || raw?.payment_asset) && config) {
          try {
            const paymentAssetAddr = (raw.payment_asset ?? raw.prize_asset) as `0x${string}`
            const balance = await readContract(config, {
              address: paymentAssetAddr,
              abi: [
                {
                  name: 'balanceOf',
                  type: 'function',
                  stateMutability: 'view',
                  inputs: [{ name: 'account', type: 'address' }],
                  outputs: [{ name: 'balance', type: 'uint256' }],
                },
              ],
              functionName: 'balanceOf',
              args: [address as `0x${string}`],
            })
            setBalanceData(balance as bigint)
          } catch (balanceError) {
            console.error('Error fetching balance:', balanceError)
          }
        }
      } catch (err) {
        console.error('Error fetching raffle detail:', err)
        setError(err instanceof Error ? err.message : 'Failed to load raffle')
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchRaffleDetail()
  }, [id, address, config])

  useEffect(() => {
    if (!id) return
    const fetchLeaderboard = async () => {
      setLeaderboardLoading(true)
      try {
        const res = await apiFetch(`${BACKEND_URL}/raffles/${id}/leaderboard?per_page=10`, {
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        })
        if (!res.ok) return
        const data = await res.json()
        const entries: LeaderboardEntry[] = (data.data || []).map((item: Record<string, unknown>) => ({
          user_address: (item.user_address ?? item.address ?? item.wallet_address ?? item.buyer_address ?? '') as string,
          tickets: (item.tickets ?? item.tickets_count ?? item.ticket_count ?? item.count ?? '0') as string,
          total_spent_raw: (item.total_spent_raw ?? item.total_spent ?? '') as string,
        }))
        setLeaderboard(entries)
      } catch (err) {
        console.error('Error fetching leaderboard:', err)
      } finally {
        setLeaderboardLoading(false)
      }
    }
    fetchLeaderboard()
  }, [id])

  if (loading) {
    return (
      <div className="p-6 lg:p-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="h-3 w-40 bg-[#1a1a1a] rounded animate-pulse" />
            </div>
            <div className="h-6 w-32 bg-[#1a1a1a] rounded-full animate-pulse" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <div className="border border-[#1f1f1f] bg-[#0a0a0a] overflow-hidden">
                <div className="bg-[#0a0a0a] px-4 py-2 border-b border-[#1f1f1f] flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                </div>
                <div className="aspect-square bg-[#111111] flex items-center justify-center animate-pulse" />
              </div>
            </div>
            <div className="lg:col-span-5 space-y-4">
              <div className="h-8 w-48 bg-[#1a1a1a] rounded animate-pulse" />
              <div className="space-y-3">
                <div className="h-14 bg-[#1a1a1a] rounded animate-pulse" />
                <div className="h-14 bg-[#1a1a1a] rounded animate-pulse" />
                <div className="h-14 bg-[#1a1a1a] rounded animate-pulse" />
              </div>
              <div className="h-12 bg-[#1a1a1a] rounded animate-pulse" />
            </div>
          </div>
          <div className="mt-8 border border-[#1f1f1f] bg-[#0a0a0a]">
            <div className="px-7 py-4 border-b border-[#1f1f1f]">
              <div className="h-4 w-48 bg-[#1a1a1a] rounded animate-pulse" />
            </div>
            <div className="p-7">
              <div className="h-32 bg-[#1a1a1a] rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !raffle) {
    return (
      <div className="p-6 lg:p-10 min-h-[60vh] flex items-center justify-center">
        <div className="max-w-md text-center space-y-4">
          <div className="border border-[#1f1f1f] bg-[#0a0a0a] p-8">
            <p className="font-mono text-sm text-[#555555] mb-4">{error || 'Raffle not found'}</p>
            <button
              className="font-mono text-xs uppercase tracking-wider px-5 py-2.5 border border-[#2a2a2a] text-[#555555] hover:border-[#FFB800] hover:text-[#FFB800] rounded-sm transition-all"
              onClick={() => navigate('/app')}
            >
              [ BACK TO RAFFLES ]
            </button>
          </div>
        </div>
      </div>
    )
  }

  const ticketsSoldPercent = raffle.max_tickets > 0
    ? ((raffle.tickets_sold || 0) / raffle.max_tickets) * 100
    : 0

  const now = new Date()
  const endTime = new Date(raffle.ends_at)
  const isSoldOut = (raffle.tickets_sold || 0) >= raffle.max_tickets
  const isExpired = now > endTime
  const isActive = !isSoldOut && !isExpired

  const prizeAmountFormatted = formatUnits(BigInt(raffle.prize_amount || 0), raffle.prize_asset_decimals || 6)
  const prizeAmountDisplay = prizeAmountFormatted.includes('.')
    ? prizeAmountFormatted.replace(/\.?0+$/, '').replace(/^(\d+)(\d{3})$/, '$1,$2')
    : Number(prizeAmountFormatted).toLocaleString()

  const ticketPrice = raffle.ticket_price_usd && Number(raffle.ticket_price_usd) > 0
    ? Number(raffle.ticket_price_usd).toFixed(2)
    : formatUnits(safeBigInt(raffle.ticket_price_amount), raffle.payment_asset_decimals || 6)

  const getStatusInfo = () => {
    if (raffle.status === 'completed' || isExpired) {
      return {
        label: 'COMPLETED',
        color: 'text-red-500',
        bgColor: 'bg-zinc-800',
        borderColor: 'border-zinc-700',
        dotColor: 'bg-zinc-500',
      }
    }
    if (isSoldOut) {
      return {
        label: 'SOLD OUT',
        color: 'text-zinc-400',
        bgColor: 'bg-zinc-800',
        borderColor: 'border-zinc-700',
        dotColor: 'bg-zinc-500',
      }
    }
    return {
      label: 'ACTIVE',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      dotColor: 'bg-amber-500',
    }
  }

  const statusInfo = getStatusInfo()

  const getButtonState = () => {
    if (isSoldOut || isExpired) return 'closed'
    if (!isConnected) return 'connect'
    return 'active'
  }

  const buttonState = getButtonState()

  const formatAddress = (addr: string) => {
    if (!addr) return '—'
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatTimestamp = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
    } catch {
      return '—'
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return '—'
    }
  }

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-10">
        <div className="max-w-6xl mx-auto">

          {/* Breadcrumbs & Status Bar */}
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4"
          >
            <div className="flex items-center gap-3 text-xs font-mono min-w-0">
              <span className="text-[#555555] shrink-0">SYSTEM / RAFFLES /</span>
              <span className="text-amber-500 truncate max-w-[180px] sm:max-w-none">{raffle.title.toUpperCase().replace(/[^A-Z0-9#]/g, '_')}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <span className={`flex items-center gap-2 px-2 sm:px-3 py-1 ${statusInfo.bgColor} ${statusInfo.color} rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border ${statusInfo.borderColor}`}>
                <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 ${statusInfo.dotColor} rounded-full ${isActive ? 'animate-pulse' : ''}`} />
                {statusInfo.label}
              </span>
              {raffle.ends_at && (
                <span className="font-mono text-[10px] sm:text-xs text-[#555555]">
                  END: <span className="text-[#F5F5F5]">{formatDate(raffle.ends_at)}</span>
                </span>
              )}
            </div>
          </motion.div>

          {/* Main Grid — 7/5 split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 mb-8 sm:mb-12">

            {/* Left (col 7) — Prize Terminal Frame */}
            <div className="lg:col-span-7">
              <motion.div
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                className="border border-[#1f1f1f] bg-[#0a0a0a]/60 backdrop-blur-sm overflow-hidden relative group"
              >
                {/* Terminal Header */}
                <div className="bg-[#0a0a0a]/80 px-4 py-2 border-b border-[#1f1f1f] flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                  </div>
                  <span className="font-mono text-[10px] text-[#555555] tracking-widest">ASSET_VIEWER_V2.0</span>
                  <div className="w-10" />
                </div>

                {/* Image Container */}
                <div className="aspect-square relative flex items-center justify-center bg-[#111111]/20 overflow-hidden">
                  {/* Scanline overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{
                      background: 'linear-gradient(to bottom, transparent 50%, rgba(255, 184, 0, 0.02) 50%)',
                      backgroundSize: '100% 4px',
                    }}
                  />

                  {raffle.image_url ? (
                    <img
                      src={raffle.image_url}
                      alt={raffle.title}
                      className="w-[80%] h-[80%] object-contain transition-all duration-700 opacity-60 grayscale-[0.5]"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-mono text-xs text-[#333333]">NO_ASSET_IMAGE</span>
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/90 via-transparent to-transparent pointer-events-none" />

                  {/* Metadata Overlay */}
                  <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end z-20">
                    <div>
                      <h1 className="font-bold text-amber-500 uppercase leading-none mb-2" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '1.75rem' }}>
                        {raffle.title}
                      </h1>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="font-mono text-[10px] text-[#555555]">PRIZE POOL</p>
                          <p className="font-mono text-xl font-bold text-[#F5F5F5]">
                            {prizeAmountDisplay} <span className="text-amber-500">{raffle.prize_asset_symbol}</span>
                          </p>
                        </div>
                        <div>
                          <p className="font-mono text-[10px] text-[#555555]">TICKETS SOLD</p>
                          <p className="font-mono text-xl font-bold text-[#F5F5F5]">
                            {raffle.tickets_sold || 0} <span className="text-[#333333]">/ {raffle.max_tickets.toLocaleString()}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right (col 5) — Raffle Specifications */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="border border-[#1f1f1f] bg-[#0a0a0a]/60 backdrop-blur-sm p-7 flex flex-col h-full"
              >
                <h3 className="font-mono text-sm font-bold text-amber-500 mb-6 flex items-center gap-2">
                  <span className="text-lg">✓</span> RAFFLE_SPECIFICATIONS
                </h3>

                <div className="grid grid-cols-1 gap-4 mb-8">
                  {/* Ticket Price */}
                  <div className="bg-[#0a0a0a]/40 p-4 border border-[#1f1f1f]">
                    <p className="font-mono text-[10px] text-[#555555] mb-1">TICKET PRICE</p>
                    <p className="font-mono text-xl font-bold text-[#F5F5F5]">${ticketPrice}</p>
                  </div>

                  {/* Raffle Transaction */}
                  {raffle.prize_tx_hash && (
                    <div className="bg-[#0a0a0a]/40 p-4 border border-[#1f1f1f]">
                      <p className="font-mono text-[10px] text-[#555555] mb-1">RAFFLE_TRANSACTION</p>
                      <p className="font-mono text-[11px] text-amber-500/80 break-all select-all cursor-pointer hover:text-amber-400 transition-colors" title={raffle.prize_tx_hash}>
                        {raffle.prize_tx_hash}
                      </p>
                    </div>
                  )}

                  {/* Contract Address */}
                  {raffle.contract_address && (
                    <div className="bg-[#0a0a0a]/40 p-4 border border-[#1f1f1f]">
                      <p className="font-mono text-[10px] text-[#555555] mb-1">CONTRACT_ADDRESS</p>
                      <p className="font-mono text-[11px] text-amber-500/80 break-all select-all cursor-pointer hover:text-amber-400 transition-colors" title={raffle.contract_address}>
                        {raffle.contract_address}
                      </p>
                    </div>
                  )}

                  {/* Status */}
                  <div className="bg-[#0a0a0a]/40 p-4 border border-[#1f1f1f]">
                    <p className="font-mono text-[10px] text-[#555555] mb-1">STATUS</p>
                    <p className={`font-mono text-sm font-bold uppercase ${statusInfo.color}`}>
                      {statusInfo.label}
                    </p>
                  </div>
                </div>

                {/* Info Banner */}
                <div className="mt-auto space-y-4">
                  {!isActive && (
                    <div className="bg-[#0a0a0a]/30 border border-[#1f1f1f] p-4 rounded-sm">
                      <div className="flex items-start gap-3 text-[#555555]">
                        <span className="text-sm mt-0.5">ℹ</span>
                        <p className="font-mono text-[10px] uppercase leading-relaxed">
                          {raffle.status === 'completed'
                            ? 'This raffle has reached its final state. Winner: ' + (raffle.winner_address ? formatAddress(raffle.winner_address) : 'Pending')
                            : 'This raffle is no longer accepting entries.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Buy Button */}
                  {buttonState === 'active' && (
                    <button
                      className="w-full bg-amber-500 text-black py-4 font-mono font-bold uppercase tracking-widest text-sm hover:shadow-[0_0_15px_rgba(255,184,0,0.4)] transition-all active:scale-[0.98]"
                      onClick={() => setShowBuyModal(true)}
                    >
                      Buy Tickets
                    </button>
                  )}

                  {buttonState === 'closed' && (
                    <button
                      className="w-full bg-[#1a1a1a] text-[#555555] py-4 font-mono font-bold uppercase tracking-widest text-sm border border-[#1f1f1f] cursor-not-allowed opacity-70"
                      disabled
                    >
                      ENTRIES CLOSED
                    </button>
                  )}

                  {buttonState === 'connect' && (
                    <div className="border border-dashed border-[#2a2a2a] rounded-sm p-4 text-center">
                      <p className="font-mono text-xs text-[#555555]">Connect your wallet to buy tickets</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Bottom: Transaction Log / Leaderboard Table */}
          <motion.section
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            className="border border-[#1f1f1f] bg-[#0a0a0a]/60 backdrop-blur-sm"
          >
            <div className="px-7 py-4 border-b border-[#1f1f1f] flex items-center justify-between">
              <h3 className="font-mono text-sm font-bold text-[#F5F5F5] uppercase tracking-widest">
                TRANSACTION_LOG: RECENT_ENTRIES
              </h3>
              <div className="flex gap-2 items-center">
                <span className="w-2 h-2 rounded-full bg-zinc-600" />
                <span className="font-mono text-[10px] text-[#555555] uppercase">
                  {leaderboardLoading ? 'Loading...' : `Total: ${leaderboard.length} entries`}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-[#1f1f1f]/50 bg-[#0a0a0a]/20">
                    <th className="px-7 py-4 font-bold text-[#555555] uppercase tracking-tighter">#</th>
                    <th className="px-7 py-4 font-bold text-[#555555] uppercase tracking-tighter">User_Address</th>
                    <th className="px-7 py-4 font-bold text-[#555555] uppercase tracking-tighter">Tickets</th>
                    <th className="px-7 py-4 font-bold text-[#555555] uppercase tracking-tighter text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f1f1f]/50">
                  {leaderboardLoading ? (
                    <tr>
                      <td colSpan={4} className="px-7 py-12 text-center">
                        <span className="font-mono text-xs text-[#333333] animate-pulse">Loading entries...</span>
                      </td>
                    </tr>
                  ) : leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-7 py-12 text-center">
                        <span className="font-mono text-xs text-[#333333]">No entries yet. Be the first!</span>
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((entry, index) => {
                      const isYou = address && entry.user_address && entry.user_address.toLowerCase() === address.toLowerCase()
                      return (
                        <tr
                          key={entry.user_address}
                          className="hover:bg-amber-500/[0.02] transition-colors"
                        >
                          <td className="px-7 py-4 text-[#555555]">{String(index + 1).padStart(2, '0')}</td>
                          <td className={`px-7 py-4 ${isYou ? 'text-amber-500' : 'text-amber-500/80'}`}>
                            {formatAddress(entry.user_address)}
                            {isYou && (
                              <span className="ml-2 font-mono text-[9px] uppercase tracking-wider text-amber-500 border border-amber-500/30 px-1.5 py-0.5">You</span>
                            )}
                          </td>
                          <td className="px-7 py-4 text-[#F5F5F5]">
                            {String(entry.tickets).padStart(2, '0')}
                          </td>
                          <td className="px-7 py-4 text-right">
                            <span className="text-[10px] text-green-500 font-bold border border-green-500/20 px-2 py-0.5">
                              CONFIRMED
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-7 py-4 bg-[#0a0a0a]/10 text-center">
              <button className="font-mono text-[11px] text-[#555555] hover:text-amber-500 transition-colors uppercase tracking-widest">
                [ View Complete Log ]
              </button>
            </div>
          </motion.section>
        </div>
      </div>

      {/* Buy Tickets Modal */}
      {showBuyModal && (
        <BuyTicketsModal
          raffleId={raffle.id}
          ticketPrice={raffle.ticket_price_amount}
          paymentAsset={raffle.payment_asset}
          paymentAssetSymbol={raffle.payment_asset_symbol || 'USDC'}
          paymentAssetDecimals={raffle.payment_asset_decimals || 6}
          creatorAddress={raffle.creator_address}
          userBalanceData={balanceData}
          prizeImage={raffle.image_url}
          prizeTitle={raffle.title}
          maxTickets={raffle.max_tickets}
          ticketsSold={raffle.tickets_sold || 0}
          onClose={() => setShowBuyModal(false)}
          onSuccess={() => {
            window.location.reload()
          }}
        />
      )}
    </>
  )
}

export default RaffleDetail
