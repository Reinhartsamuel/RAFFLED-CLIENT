import { useReadContract, useWriteContract, useAccount } from 'wagmi'
import { type Address, parseUnits } from 'viem'
import ERC20ABI from '../abis/ERC20.json'

/**
 * Hook to manage ERC20 token approvals
 * Used for:
 * 1. Approving prize tokens before creating a raffle
 * 2. Approving payment tokens before buying tickets
 */
export function useTokenApproval(
  tokenAddress: Address | undefined,
  spenderAddress: Address | undefined
) {
  const { address: userAddress } = useAccount()
  const { writeContractAsync, isPending } = useWriteContract()

  // Read current allowance
  const { data: allowance = BigInt(0), refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20ABI.abi,
    functionName: 'allowance',
    args: userAddress && spenderAddress ? [userAddress, spenderAddress] : undefined,
    query: {
      enabled: !!userAddress && !!spenderAddress && !!tokenAddress,
    },
  })

  /**
   * Check if user has sufficient allowance
   */
  const hasAllowance = (requiredAmount: bigint): boolean => {
    return (allowance as bigint) >= requiredAmount
  }

  /**
   * Approve tokens for spending
   * @param amount Human readable amount
   * @param decimals Token decimals (default 18)
   */
  const approve = async (amount: string, decimals: number = 18): Promise<string> => {
    if (!tokenAddress || !spenderAddress) {
      throw new Error('Token address and spender address are required')
    }

    const parsedAmount = parseUnits(amount, decimals)

    const txHash = await writeContractAsync({
      address: tokenAddress,
      abi: ERC20ABI.abi,
      functionName: 'approve',
      args: [spenderAddress, parsedAmount],
    })

    // Refetch allowance after approval
    await refetchAllowance()

    return txHash
  }

  /**
   * Approve unlimited amount (MAX_INT)
   */
  const approveUnlimited = async (): Promise<string> => {
    if (!tokenAddress || !spenderAddress) {
      throw new Error('Token address and spender address are required')
    }

    const MAX_INT = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')

    const txHash = await writeContractAsync({
      address: tokenAddress,
      abi: ERC20ABI.abi,
      functionName: 'approve',
      args: [spenderAddress, MAX_INT],
    })

    // Refetch allowance after approval
    await refetchAllowance()

    return txHash
  }

  return {
    allowance: allowance || BigInt(0),
    hasAllowance,
    approve,
    approveUnlimited,
    isPending,
    refetchAllowance,
  }
}

/**
 * Hook to get user's token balance
 */
export function useTokenBalance(tokenAddress: Address | undefined) {
  const { address: userAddress } = useAccount()

  const { data: balance, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20ABI.abi,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress && !!tokenAddress,
    },
  })

  return {
    balance: balance || BigInt(0),
    refetch,
  }
}

/**
 * Hook to get token decimals
 */
export function useTokenDecimals(tokenAddress: Address | undefined) {
  const { data: decimals } = useReadContract({
    address: tokenAddress,
    abi: ERC20ABI.abi,
    functionName: 'decimals',
    query: {
      enabled: !!tokenAddress,
    },
  })

  return decimals || 18
}

/**
 * Check if user has sufficient balance and allowance for a transaction
 */
export function useCanTransferToken(
  tokenAddress: Address | undefined,
  spenderAddress: Address | undefined,
  requiredAmount: bigint
) {
  const { balance } = useTokenBalance(tokenAddress)
  const { allowance } = useTokenApproval(tokenAddress, spenderAddress)

  const balanceBig = (balance as bigint) || BigInt(0)
  const allowanceBig = (allowance as bigint) || BigInt(0)

  return {
    canTransfer: balanceBig >= requiredAmount && allowanceBig >= requiredAmount,
    hasSufficientBalance: balanceBig >= requiredAmount,
    hasSufficientAllowance: allowanceBig >= requiredAmount,
    balance: balanceBig,
    allowance: allowanceBig,
  }
}
