import {
  createPublicClient,
  http,
  type Address,
  type Hex,
  encodeFunctionData,
  toHex,
  type PublicClient
} from 'viem';
import { sepolia, arbitrumSepolia } from 'viem/chains';
import { ACTIVE_NETWORK, getAddresses } from '$lib/contracts/addresses';
import { entryPointAbi, myAccountAbi } from '$lib/contracts/abis';
import { logs } from '$lib/stores/logs';

// Pimlico API Key - UPDATE THIS
const PIMLICO_API_KEY = "pim_GT2fGostX279KhCRWvECRs";

const chains = { sepolia, arbitrumSepolia };
const chain = chains[ACTIVE_NETWORK];

// RPC URLs - Pimlico v2 for ERC-4337 v0.7
const bundlerUrl = `https://api.pimlico.io/v2/${chain.id}/rpc?apikey=${PIMLICO_API_KEY}`;

// Create public client
export function createClients() {

  const publicClient = createPublicClient({
    chain,
    transport: http()
  });
  return { publicClient };
}

// JSON-RPC call to bundler
async function bundlerRpc(method: string, params: unknown[]): Promise<unknown> {
  console.log('📤 Bundler RPC:', method);
  console.log('📤 Params:', JSON.stringify(params, null, 2));
  
  const response = await fetch(bundlerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    })
  });

  const data = await response.json();
  console.log('📥 Bundler response:', JSON.stringify(data, null, 2));
  
  if (data.error) {
    // Handle various error formats from bundlers
    let errorMsg = 'Unknown bundler error';
    if (typeof data.error === 'string') {
      errorMsg = data.error;
    } else if (data.error.message) {
      errorMsg = data.error.message;
    } else if (data.error.data?.message) {
      errorMsg = data.error.data.message;
    } else if (data.error.data) {
      errorMsg = JSON.stringify(data.error.data);
    } else {
      errorMsg = JSON.stringify(data.error);
    }
    throw new Error(errorMsg);
  }
  
  if (data.result === undefined) {
    throw new Error('No result from bundler');
  }
  
  return data.result;
}

// Helper to pad hex to 32 bytes
function toBytes32(value: bigint): Hex {
  return `0x${value.toString(16).padStart(64, '0')}` as Hex;
}

// Pack gas limits for v0.7 UserOp (verificationGasLimit || callGasLimit) - 16 bytes each
function packAccountGasLimits(verificationGasLimit: bigint, callGasLimit: bigint): Hex {
  const verification = verificationGasLimit.toString(16).padStart(32, '0');
  const call = callGasLimit.toString(16).padStart(32, '0');
  return `0x${verification}${call}` as Hex;
}

// Pack gas fees for v0.7 UserOp (maxPriorityFeePerGas || maxFeePerGas) - 16 bytes each
function packGasFees(maxPriorityFeePerGas: bigint, maxFeePerGas: bigint): Hex {
  const priority = maxPriorityFeePerGas.toString(16).padStart(32, '0');
  const max = maxFeePerGas.toString(16).padStart(32, '0');
  return `0x${priority}${max}` as Hex;
}

// UserOp structure for v0.7 (packed format for EntryPoint)
export interface UserOperationV7 {
  sender: Address;
  nonce: bigint;
  initCode: Hex;
  callData: Hex;
  accountGasLimits: Hex; // bytes32: verificationGasLimit (16) || callGasLimit (16)
  preVerificationGas: bigint;
  gasFees: Hex; // bytes32: maxPriorityFeePerGas (16) || maxFeePerGas (16)
  paymasterAndData: Hex;
  signature: Hex;
}

// RPC format for Pimlico v0.7 (unpacked individual fields)
interface UserOperationRpc {
  sender: Address;
  nonce: Hex;
  callData: Hex;
  callGasLimit: Hex;
  verificationGasLimit: Hex;
  preVerificationGas: Hex;
  maxFeePerGas: Hex;
  maxPriorityFeePerGas: Hex;
  signature: Hex;
  // v0.7 paymaster fields (separate, not packed)
  paymaster?: Address;
  paymasterVerificationGasLimit?: Hex;
  paymasterPostOpGasLimit?: Hex;
  paymasterData?: Hex;
  // OR for no paymaster, omit these fields
  factory?: Address;
  factoryData?: Hex;
}

// Gas values
const GAS_LIMITS = {
  verificationGasLimit: 500000n,
  callGasLimit: 500000n,
  preVerificationGas: 100000n,
  paymasterVerificationGasLimit: 100000n,
  paymasterPostOpGasLimit: 50000n,
  maxFeePerGas: 50000000000n, // 50 gwei
  maxPriorityFeePerGas: 2000000000n // 2 gwei
};

// Convert internal UserOp to RPC format for bundler
function userOpToRpc(userOp: UserOperationV7, usePaymaster: boolean = true): UserOperationRpc {
  const addresses = getAddresses();
  
  const rpcOp: UserOperationRpc = {
    sender: userOp.sender,
    nonce: toHex(userOp.nonce),
    callData: userOp.callData,
    callGasLimit: toHex(GAS_LIMITS.callGasLimit),
    verificationGasLimit: toHex(GAS_LIMITS.verificationGasLimit),
    preVerificationGas: toHex(GAS_LIMITS.preVerificationGas),
    maxFeePerGas: toHex(GAS_LIMITS.maxFeePerGas),
    maxPriorityFeePerGas: toHex(GAS_LIMITS.maxPriorityFeePerGas),
    signature: userOp.signature
  };

  // Add paymaster fields if using paymaster
  if (usePaymaster) {
    rpcOp.paymaster = addresses.paymaster as Address;
    rpcOp.paymasterVerificationGasLimit = toHex(GAS_LIMITS.paymasterVerificationGasLimit);
    rpcOp.paymasterPostOpGasLimit = toHex(GAS_LIMITS.paymasterPostOpGasLimit);
    rpcOp.paymasterData = '0x';
  }

  return rpcOp;
}

