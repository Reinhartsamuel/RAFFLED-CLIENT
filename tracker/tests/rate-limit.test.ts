import { describe, expect, it } from 'vitest';
import { createWindowLimiter } from '../server/rate-limit.ts';

describe('createWindowLimiter', () => {
  it('allows up to max within the window and then blocks', () => {
    const now = 1_000;
    const limiter = createWindowLimiter({ windowMs: 1_000, max: 2, now: () => now });

    expect(limiter.check('a')).toBe(true);
    expect(limiter.check('a')).toBe(true);
    expect(limiter.check('a')).toBe(false);
    expect(limiter.check('b')).toBe(true);
  });

  it('resets once the window elapses', () => {
    let now = 1_000;
    const limiter = createWindowLimiter({ windowMs: 1_000, max: 1, now: () => now });

    expect(limiter.check('a')).toBe(true);
    expect(limiter.check('a')).toBe(false);

    now += 1_000;
    expect(limiter.check('a')).toBe(true);
  });

  it('treats max <= 0 as unlimited and supports reset', () => {
    const limiter = createWindowLimiter({ windowMs: 1_000, max: 0 });
    for (let i = 0; i < 100; i += 1) expect(limiter.check('a')).toBe(true);

    const bounded = createWindowLimiter({ windowMs: 1_000, max: 1, now: () => 0 });
    bounded.check('a');
    bounded.reset();
    expect(bounded.size()).toBe(0);
    expect(bounded.check('a')).toBe(true);
  });

  it('prunes expired keys once the key cap is reached', () => {
    let now = 0;
    const limiter = createWindowLimiter({ windowMs: 100, max: 5, now: () => now, maxKeys: 10 });
    for (let i = 0; i < 10; i += 1) limiter.check(`k${i}`);
    expect(limiter.size()).toBe(10);

    now += 1_000;
    limiter.check('new');
    expect(limiter.size()).toBe(1);
  });
});
