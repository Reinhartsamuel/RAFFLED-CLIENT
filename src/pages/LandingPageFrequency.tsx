import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../config';
import type { BackendRaffle } from '../interfaces/BackendRaffle';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ROT = [-3, -1.5, 0, 2, -2, 3, 1, -1] as const;

const TICKER_ITEMS = [
  'PRIZES PAID INSTANTLY',
  'CHAINLINK VRF VERIFIED',
  'NO LOSS ON UNDERFILLED',
  'BASE CHAIN · LOW GAS',
  'FREE ENTRIES AVAILABLE',
  '100% ON-CHAIN',
  'AUTO PAYOUTS',
  'ZERO CUSTODY',
];

const FEATURES = [
  {
    title: 'UNDERFILL PROTECTION',
    body: 'Raffle didn\'t fill? Prize goes back to host — but the entry pool STILL gets raffled to a participant. You never walk away empty.',
  },
  {
    title: 'CHAINLINK VRF',
    body: 'Provably fair randomness. Every winner is picked by Chainlink\'s verifiable on-chain dice — not some shady server.',
  },
  {
    title: 'BUILT ON BASE',
    body: 'Native USDC. Pennies in gas. Coinbase ecosystem. No ETH mainnet congestion, no Solana wallet gymnastics.',
  },
  {
    title: 'INSTANT PAYOUTS',
    body: 'Winner selected → prize sent to your wallet. No claiming ceremony. No 48-hour waiting room. It just shows up.',
  },
  {
    title: 'FREE ENTRIES',
    body: 'Promotions, airdrops, whitelists. Creators can issue EIP-712 signed free tickets. You enter without spending a cent.',
  },
  {
    title: 'NO CUSTODY',
    body: 'Your wallet, your tickets. We never hold your funds — the smart contract does. Transparent. Auditable. Unruggable.',
  },
];

type TabKey = 'all' | 'erc20' | 'erc721';

/* ------------------------------------------------------------------ */
/*  Halftone background                                                */
/* ------------------------------------------------------------------ */

const halftoneStyle = `
  @keyframes drift {
    0% { transform: translate(0, 0); }
    33% { transform: translate(2px, -1px); }
    66% { transform: translate(-1px, 2px); }
    100% { transform: translate(0, 0); }
  }
  .halftone {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    opacity: 0.06;
    animation: drift 48s ease-in-out infinite;
  }
  .halftone::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle, #F2EFE9 1px, transparent 1px);
    background-size: 18px 18px;
  }
`;

/* ------------------------------------------------------------------ */
/*  Ticker tape styles                                                 */
/* ------------------------------------------------------------------ */

const tickerStyles = `
  @keyframes ticker-slide {
    to { transform: translateX(-50%); }
  }
  .ticker__track {
    display: flex;
    gap: clamp(24px, 4vw, 48px);
    animation: ticker-slide 28s linear infinite;
    white-space: nowrap;
    width: max-content;
  }
  .ticker__track--slow {
    animation-duration: 42s;
  }
  .ticker--diag {
    transform: rotate(-2.4deg) scale(1.06);
  }
  .ticker--diag-flip {
    transform: rotate(2.1deg) scale(1.06);
  }
  .ticker__item {
    font-family: 'Archivo Black', 'Geist', sans-serif;
    font-size: clamp(14px, 2vw, 18px);
    letter-spacing: 0.08em;
    color: #C7FE37;
    text-transform: uppercase;
    display: inline-flex;
    align-items: center;
    gap: clamp(24px, 4vw, 48px);
  }
  .ticker__item::after {
    content: '⏺';
    font-size: 0.5em;
  }
  .ticker:hover .ticker__track,
  .ticker:hover .ticker__track--slow {
    animation-play-state: paused;
  }
  @media (prefers-reduced-motion: reduce) {
    .ticker__track, .ticker__track--slow {
      animation: none;
    }
  }
`;

/* ------------------------------------------------------------------ */
/*  Sticker peel                                                       */
/* ------------------------------------------------------------------ */

const stickerStyles = `
  .sticker {
    position: absolute;
    transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    cursor: default;
    z-index: 3;
  }
  .sticker svg {
    filter: drop-shadow(0 8px 0 rgba(0,0,0,0.4));
    transition: filter 0.35s ease;
  }
  .sticker:hover {
    transform: rotate(0deg) scale(1.09) translateY(-6px) !important;
  }
  .sticker:hover svg {
    filter: drop-shadow(0 18px 12px rgba(0,0,0,0.6));
  }
  @media (prefers-reduced-motion: reduce) {
    .sticker { transition: none; }
    .sticker svg { transition: none; }
  }
`;

/* ------------------------------------------------------------------ */
/*  Torn ticket notches                                                */
/* ------------------------------------------------------------------ */

const ticketStyles = `
  .ticket-card {
    position: relative;
    background: #111;
    border: 1px solid rgba(255,45,109,0.25);
  }
  .ticket-card::before,
  .ticket-card::after {
    content: '';
    position: absolute;
    width: 18px;
    height: 18px;
    background: #0A0A0A;
    border-radius: 50%;
  }
  .ticket-card::before {
    top: -9px;
    left: clamp(40%, 50%, 60%);
    transform: translateX(-50%);
  }
  .ticket-card::after {
    bottom: -9px;
    left: clamp(40%, 50%, 60%);
    transform: translateX(-50%);
  }
  .ticket-card:hover {
    border-color: rgba(199,254,55,0.5);
  }
`;

