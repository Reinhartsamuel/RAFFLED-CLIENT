import { motion } from 'framer-motion';
import { Button } from './Button';

interface FooterProps {
  onEnterApp: () => void;
}

export const Footer = ({ onEnterApp }: FooterProps) => {
  const links = {
    Platform: ['How it Works', 'Create Raffle', 'Browse Raffles', 'Documentation'],
    Resources: ['Blog', 'FAQ', 'Support', 'API'],
    Legal: ['Terms of Service', 'Privacy Policy', 'Cookie Policy'],
  };

  return (
    <footer className="bg-[#050505] border-t border-[#1f1f1f]">
      {/* CTA Section */}
      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a] p-10 md:p-16 overflow-hidden"
          >
            {/* Amber glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-[#FFB800]/40 to-transparent" />
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#FFB800]/5 rounded-full blur-3xl pointer-events-none" />

            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#333333] mb-5 block">
              Join the Revolution
            </span>
            <h2 className="font-sans font-bold text-4xl md:text-5xl mb-5 leading-tight">
              <span className="text-[#F5F5F5]">Ready to </span>
              <span
                style={{
                  background: 'linear-gradient(135deg, #FF6B00, #FFB800)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Win
              </span>
              <span className="text-[#F5F5F5]">?</span>
            </h2>
            <p className="font-mono text-sm text-[#555555] mb-8 max-w-md mx-auto leading-relaxed">
              Connect your wallet and join the next raffle. Provably fair. Fully transparent. 100% on-chain.
            </p>
            <Button variant="primary" size="lg" onClick={onEnterApp}>
              Enter App →
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer Content */}
      <div className="border-t border-[#1f1f1f]">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
            {/* Brand */}
            <div className="md:col-span-5">
              <h3 className="font-sans font-bold text-2xl text-[#F5F5F5] mb-3">
                RAFFLED<span className="text-[#FFB800]">.</span>
              </h3>
              <p className="font-mono text-sm text-[#555555] leading-relaxed max-w-xs mb-6">
                The decentralized raffle platform. Powered by Chainlink VRF for provably fair randomness.
              </p>
              {/* Social icons */}
              <div className="flex items-center gap-3">
                {/* X/Twitter */}
                <a href="#" className="w-9 h-9 rounded-lg border border-[#1f1f1f] bg-[#0a0a0a] flex items-center justify-center text-[#555555] hover:border-[#FFB800]/40 hover:text-[#FFB800] transition-all duration-200">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                {/* Discord */}
                <a href="#" className="w-9 h-9 rounded-lg border border-[#1f1f1f] bg-[#0a0a0a] flex items-center justify-center text-[#555555] hover:border-[#FFB800]/40 hover:text-[#FFB800] transition-all duration-200">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                </a>
                {/* GitHub */}
                <a href="#" className="w-9 h-9 rounded-lg border border-[#1f1f1f] bg-[#0a0a0a] flex items-center justify-center text-[#555555] hover:border-[#FFB800]/40 hover:text-[#FFB800] transition-all duration-200">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/></svg>
                </a>
              </div>
            </div>

            {/* Links */}
            <div className="md:col-span-7">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
                {Object.entries(links).map(([category, items]) => (
                  <div key={category}>
                    <h4 className="font-mono font-bold text-xs uppercase tracking-wider mb-4 text-[#F5F5F5]">
                      {category}
                    </h4>
                    <ul className="space-y-2.5">
                      {items.map(item => (
                        <li key={item}>
                          <a href="#" className="font-mono text-sm text-[#555555] hover:text-[#FFB800] transition-colors duration-200">
                            {item}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-6 border-t border-[#1f1f1f] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="font-mono text-xs text-[#333333]">
              © 2025 Raffled. All rights reserved.
            </p>
            <p className="font-mono text-xs text-[#333333]">
              Built on <span className="text-[#FFB800]">Base</span> · Powered by Chainlink VRF
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
