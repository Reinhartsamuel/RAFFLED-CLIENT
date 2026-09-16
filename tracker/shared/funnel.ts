/**
 * Funnel definition and math.
 *
 * The funnel is session-scoped (COUNT(DISTINCT session_id) per stage) so a late
 * stage can never exceed 100%. Terminology is "drop-off", never "churn".
 */

export const FUNNEL_STAGES = [
  'page_viewed',
  'raffle_viewed',
  'buy_ticket_clicked',
  'checkout_started',
  'transaction_submitted',
  'transaction_confirmed',
] as const;

export type FunnelStage = (typeof FUNNEL_STAGES)[number];

export interface FunnelRow {
  stage: FunnelStage;
  count: number;
  /** Stage N / stage 1, as a percentage. 0 when stage 1 is empty. */
  conversionPct: number;
  /** 1 - (stage N / stage N-1), as a percentage. null for the first stage. */
  dropOffPct: number | null;
}

export type FunnelCounts = Partial<Record<FunnelStage, number>>;

export function computeFunnel(counts: FunnelCounts): FunnelRow[] {
  const first = normalizeCount(counts[FUNNEL_STAGES[0]]);
  const rows: FunnelRow[] = [];

  for (let i = 0; i < FUNNEL_STAGES.length; i += 1) {
    const stage = FUNNEL_STAGES[i] as FunnelStage;
    const count = normalizeCount(counts[stage]);
    const previous = i === 0 ? null : normalizeCount(counts[FUNNEL_STAGES[i - 1] as FunnelStage]);

    rows.push({
      stage,
      count,
      conversionPct: first > 0 ? round2((count / first) * 100) : 0,
      dropOffPct: previous === null ? null : previous > 0 ? round2((1 - count / previous) * 100) : 0,
    });
  }

  return rows;
}

function normalizeCount(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return 0;
  return Math.trunc(value);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
