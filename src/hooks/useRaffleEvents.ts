import { useWatchContractEvent, useChainId } from 'wagmi'
import { type Address } from 'viem'
import { getRaffleManagerAddress } from '../config/evm.config'
import RaffleManagerABI from '../abis/RaffleManager.json'

/**
 * Watch for RaffleCreated events
 * Triggered when a new raffle is created
 */
export function useWatchRaffleCreated(
  onNewRaffle: (raffleId: bigint, host: Address, prizeAsset: Address, prizeAmount: bigint) => void
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
          onNewRaffle(args.raffleId, args.host, args.prizeAsset, args.prizeAmount)
        }
      })
    },
  })
}

/**
 * Watch for TicketPurchased events for a specific raffle
 * Triggered when someone buys tickets
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
 * Triggered when VRF callback selects a winner
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
 * Watch for RaffleCancelled events
 * Triggered when a raffle is cancelled
 */
export function useWatchRaffleCancelled(
  raffleId: number | undefined,
  onCancelled: () => void
) {
  const chainId = useChainId()
  const raffleManagerAddress = getRaffleManagerAddress(chainId) as Address

  useWatchContractEvent({
    address: raffleManagerAddress,
    abi: RaffleManagerABI as any,
    eventName: 'RaffleCancelled' as any,
    args: raffleId !== undefined ? { raffleId: BigInt(raffleId) } : undefined,
    onLogs: () => {
      onCancelled()
    },
  })
}

/**
 * Watch for RefundClaimed events
 * Triggered when someone claims a refund
 */
export function useWatchRefundClaimed(
  raffleId: number | undefined,
  onRefundClaimed: (claimer: Address, amount: bigint) => void
) {
  const chainId = useChainId()
  const raffleManagerAddress = getRaffleManagerAddress(chainId) as Address

  useWatchContractEvent({
    address: raffleManagerAddress,
    abi: RaffleManagerABI as any,
    eventName: 'RefundClaimed' as any,
    args: raffleId !== undefined ? { raffleId: BigInt(raffleId) } : undefined,
    onLogs: (logs: any[]) => {
      logs.forEach((log: any) => {
        const args = log.args as any
        if (args) {
          onRefundClaimed(args.claimer, args.amount)
        }
      })
    },
  })
}

/**
 * Watch for VRFRequested events
 * Triggered when Chainlink VRF is requested for winner selection
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
