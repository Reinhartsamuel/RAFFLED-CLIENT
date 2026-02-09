import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { createAppKit, useAppKit, useAppKitAccount, useAppKitProvider, useDisconnect } from '@reown/appkit/react'
import type { Provider } from '@reown/appkit-adapter-solana/react'
import bs58 from 'bs58'
import { metadata, projectId, solanaWeb3JsAdapter, networks, API_BASE_URL, getAuthToken } from './config'

import './App.css'

// Create modal
createAppKit({
  projectId,
  metadata,
  themeMode: 'dark',
  networks,
  adapters: [solanaWeb3JsAdapter],
  features: {
    analytics: true
  },
  themeVariables: {
    '--w3m-accent': '#c7a4ff',
    '--w3m-color-mix': '#a48be6',
    '--w3m-color-mix-strength': 25
  }
})

type Raffle = {
  id: number
  type: 'nft' | 'crypto'
  title: string
  description: string
  image_url: string
  prize_tx_hash?: string | null
  prize_amount?: number | null
  prize_asset_symbol?: string | null
  prize_tx_status?: 'pending' | 'success' | 'failed' | string | null
  prize_tx_checked_at?: string | null
  prize_tx_error?: string | null
  ticket_price_usd: number
  max_tickets: number
  sold_tickets: number
  max_tickets_usd?: number
  sold_tickets_usd?: number
  owner_address: string
  status: string
  ends_at: string
}

type RaffleDetail = {
  raffle: Raffle
  your_tickets: number
  can_purchase: boolean
  remaining: number
  leaderboard: LeaderboardEntry[]
  transactions: TicketTx[]
}

type LeaderboardEntry = {
  user_address: string
  tickets: number
  total_spent: number
}

type TicketTx = {
  id: number
  user_address: string
  quantity: number
  ticket_tx_hash: string
  created_at: string
}

const usd = (value?: number | null) =>
  value === undefined || value === null ? '-'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value)

const formatDateTime = (iso: string) => new Date(iso).toLocaleString()

