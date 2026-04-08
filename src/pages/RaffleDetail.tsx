import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppKitAccount } from '@reown/appkit/react'
import { formatUnits } from 'viem'
import { motion } from 'framer-motion'
import { BACKEND_URL, getAuthToken, apiFetch } from '../config/index'
import { Layout } from '../components/evm/Layout'
import { BuyTicketsModal } from '../components/evm/BuyTicketsModal'
import { useConfig } from 'wagmi'
import { readContract } from 'wagmi/actions'
import { staggerContainer, staggerItem, fadeInUp } from '../utils/animations'

interface LeaderboardEntry {
  rank: number
  address: string
  tickets_count: number
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
        console.log('Fetched raffle detail:', data)
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
            payment_asset: raw.prize_asset ?? raw.payment_asset ?? '',
            payment_asset_symbol: raw.prize_asset_symbol ?? raw.payment_asset_symbol ?? 'USDC',
            payment_asset_decimals: Number(raw.prize_asset_decimals ?? raw.payment_asset_decimals ?? 6),
          }
          setRaffle(normalized)
        } else {
          setRaffle(null)
        }

        if (address && (raw?.prize_asset || raw?.payment_asset) && config) {
          try {
            const paymentAssetAddr = (raw.prize_asset ?? raw.payment_asset) as `0x${string}`
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
        console.log('Leaderboard raw:', data)
        const entries: LeaderboardEntry[] = (data.data || []).map((item: Record<string, unknown>, index: number) => ({
          rank: (item.rank as number) ?? index + 1,
          address: (item.address ?? item.wallet_address ?? item.buyer_address ?? item.user_address ?? '') as string,
          tickets_count: (item.tickets_count ?? item.ticket_count ?? item.tickets ?? item.count ?? 0) as number,
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
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="font-mono text-xs text-[#333333] uppercase tracking-widest animate-pulse">
            Loading raffle...
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !raffle) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
          <p className="font-mono text-sm text-[#555555]">{error || 'Raffle not found'}</p>
          <button
            className="font-mono text-xs uppercase tracking-wider px-5 py-2.5 border border-[#2a2a2a] text-[#555555] hover:border-[#FFB800] hover:text-[#FFB800] rounded-lg transition-all"
            onClick={() => navigate('/app')}
          >
            ← Back to Raffles
          </button>
        </div>
      </Layout>
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

  const getRaffleStatusText = () => {
    if (isSoldOut) return 'Sold Out'
    if (isExpired) return 'Ended'
    return 'Active'
  }

  const getButtonText = () => {
    if (isSoldOut) return 'Sold Out'
    if (isExpired) return 'Raffle Ended'
    return 'Buy Tickets'
  }

  return (
    <Layout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">

        {/* Header */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="flex items-center justify-between mb-8 pb-5 border-b border-[#1f1f1f]"
        >
          <button
            className="font-mono text-xs uppercase tracking-wider px-4 py-2 border border-[#2a2a2a] text-[#999999] hover:border-[#FFB800] hover:text-[#FFB800] rounded-lg transition-all duration-200"
            onClick={() => navigate('/app')}
          >
            ← Back
          </button>
          <span className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full ${
            isActive
              ? 'bg-[#FFB800]/10 text-[#FFB800] border border-[#FFB800]/30'
              : 'bg-[#1f1f1f] text-[#555555] border border-[#1f1f1f]'
          }`}>
            {isActive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#22C55E] mr-1.5 align-middle animate-pulse" />}
            {getRaffleStatusText()}
          </span>
        </motion.div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left — Image */}
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            className="lg:sticky lg:top-24 h-fit"
          >
            {raffle.image_url ? (
              <img
                src={raffle.image_url}
                alt={raffle.title}
                className="w-full aspect-square object-cover rounded-xl border border-[#1f1f1f]"
              />
            ) : (
              <div className="w-full aspect-square rounded-xl border border-dashed border-[#2a2a2a] bg-[#0a0a0a] flex items-center justify-center">
                <span className="font-mono text-xs text-[#333333]">No Image</span>
              </div>
            )}
          </motion.div>

          {/* Right — Details */}
          <motion.div
            className="space-y-4"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {/* Title + Description */}
            <motion.div variants={staggerItem}>
              <h1 className="font-sans font-bold text-3xl text-[#F5F5F5] mb-3">{raffle.title}</h1>
              {raffle.description && (
                <p className="font-mono text-sm text-[#555555] leading-relaxed">{raffle.description}</p>
              )}
            </motion.div>

            {/* Prize Info */}
            <motion.div variants={staggerItem} className="rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#555555] mb-3">
                {raffle.prize_type === 'erc721' ? 'NFT Prize' : 'Prize Pool'}
              </p>
              <div className="flex items-baseline gap-2">
                {raffle.prize_type === 'erc721' ? (
                  <>
                    <span className="inline-flex items-center px-2 py-1 border border-[#FFB800]/40 bg-[#FFB800]/10 text-[#FFB800] font-mono text-xs font-bold rounded mr-1">NFT</span>
                    <span className="font-sans font-bold text-3xl text-[#F5F5F5]">
                      {raffle.prize_asset_symbol || 'NFT'} #{raffle.prize_amount}
                    </span>
                  </>
                ) : (
                  <>
                    <span
                      className="font-sans font-bold text-4xl"
                      style={{
                        background: 'linear-gradient(135deg, #FF6B00, #FFB800)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      {formatUnits(BigInt(raffle.prize_amount || 0), raffle.prize_asset_decimals || 6)}
                    </span>
                    <span className="font-mono text-xl text-[#555555]">{raffle.prize_asset_symbol}</span>
                  </>
                )}
              </div>
            </motion.div>

            {/* Ticket Info */}
            <motion.div variants={staggerItem} className="rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#555555] mb-4">Ticket Information</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[#333333] mb-1">Price per Ticket</p>
                  <p className="font-mono text-base font-semibold text-[#F5F5F5]">${raffle.ticket_price_usd}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[#333333] mb-1">Tickets Sold</p>
                  <p className="font-mono text-base font-semibold text-[#F5F5F5]">
                    {raffle.tickets_sold || 0} / {raffle.max_tickets}
                  </p>
                </div>
              </div>
              {/* Progress */}
              <div className="space-y-1.5">
                <div className="h-2 w-full rounded-full bg-[#1a1a1a] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${ticketsSoldPercent}%`,
                      background: 'linear-gradient(90deg, #FF6B00, #FFB800)',
                    }}
                  />
                </div>
                <p className="font-mono text-[10px] text-[#333333]">{ticketsSoldPercent.toFixed(1)}% sold</p>
              </div>
            </motion.div>

            {/* Timeline */}
            <motion.div variants={staggerItem} className="rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#555555] mb-4">Timeline</p>
              <div className="grid grid-cols-2 gap-4">
                {raffle.created_at && (
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[#333333] mb-1">Created</p>
                    <p className="font-mono text-sm text-[#F5F5F5]">{new Date(raffle.created_at).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[#333333] mb-1">Ends</p>
                  <p className="font-mono text-sm text-[#F5F5F5]">{new Date(raffle.ends_at).toLocaleDateString()}</p>
                </div>
              </div>
            </motion.div>

            {/* Balance */}
            <motion.div variants={staggerItem} className="flex items-center justify-between px-4 py-3 rounded-lg border border-[#1f1f1f] bg-[#111111]">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#555555]">Your Balance</span>
              <span className="font-mono text-sm font-semibold text-[#F5F5F5]">
                {balanceData ? formatUnits(balanceData, raffle.payment_asset_decimals || 6) : '0'}{' '}
                <span className="text-[#555555]">{raffle.payment_asset_symbol || 'USDC'}</span>
              </span>
            </motion.div>

            {/* Buy Button */}
            <motion.div variants={staggerItem}>
              {isConnected ? (
                <button
                  className={`w-full flex items-center justify-between px-6 py-3.5 font-mono font-bold text-sm uppercase tracking-wider rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-[#FFB800] text-[#050505] hover:bg-[#FFCC33] shadow-[0_0_20px_rgba(255,184,0,0.2)] hover:shadow-[0_0_30px_rgba(255,184,0,0.35)]'
                      : 'bg-[#111111] text-[#555555] cursor-not-allowed border border-[#1f1f1f]'
                  }`}
                  disabled={!isActive}
                  onClick={() => setShowBuyModal(true)}
                >
                  <span>{getButtonText()}</span>
                  {isActive && (
                    <div className="flex items-center gap-2 bg-[#050505]/15 rounded-md px-3 py-1">
                      <img src="/USDC.svg" alt={raffle.payment_asset_symbol || 'USDC'} className="w-4 h-4" />
                      <span className="text-xs font-bold">
                        {formatUnits(BigInt(raffle.ticket_price_amount || 0), raffle.payment_asset_decimals || 6)}
                      </span>
                    </div>
                  )}
                </button>
              ) : (
                <div className="border border-dashed border-[#2a2a2a] rounded-lg p-4 text-center">
                  <p className="font-mono text-xs text-[#333333]">Connect your wallet to buy tickets</p>
                </div>
              )}
            </motion.div>

            {/* Contract Details */}
            {raffle.contract_address && (
              <motion.div variants={staggerItem} className="rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] p-5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#555555] mb-3">Contract</p>
                <div className="bg-[#111111] border border-[#1f1f1f] rounded-lg p-3">
                  <span className="font-mono text-xs text-[#555555] break-all">{raffle.contract_address}</span>
                </div>
              </motion.div>
            )}

            {raffle.prize_tx_hash && (
              <motion.div variants={staggerItem} className="rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] p-5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#555555] mb-3">Prize Transaction</p>
                <div className="bg-[#111111] border border-[#1f1f1f] rounded-lg p-3">
                  <span className="font-mono text-xs text-[#555555] break-all">{raffle.prize_tx_hash}</span>
                </div>
              </motion.div>
            )}

            {/* Leaderboard */}
            <motion.div variants={staggerItem} className="rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#555555] mb-4">Top Ticket Holders</p>
              {leaderboardLoading ? (
                <p className="font-mono text-xs text-[#333333] animate-pulse">Loading...</p>
              ) : leaderboard.length === 0 ? (
                <p className="font-mono text-xs text-[#333333]">No tickets purchased yet.</p>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.address}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#111111] border border-[#1f1f1f]"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`font-mono text-xs font-bold w-5 text-center ${
                          entry.rank === 1 ? 'text-[#FFB800]' :
                          entry.rank === 2 ? 'text-[#aaaaaa]' :
                          entry.rank === 3 ? 'text-[#cd7f32]' :
                          'text-[#333333]'
                        }`}>
                          {entry.rank === 1 ? '1st' : entry.rank === 2 ? '2nd' : entry.rank === 3 ? '3rd' : `${entry.rank}`}
                        </span>
                        <span className="font-mono text-xs text-[#555555]">
                          {entry.address ? `${entry.address.slice(0, 6)}…${entry.address.slice(-4)}` : '—'}
                        </span>
                        {address && entry.address && entry.address.toLowerCase() === address.toLowerCase() && (
                          <span className="font-mono text-[9px] uppercase tracking-wider text-[#FFB800] border border-[#FFB800]/30 rounded px-1">You</span>
                        )}
                      </div>
                      <span className="font-mono text-xs font-semibold text-[#F5F5F5]">
                        {entry.tickets_count} {entry.tickets_count === 1 ? 'ticket' : 'tickets'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
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
    </Layout>
  )
}

export default RaffleDetail
