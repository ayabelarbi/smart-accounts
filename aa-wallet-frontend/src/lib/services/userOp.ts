import {
  type Address,
  type Hex,
  type WalletClient,
  type PublicClient,
  encodeFunctionData,
} from "viem";
import { logs } from "$lib/stores/logs";
import { getAddresses } from "$lib/contracts/addresses";
import { myMfersAbi, myAccountAbi } from "$lib/contracts/abis";
import {
  buildUserOp,
  getUserOpHash,
  submitUserOp,
  waitForUserOpReceipt,
  createClients,
  type UserOperationV7,
} from "./bundler";
import {
  signUserOpSingleOwner,
  signUserOpMultiSig,
  signUserOpWithSessionKey,
  simulateOwnerSignature,
  type SessionKeyData,
} from "./signing";

// Mint NFT with single owner signature
export async function mintNftSingleOwner(
  walletClient: WalletClient,
  publicClient: PublicClient,
  tokenId: bigint
): Promise<Hex> {
  const addresses = getAddresses();

  console.log("=== Mint NFT (Single Owner) ===");
  console.log("paymaster deposit");

  // Build mint calldata
  const mintData = encodeFunctionData({
    abi: myMfersAbi,
    functionName: "safeMint",
    args: [addresses.smartAccount as Address, tokenId],
  });

  // Build UserOp
  const userOp = await buildUserOp(
    publicClient,
    addresses.nft as Address,
    0n,
    mintData
  );

  // Get UserOp hash
  const userOpHash = await getUserOpHash(publicClient, userOp);
  logs.info(`UserOp hash: ${userOpHash.slice(0, 18)}...`);

  // Sign with owner
  const ownerAddress = walletClient.account?.address;
  if (!ownerAddress) throw new Error("Wallet not connected");

  userOp.signature = await signUserOpSingleOwner(
    walletClient,
    userOpHash,
    ownerAddress
  );

  try {
    const opHash = await submitUserOp(userOp);
    const txHash = await waitForUserOpReceipt(opHash);
    logs.success(`NFT #${tokenId} minted!`, `Tx: ${txHash}`);
    logs.success(
      "Tx on etherscan",
      `https://sepolia.etherscan.io/tx/${txHash}`
    );

    return txHash;
  } catch (e: any) {
    console.error("Bundler error (full):", e);

    // viem often stores JSON-RPC error data here:
    console.error("cause:", e?.cause);
    console.error("details:", e?.details);
    console.error("shortMessage:", e?.shortMessage);
    console.error("data:", e?.data ?? e?.cause?.data);

    throw e;
  }
}

// Mint NFT with multi-sig (simulated second owner)
export async function mintNftMultiSig(
  walletClient: WalletClient,
  publicClient: PublicClient,
  tokenId: bigint,
  secondOwnerPrivateKey: Hex
): Promise<Hex> {
  const addresses = getAddresses();

  logs.info("=== Mint NFT (Multi-Sig) ===");

  // Build mint calldata
  const mintData = encodeFunctionData({
    abi: myMfersAbi,
    functionName: "safeMint",
    args: [addresses.smartAccount as Address, tokenId],
  });

  // Build UserOp
  const userOp = await buildUserOp(
    publicClient,
    addresses.nft as Address,
    0n,
    mintData
  );

  // Get UserOp hash
  const userOpHash = await getUserOpHash(publicClient, userOp);
  logs.info(`UserOp hash: ${userOpHash.slice(0, 18)}...`);

  // Get first owner signature from connected wallet
  const ownerAddress = walletClient.account?.address;
  if (!ownerAddress) throw new Error("Wallet not connected");

  // Simulate second owner signature
  const secondSig = await simulateOwnerSignature(
    secondOwnerPrivateKey,
    userOpHash
  );
  logs.info(`Simulated owner 2: ${secondSig.address.slice(0, 10)}...`);

  // Sign with multi-sig
  userOp.signature = await signUserOpMultiSig(
    walletClient,
    userOpHash,
    [ownerAddress],
    [secondSig]
  );

  // Submit via bundler
  const { bundlerClient } = createClients();
  const opHash = await submitUserOp(bundlerClient, userOp);

  // Wait for confirmation
  const txHash = await waitForUserOpReceipt(bundlerClient, opHash);

  logs.success(`NFT #${tokenId} minted with multi-sig!`, `Tx: ${txHash}`);
  logs.success("Tx on etherscan", `https://sepolia.etherscan.io/tx/${txHash}`);
  return txHash;
}

