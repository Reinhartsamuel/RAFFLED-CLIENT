export type Raffle = {
  id: number
  type: 'nft' | 'crypto'
  title: string
  description: string
  image_url: string
  prize_tx_hash?: string | null
  prize_amount?: number | null
  prize_asset_symbol?: string | null
  prize_tx_status?: 'pending' | 'success' | 'failed' | string | null
  prize_tx_checked_at?: string | null
  prize_tx_error?: string | null
  ticket_price_usd: number
  max_tickets: number
  sold_tickets: number
  max_tickets_usd?: number
  sold_tickets_usd?: number
  owner_address: string
  status: string
  ends_at: string
}

export type RaffleDetail = {
  raffle: Raffle
  your_tickets: number
  can_purchase: boolean
  remaining: number
  leaderboard: LeaderboardEntry[]
  transactions: TicketTx[]
}

export type LeaderboardEntry = {
  user_address: string
  tickets: number
  total_spent: number
}

export type TicketTx = {
  id: number
  user_address: string
  quantity: number
  ticket_tx_hash: string
  created_at: string
}

export const topCoins = ['BTC', 'ETH', 'USDT', 'BNB', 'XRP', 'USDC', 'SOL']

export const usd = (value?: number | null) =>
  value === undefined || value === null ? '-'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value)

export const formatDateTime = (iso: string) => new Date(iso).toLocaleString()

export const formatInputDate = (value: string) => {
  const date = new Date(value)
  const pad = (n: number) => `${n}`.padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export const shorten = (text?: string | null, length = 12) => {
  if (!text) return '-'
  return text.length <= length ? text : `${text.slice(0, length / 2)}...${text.slice(-length / 2)}`
}

export const baseHeaders = (token?: string) => ({
  Accept: 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})
