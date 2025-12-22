import { Wallet, Shield, Key, Hash } from 'lucide-react';
import type { SmartAccount } from '@/types/accountAbstraction';

interface AccountOverviewProps {
  account: SmartAccount;
}

export function AccountOverview({ account }: AccountOverviewProps) {
  return (
    <div className="glass-card glow-border p-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
          <Wallet className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Smart Account</h2>
          <p className="text-sm text-muted-foreground mono">{account.address.slice(0, 10)}...{account.address.slice(-8)}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent status-pulse" />
          <span className="text-sm text-accent">Deployed</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Hash className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">Balance</span>
          </div>
          <p className="text-2xl font-semibold text-gradient">{account.balance} ETH</p>
        </div>

        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Shield className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">Signers</span>
          </div>
          <p className="text-2xl font-semibold text-foreground">
            {account.signers.filter(s => s.isActive).length}/{account.signers.length}
          </p>
        </div>

        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Key className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">Session Keys</span>
          </div>
          <p className="text-2xl font-semibold text-foreground">{account.sessionKeys.length}</p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Nonce</span>
          <span className="mono text-foreground">{account.nonce}</span>
        </div>
      </div>
    </div>
  );
}
