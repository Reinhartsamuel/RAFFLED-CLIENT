# Raffled Client — Pivot Phase 1 Frontend Execution Plan

**Repo:** `~/repos/Raffled-client`
**Context:** Raffled Pivot Plan v2 — Phase 1 (B2B Raffle Infrastructure)
**Date:** 2026-08-05
**Target AI Level:** Beginner — every file path, exact change, and command is specified

---

## DEPENDENCY: PONDER INDEXER MUST BE DEPLOYED FIRST

The frontend's raffle listing (`useAllRaffles`) queries the **Ponder GraphQL API** — NOT the chain directly. Zero RPC calls for listing/activity. Ponder is set up in the contract repo (Part B of `1785939897834-contract-audit-ponder-plan.md`). Deploy Ponder before F3.

---

## TASK F1: UPDATE CONTRACT ADDRESSES & ABI FOR RAFFLEDCORE

### F1.1: Update Contract Address in evm.config.tsx

**File:** `src/config/evm.config.tsx`
**Lines:** 10-19

The deployed RaffledCore contract on Base Sepolia is `0xc17eee20B4990021bE9cc8eCB7833706465bb8b9`. Update:

```typescript
// CHANGE line 12 FROM:
    baseSepolia: (import.meta.env.VITE_RAFFLE_MANAGER_ADDRESS_SEPOLIA || '0x0000000000000000000000000000000000000000') as `0x${string}`,
// TO:
    baseSepolia: '0xc17eee20B4990021bE9cc8eCB7833706465bb8b9' as const,
```

### F1.2: Update the ABI to RaffledCore

Build and copy the new ABI:

```bash
cd ~/repos/raffled-contract && forge build
cp out/RaffledCore.sol/RaffledCore.json ~/repos/Raffled-client/src/abis/RaffledCore.json
```

Then update ALL imports from `RaffleManager.json` to `RaffledCore.json`:
- `src/hooks/useRaffleContract.ts` (line 6)
- `src/pages/RaffleAdminPage.tsx` (line 12)
- `src/hooks/useRaffleEvents.ts` (if it imports it)
- `src/components/evm/CreateRaffleModal.tsx` (if it imports it)

Run: `grep -r "RaffleManager.json" src/` and replace every occurrence.

### F1.3: Fix Function Names in useRaffleContract.ts

**File:** `src/hooks/useRaffleContract.ts`

RaffledCore uses `getRaffle(uint256)` (NOT a public mapping `raffles`). Change line 60:

```typescript
// FROM:
    functionName: 'raffles',
// TO:
    functionName: 'getRaffle',
```

`raffleCount` (line 36) → no change (still public variable, auto-getter).
`paymentToken` (line 116) → no change (public immutable, auto-getter).
`participants` (line 101) → REMOVED in RaffledCore. Update `useParticipant` to use `totalTickets`:

```typescript
export function useTotalTickets(raffleId: number | undefined) {
  const contract = useRaffleContract()
  return useReadContract({
    address: contract.address,
    abi: contract.abi,
    functionName: 'totalTickets',
    args: raffleId !== undefined ? [BigInt(raffleId)] : undefined,
    query: { enabled: raffleId !== undefined },
  })
}
```

### F1.4: Update RaffleStatus Enum to 4 Values

**File:** `src/types/evm.types.ts`

```typescript
// FROM:
export type RaffleStatus = 0 | 1
// TO:
export type RaffleStatus = 0 | 1 | 2 | 3  // OPEN=0, PENDING_VRF=1, COMPLETED=2, CANCELLED=3

export const RaffleStatusLabel: Record<number, string> = {
  0: 'OPEN',
  1: 'PENDING_VRF',
  2: 'COMPLETED',
  3: 'CANCELLED',
}
```

**File:** `src/hooks/useRaffles.ts` line 14:

```typescript
// FROM:
  status: 0 | 1 // 0=OPEN, 1=COMPLETED
// TO:
  status: 0 | 1 | 2 | 3 // 0=OPEN, 1=PENDING_VRF, 2=COMPLETED, 3=CANCELLED
```

---

## TASK F2: FIX WALLETCONNECT METADATA URL

**File:** `src/config/evm.config.tsx`

