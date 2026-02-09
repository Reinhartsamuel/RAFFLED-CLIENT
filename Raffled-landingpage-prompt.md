# VIBECODING BLUEPRINT "RAFFLED": DECENTRALIZED RAFFLE (Y2K NEO-BRUTALIST)



## Role

You are a Lead Frontend Engineer and Creative Technologist specialized in Web3 "Editorial" design. Your mission is to build a high-performance, high-contrast Decentralized Raffle Platform called "Raffled".

You are a Senior Full-Stack Web3 Engineer and Creative Technologist. Your goal is to build "Raffled"—a high-stakes, decentralized raffle platform. The design is "Acid Editorial" Neo-Brutalism. It must feel like a high-end fashion magazine crossed with a degen crypto terminal.

## Design Language: "Acid Editorial" 
reference: ./src/assets/collusion1.png, ./src/assets/collusion-2.png, ./src/assets/collusion-3.png    

- **Constraint 1 (Borders):** 2px solid #000000 on EVERYTHING. No border-radius (0px).

- **Constraint 2 (Palette):** White dominant background (#FFFFFF). Accents: Safety Lime (#DFFF00), Pure Black (#000000), and Cyan (#00F2FF).

- **Constraint 3 (Typography):** - Massive, condensed headers (Druk Wide/Impact style). 
  - Use Google Fonts to load 'Syne' for headers and 'JetBrains Mono' for all UI text. Configure them in tailwind.config.js.

  - All-caps for buttons and navigational elements.

  - Mono-spaced fonts for wallet addresses and ticket numbers.

- **Constraint 4 (Layout):** Split-screen hero. Left: Dynamic ticker/image. Right: Direct "Buy Ticket" CTA.

- **Constraint 5 (Hero Visual):** Instead of a model, use a high-grain, "lo-fi" 3D render of a raffle box or a spinning ticker, using a snapshot/street photography filter using CSS below:
The "Live Raffle" Centerpiece:Solana/Base Icons: High-contrast SVG logos in "Safety Yellow" ($#DFFF00$) or pure Black/White.Hero Visual: Instead of a model, use a high-grain, "lo-fi" 3D render of a raffle box or a spinning ticker, using a snapshot/street photography filter.
```
.grainy-overlay {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  opacity: 0.05;
  pointer-events: none;
}
```

Hero Visual (Assetless 3D):

Do NOT use external .glb or .obj files.

Implement a CSS 3D Cube using transform-style: preserve-3d.

Faces of the cube should cycle through Safety Lime and Cyan with black borders.

Animation: Continuous slow GSAP rotation, with a "jitter" and "fast-spin" effect on mouse hover.

// RaffleBox.tsx
export const RaffleBox = () => {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="relative h-48 w-48 [perspective:1000px]">
        <div className="relative h-full w-full [transform-style:preserve-3d] animate-[spin_10s_linear_infinite] hover:pause">
          {/* Front */}
          <div className="absolute inset-0 border-2 border-black bg-[#DFFF00] [transform:translateZ(100px)] flex items-center justify-center font-bold text-black">RAFFLED</div>
          {/* Back */}
          <div className="absolute inset-0 border-2 border-black bg-white [transform:rotateY(180deg)_translateZ(100px)]"></div>
          {/* Right */}
          <div className="absolute inset-0 border-2 border-black bg-[#00F2FF] [transform:rotateY(90deg)_translateZ(100px)]"></div>
          {/* Left */}
          <div className="absolute inset-0 border-2 border-black bg-[#00F2FF] [transform:rotateY(-90deg)_translateZ(100px)]"></div>
          {/* Top */}
          <div className="absolute inset-0 border-2 border-black bg-black [transform:rotateX(90deg)_translateZ(100px)]"></div>
          {/* Bottom */}
          <div className="absolute inset-0 border-2 border-black bg-black [transform:rotateX(-90deg)_translateZ(100px)]"></div>
        </div>
      </div>
    </div>
  );
};

## Functional Features

1. **Fully On-chain:** Interaction with Base (EVM) and Solana (SVM). 

2. **Secure Randomness:** Integrate Chainlink VRF (Base) and Orao VRF (Solana) logic.

3. **Raffle Engine:** - `createRaffle(duration, ticketPrice, prizePool)`

   - `buyTickets(amount)`

   - `claimPrize()`

4. **Ticker:** A scrolling marquee at the top showing "RECENT WINNERS +++ JACKPOT: 50 SOL +++ BASE NETWORK LIVE +++".
Smart Contract Logic (Base - Solidity):

Core Raffle: Implement a Solidity contract that stores raffle state, ticket prices, and entrant lists.

Official Bridge Integration: Use the Base-Solana Bridge standards. The contract must accept calls from the Bridge Contract and identify Solana users via their Twin Contract addresses.

Secure Randomness: Use Chainlink VRF v2.5 on Base to select winners. Selection must be triggered only after the raffle timer expires.




## Motion & Interactivity

- **Lenis Scroll:** Momentum-based scrolling.

- **GSAP Effects:** - "Jitter" effect on buttons during hover.

  - "Staggered Reveal" for ticket lists (cards pop in with 0ms transition but staggered delay). Transitions: Use GSAP ScrollTrigger for "Staggered Reveal" on raffle cards (0ms duration, 50ms stagger).

- **Framer Motion:** Image glitch filters on hover over active raffles.
Hover States: * Buttons: 4px hard black shadow that shifts to 0px on click.
Cards: Glitch-filter overlay (Framer Motion) on hover for active raffles.
Ticker: Infinite CSS marquee at the top: "RECENT WINNERS +++ JACKPOT: 50 ETH +++ SOLANA BRIDGE ACTIVE +++".




## Mobile Adaptation

- Change 50/50 split-screen to 100/100 vertical stack.

- Floating "Connect Wallet" button at the bottom right with a heavy drop shadow.