/* ------------------------------------------------------------------ */
/*  SVG components                                                     */
/* ------------------------------------------------------------------ */

function Starburst({ color = '#FF2D6D', label, sub }: { color: string; label: string; sub?: string }) {
  return (
    <svg viewBox="0 0 160 160" width="160" height="160" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(80,80)">
        {Array.from({ length: 24 }, (_, i) => {
          const angle = (i * 15 * Math.PI) / 180;
          const r1 = 8;
          const r2 = i % 2 === 0 ? 72 : 64;
          return (
            <polygon
              key={i}
              points={`${Math.cos(angle) * r1},${Math.sin(angle) * r1} ${Math.cos(angle + 0.13) * r2},${Math.sin(angle + 0.13) * r2} ${Math.cos(angle - 0.13) * r2},${Math.sin(angle - 0.13) * r2}`}
              fill={color}
              opacity={0.9}
            />
          );
        })}
        <circle r="30" fill="#0A0A0A" />
        <text
          x="0" y="-2"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color}
          fontFamily="'Bricolage Grotesque', sans-serif"
          fontWeight={700}
          fontSize="22"
          letterSpacing="0.04em"
        >
          {label}
        </text>
        {sub && (
          <text
            x="0" y="18"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#F2EFE9"
            fontFamily="'Bricolage Grotesque', sans-serif"
            fontWeight={600}
            fontSize="10"
            letterSpacing="0.06em"
          >
            {sub}
          </text>
        )}
      </g>
    </svg>
  );
}

function PulseDot() {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C7FE37] opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#C7FE37]" />
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Magnetic Hero Wordmark                                             */
/* ------------------------------------------------------------------ */

