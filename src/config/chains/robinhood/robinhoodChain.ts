// Define Robinhood Chain as a custom network
export const robinhoodChain = {
  id: 4663,
  name: 'Robinhood Chain',
  caipNetworkId: 'eip155:4663',
  chainNamespace: 'eip155',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_ROBINHOOD_MAINNET_RPC_URL!],
    },
    public: {
      http: [import.meta.env.VITE_ROBINHOOD_MAINNET_RPC_URL!],
    },
  },
  blockExplorers: {
    default: {
      name: 'Robinhood Blockscout',
      url: 'https://robinhoodchain.blockscout.com/',
    },
  },
}
