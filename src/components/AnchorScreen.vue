<script setup>
import { ref } from 'vue';
import { Mail } from 'lucide-vue-next';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const props = defineProps({
  isLoading: Boolean
});

const emit = defineEmits(['anchor']);
const isProcessing = ref(false);
const loginError = ref('');

const handleGoogleLogin = async () => {
    if (isProcessing.value) return;
    
    isProcessing.value = true;
    loginError.value = '';
    
    try {
        console.log("[Tive◎AI] 🛡️ Initializing Amane Anchor Protocol...");
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        console.log("[Tive◎AI] ✅ Resonance Established:", user.displayName);
        emit('anchor', user.displayName, user.uid);
    } catch (error) {
        console.error("[Tive◎AI] ⚠️ Anchor Protocol Interrupted:", error);
        loginError.value = error.code === 'auth/popup-closed-by-user' 
            ? 'Login cancelled. Please try again.' 
            : 'Resonance failed. Check connection or popup blocker.';
        emit('anchor', null, null); 
    } finally {
        isProcessing.value = false;
    }
};
</script>

<template>
  <div class="login-root fixed inset-0 flex items-center justify-center bg-black overflow-hidden">
    <!-- Subtle Background Glow -->
    <div class="absolute inset-0 bg-radial-gradient from-indigo-500/5 to-transparent pointer-events-none"></div>

    <div class="login-container w-full max-w-sm flex flex-col items-center animate-fade-in z-10 px-8">
      
      <!-- Minimalist Google Button -->
      <button 
        @click="handleGoogleLogin"
        :disabled="isLoading || isProcessing"
        class="group relative w-full flex items-center justify-center gap-4 py-5 px-8 bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50"
      >
        <div class="w-5 h-5 flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
        </div>
        <span class="text-sm font-medium tracking-tight text-white/90">Continue with Google</span>
        
        <div v-if="isLoading || isProcessing" class="absolute inset-0 bg-black/80 flex items-center justify-center rounded-2xl">
            <div class="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
        </div>
      </button>

      <p v-if="loginError" class="mt-4 text-xs text-red-400/80 animate-pulse">{{ loginError }}</p>

    </div>
  </div>
</template>


<style scoped>
.bg-radial-gradient {
  background: radial-gradient(circle at center, var(--tw-gradient-from), var(--tw-gradient-to));
}

.animate-fade-in {
    animation: fadeIn 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>

<style scoped>
.animate-fade-in-up {
    animation: fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
