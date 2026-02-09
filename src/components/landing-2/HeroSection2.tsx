import { Button } from './';

const HeroSection2 = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center text-center">
      <div className="relative z-10 p-4">
        <h1 className="font-syne font-extrabold text-5xl md:text-8xl uppercase">
          <span className="hero-title-gradient">The Decentralized</span> <br />
          <span className="hero-title-gradient-accent">Raffle Protocol</span>
        </h1>
        <p className="font-jetbrains text-base md:text-lg text-white/60 max-w-2xl mx-auto mt-6">
          Experience fair and transparent raffles for digital and real-world assets. Powered by Chainlink VRF on Base.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Button onClick={() => window.location.href = '/app'} className="font-jetbrains text-base uppercase px-8 py-4">
            Enter App
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection2;