import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { motion, AnimatePresence } from 'framer-motion'
import { BACKEND_URL, getAuthToken, apiFetch } from './config/index'
import { useRaffleCount } from './hooks/useRaffleContract'
import { Layout, DashboardSidebar } from './components/evm/Layout'
import { CreateRaffleModal } from './components/evm/CreateRaffleModal'
import RaffleDetail from './pages/RaffleDetail'
import './AppEVM.css'
import { BackendRaffle } from './interfaces/BackendRaffle'
import { RaffleCard } from './components/evm/RaffleCard'
import { staggerContainer, staggerItem } from './utils/animations'
import Faucet from './pages/Faucet'
import Activity from './pages/Activity'
import RaffleAdminPage, { AdminRaffleDetailPage } from './pages/RaffleAdminPage'
import { EventToastContainer } from './components/evm/EventToast'
import CreateRafflePage from './pages/CreateRafflePage'

const RAFFLE_CACHE_TTL = 30_000 // 30 seconds

export function HomePage({ activeFilter, onFilterChange }: {
  activeFilter: string
  onFilterChange: (filter: string) => void
}) {
  const { isConnected } = useAccount()
  const { data: raffleCount, refetch: refetchRaffleCount } = useRaffleCount()
  const [showCreateModal, setShowCreateModal] = useState(false)

  const activeToken = getAuthToken()

  // Fetch raffles whenever wallet is connected (regardless of auth status)
  const { data: rafflesData, isLoading: rafflesLoading, refetch: refetchRaffles } = useQuery<BackendRaffle[]>({
    queryKey: ['raffles', activeFilter],
    queryFn: async () => {
      const token = getAuthToken()
      const res = await apiFetch(buildRafflesUrl(activeFilter), {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })
      const data = await res.json()
      return data.data || []
    },
    enabled: true, // Always fetch to show public raffles
    staleTime: RAFFLE_CACHE_TTL,
    gcTime: RAFFLE_CACHE_TTL * 2,
  })

  const raffles = rafflesData ?? []

  const totalRaffles = Number(raffleCount || 0)

  return (
    <>
      <div className="p-6 lg:p-8 space-y-8">
        {/* ---- Active Raffles ---- */}
        <section>
          <div className="flex items-center justify-between pb-4 border-b border-[#1f1f1f] mb-6">
            <div className="flex items-center gap-3">
              <h2 className="font-mono font-bold text-4xl text-[#F5F5F5]">LIVE_POOL</h2>
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
                className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="w-full bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#1f1f1f]">
                    <div className="aspect-square w-full bg-[#111111] animate-pulse" />
                    <div className="p-5 space-y-4">
                      <div className="flex items-end justify-between">
                        <div className="space-y-2">
                          <div className="h-2 w-16 bg-[#1a1a1a] rounded animate-pulse" />
                          <div className="h-7 w-24 bg-[#1a1a1a] rounded animate-pulse" />
                        </div>
                        <div className="space-y-2 items-end flex flex-col">
                          <div className="h-2 w-10 bg-[#1a1a1a] rounded animate-pulse" />
                          <div className="h-5 w-8 bg-[#1a1a1a] rounded animate-pulse" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <div className="h-2 w-20 bg-[#1a1a1a] rounded animate-pulse" />
                          <div className="h-2 w-12 bg-[#1a1a1a] rounded animate-pulse" />
                        </div>
                        <div className="h-2 w-full bg-[#1a1a1a] rounded-full animate-pulse" />
                        <div className="flex justify-between">
                          <div className="h-2 w-14 bg-[#1a1a1a] rounded animate-pulse" />
                          <div className="h-2 w-10 bg-[#1a1a1a] rounded animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
                key={`grid-${activeFilter}`}
                className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
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

      {/* Create Raffle Modal */}
      {showCreateModal && (
        <CreateRaffleModal
          onClose={() => {
            setShowCreateModal(false)
            refetchRaffleCount()
            refetchRaffles()
          }}
        />
      )}
    </>
  )
}


export default function Home() {
  const { isConnected } = useAccount()
  const [activeFilter, setActiveFilter] = useState('home')

  const sidebar = (
    <DashboardSidebar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
  )

  return (
    <Layout sidebar={sidebar}>
      <Routes>
        <Route path="/" element={<HomePage activeFilter={activeFilter} onFilterChange={setActiveFilter} />} />
        <Route path="/raffle/:id" element={<RaffleDetail />} />
        <Route path="/create-raffle" element={<CreateRafflePage />} />
        <Route path="/faucet" element={<Faucet />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/veryyyy-secure-admin-pageee" element={<RaffleAdminPage />} />
        <Route path="/veryyyy-secure-admin-pageee/raffles/:id" element={<AdminRaffleDetailPage />} />
      </Routes>
      {/* Global SSE toast notifications — persists across page navigations */}
      <EventToastContainer />
    </Layout>
  )
}


function buildRafflesUrl(filter: string): string {
  const url = new URL(`${BACKEND_URL}/raffles`)
  if (filter === 'official') {
    url.searchParams.set('owner_address', '0x753dfc03b4d37b3a316d0fe5ab9f677c0d3c20f8')
  } else if (filter === 'recent') {
    url.searchParams.set('sort_by', 'created_at')
    url.searchParams.set('sort_dir', 'desc')
  } else if (filter === 'tokens') {
    url.searchParams.set('type', 'crypto')
  } else if (filter === 'nft') {
    url.searchParams.set('type', 'nft')
  } else if (filter === 'ended') {
    url.searchParams.set('status', 'completed')
  }
  return url.toString()
}

const onboardingSteps = [
  { icon: '✌', title: 'Welcome aboard', desc: 'Connect your wallet.', done: true },
  { icon: '⬡', title: 'Authenticated', desc: 'Sign in with Base.', done: true },
  { icon: '◈', title: 'First raffle', desc: 'Create your first raffle.', done: false },
  { icon: '◎', title: 'First winner', desc: 'Draw your first winner.', done: false },
]
