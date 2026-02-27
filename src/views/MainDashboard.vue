<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { Menu, X, LayoutDashboard, MessageSquare, Video, Terminal, Compass, Shield, Fingerprint, Users, Box, Activity, Book } from 'lucide-vue-next';
import AnchorScreen from '../components/AnchorScreen.vue';
import NotebookView from '../components/NotebookView.vue';
import PrimaryInterface from '../components/PrimaryInterface.vue';
import NotificationToast from '../components/NotificationToast.vue';
import { useNotifications } from '../composables/useNotifications';
import ResultScreen from '../components/ResultScreen.vue';
import { createKernelSession, sendMessage, analyzeIntent } from '../services/intentService.js';
import { useAmasSecretary } from '../composables/useAmasSecretary'; 
import { useAmasAudio } from '../composables/useAmasAudio';
import { useAmasAudioRecorder } from '../composables/useAmasAudioRecorder';
import { theme } from '../services/i18n';

// State
const user = ref(null);
const router = useRouter();
const { notify, notifications, removeNotification } = useNotifications();
const messages = ref([]);
const notebookEntries = ref([]);
const isLoading = ref(false);
const isInitializing = ref(false);
const activeView = ref('dashboard');
const isListening = ref(false);
const isProcessingVoice = ref(false);
const kernelSession = ref(null);
const { startRecording, stopRecording, lastAudioUrl, lastAudioId } = useAmasAudioRecorder();
const { handleVoiceNote: processSecretaryNote } = useAmasSecretary();
const { playSemanticTone } = useAmasAudio();

// Result State
const resultContent = ref('');
const isResultThinking = ref(true);

// Load data on mount
onMounted(() => {
  const savedUser = localStorage.getItem('amas_user_v4');
  const savedMessages = localStorage.getItem('amas_messages_v4');
  const savedNotebook = localStorage.getItem('amas_notebook_v2');

  if (savedUser) {
    user.value = JSON.parse(savedUser);
    const history = savedMessages ? JSON.parse(savedMessages).map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
    })) : [];
    kernelSession.value = createKernelSession(history);
  }

  if (savedMessages) messages.value = JSON.parse(savedMessages);
  if (savedNotebook) {
      notebookEntries.value = JSON.parse(savedNotebook).map(e => ({
          ...e,
          timestamp: new Date(e.timestamp)
      }));
  }
});

// Watch for changes to save
watch(messages, (newVal) => localStorage.setItem('amas_messages_v4', JSON.stringify(newVal)), { deep: true });
watch(notebookEntries, (newVal) => localStorage.setItem('amas_notebook_v2', JSON.stringify(newVal)), { deep: true });

// Login handler
const handleAnchor = async (id, session) => {
  isInitializing.value = true;
  try {
    const newUser = { id: `user-${Date.now()}`, name: id, session };
    user.value = newUser;
    localStorage.setItem('amas_user_v4', JSON.stringify(newUser));
    kernelSession.value = createKernelSession([]);
  } finally {
    isInitializing.value = false;
  }
};

// Messaging logic
const handleSendMessage = async (text) => {
  messages.value.push({
    id: Date.now().toString(),
    role: 'user',
    content: text,
    timestamp: new Date()
  });
  isLoading.value = true;
  if (activeView.value === 'result') isResultThinking.value = true;

  try {
    const aiResponse = await sendMessage(kernelSession.value, text);
    messages.value.push({
      id: (Date.now() + 1).toString(),
      role: 'model',
      content: aiResponse,
      timestamp: new Date()
    });
    
    // Update Result Screen if active
    if (activeView.value === 'result') {
      resultContent.value = aiResponse;
      isResultThinking.value = false;
    }
  } catch (error) {
    console.error('AI Error:', error);
  } finally {
    isLoading.value = false;
  }
};

// Voice logic
const { stopAll } = useAmasAudio();

