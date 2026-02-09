# Quick Start: Raffle Creation Feature

## How It Works

The raffle creation feature allows users to create on-chain raffles with automatic smart contract interaction, token approvals, and full transaction receipt tracking.

## User Flow

### 1. Open Modal
- Click the **"+ Create Raffle"** button in the **Manage** tab
- A modal form opens

### 2. Fill Form
Enter the raffle parameters:
- **Prize Token Address**: ERC20 token address (e.g., USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`)
- **Prize Amount**: Amount of tokens as prize (e.g., `100`)
- **Payment Token**: What users pay with
  - Use `0x0000000000000000000000000000000000000000` for **ETH**
  - Or enter an ERC20 address (e.g., USDC)
- **Ticket Price**: Cost per ticket (e.g., `0.01`)
- **Maximum Tickets**: Max participants (e.g., `100`)
- **Duration**: How many days raffle runs (e.g., `7`)

### 3. Approve Tokens (if needed)
- If your prize token needs approval:
  - **"Approve Tokens"** button appears
  - Click to approve the raffle contract to spend your tokens
  - Wallet pops up, approve the transaction
  - Wait for confirmation
  - Button changes to **"✓ Approved"**

### 4. Create Raffle
- Click **"Create Raffle"** button
- Wallet pops up, confirm the transaction
- Wait for confirmation
- Receipt appears in bottom-right corner

### 5. View Transaction Receipt
The receipt shows:
- ✓ **Transaction Hash** - Click copy button to copy, or click link to view on block explorer
- **Block Number** - Which block included your transaction
- **Block Hash** - Hash of the block
- **Gas Used** - How much gas was consumed
- **Gas Price** - How much you paid per unit
- **Status** - Whether transaction succeeded

## What Happens Behind the Scenes

### Console Logging
Open your browser DevTools (F12) and go to **Console** tab:

```javascript
// You'll see:
Approval Transaction Hash: 0x1234...
Create Raffle Transaction Hash: 0x5678...
Transaction Receipt: { /* full receipt object */ }
Receipt Summary: { /* formatted for easy reading */ }
```

### Smart Contract
The transaction:
1. Transfers your prize tokens to the raffle contract (escrow)
2. Creates a new raffle with your parameters
3. Returns the raffle ID (now visible in Explore tab)

## Default Values

For testing on **Base Sepolia**:
- **Prize Token (USDC)**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **Payment Token (ETH)**: `0x0000000000000000000000000000000000000000`

## Common Issues

### "Approve Tokens" button doesn't appear
- Your current allowance is already sufficient
- You can proceed to create the raffle

### "Insufficient balance" warning
- Check your balance in the form (shows in small text)
- Add more tokens to your wallet

### Transaction fails
- Ensure you're on **Base Sepolia** network
- Ensure you have enough ETH for gas
- Check the error message in the modal

### Can't see receipt
- Scroll down in bottom-right corner
- Click copy button to copy hash
- Open block explorer link to view details

## Supported Networks

| Network | ChainID | Status |
|---------|---------|--------|
| Base Sepolia | 84532 | ✅ Live |
| Base | 8453 | 🔄 Ready (add contract address) |

## Debugging

To debug issues:

1. **Check Console Logs**
   - F12 → Console tab
   - Look for "Transaction Hash" logs
   - Look for "Receipt" logs

2. **Check Transaction on Block Explorer**
   - Click the block explorer link in receipt
   - Verify transaction status
   - Check gas used vs. estimated

3. **Check Contract State**
   - Go to Explore tab
   - New raffle should appear in list
   - Count should increment

## Advanced: Manual Testing Steps

```javascript
// Step 1: Connect wallet to Base Sepolia
// Step 2: Go to Manage tab
// Step 3: Click Create Raffle
// Step 4: Fill form with:
//   Prize: 0x036CbD53842c5426634e7929541eC2318f3dCF7e (USDC)
//   Amount: 1
//   Payment: 0x0000000000000000000000000000000000000000 (ETH)
//   Price: 0.001
//   Max: 5
//   Days: 1
// Step 5: Click Create Raffle (may need approval first)
// Step 6: Confirm in wallet
// Step 7: Check console for transaction hash
// Step 8: Wait for receipt to appear
```

## Tips

✅ **Always test on testnet first** (Base Sepolia)
✅ **Keep a small prize amount for testing** (saves gas)
✅ **Check console logs** when something seems wrong
✅ **Use block explorer** to verify transaction success
✅ **Copy transaction hash** for customer support

## Need Help?

1. Check the browser console (F12)
2. Look at the transaction on block explorer
3. Review IMPLEMENTATION_SUMMARY.md for technical details
4. Check the raffles list to see if it was created anyway
