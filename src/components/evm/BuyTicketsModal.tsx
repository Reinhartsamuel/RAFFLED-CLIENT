import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient, useAccount } from 'wagmi'
import { formatUnits } from 'viem'
import { RAFFLE_MANAGER_ADDRESS } from '../../config/contracts'
import RaffleManagerABI from '../../abis/RaffleManager.json'

interface BuyTicketsModalProps {
  raffleId: number
  ticketPrice: string
  paymentAsset: string
  paymentAssetSymbol: string
  paymentAssetDecimals: number
  prizeImage?: string
  prizeTitle: string
  maxTickets: number
  ticketsSold: number
  userBalanceData: bigint | null
  onClose: () => void
  onSuccess?: () => void
}

export function BuyTicketsModal({
  raffleId,
  ticketPrice,
  paymentAsset,
  paymentAssetSymbol,
  paymentAssetDecimals,
  prizeImage,
  prizeTitle,
  maxTickets,
  ticketsSold,
  userBalanceData,
  onClose,
  onSuccess,
}: BuyTicketsModalProps) {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const [ticketCount, setTicketCount] = useState(1)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [currentStep, setCurrentStep] = useState<'idle' | 'approving' | 'purchasing'>('idle')

  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // ticketPrice is already in smallest unit (e.g. 1000000 for 1 USDC with 6 decimals)
  const ticketPriceBigInt = BigInt(ticketPrice)
  const totalPrice = ticketPriceBigInt * BigInt(ticketCount)
  const totalPriceFormatted = formatUnits(totalPrice, paymentAssetDecimals)

  // Calculate win chance
  const remainingTickets = maxTickets - ticketsSold
  const winChance = remainingTickets > 0
    ? ((ticketCount / (ticketsSold + ticketCount)) * 100).toFixed(2)
    : '0.00'

  // Check if user has enough balance
  const hasEnoughBalance = userBalanceData ? userBalanceData >= totalPrice : false

  useEffect(() => {
    if (isSuccess && hash) {
      console.log('✅ Transaction successful!')
      console.log('Transaction hash:', hash)
      setIsPurchasing(false)
      setCurrentStep('idle')
      // if (onSuccess) {
      //   setTimeout(() => {
      //     onSuccess()
      //     onClose()
      //   }, 2000)
      // }
    }
  }, [isSuccess, hash, onSuccess, onClose])

  useEffect(() => {
    if (writeError) {
      console.error('❌ Transaction error:', writeError)
      setIsPurchasing(false)
    }
  }, [writeError])

  const handlePurchase = async () => {
    if (!address || !publicClient) {
      console.error('No wallet connected or public client not available')
      return
    }

    if (!hasEnoughBalance) {
      console.error('Insufficient balance')
      return
    }

    try {
      setIsPurchasing(true)
      console.log('🎫 Purchasing tickets...')
      console.log('Raffle ID:', raffleId)
      console.log('Ticket count:', ticketCount)
      console.log('Total price:', totalPriceFormatted, paymentAssetSymbol)
      console.log('Total price (raw):', totalPrice.toString())

      // Step 1: Approve USDC spend (RaffleManager2 is USDC-only, always ERC20)
      setCurrentStep('approving')
      console.log('📝 Step 1/2: Approving USDC spend...')
      console.log('Token address:', paymentAsset)
      console.log('Spender (RaffleManager):', RAFFLE_MANAGER_ADDRESS)
      console.log('Amount to approve:', totalPrice.toString())

      const approveHash = writeContract({
        address: paymentAsset as `0x${string}`,
        abi: [
          {
            name: 'approve',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'spender', type: 'address' },
              { name: 'amount', type: 'uint256' },
            ],
            outputs: [{ name: '', type: 'bool' }],
          },
        ],
        functionName: 'approve',
        args: [RAFFLE_MANAGER_ADDRESS, totalPrice],
      })

      console.log('✅ Approval transaction hash:', approveHash)
      console.log('⏳ Waiting for approval confirmation...')

      if (approveHash) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash: approveHash })
        console.log('✅ Approval confirmed! Receipt:', receipt)
      }

      // Step 2: Enter raffle (not payable in RaffleManager2)
      const estimatedGas = BigInt(100000 + 50000 * ticketCount)

      setCurrentStep('purchasing')
      console.log('🎫 Step 2/2: Entering raffle...')
      const enterHash = writeContract({
        address: RAFFLE_MANAGER_ADDRESS,
        abi: RaffleManagerABI,
        functionName: 'enterRaffle',
        args: [BigInt(raffleId), BigInt(ticketCount)],
        gas: estimatedGas,
      })

      console.log('✅ Enter raffle transaction hash:', enterHash)
    } catch (error) {
      console.error('❌ Error purchasing tickets:', error)
      setIsPurchasing(false)
      setCurrentStep('idle')
    }
  }

  const increment = () => {
    if (ticketCount < remainingTickets) {
      setTicketCount(ticketCount + 1)
    }
  }

  const decrement = () => {
    if (ticketCount > 1) {
      setTicketCount(ticketCount - 1)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content buy-tickets-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="font-syne font-black text-2xl">PURCHASE TICKET</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Prize Image */}
        <div className="modal-prize-image">
          {prizeImage ? (
            <img src={prizeImage} alt={prizeTitle} />
          ) : (
            <div className="prize-placeholder">
              <span className="font-jetbrains text-white/30">No Image</span>
            </div>
          )}
        </div>

        {/* Prize Title */}
        <div className="modal-prize-title">
          <h3 className="font-syne font-bold text-lg">{prizeTitle}</h3>
          <p className="font-jetbrains text-xs text-white/40 uppercase">
            Collection
          </p>
        </div>

        {/* Ticket Counter */}
        <div className="ticket-counter">
          <button
            className="counter-btn"
            onClick={decrement}
            disabled={ticketCount <= 1}
          >
            −
          </button>
          <div className="counter-display">
            <img src="/ticket-icon.svg" alt="Ticket" className="ticket-icon" />
            <span className="font-jetbrains font-bold">{ticketCount} TICKETS</span>
          </div>
          <button
            className="counter-btn"
            onClick={increment}
            disabled={ticketCount >= remainingTickets}
          >
            +
          </button>
        </div>

        {/* Win Chance */}
        <div className="win-chance">
          <span className="font-jetbrains text-xs text-white/50">
            YOUR CHANCE TO WIN: {winChance}%
          </span>
        </div>

        {/* Balance Display */}
        <div className="balance-display">
          <span className="font-jetbrains text-xs text-white/40">
            Available Balance:
          </span>
          <span className="font-jetbrains text-xs font-bold">
            {userBalanceData ? formatUnits(userBalanceData, paymentAssetDecimals) : '0'} {paymentAssetSymbol}
          </span>
        </div>

        {/* Purchase Button */}
        <button
          className="btn-purchase"
          onClick={handlePurchase}
          disabled={isPurchasing || isPending || isConfirming || !hasEnoughBalance}
        >
          <span className="font-jetbrains font-bold">
            {currentStep === 'approving'
              ? 'APPROVING...'
              : currentStep === 'purchasing'
              ? 'PURCHASING...'
              : isPending || isConfirming
              ? 'PROCESSING...'
              : isSuccess
              ? 'SUCCESS!'
              : 'BUY TICKETS'}
          </span>
          <div className="price-badge">
            <img src="/USDC.svg" alt={paymentAssetSymbol} className="usdc-icon" />
            <span className="font-jetbrains text-sm font-bold">
              {totalPriceFormatted}
            </span>
          </div>
        </button>

        {/* Error Message */}
        {!hasEnoughBalance && (
          <div className="error-message">
            <span className="font-jetbrains text-xs text-red-400">
              Insufficient {paymentAssetSymbol} balance
            </span>
          </div>
        )}

        {/* Success Message */}
        {isSuccess && hash && (
          <div className="success-message">
            <span className="font-jetbrains text-xs text-green-400">
              ✓ Tickets purchased successfully!
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default BuyTicketsModal
