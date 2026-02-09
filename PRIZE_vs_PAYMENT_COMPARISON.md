# Prize Token vs Payment Token - Visual Comparison

## Side-by-Side Comparison

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRIZE TOKEN                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  What it is:   The token given to the WINNER                        │
│                                                                      │
│  Who gets it:  The person who wins the raffle                       │
│                                                                      │
│  When:         After raffle ends and winner is selected            │
│                                                                      │
│  You need:     The Prize Token in YOUR wallet                       │
│                (you provide the prize)                              │
│                                                                      │
│  Example:      You have 100 USDC                                    │
│                You want to give away → 100 USDC as prize            │
│                → Transfer to raffle contract                        │
│                → Winner gets it at the end                          │
│                                                                      │
│  Purpose:      Makes the raffle VALUABLE                            │
│                (why people want to participate)                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                       PAYMENT TOKEN                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  What it is:   The token USERS PAY with to buy tickets              │
│                                                                      │
│  Who pays:     Everyone who wants to enter the raffle               │
│                                                                      │
│  When:         When someone buys a ticket                           │
│                                                                      │
│  You need:     NOT in your wallet (users provide it)                │
│                Users need to have it in their wallets               │
│                                                                      │
│  Example:      Ticket costs 0.01 ETH                                │
│                User sends → 0.01 ETH × number of tickets            │
│                → Money goes to raffle contract                      │
│                → User gets tickets in return                        │
│                                                                      │
│  Purpose:      Creates REVENUE for you                              │
│                (users pay to participate)                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## The Money Flow

```
YOU (Creator)                          USERS (Participants)         WINNER
     │                                      │                          │
     │ Step 1: Set Prize                    │                          │
     ├──────────────────────────────────────┼──────────────────────────┤
     │ You decide: 100 USDC as prize        │                          │
     │                                      │                          │
     ├──────────────────────────────────────┼──────────────────────────┤
     │                                      │                          │
     │ Step 2: Deposit Prize                │                          │
     │         (takes 100 USDC from you)    │                          │
     ├──────────────────────────────────────┼──────────────────────────┤
     │                                      │                          │
     │                      Step 3: Users buy tickets                  │
     │                            (with Payment Token)                │
     │                                      │                          │
     │                      User 1: 0.01 ETH ─────────┐               │
     │                                      │          │               │
     │                      User 2: 0.01 ETH ─────────┤               │
     │                                      │          │               │
     │                                      └─────────→├──────────────┤
     │                                    (goes to contract)           │
     │                                      │                          │
     │                                      │                          │
     │ Step 4: Raffle Ends                  │                          │
     │         VRF picks winner             │                          │
     │                                      │                          │
     ├──────────────────────────────────────┼──────────────────────────┤
     │                                      │      Step 5: Winner       │
     │ 100 USDC (prize) is released  ──────────────→ recieves prize    │
     │                                      │                          │
     │                                      │                          │
     │ You receive payment tokens    ──────────→  (0.02 ETH from sales)│
     │                                      │                          │
```

---

## Real Example: Lottery

Think of it like a traditional lottery:

```
PRIZE TOKEN = The prize money you as creator put up
┌────────────────────────────────────────────────────────────────────┐
│ You: "I'm putting $1000 cash as the lottery prize"                 │
│ → You transfer $1000 to the lottery system                          │
│ → It's locked in a vault                                            │
│ → Winner gets $1000 when raffle ends                                │
└────────────────────────────────────────────────────────────────────┘

PAYMENT TOKEN = What people pay to buy a ticket
┌────────────────────────────────────────────────────────────────────┐
│ Players: "We each pay $5 to buy a ticket"                           │
│ → Player 1 pays $5                                                   │
│ → Player 2 pays $5                                                   │
│ → Player 3 pays $5                                                   │
│ → You receive $15 total from ticket sales                           │
│                                                                     │
│ Then if 1000 players buy:                                           │
│ → You receive $5000                                                  │
│ → But you spent $1000 on the prize                                  │
│ → Net profit: $4000                                                  │
└────────────────────────────────────────────────────────────────────┘
```

---

## Specific Examples

### Scenario 1: ETH Raffle (Simple)

```
You Create:
├─ Prize Token: 0x036CbD53842c5426634e7929541eC2318f3dCF7e (USDC)
│  └─ You have: 100 USDC in wallet
│  └─ Prize Amount: 100 USDC
│     └─ 100 USDC will be transferred to contract escrow
│
├─ Payment Token: 0x0000000000000000000000000000000000000000 (ETH)
│  └─ Ticket Price: 0.01 ETH
│  └─ Max Capacity: 100 tickets
│     └─ Users need ETH in their wallet
│     └─ Each transaction costs: 0.01 ETH

Flow:
1. You approve 100 USDC to contract (if needed)
2. You create raffle → 100 USDC locked in contract
3. 100 people each buy 1 ticket
4. Each person sends 0.01 ETH → Total 1 ETH collected
5. After 7 days: VRF picks winner
6. Winner claims: 100 USDC
7. You receive: 1 ETH from ticket sales

Net Result:
✓ You spent: 100 USDC
✓ You earned: 1 ETH from tickets
✓ Winner earned: 100 USDC
```

### Scenario 2: USDC Raffle (Stable)

