# Setup Mock USDC - Quick Start

This guide walks you through deploying and integrating Mock USDC in just a few steps.

## TL;DR - Quick Commands

```bash
# 1. Navigate to contract project
cd /Users/reinhartsulilatu/repos/raffled-contract

# 2. Deploy MockUSDC to Base Sepolia
forge script script/DeployMockUSDC.s.sol \
  --rpc-url https://base-sepolia.g.alchemy.com/v2/51MRDeFHeLtd5FrWrTMv0bsusLfs5n8r \
  --broadcast -vvv

# 3. Copy the contract address from output (starts with 0x)

# 4. Update .env in Raffled-client
# Add/update this line:
VITE_MOCK_USDC_ADDRESS_SEPOLIA=0x... (paste the address from step 3)

# 5. Update CreateRaffleModal.tsx (see below)

# 6. Restart dev server
npm run dev
```

## Step-by-Step

### Step 1: Deploy MockUSDC

In `/Users/reinhartsulilatu/repos/raffled-contract`:

```bash
forge script script/DeployMockUSDC.s.sol \
  --rpc-url https://base-sepolia.g.alchemy.com/v2/51MRDeFHeLtd5FrWrTMv0bsusLfs5n8r \
  --broadcast \
  -vvv
```

**Output will show:**
```
...
[Contract Creation] 0xABCDEF1234567890ABCDEF1234567890ABCDEF12 MockUSDC
...
```

**Copy the address!** (the long string starting with 0x)

### Step 2: Update Frontend .env

Edit `/Users/reinhartsulilatu/Repos/Raffled-client/.env`:

Add this line:
```env
VITE_MOCK_USDC_ADDRESS_SEPOLIA=0x... (paste your address from step 1)
```

### Step 3: Update CreateRaffleModal Component

Edit `/Users/reinhartsulilatu/Repos/Raffled-client/src/components/evm/CreateRaffleModal.tsx`

**Change this:**
```typescript
// Line 22
const [prizeAsset, setPrizeAsset] = useState<Address>(getUSDCAddress(chainId))
```

**To this:**
```typescript
// Line 22
const mockUsdcAddress = (import.meta.env.VITE_MOCK_USDC_ADDRESS_SEPOLIA as Address) || getUSDCAddress(chainId)
const [prizeAsset, setPrizeAsset] = useState<Address>(mockUsdcAddress)
```

**Also update placeholder text (around line 161):**

Change:
```typescript
placeholder="0x036CbD53842c5426634e7929541eC2318f3dCF7e"
```

To:
```typescript
placeholder="Mock USDC: 0x..."
```

**And update helper text (around line 164):**

Change:
```typescript
<small>Default: USDC on {chainId === 84532 ? 'Base Sepolia' : 'Base'}</small>
```

To:
```typescript
<small>Default: Mock USDC</small>
```

### Step 4: Restart Dev Server

```bash
# Kill existing server (Ctrl+C)
# Then restart
npm run dev
```

## Verify It Works

1. **Open http://localhost:5173**
2. **Click "Manage" tab**
3. **Click "Create Raffle"**
4. **Check the Prize Token field** - it should show your MockUSDC address

### Get Mock USDC Tokens

You need tokens to test. Three options:

#### Option A: Use Etherscan (Easiest)
1. Go to https://sepolia.basescan.org/
2. Search for your MockUSDC contract address
3. Click "Contract" tab
4. Click "Write Contract"
5. Click "Connect Wallet"
6. Find `mint` function
7. Call: `mint(yourAddress, 1000000000000)` (1 million USDC)

#### Option B: Ask the deployer
The account that deployed MockUSDC has all the initial supply. They can send you tokens.

#### Option C: Use Cast (if you know the deployer's private key)
```bash
# Mint tokens to yourself
cast send 0x...MockUSDCAddress "mint(address,uint256)" \
  0x...yourAddress \
  1000000000000 \
  --rpc-url https://base-sepolia.g.alchemy.com/v2/51MRDeFHeLtd5FrWrTMv0bsusLfs5n8r \
  --private-key 0x...
```

## Test the Flow

Once you have MockUSDC tokens:

1. **Open the Create Raffle form**
2. **Fill in:**
   - Prize Token: (should be pre-filled with Mock USDC)
   - Prize Amount: `10`
   - Payment Token: `0x0000000000000000000000000000000000000000` (ETH)
   - Ticket Price: `0.001`
   - Max Cap: `10`
   - Duration: `1` (day)
3. **Click "Create Raffle"**
4. **Approve tokens** (if needed)
5. **Confirm create transaction**
6. **Check receipt!**

## Troubleshooting

### Address not showing in form
- Verify `.env` has `VITE_MOCK_USDC_ADDRESS_SEPOLIA=0x...`
- Restart dev server after updating `.env`
- Clear browser cache (Ctrl+Shift+Delete)

### "Insufficient balance" error
- You need MockUSDC tokens
- Use Etherscan method above to mint tokens
- Verify you have tokens using Etherscan "Read Contract" > `balanceOf`

### Deployment failed
```bash
# Try building first
cd /Users/reinhartsulilatu/repos/raffled-contract
forge clean && forge build

# Then deploy again
forge script script/DeployMockUSDC.s.sol \
  --rpc-url https://base-sepolia.g.alchemy.com/v2/51MRDeFHeLtd5FrWrTMv0bsusLfs5n8r \
  --broadcast -vvv
```

### Contract address wrong
- Double-check you copied the address correctly
- Go to Etherscan and verify it's a contract (not an account)
- Redeploy if unsure

## File Changes Summary

### Created Files:
- `/Users/reinhartsulilatu/repos/raffled-contract/script/DeployMockUSDC.s.sol`
- `/Users/reinhartsulilatu/repos/raffled-contract/MOCK_USDC_DEPLOYMENT_GUIDE.md`

### Modified Files:
- `/Users/reinhartsulilatu/Repos/Raffled-client/.env` (add VITE_MOCK_USDC_ADDRESS_SEPOLIA)
- `/Users/reinhartsulilatu/Repos/Raffled-client/src/components/evm/CreateRaffleModal.tsx` (update default token)

## Next: Production USDC

When ready for production, just:
1. Update `.env` to use real USDC address
2. No code changes needed - same ERC-20 interface!

Real USDC addresses:
- Base Sepolia: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- Base Mainnet: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
