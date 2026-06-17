import { useState, useEffect } from 'react'
import { usePublicClient, useAccount } from 'wagmi'
import { useWaitForTransactionReceipt } from 'wagmi'
import { ContractFunctionRevertedError } from 'viem'
import { motion, AnimatePresence } from 'framer-motion'
import { overlayVariants, modalVariants, fadeInUp, staggerContainer } from '../../utils/animations'
import { useEnterFreeRaffle } from '../../hooks/useRaffleContract'
import { BACKEND_URL, getAuthToken, apiFetch } from '../../config/index'
import { TaskItem } from '../../interfaces/TaskItem'

const CONTRACT_ERROR_MESSAGES: Record<string, string> = {
  HostCannotEnter: "You're the raffle host — you can't enter your own raffle.",
  MaxCapReached: 'This raffle is Sold out.',
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
  prizeAmount?: string
  prizeSymbol?: string
  maxTickets: number
  ticketsSold: number
  creatorAddress?: string
  task?: TaskItem
  onClose: () => void
  onSuccess?: () => void
}

interface DefaultTask {
  id: number
  type: 'follow' | 'repost' | 'share' | 'reply'
  label: string
  description: string
  url: string
  verified: boolean
}

interface TaskSubmitResponse {
  message?: string
  data?: {
    wallet_address?: string
    twitter_username?: string
    submitted_at?: string
    raffle_id?: number
    signature?: string
  }
  failed_tasks?: string[]
  verification?: {
    all_passed?: boolean
    [key: string]: unknown
  }
  max_participants?: number
  current_participants?: number
}



