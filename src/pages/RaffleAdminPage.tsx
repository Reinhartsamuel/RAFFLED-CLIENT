import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { useAccount, useReadContract, useChainId } from 'wagmi'
import { formatUnits, type Address } from 'viem'
import { Layout } from '../components/evm/Layout'
import { CreateRaffleModal } from '../components/evm/CreateRaffleModal'
import { BACKEND_URL, apiFetch, getAuthToken } from '../config/index'
import { getRaffleManagerAddress } from '../config/evm.config'
import { EXPLORER_URL } from '../utils/constants'
import type { BackendRaffle } from '../interfaces/BackendRaffle'
import RaffleManagerABI from '../abis/RaffleManager.json'

const ADMIN_ROUTE_PATH = '/app/veryyyy-secure-admin-pageee'
const ADMIN_ALLOWED_ADDRESS = '0x753dfc03b4d37b3a316d0fe5ab9f677c0d3c20f8'
const ENABLE_ADMIN_WALLET_GUARD = false

interface PaginationMeta {
  current_page: number
  per_page: number
  last_page: number
  total: number
  from?: number | null
  to?: number | null
}

interface PaginatedResponse<T> extends PaginationMeta {
  data: T[]
}

interface AdminEvent {
  id: number
  event_type: string
  source: string
  block_number: number
  log_index: number
  tx_hash: string
  event_data: Record<string, unknown>
  created_at: string
}

interface EventSummary {
  event_type: string
  count: string
}

interface RaffleTransaction {
  id: number
  raffle_id: number
  contract_raffle_id: number
  user_address: string
  quantity: number
  ticket_tx_hash: string
  created_at: string
  updated_at: string
}

interface RaffleOwner {
  address: string
  profile_picture: string | null
  created_at: string
  updated_at: string
}

interface RaffleWinner {
  address: string
  profile_picture: string | null
  created_at: string
  updated_at: string
}

interface AdminRaffleDetail {
  id: number
  task_id: number | null
  contract_raffle_id: string
  raffle_tx_hash: string | null
  owner_address: string
  type: string
  status: string
  underfilled: boolean
  underfilled_return_amount_or_token_id: string | null
  underfilled_return_tx_hash: string | null
  platform_fee_collected_amount: string | null
  platform_fee_collected_tx_hash: string | null
  registered_on_chain: boolean
  title: string
  description: string
  prize_asset: string
  prize_asset_name: string
  prize_asset_symbol: string
  prize_asset_decimals: string
  prize_amount_or_token_id: string
  ticket_price_amount: string
  max_tickets: string
  sold_tickets: string
  expire_at: string
  winner_address: string | null
  winner_picked_tx_hash: string | null
  created_at: string
  updated_at: string
  image_url: string | null
  official_raffle: boolean
  free_raffle: boolean
  owner: RaffleOwner
  winner: RaffleWinner | null
  task: unknown | null
  payment_asset_symbol?: string
  payment_asset_decimals?: number
}

function truncate(value: string, start = 6, end = 4): string {
  if (!value || value.length <= start + end) return value
  return `${value.slice(0, start)}...${value.slice(-end)}`
}

