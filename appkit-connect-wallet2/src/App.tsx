import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider } from 'wagmi';
import { base, baseSepolia } from '@reown/appkit/networks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import React from 'react';
import { ConnectWallet } from './components/ConnectWallet';
import SiweLogin from './components/SiweLogin';
import './App.css';

// Setup queryClient
const queryClient = new QueryClient();

// Project configuration
const projectId = '8fae13c2c3be9ccf19dbf5a66ec12f04';
const metadata = {
  name: 'AppKit Demo',
  description: 'AppKit Wallet Connection Demo (Base)',
  url: 'http://localhost:5173',
  icons: ['https://avatars.githubusercontent.com/u/179229932']
};

// Set networks
const networks = [
  base,
  baseSepolia
];

// Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true
});

// Create modal
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: true
  }
});

function App() {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <div className="app">
          <h5>Sign-In</h5>
          <SiweLogin />
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
