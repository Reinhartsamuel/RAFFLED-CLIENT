import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { useAppKitAccount } from '@reown/appkit/react'
import { formatUnits } from 'viem'
import { wagmiConfig, queryClient, networks } from './config/evm.config'
import { API_BASE_URL, getAuthToken } from './config/index'
import { WalletConnect } from './components/evm/WalletConnect'
import { CreateRaffleModal } from './components/evm/CreateRaffleModal'
import { useRaffleCount } from './hooks/useRaffleContract'
import { Layout } from './components/evm/Layout'
import RaffleDetail from './pages/RaffleDetail'
import './AppEVM.css'
import { BackendRaffle } from './interfaces/BackendRaffle'
import { RaffleCard } from './components/evm/RaffleCard'



export function HomePage() {
  const navigate = useNavigate()
  const { isConnected } = useAppKitAccount()
  const { data: raffleCount, refetch: refetchRaffleCount } = useRaffleCount()

  const [view, setView] = useState<'explore' | 'manage'>('explore')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [raffles, setRaffles] = useState<BackendRaffle[]>([])
  const [rafflesLoading, setRafflesLoading] = useState(false)

  const activeToken = getAuthToken()

  const fetchRaffles = useCallback(async () => {
    try {
      setRafflesLoading(true)
      const token = getAuthToken()
      const url = new URL(`${API_BASE_URL}/raffles`)

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
      setRaffles(data.data || [])
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
    <Layout>
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
          {/* View Tabs */}
          <nav className="view-tabs font-jetbrains" style={{ marginBottom: '2rem' }}>
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
                  {raffles?.map((raffle) => (
                    <RaffleCard raffle={raffle} key={raffle.id} />
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
                {activeToken && (
                  <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                    <span className="font-jetbrains text-sm font-bold">+ Create Raffle</span>
                  </button>
                )}
              </header>

              {raffles.length === 0 ? (
                <div className="empty-state">
                  <p className="font-jetbrains text-sm text-pure-black/60">
                    You haven't created any raffles yet
                  </p>
                </div>
              ) : (
                <div className="raffles-grid">
                  {raffles?.map((raffle) => (
                    <RaffleCard
                      key={raffle.id}
                      raffle={raffle}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}

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
    </Layout>
  )
}

/**
 * Home with Wagmi and Query providers and routing
 */
export default function Home() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/raffle/:id" element={<RaffleDetail />} />
        </Routes>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
