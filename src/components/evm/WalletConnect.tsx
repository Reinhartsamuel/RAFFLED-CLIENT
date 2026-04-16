import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import { useChainId, useSwitchChain } from 'wagmi'
import { base, baseSepolia } from '@reown/appkit/networks'
import { formatAddress, isSupportedChain } from '../../utils/evm.utils'

export function WalletConnect() {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  const isSupported = isSupportedChain(chainId)

  if (!isConnected) {
    return (
      <button
        className="flex items-center gap-2 px-4 py-2 rounded-md border border-[#2a2a2a] bg-[#0a0a0a] text-[#F5F5F5] font-mono text-xs uppercase tracking-wider hover:border-[#FFB800] hover:text-[#FFB800] transition-all duration-200"
        onClick={() => open()}
      >
        <span className="text-base leading-none">⬡</span>
        <span>Connect Wallet</span>
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {!isSupported && (
        <button
          className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B] font-mono text-xs hover:bg-[#F59E0B]/20 transition-all duration-200"
          onClick={() => switchChain({ chainId: base.id })}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
          Switch to Base
        </button>
      )}

      <button
        className="flex items-center gap-2 px-4 py-2 rounded-md border border-[#2a2a2a] bg-[#0a0a0a] text-[#F5F5F5] font-mono text-xs hover:border-[#FFB800]/40 transition-all duration-200"
        onClick={() => open()}
        title={address}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
        <span className="text-[#999999]">
          {address ? formatAddress(address as `0x${string}`) : 'Unknown'}
        </span>
      </button>
    </div>
  )
}

/**
 * Minimal wallet button component
 */
export function WalletConnectMinimal() {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()

  if (!isConnected) {
    return (
      <button
        className="px-3 py-1.5 rounded-md border border-[#2a2a2a] bg-[#0a0a0a] text-[#F5F5F5] font-mono text-xs hover:border-[#FFB800] hover:text-[#FFB800] transition-all duration-200"
        onClick={() => open({ view: 'Connect' })}
      >
        Connect
      </button>
    )
  }

  return (
    <button
      className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#2a2a2a] bg-[#0a0a0a] font-mono text-xs hover:border-[#FFB800]/40 transition-all duration-200"
      onClick={() => open({ view: 'Account' })}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
      <span className="text-[#999999]">
        {address ? formatAddress(address as `0x${string}`, 3) : 'Connected'}
      </span>
    </button>
  )
}

/**
 * Wallet status indicator
 */
export function WalletStatus() {
  const { isConnected } = useAppKitAccount()
  const chainId = useChainId()
  const isSupported = isSupportedChain(chainId)

  if (!isConnected) {
    return (
      <div className="flex items-center gap-1.5 font-mono text-xs text-[#555555]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#555555]" />
        Not Connected
      </div>
    )
  }

  if (!isSupported) {
    return (
      <div className="flex items-center gap-1.5 font-mono text-xs text-[#F59E0B]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
        Unsupported Network
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 font-mono text-xs text-[#22C55E]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
      Connected
    </div>
  )
}

/**
 * Network selector component
 */
export function NetworkSelector() {
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  return (
    <div className="flex items-center gap-2">
      <button
        className={`px-3 py-1.5 rounded-md border font-mono text-xs transition-all duration-200 ${
          chainId === baseSepolia.id
            ? 'border-[#FFB800] bg-[#FFB800]/10 text-[#FFB800]'
            : 'border-[#2a2a2a] bg-[#0a0a0a] text-[#555555] hover:border-[#FFB800]/40 hover:text-[#F5F5F5]'
        }`}
        onClick={() => switchChain({ chainId: baseSepolia.id })}
      >
        Base Sepolia
      </button>
      <button
        className={`px-3 py-1.5 rounded-md border font-mono text-xs transition-all duration-200 ${
          chainId === base.id
            ? 'border-[#FFB800] bg-[#FFB800]/10 text-[#FFB800]'
            : 'border-[#2a2a2a] bg-[#0a0a0a] text-[#555555] hover:border-[#FFB800]/40 hover:text-[#F5F5F5]'
        }`}
        onClick={() => switchChain({ chainId: base.id })}
      >
        Base
      </button>
    </div>
  )
}
