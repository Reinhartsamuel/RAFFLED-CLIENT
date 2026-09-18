/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from 'react'
import { useChainId } from 'wagmi'
import { parseUnits, type Address } from 'viem'
import { useCreateRaffleERC20, useCreateRaffleERC721 } from '../../hooks/useRaffleContract'
import { useTokenApproval, useTokenDecimals, useTokenBalance, useNFTApproval } from '../../hooks/useTokenApproval'
import { getRaffleManagerAddress, getMockUSDCAddress } from '../../config/evm.config'
import { API_URL, getAuthToken, apiFetch } from '../../config/index'
import { TransactionReceipt } from './TransactionReceipt'
import { PrizeType } from '../../types/evm.types'
import './CreateRaffleModal.css'

// ─── Preset coins ────────────────────────────────────────────────────────────

interface PresetCoin {
  symbol: string
  name: string
  address: string // Robinhood Chain testnet (46630); mainnet (4663) commented per token
  icon: string    // inline SVG or URL
}

// Preset assets for Robinhood Chain (robinhood-first: tokenized stocks).
//
// Every address below is the Robinhood Chain TESTNET contract (chainId 46630).
// The matching MAINNET address (chainId 4663) is kept in a comment directly
// below each one.
//
// TODO: REMOVE THIS BEFORE MAINNET LAUNCH — when deploying to Robinhood Chain
// mainnet, replace every testnet `address` with its commented mainnet address.
//
// Canonical sources (verified):
//   - Stocks:    https://api.robinhood.com/rhj/assets  (Robinhood's own registry)
//   - WETH/USDG: https://docs.robinhood.com/chain/contracts/
//
// Tokens removed because they have NO canonical Robinhood Chain deployment
// (only unrelated/spam ERC-20s share the ticker): BNB, WBTC, SOL, XRP, HYPE.
const PRESET_COINS: PresetCoin[] = [
  // ── Tokenized stocks ─────────────────────────────────────────────────────
  {
    symbol: 'AMD',
    name: 'AMD • Robinhood Token',
    // Robinhood Chain Testnet (46630)
    address: '0x71178BAc73cBeb415514eB542a8995b82669778d',
    // TODO: REMOVE THIS BEFORE MAINNET LAUNCH — mainnet (4663): 0x86923f96303D656E4aa86D9d42D1e57ad2023fdC
    icon: '/stocks/amd.svg',
  },
  {
    symbol: 'AMZN',
    name: 'Amazon • Robinhood Token',
    // Robinhood Chain Testnet (46630)
    address: '0x5884aD2f920c162CFBbACc88C9C51AA75eC09E02',
    // TODO: REMOVE THIS BEFORE MAINNET LAUNCH — mainnet (4663): 0x12f190a9F9d7D37a250758b26824B97CE941bF54
    icon: '/stocks/amzn.svg',
  },
  {
    symbol: 'NFLX',
    name: 'Netflix • Robinhood Token',
    // Robinhood Chain Testnet (46630)
    address: '0x3b8262A63d25f0477c4DDE23F83cfe22Cb768C93',
    // TODO: REMOVE THIS BEFORE MAINNET LAUNCH — mainnet (4663): 0xE0444EF8BF4eD74f74FD73686e2ddF4C1c5591E8
    icon: '/stocks/nflx.svg',
  },
  {
    symbol: 'PLTR',
    name: 'Palantir Technologies • Robinhood Token',
    // Robinhood Chain Testnet (46630)
    address: '0x1FBE1a0e43594b3455993B5dE5Fd0A7A266298d0',
    // TODO: REMOVE THIS BEFORE MAINNET LAUNCH — mainnet (4663): 0x894E1EC2D74FFE5AEF8Dc8A9e84686acCB964F2A
    icon: '/stocks/pltr.svg',
  },
  {
    symbol: 'TSLA',
    name: 'Tesla • Robinhood Token',
    // Robinhood Chain Testnet (46630)
    address: '0xC9f9c86933092BbbfFF3CCb4b105A4A94bf3Bd4E',
    // TODO: REMOVE THIS BEFORE MAINNET LAUNCH — mainnet (4663): 0x322F0929c4625eD5bAd873c95208D54E1c003b2d
    icon: '/stocks/tsla.svg',
  },
  // ── Canonical base assets ────────────────────────────────────────────────
  {
    symbol: 'ETH',
    name: 'Wrapped Ether',
    // Robinhood Chain Testnet (46630)
    address: '0x33e4191705c386532ba27cBF171Db86919200B94',
    // TODO: REMOVE THIS BEFORE MAINNET LAUNCH — mainnet (4663): 0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><g fill="none"><circle cx="16" cy="16" r="16" fill="%23627EEA"/><path d="M16.498 4v8.87l7.497 3.35z" fill="%23fff" opacity=".6"/><path d="M16.498 4L9 16.22l7.498-3.35z" fill="%23fff"/><path d="M16.498 21.968v6.027L24 17.616z" fill="%23fff" opacity=".6"/><path d="M16.498 27.995v-6.028L9 17.616z" fill="%23fff"/><path d="M16.498 20.573l7.497-4.353-7.497-3.348z" fill="%23fff" opacity=".2"/><path d="M9 16.22l7.498 4.353v-7.701z" fill="%23fff" opacity=".6"/></g></svg>',
  },
  {
    // USDC — address filled dynamically from getMockUSDCAddress(chainId)
    symbol: 'USDC',
    name: 'USD Coin',
    address: '',
    icon: '/USDC.svg',
  },
  {
    symbol: 'Custom',
    name: 'Custom Token',
    address: '',
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="%231f1f1f" stroke="%23444" stroke-width="1"/><text x="50%25" y="55%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="18" fill="%23888">?</text></svg>',
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

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

  // Coin preset selection
  const [selectedCoin, setSelectedCoin] = useState<string>('TSLA')

  // Common form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [ticketPrice, setTicketPrice] = useState('')
  const [maxCap, setMaxCap] = useState('')
  const [duration, setDuration] = useState('')

  // ERC-20 specific
  const usdcAddress = getMockUSDCAddress(chainId)
  const [prizeAsset, setPrizeAsset] = useState<Address>(
    // Robinhood Chain testnet (46630). TODO: REMOVE THIS BEFORE MAINNET LAUNCH — mainnet: 0x322F0929c4625eD5bAd873c95208D54E1c003b2d
    '0xC9f9c86933092BbbfFF3CCb4b105A4A94bf3Bd4E' as Address
  )
  const [prizeAmount, setPrizeAmount] = useState('')

  // ERC-721 specific
  const [nftAsset, setNftAsset] = useState<Address>('' as Address)
  const [tokenId, setTokenId] = useState('')

  const paymentDecimals = 6

  const prizeDecimals = useTokenDecimals(prizeType === PrizeType.ERC20 ? prizeAsset : undefined) || 18
  const { balance: prizeBalance } = useTokenBalance(prizeType === PrizeType.ERC20 ? prizeAsset : undefined)

  const erc20Approval = useTokenApproval(
    prizeType === PrizeType.ERC20 ? prizeAsset : undefined,
    raffleManagerAddress as Address
  )

  const tokenIdBigInt = tokenId && /^\d+$/.test(tokenId) ? BigInt(tokenId) : undefined
  const nftApproval = useNFTApproval(
    prizeType === PrizeType.ERC721 ? nftAsset || undefined : undefined,
    raffleManagerAddress as Address,
    tokenIdBigInt
  )

  const [approvalStep, setApprovalStep] = useState<ApprovalStep>('not_started')
  const [approvalHash, setApprovalHash] = useState<string>('')

  const { createRaffleERC20, isPending: isCreatingERC20 } = useCreateRaffleERC20()
  const { createRaffleERC721, isPending: isCreatingERC721 } = useCreateRaffleERC721()
  const isCreating = isCreatingERC20 || isCreatingERC721

  const [createStep, setCreateStep] = useState<CreateStep>('idle')
  const [createHash, setCreateHash] = useState<string>('')
  const [error, setError] = useState('')

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

  const needsNFTApproval = useCallback(() => {
    if (prizeType !== PrizeType.ERC721 || !nftAsset || tokenIdBigInt === undefined) return false
    return !nftApproval.isApproved()
  }, [prizeType, nftAsset, tokenIdBigInt, nftApproval])

  const needsApproval = prizeType === PrizeType.ERC20 ? needsERC20Approval() : needsNFTApproval()

  // When a coin preset is selected, update prizeAsset accordingly
  const handleSelectCoin = (coin: PresetCoin) => {
    setSelectedCoin(coin.symbol)
    setApprovalStep('not_started')
    if (coin.symbol === 'USDC') {
      setPrizeAsset(usdcAddress)
    } else if (coin.symbol !== 'Custom') {
      setPrizeAsset(coin.address as Address)
    } else {
      setPrizeAsset('' as Address)
    }
  }

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

  const postRaffleToBackend = async (txHash: string) => {
    try {
      const body = new FormData()
      body.append('raffle_tx_hash', txHash)
      body.append('description', description || '')
      if (image) body.append('image', image)

      const token = getAuthToken()
      const res = await apiFetch(`${API_URL}/raffles`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          Accept: 'application/json',
        },
        body,
      })

      const data = await res.json()
      if (!res.ok) console.error('Backend API error:', data)
      else console.log('Raffle posted to backend:', data)
      return data
    } catch (err) {
      console.error('Failed to POST raffle to backend:', err)
    }
  }

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

  const isLocked = isApprovalPending || isCreating

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content create-raffle-modal">
        <div className="modal-header">
          <h2 className="modal-title">Create Raffle</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">✕</button>
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

                {/* ── Prize Type Picker ── */}
                <div className="form-group">
                  <label>Prize Type *</label>
                  <div className="type-picker">
                    <button
                      type="button"
                      className={`type-picker-card ${prizeType === PrizeType.ERC20 ? 'active' : ''}`}
                      onClick={() => { setPrizeType(PrizeType.ERC20); setApprovalStep('not_started') }}
                      disabled={isLocked}
                    >
                      <svg className="type-picker-icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="24" cy="24" r="20" fill="currentColor" opacity="0.12"/>
                        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        <text x="24" y="29" textAnchor="middle" fontSize="16" fontWeight="700" fontFamily="monospace" fill="currentColor">$</text>
                      </svg>
                      <span className="type-picker-label">Coin</span>
                      <span className="type-picker-sub">ERC-20 Token</span>
                    </button>

                    <button
                      type="button"
                      className={`type-picker-card ${prizeType === PrizeType.ERC721 ? 'active' : ''}`}
                      onClick={() => { setPrizeType(PrizeType.ERC721); setApprovalStep('not_started') }}
                      disabled={isLocked}
                    >
                      <svg className="type-picker-icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="8" y="10" width="32" height="28" rx="4" fill="currentColor" opacity="0.12"/>
                        <rect x="8" y="10" width="32" height="28" rx="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        <circle cx="18" cy="22" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        <path d="M8 32l8-6 6 5 6-7 10 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="type-picker-label">NFT</span>
                      <span className="type-picker-sub">ERC-721</span>
                    </button>
                  </div>
                </div>

                {/* ── Coin preset picker (only for ERC-20) ── */}
                {prizeType === PrizeType.ERC20 && (
                  <div className="form-group">
                    <label>Select Token *</label>
                    <div className="coin-picker">
                      {PRESET_COINS.map((coin) => (
                        <button
                          key={coin.symbol}
                          type="button"
                          className={`coin-card ${selectedCoin === coin.symbol ? 'active' : ''}`}
                          onClick={() => handleSelectCoin(coin)}
                          disabled={isLocked}
                        >
                          <img
                            src={coin.icon}
                            alt={coin.symbol}
                            className="coin-icon"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                          <span className="coin-symbol">{coin.symbol}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── ERC-20 Prize Fields ── */}
                {prizeType === PrizeType.ERC20 && (
                  <>
                    {/* Custom token address (only shown when Custom is selected) */}
                    {selectedCoin === 'Custom' && (
                      <div className="form-group">
                        <label>Token Address *</label>
                        <input
                          type="text"
                          value={prizeAsset}
                          onChange={(e) => setPrizeAsset(e.target.value as Address)}
                          placeholder="0x..."
                          disabled={isLocked}
                        />
                      </div>
                    )}

                    <div className="form-group">
                      <label>Prize Amount *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={prizeAmount}
                        onChange={(e) => setPrizeAmount(e.target.value)}
                        placeholder="100"
                        disabled={isLocked}
                      />
                      {prizeBalance !== undefined && prizeBalance !== BigInt(0) && (
                        <small>
                          Balance: {(Number(prizeBalance) / 10 ** (typeof prizeDecimals === 'number' ? prizeDecimals : 18)).toFixed(4)}
                        </small>
                      )}
                    </div>
                  </>
                )}

                {/* ── ERC-721 Prize Fields ── */}
                {prizeType === PrizeType.ERC721 && (
                  <>
                    <div className="form-group">
                      <label>NFT Contract Address *</label>
                      <input
                        type="text"
                        value={nftAsset}
                        onChange={(e) => setNftAsset(e.target.value as Address)}
                        placeholder="0x..."
                        disabled={isLocked}
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
                        disabled={isLocked}
                      />
                      <small>The token ID of the NFT you want to raffle</small>
                    </div>
                  </>
                )}

                {/* ── Title ── */}
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="My Awesome Raffle"
                    disabled={isLocked}
                  />
                </div>

                {/* ── Description ── */}
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what you're raffling..."
                    rows={3}
                    disabled={isLocked}
                  />
                </div>

                {/* ── Image ── */}
                <div className="form-group">
                  <label>Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files?.[0] || null)}
                    disabled={isLocked}
                  />
                </div>

                {/* ── Ticket Price ── */}
                <div className="form-group">
                  <label>Ticket Price (USDC) *</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(e.target.value)}
                    placeholder="1"
                    disabled={isLocked}
                  />
                  <small>Tickets are always paid in USDC</small>
                </div>

                {/* ── Max Cap ── */}
                <div className="form-group">
                  <label>Maximum Tickets *</label>
                  <input
                    type="number"
                    value={maxCap}
                    onChange={(e) => setMaxCap(e.target.value)}
                    placeholder="100"
                    disabled={isLocked}
                  />
                </div>

                {/* ── Duration ── */}
                <div className="form-group">
                  <label>Duration (Days) *</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="7"
                    disabled={isLocked}
                  />
                </div>

                {error && <div className="error-message">{error}</div>}

                {/* ── Approval Section ── */}
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
                        {isApprovalPending
                          ? 'Approving...'
                          : prizeType === PrizeType.ERC20 ? 'Approve Tokens' : 'Approve NFT'}
                      </button>
                    )}
                    {approvalHash && (
                      <small className="approval-hash">
                        Approval Hash: {approvalHash.slice(0, 10)}...
                      </small>
                    )}
                  </div>
                )}

                {/* ── Create Button ── */}
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

            {createHash && <TransactionReceipt hash={createHash as any} />}
          </>
        )}
      </div>
    </>
  )
}
