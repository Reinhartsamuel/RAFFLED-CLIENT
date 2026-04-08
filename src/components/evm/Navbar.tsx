import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSignMessage, useDisconnect } from 'wagmi'
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import { motion, AnimatePresence } from 'framer-motion'
import { BACKEND_URL, getAuthToken } from '../../config/index'
import { WalletConnect } from './WalletConnect'

export function Navbar() {
  const navigate = useNavigate()
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const { signMessageAsync } = useSignMessage()
  const { disconnect } = useDisconnect()

  const [authStatus, setAuthStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [autoAuthRan, setAutoAuthRan] = useState(false)

  useEffect(() => {
    if (!authMessage) return
    const timer = setTimeout(() => setAuthMessage(null), 10000)
    return () => clearTimeout(timer)
  }, [authMessage])

  const handleSignIn = async (auto = false) => {
    if (!isConnected || !address) {
      if (!auto) open()
      return
    }
    setAuthStatus('loading')
    setAuthMessage(null)
    try {
      const nonceRes = await fetch(`${BACKEND_URL}/auth/nonce`, {
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      })
      const { nonce } = await nonceRes.json()

      const message = [
        'Sign in with Base to Raffled',
        '',
        `Address: ${address}`,
        `Nonce: ${nonce}`,
        `Issued At: ${new Date().toISOString()}`,
      ].join('\n')

      const signature = await signMessageAsync({ message })

      const verifyRes = await fetch(`${BACKEND_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ message, signature, address, chain: 'base' }),
      })

      if (!verifyRes.ok) throw new Error('Verification failed')

      const data = await verifyRes.json()
      localStorage.setItem('access_token', data.token)
      setAuthStatus('ok')
      setAuthMessage('Signed in with Base.')
    } catch (err) {
      console.error('EVM sign-in error:', err)
      setAuthStatus('error')
      setAuthMessage('Login failed. Ensure wallet is connected.')
      if (auto) {
        setAutoAuthRan(false)
        try { disconnect() } catch { /* ignore */ }
      }
    }
  }

  // Disconnect + clear state when any API call returns 401
  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem('access_token')
      setAutoAuthRan(false)
      setAuthStatus('idle')
      setAuthMessage(null)
      try { disconnect() } catch { /* ignore */ }
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [disconnect])

  // Auto sign-in when wallet connects
  useEffect(() => {
    if (isConnected && !autoAuthRan && authStatus !== 'loading') {
      const existingToken = getAuthToken()
      if (existingToken) {
        setAutoAuthRan(true)
        setAuthStatus('ok')
        setAuthMessage('Authenticated with existing session.')
      } else {
        setAutoAuthRan(true)
        handleSignIn(true)
      }
    }
    if (!isConnected && autoAuthRan) {
      setAutoAuthRan(false)
      setAuthStatus('idle')
      localStorage.removeItem('access_token')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, authStatus, autoAuthRan, address])

  return (
    <>
      {/* Header */}
      <header className="bg-[#050505]/90 backdrop-blur-xl border-b border-[#1f1f1f] sticky top-0 z-50">
        <div className="px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => navigate('/app')}
          >
            <img
              src="/useRaffled.webp"
              alt="Raffled"
              className="w-9 h-9 rounded-md object-cover"
            />
            <div className="flex flex-col">
              <h1 className="font-sans font-bold text-xl tracking-tight text-[#F5F5F5] leading-none">
                RAFFLED<span className="text-[#FFB800]">.</span>
              </h1>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#555555] mt-0.5">
                On-chain · Chainlink VRF
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {isConnected && authStatus !== 'ok' && (
              <button
                className="font-mono font-semibold text-xs uppercase tracking-wider px-4 py-2 rounded-md bg-[#FFB800] text-[#050505] hover:bg-[#FFCC33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleSignIn(false)}
                disabled={authStatus === 'loading'}
              >
                {authStatus === 'loading' ? 'Signing...' : 'Sign In'}
              </button>
            )}
            {isConnected && authStatus === 'ok' && (
              <span className="font-mono text-xs text-[#22C55E] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                Authenticated
              </span>
            )}
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Auth Message Banner */}
      <AnimatePresence>
        {authMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center justify-between px-6 py-2.5 font-mono text-xs border-b ${
              authStatus === 'ok'
                ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20'
                : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20'
            }`}
          >
            <span>{authMessage}</span>
            <button
              onClick={() => setAuthMessage(null)}
              className="opacity-60 hover:opacity-100 transition-opacity ml-4 text-base leading-none"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar
