/**
 * Web3 Service - Atomic Minting & SBT Management
 * Interaction with Soulbound Token (ERC-5192/8004) protocols.
 */
import { BrowserProvider, Contract, parseEther } from 'ethers';

const ATOMIC_MINT_ADDRESS = import.meta.env.VITE_ATOMIC_MINT_CONTRACT_ADDRESS || '';
const OKE_NFT_ADDRESS = import.meta.env.VITE_OKE_CONTRACT_ADDRESS || '';
const BASE_SEPOLIA_CHAIN_ID = 84532;

const ATOMIC_MINT_ABI = [
    "function atomicMint(address to, string memory tokenURI) public payable returns (uint256, address)",
    "function sbt() view returns (address)"
];

const SBT_ABI = [
    "function balanceOf(address owner) view returns (uint256)"
];

let _provider = null;
let _signer = null;
let _userAddress = null;

export async function connectWallet() {
    if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask or compatible wallet required.');
    }
    _provider = new BrowserProvider(window.ethereum);
    const accounts = await _provider.send('eth_requestAccounts', []);
    _signer = await _provider.getSigner();
    _userAddress = accounts[0];
    return { provider: _provider, signer: _signer, address: _userAddress };
}

/**
 * 🔒 SBT Balance Check (Token-Gating)
 */
export async function checkSBTBalance() {
    try {
        const { provider, address } = await connectWallet();
        const atomicContract = new Contract(ATOMIC_MINT_ADDRESS, ATOMIC_MINT_ABI, provider);
        const sbtAddress = await atomicContract.sbt();
        const sbtContract = new Contract(sbtAddress, SBT_ABI, provider);
        const balance = await sbtContract.balanceOf(address);
        return balance > 0n;
    } catch (error) {
        console.error("SBT Balance Check Failed:", error);
        return false;
    }
}

/**
 * 🔑 Proof of Ownership Signature
 */
export async function signMessageForAccess(artifactId) {
    const { signer, address } = await connectWallet();
    const timestamp = Date.now();
    const message = `Unlock Artifact: ${artifactId}\nTimestamp: ${timestamp}\nWallet: ${address}`;
    const signature = await signer.signMessage(message);
    return { message, signature, address, timestamp };
}



export const web3Service = {
    connectWallet,
    checkSBTBalance,
    signMessageForAccess
};

export default web3Service;
