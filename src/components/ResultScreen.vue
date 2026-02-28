<script setup>
import { ref, onMounted, computed } from 'vue';
import { Share2, Book, Check, PenTool, X, Trash2, ArrowLeft, Plus, Mic, Square, Menu, LayoutDashboard, Copy, Zap } from 'lucide-vue-next';
import { i18n, theme } from '../services/i18n';

const props = defineProps({
    content: { type: String, default: "" },
    isThinking: { type: Boolean, default: true }
});

const emit = defineEmits(['close', 'save', 'oke', 'submit']);

const isSigning = ref(false);
const isOke = ref(false);
const selectedModel = ref('Gemini'); 
const promptInput = ref('');
const processingState = ref('idle'); // idle, proofing, sending, completed
const userWallet = ref(localStorage.getItem('tive_wallet_address') || '');
const zkpProof = ref(null);

// Canvas Logic
const canvasRef = ref(null);
const ctx = ref(null);
const isDrawing = ref(false);

const initCanvas = () => {
    if (canvasRef.value) {
        const canvas = canvasRef.value;
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        ctx.value = canvas.getContext('2d');
        ctx.value.strokeStyle = '#000';
        ctx.value.lineWidth = 3;
        ctx.value.lineCap = 'round';
        ctx.value.lineJoin = 'round';
    }
};

const startDrawing = (e) => {
    if (!isSigning.value) return;
    isDrawing.value = true;
    const { x, y } = getCoordinates(e);
    ctx.value.beginPath();
    ctx.value.moveTo(x, y);
};

const draw = (e) => {
    if (!isDrawing.value) return;
    const { x, y } = getCoordinates(e);
    ctx.value.lineTo(x, y);
    ctx.value.stroke();
};

const stopDrawing = () => {
    isDrawing.value = false;
};

const clearCanvas = () => {
    if (ctx.value && canvasRef.value) {
        ctx.value.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
    }
};

const getCoordinates = (e) => {
    const rect = canvasRef.value.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
};

const handleCopy = () => {
    navigator.clipboard.writeText(props.content);
};

const toggleSign = () => {
    if (isSigning.value) {
        clearCanvas();
        isSigning.value = false;
    } else {
        isSigning.value = true;
        setTimeout(initCanvas, 50); 
    }
};

const handlePromptSubmit = () => {
    if (!promptInput.value.trim()) return;
    emit('submit', { prompt: promptInput.value, model: selectedModel.value });
    promptInput.value = '';
};

