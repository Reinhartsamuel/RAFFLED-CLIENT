import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChainId } from 'wagmi'
import { parseUnits, type Address } from 'viem'
import { motion } from 'framer-motion'
import { useCreateRaffleERC20, useCreateRaffleERC721 } from '../hooks/useRaffleContract'
import { useTokenApproval, useTokenDecimals, useTokenBalance, useNFTApproval } from '../hooks/useTokenApproval'
import { getRaffleManagerAddress, getMockUSDCAddress } from '../config/evm.config'
import { BACKEND_URL, getAuthToken, apiFetch } from '../config/index'
import { TransactionReceipt } from '../components/evm/TransactionReceipt'
import { PrizeType } from '../types/evm.types'
import '../components/evm/CreateRaffleModal.css'

interface PresetCoin {
  symbol: string
  name: string
  address: string
  icon: string
}

const PRESET_COINS: PresetCoin[] = [
  {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    address: '0x1ceA84203673764244E05693e42E6Ace62bE9BA5',
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="%23F7931A"/><path d="M22.56 14.17c.31-2.07-1.27-3.18-3.43-3.93l.7-2.8-1.71-.43-.68 2.72c-.45-.11-.91-.22-1.37-.32l.69-2.74-1.71-.43-.7 2.8c-.37-.08-.73-.17-1.08-.26v-.01l-2.36-.59-.45 1.82s1.27.29 1.24.31c.69.17.82.63.8 1l-.8 3.21c.05.01.11.03.17.06l-.17-.04-1.12 4.49c-.08.21-.29.52-.76.4.02.03-1.24-.31-1.24-.31l-.85 1.95 2.23.56c.41.1.82.21 1.22.31l-.71 2.84 1.71.43.7-2.81c.47.13.93.24 1.38.35l-.7 2.79 1.71.43.71-2.83c2.93.55 5.13.33 6.06-2.32.75-2.13-.04-3.36-1.58-4.16 1.12-.26 1.97-1 2.19-2.53zm-3.92 5.5c-.53 2.13-4.12.98-5.28.69l.94-3.77c1.16.29 4.88.86 4.34 3.08zm.53-5.53c-.49 1.94-3.48.96-4.46.71l.85-3.42c.98.25 4.13.71 3.61 2.71z" fill="%23fff"/></svg>',
  },
  {
    symbol: 'BNB',
    name: 'BNB',
    address: '0xeCDFa7Ba60Bd2D0e7B2278E4B17F27df9Fe2D7a0',
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="%23F3BA2F"/><path d="M12.116 13.515L16 9.63l3.886 3.886 2.26-2.26L16 5.11l-6.144 6.144 2.26 2.26zM5.11 16l2.26-2.26 2.26 2.26-2.26 2.26L5.11 16zm7.006.884L16 20.769l3.884-3.885 2.261 2.259L16 25.285l-6.144-6.142-.003-.003 2.263-2.256zm9.513-.884l2.26-2.26 2.26 2.26-2.26 2.26-2.26-2.26zM18.292 16l-2.29-2.291L14 15.706l-.239.238-.488.488-.003.003.003.003L16 18.729l2.292-2.291.001-.438z" fill="%23fff"/></svg>',
  },
  {
    symbol: 'XRP',
    name: 'XRP',
    address: '0x2615a94df961278dcbc41fb0a54fec5f10a693ae',
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="%23346AA9"/><path d="M22.5 8h2.8l-6 5.9a4.6 4.6 0 01-6.6 0L6.7 8h2.8l4.6 4.5a2.8 2.8 0 004 0L22.5 8zM9.5 24H6.7l6-5.9a4.6 4.6 0 016.6 0l6 5.9h-2.8l-4.6-4.5a2.8 2.8 0 00-4 0L9.5 24z" fill="%23fff"/></svg>',
  },
  {
    symbol: 'HYPE',
    name: 'Hyperliquid',
    address: '0x15d0e0c55a3e7ee67152ad7e89acf164253ff68d',
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="%230c0c15"/><path d="M9 10h3.5v5h7V10H23v12h-3.5v-4.5h-7V22H9V10z" fill="%2300FF8C"/></svg>',
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    address: '0x311935Cd80B76769bF2ecC9D8Ab7635b2139cf82',
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="%239945FF"/><path d="M9.5 20.5h13.3l-2.3 2.5H7.2l2.3-2.5zm0-5.5h13.3l-2.3 2.5H7.2L9.5 15zm11-5.5H7.2l2.3-2.5h13.3l-2.3 2.5z" fill="%2300FFA3"/></svg>',
  },
  {
    symbol: 'ETH',
    name: 'Wrapped Ether',
    address: '0x4200000000000000000000000000000000000006',
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><g fill="none"><circle cx="16" cy="16" r="16" fill="%23627EEA"/><path d="M16.498 4v8.87l7.497 3.35z" fill="%23fff" opacity=".6"/><path d="M16.498 4L9 16.22l7.498-3.35z" fill="%23fff"/><path d="M16.498 21.968v6.027L24 17.616z" fill="%23fff" opacity=".6"/><path d="M16.498 27.995v-6.028L9 17.616z" fill="%23fff"/><path d="M16.498 20.573l7.497-4.353-7.497-3.348z" fill="%23fff" opacity=".2"/><path d="M9 16.22l7.498 4.353v-7.701z" fill="%23fff" opacity=".6"/></g></svg>',
  },
  {
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

type ApprovalStep = 'not_started' | 'approving' | 'approved' | 'failed'
type CreateStep = 'idle' | 'pending' | 'success' | 'error'
type WizardStep = 'asset_details' | 'mechanics' | 'review'

export default function CreateRafflePage() {
  const navigate = useNavigate()
  const chainId = useChainId()
  const raffleManagerAddress = getRaffleManagerAddress(chainId)

  const [wizardStep, setWizardStep] = useState<WizardStep>('asset_details')
  const [prizeType, setPrizeType] = useState<PrizeType>(PrizeType.ERC20)
  const [selectedCoin, setSelectedCoin] = useState<string>('WBTC')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    if (image) {
      const url = URL.createObjectURL(image)
      setImagePreview(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setImagePreview(null)
    }
  }, [image])

  const [ticketPrice, setTicketPrice] = useState('')
  const [maxCap, setMaxCap] = useState('')
  const [duration, setDuration] = useState('')

  const usdcAddress = getMockUSDCAddress(chainId)
  const [prizeAsset, setPrizeAsset] = useState<Address>('0x1ceA84203673764244E05693e42E6Ace62bE9BA5' as Address)
  const [prizeAmount, setPrizeAmount] = useState('')
  const [nftAsset, setNftAsset] = useState<Address>('' as Address)
  const [tokenId, setTokenId] = useState('')

  const paymentDecimals = 6
  const prizeDecimals = useTokenDecimals(prizeType === PrizeType.ERC20 ? prizeAsset : undefined) || 18
  const { balance: prizeBalance } = useTokenBalance(prizeType === PrizeType.ERC20 ? prizeAsset : undefined)

  const erc20Approval = useTokenApproval(prizeType === PrizeType.ERC20 ? prizeAsset : undefined, raffleManagerAddress as Address)

  const tokenIdBigInt = tokenId && /^\d+$/.test(tokenId) ? BigInt(tokenId) : undefined
  const nftApproval = useNFTApproval(prizeType === PrizeType.ERC721 ? nftAsset || undefined : undefined, raffleManagerAddress as Address, tokenIdBigInt)

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
    } catch { return false }
  }, [prizeType, prizeAmount, prizeDecimals, erc20Approval])

  const needsNFTApproval = useCallback(() => {
    if (prizeType !== PrizeType.ERC721 || !nftAsset || tokenIdBigInt === undefined) return false
    return !nftApproval.isApproved()
  }, [prizeType, nftAsset, tokenIdBigInt, nftApproval])

  const needsApproval = prizeType === PrizeType.ERC20 ? needsERC20Approval() : needsNFTApproval()

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
      const res = await apiFetch(`${BACKEND_URL}/raffles`, {
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
  const canCreateRaffle = title && ticketPrice && maxCap && duration && (prizeType === PrizeType.ERC20 ? prizeAsset && prizeAmount : nftAsset && tokenId) && (!needsApproval || isApproved)
  const isLocked = isApprovalPending || isCreating

  const stepConfig = [
    { id: 'asset_details' as WizardStep, label: 'ASSET_DETAILS' },
    { id: 'mechanics' as WizardStep, label: 'MECHANICS' },
    { id: 'review' as WizardStep, label: 'REVIEW' },
  ]

  const currentStepIndex = stepConfig.findIndex(s => s.id === wizardStep)

  return (
    <>
      {createStep === 'success' ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-xl mx-auto p-4 md:p-8">
          <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[#22C55E]/10 border-2 border-[#22C55E] flex items-center justify-center mx-auto mb-5">
              <span className="text-3xl text-[#22C55E]">✓</span>
            </div>
            <h2 className="font-sans font-bold text-xl text-[#F5F5F5] mb-2">Raffle Created Successfully!</h2>
            <p className="font-mono text-xs text-[#555555] mb-6">Your raffle is now live on the blockchain.</p>
            {createHash && <TransactionReceipt hash={createHash as any} />}
            <button onClick={() => navigate('/app')} className="mt-5 px-6 py-2.5 bg-[#FFB800] hover:bg-[#FFCC33] text-[#050505] font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-all">View Raffles</button>
          </div>
        </motion.div>
      ) : (
        <div className="p-4 md:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="font-sans font-bold text-xl md:text-2xl text-[#F5F5F5]">Create Raffle</h1>
              <p className="font-mono text-xs text-[#555555] mt-0.5">Configure your decentralized raffle parameters</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] text-[#555555]">STATUS: DRAFTING</p>
              <p className="font-mono text-[10px] text-[#FFB800]">PROTOCOL VERSION: 1.0.4</p>
            </div>
          </div>

          <div className="flex items-center mb-6 md:mb-8 overflow-x-auto pb-2">
            {stepConfig.map((step, index) => (
              <div key={step.id} className="flex items-center flex-shrink-0">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center font-mono text-xs md:text-sm font-bold flex-shrink-0 ${index <= currentStepIndex ? 'bg-[#FFB800] text-[#050505]' : 'bg-[#1a1a1a] text-[#555555]'}`}>
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <span className={`font-mono text-[10px] md:text-xs uppercase tracking-wider whitespace-nowrap ${index <= currentStepIndex ? 'text-[#FFB800]' : 'text-[#555555]'}`}>{step.label}</span>
                </div>
                {index < stepConfig.length - 1 && <div className={`w-8 md:w-16 h-px mx-2 md:mx-4 ${index < currentStepIndex ? 'bg-[#FFB800]' : 'bg-[#1f1f1f]'}`} />}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
            <div className="lg:col-span-8 space-y-4 md:space-y-5">
              <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl">
                <div className="px-4 py-4 md:px-6 md:py-5 border-b border-[#1f1f1f]">
                  <h3 className="font-mono text-sm md:text-base font-bold text-[#FFB800] tracking-wider flex items-center gap-2">
                    <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
                    ASSET_SPECIFICATION
                  </h3>
                </div>
                <div className="p-4 md:p-6 space-y-5">
                  {/* Prize Type Picker (matching CreateRaffleModal) */}
                  <div>
                    <label className="font-mono text-[10px] md:text-xs font-bold text-[#555555] uppercase tracking-wider block mb-2">Prize Type *</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        className={`flex-1 flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition-all ${prizeType === PrizeType.ERC20 ? 'border-[#FFB800] bg-[#FFB800]/[0.06] text-[#FFB800] shadow-[0_0_0_1px_#FFB800,0_0_12px_rgba(255,184,0,0.12)]' : 'border-[#1f1f1f] bg-[#111111] text-[#555555] hover:border-[#444] hover:text-[#aaa]'}`}
                        onClick={() => { setPrizeType(PrizeType.ERC20); setApprovalStep('not_started') }}
                        disabled={isLocked}
                      >
                        <svg className="w-9 h-9" viewBox="0 0 48 48" fill="none">
                          <circle cx="24" cy="24" r="20" fill="currentColor" opacity="0.12"/>
                          <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                          <text x="24" y="29" textAnchor="middle" fontSize="16" fontWeight="700" fontFamily="monospace" fill="currentColor">$</text>
                        </svg>
                        <span className="font-mono text-xs font-bold uppercase tracking-wider">Coin</span>
                        <span className="font-mono text-[9px] uppercase opacity-60">ERC-20 Token</span>
                      </button>
                      <button
                        type="button"
                        className={`flex-1 flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition-all ${prizeType === PrizeType.ERC721 ? 'border-[#FFB800] bg-[#FFB800]/[0.06] text-[#FFB800] shadow-[0_0_0_1px_#FFB800,0_0_12px_rgba(255,184,0,0.12)]' : 'border-[#1f1f1f] bg-[#111111] text-[#555555] hover:border-[#444] hover:text-[#aaa]'}`}
                        onClick={() => { setPrizeType(PrizeType.ERC721); setApprovalStep('not_started') }}
                        disabled={isLocked}
                      >
                        <svg className="w-9 h-9" viewBox="0 0 48 48" fill="none">
                          <rect x="8" y="10" width="32" height="28" rx="4" fill="currentColor" opacity="0.12"/>
                          <rect x="8" y="10" width="32" height="28" rx="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                          <circle cx="18" cy="22" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                          <path d="M8 32l8-6 6 5 6-7 10 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="font-mono text-xs font-bold uppercase tracking-wider">NFT</span>
                        <span className="font-mono text-[9px] uppercase opacity-60">ERC-721</span>
                      </button>
                    </div>
                  </div>

                  {/* Coin Picker (matching CreateRaffleModal) */}
                  {prizeType === PrizeType.ERC20 && (
                    <div>
                      <label className="font-mono text-[10px] md:text-xs font-bold text-[#555555] uppercase tracking-wider block mb-2">Select Token *</label>
                      <div className="flex flex-wrap gap-2">
                        {PRESET_COINS.map((coin) => (
                          <button
                            key={coin.symbol}
                            type="button"
                            className={`flex flex-col items-center gap-1 p-2.5 min-w-[60px] flex-1 max-w-[80px] rounded-lg border-2 transition-all ${selectedCoin === coin.symbol ? 'border-[#FFB800] bg-[#FFB800]/[0.06] text-[#FFB800] shadow-[0_0_0_1px_#FFB800,0_0_10px_rgba(255,184,0,0.1)]' : 'border-[#1f1f1f] bg-[#111111] text-[#666] hover:border-[#444] hover:text-[#bbb]'}`}
                            onClick={() => handleSelectCoin(coin)}
                            disabled={isLocked}
                          >
                            <img src={coin.icon} alt={coin.symbol} className="w-7 h-7 rounded-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">{coin.symbol}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom Token Address */}
                  {prizeType === PrizeType.ERC20 && selectedCoin === 'Custom' && (
                    <div>
                      <label className="font-mono text-[10px] md:text-xs font-bold text-[#555555] uppercase tracking-wider block mb-1.5">Token Address *</label>
                      <input type="text" value={prizeAsset} onChange={(e) => setPrizeAsset(e.target.value as Address)} placeholder="0x..." className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2.5 md:px-4 md:py-3 font-mono text-xs md:text-sm text-[#F5F5F5] placeholder-[#333333] focus:border-[#FFB800] focus:outline-none transition-colors" />
                    </div>
                  )}

                  {/* Prize Amount (ERC20) */}
                  {prizeType === PrizeType.ERC20 && (
                    <div>
                      <label className="font-mono text-[10px] md:text-xs font-bold text-[#555555] uppercase tracking-wider block mb-1.5">Prize Amount *</label>
                      <input type="number" step="0.01" value={prizeAmount} onChange={(e) => setPrizeAmount(e.target.value)} placeholder="100" className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2.5 md:px-4 md:py-3 font-mono text-xs md:text-sm text-[#F5F5F5] placeholder-[#333333] focus:border-[#FFB800] focus:outline-none transition-colors" />
                      {prizeBalance !== undefined && prizeBalance !== BigInt(0) && (
                        <p className="font-mono text-[10px] text-[#333333] mt-1">Balance: {(Number(prizeBalance) / 10 ** (typeof prizeDecimals === 'number' ? prizeDecimals : 18)).toFixed(4)}</p>
                      )}
                    </div>
                  )}

                  {/* NFT Contract Address */}
                  {prizeType === PrizeType.ERC721 && (
                    <div>
                      <label className="font-mono text-[10px] md:text-xs font-bold text-[#555555] uppercase tracking-wider block mb-1.5">NFT Contract Address *</label>
                      <input type="text" value={nftAsset} onChange={(e) => setNftAsset(e.target.value as Address)} placeholder="0x..." className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2.5 md:px-4 md:py-3 font-mono text-xs md:text-sm text-[#F5F5F5] placeholder-[#333333] focus:border-[#FFB800] focus:outline-none transition-colors" />
                    </div>
                  )}

                  {/* Token ID (NFT) */}
                  {prizeType === PrizeType.ERC721 && (
                    <div>
                      <label className="font-mono text-[10px] md:text-xs font-bold text-[#555555] uppercase tracking-wider block mb-1.5">Token ID *</label>
                      <input type="number" step="1" min="0" value={tokenId} onChange={(e) => setTokenId(e.target.value)} placeholder="42" className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2.5 md:px-4 md:py-3 font-mono text-xs md:text-sm text-[#F5F5F5] placeholder-[#333333] focus:border-[#FFB800] focus:outline-none transition-colors" />
                      <p className="font-mono text-[10px] text-[#333333] mt-1">The token ID of the NFT you want to raffle</p>
                    </div>
                  )}

                  {/* Prize Name */}
                  <div>
                    <label className="font-mono text-[10px] md:text-xs font-bold text-[#555555] uppercase tracking-wider block mb-1.5">Title *</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My Awesome Raffle" className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2.5 md:px-4 md:py-3 font-mono text-xs md:text-sm text-[#F5F5F5] placeholder-[#333333] focus:border-[#FFB800] focus:outline-none transition-colors" />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="font-mono text-[10px] md:text-xs font-bold text-[#555555] uppercase tracking-wider block mb-1.5">Description</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what you're raffling..." rows={3} className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2.5 md:px-4 md:py-3 font-mono text-xs md:text-sm text-[#F5F5F5] placeholder-[#333333] focus:border-[#FFB800] focus:outline-none transition-colors resize-none" />
                  </div>

                  {/* Image */}
                  <div>
                    <label className="font-mono text-[10px] md:text-xs font-bold text-[#555555] uppercase tracking-wider block mb-1.5">Image</label>
                    <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2.5 md:px-4 md:py-3 font-mono text-xs md:text-sm text-[#555555] focus:border-[#FFB800] focus:outline-none transition-colors file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#1f1f1f] file:text-[#F5F5F5] file:font-mono file:text-xs file:uppercase file:tracking-wider file:cursor-pointer hover:file:bg-[#2a2a2a]" />
                  </div>
                </div>
              </div>

              {/* Raffle Mechanics */}
              <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl">
                <div className="px-4 py-4 md:px-6 md:py-5 border-b border-[#1f1f1f]">
                  <h3 className="font-mono text-sm md:text-base font-bold text-[#F5F5F5] tracking-wider flex items-center gap-2">
                    <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2V6M12 18V22M6 12H2M22 12H18M19.07 4.93L16.24 7.76M7.76 16.24L4.93 19.07M19.07 19.07L16.24 16.24M7.76 7.76L4.93 4.93"/></svg>
                    RAFFLE_MECHANICS
                  </h3>
                </div>
                <div className="p-4 md:p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="font-mono text-[10px] md:text-xs font-bold text-[#555555] uppercase tracking-wider block mb-1.5">Ticket Price (USDC) *</label>
                      <input type="number" step="0.0001" value={ticketPrice} onChange={(e) => setTicketPrice(e.target.value)} placeholder="1" className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2.5 md:px-4 md:py-3 font-mono text-xs md:text-sm text-[#F5F5F5] placeholder-[#333333] focus:border-[#FFB800] focus:outline-none transition-colors" />
                      <p className="font-mono text-[10px] text-[#333333] mt-1">Tickets are always paid in USDC</p>
                    </div>
                    <div>
                      <label className="font-mono text-[10px] md:text-xs font-bold text-[#555555] uppercase tracking-wider block mb-1.5">Maximum Tickets *</label>
                      <input type="number" value={maxCap} onChange={(e) => setMaxCap(e.target.value)} placeholder="100" className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2.5 md:px-4 md:py-3 font-mono text-xs md:text-sm text-[#F5F5F5] placeholder-[#333333] focus:border-[#FFB800] focus:outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] md:text-xs font-bold text-[#555555] uppercase tracking-wider block mb-1.5">Duration (Days) *</label>
                      <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="7" className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2.5 md:px-4 md:py-3 font-mono text-xs md:text-sm text-[#F5F5F5] placeholder-[#333333] focus:border-[#FFB800] focus:outline-none transition-colors" />
                    </div>
                  </div>

                  {/* Approval Section (matching CreateRaffleModal) */}
                  {needsApproval && (
                    <div className="border border-[#FFB800]/25 p-4 bg-[#FFB800]/[0.04] rounded-xl">
                      <h4 className="font-mono text-xs font-bold text-[#FFB800] uppercase tracking-wider mb-3">
                        Step 1: {prizeType === PrizeType.ERC20 ? 'Approve Prize Token' : 'Approve NFT Transfer'}
                      </h4>
                      {isApproved ? (
                        <div className="flex items-center gap-2 p-3 bg-[#22C55E]/[0.06] border border-[#22C55E]/25 rounded-lg text-[#22C55E] font-mono text-xs font-bold uppercase">
                          <span>✓</span> Approved
                        </div>
                      ) : (
                        <button type="button" className="w-full p-3 bg-[#FFB800] border-none rounded-lg text-[#050505] font-mono text-xs font-bold uppercase tracking-wider cursor-pointer transition-all hover:bg-[#FFCC33] hover:shadow-[0_0_16px_rgba(255,184,0,0.3)] disabled:bg-[#111111] disabled:text-[#333333] disabled:cursor-not-allowed" onClick={handleApprove} disabled={isApprovalPending}>
                          {isApprovalPending ? 'Approving...' : prizeType === PrizeType.ERC20 ? 'Approve Tokens' : 'Approve NFT'}
                        </button>
                      )}
                      {approvalHash && <p className="font-mono text-[10px] text-[#333333] mt-2.5 break-all">Approval Hash: {approvalHash.slice(0, 10)}...</p>}
                    </div>
                  )}

                  {error && <div className="bg-[#EF4444]/[0.06] border border-[#EF4444]/30 rounded-lg p-3.5 font-mono text-xs text-[#EF4444] break-word">{error}</div>}
                </div>
              </div>

              {/* Community Tasks */}
              <div>
                <h4 className="font-mono text-[10px] md:text-xs font-bold text-[#555555] uppercase tracking-widest mb-4">COMMUNITY_TASK_PRESETS</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[{ icon: 'share-2', label: 'TWITTER_FOLLOW' }, { icon: 'users', label: 'DISCORD_JOIN' }, { icon: 'landmark', label: 'TOKEN_HOLDER' }, { icon: 'help-circle', label: 'CUSTOM_QUIZ' }].map(task => (
                    <div key={task.label} className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-4 text-center hover:border-[#FFB800]/30 transition-colors cursor-pointer group">
                      <svg className="w-5 h-5 text-[#555555] group-hover:text-[#FFB800] mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {task.icon === 'share-2' && <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>}
                        {task.icon === 'users' && <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>}
                        {task.icon === 'landmark' && <><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="22"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="18" y1="18" x2="18" y2="22"/><polygon points="12,2 2,8 22,8"/></>}
                        {task.icon === 'help-circle' && <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>}
                      </svg>
                      <span className="font-mono text-[10px] text-[#555555] group-hover:text-[#F5F5F5] uppercase tracking-wider">{task.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-4 space-y-4 md:space-y-5">
              <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-4">
                {image ? (
                  <div className="relative group">
                    <img src={URL.createObjectURL(image)} alt="Cover" className="w-full aspect-square object-cover rounded-lg border border-[#1f1f1f]" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center cursor-pointer" onClick={() => document.getElementById('cover-upload')?.click()}>
                      <svg className="w-8 h-8 text-[#FFB800]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setImage(null) }} className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-xs shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-[#1f1f1f] rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-[#FFB800]/50 hover:bg-[#FFB800]/5 transition-all group" onClick={() => document.getElementById('cover-upload')?.click()}>
                    <svg className="w-10 h-10 text-[#333333] group-hover:text-[#FFB800] mb-2 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <span className="font-mono text-[10px] font-bold text-[#555555] group-hover:text-[#FFB800] uppercase tracking-wider transition-colors">UPLOAD_ASSET_COVER</span>
                    <span className="font-mono text-[9px] text-[#333333] mt-1">PNG, JPG, MP4_MAX_100MB</span>
                  </div>
                )}
                <input id="cover-upload" type="file" accept="image/*,video/*" className="hidden" onChange={(e) => setImage(e.target.files?.[0] || null)} />
              </div>

              <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-4 md:p-5">
                <h4 className="font-mono text-xs font-bold text-[#FFB800] uppercase tracking-wider mb-4 pb-3 border-b border-[#1f1f1f]">LAUNCH_SUMMARY</h4>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] text-[#555555]">Title</span>
                    <span className="font-mono text-[10px] text-[#F5F5F5] text-right truncate max-w-[60%]">{title || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] text-[#555555]">Entry Price</span>
                    <span className="font-mono text-[10px] text-[#F5F5F5]">{ticketPrice ? `${ticketPrice} USDC` : '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] text-[#555555]">Max Entries</span>
                    <span className="font-mono text-[10px] text-[#F5F5F5]">{maxCap || 'UNLIMITED'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] text-[#555555]">Duration</span>
                    <span className="font-mono text-[10px] text-[#F5F5F5]">{duration ? `${duration} days` : '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] text-[#555555]">Prize Type</span>
                    <span className="font-mono text-[10px] text-[#F5F5F5]">{prizeType === PrizeType.ERC20 ? 'ERC20' : 'NFT'}</span>
                  </div>
                </div>
                <button type="button" onClick={handleCreateRaffle} disabled={!canCreateRaffle || isLocked} className="w-full mt-5 p-3.5 bg-[#FFB800] border-none rounded-lg text-[#050505] font-mono text-sm font-bold uppercase tracking-wider cursor-pointer transition-all hover:bg-[#FFCC33] hover:shadow-[0_0_20px_rgba(255,184,0,0.3)] disabled:bg-[#111111] disabled:text-[#333333] disabled:cursor-not-allowed disabled:hover:bg-[#111111] disabled:hover:shadow-none active:scale-[0.98]">
                  {isCreating ? 'Creating Raffle...' : 'Create Raffle'}
                </button>
                {createHash && <p className="font-mono text-[9px] text-[#555555] mt-2 break-all">Tx: {createHash}</p>}
                {error && <p className="font-mono text-[9px] text-red-400 mt-1">{error}</p>}
              </div>

              <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-[#FFB800] flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                  <div>
                    <h4 className="font-mono text-xs font-bold text-[#F5F5F5] uppercase tracking-wider mb-1">PARTNER_HINT</h4>
                    <p className="font-mono text-[10px] text-[#555555] leading-relaxed">Ensure your asset is approved for transfer. Locked or staked NFTs cannot be listed as raffle prizes until unstaked.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
