<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { Settings, Play, Sun, Moon, Map, Book, X, CircleDot } from 'lucide-vue-next';
import Orb from './Orb.vue';
import { i18n, theme, toggleTheme, activeModel, setModel } from '../services/i18n';

const props = defineProps({
  user: Object,
  isListening: Boolean,
  isProcessing: Boolean,
  lastAudioUrl: String
});

const emit = defineEmits(['toggleVoice', 'viewDiscovery', 'viewAiMap', 'viewMemos', 'textInput']);

const textInputValue = ref('');
const showSettings = ref(false);
const recordingTime = ref(0);
let timerInterval = null;

const handleOrbClick = () => {
    emit('toggleVoice');
};

const handleTextSubmit = () => {
    if (!textInputValue.value) return;
    emit('textInput', textInputValue.value);
    textInputValue.value = '';
};

watch(() => props.isListening, (newVal) => {
    if (newVal) {
        recordingTime.value = 0;
        timerInterval = setInterval(() => {
            recordingTime.value++;
            if (recordingTime.value >= 60) emit('toggleVoice'); 
        }, 1000);
    } else {
        clearInterval(timerInterval);
    }
});
</script>

<template>
  <div class="tive-root" :class="{ 'light-mode': theme === 'light' }">
    
    <header class="tive-header">
      <div class="tive-branding">
        <div class="tive-dot-logo" :class="{ 'is-active': isListening || isProcessing }"></div>
        <span class="tive-brand-text">Tive AI</span>
      </div>
      
      <div class="nav-icons">
        <button class="status-indicator" @click="$emit('viewMemos')">
            <Book :size="14" class="mr-1" />
            <span>Notebook</span>
        </button>
        <button class="icon-btn" @click="toggleTheme" :title="i18n.t('appearance')">
            <component :is="theme === 'dark' ? Sun : Moon" :size="20" />
        </button>
        <button class="icon-btn" @click="showSettings = !showSettings" :title="i18n.t('settings')">
            <Settings :size="20" />
        </button>
      </div>
    </header>

    <!-- Floating Settings Menu -->
    <Transition name="pop">
        <div v-if="showSettings" class="settings-card backdrop-blur-3xl shadow-2xl border border-white/10 p-6 rounded-3xl z-[120]">
            <div class="space-y-6">
                <div>
                    <p class="text-[10px] uppercase tracking-widest opacity-40 mb-3">{{ i18n.t('language') }}</p>
                    <div class="grid grid-cols-4 gap-2">
                        <button v-for="l in ['en', 'ja', 'es', 'fr', 'de', 'zh', 'ko', 'it', 'pt', 'ru', 'ar', 'hi']" :key="l" @click="i18n.setLocale(l)" :class="['px-2 py-1.5 rounded-lg text-[8px] uppercase font-bold transition-all', i18n.locale === l ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white/5 hover:bg-white/10']">
                            {{ l === 'ko' ? 'KR' : l }}
                        </button>
                    </div>
                </div>

                <div>
                    <p class="text-[10px] uppercase tracking-widest opacity-40 mb-3">{{ i18n.t('modelChoice') }}</p>
                    <div class="flex gap-2">
                        <button v-for="m in ['Gemini', 'Claude', 'ChatGPT']" :key="m" @click="setModel(m)" :class="['flex-1 py-1.5 rounded-lg text-[8px] uppercase font-bold transition-all', activeModel === m ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white/5 hover:bg-white/10']">
                            {{ m }}
                        </button>
                    </div>
                </div>

                <div>
                    <p class="text-[10px] uppercase tracking-widest opacity-40 mb-3">{{ i18n.t('appearance') }}</p>
                    <button @click="toggleTheme" class="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center gap-2 transition-all">
                        <component :is="theme === 'dark' ? Sun : Moon" :size="14" />
                        <span class="text-[9px] uppercase font-bold">{{ theme === 'dark' ? 'Light' : 'Dark' }}</span>
                    </button>
                </div>
            </div>
            <button @click="showSettings = false" class="absolute top-4 right-4 opacity-40"><X :size="16" /></button>
        </div>
    </Transition>

    <main class="tive-main">
        <div class="hero-section">
           <h1 class="title">{{ i18n.t('title') }}</h1>
           <p class="subtitle">{{ i18n.t('ask') }}</p>
        </div>

        <div class="orb-wrapper" @click="handleOrbClick">
          <Orb :isListening="isListening" :isProcessing="isProcessing" />
          <div v-if="isListening" class="duration-counter">{{ recordingTime }}s</div>
        </div>

        <nav class="bridge-nav">
            <button @click="$emit('viewDiscovery')" class="bridge-link">
                <CircleDot :size="14" />
                <span>{{ i18n.t('discovery') }}</span>
            </button>
            <button @click="$emit('viewAiMap')" class="bridge-link">
                <Map :size="14" />
                <span>{{ i18n.t('map') }}</span>
            </button>
            <button @click="$emit('viewMemos')" class="bridge-link">
                <Book :size="14" />
                <span>{{ i18n.t('memo') }}</span>
            </button>
        </nav>
    </main>

    <footer class="input-container">
        <div class="input-bar shadow-2xl">
                <input 
                v-model="textInputValue"
                @keydown.enter="handleTextSubmit"
                type="text" 
                :placeholder="i18n.t('askModel').replace('{model}', activeModel)"
                />
                <button @click="handleTextSubmit" class="send-btn">
                <Play :size="16" fill="currentColor" class="translate-x-0.5" />
                </button>
        </div>
    </footer>

    <div class="ambient-glow"></div>
  </div>
