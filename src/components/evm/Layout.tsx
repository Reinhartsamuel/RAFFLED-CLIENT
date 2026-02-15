import { ReactNode } from 'react'
import { Navbar } from './Navbar'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="app-evm page">
      <Navbar />

      {/* Main Content */}
      <main className="app-main">
        {children}
      </main>

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

export default Layout
