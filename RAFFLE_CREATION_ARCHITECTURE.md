# Raffle Creation Feature - Architecture Documentation

## System Overview

```
AppEVM.tsx (Main Component)
├── showCreateModal state
├── refetchRaffleCount
└── CreateRaffleModal (when showCreateModal === true)
    ├── Form State Management
    │   ├── Prize Token Address
    │   ├── Prize Amount
    │   ├── Payment Token
    │   ├── Ticket Price
    │   ├── Max Capacity
    │   └── Duration
    ├── Hooks
    │   ├── useChainId - Current blockchain network
    │   ├── useCreateRaffle - Create raffle transaction
    │   ├── useTokenApproval - Approve tokens
    │   ├── useTokenDecimals - Get token decimal places
    │   └── useTokenBalance - Check user balance
    ├── Approval Flow
    │   ├── Check if approval needed (hasAllowance check)
    │   ├── Send approval transaction
    │   ├── Log to console
    │   └── Wait for confirmation
    ├── Create Flow
    │   ├── Validate form inputs
    │   ├── Convert duration from days to seconds
    │   ├── Call createRaffle hook
    │   ├── Log transaction hash to console
    │   └── Display TransactionReceipt
    └── TransactionReceipt Component
        ├── useTransactionReceipt hook
        ├── useChainId for block explorer link
        ├── Display receipt details
        ├── Copy to clipboard functionality
        └── Block explorer link
```

## Component Hierarchy

### `CreateRaffleModal.tsx`
**Purpose**: Form component for creating raffles

**Props**:
```typescript
interface CreateRaffleModalProps {
  onClose: () => void  // Called when modal should close
}
```

**State**:
```typescript
// Form inputs
prizeAsset: Address
prizeAmount: string
paymentAsset: string
ticketPrice: string
maxCap: string
duration: string  // in days

// Token info
prizeDecimals: number  // fetched from contract
paymentDecimals: number  // fetched from contract
prizeBalance: bigint  // user's balance

// Approval state
approvalStep: 'not_started' | 'approving' | 'approved' | 'failed'
approvalHash: string

// Create state
createStep: 'idle' | 'pending' | 'success' | 'error'
createHash: string
error: string
```

**Key Functions**:
- `needsApproval()` - Check if allowance sufficient
- `handleApprove()` - Send approval transaction
- `handleCreateRaffle()` - Send create raffle transaction

### `TransactionReceipt.tsx`
**Purpose**: Display transaction details and status

**Props**:
```typescript
interface TransactionReceiptProps {
  hash: Hash | undefined  // Transaction hash
  onClose?: () => void    // Optional close handler
}
```

**Displays**:
- Transaction hash (full, with copy button)
- Block number
- Block hash
- Gas metrics
- Status
- Block explorer link

## Hook Integration

### `useCreateRaffle()`
From: `src/hooks/useRaffleContract.ts`

```typescript
const { createRaffle, isPending } = useCreateRaffle()

// Call it
const hash = await createRaffle({
  prizeAsset: Address
  prizeAmount: string        // Human readable
  prizeDecimals: number
  paymentAsset: Address
  ticketPrice: string        // Human readable
  ticketDecimals: number
  maxCap: number
  duration: number           // In seconds
})
// Returns: transaction hash
```

**What it does**:
- Converts human-readable amounts to wei
- Calls the smart contract's `createRaffle` function
- Returns transaction hash
- Sets isPending state

### `useTokenApproval()`
From: `src/hooks/useTokenApproval.ts`

```typescript
const {
  approve,         // (amount, decimals) => Promise<hash>
  approveUnlimited, // () => Promise<hash>
  hasAllowance,    // (requiredAmount) => boolean
  allowance,       // Current allowance (bigint)
  isPending        // Is transaction pending
} = useTokenApproval(tokenAddress, spenderAddress)
```

**What it does**:
- Reads current allowance from contract
- Allows approving specific amount or unlimited
- Checks if sufficient allowance exists
- Returns transaction hash

### `useTokenDecimals()`
From: `src/hooks/useTokenApproval.ts`

```typescript
const decimals = useTokenDecimals(tokenAddress)
// Returns: number (defaults to 18)
```

### `useTokenBalance()`
From: `src/hooks/useTokenApproval.ts`

```typescript
const { balance, refetch } = useTokenBalance(tokenAddress)
// Returns: bigint (raw amount in smallest units)
```

### `useTransactionReceipt()`
From: `src/hooks/useTransactionReceipt.ts`

```typescript
const { receipt, isLoading, isSuccess, isError, error } = useTransactionReceipt(hash)

// Automatically:
// - Polls for receipt
// - Logs to console when available
// - Tracks state transitions
// - Formats data for display
```

## Data Flow

