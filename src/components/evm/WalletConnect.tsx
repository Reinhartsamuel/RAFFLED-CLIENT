import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import { useChainId, useSwitchChain } from 'wagmi'
import { baseSepolia, base } from '@reown/appkit/networks'
import { formatAddress, isSupportedChain } from '../../utils/evm.utils'
import './WalletConnect.css'

export function WalletConnect() {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  const isSupported = isSupportedChain(chainId)

  if (!isConnected) {
    return (
      <button className="wallet-connect-btn" onClick={() => open({ view: 'Connect' })}>
        <span className="wallet-icon">🔗</span>
        <span className="wallet-text">Connect Wallet</span>
      </button>
    )
  }

  return (
    <div className="wallet-connected">
      {!isSupported && (
        <button
          className="chain-switch-btn warning"
          onClick={() => switchChain({ chainId: baseSepolia.id })}
        >
          <span className="status-dot warning-dot"></span>
          Switch to Base
        </button>
      )}

      <button
        className="wallet-info-btn"
        onClick={() => open({ view: 'Account' })}
        title={address}
      >
        <span className="wallet-icon">👤</span>
        <span className="wallet-address">{address ? formatAddress(address as `0x${string}`) : 'Unknown'}</span>
      </button>

      {address && (
        <div className="wallet-menu">
          <div className="menu-item">
            <span className="label">Address:</span>
            <span className="value">{address}</span>
          </div>
          <div className="menu-divider"></div>
          <button
            className="menu-action"
            onClick={() => open({ view: 'Networks' })}
          >
            Switch Network
          </button>
          <button
            className="menu-action disconnect"
            onClick={() => open({ view: 'Account' })}
          >
            Disconnect
          </button>
        </div>
      )}
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
      <button className="wallet-btn-minimal" onClick={() => open({ view: 'Connect' })}>
        Connect
      </button>
    )
  }

  return (
    <button
      className="wallet-btn-minimal connected"
      onClick={() => open({ view: 'Account' })}
    >
      {address ? formatAddress(address as `0x${string}`, 3) : 'Connected'}
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
      <div className="wallet-status disconnected">
        <span className="status-dot"></span>
        <span className="status-text">Not Connected</span>
      </div>
    )
  }

  if (!isSupported) {
    return (
      <div className="wallet-status unsupported">
        <span className="status-dot warning-dot"></span>
        <span className="status-text">Unsupported Network</span>
      </div>
    )
  }

  return (
    <div className="wallet-status connected">
      <span className="status-dot connected-dot"></span>
      <span className="status-text">Connected</span>
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
    <div className="network-selector">
      <button
        className={`network-btn ${chainId === baseSepolia.id ? 'active' : ''}`}
        onClick={() => switchChain({ chainId: baseSepolia.id })}
      >
        Base Sepolia
      </button>
      <button
        className={`network-btn ${chainId === base.id ? 'active' : ''}`}
        onClick={() => switchChain({ chainId: base.id })}
      >
        Base
      </button>
    </div>
  )
}
