import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { useRef, useState, useEffect, type ReactNode } from 'react';

/* ------------------------------------------------------------------ */
/*  Device capability detection — FPS benchmark                        */
/* ------------------------------------------------------------------ */

const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

function useLowEndDevice(): boolean | null {
  // null = benchmark still running, boolean = result
  const [isLowEnd, setIsLowEnd] = useState<boolean | null>(isIOS ? false : null);

  useEffect(() => {
    if (isIOS) return; // iOS always capable — skip benchmark

    let frameCount = 0;
    const TARGET_FRAMES = 60;
    let startTime: number | null = null;
    let rafId: number;

    const tick = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      frameCount++;

      if (frameCount < TARGET_FRAMES) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      const elapsed = timestamp - startTime;
      const avgFrameMs = elapsed / TARGET_FRAMES;
      // > 20ms average = below 50fps = low-end
      setIsLowEnd(avgFrameMs > 20);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return isLowEnd;
}

/* ------------------------------------------------------------------ */
/*  SVG COIN MARKS — hand-built, no external deps                     */
/* ------------------------------------------------------------------ */

const USDCCoin = () => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="usdc-rg" cx="35%" cy="28%" r="80%">
        <stop offset="0%" stopColor="#5FA9FF" />
        <stop offset="55%" stopColor="#2775CA" />
        <stop offset="100%" stopColor="#154B82" />
      </radialGradient>
      <linearGradient id="usdc-rim" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#8BC4FF" />
        <stop offset="100%" stopColor="#0E3962" />
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="31" fill="url(#usdc-rim)" />
    <circle cx="32" cy="32" r="28" fill="url(#usdc-rg)" />
    <circle cx="32" cy="32" r="28" fill="none" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="0.6" />
    {/* Top highlight */}
    <ellipse cx="26" cy="18" rx="14" ry="5" fill="#ffffff" opacity="0.18" />
    {/* $ glyph */}
    <path
      d="M32 14v4.2c5.6.5 9.3 3.1 9.6 7.1h-5c-.2-1.8-2-3-4.7-3.2v6.7c6.4.9 9.5 3 9.5 7.3 0 4.4-3.5 7.1-9.4 7.6V48h-2.9v-4.3c-6-.5-9.7-3.2-10-7.5h5c.3 2 2.3 3.2 5.2 3.5v-7c-6.2-.8-9.3-3-9.3-7.3 0-4.2 3.4-6.9 9.1-7.4V14H32zm-.3 11.5c-2.5.3-4 1.4-4 3 0 1.5 1.3 2.4 4 2.9v-5.9zm2.7 8.8v6.4c2.8-.3 4.3-1.4 4.3-3.2 0-1.6-1.4-2.6-4.3-3.2z"
      fill="#ffffff"
    />
  </svg>
);

const ETHCoin = () => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="eth-rg" cx="35%" cy="28%" r="85%">
        <stop offset="0%" stopColor="#B8B4FF" />
        <stop offset="55%" stopColor="#627EEA" />
        <stop offset="100%" stopColor="#2A3B7A" />
      </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="31" fill="#1D2650" />
    <circle cx="32" cy="32" r="28" fill="url(#eth-rg)" />
    <ellipse cx="26" cy="18" rx="14" ry="5" fill="#ffffff" opacity="0.18" />
    {/* Ethereum diamond */}
    <g fill="#ffffff">
      <path opacity="0.9" d="M32 10v16.3l13.5 6z" />
      <path opacity="0.65" d="M32 10L18.5 32.3l13.5-6z" />
      <path opacity="0.9" d="M32 42.6v11.4l13.5-18.7z" />
      <path opacity="0.65" d="M32 54V42.6l-13.5-7.3z" />
      <path opacity="0.5" d="M32 40l13.5-7.7L32 26.3z" />
      <path opacity="0.8" d="M18.5 32.3L32 40V26.3z" />
    </g>
  </svg>
);