function MagneticWordmark({ text, className = '' }: { text: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (prefersReduced || !isFinePointer) return;

    let raf = 0;
    let mx = 0;
    let my = 0;

    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mx = (e.clientX - rect.left) / rect.width - 0.5;
      my = (e.clientY - rect.top) / rect.height - 0.5;
    };

    const animate = () => {
      letterRefs.current.forEach((el, i) => {
        if (!el) return;
        const factor = 1 - i / text.length;
        const tx = mx * 38 * factor;
        const ty = my * 38 * factor;
        el.ownerDocument.defaultView?.requestAnimationFrame(() => {
          el.style.transform = `translate(${tx}px, ${ty}px)`;
        });
      });
      raf = requestAnimationFrame(animate);
    };

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        raf = requestAnimationFrame(animate);
      }
    };

    container.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    raf = requestAnimationFrame(animate);

    return () => {
      container.removeEventListener('mousemove', onMove);
      document.removeEventListener('visibilitychange', onVisibility);
      cancelAnimationFrame(raf);
    };
  }, [text]);

  return (
    <div
      ref={containerRef}
      className={`magnetic-wordmark ${className}`}
      style={{
        fontFamily: "'Archivo Black', 'Geist', sans-serif",
        fontSize: 'min(21.5vw, clamp(52px, 15.4vw, 232px))',
        whiteSpace: 'nowrap',
        lineHeight: 0.85,
        display: 'flex',
        cursor: 'default',
        userSelect: 'none',
      }}
    >
      {text.split('').map((char, i) => (
        <span
          key={i}
          ref={(el) => { letterRefs.current[i] = el; }}
          style={{
            display: 'inline-block',
            transition: 'transform 0.08s ease-out',
            color: i === text.length - 1 ? '#FF2D6D' : '#F2EFE9',
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Infinite Ticker                                                    */
/* ------------------------------------------------------------------ */

function Ticker({ items, slow = false, className = '' }: { items: string[]; slow?: boolean; className?: string }) {
  return (
    <div className={`ticker overflow-hidden py-3 ${className}`}>
      <div className={slow ? 'ticker__track ticker__track--slow' : 'ticker__track'}>
        {[...items, ...items].map((item, i) => (
          <span key={i} className="ticker__item">{item}</span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Raffle Board — Frequency-style showcase with detail reveal         */
/* ------------------------------------------------------------------ */

interface MockRaffle {
  id: string;
  title: string;
  prize: string;
  prizeLabel: string;
  ticketPrice: string;
  maxTickets: number;
  soldTickets: number;
  endsIn: string;
  type: 'erc20' | 'erc721';
  isFree: boolean;
  color: string;
  flavor: string;
}

const MOCK_RAFFLES: MockRaffle[] = [
  {
    id: 'the-whale-drop',
    title: 'THE WHALE DROP',
    prize: '5,000',
    prizeLabel: 'USDC',
    ticketPrice: '$10',
    maxTickets: 500,
    soldTickets: 341,
    endsIn: '4h 22m',
    type: 'erc20',
    isFree: false,
    color: '#C7FE37',
    flavor: 'One ticket. Five grand. Chainlink picks the lucky number. No headliner — every stub has the same odds.',
  },
  {
    id: 'blue-chip-lotto',
    title: 'BLUE CHIP LOTTERY',
    prize: 'BAYC',
    prizeLabel: '#8817',
    ticketPrice: '$50',
    maxTickets: 200,
    soldTickets: 178,
    endsIn: '18h 05m',
    type: 'erc721',
    isFree: false,
    color: '#FF2D6D',
    flavor: 'An actual Bored Ape. Sitting in the contract. 200 tickets. One winner. VRF doesn\'t care about your floor price thesis.',
  },
  {
    id: 'free-money-glitch',
    title: 'FREE MONEY GLITCH',
    prize: '1,000',
    prizeLabel: 'USDC',
    ticketPrice: 'FREE',
    maxTickets: 300,
    soldTickets: 219,
    endsIn: '1d 12h',
    type: 'erc20',
    isFree: true,
    color: '#0052FF',
    flavor: 'No wallet drain. No approval. Just an EIP-712 signature and you\'re in the running. Free entries. Real payouts.',
  },
  {
    id: 'degen-megadrop',
    title: 'DEGEN MEGADROP',
    prize: '250K',
    prizeLabel: 'PEPE + 1 ETH',
    ticketPrice: '$5',
    maxTickets: 1000,
    soldTickets: 427,
    endsIn: '3d 7h',
    type: 'erc20',
    isFree: false,
    color: '#C7FE37',
    flavor: 'Quarter million PEPE. A full ETH on top. Ticket is five bucks. The math is not in the house\'s favor.',
  },
];

const RAFFLE_BOARD_STYLES = `
  .raffle-poster {
    position: relative;
    background: #111;
    border: 1px solid rgba(255,255,255,0.06);
    transition: all 0.35s cubic-bezier(0.7, 0, 0.2, 1);
    cursor: pointer;
    overflow: hidden;
  }
  .raffle-poster:hover {
    transform: rotate(0deg) scale(1.02) !important;
    border-color: var(--poster-color, #C7FE37);
    box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px var(--poster-color, #C7FE37);
  }
  .raffle-poster::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 50% 0%, var(--poster-color) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.35s ease;
    pointer-events: none;
  }
  .raffle-poster:hover::after {
    opacity: 0.06;
  }
  @media (prefers-reduced-motion: reduce) {
    .raffle-poster { transition: none; }
  }
`;

function RaffleBoard() {
  const [active, setActive] = useState<string | null>(MOCK_RAFFLES[0].id);
  const detailRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback((id: string) => {
    const detail = detailRef.current;
    if (detail && active !== id) {
      detail.animate(
        [
          { opacity: 0, transform: 'translateY(16px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        { duration: 420, easing: 'cubic-bezier(0.7, 0, 0.2, 1)' },
      );
    }
    setActive((prev) => (prev === id ? null : id));
  }, [active]);

  const selected = MOCK_RAFFLES.find((r) => r.id === active);

  return (
    <section className="relative py-20 md:py-28 bg-[#0A0A0A]">
      <style>{RAFFLE_BOARD_STYLES}</style>

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="mb-12 md:mb-16">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#C7FE37] mb-3 inline-flex items-center gap-2">
            <PulseDot />
            Active Right Now
          </span>
          <h2 className="font-['Archivo_Black','Geist',sans-serif] text-[clamp(36px,7vw,80px)] leading-[0.9] text-[#F2EFE9]">
            The Board
          </h2>
          <p className="font-['Bricolage_Grotesque',sans-serif] text-[clamp(12px,1.4vw,14px)] text-[#555] mt-3 uppercase tracking-[0.08em]">
            Click a poster to peel back the mechanics — prize pool, ticket count, VRF, the works
          </p>
        </div>

        {/* Poster grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {MOCK_RAFFLES.map((r, i) => {
            const rotIdx = (i * 3 + r.title.length) % ROT.length;
            const rot = ROT[rotIdx];
            const pct = Math.round((r.soldTickets / r.maxTickets) * 100);
            const isHot = pct >= 70;

            return (
              <div
                key={r.id}
                className="raffle-poster group"
                style={{
                  transform: `rotate(${rot}deg)`,
                  ['--poster-color' as string]: r.color,
                }}
                onClick={() => handleToggle(r.id)}
              >
                {/* type badge */}
                <div className="absolute top-3 left-3 z-10">
                  <span
                    className="font-['Bricolage_Grotesque',sans-serif] text-[9px] uppercase tracking-[0.12em] px-2 py-0.5"
                    style={{
                      color: r.type === 'erc721' ? '#FF2D6D' : '#C7FE37',
                      border: `1px solid ${r.type === 'erc721' ? 'rgba(255,45,109,0.4)' : 'rgba(199,254,55,0.4)'}`,
                    }}
                  >
                    {r.type === 'erc721' ? 'NFT' : 'TOKEN'}
                  </span>
                </div>

                {/* hot badge */}
                {isHot && (
                  <div className="absolute top-3 right-3 z-10">
                    <span className="font-['Archivo_Black','Geist',sans-serif] text-[9px] uppercase tracking-[0.1em] text-[#FF2D6D] animate-pulse">
                      HOT
                    </span>
                  </div>
                )}

                <div className="p-5 md:p-6 flex flex-col h-full">
                  {/* prize */}
                  <div className="mt-8 mb-4">
                    <div className="font-['Bricolage_Grotesque',sans-serif] text-[10px] uppercase tracking-[0.15em] text-[#555] mb-1">
                      Prize Pool
                    </div>
                    <div
                      className="font-['Archivo_Black','Geist',sans-serif] text-[clamp(26px,3.5vw,42px)] leading-[0.9]"
                      style={{ color: r.color }}
                    >
                      {r.prize}
                    </div>
                    <div className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-[clamp(12px,1.4vw,14px)] text-[#F2EFE9] uppercase tracking-[0.06em]">
                      {r.prizeLabel}
                    </div>
                  </div>

                  {/* progress */}
                  <div className="mt-auto space-y-2">
                    <div className="flex justify-between font-['Bricolage_Grotesque',sans-serif] text-[10px] uppercase tracking-[0.08em]">
                      <span style={{ color: r.color }}>{pct}% SOLD</span>
                      <span className="text-[#555]">{r.soldTickets}/{r.maxTickets}</span>
                    </div>
                    <div className="h-1.5 bg-[#222] overflow-hidden">
                      <div
                        className="h-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: isHot
                            ? `linear-gradient(90deg, ${r.color}, #FF2D6D)`
                            : r.color,
                        }}
                      />
                    </div>
                    <div className="flex justify-between font-['Bricolage_Grotesque',sans-serif] text-[10px] uppercase tracking-[0.06em]">
                      <span className="text-[#555]">Ticket: {r.ticketPrice}</span>
                      <span className="text-[#F2EFE9]">{r.endsIn}</span>
                    </div>
                  </div>

                  {/* Buy button */}
                  <button
                    className="mt-5 w-full font-['Archivo_Black','Geist',sans-serif] text-[clamp(11px,1.6vw,13px)] uppercase tracking-[0.08em] py-2.5 text-[#0A0A0A] hover:text-[#F2EFE9] transition-colors duration-200"
                    style={{ backgroundColor: r.color }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FF2D6D'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = r.color; }}
                    onClick={(e) => { e.stopPropagation(); }}
                  >
                    {r.isFree ? 'Claim Free Entry' : 'Buy Tickets'}
                  </button>

                  {/* active indicator */}
                  {active === r.id && (
                    <div
                      className="absolute top-0 left-0 w-1 h-full"
                      style={{ background: r.color }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail reveal */}
        <div ref={detailRef} className="mt-10">
          {selected && (
            <div className="ticket-card max-w-3xl mx-auto p-6 md:p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                {/* Left: Prize breakdown */}
                <div>
                  <div className="font-['Bricolage_Grotesque',sans-serif] text-[10px] uppercase tracking-[0.2em] text-[#FF2D6D] mb-3">
                    Prize Breakdown
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span
                      className="font-['Archivo_Black','Geist',sans-serif] text-[clamp(48px,8vw,80px)] leading-[0.9]"
                      style={{ color: selected.color }}
                    >
                      {selected.prize}
                    </span>
                    <span className="font-['Archivo_Black','Geist',sans-serif] text-[clamp(16px,2.5vw,28px)] text-[#F2EFE9] uppercase">
                      {selected.prizeLabel}
                    </span>
                  </div>

                  <div className="space-y-1 mt-4">
                    <div className="flex justify-between font-['Bricolage_Grotesque',sans-serif] text-[clamp(11px,1.3vw,13px)] uppercase tracking-[0.06em]">
                      <span className="text-[#555]">Ticket price</span>
                      <span className="text-[#F2EFE9] font-semibold">{selected.ticketPrice}</span>
                    </div>
                    <div className="flex justify-between font-['Bricolage_Grotesque',sans-serif] text-[clamp(11px,1.3vw,13px)] uppercase tracking-[0.06em]">
                      <span className="text-[#555]">Entries</span>
                      <span className="text-[#F2EFE9] font-semibold">{selected.soldTickets} / {selected.maxTickets}</span>
                    </div>
                    <div className="flex justify-between font-['Bricolage_Grotesque',sans-serif] text-[clamp(11px,1.3vw,13px)] uppercase tracking-[0.06em]">
                      <span className="text-[#555]">Ends in</span>
                      <span className="text-[#FF2D6D] font-semibold">{selected.endsIn}</span>
                    </div>
                    <div className="flex justify-between font-['Bricolage_Grotesque',sans-serif] text-[clamp(11px,1.3vw,13px)] uppercase tracking-[0.06em]">
                      <span className="text-[#555]">Type</span>
                      <span className="text-[#C7FE37] font-semibold">{selected.type === 'erc721' ? 'NFT Raffle' : selected.isFree ? 'Free Entry' : 'USDC Raffle'}</span>
                    </div>
                  </div>

                  {/* flavor text */}
                  <p className="font-['Bricolage_Grotesque',sans-serif] text-[clamp(13px,1.6vw,15px)] leading-relaxed text-[#999] mt-5 italic border-l-2 pl-4" style={{ borderColor: selected.color }}>
                    {selected.flavor}
                  </p>
                </div>

                {/* Right: Mechanics explainer */}
                <div className="space-y-6">
                  <div>
                    <div className="font-['Bricolage_Grotesque',sans-serif] text-[10px] uppercase tracking-[0.2em] text-[#C7FE37] mb-3">
                      How It Works
                    </div>
                    <ol className="space-y-4">
                      {[
                        { step: '01', text: 'Buy tickets with USDC. Each ticket = one entry in the pool.', accent: '#C7FE37' },
                        { step: '02', text: 'Timer hits zero. Chainlink VRF fires — a verifiably random ticket wins.', accent: '#0052FF' },
                        { step: '03', text: 'Prize transfers automatically to the winner\'s wallet. No claim button. No gas.', accent: '#FF2D6D' },
                      ].map((s) => (
                        <li key={s.step} className="flex gap-3">
                          <span
                            className="font-['Archivo_Black','Geist',sans-serif] text-[28px] leading-none flex-shrink-0"
                            style={{ color: s.accent }}
                          >
                            {s.step}
                          </span>
                          <span className="font-['Bricolage_Grotesque',sans-serif] text-[clamp(12px,1.4vw,14px)] leading-relaxed text-[#999]">
                            {s.text}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Underfill guarantee */}
                  <div className="border border-[#C7FE37]/30 p-4">
                    <div className="font-['Archivo_Black','Geist',sans-serif] text-[clamp(13px,1.6vw,15px)] text-[#C7FE37] uppercase tracking-[0.06em] mb-2">
                      Underfill Guarantee
                    </div>
                    <p className="font-['Bricolage_Grotesque',sans-serif] text-[clamp(11px,1.4vw,13px)] leading-relaxed text-[#777]">
                      If the raffle doesn&apos;t fill all tickets, the prize returns to the host — but the entry pool still gets raffled to a participant. You never walk away with zero.
                    </p>
                  </div>

                  {/* CTA */}
                  <button
                    className="w-full font-['Archivo_Black','Geist',sans-serif] text-[clamp(14px,2vw,18px)] uppercase tracking-[0.08em] py-3 text-[#0A0A0A] hover:text-[#F2EFE9] transition-colors duration-200"
                    style={{ backgroundColor: selected.color }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FF2D6D'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = selected.color; }}
                  >
                    {selected.isFree ? 'Claim Free Entry →' : 'Buy Tickets →'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Raffle Wall (type wall)                                            */
/* ------------------------------------------------------------------ */

interface RaffleAct {
  id: string;
  name: string;
  tier: 'xl' | 'lg' | 'md';
  type: 'erc20' | 'erc721';
  prize: string;
}

function buildActs(raffles: BackendRaffle[]): RaffleAct[] {
  if (raffles.length === 0) {
    const defaults = [
      ['RAFFLED GENESIS', 'xl', 'erc20', '250 USDC'] as const,
      ['DEGEN DROP', 'lg', 'erc20', '100 USDC'] as const,
      ['NFT VAULT #1', 'lg', 'erc721', 'Rare NFT'] as const,
      ['ALPHA PASS', 'md', 'erc20', '50 USDC'] as const,
      ['BASE BUILDER', 'md', 'erc20', '200 USDC'] as const,
      ['MOONSHOT', 'md', 'erc20', '500 USDC'] as const,
      ['PIXEL WARRIOR', 'md', 'erc721', 'NFT #042'] as const,
      ['LUCKY 7', 'md', 'erc20', '77 USDC'] as const,
      ['COIN FLIP', 'md', 'erc20', '150 USDC'] as const,
      ['GHOST ENTRY', 'md', 'erc20', '300 USDC'] as const,
      ['BASED APE', 'md', 'erc721', 'BAYC #8817'] as const,
      ['WHALE WATCH', 'md', 'erc20', '1000 USDC'] as const,
      ['PAPER HANDS', 'md', 'erc20', '25 USDC'] as const,
      ['DIAMOND PAW', 'md', 'erc20', '420 USDC'] as const,
      ['SER VIBES', 'md', 'erc20', '69 USDC'] as const,
      ['NO RUG ZONE', 'md', 'erc20', '180 USDC'] as const,
    ];
    return defaults.map(([name, tier, type, prize], i) => ({
      id: `default-${i}`, name, tier: tier as RaffleAct['tier'], type: type as 'erc20' | 'erc721', prize,
    }));
  }

  return raffles.slice(0, 24).map((r, i) => {
    const isNft = r.type === 'nft' || r.prize_type === 'erc721';
    const tiers: RaffleAct['tier'][] = ['xl', 'lg', 'lg', 'md', 'md', 'md'];
    const tier = tiers[Math.min(i, tiers.length - 1)];
    const symbol = r.prize_asset_symbol || 'TOKEN';
    const amount = r.prize_amount || '?';
    const prizeLabel = isNft
      ? `${symbol} #${amount}`
      : `${amount} ${symbol}`;

    return {
      id: `raffle-${r.id}`,
      name: (r.title || `RAFFLE #${r.id}`).toUpperCase(),
      tier,
      type: isNft ? 'erc721' : 'erc20',
      prize: prizeLabel,
    };
  });
}

const TIER_STYLES: Record<RaffleAct['tier'], { fontSize: string; color: string; weight: number }> = {
  xl: { fontSize: 'clamp(28px, 5vw, 72px)', color: '#C7FE37', weight: 900 },
  lg: { fontSize: 'clamp(20px, 3.5vw, 42px)', color: '#F2EFE9', weight: 700 },
  md: { fontSize: 'clamp(14px, 2vw, 22px)', color: '#0052FF', weight: 400 },
};

function RaffleWall() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [raffles, setRaffles] = useState<BackendRaffle[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [gridOn, setGridOn] = useState(false);

  const acts = buildActs(raffles);
  const filtered = activeTab === 'all' ? acts : acts.filter((a) => a.type === activeTab);

  useEffect(() => {
    let cancelled = false;
    fetch(`${BACKEND_URL}/raffles`, { headers: { Accept: 'application/json' } })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        const list: BackendRaffle[] = json.data || [];
        const live = list.filter((r) => r.status === 'open');
        setRaffles(live.length > 0 ? live : list);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const swapTab = useCallback((next: TabKey) => {
    const wall = containerRef.current;
    if (!wall || next === activeTab) return;

    const children = [...wall.children] as HTMLElement[];
    const prev = new Map<string, DOMRect>();
    children.forEach((el) => {
      const name = el.getAttribute('data-name');
      if (name) prev.set(name, el.getBoundingClientRect());
    });

    setActiveTab(next);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const newChildren = [...wall.children] as HTMLElement[];
        newChildren.forEach((el) => {
          const elName = el.getAttribute('data-name');
          if (!elName) return;
          const was = prev.get(elName);
          if (!was) return;
          const now = el.getBoundingClientRect();
          const dx = was.left - now.left;
          const dy = was.top - now.top;
          const idx = parseInt(el.getAttribute('data-idx') || '0', 10);
          const rotIdx = (idx * 3 + elName.length) % ROT.length;
          const rot = ROT[rotIdx];

          el.animate(
            [
              { transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`, offset: 0 },
              { transform: `rotate(${rot}deg)`, offset: 1 },
            ],
            { duration: 620, easing: 'cubic-bezier(0.7, 0, 0.2, 1)' },
          );
        });
      });
    });
  }, [activeTab]);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'g' || e.key === 'G') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        setGridOn((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <section className="relative py-20 md:py-28 bg-[#0A0A0A]">
      {/* 12-col grid overlay */}
      {gridOn && (
        <div
          className="absolute inset-0 z-40 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, rgba(199,254,55,0.08) 0px, rgba(199,254,55,0.08) 1px, transparent 1px, transparent calc(100% / 12))',
          }}
        >
          {Array.from({ length: 11 }, (_, i) => (
            <span
              key={i}
              className="absolute top-2 font-mono text-[10px] text-[#C7FE37]/30"
              style={{ left: `${((i + 1) * 100) / 12}%` }}
            >
              {i + 1}
            </span>
          ))}
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="mb-12 md:mb-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#555] mb-4 inline-flex items-center gap-2">
            <PulseDot />
            Live · Base Network
          </span>
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-[clamp(14px,2vw,16px)] uppercase tracking-[0.2em] text-[#FF2D6D]">
            The Vault / {new Date().getFullYear()} Open
          </h2>
          <h3 className="font-['Archivo_Black','Geist',sans-serif] text-[clamp(36px,8vw,96px)] leading-[0.9] text-[#F2EFE9] mt-2">
            Who's<br />winning
          </h3>
        </div>

        {/* Tab filters */}
        <div className="flex gap-3 md:gap-6 mb-10" role="tablist">
          {([
            { key: 'all' as TabKey, label: 'All raffles' },
            { key: 'erc20' as TabKey, label: 'Tokens' },
            { key: 'erc721' as TabKey, label: 'NFTs' },
          ]).map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => swapTab(tab.key)}
              className={`font-['Archivo_Black','Geist',sans-serif] text-[clamp(14px,2.2vw,22px)] uppercase tracking-[0.06em] border-b-[3px] pb-1 transition-colors ${
                activeTab === tab.key
                  ? 'text-[#C7FE37] border-[#C7FE37]'
                  : 'text-[#555] border-transparent hover:text-[#F2EFE9]'
              }`}
            >
              <span className="hidden md:inline">{tab.label.split(' ')[0]}</span>
              <span className="md:hidden">{tab.label.split(' ')[0]}</span>
              <span className="font-['Bricolage_Grotesque',sans-serif] text-[0.5em] ml-1 text-[#FF2D6D]">
                {tab.key === 'all' ? filtered.length : acts.filter((a) => a.type === tab.key).length}
              </span>
            </button>
          ))}
        </div>

        {/* The wall */}
        <div
          ref={containerRef}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6 md:gap-y-10 w-full"
        >
          {filtered.map((act, i) => {
            const t = TIER_STYLES[act.tier];
            const rotIdx = (i * 3 + act.name.length) % ROT.length;
            const rot = ROT[rotIdx];

            return (
              <div
                key={act.id}
                data-name={act.id}
                data-idx={i}
                data-type={act.type}
                className="group cursor-default py-1"
                style={{ transform: `rotate(${rot}deg)` }}
              >
                <p
                  className="leading-[0.9] transition-colors duration-200 group-hover:opacity-70"
                  style={{
                    fontFamily: "'Archivo Black', 'Geist', sans-serif",
                    fontSize: t.fontSize,
                    color: t.color,
                  }}
                >
                  {act.name}
                </p>
                <span
                  className="block mt-1 font-['Bricolage_Grotesque',sans-serif] text-[clamp(9px,1.2vw,11px)] uppercase tracking-[0.1em] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ color: act.type === 'erc721' ? '#FF2D6D' : '#555' }}
                >
                  {act.prize} {act.type === 'erc721' ? 'NFT' : ''}
                </span>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p className="font-['Bricolage_Grotesque',sans-serif] text-[#555] text-center py-20 text-sm uppercase tracking-[0.15em]">
            No raffles in this category right now
          </p>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  How It Works — FLIP tabs + torn tickets                            */
/* ------------------------------------------------------------------ */

const HOW_STEPS = {
  create: {
    title: 'Lock & Launch',
    body: 'Deposit your prize — tokens or NFTs — into the smart contract. Set ticket price in USDC, choose max entries, pick a duration. Hit deploy. Your raffle is live in under a minute. Zero code. One transaction.',
    accent: '#C7FE37',
  },
  enter: {
    title: 'Buy or Claim',
    body: 'Connect any EVM wallet. Browse live raffles. Buy tickets with USDC — or grab a free entry if you\'ve got a whitelist signature. More tickets = better odds. No KYC, no email, no bullshit.',
    accent: '#FF2D6D',
  },
  win: {
    title: 'VRF Picks Winner',
    body: 'When the timer hits zero, Chainlink VRF fires. A verifiably random ticket wins. The prize transfers directly to the winner\'s wallet. Even if the raffle didn\'t fill — the entry pool still pays out to someone.',
    accent: '#0052FF',
  },
} as const;

type HowTab = keyof typeof HOW_STEPS;

function HowItWorks() {
  const [tab, setTab] = useState<HowTab>('create');
  const contentRef = useRef<HTMLDivElement>(null);
  const prevTabRef = useRef<HowTab>('create');

  const swap = useCallback((next: HowTab) => {
    if (next === prevTabRef.current) return;
    const el = contentRef.current;
    if (!el) {
      prevTabRef.current = next;
      setTab(next);
      return;
    }

    el.animate(
      [
        { opacity: 1, transform: 'translateY(0)', offset: 0 },
        { opacity: 0, transform: 'translateY(8px)', offset: 0.35 },
        { opacity: 0, transform: 'translateY(-8px)', offset: 0.65 },
        { opacity: 1, transform: 'translateY(0)', offset: 1 },
      ],
      { duration: 380, easing: 'cubic-bezier(0.7, 0, 0.2, 1)' },
    );

    prevTabRef.current = next;
    setTab(next);
  }, []);

  const step = HOW_STEPS[tab];

  return (
    <section className="relative py-20 md:py-28 bg-[#0A0A0A]">
      <div className="relative max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#555]">
            How It Works
          </span>
          <h2 className="font-['Archivo_Black','Geist',sans-serif] text-[clamp(32px,6vw,72px)] leading-[0.92] text-[#F2EFE9] mt-3">
            From Deposit<br />to Diamond Hands
          </h2>
        </div>

        {/* Tab toggles */}
        <div className="flex justify-center gap-2 md:gap-4 mb-10">
          {(Object.keys(HOW_STEPS) as HowTab[]).map((k) => (
            <button
              key={k}
              onClick={() => swap(k)}
              className={`font-['Archivo_Black','Geist',sans-serif] text-[clamp(13px,2vw,18px)] uppercase tracking-[0.06em] px-5 py-2.5 border-[2px] transition-all duration-200 ${
                tab === k
                  ? 'text-[#0A0A0A] bg-[#C7FE37] border-[#C7FE37]'
                  : 'text-[#555] border-[#333] hover:border-[#F2EFE9] hover:text-[#F2EFE9]'
              }`}
            >
              <span className="hidden sm:inline">
                {k === 'create' ? '01' : k === 'enter' ? '02' : '03'}{' '}
              </span>
              {k.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Content card with torn-ticket notches */}
        <div
          ref={contentRef}
          className="ticket-card relative max-w-2xl mx-auto p-8 md:p-12"
          key={tab}
        >
          <div className="text-center">
            <div
              className="font-['Archivo_Black','Geist',sans-serif] text-[clamp(28px,5vw,52px)] leading-[0.95] mb-5"
              style={{ color: step.accent }}
            >
              {step.title}
            </div>
            <p className="font-['Bricolage_Grotesque',sans-serif] text-[clamp(14px,1.8vw,17px)] leading-relaxed text-[#999] max-w-lg mx-auto">
              {step.body}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Why Raffled grid                                                   */
/* ------------------------------------------------------------------ */

function WhyRaffled() {
  return (
    <section className="relative py-20 md:py-28 bg-[#0A0A0A]">
      <div className="relative max-w-6xl mx-auto px-6">
        <div className="mb-14">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#555]">
            Why Raffled
          </span>
          <h2 className="font-['Archivo_Black','Geist',sans-serif] text-[clamp(28px,5vw,64px)] leading-[0.92] text-[#F2EFE9] mt-3">
            Know Before<br />You Ape
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => {
            const rotIdx = (i * 3 + f.title.length) % ROT.length;
            return (
              <div
                key={f.title}
                className="group border border-[#222] p-6 md:p-7 hover:border-[#C7FE37]/40 transition-colors duration-200"
                style={{ transform: `rotate(${ROT[rotIdx] * 0.3}deg)` }}
              >
                <h3 className="font-['Archivo_Black','Geist',sans-serif] text-[clamp(15px,2vw,20px)] text-[#C7FE37] mb-3 tracking-[0.04em]">
                  {f.title}
                </h3>
                <p className="font-['Bricolage_Grotesque',sans-serif] text-[clamp(12px,1.4vw,14px)] leading-relaxed text-[#777]">
                  {f.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */

function SiteFooter({ onEnterApp }: { onEnterApp: () => void }) {
  return (
    <footer className="relative bg-[#0A0A0A] border-t border-[#1a1a1a] overflow-hidden pb-8">
      <Ticker items={['SEE YOU IN THE BLOCKS', 'BASE CHAIN', 'VERIFIED BY VRF', 'ZERO RUG']} slow className="mb-12" />

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div>
            <p
              className="font-['Archivo_Black','Geist',sans-serif] text-[clamp(32px,5vw,64px)] leading-[0.85] text-[#F2EFE9]"
              style={{ whiteSpace: 'nowrap' }}
            >
              RAFFLE<span style={{ color: '#FF2D6D' }}>D</span>
            </p>
            <p className="font-['Bricolage_Grotesque',sans-serif] text-[clamp(11px,1.4vw,13px)] text-[#555] mt-2 uppercase tracking-[0.12em]">
              Decentralized raffles on Base · Chainlink VRF · Press G for grid
            </p>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={onEnterApp}
              className="font-['Archivo_Black','Geist',sans-serif] text-[clamp(14px,2vw,18px)] uppercase tracking-[0.08em] text-[#0A0A0A] bg-[#C7FE37] px-8 py-3 hover:bg-[#FF2D6D] hover:text-[#F2EFE9] transition-colors duration-200"
            >
              Launch App →
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function LandingPageFrequency() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div
      className="relative min-h-screen text-[#F2EFE9] overflow-x-hidden"
      style={{ backgroundColor: '#0A0A0A' }}
    >
      {/* Global styles */}
      <style>{halftoneStyle}</style>
      <style>{tickerStyles}</style>
      <style>{stickerStyles}</style>
      <style>{ticketStyles}</style>

      {/* Halftone drift overlay */}
      <div className="halftone" aria-hidden="true" />

      {/* ---- HERO ---- */}
      <header className="relative z-10 pt-8 md:pt-12 pb-16 md:pb-24">
        {/* Nav */}
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between mb-16 md:mb-24">
          <span className="font-['Archivo_Black','Geist',sans-serif] text-[clamp(14px,2vw,18px)] uppercase tracking-[0.12em] text-[#C7FE37]">
            RAFFLED
          </span>
          <button
            onClick={() => navigate('/app')}
            className="font-['Archivo_Black','Geist',sans-serif] text-[clamp(14px,2vw,18px)] uppercase tracking-[0.08em] text-[#0A0A0A] bg-[#C7FE37] px-8 py-3 hover:bg-[#FF2D6D] hover:text-[#F2EFE9] transition-colors duration-200"
          >
            Launch App →
          </button>
        </div>

        {/* Hero content */}
        <div className="max-w-7xl mx-auto px-6 relative">
          {/* Top badge */}
          <div className="flex items-center gap-3 mb-6 md:mb-10">
            <PulseDot />
            <span className="font-['Bricolage_Grotesque',sans-serif] text-[clamp(10px,1.3vw,12px)] uppercase tracking-[0.14em] text-[#C7FE37]">
              Live · On sale now
            </span>
            <span className="font-['Bricolage_Grotesque',sans-serif] text-[clamp(10px,1.3vw,12px)] text-[#555]">
              Base Network · Chainlink VRF
            </span>
          </div>

          {/* Magnetic wordmark */}
          <MagneticWordmark text="RAFFLED" />

          {/* Sub-meta line */}
          <div
            className="mt-4 md:mt-6 flex flex-wrap gap-x-6 gap-y-2 font-['Bricolage_Grotesque',sans-serif] font-semibold text-[clamp(11px,1.5vw,14px)] uppercase tracking-[0.1em] text-[#FF2D6D]"
          >
            <span>1 Click Create</span>
            <span className="text-[#555]">/</span>
            <span>USDC Tickets</span>
            <span className="text-[#555]">/</span>
            <span>Chainlink VRF</span>
            <span className="text-[#555]">/</span>
            <span>No Loss Guarantee</span>
          </div>

          {/* Hero body */}
          <p className="font-['Bricolage_Grotesque',sans-serif] text-[clamp(14px,2vw,18px)] leading-relaxed text-[#F2EFE9]/90 max-w-xl mt-6 md:mt-10">
            Lock a prize. Set a price. Hit deploy — in one transaction
            your raffle is live and Chainlink VRF is sharpening its dice.
            No headliner hierarchy. Every ticket has a shot.
            Didn&apos;t fill? <span className="text-[#C7FE37] font-semibold">The pool still drops to a rando.</span>
            That&apos;s the guarantee. No custody. Just wins.
          </p>

          {/* Sticker callouts */}
          <div
            className="sticker hidden md:block"
            style={{ top: '5%', right: 'clamp(20px, 10vw, 140px)', transform: 'rotate(12deg)' }}
          >
            <Starburst color="#FF2D6D" label="NO" sub="LOSS" />
          </div>
          <div
            className="sticker hidden md:block"
            style={{ bottom: '10%', right: 'clamp(60px, 18vw, 220px)', transform: 'rotate(-10deg)' }}
          >
            <Starburst color="#C7FE37" label="100%" sub="ON-CHAIN" />
          </div>
        </div>

        {/* Announcement ticker */}
        <div className="ticker--diag relative z-20 mt-16 md:mt-24 bg-[#FF2D6D] py-3 -mx-4">
          <Ticker items={TICKER_ITEMS} />
        </div>
      </header>

      {/* ---- RAFFLE WALL ---- */}
      <RaffleWall />

      {/* ---- RAFFLE BOARD / SHOWCASE ---- */}
      <RaffleBoard />

      {/* ---- DIVIDER TICKER ---- */}
      <div className="ticker--diag-flip relative z-20 bg-[#0052FF] py-3 -mx-4">
        <Ticker items={TICKER_ITEMS.slice().reverse()} slow />
      </div>

      {/* ---- HOW IT WORKS ---- */}
      <HowItWorks />

      {/* ---- WHY RAFFLED ---- */}
      <WhyRaffled />

      {/* ---- FOOTER ---- */}
      <SiteFooter onEnterApp={() => navigate('/app')} />

      {/* Mobile floating CTA */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => navigate('/app')}
          className="font-['Archivo_Black','Geist',sans-serif] text-sm uppercase tracking-[0.08em] text-[#0A0A0A] bg-[#C7FE37] px-6 py-3 shadow-[0_0_24px_rgba(199,254,55,0.3)] active:scale-95 transition-transform"
        >
          Launch →
        </button>
      </div>
    </div>
  );
}
