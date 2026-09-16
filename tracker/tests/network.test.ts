import { describe, expect, it } from 'vitest';
import { CHAIN_ID_TO_NETWORK, networkFromChainId } from '../shared/types.ts';
import { FUNNEL_STAGES, computeFunnel } from '../shared/funnel.ts';

describe('chain id -> network mapping', () => {
  it('maps the four known chains', () => {
    expect(CHAIN_ID_TO_NETWORK[46630]).toBe('robinhood_testnet');
    expect(CHAIN_ID_TO_NETWORK[4663]).toBe('robinhood_mainnet');
    expect(CHAIN_ID_TO_NETWORK[84532]).toBe('base_sepolia');
    expect(CHAIN_ID_TO_NETWORK[8453]).toBe('base_mainnet');
  });

  it('accepts string chain ids and rejects unknown ones', () => {
    expect(networkFromChainId('4663')).toBe('robinhood_mainnet');
    expect(networkFromChainId(1)).toBeNull();
    expect(networkFromChainId('nope')).toBeNull();
    expect(networkFromChainId(undefined)).toBeNull();
  });
});

describe('computeFunnel', () => {
  const rows = computeFunnel({
    page_viewed: 100,
    raffle_viewed: 50,
    buy_ticket_clicked: 25,
    checkout_started: 20,
    transaction_submitted: 10,
    transaction_confirmed: 8,
  });

  it('keeps the declared stage order', () => {
    expect(rows.map((row) => row.stage)).toEqual([...FUNNEL_STAGES]);
  });

  it('reports absolute counts', () => {
    expect(rows.map((row) => row.count)).toEqual([100, 50, 25, 20, 10, 8]);
  });

  it('reports conversion against the first stage', () => {
    expect(rows.map((row) => row.conversionPct)).toEqual([100, 50, 25, 20, 10, 8]);
  });

  it('reports drop-off against the previous stage', () => {
    expect(rows[0]?.dropOffPct).toBeNull();
    expect(rows.slice(1).map((row) => row.dropOffPct)).toEqual([50, 50, 20, 50, 20]);
  });

  it('never exceeds 100% conversion when the first stage is missing', () => {
    const partial = computeFunnel({ raffle_viewed: 10 });
    expect(partial[0]?.count).toBe(0);
    expect(partial.every((row) => row.conversionPct <= 100)).toBe(true);
  });

  it('tolerates missing and negative counts', () => {
    const sparse = computeFunnel({ page_viewed: 10, raffle_viewed: -3 });
    expect(sparse[1]?.count).toBe(0);
  });
});