const BaseCoin = () => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="base-rg" cx="35%" cy="28%" r="80%">
        <stop offset="0%" stopColor="#5EA0FF" />
        <stop offset="55%" stopColor="#0052FF" />
        <stop offset="100%" stopColor="#002470" />
      </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="31" fill="#001A5C" />
    <circle cx="32" cy="32" r="28" fill="url(#base-rg)" />
    <ellipse cx="26" cy="18" rx="14" ry="5" fill="#ffffff" opacity="0.2" />
    {/* Base logomark — almost-full circle with flat left edge */}
    <path
      d="M32 16c8.8 0 16 7.2 16 16s-7.2 16-16 16c-8.4 0-15.3-6.5-16-14.8h22.4v-2.4H16c.7-8.3 7.6-14.8 16-14.8z"
      fill="#ffffff"
    />
  </svg>
);

const BTCCoin = () => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="btc-rg" cx="35%" cy="28%" r="85%">
        <stop offset="0%" stopColor="#FFD88A" />
        <stop offset="55%" stopColor="#F7931A" />
        <stop offset="100%" stopColor="#7A3E00" />
      </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="31" fill="#4A2500" />
    <circle cx="32" cy="32" r="28" fill="url(#btc-rg)" />
    <ellipse cx="26" cy="18" rx="14" ry="5" fill="#ffffff" opacity="0.22" />
    <path
      d="M43 28.5c.5-3.4-2.1-5.2-5.6-6.4l1.1-4.6-2.8-.7-1.1 4.4c-.7-.2-1.5-.4-2.2-.5l1.1-4.5-2.8-.7-1.1 4.6c-.6-.1-1.2-.3-1.8-.4v0l-3.9-1-.8 3s2.1.5 2.1.5c1.1.3 1.3 1.1 1.3 1.6l-1.3 5.2c.1 0 .2.1.3.1-.1 0-.2-.1-.3-.1l-1.8 7.3c-.1.3-.5.8-1.2.6 0 .1-2.1-.5-2.1-.5l-1.4 3.2 3.6.9c.7.2 1.3.4 2 .5l-1.2 4.7 2.8.7 1.1-4.6c.8.2 1.5.4 2.2.6l-1.1 4.5 2.8.7 1.2-4.7c4.8.9 8.5.6 10-3.8 1.3-3.5-.1-5.6-2.6-6.9 1.9-.4 3.3-1.6 3.6-4.1zm-6.4 9.1c-.9 3.5-6.8 1.6-8.7 1.1l1.5-6.1c1.9.5 8.1 1.4 7.2 5zm.9-9.2c-.8 3.2-5.7 1.6-7.3 1.2l1.3-5.5c1.6.4 6.8 1.1 6 4.3z"
      fill="#ffffff"
    />
  </svg>
);

const SolCoin = () => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="sol-rg" cx="35%" cy="28%" r="85%">
        <stop offset="0%" stopColor="#C4F7E2" />
        <stop offset="45%" stopColor="#14F195" />
        <stop offset="100%" stopColor="#8A2BE2" />
      </radialGradient>
      <linearGradient id="sol-bar" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9945FF" />
        <stop offset="100%" stopColor="#14F195" />
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="31" fill="#1A0A3A" />
    <circle cx="32" cy="32" r="28" fill="url(#sol-rg)" opacity="0.9" />
    <ellipse cx="26" cy="18" rx="14" ry="5" fill="#ffffff" opacity="0.22" />
    {/* Solana three bars */}
    <g>
      <path d="M22 42.5l3-3h20l-3 3z" fill="url(#sol-bar)" />
      <path d="M22 32l3-3h20l-3 3z" fill="url(#sol-bar)" />
      <path d="M22 21.5l3-3h20l-3 3z" fill="url(#sol-bar)" />
    </g>
  </svg>
);

const GoldCoin = () => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="gold-rg" cx="35%" cy="25%" r="85%">
        <stop offset="0%" stopColor="#FFF3B8" />
        <stop offset="50%" stopColor="#FFB800" />
        <stop offset="100%" stopColor="#6B3800" />
      </radialGradient>
      <linearGradient id="gold-rim" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFE27A" />
        <stop offset="100%" stopColor="#4A2400" />
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="31" fill="url(#gold-rim)" />
    <circle cx="32" cy="32" r="28" fill="url(#gold-rg)" />
    {/* inner ring */}
    <circle cx="32" cy="32" r="22" fill="none" stroke="#6B3800" strokeOpacity="0.35" strokeWidth="1" />
    <circle cx="32" cy="32" r="22" fill="none" stroke="#FFF3B8" strokeOpacity="0.4" strokeWidth="0.6" strokeDasharray="1 2" />
    <ellipse cx="26" cy="17" rx="15" ry="5" fill="#ffffff" opacity="0.35" />
    {/* Star */}
    <path
      d="M32 20l2.9 8.2h8.6l-7 5.1 2.7 8.3L32 36.5l-7.2 5.1 2.7-8.3-7-5.1h8.6z"
      fill="#6B3800"
      fillOpacity="0.55"
    />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  CoinProps — per-instance stage direction                          */
