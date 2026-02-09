import React, { useRef, useCallback } from 'react';
import '../../styles/LandingPage2.css';

const GlassCard = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const lastUpdateRef = useRef<number>(0);
  const rectCacheRef = useRef<DOMRect | null>(null);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    // Throttle to ~60fps (16ms)
    if (now - lastUpdateRef.current < 16) return;
    lastUpdateRef.current = now;

    const card = cardRef.current;
    if (!card) return;

    // Cache rect and invalidate on scroll/resize would be better,
    // but for simplicity we'll just call it (now throttled)
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  }, []);

  const onMouseEnter = useCallback(() => {
    // Cache rect on mouse enter
    if (cardRef.current) {
      rectCacheRef.current = cardRef.current.getBoundingClientRect();
    }
  }, []);

  return (
    <div
      ref={cardRef}
      className={`glass-card ${className}`}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
    >
      {children}
    </div>
  );
};

export default GlassCard;
