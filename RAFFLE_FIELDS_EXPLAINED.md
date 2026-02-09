# Raffle Creation Fields Explained

This guide explains the three most important fields in the Create Raffle form.

---

## 1️⃣ Prize Token Address

### What is it?
The **smart contract address** of the token you want to give away as the raffle prize.

### Why does it matter?
The raffle needs to know:
- Where to get the tokens from (the contract)
- How many decimals the token has (for proper amounts)
- How to transfer the tokens safely

### How to get one?

#### Option A: Use Mock USDC (Testing) ⭐
```
0x... (your deployed Mock USDC address)
```

#### Option B: Use Real USDC on Base Sepolia
```
0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

#### Option C: Use Real USDC on Base Mainnet
```
0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

#### Option D: Any other ERC-20 token
You can use any ERC-20 token address (wrapped tokens, custom tokens, etc.)

### Important Notes
- ✅ Token must be an ERC-20 compatible token
- ✅ You must have this token in your wallet
- ✅ The token will be transferred to the raffle contract as prize escrow
- ❌ Don't use a wallet address
- ❌ Don't use a random address - it won't work

### Example: Real USDC Prize
```
Prize Token Address: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
This is the USDC contract on Base Sepolia
```

---

## 2️⃣ Prize Amount

### What is it?
The **quantity** of the prize token that will be given to the winner.

### How is it interpreted?
The amount is in **human-readable form**, meaning:
- You enter `100` → Winner gets 100 USDC
- You enter `0.5` → Winner gets 0.5 ETH equivalent
- You enter `1000` → Winner gets 1000 Mock USDC

### Important: Token Decimals
Different tokens have different decimal places:

| Token | Decimals | Example |
|-------|----------|---------|
| USDC | 6 | `100` = 100,000,000 smallest units |
| ETH | 18 | `0.1` = 100,000,000,000,000,000 wei |
| Mock USDC | 6 | `100` = 100,000,000 smallest units |

The app **automatically handles decimals** - you just enter the normal amount you see.

### How much to give away?

#### Small Test Prize
```
Prize Amount: 1 USDC
= 1,000,000 smallest units
(cheap to test, uses less gas)
```

#### Medium Prize
```
Prize Amount: 100 USDC
= 100,000,000 smallest units
(good balance for testing)
```

#### Large Prize
```
Prize Amount: 1000 USDC
= 1,000,000,000 smallest units
(significant incentive)
```

### Example: Different Prize Amounts

**Scenario 1: Mock USDC Prize**
```
Prize Token: 0x... (Mock USDC)
Prize Amount: 10
↓
Winner receives: 10 Mock USDC tokens
You need: 10 USDC in your wallet
```

**Scenario 2: Real USDC Prize**
```
Prize Token: 0x036CbD53842c5426634e7929541eC2318f3dCF7e (USDC)
Prize Amount: 50
↓
Winner receives: 50 USDC
You need: 50 USDC in your wallet
```

**Scenario 3: Wrapped Ether Prize**
```
Prize Token: 0x4200000000000000000000000000000000000006 (WETH)
Prize Amount: 0.5
↓
Winner receives: 0.5 WETH (≈ 0.5 ETH)
You need: 0.5 WETH in your wallet
```

### Key Points
- ✅ You must **own** this amount in your wallet
- ✅ The amount is transferred to the raffle when you create it
- ✅ It's held in escrow until a winner is selected
- ✅ No decimal adjustment needed - the app does it for you
- ❌ Don't enter the raw amount (100000000) - enter human-readable (100)

---

## 3️⃣ Payment Token

### What is it?
The **currency that users pay** when buying raffle tickets.

### Why does it matter?
Users need to know:
- What they're paying with (ETH, USDC, etc.)
- How much it will cost

### Two Main Options

### Option A: ETH (Native Blockchain Currency) ⭐ Most Common
```
0x0000000000000000000000000000000000000000
```

**Advantages:**
- Everyone has ETH (needed for gas fees anyway)
- Easy to understand
- No additional approval needed beyond transaction

**How it works:**
```
User wants to buy 5 tickets at 0.01 ETH each
↓
User pays: 5 × 0.01 = 0.05 ETH total
↓
0.05 ETH sent directly to raffle contract
↓
5 tickets added to user's account
```

### Option B: ERC-20 Token (USDC, etc.)
```
0x036CbD53842c5426634e7929541eC2318f3dCF7e  (USDC address)
```

**Advantages:**
- Stablecoins (USDC stays at $1)
- Easier to track costs
- Users can pay without ETH (if using relayer)

**How it works:**
```
User wants to buy 5 tickets at 10 USDC each
↓
User approves the raffle contract: 50 USDC
↓
User confirms transaction
↓
50 USDC transferred to raffle contract
↓
5 tickets added to user's account
```

### Choosing Payment Token

#### Use ETH if:
- Simple, straightforward raffle
- You want maximum user participation
- Easiest for users
- No approval step (just one transaction)

#### Use USDC if:
- You want stable pricing
- Accounting is easier ($X per ticket)
- You're comfortable with approval flow
- Users prefer stablecoins

---

## Real-World Examples

### Example 1: Simple Test Raffle

```
Prize Token Address: 0x036CbD53842c5426634e7929541eC2318f3dCF7e (USDC)
Prize Amount: 10 USDC
Payment Token: 0x0000000000000000000000000000000000000000 (ETH)
Ticket Price: 0.01 ETH
Max Capacity: 100 tickets
Duration: 7 days

WHAT HAPPENS:
- You have 10 USDC in your wallet
- 10 USDC transferred to raffle contract
- Users buy tickets with ETH (0.01 ETH each)
- If 100 people buy: 1 ETH collected
- After 7 days: Winner selected, gets 10 USDC
```

