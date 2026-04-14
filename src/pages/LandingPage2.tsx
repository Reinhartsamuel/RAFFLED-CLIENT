import { useEffect } from 'react';
import { useLenis } from '../hooks/useLenis';
import { Header2, HeroSection2, FeatureSection2, Footer2, GlassCard } from '../components/landing-2';
import '../styles/LandingPage2.css';
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react'

const LandingPage2 = () => {
  // Initialize Lenis smooth scroll
  useLenis();

  // Reset scroll position on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      {/* Shader Gradient - Full Height Background */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      >
        <ShaderGradientCanvas
          style={{
            width: '100%',
            height: '100%'
          }}
        >
          <ShaderGradient
            animate="on"
            // axesHelper="off"
            brightness={1.2}
            cAzimuthAngle={180}
            cDistance={4.89}
            cPolarAngle={100}
            cameraZoom={1}
            color1="#4c3500"
            color2="#000157"
            color3="#000000"
            // destination="onCanvas"
            // embedMode="off"
            envPreset="city"
            // format="gif"
            // fov={30}
            // frameRate={10}
            // gizmoHelper="hide"
            grain="off"
            lightType="3d"
            // pixelDensity={1}
            positionX={-0.1}
            positionY={0}
            positionZ={0}
            range="disabled"
            rangeEnd={40}
            rangeStart={0}
            reflection={0.1}
            rotationX={0}
            rotationY={10}
            rotationZ={50}
            shader="defaults"
            type="waterPlane"
            uAmplitude={1}
            uDensity={1.3}
            uFrequency={5.5}
            uSpeed={0.3}
            uStrength={4}
            uTime={0}
            wireframe={false}
          />
        </ShaderGradientCanvas>
      </div>

      {/* Content - Higher Z-Index */}
      <div className="min-h-screen" style={{ position: 'relative', zIndex: 1 }}>

        <Header2 />
        <main>
          <HeroSection2 />
          <FeatureSection2 />
          {/* How it works section */}
          <section id="how-it-works" className="py-20 md:py-28">
            <div className="w-full px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12 md:mb-16">
                <span className="font-jetbrains text-xs uppercase tracking-widest text-white/50 mb-4 block">
                  How It Works
                </span>
                <h2 className="font-syne font-extrabold text-3xl md:text-4xl text-white">
                  3 Simple Steps
                </h2>
              </div>

              <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-6">
                {/* Step 1 */}
                <GlassCard className="p-6 md:p-8">
                  <div className="w-14 h-14 bg-cyan rounded-xl flex items-center justify-center mb-5">
                    <span className="font-syne font-extrabold text-2xl text-pure-black">1</span>
                  </div>
                  <h3 className="font-syne font-bold text-xl mb-3 text-white">
                    Connect Wallet
                  </h3>
                  <p className="font-jetbrains text-sm text-white/60 leading-relaxed">
                    Link your Solana or EVM wallet. We support Phantom, Solflare, MetaMask, and more.
                  </p>
                </GlassCard>

                {/* Step 2 */}
                <GlassCard className="p-6 md:p-8">
                  <div className="w-14 h-14 bg-gold rounded-xl flex items-center justify-center mb-5">
                    <span className="font-syne font-extrabold text-2xl text-pure-black">2</span>
                  </div>
                  <h3 className="font-syne font-bold text-xl mb-3 text-white">
                    Buy Tickets
                  </h3>
                  <p className="font-jetbrains text-sm text-white/60 leading-relaxed">
                    Choose a raffle and purchase tickets. More tickets = higher chance to win.
                  </p>
                </GlassCard>

                {/* Step 3 */}
                <GlassCard className="p-6 md:p-8">
                  <div className="w-14 h-14 bg-cyan rounded-xl flex items-center justify-center mb-5">
                    <span className="font-syne font-extrabold text-2xl text-pure-black">3</span>
                  </div>
                  <h3 className="font-syne font-bold text-xl mb-3 text-white">
                    Win Prizes
                  </h3>
                  <p className="font-jetbrains text-sm text-white/60 leading-relaxed">
                    VRF selects the winner. Prizes are sent automatically to your wallet.
                  </p>
                </GlassCard>
              </div>
            </div>
          </section>
        </main>
        <Footer2 />
      </div>
    </>
  );
};

export default LandingPage2;