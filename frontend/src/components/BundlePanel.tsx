import { useState } from 'react';
import { Layers, Plus, Trash2, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BundledOperation } from '@/types/accountAbstraction';

interface BundlePanelProps {
  bundledOps: BundledOperation[];
  onAddOperation: (op: Omit<BundledOperation, 'id'>) => void;
  onExecute: () => Promise<void>;
  onClear: () => void;
  isProcessing: boolean;
}

const OP_TEMPLATES = [
  { type: 'Approve USDC', target: '0xA0b8...3c4d', value: '0', data: 'approve(...)' },
  { type: 'Swap ETH→USDC', target: '0xDef1...Swap', value: '0.1', data: 'swap(...)' },
  { type: 'Stake LP Token', target: '0xFarm...Pool', value: '0', data: 'stake(...)' },
  { type: 'Claim Rewards', target: '0xRwd...Dist', value: '0', data: 'claim()' },
];

export function BundlePanel({ 
  bundledOps, 
  onAddOperation, 
  onExecute, 
  onClear,
  isProcessing 
}: BundlePanelProps) {
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecute = async () => {
    setIsExecuting(true);
    await onExecute();
    setIsExecuting(false);
  };

  return (
    <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
          <Layers className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Transaction Bundling</h3>
          <p className="text-xs text-muted-foreground">Batch multiple operations</p>
        </div>
      </div>

      {/* Quick add operations */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-2">Quick Add:</p>
        <div className="flex flex-wrap gap-2">
          {OP_TEMPLATES.map((template, i) => (
            <button
              key={i}
              onClick={() => onAddOperation(template)}
              className="px-3 py-1.5 bg-muted/30 hover:bg-muted/50 border border-border/30 rounded-lg text-xs text-foreground transition-all"
            >
              <Plus className="w-3 h-3 inline mr-1" />
              {template.type}
            </button>
          ))}
        </div>
      </div>

      {/* Bundled operations list */}
      <div className="bg-muted/20 rounded-lg p-3 mb-4 min-h-[120px]">
        {bundledOps.length === 0 ? (
          <div className="flex items-center justify-center h-[100px] text-sm text-muted-foreground">
            No operations in bundle
          </div>
        ) : (
          <div className="space-y-2">
            {bundledOps.map((op, index) => (
              <div 
                key={op.id}
                className="flex items-center gap-3 bg-muted/30 rounded-lg p-2"
              >
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{op.type}</p>
                  <p className="text-xs text-muted-foreground mono">{op.target}</p>
                </div>
                {op.value !== '0' && (
                  <span className="text-xs text-accent">{op.value} ETH</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          disabled={bundledOps.length === 0 || isProcessing}
          className="flex-1"
        >
          <Trash2 className="w-4 h-4" />
          Clear
        </Button>
        <Button
          variant="glow"
          size="sm"
          onClick={handleExecute}
          disabled={bundledOps.length === 0 || isProcessing}
          className="flex-1"
        >
          {isExecuting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Executing...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Execute ({bundledOps.length})
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        All operations execute atomically in a single UserOp
      </p>
    </div>
  );
}
