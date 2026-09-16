import { describe, expect, it } from 'vitest';
import {
  LIMITS,
  sanitizeJson,
  sanitizeUserAgent,
  validateError,
  validateEvent,
  validatePerf,
} from '../server/validation.ts';

const eventBase = {
  event_name: 'page_viewed',
  environment: 'production',
  network: 'base_mainnet',
};

const errorBase = {
  error_type: 'TypeError',
  message: 'boom',
  environment: 'production',
  network: 'robinhood_testnet',
  release: 'abc123',
};

describe('validateEvent', () => {
  it('accepts a known event with valid environment/network', () => {
    const row = validateEvent({ ...eventBase, properties: { path: '/', title: 'Home' } });
    expect(row).not.toBeNull();
    expect(row?.event_name).toBe('page_viewed');
    expect(row?.environment).toBe('production');
    expect(row?.network).toBe('base_mainnet');
    expect(row?.properties).toEqual({ path: '/', title: 'Home' });
  });

  it('rejects an unknown event_name', () => {
    expect(validateEvent({ ...eventBase, event_name: 'drop_database' })).toBeNull();
  });

  it('rejects an invalid environment', () => {
    expect(validateEvent({ ...eventBase, environment: 'staging' })).toBeNull();
  });

  it('rejects an invalid network when it cannot be derived from chain_id', () => {
    expect(validateEvent({ ...eventBase, network: 'polygon' })).toBeNull();
  });

  it('derives the network from an observed chain_id', () => {
    const row = validateEvent({
      ...eventBase,
      network: 'unknown',
      properties: { chain_id: 46630, path: '/raffle/1' },
    });
    expect(row?.network).toBe('robinhood_testnet');
    // chain_id is not part of page_viewed's registry, so it is stripped.
    expect(row?.properties).toEqual({ path: '/raffle/1' });
  });

  it('strips property keys that are not in the registry', () => {
    const row = validateEvent({ ...eventBase, properties: { path: '/x', evil: 'y' } });
    expect(row?.properties).toEqual({ path: '/x' });
  });

  it('rejects rows missing a required property', () => {
    expect(validateEvent({ ...eventBase, event_name: 'raffle_viewed', properties: {} })).toBeNull();
    const ok = validateEvent({
      ...eventBase,
      event_name: 'raffle_viewed',
      properties: { raffle_id: '42' },
    });
    expect(ok?.properties).toEqual({ raffle_id: '42' });
  });

  it('requires a valid transaction_failed category', () => {
    const bad = validateEvent({
      ...eventBase,
      event_name: 'transaction_failed',
      properties: { category: 'lol' },
    });
    expect(bad).toBeNull();

    const good = validateEvent({
      ...eventBase,
      event_name: 'transaction_failed',
      properties: { category: 'user_rejected' },
    });
    expect(good?.properties).toEqual({ category: 'user_rejected' });
  });

  it('never trusts a user_agent from the payload', () => {
    const row = validateEvent({ ...eventBase, user_agent: 'spoofed' }, 'real-agent/1');
    expect(row?.user_agent).toBe('real-agent/1');

    const noHeader = validateEvent({ ...eventBase, user_agent: 'spoofed' });
    expect(noHeader?.user_agent).toBeNull();
  });

  it('rejects non-object rows', () => {
    expect(validateEvent(null)).toBeNull();
    expect(validateEvent('page_viewed')).toBeNull();
    expect(validateEvent([eventBase])).toBeNull();
  });
});

describe('redaction', () => {
  it('drops denied keys recursively and keeps everything else', () => {
    const row = validateError({
      ...errorBase,
      metadata: {
        password: 'hunter2',
        token: 'abc',
        access_token: 'abc',
        refreshToken: 'abc',
        authorization: 'Bearer x',
        cookie: 'sid=1',
        private_key: '0xdeadbeef',
        mnemonic: 'one two three',
        seed: 'x',
        apiKey: 'k',
        api_key: 'k',
        signature: '0x1234',
        signedMessage: 'x',
        email: 'a@b.com',
        phone: '+1',
        ip: '1.2.3.4',
        safe: 'kept',
        nested: { cookie: 'drop', keep: 1 },
      },
    });
    expect(row).not.toBeNull();
    expect(row?.metadata).toEqual({ safe: 'kept', nested: { keep: 1 } });
    const serialized = JSON.stringify(row?.metadata);
    for (const leaked of ['hunter2', 'Bearer x', '0xdeadbeef', 'a@b.com', '1.2.3.4']) {
      expect(serialized).not.toContain(leaked);
    }
  });
});

