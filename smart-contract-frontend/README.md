# Smart account Frontend


## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Address configuation

Under `src/lib/contracts/addresses.ts`:

```typescript
export const addresses = {
  sepolia: {
    entryPoint: '0x0000000071727De22E5E9d8BAf0edAc6f37da032', // v0.7
    factory: '0x26fC0Bf3D80663A8Bbbe51faAa341b2762C81195', // under /smart-contract/src/Factory.sol
    paymaster: '0x18bF042488F4e36Cc65993715F7a14097740BE4F', // under /smart-contract/src/MyPaymaster.sol
    nft: '0x90B54B4C9B926ACD2F8461196c3371Db920800b2',//under /smart-contract/src/MyMFERS.sol
    smartAccount: '0x90B54B4C9B926ACD2F8461196c3371Db920800b2' // under /smart-contract/src/MyAccount.sol
  }
};
```

### 3. The bundler is handled by Pimlico 

### 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:5173

## Deployment Checklist

Before testing, make sure:

1. **Deploy contracts to Sepolia**:
   - `MyAccountFactory`
   - `MyPaymaster`
   - `MyMFERS` (NFT)

2. **Create a Smart Account**:
   ```solidity
   factory.createAccount(
     [owner1, owner2],  // owners array
     2,                  // threshold
     [guardian1],        // guardians
     1,                  // guardian threshold
     salt
   );
   ```

3. **Fund the Paymaster**:
   ```solidity
   paymaster.deposit{value: 0.1 ether}();
   ```

4. **Transfer NFT ownership to Smart Account**:
   ```solidity
   nft.transferOwnership(smartAccountAddress);
   ```

## Architecture

```
src/lib/
├── components/
│   ├── WalletPanel.svelte     # Wallet connection & account info
│   ├── ActionsPanel.svelte    # Action buttons (mint, session keys)
│   └── LogsPanel.svelte       # Real-time logs display
├── contracts/
│   ├── abis.ts                # Contract ABIs
│   └── addresses.ts           # Deployed addresses
├── services/
│   ├── bundler.ts             # Pimlico bundler integration
│   ├── signing.ts             # Signature logic (owners, session keys)
│   └── userOp.ts              # UserOperation orchestration
├── stores/
│   ├── logs.ts                # Logs state management
│   └── wallet.ts              # Wallet & account state
└── utils/
    └── format.ts              # Formatting helpers
```

## Testing Scenarios

### 1. Single Owner Mint (threshold = 1)
- Connect wallet
- Click "MINT NFT"
- MetaMask signs the UserOp
- NFT is minted to Smart Account

### 2. Multi-Sig Mint (threshold = 2)
- Set threshold to 2 in Smart Account
- Paste second owner's private key (for simulation)
- Click "MINT (MULTI-SIG)"
- Both signatures are collected
- NFT is minted

### 3. Session Key (Reusable)
- Click "CREATE (5 MIN)"
- Session key is registered on-chain via UserOp
- Click "MINT WITH KEY"
- Repeat to mint multiple times

### 4. One-Time Session Key
- Click "CREATE (ONE-TIME)"
- Session key is registered on-chain
- Click "MINT WITH KEY"
- Click "CHECK" - status shows USED
- Next mint attempt will fail

## Tech Stack

- **Svelte 5** - Frontend framework
- **Viem** - Ethereum interactions
- **Pimlico** - ERC-4337 bundler
- **TypeScript** - Type safety
