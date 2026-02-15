/**
 * Main Raffle Application with EVM smart contract integration
 */
export interface BackendRaffle {
  id: number
  title: string
  description: string
  prize_amount: string
  prize_asset_symbol: string
  prize_asset_decimals?: number
  ticket_price_usd?: string
  ticket_price_amount:string
  max_tickets: number
  tickets_sold?: number
  ends_at: string
  status: string
  image_url?: string
  prize_tx_hash?: string
}