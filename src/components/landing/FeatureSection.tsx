import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import solanaLogo from '../../assets/solanaLogoMark.png';
import baseLogo from '../../assets/base-logo.webp';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    title: 'DUAL-CHAIN',
    description: 'Deploy raffles on Base (EVM) or Solana (SVM). Bridge support coming soon.',
    icon: '⚡',
    accent: 'bg-safety-lime',
  },
  {
    title: 'VRF SECURED',
    description: 'Chainlink VRF on Base. Orao VRF on Solana. Provably fair randomness.',
    icon: '🔐',
    accent: 'bg-cyan-accent',
  },
  {
    title: 'INSTANT PAYOUTS',
    description: 'Winners receive funds automatically. No waiting, no claims needed.',
    icon: '💸',
    accent: 'bg-safety-lime',
  },
  {
    title: 'TRANSPARENT',
    description: 'All raffle logic on-chain. Verify every ticket, every winner.',
    icon: '👁️',
    accent: 'bg-cyan-accent',
  },
];

export const FeatureSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const cards = cardsRef.current;

    gsap.set(cards, { y: 60, opacity: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 75%',
        toggleActions: 'play none none reverse',
      },
    });

    tl.to(cards, {
      y: 0,
      opacity: 1,
      duration: 0.01,
      stagger: 0.08,
      ease: 'power2.out',
    });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section className="py-20 md:py-28 bg-bg-white border-b-2 border-pure-black">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Section Header - Centered */}
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-block font-jetbrains text-xs uppercase tracking-widest text-pure-black/40 mb-4 font-light">
            Why Raffled
          </span>
          <h2 className="font-syne font-black text-4xl md:text-5xl lg:text-6xl text-pure-black leading-tight">
            The Future of{' '}
            <span className="bg-safety-lime px-2 border-2 border-pure-black inline-block">
              On-Chain
            </span>{' '}
            Raffles
          </h2>
        </div>

        {/* Feature Cards Grid - Full width with max constraint */}
        <div ref={containerRef} className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              ref={(el) => {
                if (el) cardsRef.current[index] = el;
              }}
              whileHover={{ x: -4, y: -4 }}
              className="p-6 md:p-8 group cursor-pointer bg-bg-white border-2 border-pure-black shadow-brutal hover:shadow-brutal-lg transition-all duration-150"
            >
              {/* Icon */}
              <div
                className={`w-14 h-14 ${feature.accent} border-2 border-pure-black flex items-center justify-center text-2xl mb-6`}
              >
                {feature.icon}
              </div>

              {/* Title */}
              <h3 className="font-syne font-black text-xl md:text-2xl text-pure-black mb-3 tracking-tight">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="font-jetbrains text-sm text-pure-black/50 leading-relaxed font-light">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Network Logos */}
        <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6">
          <span className="font-jetbrains text-xs uppercase tracking-widest text-pure-black/40 font-light">
            Powered by
          </span>
          <div className="flex items-center gap-4">
            <div className="p-4 bg-bg-white border-2 border-pure-black shadow-brutal-sm hover:shadow-brutal transition-all">
              <img src={baseLogo} alt="Base" className="h-8 w-auto" />
            </div>
            <div className="p-4 bg-bg-white border-2 border-pure-black shadow-brutal-sm hover:shadow-brutal transition-all">
              <img src={solanaLogo} alt="Solana" className="h-8 w-auto" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