### Approval Flow
```
User Input (prizeAmount)
  ↓
needsApproval() check
  ↓
hasAllowance(parsedAmount) → false
  ↓
Show "Approve Tokens" button
  ↓
User clicks button
  ↓
handleApprove()
  ├─ approval.approve(prizeAmount, decimals)
  ├─ Get transaction hash
  ├─ console.log('Approval Transaction Hash:', hash)
  ├─ Set approvalHash state
  └─ Set approvalStep to 'approved'
  ↓
approval.refetchAllowance()
  ↓
Show "✓ Approved" status
```

### Create Raffle Flow
```
User input validation
  ↓
handleCreateRaffle()
  ├─ Convert duration: days → seconds
  ├─ Create raffle object with parameters
  └─ Set createStep to 'pending'
  ↓
createRaffle(raffleObject)
  ├─ Call smart contract
  ├─ Get transaction hash
  ├─ console.log('Create Raffle Transaction Hash:', hash)
  └─ Set createHash state
  ↓
useTransactionReceipt(hash)
  ├─ Wait for confirmation
  ├─ Log receipt to console
  └─ Display receipt in UI
  ↓
Show success state
  ↓
After 5 seconds: onClose()
```

## Styling Architecture

### CSS Organization
- `CreateRaffleModal.css` - Modal form styling
- `TransactionReceipt.css` - Receipt display styling
- Neo-brutalist design system

### Design Tokens
```css
/* Colors */
--primary-bg: #ffffff
--primary-text: #000000
--accent: #DFFF00 (safety lime)
--border: #000000

/* Typography */
--font-family: 'JetBrains Mono', monospace
--text-transform: uppercase
--letter-spacing: 0.05em

/* Shadows */
--shadow-default: 4px 4px 0 rgba(0, 0, 0, 0.25)
--shadow-hover: 6px 6px 0 rgba(0, 0, 0, 0.25)
--shadow-active: 2px 2px 0 rgba(0, 0, 0, 0.25)

/* Border */
--border-size: 2px
--border-style: solid
```

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## Error Handling

### Approval Errors
```typescript
try {
  const hash = await approval.approve(amount, decimals)
} catch (err) {
  // User rejected transaction
  // Or insufficient gas
  // Or network error
  setError(err.message || 'Approval failed')
  setApprovalStep('failed')
}
```

### Create Raffle Errors
```typescript
try {
  const hash = await createRaffle({...})
} catch (err) {
  // Insufficient balance
  // Token not approved
  // Invalid parameters
  // Network error
  setError(err.message || 'Failed to create raffle')
  setCreateStep('error')
}
```

## Console Output

### Logging Strategy
```javascript
// When approval needed and sent:
console.log('Approval Transaction Hash:', '0x...')

// When raffle creation sent:
console.log('Create Raffle Transaction Hash:', '0x...')

// When receipt received:
console.log('Transaction Receipt:', receipt)
console.log('Receipt Summary:', {
  transactionHash,
  blockNumber,
  blockHash,
  gasUsed,
  effectiveGasPrice,
  status,
  // ... all other fields
})
```

### Debugging in Console
```javascript
// In browser console, you can see all details:
// 1. Transaction hashes for both approval and creation
// 2. Full receipt object with all transaction details
// 3. Formatted summary for easier reading
```

## Integration Points

### With AppEVM.tsx
```typescript
{showCreateModal && (
  <CreateRaffleModal
    onClose={() => {
      setShowCreateModal(false)
      refetchRaffleCount()  // Update raffle list
    }}
  />
)}
```

### With Smart Contract
```typescript
createRaffle(
  prizeAsset,    // ERC20 token address
  prizeAmount,   // Wei amount
  paymentAsset,  // ETH or ERC20
  ticketPrice,   // Wei per ticket
  maxCap,        // Max participants
  duration       // Seconds from now
) → returns raffleId
```

## State Management Strategy

**Local Component State** (via useState)
- Form inputs
- Approval status
- Create status
- Transaction hashes
- Error messages

**Server State** (via React Query hooks)
- Token allowance
- Token balance
- Token decimals
- Raffle count
- Transaction receipt

**No Global State** (not needed for this feature)
- All state is modal-scoped
- Clean separation of concerns
- Easy to test

## Performance Considerations

### Optimizations
- Form inputs are debounced implicitly (onChange updates)
- Token decimals cached by React Query
- Approval state reduces unnecessary checks
- Modal unmounts on close to free memory

### Gas Optimization
- Single approval call if needed
- Single create call after approval
- No redundant contract reads during flow

## Testing Strategy

### Unit Tests (would include)
- Form validation
- needsApproval logic
- Price calculations
- Error handling

### Integration Tests (would include)
- Approval flow with mocked contract
- Create raffle flow with mocked contract
- Receipt polling and logging
- Modal open/close lifecycle

### E2E Tests (would include)
- Full testnet flow
- Transaction confirmation
- Receipt display
- Block explorer link
