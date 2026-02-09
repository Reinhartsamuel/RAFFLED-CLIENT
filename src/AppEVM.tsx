import { useState, useEffect, useCallback } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { useAppKitAccount } from '@reown/appkit/react'
import { wagmiConfig, queryClient, networks } from './config/evm.config'
import { API_BASE_URL, getAuthToken } from './config/index'
import { WalletConnect } from './components/evm/WalletConnect'
import { CreateRaffleModal } from './components/evm/CreateRaffleModal'
import { useRaffleCount } from './hooks/useRaffleContract'
import './AppEVM.css'

/**
 * Main EVM-integrated Raffle Application
 * Replaces the Solana-based App.tsx and App2.tsx with smart contract integration
 */
interface BackendRaffle {
  id: number
  title: string
  description: string
  prize_amount: string
  prize_asset_symbol: string
  ticket_price_usd: string
  max_tickets: number
  tickets_sold?: number
  ends_at: string
  status: string
  image_url?: string
  prize_tx_hash?: string
}

export function AppEVMContent() {
  const { isConnected } = useAppKitAccount()
  const { data: raffleCount, refetch: refetchRaffleCount } = useRaffleCount()
  const [view, setView] = useState<'explore' | 'manage'>('explore')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [raffles, setRaffles] = useState<BackendRaffle[]>([])
  const [rafflesLoading, setRafflesLoading] = useState(false)

  const fetchRaffles = useCallback(async () => {
    try {
      setRafflesLoading(true)
      const token = getAuthToken()
      const url = new URL(`${API_BASE_URL}/raffles`)
      url.searchParams.append('type', 'nft')
      url.searchParams.append('status', 'active')

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })

      const data = await res.json()
      console.log('Fetched raffles from API:', data)
      setRaffles(data.data || data || [])
    } catch (err) {
      console.error('Failed to fetch raffles:', err)
    } finally {
      setRafflesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isConnected) {
      fetchRaffles()
    }
  }, [isConnected, fetchRaffles])

  const totalRaffles = Number(raffleCount || 0)

  return (
    <div className="app-evm page">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="logo font-syne font-black text-2xl">
              RAFFLED
              <span className="text-safety-lime">.</span>
              EVM
            </h1>
            <p className="font-jetbrains text-xs uppercase tracking-widest text-pure-black/50">
              On-chain raffles powered by Chainlink VRF
            </p>
          </div>

          <div className="header-controls">
            <nav className="view-tabs font-jetbrains">
              <button
                className={`tab ${view === 'explore' ? 'active' : ''}`}
                onClick={() => setView('explore')}
              >
                Explore
              </button>
              <button
                className={`tab ${view === 'manage' ? 'active' : ''}`}
                onClick={() => setView('manage')}
              >
                Manage
              </button>
            </nav>

            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {!isConnected ? (
          <section className="connect-wallet-section">
            <div className="connect-card">
              <h2 className="font-syne font-black text-3xl mb-4">Connect Your Wallet</h2>
              <p className="font-jetbrains text-sm text-pure-black/70 mb-6">
                Connect to Base network to create raffles and buy tickets with smart contract integration
              </p>
              <p className="font-jetbrains text-xs text-pure-black/50 mb-8">
                Supported networks: {networks.map((n) => n.name).join(', ')}
              </p>
              <WalletConnect />
            </div>
          </section>
        ) : (
          <>
            {view === 'explore' && (
              <section className="explore-view">
                <header className="section-header">
                  <div className="header-text">
                    <p className="font-jetbrains text-xs uppercase tracking-widest text-pure-black/50 mb-1">
                      Browse
                    </p>
                    <h2 className="font-syne font-black text-2xl">
                      Active Raffles ({totalRaffles})
                    </h2>
                  </div>
                </header>

                {rafflesLoading ? (
                  <div className="empty-state">
                    <p className="font-jetbrains text-sm text-pure-black/60">
                      Loading raffles...
                    </p>
                  </div>
                ) : raffles.length === 0 ? (
                  <div className="empty-state">
                    <p className="font-jetbrains text-sm text-pure-black/60">
                      No raffles yet. Create one to get started!
                    </p>
                  </div>
                ) : (
                  <div className="raffles-grid">
                    {raffles.map((raffle) => (
                      <div key={raffle.id} className="raffle-card">
                        {raffle.image_url && (
                          <img src={raffle.image_url} alt={raffle.title} className="raffle-card-image" />
                        )}
                        <div className="raffle-card-body">
                          <h3 className="font-syne font-bold text-lg">{raffle.title}</h3>
                          {raffle.description && (
                            <p className="font-jetbrains text-xs text-pure-black/60">{raffle.description}</p>
                          )}
                          <div className="raffle-card-stats">
                            <div className="stat">
                              <span className="stat-label">Prize</span>
                              <span className="stat-value">{raffle.prize_amount} {raffle.prize_asset_symbol}</span>
                            </div>
                            <div className="stat">
                              <span className="stat-label">Ticket</span>
                              <span className="stat-value">${raffle.ticket_price_usd}</span>
                            </div>
                            <div className="stat">
                              <span className="stat-label">Tickets</span>
                              <span className="stat-value">{raffle.tickets_sold || 0}/{raffle.max_tickets}</span>
                            </div>
                          </div>
                          <div className="raffle-card-footer">
                            <span className="font-jetbrains text-xs text-pure-black/50">
                              Ends: {new Date(raffle.ends_at).toLocaleDateString()}
                            </span>
                            <span className={`raffle-status status-${raffle.status}`}>
                              {raffle.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {view === 'manage' && (
              <section className="manage-view">
                <header className="section-header">
                  <div className="header-text">
                    <p className="font-jetbrains text-xs uppercase tracking-widest text-pure-black/50 mb-1">
                      Creator Dashboard
                    </p>
                    <h2 className="font-syne font-black text-2xl">Your Raffles</h2>
                  </div>
                  <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                    <span className="font-jetbrains text-sm font-bold">+ Create Raffle</span>
                  </button>
                </header>

                {raffles.length === 0 ? (
                  <div className="empty-state">
                    <p className="font-jetbrains text-sm text-pure-black/60">
                      You haven't created any raffles yet
                    </p>
                  </div>
                ) : (
                  <div className="raffles-grid">
                    {raffles.map((raffle) => (
                      <div key={raffle.id} className="raffle-card">
                        {raffle.image_url && (
                          <img src={raffle.image_url} alt={raffle.title} className="raffle-card-image" />
                        )}
                        <div className="raffle-card-body">
                          <h3 className="font-syne font-bold text-lg">{raffle.title}</h3>
                          <div className="raffle-card-stats">
                            <div className="stat">
                              <span className="stat-label">Prize</span>
                              <span className="stat-value">{raffle.prize_amount} {raffle.prize_asset_symbol}</span>
                            </div>
                            <div className="stat">
                              <span className="stat-label">Sold</span>
                              <span className="stat-value">{raffle.tickets_sold || 0}/{raffle.max_tickets}</span>
                            </div>
                          </div>
                          {raffle.prize_tx_hash && (
                            <p className="font-jetbrains text-xs text-pure-black/40" style={{ wordBreak: 'break-all' }}>
                              TX: {raffle.prize_tx_hash}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>

      {/* Create Raffle Modal */}
      {showCreateModal && (
        <CreateRaffleModal
          onClose={() => {
            setShowCreateModal(false)
            refetchRaffleCount()
            fetchRaffles()
          }}
        />
      )}

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <p className="font-jetbrains text-xs text-pure-black/50">
            © 2025 Raffled • On-chain raffles with verifiable randomness
          </p>
          <div className="footer-links font-jetbrains text-xs">
            <a href="#" className="link">Docs</a>
            <span className="separator">•</span>
            <a href="#" className="link">GitHub</a>
            <span className="separator">•</span>
            <a href="#" className="link">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

/**
 * AppEVM with Wagmi and Query providers
 */
export default function AppEVM() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AppEVMContent />
      </QueryClientProvider>
    </WagmiProvider>
  )
}