const formatInputDate = (value: string) => {
  const date = new Date(value)
  const pad = (n: number) => `${n}`.padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const shorten = (text?: string | null, length = 12) => {
  if (!text) return '-'
  return text.length <= length ? text : `${text.slice(0, length / 2)}...${text.slice(-length / 2)}`
}

const baseHeaders = (token?: string) => ({
  Accept: 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

const topCoins = ['BTC', 'ETH', 'USDT', 'BNB', 'XRP', 'USDC', 'SOL']

export function App() {
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
    } catch (error) {
      setMessage('Failed to load raffles. Please retry.')
    } finally {
      setRaffleLoading(false)
    }
  }

  const loadRaffleDetail = async (raffleId: number) => {
    try {
      setDetailLoading(true)

      const [detailRes, availabilityRes, leaderboardRes, txRes] = await Promise.all([
        fetch(`${API_BASE_URL}/raffles/${raffleId}`, {
          headers: baseHeaders(activeToken || undefined),
        }),
        fetch(`${API_BASE_URL}/raffles/${raffleId}/tickets/availability`, {
          headers: baseHeaders(),
        }),
        fetch(`${API_BASE_URL}/raffles/${raffleId}/leaderboard`, {
          headers: baseHeaders(),
        }),
        fetch(`${API_BASE_URL}/raffles/${raffleId}/transactions`, {
          headers: baseHeaders(),
        }),
      ])

      const detailJson = await detailRes.json()
      const availabilityJson = await availabilityRes.json()
      const leaderboardJson = await leaderboardRes.json()
      const txJson = await txRes.json()

      const leaderboardData: LeaderboardEntry[] = leaderboardJson?.data || []
      const txData: TicketTx[] = txJson?.data || []

      setDetail({
        raffle: detailJson.raffle,
        your_tickets: detailJson.your_tickets,
        can_purchase: availabilityJson.can_purchase,
        remaining: availabilityJson.remaining,
        leaderboard: leaderboardData,
        transactions: txData,
      })
      setPurchaseForm({ quantity: 1, ticket_tx_hash: '' })
      setUpdateForm({
        title: '',
        description: '',
        max_tickets: '',
        ends_at: '',
        image: null,
      })
    } catch (error) {
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

      const message = [
        'Sign in with Solana to Raffled',
        '',
        `Address: ${address}`,
        `Nonce: ${nonce}`,
        `Issued At: ${new Date().toISOString()}`,
      ].join('\n')

      const encoded = new TextEncoder().encode(message)
      const signed = await walletProvider.signMessage(encoded)
      const signature = bs58.encode(signed)

      const verifyRes = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...baseHeaders() },
        body: JSON.stringify({ message, signature, address }),
      })

      if (!verifyRes.ok) throw new Error('Verification failed')

      const data = await verifyRes.json()
      localStorage.setItem('access_token', data.token)
      setAuthStatus('ok')
      setMessage('Signed in with Solana.')
    } catch (err) {
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
    if (!activeToken) {
      setMessage('Please sign in first.')
      return
    }

    if (createForm.type === 'nft' && !createForm.image) {
      setMessage('Prize image is required for NFT raffles.')
      return
    }

    if (createForm.type === 'crypto') {
      if (!createForm.prize_asset_symbol) {
        setMessage('Please select a prize coin.')
        return
      }
      if (!createForm.prize_amount) {
        setMessage('Please enter the prize amount.')
        return
      }
    }

    try {
      setMessage(null)
      const formData = new FormData()
      formData.append('type', createForm.type)
      formData.append('title', createForm.title)
      formData.append('description', createForm.description)
      if (createForm.type === 'nft' && createForm.image) {
        formData.append('image', createForm.image)
      }
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
        const errMsg = errJson?.message || 'Failed to create raffle.'
        throw new Error(errMsg)
      }

      setMessage('Raffle created successfully.')
      setCreateForm({
        type: 'crypto',
        title: '',
        description: '',
        prize_tx_hash: '',
        prize_asset_symbol: topCoins[0],
        prize_amount: '',
        ticket_price_usd: '',
        max_tickets: '',
        ends_at: '',
        image: null,
      })
      fetchRaffles()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create raffle.')
    }
  }

  const handlePurchase = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!detail) return
    if (!activeToken) {
      setMessage('Please sign in before buying tickets.')
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/raffles/${detail.raffle.id}/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...baseHeaders(activeToken),
        },
        body: JSON.stringify(purchaseForm),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => null)
        const errMsg = errJson?.message || 'Ticket purchase failed.'
        throw new Error(errMsg)
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
    if (!activeToken) {
      setMessage('Sign in is required to update the raffle.')
      return
    }

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
    if (!activeToken) {
      setMessage('Sign in is required to mark delivered.')
      return
    }
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
  }, [isConnected, authStatus, autoAuthRan, address, walletProvider])

  const selectedId = detail?.raffle?.id
  const myRaffles = raffles.filter((r) => r.owner_address && address && r.owner_address.toLowerCase() === address.toLowerCase())

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">R</span>
          <span className="brand-name">Raffled</span>
        </div>
        <div className="top-actions">
          <div className="view-switch">
            <button className={view === 'explore' ? 'primary' : 'ghost'} onClick={() => setView('explore')}>Explore</button>
            <button className={view === 'manage' ? 'primary' : 'ghost'} onClick={() => setView('manage')}>My dashboard</button>
          </div>
          <button className="ghost" onClick={fetchRaffles} disabled={raffleLoading}>Reload</button>
          <appkit-button />
        </div>
      </header>

      {view === 'explore' && (
        <>
          <section className="hero">
            <div>
              <p className="eyebrow">Solana-powered raffles</p>
              <h1>Build and run on-chain raffles</h1>
              <p className="lede">Lock NFT or top-coin prizes on-chain, sell USDC tickets, and auto-check prize deposits before sales open.</p>
              <div className="cta-row">
                <button className="primary" onClick={() => setView('manage')}>Create a new raffle</button>
                <a className="ghost" href="#list">View live raffles</a>
              </div>
              <div className="status-grid">
                <div>
                  <p className="stat-label">Wallet</p>
                  <p className="stat-value">{isConnected ? shorten(address, 16) : 'Not connected'}</p>
                </div>
                <div>
                  <p className="stat-label">Authentication</p>
                  <p className="stat-value">{authStatus === 'ok' ? 'Active' : 'Login required'}</p>
                </div>
                <div>
                  <p className="stat-label">Active raffles</p>
                  <p className="stat-value">{raffles.length}</p>
                </div>
              </div>
            </div>
            <div className="hero-card">
              <div className="hero-prize">
                <div className="prize-copy">
                  <p className="prize-title">Win top crypto coins or your favorite NFT</p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {message && <div className="notice">{message}</div>}

      {view === 'explore' && (
        <section id="list" className="panel fullwidth">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Live raffles</p>
              <h2>Browse active raffles</h2>
            </div>
            <div className="filters">
              <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
                <option value="all">All types</option>
                <option value="nft">NFT</option>
                <option value="crypto">Crypto</option>
              </select>
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="ended">Ended</option>
              </select>
            </div>
          </div>

          {raffleLoading ? (
            <p className="muted">Loading raffles...</p>
          ) : raffles.length === 0 ? (
            <p className="muted">No raffles yet.</p>
          ) : (
            <div className="raffle-grid">
              {raffles.map((item) => (
                <article
                  key={item.id}
                  className={`raffle-card ${selectedId === item.id ? 'active' : ''}`}
                  onClick={() => loadRaffleDetail(item.id)}
                >
                  <img src={item.image_url} alt={item.title} />
                  <div className="badge-row">
                    <span className="pill">{item.type.toUpperCase()}</span>
                    <span className="pill ghost">{item.status}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p className="muted one-line">{item.description}</p>
                  <div className="stats">
                    <span>{usd(item.ticket_price_usd)} / ticket</span>
                    <span>{item.sold_tickets}/{item.max_tickets} sold</span>
                  </div>
                  <p className="muted">Ends: {formatDateTime(item.ends_at)}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {view === 'manage' && (
        <section className="panel fullwidth manage-panel">
          <div className="panel-head">
            <div>
                <p className="eyebrow">Manage my raffles</p>
                <h2>Creator dashboard</h2>
                <p className="muted">Only raffles you created. Create, edit, and review transactions in one full screen.</p>
            </div>
          </div>

          <div className="manage-grid">
            <div className="subpanel manage-left">
              <div className="panel-head">
                <div>
                    <p className="eyebrow">Creator studio</p>
                    <h3>Create a new raffle</h3>
                </div>
              </div>
              <form className="grid two" onSubmit={handleCreateRaffle}>
                <label>
                    <span>Prize type</span>
                  <select
                    value={createForm.type}
                    onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as Raffle['type'] })}
                  >
                    <option value="nft">NFT</option>
                    <option value="crypto">Crypto</option>
                  </select>
                </label>
                <label>
                    <span>Title</span>
                  <input
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                      placeholder="Example: iPhone 17 Pro Max Orange"
                    required
                  />
                </label>
                <label className="full">
                    <span>Description</span>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    rows={3}
                    required
                  />
                </label>
                <label>
                  <span>Ticket price (USD)</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={createForm.ticket_price_usd}
                    onChange={(e) => setCreateForm({ ...createForm, ticket_price_usd: e.target.value })}
                    required
                  />
                </label>
                <label>
                  <span>Max tickets</span>
                  <input
                    type="number"
                    min="1"
                    value={createForm.max_tickets}
                    onChange={(e) => setCreateForm({ ...createForm, max_tickets: e.target.value })}
                    required
                  />
                </label>
                <label>
                  <span>Ends at</span>
                  <input
                    type="datetime-local"
                    value={createForm.ends_at}
                    onChange={(e) => setCreateForm({ ...createForm, ends_at: e.target.value })}
                    required
                  />
                </label>
                <label>
                  <span>Prize tx hash (proof of transfer to contract)</span>
                  <input
                    value={createForm.prize_tx_hash}
                    onChange={(e) => setCreateForm({ ...createForm, prize_tx_hash: e.target.value })}
                    placeholder="0x... or Solana signature"
                    required
                  />
                </label>
                {createForm.type === 'crypto' && (
                  <label>
                    <span>Prize amount</span>
                    <input
                      type="number"
                      min="0.00000001"
                      step="0.00000001"
                      value={createForm.prize_amount}
                      onChange={(e) => setCreateForm({ ...createForm, prize_amount: e.target.value })}
                      placeholder="Amount of the prize coin"
                      required
                    />
                  </label>
                )}
                {createForm.type === 'crypto' && (
                  <label>
                    <span>Prize coin (top coins)</span>
                    <select
                      value={createForm.prize_asset_symbol}
                      onChange={(e) => setCreateForm({ ...createForm, prize_asset_symbol: e.target.value })}
                    >
                      {topCoins.map((coin) => (
                        <option key={coin} value={coin}>{coin}</option>
                      ))}
                    </select>
                  </label>
                )}
                {createForm.type === 'nft' && (
                  <label>
                    <span>Prize image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCreateForm({ ...createForm, image: e.target.files?.[0] || null })}
                      required
                    />
                  </label>
                )}
                {createForm.type === 'crypto' && (
                  <p className="muted full">Coin thumbnails will use the built-in assets from /assets.</p>
                )}
                <div className="full actions">
                  <button type="submit" className="primary">Save and publish</button>
                  <p className="muted">Ensure you are signed in with the owner wallet.</p>
                </div>
              </form>
            </div>

            <div className="subpanel manage-right">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">My raffles</p>
                  <h3>Select to view details</h3>
                </div>
              </div>
              {myRaffles.length === 0 ? (
                <p className="muted">You have no raffles yet. Start with the form on the left.</p>
              ) : (
                <div className="raffle-grid">
                  {myRaffles.map((item) => (
                    <article
                      key={item.id}
                      className={`raffle-card ${selectedId === item.id ? 'active' : ''}`}
                      onClick={() => loadRaffleDetail(item.id)}
                    >
                      <img src={item.image_url} alt={item.title} />
                      <div className="badge-row">
                        <span className="pill">{item.type.toUpperCase()}</span>
                        <span className="pill ghost">{item.status}</span>
                      </div>
                      <h3>{item.title}</h3>
                      <div className="stats">
                        <span>{usd(item.ticket_price_usd)}</span>
                        <span>{item.sold_tickets}/{item.max_tickets}</span>
                      </div>
                      <p className="muted">Ends: {formatDateTime(item.ends_at)}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {detail && (
        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Raffle detail</p>
              <h2>{detail.raffle.title}</h2>
              <p className="muted">Owner: {shorten(detail.raffle.owner_address)}</p>
            </div>
            <div className="pill">{detail.raffle.type.toUpperCase()}</div>
          </div>
          {detailLoading ? (
            <p className="muted">Loading details...</p>
          ) : (
            <div className="detail-grid">
              <div className="detail-left">
                <img className="hero-image" src={detail.raffle.image_url} alt={detail.raffle.title} />
                <p className="muted">Ends: {formatDateTime(detail.raffle.ends_at)}</p>
                <p className="muted">Status: {detail.raffle.status}</p>
                <p>{detail.raffle.description}</p>
                {detail.raffle.owner_address === address && (
                  <div className="owner-actions">
                    <p className="muted">Owner tools</p>
                    <button className="ghost" onClick={handleDeliver}>Mark prize delivered</button>
                  </div>
                )}
              </div>
              <div className="detail-right">
                <div className="stat-box">
                  <div>
                    <p className="stat-label">Ticket price</p>
                    <p className="stat-value">{usd(detail.raffle.ticket_price_usd)}</p>
                  </div>
                  <div>
                    <p className="stat-label">Sold / Max</p>
                    <p className="stat-value">{detail.raffle.sold_tickets} / {detail.raffle.max_tickets}</p>
                  </div>
                  <div>
                    <p className="stat-label">Remaining</p>
                    <p className="stat-value">{detail.remaining}</p>
                  </div>
                  <div>
                    <p className="stat-label">Prize coin</p>
                    <p className="stat-value">{detail.raffle.prize_asset_symbol || (detail.raffle.type === 'nft' ? 'NFT' : '-')}</p>
                  </div>
                  <div>
                    <p className="stat-label">Prize amount</p>
                    <p className="stat-value">{detail.raffle.prize_amount ?? '-'}</p>
                  </div>
                  <div>
                    <p className="stat-label">Prize tx status</p>
                    <p className={`stat-value ${detail.raffle.prize_tx_status === 'success' ? 'good' : detail.raffle.prize_tx_status === 'failed' ? 'bad' : ''}`}>
                      {(detail.raffle.prize_tx_status || 'pending').toString().toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="stat-label">Prize tx</p>
                    <p className="stat-value">{shorten(detail.raffle.prize_tx_hash)}</p>
                  </div>
                </div>

                {detail.raffle.prize_tx_status !== 'success' && (
                  <div className="notice warning">
                    Prize deposit is {detail.raffle.prize_tx_status || 'pending'}. Ticket sales unlock after confirmation. {detail.raffle.prize_tx_error ? `Notes: ${detail.raffle.prize_tx_error}` : ''}
                  </div>
                )}

                <form className="grid two" onSubmit={handlePurchase}>
                  <label>
                    <span>Ticket quantity</span>
                    <input
                      type="number"
                      min="1"
                      value={purchaseForm.quantity}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: Number(e.target.value) })}
                      required
                    />
                  </label>
                  <label>
                    <span>Purchase tx hash</span>
                    <input
                      value={purchaseForm.ticket_tx_hash}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, ticket_tx_hash: e.target.value })}
                      placeholder="Hash of USDC transfer to contract"
                      required
                    />
                  </label>
                  <div className="full actions">
                    <button
                      className="primary"
                      type="submit"
                      disabled={!detail.can_purchase || detail.raffle.prize_tx_status !== 'success'}
                    >
                      Buy tickets with USDC
                    </button>
                    <p className="muted">Remaining {detail.remaining} tickets. Your tickets: {detail.your_tickets}. {detail.raffle.prize_tx_status !== 'success' ? 'Waiting for prize deposit confirmation before sales open.' : ''}</p>
                  </div>
                </form>

                {detail.raffle.owner_address === address && (
                  <div className="panel subpanel">
                    <div className="panel-head">
                      <div>
                        <p className="eyebrow">Update raffle</p>
                        <h3>Edit basic info</h3>
                      </div>
                    </div>
                    <form className="grid two" onSubmit={handleUpdateRaffle}>
                      <label>
                        <span>Title</span>
                        <input
                          value={updateForm.title}
                          onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })}
                          placeholder="Leave blank to keep current"
                        />
                      </label>
                      <label>
                        <span>Max tickets</span>
                        <input
                          type="number"
                          min="1"
                          value={updateForm.max_tickets}
                          onChange={(e) => setUpdateForm({ ...updateForm, max_tickets: e.target.value })}
                          placeholder="Leave blank to keep current"
                        />
                      </label>
                      <label className="full">
                        <span>Description</span>
                        <textarea
                          rows={3}
                          value={updateForm.description}
                          onChange={(e) => setUpdateForm({ ...updateForm, description: e.target.value })}
                          placeholder="Leave blank to keep current"
                        />
                      </label>
                      <label>
                        <span>Ends at</span>
                        <input
                          type="datetime-local"
                          value={updateForm.ends_at}
                          onChange={(e) => setUpdateForm({ ...updateForm, ends_at: e.target.value })}
                        />
                      </label>
                      <label>
                        <span>Change image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setUpdateForm({ ...updateForm, image: e.target.files?.[0] || null })}
                        />
                      </label>
                      <div className="full actions">
                        <button className="ghost" type="submit">Save changes</button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="leaderboard">
                  <div className="panel-head">
                    <div>
                      <p className="eyebrow">Leaderboard</p>
                      <h3>Top buyers</h3>
                    </div>
                  </div>
                  {detail.leaderboard.length === 0 ? (
                    <p className="muted">No purchases yet.</p>
                  ) : (
                    <ul>
                      {detail.leaderboard.map((row) => (
                        <li key={row.user_address}>
                          <div>
                            <p className="stat-value">{shorten(row.user_address)}</p>
                            <p className="muted">{usd(row.total_spent)}</p>
                          </div>
                          <p>{row.tickets} tickets</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="leaderboard">
                  <div className="panel-head">
                    <div>
                      <p className="eyebrow">Latest transactions</p>
                      <h3>Ticket purchase hashes</h3>
                    </div>
                  </div>
                  {detail.transactions.length === 0 ? (
                    <p className="muted">No transactions yet.</p>
                  ) : (
                    <ul className="tx-list">
                      {detail.transactions.map((tx) => (
                        <li key={tx.id}>
                          <div>
                            <p className="stat-value">{shorten(tx.ticket_tx_hash)}</p>
                            <p className="muted">{formatDateTime(tx.created_at)}</p>
                          </div>
                          <div>
                            <p>{tx.quantity} tickets</p>
                            <p className="muted">{shorten(tx.user_address)}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
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

export default App
