<script lang="ts">
  import { wallet, smartAccount } from "$lib/stores/wallet";
  import { logs } from "$lib/stores/logs";
  import { generateTokenId, truncateAddress } from "$lib/utils/format";
  import {
    mintNftSingleOwner,
    mintNftMultiSig,
    setSessionKeyOnChain,
    mintNftWithSessionKey,
    checkSessionKeyStatus,
  } from "$lib/services/userOp";
  import {
    generateSessionKey,
    type SessionKeyData,
  } from "$lib/services/signing";
  import { myMfersAbi } from "$lib/contracts/abis";
  import { sepolia } from "viem/chains";
  import { type Address, type Account } from "viem";
  import { getAddresses } from "$lib/contracts/addresses";
  let loading = false;
  let activeSessionKey: SessionKeyData | null = null;
  let sessionKeyStatus: {
    expiresAt: number;
    oneTime: boolean;
    used: boolean;
  } | null = null;

  // Simulated second owner private key (for demo)
  // In production, this would be on a separate device
  let secondOwnerKey =
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

  async function handleMintSingle() {
    if (!$wallet.walletClient || !$wallet.publicClient) return;
    loading = true;
    try {
      const tokenId = generateTokenId();

      await $wallet.walletClient.writeContract({
        abi: myMfersAbi,
        functionName: "transferOwnership",
        args: [$smartAccount.address as Address],
        chain: sepolia,
        account: $wallet.walletClient.account as Account,
        address: getAddresses().nft as Address,
      });

      await mintNftSingleOwner(
        $wallet.walletClient,
        $wallet.publicClient,
        tokenId
      );
    } catch (err) {
      const error = err as Error;
      logs.error("Mint failed", error.message);
    }
    loading = false;
  }

  async function handleMintMultiSig() {
    if (!$wallet.walletClient || !$wallet.publicClient) return;
    if ($smartAccount.threshold < 2) {
      logs.warn("Threshold is 1", "Set threshold to 2 for multi-sig demo");
      return;
    }
    loading = true;
    try {
      const tokenId = generateTokenId();
      await mintNftMultiSig(
        $wallet.walletClient,
        $wallet.publicClient,
        tokenId,
        secondOwnerKey as `0x${string}`
      );
    } catch (err) {
      const error = err as Error;
      logs.error("Multi-sig mint failed", error.message);
    }
    loading = false;
  }

  async function handleCreateSessionKey(oneTime: boolean) {
    if (!$wallet.walletClient || !$wallet.publicClient) return;
    loading = true;
    try {
      // Generate session key
      const sessionKey = generateSessionKey(5, oneTime); // 5 minutes

      // Register on-chain
      await setSessionKeyOnChain(
        $wallet.walletClient,
        $wallet.publicClient,
        sessionKey
      );

      activeSessionKey = sessionKey;
      sessionKeyStatus = null;

      logs.success(
        "Session key ready!",
        `Address: ${sessionKey.address.slice(0, 10)}... | OneTime: ${oneTime}`
      );
    } catch (err) {
      const error = err as Error;
      logs.error("Session key creation failed", error.message);
    }
    loading = false;
  }

  async function handleMintWithSessionKey() {
    if (!$wallet.publicClient || !activeSessionKey) return;
    loading = true;
    try {
      const tokenId = generateTokenId();
      await mintNftWithSessionKey(
        $wallet.publicClient,
        activeSessionKey,
        tokenId
      );

      // Check if one-time key is now used
      if (activeSessionKey.oneTime) {
        sessionKeyStatus = await checkSessionKeyStatus(
          $wallet.publicClient,
          activeSessionKey.address
        );
        if (sessionKeyStatus.used) {
          logs.info("One-time key is now USED", "Cannot be used again");
        }
      }
    } catch (err) {
      const error = err as Error;
      logs.error("Session key mint failed", error.message);
    }
    loading = false;
  }

  async function handleCheckSessionKey() {
    if (!$wallet.publicClient || !activeSessionKey) return;
    try {
      sessionKeyStatus = await checkSessionKeyStatus(
        $wallet.publicClient,
        activeSessionKey.address
      );
      logs.info(
        "Session key status",
        `Expires: ${new Date(sessionKeyStatus.expiresAt * 1000).toLocaleTimeString()} | Used: ${sessionKeyStatus.used}`
      );
    } catch (err) {
      const error = err as Error;
      logs.error("Check failed", error.message);
    }
  }

  function handleClearSessionKey() {
    activeSessionKey = null;
    sessionKeyStatus = null;
    logs.info("Session key cleared from memory");
  }