```typescript
// Line 47 FROM:
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
// TO:
  icons: ['https://raffled.tuttilabs.xyz/favicon.ico'],

// Line 46 FROM:
  url: import.meta.env.VITE_BASE_URL || 'http://localhost:5173',
// TO:
  url: import.meta.env.VITE_BASE_URL || 'https://raffled.tuttilabs.xyz',
```

---

## TASK F3: IMPLEMENT `useAllRaffles` VIA PONDER GRAPHQL (ZERO RPC COST)

**Architecture:** The Ponder indexer exposes a GraphQL API. A single query returns all raffles. No on-chain reads for listing or activity. No GraphQL client library (raw fetch is sufficient).

**Pre-req:** Ponder indexer running. Dev: `http://localhost:42069/graphql`. Prod: configured via env.

### F3.1: Add Ponder URL Config

**File:** `src/config/evm.config.tsx` — add near top:

```typescript
export const PONDER_GRAPHQL_URL: string =
  import.meta.env.VITE_PONDER_GRAPHQL_URL || 'http://localhost:42069/graphql'
```

### F3.2: Create Lightweight GraphQL Utility

**New file:** `src/utils/ponder.ts`

```typescript
import { PONDER_GRAPHQL_URL } from '../config/evm.config'

export async function ponderQuery<T = any>(
  query: string,
  variables?: Record<string, any>
): Promise<T> {
  const res = await fetch(PONDER_GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`Ponder HTTP ${res.status}`)
  const json = await res.json()
  if (json.errors?.length) throw new Error(json.errors[0].message)
  return json.data as T
}
```

### F3.3: Define Ponder Types

**File:** `src/types/evm.types.ts` — add after existing types:

```typescript
export interface PonderRaffle {
  id: string
  host: string
  prizeAsset: string
  prizeType: 'ERC20' | 'ERC721'
  prizeAmountOrTokenId: string
  prizeSymbol: string
  prizeDecimals: number
  ticketPrice: string
  maxCap: string
  totalTickets: string
  expiry: string
  status: 'OPEN' | 'PENDING_VRF' | 'COMPLETED' | 'CANCELLED'
  underfilled: boolean
  winner: string | null
  vrfRequestId: string | null
  createdAt: string
  resolvedAt: string | null
}

export interface PonderParticipant {
  id: string
  raffleId: string
  user: string
  ticketCount: string
  amountPaid: string
  isWinner: boolean
  hasRefunded: boolean
}

export interface PonderEvent {
  id: string
  raffleId: string
  eventName: string
  from: string | null
  data: Record<string, any>
  txHash: string
  blockTimestamp: string
}
```

### F3.4: Rewrite `useAllRaffles` as Ponder Query

**File:** `src/hooks/useRaffles.ts` — **REPLACE the entire `useAllRaffles` function (lines 31-51)**

```typescript
import { useQuery } from '@tanstack/react-query'
import { ponderQuery } from '../utils/ponder'
import type { PonderRaffle } from '../types/evm.types'

/**
 * Fetch all raffles from Ponder GraphQL.
 * ⚠️ 0 RPC calls. Requires Ponder indexer running.
 */
export function useAllRaffles() {
  return useQuery({
    queryKey: ['ponder', 'raffles'],
    queryFn: async () => {
      const data = await ponderQuery<{ raffles: PonderRaffle[] }>(`
        query AllRaffles {
          raffles(orderBy: "createdAt", orderDirection: "desc", limit: 100) {
            id host prizeAsset prizeType prizeAmountOrTokenId
            prizeSymbol prizeDecimals ticketPrice maxCap totalTickets
            expiry status underfilled winner
            vrfRequestId createdAt resolvedAt
          }
        }
      `)
      return data.raffles
    },
    staleTime: 15_000,
    gcTime: 10 * 60 * 1000,
  })
}
```

### F3.5: Add `enrichRaffle` Helper for Derived Fields

**File:** `src/hooks/useRaffles.ts` — add after `useAllRaffles`:

```typescript
export interface EnrichedRaffle extends PonderRaffle {
  raffleIdNum: number
  expiryNum: number
  timeRemaining: number
  isExpired: boolean
  isFilled: boolean
  progressPercent: number
}

/**
 * Compute display fields (timeRemaining, isExpired, etc.) from Ponder data.
 * Use in components that consume useAllRaffles().
 */
export function enrichRaffle(r: PonderRaffle, now?: number): EnrichedRaffle {
  const ts = now ?? Math.floor(Date.now() / 1000)
  const expiryNum = Number(r.expiry)
  const totalTickets = Number(r.totalTickets)
  const maxCap = Number(r.maxCap)
  return {
    ...r,
    raffleIdNum: Number(r.id),
    expiryNum,
    timeRemaining: Math.max(0, expiryNum - ts),
    isExpired: ts >= expiryNum,
    isFilled: totalTickets >= maxCap,
    progressPercent: maxCap > 0 ? Math.min(100, (totalTickets / maxCap) * 100) : 0,
  }
}
```

### F3.6: Rewrite `useFilteredRaffles`

**File:** `src/hooks/useRaffles.ts` — **REPLACE lines 70-83**

```typescript
export function useFilteredRaffles(filters?: {
  status?: 'active' | 'ended' | 'all'
  type?: 'nft' | 'crypto' | 'all'
}) {
  const { data: allRaffles = [], ...rest } = useAllRaffles()
  const now = Math.floor(Date.now() / 1000)
  const filtered = allRaffles.filter((r) => {
    if (filters?.status === 'active' && now >= Number(r.expiry)) return false
    if (filters?.status === 'ended' && now < Number(r.expiry)) return false
    if (filters?.type === 'nft' && r.prizeType !== 'ERC721') return false
    if (filters?.type === 'crypto' && r.prizeType !== 'ERC20') return false
    return true
  })
  return { data: filtered, ...rest }
}
```

### F3.7: Update Components That Consume Raffle Data

Components that read `ParsedRaffle` fields must be updated to accept `PonderRaffle` and call `enrichRaffle()`:

| Component | What changes |
|---|---|
| `src/Home.tsx` | Replace `ParsedRaffle[]` with `PonderRaffle[]`. Call `enrichRaffle()` before rendering grid. |
| `src/components/evm/RaffleCard.tsx` | Accept `EnrichedRaffle` instead of `ParsedRaffle`. Fields: `timeRemaining`, `isExpired`, `isFilled`, `progressPercent`, `status`, `totalTickets`, `ticketPrice` all mapped. |
| `src/pages/RaffleAdminPage.tsx` | Use `PonderRaffle` for listing (already uses backend API types, this becomes the fallback). |
| `src/pages/LandingPageFrequency.tsx` | Use `useAllRaffles()` instead of backend. Stats bar replaces raffle showcase. |
| `src/pages/RaffleProof.tsx` | NEW: Reads from `useReadContract` with `getRaffle`. Standalone page. |

### F3.8: Keep `useRaffleData(id)` for On-Chain Detail

**File:** `src/hooks/useRaffleContract.ts` — **NO CHANGE** to `useRaffleData()`.

This calls `getRaffle(id)` once per detail page visit — acceptable (1 RPC call, not N+1).

---

## TASK F4: REWRITE USER-BOUND QUERIES VIA PONDER

### F4.1: `useUserTickets` via Ponder

**File:** `src/hooks/useRaffles.ts` — **REPLACE lines 110-130**

```typescript
export function useUserTickets(raffleId: number | undefined) {
  const { address: userAddress } = useAccount()
  return useQuery({
    queryKey: ['ponder', 'participant', raffleId, userAddress],
    queryFn: async () => {
      if (!raffleId || !userAddress) return 0
      const data = await ponderQuery<{ participants: PonderParticipant[] }>(`
        query UserTickets($raffleId: BigInt!, $user: String!) {
          participants(where: { raffleId: $raffleId, user: $user }) {
            ticketCount
          }
        }
      `, { raffleId: String(raffleId), user: userAddress.toLowerCase() })
      return data.participants.reduce((sum, p) => sum + Number(p.ticketCount), 0)
    },
    enabled: !!raffleId && !!userAddress,
    staleTime: 15_000,
  })
}
```

### F4.2: `useRaffleLeaderboard` via Ponder

**File:** `src/hooks/useRaffles.ts` — **REPLACE lines 89-104**

