<script lang="ts">
    import { wallet, smartAccount } from "$lib/stores/wallet";
    import { getAddresses } from "$lib/contracts/addresses";
    import { truncateAddress } from "$lib/utils/format";
    import { logs } from "$lib/stores/logs";
    import type { Address } from "viem";
    import { getAbiItem, parseAbiItem, formatEther } from "viem";
  
    let loading = false;
    let tokenIds: bigint[] = [];
    let fromBlockOffset = 200_000n; // scan last ~200k blocks (tweak)
    let lastScannedRange = "";
  
    // ERC721 Transfer event signature
    const transferEvent = parseAbiItem(
      "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
    );
  
    async function loadNfts() {
      if (!$wallet.publicClient || !$smartAccount.address) return;
      const addresses = getAddresses();
      const nft = addresses.nft as Address;
      const owner = $smartAccount.address as Address;
  
      loading = true;
      tokenIds = [];
  
      try {
        const latest = await $wallet.publicClient.getBlockNumber();
        const fromBlock = latest > fromBlockOffset ? latest - fromBlockOffset : 0n;
  
        lastScannedRange = `${fromBlock.toString()} → ${latest.toString()}`;
  
        // Fetch all Transfer logs in range
        const logsRaw = await $wallet.publicClient.getLogs({
          address: nft,
          event: transferEvent,
          fromBlock,
          toBlock: latest
        });
  
        // Rebuild holdings
        const holdings = new Set<string>();
  
        for (const l of logsRaw) {
          const { from, to, tokenId } = l.args as unknown as {
            from: Address;
            to: Address;
            tokenId: bigint;
          };
  
          // If received -> add
          if (to?.toLowerCase() === owner.toLowerCase()) {
            holdings.add(tokenId.toString());
          }
  
          // If sent -> remove
          if (from?.toLowerCase() === owner.toLowerCase()) {
            holdings.delete(tokenId.toString());
          }
        }
  
        tokenIds = Array.from(holdings).map((x) => BigInt(x)).sort((a, b) => (a < b ? -1 : 1));
      } catch (err) {
        const e = err as Error;
        logs.error("NFT load failed", e.message);
        tokenIds = [];
      } finally {
        loading = false;
      }
    }
  </script>
  
  <div class="nft-panel">
    <div class="panel-header">
      <span class="action-icon">◆</span>
      <span>NFTS</span>
      <span class="range">{lastScannedRange ? `SCAN ${lastScannedRange}` : ""}</span>
    </div>
  
    <div class="panel-content">
      {#if !$wallet.connected}
        <div class="empty">Connect wallet to view NFTs</div>
      {:else if !$smartAccount.isDeployed}
        <div class="empty">Smart account not deployed</div>
      {:else}
        <div class="top-row">
          <div class="hint">
            Owner: <span class="mono">{truncateAddress($smartAccount.address || "", 6)}</span>
          </div>
  
          <div class="controls">
            <input
              class="block-input"
              type="number"
              min="1000"
              step="1000"
              bind:value={fromBlockOffset}
              title="How many blocks back to scan"
            />
            <button class="action-btn" on:click={loadNfts} disabled={loading}>
              {loading ? "LOADING..." : "↻ REFRESH"}
            </button>
          </div>
        </div>
  
        {#if tokenIds.length === 0}
          <div class="empty">No NFTs found (in scanned range)</div>
        {:else}
          <div class="nft-list">
            {#each tokenIds as id}
              <div class="nft-item">
                <span class="tag">#</span>
                <span class="id">{id.toString()}</span>
              </div>
            {/each}
          </div>
        {/if}
      {/if}
    </div>
  </div>
  
  <style>
    .nft-panel {
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
  
    .range {
      margin-left: auto;
      font-size: 9px;
      color: #2f2f2f;
      letter-spacing: 0.08em;
    }
  
    .panel-content {
      padding: 16px;
    }
  
    .top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 12px;
    }
  
    .hint {
      font-family: "JetBrains Mono", "Fira Code", monospace;
      font-size: 10px;
      color: #4a4a4a;
      letter-spacing: 0.05em;
    }
  
    .mono {
      font-family: "JetBrains Mono", "Fira Code", monospace;
      color: #888;
    }
  
    .controls {
      display: flex;
      gap: 8px;
      align-items: center;
    }
  
    .block-input {
      width: 110px;
      padding: 8px 10px;
      background: #0f0f0f;
      border: 1px solid #2a2a2a;
      border-radius: 4px;
      font-family: "JetBrains Mono", "Fira Code", monospace;
      font-size: 10px;
      color: #888;
    }
  
    .block-input:focus {
      outline: none;
      border-color: #00ff88;
    }
  
    .action-btn {
      padding: 8px 12px;
      background: transparent;
      border: 1px solid #2a2a2a;
      border-radius: 4px;
      font-family: "JetBrains Mono", "Fira Code", monospace;
      font-size: 10px;
      letter-spacing: 0.05em;
      color: #666;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }
  
    .action-btn:hover:not(:disabled) {
      border-color: #00ff88;
      color: #00ff88;
    }
  
    .action-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  
    .empty {
      font-family: "JetBrains Mono", "Fira Code", monospace;
      font-size: 11px;
      color: #4a4a4a;
      letter-spacing: 0.05em;
      padding: 10px 0;
    }
  
    .nft-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  
    .nft-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      background: #0f0f0f;
      border: 1px solid #1a1a1a;
      border-radius: 4px;
      font-family: "JetBrains Mono", "Fira Code", monospace;
    }
  
    .tag {
      color: #00a8ff;
      font-size: 12px;
    }
  
    .id {
      color: #888;
      font-size: 12px;
      letter-spacing: 0.05em;
    }
  </style>
  