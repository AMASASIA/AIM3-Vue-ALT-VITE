/**
 * OKE Service — Frontend Integration Layer
 * ==========================================
 * 
 * Connects OkePage.vue to:
 *   1. Backend Express API (/api/oke/mint-fact, /atomicMint)
 *   2. Firebase Realtime DB (cards/ node — Pattern 1: all-inclusive)
 *   3. Web3 Service (SBT verification, wallet connection)
 * 
 * Architecture: "声 → 結晶化 → Mint → 決済" サイクルの実装
 *   Voice Input → Gemini AI Structuring → Firebase Push → Atomic Mint
 * 
 * Security: All data in POST body. No sensitive info in URLs.
 */

import { ref as dbRef, onValue, push, set } from 'firebase/database';
import { db } from '../firebase';
import { web3Service } from './web3Service';

const API_BASE = import.meta.env.VITE_FINANCE_API_URL || 'http://localhost:3000';

/**
 * Execute Atomic Mint via Backend API
 * Sends metadata to backend which handles IPFS upload + on-chain execution
 * 
 * @param {Object} params
 * @param {string} params.address - User wallet address
 * @param {Object} params.metadata - Card/artifact metadata
 * @param {string[]} params.types - ['NFT', 'SBT', 'TBA']
 * @param {File} [params.file] - Optional uploaded file
 * @param {string} [params.voiceText] - Optional voice input text
 * @returns {Promise<Object>} Mint result
 */