const handleToggleVoice = async () => {
    if (isListening.value) {
        isProcessingVoice.value = true;
        stopAll(); // Immediate stop of any playing response
        notify('Processing', 'Analyzing voice...', 'info');
        
        const transcript = await stopRecording();
        isListening.value = false;
        isProcessingVoice.value = false;
        
        // "Fluffy" Transition Transition (1.5s delay as requested)
        setTimeout(async () => {
            activeView.value = 'result';
            isResultThinking.value = true;
            resultContent.value = '';

            if (transcript) {
                await handleVoiceTranscription(transcript);
            } else {
                activeView.value = 'dashboard';
            }
        }, 1500);
    } else {
        try {
            await startRecording();
            isListening.value = true;
            notify('Voice', 'Listening...', 'success');
        } catch (e) {
            notify('Error', 'Mic access failed', 'error');
        }
    }
};

const handleVoiceTranscription = async (transcript) => {
    const processingId = 'proc-' + Date.now();
    notebookEntries.value.unshift({ id: processingId, type: 'voice_memo', title: 'Thinking...', content: transcript, timestamp: new Date(), isProcessing: true });
    
    try {
        const intent = await analyzeIntent(transcript);
        const secretaryEntry = await processSecretaryNote(transcript);
        
        // Update Result Screen with AI Content
        resultContent.value = secretaryEntry.content;
        isResultThinking.value = false;

        notebookEntries.value.unshift(secretaryEntry);
        playSemanticTone('reflection');
        notify('Notebook', 'Insight captured.', 'success');
    } catch (e) {
        console.error('Transcription Error:', e);
        activeView.value = 'dashboard';
    } finally {
        notebookEntries.value = notebookEntries.value.filter(e => e.id !== processingId);
    }
};

const handleManualDiaryEntry = (content) => {
  notebookEntries.value.unshift({
    id: Date.now().toString(),
    type: 'diary',
    title: `Diary ${new Date().toLocaleTimeString()}`,
    content,
    timestamp: new Date()
  });
};
</script>

<template>
  <AnchorScreen v-if="!user" @anchor="handleAnchor" :isLoading="isInitializing" />
  
  <div :class="['min-h-screen w-full flex flex-col transition-colors duration-1000 overflow-hidden relative font-sans', theme === 'light' ? 'light-mode' : '']">
    <main class="flex-1 relative overflow-hidden flex flex-col min-h-0">
      
      <!-- Unified Interface (Page 1) -->
      <PrimaryInterface 
        v-if="activeView === 'dashboard'" 
        :isListening="isListening" 
        :isProcessing="isProcessingVoice"
        :lastAudioUrl="lastAudioUrl"
        @toggleVoice="handleToggleVoice"
        @viewMemos="activeView = 'notebook'"
        @textInput="handleSendMessage"
      />

      <!-- History (Page 3) -->
      <NotebookView 
        v-if="activeView === 'notebook'" 
        :user="user" 
        :entries="notebookEntries" 
        :isListening="isListening"
        @save-diary="handleManualDiaryEntry"
        @toggle-voice="handleToggleVoice"
        @nav="(view) => { if (view === 'dashboard') activeView = 'dashboard'; }"
      />

      <!-- Result Screen (Page 2) -->
      <ResultScreen 
        v-if="activeView === 'result'"
        :content="resultContent"
        :isThinking="isResultThinking"
        @close="activeView = 'dashboard'"
        @save="activeView = 'notebook'"
        @oke="activeView = 'dashboard'"
        @submit="(data) => { 
          isResultThinking = true; 
          resultContent = ''; 
          handleSendMessage(data.prompt); 
        }"
      />

    </main>

    <NotificationToast :notifications="notifications" @remove="removeNotification" />
  </div>
</template>

<style>
/* Global resets for Tive AI feel */
body {
    margin: 0;
    padding: 0;
    overflow: hidden;
    -webkit-tap-highlight-color: transparent;
}
</style>
