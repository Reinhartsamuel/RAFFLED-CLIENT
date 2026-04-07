import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../utils/animations';
import { Button } from './Button';

interface HeroSectionProps {
  onEnterApp: () => void;
}

export const HeroSection = ({ onEnterApp }: HeroSectionProps) => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">

      {/* Radial vignette overlay */}
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 0%, #050505 100%)'
      }} />

      {/* Content */}
      <motion.div
        className="relative z-10 max-w-4xl mx-auto px-6 text-center"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Eyebrow badge */}
        <motion.div variants={staggerItem} className="mb-8">
          <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#555555] border border-[#1f1f1f] bg-[#0a0a0a]/80 backdrop-blur-sm rounded-full px-4 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
            Decentralized Raffle Platform · Base Network
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          variants={staggerItem}
          className="font-sans font-bold text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight mb-6"
        >
          <span className="text-[#F5F5F5]">Fair</span>
          {' '}
          <span
            className="inline-block"
            style={{
              background: 'linear-gradient(135deg, #FF6B00 0%, #FFB800 50%, #FFDD66 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            On-Chain
          </span>
          {' '}
          <span className="text-[#F5F5F5]">Raffles.</span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          variants={staggerItem}
          className="font-mono text-base md:text-lg text-[#555555] max-w-xl mx-auto leading-relaxed mb-4"
        >
          Win prizes on Base. Powered by Chainlink VRF for verifiable randomness. Every ticket, every winner — fully on-chain.
        </motion.p>

        {/* Stats row */}
        <motion.div
          variants={staggerItem}
          className="flex flex-wrap items-center justify-center gap-6 mb-10"
        >
          {[
            { value: '100%', label: 'On-Chain' },
            { value: 'VRF', label: 'Verifiable Randomness' },
            { value: 'Base', label: 'Network' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="font-sans font-bold text-xl text-[#FFB800]">{stat.value}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#555555]">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          variants={staggerItem}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button variant="primary" size="lg" onClick={onEnterApp}>
            Launch App →
          </Button>
          <Button variant="outline" size="lg">
            How It Works
          </Button>
        </motion.div>
      </motion.div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none" />

      {/* Scroll indicator */}
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
