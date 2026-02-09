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

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const getAuthToken = () => localStorage.getItem('access_token')