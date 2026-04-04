import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient, useAccount } from 'wagmi'
import { formatUnits } from 'viem'
import { motion, AnimatePresence } from 'framer-motion'
import { RAFFLE_MANAGER_ADDRESS } from '../../config/contracts'
import RaffleManagerABI from '../../abis/RaffleManager.json'
import { overlayVariants, modalVariants } from '../../utils/animations'

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
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

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

      // Step 1: Approve USDC spend
      setCurrentStep('approving')
      console.log('📝 Step 1/2: Approving USDC spend...')
      console.log('Token address:', paymentAsset)
      console.log('Spender (RaffleManager):', RAFFLE_MANAGER_ADDRESS)
      console.log('Amount to approve:', totalPrice.toString())

      writeContract({
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

      console.log('⏳ Waiting for approval confirmation...')

      // Step 2: Enter raffle
      const estimatedGas = BigInt(100000 + 50000 * ticketCount)

      setCurrentStep('purchasing')
      console.log('🎫 Step 2/2: Entering raffle...')
      writeContract({
        address: RAFFLE_MANAGER_ADDRESS,
        abi: RaffleManagerABI,
        functionName: 'enterRaffle',
        args: [BigInt(raffleId), BigInt(ticketCount)],
        gas: estimatedGas,
      })

      console.log('✅ Enter raffle submitted')
    } catch (error) {
      console.error('❌ Error purchasing tickets:', error)
      setIsPurchasing(false)
      setCurrentStep('idle')
    }
  }

  const increment = () => {
    if (ticketCount < remainingTickets) setTicketCount(ticketCount + 1)
  }

  const decrement = () => {
    if (ticketCount > 1) setTicketCount(ticketCount - 1)
  }

  const getButtonLabel = () => {
    if (currentStep === 'approving') return 'Approving...'
    if (currentStep === 'purchasing') return 'Purchasing...'
    if (isPending || isConfirming) return 'Processing...'
    if (isSuccess) return 'Success!'
    return 'Buy Tickets'
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        variants={overlayVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        onClick={onClose}
      >
        <motion.div
          className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-2xl max-w-md w-full overflow-hidden shadow-[0_25px_50px_rgba(0,0,0,0.8)]"
          variants={modalVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f1f]">
            <h2 className="font-mono font-bold text-sm uppercase tracking-wider text-[#F5F5F5]">
              Purchase Tickets
            </h2>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-md text-[#555555] hover:text-[#F5F5F5] hover:bg-[#1a1a1a] transition-all text-lg"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Prize Image */}
            <div className="w-full aspect-square rounded-xl border border-[#1f1f1f] overflow-hidden bg-[#111111]">
              {prizeImage ? (
                <img src={prizeImage} alt={prizeTitle} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-mono text-xs text-[#333333]">No Image</span>
                </div>
              )}
            </div>

            {/* Prize Title */}
            <div className="text-center">
              <h3 className="font-sans font-semibold text-base text-[#F5F5F5]">{prizeTitle}</h3>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#333333] mt-0.5">Raffle Prize</p>
            </div>

            {/* Ticket Counter */}
            <div className="flex items-center justify-center gap-4 py-2">
              <button
                className="w-11 h-11 rounded-lg border border-[#2a2a2a] bg-[#111111] text-[#F5F5F5] text-xl font-bold flex items-center justify-center hover:bg-[#FFB800] hover:text-[#050505] hover:border-[#FFB800] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                onClick={decrement}
                disabled={ticketCount <= 1}
              >
                −
              </button>
              <div className="flex items-center gap-2 px-6 py-2.5 border border-[#2a2a2a] bg-[#111111] rounded-lg min-w-[140px] justify-center">
                <span className="font-mono font-bold text-[#F5F5F5] text-sm">
                  {ticketCount} TICKET{ticketCount !== 1 ? 'S' : ''}
                </span>
              </div>
              <button
                className="w-11 h-11 rounded-lg border border-[#2a2a2a] bg-[#111111] text-[#F5F5F5] text-xl font-bold flex items-center justify-center hover:bg-[#FFB800] hover:text-[#050505] hover:border-[#FFB800] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                onClick={increment}
                disabled={ticketCount >= remainingTickets}
              >
                +
              </button>
            </div>

            {/* Win Chance */}
            <div className="text-center py-2.5 rounded-lg bg-[#FFB800]/05 border border-[#FFB800]/15">
              <span className="font-mono text-xs text-[#FFB800]">
                Win probability: {winChance}%
              </span>
            </div>

            {/* Balance */}
            <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#111111] border border-[#1f1f1f]">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#555555]">Balance</span>
              <span className="font-mono text-sm font-semibold text-[#F5F5F5]">
                {userBalanceData ? formatUnits(userBalanceData, paymentAssetDecimals) : '0'}{' '}
                <span className="text-[#555555]">{paymentAssetSymbol}</span>
              </span>
            </div>

            {/* Purchase Button */}
            <button
              className={`w-full flex items-center justify-between px-5 py-3.5 font-mono font-bold text-sm uppercase tracking-wider rounded-lg transition-all duration-200 ${
                isPurchasing || isPending || isConfirming || !hasEnoughBalance
                  ? 'bg-[#111111] text-[#333333] cursor-not-allowed border border-[#1f1f1f]'
                  : isSuccess
                  ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30 cursor-not-allowed'
                  : 'bg-[#FFB800] text-[#050505] hover:bg-[#FFCC33] shadow-[0_0_20px_rgba(255,184,0,0.2)]'
              }`}
              onClick={handlePurchase}
              disabled={isPurchasing || isPending || isConfirming || !hasEnoughBalance}
            >
              <span>{getButtonLabel()}</span>
              <div className="flex items-center gap-1.5 bg-[#050505]/15 rounded-md px-3 py-1">
                <img src="/USDC.svg" alt={paymentAssetSymbol} className="w-4 h-4" />
                <span className="text-xs font-bold">{totalPriceFormatted}</span>
              </div>
            </button>

            {/* Error */}
            {!hasEnoughBalance && (
              <div className="py-2.5 px-4 rounded-lg bg-[#EF4444]/06 border border-[#EF4444]/20 text-center">
                <span className="font-mono text-xs text-[#EF4444]">
                  Insufficient {paymentAssetSymbol} balance
                </span>
              </div>
            )}

            {/* Success */}
            {isSuccess && hash && (
              <div className="py-2.5 px-4 rounded-lg bg-[#22C55E]/06 border border-[#22C55E]/20 text-center">
                <span className="font-mono text-xs text-[#22C55E]">
                  ✓ Tickets purchased successfully!
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default BuyTicketsModal