</script>

<div class="actions-panel">
  <div class="panel-header">
    <span class="action-icon">◆</span>
    <span>ACTIONS</span>
  </div>

  <div class="panel-content">
    {#if !$wallet.connected}
      <div class="disabled-overlay">
        <span>Connect wallet to enable actions</span>
      </div>
    {:else if !$smartAccount.isDeployed}
      <div class="disabled-overlay">
        <span>Smart Account not deployed</span>
      </div>
    {:else}
      <!-- Single Owner Mint -->
      <div class="action-section">
        <div class="section-title">
          <span class="section-icon">1</span>
          SINGLE OWNER MINT
        </div>
        <p class="section-desc">Mint NFT with single owner signature</p>
        <button
          class="action-btn primary"
          on:click={handleMintSingle}
          disabled={loading}
        >
          {loading ? "PROCESSING..." : "MINT NFT"}
        </button>
      </div>

      <!-- Multi-Sig Mint -->
      <div class="action-section">
        <div class="section-title">
          <span class="section-icon">2</span>
          MULTI-SIG MINT
        </div>
        <p class="section-desc">
          Mint with {$smartAccount.threshold} signatures (threshold: {$smartAccount.threshold})
        </p>
        <div class="input-group">
          <label>Simulated Owner 2 Key</label>
          <input type="text" bind:value={secondOwnerKey} placeholder="0x..." />
        </div>
        <button
          class="action-btn secondary"
          on:click={handleMintMultiSig}
          disabled={loading || $smartAccount.threshold < 2}
        >
          {$smartAccount.threshold < 2 ? "THRESHOLD = 1" : "MINT (MULTI-SIG)"}
        </button>
      </div>

      <!-- Session Keys -->
      <div class="action-section">
        <div class="section-title">
          <span class="section-icon">3</span>
          SESSION KEYS
        </div>

        {#if !activeSessionKey}
          <p class="section-desc">Create a temporary session key</p>
          <div class="button-group">
            <button
              class="action-btn tertiary"
              on:click={() => handleCreateSessionKey(false)}
              disabled={loading}
            >
              CREATE (5 MIN)
            </button>
            <button
              class="action-btn tertiary"
              on:click={() => handleCreateSessionKey(true)}
              disabled={loading}
            >
              CREATE (ONE-TIME)
            </button>
          </div>
        {:else}
          <div class="session-key-info">
            <div class="key-row">
              <span class="key-label">Address</span>
              <span class="key-value"
                >{truncateAddress(activeSessionKey.address, 6)}</span
              >
            </div>
            <div class="key-row">
              <span class="key-label">Expires</span>
              <span class="key-value">
                {new Date(
                  activeSessionKey.expiresAt * 1000
                ).toLocaleTimeString()}
              </span>
            </div>
            <div class="key-row">
              <span class="key-label">Type</span>
              <span class="key-value" class:one-time={activeSessionKey.oneTime}>
                {activeSessionKey.oneTime ? "ONE-TIME" : "REUSABLE"}
              </span>
            </div>
            {#if sessionKeyStatus}
              <div class="key-row">
                <span class="key-label">Status</span>
                <span class="key-value" class:used={sessionKeyStatus.used}>
                  {sessionKeyStatus.used ? "USED ✗" : "VALID ✓"}
                </span>
              </div>
            {/if}
          </div>

          <div class="button-group">
            <button
              class="action-btn primary"
              on:click={handleMintWithSessionKey}
              disabled={loading || (sessionKeyStatus?.used ?? false)}
            >
              MINT WITH KEY
            </button>
            <button
              class="action-btn tertiary"
              on:click={handleCheckSessionKey}
              disabled={loading}
            >
              CHECK
            </button>
            <button class="action-btn danger" on:click={handleClearSessionKey}>
              CLEAR
            </button>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .actions-panel {
    background: #0a0a0a;
    border: 1px solid #1a1a1a;
    border-radius: 4px;
  }

  .panel-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-bottom: 1px solid #1a1a1a;
    font-family: "JetBrains Mono", "Fira Code", monospace;
    font-size: 11px;
    letter-spacing: 0.1em;
    color: #4a4a4a;
  }

  .action-icon {
    color: #00a8ff;
  }

  .panel-content {
    padding: 16px;
    position: relative;
  }

  .disabled-overlay {
    position: absolute;
    inset: 0;
    background: rgba(10, 10, 10, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: "JetBrains Mono", "Fira Code", monospace;
    font-size: 11px;
    color: #4a4a4a;
    letter-spacing: 0.05em;
  }

  .action-section {
    padding: 16px 0;
    border-bottom: 1px solid #1a1a1a;
  }

  .action-section:last-child {
    border-bottom: none;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: "JetBrains Mono", "Fira Code", monospace;
    font-size: 11px;
    letter-spacing: 0.1em;
    color: #888;
    margin-bottom: 8px;
  }

  .section-icon {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1a1a1a;
    border-radius: 50%;
    font-size: 10px;
    color: #00ff88;
  }

  .section-desc {
    font-family: "JetBrains Mono", "Fira Code", monospace;
    font-size: 11px;
    color: #4a4a4a;
    margin-bottom: 12px;
  }

  .input-group {
    margin-bottom: 12px;
  }

  .input-group label {
    display: block;
    font-family: "JetBrains Mono", "Fira Code", monospace;
    font-size: 9px;
    letter-spacing: 0.1em;
    color: #4a4a4a;
    margin-bottom: 6px;
  }

  .input-group input {
    width: 100%;
    padding: 10px 12px;
    background: #0f0f0f;
    border: 1px solid #2a2a2a;
    border-radius: 4px;
    font-family: "JetBrains Mono", "Fira Code", monospace;
    font-size: 11px;
    color: #888;
  }

  .input-group input:focus {
    outline: none;
    border-color: #00ff88;
  }

  .button-group {
    display: flex;
    gap: 8px;
  }

  .action-btn {
    flex: 1;
    padding: 12px 16px;
    border: 1px solid #2a2a2a;
    border-radius: 4px;
    font-family: "JetBrains Mono", "Fira Code", monospace;
    font-size: 10px;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-btn.primary {
    background: linear-gradient(135deg, #00ff88 0%, #00a8ff 100%);
    border: none;
    color: #000;
    font-weight: 600;
  }

  .action-btn.primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 255, 136, 0.3);
  }

  .action-btn.secondary {
    background: transparent;
    border-color: #00a8ff;
    color: #00a8ff;
  }

  .action-btn.secondary:hover:not(:disabled) {
    background: rgba(0, 168, 255, 0.1);
  }

  .action-btn.tertiary {
    background: transparent;
    color: #666;
  }

  .action-btn.tertiary:hover:not(:disabled) {
    border-color: #666;
    color: #888;
  }

  .action-btn.danger {
    background: transparent;
    border-color: #ff4757;
    color: #ff4757;
  }

  .action-btn.danger:hover:not(:disabled) {
    background: rgba(255, 71, 87, 0.1);
  }

  .session-key-info {
    background: #0f0f0f;
    border-radius: 4px;
    padding: 12px;
    margin-bottom: 12px;
  }

  .key-row {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    font-family: "JetBrains Mono", "Fira Code", monospace;
    font-size: 11px;
  }

  .key-label {
    color: #4a4a4a;
  }

  .key-value {
    color: #888;
  }

  .key-value.one-time {
    color: #ffa502;
  }

  .key-value.used {
    color: #ff4757;
  }
</style>
