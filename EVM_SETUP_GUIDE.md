# EVM Wallet Auth & Smart Contract Integration - Setup Guide

## Overview

The Raffled application has been successfully migrated from Solana wallet authentication to **EVM-based smart contract integration**. The new `/app-evm` route provides direct on-chain raffle functionality powered by the RaffleManager smart contract on Base network.

## What Changed

### Before (Solana)
- ❌ Wallet connection: `@reown/appkit-adapter-solana`
- ❌ Backend-dependent: REST API at `http://api.raffled.live/api`
- ❌ Manual ticket purchases: Transfer USDC → copy tx hash → submit form
- ❌ No on-chain escrow: Prizes verified via backend

### After (EVM)
- ✅ Wallet connection: `@reown/appkit-adapter-wagmi` (EVM wallets)
- ✅ Smart contract-first: Direct interaction with RaffleManager.sol
- ✅ One-click purchases: Approve → Buy (no manual tx hash entry)
- ✅ Trustless escrow: Prizes locked on-chain with VRF winner selection

## File Structure

```
src/
├── config/
│   └── evm.config.tsx              # Wagmi setup, contract addresses, networks
├── abis/
│   ├── RaffleManager.json           # Contract ABI (from compiled contract)
│   └── ERC20.json                   # Standard ERC20 ABI
├── hooks/
│   ├── useRaffleContract.ts         # Contract read/write hooks
│   ├── useTokenApproval.ts          # ERC20 approval logic
│   ├── useRaffleEvents.ts           # Event listener hooks
│   └── useRaffles.ts                # Higher-level data aggregation
├── components/
│   └── evm/
│       ├── WalletConnect.tsx        # Wallet connection UI
│       └── WalletConnect.css        # Wallet styles
├── types/
│   └── evm.types.ts                 # TypeScript interfaces
├── utils/
│   └── evm.utils.ts                 # Helper functions
├── AppEVM.tsx                       # Main EVM dashboard
├── AppEVM.css                       # Dashboard styles
└── LandingApp.tsx                   # Router (updated with /app-evm route)
```

## How to Use

### 1. Access the EVM App

Navigate to: **http://localhost:5173/app-evm**

### 2. Connect Wallet

The app uses `@reown/appkit` to support multiple EVM wallets:
- MetaMask
- Coinbase Wallet
- WalletConnect
- Brave Wallet
- Other EVM-compatible wallets

```tsx
import { WalletConnect } from './components/evm/WalletConnect'

export function MyComponent() {
  return <WalletConnect />
}
```

### 3. Read Contract Data

Use `useRaffleContract` hooks to read on-chain data:

```tsx
import { useRaffleCount, useRaffleData } from './hooks/useRaffleContract'

export function MyRaffleComponent() {
  const { data: raffleCount } = useRaffleCount()
  const { raffle } = useRaffleData(1) // Get raffle #1

  return (
    <div>
      <p>Total raffles: {Number(raffleCount || 0)}</p>
      {raffle && (
        <p>Raffle 1: {raffle.ticketsSold}/{raffle.maxCap} tickets sold</p>
      )}
    </div>
  )
}
```

### 4. Create a Raffle (2-Step Flow)

```tsx
import { useTokenApproval } from './hooks/useTokenApproval'
import { useCreateRaffle } from './hooks/useRaffleContract'
import { CONTRACTS } from './config/evm.config'

export function CreateRaffleComponent() {
  const prizeAsset = '0x...' // USDC or custom token
  const { approve, isPending: isApproving } = useTokenApproval(
    prizeAsset,
    CONTRACTS.RaffleManager.baseSepolia
  )
  const { createRaffle, isPending: isCreating } = useCreateRaffle()

  const handleCreate = async () => {
    // Step 1: Approve prize token
    await approve('1000', 6) // 1000 USDC (6 decimals)

    // Step 2: Create raffle
    await createRaffle({
      prizeAsset,
      prizeAmount: '1000',
      prizeDecimals: 6,
      paymentAsset: CONTRACTS.USDC.baseSepolia, // USDC for payments
      ticketPrice: '10',
      ticketDecimals: 6,
      maxCap: 100,
      duration: 86400 * 7, // 7 days in seconds
    })
  }

  return (
    <div>
      <button onClick={handleCreate} disabled={isApproving || isCreating}>
        {isApproving ? 'Approving...' : isCreating ? 'Creating...' : 'Create Raffle'}
      </button>
    </div>
  )
}
```

