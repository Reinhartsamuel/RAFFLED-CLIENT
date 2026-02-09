import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { createAppKit, useAppKit, useAppKitAccount, useAppKitProvider, useDisconnect } from '@reown/appkit/react'
import type { Provider } from '@reown/appkit-adapter-solana/react'
import bs58 from 'bs58'
import { metadata, projectId, solanaWeb3JsAdapter, networks, API_BASE_URL, getAuthToken } from './config'
import type { Raffle, RaffleDetail } from './utils/raffleUtils'
import { topCoins, usd, formatDateTime, formatInputDate, shorten, baseHeaders } from './utils/raffleUtils'
import { Button } from './components/landing/Button'

import './App2.css'

createAppKit({
  projectId,
  metadata,
  themeMode: 'dark',
  networks,
  adapters: [solanaWeb3JsAdapter],
  features: { analytics: true },
  themeVariables: {
    '--w3m-accent': '#DFFF00',
    '--w3m-color-mix': '#000000',
    '--w3m-color-mix-strength': 25,
  },
})

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const Eyebrow = ({ children }: { children: string }) => (
  <p className="font-jetbrains text-xs uppercase tracking-widest text-pure-black/50 mb-1">{children}</p>
)

const SectionHeader = ({ eyebrow, title }: { eyebrow: string; title: string }) => (
  <div className="mb-4">
    <Eyebrow>{eyebrow}</Eyebrow>
    <h2 className="font-syne font-black text-2xl text-pure-black">{title}</h2>
  </div>
)

