import { PONDER_GRAPHQL_URL } from '../config/evm.config'

/**
 * Minimal GraphQL client for the Ponder indexer.
 * Raw fetch — no client library needed. 0 RPC calls.
 */
export async function ponderQuery<T = unknown>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(PONDER_GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`Ponder HTTP ${res.status}`)
  const json = await res.json()
  if (json.errors?.length) throw new Error(json.errors[0].message)
  return json.data as T
}
