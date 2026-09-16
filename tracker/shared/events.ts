/**
 * The event registry. This is the single source of truth for "what may be sent".
 *
 * An `event_name` that is not listed here is rejected outright, which is what
 * keeps event names bounded. Per-event property keys are also declared here:
 * unknown keys are stripped before persistence, missing required keys reject
 * the row.
 */

export interface EventSpec {
  required: readonly string[];
  optional: readonly string[];
}

export const TRANSACTION_FAILURE_CATEGORIES = [
  'user_rejected',
  'wallet_error',
  'rpc_error',
  'contract_revert',
  'insufficient_funds',
  'unknown',
] as const;

export type TransactionFailureCategory = (typeof TRANSACTION_FAILURE_CATEGORIES)[number];

export const EVENT_REGISTRY = {
  page_viewed: {
    required: [],
    optional: ['path', 'title', 'referrer'],
  },
  raffle_list_viewed: {
    required: [],
    optional: ['raffle_count', 'filter', 'sort'],
  },
  raffle_viewed: {
    required: ['raffle_id'],
    optional: ['chain_id', 'contract_address', 'asset_type'],
  },
  buy_ticket_clicked: {
    required: ['raffle_id'],
    optional: ['ticket_price', 'currency', 'quantity'],
  },
  checkout_started: {
    required: ['raffle_id'],
    optional: ['mode', 'quantity', 'ticket_price', 'currency'],
  },
  wallet_connect_started: {
    required: [],
    optional: ['connector', 'chain_id'],
  },
  wallet_connected: {
    required: [],
    optional: ['address_ref', 'chain_id', 'connector'],
  },
  wallet_connection_failed: {
    required: [],
    optional: ['category', 'chain_id', 'connector', 'error_message'],
  },
  transaction_confirmation_started: {
    required: ['transaction_hash'],
    optional: ['chain_id', 'contract_address', 'raffle_id', 'asset_type'],
  },
  transaction_submitted: {
    required: ['transaction_hash'],
    optional: ['chain_id', 'contract_address', 'raffle_id', 'asset_type'],
  },
  transaction_confirmed: {
    required: ['transaction_hash'],
    optional: ['chain_id', 'contract_address', 'raffle_id', 'asset_type'],
  },
  transaction_failed: {
    required: ['category'],
    optional: [
      'transaction_hash',
      'chain_id',
      'contract_address',
      'raffle_id',
      'asset_type',
      'error_name',
    ],
  },
  ticket_purchase_started: {
    required: ['raffle_id'],
    optional: ['mode', 'quantity'],
  },
  ticket_purchase_succeeded: {
    required: ['raffle_id'],
    optional: ['transaction_hash', 'quantity', 'mode'],
  },
  ticket_purchase_failed: {
    required: ['raffle_id'],
    optional: ['category', 'transaction_hash', 'mode'],
  },
  user_signed_in: {
    required: [],
    optional: ['address_ref', 'chain_id'],
  },
  user_signed_out: {
    required: [],
    optional: ['reason'],
  },
  api_request_failed: {
    required: ['endpoint'],
    optional: ['status', 'duration_ms', 'method', 'error_code'],
  },
} as const satisfies Record<string, EventSpec>;

export type EventName = keyof typeof EVENT_REGISTRY;

export const EVENT_NAMES = Object.keys(EVENT_REGISTRY) as EventName[];

/** Untyped view used for O(1) lookup by a runtime string. */
export const EVENT_REGISTRY_LOOKUP: Record<string, EventSpec> = EVENT_REGISTRY;

export function isEventName(value: unknown): value is EventName {
  return typeof value === 'string' && Object.hasOwn(EVENT_REGISTRY, value);
}

export function isTransactionFailureCategory(value: unknown): value is TransactionFailureCategory {
  return (
    typeof value === 'string' &&
    (TRANSACTION_FAILURE_CATEGORIES as readonly string[]).includes(value)
  );
}
