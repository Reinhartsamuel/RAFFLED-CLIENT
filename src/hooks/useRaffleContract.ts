import { useReadContract, useWriteContract, useSimulateContract, useChainId } from 'wagmi'
import { parseUnits, formatUnits, type Address } from 'viem'
import { getRaffleManagerAddress } from '../config/evm.config'
import RaffleManagerABI from '../abis/RaffleManager.json'

/**
 * Hook to get the RaffleManager contract reference for the current chain
 */
export function useRaffleContract() {
  const chainId = useChainId()
  const address = getRaffleManagerAddress(chainId) as Address

  return {
    address,
    abi: RaffleManagerABI,
    chainId,
  }
}

// ──────────────────────────────────────────────────────────────────────
// Read Hooks
// ──────────────────────────────────────────────────────────────────────

/**
 * Get total count of raffles on-chain
 */
export function useRaffleCount() {
  const contract = useRaffleContract()

  return useReadContract({
    address: contract.address,
    abi: contract.abi,
    functionName: 'raffleCount',
  })
}

/**
 * Get detailed raffle data by ID
 * Returns: [host, expiry, status, prizeAsset, ticketsSold, paymentAsset, prizeAmount, ticketPrice, maxCap]
 */
export function useRaffleData(raffleId: number | undefined) {
  const contract = useRaffleContract()

  const { data: raffleArray, isLoading, error, refetch } = useReadContract({
    address: contract.address,
    abi: contract.abi,
    functionName: 'raffles',
    args: raffleId !== undefined ? [BigInt(raffleId)] : undefined,
    query: {
      enabled: raffleId !== undefined,
    },
  })

  // Parse raffle array into structured object
  const raffle = raffleArray && Array.isArray(raffleArray) && raffleArray.length >= 9
    ? {
        host: (raffleArray as any[])[0] as Address,
        expiry: Number((raffleArray as any[])[1]) as number,
        status: Number((raffleArray as any[])[2]) as 0 | 1 | 2, // 0=OPEN, 1=CANCELLED, 2=COMPLETED
        prizeAsset: (raffleArray as any[])[3] as Address,
        ticketsSold: Number((raffleArray as any[])[4]) as number,
        paymentAsset: (raffleArray as any[])[5] as Address,
        prizeAmount: (raffleArray as any[])[6] as bigint,
        ticketPrice: (raffleArray as any[])[7] as bigint,
        maxCap: Number((raffleArray as any[])[8]) as number,
      }
    : null

  return {
    raffle,
    isLoading,
    error,
    refetch,
    raffleArray,
  }
}

/**
 * Get list of participants (addresses) for a raffle at specific index
 */
export function useParticipant(raffleId: number | undefined, index: number | undefined) {
  const contract = useRaffleContract()

  return useReadContract({
    address: contract.address,
    abi: contract.abi,
    functionName: 'participants',
    args: raffleId !== undefined && index !== undefined ? [BigInt(raffleId), BigInt(index)] : undefined,
    query: {
      enabled: raffleId !== undefined && index !== undefined,
    },
  })
}

// ──────────────────────────────────────────────────────────────────────
// Write Hooks
// ──────────────────────────────────────────────────────────────────────

/**
 * Create a new raffle with prize escrow
 * Requires: Prize token approval before calling
 */
export function useCreateRaffle() {
  const contract = useRaffleContract()
  const { writeContractAsync, isPending } = useWriteContract()

  const createRaffle = async (params: {
    prizeAsset: Address
    prizeAmount: string // Human readable amount (will be parsed)
    prizeDecimals: number // Decimals of prize token
    paymentAsset: Address // address(0) for ETH, otherwise ERC20
    ticketPrice: string // Human readable price
    ticketDecimals: number // 6 for MockUSDC, 18 for ETH
    maxCap: number
    duration: number // Seconds
  }) => {
    return writeContractAsync({
      address: contract.address,
      abi: contract.abi,
      functionName: 'createRaffle',
      args: [
        params.prizeAsset,
        parseUnits(params.prizeAmount, params.prizeDecimals),
        params.paymentAsset,
        parseUnits(params.ticketPrice, params.ticketDecimals),
        BigInt(params.maxCap),
        BigInt(params.duration),
      ],
    })
  }

  return { createRaffle, isPending }
}

/**
 * Buy tickets for a raffle
 * For ERC20 payments: requires token approval before calling
 * For ETH payments: value is automatically calculated
 */
export function useEnterRaffle() {
  const contract = useRaffleContract()
  const { writeContractAsync, isPending } = useWriteContract()

  const enterRaffle = async (params: {
    raffleId: number
    ticketCount: number
    paymentAsset: Address
    ticketPrice: bigint
    ticketDecimals: number
  }) => {
    const totalValue = params.ticketPrice * BigInt(params.ticketCount)

    // For ETH payments, pass value; for ERC20, value is undefined
    const isETH = params.paymentAsset === '0x0000000000000000000000000000000000000000'

    return writeContractAsync({
      address: contract.address,
      abi: contract.abi,
      functionName: 'enterRaffle',
      args: [BigInt(params.raffleId), BigInt(params.ticketCount)],
      value: isETH ? totalValue : undefined,
    })
  }

  return { enterRaffle, isPending }
}

/**
 * Cancel a raffle (only if expired and max cap not reached)
 */
export function useCancelRaffle() {
  const contract = useRaffleContract()
  const { writeContractAsync, isPending } = useWriteContract()

  const cancelRaffle = async (raffleId: number) => {
    return writeContractAsync({
      address: contract.address,
      abi: contract.abi,
      functionName: 'cancelRaffle',
      args: [BigInt(raffleId)],
    })
  }

  return { cancelRaffle, isPending }
}

/**
 * Claim refund for a cancelled raffle
 */
export function useClaimRefund() {
  const contract = useRaffleContract()
  const { writeContractAsync, isPending } = useWriteContract()

  const claimRefund = async (raffleId: number) => {
    return writeContractAsync({
      address: contract.address,
      abi: contract.abi,
      functionName: 'claimRefund',
      args: [BigInt(raffleId)],
    })
  }

  return { claimRefund, isPending }
}

/**
 * Simulate a contract call to estimate gas and check for errors
 */
export function useSimulateRaffleCall(
  functionName: string,
  args: any[] = []
) {
  const contract = useRaffleContract()

  return useSimulateContract({
    address: contract.address,
    abi: contract.abi,
    functionName: functionName as never,
    args: args as never,
  })
}

// ──────────────────────────────────────────────────────────────────────
// Helper Functions
// ──────────────────────────────────────────────────────────────────────

/**
 * Format token amount from wei/raw to human readable
 */
export function formatTokenAmount(amount: bigint, decimals: number = 18): string {
  return formatUnits(amount, decimals)
}

/**
 * Parse human readable token amount to wei/raw
 */
export function parseTokenAmount(amount: string, decimals: number = 18): bigint {
  return parseUnits(amount, decimals)
}