export function FreeRaffleModal({
  raffleId,
  prizeImage,
  prizeTitle,
  prizeAmount,
  prizeSymbol,
  maxTickets,
  ticketsSold,
  creatorAddress,
  task,
  onClose,
  onSuccess,
}: FreeRaffleModalProps) {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const DEFAULT_TASKS: DefaultTask[] = [
  {
    id: 1,
    type: 'follow',
    label: 'FOLLOW @RAFFLED',
    description: 'Link your X account and follow',
    url: 'https://x.com/intent/follow?screen_name=useRaffled',
    verified: false,
  },
  {
    id: 2,
    type: 'repost',
    label: 'REPOST RAFFLE',
    description: 'Share the raffle to your timeline',
    url: `https://x.com/intent/retweet?tweet_id=${task?.tweet_id || ''}`,
    verified: false,
  },
  {
    id: 3,
    type: 'reply',
    label: 'REPLY TO THREAD',
    description: 'Comment with your Wallet Address',
    url: `https://x.com/intent/tweet?in_reply_to=${task?.tweet_id || ''}&text=I'm joining%20the%20raffle!%20My%20wallet%20address%20is%20${address || ''}%20%23Raffled`,
    verified: false,
  },
]


  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRaffleCreator, setIsRaffleCreator] = useState(false)
  const [enterRaffleHash, setEnterRaffleHash] = useState<`0x${string}` | undefined>()
  const [tasks, setTasks] = useState<DefaultTask[]>(DEFAULT_TASKS)
  const [tasksCompleted, setTasksCompleted] = useState(0)
  const [tasksTotal, setTasksTotal] = useState(DEFAULT_TASKS.length)
  const [twitterUsername, setTwitterUsername] = useState('')
  const [, setSignature] = useState<string | null>(null)
  const [allVerified, setAllVerified] = useState(false)
  const [verifyingTaskId, setVerifyingTaskId] = useState<number | null>(null)
  const [submittingEntry, setSubmittingEntry] = useState(false)

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
    const verifiedCount = tasks.filter((t) => t.verified).length
    setTasksCompleted(verifiedCount)
    setAllVerified(verifiedCount === tasksTotal && tasksTotal > 0)
  }, [tasks, tasksTotal])

  useEffect(() => {
    if (isSuccess && enterRaffleHash) {
      setIsSubmitting(false)
      onSuccess?.()
    }
  }, [isSuccess, enterRaffleHash, onSuccess])

  const handleVerifyTask = async (task: DefaultTask) => {
    if (!twitterUsername.trim()) {
      setError('Please enter your X (Twitter) username first.')
      return
    }

    setVerifyingTaskId(task.id)
    setError(null)

    const cleanUrl = task.url.replace(/^https?:\/\/x\.com/, 'https://x.com')
    window.open(cleanUrl, '_blank', 'noopener,noreferrer')

    if (!task.verified) {
      setTimeout(() => {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, verified: true } : t
          )
        )
        setVerifyingTaskId(null)
      }, 10000)
    } else {
      setVerifyingTaskId(null)
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

    if (!twitterUsername.trim()) {
      setError('Please enter your X (Twitter) username first.')
      return
    }

    setError(null)
    setSubmittingEntry(true)

    try {
      const authToken = getAuthToken()
      const res = await apiFetch(`${BACKEND_URL}/raffles/${raffleId}/task/submit`, {
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

      const data: TaskSubmitResponse = await res.json()
      console.log('[FreeRaffle] task/submit response:', data)

      if (res.status !== 201) {
        let msg = data.message || 'Entry failed. Please try again.'

        if (data.failed_tasks && data.failed_tasks.length > 0) {
          msg = `Tasks incomplete: ${data.failed_tasks.join(', ')}. Please complete all tasks before entering.`
        } else if (data.max_participants && data.current_participants !== undefined) {
          msg = 'Participant slots are full.'
        }

        setError(msg)
        setSubmittingEntry(false)
        return
      }

      const sig = data.data?.signature
      if (!sig) {
        setError('Server did not return a signature. Please try again.')
        setSubmittingEntry(false)
        return
      }

      setSignature(sig)
      setIsSubmitting(true)

      const hash = await enterFreeRaffle({ raffleId, signature: sig })
      setEnterRaffleHash(hash as `0x${string}`)
      setSubmittingEntry(false)
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
      setSubmittingEntry(false)
    }
  }


  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        variants={overlayVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        onClick={onClose}
      >
        <motion.div
          className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto lg:overflow-hidden shadow-[0_25px_50px_rgba(0,0,0,0.8)] flex flex-col lg:flex-row"
          variants={modalVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Left Panel */}
          <div className="lg:w-5/12 w-full bg-gradient-to-b from-[#0a0a0a] to-[#050505] border-b lg:border-b-0 lg:border-r border-[#1f1f1f] p-4 lg:p-8 flex flex-col relative shrink-0">
            {/* Golden glow behind image */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 lg:w-64 lg:h-64 bg-[#FFB800]/8 rounded-full blur-[60px] lg:blur-[80px] pointer-events-none" />

            {/* Live Protocol Access Pill */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFB800]/10 border border-[#FFB800]/25 mb-4 lg:mb-6">
                <span className="w-2 h-2 rounded-full bg-[#FFB800] animate-pulse" />
                <span className="font-mono text-[8px] lg:text-[9px] font-bold uppercase tracking-widest text-[#FFB800]">
                  LIVE PROTOCOL ACCESS
                </span>
              </div>

              {/* Header */}
              <h2 className="font-sans font-bold text-2xl lg:text-4xl text-[#F5F5F5] mb-1 lg:mb-2 tracking-tight">
                FREE ENTRY
              </h2>
              <p className="font-mono text-[8px] lg:text-[10px] uppercase tracking-widest text-[#555555]">
                AUTHORIZATION LEVEL:{' '}
                <span className="text-[#FFB800]">ZERO COST</span>
              </p>
            </div>

            {/* Prize Image with Glow */}
            <div className="relative z-10 flex items-center justify-center my-4 lg:my-8 lg:flex-1">
              <div className="relative w-full max-w-[180px] lg:max-w-[280px] mx-auto">
                {/* Outer glow ring */}
                <div className="absolute inset-0 rounded-xl bg-[#FFB800]/5 blur-xl" />

                {/* Image container */}
                <div className="relative w-full aspect-square rounded-xl border border-[#1f1f1f] overflow-hidden bg-[#111111]">
                  {prizeImage ? (
                    <img
                      src={prizeImage}
                      alt={prizeTitle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-mono text-xs text-[#333333]">No Image</span>
                    </div>
                  )}
                </div>

                {/* Prize Value Badge */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#0a0a0a] border border-[#FFB800]/30 rounded-lg px-3 lg:px-4 py-2 lg:py-2.5 text-center">
                  <p className="font-mono font-bold text-base lg:text-lg text-[#FFB800] leading-none">
                    {prizeAmount || '1,000'}
                  </p>
                  <p className="font-mono text-[10px] lg:text-xs text-[#FFB800]/70 uppercase mt-0.5">
                    {prizeSymbol || 'USDC'}
                  </p>
                </div>
              </div>
            </div>

            {/* Availability Status */}
            <div className="relative z-10 space-y-2 lg:space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[8px] lg:text-[9px] uppercase tracking-widest text-[#555555]">
                    AVAILABILITY STATUS
                  </p>
                  <p className="font-mono text-base lg:text-lg font-bold text-[#F5F5F5] mt-0.5 lg:mt-1">
                    {remainingTickets}{' '}
                    <span className="text-[#555555]">/ {maxTickets}</span>
                  </p>
                </div>
                <div className="text-right">
                  {remainingTickets <= maxTickets * 0.25 && (
                    <p className="font-mono text-[8px] lg:text-[9px] uppercase tracking-widest text-[#EF4444]">
                      CLOSING SOON
                    </p>
                  )}
                  <p className="font-mono text-[9px] lg:text-[10px] text-[#555555] mt-0.5 lg:mt-1">
                    LIMIT: 1 PER WALLET
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#FFB800] to-[#FFCC33] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((maxTickets - remainingTickets) / maxTickets) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-full lg:w-7/12 flex flex-col">
            <div className="p-4 lg:p-8 flex flex-col min-h-full">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-sans font-bold text-xl text-[#F5F5F5] tracking-tight">
                    ENTRY SEQUENCE
                  </h3>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#555555] mt-1">
                    COMPLETE ALL PROTOCOLS TO VERIFY ELIGIBILITY
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Step Counter */}
                  <div className="font-mono text-2xl font-bold">
                    <span className="text-[#FFB800]">{String(tasksCompleted).padStart(2, '0')}</span>
                    <span className="text-[#333333]">/</span>
                    <span className="text-[#555555]">{String(tasksTotal).padStart(2, '0')}</span>
                  </div>
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-md text-[#555555] hover:text-[#F5F5F5] hover:bg-[#1a1a1a] transition-all text-lg"
                    onClick={onClose}
                  >
                    ✕
                  </button>
                </div>
              </div>

            {/* Twitter Username Input */}
            <div className="mb-6 space-y-2">
              <label className="font-mono text-[9px] uppercase tracking-widest text-[#555555]">
                X (Twitter) Username — Required for verification
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
                  }}
                  disabled={isRaffleCreator}
                  placeholder="username"
                  className="w-full bg-[#111111] border border-[#2a2a2a] rounded-lg py-2.5 pl-8 pr-4 font-mono text-sm text-[#F5F5F5] focus:outline-none focus:border-[#FFB800] transition-colors disabled:opacity-30 disabled:cursor-not-allowed placeholder:text-[#333333]"
                />
              </div>
            </div>

            {/* Task List */}
            <motion.div
              className="space-y-3 flex-1 mb-6"
              variants={staggerContainer}
            >
              {tasks.map((task) => {
                const isVerifying = verifyingTaskId === task.id
                const isDone = task.verified

                return (
                  <motion.div
                    key={task.id}
                    variants={fadeInUp}
                    className={`relative flex items-center justify-between px-4 py-3.5 rounded-lg border transition-all duration-500 overflow-hidden ${
                      isDone
                        ? 'bg-[#22C55E]/05 border-[#22C55E]/20'
                        : isVerifying
                        ? 'bg-[#FFB800]/05 border-[#FFB800]/20'
                        : 'bg-[#111111]/50 border-[#1f1f1f] hover:border-[#2a2a2a]'
                    }`}
                  >
                    {/* Blur overlay during verification */}
                    {isVerifying && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-[#FFB800] border-t-transparent rounded-full animate-spin" />
                          <span className="font-mono text-[10px] text-[#FFB800] font-bold uppercase tracking-wider">
                            Verifying...
                          </span>
                        </div>
                      </motion.div>
                    )}

                    <div className={`flex items-center gap-4 transition-all duration-300 ${isVerifying ? 'opacity-30 blur-[2px]' : ''}`}>
                      {/* Task Number */}
                      <span
                        className={`font-mono text-sm font-bold ${
                          isDone ? 'text-[#22C55E]' : 'text-[#333333]'
                        }`}
                      >
                        {String(task.id).padStart(2, '0')}
                      </span>

                      {/* Task Info */}
                      <div>
                        <p
                          className={`font-mono text-xs font-bold uppercase tracking-wider ${
                            isDone ? 'text-[#22C55E]' : 'text-[#F5F5F5]'
                          }`}
                        >
                          {task.label}
                        </p>
                        <p className="font-mono text-[10px] text-[#555555] mt-0.5">
                          {task.description}
                        </p>
                      </div>
                    </div>

                    {/* Verify Button */}
                    <button
                      className={`font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-all relative z-20 flex items-center gap-2 ${
                        isDone
                          ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 hover:bg-[#22C55E]/20'
                          : isVerifying
                          ? 'bg-[#FFB800]/10 text-[#FFB800]/50 cursor-wait'
                          : twitterUsername.trim()
                          ? 'bg-[#FFB800]/10 text-[#FFB800] hover:bg-[#FFB800]/20 border border-[#FFB800]/25'
                          : 'bg-[#1a1a1a] text-[#333333] cursor-not-allowed border border-[#1f1f1f]'
                      }`}
                      onClick={() => handleVerifyTask(task)}
                      disabled={
                        isVerifying ||
                        !twitterUsername.trim() ||
                        isRaffleCreator
                      }
                    >
                      {isDone ? (
                        <>
                          <span className="text-xs">✓</span>
                          <span>REDIRECT</span>
                        </>
                      ) : isVerifying ? (
                        'VERIFYING'
                      ) : (
                        'VERIFY'
                      )}
                    </button>
                  </motion.div>
                )
              })}
            </motion.div>

            {/* Enter Button */}
            <button
              className={`w-full py-4 font-mono font-bold text-sm uppercase tracking-widest rounded-lg transition-all duration-200 ${
                isSuccess
                  ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30 cursor-not-allowed'
                  : isRaffleCreator
                  ? 'bg-[#111111] text-[#333333] border border-[#1f1f1f] cursor-not-allowed'
                  : allVerified && !isEnterPending && !isConfirming && !submittingEntry
                  ? 'bg-[#FFB800] text-[#050505] hover:bg-[#FFCC33] shadow-[0_0_20px_rgba(255,184,0,0.2)] hover:shadow-[0_0_30px_rgba(255,184,0,0.3)]'
                  : 'bg-[#1a1a1a] text-[#333333] border border-[#1f1f1f] cursor-not-allowed'
              }`}
              onClick={handleEnterRaffle}
              disabled={
                isEnterPending ||
                isConfirming ||
                isSubmitting ||
                submittingEntry ||
                isRaffleCreator ||
                isSuccess
              }
            >
              {submittingEntry
                ? 'Checking Eligibility...'
                : isConfirming
                ? 'Confirming...'
                : isEnterPending
                ? 'Entering Raffle...'
                : isSuccess
                ? 'Successfully Entered!'
                : isRaffleCreator
                ? 'Your Raffle'
                : 'ENTER FREE RAFFLE'}
            </button>

            {/* Chainlink Footer */}
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#333333] text-center mt-4">
              VALIDATED BY CHAINLINK VRF DECENTRALIZED ORACLE NETWORK
            </p>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 py-2.5 px-4 rounded-lg bg-[#EF4444]/06 border border-[#EF4444]/20 text-center"
              >
                <span className="font-mono text-xs text-[#EF4444]">{error}</span>
              </motion.div>
            )}

            {/* Success */}
            {isSuccess && enterRaffleHash && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 py-2.5 px-4 rounded-lg bg-[#22C55E]/06 border border-[#22C55E]/20 text-center"
              >
                <span className="font-mono text-xs text-[#22C55E]">
                  ✓ Successfully entered the raffle!
                </span>
              </motion.div>
            )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
