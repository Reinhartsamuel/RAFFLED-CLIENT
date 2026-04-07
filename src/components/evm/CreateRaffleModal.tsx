/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from 'react'
import { useChainId } from 'wagmi'
import { parseUnits, type Address } from 'viem'
import { useCreateRaffleERC20, useCreateRaffleERC721 } from '../../hooks/useRaffleContract'
import { useTokenApproval, useTokenDecimals, useTokenBalance, useNFTApproval } from '../../hooks/useTokenApproval'
import { getRaffleManagerAddress, getMockUSDCAddress } from '../../config/evm.config'
import { BACKEND_URL, getAuthToken } from '../../config/index'
import { TransactionReceipt } from './TransactionReceipt'
import { PrizeType } from '../../types/evm.types'
import './CreateRaffleModal.css'

interface CreateRaffleModalProps {
  onClose: () => void
}

type ApprovalStep = 'not_started' | 'approving' | 'approved' | 'failed'
type CreateStep = 'idle' | 'pending' | 'success' | 'error'

export function CreateRaffleModal({ onClose }: CreateRaffleModalProps) {
  const chainId = useChainId()
  const raffleManagerAddress = getRaffleManagerAddress(chainId)

  // Prize type selector
  const [prizeType, setPrizeType] = useState<PrizeType>(PrizeType.ERC20)

  // Common form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [ticketPrice, setTicketPrice] = useState('')
  const [maxCap, setMaxCap] = useState('')
  const [duration, setDuration] = useState('') // in days

  // ERC-20 specific
  const [prizeAsset, setPrizeAsset] = useState<Address>(getMockUSDCAddress(chainId))
  const [prizeAmount, setPrizeAmount] = useState('')

  // ERC-721 specific
  const [nftAsset, setNftAsset] = useState<Address>('' as Address)
  const [tokenId, setTokenId] = useState('')

  // Payment token is always USDC (6 decimals) in RaffleManager3
  const paymentDecimals = 6

  // ERC-20 token info
  const prizeDecimals = useTokenDecimals(prizeType === PrizeType.ERC20 ? prizeAsset : undefined) || 18
  const { balance: prizeBalance } = useTokenBalance(prizeType === PrizeType.ERC20 ? prizeAsset : undefined)

  // ERC-20 approval
  const erc20Approval = useTokenApproval(
    prizeType === PrizeType.ERC20 ? prizeAsset : undefined,
    raffleManagerAddress as Address
  )

  // ERC-721 approval
  const tokenIdBigInt = tokenId && /^\d+$/.test(tokenId) ? BigInt(tokenId) : undefined
  const nftApproval = useNFTApproval(
    prizeType === PrizeType.ERC721 ? nftAsset || undefined : undefined,
    raffleManagerAddress as Address,
    tokenIdBigInt
  )

  // Approval UI state
  const [approvalStep, setApprovalStep] = useState<ApprovalStep>('not_started')
  const [approvalHash, setApprovalHash] = useState<string>('')

  // Create raffle hooks
  const { createRaffleERC20, isPending: isCreatingERC20 } = useCreateRaffleERC20()
  const { createRaffleERC721, isPending: isCreatingERC721 } = useCreateRaffleERC721()
  const isCreating = isCreatingERC20 || isCreatingERC721

  const [createStep, setCreateStep] = useState<CreateStep>('idle')
  const [createHash, setCreateHash] = useState<string>('')
  const [error, setError] = useState('')

  // Check if ERC-20 approval is needed
  const needsERC20Approval = useCallback(() => {
    if (prizeType !== PrizeType.ERC20 || !prizeAmount) return false
    try {
      const decimals = typeof prizeDecimals === 'number' ? prizeDecimals : 18
      const prizeAmountBig = parseUnits(prizeAmount, decimals)
      return !erc20Approval.hasAllowance(prizeAmountBig)
    } catch {
      return false
    }
  }, [prizeType, prizeAmount, prizeDecimals, erc20Approval])

  // Check if ERC-721 approval is needed
  const needsNFTApproval = useCallback(() => {
    if (prizeType !== PrizeType.ERC721 || !nftAsset || tokenIdBigInt === undefined) return false
    return !nftApproval.isApproved()
  }, [prizeType, nftAsset, tokenIdBigInt, nftApproval])

  const needsApproval = prizeType === PrizeType.ERC20 ? needsERC20Approval() : needsNFTApproval()

  // Handle approve
  const handleApprove = async () => {
    try {
      setError('')
      setApprovalStep('approving')

      let hash: string
      if (prizeType === PrizeType.ERC20) {
        if (!prizeAmount) { setError('Enter prize amount'); setApprovalStep('not_started'); return }
        const decimals = typeof prizeDecimals === 'number' ? prizeDecimals : 18
        hash = await erc20Approval.approve(prizeAmount, decimals)
      } else {
        if (!nftAsset || tokenIdBigInt === undefined) {
          setError('Enter NFT contract address and token ID')
          setApprovalStep('not_started')
          return
        }
        hash = await nftApproval.approveNFT()
      }

      setApprovalHash(hash)
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
      const body = new FormData()
      body.append('raffle_tx_hash', txHash)
      body.append('description', description || '')

      if (image) {
        body.append('image', image)
      }

      const token = getAuthToken()
      const res = await fetch(`${BACKEND_URL}/raffles`, {
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
    if (!title || !ticketPrice || !maxCap || !duration) {
      setError('Fill in all required fields')
      return
    }

    if (prizeType === PrizeType.ERC20 && (!prizeAsset || !prizeAmount)) {
      setError('Enter prize token address and amount')
      return
    }

    if (prizeType === PrizeType.ERC721 && (!nftAsset || !tokenId)) {
      setError('Enter NFT contract address and token ID')
      return
    }

    try {
      setError('')
      setCreateStep('pending')

      const durationSeconds = Number(duration) * 86400
      let hash: string

      if (prizeType === PrizeType.ERC20) {
        const prizeDecimalsNum = typeof prizeDecimals === 'number' ? prizeDecimals : 18
        hash = await createRaffleERC20({
          prizeAsset,
          prizeAmount,
          prizeDecimals: prizeDecimalsNum,
          ticketPrice,
          ticketDecimals: paymentDecimals,
          maxCap: Number(maxCap),
          duration: durationSeconds,
        })
      } else {
        hash = await createRaffleERC721({
          nftAsset,
          tokenId: BigInt(tokenId),
          ticketPrice,
          ticketDecimals: paymentDecimals,
          maxCap: Number(maxCap),
          duration: durationSeconds,
        })
      }

      setCreateHash(hash)
      setCreateStep('success')

      await postRaffleToBackend(hash)
    } catch (err: any) {
      console.error('Create raffle error:', err)
      setError(err.message || 'Failed to create raffle')
      setCreateStep('error')
    }
  }

  const isApprovalPending = approvalStep === 'approving' || erc20Approval.isPending || nftApproval.isPending
  const isApproved = approvalStep === 'approved'

  const canCreateRaffle =
    title &&
    ticketPrice &&
    maxCap &&
    duration &&
    (prizeType === PrizeType.ERC20
      ? prizeAsset && prizeAmount
      : nftAsset && tokenId) &&
    (!needsApproval || isApproved)

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

                {/* Prize Type Selector */}
                <div className="form-group">
                  <label>Prize Type *</label>
                  <div className="prize-type-selector">
                    <button
                      type="button"
                      className={`prize-type-btn ${prizeType === PrizeType.ERC20 ? 'active' : ''}`}
                      onClick={() => { setPrizeType(PrizeType.ERC20); setApprovalStep('not_started') }}
                      disabled={isApprovalPending || isCreating}
                    >
                      ERC-20 Token
                    </button>
                    <button
                      type="button"
                      className={`prize-type-btn ${prizeType === PrizeType.ERC721 ? 'active' : ''}`}
                      onClick={() => { setPrizeType(PrizeType.ERC721); setApprovalStep('not_started') }}
                      disabled={isApprovalPending || isCreating}
                    >
                      NFT (ERC-721)
                    </button>
                  </div>
                </div>

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

                {/* ERC-20 Prize Fields */}
                {prizeType === PrizeType.ERC20 && (
                  <>
                    <div className="form-group">
                      <label>Prize Token Address *</label>
                      <input
                        type="text"
                        value={prizeAsset}
                        onChange={(e) => setPrizeAsset(e.target.value as Address)}
                        placeholder="0x..."
                        disabled={isApprovalPending || isCreating}
                      />
                      <small>Default: MockUSDC on {chainId === 84532 ? 'Base Sepolia' : 'Base'}</small>
                    </div>

                    <div className="form-group">
                      <label>Prize Amount *</label>
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
                  </>
                )}

                {/* ERC-721 Prize Fields */}
                {prizeType === PrizeType.ERC721 && (
                  <>
                    <div className="form-group">
                      <label>NFT Contract Address *</label>
                      <input
                        type="text"
                        value={nftAsset}
                        onChange={(e) => setNftAsset(e.target.value as Address)}
                        placeholder="0x..."
                        disabled={isApprovalPending || isCreating}
                      />
                    </div>

                    <div className="form-group">
                      <label>Token ID *</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={tokenId}
                        onChange={(e) => setTokenId(e.target.value)}
                        placeholder="42"
                        disabled={isApprovalPending || isCreating}
                      />
                      <small>The token ID of the NFT you want to raffle</small>
                    </div>
                  </>
                )}

                {/* Ticket Price — always in USDC */}
                <div className="form-group">
                  <label>Ticket Price (USDC) *</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(e.target.value)}
                    placeholder="1"
                    disabled={isApprovalPending || isCreating}
                  />
                  <small>Tickets are always paid in USDC</small>
                </div>

                {/* Max Cap */}
                <div className="form-group">
                  <label>Maximum Tickets *</label>
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
                  <label>Duration (Days) *</label>
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
                {needsApproval && (
                  <div className="approval-section">
                    <h4>
                      Step 1: {prizeType === PrizeType.ERC20 ? 'Approve Prize Token' : 'Approve NFT Transfer'}
                    </h4>
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
                        {isApprovalPending ? 'Approving...' : prizeType === PrizeType.ERC20 ? 'Approve Tokens' : 'Approve NFT'}
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
