import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { staggerContainer, staggerItem } from '../../utils/animations';
import { Button } from './Button';
import { FloatingCoins } from './FloatingCoins';

const heroTitleVariants = [
  { prize: '2 ETH', cost: '10 USDC' },
  { prize: '100 USDC', cost: '1 USDC' },
  { prize: 'Rare NFTs', cost: '2.5 USDC' },
];

interface HeroSectionProps {
  onEnterApp: () => void;
}

export const HeroSection = ({ onEnterApp }: HeroSectionProps) => {
  const [activeTitleIndex, setActiveTitleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTitleIndex((previousIndex) => (previousIndex + 1) % heroTitleVariants.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <FloatingCoins />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 45% 35% at 50% 50%, rgba(5,5,5,0.75) 0%, rgba(5,5,5,0.4) 50%, transparent 85%)',
        }}
      />

      <motion.div
        className="relative z-10 max-w-4xl mx-auto px-6 text-center"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={staggerItem} className="mb-8">
          <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#555555] border border-[#1f1f1f] bg-[#0a0a0a]/80 backdrop-blur-sm rounded-full px-4 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
            Decentralized Raffle Platform · Base Network
          </span>
        </motion.div>

        <motion.h1
          variants={staggerItem}
          className="font-sans font-bold leading-[1.08] tracking-tight mb-6 text-[#F5F5F5] text-[clamp(5.5rem,8vw,7rem)] text-center"
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="block leading-tight text-center" style={{ filter: 'drop-shadow(0 0 8px rgba(245,245,245,0.5)) drop-shadow(0 0 20px rgba(245,245,245,0.3)) drop-shadow(0 0 40px rgba(245,245,245,0.15))' }}>
              Win{' '}
              <span className="inline-block mx-1">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={heroTitleVariants[activeTitleIndex].prize}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="inline-block whitespace-nowrap"
                    style={{
                      background: 'linear-gradient(135deg, #FF6B00 0%, #FFB800 50%, #FFDD66 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      filter: 'drop-shadow(0 0 8px rgba(255,184,0,0.6)) drop-shadow(0 0 20px rgba(255,107,0,0.4)) drop-shadow(0 0 40px rgba(255,184,0,0.2))',
                    }}
                  >
                    {heroTitleVariants[activeTitleIndex].prize}
                  </motion.span>
                </AnimatePresence>
              </span>
            </span>

            <span className="block leading-tight text-center text-[0.52em] sm:text-[0.48em] md:text-[0.45em] text-[#D9D9D9]" style={{ filter: 'drop-shadow(0 0 6px rgba(217,217,217,0.4)) drop-shadow(0 0 15px rgba(217,217,217,0.2))' }}>
              for only{' '}
              <span className="inline-block mx-1 text-[#FFB800]" style={{ filter: 'drop-shadow(0 0 6px rgba(255,184,0,0.5)) drop-shadow(0 0 15px rgba(255,107,0,0.3))' }}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={heroTitleVariants[activeTitleIndex].cost}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="inline-block whitespace-nowrap"
                  >
                    {heroTitleVariants[activeTitleIndex].cost}
                  </motion.span>
                </AnimatePresence>
              </span>
            </span>
          </div>
        </motion.h1>

        <motion.h2
          variants={staggerItem}
          className="font-sans font-bold text-2xl sm:text-3xl md:text-4xl leading-tight tracking-tight mb-6"
        >
          <span className="text-[#F5F5F5]" style={{ textShadow: '0 0 15px rgba(245,245,245,0.1)' }}>Fair</span>{' '}
          <span
            className="inline-block"
            style={{
              background: 'linear-gradient(135deg, #FF6B00 0%, #FFB800 50%, #FFDD66 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 6px rgba(255,184,0,0.5)) drop-shadow(0 0 15px rgba(255,107,0,0.3))',
            }}
          >
            On-Chain
          </span>{' '}
          <span className="text-[#F5F5F5]" style={{ textShadow: '0 0 15px rgba(245,245,245,0.1)' }}>Raffles.</span>
        </motion.h2>

        <motion.p
          variants={staggerItem}
          className="font-mono text-base md:text-lg text-[#555555] max-w-xl mx-auto leading-relaxed mb-4"
        >
          Win prizes on Base. Powered by Chainlink VRF for verifiable randomness. Every ticket, every winner
          {' '}
          — fully on-chain.
        </motion.p>

        <motion.div variants={staggerItem} className="flex flex-wrap items-center justify-center gap-6 mb-10">
          {[
            { value: '100%', label: 'On-Chain' },
            { value: 'VRF', label: 'Verifiable Randomness' },
            { value: 'Base', label: 'Network' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-sans font-bold text-xl text-[#FFB800]">{stat.value}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#555555]">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        <motion.div variants={staggerItem} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="primary" size="lg" onClick={onEnterApp}>
            Launch App →
          </Button>
          <Button variant="outline" size="lg">
            How It Works
          </Button>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none" />

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#333333]">Scroll</span>
        <motion.div
          className="w-px h-8 bg-gradient-to-b from-[#333333] to-transparent"
          animate={{ scaleY: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </section>
  );
};

export default HeroSection;
