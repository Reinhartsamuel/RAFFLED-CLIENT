/**
 * Shared vocabulary and row shapes for the Raffled tracker.
 *
 * `environment` and `network` are explicit columns on every table and are never
 * guessed from the hostname: the client sends them, the server validates them.
 */

export type AppEnvironment = 'development' | 'preview' | 'production';

export type AppNetwork =
  | 'robinhood_testnet'
  | 'robinhood_mainnet'
  | 'base_sepolia'
  | 'base_mainnet'
  | 'unknown';

export const APP_ENVIRONMENTS: readonly AppEnvironment[] = [
  'development',
  'preview',
  'production',
];

export const APP_NETWORKS: readonly AppNetwork[] = [
  'robinhood_testnet',
  'robinhood_mainnet',
  'base_sepolia',
  'base_mainnet',
  'unknown',
];

/**
 * Observed wallet chain id -> app network.
 * Note: chain 4663 (robinhood_mainnet) is not registered in the SPA yet
 * (`src/config/evm.config.tsx`), so no traffic can produce it today.
 */
export const CHAIN_ID_TO_NETWORK: Record<number, AppNetwork> = {
  46630: 'robinhood_testnet',
  4663: 'robinhood_mainnet',
  84532: 'base_sepolia',
  8453: 'base_mainnet',
};

export function isAppEnvironment(value: unknown): value is AppEnvironment {
  return typeof value === 'string' && APP_ENVIRONMENTS.includes(value as AppEnvironment);
}

export function isAppNetwork(value: unknown): value is AppNetwork {
  return typeof value === 'string' && APP_NETWORKS.includes(value as AppNetwork);
}

export function networkFromChainId(value: unknown): AppNetwork | null {
  const chainId =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
        ? Number(value)
        : Number.NaN;
  if (!Number.isInteger(chainId)) return null;
  return CHAIN_ID_TO_NETWORK[chainId] ?? null;
}

/** Fields common to every ingested record. */
export interface ClientContextRow {
  /** Browser clock, untrusted. Stored for ordering/offline context only. */
  client_ts: Date | null;
  anonymous_id: string | null;
  session_id: string | null;
  /** Salted hash supplied by the client, or null. Never used for authorization. */
  user_ref: string | null;
  environment: AppEnvironment;
  network: AppNetwork;
  release: string | null;
  commit_sha: string | null;
  url: string | null;
  route: string | null;
  request_id: string | null;
  /** Always derived from the request header, never from the payload. */
  user_agent: string | null;
}

export interface EventRow extends ClientContextRow {
  event_name: string;
  properties: Record<string, unknown>;
}

export interface ClientErrorRow extends ClientContextRow {
  error_type: string;
  message: string;
  stack: string | null;
  metadata: Record<string, unknown>;
  fingerprint: string;
}

export interface PerfRow extends ClientContextRow {
  metric_name: string;
  value: number;
  unit: string;
  metadata: Record<string, unknown>;
}

export interface AcceptedRejected {
  accepted: number;
  rejected: number;
}
