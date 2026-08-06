import { useRaffleStats } from '../hooks/useRaffles'

/* ------------------------------------------------------------------ */
/*  B2B feature cards — what the HOST gets                             */
/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    title: 'Chainlink VRF Verified',
    body: 'Every winner is picked by Chainlink on-chain randomness. Participants can verify the VRF transaction on BaseScan. No trust required.',
  },
  {
    title: 'Whitelist & Free Entry',
    body: 'Upload a CSV of addresses or generate EIP-712 signatures. Run invite-only raffles, airdrops, and community rewards — all enforced on-chain.',
  },
  {
    title: 'Underfill Protection',
    body: 'Raffle did not fill? Prize goes back to host — but ticket payments still get raffled to a participant. Zero risk of lost inventory.',
  },
  {
    title: 'Embeddable Widget',
    body: 'Drop an iframe on your mint page, Discord, or blog. One line of HTML. Your raffle lives inside YOUR brand surface.',
  },
  {
    title: 'Instant Payouts',
    body: 'Winner picked → prize sent to wallet in the same transaction. No claiming ceremony. No 48-hour wait.',
  },
  {
    title: 'Self-Custody',
    body: 'Your funds never touch our servers. The smart contract holds everything on Base. Transparent, auditable, unruggable.',
  },
]

/* ------------------------------------------------------------------ */
/*  Pricing                                                            */
/* ------------------------------------------------------------------ */

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'first 3 raffles',
    accent: '#555555',
    highlight: false,
    features: [
      'Full wizard access',
      'Embed widget',
      'Chainlink VRF',
      'Up to 500 tickets',
      'No credit card needed',
    ],
    cta: { label: 'Start Free', href: '/app/create-raffle', disabled: false },
  },
  {
    name: 'Standard',
    price: '2%',
    period: 'of ticket sales',
    accent: '#FFB800',
    highlight: true,
    features: [
      'Unlimited raffles & tickets',
      'Whitelist support',
      'Analytics dashboard',
      'Priority support',
      'Everything in Free',
    ],
    cta: { label: 'Start Building', href: '/app/create-raffle', disabled: false },
  },
  {
    name: 'Custom',
    price: 'Flat fee',
    period: 'tailored pricing',
    accent: '#A855F7',
    highlight: false,
    features: [
      'Whitelist-only draws',
      'Custom fee structure',
      'Dedicated support',
      'Custom branding',
    ],
    cta: { label: 'Coming soon', href: '/app/create-raffle', disabled: true },
  },
]

/* ------------------------------------------------------------------ */
/*  How It Works (host flow)                                           */
/* ------------------------------------------------------------------ */

const HOST_STEPS = [
  {
    step: '01',
    title: 'Configure',
    body: 'Pick prize (ERC-20 or NFT), set ticket price in USDC, duration, max tickets. Upload whitelist if invite-only.',
  },
  {
    step: '02',
    title: 'Share',
    body: 'Get a shareable link or embed snippet. Drop on website, Discord, Twitter. Participants enter from their wallet.',
  },
  {
    step: '03',
    title: 'Verify',
    body: 'Chainlink VRF picks winner. Prize sent automatically. Everything on-chain, verifiable on BaseScan.',
  },
]

/* ------------------------------------------------------------------ */
/*  Getting Started (host onboarding)                                  */
/* ------------------------------------------------------------------ */

const START_STEPS = [
  {
    step: '1',
    title: 'Connect wallet',
    body: 'Any EVM wallet. Base Sepolia for testing, Base mainnet for production.',
  },
  {
    step: '2',
    title: 'Create first raffle',
    body: 'Use the wizard at /app/create-raffle. First 3 raffles are free.',
  },
  {
    step: '3',
    title: 'Share with community',
    body: 'Public link + embed snippet. One line of HTML on any page.',
  },
  {
    step: '4',
    title: 'Prove it was fair',
    body: 'Proof page at /raffle/{id}/proof — VRF verified, winner visible.',
  },
]

/* ------------------------------------------------------------------ */
/*  FAQ                                                                */
/* ------------------------------------------------------------------ */

