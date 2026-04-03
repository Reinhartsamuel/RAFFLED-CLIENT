import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppKitAccount } from '@reown/appkit/react'
import { formatUnits } from 'viem'
import { API_BASE_URL, getAuthToken } from '../config/index'
import { Layout } from '../components/evm/Layout'
import { BuyTicketsModal } from '../components/evm/BuyTicketsModal'
import { useConfig } from 'wagmi'
import { readContract } from 'wagmi/actions'

interface RaffleDetailData {
  id: number
  title: string
  description: string
  prize_type?: 'erc20' | 'erc721'
  prize_amount: string  // ERC-20: token amount; ERC-721: token ID (as string)
  prize_asset_symbol: string
  prize_asset_decimals?: number
  ticket_price_usd: string
  ticket_price_amount: string
  max_tickets: number
  tickets_sold?: number
  ends_at: string
  status: string
  image_url?: string
  prize_tx_hash?: string
  contract_address?: string
  creator_address?: string
  created_at?: string
  payment_asset: string
  payment_asset_symbol?: string
  payment_asset_decimals?: number
}

export function RaffleDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isConnected, address } = useAppKitAccount()
  const config = useConfig()

  const [raffle, setRaffle] = useState<RaffleDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [balanceData, setBalanceData] = useState<bigint | null>(null)
  // const { data: balanceData } = useBalance({
  //     address: address,
  //   })
  useEffect(() => {
    const fetchRaffleDetail = async () => {
      try {
        setLoading(true)
        setError(null)

        const authToken = getAuthToken()
        const res = await fetch(`${API_BASE_URL}/raffles/${id}`, {
          method: 'GET',
          headers: {
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        })

        if (!res.ok) {
          throw new Error('Failed to fetch raffle details')
        }
        const data = await res.json()
        console.log('Fetched raffle detail:', data)
        setRaffle(data.raffle || null)

        // Fetch user USDC balance (RaffleManager2 uses a fixed paymentToken, always ERC20)
        if (address && data.raffle?.payment_asset && config) {
          try {
            const balance = await readContract(config, {
              address: data.raffle.payment_asset as `0x${string}`,
              abi: [
                {
                  name: 'balanceOf',
                  type: 'function',
                  stateMutability: 'view',
                  inputs: [{ name: 'account', type: 'address' }],
                  outputs: [{ name: 'balance', type: 'uint256' }],
                },
              ],
              functionName: 'balanceOf',
              args: [address],
            })
            setBalanceData(balance as bigint)
          } catch (balanceError) {
            console.error('Error fetching balance:', balanceError)
          }
        }
      } catch (err) {
        console.error('Error fetching raffle detail:', err)
        setError(err instanceof Error ? err.message : 'Failed to load raffle')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchRaffleDetail()
    }
  }, [id, address, config])

  if (loading) {
    return (
      <Layout>
        <div className="raffle-detail-page">
          <div className="raffle-detail-container">
            <div className="empty-state">
              <p className="font-jetbrains text-sm text-white/50">
                Loading raffle details...
              </p>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !raffle) {
    return (
      <Layout>
        <div className="raffle-detail-page">
          <div className="raffle-detail-container">
            <div className="empty-state">
              <p className="font-jetbrains text-sm text-white/50">
                {error || 'Raffle not found'}
              </p>
              <button className="btn-primary mt-4" onClick={() => navigate('/app')}>
                <span className="font-jetbrains text-sm font-bold">Back to Raffles</span>
              </button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  const ticketsSoldPercent = raffle.max_tickets > 0
    ? ((raffle.tickets_sold || 0) / raffle.max_tickets) * 100
    : 0

  // Determine if raffle is active based on end time and tickets sold
  const now = new Date()
  const endTime = new Date(raffle.ends_at)
  const isSoldOut = (raffle.tickets_sold || 0) >= raffle.max_tickets
  const isExpired = now > endTime
  const isActive = !isSoldOut && !isExpired

  // console.log('🎯 Raffle Status Debug:', {
  //   isSoldOut,
  //   isExpired,
  //   isActive,
  //   ticketsSold: raffle.tickets_sold,
  //   maxTickets: raffle.max_tickets,
  //   endsAt: raffle.ends_at,
  //   ticket_price: raffle.ticket_price_usd,
  //   paymentAssetSymbol: raffle.payment_asset_symbol
  // })

  const getRaffleStatusText = () => {
    if (isSoldOut) return 'Sold Out'
    if (isExpired) return 'Ended'
    return 'Active'
  }

  const getButtonText = () => {
    if (isSoldOut) return 'Sold Out'
    if (isExpired) return 'Raffle Ended'
    return 'Buy Tickets'
  }

  return (
    <Layout>
      <div className="raffle-detail-page">
        <div className="raffle-detail-container">
        {/* Header with Back Button */}
        <div className="detail-header">
          <button
            className="back-button font-jetbrains"
            onClick={() => navigate('/app')}
          >
            ← Back to Raffles
          </button>
          <span className={`raffle-status status-${isActive ? 'active' : 'ended'}`}>
            {getRaffleStatusText()}
          </span>
        </div>

        {/* Main Content Grid */}
        <div className="detail-content-grid">
          {/* Left Column - Image */}
          <div className="detail-image-section">
            {raffle.image_url ? (
              <img
                src={raffle.image_url}
                alt={raffle.title}
                className="detail-image"
              />
            ) : (
              <div className="detail-image-placeholder">
                <span className="font-jetbrains text-white/30">No Image</span>
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="detail-info-section">
            <h1 className="font-syne font-black text-4xl mb-4">{raffle.title}</h1>

            {raffle.description && (
              <p className="font-jetbrains text-sm text-white/60 mb-6">
                {raffle.description}
              </p>
            )}

            {/* Prize Info */}
            <div className="detail-card mb-6">
              <h3 className="font-jetbrains text-xs uppercase tracking-widest text-white/40 mb-3">
                {raffle.prize_type === 'erc721' ? 'NFT Prize' : 'Prize Pool'}
              </h3>
              <div className="prize-amount">
                {raffle.prize_type === 'erc721' ? (
                  <>
                    <span className="nft-badge font-jetbrains text-sm font-bold mr-2">NFT</span>
                    <span className="font-syne font-bold text-3xl">
                      {raffle.prize_asset_symbol || 'NFT'} #{raffle.prize_amount}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-syne font-bold text-3xl">
                      {formatUnits(BigInt(raffle.prize_amount || 0), raffle.prize_asset_decimals || 6)}
                    </span>
                    <span className="font-jetbrains text-xl text-white/60 ml-2">
                      {raffle.prize_asset_symbol}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Ticket Info */}
            <div className="detail-card mb-6">
              <h3 className="font-jetbrains text-xs uppercase tracking-widest text-white/40 mb-3">
                Ticket Information
              </h3>
              <div className="detail-stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Price per Ticket</span>
                  <span className="stat-value">${raffle.ticket_price_usd}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Tickets Sold</span>
                  <span className="stat-value">
                    {raffle.tickets_sold || 0} / {raffle.max_tickets}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="progress-container">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${ticketsSoldPercent}%` }}
                  />
                </div>
                <span className="font-jetbrains text-xs text-white/40">
                  {ticketsSoldPercent.toFixed(1)}% sold
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div className="detail-card mb-6">
              <h3 className="font-jetbrains text-xs uppercase tracking-widest text-white/40 mb-3">
                Timeline
              </h3>
              <div className="detail-stats-grid">
                {raffle.created_at && (
                  <div className="stat-item">
                    <span className="stat-label">Created</span>
                    <span className="stat-value">
                      {new Date(raffle.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="stat-item">
                  <span className="stat-label">Ends</span>
                  <span className="stat-value">
                    {new Date(raffle.ends_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="balance-display">
              <span className="font-jetbrains text-xs text-white/40">
                Available Balance:
              </span>
              <span className="font-jetbrains text-xs font-bold">
                {balanceData ? formatUnits(balanceData, raffle.payment_asset_decimals || 6) : '0'} {raffle.payment_asset_symbol || 'USDC'}
              </span>
            </div>
            {/* Action Button */}
            {isConnected ? (
              <button
                className="btn-primary w-full"
                disabled={!isActive}
                onClick={() => setShowBuyModal(true)}
              >
                <span className="font-jetbrains text-sm font-bold">
                  {getButtonText()}
                </span>
                <div className="price-badge">
                  <img src="/USDC.svg" alt={raffle.payment_asset_symbol || 'USDC'} />
                  <span className="font-jetbrains text-xs font-bold">
                    {formatUnits(BigInt(raffle.ticket_price_amount || 0), raffle.payment_asset_decimals || 6)}
                  </span>
                </div>
              </button>
            ) : (
              <div className="connect-prompt">
                <p className="font-jetbrains text-xs text-white/50 mb-3">
                  Connect your wallet to buy tickets
                </p>
              </div>
            )}

            {/* Additional Info */}
            {raffle.contract_address && (
              <div className="detail-card mt-6">
                <h3 className="font-jetbrains text-xs uppercase tracking-widest text-white/40 mb-3">
                  Contract Details
                </h3>
                <div className="contract-info">
                  <span className="font-jetbrains text-xs text-white/30" style={{ wordBreak: 'break-all' }}>
                    {raffle.contract_address}
                  </span>
                </div>
              </div>
            )}

            {raffle.prize_tx_hash && (
              <div className="detail-card mt-4">
                <h3 className="font-jetbrains text-xs uppercase tracking-widest text-white/40 mb-3">
                  Prize Transaction
                </h3>
                <div className="contract-info">
                  <span className="font-jetbrains text-xs text-white/30" style={{ wordBreak: 'break-all' }}>
                    {raffle.prize_tx_hash}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Buy Tickets Modal */}
      {showBuyModal && (
        <BuyTicketsModal
          raffleId={raffle.id}
          ticketPrice={raffle.ticket_price_amount}
          paymentAsset={raffle.payment_asset}
          paymentAssetSymbol={raffle.payment_asset_symbol || 'USDC'}
          paymentAssetDecimals={raffle.payment_asset_decimals || 6}
          userBalanceData={balanceData}
          prizeImage={raffle.image_url}
          prizeTitle={raffle.title}
          maxTickets={raffle.max_tickets}
          ticketsSold={raffle.tickets_sold || 0}
          onClose={() => setShowBuyModal(false)}
          onSuccess={() => {
            // Refresh raffle data after successful purchase
            window.location.reload()
          }}
        />
      )}
    </Layout>
  )
}

export default RaffleDetail