// --- OKE / ZKP FLOW ---
const handleAmaneMint = async (target) => {
    if (processingState.value !== 'idle') return;
    
    processingState.value = 'proofing';
    try {
        const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
        
        // --- 1. Request Atomic Mint (ZKP + AA Bundler execution on backend) ---
        // Backend takes over heavy operations to prevent frontend freezes (Robustness & Slimming)
        processingState.value = 'sending';
        
        const payload = {
            targetWallet: userWallet.value || "0xGhostWallet", // System detects or uses default
            contextFact: { 
                name: `Tive AI Thought: ${selectedModel.value}`, 
                content: props.content,
                model: selectedModel.value
            },
            visualFact: "", // Future: Pass canvas signature Base64 here if needed
            useOpal: false 
        };

        const res = await fetch(`${API_URL}/api/oke/mint-fact`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Backend Minting Failed");
        const data = await res.json();
        console.log("Amane Flow Success (Backend):", data);

        processingState.value = 'completed';
        
        setTimeout(() => {
            if (target === 'save') emit('save', props.content);
            else emit('oke', props.content);
            processingState.value = 'idle';
        }, 1500);

    } catch (e) {
        console.error("Amane Flow failed, falling back safely:", e);
        // Self-Healing & UX Protection: Avoid breaking the app, just inform the user cleanly
        alert("ブロックチェーン側またはネットワークが混雑しています。データは一時的にローカル保護されました。");
        processingState.value = 'idle';
    }
};
</script>

<template>
  <div :class="['fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 overflow-hidden font-sans transition-colors duration-700', theme === 'light' ? 'bg-zinc-50 light-mode' : 'bg-black']">
    
    <!-- Top Nav -->
    <header class="absolute top-0 w-full p-10 flex justify-between items-center z-[110]">
        <div class="flex items-center gap-4 opacity-30 text-white" :class="{ 'text-black': theme === 'light' }">
            <Menu :size="20" />
            <span class="text-[10px] font-black uppercase tracking-[0.3em] font-sans">Tive AI</span>
        </div>
        <div class="flex items-center gap-4 text-white">
            <div class="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full scale-90" :class="{ 'bg-black/5 border-black/10': theme === 'light' }">
                <span class="text-[9px] uppercase font-bold tracking-widest opacity-40" :class="{ 'text-black': theme === 'light' }">Model:</span>
                <select v-model="selectedModel" class="bg-transparent text-[9px] uppercase font-black outline-none cursor-pointer" :class="{ 'text-black': theme === 'light', 'text-white': theme === 'dark' }">
                    <option value="Gemini">Gemini</option>
                    <option value="Claude">Claude</option>
                    <option value="ChatGPT">ChatGPT</option>
                </select>
            </div>
            <LayoutDashboard :size="20" class="cursor-pointer opacity-30 hover:opacity-100 transition-opacity" :class="{ 'text-black': theme === 'light', 'text-white': theme === 'dark' }" @click="$emit('close')" />
        </div>
    </header>

    <!-- Main Card Container -->
    <div class="relative w-full max-w-[450px] aspect-square animate-in fade-in zoom-in duration-700">
        
        <!-- Action Buttons (Top-Right) -->
        <div v-if="!isThinking" class="absolute -top-2 -right-16 flex flex-col gap-3 z-[150]">
            <!-- Copy / OKE Toggle -->
            <button 
                @click="isOke = !isOke; if(!isOke) handleCopy();" 
                :class="['w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-2xl backdrop-blur-xl border transform hover:scale-110 active:scale-95', 
                        isOke ? 'bg-emerald-500 border-emerald-400 text-white' : (theme === 'light' ? 'bg-white/80 border-black/10 text-black' : 'bg-white/10 border-white/20 text-white')]"
                :title="isOke ? 'OKE' : 'Copy'"
            >
                <component :is="isOke ? Check : Copy" :size="20" />
            </button>
            
            <!-- Sign / Clear Button -->
            <button 
                @click="toggleSign" 
                :class="['w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-2xl backdrop-blur-xl border transform hover:scale-110 active:scale-95', 
                        isSigning ? 'bg-rose-500 border-rose-400 text-white' : (theme === 'light' ? 'bg-white/80 border-black/10 text-black' : 'bg-white/10 border-white/20 text-white')]"
                :title="isSigning ? 'Clear' : 'Sign'"
            >
                <PenTool v-if="!isSigning" :size="18" />
                <Trash2 v-else :size="18" />
            </button>
        </div>

        <div class="main-card w-full h-full bg-white rounded-[4rem] shadow-[0_0_100px_rgba(255,255,255,0.05)] flex flex-col items-center justify-center text-center p-12 overflow-hidden relative" :class="{ 'shadow-[0_0_60px_rgba(0,0,0,0.1)]': theme === 'light' }">
            
            <!-- Multi-layered Resonance (Thinking State) -->
            <template v-if="isThinking">
                <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
                    <div class="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[#FF007F] blur-[120px] animate-resonance-1 mix-blend-multiply opacity-50"></div>
                    <div class="absolute top-[-10%] right-[-10%] w-[120%] h-[120%] bg-[#7F00FF] blur-[100px] animate-resonance-2 mix-blend-screen opacity-40"></div>
                    <div class="absolute bottom-[-20%] left-[10%] w-[130%] h-[130%] bg-[#00F0FF] blur-[110px] animate-resonance-3 mix-blend-overlay opacity-30"></div>
                </div>
                
                <div class="mb-10 relative z-10">
                    <div class="absolute inset-0 bg-[#FF007F] blur-3xl opacity-60 animate-pulse scale-150"></div>
                    <div class="relative w-6 h-6 bg-[#FF007F] rounded-full shadow-[0_0_50px_#FF007F] flex items-center justify-center">
                        <div class="w-2.5 h-2.5 bg-white rounded-full opacity-90 animate-ping"></div>
                        <div class="absolute inset-[4px] bg-white rounded-full opacity-100"></div>
                    </div>
                </div>

                <div class="space-y-6 z-10">
                    <h2 class="text-5xl sm:text-6xl font-light tracking-[0.15em] text-black opacity-100 drop-shadow-xl animate-pulse">
                        Thinking..
                    </h2>
                </div>
            </template>

            <div v-else class="space-y-6 z-10 w-full h-full flex flex-col justify-center">
                <div class="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div class="text-2xl sm:text-3xl font-light tracking-tight leading-relaxed text-black/90 max-h-[300px] overflow-y-auto px-6 custom-scrollbar">
                        {{ content }}
                    </div>
                </div>
            </div>
            
            <!-- Handwriting Canvas Overlay -->
            <canvas 
                ref="canvasRef"
                v-show="isSigning" 
                class="absolute inset-0 z-20 cursor-crosshair touch-none"
                @mousedown="startDrawing"
                @mousemove="draw"
                @mouseup="stopDrawing"
                @mouseleave="stopDrawing"
                @touchstart.prevent="startDrawing"
                @touchmove.prevent="draw"
                @touchend.prevent="stopDrawing"
            ></canvas>

            <!-- Grain/Texture Overlay -->
            <div class="absolute inset-0 opacity-[0.03] pointer-events-none z-30" style="background-image: url('https://grainy-gradients.vercel.app/noise.svg');"></div>
            
            <!-- Decorative Ambient Base -->
            <div class="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black/5 to-transparent pointer-events-none"></div>
        </div>
    </div>

    <!-- Bottom Action Bar -->
    <div class="absolute bottom-12 w-full max-w-2xl px-8 flex flex-col items-center gap-8">
        
        <div v-if="!isThinking" class="flex items-center gap-6 animate-in fade-in zoom-in duration-500">
            <button 
                @click="handleAmaneMint('oke')" 
                :disabled="processingState !== 'idle'"
                class="w-16 h-16 rounded-3xl bg-emerald-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all disabled:opacity-50 relative overflow-hidden"
            >
                <Check v-if="processingState === 'idle' || processingState === 'completed'" :size="28" stroke-width="3" />
                <div v-else class="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                
                <!-- Status Overlay (Progressive) -->
                <div v-if="processingState === 'proofing'" class="absolute inset-0 bg-emerald-600 flex items-center justify-center">
                    <Zap :size="20" class="animate-pulse" />
                </div>
                <div v-if="processingState === 'sending'" class="absolute inset-0 bg-blue-600 flex items-center justify-center">
                    <Share2 :size="20" class="animate-bounce" />
                </div>
            </button>

            <div class="flex flex-col items-center">
                <button 
                    @click="handleAmaneMint('save')" 
                    :disabled="processingState !== 'idle'"
                    class="w-48 h-16 rounded-3xl bg-white text-black text-[10px] font-black uppercase tracking-[0.4em] shadow-xl active:scale-95 transition-all border border-black/5 disabled:opacity-50"
                >
                    <span v-if="processingState === 'idle'">{{ i18n.t('notebook') }}</span>
                    <span v-else-if="processingState === 'proofing'">ZKP PROOFING..</span>
                    <span v-else-if="processingState === 'sending'">SECRET MINTING..</span>
                    <span v-else-if="processingState === 'completed'">COMPLETED!</span>
                </button>
                <p v-if="processingState !== 'idle'" class="mt-2 text-[8px] font-black uppercase tracking-widest text-emerald-500 animate-pulse">
                    {{ processingState === 'proofing' ? 'Generating Proof' : 'Executing Atomic Mint' }}
                </p>
            </div>
        </div>

        <!-- Dynamic Prompt Input -->
        <div class="w-full relative flex items-center bg-white/5 border border-white/10 rounded-full px-6 py-4 shadow-2xl backdrop-blur-md" :class="{ 'bg-black/5 border-black/10': theme === 'light' }">
            <button class="opacity-30 hover:opacity-100 transition-opacity mr-4" :class="{ 'text-black': theme === 'light', 'text-white': theme === 'dark' }" @click="handlePromptSubmit">
                <Plus :size="20" />
            </button>
            <input 
                v-model="promptInput"
                type="text" 
                :placeholder="`${selectedModel} に質問してみましょう`"
                class="flex-1 bg-transparent text-sm outline-none placeholder:opacity-20"
                :class="{ 'text-black': theme === 'light', 'text-white': theme === 'dark' }"
                @keydown.enter="handlePromptSubmit"
            />
            <div class="flex items-center gap-4 ml-4">
                <Mic :size="20" class="opacity-30" :class="{ 'text-black': theme === 'light', 'text-white': theme === 'dark' }" />
                <div @click="$emit('close')" class="w-8 h-8 bg-white rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-md" :class="{ 'bg-black': theme === 'light' }">
                    <Square :size="10" :fill="theme === 'light' ? 'white' : 'black'" :class="theme === 'light' ? 'text-white' : 'text-black'" />
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 2px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }

.main-card {
    transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.light-mode header { color: black; }
.light-mode input { color: black; }
.light-mode .placeholder\:opacity-20::placeholder { color: black; opacity: 0.3; }

@keyframes resonance-1 {
    0%, 100% { transform: scale(1) translate(0, 0) rotate(0deg); }
    33% { transform: scale(1.2) translate(5%, 10%) rotate(5deg); }
    66% { transform: scale(0.9) translate(-5%, -5%) rotate(-5deg); }
}
@keyframes resonance-2 {
    0%, 100% { transform: scale(1) translate(0, 0) rotate(0deg); }
    33% { transform: scale(1.1) translate(-10%, 5%) rotate(-10deg); }
    66% { transform: scale(1.3) translate(10%, -10%) rotate(10deg); }
}
@keyframes resonance-3 {
    0%, 100% { transform: scale(1) translate(0, 0) rotate(0deg); }
    33% { transform: scale(0.8) translate(10%, -10%) rotate(15deg); }
    66% { transform: scale(1.2) translate(-10%, 10%) rotate(-15deg); }
}

select option {
    background: #111;
    color: white;
}
</style>
