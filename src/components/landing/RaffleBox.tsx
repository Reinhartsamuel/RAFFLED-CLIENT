import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export const RaffleBox = () => {
  const cubeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cubeRef.current) return;

    const tween = gsap.to(cubeRef.current, {
      rotateY: 360,
      rotateX: 15,
      duration: 20,
      repeat: -1,
      ease: 'none',
    });

    return () => {
      tween.kill();
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center grainy-overlay">
      {/* 3D Cube Container */}
      <div className="perspective-[1000px] w-56 h-56 md:w-72 md:h-72">
        <div
          ref={cubeRef}
          className="relative w-full h-full"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front face */}
          <div
            className="absolute inset-0 rounded-2xl bg-safety-lime flex items-center justify-center shadow-xl"
            style={{ transform: 'translateZ(112px)' }}
          >
            <span className="font-syne font-extrabold text-3xl md:text-4xl text-pure-black">
              RAFFLE
            </span>
          </div>

          {/* Back face */}
          <div
            className="absolute inset-0 rounded-2xl bg-cyan-accent flex items-center justify-center shadow-xl"
            style={{ transform: 'rotateY(180deg) translateZ(112px)' }}
          >
            <span className="font-syne font-extrabold text-3xl md:text-4xl text-pure-black">
              WIN
            </span>
          </div>

          {/* Right face */}
          <div
            className="absolute inset-0 rounded-2xl bg-bg-white flex items-center justify-center shadow-xl"
            style={{ transform: 'rotateY(90deg) translateZ(112px)' }}
          >
            <span className="font-syne font-extrabold text-3xl md:text-4xl text-pure-black">
              SOL
            </span>
          </div>

          {/* Left face */}
          <div
            className="absolute inset-0 rounded-2xl bg-bg-white flex items-center justify-center shadow-xl"
            style={{ transform: 'rotateY(-90deg) translateZ(112px)' }}
          >
            <span className="font-syne font-extrabold text-3xl md:text-4xl text-pure-black">
              BASE
            </span>
          </div>

          {/* Top face */}
          <div
            className="absolute inset-0 rounded-2xl bg-safety-lime flex items-center justify-center shadow-xl"
            style={{ transform: 'rotateX(90deg) translateZ(112px)' }}
          >
            <span className="font-syne font-extrabold text-2xl md:text-3xl text-pure-black">
              🎰
            </span>
          </div>

          {/* Bottom face */}
          <div
            className="absolute inset-0 rounded-2xl bg-cyan-accent flex items-center justify-center shadow-xl"
            style={{ transform: 'rotateX(-90deg) translateZ(112px)' }}
          >
            <span className="font-syne font-extrabold text-2xl md:text-3xl text-pure-black">
              💰
            </span>
          </div>
        </div>
      </div>

      {/* Decorative floating elements */}
      <div className="absolute top-8 left-8 w-6 h-6 rounded-full bg-cyan-accent/80 animate-pulse" />
      <div className="absolute bottom-12 right-12 w-10 h-10 rounded-full bg-safety-lime/80 animate-pulse" />
      <div className="absolute top-1/3 right-12 w-3 h-3 rounded-full bg-bg-white/60" />
      <div className="absolute bottom-1/3 left-16 w-4 h-4 rounded-full bg-bg-white/40" />
    </div>
  );
};

export default RaffleBox;
