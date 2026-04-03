/**
 * Backend raffle data shape (maps to RaffleManager3 on-chain data).
 * status: 'open' | 'completed' (RaffleManager3 has no CANCELLED state)
 * prize_type: 'erc20' | 'erc721' — set by the indexer from the PrizeType enum in RaffleCreated event.
 * underfilled: true when raffle expired before reaching maxCap —
 *   prize was returned to host, winner receives the payment pool instead.
 */
export interface BackendRaffle {
  id: number
  contract_raffle_id?: number
  title: string
  description: string
  prize_type?: 'erc20' | 'erc721'
  prize_amount: string              // ERC-20: token amount; ERC-721: token ID (as string)
  prize_asset_symbol: string
  prize_asset_decimals?: number     // Only meaningful for ERC-20
  ticket_price_usd?: string
  ticket_price_amount: string
  max_tickets: number
  sold_tickets?: number
  ends_at: string
  status: 'open' | 'completed' | string
  underfilled?: boolean
  image_url?: string
  prize_tx_hash?: string
  payment_asset?: string            // USDC token address (paymentToken on the contract)
  payment_asset_symbol?: string
  payment_asset_decimals?: number
}
