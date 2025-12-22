import { useState } from 'react';
import { Key, Plus, Trash2, Play, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SessionKey } from '@/types/accountAbstraction';

interface SessionKeysPanelProps {
  sessionKeys: SessionKey[];
  onCreateKey: (label: string, permissions: string[], expiry: number, maxUses: number | null) => Promise<SessionKey>;
  onRevokeKey: (keyId: string) => Promise<void>;
  onUseKey: (keyId: string) => Promise<void>;
  isProcessing: boolean;
}

const PERMISSION_OPTIONS = [
  { id: 'transfer', label: 'Transfer ETH' },
  { id: 'mint', label: 'Mint NFT' },
  { id: 'approve', label: 'Approve Tokens' },
  { id: 'swap', label: 'DEX Swap' },
];

export function SessionKeysPanel({ 
  sessionKeys, 
  onCreateKey, 
  onRevokeKey, 
  onUseKey,
  isProcessing 
}: SessionKeysPanelProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [label, setLabel] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [expiryMinutes, setExpiryMinutes] = useState(5);
  const [maxUses, setMaxUses] = useState<number | null>(1);
  const [isCreating, setIsCreating] = useState(false);
  const [usingKeyId, setUsingKeyId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!label || selectedPermissions.length === 0) return;
    setIsCreating(true);
    await onCreateKey(label, selectedPermissions, expiryMinutes, maxUses);
    setIsCreating(false);
    setShowCreate(false);
    setLabel('');
    setSelectedPermissions([]);
  };

  const handleUseKey = async (keyId: string) => {
    setUsingKeyId(keyId);
    await onUseKey(keyId);
    setUsingKeyId(null);
  };

  const togglePermission = (id: string) => {
    setSelectedPermissions(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const formatExpiry = (date: Date) => {
    const diff = date.getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-glow-warning/20 flex items-center justify-center">
            <Key className="w-5 h-5 text-glow-warning" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Session Keys</h3>
            <p className="text-xs text-muted-foreground">Temporary permissions</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowCreate(!showCreate)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {showCreate && (
        <div className="bg-muted/30 rounded-lg p-4 mb-4 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Gaming Session"
              className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Permissions</label>
            <div className="flex flex-wrap gap-2">
              {PERMISSION_OPTIONS.map(perm => (
                <button
                  key={perm.id}
                  onClick={() => togglePermission(perm.id)}
                  className={`px-3 py-1 rounded-full text-xs transition-all ${
                    selectedPermissions.includes(perm.id)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {perm.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Expires in (min)</label>
              <input
                type="number"
                value={expiryMinutes}
                onChange={(e) => setExpiryMinutes(parseInt(e.target.value) || 1)}
                min={1}
                className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Max Uses (∞ = blank)</label>
              <input
                type="number"
                value={maxUses ?? ''}
                onChange={(e) => setMaxUses(e.target.value ? parseInt(e.target.value) : null)}
                min={1}
                placeholder="∞"
                className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <Button 
            variant="default" 
            className="w-full"
            onClick={handleCreate}
            disabled={!label || selectedPermissions.length === 0 || isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Session Key'
            )}
          </Button>
        </div>
      )}

      {/* Active keys */}
      <div className="space-y-3">
        {sessionKeys.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">
            No active session keys
          </p>
        ) : (
          sessionKeys.map(key => (
            <div 
              key={key.id}
              className="bg-muted/20 border border-border/30 rounded-lg p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm text-foreground">{key.label}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleUseKey(key.id)}
                    disabled={isProcessing}
                  >
                    {usingKeyId === key.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => onRevokeKey(key.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatExpiry(key.expiresAt)}
                </div>
                <span>
                  Uses: {key.usesRemaining === null ? '∞' : key.usesRemaining}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {key.permissions.map(p => (
                  <span key={p} className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
