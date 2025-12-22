import { useState, useCallback } from 'react';
import type { SmartAccount, SessionKey, Transaction, TransactionLog, BundledOperation } from '@/types/accountAbstraction';

const generateAddress = () => `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
const generateHash = () => `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

const initialAccount: SmartAccount = {
  address: '0x742d35Cc6634C0532925a3b844Bc9e7595f8b2E1',
  balance: '2.847',
  nonce: 42,
  isDeployed: true,
  signers: [
    { address: '0x1234...5678', label: 'Owner', weight: 100, isActive: true },
    { address: '0xabcd...ef01', label: 'Guardian 1', weight: 50, isActive: true },
    { address: '0x9876...5432', label: 'Guardian 2', weight: 50, isActive: false },
  ],
  sessionKeys: [],
  pendingTransactions: [],
};

export function useAccountAbstraction() {
  const [account, setAccount] = useState<SmartAccount>(initialAccount);
  const [logs, setLogs] = useState<TransactionLog[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bundledOps, setBundledOps] = useState<BundledOperation[]>([]);

  const addLog = useCallback((type: TransactionLog['type'], message: string) => {
    const log: TransactionLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type,
      message,
    };
    setLogs(prev => [log, ...prev].slice(0, 50));
  }, []);

  const mintNFT = useCallback(async () => {
    setIsProcessing(true);
    addLog('info', 'Initiating NFT mint through EntryPoint...');
    
    const tx: Transaction = {
      id: crypto.randomUUID(),
      type: 'mint',
      status: 'pending',
      timestamp: new Date(),
      signaturesRequired: 1,
      signaturesCollected: 0,
      details: 'Mint DemoNFT #' + Math.floor(Math.random() * 10000),
      gasSponsored: true,
    };

    setAccount(prev => ({
      ...prev,
      pendingTransactions: [...prev.pendingTransactions, tx],
    }));

    await new Promise(r => setTimeout(r, 800));
    addLog('info', 'UserOperation created, validating signature...');

    await new Promise(r => setTimeout(r, 600));
    tx.status = 'signing';
    tx.signaturesCollected = 1;
    addLog('success', 'Signature validated via validateUserOp()');

    await new Promise(r => setTimeout(r, 1000));
    tx.status = 'submitted';
    tx.hash = generateHash();
    addLog('info', `UserOp submitted to bundler: ${tx.hash.slice(0, 18)}...`);

    await new Promise(r => setTimeout(r, 1500));
    tx.status = 'confirmed';
    addLog('success', `✓ NFT minted successfully! Gas sponsored by paymaster.`);

    setAccount(prev => ({
      ...prev,
      nonce: prev.nonce + 1,
      pendingTransactions: prev.pendingTransactions.filter(t => t.id !== tx.id),
    }));

    setIsProcessing(false);
    return tx;
  }, [addLog]);

  const createSessionKey = useCallback(async (
    label: string,
    permissions: string[],
    expiryMinutes: number,
    maxUses: number | null
  ) => {
    setIsProcessing(true);
    addLog('info', `Creating session key: "${label}"...`);

    await new Promise(r => setTimeout(r, 500));
    
    const sessionKey: SessionKey = {
      id: crypto.randomUUID(),
      publicKey: generateAddress(),
      permissions,
      expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
      usesRemaining: maxUses,
      isActive: true,
      label,
    };

    await new Promise(r => setTimeout(r, 800));
    addLog('success', `Session key "${label}" created with ${permissions.length} permissions`);

    setAccount(prev => ({
      ...prev,
      sessionKeys: [...prev.sessionKeys, sessionKey],
    }));

    setIsProcessing(false);
    return sessionKey;
  }, [addLog]);

  const revokeSessionKey = useCallback(async (keyId: string) => {
    addLog('warning', 'Revoking session key...');
    await new Promise(r => setTimeout(r, 500));
    
    setAccount(prev => ({
      ...prev,
      sessionKeys: prev.sessionKeys.filter(k => k.id !== keyId),
    }));
    
    addLog('success', 'Session key revoked successfully');
  }, [addLog]);

  const useSessionKey = useCallback(async (keyId: string) => {
    const key = account.sessionKeys.find(k => k.id === keyId);
    if (!key) return;

    setIsProcessing(true);
    addLog('info', `Executing with session key: "${key.label}"...`);

    await new Promise(r => setTimeout(r, 600));
    addLog('info', 'Validating session key permissions...');

    await new Promise(r => setTimeout(r, 800));
    
    if (key.usesRemaining !== null) {
      if (key.usesRemaining <= 1) {
        setAccount(prev => ({
          ...prev,
          sessionKeys: prev.sessionKeys.filter(k => k.id !== keyId),
        }));
        addLog('warning', 'Session key exhausted and removed');
      } else {
        setAccount(prev => ({
          ...prev,
          sessionKeys: prev.sessionKeys.map(k => 
            k.id === keyId ? { ...k, usesRemaining: (k.usesRemaining || 1) - 1 } : k
          ),
        }));
      }
    }

    addLog('success', `Transaction executed using session key "${key.label}"`);
    setIsProcessing(false);
  }, [account.sessionKeys, addLog]);

  const collectSignature = useCallback(async (signerAddress: string) => {
    addLog('info', `Collecting signature from ${signerAddress}...`);
    await new Promise(r => setTimeout(r, 1000));
    addLog('success', `Signature collected from ${signerAddress}`);
  }, [addLog]);

  const addToBundleOps = useCallback((op: Omit<BundledOperation, 'id'>) => {
    const bundledOp: BundledOperation = {
      ...op,
      id: crypto.randomUUID(),
    };
    setBundledOps(prev => [...prev, bundledOp]);
    addLog('info', `Added ${op.type} to bundle (${bundledOps.length + 1} ops)`);
  }, [addLog, bundledOps.length]);

  const executeBundledOps = useCallback(async () => {
    if (bundledOps.length === 0) return;

    setIsProcessing(true);
    addLog('info', `Executing bundled UserOperation with ${bundledOps.length} operations...`);

    await new Promise(r => setTimeout(r, 500));
    addLog('info', 'Encoding calldata for batch execution...');

    await new Promise(r => setTimeout(r, 800));
    addLog('info', 'Submitting to EntryPoint.handleOps()...');

    await new Promise(r => setTimeout(r, 1200));
    const hash = generateHash();
    addLog('success', `Bundle executed! Hash: ${hash.slice(0, 18)}...`);

    setAccount(prev => ({
      ...prev,
      nonce: prev.nonce + 1,
    }));

    setBundledOps([]);
    setIsProcessing(false);
  }, [bundledOps, addLog]);

  const clearBundle = useCallback(() => {
    setBundledOps([]);
    addLog('info', 'Bundle cleared');
  }, [addLog]);

  return {
    account,
    logs,
    isProcessing,
    bundledOps,
    mintNFT,
    createSessionKey,
    revokeSessionKey,
    useSessionKey,
    collectSignature,
    addToBundleOps,
    executeBundledOps,
    clearBundle,
  };
}
