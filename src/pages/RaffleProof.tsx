import { useParams } from 'react-router-dom'
import { formatUnits } from 'viem'
import { useRaffleData, useTotalTickets, useRaffleContract } from '../hooks/useRaffleContract'
import { useAllRaffles } from '../hooks/useRaffles'
import { PrizeType } from '../types/evm.types'
import { EXPLORER_URL } from '../utils/constants'

const CONTRACT_ADDRESS = '0xc17eee20B4990021bE9cc8eCB7833706465bb8b9'

const STATUS_STYLES: Record<number, { label: string; color: string }> = {
  0: { label: 'OPEN', color: '#22C55E' },
  1: { label: 'PENDING_VRF', color: '#3B82F6' },
  2: { label: 'COMPLETED', color: '#555555' },
  3: { label: 'CANCELLED', color: '#EF4444' },
}

function truncate(value: string, start = 10, end = 8): string {
  if (!value || value.length <= start + end) return value
  return `${value.slice(0, start)}...${value.slice(-end)}`
}

/**
 * Public verifiable proof page — shows on-chain raffle data for transparency.
 * Reads via `getRaffle` (1 RPC call per page view).
 */
export default function RaffleProof() {
  const { id } = useParams<{ id: string }>()
  const raffleId = id !== undefined && /^\d+$/.test(id) ? Number(id) : undefined

  const { raffle, isLoading, error } = useRaffleData(raffleId)
  const { data: totalTickets } = useTotalTickets(raffleId)
  const { address } = useRaffleContract()

  // Winner + VRF request data comes from Ponder (0 extra RPC calls)
  const { data: allRaffles = [] } = useAllRaffles()
  const ponderRaffle = raffleId !== undefined
    ? allRaffles.find((r) => r.id === String(raffleId))
    : undefined
  const winner = ponderRaffle?.winner ?? null
  const vrfRequestId = ponderRaffle?.vrfRequestId ?? null

  const statusInfo = raffle ? (STATUS_STYLES[raffle.status] ?? STATUS_STYLES[2]) : null
  const explorerBase = EXPLORER_URL || 'https://sepolia.basescan.org'

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
            <p className="font-mono text-xs text-[#555555] animate-pulse">READING_ON_CHAIN_DATA...</p>
          </div>
        )}

        {error && (
          <div className="mt-10 border border-[#1f1f1f] rounded-xl bg-[#0a0a0a] p-8 text-center">
            <p className="font-mono text-xs text-[#EF4444]">Failed to read raffle from chain</p>
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
                    href={`${explorerBase}/address/${raffle.host}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-[#3B82F6] hover:text-[#60A5FA] transition-colors break-all"
                  >
                    {raffle.host}
                  </a>
                </div>
                <div className="bg-[#0a0a0a] px-5 py-4">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#444444] mb-1">Prize</p>
                  <p className="font-mono text-xs text-[#F5F5F5] break-all">
                    {raffle.prizeType === PrizeType.ERC721
                      ? `NFT #${raffle.prizeAmountOrTokenId.toString()}`
                      : `${formatUnits(raffle.prizeAmountOrTokenId, 6)} tokens`}
                    <span className="text-[#555555]"> @ {raffle.prizeAsset.slice(0, 6)}...{raffle.prizeAsset.slice(-4)}</span>
                  </p>
                </div>
                <div className="bg-[#0a0a0a] px-5 py-4">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#444444] mb-1">Tickets</p>
                  <p className="font-mono text-xs text-[#F5F5F5]">
                    {Number(totalTickets ?? 0)} / {raffle.maxCap.toLocaleString()}
                  </p>
                </div>
                <div className="bg-[#0a0a0a] px-5 py-4">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#444444] mb-1">Ticket Price</p>
                  <p className="font-mono text-xs text-[#F5F5F5]">
                    ${Number(formatUnits(raffle.ticketPrice, 6)).toFixed(2)} USDC
                  </p>
                </div>
                <div className="bg-[#0a0a0a] px-5 py-4">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#444444] mb-1">Expiry</p>
                  <p className="font-mono text-xs text-[#F5F5F5]">
                    {new Date(raffle.expiry * 1000).toLocaleString()}
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
                  {winner ? (
                    <a
                      href={`${explorerBase}/address/${winner}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-[#22C55E] hover:text-[#4ADE80] transition-colors break-all"
                    >
                      {winner}
                    </a>
                  ) : (
                    <p className="font-mono text-xs text-[#555555]">Pending / not drawn</p>
                  )}
                </div>
                <div className="bg-[#0a0a0a] px-5 py-4 md:col-span-2">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#444444] mb-1">VRF Request ID</p>
                  {vrfRequestId ? (
                    <p className="font-mono text-xs text-[#3B82F6] break-all">{vrfRequestId}</p>
                  ) : (
                    <p className="font-mono text-xs text-[#555555]">Not requested yet</p>
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
                All data verified on Base Sepolia · RaffledCore {CONTRACT_ADDRESS}
              </p>
              <a
                href={`${explorerBase}/address/${address}`}
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
