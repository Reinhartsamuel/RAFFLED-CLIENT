import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppKitAccount } from '@reown/appkit/react'
import { formatUnits } from 'viem'
import { motion } from 'framer-motion'
import { BuyTicketsModal } from '../components/evm/BuyTicketsModal'
import { FreeRaffleModal } from '../components/evm/FreeRaffleModal'
import { OfficialBadge } from '../components/evm/OfficialBadge'
import { useConfig } from 'wagmi'
import { readContract } from 'wagmi/actions'
import { staggerContainer, fadeInUp } from '../utils/animations'
import { safeBigInt } from '../utils/safeBigInt'
import { DEFAULT_CHAIN_ID, DEFAULT_EXPLORER_URL, getNetworkName } from '../config/chains'
import { TaskItem } from '../interfaces/TaskItem'
import { useRaffleContract } from '../hooks/useRaffleContract'
import { useRaffleDetail, useRaffleLeaderboard } from '../hooks/useRaffles'

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
  task?: TaskItem
  underfilled_return_tx_hash?: string | null
  your_tickets?: number
}

type TabId = 'overview' | 'activity' | 'details'

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'activity', label: 'Activity' },
  { id: 'details', label: 'Details' },
]

function Countdown({ target }: { target: string }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const end = new Date(target).getTime()
  if (!end || Number.isNaN(end)) return null

  const total = Math.max(0, Math.floor((end - now) / 1000))
  const parts = [
    { value: Math.floor(total / 86400), label: 'D' },
    { value: Math.floor((total % 86400) / 3600), label: 'H' },
    { value: Math.floor((total % 3600) / 60), label: 'M' },
    { value: total % 60, label: 'S' },
  ]

  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      {parts.map((part, index) => (
        <div key={part.label} className="flex items-center gap-1.5">
          {index > 0 && <span className="font-mono text-xs text-[#555555]">:</span>}
          <span className="flex items-baseline gap-0.5">
            <span className="font-mono text-sm font-bold text-[#FFB800] tabular-nums">
              {String(part.value).padStart(2, '0')}
            </span>
            <span className="font-mono text-[9px] uppercase text-[#888888]">{part.label}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

function Metric({ label, value, valueClassName = 'text-[#F5F5F5]' }: {
  label: string
  value: ReactNode
  valueClassName?: string
}) {
  return (
    <div className="px-4 py-4 min-w-0">
      <p className="font-mono text-[10px] uppercase tracking-widest text-[#888888] mb-1.5">{label}</p>
      <p className={`font-mono text-base sm:text-lg font-bold truncate ${valueClassName}`}>{value}</p>
    </div>
  )
}

function Tag({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'green' | 'amber' }) {
  const tones: Record<string, string> = {
    default: 'border-[#333333] text-[#AAAAAA]',
    green: 'border-[#22C55E]/40 text-[#22C55E]',
    amber: 'border-[#FFB800]/40 text-[#FFB800]',
  }
  return (
    <span className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 border rounded-sm ${tones[tone]}`}>
      {children}
    </span>
  )
}

function DetailRow({ label, value, href }: { label: string; value: ReactNode; href?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#1f1f1f] py-3">
      <span className="font-mono text-[11px] uppercase tracking-wider text-[#888888] flex-shrink-0">{label}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-xs text-[#FFB800] hover:text-[#FFD24A] transition-colors truncate"
        >
          {value}
        </a>
      ) : (
        <span className="font-mono text-xs text-[#F5F5F5] truncate">{value}</span>
      )}
    </div>
  )
}

/**
 * Raffle detail — all off-chain data (metadata, tickets, winner, tx hashes)
 * comes from the backend API. Contract interactions happen in the modals.
 */
export function RaffleDetail() {
  const { id } = useParams<{ id: string }>()
  const raffleId = id !== undefined && /^\d+$/.test(id) ? Number(id) : undefined
  const navigate = useNavigate()
  const { isConnected, address } = useAppKitAccount()
  const config = useConfig()

  const { address: contractAddress } = useRaffleContract()
  const { data: detail, isLoading: detailLoading, error: detailError } = useRaffleDetail(raffleId)
  const { data: leaderboardData = [], isLoading: leaderboardLoading } = useRaffleLeaderboard(raffleId)

  const backendRaffle = detail?.raffle ?? null
  const yourTickets = detail?.yourTickets ?? 0
  const fallbackPaymentAsset = (import.meta.env.VITE_MOCK_USDC_ADDRESS_SEPOLIA as string | undefined) || ''

  const [showBuyModal, setShowBuyModal] = useState(false)
  const [showFreeRaffleModal, setShowFreeRaffleModal] = useState(false)
  const [balanceData, setBalanceData] = useState<bigint | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  // USDC balance for the buy modal
  useEffect(() => {
    const token = detail?.raffle?.payment_asset as `0x${string}` | undefined
    if (!address || !token || !config) return
    readContract(config, {
      address: token,
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
      .then((b) => setBalanceData(b as bigint))
      .catch(() => setBalanceData(null))
  }, [address, config, detail?.raffle?.payment_asset])

  const raffle = useMemo<RaffleDetailData | null>(() => {
    if (!backendRaffle) return null
    const isNft = backendRaffle.prize_type === 'erc721' || backendRaffle.type === 'nft'
    return {
      id: Number(backendRaffle.contract_raffle_id ?? backendRaffle.id),
      title: backendRaffle.title || `Raffle #${backendRaffle.contract_raffle_id ?? backendRaffle.id}`,
      description: backendRaffle.description ?? '',
      prize_type: isNft ? 'erc721' : 'erc20',
      prize_amount: backendRaffle.prize_amount_or_token_id ?? backendRaffle.prize_amount ?? '0',
      prize_asset_symbol: backendRaffle.prize_asset_symbol ?? '',
      prize_asset_decimals: Number(backendRaffle.prize_asset_decimals ?? 6),
      ticket_price_usd: backendRaffle.ticket_price_usd ?? '',
      ticket_price_amount: backendRaffle.ticket_price_amount ?? '0',
      max_tickets: Number(backendRaffle.max_tickets ?? 0),
      tickets_sold: Number(backendRaffle.sold_tickets ?? 0),
      ends_at: backendRaffle.expire_at ?? backendRaffle.ends_at ?? '',
      status: (backendRaffle.status ?? '').toLowerCase(),
      image_url: backendRaffle.image_url,
      prize_tx_hash: backendRaffle.raffle_tx_hash ?? backendRaffle.prize_tx_hash,
      contract_address: backendRaffle.contract_address || contractAddress,
      creator_address: backendRaffle.owner_address ?? '',
      created_at: backendRaffle.created_at,
      payment_asset: backendRaffle.payment_asset || fallbackPaymentAsset,
      payment_asset_symbol: backendRaffle.payment_asset_symbol ?? 'USDC',
      payment_asset_decimals: Number(backendRaffle.payment_asset_decimals ?? 6),
      type: backendRaffle.type,
      underfilled: backendRaffle.underfilled,
      winner_address: backendRaffle.winner_address ?? null,
      winner_picked_tx_hash: backendRaffle.winner_picked_tx_hash ?? null,
      official_raffle: backendRaffle.official_raffle,
      free_raffle: backendRaffle.free_raffle === true,
      task: backendRaffle.task,
      underfilled_return_tx_hash: backendRaffle.underfilled_return_tx_hash ?? null,
      your_tickets: yourTickets,
    }
  }, [backendRaffle, contractAddress, fallbackPaymentAsset, yourTickets])

  const leaderboard: LeaderboardEntry[] = leaderboardData.map((entry) => ({
    user_address: entry.user_address,
    tickets: String(entry.tickets),
    total_spent_raw: entry.total_spent_raw,
  }))

  const loading = detailLoading && !backendRaffle
  const error = !loading && !backendRaffle && raffleId !== undefined
    ? (detailError ? 'Failed to load raffle data.' : 'Raffle not found.')
    : null

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

  const now = new Date()
  const endTime = raffle.ends_at ? new Date(raffle.ends_at) : new Date()
  const isSoldOut = (raffle.tickets_sold || 0) >= raffle.max_tickets
  const isExpired = now > endTime
  const isActive = !isSoldOut && !isExpired
  const isFree = raffle.free_raffle === true
  const isOfficial = raffle.official_raffle === true
  const isNftPrize = raffle.prize_type === 'erc721'

  const prizeAmountDisplay = isNftPrize
    ? `#${raffle.prize_amount}`
    : (() => {
      const formatted = formatUnits(BigInt(raffle.prize_amount || 0), raffle.prize_asset_decimals || 6)
      return formatted.includes('.')
        ? formatted.replace(/\.?0+$/, '').replace(/^(\d+)(\d{3})$/, '$1,$2')
        : Number(formatted).toLocaleString()
    })()

  const ticketPrice = raffle.ticket_price_usd && Number(raffle.ticket_price_usd) > 0
    ? Number(raffle.ticket_price_usd).toFixed(2)
    : formatUnits(safeBigInt(raffle.ticket_price_amount), raffle.payment_asset_decimals || 6)

  const isResolved = !!raffle.winner_picked_tx_hash
  const ticketsSold = raffle.tickets_sold || 0
  const isUnderfilledZeroTickets = raffle.underfilled === true && ticketsSold === 0
  const isUnderfilledRaffled = raffle.underfilled === true && ticketsSold > 0 && !!raffle.winner_address && !!raffle.winner_picked_tx_hash

  const progressPct = raffle.max_tickets > 0
    ? Math.min(100, (ticketsSold / raffle.max_tickets) * 100)
    : 0
  const progressPctLabel = Number.isInteger(progressPct) ? progressPct.toFixed(0) : progressPct.toFixed(1)

  const getStatusInfo = () => {
    if (isResolved) {
      return {
        label: 'RESOLVED',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        dotColor: 'bg-green-500',
      }
    }
    if (raffle.status === 'cancelled') {
      return {
        label: 'CANCELLED',
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        dotColor: 'bg-red-500',
      }
    }
    if (raffle.status === 'pending_vrf') {
      return {
        label: 'PENDING VRF',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        dotColor: 'bg-blue-500',
      }
    }
    if (raffle.status === 'completed' || isExpired) {
      return {
        label: 'COMPLETED',
        color: 'text-zinc-400',
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
      color: 'text-[#22C55E]',
      bgColor: 'bg-[#22C55E]/10',
      borderColor: 'border-[#22C55E]/30',
      dotColor: 'bg-[#22C55E]',
    }
  }

  const statusInfo = getStatusInfo()

  const getButtonState = () => {
    if (isSoldOut || isExpired) return 'closed'
    if (!isConnected) return 'connect'
    return 'active'
  }

  const buttonState = getButtonState()

  const isFreeRaffle = raffle.free_raffle === true
  const hasFreeRaffleTicket = isFreeRaffle && (raffle.your_tickets ?? 0) >= 1

  const getButtonLabel = () => {
    if (hasFreeRaffleTicket) return 'You Are in the Spot'
    if (isFreeRaffle) return 'Enter Free Raffle'
    return 'Buy Tickets'
  }

  const formatAddress = (addr: string) => {
    if (!addr) return '—'
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatFullDate = (dateStr: string) => {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const explorer = DEFAULT_EXPLORER_URL
  const networkName = getNetworkName(DEFAULT_CHAIN_ID)

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
              <span className="text-[#777777] shrink-0">SYSTEM / RAFFLES /</span>
              <span className="text-amber-500 truncate max-w-[180px] sm:max-w-none">{raffle.title.toUpperCase().replace(/[^A-Z0-9#]/g, '_')}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {isOfficial && <OfficialBadge showLabel />}
              <span className={`flex items-center gap-2 px-2 sm:px-3 py-1 ${statusInfo.bgColor} ${statusInfo.color} rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border ${statusInfo.borderColor}`}>
                <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 ${statusInfo.dotColor} rounded-full ${isActive ? 'animate-pulse' : ''}`} />
                {statusInfo.label}
              </span>
            </div>
          </motion.div>

          {/* Winner Banner */}
          {(address?.toLowerCase() === raffle.winner_address?.toLowerCase() && address) && (
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              className="mb-8 border border-green-500/30 bg-green-500/[0.05] p-6 rounded-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-green-500 text-2xl">🏆</span>
                <h2 className="font-mono text-lg font-bold text-green-500 uppercase tracking-widest">
                  Congratulations! You Won!
                </h2>
              </div>
              <div className="font-mono text-sm text-[#F5F5F5] leading-relaxed">
                <p className="mb-3">You are the winner of this raffle. Your prize:</p>
                <div className="bg-[#0a0a0a]/60 border border-green-500/20 p-4 rounded-sm mb-4">
                  {raffle.prize_type === 'erc721' ? (
                    <p className="text-green-400">
                      <span className="text-[#888888]">NFT:</span> Token ID <span className="text-[#F5F5F5] font-bold">#{raffle.prize_amount}</span> ({raffle.prize_asset_symbol || 'NFT'})
                    </p>
                  ) : (
                    <p className="text-green-400">
                      <span className="text-[#888888]">Token:</span> <span className="text-[#F5F5F5] font-bold">{prizeAmountDisplay}</span> {raffle.prize_asset_symbol}
                    </p>
                  )}
                </div>
                {raffle.winner_picked_tx_hash && (
                  <div>
                    <p className="font-mono text-[10px] text-[#888888] mb-1">WINNING DRAW TRANSACTION</p>
                    <a
                      href={`${explorer}/tx/${raffle.winner_picked_tx_hash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[11px] text-green-500 hover:text-green-400 transition-colors underline underline-offset-2 break-all"
                    >
                      {raffle.winner_picked_tx_hash}
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Main Grid — 7/5 split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-8 sm:mb-12">

            {/* Left (col 7) — Prize Terminal Frame */}
            <div className="lg:col-span-7">
              <motion.div
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                className="border border-[#1f1f1f] bg-[#0a0a0a]/60 backdrop-blur-sm overflow-hidden relative"
              >
                {/* Terminal Header */}
                <div className="bg-[#0a0a0a]/80 px-4 py-2.5 border-b border-[#1f1f1f] flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                  </div>
                  <span className="font-mono text-[10px] text-[#888888] tracking-widest">ASSET_VIEWER_V2.0</span>
                  <div className="w-10" />
                </div>

                {/* Image Container */}
                <div className="aspect-square relative flex items-center justify-center bg-[#0f0f0f] overflow-hidden">
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
                      className="w-full h-full object-contain p-4 sm:p-8 transition-transform duration-700 hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-mono text-xs text-[#444444]">NO_ASSET_IMAGE</span>
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/60 via-transparent to-transparent pointer-events-none" />
                </div>
              </motion.div>
            </div>

            {/* Right (col 5) — Summary */}
            <div className="lg:col-span-5">
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="flex flex-col gap-4 h-full"
              >
                {/* Tags + Title */}
                <div>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Tag>{isNftPrize ? 'NFT' : 'Token'}</Tag>
                    {isFree && <Tag tone="green">Free</Tag>}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F5] leading-snug">
                    {raffle.title}
                  </h1>
                </div>

                {/* Due date + Funding progress */}
                <div className="border border-[#1f1f1f] bg-[#0a0a0a]">
                  <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-[#1f1f1f]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm text-[#888888]">{isExpired ? 'Sale Ended' : 'Ends'}</span>
                      <span className="text-sm font-semibold text-[#F5F5F5] truncate">{formatFullDate(raffle.ends_at)}</span>
                    </div>
                    {!isExpired && raffle.ends_at && <Countdown target={raffle.ends_at} />}
                  </div>

                  <div className="px-4 sm:px-5 py-4">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-[#888888]">Funding / Total</span>
                      <span className="font-mono text-sm font-semibold text-[#F5F5F5]">
                        {ticketsSold.toLocaleString()} / {raffle.max_tickets.toLocaleString()}
                        <span className="text-[#FFB800] ml-1.5">({progressPctLabel}%)</span>
                      </span>
                    </div>
                    <div className="relative h-2.5 rounded-full bg-[#1f1f1f] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={`absolute top-0 left-0 h-full rounded-full ${
                          progressPct >= 100
                            ? 'bg-[#22C55E]'
                            : 'bg-gradient-to-r from-[#FFB800] to-[#FF9500]'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-3 border border-[#1f1f1f] bg-[#0a0a0a] divide-x divide-[#1f1f1f]">
                  <Metric
                    label="Prize Value"
                    value={
                      <>
                        {prizeAmountDisplay}
                        <span className="text-[#FFB800] text-xs ml-1">{raffle.prize_asset_symbol}</span>
                      </>
                    }
                  />
                  <Metric
                    label="Ticket Price"
                    value={isFree ? 'FREE' : `$${ticketPrice}`}
                    valueClassName={isFree ? 'text-[#22C55E]' : 'text-[#F5F5F5]'}
                  />
                  <Metric
                    label="Your Tickets"
                    value={raffle.your_tickets ?? 0}
                    valueClassName={(raffle.your_tickets ?? 0) > 0 ? 'text-[#FFB800]' : 'text-[#F5F5F5]'}
                  />
                </div>

                {/* Info Banner / Resolved UI */}
                <div className="flex flex-col gap-4 mt-auto">
                  {isUnderfilledZeroTickets && (
                    <div className="bg-amber-500/[0.05] border border-amber-500/20 p-5 rounded-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-amber-500 text-lg">⚠</span>
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-amber-500 font-bold">Raffle Underfilled</h4>
                      </div>
                      <div className="space-y-3">
                        <p className="font-mono text-[11px] text-[#F5F5F5] leading-relaxed">
                          This raffle is underfilled. Prize is returned to host.
                        </p>
                        {raffle.underfilled_return_tx_hash && (
                          <div>
                            <p className="font-mono text-[10px] text-[#888888] mb-1">RETURN TRANSACTION</p>
                            <a
                              href={`${explorer}/tx/${raffle.underfilled_return_tx_hash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-[11px] text-amber-500 hover:text-amber-400 transition-colors underline underline-offset-2 break-all"
                            >
                              {raffle.underfilled_return_tx_hash}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {isUnderfilledRaffled && (
                    <div className="bg-amber-500/[0.05] border border-amber-500/20 p-5 rounded-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-amber-500 text-lg">⚠</span>
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-amber-500 font-bold">Raffle Underfilled</h4>
                      </div>
                      <div className="space-y-3">
                        <p className="font-mono text-[11px] text-[#F5F5F5] leading-relaxed">
                          This raffle is underfilled, ticket money is raffled instead.
                        </p>
                        {raffle.winner_picked_tx_hash && (
                          <div>
                            <p className="font-mono text-[10px] text-[#888888] mb-1">WINNER PICKING TRANSACTION</p>
                            <a
                              href={`${explorer}/tx/${raffle.winner_picked_tx_hash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-[11px] text-amber-500 hover:text-amber-400 transition-colors underline underline-offset-2 break-all"
                            >
                              {raffle.winner_picked_tx_hash}
                            </a>
                          </div>
                        )}
                        {raffle.underfilled_return_tx_hash && (
                          <div>
                            <p className="font-mono text-[10px] text-[#888888] mb-1">PRIZE RETURNED TRANSACTION</p>
                            <a
                              href={`${explorer}/tx/${raffle.underfilled_return_tx_hash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-[11px] text-amber-500 hover:text-amber-400 transition-colors underline underline-offset-2 break-all"
                            >
                              {raffle.underfilled_return_tx_hash}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {isResolved && !isUnderfilledZeroTickets && !isUnderfilledRaffled && (
                    <div className="bg-green-500/[0.05] border border-green-500/20 p-5 rounded-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-green-500 text-lg">✓</span>
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-green-500 font-bold">Raffle Resolved</h4>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="font-mono text-[10px] text-[#888888] mb-1">WINNER</p>
                          <p className="font-mono text-sm text-[#F5F5F5] break-all">
                            {raffle.winner_address ? formatAddress(raffle.winner_address) : 'Pending'}
                          </p>
                        </div>
                        {raffle.winner_picked_tx_hash && (
                          <div>
                            <p className="font-mono text-[10px] text-[#888888] mb-1">DRAW TRANSACTION</p>
                            <a
                              href={`${explorer}/tx/${raffle.winner_picked_tx_hash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-[11px] text-green-500 hover:text-green-400 transition-colors underline underline-offset-2 break-all"
                            >
                              {raffle.winner_picked_tx_hash}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!isResolved && !isActive && !isUnderfilledZeroTickets && !isUnderfilledRaffled && (
                    <div className="bg-[#0a0a0a]/30 border border-[#1f1f1f] p-4 rounded-sm">
                      <div className="flex items-start gap-3 text-[#AAAAAA]">
                        <span className="text-sm mt-0.5">ℹ</span>
                        <p className="font-mono text-[11px] uppercase leading-relaxed">
                          {raffle.status === 'completed'
                            ? 'This raffle has reached its final state. Winner: ' + (raffle.winner_address ? formatAddress(raffle.winner_address) : 'Pending')
                            : 'This raffle is no longer accepting entries.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Buy Button */}
                  {buttonState === 'active' && (
                    <>
                      {hasFreeRaffleTicket ? (
                        <button
                          className="w-full bg-[#1a1a1a] text-[#22C55E] py-4 font-mono font-bold uppercase tracking-widest text-sm border border-[#22C55E]/30 cursor-not-allowed opacity-80"
                          disabled
                        >
                          You Are in the Spot
                        </button>
                      ) : (
                        <button
                          className="w-full bg-amber-500 text-black py-4 font-mono font-bold uppercase tracking-widest text-sm hover:shadow-[0_0_15px_rgba(255,184,0,0.4)] transition-all active:scale-[0.98]"
                          onClick={() => isFreeRaffle ? setShowFreeRaffleModal(true) : setShowBuyModal(true)}
                        >
                          {getButtonLabel()}
                        </button>
                      )}
                    </>
                  )}

                  {buttonState === 'closed' && (
                    <button
                      className="w-full bg-[#1a1a1a] text-[#888888] py-4 font-mono font-bold uppercase tracking-widest text-sm border border-[#1f1f1f] cursor-not-allowed opacity-70"
                      disabled
                    >
                      ENTRIES CLOSED
                    </button>
                  )}

                  {buttonState === 'connect' && (
                    <div className="border border-dashed border-[#2a2a2a] rounded-sm p-4 text-center">
                      <p className="font-mono text-xs text-[#888888]">
                        {isFreeRaffle ? 'Connect your wallet to enter free raffle' : 'Connect your wallet to buy tickets'}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Bottom: Tabs */}
          <motion.section
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            className="border border-[#1f1f1f] bg-[#0a0a0a]/60 backdrop-blur-sm"
          >
            {/* Tab bar */}
            <div className="flex items-center gap-1 px-2 sm:px-4 border-b border-[#1f1f1f] overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-4 sm:px-6 py-4 font-mono text-xs sm:text-sm uppercase tracking-wider whitespace-nowrap transition-colors ${
                    activeTab === tab.id ? 'text-[#FFB800]' : 'text-[#777777] hover:text-[#F5F5F5]'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.span
                      layoutId="raffle-tab-underline"
                      className="absolute left-3 right-3 bottom-0 h-0.5 bg-[#FFB800]"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Overview */}
            {activeTab === 'overview' && (
              <div className="p-6 sm:p-8 space-y-8">
                <div>
                  <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-[#FFB800] mb-3">Description</h4>
                  {raffle.description ? (
                    <p className="text-sm sm:text-base text-[#D4D4D4] leading-relaxed whitespace-pre-line">
                      {raffle.description}
                    </p>
                  ) : (
                    <p className="font-mono text-sm text-[#777777]">No description provided.</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-[#FFB800] mb-3">How it works</h4>
                    <ul className="space-y-2.5 text-sm text-[#D4D4D4] leading-relaxed">
                      <li className="flex gap-2.5">
                        <span className="text-[#FFB800]">•</span>
                        Buy tickets with {raffle.payment_asset_symbol || 'USDC'} — each ticket is one entry.
                      </li>
                      <li className="flex gap-2.5">
                        <span className="text-[#FFB800]">•</span>
                        The winner is drawn fully on-chain using verifiable randomness.
                      </li>
                      <li className="flex gap-2.5">
                        <span className="text-[#FFB800]">•</span>
                        Ticket sales and results are transparent and verifiable on-chain.
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-[#FFB800] mb-3">Winner & prize</h4>
                    <ul className="space-y-2.5 text-sm text-[#D4D4D4] leading-relaxed">
                      <li className="flex gap-2.5">
                        <span className="text-[#FFB800]">•</span>
                        The winner receives <span className="text-[#F5F5F5] font-semibold">{prizeAmountDisplay} {raffle.prize_asset_symbol}</span> after the draw.
                      </li>
                      <li className="flex gap-2.5">
                        <span className="text-[#FFB800]">•</span>
                        If the raffle is underfilled, the prize returns to the host and the ticket pool is raffled instead.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Activity */}
            {activeTab === 'activity' && (
              <div>
                <div className="px-6 sm:px-8 py-4 border-b border-[#1f1f1f] flex items-center justify-between">
                  <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-[#F5F5F5]">
                    Recent Entries
                  </h4>
                  <span className="font-mono text-[10px] text-[#888888] uppercase">
                    {leaderboardLoading ? 'Loading...' : `Total: ${leaderboard.length} entries`}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-[#1f1f1f]/50 bg-[#0a0a0a]/20">
                        <th className="px-6 sm:px-8 py-4 font-bold text-[#888888] uppercase tracking-tighter">#</th>
                        <th className="px-6 sm:px-8 py-4 font-bold text-[#888888] uppercase tracking-tighter">User_Address</th>
                        <th className="px-6 sm:px-8 py-4 font-bold text-[#888888] uppercase tracking-tighter">Tickets</th>
                        <th className="px-6 sm:px-8 py-4 font-bold text-[#888888] uppercase tracking-tighter text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f1f1f]/50">
                      {leaderboardLoading ? (
                        <tr>
                          <td colSpan={4} className="px-6 sm:px-8 py-12 text-center">
                            <span className="font-mono text-xs text-[#555555] animate-pulse">Loading entries...</span>
                          </td>
                        </tr>
                      ) : leaderboard.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 sm:px-8 py-12 text-center">
                            <span className="font-mono text-xs text-[#666666]">No entries yet. Be the first!</span>
                          </td>
                        </tr>
                      ) : (
                        leaderboard.map((entry, index) => {
                          const isYou = address && entry.user_address && entry.user_address.toLowerCase() === address.toLowerCase()
                          return (
                            <tr key={entry.user_address} className="hover:bg-amber-500/[0.02] transition-colors">
                              <td className="px-6 sm:px-8 py-4 text-[#888888]">{String(index + 1).padStart(2, '0')}</td>
                              <td className={`px-6 sm:px-8 py-4 ${isYou ? 'text-amber-500' : 'text-[#DDDDDD]'}`}>
                                {formatAddress(entry.user_address)}
                                {isYou && (
                                  <span className="ml-2 font-mono text-[9px] uppercase tracking-wider text-amber-500 border border-amber-500/30 px-1.5 py-0.5">You</span>
                                )}
                              </td>
                              <td className="px-6 sm:px-8 py-4 text-[#F5F5F5]">
                                {String(entry.tickets).padStart(2, '0')}
                              </td>
                              <td className="px-6 sm:px-8 py-4 text-right">
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
              </div>
            )}

            {/* Details */}
            {activeTab === 'details' && (
              <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-x-10">
                <DetailRow label="Raffle ID" value={`#${raffle.id}`} />
                <DetailRow label="Status" value={statusInfo.label} />
                <DetailRow label="Network" value={networkName} />
                <DetailRow label="Prize Type" value={isNftPrize ? 'ERC-721' : 'ERC-20'} />
                <DetailRow label="Prize Symbol" value={raffle.prize_asset_symbol || '—'} />
                {raffle.creator_address && (
                  <DetailRow
                    label="Creator"
                    value={formatAddress(raffle.creator_address)}
                    href={`${explorer}/address/${raffle.creator_address}`}
                  />
                )}
                {raffle.contract_address && (
                  <DetailRow
                    label="Contract"
                    value={formatAddress(raffle.contract_address)}
                    href={`${explorer}/address/${raffle.contract_address}`}
                  />
                )}
                {raffle.winner_address && (
                  <DetailRow
                    label="Winner"
                    value={formatAddress(raffle.winner_address)}
                    href={`${explorer}/address/${raffle.winner_address}`}
                  />
                )}
                {raffle.prize_tx_hash && (
                  <DetailRow
                    label="Raffle Transaction"
                    value={formatAddress(raffle.prize_tx_hash)}
                    href={`${explorer}/tx/${raffle.prize_tx_hash}`}
                  />
                )}
                {raffle.winner_picked_tx_hash && (
                  <DetailRow
                    label="Draw Transaction"
                    value={formatAddress(raffle.winner_picked_tx_hash)}
                    href={`${explorer}/tx/${raffle.winner_picked_tx_hash}`}
                  />
                )}
              </div>
            )}
          </motion.section>
        </div>
      </div>

      {/* Buy Tickets Modal */}
      {showBuyModal && !isFreeRaffle && (
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
            setTimeout(() => {
              window.location.reload()
            }, 2000)
          }}
        />
      )}

      {/* Free Raffle Modal */}
      {showFreeRaffleModal && (
        <FreeRaffleModal
          raffleId={raffleId!}
          contractRaffleId={raffle.id}
          prizeImage={raffle.image_url}
          prizeTitle={raffle.title}
          prizeAmount={prizeAmountDisplay}
          prizeSymbol={raffle.prize_asset_symbol}
          maxTickets={raffle.max_tickets}
          ticketsSold={raffle.tickets_sold || 0}
          creatorAddress={raffle.creator_address}
          onClose={() => setShowFreeRaffleModal(false)}
          task={raffle?.task}
          onSuccess={() => {
            setTimeout(() => {
              window.location.reload()
            }, 2000)
          }}
        />
      )}
    </>
  )
}

export default RaffleDetail