```
You Create:
├─ Prize Token: 0x036CbD53842c5426634e7929541eC2318f3dCF7e (USDC)
│  └─ You have: 500 USDC in wallet
│  └─ Prize Amount: 500 USDC
│     └─ 500 USDC transferred to contract escrow
│
├─ Payment Token: 0x036CbD53842c5426634e7929541eC2318f3dCF7e (USDC)
│  └─ Ticket Price: 10 USDC
│  └─ Max Capacity: 50 tickets
│     └─ Users need USDC in their wallet
│     └─ Each transaction costs: 10 USDC

Flow:
1. You approve 500 USDC to contract (if needed)
2. You create raffle → 500 USDC locked in contract
3. 50 people each buy 1 ticket
4. Each person sends 10 USDC → Total 500 USDC collected
5. After 3 days: VRF picks winner
6. Winner claims: 500 USDC
7. You receive: 500 USDC from ticket sales

Net Result:
✓ You spent: 500 USDC
✓ You earned: 500 USDC from tickets
✓ Winner earned: 500 USDC
✓ You break even! (Equal inflow and outflow)
```

### Scenario 3: Mock USDC Test

```
You Create:
├─ Prize Token: 0x12345... (Your Mock USDC)
│  └─ You have: 1,000,000 Mock USDC (from minting)
│  └─ Prize Amount: 100 Mock USDC
│     └─ 100 Mock USDC transferred to contract
│
├─ Payment Token: 0x0000000000000000000000000000000000000000 (ETH)
│  └─ Ticket Price: 0.001 ETH
│  └─ Max Capacity: 100 tickets
│     └─ Users need ETH in their wallet
│     └─ Each transaction costs: 0.001 ETH (cheap!)

Flow:
1. Create raffle → 100 Mock USDC locked
2. 100 people buy 1 ticket each
3. Each person sends 0.001 ETH → Total 0.1 ETH collected
4. After 1 day: Winner picked
5. Winner claims: 100 Mock USDC
6. You receive: 0.1 ETH

Net Result:
✓ You spent: 100 Mock USDC
✓ You earned: 0.1 ETH
✓ Winner earned: 100 Mock USDC
✓ Great for testing! (Cheap gas)
```

---

## Decision Tree: What Should I Use?

```
Start: "What tokens should I use?"
│
├─ Are you TESTING?
│  │
│  └─ YES → Use Mock USDC for Prize & ETH for Payment
│           (Unlimited supply, cheap gas)
│
├─ Do you want STABLE pricing?
│  │
│  └─ YES → Use USDC for both Prize & Payment
│           (Both stay at $1)
│
├─ Do you want SIMPLE flow?
│  │
│  └─ YES → Use any token for Prize & ETH for Payment
│           (ETH is simpler, no approval needed)
│
└─ Do you want MAXIMUM participation?
   │
   └─ YES → Use any token for Prize & ETH for Payment
            (Everyone has ETH for gas anyway)
```

---

## Common Questions

### Q1: Can Prize Token = Payment Token?
**A: YES!** ✅

```
Example:
Prize Token: USDC
Payment Token: USDC

Users buy tickets with USDC
Winner gets USDC
Simple and clean!
```

### Q2: Can they be different?
**A: YES!** ✅

```
Example:
Prize Token: 100 USDC (from you)
Payment Token: ETH (from users)

This is actually more common!
Users like paying with ETH (it's everywhere)
You control what prize to give
```

### Q3: What if I don't have enough prize tokens?
**A: Transaction fails** ❌

```
You set Prize Amount: 1000 USDC
You have: 100 USDC
│
└─ Error: Insufficient balance
   Approval will fail
   Raffle won't be created
```

### Q4: What if users don't have payment tokens?
**A: They can't buy tickets** ❌

```
You set Ticket Price: 0.01 ETH
User has: 0.005 ETH
│
└─ User can't buy ticket
   Error: Insufficient balance
```

### Q5: Can I change tokens after creating?
**A: NO** ❌

```
Raffle is created with specific Prize & Payment tokens
They are locked in the smart contract
Cannot be changed once created

If you want different tokens:
→ Create a new raffle
```

---

## Token Address Reference

### Base Sepolia Testnet

| Token | Address | Decimals | Use Case |
|-------|---------|----------|----------|
| USDC | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | 6 | Stable coin |
| ETH | `0x0000000000000000000000000000000000000000` | 18 | Native currency |
| Mock USDC | `0x... (deploy yourself)` | 6 | Testing |

### Base Mainnet

| Token | Address | Decimals | Use Case |
|-------|---------|----------|----------|
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | 6 | Stable coin |
| ETH | `0x0000000000000000000000000000000000000000` | 18 | Native currency |

---

## Summary Table

| Aspect | Prize Token | Payment Token |
|--------|-------------|---------------|
| **What is it?** | Prize for winner | Cost of entry |
| **You provide?** | YES (from your wallet) | NO (users provide) |
| **When needed?** | Before creating raffle | When users buy tickets |
| **Goes to** | Raffle contract escrow | Raffle contract, then to you |
| **Example** | 100 USDC | 0.01 ETH per ticket |
| **Must have** | YES (you) | NO (participants) |

---

## Final Analogy: Movie Theater

```
PRIZE TOKEN = The prize you give away at the end
├─ You: "I'm giving away a free vacation!"
├─ Value: $5000
└─ You need to have it (the vacation certificates)

PAYMENT TOKEN = What people pay for entry
├─ Customers: "I'll pay $10 for a raffle ticket"
├─ Each customer pays: $10
└─ You don't need to have it (customers bring their money)

Result:
├─ If 1000 people buy: You get $10,000
├─ You spent: $5000 (prize)
└─ Net profit: $5000
```

---

Keep it simple:
- **Prize Token** = What you're giving away
- **Payment Token** = What people pay with
- **You provide** the prize, **users provide** the payment