// Pack paymasterAndData for hash calculation (address + verificationGas + postOpGas + data)
function packPaymasterAndData(paymaster: Address): Hex {
  // paymaster (20 bytes) + verificationGasLimit (16 bytes) + postOpGasLimit (16 bytes)
  const paymasterHex = paymaster.slice(2).toLowerCase();
  const verificationGas = GAS_LIMITS.paymasterVerificationGasLimit.toString(16).padStart(32, '0');
  const postOpGas = GAS_LIMITS.paymasterPostOpGasLimit.toString(16).padStart(32, '0');
  return `0x${paymasterHex}${verificationGas}${postOpGas}` as Hex;
}

// Get current nonce for account
export async function getNonce(
  publicClient: PublicClient,
  account: Address
): Promise<bigint> {
  const addresses = getAddresses();
  const nonce = await publicClient.readContract({
    address: addresses.entryPoint as Address,
    abi: entryPointAbi,
    functionName: 'getNonce',
    args: [account, 0n]
  });
  return nonce;
}

// Build UserOp for execute call
export async function buildUserOp(
  publicClient: PublicClient,
  target: Address,
  value: bigint,
  data: Hex
): Promise<UserOperationV7> {
  const addresses = getAddresses();
  const sender = addresses.smartAccount as Address;

  logs.info('Building UserOperation...');

  // Get nonce
  const nonce = await getNonce(publicClient, sender);
  logs.info(`Nonce: ${nonce}`);

  // Build callData (execute function)
  const callData = encodeFunctionData({
    abi: myAccountAbi,
    functionName: 'execute',
    args: [target, value, data]
  });

  // Pack paymaster data for hash calculation
  const paymasterAndData = packPaymasterAndData(addresses.paymaster as Address);

  const userOp: UserOperationV7 = {
    sender,
    nonce,
    initCode: '0x',
    callData,
    accountGasLimits: packAccountGasLimits(GAS_LIMITS.verificationGasLimit, GAS_LIMITS.callGasLimit),
    preVerificationGas: GAS_LIMITS.preVerificationGas,
    gasFees: packGasFees(GAS_LIMITS.maxPriorityFeePerGas, GAS_LIMITS.maxFeePerGas),
    paymasterAndData,
    signature: '0x'
  };

  logs.success('UserOp built');
  return userOp;
}

// Get UserOp hash from EntryPoint
export async function getUserOpHash(
  publicClient: PublicClient,
  userOp: UserOperationV7
): Promise<Hex> {
  const addresses = getAddresses();

  // Log the userOp being sent for hash
  console.log('Getting hash for userOp:', {
    sender: userOp.sender,
    nonce: userOp.nonce.toString(),
    initCode: userOp.initCode,
    callData: userOp.callData.slice(0, 50) + '...',
    accountGasLimits: userOp.accountGasLimits,
    preVerificationGas: userOp.preVerificationGas.toString(),
    gasFees: userOp.gasFees,
    paymasterAndData: userOp.paymasterAndData.slice(0, 50) + '...',
    signature: userOp.signature
  });

  const hash = await publicClient.readContract({
    address: addresses.entryPoint as Address,
    abi: entryPointAbi,
    functionName: 'getUserOpHash',
    args: [userOp]
  });

  return hash;
}

// Submit UserOp via bundler (JSON-RPC)
export async function submitUserOp(userOp: UserOperationV7): Promise<Hex> {
  logs.pending('Submitting to bundler...');

  try {
    const addresses = getAddresses();
    const rpcUserOp = userOpToRpc(userOp);

    logs.info('Sending eth_sendUserOperation...');
    
    const userOpHash = await bundlerRpc('eth_sendUserOperation', [
      rpcUserOp,
      addresses.entryPoint
    ]) as Hex;

    logs.success(`UserOp submitted`, `Hash: ${userOpHash.slice(0, 18)}...`);
    return userOpHash;
  } catch (err) {
    const error = err as Error;
    logs.error('Bundler rejected UserOp', error.message);
    throw error;
  }
}

// Wait for UserOp receipt
export async function waitForUserOpReceipt(userOpHash: Hex): Promise<Hex> {
  const logId = logs.pending('Waiting for confirmation...');

  try {
    let receipt = null;
    let attempts = 0;
    const maxAttempts = 60;

    while (!receipt && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      try {
        receipt = await bundlerRpc('eth_getUserOperationReceipt', [userOpHash]);
      } catch {
        // Receipt not ready yet
      }
      attempts++;
    }

    if (!receipt) {
      throw new Error('Timeout waiting for UserOp receipt');
    }

    const txHash = (receipt as { receipt: { transactionHash: Hex } }).receipt.transactionHash;

    logs.updateLog(
      logId,
      'success',
      'Transaction confirmed!',
      `Tx: ${txHash.slice(0, 18)}...`
    );

    return txHash;
  } catch (err) {
    const error = err as Error;
    logs.updateLog(logId, 'error', 'Transaction failed', error.message);
    throw error;
  }
}