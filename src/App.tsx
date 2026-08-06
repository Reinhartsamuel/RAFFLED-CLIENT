import { WagmiProvider } from 'wagmi';
import { QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { DeploymentInfo } from './components/DeploymentInfo';
import { wagmiConfig, queryClient } from './config/evm.config';
import LandingPageFrequency from './pages/LandingPageFrequency';
import EmbedRaffle from './pages/EmbedRaffle';
import RaffleProof from './pages/RaffleProof';
import DocsEmbed from './pages/DocsEmbed';

// Lazy load Home to prevent its CSS from loading on landing page
const Home = lazy(() => import('./Home'));

function AppContent() {
  const location = useLocation();

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LandingPageFrequency />} />
          <Route path="/embed/:id" element={<EmbedRaffle />} />
          <Route path="/docs/embed" element={<DocsEmbed />} />
          <Route path="/raffle/:id/proof" element={<RaffleProof />} />
          <Route
            path="/app/*"
            element={
              <Suspense fallback={
                <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                  <div className="font-mono text-[#555555] text-sm tracking-widest uppercase">Loading...</div>
                </div>
              }>
                <Home />
              </Suspense>
            }
          />
        </Routes>
      </AnimatePresence>
      <DeploymentInfo />
    </>
  );
}

export function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
