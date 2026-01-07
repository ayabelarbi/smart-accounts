<script lang="ts">
  import { logs, type LogEntry, type LogLevel } from '$lib/stores/logs';
  import { formatTime } from '$lib/utils/format';
  import { onMount } from 'svelte';

  let logsContainer: HTMLDivElement;
  let logEntries: LogEntry[] = [];

  logs.subscribe((value) => {
    logEntries = value;
    // Auto-scroll to bottom
    setTimeout(() => {
      if (logsContainer) {
        logsContainer.scrollTop = logsContainer.scrollHeight;
      }
    }, 10);
  });

  function getIcon(level: LogLevel): string {
    switch (level) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'pending':
        return '⏳';
      case 'warn':
        return '⚠';
      default:
        return '→';
    }
  }

  function getLevelClass(level: LogLevel): string {
    return `log-${level}`;
  }

  function isUrl(text: string): boolean {
    try {
      const url = new URL(text);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }
</script>

<div class="logs-panel">
  <div class="logs-header">
    <span class="terminal-icon">▸</span>
    <span>LOGS</span>
    <button class="clear-btn" on:click={() => logs.clear()}>CLEAR</button>
  </div>

  <div class="logs-content" bind:this={logsContainer}>
    {#if logEntries.length === 0}
      <div class="log-entry log-info">
        <span class="log-time">[--:--:--]</span>
        <span class="log-icon">→</span>
        <span class="log-message">Awaiting actions...</span>
      </div>
    {:else}
      {#each logEntries as entry (entry.id)}
        <div class="log-entry {getLevelClass(entry.level)}">
          <span class="log-time">[{formatTime(entry.timestamp)}]</span>
          <span class="log-icon">{getIcon(entry.level)}</span>
          <span class="log-message">{entry.message}</span>
          {#if entry.details}
            <span class="log-details">
              {#if isUrl(entry.details)}
                <a href={entry.details} target="_blank" rel="noopener noreferrer" class="log-link">
                  {entry.details}
                </a>
              {:else}
                {entry.details}
              {/if}
            </span>
          {/if}
        </div>
      {/each}
    {/if}
    <div class="cursor-line">
      <span class="cursor">_</span>
    </div>
  </div>
</div>

<style>
  .logs-panel {
    background: #0a0a0a;
    border: 1px solid #1a1a1a;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    max-height: 100%;
  }

  .logs-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border-bottom: 1px solid #1a1a1a;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 11px;
    letter-spacing: 0.1em;
    color: #4a4a4a;
  }

  .terminal-icon {
    color: #00ff88;
  }

  .clear-btn {
    margin-left: auto;
    background: transparent;
    border: 1px solid #2a2a2a;
    color: #4a4a4a;
    padding: 4px 12px;
    font-family: inherit;
    font-size: 10px;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: all 0.2s;
  }

  .clear-btn:hover {
    border-color: #00ff88;
    color: #00ff88;
  }

  .logs-content {
    flex: 1;
    padding: 16px;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 12px;
    line-height: 1.8;
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
  }

  .logs-content::-webkit-scrollbar {
    width: 4px;
  }

  .logs-content::-webkit-scrollbar-track {
    background: #0a0a0a;
  }

  .logs-content::-webkit-scrollbar-thumb {
    background: #2a2a2a;
  }

  .log-entry {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 4px;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .log-time {
    color: #3a3a3a;
  }

  .log-icon {
    width: 16px;
    text-align: center;
  }

  .log-message {
    color: #888;
  }

  .log-details {
    color: #555;
    font-size: 11px;
    width: 100%;
    padding-left: 100px;
  }

  .log-link {
    color: #00a8ff;
    text-decoration: underline;
    cursor: pointer;
    transition: color 0.2s;
  }

  .log-link:hover {
    color: #00ff88;
    text-decoration-color: #00ff88;
  }

  /* Level colors */
  .log-info .log-icon {
    color: #00a8ff;
  }

  .log-success .log-icon,
  .log-success .log-message {
    color: #00ff88;
  }

  .log-error .log-icon,
  .log-error .log-message {
    color: #ff4757;
  }

  .log-pending .log-icon {
    color: #ffa502;
    animation: pulse 1s infinite;
  }

  .log-warn .log-icon,
  .log-warn .log-message {
    color: #ffa502;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }

  .cursor-line {
    margin-top: 8px;
  }

  .cursor {
    color: #00ff88;
    animation: blink 1s step-end infinite;
  }

  @keyframes blink {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
  }
</style>
