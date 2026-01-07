<script lang="ts">
  import { wallet, smartAccount } from "$lib/stores/wallet";
  import { truncateAddress, formatEth } from "$lib/utils/format";
  import { ACTIVE_NETWORK } from "$lib/contracts/addresses";
  import { getAddresses } from "$lib/contracts/addresses";
  import { logs } from "$lib/stores/logs";
  import { type Address, type Account, formatEther, parseEther } from "viem";
  import { sepolia } from "viem/chains";

  const entryPointDepositAbi = [
    {
      type: "function",
      name: "depositTo",
      stateMutability: "payable",
      inputs: [{ name: "account", type: "address" }],
      outputs: [],
    },
    {
      type: "function",
      name: "balanceOf",
      stateMutability: "view",
      inputs: [{ name: "account", type: "address" }],
      outputs: [{ name: "", type: "uint256" }],
    },
  ] as const;

  let paymasterDeposit: bigint = 0n;
  let fundingPaymaster = false;

  async function loadPaymasterDeposit() {
    if (!$wallet.publicClient) return;
    const addresses = getAddresses();

    paymasterDeposit = (await $wallet.publicClient.readContract({
      address: addresses.entryPoint as Address,
      abi: entryPointDepositAbi,
      functionName: "balanceOf",
      args: [addresses.paymaster as Address],
    })) as bigint;
  }

  async function fundPaymasterDeposit() {
    if (!$wallet.walletClient) return;
    fundingPaymaster = true;

    try {
      const addresses = getAddresses();
      const value = parseEther("0.01"); // montant fixe pour garder l’UI clean

      const txHash = await $wallet.walletClient.writeContract({
        address: addresses.entryPoint as Address,
        abi: entryPointDepositAbi,
        functionName: "depositTo",
        args: [addresses.paymaster as Address],
        value,
        chain: sepolia,
        account: $wallet.walletClient.account as Account,
      });

      logs.success("Paymaster funded", `Tx: ${txHash.slice(0, 18)}...`);
      // print the link to the tx on etherscan
      logs.success(
        "Tx on etherscan",
        `https://sepolia.etherscan.io/tx/${txHash}`
      );
      await loadPaymasterDeposit();
    } catch (err) {
      const e = err as Error;
      logs.error("Funding failed", e.message);
    }

    fundingPaymaster = false;
  }

  async function handleConnect() {
    const success = await wallet.connect();
    if (success && $wallet.publicClient) {
      await smartAccount.load($wallet.publicClient);
      await loadPaymasterDeposit();
    }
  }

  async function handleRefresh() {
    if ($wallet.publicClient) {
      await smartAccount.load($wallet.publicClient);
      await loadPaymasterDeposit();
    }
  }

  async function copyToClipboard(value: string, label?: string) {
    try {
      await navigator.clipboard.writeText(value);
      logs.info("Copied to clipboard", label ?? value);
    } catch {
      logs.error("Copy failed", "Clipboard not available");
    }
  }

  const addresses = getAddresses();
  /*   console.log("ENTRYPOINT(UI):", addresses.entryPoint);
  console.log("ENTRYPOINT(BUNDLER):", getAddresses().entryPoint);
  console.log("PAYMASTER:", addresses.paymaster); */
</script>

