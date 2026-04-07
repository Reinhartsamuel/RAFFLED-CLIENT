import { solana, solanaTestnet, solanaDevnet } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'
import { SolanaAdapter } from '@reown/appkit-adapter-solana/react'


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
export const solanaWeb3JsAdapter = new SolanaAdapter()

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

export const getAuthToken = () => {
  const token = localStorage.getItem('access_token')
  // Return null if token is null, undefined, empty string, or the string "null"/"undefined"
  if (!token || token === 'null' || token === 'undefined') {
    return null
  }
  return token
}