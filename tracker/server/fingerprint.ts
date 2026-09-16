/**
 * Error fingerprinting.
 *
 * `release` is part of the hash on purpose: "did this error start after deploy X?"
 * must be answerable. The build produces no source maps, so frames are minified,
 * but they are stable within a release. Symbolication is deliberately not built.
 */

import { createHash } from 'node:crypto';

const HEX_ADDRESS = /0x[0-9a-f]{4,}/g;
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g;
const ABSOLUTE_URL = /https?:\/\/[^\s)'"]+/g;
const FILE_URL = /file:\/\/\/[^\s)'"]+/g;
const SINGLE_QUOTED = /'(?:[^'\\]|\\.)*'/g;
const DOUBLE_QUOTED = /"(?:[^"\\]|\\.)*"/g;
const BACKTICKED = /`(?:[^`\\]|\\.)*`/g;
const LINE_COL = /:\d+:\d+/g;
const NUMBER = /\b\d+(?:\.\d+)?\b/g;
// Stop at a colon so a trailing `:line:col` survives path stripping.
const ABSOLUTE_PATH = /(?:[A-Za-z]:\\|\/)[^\s)'":]*/g;
const WHITESPACE = /\s+/g;

export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(HEX_ADDRESS, '<hex>')
    .replace(UUID, '<uuid>')
    .replace(FILE_URL, '<url>')
    .replace(ABSOLUTE_URL, '<url>')
    .replace(SINGLE_QUOTED, '<str>')
    .replace(DOUBLE_QUOTED, '<str>')
    .replace(BACKTICKED, '<str>')
    .replace(LINE_COL, ':<loc>')
    .replace(NUMBER, '<n>')
    .replace(WHITESPACE, ' ')
    .trim();
}

/** First `at ...` frame, with absolute paths and hosts stripped. */
export function extractTopFrame(stack: string | null | undefined): string {
  if (!stack) return '';
  for (const rawLine of stack.split('\n')) {
    if (!rawLine.includes('at ')) continue;

    let frame = rawLine.trim().replace(/^at\s+/, '');
    // `fn (/path/file.js:1:2)` -> keep the parenthesised location only.
    const parenthesised = /\(([^()]*)\)\s*$/.exec(frame);
    if (parenthesised?.[1]) frame = parenthesised[1];

    return frame
      .replace(FILE_URL, '<url>')
      .replace(ABSOLUTE_URL, '<url>')
      .replace(ABSOLUTE_PATH, '<path>')
      .trim();
  }
  return '';
}

export interface FingerprintInput {
  error_type: string;
  message: string;
  stack?: string | null;
  release?: string | null;
}

export function fingerprintError(input: FingerprintInput): string {
  const material = [
    input.error_type,
    normalizeText(input.message),
    normalizeText(extractTopFrame(input.stack)),
    input.release ?? '',
  ].join('|');

  return createHash('sha256').update(material).digest('hex').slice(0, 32);
}
