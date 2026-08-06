import { solana, solanaTestnet, solanaDevnet } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'

// Get projectId from https://dashboard.reown.com
export const projectId = import.meta.env.VITE_PROJECT_ID || "b56e18d47c72ab683b10814fe9495694" // this is a public projectId only to use on localhost

if (!projectId) {
  throw new Error('Project ID is not defined')
}
// Create a metadata object - optional
export const metadata = {
  name: 'Raffled',
  description: 'Raffled app',
  url: import.meta.env.VITE_BASE_URL, // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [solana, solanaTestnet, solanaDevnet]

// Set up Solana Adapter

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

// ─── Backend suspended — all off-chain API calls short-circuit ────────────
// Raffle data comes from the Ponder indexer (0 RPC). Auth is wallet-only.
export const BACKEND_ENABLED = false

export const getAuthToken = () => {
  const token = localStorage.getItem('access_token')
  if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
    return null
  }
  return token
}

export const clearAuthToken = () => {
  localStorage.removeItem('access_token')
}

/**
 * Drop-in replacement for fetch that automatically handles 401 responses.
 * On 401 it clears the stored auth token and fires an 'auth:unauthorized'
 * DOM event so the Navbar can disconnect the wallet.
 *
 * When the backend is suspended (BACKEND_ENABLED = false) every request
 * short-circuits with a 503 response — no dead-domain network calls.
 */
export const apiFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  if (!BACKEND_ENABLED) {
    console.warn(`[apiFetch] Backend suspended — skipping ${String(input)}`)
    return new Response(JSON.stringify({ error: 'Backend suspended' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  console.log(`[API FETCH] ${input}, init: ${JSON.stringify(init, null, 2)}`)
  const response = await fetch(input, init)
  if (response.status === 401) {
    clearAuthToken()
    window.dispatchEvent(new CustomEvent('auth:unauthorized'))
  }
  return response
}