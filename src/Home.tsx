import { useState, useEffect, useCallback } from 'react'
import { Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { useAppKitAccount } from '@reown/appkit/react'
import { wagmiConfig, queryClient, networks } from './config/evm.config'
import { API_BASE_URL, getAuthToken } from './config/index'
import { WalletConnect } from './components/evm/WalletConnect'
import { CreateRaffleModal } from './components/evm/CreateRaffleModal'
import { useRaffleCount } from './hooks/useRaffleContract'
import { Layout, DashboardSidebar } from './components/evm/Layout'
import RaffleDetail from './pages/RaffleDetail'
import './AppEVM.css'
import { BackendRaffle } from './interfaces/BackendRaffle'
import { RaffleCard } from './components/evm/RaffleCard'
import posterImg from './assets/poster.webp'


export function HomePage() {
  const { isConnected } = useAppKitAccount()
  const { data: raffleCount, refetch: refetchRaffleCount } = useRaffleCount()

  const [activeFilter, setActiveFilter] = useState('home')
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

  const sidebar = isConnected ? (
    <DashboardSidebar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
  ) : undefined

  return (
    <Layout sidebar={sidebar}>
      {!isConnected ? (
        <section className="connect-wallet-section">
          <div className="connect-card">
            <h2 className="font-syne font-black text-3xl mb-4">Connect Your Wallet</h2>
            <p className="font-jetbrains text-sm text-white/60 mb-6">
              Connect to Base network to create raffles and buy tickets with smart contract integration
            </p>
            <p className="font-jetbrains text-xs text-white/40 mb-8">
              Supported networks: {networks.map((n) => n.name).join(', ')}
            </p>
            <WalletConnect />
          </div>
        </section>
      ) : (
        <>
          {/* Dashboard Header */}
          <div className="dashboard-header">
            <h2 className="font-syne font-black text-2xl">Dashboard</h2>
            {activeToken && (
              <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                <span className="font-jetbrains text-sm font-bold">+ Create Raffle</span>
              </button>
            )}
          </div>

          {/* Getting Started Cards */}
          <div className="getting-started">
            <div className="getting-started-header">
              <h3 className="font-syne font-bold text-lg">Getting started</h3>
            </div>
            <div className="getting-started-grid">
              <div className="getting-started-card getting-started-card--done">
                <div className="getting-started-card-icon">✌️</div>
                <h4 className="font-syne font-bold text-sm">Welcome aboard</h4>
                <p className="font-jetbrains text-xs text-white/40">Connect your wallet.</p>
                <span className="getting-started-check">✓</span>
              </div>
              <div className="getting-started-card getting-started-card--done">
                <div className="getting-started-card-icon">🔑</div>
                <h4 className="font-syne font-bold text-sm">Authenticated</h4>
                <p className="font-jetbrains text-xs text-white/40">Sign in with Base.</p>
                <span className="getting-started-check">✓</span>
              </div>
              <div className="getting-started-card">
                <div className="getting-started-card-icon">🎟️</div>
                <h4 className="font-syne font-bold text-sm">First raffle</h4>
                <p className="font-jetbrains text-xs text-white/40">Create your first raffle.</p>
              </div>
              <div className="getting-started-card">
                <div className="getting-started-card-icon">🏆</div>
                <h4 className="font-syne font-bold text-sm">First winner</h4>
                <p className="font-jetbrains text-xs text-white/40">Draw your first winner.</p>
              </div>
            </div>
          </div>

          {/* Poster Banner */}
          <div className="poster-banner">
            <img src={posterImg} alt="The Future of Raffles" className="poster-banner-img" />
            <div className="poster-banner-overlay">
              <p className="font-jetbrains text-sm">We're here to bring on-chain raffles to everyone.</p>
              <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                <span className="font-jetbrains text-sm font-bold">Create your first raffle</span>
              </button>
            </div>
          </div>

          {/* Active Raffles Section */}
          <section className="dashboard-section">
            <header className="section-header">
              <div className="header-text">
                <h2 className="font-syne font-black text-xl">
                  Active Raffles
                  <span className="section-count">{totalRaffles}</span>
                </h2>
              </div>
            </header>

            {rafflesLoading ? (
              <div className="empty-state">
                <p className="font-jetbrains text-sm text-white/50">
                  Loading raffles...
                </p>
              </div>
            ) : raffles.length === 0 ? (
              <div className="empty-state">
                <p className="font-jetbrains text-sm text-white/50">
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
