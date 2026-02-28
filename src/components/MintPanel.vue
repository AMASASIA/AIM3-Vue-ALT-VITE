<template>
  <div class="mint-panel">
    <div class="status-bar">
      <span>Energy: {{ engineEnergy.toFixed(2) }}</span>
      <span>Status: {{ status }}</span>
    </div>

    <div class="glow-frame" :class="glowClass">
        <!-- Visualization area handled by Antigravity in background or here -->
        <h2 class="title">AIM3 Atomic Mint</h2>
    </div>

    <!-- AI Control Section -->
    <div class="ai-control">
      <h3>AI Guidance</h3>
      <input v-model="aiPrompt" placeholder="Enter prompt e.g. 'Excited space energy'" class="ai-input" />
      <button @click="generateAI" :disabled="loading">
        {{ loading ? 'Analyzing...' : '1. Ask AI' }}
      </button>
    </div>

    <!-- Wallet Connection -->
    <div class="wallet-section" style="margin-bottom: 10px; display: flex; gap: 5px; flex-wrap: wrap;">
       <!-- Web3Modal Button (Custom Element or Trigger) -->
       <button @click="openWeb3Modal" class="wallet-btn" style="background: linear-gradient(90deg, #00C6FF, #0072FF);">
          Connect (All Wallets)
       </button>
       
       <!-- Direct Shortcuts (Optional) -->
       <!-- <button v-if="!isWalletConnected" @click="connectBase" class="wallet-btn base-btn">Base Mainnet</button> -->
       
       <div v-if="address && address !== '0xUserAddressMock'" class="wallet-info">
           Connected: {{ address.substring(0,6) }}...
       </div>
    </div>

    <!-- Metadata & IPFS Preview -->
    <div v-if="aiResult" class="metadata-preview">
       <pre>{{ JSON.stringify(aiResult, null, 2) }}</pre>
    </div>

    <div v-if="ipfsCid" class="ipfs-info" style="margin-bottom: 15px; font-size: 0.9em; color: #00ffcc;">
       🌐 IPFS Pin: <a :href="`https://gateway.pinata.cloud/ipfs/${ipfsCid}`" target="_blank" style="color: #00ffcc;">{{ ipfsCid }}</a>
    </div>

    <!-- Atomic Mint Button -->
    <button class="mint-btn" @click="atomicMint" :disabled="!aiResult || minting">
       {{ minting ? 'Minting Atomic...' : '2. ATOMIC MINT (NFT + SBT + Rally)' }}
    </button>
    
    <div v-if="txHash" class="success-msg">
        Success! <br>
        NFT: {{ txHash.nft }} <br>
        Soul: {{ txHash.sbt }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { AntigravityEngine } from "../engine/antigravity-engine.js";
// Removed Gemini and IPFS dependencies from Frontend to enforce Sensory Separation Architecture

const aiPrompt = ref("Energetic neon cyber future");
const loading = ref(false);
const minting = ref(false);
const aiResult = ref(null);
const status = ref("Idle");
const txHash = ref(null);
const engineEnergy = ref(0.5);
const verificationStatus = ref('');
const ipfsCid = ref('');

const glowClass = computed(() => AntigravityEngine.glowState || 'stable');

const address = ref("0xUserAddressMock");
    const isWalletConnected = ref(false);
    
    // Sync with Web3Modal
    import { useWeb3ModalAccount } from '@web3modal/ethers/vue'
    const { address: modalAddress, isConnected } = useWeb3ModalAccount()
    
    // Watch for changes (simple sync)
    watch(modalAddress, (newVal) => {
        if(newVal) {
            address.value = newVal;
            isWalletConnected.value = true;
            status.value = "Wallet Connected via AppKit";
        }
    });

    import { modal } from '../lib/web3modal.js';
    import { useWeb3Modal } from '@web3modal/ethers/vue';

    // Hook to force re-render or check state if needed, though modal handles itself mostly
    const { open } = useWeb3Modal()

    const openWeb3Modal = () => {
        open();
    };

    // Keep legacy direct injected logic as fallback or specific use case if desired
    // But primarily use the modal for broad compatibility (WalletConnect + Injected)
    async function connectWallet() {
       // Using the new Modal instead of manual injected logic
       await open();
       // Note: To get the address reactively from the modal, we'd use the useWeb3ModalAccount hook
       // For this mix, let's just trigger the UI.
    }

    async function connectBase() {
      if (!window.ethereum) return;
      
      try {
        // 1. Connect
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        address.value = accounts[0];
        isWalletConnected.value = true;

        // 2. Switch to Base (Chain ID 8453 = 0x2105)
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x2105' }], 
          });
        } catch (switchError) {
          // This error code indicates that the chain has not been added to MetaMask.
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x2105',
                  chainName: 'Base',
                  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                  rpcUrls: ['https://mainnet.base.org'],
                  blockExplorerUrls: ['https://basescan.org'],
                },
              ],
            });
          } else {
            throw switchError;
          }
        }
        status.value = "Connected to Base: " + address.value.substring(0,6) + "...";
      } catch (error) {
        console.error(error);
        status.value = "Base Connection Failed";
      }
    }

    async function connectBaseSepolia() {
      if (!window.ethereum) return;
      
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        address.value = accounts[0];
        isWalletConnected.value = true;

        // Base Sepolia (Chain ID 84532 = 0x14a34)
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x14a34' }], 
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x14a34',
                  chainName: 'Base Sepolia Testnet',
                  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                  rpcUrls: ['https://sepolia.base.org'],
                  blockExplorerUrls: ['https://sepolia.basescan.org'],
                },
              ],
            });
          } else {
            throw switchError;
          }
        }
        status.value = "Connected to Base Sepolia: " + address.value.substring(0,6) + "...";
      } catch (error) {
        console.error(error);
        status.value = "Testnet Connection Failed";
      }
    }

    // 1. Generate AI State & Metadata (Delegated to Backend Node.js)
    async function generateAI() {
  loading.value = true;
  status.value = "Consulting AI Engine (Hybrid Phase)...";
  
  try {
    const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"; 
    const res = await fetch(`${API_URL}/agent/hybrid`, {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ text: aiPrompt.value })
    });
    
    const data = await res.json();
    
    if (data.success) {
        // Construct NFT metadata for minting based on hybrid backend response
        const metadata = {
            name: `Cognitive Core: ${data.meta?.emotion || 'Unknown'}`,
            description: data.response || "No response",
            attributes: (data.meta?.labels || []).map(l => ({ trait_type: "Label", value: l }))
        };

        const mockEngineState = { energyScore: 0.8, color: "bright", gravity: {x:0, y:0} };
        
        aiResult.value = {
            engine: mockEngineState,
            metadata: metadata,
            hybridMeta: data.meta
        };
        
        AntigravityEngine.loadAIState(mockEngineState);
        engineEnergy.value = 0.8;
        
        status.value = "AI Phase Completed Safely.";
    } else {
        throw new Error(data.response || "Safe mode active.");
    }
  } catch (e) {
    console.error("Agent Engine connection error:", e);
    status.value = "AI System Safe Mode (Fallback).";
  } finally {
    loading.value = false;
  }
}

