import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPageOriginal from './pages/LandingPageOriginal';
import LandingPage2 from './pages/LandingPage2';

// Lazy load App variants to prevent their CSS from loading on landing page
const App = lazy(() => import('./App'));
const App2 = lazy(() => import('./App2'));
const AppEVM = lazy(() => import('./AppEVM'));

export const LandingApp = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPageOriginal />} />
      <Route path="/landingpage-2" element={<LandingPage2 />} />
      <Route
        path="/app"
        element={
          <Suspense fallback={
            <div className="min-h-screen bg-pure-black flex items-center justify-center">
              <div className="text-bg-white font-jetbrains">Loading...</div>
            </div>
          }>
            <App />
          </Suspense>
        }
      />
      <Route
        path="/app-2"
        element={
          <Suspense fallback={
            <div className="min-h-screen bg-pure-black flex items-center justify-center">
              <div className="text-bg-white font-jetbrains">Loading...</div>
            </div>
          }>
            <App2 />
          </Suspense>
        }
      />
      <Route
        path="/app-evm"
        element={
          <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
              <div className="text-pure-black font-jetbrains">Loading...</div>
            </div>
          }>
            <AppEVM />
          </Suspense>
        }
      />
    </Routes>
  );
};

export default LandingApp;
