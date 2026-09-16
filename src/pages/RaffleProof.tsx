import { useParams } from 'react-router-dom'
import { formatUnits } from 'viem'
import { useRaffleDetail, parseBackendDate } from '../hooks/useRaffles'
import type { BackendRaffle } from '../interfaces/BackendRaffle'
import { DEFAULT_EXPLORER_URL } from '../config/chains'

const CONTRACT_ADDRESS = '0xc17eee20B4990021bE9cc8eCB7833706465bb8b9'

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  open: { label: 'OPEN', color: '#22C55E' },
  pending: { label: 'PENDING_VRF', color: '#3B82F6' },
  pending_vrf: { label: 'PENDING_VRF', color: '#3B82F6' },
  completed: { label: 'COMPLETED', color: '#555555' },
  cancelled: { label: 'CANCELLED', color: '#EF4444' },
  canceled: { label: 'CANCELLED', color: '#EF4444' },
}

function truncate(value: string, start = 10, end = 8): string {
  if (!value || value.length <= start + end) return value
  return `${value.slice(0, start)}...${value.slice(-end)}`
}

function isNft(r: BackendRaffle): boolean {
  return r.prize_type === 'erc721' || r.type === 'nft'
}

/**
 * Public verifiable proof page — shows indexed on-chain raffle data for transparency.
 * All data comes from the backend API, which indexes the RaffledCore contract.
 */