```typescript
export function useRaffleLeaderboard(raffleId: number | undefined) {
  return useQuery({
    queryKey: ['ponder', 'leaderboard', raffleId],
    queryFn: async () => {
      if (!raffleId) return []
      const data = await ponderQuery<{ participants: PonderParticipant[] }>(`
        query Leaderboard($raffleId: BigInt!) {
          participants(
            where: { raffleId: $raffleId }
            orderBy: "ticketCount"
            orderDirection: "desc"
            limit: 20
          ) {
            user ticketCount isWinner
          }
        }
      `, { raffleId: String(raffleId) })
      return data.participants
    },
    enabled: !!raffleId,
    staleTime: 60_000,
  })
}
```

### F4.3: `useRaffleStats` via Ponder

**File:** `src/hooks/useRaffles.ts` — **REPLACE lines 135-146**

```typescript
export function useRaffleStats() {
  const { data: raffles = [] } = useAllRaffles()
  const { address: userAddress } = useAccount()
  const now = Math.floor(Date.now() / 1000)
  return {
    totalRaffles: raffles.length,
    activeRaffles: raffles.filter((r) => now < Number(r.expiry)).length,
    endedRaffles: raffles.filter((r) => now >= Number(r.expiry)).length,
    userCreatedRaffles: raffles.filter((r) => r.host.toLowerCase() === userAddress?.toLowerCase()).length,
    totalPrizePool: raffles.reduce((sum, r) => sum + BigInt(r.prizeAmountOrTokenId), 0n),
  }
}
```

### F4.4: `useActivityEvents` via Ponder

**File:** `src/hooks/useActivityEvents.ts` — **REPLACE the backend API fetch with Ponder**

```typescript
import { ponderQuery } from '../utils/ponder'
import type { PonderEvent } from '../types/evm.types'

export function useActivityEvents(limit = 50) {
  // ... existing state management (page, hasMore, etc.) ...
  
  // Replace the apiFetch(`${BACKEND_URL}/events`) call with:
  const data = await ponderQuery<{ events: PonderEvent[] }>(`
    query ActivityEvents($limit: Int!) {
      events(orderBy: "blockTimestamp", orderDirection: "desc", limit: $limit) {
        id eventName raffleId from data txHash blockTimestamp
      }
    }
  `, { limit })
  return data.events
}
```

---

## TASK F5: REPLACE SSE DEPENDENCY WITH EVENT-DRIVEN REFRESH

### F5.1: Disable SSE

**File:** `src/hooks/useSSEEvents.ts` — add at top:

```typescript
const SSE_ENABLED = false // Backend suspended — disabled

// In the hook, early-return when disabled:
if (!SSE_ENABLED) {
  return { subscribe: (_cb: any) => () => {}, isConnected: false }
}
```

### F5.2: EventToast Falls Back to Ponder Polling

**File:** `src/components/evm/EventToast.tsx`

Replace SSE subscription with a `useQuery` that polls Ponder every 15s for latest events. Or use wagmi's `useWatchContractEvent` for real-time updates.

---

## TASK F6: WIZARD UI ON CREATERAFFLEPAGE

**File:** `src/pages/CreateRafflePage.tsx`

### F6.1: Step Navigation Logic

Add after line 314 (after `currentStepIndex`):

```tsx
const canProceedToStep2 = prizeType === PrizeType.ERC20
  ? (prizeAsset && prizeAmount)
  : (nftAsset && tokenId)
const canProceedToStep3 = ticketPrice && maxCap && duration

const handleNext = () => {
  if (wizardStep === 'asset_details' && canProceedToStep2) setWizardStep('mechanics')
  else if (wizardStep === 'mechanics' && canProceedToStep3) setWizardStep('review')
}
const handleBack = () => {
  if (wizardStep === 'mechanics') setWizardStep('asset_details')
  else if (wizardStep === 'review') setWizardStep('mechanics')
}
```

### F6.2: Conditional Section Visibility

Wrap ASSET_SPECIFICATION (lines 380-498) in `{wizardStep === 'asset_details' && (...)}`.
Wrap RAFFLE_MECHANICS (lines 500-546) in `{wizardStep === 'mechanics' && (...)}`.

### F6.3: Add Next/Back Buttons

After the mechanics section, add:

