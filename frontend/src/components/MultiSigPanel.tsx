import { useState } from 'react';
import { Users, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Signer } from '@/types/accountAbstraction';

interface MultiSigPanelProps {
  signers: Signer[];
  onCollectSignature: (address: string) => Promise<void>;
  isProcessing: boolean;
}

export function MultiSigPanel({ signers, onCollectSignature, isProcessing }: MultiSigPanelProps) {
  const [collectingFrom, setCollectingFrom] = useState<string | null>(null);
  const [collectedSignatures, setCollectedSignatures] = useState<Set<string>>(new Set());

  const threshold = 100;
  const currentWeight = Array.from(collectedSignatures).reduce((acc, addr) => {
    const signer = signers.find(s => s.address === addr);
    return acc + (signer?.weight || 0);
  }, 0);

  const handleCollect = async (address: string) => {
    setCollectingFrom(address);
    await onCollectSignature(address);
    setCollectedSignatures(prev => new Set([...prev, address]));
    setCollectingFrom(null);
  };

  const resetSignatures = () => {
    setCollectedSignatures(new Set());
  };

  return (
    <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Multi-Signature</h3>
          <p className="text-xs text-muted-foreground">Threshold: {threshold} weight</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-muted-foreground">Collected Weight</span>
          <span className={currentWeight >= threshold ? 'text-accent' : 'text-foreground'}>
            {currentWeight} / {threshold}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            style={{ width: `${Math.min((currentWeight / threshold) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Signers list */}
      <div className="space-y-3 mb-4">
        {signers.map((signer) => {
          const isCollected = collectedSignatures.has(signer.address);
          const isCollecting = collectingFrom === signer.address;

          return (
            <div 
              key={signer.address}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                isCollected 
                  ? 'bg-accent/10 border-accent/30' 
                  : 'bg-muted/20 border-border/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isCollected ? 'bg-accent text-accent-foreground' : 'bg-muted'
                }`}>
                  {isCollected ? <Check className="w-4 h-4" /> : signer.label[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{signer.label}</p>
                  <p className="text-xs text-muted-foreground mono">{signer.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Weight: {signer.weight}</span>
                {!isCollected && signer.isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCollect(signer.address)}
                    disabled={isProcessing || isCollecting}
                  >
                    {isCollecting ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      'Sign'
                    )}
                  </Button>
                )}
                {!signer.isActive && (
                  <span className="text-xs text-muted-foreground">Inactive</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {collectedSignatures.size > 0 && (
        <Button variant="ghost" size="sm" onClick={resetSignatures} className="w-full">
          <X className="w-4 h-4 mr-2" />
          Reset Signatures
        </Button>
      )}
    </div>
  );
}
