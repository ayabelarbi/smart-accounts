import { writable } from 'svelte/store';

export type LogLevel = 'info' | 'success' | 'error' | 'pending' | 'warn';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  details?: string;
}

function createLogsStore() {
  const { subscribe, update } = writable<LogEntry[]>([]);

  function generateId() {
    return Math.random().toString(36).substring(2, 9);
  }

  function addLog(level: LogLevel, message: string, details?: string): string {
    const id = generateId();
    const entry: LogEntry = {
      id,
      timestamp: new Date(),
      level,
      message,
      details
    };

    update((logs) => [...logs, entry]);
    return id;
  }

  return {
    subscribe,
    info: (message: string, details?: string) => addLog('info', message, details),
    success: (message: string, details?: string) => addLog('success', message, details),
    error: (message: string, details?: string) => addLog('error', message, details),
    pending: (message: string, details?: string) => addLog('pending', message, details),
    warn: (message: string, details?: string) => addLog('warn', message, details),
    
    // Update existing log (for pending -> success/error)
    updateLog: (id: string, level: LogLevel, message: string, details?: string) => {
      update((logs) =>
        logs.map((log) =>
          log.id === id ? { ...log, level, message, details, timestamp: new Date() } : log
        )
      );
    },

    clear: () => update(() => [])
  };
}

export const logs = createLogsStore();
