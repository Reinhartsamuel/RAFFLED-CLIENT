import { useWatchContractEvent, useChainId } from 'wagmi'
import { type Address } from 'viem'
import { getRaffleManagerAddress } from '../config/evm.config'
import RaffleManagerABI from '../abis/RaffleManager.json'
import { PrizeType } from '../types/evm.types'

/**
 * Watch for RaffleCreated events (RaffleManager3).
 * The event now includes prizeType and prizeAmountOrTokenId instead of prizeAmount.
 */
export function useWatchRaffleCreated(
  onNewRaffle: (raffleId: bigint, host: Address, prizeAsset: Address, prizeType: PrizeType, prizeAmountOrTokenId: bigint) => void
) {
  const chainId = useChainId()
  const raffleManagerAddress = getRaffleManagerAddress(chainId) as Address

  useWatchContractEvent({
    address: raffleManagerAddress,
    abi: RaffleManagerABI as any,
    eventName: 'RaffleCreated' as any,
    onLogs: (logs: any[]) => {
      logs.forEach((log: any) => {
        const args = log.args as any
        if (args) {
          onNewRaffle(args.raffleId, args.host, args.prizeAsset, args.prizeType, args.prizeAmountOrTokenId)
        }
      })
    },
  })
}

/**
 * Watch for TicketPurchased events for a specific raffle
 */
export function useWatchTicketPurchased(
  raffleId: number | undefined,
  onTicketPurchase: (buyer: Address, ticketCount: bigint) => void
) {
  const chainId = useChainId()
  const raffleManagerAddress = getRaffleManagerAddress(chainId) as Address

  useWatchContractEvent({
    address: raffleManagerAddress,
    abi: RaffleManagerABI as any,
    eventName: 'TicketPurchased' as any,
    args: raffleId !== undefined ? { raffleId: BigInt(raffleId) } : undefined,
    onLogs: (logs: any[]) => {
      logs.forEach((log: any) => {
        const args = log.args as any
        if (args) {
          onTicketPurchase(args.buyer, args.ticketCount)
        }
      })
    },
  })
}

/**
 * Watch for WinnerPicked events for a specific raffle
 */
export function useWatchWinnerPicked(
  raffleId: number | undefined,
  onWinnerPicked: (winner: Address) => void
) {
  const chainId = useChainId()
  const raffleManagerAddress = getRaffleManagerAddress(chainId) as Address

  useWatchContractEvent({
    address: raffleManagerAddress,
    abi: RaffleManagerABI as any,
    eventName: 'WinnerPicked' as any,
    args: raffleId !== undefined ? { raffleId: BigInt(raffleId) } : undefined,
    onLogs: (logs: any[]) => {
      if (logs.length > 0) {
        const args = (logs[0] as any).args as any
        if (args) {
          onWinnerPicked(args.winner)
        }
      }
    },
  })
}

/**
 * Watch for VRFRequested events
 */
export function useWatchVRFRequested(
  raffleId: number | undefined,
  onVRFRequested: (requestId: bigint) => void
) {
  const chainId = useChainId()
  const raffleManagerAddress = getRaffleManagerAddress(chainId) as Address

  useWatchContractEvent({
    address: raffleManagerAddress,
    abi: RaffleManagerABI as any,
    eventName: 'VRFRequested' as any,
    args: raffleId !== undefined ? { raffleId: BigInt(raffleId) } : undefined,
    onLogs: (logs: any[]) => {
      logs.forEach((log: any) => {
        const args = log.args as any
        if (args) {
          onVRFRequested(args.requestId)
        }
      })
    },
  })
}