describe('field limits', () => {
  it('truncates message and stack', () => {
    const row = validateError({
      ...errorBase,
      message: 'm'.repeat(5000),
      stack: 's'.repeat(10_000),
    });
    expect(row?.message).toHaveLength(LIMITS.message);
    expect(row?.stack).toHaveLength(LIMITS.stack);
  });

  it('caps url, route, ids and release', () => {
    const row = validateError({
      ...errorBase,
      url: 'u'.repeat(5000),
      route: 'r'.repeat(5000),
      session_id: 's'.repeat(5000),
      release: 'x'.repeat(5000),
    });
    expect(row?.url).toHaveLength(LIMITS.url);
    expect(row?.route).toHaveLength(LIMITS.route);
    expect(row?.session_id).toHaveLength(LIMITS.id);
    expect(row?.release).toHaveLength(LIMITS.release);
  });

  it('sanitizes the user agent header length', () => {
    expect(sanitizeUserAgent('  ab  ')).toBe('ab');
    expect(sanitizeUserAgent(undefined)).toBeNull();
    expect(sanitizeUserAgent('x'.repeat(1000))).toHaveLength(LIMITS.user_agent);
  });
});

describe('json bounds', () => {
  it('rejects arrays and non-objects', () => {
    expect(() => sanitizeJson([1, 2, 3])).toThrow();
    expect(() => sanitizeJson('nope')).toThrow();
  });

  it('allows depth up to 3 and rejects deeper', () => {
    expect(sanitizeJson({ a: { b: { c: 1 } } })).toEqual({ a: { b: { c: 1 } } });
    expect(() => sanitizeJson({ a: { b: { c: { d: 1 } } } })).toThrow();
  });

  it('rejects too many keys', () => {
    const tooMany: Record<string, number> = {};
    for (let i = 0; i < LIMITS.json.keys + 1; i += 1) tooMany[`k${i}`] = i;
    expect(() => sanitizeJson(tooMany)).toThrow();
  });

  it('rejects oversized serialized values', () => {
    const big: Record<string, string> = {};
    for (let i = 0; i < LIMITS.json.keys; i += 1) big[`k${i}`] = 'x'.repeat(LIMITS.json.string);
    expect(() => sanitizeJson(big)).toThrow();
  });

  it('rejects over-long strings', () => {
    expect(() => sanitizeJson({ a: 'x'.repeat(LIMITS.json.string + 1) })).toThrow();
  });
});

describe('validateError', () => {
  it('computes a fingerprint and keeps release', () => {
    const row = validateError(errorBase);
    expect(row?.fingerprint).toHaveLength(32);
    expect(row?.release).toBe('abc123');
  });

  it('rejects a row without a message', () => {
    expect(validateError({ ...errorBase, message: '   ' })).toBeNull();
  });
});

describe('validatePerf', () => {
  it('accepts a finite value and rejects non-numbers', () => {
    const row = validatePerf({
      environment: 'production',
      network: 'base_mainnet',
      metric_name: 'LCP',
      value: 1234.5,
      unit: 'ms',
    });
    expect(row?.value).toBe(1234.5);

    expect(
      validatePerf({
        environment: 'production',
        network: 'base_mainnet',
        metric_name: 'LCP',
        value: 'fast',
        unit: 'ms',
      }),
    ).toBeNull();
    expect(
      validatePerf({
        environment: 'production',
        network: 'base_mainnet',
        metric_name: 'LCP',
        value: Number.NaN,
        unit: 'ms',
      }),
    ).toBeNull();
  });
});