</template>

<style scoped>
.tive-root {
  width: 100%; height: 100vh;
  display: flex; flex-direction: column; align-items: center; justify-content: space-between;
  padding: 40px; background-color: #000; color: #fff;
  font-family: 'Inter', sans-serif; overflow: hidden; position: relative;
  transition: all 0.5s ease;
}
.tive-root.light-mode { background-color: #fff; color: #000; }

.tive-header { width: 100%; display: flex; justify-content: space-between; align-items: center; z-index: 50; }

.tive-branding { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.tive-dot-logo { width: 8px; height: 8px; background: #fff; border-radius: 50%; box-shadow: 0 0 15px #fff; animation: tive-pulse 4s infinite ease-in-out; }
.light-mode .tive-dot-logo { background: #000; box-shadow: 0 0 10px rgba(0,0,0,0.2); }
.tive-dot-logo.is-active { animation: tive-pulse-active 1.5s infinite ease-in-out; background: #6366f1; box-shadow: 0 0 20px #6366f1; }
.tive-brand-text { font-size: 14px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.8; }

.nav-icons { display: flex; gap: 24px; opacity: 0.5; }
.nav-icons:hover { opacity: 1; }

.icon-btn { background: none; border: none; color: inherit; cursor: pointer; transition: transform 0.2s; }
.icon-btn:hover { transform: scale(1.1); }

.status-indicator {
    display: flex;
    align-items: center;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 9px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: inherit;
    cursor: pointer;
    transition: all 0.2s;
}
.light-mode .status-indicator {
    background: rgba(0,0,0,0.05);
    border-color: rgba(0,0,0,0.1);
}
.status-indicator:hover { background: rgba(255,255,255,0.1); }
.light-mode .status-indicator:hover { background: rgba(0,0,0,0.1); }

.tive-main { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; max-width: 800px; text-align: center; }
.hero-section { margin-bottom: 40px; }
.title { font-size: clamp(32px, 8vw, 72px); font-weight: 500; letter-spacing: -0.02em; margin-bottom: 16px; line-height: 1.1; }
.subtitle { font-size: 14px; font-weight: 300; opacity: 0.4; letter-spacing: 0.05em; }

.orb-wrapper { position: relative; cursor: pointer; transition: transform 0.3s ease; }
.duration-counter { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 48px; font-weight: 200; opacity: 0.6; pointer-events: none; }

.bridge-nav { margin-top: 60px; display: flex; gap: 32px; flex-wrap: wrap; justify-content: center; }
.bridge-link { display: flex; align-items: center; gap: 8px; background: none; border: none; color: inherit; opacity: 0.3; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.25em; cursor: pointer; transition: all 0.3s; }
.bridge-link:hover { opacity: 1; transform: translateY(-2px); }

.input-container { width: 100%; max-width: 500px; margin-bottom: 24px; z-index: 50; }
.input-bar { position: relative; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 2.5rem; display: flex; align-items: center; padding: 4px; }
.light-mode .input-bar { background: rgba(0,0,0,0.03); border-color: rgba(0,0,0,0.1); }
.input-bar input { flex: 1; background: transparent; border: none; outline: none; padding: 16px 24px; color: inherit; font-size: 14px; }
.send-btn { width: 44px; height: 44px; background: #6366f1; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; border: none; cursor: pointer; }
.send-btn:hover { transform: scale(1.05); }

.settings-card { position: absolute; top: 80px; right: 40px; width: 240px; background: rgba(0,0,0,0.9); backdrop-filter: blur(40px); border: 1px solid rgba(255,255,255,0.1); }
.light-mode .settings-card { background: rgba(255,255,255,0.95); border-color: rgba(0,0,0,0.1); }

.ambient-glow { position: fixed; inset: 0; background: radial-gradient(circle at center, rgba(128,128,128,0.02) 0%, transparent 80%); pointer-events: none; }

@keyframes tive-pulse { 
    0%, 100% { transform: scale(1); opacity: 0.8; } 
    50% { transform: scale(1.5); opacity: 1; } 
}
@keyframes tive-pulse-active {
    0%, 100% { transform: scale(1.2); opacity: 1; filter: brightness(1.2); }
    50% { transform: scale(2.2); opacity: 0.8; filter: brightness(1.5); }
}

.pop-enter-active { animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.pop-leave-active { animation: popIn 0.3s reverse ease-in; }
@keyframes popIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
</style>
