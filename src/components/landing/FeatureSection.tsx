import { motion, useInView, type Variants } from 'framer-motion';
import { useRef } from 'react';
// import solanaLogo from '../../assets/solanaLogoMark.png';
import baseLogo from '../../assets/base-logo.webp';

const features = [
  {
    title: 'DUAL-CHAIN',
    description: 'Deploy raffles on Base (EVM). Solana integration coming soon.',
    icon: '⚡',
  },
  {
    title: 'VRF SECURED',
    description: 'Chainlink VRF on Base for provably fair, tamper-proof randomness.',
    icon: '🔐',
  },
  {
    title: 'INSTANT PAYOUTS',
    description: 'Winners receive funds automatically. No waiting, no manual claims.',
    icon: '◎',
  },
  {
    title: 'TRANSPARENT',
    description: 'All raffle logic is on-chain. Verify every ticket and every winner.',
    icon: '◈',
  },
];

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: 'easeOut' },
  }),
};

export const FeatureSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-24 md:py-32 bg-[#050505] relative overflow-hidden">
      {/* Subtle top border glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-[#FFB800]/20 to-transparent" />

      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#555555] mb-4 block">
            Why Raffled
          </span>
          <h2 className="font-sans font-bold text-4xl md:text-5xl text-[#F5F5F5] leading-tight">
            The future of{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #FF6B00, #FFB800)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              on-chain
            </span>{' '}
            raffles
          </h2>
        </motion.div>

        {/* Feature Cards */}
        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group p-7 rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] hover:border-[#FFB800]/25 hover:bg-[#0d0d0d] transition-colors duration-300 cursor-default"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-lg bg-[#FFB800]/10 border border-[#FFB800]/20 flex items-center justify-center text-xl mb-5 group-hover:bg-[#FFB800]/15 transition-colors">
                <span>{feature.icon}</span>
              </div>

              {/* Title */}
              <h3 className="font-mono font-bold text-sm uppercase tracking-wider text-[#F5F5F5] mb-2.5">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="font-mono text-sm text-[#555555] leading-relaxed">
                {feature.description}
              </p>

              {/* Hover accent line */}
              <div className="mt-5 h-px w-0 bg-gradient-to-r from-[#FF6B00] to-[#FFB800] group-hover:w-full transition-all duration-500" />
            </motion.div>
          ))}
        </div>

        {/* Network logos */}
        <motion.div
          className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-5"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <span className="font-mono text-[20px] uppercase tracking-[0.2em] text-[#666666]">
            Powered by
          </span>
          <div className="flex items-center gap-3">
            <div className="px-5 py-3 rounded-lg border border-[#1f1f1f] bg-[#0a0a0a] hover:border-[#2a2a2a] transition-colors">
              <img src={baseLogo} alt="Base" className="h-30 w-auto opacity-80 hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeatureSection;
