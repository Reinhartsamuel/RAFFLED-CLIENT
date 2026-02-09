# Mock USDC - Quick Reference Card

## What is Mock USDC?

Mock USDC is a test ERC-20 token that mimics USDC but is deployed by you. Perfect for testing without needing real testnet USDC.

## Quick Setup (5 minutes)

### 1️⃣ Deploy Mock USDC
```bash
cd /Users/reinhartsulilatu/repos/raffled-contract
forge script script/DeployMockUSDC.s.sol \
  --rpc-url https://base-sepolia.g.alchemy.com/v2/51MRDeFHeLtd5FrWrTMv0bsusLfs5n8r \
  --broadcast -vvv
```
**👉 Copy the contract address (0x...)**

### 2️⃣ Update Frontend .env
```env
VITE_MOCK_USDC_ADDRESS_SEPOLIA=0x... (paste address from step 1)
```

### 3️⃣ Update CreateRaffleModal.tsx

Add this function at the top (after imports):
```typescript
const getMockUSDCAddress = (chainId: number): Address | undefined => {
  if (chainId === 84532) {
    return (import.meta.env.VITE_MOCK_USDC_ADDRESS_SEPOLIA || undefined) as Address | undefined
  }
  return undefined
}
```

Update line ~22:
```typescript
// OLD:
const [prizeAsset, setPrizeAsset] = useState<Address>(getUSDCAddress(chainId))

// NEW:
const mockUsdcAddress = getMockUSDCAddress(chainId)
const defaultPrizeAsset = mockUsdcAddress || getUSDCAddress(chainId)
const [prizeAsset, setPrizeAsset] = useState<Address>(defaultPrizeAsset)
```

Update the Prize Token input placeholder (line ~161):
```typescript
// Change placeholder:
placeholder={mockUsdcAddress ? 'Mock USDC (Pre-filled)' : '0x036CbD53842c5426634e7929541eC2318f3dCF7e'}

// Change small text:
<small>
  {mockUsdcAddress ? '✓ Using Mock USDC' : `Default: USDC on ${chainId === 84532 ? 'Base Sepolia' : 'Base'}`}
</small>
```

### 4️⃣ Restart Dev Server
```bash
npm run dev
```

## Get Mock USDC Tokens

Choose one method:

### Method A: Etherscan (Easiest ⭐)
1. Go to https://sepolia.basescan.org/
2. Search for your MockUSDC address
3. Click "Write Contract" tab
4. Connect wallet
5. Call `mint(yourAddress, 1000000000000)`
   - This is 1 million USDC

### Method B: Ask Deployer
The deployer has all initial tokens. They can send you some.

### Method C: Using Cast
```bash
cast send 0x...MockUSDCAddress "mint(address,uint256)" \
  0x...yourAddress \
  1000000000000 \
  --rpc-url https://base-sepolia.g.alchemy.com/v2/51MRDeFHeLtd5FrWrTMv0bsusLfs5n8r \
  --private-key 0x...
```

## Test the Flow

```
1. Connect wallet to Base Sepolia
2. Go to "Manage" tab
3. Click "Create Raffle"
4. Prize token should be pre-filled with Mock USDC
5. Enter amounts and click create
6. Approve tokens when prompted
7. Confirm transaction
8. Check receipt!
```

## Verify It Works

### In App
- Prize token field shows "Mock USDC (Pre-filled)"
- Small text shows "✓ Using Mock USDC"

### On Etherscan
1. Go to https://sepolia.basescan.org/
2. Search for your MockUSDC address
3. Click "Read Contract"
4. Call `balanceOf(yourAddress)` to see your balance

### In Console
```javascript
// Your balance should be visible in Create Raffle form
// Under Prize Amount input
```

## Files Created

```
/raffled-contract/
├── script/DeployMockUSDC.s.sol          # New deployment script
└── MOCK_USDC_DEPLOYMENT_GUIDE.md        # Detailed guide

/Raffled-client/
├── SETUP_MOCK_USDC.md                   # Setup instructions
├── MOCK_USDC_CODE_CHANGES.md            # Exact code changes
└── MOCK_USDC_QUICK_REFERENCE.md         # This file
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Address not showing | Restart dev server, clear cache (Ctrl+Shift+Del) |
| "Insufficient balance" | Mint tokens using Etherscan method |
| Deployment failed | Run `forge clean && forge build` first |
| Wrong address | Check `.env` has `VITE_MOCK_USDC_ADDRESS_SEPOLIA` |
| Can't mint tokens | Make sure account is the deployer |

## Key Differences from Real USDC

| Feature | Real USDC | Mock USDC |
|---------|-----------|-----------|
| Deploy cost | $0 (exists) | Minimal gas |
| Supply | Circle controlled | You control |
| Available | Immediately | After deployment |
| Decimals | 6 | 6 |
| Interface | ERC-20 | ERC-20 |

## Switch Back to Real USDC

When ready for production:

```bash
# Option A: Delete the env var
# Remove VITE_MOCK_USDC_ADDRESS_SEPOLIA from .env

# Option B: Use real address
VITE_MOCK_USDC_ADDRESS_SEPOLIA=0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

No code changes needed!

## Real USDC Addresses

| Network | Address |
|---------|---------|
| Base Sepolia | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| Base Mainnet | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |

## One More Thing...

After deploying MockUSDC, you'll want to:
1. ✅ Mint tokens to your address
2. ✅ Update frontend .env
3. ✅ Update CreateRaffleModal component
4. ✅ Test creating a raffle with Mock USDC
5. ✅ Switch to real USDC when ready

That's it! You're ready to test with Mock USDC! 🚀

---

**Need help?** Check the other guides:
- `SETUP_MOCK_USDC.md` - Step-by-step setup
- `MOCK_USDC_CODE_CHANGES.md` - Exact code changes
- `MOCK_USDC_DEPLOYMENT_GUIDE.md` - Detailed deployment info (in raffled-contract repo)