### Example 2: Stablecoin Raffle

```
Prize Token Address: 0x036CbD53842c5426634e7929541eC2318f3dCF7e (USDC)
Prize Amount: 100 USDC
Payment Token: 0x036CbD53842c5426634e7929541eC2318f3dCF7e (USDC)
Ticket Price: 5 USDC
Max Capacity: 50 tickets
Duration: 3 days

WHAT HAPPENS:
- You have 100 USDC in your wallet
- 100 USDC transferred to raffle contract
- Users approve 5 USDC for each ticket
- If 50 people buy: 250 USDC collected
- After 3 days: Winner selected, gets 100 USDC
```

### Example 3: Mock USDC Test

```
Prize Token Address: 0x... (Your deployed Mock USDC)
Prize Amount: 50 Mock USDC
Payment Token: 0x0000000000000000000000000000000000000000 (ETH)
Ticket Price: 0.001 ETH
Max Capacity: 100 tickets
Duration: 1 day

WHAT HAPPENS:
- You have 50 Mock USDC from minting
- 50 Mock USDC transferred to raffle contract
- Users buy tickets with ETH (0.001 ETH each)
- If 100 people buy: 0.1 ETH collected
- After 1 day: Winner selected, gets 50 Mock USDC
```

---

## The Flow Diagram

### Creating a Raffle with Prize Token + Payment Token

```
STEP 1: SETUP (You create the raffle)
┌─────────────────────────────────────────┐
│ You have tokens in wallet               │
│ ├─ 100 USDC (prize token)              │
│ └─ 0.5 ETH (for gas)                    │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ You fill form:                          │
│ ├─ Prize Token: USDC address           │
│ ├─ Prize Amount: 100 USDC              │
│ ├─ Payment Token: ETH address(0)       │
│ ├─ Ticket Price: 0.01 ETH              │
│ └─ Max Capacity: 50                     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ Approve 100 USDC to raffle contract     │
│ (if needed)                             │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ Create raffle transaction:              │
│ ├─ Transfer 100 USDC → Raffle contract │
│ ├─ Lock it in escrow                    │
│ └─ Raffle now LIVE                      │
└─────────────────────────────────────────┘


STEP 2: USERS BUY TICKETS (Other people)
┌─────────────────────────────────────────┐
│ User 1 buys 2 tickets                   │
│ ├─ Sends: 2 × 0.01 ETH = 0.02 ETH      │
│ └─ Receives: 2 raffle tickets           │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ User 2 buys 3 tickets                   │
│ ├─ Sends: 3 × 0.01 ETH = 0.03 ETH      │
│ └─ Receives: 3 raffle tickets           │
└─────────────────────────────────────────┘


STEP 3: RAFFLE ENDS & WINNER PICKED
┌─────────────────────────────────────────┐
│ Raffle duration expires                 │
│ └─ VRF selects random winner from       │
│    all ticket holders                   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ Winner claims prize                     │
│ ├─ Receives: 100 USDC (prize token)    │
│ └─ Contract no longer holds prize       │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ Creator (you) receives                  │
│ ├─ 0.05 ETH (payment tokens from sales)│
│ └─ 100 USDC gone (given to winner)      │
└─────────────────────────────────────────┘
```

---

## Common Mistakes & How to Fix Them

### ❌ Mistake 1: Wallet Address as Prize Token
```
Prize Token Address: 0xMyWalletAddress123...
✗ WRONG! This is your wallet, not a token contract
✓ RIGHT! Use the token contract address
```

### ❌ Mistake 2: Not Having Enough Prize Tokens
```
Prize Amount: 1000 USDC
Your balance: 100 USDC
✗ WRONG! Approve will fail
✓ RIGHT! Amount ≤ Your balance
```

### ❌ Mistake 3: Using Wrong Token Address
```
Prize Token: 0x036CbD53842c5426634e7929541eC2318f3dCF7e (USDC on Base Sepolia)
But you're on: Base Mainnet
✗ WRONG! Different networks have different addresses
✓ RIGHT! Use the address for your current network
```

### ❌ Mistake 4: Forgetting Token Decimals
```
USDC decimals: 6
You enter: 1,000,000 (thinking this is 1 USDC)
✗ WRONG! This is 1,000,000 USDC!
✓ RIGHT! Enter 1 (app does decimal conversion)
```

---

## Quick Reference Table

| Field | Type | Network | Example |
|-------|------|---------|---------|
| **Prize Token** | Contract Address | Base Sepolia | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| **Prize Amount** | Number (human-readable) | Any | `100` |
| **Payment Token** | Contract Address | Base Sepolia | `0x0000000000000000000000000000000000000000` (ETH) or `0x036CbD53842c5426634e7929541eC2318f3dCF7e` (USDC) |

---

## Summary

| Field | Purpose | Value |
|-------|---------|-------|
| **Prize Token Address** | What token is the prize? | Token smart contract address |
| **Prize Amount** | How much to give winner? | Number in human-readable units (with decimals) |
| **Payment Token** | What do users pay with? | Token address (or 0x0...0 for ETH) |

**Simple Rule:**
- Prize Token = What winner gets
- Prize Amount = How much winner gets
- Payment Token = What users pay with to buy tickets

---

## Further Reading

- See `MOCK_USDC_QUICK_REFERENCE.md` for Mock USDC addresses
- See `RAFFLE_CREATION_ARCHITECTURE.md` for technical details
- See `IMPLEMENTATION_SUMMARY.md` for overall feature overview
