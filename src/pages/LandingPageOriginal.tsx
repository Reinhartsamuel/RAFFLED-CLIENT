import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticker } from '../components/landing/Ticker';
import { HeroSection } from '../components/landing/HeroSection';
import { FeatureSection } from '../components/landing/FeatureSection';
import { Footer } from '../components/landing/Footer';
import useLenis from '../hooks/useLenis';

export const LandingPageOriginal = () => {
  const navigate = useNavigate();
  // Initialize Lenis smooth scroll
  useLenis();

  // Reset scroll position on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-bg-white">
      {/* Sticky Header Container */}
      <header className="sticky top-0 z-50">
        {/* Ticker */}
        <Ticker />

        {/* Navigation */}
        <nav className="bg-bg-white/80 backdrop-blur-md border-b border-pure-black/10">
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
            <a href="/" className="font-syne font-extrabold text-xl text-pure-black">
              RAFFLED
            </a>
            <div className="flex items-center gap-6">
              <a
                href="#features"
                className="font-jetbrains text-xs uppercase tracking-wider text-pure-black/70 hover:text-pure-black transition-colors hidden md:block"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="font-jetbrains text-xs uppercase tracking-wider text-pure-black/70 hover:text-pure-black transition-colors hidden md:block"
              >
                How It Works
              </a>
              <button
                onClick={() => navigate('/app-2')}
                className="font-jetbrains font-semibold text-xs uppercase tracking-wider px-4 py-2 border border-pure-black bg-bg-white hover:bg-pure-black/[0.05] transition-colors hidden md:block"
              >
                App v2
              </button>
              <button
                onClick={() => navigate('/app')}
                className="font-jetbrains font-semibold text-xs uppercase tracking-wider px-4 py-2 bg-safety-lime rounded-lg hover:bg-[#d4f000] transition-colors"
              >
                Launch App
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <HeroSection onEnterApp={() => navigate('/app')} />

        {/* Feature Section */}
        <div id="features">
          <FeatureSection />
        </div>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 md:py-28 bg-gradient-to-b from-safety-lime/20 to-safety-lime/5">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 md:mb-16">
              <span className="font-jetbrains text-xs uppercase tracking-widest text-pure-black/50 mb-4 block">
                How It Works
              </span>
              <h2 className="font-syne font-extrabold text-3xl md:text-4xl text-pure-black">
                3 Simple Steps
              </h2>
            </div>

            <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-6">
              {/* Step 1 */}
              <div className="bg-bg-white rounded-2xl p-6 md:p-8 border border-pure-black/10 hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-cyan-accent rounded-xl flex items-center justify-center mb-5">
                  <span className="font-syne font-extrabold text-2xl text-pure-black">1</span>
                </div>
                <h3 className="font-syne font-bold text-xl mb-3 text-pure-black">
                  Connect Wallet
                </h3>
                <p className="font-jetbrains text-sm text-pure-black/60 leading-relaxed">
                  Link your Solana or EVM wallet. We support Phantom, Solflare, MetaMask, and more.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-bg-white rounded-2xl p-6 md:p-8 border border-pure-black/10 hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-safety-lime rounded-xl flex items-center justify-center mb-5">
                  <span className="font-syne font-extrabold text-2xl text-pure-black">2</span>
                </div>
                <h3 className="font-syne font-bold text-xl mb-3 text-pure-black">
                  Buy Tickets
                </h3>
                <p className="font-jetbrains text-sm text-pure-black/60 leading-relaxed">
                  Choose a raffle and purchase tickets. More tickets = higher chance to win.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-bg-white rounded-2xl p-6 md:p-8 border border-pure-black/10 hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-cyan-accent rounded-xl flex items-center justify-center mb-5">
                  <span className="font-syne font-extrabold text-2xl text-pure-black">3</span>
                </div>
                <h3 className="font-syne font-bold text-xl mb-3 text-pure-black">
                  Win Prizes
                </h3>
                <p className="font-jetbrains text-sm text-pure-black/60 leading-relaxed">
                  VRF selects the winner. Prizes are sent automatically to your wallet.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <Footer onEnterApp={() => navigate('/app')} />
      </main>

      {/* Mobile Floating Button */}
      <button
        onClick={() => navigate('/app')}
        className="md:hidden fixed bottom-6 right-6 z-50 font-jetbrains font-semibold text-sm uppercase tracking-wider px-5 py-3 bg-safety-lime rounded-full shadow-lg hover:shadow-xl transition-shadow"
      >
        Enter App
      </button>
    </div>
  );
};

export default LandingPageOriginal;
