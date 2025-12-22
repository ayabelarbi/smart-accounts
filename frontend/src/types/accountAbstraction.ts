export interface SmartAccount {
  address: string;
  balance: string;
  nonce: number;
  isDeployed: boolean;
  signers: Signer[];
  sessionKeys: SessionKey[];
  pendingTransactions: Transaction[];
}

export interface Signer {
  address: string;
  label: string;
  weight: number;
  isActive: boolean;
}

export interface SessionKey {
  id: string;
  publicKey: string;
  permissions: string[];
  expiresAt: Date;
  usesRemaining: number | null;
  isActive: boolean;
  label: string;
}

export interface Transaction {
  id: string;
  type: 'mint' | 'transfer' | 'approve' | 'bundle';
  status: 'pending' | 'signing' | 'submitted' | 'confirmed' | 'failed';
  hash?: string;
  timestamp: Date;
  signaturesRequired: number;
  signaturesCollected: number;
  details: string;
  gasSponsored?: boolean;
}

export interface TransactionLog {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export interface BundledOperation {
  id: string;
  type: string;
  target: string;
  value: string;
  data: string;
}
