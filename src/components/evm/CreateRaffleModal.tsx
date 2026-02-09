import { useState, useCallback } from 'react'
import { useChainId } from 'wagmi'
import { parseUnits, type Address } from 'viem'
import { useCreateRaffle } from '../../hooks/useRaffleContract'
import { useTokenApproval, useTokenDecimals, useTokenBalance } from '../../hooks/useTokenApproval'
import { getRaffleManagerAddress, getMockUSDCAddress } from '../../config/evm.config'
import { API_BASE_URL, getAuthToken } from '../../config/index'
import { TransactionReceipt } from './TransactionReceipt'
import './CreateRaffleModal.css'

interface CreateRaffleModalProps {
  onClose: () => void
}

type ApprovalStep = 'not_started' | 'approving' | 'approved' | 'failed'
type CreateStep = 'idle' | 'pending' | 'success' | 'error'

export function CreateRaffleModal({ onClose }: CreateRaffleModalProps) {
  const chainId = useChainId()
  const raffleManagerAddress = getRaffleManagerAddress(chainId)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [prizeAsset, setPrizeAsset] = useState<Address>(getMockUSDCAddress(chainId))
  const [prizeAmount, setPrizeAmount] = useState('')
  const [paymentAsset, setPaymentAsset] = useState('0x0000000000000000000000000000000000000000')
  const [ticketPrice, setTicketPrice] = useState('')
  const [maxCap, setMaxCap] = useState('')
  const [duration, setDuration] = useState('') // in days

  // Token info
  const prizeDecimals = useTokenDecimals(prizeAsset) || 18

  // Always call the hook, but only use if it's a valid non-ETH address
  const isValidPaymentAddress = paymentAsset.startsWith('0x') && paymentAsset.length === 42 && paymentAsset !== '0x0000000000000000000000000000000000000000'
  const paymentTokenDecimals = useTokenDecimals(isValidPaymentAddress ? (paymentAsset as Address) : undefined) || 18
  const paymentDecimals = paymentAsset === '0x0000000000000000000000000000000000000000' ? 18 : paymentTokenDecimals

  const { balance: prizeBalance } = useTokenBalance(prizeAsset)

  // Approval state
  const approval = useTokenApproval(prizeAsset, raffleManagerAddress)
  const [approvalStep, setApprovalStep] = useState<ApprovalStep>('not_started')
  const [approvalHash, setApprovalHash] = useState<string>('')

  // Create raffle state
  const { createRaffle, isPending: isCreating } = useCreateRaffle()
  const [createStep, setCreateStep] = useState<CreateStep>('idle')
  const [createHash, setCreateHash] = useState<string>('')
  const [error, setError] = useState('')

  // Check if approval is needed
  const needsApproval = useCallback(() => {
    if (!prizeAmount) return false
    try {
      const decimals = typeof prizeDecimals === 'number' ? prizeDecimals : 18
      const prizeAmountBig = parseUnits(prizeAmount, decimals)
      return !approval.hasAllowance(prizeAmountBig)
    } catch {
      return false
    }
  }, [prizeAmount, prizeDecimals, approval])

  // Handle approve
  const handleApprove = async () => {
    if (!prizeAmount) {
      setError('Enter prize amount')
      return
    }

    try {
      setError('')
      setApprovalStep('approving')
      const decimals = typeof prizeDecimals === 'number' ? prizeDecimals : 18
      const hash = await approval.approve(prizeAmount, decimals)
      setApprovalHash(hash)
      console.log('Approval Transaction Hash:', hash)
      setApprovalStep('approved')
    } catch (err: any) {
      console.error('Approval error:', err)
      setError(err.message || 'Approval failed')
      setApprovalStep('failed')
    }
  }

  // POST raffle to backend API
  const postRaffleToBackend = async (txHash: string) => {
    try {
      const endsAt = new Date(Date.now() + Number(duration) * 86400 * 1000)
        .toISOString()
        .replace('T', ' ')
        .slice(0, 19)

      const body = new FormData()
      body.append('type', 'nft')
      body.append('title', title)
      body.append('description', description)
      body.append('prize_tx_hash', txHash)
      body.append('prize_asset_symbol', 'MockUSDC')
      body.append('prize_amount', prizeAmount)
      body.append('ticket_price_usd', ticketPrice)
      body.append('max_tickets', maxCap)
      body.append('ends_at', endsAt)
      if (image) {
        body.append('image', image)
      }

      const token = getAuthToken()
      const res = await fetch(`${API_BASE_URL}/raffles`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          Accept: 'application/json',
        },
        body,
      })

      const data = await res.json()
      if (!res.ok) {
        console.error('Backend API error:', data)
      } else {
        console.log('Raffle posted to backend:', data)
      }
      return data
    } catch (err) {
      console.error('Failed to POST raffle to backend:', err)
    }
  }

  // Handle create raffle
  const handleCreateRaffle = async () => {
    if (!title || !prizeAsset || !prizeAmount || !paymentAsset || !ticketPrice || !maxCap || !duration) {
      setError('Fill in all fields (title is required)')
      return
    }

    try {
      setError('')
      setCreateStep('pending')

      // Convert duration from days to seconds
      const durationSeconds = Number(duration) * 86400
      const prizeDecimalsNum = typeof prizeDecimals === 'number' ? prizeDecimals : 18
      const paymentDecimalsNum = typeof paymentDecimals === 'number' ? paymentDecimals : 18

      const hash = await createRaffle({
        prizeAsset,
        prizeAmount,
        prizeDecimals: prizeDecimalsNum,
        paymentAsset: paymentAsset as Address,
        ticketPrice,
        ticketDecimals: paymentDecimalsNum,
        maxCap: Number(maxCap),
        duration: durationSeconds,
      })

      setCreateHash(hash)
      console.log('Create Raffle Transaction Hash:', hash)
      setCreateStep('success')

      // POST to backend after successful on-chain creation
      await postRaffleToBackend(hash)
    } catch (err: any) {
      console.error('Create raffle error:', err)
      setError(err.message || 'Failed to create raffle')
      setCreateStep('error')
    }
  }

  const isApprovalPending = approvalStep === 'approving' || approval.isPending
  const isApproved = approvalStep === 'approved'
  const needsApprovalFlag = needsApproval()
  const canCreateRaffle =
    title &&
    prizeAsset &&
    prizeAmount &&
    paymentAsset &&
    ticketPrice &&
    maxCap &&
    duration &&
    (!needsApprovalFlag || isApproved)

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-content create-raffle-modal">
        <div className="modal-header">
          <h2 className="modal-title">Create Raffle</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {createStep === 'success' ? (
          <div className="modal-body success-state">
            <div className="success-icon">✓</div>
            <h3>Raffle Created Successfully!</h3>
            <p>Raffle is now live. Check the receipt for transaction details.</p>
            {createHash && <TransactionReceipt hash={createHash as any} />}
          </div>
        ) : (
          <>
            <div className="modal-body">
              <form className="raffle-form" onSubmit={(e) => e.preventDefault()}>
                {/* Title */}
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="My Awesome Raffle"
                    disabled={isApprovalPending || isCreating}
                  />
                </div>

                {/* Description */}
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what you're raffling..."
                    rows={3}
                    disabled={isApprovalPending || isCreating}
                  />
                </div>

                {/* Image */}
                <div className="form-group">
                  <label>Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files?.[0] || null)}
                    disabled={isApprovalPending || isCreating}
                  />
                </div>

                {/* Prize Asset */}
                <div className="form-group">
                  <label>Prize Token Address</label>
                  <input
                    type="text"
                    value={prizeAsset}
                    onChange={(e) => setPrizeAsset(e.target.value as Address)}
                    placeholder="0x49f49CfE89050a8F8E48d3A31E33a8e26Bc80D1d"
                    disabled={isApprovalPending || isCreating}
                  />
                  <small>Default: MockUSDC on {chainId === 84532 ? 'Base Sepolia' : 'Base'}</small>
                </div>

                {/* Prize Amount */}
                <div className="form-group">
                  <label>Prize Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prizeAmount}
                    onChange={(e) => setPrizeAmount(e.target.value)}
                    placeholder="100"
                    disabled={isApprovalPending || isCreating}
                  />
                  {prizeBalance && (
                    <small>
                      Balance: {(Number(prizeBalance) / 10 ** (typeof prizeDecimals === 'number' ? prizeDecimals : 18)).toFixed(2)}
                    </small>
                  )}
                </div>

                {/* Payment Asset */}
                <div className="form-group">
                  <label>Payment Token (ETH for address(0))</label>
                  <input
                    type="text"
                    value={paymentAsset}
                    onChange={(e) => setPaymentAsset(e.target.value)}
                    placeholder="0x0000000000000000000000000000000000000000"
                    disabled={isApprovalPending || isCreating}
                  />
                  <small>Use 0x0000... for ETH, or ERC20 address</small>
                </div>

                {/* Ticket Price */}
                <div className="form-group">
                  <label>Ticket Price</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(e.target.value)}
                    placeholder="0.01"
                    disabled={isApprovalPending || isCreating}
                  />
                </div>

                {/* Max Cap */}
                <div className="form-group">
                  <label>Maximum Tickets</label>
                  <input
                    type="number"
                    value={maxCap}
                    onChange={(e) => setMaxCap(e.target.value)}
                    placeholder="100"
                    disabled={isApprovalPending || isCreating}
                  />
                </div>

                {/* Duration */}
                <div className="form-group">
                  <label>Duration (Days)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="7"
                    disabled={isApprovalPending || isCreating}
                  />
                </div>

                {/* Error Message */}
                {error && <div className="error-message">{error}</div>}

                {/* Approval Section */}
                {needsApprovalFlag && (
                  <div className="approval-section">
                    <h4>Step 1: Approve Prize Token</h4>
                    {isApproved ? (
                      <div className="approval-status approved">
                        <span>✓ Approved</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn-approve"
                        onClick={handleApprove}
                        disabled={isApprovalPending}
                      >
                        {isApprovalPending ? 'Approving...' : 'Approve Tokens'}
                      </button>
                    )}
                    {approvalHash && (
                      <small className="approval-hash">
                        Approval Hash: {approvalHash.slice(0, 10)}...
                      </small>
                    )}
                  </div>
                )}

                {/* Create Button */}
                <button
                  type="button"
                  className="btn-create"
                  onClick={handleCreateRaffle}
                  disabled={!canCreateRaffle || isCreating}
                >
                  {isCreating ? 'Creating Raffle...' : 'Create Raffle'}
                </button>
              </form>
            </div>

            {/* Transaction Receipt */}
            {createHash && <TransactionReceipt hash={createHash as any} />}
          </>
        )}
      </div>
    </>
  )
}
