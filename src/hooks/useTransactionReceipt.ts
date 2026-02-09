import { useWaitForTransactionReceipt } from 'wagmi'
import { useEffect } from 'react'
import { formatReceiptForLog } from '../utils/blockchain'
import type { Hash } from 'viem'

/**
 * Custom hook to wait for transaction receipt and log it
 * Wraps wagmi's useWaitForTransactionReceipt with logging
 */
export function useTransactionReceipt(hash: Hash | undefined) {
  const { data: receipt, isLoading, isSuccess, isError, error } = useWaitForTransactionReceipt({
    hash,
    confirmations: 1,
  })

  // Log receipt when it arrives
  useEffect(() => {
    if (receipt) {
      console.log('Transaction Receipt:', receipt)
      console.log('Receipt Summary:', formatReceiptForLog(receipt))
    }
  }, [receipt])

  return {
    receipt,
    isLoading,
    isSuccess,
    isError,
    error,
  }
}