```tsx
<div className="flex gap-3 mt-6">
  {wizardStep !== 'asset_details' && (
    <button onClick={handleBack} className="flex-1 p-3 border border-[#2a2a2a] rounded-lg font-mono text-xs text-[#999999] uppercase tracking-wider hover:border-[#555555] hover:text-[#F5F5F5]">
      ← Back
    </button>
  )}
  {wizardStep !== 'review' ? (
    <button onClick={handleNext} disabled={(wizardStep === 'asset_details' && !canProceedToStep2) || (wizardStep === 'mechanics' && !canProceedToStep3)} className="flex-1 p-3 bg-[#FFB800] rounded-lg font-mono text-xs text-[#050505] font-bold uppercase tracking-wider disabled:bg-[#111111] disabled:text-[#333333]">
      Next →
    </button>
  ) : null}
</div>
```

### F6.4: Make Backend POST Non-Blocking

Wrap lines 287-295 in try/catch:

```typescript
try {
  const backendData = await postRaffleToBackend(hash)
  if (isFreeRaffle && backendData?.raffle?.id) {
    await postRaffleTask(backendData.raffle.id)
  }
} catch {
  console.warn('Backend unavailable — raffle metadata not saved off-chain')
}
```

---

## TASK F7: EMBED ROUTE (/embed/:id)

### F7.1: Create Embed Component

**New file:** `src/pages/EmbedRaffle.tsx`

Minimal iframe-friendly page: no navbar, no sidebar, no footer. Shows raffle details + "Buy Tickets" button. Import `useRaffleData` from `useRaffleContract` (on-chain, 1 RPC call per embed — acceptable).

### F7.2: Add Route

**File:** `src/App.tsx`

```tsx
import EmbedRaffle from './pages/EmbedRaffle'

// Add before /app/* route:
<Route path="/embed/:id" element={<EmbedRaffle />} />
```

---

## TASK F8: RAFFLEADMINPAGE UPGRADES

**File:** `src/pages/RaffleAdminPage.tsx`

### F8.1: On-Chain Fallback via Ponder

When backend API calls fail, fall back to `useAllRaffles()` from Ponder:

```tsx
import { useAllRaffles } from '../hooks/useRaffles'

// Inside component:
const { data: onChainRaffles = [] } = useAllRaffles()
const displayRaffles = rafflesData?.data?.length ? rafflesData.data : onChainRaffles
```

### F8.2: Add "Manual Resolve" Button

```tsx
import { useWriteContract } from 'wagmi'
import { encodeAbiParameters } from 'viem'

const { writeContractAsync } = useWriteContract()

const handleManualResolve = async () => {
  if (!contractRaffleId) return
  try {
    const performData = encodeAbiParameters(
      [{ type: 'uint256' }],
      [BigInt(contractRaffleId)]
    )
    await writeContractAsync({
      address: contractAddress as Address,
      abi: RaffleManagerABI,
      functionName: 'performUpkeep',
      args: [performData],
    })
  } catch (err) {
    console.error('Manual resolve failed:', err)
  }
}
```

---

## TASK F9: LANDING PAGE REBRAND (FULL B2B PIVOT — KEEP "RAFFLED" NAME)

**What changes:** The landing page shifts from consumer-focused ("enter raffles, win prizes") to project/host-focused ("launch verifiable raffles in 2 minutes"). All consumer raffle showcases are removed from the landing page (they stay in the /app dashboard). The landing page becomes a sales page for B2B raffle infrastructure.

### F9.0: CLEAN UP LANDING PAGE VARIANTS

Currently 3 landing page variants exist. Keep only `LandingPageFrequency.tsx` (already at `/`). Delete:

- `src/pages/LandingPageOriginal.tsx`
- `src/components/landing/` (entire directory — Button, FeatureSection, FloatingCoins, Footer, HeroSection, RaffleBox, RaffleShowcase)
- `src/pages/LandingPage2.tsx`
- `src/components/landing-2/` (entire directory — Background, Button, FeatureSection2, Footer2, GlassCard, Header2, HeroSection2)
- `src/styles/LandingPage2.css`
- `src/hooks/useLenis.ts` (only used by v1 landing)
- `src/hooks/useGSAP.ts` (only used by v1 landing)
- Remove `/lp-2` and `/lp-old` routes from `App.tsx`

