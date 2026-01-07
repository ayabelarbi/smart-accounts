import type { Address, Hex } from 'viem';

// Truncate address for display
export function truncateAddress(address: Address | string, chars: number = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

// Truncate hash for display
export function truncateHash(hash: Hex | string, chars: number = 8): string {
  return `${hash.slice(0, chars + 2)}...`;
}

// Format timestamp
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Format ETH balance
export function formatEth(balance: string, decimals: number = 4): string {
  const num = parseFloat(balance);
  if (num === 0) return '0';
  if (num < 0.0001) return '< 0.0001';
  return num.toFixed(decimals);
}

// Get block explorer URL
export function getExplorerUrl(hash: Hex, type: 'tx' | 'address' = 'tx'): string {
  const baseUrl = 'https://sepolia.etherscan.io';
  return type === 'tx' ? `${baseUrl}/tx/${hash}` : `${baseUrl}/address/${hash}`;
}

// Generate random token ID
export function generateTokenId(): bigint {
  return BigInt(Math.floor(Math.random() * 1000000));
}
