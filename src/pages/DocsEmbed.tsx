import { useState } from 'react'

const EMBED_CODE = (raffleId: string) => `<iframe
  src="https://raffled.tuttilabs.xyz/embed/${raffleId}"
  width="400"
  height="600"
  frameborder="0"
  allow="clipboard-write"
></iframe>`

/**
 * Public docs page — how to embed a raffle on any site via iframe.
 */
export default function DocsEmbed() {
  const [raffleId, setRaffleId] = useState('1')
  const [copied, setCopied] = useState(false)

  const code = EMBED_CODE(raffleId.trim() || '1')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5] py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <span className="font-mono font-bold text-sm tracking-[0.2em]">
            RAFFLED<span className="text-[#FFB800]">.</span>
          </span>
          <a href="/" className="font-mono text-[10px] uppercase tracking-wider text-[#555555] hover:text-[#FFB800] transition-colors">
            ← Back home
          </a>
        </div>

        <p className="font-mono text-[10px] text-[#FFB800] uppercase tracking-[0.3em] mb-3">
          DOCS / EMBED
        </p>
        <h1 className="font-sans font-bold text-3xl md:text-5xl mb-4">
          Embed a raffle on your site
        </h1>
        <p className="font-mono text-sm text-[#666666] max-w-2xl leading-relaxed mb-10">
          One line of HTML. Your raffle lives inside your brand surface — mint page, blog, Discord
          (via iframe), anywhere. No sign-up needed for participants.
        </p>

        {/* Step 1 */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-7 h-7 rounded-full bg-[#FFB800]/10 border border-[#FFB800]/30 flex items-center justify-center font-mono text-xs font-bold text-[#FFB800]">1</span>
            <h2 className="font-sans font-bold text-xl">Find your raffle ID</h2>
          </div>
          <p className="font-mono text-xs text-[#777777] leading-relaxed pl-10">
            Create a raffle at <a href="/app/create-raffle" className="text-[#FFB800] hover:underline">/app/create-raffle</a>.
            Your raffle ID is the number in its URL and on the proof page: <span className="text-[#999999]">/raffle/&#123;id&#125;/proof</span>.
          </p>
        </section>

        {/* Step 2 */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-7 h-7 rounded-full bg-[#FFB800]/10 border border-[#FFB800]/30 flex items-center justify-center font-mono text-xs font-bold text-[#FFB800]">2</span>
            <h2 className="font-sans font-bold text-xl">Paste the embed snippet</h2>
          </div>
          <div className="pl-10 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <label className="font-mono text-[10px] text-[#555555] uppercase tracking-wider">Raffle ID:</label>
              <input
                type="text"
                value={raffleId}
                onChange={(e) => setRaffleId(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-28 bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2 font-mono text-xs text-[#F5F5F5] focus:border-[#FFB800] focus:outline-none transition-colors"
                placeholder="1"
              />
              <button
                onClick={copy}
                className={`font-mono text-[10px] uppercase tracking-wider px-4 py-2 rounded-lg transition-all ${
                  copied
                    ? 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
                    : 'bg-[#FFB800] text-[#050505] font-bold hover:bg-[#FFCC33]'
                }`}
              >
                {copied ? 'Copied ✓' : 'Copy Code'}
              </button>
            </div>
            <pre className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-5 overflow-x-auto">
              <code className="font-mono text-xs text-[#FFB800] leading-relaxed">{code}</code>
            </pre>
          </div>
        </section>

        {/* Step 3 */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-7 h-7 rounded-full bg-[#FFB800]/10 border border-[#FFB800]/30 flex items-center justify-center font-mono text-xs font-bold text-[#FFB800]">3</span>
            <h2 className="font-sans font-bold text-xl">Publish anywhere</h2>
          </div>
          <p className="font-mono text-xs text-[#777777] leading-relaxed pl-10">
            Drop the iframe on your website, mint page, blog post, or a Discord channel. The widget renders
            the raffle state, countdown, prize, and a Buy Tickets button that takes participants to the full page.
          </p>
        </section>

        {/* Live preview */}
        <section className="border border-[#1f1f1f] rounded-xl bg-[#0a0a0a] p-6 mb-10">
          <h2 className="font-sans font-bold text-lg mb-4">Live preview</h2>
          <div className="flex justify-center">
            <iframe
              src={`/embed/${raffleId.trim() || '1'}`}
              width="400"
              height="600"
              frameBorder="0"
              allow="clipboard-write"
              title="Raffle embed preview"
              className="border border-[#1f1f1f] rounded-lg bg-[#050505]"
            />
          </div>
        </section>

        {/* Customization */}
        <section className="mb-10">
          <h2 className="font-sans font-bold text-lg mb-4">Customization options</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#1f1f1f] rounded-xl overflow-hidden border border-[#1f1f1f]">
            {[
              ['Width', 'Set the iframe width attribute (e.g. 320–480px).'],
              ['Height', 'Set the iframe height attribute (e.g. 480–720px).'],
              ['Scaling', 'Wrap in a container with transform: scale() for responsive layouts.'],
              ['Theme', 'The widget follows the Raffled dark theme; full white-label theming ships with the Custom plan.'],
            ].map(([k, v]) => (
              <div key={k} className="bg-[#0a0a0a] px-5 py-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#FFB800] mb-1">{k}</p>
                <p className="font-mono text-xs text-[#999999] leading-relaxed">{v}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center border-t border-[#1f1f1f] pt-10">
          <a href="/app/create-raffle" className="inline-block px-8 py-4 bg-[#FFB800] text-[#050505] font-mono font-bold text-sm uppercase tracking-wider rounded-lg hover:bg-[#FFCC33] hover:shadow-[0_0_24px_rgba(255,184,0,0.3)] transition-all">
            Create a Raffle →
          </a>
        </div>
      </div>
    </div>
  )
}
