import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeroSection } from '../components/landing/HeroSection';
import { FeatureSection } from '../components/landing/FeatureSection';
import { Footer } from '../components/landing/Footer';
import { Button } from '../components/landing/Button';
import useLenis from '../hooks/useLenis';
import { staggerContainer, staggerItem } from '../utils/animations';

export const LandingPageOriginal = () => {
  const navigate = useNavigate();
  useLenis();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5]">

      {/* Sticky Nav */}
      <header className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-[#1f1f1f]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="font-sans font-bold text-lg tracking-tight text-[#F5F5F5] select-none">
            RAFFLED<span className="text-[#FFB800]">.</span>
          </a>
          <nav className="flex items-center gap-6">
            <a href="#features" className="font-mono text-xs uppercase tracking-wider text-[#555555] hover:text-[#FFB800] transition-colors hidden md:block">
              Features
            </a>
            <a href="#how-it-works" className="font-mono text-xs uppercase tracking-wider text-[#555555] hover:text-[#FFB800] transition-colors hidden md:block">
              How It Works
            </a>
            <Button variant="primary" size="sm" onClick={() => navigate('/app')}>
              Launch App
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* Hero */}
        <HeroSection onEnterApp={() => navigate('/app')} />

        {/* Features */}
        <div id="features">
          <FeatureSection />
        </div>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 md:py-32 bg-[#050505] relative">
          <div className="max-w-5xl mx-auto px-6">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#555555] mb-4 block">
                Simple Process
              </span>
              <h2 className="font-sans font-bold text-4xl md:text-5xl text-[#F5F5F5]">
                3 Steps to Win
              </h2>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: '-60px' }}
            >
              {[
                {
                  step: '01',
                  title: 'Connect Wallet',
                  description: 'Link your EVM wallet. MetaMask, Coinbase Wallet, and more supported.',
                  accent: '#FFB800',
                },
                {
                  step: '02',
                  title: 'Buy Tickets',
                  description: 'Choose a raffle and purchase tickets with USDC. More tickets = higher win chance.',
                  accent: '#FF8C00',
                },
                {
                  step: '03',
                  title: 'Win Prizes',
                  description: 'Chainlink VRF selects the winner on-chain. Prizes sent automatically.',
                  accent: '#FF6B00',
                },
              ].map((item) => (
                <motion.div
                  key={item.step}
                  variants={staggerItem}
                  className="relative p-7 rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] group hover:border-[#2a2a2a] transition-colors"
                >
                  {/* Step number */}
                  <div
                    className="font-mono font-bold text-5xl leading-none mb-6 opacity-20 group-hover:opacity-40 transition-opacity"
                    style={{ color: item.accent }}
                  >
                    {item.step}
                  </div>
                  <h3 className="font-sans font-bold text-lg text-[#F5F5F5] mb-2">
                    {item.title}
                  </h3>
                  <p className="font-mono text-sm text-[#555555] leading-relaxed">
                    {item.description}
                  </p>
                  {/* Bottom accent */}
                  <div
                    className="absolute bottom-0 left-7 right-7 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: `linear-gradient(90deg, transparent, ${item.accent}, transparent)` }}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <Footer onEnterApp={() => navigate('/app')} />
      </main>

      {/* Mobile floating CTA */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <Button variant="primary" size="md" onClick={() => navigate('/app')}>
          Launch App
        </Button>
      </div>
    </div>
  );
};

export default LandingPageOriginal;
