const express = require('express');
const router = express.Router();
const AgentState = require('../agent-engine/state');
const Router = require('../agent-engine/router');

// In-memory session store (use Redis/DB for prod)
const sessions = new Map();

router.post('/', async (req, res) => {
    try {
        const { prompt, sessionId = 'default', userId = 'anchor' } = req.body;

        console.log(`[AgentEngine] Request received: ${prompt.substring(0, 30)}...`);

        // Initialize or retrieve State
        let state;
        if (sessions.has(sessionId)) {
            state = sessions.get(sessionId);
        } else {
            state = new AgentState(sessionId, userId);
            sessions.set(sessionId, state);
        }

        // Add user input to history
        state.addToHistory('user', prompt);

        // Execute Hybrid Flow
        const agentRouter = new Router(state);
        const result = await agentRouter.route(prompt);

        // Add agent output to history
        state.addToHistory('agent', result);

        res.json({
            status: 'success',
            response: result,
            meta: {
                trace: state.logs,
                type: state.context.intent
            }
        });

    } catch (error) {
        console.error('Agent Engine Error:', error);
        res.status(500).json({ error: 'Agent execution failed' });
    }
});

// --- Tive AI: Hybrid / Sensory Separation Architecture (防波堤) ---

// Mock: Phase 1 (Sensory - Google Gemini API interface)
async function callGeminiSensory(text) {
    return new Promise((resolve) => setTimeout(() => resolve({
        anonymized_text: text.replace(/(Google|Gemini|Apple|AWS)/ig, "[MASK]"), // Simple mock PII masking
        emotion: "focused",
        facts: ["User initiated cognitive synthesis", "System is stabilizing"]
    }), 500));
}

// Mock: Phase 2 (Parallel Tasks)
async function uploadToIPFS(facts) {
    return new Promise((resolve) => setTimeout(() => resolve("QmDummyHash" + Date.now()), 300));
}

async function callLocalLLM(promptType, data) {
    return new Promise((resolve) => setTimeout(() => {
        if (promptType === 'labeling') {
            resolve(["自己省察", "アーキテクチャ再構築"]);
        } else {
            resolve(`あなたが「${data.current_text}」と感じていること、確かに受け取りました。システムは現在、安定して並列処理を実行中です。次にどのような世界を形にしたいですか？`);
        }
    }, 600));
}

async function updateMemoryGraph(userId, text, emotion) {
    return new Promise((resolve) => setTimeout(() => resolve(`(過去のコンテキスト) ユーザーは複雑なシステムをシンプルで堅牢な形へ移行しようとしている。`), 400));
}

// The unified endpoint for Hybrid processing
router.post('/hybrid', async (req, res) => {
    try {
        const { text, userId = 'anchor' } = req.body;
        console.log(`[Phase 1] Sensory Phase Initiated for: ${text.substring(0, 20)}...`);

        // Phase 1: Call Sensory (Gemini)
        const sensoryData = await callGeminiSensory(text);

        console.log(`[Phase 2] Intercept & Parallel Processing (Memory, IPFS, Labeling)`);

        // Task A: IPFS (Background task, non-blocking)
        uploadToIPFS(sensoryData.facts)
            .then(hash => console.log(`[IPFS] Facts uploaded in background: ${hash}`))
            .catch(e => console.error("[IPFS] Background upload failed:", e));

        // Tasks B & C: Parallel Execution
        const [customLabels, retrievedContext] = await Promise.all([
            callLocalLLM('labeling', { text: sensoryData.anonymized_text }),
            updateMemoryGraph(userId, sensoryData.anonymized_text, sensoryData.emotion)
        ]);

        console.log(`[Phase 3] Broadcasting (Local LLM Generating Response)`);

        const finalResponse = await callLocalLLM('broadcast', {
            emotion: sensoryData.emotion,
            labels: customLabels,
            context: retrievedContext,
            current_text: sensoryData.anonymized_text
        });

        res.json({
            success: true,
            response: finalResponse,
            meta: {
                emotion: sensoryData.emotion,
                labels: customLabels,
                anonymized_text: sensoryData.anonymized_text
            }
        });

    } catch (error) {
        console.error('[Hybrid Engine Error] Self-healing fallback triggered:', error);
        // 防波堤: Self-healing response without crashing the app
        res.status(500).json({
            success: false,
            response: "システムは現在過負荷ですが、私はここにいます。一時的なセーフモードで応答しています。深呼吸して、もう一度話しかけてみてください。",
            meta: { emotion: "neutral", labels: ["System Recovery"] }
        });
    }
});

module.exports = router;
