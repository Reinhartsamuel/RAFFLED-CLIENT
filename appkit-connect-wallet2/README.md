# Reown AppKit Wallet Connection Demo

This project demonstrates how to integrate Reown AppKit for wallet connection in a React application.

## Prerequisites

- Node.js (v20.19.0 or later)
- npm (comes with Node.js)
- A Web3 wallet (like MetaMask) installed in your browser

## Installation

```bash
# Install dependencies
npm install
```

## Development

To start the development server:

```bash
npm run dev
```

The app will be available at http://localhost:5173

## Features

- Wallet connection using Reown AppKit
- Support for multiple chains (Ethereum Mainnet and Sepolia Testnet)
- Connection state management
- Wallet address display
- Disconnect functionality

## Usage

1. Start the development server
2. Click the "Connect Wallet" button
3. Select your wallet (e.g., MetaMask)
4. Approve the connection request in your wallet
5. Your wallet address will be displayed once connected
6. Use the "Disconnect" button to disconnect your wallet

## Built With

- React + TypeScript
- Vite
- @reown/appkit
- @reown/appkit-adapter-wagmi
- wagmi
- viem
- @tanstack/react-query

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