### 5. Buy Tickets (2-Step Flow)

```tsx
import { useTokenApproval } from './hooks/useTokenApproval'
import { useEnterRaffle } from './hooks/useRaffleContract'
import { CONTRACTS } from './config/evm.config'

export function BuyTicketsComponent({ raffleId, raffle }) {
  const { approve, hasAllowance } = useTokenApproval(
    raffle.paymentAsset,
    CONTRACTS.RaffleManager.baseSepolia
  )
  const { enterRaffle } = useEnterRaffle()

  const handleBuyTickets = async (quantity: number) => {
    const totalCost = raffle.ticketPrice * BigInt(quantity)

    // Step 1: Approve if needed
    if (raffle.paymentAsset !== '0x0000000000000000000000000000000000000000' &&
        !hasAllowance(totalCost)) {
      await approve(formatUnits(totalCost, 6), 6) // USDC
    }

    // Step 2: Buy tickets
    await enterRaffle({
      raffleId,
      ticketCount: quantity,
      paymentAsset: raffle.paymentAsset,
      ticketPrice: raffle.ticketPrice,
      ticketDecimals: 6,
    })
  }

  return (
    <button onClick={() => handleBuyTickets(5)}>
      Buy 5 Tickets
    </button>
  )
}
```

### 6. Listen to Events in Real-Time

```tsx
import { useWatchTicketPurchased, useWatchWinnerPicked } from './hooks/useRaffleEvents'

export function RaffleDetails({ raffleId }) {
  const [ticketsSold, setTicketsSold] = useState(0)
  const [winner, setWinner] = useState<Address | null>(null)

  // Listen for ticket purchases
  useWatchTicketPurchased(raffleId, (buyer, ticketCount) => {
    console.log(`${buyer} bought ${ticketCount} tickets`)
    setTicketsSold(prev => prev + Number(ticketCount))
  })

  // Listen for winner selection
  useWatchWinnerPicked(raffleId, (winnerAddress) => {
    console.log(`Winner: ${winnerAddress}`)
    setWinner(winnerAddress)
  })

  return (
    <div>
      <p>Tickets sold live: {ticketsSold}</p>
      {winner && <p>Winner: {winner}</p>}
    </div>
  )
}
```

## Configuration

### Environment Variables (.env)

```bash
# Reown AppKit Project ID
VITE_PROJECT_ID=your_project_id_here

# Contract Addresses (update after deploying to testnet/mainnet)
VITE_RAFFLE_MANAGER_ADDRESS_SEPOLIA=0x...
VITE_RAFFLE_MANAGER_ADDRESS_BASE=0x...

# API URLs
VITE_API_BASE_URL=http://api.raffled.live/api
VITE_BASE_URL=http://localhost:5173

# IPFS Gateway (for metadata storage)
VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/
```

### Supported Networks

- **Base Sepolia** (Testnet): Chain ID `84532`
  - USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

- **Base** (Mainnet): Chain ID `8453`
  - USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

## Running the App

### Development

```bash
npm install  # Already done - dependencies are installed
npm run dev
```

Then visit: http://localhost:5173/app-evm

### Testing

