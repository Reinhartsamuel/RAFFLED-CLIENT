import { ReactNode, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from './Navbar'
import { pageVariants } from '../../utils/animations'


interface LayoutProps {
  children: ReactNode
  sidebar?: ReactNode
}

export function Layout({ children, sidebar }: LayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5] flex flex-col">
      <Navbar onMenuClick={sidebar ? () => setDrawerOpen((v) => !v) : undefined} />

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && sidebar && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              onClick={() => setDrawerOpen(false)}
            />
            {/* Drawer */}
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
              className="fixed top-0 left-0 z-50 h-full w-64 bg-[#050505] border-r border-[#1f1f1f] overflow-y-auto md:hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-[#1f1f1f]">
                <span className="font-sans font-bold text-base text-[#F5F5F5]">
                  RAFFLED<span className="text-[#FFB800]">.</span>
                </span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="w-8 h-8 flex items-center justify-center text-[#555555] hover:text-[#F5F5F5] transition-colors"
                >
                  ✕
                </button>
              </div>
              <div onClick={() => setDrawerOpen(false)}>
                {sidebar}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        {sidebar && (
          <aside className="w-52 flex-shrink-0 border-r border-[#1f1f1f] bg-[#050505] sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto hidden md:block">
            {sidebar}
          </aside>
        )}

        {/* Main Content */}
        <motion.main
          className="flex-1 min-w-0"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {children}
        </motion.main>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#1f1f1f] bg-[#050505] py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <p className="font-mono text-xs text-[#555555]">
            © 2025 Raffled · On-chain raffles with verifiable randomness
          </p>
          <div className="flex items-center gap-4 font-mono text-xs">
            <a href="#" className="text-[#555555] hover:text-[#FFB800] transition-colors">Docs</a>
            <span className="text-[#2a2a2a]">·</span>
            <a href="#" className="text-[#555555] hover:text-[#FFB800] transition-colors">GitHub</a>
            <span className="text-[#2a2a2a]">·</span>
            <a href="#" className="text-[#555555] hover:text-[#FFB800] transition-colors">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* Sidebar Filter Component */
export function DashboardSidebar({ activeFilter, onFilterChange }: {
  activeFilter: string
  onFilterChange: (filter: string) => void
}) {
  const navigate = useNavigate()
  const filters = [
    { id: 'home', label: 'Home', icon: '⌂' },
    { id: 'official', label: 'Official', icon: '★' },
    { id: 'recent', label: 'Recent', icon: '↻' },
    { id: 'tokens', label: 'Tokens', icon: '◈' },
    { id: 'nft', label: 'NFT', icon: '⬡' },
    { id: 'ended', label: 'Ended', icon: '✓' },
  ]

  const handleFilterClick = (filterId: string) => {
    onFilterChange(filterId)
    navigate('/app')
  }

  return (
    <nav className="flex flex-col gap-0 py-4">
      <div className="flex flex-col gap-0.5 px-2">
        {filters.map((f) => (
          <button
            key={f.id}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-left transition-all duration-150 font-mono text-sm
              ${activeFilter === f.id
                ? 'bg-[#FFB800]/10 text-[#FFB800] border-l-2 border-[#FFB800]'
                : 'text-[#555555] hover:text-[#F5F5F5] hover:bg-[#111111]'
              }`}
            onClick={() => handleFilterClick(f.id)}
          >
            <span className="w-4 text-center">{f.icon}</span>
            <span>{f.label}</span>
          </button>
        ))}
      </div>

      <div className="h-px bg-[#1f1f1f] mx-3 my-3" />

      <div className="flex flex-col gap-0.5 px-2">
        <button
          className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-left transition-all duration-150 font-mono text-sm ${
            activeFilter === 'create'
              ? 'bg-[#FFB800]/10 text-[#FFB800] border-l-2 border-[#FFB800]'
              : 'text-[#555555] hover:text-[#F5F5F5] hover:bg-[#111111]'
          }`}
          onClick={() => navigate('/app/create-raffle')}
        >
          <span className="w-4 text-center">+</span>
          <span>Create Raffle</span>
        </button>
        <button
          className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-left transition-all duration-150 font-mono text-sm ${
            activeFilter === 'discover'
              ? 'bg-[#FFB800]/10 text-[#FFB800] border-l-2 border-[#FFB800]'
              : 'text-[#555555] hover:text-[#F5F5F5] hover:bg-[#111111]'
          }`}
          onClick={() => navigate('/app')}
        >
          <span className="w-4 text-center">◎</span>
          <span>Discover</span>
        </button>
        <button
          className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-left transition-all duration-150 font-mono text-sm ${
            activeFilter === 'faucet'
              ? 'bg-[#FFB800]/10 text-[#FFB800] border-l-2 border-[#FFB800]'
              : 'text-[#555555] hover:text-[#F5F5F5] hover:bg-[#111111]'
          }`}
          onClick={() => navigate('/app/faucet')}
        >
          <span className="w-4 text-center">⬡</span>
          <span>Faucet</span>
        </button>
        <button
          className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-left transition-all duration-150 font-mono text-sm ${
            activeFilter === 'activity'
              ? 'bg-[#FFB800]/10 text-[#FFB800] border-l-2 border-[#FFB800]'
              : 'text-[#555555] hover:text-[#F5F5F5] hover:bg-[#111111]'
          }`}
          onClick={() => navigate('/app/activity')}
        >
          <span className="w-4 text-center">↻</span>
          <span>Activity</span>
        </button>
        <button
          className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-left transition-all duration-150 font-mono text-sm ${
            activeFilter === 'mytickets'
              ? 'bg-[#FFB800]/10 text-[#FFB800] border-l-2 border-[#FFB800]'
              : 'text-[#555555] hover:text-[#F5F5F5] hover:bg-[#111111]'
          }`}
          onClick={() => {}}
        >
          <span className="w-4 text-center">☰</span>
          <span>My Tickets</span>
        </button>
      </div>
    </nav>
  )
}

export default Layout
