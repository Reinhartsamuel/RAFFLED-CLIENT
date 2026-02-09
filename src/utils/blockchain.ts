import { formatUnits } from 'viem'

/**
 * Get block explorer URL for a transaction hash
 */
export function getBlockExplorerUrl(chainId: number, hash: string): string {
  const baseUrl = chainId === 84532
    ? 'https://sepolia.basescan.org'
    : chainId === 8453
    ? 'https://basescan.org'
    : 'https://sepolia.basescan.org'

  return `${baseUrl}/tx/${hash}`
}

/**
 * Format gas price from wei to Gwei
 */
export function formatGasPrice(gasPrice: bigint): string {
  return formatUnits(gasPrice, 9)
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
    return false
  }
}

/**
 * Shorten hash for display (show first and last N characters)
 */
export function shortenHash(hash: string, chars: number = 6): string {
  if (hash.length <= chars * 2) return hash
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`
}

/**
 * Format transaction receipt data for console logging
 */
export function formatReceiptForLog(receipt: any) {
  return {
    transactionHash: receipt.transactionHash,
    blockNumber: receipt.blockNumber?.toString(),
    blockHash: receipt.blockHash,
    gasUsed: receipt.gasUsed?.toString(),
    effectiveGasPrice: receipt.effectiveGasPrice?.toString(),
    cumulativeGasUsed: receipt.cumulativeGasUsed?.toString(),
    transactionIndex: receipt.transactionIndex,
    status: receipt.status === 'success' || receipt.status === '0x1' || receipt.status === 1 ? 'success' : 'failed',
    contractAddress: receipt.contractAddress,
    logs: receipt.logs?.length || 0,
  }
}