After deletion, remove unused npm dependencies:
```bash
bun remove @shadergradient/react three @react-three/fiber @react-three/drei gsap @gsap/react lenis
```
If any of these are still used elsewhere, skip that package.

### F9.1: REWRITE HERO SECTION — B2B POSITIONING

**File:** `src/pages/LandingPageFrequency.tsx`

Replace the existing hero with host-focused copy:

```tsx
<section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
  <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
    <p className="font-mono text-[10px] text-[#FFB800] uppercase tracking-[0.3em] mb-6">
      B2B RAFFLE INFRASTRUCTURE · CHAINLINK VRF
    </p>
    <h1 className="font-sans font-bold text-4xl md:text-6xl lg:text-7xl text-[#F5F5F5] leading-[1.1] mb-6">
      Launch a provably-fair<br/>
      <span className="text-[#FFB800]">raffle in 2 minutes.</span>
    </h1>
    <p className="font-mono text-sm md:text-base text-[#666666] max-w-xl mx-auto mb-10">
      White-label raffle infrastructure for Base projects. Whitelist draws, token drops, NFT giveaways — all verified by Chainlink VRF. No bots. No Google Forms.
    </p>
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
      <a href="/app/create-raffle" className="px-8 py-4 bg-[#FFB800] text-[#050505] font-mono font-bold text-sm uppercase tracking-wider rounded-lg hover:bg-[#FFCC33] hover:shadow-[0_0_24px_rgba(255,184,0,0.3)] transition-all inline-block">
        Launch Your First Raffle →
      </a>
      <a href="/docs/embed" className="px-8 py-4 border border-[#2a2a2a] text-[#999999] font-mono text-sm uppercase tracking-wider rounded-lg hover:border-[#555555] hover:text-[#F5F5F5] transition-all inline-block">
        View Embed Docs
      </a>
    </div>
  </div>
</section>
```

**Remove the ticker bar** (TICKER_ITEMS constant and its rendered element) — the scrolling "PRIZES PAID INSTANTLY" / "FREE ENTRIES AVAILABLE" text is consumer-facing.

### F9.2: REPLACE CONSUMER FEATURE CARDS WITH B2B FEATURES

**File:** `src/pages/LandingPageFrequency.tsx`

**Current:** FEATURES array (lines 23-48) has 6 consumer-focused cards.

**Replace with B2B-focused benefits (what the HOST gets):**

```typescript
const FEATURES = [
  {
    title: 'Chainlink VRF Verified',
    body: 'Every winner is picked by Chainlink on-chain randomness. Participants can verify the VRF transaction on BaseScan. No trust required.',
  },
  {
    title: 'Whitelist & Free Entry',
    body: 'Upload a CSV of addresses or generate EIP-712 signatures. Run invite-only raffles, airdrops, and community rewards — all enforced on-chain.',
  },
  {
    title: 'Underfill Protection',
    body: 'Raffle did not fill? Prize goes back to host — but ticket payments still get raffled to a participant. Zero risk of lost inventory.',
  },
  {
    title: 'Embeddable Widget',
    body: 'Drop an iframe on your mint page, Discord, or blog. One line of HTML. Your raffle lives inside YOUR brand surface.',
  },
  {
    title: 'Instant Payouts',
    body: 'Winner picked → prize sent to wallet in the same transaction. No claiming ceremony. No 48-hour wait.',
  },
  {
    title: 'Self-Custody',
    body: 'Your funds never touch our servers. The smart contract holds everything on Base. Transparent, auditable, unruggable.',
  },
]
```

### F9.3: REMOVE CONSUMER RAFFLE SHOWCASE FROM LANDING

**File:** `src/pages/LandingPageFrequency.tsx`

**Remove:**
- The tab-filtered raffle showcase (tabs "all" / "erc20" / "erc721" and the raffle grid displaying BackendRaffle data)
- The `BackendRaffle` import (line 4) and `BACKEND_URL` import (line 3) — if no longer used elsewhere on the page
- The `TabKey` type

**Replace with:** A stats bar using `useRaffleStats()` from the hooks:

```tsx
import { useRaffleStats } from '../hooks/useRaffles'

// Inside the component:
const stats = useRaffleStats()

// Render:
<section className="py-16 border-t border-[#1f1f1f]">
  <div className="max-w-5xl mx-auto px-4">
    <p className="font-mono text-[10px] text-[#555555] uppercase tracking-[0.3em] text-center mb-10">
      Trusted by projects on Base
    </p>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1f1f1f] rounded-xl overflow-hidden border border-[#1f1f1f]">
      {[
        { label: 'Raffles Hosted', value: stats.totalRaffles, color: '#FFB800' },
        { label: 'Active Now', value: stats.activeRaffles, color: '#22C55E' },
        { label: 'Completed', value: stats.endedRaffles, color: '#3B82F6' },
        { label: 'Your Raffles', value: stats.userCreatedRaffles, color: '#A855F7' },
      ].map(({ label, value, color }) => (
        <div key={label} className="bg-[#0a0a0a] px-6 py-8 text-center">
          <p className="font-sans font-bold text-3xl" style={{ color }}>{value}</p>
          <p className="font-mono text-[10px] text-[#555555] uppercase tracking-wider mt-2">{label}</p>
        </div>
      ))}
    </div>
  </div>
</section>
```

### F9.4: ADD PRICING SECTION

**File:** `src/pages/LandingPageFrequency.tsx` — add between features and How It Works

Three pricing tiers using the existing Dark Tech design tokens:

- **Tier 1 (Free):** First 3 raffles. Full wizard access. Embed widget. Chainlink VRF. Up to 500 tickets. No credit card needed.
- **Tier 2 (Standard, highlighted with amber border):** 2% of ticket sales. Unlimited raffles/tickets. Whitelist support. Analytics dashboard. Priority support. CTA: "Start Building"
- **Tier 3 (Custom, purple accent):** Flat fee. Whitelist-only draws. Custom fee structure. Dedicated support. "Coming soon"

Use `<a href="/app/create-raffle">` for CTAs instead of `navigate()` to work without React router context.

### F9.5: REWRITE "HOW IT WORKS" FOR HOSTS

**File:** `src/pages/LandingPageFrequency.tsx`

Replace the current consumer-facing "Browse Raffle → Buy tickets → Claim prize" with host-facing 3-step flow:

1. **Configure** — Pick prize (ERC-20 or NFT), set ticket price in USDC, duration, max tickets. Upload whitelist if invite-only.
2. **Share** — Get a shareable link or embed snippet. Drop on website, Discord, Twitter. Participants enter from their wallet.
3. **Verify** — Chainlink VRF picks winner. Prize sent automatically. Everything on-chain, verifiable on BaseScan.

Reuse the existing 3-column numbered-circle layout from the current page (keep CSS classes).

### F9.6: ADD PROOF PAGE (Verifiable Raffle Results)

**New file:** `src/pages/RaffleProof.tsx`

Public page at `/raffle/:id/proof` showing on-chain verification data. Uses `useReadContract` with `getRaffle` (1 RPC call, acceptable for detail page).

Display: Raffle ID + status, Host address (linked to BaseScan), Prize details, "Randomness Provider: Chainlink VRF v2.5" with link to vrf.chain.link, Underfilled status, and a footer "All data verified on Base Sepolia · RaffledCore 0xc17eee..."

Add route in `App.tsx`:
```tsx
import RaffleProof from './pages/RaffleProof'
<Route path="/raffle/:id/proof" element={<RaffleProof />} />
```

### F9.7: ADD "GETTING STARTED" SECTION

Add after How It Works, before FAQ — 4-step guide for project hosts, each as a bordered card:

1. Connect wallet (any EVM wallet, Base Sepolia for testing, Base mainnet for production)
2. Create first raffle (use wizard at /app/create-raffle, first 3 free)
3. Share with community (public link + embed snippet)
4. Prove it was fair (proof page at /raffle/{id}/proof)

Footer CTA: "Launch Free Trial →" linking to /app/create-raffle.

### F9.8: NEUTRALIZE GEOGRAPHICAL SIGNALS

Run:
```bash
grep -ri "indonesia|indonesian|idr|jakarta|bali" src/ --include="*.tsx" --include="*.ts" --include="*.css" --include="*.json"
```
Expected: zero results.

Also verify:
- `DESIGN.md` — no local language/references
- `vercel.json` — no geo-redirects
- Chain config — Base only (global chain), no local references
- Footer links in `Layout.tsx`: point to `raffled.tuttilabs.xyz`, add link to `/docs/embed`, add link to `/raffle/1/proof` as demo