// Set session key on smart account
export async function setSessionKeyOnChain(
  walletClient: WalletClient,
  publicClient: PublicClient,
  sessionKey: SessionKeyData
): Promise<Hex> {
  const addresses = getAddresses();

  logs.info("=== Setting Session Key On-Chain ===");

  // Build setSessionKey calldata
  const setKeyData = encodeFunctionData({
    abi: myAccountAbi,
    functionName: "setSessionKey",
    args: [sessionKey.address, sessionKey.expiresAt, sessionKey.oneTime],
  });

  // Build UserOp (calling self)
  const userOp = await buildUserOp(
    publicClient,
    addresses.smartAccount as Address,
    0n,
    setKeyData
  );

  // Get UserOp hash
  const userOpHash = await getUserOpHash(publicClient, userOp);

  // Sign with owner
  const ownerAddress = walletClient.account?.address;
  if (!ownerAddress) throw new Error("Wallet not connected");

  userOp.signature = await signUserOpSingleOwner(
    walletClient,
    userOpHash,
    ownerAddress
  );

  // Submit via bundler
  const { bundlerClient } = createClients();
  const opHash = await submitUserOp(bundlerClient, userOp);

  // Wait for confirmation
  const txHash = await waitForUserOpReceipt(bundlerClient, opHash);

  logs.success(
    `Session key registered on-chain!`,
    `Key: ${sessionKey.address.slice(0, 10)}...`
  );
  logs.success("Tx on etherscan", `https://sepolia.etherscan.io/tx/${txHash}`);
  return txHash;
}

// Mint NFT with session key
export async function mintNftWithSessionKey(
  publicClient: PublicClient,
  sessionKey: SessionKeyData,
  tokenId: bigint
): Promise<Hex> {
  const addresses = getAddresses();

  logs.info("=== Mint NFT (Session Key) ===");

  // Build mint calldata
  const mintData = encodeFunctionData({
    abi: myMfersAbi,
    functionName: "safeMint",
    args: [addresses.smartAccount as Address, tokenId],
  });

  // Build UserOp
  const userOp = await buildUserOp(
    publicClient,
    addresses.nft as Address,
    0n,
    mintData
  );

  // Get UserOp hash
  const userOpHash = await getUserOpHash(publicClient, userOp);
  logs.info(`UserOp hash: ${userOpHash.slice(0, 18)}...`);

  // Sign with session key
  userOp.signature = await signUserOpWithSessionKey(sessionKey, userOpHash);

  // Submit via bundler
  const { bundlerClient } = createClients();
  const opHash = await submitUserOp(bundlerClient, userOp);

  // Wait for confirmation
  const txHash = await waitForUserOpReceipt(bundlerClient, opHash);

  logs.success(`NFT #${tokenId} minted with session key!`, `Tx: ${txHash}`);
  logs.success("Tx on etherscan", `https://sepolia.etherscan.io/tx/${txHash}`);
  return txHash;
}

// Verify session key status on-chain
export async function checkSessionKeyStatus(
  publicClient: PublicClient,
  keyAddress: Address
): Promise<{ expiresAt: number; oneTime: boolean; used: boolean }> {
  const addresses = getAddresses();

  const result = await publicClient.readContract({
    address: addresses.smartAccount as Address,
    abi: myAccountAbi,
    functionName: "getSessionKey",
    args: [keyAddress],
  });

  const [expiresAt, oneTime, used] = result as [bigint, boolean, boolean];

  return {
    expiresAt: Number(expiresAt),
    oneTime,
    used,
  };
}
