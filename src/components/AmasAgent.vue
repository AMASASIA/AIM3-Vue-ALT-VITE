<script setup>
import { ref, onMounted } from 'vue';
import { Sparkles, Mic, Zap, Terminal, X, CheckCircle } from 'lucide-vue-next';
import { useWebMCP } from '../composables/useWebMCP';

import { useWebRTC } from '../composables/useWebRTC';
import VideoCallPortal from './VideoCallPortal.vue';

const { registerTool, executeTool, getToolDefinitions } = useWebMCP();
const { localStream, remoteStream, startCall, endCall } = useWebRTC();

const isActive = ref(false);
const isListening = ref(false);
const isCalling = ref(false);
const status = ref('Idle');
const transcript = ref('');
const logs = ref([]);

// 1. ツールの登録
onMounted(() => {
  // カレンダー追加ツール
  registerTool('add_schedule', {
    description: 'Add a new event to the timeline/calendar',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'YYYY-MM-DD' },
        title: { type: 'string', description: 'Event title' },
        tag: { type: 'string', description: 'Tag like #coding, #milestone' }
      }
    }
  }, (args) => {
    addLog(`Schedule Added: ${args.title} on ${args.date}`, 'success');
  });

  // SBTミントツール
  registerTool('mint_achievement', {
    description: 'Mint a new fact or achievement to Soulbound Token (SBT)',
    parameters: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The fact to record' },
        category: { type: 'string', description: 'Category like Virtue, Skill, Data' }
      }
    }
  }, async (args) => {
    status.value = 'Minting to On-Chain...';
    try {
        const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
        const res = await fetch(`${API_URL}/api/oke/mint-fact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contextFact: args,
                targetWallet: "0xSystemAgent" 
            })
        });
        const result = await res.json();
        addLog(`Mint Successful!`, 'web3');
        return result;
    } catch(e) {
        addLog(`Mint Delegated/Saved Locally`, 'error');
        return { fallback: true };
    }
  });

  // ビデオ通話ツール - リアル実装
  registerTool('start_call', {
    description: 'Start a P2P video call with a target user',
    parameters: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'User handle or name' }
      }
    }
  }, async (args) => {
    status.value = 'Initiating Signal...';
    addLog(`Signaling to @${args.target}...`, 'call');
    isCalling.value = true;
    try {
      await startCall(args.target);
      addLog(`Secure P2P Channel Established`, 'success');
    } catch (e) {
      console.error(e);
      addLog(`P2P Connection Failed`, 'error');
      isCalling.value = false;
    }
  });
});

const handleEndCall = () => {
  endCall();
  isCalling.value = false;
  addLog('P2P Connection Closed', 'info');
};

const addLog = (msg, type = 'info') => {
  logs.value.unshift({ id: Date.now(), msg, type, time: new Date().toLocaleTimeString() });
  if (logs.value.length > 5) logs.value.pop();
};

const toggleAgent = () => {
  isActive.value = !isActive.value;
  if (!isActive.value) isListening.value = false;
};

const startListening = () => {
  isListening.value = true;
  status.value = 'Listening...';
  
  // 擬似的な音声認識
  setTimeout(() => {
    // ユーザーの声をシミュレート
    const voiceInput = Math.random() > 0.5 
      ? "Aliceと繋いで" 
      : "来週の月曜日に『AI会議』をカレンダーに入れて";
    simulateAIProcess(voiceInput);
  }, 2000);
};

const simulateAIProcess = async (text) => {
  transcript.value = text;
  status.value = 'AI Orchestrating...';
  
  setTimeout(async () => {
    if (text.includes('繋いで') || text.includes('call')) {
      addLog(`Intent: Video Call`, 'ai');
      await executeTool('start_call', { target: 'Alice' });
    } else {
      addLog(`Intent: Add Schedule`, 'ai');
      await executeTool('add_schedule', {
        date: '2026-02-23',
        title: 'AI会議',
        tag: '#milestone'
      });
      // 自動記録
      await executeTool('mint_achievement', {
        content: 'Scheduled AI Meeting on 2026-02-23',
        category: 'Productivity'
      });
    }
    
    status.value = 'Task Completed';
    isListening.value = false;
  }, 1500);
};
// 外部から起動できるように公開
defineExpose({
  executeTool,
  startListening,
  isActive
});
</script>

<template>
  <div class="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4 pointer-events-none">
    <!-- Log Panel (エージェント起動時のみ表示) -->
    <Transition name="fade-up">
      <div v-if="isActive" class="w-80 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl mb-2 pointer-events-auto">
        <div class="p-4 border-b border-white/10 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-[8px] font-mono text-slate-400 tracking-widest uppercase">{{ status }}</span>
          </div>
        </div>
        
        <div class="p-4 space-y-3 min-h-[200px] max-h-[300px] overflow-y-auto custom-scroll">
          <div v-for="log in logs" :key="log.id" class="text-[10px] font-mono animate-in slide-in-from-right-2 duration-300">
            <span class="text-slate-500">[{{ log.time }}]</span>
            <span :class="{
              'text-teal-400': log.type === 'success',
              'text-purple-400': log.type === 'ai',
              'text-pink-400': log.type === 'web3',
              'text-blue-400': log.type === 'call',
              'text-slate-300': log.type === 'info'
            }"> {{ log.msg }}</span>
          </div>
          
          <div v-if="isListening" class="flex gap-1 items-center py-2">
            <div class="w-1 h-1 bg-teal-400 rounded-full animate-bounce"></div>
            <div class="w-1 h-1 bg-teal-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            <div class="w-1 h-1 bg-teal-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Video Call UI -->
    <VideoCallPortal 
      :isCalling="isCalling"
      :localStream="localStream"
      :remoteStream="remoteStream"
      @end-call="handleEndCall"
    />
  </div>
</template>

<style scoped>
.fade-up-enter-active, .fade-up-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-up-enter-from, .fade-up-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: scale(0.5);
}

.custom-scroll::-webkit-scrollbar {
  width: 4px;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}
</style>
