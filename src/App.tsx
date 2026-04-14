import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import LandingPageOriginal from './pages/LandingPageOriginal';
import LandingPage2 from './pages/LandingPage2';

// Lazy load Home to prevent its CSS from loading on landing page
const Home = lazy(() => import('./Home'));

export const App = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPageOriginal />} />
        <Route path="/lp-old" element={<LandingPage2 />} />
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
  );
};

export default App;