<div class="wallet-panel">
  <div class="panel-header">
    <div class="status-dot" class:connected={$wallet.connected}></div>
    <span>WALLET</span>
    <span class="network-badge">{ACTIVE_NETWORK.toUpperCase()}</span>
  </div>

  <div class="panel-content">
    {#if !$wallet.connected}
      <button class="connect-btn" on:click={handleConnect}>
        <span class="btn-icon">◈</span>
        CONNECT METAMASK
      </button>
    {:else}
      <div class="wallet-info">
        <div class="info-row">
          <span class="label">EOA</span>

          <span
            class="value copyable"
            role="button"
            tabindex="0"
            title="Click to copy"
            on:click={() =>
              copyToClipboard($wallet.address || "", "EOA address")}
            on:keydown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                copyToClipboard($wallet.address || "", "EOA address");
              }
            }}
          >
            {truncateAddress($wallet.address || "", 6)}
          </span>
        </div>

        <div class="divider"></div>

        <div class="info-row">
          <span class="label">SMART ACCOUNT</span>
          {#if $smartAccount.isDeployed}
            <span class="status-badge deployed">DEPLOYED</span>
          {:else}
            <span class="status-badge">NOT DEPLOYED</span>
          {/if}
        </div>

        <div class="info-row">
          <span class="label">ADDRESS</span>
          <span
            class="value copyable"
            role="button"
            tabindex="0"
            title="Click to copy"
            on:click={() =>
              copyToClipboard(
                $smartAccount.address || "",
                "Smart account address"
              )}
            on:keydown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                copyToClipboard(
                  $smartAccount.address || "",
                  "Smart account address"
                );
              }
            }}
          >
            {truncateAddress($smartAccount.address || "", 6)}
          </span>
        </div>

        <div class="info-row">
          <span class="label">BALANCE</span>
          <span class="value highlight"
            >{formatEth($smartAccount.balance)} ETH</span
          >
        </div>

        <div class="info-row">
          <span class="label">OWNERS</span>
          <span class="value">{$smartAccount.owners.length}</span>
        </div>

        <div class="info-row">
          <span class="label">THRESHOLD</span>
          <span class="value"
            >{$smartAccount.threshold}/{$smartAccount.owners.length}</span
          >
        </div>
        <div class="info-row">
          <span class="label">PAYMASTER</span>
          <span
            class="value copyable"
            role="button"
            tabindex="0"
            title="Click to copy"
            on:click={() =>
              copyToClipboard(getAddresses().paymaster || "", "EOA address")}
            on:keydown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                copyToClipboard(getAddresses().paymaster || "", "EOA address");
              }
            }}
          >
            {truncateAddress(getAddresses().paymaster || "", 6)}
          </span>
        </div>

        <div class="info-row">
          <span class="label">EP DEPOSIT</span>
          <span class="value highlight">
            {Number(formatEther(paymasterDeposit)).toFixed(4)} ETH
          </span>
        </div>

        {#if $smartAccount.owners.length > 0}
          <div class="owners-list">
            {#each $smartAccount.owners as owner, i}
              <div class="owner-row">
                <span class="owner-index">#{i + 1}</span>
                <span
                  class="value copyable"
                  role="button"
                  tabindex="0"
                  title="Click to copy"
                  on:click={() => copyToClipboard(owner || "", "EOA address")}
                  on:keydown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      copyToClipboard(owner || "", "EOA address");
                    }
                  }}
                >
                  {truncateAddress(owner || "", 6)}
                </span>
              </div>
            {/each}
          </div>
        {/if}

        <div class="action-buttons">
          <button class="action-btn" on:click={handleRefresh}>
            ↻ REFRESH
          </button>

          <!-- Nouveau bouton FUND, même style, même place -->
          <button
            class="action-btn"
            on:click={fundPaymasterDeposit}
            disabled={fundingPaymaster}
          >
            {fundingPaymaster ? "… FUNDING" : "+ FUND 0.01"}
          </button>

          <button class="action-btn disconnect" on:click={wallet.disconnect}>
            ✕ DISCONNECT
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .wallet-panel {
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

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ff4757;
  }

  .status-dot.connected {
    background: #00ff88;
    box-shadow: 0 0 8px #00ff88;
  }

  .network-badge {
    margin-left: auto;
    padding: 2px 8px;
    background: #1a1a1a;
    border-radius: 2px;
    font-size: 9px;
    color: #00a8ff;
  }

  .panel-content {
    padding: 20px 16px;
  }

  .connect-btn {
    width: 100%;
    padding: 14px 20px;
    background: linear-gradient(135deg, #00ff88 0%, #00a8ff 100%);
    border: none;
    border-radius: 4px;
    font-family: "JetBrains Mono", "Fira Code", monospace;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: #000;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: all 0.3s;
  }

  .connect-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 255, 136, 0.3);
  }

  .btn-icon {
    font-size: 16px;
  }

  .wallet-info {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .label {
    font-family: "JetBrains Mono", "Fira Code", monospace;
    font-size: 10px;
    letter-spacing: 0.1em;
    color: #4a4a4a;
  }

  .value {
    font-family: "JetBrains Mono", "Fira Code", monospace;
    font-size: 12px;
    color: #888;
  }

  .value.highlight {
    color: #00ff88;
  }

  .divider {
    height: 1px;
    background: #1a1a1a;
    margin: 4px 0;
  }
  .copyable {
    cursor: pointer;
    transition: color 0.15s;
  }

  .copyable:hover {
    color: #00ff88;
    text-decoration: underline;
  }

  .status-badge {
    padding: 2px 8px;
    background: #2a2a2a;
    border-radius: 2px;
    font-family: "JetBrains Mono", "Fira Code", monospace;
    font-size: 9px;
    letter-spacing: 0.05em;
    color: #666;
  }

  .status-badge.deployed {
    background: rgba(0, 255, 136, 0.1);
    color: #00ff88;
  }

  .owners-list {
    background: #0f0f0f;
    border-radius: 4px;
    padding: 10px;
    margin-top: 4px;
  }

  .owner-row {
    display: flex;
    gap: 10px;
    padding: 4px 0;
    font-family: "JetBrains Mono", "Fira Code", monospace;
    font-size: 11px;
  }

  .owner-index {
    color: #4a4a4a;
    width: 24px;
  }

  .action-buttons {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }

  .action-btn {
    flex: 1;
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
  }

  .action-btn:hover {
    border-color: #00ff88;
    color: #00ff88;
  }

  .action-btn.disconnect:hover {
    border-color: #ff4757;
    color: #ff4757;
  }
</style>
