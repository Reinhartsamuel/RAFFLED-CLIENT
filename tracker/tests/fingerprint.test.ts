import { describe, expect, it } from 'vitest';
import { extractTopFrame, fingerprintError, normalizeText } from '../server/fingerprint.ts';

describe('normalizeText', () => {
  it('replaces volatile values with placeholders', () => {
    const a = normalizeText('Transfer of 0xAbCdEf123456 failed for user 0x11111111111111 at 12:30');
    const b = normalizeText('Transfer of 0x99999FFFFF00 failed for user 0x22222222222222 at 09:01');
    expect(a).toBe(b);
  });

  it('normalizes uuids, quoted strings, urls and line/col', () => {
    expect(normalizeText('id 550e8400-e29b-41d4-a716-446655440000')).toBe('id <uuid>');
    expect(normalizeText("cannot read 'foo'")).toBe('cannot read <str>');
    expect(normalizeText('at https://host/assets/index-abc.js:1:2')).toBe('at <url>');
  });
});

describe('extractTopFrame', () => {
  it('returns the first at-frame with absolute paths stripped', () => {
    const stack = [
      'Error: boom',
      '    at doThing (/Users/rein/Repos/Raffled-client/src/x.ts:12:5)',
      '    at other (/Users/rein/Repos/Raffled-client/src/y.ts:1:1)',
    ].join('\n');
    expect(extractTopFrame(stack)).toBe('<path>:12:5');
  });

  it('returns an empty string when there is no frame', () => {
    expect(extractTopFrame('Error: boom')).toBe('');
    expect(extractTopFrame(null)).toBe('');
  });
});

describe('fingerprintError', () => {
  it('is stable across variable data', () => {
    const a = fingerprintError({
      error_type: 'TypeError',
      message: 'failed to send 0x1111111111111111 for amount 5',
      stack: 'Error: x\n  at swap (/app/dist/index-aaa.js:1:1234)',
      release: 'rel-1',
    });
    const b = fingerprintError({
      error_type: 'TypeError',
      message: 'failed to send 0x9999999999999999 for amount 900',
      stack: 'Error: x\n  at swap (/app/dist/index-bbb.js:9:8765)',
      release: 'rel-1',
    });
    expect(a).toBe(b);
    expect(a).toHaveLength(32);
  });

  it('differs across releases', () => {
    const base = { error_type: 'TypeError', message: 'boom', stack: 'at x (a.js:1:1)' };
    expect(fingerprintError({ ...base, release: 'rel-1' })).not.toBe(
      fingerprintError({ ...base, release: 'rel-2' }),
    );
  });

  it('differs across error types', () => {
    const base = { message: 'boom', stack: 'at x (a.js:1:1)', release: 'rel-1' };
    expect(fingerprintError({ ...base, error_type: 'TypeError' })).not.toBe(
      fingerprintError({ ...base, error_type: 'RangeError' }),
    );
  });
});