const InputField = ({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) => (
  <label className="flex flex-col gap-1">
    <span className="font-jetbrains text-xs uppercase tracking-wider text-pure-black/60 font-semibold">{label}</span>
    {children}
  </label>
)

const inputClass = 'w-full border-2 border-pure-black bg-bg-white font-jetbrains text-sm px-3 py-2 focus:outline-none focus:border-safety-lime'

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function App2() {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider<Provider>('solana')
  const { disconnect } = useDisconnect()

  const [raffles, setRaffles] = useState<Raffle[]>([])
  const [view, setView] = useState<'explore' | 'manage'>('explore')
  const [filters, setFilters] = useState({ type: 'all', status: 'active' })
  const [raffleLoading, setRaffleLoading] = useState(false)
  const [detail, setDetail] = useState<RaffleDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [purchaseForm, setPurchaseForm] = useState({ quantity: 1, ticket_tx_hash: '' })
  const [createForm, setCreateForm] = useState({
    type: 'crypto' as Raffle['type'],
    title: '',
    description: '',
    prize_tx_hash: '',
    prize_amount: '',
    prize_asset_symbol: topCoins[0],
    ticket_price_usd: '',
    max_tickets: '',
    ends_at: '',
    image: null as File | null,
  })

  useEffect(() => {
    if (createForm.type !== 'crypto') return
    const amt = createForm.prize_amount
    const sym = createForm.prize_asset_symbol
    if (!amt || !sym) return
    const pretty = (() => {
      const num = Number(amt)
      if (Number.isNaN(num)) return amt
      return num.toFixed(8).replace(/\.0+$/, '').replace(/\.([0-9]*?)0+$/, '.$1').replace(/\.$/, '')
    })()
    const autoTitle = `${pretty} ${sym} prize`
    if (autoTitle !== createForm.title) {
      setCreateForm((prev) => ({ ...prev, title: autoTitle }))
    }
  }, [createForm.type, createForm.prize_amount, createForm.prize_asset_symbol])

  const [updateForm, setUpdateForm] = useState({
    title: '',
    description: '',
    max_tickets: '',
    ends_at: '',
    image: null as File | null,
  })
  const [message, setMessage] = useState<string | null>(null)
  const [authStatus, setAuthStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [autoAuthRan, setAutoAuthRan] = useState(false)

  const activeToken = useMemo(() => getAuthToken(), [authStatus])

  // -----------------------------------------------------------------------
  // API / logic (identical to App.tsx)
  // -----------------------------------------------------------------------

  const fetchRaffles = async () => {
    try {
      setRaffleLoading(true)
      const params = new URLSearchParams()
      if (filters.type !== 'all') params.append('type', filters.type)
      if (filters.status !== 'all') params.append('status', filters.status)
      const response = await fetch(`${API_BASE_URL}/raffles?${params.toString()}`, {
        headers: baseHeaders(),
      })
      const data = await response.json()
      setRaffles(data.data || [])
    } catch {
      setMessage('Failed to load raffles. Please retry.')
    } finally {
      setRaffleLoading(false)
    }
  }

  const loadRaffleDetail = async (raffleId: number) => {
    try {
      setDetailLoading(true)
      const [detailRes, availabilityRes, leaderboardRes, txRes] = await Promise.all([
        fetch(`${API_BASE_URL}/raffles/${raffleId}`, { headers: baseHeaders(activeToken || undefined) }),
        fetch(`${API_BASE_URL}/raffles/${raffleId}/tickets/availability`, { headers: baseHeaders() }),
        fetch(`${API_BASE_URL}/raffles/${raffleId}/leaderboard`, { headers: baseHeaders() }),
        fetch(`${API_BASE_URL}/raffles/${raffleId}/transactions`, { headers: baseHeaders() }),
      ])
      const detailJson = await detailRes.json()
      const availabilityJson = await availabilityRes.json()
      const leaderboardJson = await leaderboardRes.json()
      const txJson = await txRes.json()
      setDetail({
        raffle: detailJson.raffle,
        your_tickets: detailJson.your_tickets,
        can_purchase: availabilityJson.can_purchase,
        remaining: availabilityJson.remaining,
        leaderboard: leaderboardJson?.data || [],
        transactions: txJson?.data || [],
      })
      setPurchaseForm({ quantity: 1, ticket_tx_hash: '' })
      setUpdateForm({ title: '', description: '', max_tickets: '', ends_at: '', image: null })
    } catch {
      setMessage('Failed to load raffle details.')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleSignIn = async (auto = false) => {
    if (!isConnected || !walletProvider || !address) {
      if (!auto) open()
      return
    }
    setAuthStatus('loading')
    setMessage(null)
    try {
      const nonceRes = await fetch(`${API_BASE_URL}/auth/nonce`, {
        headers: { 'Content-Type': 'application/json', ...baseHeaders() },
      })
      const { nonce } = await nonceRes.json()
      const msg = [
        'Sign in with Solana to Raffled',
        '',
        `Address: ${address}`,
        `Nonce: ${nonce}`,
        `Issued At: ${new Date().toISOString()}`,
      ].join('\n')
      const encoded = new TextEncoder().encode(msg)
      const signed = await walletProvider.signMessage(encoded)
      const signature = bs58.encode(signed)
      const verifyRes = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...baseHeaders() },
        body: JSON.stringify({ message: msg, signature, address }),
      })
      if (!verifyRes.ok) throw new Error('Verification failed')
      const data = await verifyRes.json()
      localStorage.setItem('access_token', data.token)
      setAuthStatus('ok')
      setMessage('Signed in with Solana.')
    } catch {
      setAuthStatus('error')
      setMessage('Login failed. Ensure wallet is connected.')
      if (auto) {
        setAutoAuthRan(false)
        disconnect().catch(() => null)
      }
    }
  }

  const handleCreateRaffle = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!activeToken) { setMessage('Please sign in first.'); return }
    if (createForm.type === 'nft' && !createForm.image) { setMessage('Prize image is required for NFT raffles.'); return }
    if (createForm.type === 'crypto') {
      if (!createForm.prize_asset_symbol) { setMessage('Please select a prize coin.'); return }
      if (!createForm.prize_amount) { setMessage('Please enter the prize amount.'); return }
    }
    try {
      setMessage(null)
      const formData = new FormData()
      formData.append('type', createForm.type)
      formData.append('title', createForm.title)
      formData.append('description', createForm.description)
      if (createForm.type === 'nft' && createForm.image) formData.append('image', createForm.image)
      formData.append('prize_tx_hash', createForm.prize_tx_hash)
      if (createForm.type === 'crypto') {
        formData.append('prize_asset_symbol', createForm.prize_asset_symbol)
        formData.append('prize_amount', createForm.prize_amount)
      }
      formData.append('ticket_price_usd', createForm.ticket_price_usd)
      formData.append('max_tickets', createForm.max_tickets)
      formData.append('ends_at', formatInputDate(createForm.ends_at))
      const res = await fetch(`${API_BASE_URL}/raffles`, {
        method: 'POST',
        headers: baseHeaders(activeToken || undefined),
        body: formData,
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => null)
        throw new Error(errJson?.message || 'Failed to create raffle.')
      }
      setMessage('Raffle created successfully.')
      setCreateForm({
        type: 'crypto', title: '', description: '', prize_tx_hash: '',
        prize_asset_symbol: topCoins[0], prize_amount: '',
        ticket_price_usd: '', max_tickets: '', ends_at: '', image: null,
      })
      fetchRaffles()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create raffle.')
    }
  }

  const handlePurchase = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!detail) return
    if (!activeToken) { setMessage('Please sign in before buying tickets.'); return }
    try {
      const res = await fetch(`${API_BASE_URL}/raffles/${detail.raffle.id}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...baseHeaders(activeToken) },
        body: JSON.stringify(purchaseForm),
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => null)
        throw new Error(errJson?.message || 'Ticket purchase failed.')
      }
      setMessage('Tickets purchased.')
      loadRaffleDetail(detail.raffle.id)
      fetchRaffles()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Ticket purchase failed.')
    }
  }

  const handleUpdateRaffle = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!detail) return
    if (!activeToken) { setMessage('Sign in is required to update the raffle.'); return }
    const formData = new FormData()
    if (updateForm.title) formData.append('title', updateForm.title)
    if (updateForm.description) formData.append('description', updateForm.description)
    if (updateForm.max_tickets) formData.append('max_tickets', updateForm.max_tickets)
    if (updateForm.ends_at) formData.append('ends_at', formatInputDate(updateForm.ends_at))
    if (updateForm.image) formData.append('image', updateForm.image)
    try {
      const res = await fetch(`${API_BASE_URL}/raffles/${detail.raffle.id}`, {
        method: 'POST',
        headers: baseHeaders(activeToken),
        body: formData,
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => null)
        throw new Error(errJson?.message || 'Failed to update raffle.')
      }
      setMessage('Raffle updated.')
      loadRaffleDetail(detail.raffle.id)
      fetchRaffles()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update raffle.')
    }
  }

  const handleDeliver = async () => {
    if (!detail) return
    if (!activeToken) { setMessage('Sign in is required to mark delivered.'); return }
    try {
      const res = await fetch(`${API_BASE_URL}/admin/raffles/${detail.raffle.id}/deliver`, {
        method: 'POST',
        headers: baseHeaders(activeToken),
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => null)
        throw new Error(errJson?.message || 'Failed to mark delivered.')
      }
      setMessage('Prize marked as delivered.')
      loadRaffleDetail(detail.raffle.id)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to mark delivered.')
    }
  }

  useEffect(() => {
    fetchRaffles()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.type, filters.status])

  useEffect(() => {
    if (isConnected && !autoAuthRan && authStatus !== 'loading') {
      setAutoAuthRan(true)
      handleSignIn(true)
    }
    if (!isConnected && autoAuthRan) {
      setAutoAuthRan(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, authStatus, autoAuthRan, address, walletProvider])

  // -----------------------------------------------------------------------
  // Derived
  // -----------------------------------------------------------------------
  const selectedId = detail?.raffle?.id
  const myRaffles = raffles.filter(
    (r) => r.owner_address && address && r.owner_address.toLowerCase() === address.toLowerCase()
  )
  const isOwner = detail && address && detail.raffle.owner_address.toLowerCase() === address.toLowerCase()

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------

  const renderBadge = (label: string, accent: 'lime' | 'cyan') => (
    <span className={`inline-block ${accent === 'lime' ? 'bg-safety-lime' : 'bg-cyan-accent'} border border-pure-black font-jetbrains text-xs font-black uppercase px-2 py-0.5`}>
      {label}
    </span>
  )

  const renderRaffleCard = (item: Raffle) => (
    <article
      key={item.id}
      onClick={() => loadRaffleDetail(item.id)}
      className={`border-2 border-pure-black shadow-brutal bg-bg-white cursor-pointer hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-brutal-lg transition-all duration-150 flex flex-col ${selectedId === item.id ? 'border-safety-lime' : ''}`}
    >
      <img src={item.image_url} alt={item.title} className="w-full h-40 object-cover" />
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex gap-2 flex-wrap">
          {renderBadge(item.type.toUpperCase(), 'lime')}
          {renderBadge(item.status, 'cyan')}
        </div>
        <h3 className="font-syne font-bold text-base text-pure-black leading-tight">{item.title}</h3>
        <p className="font-jetbrains text-xs text-pure-black/50 leading-relaxed line-clamp-2">{item.description}</p>
        <div className="font-jetbrains text-xs text-pure-black/50 flex justify-between mt-auto">
          <span>{usd(item.ticket_price_usd)} / ticket</span>
          <span>{item.sold_tickets}/{item.max_tickets}</span>
        </div>
        <p className="font-jetbrains text-xs text-pure-black/40">Ends: {formatDateTime(item.ends_at)}</p>
      </div>
    </article>
  )

  // -----------------------------------------------------------------------
  // JSX
  // -----------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-bg-white flex flex-col">

      {/* ============================================================
          TOPBAR
          ============================================================ */}
      <header className="w-full bg-pure-black border-b-2 border-pure-black flex items-center justify-between px-4 md:px-6 py-3 gap-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-jetbrains text-xs text-bg-white/60 hover:text-safety-lime transition-colors">
            ← Home
          </Link>
          <span className="font-syne font-black text-lg text-safety-lime">RAFFLED</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('explore')}
            className={`border-2 border-pure-black font-jetbrains text-xs uppercase tracking-wider px-3 py-1.5 transition-colors ${view === 'explore' ? 'bg-safety-lime text-pure-black' : 'bg-bg-white text-pure-black hover:bg-pure-black/[0.05]'}`}
          >
            Explore
          </button>
          <button
            onClick={() => setView('manage')}
            className={`border-2 border-pure-black font-jetbrains text-xs uppercase tracking-wider px-3 py-1.5 transition-colors ${view === 'manage' ? 'bg-safety-lime text-pure-black' : 'bg-bg-white text-pure-black hover:bg-pure-black/[0.05]'}`}
          >
            My Dashboard
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchRaffles}
            disabled={raffleLoading}
            className="border-2 border-pure-black bg-bg-white font-jetbrains text-xs uppercase tracking-wider px-3 py-1.5 hover:bg-pure-black/[0.05] disabled:opacity-50 transition-colors"
          >
            Reload
          </button>
          <appkit-button />
        </div>
      </header>

      {/* ============================================================
          MESSAGE NOTICE
          ============================================================ */}
      {message && (
        <div className="border-b-2 border-pure-black bg-safety-lime px-6 py-3">
          <p className="font-jetbrains text-xs text-pure-black font-semibold">{message}</p>
        </div>
      )}

      {/* ============================================================
          EXPLORE VIEW
          ============================================================ */}
      {view === 'explore' && (
        <>
          {/* --- Stats bar --- */}
          <section className="border-b-2 border-pure-black bg-bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-3">
              {[
                { label: 'Wallet', value: isConnected ? shorten(address, 16) : 'Not connected', stripe: 'bg-safety-lime' },
                { label: 'Authentication', value: authStatus === 'ok' ? 'Active' : 'Login required', stripe: 'bg-cyan-accent' },
                { label: 'Active Raffles', value: String(raffles.length), stripe: 'bg-safety-lime' },
              ].map((stat, i) => (
                <div key={stat.label} className={`relative p-6 ${i < 2 ? 'border-b-2 sm:border-b-0 sm:border-r-2 border-pure-black' : ''}`}>
                  <div className={`absolute top-0 left-0 right-0 h-1 ${stat.stripe}`} />
                  <Eyebrow>{stat.label}</Eyebrow>
                  <p className="font-syne font-black text-2xl text-pure-black mt-1">{stat.value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* --- Raffle list --- */}
          <section className="flex-1 p-6 md:p-8 bg-red-200">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
              <SectionHeader eyebrow="Live Raffles" title="Browse Active Raffles" />
              <div className="flex gap-3">
                <select
                  className={`${inputClass} app2-select`}
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                >
                  <option value="all">All types</option>
                  <option value="nft">NFT</option>
                  <option value="crypto">Crypto</option>
                </select>
                <select
                  className={`${inputClass} app2-select`}
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="ended">Ended</option>
                </select>
              </div>
            </div>

            {raffleLoading ? (
              <p className="font-jetbrains text-sm text-pure-black/50">Loading raffles...</p>
            ) : raffles.length === 0 ? (
              <p className="font-jetbrains text-sm text-pure-black/50">No raffles yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {raffles.map(renderRaffleCard)}
              </div>
            )}
          </section>
        </>
      )}

      {/* ============================================================
          MANAGE VIEW
          ============================================================ */}
      {view === 'manage' && (
        <section className="flex-1 p-6 md:p-8">
          <SectionHeader eyebrow="Manage My Raffles" title="Creator Dashboard" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* --- Create form panel --- */}
            <div className="border-2 border-pure-black shadow-brutal bg-bg-white p-6">
              <SectionHeader eyebrow="Creator Studio" title="New Raffle" />
              <form className="flex flex-col gap-4" onSubmit={handleCreateRaffle}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Prize type">
                    <select
                      className={`${inputClass} app2-select`}
                      value={createForm.type}
                      onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as Raffle['type'] })}
                    >
                      <option value="nft">NFT</option>
                      <option value="crypto">Crypto</option>
                    </select>
                  </InputField>
                  <InputField label="Title">
                    <input
                      className={inputClass}
                      value={createForm.title}
                      onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                      placeholder="e.g. iPhone 17 Pro Max"
                      required
                    />
                  </InputField>
                </div>

                <InputField label="Description">
                  <textarea
                    className={`${inputClass} resize-y`}
                    rows={3}
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    required
                  />
                </InputField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Ticket price (USD)">
                    <input
                      className={inputClass}
                      type="number" min="0.01" step="0.01"
                      value={createForm.ticket_price_usd}
                      onChange={(e) => setCreateForm({ ...createForm, ticket_price_usd: e.target.value })}
                      required
                    />
                  </InputField>
                  <InputField label="Max tickets">
                    <input
                      className={inputClass}
                      type="number" min="1"
                      value={createForm.max_tickets}
                      onChange={(e) => setCreateForm({ ...createForm, max_tickets: e.target.value })}
                      required
                    />
                  </InputField>
                </div>

                <InputField label="Ends at">
                  <input
                    className={inputClass}
                    type="datetime-local"
                    value={createForm.ends_at}
                    onChange={(e) => setCreateForm({ ...createForm, ends_at: e.target.value })}
                    required
                  />
                </InputField>

                <InputField label="Prize tx hash">
                  <input
                    className={inputClass}
                    value={createForm.prize_tx_hash}
                    onChange={(e) => setCreateForm({ ...createForm, prize_tx_hash: e.target.value })}
                    placeholder="0x... or Solana signature"
                    required
                  />
                </InputField>

                {createForm.type === 'crypto' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="Prize amount">
                      <input
                        className={inputClass}
                        type="number" min="0.00000001" step="0.00000001"
                        value={createForm.prize_amount}
                        onChange={(e) => setCreateForm({ ...createForm, prize_amount: e.target.value })}
                        placeholder="Amount"
                        required
                      />
                    </InputField>
                    <InputField label="Prize coin">
                      <select
                        className={`${inputClass} app2-select`}
                        value={createForm.prize_asset_symbol}
                        onChange={(e) => setCreateForm({ ...createForm, prize_asset_symbol: e.target.value })}
                      >
                        {topCoins.map((coin) => <option key={coin} value={coin}>{coin}</option>)}
                      </select>
                    </InputField>
                  </div>
                )}

                {createForm.type === 'nft' && (
                  <InputField label="Prize image">
                    <input
                      className={inputClass}
                      type="file" accept="image/*"
                      onChange={(e) => setCreateForm({ ...createForm, image: e.target.files?.[0] || null })}
                      required
                    />
                  </InputField>
                )}

                <div className="pt-2">
                  <Button variant="primary" type="submit">Save & Publish</Button>
                  <p className="font-jetbrains text-xs text-pure-black/40 mt-2">Ensure you are signed in with the owner wallet.</p>
                </div>
              </form>
            </div>

            {/* --- My raffles panel --- */}
            <div className="border-2 border-pure-black shadow-brutal bg-bg-white p-6">
              <SectionHeader eyebrow="My Raffles" title="Select to View Details" />
              {myRaffles.length === 0 ? (
                <p className="font-jetbrains text-sm text-pure-black/50">You have no raffles yet. Use the form to create one.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {myRaffles.map(renderRaffleCard)}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          DETAIL PANEL
          ============================================================ */}
      {detail && (
        <section className="border-t-2 border-pure-black bg-bg-white">
          {/* Detail header strip */}
          <div className="bg-pure-black px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eyebrow>{/* intentionally blank line for spacing */}</Eyebrow>
              <span className="font-syne font-black text-lg text-bg-white">{detail.raffle.title}</span>
              {renderBadge(detail.raffle.type.toUpperCase(), 'lime')}
            </div>
            <button
              onClick={() => setDetail(null)}
              className="font-jetbrains text-xs text-bg-white/60 hover:text-safety-lime transition-colors"
            >
              ✕ Close
            </button>
          </div>

          {detailLoading ? (
            <p className="font-jetbrains text-sm text-pure-black/50 p-6">Loading details...</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-0">
              {/* --- Left column --- */}
              <div className="border-r-0 lg:border-r-2 border-pure-black">
                <img src={detail.raffle.image_url} alt={detail.raffle.title} className="w-full" />
                <div className="p-6 flex flex-col gap-4">
                  <div className="flex gap-2">
                    {renderBadge(detail.raffle.status, 'cyan')}
                    <span className="font-jetbrains text-xs text-pure-black/50">
                      Ends: {formatDateTime(detail.raffle.ends_at)}
                    </span>
                  </div>
                  <p className="font-jetbrains text-sm text-pure-black/70 leading-relaxed">{detail.raffle.description}</p>
                  <p className="font-jetbrains text-xs text-pure-black/40">Owner: {shorten(detail.raffle.owner_address)}</p>

                  {isOwner && (
                    <div className="border-2 border-pure-black border-dashed p-4 mt-2">
                      <p className="font-jetbrains text-xs uppercase tracking-wider text-pure-black/50 mb-2">Owner Tools</p>
                      <Button variant="outline" size="sm" onClick={handleDeliver}>Mark Prize Delivered</Button>
                    </div>
                  )}
                </div>
              </div>

              {/* --- Right column --- */}
              <div className="p-6 flex flex-col gap-6 bg-[#ffde85]">
                {/* Stat grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Ticket Price', value: usd(detail.raffle.ticket_price_usd) },
                    { label: 'Sold / Max', value: `${detail.raffle.sold_tickets} / ${detail.raffle.max_tickets}` },
                    { label: 'Remaining', value: String(detail.remaining) },
                    { label: 'Prize Coin', value: detail.raffle.prize_asset_symbol || (detail.raffle.type === 'nft' ? 'NFT' : '-') },
                    { label: 'Prize Amount', value: String(detail.raffle.prize_amount ?? '-') },
                    { label: 'Prize Tx Status', value: (detail.raffle.prize_tx_status || 'pending').toString().toUpperCase() },
                  ].map((stat) => (
                    <div key={stat.label} className="border-2 border-pure-black shadow-brutal-lg bg-bg-white p-3">
                      <p className="font-jetbrains text-xs uppercase tracking-wider text-pure-black/50 mb-1">{stat.label}</p>
                      <p className={`font-syne font-black text-base text-pure-black ${stat.label === 'Prize Tx Status' && detail.raffle.prize_tx_status === 'success' ? 'text-pure-black' : stat.label === 'Prize Tx Status' && detail.raffle.prize_tx_status === 'failed' ? 'text-red-600' : ''}`}>
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="font-jetbrains text-xs text-pure-black/40">Prize tx: {shorten(detail.raffle.prize_tx_hash)}</p>

                {/* Prize tx warning */}
                {detail.raffle.prize_tx_status !== 'success' && (
                  <div className="border-2 border-pure-black bg-cyan-accent p-4">
                    <p className="font-jetbrains text-xs text-pure-black font-semibold">
                      Prize deposit is {detail.raffle.prize_tx_status || 'pending'}. Ticket sales unlock after confirmation.
                      {detail.raffle.prize_tx_error ? ` Notes: ${detail.raffle.prize_tx_error}` : ''}
                    </p>
                  </div>
                )}

                {/* Purchase form */}
                <div className="border-2 border-pure-black p-4 bg-white">
                  <SectionHeader eyebrow="Buy Tickets" title="Purchase" />
                  <form className="flex flex-col gap-3" onSubmit={handlePurchase}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <InputField label="Quantity">
                        <input
                          className={inputClass}
                          type="number" min="1"
                          value={purchaseForm.quantity}
                          onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: Number(e.target.value) })}
                          required
                        />
                      </InputField>
                      <InputField label="Purchase tx hash">
                        <input
                          className={inputClass}
                          value={purchaseForm.ticket_tx_hash}
                          onChange={(e) => setPurchaseForm({ ...purchaseForm, ticket_tx_hash: e.target.value })}
                          placeholder="USDC transfer hash"
                          required
                        />
                      </InputField>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Button
                        variant="primary"
                        type="submit"
                        disabled={!detail.can_purchase || detail.raffle.prize_tx_status !== 'success'}
                      >
                        Buy with USDC
                      </Button>
                      <p className="font-jetbrains text-xs text-pure-black/40">
                        {detail.remaining} remaining · Your tickets: {detail.your_tickets}
                        {detail.raffle.prize_tx_status !== 'success' ? ' · Waiting for prize deposit.' : ''}
                      </p>
                    </div>
                  </form>
                </div>

                {/* Update form (owner only) */}
                {isOwner && (
                  <div className="border-2 border-pure-black p-4">
                    <SectionHeader eyebrow="Update Raffle" title="Edit Info" />
                    <form className="flex flex-col gap-3" onSubmit={handleUpdateRaffle}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <InputField label="Title">
                          <input
                            className={inputClass}
                            value={updateForm.title}
                            onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })}
                            placeholder="Leave blank to keep"
                          />
                        </InputField>
                        <InputField label="Max tickets">
                          <input
                            className={inputClass}
                            type="number" min="1"
                            value={updateForm.max_tickets}
                            onChange={(e) => setUpdateForm({ ...updateForm, max_tickets: e.target.value })}
                            placeholder="Leave blank to keep"
                          />
                        </InputField>
                      </div>
                      <InputField label="Description">
                        <textarea
                          className={`${inputClass} resize-y`}
                          rows={2}
                          value={updateForm.description}
                          onChange={(e) => setUpdateForm({ ...updateForm, description: e.target.value })}
                          placeholder="Leave blank to keep"
                        />
                      </InputField>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <InputField label="Ends at">
                          <input
                            className={inputClass}
                            type="datetime-local"
                            value={updateForm.ends_at}
                            onChange={(e) => setUpdateForm({ ...updateForm, ends_at: e.target.value })}
                          />
                        </InputField>
                        <InputField label="Change image">
                          <input
                            className={inputClass}
                            type="file" accept="image/*"
                            onChange={(e) => setUpdateForm({ ...updateForm, image: e.target.files?.[0] || null })}
                          />
                        </InputField>
                      </div>
                      <Button variant="outline" size="sm" type="submit">Save Changes</Button>
                    </form>
                  </div>
                )}

                {/* Leaderboard */}
                <div className="border-2 border-pure-black bg-white">
                  <div className="bg-pure-black px-4 py-2">
                    <p className="font-jetbrains text-xs uppercase tracking-widest text-bg-white/60">Leaderboard</p>
                  </div>
                  {detail.leaderboard.length === 0 ? (
                    <p className="font-jetbrains text-xs text-pure-black/50 p-4">No purchases yet.</p>
                  ) : (
                    <div>
                      {detail.leaderboard.map((row, i) => (
                        <div
                          key={row.user_address}
                          className={`flex items-center justify-between px-4 py-3 border-b border-pure-black/20 ${i % 2 === 1 ? 'bg-pure-black/[0.03]' : 'bg-bg-white'}`}
                        >
                          <div>
                            <p className="font-syne font-bold text-sm text-pure-black">{shorten(row.user_address)}</p>
                            <p className="font-jetbrains text-xs text-pure-black/50">{usd(row.total_spent)}</p>
                          </div>
                          <p className="font-jetbrains text-xs font-semibold text-pure-black">{row.tickets} tickets</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Transactions */}
                <div className="border-2 border-pure-black bg-white">
                  <div className="bg-pure-black px-4 py-2">
                    <p className="font-jetbrains text-xs uppercase tracking-widest text-bg-white/60">Latest Transactions</p>
                  </div>
                  {detail.transactions.length === 0 ? (
                    <p className="font-jetbrains text-xs text-pure-black/50 p-4">No transactions yet.</p>
                  ) : (
                    <div>
                      {detail.transactions.map((tx, i) => (
                        <div
                          key={tx.id}
                          className={`flex items-start justify-between px-4 py-3 border-b border-pure-black/20 ${i % 2 === 1 ? 'bg-pure-black/[0.03]' : 'bg-bg-white'}`}
                        >
                          <div>
                            <p className="font-syne font-bold text-sm text-pure-black">{shorten(tx.ticket_tx_hash)}</p>
                            <p className="font-jetbrains text-xs text-pure-black/50">{formatDateTime(tx.created_at)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-jetbrains text-xs font-semibold text-pure-black">{tx.quantity} tickets</p>
                            <p className="font-jetbrains text-xs text-pure-black/50">{shorten(tx.user_address)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default App2
