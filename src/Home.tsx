import { useState, useEffect, useCallback } from 'react'
import { Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { useAppKitAccount } from '@reown/appkit/react'
import { motion, AnimatePresence } from 'framer-motion'
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
import { staggerContainer, staggerItem, scaleIn, fadeInUp } from './utils/animations'

const onboardingSteps = [
  { icon: '✌', title: 'Welcome aboard', desc: 'Connect your wallet.', done: true },
  { icon: '⬡', title: 'Authenticated', desc: 'Sign in with Base.', done: true },
  { icon: '◈', title: 'First raffle', desc: 'Create your first raffle.', done: false },
  { icon: '◎', title: 'First winner', desc: 'Draw your first winner.', done: false },
]

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
        /* ---- Connect Wallet State ---- */
        <div className="min-h-[60vh] flex items-center justify-center p-8">
          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            className="max-w-md w-full text-center border border-[#1f1f1f] bg-[#0a0a0a] rounded-2xl p-10"
            style={{ boxShadow: '0 0 40px rgba(255,184,0,0.04)' }}
          >
            <div className="w-16 h-16 rounded-2xl bg-[#FFB800]/10 border border-[#FFB800]/20 flex items-center justify-center text-2xl mx-auto mb-6">
              ⬡
            </div>
            <h2 className="font-sans font-bold text-2xl text-[#F5F5F5] mb-3">Connect Your Wallet</h2>
            <p className="font-mono text-sm text-[#555555] mb-2 leading-relaxed">
              Connect to Base network to create raffles and buy tickets with smart contract integration
            </p>
            <p className="font-mono text-xs text-[#333333] mb-8">
              {networks.map((n) => n.name).join(' · ')}
            </p>
            <WalletConnect />
          </motion.div>
        </div>
      ) : (
        <div className="p-6 lg:p-8 space-y-8">

          {/* ---- Dashboard Header ---- */}
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            className="flex items-center justify-between"
          >
            <div>
              <h2 className="font-sans font-bold text-2xl text-[#F5F5F5]">Dashboard</h2>
              <p className="font-mono text-xs text-[#555555] mt-0.5">Base Network · Chainlink VRF</p>
            </div>
            {activeToken && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#FFB800] text-[#050505] font-mono font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-[#FFCC33] transition-colors shadow-[0_0_20px_rgba(255,184,0,0.2)]"
                onClick={() => setShowCreateModal(true)}
              >
                <span>+</span> Create Raffle
              </motion.button>
            )}
          </motion.div>

          {/* ---- Getting Started ---- */}
          <motion.div variants={fadeInUp} initial="initial" animate="animate">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-sans font-semibold text-sm text-[#F5F5F5]">Getting started</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1f1f1f] rounded-xl overflow-hidden border border-[#1f1f1f]">
              {onboardingSteps.map((step) => (
                <div
                  key={step.title}
                  className={`relative flex flex-col items-center text-center gap-2 p-5 transition-colors ${
                    step.done
                      ? 'bg-[#22C55E]/5 hover:bg-[#22C55E]/8'
                      : 'bg-[#0a0a0a] hover:bg-[#111111]'
                  }`}
                >
                  <div className="text-2xl mb-1">{step.icon}</div>
                  <h4 className="font-sans font-semibold text-xs text-[#F5F5F5]">{step.title}</h4>
                  <p className="font-mono text-[10px] text-[#555555]">{step.desc}</p>
                  {step.done && (
                    <div className="absolute top-3 right-3 w-4 h-4 rounded-full border border-[#22C55E] text-[#22C55E] flex items-center justify-center text-[9px] font-bold">
                      ✓
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* ---- Poster Banner ---- */}
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            className="rounded-xl overflow-hidden border border-[#1f1f1f]"
          >
            <img
              src={posterImg}
              alt="The Future of Raffles"
              className="w-full object-cover max-h-56"
            />
            <div className="bg-[#0a0a0a] border-t border-[#1f1f1f] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="font-mono text-sm text-[#999999]">
                We're here to bring on-chain raffles to everyone.
              </p>
              <button
                className="flex-shrink-0 px-5 py-2.5 bg-[#FFB800] text-[#050505] font-mono font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-[#FFCC33] transition-colors"
                onClick={() => setShowCreateModal(true)}
              >
                Create your first raffle
              </button>
            </div>
          </motion.div>

          {/* ---- Active Raffles ---- */}
          <section>
            <div className="flex items-center justify-between pb-4 border-b border-[#1f1f1f] mb-6">
              <div className="flex items-center gap-3">
                <h2 className="font-sans font-bold text-lg text-[#F5F5F5]">Active Raffles</h2>
                <span className="inline-flex items-center justify-center bg-[#FFB800] text-[#050505] text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full">
                  {totalRaffles}
                </span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {rafflesLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border border-dashed border-[#1f1f1f] rounded-xl py-16 text-center bg-[#0a0a0a]"
                >
                  <div className="font-mono text-xs text-[#333333] uppercase tracking-widest animate-pulse">
                    Loading raffles...
                  </div>
                </motion.div>
              ) : raffles.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border border-dashed border-[#1f1f1f] rounded-xl py-16 text-center bg-[#0a0a0a]"
                >
                  <p className="font-mono text-sm text-[#333333] mb-4">No raffles yet.</p>
                  {activeToken && (
                    <button
                      className="font-mono text-xs uppercase tracking-wider px-5 py-2.5 border border-[#2a2a2a] text-[#555555] hover:border-[#FFB800] hover:text-[#FFB800] rounded-lg transition-all"
                      onClick={() => setShowCreateModal(true)}
                    >
                      Create the first raffle →
                    </button>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="grid"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {raffles.map((raffle) => (
                    <motion.div key={raffle.id} variants={staggerItem}>
                      <RaffleCard raffle={raffle} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
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
