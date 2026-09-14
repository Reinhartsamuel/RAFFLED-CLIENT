import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { formatUnits } from 'viem'
import { useRaffleDetail, parseBackendDate } from '../hooks/useRaffles'

function useCountdown(endsAt: number) {
  const [left, setLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: true })

  useEffect(() => {
    function calc() {
      const diff = endsAt * 1000 - Date.now()
      if (diff <= 0 || isNaN(diff)) {
        setLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: true })
        return
      }
      setLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        ended: false,
      })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [endsAt])

  return left
}

const STATUS_STYLES: Record<string, string> = {
  open: 'text-[#22C55E] border-[#22C55E]/30 bg-[#22C55E]/10',
  pending: 'text-[#3B82F6] border-[#3B82F6]/30 bg-[#3B82F6]/10',
  pending_vrf: 'text-[#3B82F6] border-[#3B82F6]/30 bg-[#3B82F6]/10',
  completed: 'text-[#555555] border-[#555555]/30 bg-[#555555]/10',
  cancelled: 'text-[#EF4444] border-[#EF4444]/30 bg-[#EF4444]/10',
  canceled: 'text-[#EF4444] border-[#EF4444]/30 bg-[#EF4444]/10',
}

/**
 * Minimal iframe-friendly embed page — no navbar, sidebar, or footer.
 * Reads raffle data from the backend API.
 */
export default function EmbedRaffle() {
  const { id } = useParams<{ id: string }>()
  const raffleId = id !== undefined && /^\d+$/.test(id) ? Number(id) : undefined

  const { data: detail, isLoading, error } = useRaffleDetail(raffleId)
  const raffle = detail?.raffle ?? null

  const status = (raffle?.status || '').toLowerCase()
  const expiryTs = raffle ? parseBackendDate(raffle.expire_at || raffle.ends_at) : 0
  const countdown = useCountdown(expiryTs)

  const isEnded = !!raffle && (countdown.ended || status === 'completed' || status === 'cancelled' || status === 'canceled')
  const isSoldOut = !!raffle && Number(raffle.sold_tickets ?? 0) >= Number(raffle.max_tickets ?? 0)
  const isNft = raffle ? raffle.prize_type === 'erc721' || raffle.type === 'nft' : false
  const host = raffle?.owner_address ?? ''

  const prizeDisplay = raffle
    ? isNft
      ? `#${raffle.prize_amount_or_token_id ?? raffle.prize_amount ?? '0'}`
      : formatUnits(BigInt(raffle.prize_amount_or_token_id ?? raffle.prize_amount ?? '0'), Number(raffle.prize_asset_decimals ?? 6))
    : null

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4"
      style={{ backgroundColor: '#050505' }}
    >
      <div className="w-full max-w-sm bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#1f1f1f] flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-[#F5F5F5] tracking-wider">
            RAFFLED<span className="text-[#FFB800]">.</span>
          </span>
          {raffle && (
            <span className={`font-mono text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${STATUS_STYLES[status] ?? STATUS_STYLES.completed}`}>
              {status ? status.toUpperCase() : 'UNKNOWN'}
            </span>
          )}
        </div>

        {isLoading && (
          <div className="p-8 text-center">
            <p className="font-mono text-xs text-[#555555] animate-pulse">LOADING_RAFFLE...</p>
          </div>
        )}

        {error && (
          <div className="p-8 text-center">
            <p className="font-mono text-xs text-[#EF4444]">FAILED_TO_LOAD</p>
          </div>
        )}

        {!isLoading && !error && !raffle && (
          <div className="p-8 text-center">
            <p className="font-mono text-xs text-[#555555]">RAFFLE_NOT_FOUND</p>
          </div>
        )}

        {!isLoading && !error && raffle && (
          <>
            {/* Prize */}
            <div className="px-4 py-6 text-center border-b border-[#1f1f1f]">
              <p className="font-mono text-[10px] text-[#666666] uppercase tracking-widest mb-2">
                {isNft ? 'NFT PRIZE' : 'PRIZE POOL'}
              </p>
              <p className="font-mono font-bold text-3xl text-[#FFB800] truncate">
                {prizeDisplay}
              </p>
              <p className="font-mono text-[10px] text-[#555555] mt-1 uppercase tracking-wider">
                Raffle #{raffleId}
              </p>
            </div>

            {/* Details */}
            <div className="px-4 py-4 space-y-2.5 border-b border-[#1f1f1f]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#555555] uppercase tracking-wider">Ticket Price</span>
                <span className="font-mono text-xs text-[#F5F5F5]">
                  ${Number(formatUnits(BigInt(raffle.ticket_price_amount ?? '0'), Number(raffle.payment_asset_decimals ?? 6))).toFixed(2)} {raffle.payment_asset_symbol ?? 'USDC'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#555555] uppercase tracking-wider">Tickets</span>
                <span className="font-mono text-xs text-[#F5F5F5]">
                  {Number(raffle.sold_tickets ?? 0)} / {Number(raffle.max_tickets ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#555555] uppercase tracking-wider">Ends In</span>
                <span className="font-mono text-xs text-[#F5F5F5]">
                  {isEnded
                    ? '—'
                    : `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#555555] uppercase tracking-wider">Host</span>
                <span className="font-mono text-[10px] text-[#999999] truncate ml-3">
                  {host.slice(0, 6)}...{host.slice(-4)}
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="px-4 py-4">
              <a
                href={`/app/raffle/${raffleId}`}
                target="_top"
                rel="noopener noreferrer"
                className={`block w-full text-center p-3.5 rounded-lg font-mono text-sm font-bold uppercase tracking-wider transition-all ${
                  isEnded || isSoldOut
                    ? 'bg-[#111111] text-[#555555] cursor-not-allowed'
                    : 'bg-[#FFB800] text-[#050505] hover:bg-[#FFCC33]'
                }`}
                aria-disabled={isEnded || isSoldOut}
              >
                {isEnded ? 'Ended' : isSoldOut ? 'Sold Out' : 'Buy Tickets'}
              </a>
              <p className="text-center font-mono text-[9px] text-[#333333] mt-3 uppercase tracking-wider">
                Powered by Raffled · Chainlink VRF
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
