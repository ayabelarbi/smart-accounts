// Contract addresses - UPDATE THESE after deployment
export const addresses = {
  // Sepolia testnet
  sepolia: {
    entryPoint: '0x0000000071727De22E5E9d8BAf0edAc6f37da032' as const, // v0.7 EntryPoint
    factory: '0x26fC0Bf3D80663A8Bbbe51faAa341b2762C81195' as const,
    paymaster: '0x18bF042488F4e36Cc65993715F7a14097740BE4F' as const,
    nft: '0x90B54B4C9B926ACD2F8461196c3371Db920800b2' as const,
    // Pre-computed smart account address (optional, can be computed)
    smartAccount: '0x3D18509a0EaB0F97721D63D29753F39BbF8f1ABd' as const
  },
  // Arbitrum Sepolia testnet
  arbitrumSepolia: {
    entryPoint: '0x0000000071727De22E5E9d8BAf0edAc6f37da032' as const, // v0.7 EntryPoint
    factory: '0x_YOUR_FACTORY_ADDRESS_HERE' as const,
    paymaster: '0x_YOUR_PAYMASTER_ADDRESS_HERE' as const,
    nft: '0x_YOUR_NFT_ADDRESS_HERE' as const,
    smartAccount: '0x_YOUR_SMART_ACCOUNT_ADDRESS_HERE' as const
  }
} as const;

// Select active network
export type NetworkKey = keyof typeof addresses;
export const ACTIVE_NETWORK: NetworkKey = 'sepolia';

// Helper to get current addresses
export function getAddresses() {
  return addresses[ACTIVE_NETWORK];
}

// Chain IDs
export const chainIds = {
  sepolia: 11155111,
  arbitrumSepolia: 421614
} as const;

export function getChainId() {
  return chainIds[ACTIVE_NETWORK];
}
