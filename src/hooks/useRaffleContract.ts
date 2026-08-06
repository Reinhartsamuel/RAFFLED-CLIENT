/* eslint-disable @typescript-eslint/no-explicit-any */
import { useReadContract, useWriteContract, useSimulateContract, useChainId, usePublicClient } from 'wagmi'
import { parseUnits, formatUnits, type Address } from 'viem'
import { simulateContract } from 'viem/actions'
import { getRaffleManagerAddress } from '../config/evm.config'
import RaffleManagerABI from '../abis/RaffledCore.json'
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
 * RaffledCore `getRaffle` returns the RaffleData struct tuple:
 * [0] host (address)
 * [1] expiry (uint48)
 * [2] status (uint8) — 0=OPEN, 1=PENDING_VRF, 2=COMPLETED, 3=CANCELLED
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
    functionName: 'getRaffle',
    args: raffleId !== undefined ? [BigInt(raffleId)] : undefined,
    query: {
      enabled: raffleId !== undefined,
    },
  })

  // Parse raffle tuple into structured object (RaffledCore layout — 10 elements).
  // viem may return either an array (unnamed tuple) or an object (named tuple).
  const raffle = raffleArray
    ? (() => {
        const arr = Array.isArray(raffleArray) ? raffleArray : null
        const obj = (raffleArray as Record<string, unknown> | null) && typeof raffleArray === 'object' && !Array.isArray(raffleArray)
          ? raffleArray as Record<string, any>
          : null
        const get = (index: number, key: string): any => (arr ? arr[index] : obj ? obj[key] : undefined)
        if (!arr && !obj) return null
        return {
          host: get(0, 'host') as Address,
          expiry: Number(get(1, 'expiry')) as number,
          status: Number(get(2, 'status')) as 0 | 1 | 2 | 3, // 0=OPEN, 1=PENDING_VRF, 2=COMPLETED, 3=CANCELLED
          underfilled: get(3, 'underfilled') as boolean,
          prizeType: Number(get(4, 'prizeType')) as PrizeType,
          prizeAsset: get(5, 'prizeAsset') as Address,
          ticketsSold: Number(get(6, 'ticketsSold')) as number,
          prizeAmountOrTokenId: get(7, 'prizeAmountOrTokenId') as bigint,
          ticketPrice: get(8, 'ticketPrice') as bigint,
          maxCap: Number(get(9, 'maxCap')) as number,
        }
      })()
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
 * Get total tickets sold for a raffle.
 * RaffledCore: `totalTickets(uint256)` (public mapping getter).
 */
