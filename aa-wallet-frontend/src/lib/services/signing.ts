import {
  type Address,
  type Hex,
  type WalletClient,
  encodeAbiParameters,
  parseAbiParameters,
  hashMessage,
  keccak256
} from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { logs } from '$lib/stores/logs';
import type { UserOperationV7 } from './bundler';

// Signature modes (must match contract)
const SIG_OWNERS = 0;
const SIG_SESSION = 1;

export interface SessionKeyData {
  privateKey: Hex;
  address: Address;
  expiresAt: number;
  oneTime: boolean;
}

// Generate a new session key
export function generateSessionKey(
  expiresInMinutes: number = 5,
  oneTime: boolean = false
): SessionKeyData {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInMinutes * 60;

  logs.info(
    `Session key generated: ${account.address.slice(0, 10)}...`,
    `Expires: ${new Date(expiresAt * 1000).toLocaleTimeString()}, OneTime: ${oneTime}`
  );

  return {
    privateKey,
    address: account.address,
    expiresAt,
    oneTime
  };
}

// Sign UserOp with single owner (threshold = 1)
export async function signUserOpSingleOwner(
  walletClient: WalletClient,
  userOpHash: Hex,
  ownerAddress: Address
): Promise<Hex> {
  logs.info(`Signing with owner: ${ownerAddress.slice(0, 10)}...`);

  // Sign the hash (wallet will add Ethereum prefix)
  const signature = await walletClient.signMessage({
    account: ownerAddress,
    message: { raw: userOpHash }
  });

  // Encode as owners mode signature
  const encoded = encodeAbiParameters(
    parseAbiParameters('uint8, bytes'),
    [
      SIG_OWNERS,
      encodeAbiParameters(parseAbiParameters('address[], bytes[]'), [
        [ownerAddress],
        [signature]
      ])
    ]
  );

  logs.success('Signature complete');
  return encoded;
}

// Sign UserOp with multiple owners (multi-sig)
export async function signUserOpMultiSig(
  walletClient: WalletClient,
  userOpHash: Hex,
  owners: Address[],
  additionalSignatures?: { address: Address; signature: Hex }[]
): Promise<Hex> {
  logs.info(`Multi-sig signing with ${owners.length} owners...`);

  const signers: Address[] = [];
  const signatures: Hex[] = [];

  // Sign with connected wallet first
  const connectedAddress = walletClient.account?.address;
  if (connectedAddress && owners.includes(connectedAddress)) {
    logs.info(`Signing with connected wallet: ${connectedAddress.slice(0, 10)}...`);
    const sig = await walletClient.signMessage({
      account: connectedAddress,
      message: { raw: userOpHash }
    });
    signers.push(connectedAddress);
    signatures.push(sig);
  }

  // Add additional signatures (from simulated owners or other devices)
  if (additionalSignatures) {
    for (const { address, signature } of additionalSignatures) {
      logs.info(`Adding signature from: ${address.slice(0, 10)}...`);
      signers.push(address);
      signatures.push(signature);
    }
  }

  // Encode as owners mode signature
  const encoded = encodeAbiParameters(
    parseAbiParameters('uint8, bytes'),
    [
      SIG_OWNERS,
      encodeAbiParameters(parseAbiParameters('address[], bytes[]'), [signers, signatures])
    ]
  );

  logs.success(`Multi-sig complete: ${signers.length} signatures`);
  return encoded;
}

// Sign UserOp with session key
export async function signUserOpWithSessionKey(
  sessionKey: SessionKeyData,
  userOpHash: Hex
): Promise<Hex> {
  logs.info(`Signing with session key: ${sessionKey.address.slice(0, 10)}...`);

  const account = privateKeyToAccount(sessionKey.privateKey);

  // Sign the hash
  const signature = await account.signMessage({
    message: { raw: userOpHash }
  });

  // Encode as session mode signature
  const encoded = encodeAbiParameters(
    parseAbiParameters('uint8, bytes'),
    [
      SIG_SESSION,
      encodeAbiParameters(parseAbiParameters('address, bytes'), [
        sessionKey.address,
        signature
      ])
    ]
  );

  logs.success('Session key signature complete');
  return encoded;
}

// Simulate additional owner signing (for demo/testing)
// In production, this would be done on a separate device
export async function simulateOwnerSignature(
  privateKey: Hex,
  userOpHash: Hex
): Promise<{ address: Address; signature: Hex }> {
  const account = privateKeyToAccount(privateKey);

  const signature = await account.signMessage({
    message: { raw: userOpHash }
  });

  return {
    address: account.address,
    signature
  };
}
