import { useState, useEffect } from 'react'
import { usePublicClient, useAccount, useChainId } from 'wagmi'
import { useWaitForTransactionReceipt } from 'wagmi'
import { formatUnits, ContractFunctionRevertedError } from 'viem'
import { motion, AnimatePresence } from 'framer-motion'
import { overlayVariants, modalVariants } from '../../utils/animations'
import { getRaffleManagerAddress } from '../../config/evm.config'
import { useTokenApproval } from '../../hooks/useTokenApproval'
import { useEnterRaffle } from '../../hooks/useRaffleContract'

const CONTRACT_ERROR_MESSAGES: Record<string, string> = {
  HostCannotEnter: "You're the raffle host — you can't enter your own raffle.",
  MaxCapReached: 'This raffle is sold out.',
  RaffleNotOpen: 'This raffle is no longer open.',
  InvalidParams: 'Invalid parameters sent to the contract.',
  ReentrancyGuardReentrantCall: 'Reentrant call detected — please try again.',
  SafeERC20FailedOperation: 'Token transfer failed. Check your USDC balance and approval.',
}

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
  creatorAddress?: string
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
  creatorAddress,
  onClose,
  onSuccess,
}: BuyTicketsModalProps) {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const chainId = useChainId()
  const raffleManagerAddress = getRaffleManagerAddress(chainId)

  const [ticketCount, setTicketCount] = useState(1)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [currentStep, setCurrentStep] = useState<'idle' | 'approving' | 'purchasing'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isRaffleCreator, setIsRaffleCreator] = useState(false)
  const [enterRaffleHash, setEnterRaffleHash] = useState<`0x${string}` | undefined>()

  const ticketPriceBigInt = BigInt(ticketPrice)
  const totalPrice = ticketPriceBigInt * BigInt(ticketCount)
  const totalPriceFormatted = formatUnits(totalPrice, paymentAssetDecimals)

  const remainingTickets = maxTickets - ticketsSold
  const winChance =
    remainingTickets > 0
      ? ((ticketCount / (ticketsSold + ticketCount)) * 100).toFixed(2)
      : '0.00'

  const hasEnoughBalance = userBalanceData ? userBalanceData >= totalPrice : false

  const { approve, hasAllowance, isPending: isApprovePending } = useTokenApproval(
    paymentAsset as `0x${string}`,
    raffleManagerAddress
  )
  const { enterRaffle, isPending: isEnterPending } = useEnterRaffle()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: enterRaffleHash,
  })

  // Detect if connected wallet is the raffle creator
  useEffect(() => {
    if (address && creatorAddress) {
      setIsRaffleCreator(address.toLowerCase() === creatorAddress.toLowerCase())
    } else {
      setIsRaffleCreator(false)
    }
  }, [address, creatorAddress])

  useEffect(() => {
    if (isSuccess && enterRaffleHash) {
      setIsPurchasing(false)
      setCurrentStep('idle')
      onSuccess?.()
    }
  }, [isSuccess, enterRaffleHash, onSuccess])

  const handlePurchase = async () => {
    if (!address || !publicClient) return

    if (isRaffleCreator) {
      setError("You're the host — hosts can't enter their own raffle.")
      return
    }

    if (!hasEnoughBalance) {
      setError(`Insufficient ${paymentAssetSymbol} balance.`)
      return
    }

    setError(null)

    try {
      setIsPurchasing(true)

      // Step 1: Approve payment token (skip if allowance already sufficient)
      if (!hasAllowance(totalPrice)) {
        setCurrentStep('approving')
        const approveTxHash = await approve(totalPriceFormatted, paymentAssetDecimals)
        await publicClient.waitForTransactionReceipt({ hash: approveTxHash as `0x${string}` })
      }

      // Step 2: Enter raffle
      setCurrentStep('purchasing')
      const hash = await enterRaffle({ raffleId, ticketCount })
      setEnterRaffleHash(hash as `0x${string}`)
    } catch (err) {
      console.error('Purchase failed:', err)
      let msg = 'Transaction failed.'
      if (err instanceof ContractFunctionRevertedError) {
        const errorName = err.data?.errorName
        msg = CONTRACT_ERROR_MESSAGES[errorName ?? ''] ?? `Contract error: ${errorName ?? 'unknown'}`
      } else if (err instanceof Error) {
        const viem = err as Error & { shortMessage?: string }
        msg = viem.shortMessage ?? err.message
      }
      setError(msg)
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
    if (isRaffleCreator) return 'Your Raffle'
    if (currentStep === 'approving' || isApprovePending) return 'Approving...'
    if (currentStep === 'purchasing' || isEnterPending) return 'Purchasing...'
    if (isConfirming) return 'Confirming...'
    if (isSuccess) return 'Success!'
    return 'Buy Tickets'
  }

  const isBusy = isPurchasing || isApprovePending || isEnterPending || isConfirming
  const isDisabled = isBusy || !hasEnoughBalance || isSuccess || isRaffleCreator

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
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#333333] mt-0.5">
                Raffle Prize
              </p>
            </div>

            {/* Creator notice banner */}
            {isRaffleCreator && (
              <div className="py-2.5 px-4 rounded-lg bg-[#FFB800]/08 border border-[#FFB800]/25 flex items-center gap-2">
                <span className="text-[#FFB800] text-sm">🎪</span>
                <span className="font-mono text-xs text-[#FFB800]">
                  You created this raffle — switch wallets to enter.
                </span>
              </div>
            )}

            {/* Ticket Counter */}
            <div className="flex items-center justify-center gap-4 py-2">
              <button
                className="w-11 h-11 rounded-lg border border-[#2a2a2a] bg-[#111111] text-[#F5F5F5] text-xl font-bold flex items-center justify-center hover:bg-[#FFB800] hover:text-[#050505] hover:border-[#FFB800] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                onClick={decrement}
                disabled={ticketCount <= 1 || isRaffleCreator}
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
                disabled={ticketCount >= remainingTickets || isRaffleCreator}
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
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#555555]">
                Balance
              </span>
              <span className="font-mono text-sm font-semibold text-[#F5F5F5]">
                {userBalanceData ? formatUnits(userBalanceData, paymentAssetDecimals) : '0'}{' '}
                <span className="text-[#555555]">{paymentAssetSymbol}</span>
              </span>
            </div>

            {/* Purchase Button */}
            <button
              className={`w-full flex items-center justify-between px-5 py-3.5 font-mono font-bold text-sm uppercase tracking-wider rounded-lg transition-all duration-200 ${
                isSuccess
                  ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30 cursor-not-allowed'
                  : isDisabled
                  ? 'bg-[#111111] text-[#333333] cursor-not-allowed border border-[#1f1f1f]'
                  : 'bg-[#FFB800] text-[#050505] hover:bg-[#FFCC33] shadow-[0_0_20px_rgba(255,184,0,0.2)]'
              }`}
              onClick={handlePurchase}
              disabled={isDisabled}
            >
              <span>{getButtonLabel()}</span>
              {isRaffleCreator ? (
                <div className="flex items-center gap-1.5 bg-[#050505]/15 rounded-md px-3 py-1">
                  <span className="text-xs font-bold">Change Wallet</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-[#050505]/15 rounded-md px-3 py-1">
                  <img src="/USDC.svg" alt={paymentAssetSymbol} className="w-4 h-4" />
                  <span className="text-xs font-bold">{totalPriceFormatted}</span>
                </div>
              )}
            </button>

            {/* Insufficient balance */}
            {!hasEnoughBalance && !isRaffleCreator && (
              <div className="py-2.5 px-4 rounded-lg bg-[#EF4444]/06 border border-[#EF4444]/20 text-center">
                <span className="font-mono text-xs text-[#EF4444]">
                  Insufficient {paymentAssetSymbol} balance
                </span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="py-2.5 px-4 rounded-lg bg-[#EF4444]/06 border border-[#EF4444]/20 text-center">
                <span className="font-mono text-xs text-[#EF4444]">{error}</span>
              </div>
            )}

            {/* Success */}
            {isSuccess && enterRaffleHash && (
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