function createAuthHeaders(): HeadersInit {
  const token = getAuthToken()
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

function WalletGuard({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { isConnected, address } = useAccount()

  useEffect(() => {
    if (!ENABLE_ADMIN_WALLET_GUARD) return
    if (!isConnected) return

    const isAllowed = (address || '').toLowerCase() === ADMIN_ALLOWED_ADDRESS.toLowerCase()
    if (!isAllowed) {
      navigate('/app', { replace: true })
    }
  }, [address, isConnected, navigate])

  return <>{children}</>
}

function StatsCards({ eventSummary }: { eventSummary: EventSummary[] }) {
  const accentMap: Record<string, string> = {
    RaffleCreated: '#FFB800',
    TicketPurchased: '#22C55E',
    WinnerPicked: '#3B82F6',
    RaffleExpired: '#F97316',
    UnderfilledPrizeReturned: '#EF4444',
    FeeChangeProposed: '#A855F7',
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-[#1f1f1f] rounded-xl overflow-hidden border border-[#1f1f1f]">
      {eventSummary.map((item) => (
        <div key={item.event_type} className="bg-[#0a0a0a] px-4 py-4 flex flex-col gap-1">
          <span className="font-sans font-bold text-2xl" style={{ color: accentMap[item.event_type] || '#999999' }}>
            {item.count}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#666666]">
            {item.event_type.replace(/([A-Z])/g, ' $1').trim()}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function RaffleAdminPage() {
  const navigate = useNavigate()
  const { isConnected } = useAccount()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [rafflesData, setRafflesData] = useState<PaginatedResponse<BackendRaffle> | null>(null)
  const [eventsData, setEventsData] = useState<PaginatedResponse<AdminEvent> | null>(null)
  const [eventSummary, setEventSummary] = useState<EventSummary[]>([])
  const [rafflesPage, setRafflesPage] = useState(1)
  const [eventsPage, setEventsPage] = useState(1)
  const [loadingRaffles, setLoadingRaffles] = useState(false)
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const token = getAuthToken()

  useEffect(() => {
    const fetchEventSummary = async () => {
      try {
        const res = await apiFetch(`${BACKEND_URL}/events/summary`, { method: 'GET' })
        if (!res.ok) return
        const body = await res.json()
        setEventSummary(Array.isArray(body) ? body : [])
      } catch {
        /* silent */
      }
    }
    fetchEventSummary()
  }, [])

  useEffect(() => {
    const fetchRaffles = async () => {
      if (!isConnected || !token) return
      try {
        setLoadingRaffles(true)
        const url = new URL(`${BACKEND_URL}/raffles`)
        url.searchParams.set('per_page', '10')
        url.searchParams.set('page', String(rafflesPage))
        url.searchParams.set('sort_by', 'created_at')
        url.searchParams.set('sort_dir', 'desc')

        const res = await apiFetch(url.toString(), { method: 'GET', headers: createAuthHeaders() })
        if (!res.ok) throw new Error('Failed to fetch raffles')

        const body = await res.json()
        setRafflesData({
          current_page: Number(body.current_page || rafflesPage),
          data: (body.data || []) as BackendRaffle[],
          per_page: Number(body.per_page || 10),
          last_page: Number(body.last_page || 1),
          total: Number(body.total || 0),
          from: body.from,
          to: body.to,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load raffles')
      } finally {
        setLoadingRaffles(false)
      }
    }

    fetchRaffles()
  }, [isConnected, token, rafflesPage])

  useEffect(() => {
    const fetchEvents = async () => {
      if (!isConnected || !token) return
      try {
        setLoadingEvents(true)
        const url = new URL(`${BACKEND_URL}/events`)
        url.searchParams.set('per_page', '20')
        url.searchParams.set('page', String(eventsPage))

        const res = await apiFetch(url.toString(), { method: 'GET', headers: createAuthHeaders() })
        if (!res.ok) throw new Error('Failed to fetch events')

        const body = await res.json()
        setEventsData({
          current_page: Number(body.current_page || eventsPage),
          data: (body.data || []) as AdminEvent[],
          per_page: Number(body.per_page || 20),
          last_page: Number(body.last_page || 1),
          total: Number(body.total || 0),
          from: body.from,
          to: body.to,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recent events')
      } finally {
        setLoadingEvents(false)
      }
    }

    fetchEvents()
  }, [eventsPage, isConnected, token])

  return (
    <WalletGuard>
      <Layout>
        <div className="p-6 lg:p-8 space-y-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="font-sans font-bold text-2xl text-[#F5F5F5]">Raffle Admin Page</h1>
                <p className="font-mono text-xs text-[#555555] mt-1">
                  Private admin control panel for raffle operations and on-chain visibility.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/app')}
                  className="font-mono text-xs uppercase tracking-wider px-4 py-2 border border-[#2a2a2a] text-[#999999] hover:text-[#F5F5F5] hover:border-[#555555] rounded-lg transition-colors"
                >
                  Back to app
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-5 py-2.5 bg-[#FFB800] text-[#050505] font-mono font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-[#FFCC33] transition-colors"
                >
                  Create Raffle
                </button>
              </div>
            </div>

            {/* Wallet guard toggle is intentionally disabled by default.
                Switch ENABLE_ADMIN_WALLET_GUARD to true to enforce address-based access.
                Allowed wallet is defined in ADMIN_ALLOWED_ADDRESS constant. */}

            {!isConnected ? <p className="font-mono text-sm text-[#EF4444]">Connect wallet to access admin data.</p> : null}
            {isConnected && !token ? <p className="font-mono text-sm text-[#EF4444]">Authenticate wallet signature to load admin data.</p> : null}
            {error ? <p className="font-mono text-sm text-[#EF4444]">{error}</p> : null}

            <StatsCards eventSummary={eventSummary} />
          </motion.div>

          <section className="border border-[#1f1f1f] rounded-xl overflow-hidden bg-[#0a0a0a]">
            <div className="px-4 py-3 border-b border-[#1f1f1f] flex items-center justify-between">
              <h2 className="font-sans font-semibold text-sm text-[#F5F5F5]">Raffles</h2>
              <span className="font-mono text-[10px] text-[#555555] uppercase tracking-widest">
                {rafflesData?.total || 0} total
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px]">
                <thead>
                  <tr className="border-b border-[#1f1f1f] bg-[#080808]">
                    {['ID', 'Title', 'Type', 'Status', 'Tickets', 'Ends', 'Winner', 'Winner Tx', 'Actions'].map((col) => (
                      <th key={col} className="text-left px-4 py-2.5 font-mono text-[9px] uppercase tracking-widest text-[#333333]">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(rafflesData?.data || []).map((raffle) => (
                    <tr key={raffle.id} className="border-b border-[#111111] hover:bg-[#101010]">
                      <td className="px-4 py-3 font-mono text-xs text-[#999999]">#{raffle.id}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[#F5F5F5]">{raffle.title}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[#999999] uppercase">{raffle.type || 'crypto'}</td>
                      <td className="px-4 py-3 font-mono text-xs uppercase">
                        {raffle.status === 'completed' ? (
                          <span className="text-[#22C55E]">{raffle.status}</span>
                        ) : raffle.status === 'open' ? (
                          <span className="text-[#FFB800]">{raffle.status}</span>
                        ) : raffle.status === 'cancelled' ? (
                          <span className="text-[#EF4444]">{raffle.status}</span>
                        ) : raffle.status === 'pending' ? (
                          <span className="text-[#3B82F6]">{raffle.status}</span>
                        ) : (
                          <span className="text-[#999999]">{raffle.status}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#999999]">
                        {Number(raffle.sold_tickets || 0)} / {Number(raffle.max_tickets || 0)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#999999]">{raffle.expire_at || raffle.ends_at || '-'}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {raffle.winner_address ? (
                          <a
                            href={`${EXPLORER_URL}/address/${raffle.winner_address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
                          >
                            {truncate(raffle.winner_address, 10, 6)}
                          </a>
                        ) : (
                          <span className="text-[#444444]">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {raffle.winner_picked_tx_hash ? (
                          <a
                            href={`${EXPLORER_URL}/tx/${raffle.winner_picked_tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
                          >
                            {truncate(raffle.winner_picked_tx_hash, 10, 6)}
                          </a>
                        ) : (
                          <span className="text-[#444444]">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`${ADMIN_ROUTE_PATH}/raffles/${raffle.id}`)}
                          className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1.5 border border-[#2a2a2a] text-[#999999] hover:text-[#FFB800] hover:border-[#FFB800] rounded transition-all"
                        >
                          View Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!loadingRaffles && (rafflesData?.data || []).length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center font-mono text-xs text-[#444444]">No raffles found.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-[#1f1f1f] flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#555555]">
                {loadingRaffles ? 'Loading...' : `Page ${rafflesData?.current_page || 1} / ${rafflesData?.last_page || 1}`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRafflesPage((prev) => Math.max(1, prev - 1))}
                  disabled={!rafflesData || rafflesData.current_page <= 1 || loadingRaffles}
                  className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-[#2a2a2a] rounded text-[#999999] disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  onClick={() => setRafflesPage((prev) => Math.min(rafflesData?.last_page || 1, prev + 1))}
                  disabled={!rafflesData || rafflesData.current_page >= rafflesData.last_page || loadingRaffles}
                  className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-[#2a2a2a] rounded text-[#999999] disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </section>

          <section className="border border-[#1f1f1f] rounded-xl overflow-hidden bg-[#0a0a0a]">
            <div className="px-4 py-3 border-b border-[#1f1f1f] flex items-center justify-between">
              <h2 className="font-sans font-semibold text-sm text-[#F5F5F5]">Recent Transactions (On-chain Events)</h2>
              <span className="font-mono text-[10px] text-[#555555] uppercase tracking-widest">
                {eventsData?.total || 0} total
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-[#1f1f1f] bg-[#080808]">
                    {['Type', 'Raffle ID', 'Block', 'Tx Hash', 'Source', 'Created At'].map((col) => (
                      <th key={col} className="text-left px-4 py-2.5 font-mono text-[9px] uppercase tracking-widest text-[#333333]">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(eventsData?.data || []).map((event) => {
                    const raffleId = Number((event.event_data?.raffle_id as number) || 0)
                    return (
                      <tr key={`${event.id}-${event.block_number}-${event.log_index}`} className="border-b border-[#111111] hover:bg-[#101010]">
                        <td className="px-4 py-3 font-mono text-xs text-[#F5F5F5]">{event.event_type}</td>
                        <td className="px-4 py-3 font-mono text-xs text-[#999999]">{raffleId ? `#${raffleId}` : '-'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-[#999999]">{event.block_number}</td>
                        <td className="px-4 py-3 font-mono text-xs text-[#999999]">{truncate(event.tx_hash, 10, 6)}</td>
                        <td className="px-4 py-3 font-mono text-xs text-[#999999] uppercase">{event.source}</td>
                        <td className="px-4 py-3 font-mono text-xs text-[#999999]">{event.created_at}</td>
                      </tr>
                    )
                  })}
                  {!loadingEvents && (eventsData?.data || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center font-mono text-xs text-[#444444]">No events found.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-[#1f1f1f] flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#555555]">
                {loadingEvents ? 'Loading...' : `Page ${eventsData?.current_page || 1} / ${eventsData?.last_page || 1}`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEventsPage((prev) => Math.max(1, prev - 1))}
                  disabled={!eventsData || eventsData.current_page <= 1 || loadingEvents}
                  className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-[#2a2a2a] rounded text-[#999999] disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  onClick={() => setEventsPage((prev) => Math.min(eventsData?.last_page || 1, prev + 1))}
                  disabled={!eventsData || eventsData.current_page >= eventsData.last_page || loadingEvents}
                  className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-[#2a2a2a] rounded text-[#999999] disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        </div>

        {showCreateModal && isConnected && token && <CreateRaffleModal onClose={() => setShowCreateModal(false)} />}
      </Layout>
    </WalletGuard>
  )
}

export function AdminRaffleDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { isConnected } = useAccount()

  const [txPage, setTxPage] = useState(1)
  const [raffleTxData, setRaffleTxData] = useState<PaginatedResponse<RaffleTransaction> | null>(null)
  const [raffleData, setRaffleData] = useState<AdminRaffleDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingRaffle, setLoadingRaffle] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const chainId = useChainId()
  const token = getAuthToken()
  const contractAddress = getRaffleManagerAddress(chainId)

  const [contractRaffleId, setContractRaffleId] = useState<number | undefined>(undefined)
  const [paymentTokenDecimals, setPaymentTokenDecimals] = useState<number>(6)

  useEffect(() => {
    console.log('[AdminDetail] fetchRaffle triggered', { id, isConnected, hasToken: !!token })
    const fetchRaffle = async () => {
      if (!id || !isConnected || !token) return

      try {
        setLoadingRaffle(true)
        const url = new URL(`${BACKEND_URL}/raffles/${id}`)
        console.log('[AdminDetail] Fetching raffle from:', url.toString())
        const res = await apiFetch(url.toString(), { method: 'GET', headers: createAuthHeaders() })
        console.log('[AdminDetail] Raffle fetch response status:', res.status)
        if (!res.ok) throw new Error('Failed to fetch raffle')

        const body = await res.json()
        console.log('[AdminDetail] Raffle response body:', JSON.stringify(body, null, 2))
        const raffle = body.data || body.raffle || body
        setRaffleData(raffle)
        const crId = raffle.contract_raffle_id ? Number(raffle.contract_raffle_id) : (raffle.id ? Number(raffle.id) : undefined)
        console.log('[AdminDetail] contract_raffle_id:', crId, '(from backend contract_raffle_id or id)')
        console.log('[AdminDetail] raffle keys:', Object.keys(raffle))
        setContractRaffleId(crId)
        const pDec = raffle.payment_asset_decimals || 6
        console.log('[AdminDetail] payment_asset_decimals:', pDec)
        setPaymentTokenDecimals(pDec)
      } catch (err) {
        console.error('[AdminDetail] Failed to fetch raffle:', err)
        setError(err instanceof Error ? err.message : 'Failed to load raffle')
      } finally {
        setLoadingRaffle(false)
      }
    }

    fetchRaffle()
  }, [id, isConnected, token])

  console.log('[AdminDetail] useReadContract getRaffle', { contractAddress, contractRaffleId, chainId })

  const { data: onChainRaffle, isLoading: isLoadingRaffle, error: raffleError } = useReadContract({
    address: contractAddress as Address,
    abi: RaffleManagerABI,
    functionName: 'getRaffle',
    args: contractRaffleId !== undefined ? [BigInt(contractRaffleId)] : undefined,
    query: { enabled: contractRaffleId !== undefined },
  })

  console.log('[AdminDetail] onChainRaffle raw:', onChainRaffle)
  console.log('[AdminDetail] onChainRaffle isLoading:', isLoadingRaffle, 'error:', raffleError)

  const { data: paymentTokenAddress } = useReadContract({
    address: contractAddress as Address,
    abi: RaffleManagerABI,
    functionName: 'paymentToken',
    query: { enabled: isConnected },
  })

  console.log('[AdminDetail] paymentTokenAddress:', paymentTokenAddress)

  const { data: onChainDecimals } = useReadContract({
    address: paymentTokenAddress as Address,
    abi: [{ name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint8' }] }],
    functionName: 'decimals',
    query: { enabled: !!paymentTokenAddress && paymentTokenAddress !== '0x0000000000000000000000000000000000000000' },
  })

  console.log('[AdminDetail] onChainDecimals:', onChainDecimals)

  const decimals = onChainDecimals !== undefined ? Number(onChainDecimals) : paymentTokenDecimals
  console.log('[AdminDetail] resolved decimals:', decimals)

  const onChainRaffleData = onChainRaffle as { ticketsSold?: bigint; ticketPrice?: bigint } | undefined

  const paymentPool = useMemo(() => {
    console.log('[AdminDetail] paymentPool useMemo', { onChainRaffleData })
    if (!onChainRaffleData) return null
    const ticketsSold = onChainRaffleData.ticketsSold
    const ticketPrice = onChainRaffleData.ticketPrice
    console.log('[AdminDetail] ticketsSold:', ticketsSold, 'ticketPrice:', ticketPrice)
    if (ticketsSold === undefined || ticketPrice === undefined) return null
    const pool = ticketsSold * ticketPrice
    console.log('[AdminDetail] calculated paymentPool (raw bigint):', pool.toString())
    return pool
  }, [onChainRaffleData])

  const formattedPaymentPool = useMemo(() => {
    if (paymentPool === null) return null
    const formatted = formatUnits(paymentPool, decimals)
    console.log('[AdminDetail] formattedPaymentPool:', formatted)
    return formatted
  }, [paymentPool, decimals])

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!id || !isConnected || !token) return

      try {
        setLoading(true)
        const url = new URL(`${BACKEND_URL}/raffles/${id}/transactions`)
        url.searchParams.set('per_page', '10')
        url.searchParams.set('page', String(txPage))

        const res = await apiFetch(url.toString(), { method: 'GET', headers: createAuthHeaders() })
        if (!res.ok) throw new Error('Failed to fetch raffle transactions')

        const body = await res.json()
        setRaffleTxData({
          current_page: Number(body.current_page || txPage),
          data: (body.data || []) as RaffleTransaction[],
          per_page: Number(body.per_page || 10),
          last_page: Number(body.last_page || 1),
          total: Number(body.total || 0),
          from: body.from,
          to: body.to,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load raffle transactions')
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [id, isConnected, token, txPage])

  return (
    <WalletGuard>
      <Layout>
        <div className="p-6 lg:p-8 space-y-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-sans font-bold text-2xl text-[#F5F5F5]">Admin Raffle Detail #{id}</h1>
              <p className="font-mono text-xs text-[#555555] mt-1">Admin transactions endpoint: /api/raffles/{id}/transactions</p>
            </div>
            <button
              onClick={() => navigate(ADMIN_ROUTE_PATH)}
              className="font-mono text-xs uppercase tracking-wider px-4 py-2 border border-[#2a2a2a] text-[#999999] hover:text-[#F5F5F5] hover:border-[#555555] rounded-lg transition-colors"
            >
              Back to admin page
            </button>
          </div>

          {!isConnected ? <p className="font-mono text-sm text-[#EF4444]">Connect wallet to view admin raffle detail.</p> : null}
          {isConnected && !token ? <p className="font-mono text-sm text-[#EF4444]">Authenticate wallet signature to load raffle detail.</p> : null}
          {error ? <p className="font-mono text-sm text-[#EF4444]">{error}</p> : null}
          {raffleError ? <p className="font-mono text-sm text-[#EF4444]">Blockchain read error: {raffleError?.message || 'Unknown'}</p> : null}
          {loadingRaffle ? <p className="font-mono text-sm text-[#999999]">Loading raffle from backend...</p> : null}
          {isLoadingRaffle && contractRaffleId !== undefined ? <p className="font-mono text-sm text-[#999999]">Reading raffle from blockchain (contract #{contractRaffleId})...</p> : null}
          {contractRaffleId === undefined && isConnected && token && !loadingRaffle ? <p className="font-mono text-sm text-[#EF4444]">No contract_raffle_id found for this raffle.</p> : null}
          {contractAddress === '0x0000000000000000000000000000000000000000' ? <p className="font-mono text-sm text-[#EF4444]">RaffleManager contract address not configured for chain {chainId}.</p> : null}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#1f1f1f] rounded-xl overflow-hidden border border-[#1f1f1f]">
            <div className="bg-[#0a0a0a] px-4 py-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#666666] mb-1">Payment Pool</p>
              {loadingRaffle || formattedPaymentPool === null ? (
                <p className="font-sans font-bold text-2xl text-[#444444]">...</p>
              ) : (
                <p className="font-sans font-bold text-2xl text-[#FFB800]">
                  {Number(formattedPaymentPool).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: decimals })}
                </p>
              )}
              <p className="font-mono text-[9px] text-[#444444] mt-1">{raffleData?.payment_asset_symbol || 'USDC'}</p>
            </div>
            <div className="bg-[#0a0a0a] px-4 py-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#666666] mb-1">Total Transactions</p>
              <p className="font-sans font-bold text-2xl text-[#F5F5F5]">{raffleTxData?.total || 0}</p>
            </div>
            <div className="bg-[#0a0a0a] px-4 py-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#666666] mb-1">On-Chain Raffle ID</p>
              {contractRaffleId !== undefined ? (
                <p className="font-sans font-bold text-2xl text-[#22C55E]">#{contractRaffleId}</p>
              ) : (
                <p className="font-sans font-bold text-2xl text-[#444444]">-</p>
              )}
            </div>
          </div>

          {raffleData && (
            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="border border-[#1f1f1f] rounded-xl overflow-hidden bg-[#0a0a0a]">
              <div className="px-4 py-3 border-b border-[#1f1f1f] flex items-center justify-between">
                <h2 className="font-sans font-semibold text-sm text-[#F5F5F5]">Raffle Detail</h2>
                <span className={`font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded ${
                  raffleData.status === 'open' ? 'text-[#FFB800] bg-[#FFB800]/10' :
                  raffleData.status === 'completed' ? 'text-[#22C55E] bg-[#22C55E]/10' :
                  'text-[#EF4444] bg-[#EF4444]/10'
                }`}>
                  {raffleData.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#1f1f1f]">
                {/* Title */}
                <div className="bg-[#0a0a0a] px-4 py-3">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#444444] mb-1">Title</p>
                  <p className="font-mono text-xs text-[#F5F5F5]">{raffleData.title}</p>
                </div>

                {/* Type */}
                <div className="bg-[#0a0a0a] px-4 py-3">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#444444] mb-1">Type</p>
                  <p className="font-mono text-xs text-[#F5F5F5] uppercase">{raffleData.type}</p>
                </div>

                {/* Prize */}
                <div className="bg-[#0a0a0a] px-4 py-3">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#444444] mb-1">Prize</p>
                  <p className="font-mono text-xs text-[#F5F5F5]">
                    {formatUnits(BigInt(raffleData.prize_amount_or_token_id || '0'), Number(raffleData.prize_asset_decimals || 6))} {raffleData.prize_asset_symbol}
                  </p>
                </div>

                {/* Prize Asset */}
                <div className="bg-[#0a0a0a] px-4 py-3">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#444444] mb-1">Prize Asset</p>
                  <a href={`${EXPLORER_URL}/token/${raffleData.prize_asset}`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-[#3B82F6] hover:text-[#60A5FA] transition-colors">
                    {truncate(raffleData.prize_asset, 10, 6)}
                  </a>
                </div>

                {/* Ticket Price */}
                <div className="bg-[#0a0a0a] px-4 py-3">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#444444] mb-1">Ticket Price</p>
                  <p className="font-mono text-xs text-[#F5F5F5]">
                    {formatUnits(BigInt(raffleData.ticket_price_amount || '0'), Number(raffleData.payment_asset_decimals || 6))} {raffleData.payment_asset_symbol || 'USDC'}
                  </p>
                </div>

                {/* Tickets */}
                <div className="bg-[#0a0a0a] px-4 py-3">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#444444] mb-1">Tickets</p>
                  <p className="font-mono text-xs text-[#F5F5F5]">
                    {Number(raffleData.sold_tickets || 0)} / {Number(raffleData.max_tickets || 0)}
                  </p>
                </div>

                {/* Owner */}
                <div className="bg-[#0a0a0a] px-4 py-3">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#444444] mb-1">Owner</p>
                  <a href={`${EXPLORER_URL}/address/${raffleData.owner_address}`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-[#3B82F6] hover:text-[#60A5FA] transition-colors">
                    {truncate(raffleData.owner_address, 10, 6)}
                  </a>
                </div>

                {/* Winner */}
                <div className="bg-[#0a0a0a] px-4 py-3">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#444444] mb-1">Winner</p>
                  {raffleData.winner_address ? (
                    <a href={`${EXPLORER_URL}/address/${raffleData.winner_address}`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-[#3B82F6] hover:text-[#60A5FA] transition-colors">
                      {truncate(raffleData.winner_address, 10, 6)}
                    </a>
                  ) : (
                    <span className="font-mono text-xs text-[#444444]">-</span>
                  )}
                </div>

                {/* Raffle TX */}
                <div className="bg-[#0a0a0a] px-4 py-3">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#444444] mb-1">Raffle TX</p>
                  {raffleData.raffle_tx_hash ? (
                    <a href={`${EXPLORER_URL}/tx/${raffleData.raffle_tx_hash}`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-[#3B82F6] hover:text-[#60A5FA] transition-colors">
                      {truncate(raffleData.raffle_tx_hash, 10, 6)}
                    </a>
                  ) : (
                    <span className="font-mono text-xs text-[#444444]">-</span>
                  )}
                </div>

                {/* Winner Picked TX */}
                <div className="bg-[#0a0a0a] px-4 py-3">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#444444] mb-1">Winner Picked TX</p>
                  {raffleData.winner_picked_tx_hash ? (
                    <a href={`${EXPLORER_URL}/tx/${raffleData.winner_picked_tx_hash}`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-[#3B82F6] hover:text-[#60A5FA] transition-colors">
                      {truncate(raffleData.winner_picked_tx_hash, 10, 6)}
                    </a>
                  ) : (
                    <span className="font-mono text-xs text-[#444444]">-</span>
                  )}
                </div>

                {/* Underfilled */}
                {raffleData.underfilled && (
                  <>
                    <div className="bg-[#0a0a0a] px-4 py-3">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-[#EF4444] mb-1">Underfilled Return Amount</p>
                      <p className="font-mono text-xs text-[#F5F5F5]">
                        {formatUnits(BigInt(raffleData.underfilled_return_amount_or_token_id || '0'), Number(raffleData.prize_asset_decimals || 6))} {raffleData.prize_asset_symbol}
                      </p>
                    </div>
                    <div className="bg-[#0a0a0a] px-4 py-3">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-[#EF4444] mb-1">Underfilled Return TX</p>
                      {raffleData.underfilled_return_tx_hash ? (
                        <a href={`${EXPLORER_URL}/tx/${raffleData.underfilled_return_tx_hash}`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-[#3B82F6] hover:text-[#60A5FA] transition-colors">
                          {truncate(raffleData.underfilled_return_tx_hash, 10, 6)}
                        </a>
                      ) : (
                        <span className="font-mono text-xs text-[#444444]">-</span>
                      )}
                    </div>
                  </>
                )}

                {/* Platform Fee */}
                {raffleData.platform_fee_collected_amount && (
                  <>
                    <div className="bg-[#0a0a0a] px-4 py-3">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-[#444444] mb-1">Platform Fee Collected</p>
                      <p className="font-mono text-xs text-[#F5F5F5]">
                        {formatUnits(BigInt(raffleData.platform_fee_collected_amount), Number(raffleData.payment_asset_decimals || 6))} {raffleData.payment_asset_symbol || 'USDC'}
                      </p>
                    </div>
                    <div className="bg-[#0a0a0a] px-4 py-3">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-[#444444] mb-1">Platform Fee TX</p>
                      {raffleData.platform_fee_collected_tx_hash ? (
                        <a href={`${EXPLORER_URL}/tx/${raffleData.platform_fee_collected_tx_hash}`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-[#3B82F6] hover:text-[#60A5FA] transition-colors">
                          {truncate(raffleData.platform_fee_collected_tx_hash, 10, 6)}
                        </a>
                      ) : (
                        <span className="font-mono text-xs text-[#444444]">-</span>
                      )}
                    </div>
                  </>
                )}

                {/* Expires */}
                <div className="bg-[#0a0a0a] px-4 py-3">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#444444] mb-1">Expires</p>
                  <p className="font-mono text-xs text-[#F5F5F5]">{raffleData.expire_at}</p>
                </div>

                {/* Official / Free */}
                <div className="bg-[#0a0a0a] px-4 py-3 flex items-center gap-3">
                  {raffleData.official_raffle && (
                    <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded text-[#FFB800] bg-[#FFB800]/10">Official</span>
                  )}
                  {raffleData.free_raffle && (
                    <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded text-[#22C55E] bg-[#22C55E]/10">Free</span>
                  )}
                </div>
              </div>
            </motion.section>
          )}

          <div className="border border-[#1f1f1f] rounded-xl overflow-hidden bg-[#0a0a0a]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px]">
                <thead>
                  <tr className="border-b border-[#1f1f1f] bg-[#080808]">
                    {['ID', 'User', 'Qty', 'Contract Raffle ID', 'Ticket Tx Hash', 'Created At'].map((col) => (
                      <th key={col} className="text-left px-4 py-2.5 font-mono text-[9px] uppercase tracking-widest text-[#333333]">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(raffleTxData?.data || []).map((tx) => (
                    <tr key={tx.id} className="border-b border-[#111111] hover:bg-[#101010]">
                      <td className="px-4 py-3 font-mono text-xs text-[#999999]">#{tx.id}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[#999999]">{truncate(tx.user_address, 10, 6)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[#F5F5F5]">{tx.quantity}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[#999999]">{tx.contract_raffle_id}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[#999999]">{truncate(tx.ticket_tx_hash, 10, 6)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[#999999]">{tx.created_at}</td>
                    </tr>
                  ))}
                  {!loading && (raffleTxData?.data || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center font-mono text-xs text-[#444444]">No transactions found for this raffle.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-[#1f1f1f] flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#555555]">
                {loading ? 'Loading...' : `Page ${raffleTxData?.current_page || 1} / ${raffleTxData?.last_page || 1}`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTxPage((prev) => Math.max(1, prev - 1))}
                  disabled={!raffleTxData || raffleTxData.current_page <= 1 || loading}
                  className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-[#2a2a2a] rounded text-[#999999] disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  onClick={() => setTxPage((prev) => Math.min(raffleTxData?.last_page || 1, prev + 1))}
                  disabled={!raffleTxData || raffleTxData.current_page >= raffleTxData.last_page || loading}
                  className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-[#2a2a2a] rounded text-[#999999] disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </WalletGuard>
  )
}
