import { useState, useEffect } from 'react'
import { usePublicClient, useAccount,  } from 'wagmi'
import { useWaitForTransactionReceipt } from 'wagmi'
import { ContractFunctionRevertedError } from 'viem'
import { motion, AnimatePresence } from 'framer-motion'
import { overlayVariants, modalVariants } from '../../utils/animations'
import { useEnterFreeRaffle } from '../../hooks/useRaffleContract'
import { BACKEND_URL, getAuthToken, apiFetch } from '../../config/index'

const CONTRACT_ERROR_MESSAGES: Record<string, string> = {
  HostCannotEnter: "You're the raffle host — you can't enter your own raffle.",
  MaxCapReached: 'This raffle is sold out.',
  RaffleNotOpen: 'This raffle is no longer open.',
  InvalidParams: 'Invalid parameters sent to the contract.',
  ReentrancyGuardReentrantCall: 'Reentrant call detected — please try again.',
  AlreadyClaimed: 'You have already entered this free raffle.',
  InvalidSigner: 'Signature verification failed. Please try again.',
}

interface FreeRaffleModalProps {
  raffleId: number
  prizeImage?: string
  prizeTitle: string
  maxTickets: number
  ticketsSold: number
  creatorAddress?: string
  onClose: () => void
  onSuccess?: () => void
}

interface TaskMyResponse {
  task_id?: number
  twitter_username?: string | null
  already_entered?: boolean
  [key: string]: unknown
}

