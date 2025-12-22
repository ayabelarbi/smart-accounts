import { useState } from 'react';
import { Sparkles, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TransactionPanelProps {
  onMintNFT: () => Promise<unknown>;
  isProcessing: boolean;
}

export function TransactionPanel({ onMintNFT, isProcessing }: TransactionPanelProps) {
  const [isMinting, setIsMinting] = useState(false);

  const handleMint = async () => {
    setIsMinting(true);
    await onMintNFT();
    setIsMinting(false);
  };

  return (
    <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Basic Transaction</h3>
          <p className="text-xs text-muted-foreground">Execute through EntryPoint</p>
        </div>
      </div>

      <div className="bg-muted/30 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-glow-warning" />
          <span className="text-sm font-medium text-foreground">Mint Demo NFT</span>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Creates a UserOperation to mint an NFT, validates signature via the smart account, 
          and executes through the EntryPoint contract with gas sponsorship.
        </p>
        <Button
          variant="glow"
          className="w-full"
          onClick={handleMint}
          disabled={isProcessing}
        >
          {isMinting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Mint NFT
            </>
          )}
        </Button>
      </div>

      <div className="text-xs text-muted-foreground space-y-1 mono">
        <p>→ validateUserOp()</p>
        <p>→ execute()</p>
        <p>→ handleOps()</p>
      </div>
    </div>
  );
}
