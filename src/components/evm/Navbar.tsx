import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSignMessage, useDisconnect } from 'wagmi'
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import { API_BASE_URL, getAuthToken } from '../../config/index'
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

  const activeToken = useMemo(() => getAuthToken(), [authStatus])

  const handleSignIn = async (auto = false) => {
    if (!isConnected || !address) {
      if (!auto) open()
      return
    }
    setAuthStatus('loading')
    setAuthMessage(null)
    try {
      const nonceRes = await fetch(`${API_BASE_URL}/auth/nonce`, {
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

      const verifyRes = await fetch(`${API_BASE_URL}/auth/verify`, {
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
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section" style={{ cursor: 'pointer' }} onClick={() => navigate('/app')}>
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
            {isConnected && authStatus !== 'ok' && (
              <button
                className="btn-primary"
                onClick={() => handleSignIn(false)}
                disabled={authStatus === 'loading'}
              >
                <span className="font-jetbrains text-xs font-bold">
                  {authStatus === 'loading' ? 'Signing...' : 'Sign In'}
                </span>
              </button>
            )}
            {isConnected && authStatus === 'ok' && (
              <span className="font-jetbrains text-xs text-pure-black/50">
                Authenticated
              </span>
            )}

            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Auth Message */}
      {authMessage && (
        <div className={`auth-banner ${authStatus === 'ok' ? 'auth-ok' : 'auth-error'}`}>
          <p className="font-jetbrains text-xs">{authMessage}</p>
          <button className="auth-banner-close" onClick={() => setAuthMessage(null)}>✕</button>
        </div>
      )}
    </>
  )
}

export default Navbar