export function FreeRaffleModal({
  raffleId,
  prizeImage,
  prizeTitle,
  maxTickets,
  ticketsSold,
  creatorAddress,
  onClose,
  onSuccess,
}: FreeRaffleModalProps) {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()

  const [twitterUsername, setTwitterUsername] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState<'idle' | 'checking-eligibility' | 'eligible' | 'not-eligible' | 'entering-raffle'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isRaffleCreator, setIsRaffleCreator] = useState(false)
  const [enterRaffleHash, setEnterRaffleHash] = useState<`0x${string}` | undefined>()
  const [taskData, setTaskData] = useState<TaskMyResponse | null>(null)
  const [taskLoading, setTaskLoading] = useState(true)
  const [signature, setSignature] = useState<string | null>(null)

  const remainingTickets = maxTickets - ticketsSold

  const { enterFreeRaffle, isPending: isEnterPending } = useEnterFreeRaffle()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: enterRaffleHash,
  })

  useEffect(() => {
    if (address && creatorAddress) {
      setIsRaffleCreator(address.toLowerCase() === creatorAddress.toLowerCase())
    } else {
      setIsRaffleCreator(false)
    }
  }, [address, creatorAddress])

  useEffect(() => {
    const fetchTaskMy = async () => {
      try {
        const authToken = getAuthToken()
        const res = await apiFetch(`${BACKEND_URL}/raffles/${raffleId}/task/my`, {
          method: 'GET',
          headers: {
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        })
        if (res.ok) {
          const data = await res.json()
          console.log('[FreeRaffle] /task/my response:', data)
          console.log('[FreeRaffle] free_raffle:', true)
          setTaskData(data)
          if (data.twitter_username) {
            setTwitterUsername(data.twitter_username)
          }
        }
      } catch (err) {
        console.error('Error fetching task/my:', err)
      } finally {
        setTaskLoading(false)
      }
    }
    fetchTaskMy()
  }, [raffleId])

  useEffect(() => {
    if (isSuccess && enterRaffleHash) {
      setIsSubmitting(false)
      setCurrentStep('idle')
      onSuccess?.()
    }
  }, [isSuccess, enterRaffleHash, onSuccess])

  const checkEligibility = async () => {
    if (!twitterUsername.trim()) {
      setError('Please enter your X (Twitter) username.')
      return
    }

    setError(null)

    try {
      setIsSubmitting(true)
      setCurrentStep('checking-eligibility')

      const authToken = getAuthToken()
      const taskSubmitRes = await apiFetch(`${BACKEND_URL}/raffles/${raffleId}/task/submit`, {
        method: 'POST',
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          twitter_username: twitterUsername.trim(),
        }),
      })

      if (!taskSubmitRes.ok) {
        const errorData = await taskSubmitRes.json().catch(() => null)
        const errorMsg = errorData?.message || 'Not eligible. Please check your X username.'
        throw new Error(errorMsg)
      }

      const taskSubmitData = await taskSubmitRes.json()
      const sig = taskSubmitData.signature

      if (!sig) {
        throw new Error('No signature received from backend.')
      }

      setSignature(sig)
      setTaskData(taskSubmitData.data || taskSubmitData)
      setCurrentStep('eligible')
    } catch (err) {
      console.error('Eligibility check failed:', err)
      let msg = 'Eligibility check failed.'
      if (err instanceof Error) {
        msg = err.message
      }
      setError(msg)
      setCurrentStep('not-eligible')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEnterRaffle = async () => {
    if (!address || !isConnected || !publicClient) {
      setError('Wallet not connected. Please connect your wallet and try again.')
      return
    }

    if (isRaffleCreator) {
      setError("You're the host — hosts can't enter their own raffle.")
      return
    }

    if (currentStep !== 'eligible' || !signature) {
      setError('Please check your eligibility first.')
      return
    }

    setError(null)

    try {
      setIsSubmitting(true)
      setCurrentStep('entering-raffle')

      // Re-check wallet connection before sending transaction
      if (!isConnected) {
        throw new Error('Wallet disconnected. Please reconnect and try again.')
      }

      const hash = await enterFreeRaffle({ raffleId, signature })
      setEnterRaffleHash(hash as `0x${string}`)
    } catch (err) {
      console.error('Free raffle entry failed:', err)
      let msg = 'Entry failed.'
      if (err instanceof ContractFunctionRevertedError) {
        const errorName = err.data?.errorName
        msg = CONTRACT_ERROR_MESSAGES[errorName ?? ''] ?? `Contract error: ${errorName ?? 'unknown'}`
      } else if (err instanceof Error) {
        const viem = err as Error & { shortMessage?: string }
        if (err.message.includes('Connector not connected') || err.message.includes('signature denied')) {
          msg = 'Wallet connection lost. Please reconnect your wallet and try again.'
        } else {
          msg = viem.shortMessage ?? err.message
        }
      }
      setError(msg)
      setIsSubmitting(false)
      setCurrentStep('eligible')
    }
  }

  const getButtonLabel = () => {
    if (isRaffleCreator) return 'Your Raffle'
    if (currentStep === 'checking-eligibility') return 'Checking Eligibility...'
    if (currentStep === 'not-eligible') return 'Not Eligible'
    if (currentStep === 'entering-raffle' || isEnterPending) return 'Entering Raffle...'
    if (isConfirming) return 'Confirming...'
    if (isSuccess) return 'Success!'
    if (currentStep === 'eligible') return 'Enter Free Raffle'
    return 'Check Eligibility'
  }

  const isBusy = isSubmitting || isEnterPending || isConfirming
  const isDisabled = isBusy || isSuccess || isRaffleCreator || currentStep === 'not-eligible'

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
              Free Raffle Entry
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
                Campaign Prize
              </p>
            </div>

            {/* Info Banner */}
            <div className="py-2.5 px-4 rounded-lg bg-[#FFB800]/08 border border-[#FFB800]/25">
              <span className="font-mono text-xs text-[#FFB800]">
                Complete the task below to enter this free raffle — no payment required!
              </span>
            </div>

            {/* Creator notice */}
            {isRaffleCreator && (
              <div className="py-2.5 px-4 rounded-lg bg-[#FFB800]/08 border border-[#FFB800]/25 flex items-center gap-2">
                <span className="text-[#FFB800] text-sm">🎪</span>
                <span className="font-mono text-xs text-[#FFB800]">
                  You created this raffle — Raffle hosts cannot enter their own raffle.
                </span>
              </div>
            )}

            {/* Twitter Username Input */}
            <div className="space-y-2">
              <label className="font-mono text-[10px] uppercase tracking-widest text-[#555555]">
                X (Twitter) Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555555] font-mono text-sm">
                  @
                </span>
                <input
                  type="text"
                  value={twitterUsername.replace(/^@/, '')}
                  onChange={(e) => {
                    setTwitterUsername(e.target.value.replace(/^@/, ''))
                    if (currentStep === 'eligible' || currentStep === 'not-eligible') {
                      setCurrentStep('idle')
                      setSignature(null)
                    }
                  }}
                  disabled={isRaffleCreator || taskLoading}
                  placeholder="username"
                  className="w-full bg-[#111111] border border-[#2a2a2a] rounded-lg py-3 pl-8 pr-4 font-mono text-sm text-[#F5F5F5] focus:outline-none focus:border-[#FFB800] transition-colors disabled:opacity-30 disabled:cursor-not-allowed placeholder:text-[#333333]"
                />
              </div>
              <p className="font-mono text-[9px] text-[#333333]">
                Enter your X username to validate your entry
              </p>
            </div>

            {/* Available Entries */}
            <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#111111] border border-[#1f1f1f]">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#555555]">
                Available Spots
              </span>
              <span className="font-mono text-sm font-semibold text-[#F5F5F5]">
                {remainingTickets} <span className="text-[#555555]">/ {maxTickets}</span>
              </span>
            </div>

            {/* Entry Button */}
            <button
              className={`w-full flex items-center justify-between px-5 py-3.5 font-mono font-bold text-sm uppercase tracking-wider rounded-lg transition-all duration-200 ${
                isSuccess
                  ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30 cursor-not-allowed'
                  : currentStep === 'not-eligible'
                  ? 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 cursor-not-allowed'
                  : isDisabled
                  ? 'bg-[#111111] text-[#333333] cursor-not-allowed border border-[#1f1f1f]'
                  : currentStep === 'eligible'
                  ? 'bg-[#FFB800] text-[#050505] hover:bg-[#FFCC33] shadow-[0_0_20px_rgba(255,184,0,0.2)]'
                  : 'bg-[#555555] text-[#F5F5F5] hover:bg-[#666666]'
              }`}
              onClick={currentStep === 'eligible' ? handleEnterRaffle : checkEligibility}
              disabled={isDisabled}
            >
              <span>{getButtonLabel()}</span>
              {isRaffleCreator ? (
                <div className="flex items-center gap-1.5 bg-[#050505]/15 rounded-md px-3 py-1">
                  <span className="text-xs font-bold">Change Wallet</span>
                </div>
              ) : currentStep === 'eligible' ? (
                <div className="flex items-center gap-1.5 bg-[#050505]/15 rounded-md px-3 py-1">
                  <span className="text-xs font-bold">FREE</span>
                </div>
              ) : currentStep === 'not-eligible' ? (
                <div className="flex items-center gap-1.5 bg-[#050505]/15 rounded-md px-3 py-1">
                  <span className="text-xs font-bold">✕</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-[#050505]/15 rounded-md px-3 py-1">
                  <span className="text-xs font-bold">CHECK</span>
                </div>
              )}
            </button>

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
                  ✓ Successfully entered the raffle!
                </span>
              </div>
            )}

            {/* Eligible info */}
            {currentStep === 'eligible' && !isSuccess && (
              <div className="py-2.5 px-4 rounded-lg bg-[#22C55E]/06 border border-[#22C55E]/20 text-center">
                <span className="font-mono text-xs text-[#22C55E]">
                  ✓ You're eligible! Click the button above to enter the raffle.
                </span>
              </div>
            )}

            {/* Not eligible info */}
            {currentStep === 'not-eligible' && (
              <div className="py-2.5 px-4 rounded-lg bg-[#EF4444]/06 border border-[#EF4444]/20 text-center">
                <span className="font-mono text-xs text-[#EF4444]">
                  ✕ Not eligible. Try a different X username.
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default FreeRaffleModal
