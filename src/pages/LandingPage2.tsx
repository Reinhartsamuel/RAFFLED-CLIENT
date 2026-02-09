import { useEffect } from 'react';
import { useLenis } from '../hooks/useLenis';
import { Background, Header2, HeroSection2, FeatureSection2, Footer2, GlassCard } from '../components/landing-2';
import '../styles/LandingPage2.css';

const LandingPage2 = () => {
  // Initialize Lenis smooth scroll
  useLenis();

  // Reset scroll position on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen">
      <Background />
      <Header2 />
      <main>
        <HeroSection2 />
        <FeatureSection2 />
        {/* How it works section */}
        <section id="how-it-works" className="py-20 md:py-28">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 md:mb-16">
              <span className="font-jetbrains text-xs uppercase tracking-widest text-white/50 mb-4 block">
                How It Works
              </span>
              <h2 className="font-syne font-extrabold text-3xl md:text-4xl text-white">
                3 Simple Steps
              </h2>
            </div>

            <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-6">
              {/* Step 1 */}
              <GlassCard className="p-6 md:p-8">
                <div className="w-14 h-14 bg-cyan rounded-xl flex items-center justify-center mb-5">
                  <span className="font-syne font-extrabold text-2xl text-pure-black">1</span>
                </div>
                <h3 className="font-syne font-bold text-xl mb-3 text-white">
                  Connect Wallet
                </h3>
                <p className="font-jetbrains text-sm text-white/60 leading-relaxed">
                  Link your Solana or EVM wallet. We support Phantom, Solflare, MetaMask, and more.
                </p>
              </GlassCard>

              {/* Step 2 */}
              <GlassCard className="p-6 md:p-8">
                <div className="w-14 h-14 bg-gold rounded-xl flex items-center justify-center mb-5">
                  <span className="font-syne font-extrabold text-2xl text-pure-black">2</span>
                </div>
                <h3 className="font-syne font-bold text-xl mb-3 text-white">
                  Buy Tickets
                </h3>
                <p className="font-jetbrains text-sm text-white/60 leading-relaxed">
                  Choose a raffle and purchase tickets. More tickets = higher chance to win.
                </p>
              </GlassCard>

              {/* Step 3 */}
              <GlassCard className="p-6 md:p-8">
                <div className="w-14 h-14 bg-cyan rounded-xl flex items-center justify-center mb-5">
                  <span className="font-syne font-extrabold text-2xl text-pure-black">3</span>
                </div>
                <h3 className="font-syne font-bold text-xl mb-3 text-white">
                  Win Prizes
                </h3>
                <p className="font-jetbrains text-sm text-white/60 leading-relaxed">
                  VRF selects the winner. Prizes are sent automatically to your wallet.
                </p>
              </GlassCard>
            </div>
          </div>
        </section>
      </main>
      <Footer2 />
    </div>
  );
};

export default LandingPage2;