import { Terminal, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import type { TransactionLog as LogType } from '@/types/accountAbstraction';

interface TransactionLogProps {
  logs: LogType[];
}

const icons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const colors = {
  info: 'text-primary',
  success: 'text-accent',
  warning: 'text-glow-warning',
  error: 'text-destructive',
};

export function TransactionLog({ logs }: TransactionLogProps) {
  return (
    <div className="glass-card glow-border p-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
          <Terminal className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Transaction Log</h3>
          <p className="text-xs text-muted-foreground">Real-time activity from EntryPoint</p>
        </div>
      </div>

      <div className="bg-background/50 rounded-lg p-4 min-h-[180px] max-h-[300px] overflow-y-auto mono text-sm space-y-2">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-[150px] text-muted-foreground">
            <span className="animate-pulse">Waiting for transactions...</span>
          </div>
        ) : (
          logs.map((log) => {
            const Icon = icons[log.type];
            return (
              <div key={log.id} className="flex items-start gap-3 animate-slide-up py-1">
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${colors[log.type]}`} />
                <div className="flex-1 min-w-0">
                  <span className="text-muted-foreground mr-2">
                    [{log.timestamp.toLocaleTimeString()}]
                  </span>
                  <span className="text-foreground break-words">{log.message}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
