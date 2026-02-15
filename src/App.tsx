import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPageOriginal from './pages/LandingPageOriginal';
import LandingPage2 from './pages/LandingPage2';

// Lazy load Home to prevent its CSS from loading on landing page
const Home = lazy(() => import('./Home'));

export const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPageOriginal />} />
      <Route path="/lp-2" element={<LandingPage2 />} />
      <Route
        path="/app/*"
        element={
          <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
              <div className="text-pure-black font-jetbrains">Loading...</div>
            </div>
          }>
            <Home />
          </Suspense>
        }
      />
    </Routes>
  );
};

export default App;
