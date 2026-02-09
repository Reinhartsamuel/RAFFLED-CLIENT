import { RaffleBox } from './RaffleBox';
import { Button } from './Button';

interface HeroSectionProps {
  onEnterApp: () => void;
}

export const HeroSection = ({ onEnterApp }: HeroSectionProps) => {
  return (
    <section className="min-h-[calc(100vh-100px)] flex flex-col md:flex-row border-b-2 border-pure-black">
      {/* Left Side - Visual */}
      <div className="w-full md:w-1/2 h-[50vh] md:h-auto bg-pure-black relative overflow-hidden border-r-0 md:border-r-2 border-pure-black">
        <RaffleBox />
      </div>

      {/* Right Side - CTA */}
      <div className="w-full md:w-1/2 bg-bg-white flex flex-col items-center justify-center p-8 md:p-16">
        <div className="max-w-lg text-center md:text-left">
          {/* Badge */}
          <div className="inline-block bg-cyan-accent border-2 border-pure-black px-4 py-2 mb-8 shadow-brutal-sm">
            <span className="font-jetbrains text-xs uppercase tracking-widest font-black text-pure-black">
              Decentralized Raffle Platform
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="font-syne font-black text-6xl md:text-7xl lg:text-8xl text-pure-black leading-none mb-6 tracking-tight">
            RAFFLED
          </h1>

          {/* Subheading */}
          <p className="font-jetbrains text-base md:text-lg text-pure-black/60 mb-10 leading-relaxed font-light">
            Win big on <span className="bg-safety-lime px-2 py-0.5 border border-pure-black font-medium">Base</span> and{' '}
            <span className="bg-cyan-accent px-2 py-0.5 border border-pure-black font-medium">Solana</span>. Provably fair,
            fully on-chain.
          </p>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-4 mb-10 justify-center md:justify-start">
            <div className="bg-bg-white border-2 border-pure-black p-4 min-w-[120px] shadow-brutal-sm">
              <p className="font-syne font-black text-2xl text-pure-black">50 SOL</p>
              <p className="font-jetbrains text-[10px] uppercase text-pure-black/50 font-light tracking-wider">
                Current Jackpot
              </p>
            </div>
            <div className="bg-bg-white border-2 border-pure-black p-4 min-w-[120px] shadow-brutal-sm">
              <p className="font-syne font-black text-2xl text-pure-black">2.4K+</p>
              <p className="font-jetbrains text-[10px] uppercase text-pure-black/50 font-light tracking-wider">
                Tickets Sold
              </p>
            </div>
            <div className="bg-bg-white border-2 border-pure-black p-4 min-w-[120px] shadow-brutal-sm">
              <p className="font-syne font-black text-2xl text-pure-black">100%</p>
              <p className="font-jetbrains text-[10px] uppercase text-pure-black/50 font-light tracking-wider">
                On-chain
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Button variant="primary" size="lg" onClick={onEnterApp}>
              Buy Ticket
            </Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
