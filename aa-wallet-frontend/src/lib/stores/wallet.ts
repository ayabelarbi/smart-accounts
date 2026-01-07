import { writable, derived } from "svelte/store";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  formatEther,
  type PublicClient,
  type WalletClient,
  type Address,
} from "viem";
import { sepolia, arbitrumSepolia } from "viem/chains";
import { logs } from "./logs";
import {
  ACTIVE_NETWORK,
  getAddresses,
  getChainId,
} from "$lib/contracts/addresses";
import { myAccountAbi } from "$lib/contracts/abis";

// Get the right chain
const chains = {
  sepolia,
  arbitrumSepolia,
};
const chain = chains[ACTIVE_NETWORK];

export interface WalletState {
  connected: boolean;
  address: Address | null;
  publicClient: PublicClient | null;
  walletClient: WalletClient | null;
}

export interface SmartAccountState {
  address: Address | null;
  balance: string;
  owners: Address[];
  threshold: number;
  isDeployed: boolean;
}

function createWalletStore() {
  const { subscribe, set, update } = writable<WalletState>({
    connected: false,
    address: null,
    publicClient: null,
    walletClient: null,
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

        // Request accounts
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        if (!accounts || accounts.length === 0) {
          logs.error("No accounts found");
          return false;
        }

        // Check/switch network
        const currentChainId = await window.ethereum.request({
          method: "eth_chainId",
        });

        const targetChainId = `0x${getChainId().toString(16)}`;
        if (currentChainId !== targetChainId) {
          logs.info(`Switching to ${ACTIVE_NETWORK}...`);
          try {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: targetChainId }],
            });
          } catch (switchError: unknown) {
            const error = switchError as { code?: number };
            if (error.code === 4902) {
              logs.error("Please add the network to MetaMask");
              return false;
            }
            throw switchError;
          }
        }

        // Create clients
        const publicClient = createPublicClient({
          chain,
          transport: http(),
        });

        const address = accounts[0] as Address; // défini avant
        const walletClient = createWalletClient({
          account: address, // ← ajouté !
          chain,
          transport: custom(window.ethereum),
        });

        set({
          connected: true,
          address,
          publicClient,
          walletClient,
        });

        logs.success(
          `Connected: ${address.slice(0, 6)}...${address.slice(-4)}`
        );
        return true;
      } catch (err) {
        const error = err as Error;
        logs.error("Connection failed", error.message);
        return false;
      }
    },

    disconnect: () => {
      set({
        connected: false,
        address: null,
        publicClient: null,
        walletClient: null,
      });
      logs.info("Wallet disconnected");
    },
  };
}

function createSmartAccountStore() {
  const { subscribe, set, update } = writable<SmartAccountState>({
    address: null,
    balance: "0",
    owners: [],
    threshold: 1,
    isDeployed: false,
  });

  return {
    subscribe,

    load: async (publicClient: PublicClient) => {
      try {
        const addresses = getAddresses();
        const smartAccountAddress = addresses.smartAccount as Address;

        logs.info(
          `Loading Smart Account: ${smartAccountAddress.slice(0, 10)}...`
        );

        // Check if deployed
        const code = await publicClient.getBytecode({
          address: smartAccountAddress,
        });
        const isDeployed = code !== undefined && code !== "0x";

        if (!isDeployed) {
          logs.warn("Smart Account not deployed yet");
          set({
            address: smartAccountAddress,
            balance: "0",
            owners: [],
            threshold: 1,
            isDeployed: false,
          });
          return;
        }

        // Get balance
        const balance = await publicClient.getBalance({
          address: smartAccountAddress,
        });

        // Get owners and threshold
        const [owners, threshold] = await Promise.all([
          publicClient.readContract({
            address: smartAccountAddress,
            abi: myAccountAbi,
            functionName: "getOwners",
          }),
          publicClient.readContract({
            address: smartAccountAddress,
            abi: myAccountAbi,
            functionName: "threshold",
          }),
        ]);

        set({
          address: smartAccountAddress,
          balance: formatEther(balance),
          owners: owners as Address[],
          threshold: Number(threshold),
          isDeployed: true,
        });

        logs.success(
          `Smart Account loaded`,
          `Balance: ${formatEther(balance)} ETH, Owners: ${
            (owners as Address[]).length
          }, Threshold: ${threshold}`
        );
      } catch (err) {
        const error = err as Error;
        logs.error("Failed to load Smart Account", error.message);
      }
    },

    refresh: async (publicClient: PublicClient) => {
      const addresses = getAddresses();
      const smartAccountAddress = addresses.smartAccount as Address;

      try {
        const balance = await publicClient.getBalance({
          address: smartAccountAddress,
        });
        update((state) => ({ ...state, balance: formatEther(balance) }));
      } catch (err) {
        console.error("Refresh failed:", err);
      }
    },
  };
}

export const wallet = createWalletStore();
export const smartAccount = createSmartAccountStore();

// Derived store for connection status
export const isConnected = derived(wallet, ($wallet) => $wallet.connected);