/* ------------------------------------------------------------------ */

type CoinKind = 'usdc' | 'eth' | 'base' | 'btc' | 'sol' | 'gold';

interface CoinConfig {
  kind: CoinKind;
  /* percentage positions — let the container size decide */
  top: string;
  left: string;
  size: number;             // px
  blur: number;             // px
  opacity: number;
  rotateInit: number;       // deg
  depth: 'back' | 'mid' | 'front';
  floatDelay: number;       // s, staggers the idle float
  floatDuration: number;    // s
}

const COIN_COMPONENTS: Record<CoinKind, () => ReactNode> = {
  usdc: USDCCoin,
  eth: ETHCoin,
  base: BaseCoin,
  btc: BTCCoin,
  sol: SolCoin,
  gold: GoldCoin,
};

/* Layered composition:
   - BACK:  heavy blur (8-14px), 25-40% opacity, slow scroll drift
   - MID:   light blur (2-4px),  55-70% opacity, medium parallax
   - FRONT: no blur,             85-100% opacity, aggressive counter-parallax + tumble
*/
const COINS: CoinConfig[] = [
  // --- BACK LAYER (ambient depth — much bigger now, softer blur so they still read) ---
  { kind: 'gold', top: '4%',  left: '2%',  size: 280, blur: 8,  opacity: 0.55, rotateInit: -18, depth: 'back',  floatDelay: 0,   floatDuration: 11 },
  { kind: 'btc',  top: '58%', left: '78%', size: 320, blur: 7,  opacity: 0.5,  rotateInit: 24,  depth: 'back',  floatDelay: 1.8, floatDuration: 13 },
  { kind: 'eth',  top: '68%', left: '0%',  size: 240, blur: 6,  opacity: 0.55, rotateInit: 12,  depth: 'back',  floatDelay: 3.4, floatDuration: 12 },

  // --- MID LAYER (near-crisp, prominent) ---
  { kind: 'usdc', top: '12%', left: '76%', size: 170, blur: 1.5, opacity: 0.92, rotateInit: -22, depth: 'mid',   floatDelay: 0.6, floatDuration: 8  },
  { kind: 'base', top: '74%', left: '60%', size: 150, blur: 1,   opacity: 0.95, rotateInit: 16,  depth: 'mid',   floatDelay: 2.1, floatDuration: 9  },
  { kind: 'sol',  top: '8%',  left: '34%', size: 130, blur: 1,   opacity: 0.88, rotateInit: -8,  depth: 'mid',   floatDelay: 1.3, floatDuration: 10 },

  // --- FRONT LAYER (crisp, hero-adjacent, bold) ---
  { kind: 'gold', top: '30%', left: '6%',  size: 110, blur: 0,  opacity: 1,    rotateInit: -14, depth: 'front', floatDelay: 0.2, floatDuration: 6  },
  { kind: 'usdc', top: '80%', left: '18%', size: 95,  blur: 0,  opacity: 1,    rotateInit: 30,  depth: 'front', floatDelay: 2.4, floatDuration: 7  },
  { kind: 'eth',  top: '42%', left: '88%', size: 90,  blur: 0,  opacity: 1,    rotateInit: -28, depth: 'front', floatDelay: 1.1, floatDuration: 6.5},
];

/* ------------------------------------------------------------------ */
/*  Low-end coin — static, no blur, no animation                      */
/* ------------------------------------------------------------------ */

interface CoinProps {
  config: CoinConfig;
  scrollY: MotionValue<number>;
  lowEnd?: boolean;
}