export async function executeAtomicMint({ address, metadata, types, file, voiceText }) {
    try {
        console.log('[OKE Service] Starting Atomic Mint...', { address, types });

        // Build metadata payload (Pattern 1: all-inclusive)
        const payload = {
            address: address || 'local-demo',
            metadata: {
                ...metadata,
                types,
                voiceText: voiceText || null,
                timestamp: new Date().toISOString(),
                source: 'OkePage'
            },
            rally: null,
            aiLog: {
                energyScore: 0.85,
                model: 'gemini-2.0-flash',
                action: 'atomic_mint'
            }
        };

        // Try backend API first
        try {
            const response = await fetch(`${API_BASE}/api/oke/mint-fact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetWallet: address || 'local-demo',
                    contextFact: metadata,
                    visualFact: metadata.generatedImage,
                    physics: metadata.attributes,
                    useOpal: true // ENABLE OPAL ENHANCEMENT
                })
            });

            if (response.ok) {
                const result = await response.json();
                const cardData = {
                    ...metadata,
                    image: result.imageUrl || metadata.generatedImage,
                    tx: result.proofs?.tx || result.tx,
                    sbtId: result.proofs?.sbtId,
                    nftId: result.proofs?.nftId,
                    tba: result.proofs?.tba,
                    types,
                    mintedAt: new Date().toISOString()
                };

                await saveCardToFirebase(cardData);

                return {
                    success: true,
                    ...cardData,
                    source: 'backend'
                };
            }
        } catch (apiError) {
            console.warn('[OKE Service] Backend API unavailable:', apiError.message);
        }



        // Simulation fallback
        const mockTx = '0x' + Math.random().toString(16).slice(2, 10).toUpperCase();
        const mockResult = {
            success: true,
            tx: mockTx,
            sbtId: 'SBT-' + Math.floor(Math.random() * 100000),
            nftId: 'NFT-' + Math.floor(Math.random() * 100000),
            tba: '0x' + Math.random().toString(16).slice(2, 42),
            mintedAt: new Date().toISOString(),
            source: 'simulation'
        };

        const finalMockData = {
            ...metadata,
            ...mockResult,
            types
        };

        await saveCardToFirebase(finalMockData);

        return finalMockData;

    } catch (error) {
        console.error('[OKE Service] Atomic Mint failed:', error);
        throw error;
    }
}

/**
 * Execute Triple Mint via OKE Gateway
 * The "Thinking, Seeing, Proving" triple mint protocol
 * 
 * @param {Object} params
 * @param {string} params.targetWallet - Recipient wallet
 * @param {string} params.contextFact - AI-extracted context
 * @param {string} params.visualFact - Visual proof data
 * @returns {Promise<Object>} Triple mint result
 */
export async function executeTripleMint({ targetWallet, contextFact, visualFact }) {
    try {
        const response = await fetch(`${API_BASE}/api/oke/mint-fact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetWallet, contextFact, visualFact })
        });

        if (!response.ok) throw new Error(`Triple mint failed: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.warn('[OKE Service] Triple mint API unavailable:', error.message);
        // Simulation
        return {
            status: 'success',
            proofs: {
                tx: '0x' + Math.random().toString(16).slice(2, 42),
                sbtId: 'SBT-' + Date.now().toString(36),
                nftId: 'NFT-' + Date.now().toString(36),
                tba: '0x' + Math.random().toString(16).slice(2, 42)
            },
            source: 'simulation'
        };
    }
}

/**
 * Save card data to Firebase (Pattern 1: all-inclusive)
 * Single write to cards/ node with all data embedded
 */
async function saveCardToFirebase(cardData) {
    try {
        if (!db) {
            console.warn('[OKE Service] Firebase not initialized, skipping save');
            return null;
        }

        const cardsRef = dbRef(db, 'cards');
        const newCardRef = push(cardsRef);

        const payload = {
            title: cardData.title || cardData.name || 'Atomic Artifact',
            subtitle: cardData.subtitle || cardData.description || '',
            types: cardData.types || ['NFT', 'SBT', 'TBA'],
            tx: cardData.tx || '',
            mintedAt: cardData.mintedAt || new Date().toISOString(),
            web3: {
                contractAddress: import.meta.env.VITE_ATOMIC_MINT_CONTRACT_ADDRESS || '',
                tier1Price: '0.015',
                sbtId: cardData.sbtId || '',
                nftId: cardData.nftId || '',
                tba: cardData.tba || ''
            },
            artifactData: {
                markdown: cardData.markdown || cardData.content || '',
                discoveryContext: cardData.source || 'OkePage Mint',
                voiceText: cardData.voiceText || ''
            },
            location: cardData.location || null,
            simulated: cardData.simulated || false
        };

        await set(newCardRef, payload);
        console.log('[OKE Service] Card saved to Firebase:', newCardRef.key);
        return newCardRef.key;
    } catch (error) {
        console.warn('[OKE Service] Firebase save failed:', error.message);
        return null;
    }
}

/**
 * Load all cards from Firebase (real-time listener)
 * @param {Function} callback - Called with updated cards array
 * @returns {Function} Unsubscribe function
 */
export function subscribeToCards(callback) {
    if (!db) {
        console.warn('[OKE Service] Firebase not available, using empty state');
        callback([]);
        return () => { };
    }

    const cardsRef = dbRef(db, 'cards');
    const unsubscribe = onValue(cardsRef, (snapshot) => {
        const val = snapshot.val() || {};
        const cards = Object.entries(val).map(([id, data]) => ({
            id,
            ...data,
            name: data.title || data.name || 'Untitled',
            types: data.types || ['NFT'],
            seed: (parseFloat(id.slice(-2), 16) || 1) * 0.1 // Increased scale
        }));
        callback(cards.reverse()); // Newest first
    }, (error) => {
        console.error('[OKE Service] Firebase subscription error:', error);
        callback([]);
    });

    return unsubscribe;
}

/**
 * Token-gated artifact access
 * Verifies SBT ownership before returning artifact data
 * 
 * @param {string} cardId - Card ID to access
 * @returns {Promise<Object>} { authorized: boolean, data?: Object }
 */
export async function accessProtectedArtifact(cardId) {
    try {
        // Step 1: Check SBT balance
        const hasSBT = await web3Service.checkSBTBalance();
        if (!hasSBT) {
            return { authorized: false, reason: 'No SBT found in wallet' };
        }

        // Step 2: Sign access message
        const { signature, message, address } = await web3Service.signMessageForAccess(cardId);

        // Step 3: Request artifact from backend (with proof)
        try {
            const response = await fetch(`${API_BASE}/api/oke/artifact/${cardId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ signature, message, address })
            });

            if (response.ok) {
                const data = await response.json();
                return { authorized: true, data };
            }
        } catch (e) {
            // Backend unavailable — use Firebase direct access as fallback
        }

        // Fallback: Read from Firebase directly (for MVP/demo phase)
        return { authorized: true, data: null, fallback: true };

    } catch (error) {
        console.error('[OKE Service] Protected access failed:', error);
        return { authorized: false, reason: error.message };
    }
}

export default {
    executeAtomicMint,
    executeTripleMint,
    subscribeToCards,
    accessProtectedArtifact
};
