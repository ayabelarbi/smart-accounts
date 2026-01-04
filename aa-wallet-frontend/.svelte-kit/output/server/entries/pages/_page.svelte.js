import { a as attr_class, s as store_get, e as ensure_array_like, b as attr, u as unsubscribe_stores, c as stringify, h as head } from "../../chunks/index2.js";
import { w as writable, d as derived } from "../../chunks/index.js";
import { formatEther, createPublicClient, http, createWalletClient, custom } from "viem";
import { arbitrumSepolia, sepolia } from "viem/chains";
import { X as escape_html } from "../../chunks/context.js";
function createLogsStore() {
  const { subscribe, update } = writable([]);
  function generateId() {
    return Math.random().toString(36).substring(2, 9);
  }
  function addLog(level, message, details) {
    const id = generateId();
    const entry = {
      id,
      timestamp: /* @__PURE__ */ new Date(),
      level,
      message,
      details
    };
    update((logs2) => [...logs2, entry]);
    return id;
  }
  return {
    subscribe,
    info: (message, details) => addLog("info", message, details),
    success: (message, details) => addLog("success", message, details),
    error: (message, details) => addLog("error", message, details),
    pending: (message, details) => addLog("pending", message, details),
    warn: (message, details) => addLog("warn", message, details),
    // Update existing log (for pending -> success/error)
    updateLog: (id, level, message, details) => {
      update(
        (logs2) => logs2.map(
          (log) => log.id === id ? { ...log, level, message, details, timestamp: /* @__PURE__ */ new Date() } : log
        )
      );
    },
    clear: () => update(() => [])
  };
}
const logs = createLogsStore();
const addresses = {
  // Sepolia testnet
  sepolia: {
    entryPoint: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
    // v0.7 EntryPoint
    factory: "0x26fC0Bf3D80663A8Bbbe51faAa341b2762C81195",
    paymaster: "0x18bF042488F4e36Cc65993715F7a14097740BE4F",
    nft: "0x90B54B4C9B926ACD2F8461196c3371Db920800b2",
    // Pre-computed smart account address (optional, can be computed)
    smartAccount: "0x3D18509a0EaB0F97721D63D29753F39BbF8f1ABd"
  },
  // Arbitrum Sepolia testnet
  arbitrumSepolia: {
    entryPoint: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
    // v0.7 EntryPoint
    factory: "0x_YOUR_FACTORY_ADDRESS_HERE",
    paymaster: "0x_YOUR_PAYMASTER_ADDRESS_HERE",
    nft: "0x_YOUR_NFT_ADDRESS_HERE",
    smartAccount: "0x_YOUR_SMART_ACCOUNT_ADDRESS_HERE"
  }
};
const ACTIVE_NETWORK = "sepolia";
function getAddresses() {
  return addresses[ACTIVE_NETWORK];
}
const chainIds = {
  sepolia: 11155111,
  arbitrumSepolia: 421614
};
function getChainId() {
  return chainIds[ACTIVE_NETWORK];
}
const myAccountAbi = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_myEntryPoint",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "receive",
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "UPGRADE_INTERFACE_VERSION",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "string",
        internalType: "string"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "addOwner",
    inputs: [
      {
        name: "newOwner",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "approveRecovery",
    inputs: [
      {
        name: "recoveryHash",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "execute",
    inputs: [
      {
        name: "dest",
        type: "address",
        internalType: "address"
      },
      {
        name: "value",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "functionData",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "executeBatch",
    inputs: [
      {
        name: "dest",
        type: "address[]",
        internalType: "address[]"
      },
      {
        name: "value",
        type: "uint256[]",
        internalType: "uint256[]"
      },
      {
        name: "data",
        type: "bytes[]",
        internalType: "bytes[]"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "executeRecovery",
    inputs: [
      {
        name: "newOwners",
        type: "address[]",
        internalType: "address[]"
      },
      {
        name: "newThreshold",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getEntryPoint",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getOwners",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address[]",
        internalType: "address[]"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getSessionKey",
    inputs: [
      {
        name: "key",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct MyAccount.SessionKey",
        components: [
          {
            name: "expiresAt",
            type: "uint48",
            internalType: "uint48"
          },
          {
            name: "oneTime",
            type: "bool",
            internalType: "bool"
          },
          {
            name: "used",
            type: "bool",
            internalType: "bool"
          }
        ]
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "guardianApprovalCount",
    inputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "guardianApproved",
    inputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32"
      },
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "guardianThreshold",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "initialize",
    inputs: [
      {
        name: "initialOwners",
        type: "address[]",
        internalType: "address[]"
      },
      {
        name: "initialThreshold",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "initialGuardians",
        type: "address[]",
        internalType: "address[]"
      },
      {
        name: "_guardianThreshold",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "isGuardian",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "isOwner",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "isOwnerGuardian",
    inputs: [
      {
        name: "addr",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "owners",
    inputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "proxiableUUID",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "removeOwner",
    inputs: [
      {
        name: "owner",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "revokeSessionKey",
    inputs: [
      {
        name: "key",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "sessionKeys",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "expiresAt",
        type: "uint48",
        internalType: "uint48"
      },
      {
        name: "oneTime",
        type: "bool",
        internalType: "bool"
      },
      {
        name: "used",
        type: "bool",
        internalType: "bool"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "setGuardian",
    inputs: [
      {
        name: "g",
        type: "address",
        internalType: "address"
      },
      {
        name: "allowed",
        type: "bool",
        internalType: "bool"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setSessionKey",
    inputs: [
      {
        name: "key",
        type: "address",
        internalType: "address"
      },
      {
        name: "expiresAt",
        type: "uint48",
        internalType: "uint48"
      },
      {
        name: "oneTime",
        type: "bool",
        internalType: "bool"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setThreshold",
    inputs: [
      {
        name: "newThreshold",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "threshold",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "upgradeToAndCall",
    inputs: [
      {
        name: "newImplementation",
        type: "address",
        internalType: "address"
      },
      {
        name: "data",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "validateUserOp",
    inputs: [
      {
        name: "userOp",
        type: "tuple",
        internalType: "struct PackedUserOperation",
        components: [
          {
            name: "sender",
            type: "address",
            internalType: "address"
          },
          {
            name: "nonce",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "initCode",
            type: "bytes",
            internalType: "bytes"
          },
          {
            name: "callData",
            type: "bytes",
            internalType: "bytes"
          },
          {
            name: "accountGasLimits",
            type: "bytes32",
            internalType: "bytes32"
          },
          {
            name: "preVerificationGas",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "gasFees",
            type: "bytes32",
            internalType: "bytes32"
          },
          {
            name: "paymasterAndData",
            type: "bytes",
            internalType: "bytes"
          },
          {
            name: "signature",
            type: "bytes",
            internalType: "bytes"
          }
        ]
      },
      {
        name: "userOpHash",
        type: "bytes32",
        internalType: "bytes32"
      },
      {
        name: "missingAccountFunds",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [
      {
        name: "validationData",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "event",
    name: "GuardianSet",
    inputs: [
      {
        name: "guardian",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "allowed",
        type: "bool",
        indexed: false,
        internalType: "bool"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "Initialized",
    inputs: [
      {
        name: "version",
        type: "uint64",
        indexed: false,
        internalType: "uint64"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "MyAccountInitialized",
    inputs: [
      {
        name: "entryPoint",
        type: "address",
        indexed: true,
        internalType: "contract IEntryPoint"
      },
      {
        name: "owner",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "OwnerAdded",
    inputs: [
      {
        name: "owner",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "OwnerRemoved",
    inputs: [
      {
        name: "owner",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "RecoveryApproved",
    inputs: [
      {
        name: "recoveryHash",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32"
      },
      {
        name: "guardian",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "RecoveryExecuted",
    inputs: [
      {
        name: "recoveryHash",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "SessionKeyRevoked",
    inputs: [
      {
        name: "key",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "SessionKeySet",
    inputs: [
      {
        name: "key",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "expiresAt",
        type: "uint48",
        indexed: false,
        internalType: "uint48"
      },
      {
        name: "oneTime",
        type: "bool",
        indexed: false,
        internalType: "bool"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "SessionKeyUsed",
    inputs: [
      {
        name: "key",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "ThresholdChanged",
    inputs: [
      {
        name: "threshold",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "Upgraded",
    inputs: [
      {
        name: "implementation",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "error",
    name: "AddressEmptyCode",
    inputs: [
      {
        name: "target",
        type: "address",
        internalType: "address"
      }
    ]
  },
  {
    type: "error",
    name: "CannotRemoveLastOwner",
    inputs: []
  },
  {
    type: "error",
    name: "DuplicateSigner",
    inputs: []
  },
  {
    type: "error",
    name: "ECDSAInvalidSignature",
    inputs: []
  },
  {
    type: "error",
    name: "ECDSAInvalidSignatureLength",
    inputs: [
      {
        name: "length",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "ECDSAInvalidSignatureS",
    inputs: [
      {
        name: "s",
        type: "bytes32",
        internalType: "bytes32"
      }
    ]
  },
  {
    type: "error",
    name: "ERC1967InvalidImplementation",
    inputs: [
      {
        name: "implementation",
        type: "address",
        internalType: "address"
      }
    ]
  },
  {
    type: "error",
    name: "ERC1967NonPayable",
    inputs: []
  },
  {
    type: "error",
    name: "FailedCall",
    inputs: []
  },
  {
    type: "error",
    name: "GuardianAddressEmpty",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidInitialization",
    inputs: []
  },
  {
    type: "error",
    name: "MyAccount__CallFailed",
    inputs: [
      {
        name: "",
        type: "bytes",
        internalType: "bytes"
      }
    ]
  },
  {
    type: "error",
    name: "MyAccount__NotFromEntryPoint",
    inputs: []
  },
  {
    type: "error",
    name: "MyAccount__NotFromEntryPointOrOwner",
    inputs: []
  },
  {
    type: "error",
    name: "NoOwners",
    inputs: []
  },
  {
    type: "error",
    name: "NotEnoughGuardianApprovals",
    inputs: []
  },
  {
    type: "error",
    name: "NotGuardian",
    inputs: []
  },
  {
    type: "error",
    name: "NotInitializing",
    inputs: []
  },
  {
    type: "error",
    name: "NotOwner",
    inputs: []
  },
  {
    type: "error",
    name: "OnlySelf",
    inputs: []
  },
  {
    type: "error",
    name: "SessionKeyInvalid",
    inputs: []
  },
  {
    type: "error",
    name: "ThresholdOutOfBound",
    inputs: []
  },
  {
    type: "error",
    name: "UUPSUnauthorizedCallContext",
    inputs: []
  },
  {
    type: "error",
    name: "UUPSUnsupportedProxiableUUID",
    inputs: [
      {
        name: "slot",
        type: "bytes32",
        internalType: "bytes32"
      }
    ]
  }
];
const chains$1 = {
  sepolia,
  arbitrumSepolia
};
const chain$1 = chains$1[ACTIVE_NETWORK];
function createWalletStore() {
  const { subscribe, set, update } = writable({
    connected: false,
    address: null,
    publicClient: null,
    walletClient: null
  });
  return {
    subscribe,
    connect: async () => {
      try {
        if (typeof window === "undefined" || !window.ethereum) {
          logs.error("MetaMask not detected", "Please install MetaMask");
          return false;
        }
        logs.pending("Connecting wallet...");
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts"
        });
        if (!accounts || accounts.length === 0) {
          logs.error("No accounts found");
          return false;
        }
        const currentChainId = await window.ethereum.request({
          method: "eth_chainId"
        });
        const targetChainId = `0x${getChainId().toString(16)}`;
        if (currentChainId !== targetChainId) {
          logs.info(`Switching to ${ACTIVE_NETWORK}...`);
          try {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: targetChainId }]
            });
          } catch (switchError) {
            const error = switchError;
            if (error.code === 4902) {
              logs.error("Please add the network to MetaMask");
              return false;
            }
            throw switchError;
          }
        }
        const publicClient = createPublicClient({
          chain: chain$1,
          transport: http()
        });
        const address = accounts[0];
        const walletClient = createWalletClient({
          account: address,
          // ← ajouté !
          chain: chain$1,
          transport: custom(window.ethereum)
        });
        set({
          connected: true,
          address,
          publicClient,
          walletClient
        });
        logs.success(
          `Connected: ${address.slice(0, 6)}...${address.slice(-4)}`
        );
        return true;
      } catch (err) {
        const error = err;
        logs.error("Connection failed", error.message);
        return false;
      }
    },
    disconnect: () => {
      set({
        connected: false,
        address: null,
        publicClient: null,
        walletClient: null
      });
      logs.info("Wallet disconnected");
    }
  };
}
function createSmartAccountStore() {
  const { subscribe, set, update } = writable({
    address: null,
    balance: "0",
    owners: [],
    threshold: 1,
    isDeployed: false
  });
  return {
    subscribe,
    load: async (publicClient) => {
      try {
        const addresses2 = getAddresses();
        const smartAccountAddress = addresses2.smartAccount;
        logs.info(
          `Loading Smart Account: ${smartAccountAddress.slice(0, 10)}...`
        );
        const code = await publicClient.getBytecode({
          address: smartAccountAddress
        });
        const isDeployed = code !== void 0 && code !== "0x";
        if (!isDeployed) {
          logs.warn("Smart Account not deployed yet");
          set({
            address: smartAccountAddress,
            balance: "0",
            owners: [],
            threshold: 1,
            isDeployed: false
          });
          return;
        }
        const balance = await publicClient.getBalance({
          address: smartAccountAddress
        });
        const [owners, threshold] = await Promise.all([
          publicClient.readContract({
            address: smartAccountAddress,
            abi: myAccountAbi,
            functionName: "getOwners"
          }),
          publicClient.readContract({
            address: smartAccountAddress,
            abi: myAccountAbi,
            functionName: "threshold"
          })
        ]);
        set({
          address: smartAccountAddress,
          balance: formatEther(balance),
          owners,
          threshold: Number(threshold),
          isDeployed: true
        });
        logs.success(
          `Smart Account loaded`,
          `Balance: ${formatEther(balance)} ETH, Owners: ${owners.length}, Threshold: ${threshold}`
        );
      } catch (err) {
        const error = err;
        logs.error("Failed to load Smart Account", error.message);
      }
    },
    refresh: async (publicClient) => {
      const addresses2 = getAddresses();
      const smartAccountAddress = addresses2.smartAccount;
      try {
        const balance = await publicClient.getBalance({
          address: smartAccountAddress
        });
        update((state) => ({ ...state, balance: formatEther(balance) }));
      } catch (err) {
        console.error("Refresh failed:", err);
      }
    }
  };
}
const wallet = createWalletStore();
const smartAccount = createSmartAccountStore();
derived(wallet, ($wallet) => $wallet.connected);
function truncateAddress(address, chars = 4) {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
function formatTime(date) {
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}
function formatEth(balance, decimals = 4) {
  const num = parseFloat(balance);
  if (num === 0) return "0";
  if (num < 1e-4) return "< 0.0001";
  return num.toFixed(decimals);
}
function WalletPanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let paymasterDeposit = 0n;
    let fundingPaymaster = false;
    const addresses2 = getAddresses();
    console.log("ENTRYPOINT(UI):", addresses2.entryPoint);
    console.log("ENTRYPOINT(BUNDLER):", getAddresses().entryPoint);
    console.log("PAYMASTER:", addresses2.paymaster);
    $$renderer2.push(`<div class="wallet-panel svelte-wlrh8d"><div class="panel-header svelte-wlrh8d"><div${attr_class("status-dot svelte-wlrh8d", void 0, {
      "connected": store_get($$store_subs ??= {}, "$wallet", wallet).connected
    })}></div> <span>WALLET</span> <span class="network-badge svelte-wlrh8d">${escape_html(ACTIVE_NETWORK.toUpperCase())}</span></div> <div class="panel-content svelte-wlrh8d">`);
    if (!store_get($$store_subs ??= {}, "$wallet", wallet).connected) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<button class="connect-btn svelte-wlrh8d"><span class="btn-icon svelte-wlrh8d">◈</span> CONNECT METAMASK</button>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="wallet-info svelte-wlrh8d"><div class="info-row svelte-wlrh8d"><span class="label svelte-wlrh8d">EOA</span> <span class="value copyable svelte-wlrh8d" role="button" tabindex="0" title="Click to copy">${escape_html(truncateAddress(store_get($$store_subs ??= {}, "$wallet", wallet).address || "", 6))}</span></div> <div class="divider svelte-wlrh8d"></div> <div class="info-row svelte-wlrh8d"><span class="label svelte-wlrh8d">SMART ACCOUNT</span> `);
      if (store_get($$store_subs ??= {}, "$smartAccount", smartAccount).isDeployed) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="status-badge deployed svelte-wlrh8d">DEPLOYED</span>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<span class="status-badge svelte-wlrh8d">NOT DEPLOYED</span>`);
      }
      $$renderer2.push(`<!--]--></div> <div class="info-row svelte-wlrh8d"><span class="label svelte-wlrh8d">ADDRESS</span> <span class="value copyable svelte-wlrh8d" role="button" tabindex="0" title="Click to copy">${escape_html(truncateAddress(store_get($$store_subs ??= {}, "$smartAccount", smartAccount).address || "", 6))}</span></div> <div class="info-row svelte-wlrh8d"><span class="label svelte-wlrh8d">BALANCE</span> <span class="value highlight svelte-wlrh8d">${escape_html(formatEth(store_get($$store_subs ??= {}, "$smartAccount", smartAccount).balance))} ETH</span></div> <div class="info-row svelte-wlrh8d"><span class="label svelte-wlrh8d">OWNERS</span> <span class="value svelte-wlrh8d">${escape_html(store_get($$store_subs ??= {}, "$smartAccount", smartAccount).owners.length)}</span></div> <div class="info-row svelte-wlrh8d"><span class="label svelte-wlrh8d">THRESHOLD</span> <span class="value svelte-wlrh8d">${escape_html(store_get($$store_subs ??= {}, "$smartAccount", smartAccount).threshold)}/${escape_html(store_get($$store_subs ??= {}, "$smartAccount", smartAccount).owners.length)}</span></div> <div class="info-row svelte-wlrh8d"><span class="label svelte-wlrh8d">PAYMASTER</span> <span class="value copyable svelte-wlrh8d" role="button" tabindex="0" title="Click to copy">${escape_html(truncateAddress(getAddresses().paymaster, 6))}</span></div> <div class="info-row svelte-wlrh8d"><span class="label svelte-wlrh8d">EP DEPOSIT</span> <span class="value highlight svelte-wlrh8d">${escape_html(Number(formatEther(paymasterDeposit)).toFixed(4))} ETH</span></div> `);
      if (store_get($$store_subs ??= {}, "$smartAccount", smartAccount).owners.length > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="owners-list svelte-wlrh8d"><!--[-->`);
        const each_array = ensure_array_like(store_get($$store_subs ??= {}, "$smartAccount", smartAccount).owners);
        for (let i = 0, $$length = each_array.length; i < $$length; i++) {
          let owner = each_array[i];
          $$renderer2.push(`<div class="owner-row svelte-wlrh8d"><span class="owner-index svelte-wlrh8d">#${escape_html(i + 1)}</span> <span class="value copyable svelte-wlrh8d" role="button" tabindex="0" title="Click to copy">${escape_html(truncateAddress(owner || "", 6))}</span></div>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <div class="action-buttons svelte-wlrh8d"><button class="action-btn svelte-wlrh8d">↻ REFRESH</button> <button class="action-btn svelte-wlrh8d"${attr("disabled", fundingPaymaster, true)}>${escape_html("+ FUND 0.01")}</button> <button class="action-btn disconnect svelte-wlrh8d">✕ DISCONNECT</button></div></div>`);
    }
    $$renderer2.push(`<!--]--></div></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
const PIMLICO_API_KEY = "pim_GT2fGostX279KhCRWvECRs";
const chains = { sepolia, arbitrumSepolia };
const chain = chains[ACTIVE_NETWORK];
`https://api.pimlico.io/v2/${chain.id}/rpc?apikey=${PIMLICO_API_KEY}`;
function ActionsPanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let loading = false;
    let secondOwnerKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    $$renderer2.push(`<div class="actions-panel svelte-1sy5nox"><div class="panel-header svelte-1sy5nox"><span class="action-icon svelte-1sy5nox">◆</span> <span>ACTIONS</span></div> <div class="panel-content svelte-1sy5nox">`);
    if (!store_get($$store_subs ??= {}, "$wallet", wallet).connected) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="disabled-overlay svelte-1sy5nox"><span>Connect wallet to enable actions</span></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      if (!store_get($$store_subs ??= {}, "$smartAccount", smartAccount).isDeployed) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="disabled-overlay svelte-1sy5nox"><span>Smart Account not deployed</span></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<div class="action-section svelte-1sy5nox"><div class="section-title svelte-1sy5nox"><span class="section-icon svelte-1sy5nox">1</span> SINGLE OWNER MINT</div> <p class="section-desc svelte-1sy5nox">Mint NFT with single owner signature</p> <button class="action-btn primary svelte-1sy5nox"${attr("disabled", loading, true)}>${escape_html("MINT NFT")}</button></div> <div class="action-section svelte-1sy5nox"><div class="section-title svelte-1sy5nox"><span class="section-icon svelte-1sy5nox">2</span> MULTI-SIG MINT</div> <p class="section-desc svelte-1sy5nox">Mint with ${escape_html(store_get($$store_subs ??= {}, "$smartAccount", smartAccount).threshold)} signatures (threshold: ${escape_html(store_get($$store_subs ??= {}, "$smartAccount", smartAccount).threshold)})</p> <div class="input-group svelte-1sy5nox"><label class="svelte-1sy5nox">Simulated Owner 2 Key</label> <input type="text"${attr("value", secondOwnerKey)} placeholder="0x..." class="svelte-1sy5nox"/></div> <button class="action-btn secondary svelte-1sy5nox"${attr("disabled", store_get($$store_subs ??= {}, "$smartAccount", smartAccount).threshold < 2, true)}>${escape_html(store_get($$store_subs ??= {}, "$smartAccount", smartAccount).threshold < 2 ? "THRESHOLD = 1" : "MINT (MULTI-SIG)")}</button></div> <div class="action-section svelte-1sy5nox"><div class="section-title svelte-1sy5nox"><span class="section-icon svelte-1sy5nox">3</span> SESSION KEYS</div> `);
        {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<p class="section-desc svelte-1sy5nox">Create a temporary session key</p> <div class="button-group svelte-1sy5nox"><button class="action-btn tertiary svelte-1sy5nox"${attr("disabled", loading, true)}>CREATE (5 MIN)</button> <button class="action-btn tertiary svelte-1sy5nox"${attr("disabled", loading, true)}>CREATE (ONE-TIME)</button></div>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
function LogsPanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let logEntries = [];
    logs.subscribe((value) => {
      logEntries = value;
      setTimeout(
        () => {
        },
        10
      );
    });
    function getIcon(level) {
      switch (level) {
        case "success":
          return "✓";
        case "error":
          return "✗";
        case "pending":
          return "⏳";
        case "warn":
          return "⚠";
        default:
          return "→";
      }
    }
    function getLevelClass(level) {
      return `log-${level}`;
    }
    function isUrl(text) {
      try {
        const url = new URL(text);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    }
    $$renderer2.push(`<div class="logs-panel svelte-1tofi5f"><div class="logs-header svelte-1tofi5f"><span class="terminal-icon svelte-1tofi5f">▸</span> <span class="svelte-1tofi5f">LOGS</span> <button class="clear-btn svelte-1tofi5f">CLEAR</button></div> <div class="logs-content svelte-1tofi5f">`);
    if (logEntries.length === 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="log-entry log-info svelte-1tofi5f"><span class="log-time svelte-1tofi5f">[--:--:--]</span> <span class="log-icon svelte-1tofi5f">→</span> <span class="log-message svelte-1tofi5f">Awaiting actions...</span></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<!--[-->`);
      const each_array = ensure_array_like(logEntries);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let entry = each_array[$$index];
        $$renderer2.push(`<div${attr_class(`log-entry ${stringify(getLevelClass(entry.level))}`, "svelte-1tofi5f")}><span class="log-time svelte-1tofi5f">[${escape_html(formatTime(entry.timestamp))}]</span> <span class="log-icon svelte-1tofi5f">${escape_html(getIcon(entry.level))}</span> <span class="log-message svelte-1tofi5f">${escape_html(entry.message)}</span> `);
        if (entry.details) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<span class="log-details svelte-1tofi5f">`);
          if (isUrl(entry.details)) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<a${attr("href", entry.details)} target="_blank" rel="noopener noreferrer" class="log-link svelte-1tofi5f">${escape_html(entry.details)}</a>`);
          } else {
            $$renderer2.push("<!--[!-->");
            $$renderer2.push(`${escape_html(entry.details)}`);
          }
          $$renderer2.push(`<!--]--></span>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--> <div class="cursor-line svelte-1tofi5f"><span class="cursor svelte-1tofi5f">_</span></div></div></div>`);
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    head("1uha8ag", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>AA Wallet | Account Abstraction Demo</title>`);
      });
      $$renderer3.push(`<link rel="preconnect" href="https://fonts.googleapis.com"/> <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous"/> <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&amp;family=Space+Grotesk:wght@400;500;600&amp;display=swap" rel="stylesheet"/>`);
    });
    $$renderer2.push(`<div class="app svelte-1uha8ag"><header class="header svelte-1uha8ag"><div class="logo svelte-1uha8ag"><span class="logo-icon svelte-1uha8ag">◈</span> <span class="logo-text svelte-1uha8ag">AA WALLET</span></div> <div class="header-info svelte-1uha8ag"><span class="version svelte-1uha8ag">ERC-4337 v0.7</span> <a href="https://github.com/ayabelarbi/smart-accounts/blob/main/README.md" target="_blank" rel="noopener noreferrer" class="github-link svelte-1uha8ag">DOCS →</a></div></header> <main class="main svelte-1uha8ag"><div class="grid svelte-1uha8ag"><div class="left-column svelte-1uha8ag">`);
    WalletPanel($$renderer2);
    $$renderer2.push(`<!----> `);
    ActionsPanel($$renderer2);
    $$renderer2.push(`<!----></div> <div class="right-column svelte-1uha8ag">`);
    LogsPanel($$renderer2);
    $$renderer2.push(`<!----></div></div></main> <div class="bg-grid svelte-1uha8ag"></div></div>`);
  });
}
export {
  _page as default
};