const Coin = ({ config, scrollY, lowEnd = false }: CoinProps) => {
  const Component = COIN_COMPONENTS[config.kind];

  // Scroll depth mapping:
  //  - back coins drift DOWN slowly (feels far away, lags behind)
  //  - mid coins move up moderately
  //  - front coins move up aggressively AND counter-rotate (tumble toward viewer)
  const depthY =
    config.depth === 'back' ? 120 :
    config.depth === 'mid'  ? -180 :
                              -340;
  const depthRotate =
    config.depth === 'back' ? 15 :
    config.depth === 'mid'  ? -35 :
                              -90;
  const depthScale =
    config.depth === 'back' ? 0.85 :
    config.depth === 'mid'  ? 1.05 :
                              1.25;

  const y        = useTransform(scrollY, [0, 1], [0, depthY]);
  const rotate   = useTransform(scrollY, [0, 1], [config.rotateInit, config.rotateInit + depthRotate]);
  const scale    = useTransform(scrollY, [0, 1], [1, depthScale]);
  // Front layer coins fade slightly as user scrolls past — reinforces depth
  const fadeOut  = useTransform(
    scrollY,
    [0, 0.6, 1],
    config.depth === 'front' ? [config.opacity, config.opacity * 0.6, 0] : [config.opacity, config.opacity, config.opacity * 0.3]
  );

  if (lowEnd) {
    // Static div — zero rAF cost, no blur, no scroll transform, no compositing layer
    return (
      <div
        className="absolute pointer-events-none"
        style={{
          top: config.top,
          left: config.left,
          width: config.size,
          height: config.size,
          opacity: config.opacity,
          transform: `rotate(${config.rotateInit}deg)`,
          filter:
            config.depth === 'front'
              ? 'drop-shadow(0 16px 28px rgba(255,184,0,0.35)) drop-shadow(0 6px 14px rgba(0,0,0,0.7))'
              : config.depth === 'mid'
              ? 'drop-shadow(0 20px 40px rgba(0,0,0,0.65))'
              : 'drop-shadow(0 30px 60px rgba(0,0,0,0.8))',
        }}
      >
        <Component />
      </div>
    );
  }

  return (
    <motion.div
      className="absolute pointer-events-none will-change-transform"
      style={{
        top: config.top,
        left: config.left,
        width: config.size,
        height: config.size,
        filter: config.blur > 0 ? `blur(${config.blur}px)` : undefined,
        y,
        rotate,
        scale,
        opacity: fadeOut,
      }}
    >
      {/* Nested wrapper handles the infinite idle float — keeps scroll transforms clean */}
      <motion.div
        className="w-full h-full"
        animate={{
          y: [0, -14, 0, 10, 0],
          rotate: [0, 6, 0, -5, 0],
        }}
        transition={{
          duration: config.floatDuration,
          delay: config.floatDelay,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          // Drop shadow anchored to depth — front coins get amber glow + hard shadow for pop
          filter:
            config.depth === 'front'
              ? 'drop-shadow(0 16px 28px rgba(255,184,0,0.35)) drop-shadow(0 6px 14px rgba(0,0,0,0.7))'
              : config.depth === 'mid'
              ? 'drop-shadow(0 20px 40px rgba(0,0,0,0.65)) drop-shadow(0 0 24px rgba(255,184,0,0.08))'
              : 'drop-shadow(0 30px 60px rgba(0,0,0,0.8))',
        }}
      >
        <Component />
      </motion.div>
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/*  FloatingCoins — scroll-linked container                           */
/* ------------------------------------------------------------------ */

export const FloatingCoins = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isLowEnd = useLowEndDevice();

  // Scroll progress relative to this container — normalized 0..1 for its entry/exit
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  // Benchmark still running — render nothing to avoid layout work before we know
  if (isLowEnd === null) return null;

  // Low-end: 4 coins only — one from each visual zone so the layout still reads well
  const coins = isLowEnd
    ? [COINS[0], COINS[3], COINS[6], COINS[8]] // gold-back, usdc-mid, gold-front, eth-front
    : COINS;

  return (
    <div
      ref={ref}
      aria-hidden
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ perspective: '1200px' }}
    >
      {coins.map((c, i) => (
        <Coin key={`${c.kind}-${i}`} config={c} scrollY={scrollYProgress} lowEnd={isLowEnd} />
      ))}
    </div>
  );
};

export default FloatingCoins;
