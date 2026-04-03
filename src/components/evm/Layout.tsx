import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from './Navbar'

interface LayoutProps {
  children: ReactNode
  sidebar?: ReactNode
}

export function Layout({ children, sidebar }: LayoutProps) {
  return (
    <div className="app-evm page">
      <Navbar />

      <div className="app-body">
        {/* Sidebar */}
        {sidebar && (
          <aside className="app-sidebar">
            {sidebar}
          </aside>
        )}

        {/* Main Content */}
        <main className={`app-main ${sidebar ? 'app-main--with-sidebar' : ''}`}>
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <p className="font-jetbrains text-xs text-white/40">
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

/* Sidebar Filter Component */
export function DashboardSidebar({ activeFilter, onFilterChange }: {
  activeFilter: string
  onFilterChange: (filter: string) => void
}) {
  const navigate = useNavigate()
  const filters = [
    { id: 'home', label: 'Home', icon: '⌂' },
    { id: 'official', label: 'Rafflux Official', icon: '★' },
    { id: 'recent', label: 'Recent', icon: '↻' },
    { id: 'tokens', label: 'Tokens', icon: '◈' },
    { id: 'ended', label: 'Ended Raffles', icon: '✓' },
  ]

  return (
    <nav className="sidebar-nav">
      <div className="sidebar-section">
        {filters.map((f) => (
          <button
            key={f.id}
            className={`sidebar-item ${activeFilter === f.id ? 'sidebar-item--active' : ''}`}
            onClick={() => onFilterChange(f.id)}
          >
            <span className="sidebar-item-icon">{f.icon}</span>
            <span className="sidebar-item-label">{f.label}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <button className="sidebar-item" onClick={() => navigate('/app')}>
          <span className="sidebar-item-icon">◎</span>
          <span className="sidebar-item-label">Discover</span>
        </button>
        <button className="sidebar-item">
          <span className="sidebar-item-icon">☰</span>
          <span className="sidebar-item-label">My Tickets</span>
        </button>
      </div>
    </nav>
  )
}

export default Layout