export default function RaffleProof() {
  const { id } = useParams<{ id: string }>()
  const raffleId = id !== undefined && /^\d+$/.test(id) ? Number(id) : undefined

  const { data: detail, isLoading, error } = useRaffleDetail(raffleId)
  const raffle = detail?.raffle ?? null

  const statusInfo = raffle
    ? (STATUS_STYLES[(raffle.status || '').toLowerCase()] ?? STATUS_STYLES.completed)
    : null
  const explorerBase = DEFAULT_EXPLORER_URL

  const prizeDisplay = raffle
    ? isNft(raffle)
      ? `NFT #${raffle.prize_amount_or_token_id ?? raffle.prize_amount ?? '0'}`
      : `${formatUnits(BigInt(raffle.prize_amount_or_token_id ?? raffle.prize_amount ?? '0'), Number(raffle.prize_asset_decimals ?? 6))} ${raffle.prize_asset_symbol ?? ''}`
    : '—'
  const expiryTs = raffle ? parseBackendDate(raffle.expire_at || raffle.ends_at) : 0
  const host = raffle?.owner_address ?? ''

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <span className="font-mono font-bold text-sm tracking-[0.2em]">
            RAFFLED<span className="text-[#FFB800]">.</span>
          </span>
          <a href="/" className="font-mono text-[10px] uppercase tracking-wider text-[#555555] hover:text-[#FFB800] transition-colors">
            ← Back home
          </a>
        </div>

        <p className="font-mono text-[10px] text-[#FFB800] uppercase tracking-[0.3em] mb-3">
          VERIFIABLE RAFFLE RESULTS
        </p>
        <h1 className="font-sans font-bold text-3xl md:text-4xl mb-2">
          Proof of Raffle #{raffleId ?? '—'}
        </h1>
        {statusInfo && raffle && (
          <span
            className="inline-block font-mono text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded border mt-2"
            style={{ color: statusInfo.color, borderColor: `${statusInfo.color}40`, backgroundColor: `${statusInfo.color}10` }}
          >
            {statusInfo.label}
          </span>
        )}

        {isLoading && (
          <div className="mt-10 border border-[#1f1f1f] rounded-xl bg-[#0a0a0a] p-8 text-center">
            <p className="font-mono text-xs text-[#555555] animate-pulse">READING_INDEXED_DATA...</p>
          </div>
        )}

        {error && (
          <div className="mt-10 border border-[#1f1f1f] rounded-xl bg-[#0a0a0a] p-8 text-center">
            <p className="font-mono text-xs text-[#EF4444]">Failed to load raffle data</p>
            <p className="font-mono text-[10px] text-[#555555] mt-2">{error.message}</p>
          </div>
        )}

        {!isLoading && !error && !raffle && (
          <div className="mt-10 border border-[#1f1f1f] rounded-xl bg-[#0a0a0a] p-8 text-center">
            <p className="font-mono text-xs text-[#555555]">Raffle not found.</p>
          </div>
        )}

        {!isLoading && !error && raffle && (
          <>
            {/* On-chain facts */}
            <div className="mt-8 border border-[#1f1f1f] rounded-xl overflow-hidden bg-[#0a0a0a]">
              <div className="px-5 py-3 border-b border-[#1f1f1f]">
                <h2 className="font-mono text-[10px] uppercase tracking-widest text-[#555555]">On-chain facts</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#1f1f1f]">
                <div className="bg-[#0a0a0a] px-5 py-4">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#444444] mb-1">Host</p>
                  <a
                    href={`${explorerBase}/address/${host}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-[#3B82F6] hover:text-[#60A5FA] transition-colors break-all"
                  >
                    {host}
                  </a>
                </div>
                <div className="bg-[#0a0a0a] px-5 py-4">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#444444] mb-1">Prize</p>
                  <p className="font-mono text-xs text-[#F5F5F5] break-all">
                    {prizeDisplay}
                    {raffle.prize_asset && (
                      <span className="text-[#555555]"> @ {truncate(raffle.prize_asset, 6, 4)}</span>
                    )}
                  </p>
                </div>
                <div className="bg-[#0a0a0a] px-5 py-4">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#444444] mb-1">Tickets</p>
                  <p className="font-mono text-xs text-[#F5F5F5]">
                    {Number(raffle.sold_tickets ?? 0)} / {Number(raffle.max_tickets ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-[#0a0a0a] px-5 py-4">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#444444] mb-1">Ticket Price</p>
                  <p className="font-mono text-xs text-[#F5F5F5]">
                    ${formatUnits(BigInt(raffle.ticket_price_amount ?? '0'), Number(raffle.payment_asset_decimals ?? 6))} {raffle.payment_asset_symbol ?? 'USDC'}
                  </p>
                </div>
                <div className="bg-[#0a0a0a] px-5 py-4">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#444444] mb-1">Expiry</p>
                  <p className="font-mono text-xs text-[#F5F5F5]">
                    {expiryTs > 0 ? new Date(expiryTs * 1000).toLocaleString() : '—'}
                  </p>
                </div>
                <div className="bg-[#0a0a0a] px-5 py-4">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#444444] mb-1">Underfilled</p>
                  <p className="font-mono text-xs" style={{ color: raffle.underfilled ? '#F97316' : '#22C55E' }}>
                    {raffle.underfilled ? 'YES' : 'NO'}
                  </p>
                </div>
                <div className="bg-[#0a0a0a] px-5 py-4 md:col-span-2">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#444444] mb-1">Winner</p>
                  {raffle.winner_address ? (
                    <a
                      href={`${explorerBase}/address/${raffle.winner_address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-[#22C55E] hover:text-[#4ADE80] transition-colors break-all"
                    >
                      {raffle.winner_address}
                    </a>
                  ) : (
                    <p className="font-mono text-xs text-[#555555]">Pending / not drawn</p>
                  )}
                </div>
                <div className="bg-[#0a0a0a] px-5 py-4 md:col-span-2">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#444444] mb-1">Winner Draw Tx</p>
                  {raffle.winner_picked_tx_hash ? (
                    <a
                      href={`${explorerBase}/tx/${raffle.winner_picked_tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-[#3B82F6] hover:text-[#60A5FA] transition-colors break-all"
                    >
                      {raffle.winner_picked_tx_hash}
                    </a>
                  ) : (
                    <p className="font-mono text-xs text-[#555555]">Not drawn yet</p>
                  )}
                </div>
                <div className="bg-[#0a0a0a] px-5 py-4 md:col-span-2">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#444444] mb-1">Raffle Tx</p>
                  {raffle.raffle_tx_hash ? (
                    <a
                      href={`${explorerBase}/tx/${raffle.raffle_tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-[#3B82F6] hover:text-[#60A5FA] transition-colors break-all"
                    >
                      {raffle.raffle_tx_hash}
                    </a>
                  ) : (
                    <p className="font-mono text-xs text-[#555555]">—</p>
                  )}
                </div>
              </div>
            </div>

            {/* Randomness provider */}
            <div className="mt-4 border border-[#1f1f1f] rounded-xl bg-[#0a0a0a] p-5">
              <p className="font-mono text-[9px] uppercase tracking-widest text-[#444444] mb-2">Randomness Provider</p>
              <p className="font-mono text-xs text-[#F5F5F5]">
                Chainlink VRF v2.5{' '}
                <a
                  href="https://vrf.chain.link"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#3B82F6] hover:text-[#60A5FA] transition-colors underline underline-offset-2"
                >
                  vrf.chain.link
                </a>
              </p>
              <p className="font-mono text-[10px] text-[#555555] mt-2 leading-relaxed">
                The winning ticket is selected using on-chain verifiable randomness. The draw transaction and VRF request
                are visible on BaseScan — anyone can independently verify the result.
              </p>
            </div>

            {/* Contract footer */}
            <div className="mt-8 text-center">
              <p className="font-mono text-[10px] text-[#555555]">
                Indexed from RaffledCore {CONTRACT_ADDRESS}
              </p>
              <a
                href={`${explorerBase}/address/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 font-mono text-[10px] text-[#3B82F6] hover:text-[#60A5FA] transition-colors underline underline-offset-2 break-all"
              >
                {truncate(CONTRACT_ADDRESS, 12, 10)}
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
