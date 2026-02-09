# Mock USDC - Exact Code Changes

This document shows the exact code changes needed to integrate Mock USDC into the frontend.

## File 1: `.env`

### Add this line:
```env
VITE_MOCK_USDC_ADDRESS_SEPOLIA=0x... (paste the address from deployment)
```

### Full .env after changes:
```env
VITE_PROJECT_ID=
VITE_API_BASE_URL=http://api.raffled.live/api
VITE_BASE_URL='http://localhost:5173'

# EVM Smart Contract Addresses (update after deployment)
VITE_RAFFLE_MANAGER_ADDRESS_SEPOLIA=0x95d256cdd7d0b8579538e98dffc343e725a717ec
VITE_RAFFLE_MANAGER_ADDRESS_BASE=0x0000000000000000000000000000000000000000

# Mock USDC for testing
VITE_MOCK_USDC_ADDRESS_SEPOLIA=0x... (replace with your deployed address)

# IPFS Gateway (optional for metadata)
VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/
```

---

## File 2: `src/components/evm/CreateRaffleModal.tsx`

### Change 1: Update imports and add mock USDC setup

**FIND (around line 1-8):**
```typescript
import { useState, useCallback } from 'react'
import { useChainId } from 'wagmi'
import { parseUnits, type Address } from 'viem'
import { useCreateRaffle } from '../../hooks/useRaffleContract'
import { useTokenApproval, useTokenDecimals, useTokenBalance } from '../../hooks/useTokenApproval'
import { getRaffleManagerAddress, getUSDCAddress } from '../../config/evm.config'
import { TransactionReceipt } from './TransactionReceipt'
import './CreateRaffleModal.css'
```

**REPLACE WITH:**
```typescript
import { useState, useCallback } from 'react'
import { useChainId } from 'wagmi'
import { parseUnits, type Address } from 'viem'
import { useCreateRaffle } from '../../hooks/useRaffleContract'
import { useTokenApproval, useTokenDecimals, useTokenBalance } from '../../hooks/useTokenApproval'
import { getRaffleManagerAddress, getUSDCAddress } from '../../config/evm.config'
import { TransactionReceipt } from './TransactionReceipt'
import './CreateRaffleModal.css'

// Get Mock USDC address from environment
const getMockUSDCAddress = (chainId: number): Address | undefined => {
  if (chainId === 84532) {
    return (import.meta.env.VITE_MOCK_USDC_ADDRESS_SEPOLIA || undefined) as Address | undefined
  }
  return undefined
}
```

### Change 2: Update default prize asset state

**FIND (around line 22-23):**
```typescript
  // Form state
  const [prizeAsset, setPrizeAsset] = useState<Address>(getUSDCAddress(chainId))
```

**REPLACE WITH:**
```typescript
  // Form state
  const mockUsdcAddress = getMockUSDCAddress(chainId)
  const defaultPrizeAsset = mockUsdcAddress || getUSDCAddress(chainId)
  const [prizeAsset, setPrizeAsset] = useState<Address>(defaultPrizeAsset)
```

### Change 3: Update form placeholder text

**FIND (around line 155-165):**
```typescript
                {/* Prize Asset */}
                <div className="form-group">
                  <label>Prize Token Address</label>
                  <input
                    type="text"
                    value={prizeAsset}
                    onChange={(e) => setPrizeAsset(e.target.value as Address)}
                    placeholder="0x036CbD53842c5426634e7929541eC2318f3dCF7e"
                    disabled={isApprovalPending || isCreating}
                  />
                  <small>Default: USDC on {chainId === 84532 ? 'Base Sepolia' : 'Base'}</small>
                </div>
```

**REPLACE WITH:**
```typescript
                {/* Prize Asset */}
                <div className="form-group">
                  <label>Prize Token Address</label>
                  <input
                    type="text"
                    value={prizeAsset}
                    onChange={(e) => setPrizeAsset(e.target.value as Address)}
                    placeholder={mockUsdcAddress ? 'Mock USDC (Pre-filled)' : '0x036CbD53842c5426634e7929541eC2318f3dCF7e'}
                    disabled={isApprovalPending || isCreating}
                  />
                  <small>
                    {mockUsdcAddress ? '✓ Using Mock USDC' : `Default: USDC on ${chainId === 84532 ? 'Base Sepolia' : 'Base'}`}
                  </small>
                </div>
```

---

## Complete Updated Component (Key Sections)

Here's what the top of the file should look like after all changes:

```typescript
import { useState, useCallback } from 'react'
import { useChainId } from 'wagmi'
import { parseUnits, type Address } from 'viem'
import { useCreateRaffle } from '../../hooks/useRaffleContract'
import { useTokenApproval, useTokenDecimals, useTokenBalance } from '../../hooks/useTokenApproval'
import { getRaffleManagerAddress, getUSDCAddress } from '../../config/evm.config'
import { TransactionReceipt } from './TransactionReceipt'
import './CreateRaffleModal.css'

// Get Mock USDC address from environment
const getMockUSDCAddress = (chainId: number): Address | undefined => {
  if (chainId === 84532) {
    return (import.meta.env.VITE_MOCK_USDC_ADDRESS_SEPOLIA || undefined) as Address | undefined
  }
  return undefined
}

interface CreateRaffleModalProps {
  onClose: () => void
}

type ApprovalStep = 'not_started' | 'approving' | 'approved' | 'failed'
type CreateStep = 'idle' | 'pending' | 'success' | 'error'

export function CreateRaffleModal({ onClose }: CreateRaffleModalProps) {
  const chainId = useChainId()
  const raffleManagerAddress = getRaffleManagerAddress(chainId)

  // Form state
  const mockUsdcAddress = getMockUSDCAddress(chainId)
  const defaultPrizeAsset = mockUsdcAddress || getUSDCAddress(chainId)
  const [prizeAsset, setPrizeAsset] = useState<Address>(defaultPrizeAsset)
  const [prizeAmount, setPrizeAmount] = useState('')
  const [paymentAsset, setPaymentAsset] = useState('0x0000000000000000000000000000000000000000')
  const [ticketPrice, setTicketPrice] = useState('')
  const [maxCap, setMaxCap] = useState('')
  const [duration, setDuration] = useState('') // in days

  // ... rest of component stays the same ...
```

And in the form section:

```typescript
                {/* Prize Asset */}
                <div className="form-group">
                  <label>Prize Token Address</label>
                  <input
                    type="text"
                    value={prizeAsset}
                    onChange={(e) => setPrizeAsset(e.target.value as Address)}
                    placeholder={mockUsdcAddress ? 'Mock USDC (Pre-filled)' : '0x036CbD53842c5426634e7929541eC2318f3dCF7e'}
                    disabled={isApprovalPending || isCreating}
                  />
                  <small>
                    {mockUsdcAddress ? '✓ Using Mock USDC' : `Default: USDC on ${chainId === 84532 ? 'Base Sepolia' : 'Base'}`}
                  </small>
                </div>
```

---

## Summary of Changes

### Files Modified: 2

1. **`.env`**
   - Add 1 line: `VITE_MOCK_USDC_ADDRESS_SEPOLIA=0x...`

2. **`src/components/evm/CreateRaffleModal.tsx`**
   - Add helper function: `getMockUSDCAddress()`
   - Update default prize asset initialization
   - Update form placeholder and helper text
   - ~15 lines of changes total

### No Breaking Changes
- Fallback to real USDC if Mock USDC address not set
- All existing functionality preserved
- Easy to switch back to real USDC anytime

---

## Testing the Integration

### 1. Deploy MockUSDC
```bash
cd /Users/reinhartsulilatu/repos/raffled-contract
forge script script/DeployMockUSDC.s.sol \
  --rpc-url https://base-sepolia.g.alchemy.com/v2/51MRDeFHeLtd5FrWrTMv0bsusLfs5n8r \
  --broadcast -vvv
```

### 2. Copy contract address from output

### 3. Add to .env
```env
VITE_MOCK_USDC_ADDRESS_SEPOLIA=0x...
```

### 4. Update CreateRaffleModal.tsx (as shown above)

### 5. Restart dev server
```bash
npm run dev
```

### 6. Verify
- Open http://localhost:5173
- Go to Manage tab
- Click Create Raffle
- Prize Token should show "Mock USDC (Pre-filled)"
- Small text should show "✓ Using Mock USDC"

---

## Reverting to Real USDC

To switch back to real USDC:

**Option A: Remove the env variable**
```env
# Just delete or comment out this line
# VITE_MOCK_USDC_ADDRESS_SEPOLIA=0x...
```

**Option B: Update .env to real USDC**
```env
VITE_MOCK_USDC_ADDRESS_SEPOLIA=0x036CbD53842c5426634e7929541eC2318f3dCF7e
# (This is the real USDC address)
```

Either way, the component will automatically fall back to the default behavior.

---

## Environment Variable Reference

| Variable | Value | Network | Required |
|----------|-------|---------|----------|
| `VITE_MOCK_USDC_ADDRESS_SEPOLIA` | Your deployed address | Base Sepolia | Optional |
| `VITE_RAFFLE_MANAGER_ADDRESS_SEPOLIA` | Already set | Base Sepolia | Yes |
| `VITE_PROJECT_ID` | AppKit ID | All | Yes |

---

## Code Diff Format

If you want to see exact diffs:

```diff
--- a/src/components/evm/CreateRaffleModal.tsx
+++ b/src/components/evm/CreateRaffleModal.tsx
@@ -7,6 +7,14 @@
 import { TransactionReceipt } from './TransactionReceipt'
 import './CreateRaffleModal.css'

+// Get Mock USDC address from environment
+const getMockUSDCAddress = (chainId: number): Address | undefined => {
+  if (chainId === 84532) {
+    return (import.meta.env.VITE_MOCK_USDC_ADDRESS_SEPOLIA || undefined) as Address | undefined
+  }
+  return undefined
+}
+
 interface CreateRaffleModalProps {
   onClose: () => void
 }
@@ -20,7 +28,9 @@
   const chainId = useChainId()
   const raffleManagerAddress = getRaffleManagerAddress(chainId)

   // Form state
+  const mockUsdcAddress = getMockUSDCAddress(chainId)
+  const defaultPrizeAsset = mockUsdcAddress || getUSDCAddress(chainId)
-  const [prizeAsset, setPrizeAsset] = useState<Address>(getUSDCAddress(chainId))
+  const [prizeAsset, setPrizeAsset] = useState<Address>(defaultPrizeAsset)
```
