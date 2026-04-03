import { useReadContract, useWriteContract, useSimulateContract, useChainId } from 'wagmi'
import { parseUnits, formatUnits, type Address } from 'viem'
import { getRaffleManagerAddress } from '../config/evm.config'
import RaffleManagerABI from '../abis/RaffleManager.json'
import { PrizeType } from '../types/evm.types'

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
 * Get detailed raffle data by ID.
 * RaffleManager3 struct tuple layout:
 * [0] host (address)
 * [1] expiry (uint48)
 * [2] status (uint8) — 0=OPEN, 1=COMPLETED
 * [3] underfilled (bool)
 * [4] prizeType (uint8) — 0=ERC20, 1=ERC721
 * [5] prizeAsset (address)
 * [6] ticketsSold (uint96)
 * [7] prizeAmountOrTokenId (uint256)
 * [8] ticketPrice (uint256)
 * [9] maxCap (uint256)
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

  // Parse raffle array into structured object (RaffleManager3 layout — 10 elements)
  const raffle = raffleArray && Array.isArray(raffleArray) && raffleArray.length >= 10
    ? {
        host: (raffleArray as any[])[0] as Address,
        expiry: Number((raffleArray as any[])[1]) as number,
        status: Number((raffleArray as any[])[2]) as 0 | 1, // 0=OPEN, 1=COMPLETED
        underfilled: (raffleArray as any[])[3] as boolean,
        prizeType: Number((raffleArray as any[])[4]) as PrizeType,
        prizeAsset: (raffleArray as any[])[5] as Address,
        ticketsSold: Number((raffleArray as any[])[6]) as number,
        prizeAmountOrTokenId: (raffleArray as any[])[7] as bigint,
        ticketPrice: (raffleArray as any[])[8] as bigint,
        maxCap: Number((raffleArray as any[])[9]) as number,
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
 * Get participant address for a raffle at a specific index
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

/**
 * Get the payment token address (USDC) from the contract
 */
export function usePaymentToken() {
  const contract = useRaffleContract()

  return useReadContract({
    address: contract.address,
    abi: contract.abi,
    functionName: 'paymentToken',
  })
}

// ──────────────────────────────────────────────────────────────────────
// Write Hooks
// ──────────────────────────────────────────────────────────────────────

/**
 * Create a new raffle with an ERC-20 token prize.
 * Requires: Prize token ERC-20 approval before calling.
 */
export function useCreateRaffleERC20() {
  const contract = useRaffleContract()
  const { writeContractAsync, isPending } = useWriteContract()

  const createRaffleERC20 = async (params: {
    prizeAsset: Address
    prizeAmount: string  // Human readable amount (will be parsed)
    prizeDecimals: number
    ticketPrice: string  // Human readable price in USDC
    ticketDecimals: number
    maxCap: number
    duration: number     // Seconds
  }) => {
    return writeContractAsync({
      address: contract.address,
      abi: contract.abi,
      functionName: 'createRaffleERC20',
      args: [
        params.prizeAsset,
        parseUnits(params.prizeAmount, params.prizeDecimals),
        parseUnits(params.ticketPrice, params.ticketDecimals),
        BigInt(params.maxCap),
        BigInt(params.duration),
      ],
    })
  }

  return { createRaffleERC20, isPending }
}

/**
 * Create a new raffle with an ERC-721 NFT prize.
 * Requires: NFT approve(raffleManagerAddress, tokenId) before calling.
 */
export function useCreateRaffleERC721() {
  const contract = useRaffleContract()
  const { writeContractAsync, isPending } = useWriteContract()

  const createRaffleERC721 = async (params: {
    nftAsset: Address
    tokenId: bigint
    ticketPrice: string  // Human readable price in USDC
    ticketDecimals: number
    maxCap: number
    duration: number     // Seconds
  }) => {
    return writeContractAsync({
      address: contract.address,
      abi: contract.abi,
      functionName: 'createRaffleERC721',
      args: [
        params.nftAsset,
        params.tokenId,
        parseUnits(params.ticketPrice, params.ticketDecimals),
        BigInt(params.maxCap),
        BigInt(params.duration),
      ],
    })
  }

  return { createRaffleERC721, isPending }
}

/**
 * Buy tickets for a raffle.
 * RaffleManager3: always ERC20 (USDC), never ETH. Not payable.
 * Requires: paymentToken (USDC) approval before calling.
 */
export function useEnterRaffle() {
  const contract = useRaffleContract()
  const { writeContractAsync, isPending } = useWriteContract()

  const enterRaffle = async (params: {
    raffleId: number
    ticketCount: number
  }) => {
    return writeContractAsync({
      address: contract.address,
      abi: contract.abi,
      functionName: 'enterRaffle',
      args: [BigInt(params.raffleId), BigInt(params.ticketCount)],
    })
  }

  return { enterRaffle, isPending }
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