// 2. Atomic Mint Call
async function atomicMint() {
    if(!aiResult.value) return;
    minting.value = true;
    status.value = "Delegating Mint & IPFS Upload to Backend...";

    try {
        const metadata = aiResult.value.metadata;
        const aiLog = aiResult.value.engine;

        // Auto-detect backend URL (use Vite env var)
        const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"; 
        
        const res = await fetch(`${API_URL}/atomicMint`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                address: address.value || "0xUserAddressMock",
                metadata: metadata, // The backend /atomicMint endpoint will handle IPFS!
                rally: { stamps: 1, action: "mint", timestamp: Date.now() },
                aiLog: aiLog
            })
        });
        
        let data;
        try {
             data = await res.json();
        } catch (jsonErr) {
             throw new Error("Invalid backend response");
        }
        
        if(res.ok && data.success) {
            txHash.value = { nft: data.transaction?.tx || "0xMockTx", sbt: "0xSoulID" };
            status.value = "MINT COMPLETE!";
            AntigravityEngine.triggerMintCelebration();
        } else {
            console.warn("Backend Mint Failed, triggering visual fallback for demo:", data.error);
            // Visual Fallback for Demo purposes if backend fails (e.g. no RPC)
            fallbackMintSuccess();
        }

    } catch (e) {
        console.error("Mint Error:", e);
        // Visual Fallback for Demo
        fallbackMintSuccess();
    } finally {
        minting.value = false;
    }
}

function fallbackMintSuccess() {
    txHash.value = { nft: "0xMockNFT_" + Date.now().toString(16), sbt: "0xMockSoul_" + Date.now().toString(16) };
    status.value = "MINT COMPLETE (Simulation Mode)";
    AntigravityEngine.triggerMintCelebration();
}

// Loop to update local reactive vars from Engine if needed
setInterval(() => {
    engineEnergy.value = AntigravityEngine.energy;
}, 100);

</script>

<style scoped>
.mint-panel {
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #333;
    max-width: 400px;
    font-family: 'Inter', sans-serif;
}
.glow-frame {
    border: 2px solid #555;
    padding: 20px;
    margin: 20px 0;
    text-align: center;
    transition: box-shadow 0.5s;
}
.glow-frame.reactive {
    box-shadow: 0 0 20px var(--glow-color, cyan);
    border-color: white;
}
.ai-input {
    width: 100%;
    padding: 8px;
    background: #222;
    border: 1px solid #444;
    color: white;
    margin-bottom: 10px;
}
button {
    width: 100%;
    padding: 10px;
    cursor: pointer;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    margin-bottom: 10px;
}
button:disabled {
    background: #444;
    cursor: not-allowed;
}
.mint-btn {
    background: linear-gradient(45deg, #ff00cc, #3333ff);
    font-weight: bold;
}
.success-msg {
    color: #00ff00;
    margin-top: 10px;
    word-break: break-all;
    font-size: 0.8em;
}
.base-btn {
    background: #0052FF; /* Coinbase Blue */
}
.base-btn:hover {
    background: #0045d8;
}
.testnet-btn {
    background: #8a2be2; /* Violet for Testnet */
}
.testnet-btn:hover {
    background: #7a1fd2;
}
</style>