### F9.9: ADD DOCS/EMBED PAGE

**New file:** `src/pages/DocsEmbed.tsx`

Simple docs at `/docs/embed` showing the iframe embed code with instructions:

```html
<iframe
  src="https://raffled.tuttilabs.xyz/embed/{raffleId}"
  width="400"
  height="600"
  frameborder="0"
  allow="clipboard-write"
></iframe>
```

Include: how to find your raffle ID, customization options, live preview iframe.

Add route in `App.tsx`:
```tsx
import DocsEmbed from './pages/DocsEmbed'
<Route path="/docs/embed" element={<DocsEmbed />} />
```

### F9.10: UPDATE FOOTER & NAV LINKS

**File:** `src/components/evm/Layout.tsx`

Ensure footer:
- Points to `raffled.tuttilabs.xyz` (not vercel.app)
- GitHub link → actual repo URL
- Link to `/docs/embed` (Embed Docs)
- Link to `/raffle/1/proof` (View Proof Demo)

**File:** `src/components/evm/Navbar.tsx`
- Update any hardcoded URLs to use `raffled.tuttilabs.xyz`

## TASK F10: CREATE 3 DEMO RAFFLES

After deployment, create on Base Sepolia:

1. **Public ERC-20:** 100 USDC prize, 100 tickets @ 1 USDC, 7-day duration
2. **Whitelist-free:** 1 NFT prize, 50 tickets (free via EIP-712), tweet task required
3. **Underfill demo:** 1000 USDC prize, 500 tickets @ 2 USDC, 3-day (let it underfill)

These are GTM assets for Week 2 (DM 20 Base projects).

---

## EXECUTION ORDER (DEPENDENCY-AWARE)

1. **F1.1** → Update contract address
2. **F1.2** → Build & copy RaffledCore ABI, update all imports
3. **F1.3** → Fix function names (`raffles` → `getRaffle`)
4. **F1.4** → Update status enum to 4 values
5. **F2** → Fix WalletConnect URL
6. ⚠️ **DEPLOY PONDER INDEXER** (from contract plan Part B) — must be live before F3
7. **F3.1** → Add PONDER_GRAPHQL_URL config
8. **F3.2** → Create `src/utils/ponder.ts`
9. **F3.3** → Define PonderRaffle/PonderParticipant/PonderEvent types
10. **F3.4-F3.6** → Rewrite useAllRaffles, enrichRaffle, useFilteredRaffles
11. **F3.7** → Update all components consuming raffle data (RaffleCard, Home, AdminPage, Landing)
12. **F4.1-F4.4** → Rewrite useUserTickets, useRaffleLeaderboard, useRaffleStats, useActivityEvents
13. **F5** → Disable SSE, fallback to Ponder polling
14. **F6** → Wizard UI step enforcement
15. **F7** → Embed route + EmbedRaffle page
16. **F8** → AdminPage Ponder fallback + manual resolve
17. **F9** → Rebrand copy + docs/embed page
18. **F10** → Create 3 demo raffles

**Build after each group:**
```bash
cd ~/repos/Raffled-client
bun run build  # TypeScript check + Vite build
bun run dev    # Test on localhost:5173
```

---

## VERIFICATION CHECKLIST

- [ ] `useAllRaffles()` returns real raffle data from Ponder (0 RPC calls)
- [ ] WalletConnect modal shows no metadata URL mismatch
- [ ] CreateRafflePage wizard enforces step-by-step flow with Next/Back
- [ ] `/embed/1` shows a minimal iframe-friendly raffle view
- [ ] Admin page shows raffle data from Ponder (even with backend down)
- [ ] "Manual Resolve" button calls performUpkeep directly
- [ ] SSE hook is disabled — no EventSource errors in console
- [ ] Contract calls use RaffledCore ABI (`getRaffle`, not `raffles`)
- [ ] Raffle cards show correct status: OPEN / PENDING_VRF / COMPLETED / CANCELLED
- [ ] `enrichRaffle()` correctly computes timeRemaining, isExpired, isFilled, progressPercent
- [ ] 3 demo raffles are live on Base Sepolia and viewable in the app
- [ ] Landing page has no Indonesian references
