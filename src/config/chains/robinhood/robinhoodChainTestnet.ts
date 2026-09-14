// Define Robinhood Chain as a custom network
export const robinhoodChainTestnet = {
  id: 46630,
  name: 'Robinhood Chain Testnet',
  caipNetworkId: 'eip155:46630',
  chainNamespace: 'eip155',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_ROBINHOOD_TESTNET_RPC_URL!],
    },
    public: {
      http: [import.meta.env.VITE_ROBINHOOD_TESTNET_RPC_URL!],
    },
  },
  blockExplorers: {
    default: {
      name: 'Robinhood Testnet Blockscout',
      url: 'https://explorer.testnet.chain.robinhood.com',
    },
  },
}
