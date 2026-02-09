import { useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const useJitterEffect = () => {
  const elementRef = useRef<HTMLElement | null>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  const startJitter = useCallback(() => {
    if (!elementRef.current) return;

    tweenRef.current = gsap.to(elementRef.current, {
      x: () => gsap.utils.random(-2, 2),
      y: () => gsap.utils.random(-2, 2),
      duration: 0.05,
      repeat: -1,
      yoyo: true,
      ease: 'none',
    });
  }, []);

  const stopJitter = useCallback(() => {
    if (tweenRef.current) {
      tweenRef.current.kill();
    }
    if (elementRef.current) {
      gsap.to(elementRef.current, {
        x: 0,
        y: 0,
        duration: 0.1,
        ease: 'power2.out',
      });
    }
  }, []);

  return { elementRef, startJitter, stopJitter };
};

export const useStaggerReveal = (
  itemSelector: string,
  options: {
    y?: number;
    stagger?: number;
    duration?: number;
    start?: string;
  } = {}
) => {
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const items = containerRef.current.querySelectorAll(itemSelector);

    gsap.set(items, { y: options.y ?? 50, opacity: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: options.start ?? 'top 80%',
        toggleActions: 'play none none reverse',
      },
    });

    tl.to(items, {
      y: 0,
      opacity: 1,
      duration: options.duration ?? 0,
      stagger: options.stagger ?? 0.05,
      ease: 'power2.out',
    });

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [itemSelector, options.y, options.stagger, options.duration, options.start]);

  return containerRef;
};

export const useRotateAnimation = () => {
  const elementRef = useRef<HTMLElement | null>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    tweenRef.current = gsap.to(elementRef.current, {
      rotateY: 360,
      duration: 20,
      repeat: -1,
      ease: 'none',
    });

    return () => {
      tweenRef.current?.kill();
    };
  }, []);

  return elementRef;
};

export { gsap, ScrollTrigger };
