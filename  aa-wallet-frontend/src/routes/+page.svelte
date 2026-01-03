<script lang="ts">
  import WalletPanel from "$lib/components/WalletPanel.svelte";
  import ActionsPanel from "$lib/components/ActionsPanel.svelte";
  import LogsPanel from "$lib/components/LogsPanel.svelte";
  import { ACTIVE_NETWORK } from "$lib/contracts/addresses";
  import { onMount } from "svelte";
  import { logs } from "$lib/stores/logs";

  onMount(() => {
    logs.info("AA Wallet Frontend initialized");
    logs.info(`Network: ${ACTIVE_NETWORK}`);
    logs.info("Ready to connect...");
  });
</script>

<svelte:head>
  <title>AA Wallet | Account Abstraction Demo</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link
    rel="preconnect"
    href="https://fonts.gstatic.com"
    crossorigin="anonymous"
  />
  <link
    href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<div class="app">
  <header class="header">
    <div class="logo">
      <span class="logo-icon">◈</span>
      <span class="logo-text">AA WALLET</span>
    </div>
    <div class="header-info">
      <span class="version">ERC-4337 v0.7</span>
      <a
        href="https://github.com/ayabelarbi/smart-accounts/blob/main/README.md"
        target="_blank"
        rel="noopener noreferrer"
        class="github-link"
      >
        DOCS →
      </a>
    </div>
  </header>

  <main class="main">
    <div class="grid">
      <div class="left-column">
        <WalletPanel />
        <ActionsPanel />
      </div>
      <div class="right-column">
        <LogsPanel />
      </div>
    </div>
  </main>

  <div class="bg-grid"></div>
</div>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    background: #050505;
    color: #fff;
    font-family: "Space Grotesk", sans-serif;
    min-height: 100vh;
  }

  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .bg-grid {
    position: fixed;
    inset: 0;
    background-image: linear-gradient(
        rgba(255, 255, 255, 0.02) 1px,
        transparent 1px
      ),
      linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
    background-size: 50px 50px;
    pointer-events: none;
    z-index: 0;
  }

  .header {
    position: relative;
    z-index: 10;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 40px;
    border-bottom: 1px solid #1a1a1a;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo-icon {
    font-size: 24px;
    color: #00ff88;
    text-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
  }

  .logo-text {
    font-family: "JetBrains Mono", monospace;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.2em;
    color: #fff;
  }

  .header-info {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .version {
    font-family: "JetBrains Mono", monospace;
    font-size: 10px;
    letter-spacing: 0.1em;
    color: #4a4a4a;
    padding: 4px 10px;
    background: #0f0f0f;
    border-radius: 4px;
  }

  .github-link {
    font-family: "JetBrains Mono", monospace;
    font-size: 10px;
    letter-spacing: 0.1em;
    color: #666;
    text-decoration: none;
    transition: color 0.2s;
  }

  .github-link:hover {
    color: #00ff88;
  }

  .main {
    flex: 1;
    position: relative;
    z-index: 10;
    padding: 30px 40px;
  }

  .grid {
    display: grid;
    grid-template-columns: 380px 1fr;
    gap: 30px;
    height: calc(100vh - 180px);
  }

  .left-column {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .right-column {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  @media (max-width: 1024px) {
    .grid {
      grid-template-columns: 1fr;
      height: auto;
    }

    .right-column {
      min-height: 400px;
    }

    .header,
    .main {
      padding-left: 20px;
      padding-right: 20px;
    }
  }
</style>
