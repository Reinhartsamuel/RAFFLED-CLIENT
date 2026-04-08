import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../../config';
import { BackendRaffle } from '../../interfaces/BackendRaffle';
import { RaffleCard } from '../evm/RaffleCard';
import { Button } from './Button';
import { staggerContainer } from '../../utils/animations';

/**
 * Public raffle showcase — shows live raffles on the landing page.
 * Fetches without auth (backend's /raffles is public-readable for listing).
 * Clicks route to /app/raffle/:id, which handles wallet-gating downstream.
 */
export const RaffleShowcase = () => {
  const navigate = useNavigate();
  const [raffles, setRaffles] = useState<BackendRaffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${BACKEND_URL}/raffles`, {
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        const list: BackendRaffle[] = json.data || [];
        // Prioritize live (open) raffles; fall back to whatever we have
        const live = list.filter((r) => r.status === 'open');
        setRaffles((live.length > 0 ? live : list).slice(0, 4));
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="live-raffles" className="relative py-24 md:py-32 bg-[#050505] overflow-hidden">
      {/* Ambient top glow divider */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-[#FFB800]/40 to-transparent" />

      {/* Subtle grid backdrop — ties the section to the card aesthetic */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,184,0,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,184,0,0.6) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, #000 20%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, #000 20%, transparent 80%)',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Header — editorial asymmetry: left-aligned kicker, big headline, right-aligned CTA */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#555555] mb-4 inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
              Live Now · Base Network
            </span>
            <h2 className="font-sans font-bold text-4xl md:text-6xl text-[#F5F5F5] leading-[0.95] tracking-tight mt-3">
              Raffles in{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #FF6B00 0%, #FFB800 60%, #FFDD66 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                motion.
              </span>
            </h2>
            <p className="font-mono text-sm md:text-base text-[#555555] mt-5 leading-relaxed">
              Every raffle below is settled on-chain. Pick one, grab a ticket,
              let Chainlink VRF roll the dice.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex items-center gap-3"
          >
            <Button variant="outline" size="md" onClick={() => navigate('/app')}>
              View All →
            </Button>
          </motion.div>
        </div>

        {/* ----- Body ----- */}
        {loading && <RaffleSkeletonGrid />}

        {!loading && error && (
          <div className="border border-[#1f1f1f] rounded-xl bg-[#0a0a0a] p-10 text-center">
            <p className="font-mono text-sm text-[#555555]">
              Couldn't load live raffles.{' '}
              <button
                onClick={() => navigate('/app')}
                className="text-[#FFB800] hover:underline"
              >
                Head to the app →
              </button>
            </p>
          </div>
        )}

        {!loading && !error && raffles.length === 0 && (
          <div className="border border-dashed border-[#1f1f1f] rounded-xl bg-[#0a0a0a] p-14 text-center">
            <p className="font-sans text-2xl text-[#F5F5F5] mb-2">No raffles live right now.</p>
            <p className="font-mono text-sm text-[#555555] mb-6">
              Be the first to host one — it takes under a minute.
            </p>
            <Button variant="primary" size="md" onClick={() => navigate('/app')}>
              Create a Raffle
            </Button>
          </div>
        )}

        {!loading && !error && raffles.length > 0 && (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {raffles.slice(0, 4).map((raffle) => (
              <RaffleCard key={raffle.id} raffle={raffle} />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  Skeleton — matches RaffleCard rhythm so the layout doesn't snap   */
/* ------------------------------------------------------------------ */

const RaffleSkeletonGrid = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {[0, 1, 2, 3].map((i) => (
      <div
        key={i}
        className="relative rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] overflow-hidden"
      >
        <div className="aspect-square w-full bg-gradient-to-br from-[#0f0f0f] to-[#080808] relative">
          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-2 w-16 bg-[#1a1a1a] rounded" />
              <div className="h-6 w-24 bg-[#1a1a1a] rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-2 w-12 bg-[#1a1a1a] rounded ml-auto" />
              <div className="h-5 w-16 bg-[#1a1a1a] rounded ml-auto" />
            </div>
          </div>
          <div className="h-2 w-full bg-[#1a1a1a] rounded-full" />
          <div className="flex justify-between">
            <div className="h-2 w-14 bg-[#1a1a1a] rounded" />
            <div className="h-2 w-14 bg-[#1a1a1a] rounded" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default RaffleShowcase;
