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
  type?: 'crypto' | 'nft'             // Backend field: 'crypto' for ERC20, 'nft' for ERC721
  prize_type?: 'erc20' | 'erc721'
  prize_amount: string              // ERC-20: token amount; ERC-721: token ID (as string)
  prize_amount_or_token_id?: string // New backend field combining both ERC20 amount and NFT token ID
  prize_asset: string               // Token contract address
  prize_asset_name?: string         // Token name (e.g., "Mock USDC")
  prize_asset_symbol: string
  prize_asset_decimals?: number     // Only meaningful for ERC-20
  ticket_price_usd?: string
  ticket_price_amount: string
  max_tickets: number
  sold_tickets?: number
  ends_at: string
  expire_at?: string                // Backend may use either ends_at or expire_at
  status: 'open' | 'completed' | string
  underfilled?: boolean
  image_url?: string
  prize_tx_hash?: string
  payment_asset?: string            // USDC token address (paymentToken on the contract)
  payment_asset_symbol?: string
  payment_asset_decimals?: number
}