1. **Get Testnet ETH** from [Base Faucet](https://faucet.base.org)
2. **Get Testnet USDC** from Coinbase or other faucets
3. **Connect wallet** and interact with the smart contract

## Contract Integration Details

### RaffleManager Functions

**Read Functions (View)**
- `raffleCount()` → Get total number of raffles
- `raffles(uint256 id)` → Get raffle details
- `participants(uint256 id, uint256 index)` → Get participant address
- `checkUpkeep(bytes)` → Chainlink Automation integration

**Write Functions (Transaction)**
- `createRaffle(address asset, uint256 amount, address paymentAsset, uint256 ticketPrice, uint256 maxCap, uint256 duration)` → Create new raffle
- `enterRaffle(uint256 raffleId, uint256 ticketCount)` → Buy tickets
- `cancelRaffle(uint256 raffleId)` → Cancel raffle (if expired & not filled)
- `claimRefund(uint256 raffleId)` → Claim refund for cancelled raffle
- `performUpkeep(bytes)` → Trigger VRF winner selection

**Events**
- `RaffleCreated(raffleId, host, prizeAsset, prizeAmount, paymentAsset, expiry)`
- `TicketPurchased(raffleId, buyer, ticketCount)`
- `WinnerPicked(raffleId, winner)`
- `RaffleCancelled(raffleId)`
- `RefundClaimed(raffleId, claimer, amount)`
- `VRFRequested(raffleId, requestId)`

## Utility Functions

### Token Formatting

```tsx
import { formatTokenAmount, parseTokenAmount, formatAddress } from './utils/evm.utils'

// Format amount (18 decimals to human readable)
const formatted = formatTokenAmount(BigInt('1000000000000000000'), 18, 2) // "1.00"

// Parse amount (human readable to 18 decimals)
const parsed = parseTokenAmount('1.5', 18) // BigInt(1500000000000000000)

// Format Ethereum address
const short = formatAddress('0x1234567890123456789012345678901234567890') // "0x1234...7890"
```

### Time Formatting

```tsx
import { formatTimeRemaining, getTimeRemaining } from './utils/evm.utils'

const remaining = getTimeRemaining(expiryTimestamp)
// { remaining: 86400, days: 1, hours: 0, minutes: 0, isExpired: false }

const formatted = formatTimeRemaining(expiryTimestamp) // "1d"
```

## Error Handling

Contract errors are automatically parsed to user-friendly messages:

```tsx
import { parseErrorMessage } from './utils/evm.utils'

try {
  await enterRaffle(...)
} catch (error) {
  const message = parseErrorMessage(error)
  console.error(message) // "This raffle is not open"
}
```

## Next Steps

### Phase 2: Smart Contract Deployment
1. Deploy RaffleManager to Base Sepolia testnet
2. Setup Chainlink VRF subscription
3. Update `.env` with deployed contract addresses

### Phase 3: UI Components
1. Build RaffleCard component
2. Build TicketPurchaseModal component
3. Build CreateRaffleForm component
4. Implement leaderboard/statistics

### Phase 4: Backend Integration (Optional)
1. Event indexer for faster queries
2. Metadata storage (IPFS integration)
3. Analytics/statistics API

## Troubleshooting

### Wallet not connecting
- Clear browser cache
- Check if supported network is selected
- Verify `VITE_PROJECT_ID` is set

### Transactions failing
- Ensure sufficient gas (ETH for tx fees)
- Check token approval is done before buyTickets/createRaffle
- Verify contract address is correct

### Slow loading
- Use multicall for batch reads (see plan file)
- Implement React Query caching properly
- Check RPC endpoint performance

## Resources

- [Wagmi Documentation](https://wagmi.sh)
- [Viem Documentation](https://viem.sh)
- [Reown AppKit Docs](https://cloud.reown.com)
- [Base Documentation](https://docs.base.org)
- [Chainlink VRF Docs](https://docs.chain.link/vrf)

## Support

Refer to the implementation plan at: `/Users/reinhartsulilatu/.claude/plans/melodic-marinating-pascal.md`
