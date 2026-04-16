import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSignMessage, useDisconnect, useAccount } from 'wagmi'
import { motion, AnimatePresence } from 'framer-motion'
import { BACKEND_URL, getAuthToken } from '../../config/index'
import { WalletConnect } from './WalletConnect'

export function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const navigate = useNavigate()
  const { disconnect } = useDisconnect()
  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()

  const [authStatus, setAuthStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [, setNonce] = useState<string | null>(null)
  
  // Terms of Service modal state
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [pendingSignature, setPendingSignature] = useState<{ message: string; nonce: string } | null>(null)
  const [signatureError, setSignatureError] = useState<string | null>(null)
  const [autoAuthRan, setAutoAuthRan] = useState(false)

  useEffect(() => {
    if (!authMessage) return
    const timer = setTimeout(() => setAuthMessage(null), 10000)
    return () => clearTimeout(timer)
  }, [authMessage])

  useEffect(() => {
    // Auto-trigger sign-in when wallet connects and no token exists
    if (address && !getAuthToken() && authStatus !== 'loading' && authStatus !== 'ok') {
      handleSignIn()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address])

  const handleSignIn = async () => {
    // If already authenticated, skip
    if (getAuthToken()) {
      setAuthStatus('ok')
      return
    }

    // Fetch nonce and show terms modal
    try {
      const nonceRes = await fetch(`${BACKEND_URL}/auth/nonce`, {
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      })
      const { nonce: fetchedNonce } = await nonceRes.json()
      setNonce(fetchedNonce)

      // Compose message - same format as working example
      const message = [
        'Welcome to Raffled!',
        '',
        'Click to sign in and accept the Raffled Terms of Service and Privacy Policy. This request will not cost any gas fees.',
        '',
        `Wallet address: ${address || 'connected'}`,
        `Nonce: ${fetchedNonce}`,
      ].join('\n')

      setPendingSignature({ message, nonce: fetchedNonce })
      setShowTermsModal(true)
      setTermsAccepted(false)
    } catch (err) {
      console.error('Error fetching nonce:', err)
      setAuthStatus('error')
      setAuthMessage('Failed to initialize sign-in.')
    }
  }

  const handleProceedWithSignature = async () => {
    if (!pendingSignature || !termsAccepted) return

    setAuthStatus('loading')
    setShowTermsModal(false)
    setSignatureError(null)

    try {
      // Sign using wagmi directly - same as working example
      const signature = await signMessageAsync({
        message: pendingSignature.message,
      })

      // Verify with backend - use wagmi address
      const verifyRes = await fetch(`${BACKEND_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ 
          message: pendingSignature.message, 
          signature, 
          address, 
          chain: 'base',
          nonce: pendingSignature.nonce 
        }),
      })

      if (!verifyRes.ok) throw new Error('Verification failed')

      const data = await verifyRes.json()
      localStorage.setItem('access_token', data.token)
      setAuthStatus('ok')
      setAuthMessage('Signed in successfully.')
      setPendingSignature(null)
      setNonce(null)
    } catch (err) {
      console.error('Sign-in error:', err)
      const errorMessage = (err as Error).message
      setSignatureError(`Signature denied or verification failed. ${errorMessage}`)
      setShowTermsModal(false)
      setPendingSignature(null)
      setNonce(null)
      setTermsAccepted(false)
      try { disconnect() } catch { /* ignore */ }
      setAuthStatus('error')
      setAuthMessage('Login failed.')
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
    if (!autoAuthRan && authStatus !== 'loading') {
      const existingToken = getAuthToken()
      if (existingToken) {
        setAutoAuthRan(true)
        setAuthStatus('ok')
        setAuthMessage('Authenticated with existing session.')
      }
    }
    if (!existingTokenIsSet()) {
      setAutoAuthRan(false)
      setAuthStatus('idle')
      localStorage.removeItem('access_token')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, autoAuthRan])

  function existingTokenIsSet() {
    return !!getAuthToken()
  }

  return (
    <>
      {/* Header */}
      <header className="bg-[#050505]/90 backdrop-blur-xl border-b border-[#1f1f1f] sticky top-0 z-50">
        <div className="px-4 py-3.5 flex items-center justify-between gap-3">
          {/* Hamburger — mobile only, only when sidebar exists */}
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="md:hidden flex flex-col gap-1.5 w-8 h-8 items-center justify-center flex-shrink-0"
              aria-label="Open menu"
            >
              <span className="block w-5 h-px bg-[#999999]" />
              <span className="block w-5 h-px bg-[#999999]" />
              <span className="block w-5 h-px bg-[#999999]" />
            </button>
          )}

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
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#555555] mt-0.5 hidden sm:block">
                On-chain · Chainlink VRF
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
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

      {/* Terms of Service Modal */}
      <AnimatePresence>
        {showTermsModal && pendingSignature && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowTermsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl max-w-md w-full overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-[#1f1f1f] flex items-center gap-3">
                <img
                  src="/useRaffled.webp"
                  alt="Raffled"
                  className="w-8 h-8 rounded-md object-cover"
                />
                <h2 className="font-sans font-bold text-lg text-[#F5F5F5]">
                  Welcome to <span className="text-[#FFB800]">Raffled</span>
                </h2>
              </div>

              {/* Content */}
              <div className="px-6 py-5 space-y-4">
                <p className="text-[#CCCCCC] text-sm leading-relaxed">
                  Click to sign in and accept the{' '}
                  <a href="#" className="text-[#FFB800] hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-[#FFB800] hover:underline">Privacy Policy</a>.
                  This request will not cost any gas fees.
                </p>

                {/* Wallet Info Box */}
                <div className="bg-[#111111] border border-[#222222] rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E] flex-shrink-0" />
                    <span className="text-[#888888] text-xs font-mono uppercase">Wallet Address</span>
                  </div>
                  <p className="text-[#F5F5F5] font-mono text-sm truncate">
                    {address || 'Connected'}
                  </p>
                  <div className="pt-2 border-t border-[#222222]">
                    <span className="text-[#888888] text-xs font-mono uppercase">Nonce</span>
                    <p className="text-[#F5F5F5] font-mono text-sm mt-1">
                      {pendingSignature.nonce}
                    </p>
                  </div>
                </div>

                {/* Checkbox */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center flex-shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 border-2 border-[#333333] rounded flex items-center justify-center peer-checked:border-[#FFB800] peer-checked:bg-[#FFB800] transition-colors">
                      <svg
                        className="w-3.5 h-3.5 text-[#050505] opacity-0 peer-checked:opacity-100 transition-opacity"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-[#AAAAAA] text-sm group-hover:text-[#CCCCCC] transition-colors">
                    I accept the <a href="#" className="text-[#FFB800] hover:underline">Terms of Service</a>
                  </span>
                </label>
              </div>

              {/* Footer with Action Buttons */}
              <div className="px-6 py-4 bg-[#0d0d0d] border-t border-[#1f1f1f] flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowTermsModal(false)
                    setPendingSignature(null)
                    setNonce(null)
                    setTermsAccepted(false)
                  }}
                  className="font-sans font-medium text-sm text-[#888888] hover:text-[#AAAAAA] transition-colors px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProceedWithSignature}
                  disabled={!termsAccepted || authStatus === 'loading'}
                  className="font-sans font-semibold text-sm uppercase tracking-wider px-5 py-2.5 rounded-md bg-[#FFB800] text-[#050505] hover:bg-[#FFCC33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#FFB800]"
                >
                  {authStatus === 'loading' ? 'Signing...' : 'Sign In'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Signature Error Popup */}
      <AnimatePresence>
        {signatureError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-30 max-w-md w-full px-4 pointer-events-none"
          >
            <div className="pointer-events-auto bg-[#EF4444]/10 border border-[#EF4444]/30 backdrop-blur-xl rounded-lg px-5 py-4 flex items-center gap-4 shadow-2xl">
              <div className="w-8 h-8 rounded-full bg-[#EF4444]/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[#EF4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[#EF4444] font-medium text-sm">{signatureError}</p>
              </div>
              <button
                onClick={() => setSignatureError(null)}
                className="opacity-60 hover:opacity-100 transition-opacity text-[#EF4444]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar