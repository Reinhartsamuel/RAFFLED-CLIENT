import { useChainId } from 'wagmi'
import { useTransactionReceipt } from '../../hooks/useTransactionReceipt'
import { getBlockExplorerUrl, copyToClipboard, formatGasPrice, shortenHash } from '../../utils/blockchain'
import './TransactionReceipt.css'
import type { Hash } from 'viem'

interface TransactionReceiptProps {
  hash: Hash | undefined
  onClose?: () => void
}

export function TransactionReceipt({ hash, onClose }: TransactionReceiptProps) {
  const chainId = useChainId()
  const { receipt, isLoading, isSuccess, isError, error } = useTransactionReceipt(hash)

  const handleCopyHash = async () => {
    if (hash) {
      const copied = await copyToClipboard(hash)
      if (copied) {
        // Visual feedback - could add toast here
        console.log('Copied to clipboard:', hash)
      }
    }
  }

  if (!hash) {
    return null
  }

  const blockExplorerUrl = getBlockExplorerUrl(chainId, hash)

  return (
    <div className="transaction-receipt">
      <div className="receipt-card">
        <div className="receipt-header">
          <h3 className="receipt-title">Transaction Status</h3>
          {onClose && (
            <button className="close-btn" onClick={onClose} aria-label="Close">
              ✕
            </button>
          )}
        </div>

        {isLoading && (
          <div className="receipt-state loading">
            <div className="spinner"></div>
            <p>Waiting for confirmation...</p>
            <div className="hash-display">
              <code className="hash-text">{shortenHash(hash, 8)}</code>
              <button className="copy-btn" onClick={handleCopyHash} title="Copy full hash">
                📋
              </button>
            </div>
          </div>
        )}

        {isSuccess && receipt && (
          <div className="receipt-state success">
            <div className="success-icon">✓</div>
            <p className="success-text">Transaction Confirmed</p>

            <div className="receipt-details">
              <div className="detail-group">
                <label>Transaction Hash</label>
                <div className="hash-display">
                  <code className="hash-text">{hash}</code>
                  <button className="copy-btn" onClick={handleCopyHash} title="Copy hash">
                    📋
                  </button>
                </div>
              </div>

              <div className="detail-group">
                <label>Block Number</label>
                <code>{receipt.blockNumber?.toString()}</code>
              </div>

              <div className="detail-group">
                <label>Block Hash</label>
                <code>{shortenHash(receipt.blockHash || '', 12)}</code>
              </div>

              <div className="detail-group">
                <label>Gas Used</label>
                <code>{receipt.gasUsed?.toString()}</code>
              </div>

              {receipt.effectiveGasPrice && (
                <div className="detail-group">
                  <label>Gas Price (Gwei)</label>
                  <code>{formatGasPrice(receipt.effectiveGasPrice)}</code>
                </div>
              )}

              <div className="detail-group">
                <label>Cumulative Gas Used</label>
                <code>{receipt.cumulativeGasUsed?.toString()}</code>
              </div>

              <div className="detail-group">
                <label>Transaction Index</label>
                <code>{receipt.transactionIndex}</code>
              </div>

              {receipt.contractAddress && (
                <div className="detail-group">
                  <label>Contract Address</label>
                  <code>{shortenHash(receipt.contractAddress, 8)}</code>
                </div>
              )}

              <div className="detail-group">
                <label>Status</label>
                <code className="status-success">
                  {receipt.status === 'success' ? '✓ Success' : '✗ Failed'}
                </code>
              </div>
            </div>

            <a
              href={blockExplorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block-explorer-link"
            >
              View on Block Explorer →
            </a>
          </div>
        )}

        {isError && (
          <div className="receipt-state error">
            <div className="error-icon">✕</div>
            <p className="error-text">Transaction Failed</p>
            {error && (
              <div className="error-details">
                <p>{error.message}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