const FAQS = [
  {
    q: 'How is the winner picked?',
    a: 'When a raffle expires, Chainlink VRF v2.5 generates on-chain randomness. A verifiably random ticket wins — the draw transaction is public on BaseScan.',
  },
  {
    q: 'What happens if my raffle underfills?',
    a: 'The prize returns to you, the host. Ticket payments are still raffled to a participant, so your community never walks away empty.',
  },
  {
    q: 'Can I embed a raffle on my own site?',
    a: 'Yes. Use the /embed/{raffleId} iframe widget — one line of HTML. See the embed docs at /docs/embed.',
  },
  {
    q: 'What does it cost?',
    a: 'The first 3 raffles are free. After that, 2% of ticket sales. Custom flat-fee plans for whitelist-only and high-volume launches.',
  },
]

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function LandingPageFrequency() {
  const stats = useRaffleStats()

  return (
    <div
      className="relative min-h-screen text-[#F5F5F5] overflow-x-hidden"
      style={{ backgroundColor: '#0a0a0a' }}
    >
      {/* ---- HERO ---- */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Grid backdrop */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,184,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,184,0,0.03) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#FFB800]/40 to-transparent" />

        {/* Nav */}
        <div className="absolute top-0 inset-x-0 z-20">
          <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
            <span className="font-mono font-bold text-sm tracking-[0.2em] text-[#F5F5F5]">
              RAFFLED<span className="text-[#FFB800]">.</span>
            </span>
            <div className="flex items-center gap-3">
              <a
                href="/docs/embed"
                className="hidden sm:inline-block font-mono text-[10px] uppercase tracking-wider text-[#999999] hover:text-[#F5F5F5] transition-colors px-4 py-2"
              >
                Embed Docs
              </a>
              <a
                href="/app"
                className="font-mono text-[10px] uppercase tracking-wider px-5 py-2.5 bg-[#FFB800] text-[#050505] font-bold rounded-lg hover:bg-[#FFCC33] transition-all"
              >
                Launch App →
              </a>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
          <p className="font-mono text-[10px] text-[#FFB800] uppercase tracking-[0.3em] mb-6">
            B2B RAFFLE INFRASTRUCTURE · CHAINLINK VRF
          </p>
          <h1 className="font-sans font-bold text-4xl md:text-6xl lg:text-7xl text-[#F5F5F5] leading-[1.1] mb-6">
            Launch a provably-fair<br />
            <span className="text-[#FFB800]">raffle in 2 minutes.</span>
          </h1>
          <p className="font-mono text-sm md:text-base text-[#666666] max-w-xl mx-auto mb-10">
            White-label raffle infrastructure for Base projects. Whitelist draws, token drops, NFT giveaways — all verified by Chainlink VRF. No bots. No Google Forms.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/app/create-raffle" className="px-8 py-4 bg-[#FFB800] text-[#050505] font-mono font-bold text-sm uppercase tracking-wider rounded-lg hover:bg-[#FFCC33] hover:shadow-[0_0_24px_rgba(255,184,0,0.3)] transition-all inline-block">
              Launch Your First Raffle →
            </a>
            <a href="/docs/embed" className="px-8 py-4 border border-[#2a2a2a] text-[#999999] font-mono text-sm uppercase tracking-wider rounded-lg hover:border-[#555555] hover:text-[#F5F5F5] transition-all inline-block">
              View Embed Docs
            </a>
          </div>
        </div>
      </section>

      {/* ---- STATS BAR ---- */}
      <section className="py-16 border-t border-[#1f1f1f]">
        <div className="max-w-5xl mx-auto px-4">
          <p className="font-mono text-[10px] text-[#555555] uppercase tracking-[0.3em] text-center mb-10">
            Trusted by projects on Base
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1f1f1f] rounded-xl overflow-hidden border border-[#1f1f1f]">
            {[
              { label: 'Raffles Hosted', value: stats.totalRaffles, color: '#FFB800' },
              { label: 'Active Now', value: stats.activeRaffles, color: '#22C55E' },
              { label: 'Completed', value: stats.endedRaffles, color: '#3B82F6' },
              { label: 'Your Raffles', value: stats.userCreatedRaffles, color: '#A855F7' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-[#0a0a0a] px-6 py-8 text-center">
                <p className="font-sans font-bold text-3xl" style={{ color }}>{value}</p>
                <p className="font-mono text-[10px] text-[#555555] uppercase tracking-wider mt-2">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- FEATURES ---- */}
      <section className="py-20 md:py-24 border-t border-[#1f1f1f] bg-[#080808]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-14 text-center">
            <p className="font-mono text-[10px] text-[#555555] uppercase tracking-[0.3em] mb-4">
              Built for hosts
            </p>
            <h2 className="font-sans font-bold text-3xl md:text-5xl text-[#F5F5F5]">
              Everything you need to<br className="hidden md:block" /> run fair giveaways
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group border border-[#1f1f1f] rounded-xl bg-[#0a0a0a] p-6 md:p-7 hover:border-[#FFB800]/40 transition-colors duration-200"
              >
                <h3 className="font-sans font-bold text-lg text-[#F5F5F5] mb-3 group-hover:text-[#FFB800] transition-colors">
                  {f.title}
                </h3>
                <p className="font-mono text-xs leading-relaxed text-[#777777]">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- PRICING ---- */}
      <section className="py-20 md:py-24 border-t border-[#1f1f1f]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-14 text-center">
            <p className="font-mono text-[10px] text-[#555555] uppercase tracking-[0.3em] mb-4">
              Pricing
            </p>
            <h2 className="font-sans font-bold text-3xl md:text-5xl text-[#F5F5F5]">
              Pay only when you launch
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-xl p-6 md:p-7 flex flex-col border ${
                  plan.highlight
                    ? 'border-[#FFB800] bg-[#0a0a0a] shadow-[0_0_30px_rgba(255,184,0,0.08)]'
                    : 'border-[#1f1f1f] bg-[#0a0a0a]'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-2.5 left-6 font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded bg-[#FFB800] text-[#050505] font-bold">
                    Most popular
                  </span>
                )}
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#555555]">{plan.name}</p>
                <p className="font-sans font-bold text-4xl mt-3" style={{ color: plan.accent }}>{plan.price}</p>
                <p className="font-mono text-[10px] text-[#555555] uppercase tracking-wider mt-1">{plan.period}</p>
                <ul className="mt-6 space-y-2.5 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 font-mono text-xs text-[#999999]">
                      <span style={{ color: plan.accent }}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href={plan.cta.href}
                  aria-disabled={plan.cta.disabled}
                  className={`mt-7 block text-center py-3 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all ${
                    plan.cta.disabled
                      ? 'bg-[#111111] text-[#333333] cursor-not-allowed'
                      : plan.highlight
                        ? 'bg-[#FFB800] text-[#050505] hover:bg-[#FFCC33] hover:shadow-[0_0_20px_rgba(255,184,0,0.3)]'
                        : 'border border-[#2a2a2a] text-[#999999] hover:border-[#555555] hover:text-[#F5F5F5]'
                  }`}
                >
                  {plan.cta.label}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- HOW IT WORKS ---- */}
      <section className="py-20 md:py-24 border-t border-[#1f1f1f] bg-[#080808]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-14 text-center">
            <p className="font-mono text-[10px] text-[#555555] uppercase tracking-[0.3em] mb-4">
              How It Works
            </p>
            <h2 className="font-sans font-bold text-3xl md:text-5xl text-[#F5F5F5]">
              From launch to winner in 3 steps
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {HOST_STEPS.map((step) => (
              <div key={step.step} className="border border-[#1f1f1f] rounded-xl bg-[#0a0a0a] p-6 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#FFB800]/10 border border-[#FFB800]/30 flex items-center justify-center font-mono text-sm font-bold text-[#FFB800] mb-5">
                  {step.step}
                </div>
                <h3 className="font-sans font-bold text-xl text-[#F5F5F5] mb-3">{step.title}</h3>
                <p className="font-mono text-xs leading-relaxed text-[#777777]">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- GETTING STARTED ---- */}
      <section className="py-20 md:py-24 border-t border-[#1f1f1f]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-14 text-center">
            <p className="font-mono text-[10px] text-[#555555] uppercase tracking-[0.3em] mb-4">
              Getting Started
            </p>
            <h2 className="font-sans font-bold text-3xl md:text-5xl text-[#F5F5F5]">
              Live in under 10 minutes
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {START_STEPS.map((s) => (
              <div key={s.step} className="border border-[#1f1f1f] rounded-xl bg-[#0a0a0a] p-6 flex gap-4">
                <span className="font-mono text-2xl font-bold text-[#FFB800] flex-shrink-0">{s.step}</span>
                <div>
                  <h3 className="font-sans font-bold text-base text-[#F5F5F5] mb-2">{s.title}</h3>
                  <p className="font-mono text-xs leading-relaxed text-[#777777]">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <a href="/app/create-raffle" className="inline-block px-8 py-4 bg-[#FFB800] text-[#050505] font-mono font-bold text-sm uppercase tracking-wider rounded-lg hover:bg-[#FFCC33] hover:shadow-[0_0_24px_rgba(255,184,0,0.3)] transition-all">
              Launch Free Trial →
            </a>
          </div>
        </div>
      </section>

      {/* ---- FAQ ---- */}
      <section className="py-20 md:py-24 border-t border-[#1f1f1f] bg-[#080808]">
        <div className="max-w-3xl mx-auto px-4">
          <div className="mb-12 text-center">
            <p className="font-mono text-[10px] text-[#555555] uppercase tracking-[0.3em] mb-4">
              FAQ
            </p>
            <h2 className="font-sans font-bold text-3xl md:text-4xl text-[#F5F5F5]">
              Questions, answered
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="border border-[#1f1f1f] rounded-xl bg-[#0a0a0a] overflow-hidden group">
                <summary className="px-5 py-4 font-mono text-xs font-bold uppercase tracking-wider text-[#F5F5F5] cursor-pointer hover:text-[#FFB800] transition-colors list-none flex items-center justify-between">
                  {f.q}
                  <span className="text-[#555555] group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="px-5 pb-5 font-mono text-xs leading-relaxed text-[#777777]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---- FOOTER ---- */}
      <footer className="border-t border-[#1f1f1f] bg-[#050505]">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-10">
            <div>
              <p className="font-sans font-bold text-3xl text-[#F5F5F5]">
                RAFFLED<span className="text-[#FFB800]">.</span>
              </p>
              <p className="font-mono text-[10px] text-[#555555] mt-2 uppercase tracking-[0.12em]">
                B2B raffle infrastructure on Base · Chainlink VRF
              </p>
            </div>
            <a
              href="/app/create-raffle"
              className="inline-block px-8 py-3.5 bg-[#FFB800] text-[#050505] font-mono font-bold text-sm uppercase tracking-wider rounded-lg hover:bg-[#FFCC33] transition-all"
            >
              Launch Free Trial →
            </a>
          </div>
          <div className="pt-8 border-t border-[#1f1f1f] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-mono text-xs text-[#555555]">
              © 2026 Raffled · <a href="https://raffled.tuttilabs.xyz" className="hover:text-[#FFB800] transition-colors">raffled.tuttilabs.xyz</a>
            </p>
            <div className="flex items-center gap-4 font-mono text-xs">
              <a href="/docs/embed" className="text-[#555555] hover:text-[#FFB800] transition-colors">Embed Docs</a>
              <span className="text-[#2a2a2a]">·</span>
              <a href="/raffle/1/proof" className="text-[#555555] hover:text-[#FFB800] transition-colors">View Proof Demo</a>
              <span className="text-[#2a2a2a]">·</span>
              <a href="https://github.com/Reinhartsamuel/RAFFLED-CONTRACTS" target="_blank" rel="noopener noreferrer" className="text-[#555555] hover:text-[#FFB800] transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