export function useTotalTickets(raffleId: number | undefined) {
  const contract = useRaffleContract()

  return useReadContract({
    address: contract.address,
    abi: contract.abi,
    functionName: 'totalTickets',
    args: raffleId !== undefined ? [BigInt(raffleId)] : undefined,
    query: {
      enabled: raffleId !== undefined,
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
  const publicClient = usePublicClient()

  const createRaffleERC20 = async (params: {
    prizeAsset: Address
    prizeAmount: string  // Human readable amount (will be parsed)
    prizeDecimals: number
    ticketPrice: string  // Human readable price in USDC
    ticketDecimals: number
    maxCap: number
    duration: number     // Seconds
  }) => {
    const args = [
      params.prizeAsset,
      parseUnits(params.prizeAmount, params.prizeDecimals),
      parseUnits(params.ticketPrice, params.ticketDecimals),
      BigInt(params.maxCap),
      BigInt(params.duration),
    ]

    // Estimate gas using simulateContract for mobile wallet compatibility
    let gasLimit: bigint | undefined
    if (publicClient) {
      try {
        const { request } = await simulateContract(publicClient, {
          address: contract.address,
          abi: contract.abi,
          functionName: 'createRaffleERC20',
          args,
        })
        // Add 20% buffer to ensure sufficient gas for mobile wallets
        if (request.gas) {
          gasLimit = BigInt(Math.floor(Number(request.gas) * 1.2))
        }
      } catch (err) {
        console.warn('Gas estimation failed, wallet will estimate:', err)
      }
    }

    return writeContractAsync({
      address: contract.address,
      abi: contract.abi,
      functionName: 'createRaffleERC20',
      args,
      gas: gasLimit,
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
  const publicClient = usePublicClient()

  const createRaffleERC721 = async (params: {
    nftAsset: Address
    tokenId: bigint
    ticketPrice: string  // Human readable price in USDC
    ticketDecimals: number
    maxCap: number
    duration: number     // Seconds
  }) => {
    const args = [
      params.nftAsset,
      params.tokenId,
      parseUnits(params.ticketPrice, params.ticketDecimals),
      BigInt(params.maxCap),
      BigInt(params.duration),
    ]

    // Estimate gas using simulateContract for mobile wallet compatibility
    let gasLimit: bigint | undefined
    if (publicClient) {
      try {
        const { request } = await simulateContract(publicClient, {
          address: contract.address,
          abi: contract.abi,
          functionName: 'createRaffleERC721',
          args,
        })
        // Add 20% buffer to ensure sufficient gas for mobile wallets
        if (request.gas) {
          gasLimit = BigInt(Math.floor(Number(request.gas) * 1.2))
        }
      } catch (err) {
        console.warn('Gas estimation failed, wallet will estimate:', err)
      }
    }

    return writeContractAsync({
      address: contract.address,
      abi: contract.abi,
      functionName: 'createRaffleERC721',
      args,
      gas: gasLimit,
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
  const publicClient = usePublicClient()

  const enterRaffle = async (params: {
    raffleId: number
    ticketCount: number
  }) => {
    const args = [BigInt(params.raffleId), BigInt(params.ticketCount)]

    // Estimate gas using simulateContract for mobile wallet compatibility
    let gasLimit: bigint | undefined
    if (publicClient) {
      try {
        const { request } = await simulateContract(publicClient, {
          address: contract.address,
          abi: contract.abi,
          functionName: 'enterRaffle',
          args,
        })
        // Add 20% buffer to ensure sufficient gas for mobile wallets
        if (request.gas) {
          gasLimit = BigInt(Math.floor(Number(request.gas) * 1.2))
        }
      } catch (err) {
        console.warn('Gas estimation failed, wallet will estimate:', err)
      }
    }

    return writeContractAsync({
      address: contract.address,
      abi: contract.abi,
      functionName: 'enterRaffle',
      args,
      gas: gasLimit,
    })
  }

  return { enterRaffle, isPending }
}

/**
 * Enter a free raffle with a backend-issued EIP-712 signature.
 * No payment or approval needed — just the signature.
 */
export function useEnterFreeRaffle() {
  const contract = useRaffleContract()
  const { writeContractAsync, isPending } = useWriteContract()
  const publicClient = usePublicClient()

  const enterFreeRaffle = async (params: {
    raffleId: number
    signature: string
  }) => {
    const args = [BigInt(params.raffleId), params.signature as `0x${string}`]

    // Estimate gas using simulateContract for mobile wallet compatibility
    let gasLimit: bigint | undefined
    const MAX_GAS_LIMIT = 1000000n // 1M gas cap to prevent exceeding network limits
    if (publicClient) {
      try {
        const { request } = await simulateContract(publicClient, {
          address: contract.address,
          abi: contract.abi,
          functionName: 'enterFreeRaffle',
          args,
        })
        if (request.gas) {
          const estimatedGas = BigInt(Math.floor(Number(request.gas) * 1.2))
          // Cap gas limit to prevent exceeding network maximum
          gasLimit = estimatedGas > MAX_GAS_LIMIT ? MAX_GAS_LIMIT : estimatedGas
        }
      } catch (err) {
        console.warn('Gas estimation failed, using fallback gas limit:', err)
        // Fallback to reasonable gas limit for signature-based entry
        gasLimit = 500000n
      }
    }

    return writeContractAsync({
      address: contract.address,
      abi: contract.abi,
      functionName: 'enterFreeRaffle',
      args,
      gas: gasLimit,
    })
  }

  return { enterFreeRaffle, isPending }
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
