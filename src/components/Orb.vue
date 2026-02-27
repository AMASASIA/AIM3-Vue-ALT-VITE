<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  isListening: Boolean,
  isProcessing: Boolean,
  intensity: { type: Number, default: 0 }
});

const canvasRef = ref(null);
const bars = ref(Array.from({ length: 12 }, () => ({ h: 5, targetH: 5 })));
let animationFrame;

const animate = () => {
    if (props.isListening) {
        bars.value.forEach(bar => {
            bar.targetH = 15 + Math.random() * 50;
            bar.h += (bar.targetH - bar.h) * 0.2;
        });
    } else {
        bars.value.forEach(bar => {
            bar.h += (5 - bar.h) * 0.1;
        });
    }
    animationFrame = requestAnimationFrame(animate);
};

onMounted(() => animate());
onUnmounted(() => cancelAnimationFrame(animationFrame));
</script>

<template>
  <div class="orb-container" :class="{ 'is-listening': isListening, 'is-processing': isProcessing }">
    <div class="outer-ring"></div>
    
    <div class="orb-core">
      <!-- Mist Layers -->
      <div class="mist layer-1"></div>
      <div class="mist layer-2"></div>
      
      <!-- Dynamic Oscillating Bars (The "Movement") -->
      <div v-if="isListening" class="visualizer-bars relative">
          <div 
            v-for="(bar, i) in bars" 
            :key="i" 
            class="v-bar" 
            :style="{ height: bar.h + 'px' }"
          ></div>
          <!-- Stop Indicator (Square) -->
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div class="stop-indicator w-6 h-6 backdrop-blur-md rounded-lg flex items-center justify-center">
                  <div class="stop-square w-2 h-2 rounded-sm"></div>
              </div>
          </div>
      </div>

      <!-- Tive Center Dot -->
      <div v-else class="tive-dot"></div>

      <div class="core-light"></div>
    </div>

    <!-- UI Feedback Wave -->
    <div v-if="isListening" class="listening-wave">
      <div v-for="i in 3" :key="i" class="wave"></div>
    </div>
  </div>
</template>

<style scoped>
.orb-container {
  position: relative;
  width: 320px;
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.outer-ring {
  position: absolute;
  width: 380px;
  height: 380px;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 60px rgba(255, 255, 255, 0.2);
  opacity: 0.6;
  animation: ring-pulse 6s infinite ease-in-out;
}

.light-mode .outer-ring {
    border-color: rgba(0, 0, 0, 0.8);
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.2);
    opacity: 0.9;
}

.orb-core {
  position: relative;
  width: 260px;
  height: 260px;
  background: radial-gradient(circle at 50% 50%, #1a1a1a 0%, #000 100%);
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.5s ease;
}

.light-mode .orb-core {
    background: #ffffff;
    border-color: rgba(0, 0, 0, 0.1);
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.05);
}

.visualizer-bars {
    display: flex;
    align-items: center;
    gap: 6px;
    z-index: 20;
}

.v-bar {
    width: 6px;
    background: white;
    border-radius: 3px;
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
    transition: height 0.1s ease;
}

.light-mode .v-bar {
    background: #111;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
}

.stop-indicator {
    background: rgba(255,255,255,0.2);
    border: 1px solid rgba(255,255,255,0.2);
}
.light-mode .stop-indicator {
    background: rgba(0,0,0,0.1);
    border-color: rgba(0,0,0,0.1);
}
.stop-square { background: white; }
.light-mode .stop-square { background: black; }

.tive-dot {
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  z-index: 10;
  box-shadow: 0 0 15px white;
  animation: dot-breathe 4s infinite ease-in-out;
}

.light-mode .tive-dot {
    background: black;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
}

.mist {
  position: absolute;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  filter: blur(40px);
}

.light-mode .mist {
    background: radial-gradient(circle at center, rgba(0, 0, 0, 0.1) 0%, transparent 70%);
    opacity: 0.4;
}

.layer-1 { animation: mist-float 15s infinite linear; }
.layer-2 { animation: mist-float 20s infinite linear reverse; }

@keyframes dot-breathe {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.4); opacity: 1; }
}

@keyframes mist-float {
  0% { transform: translate(-25%, -25%) rotate(0deg); }
  100% { transform: translate(-25%, -25%) rotate(360deg); }
}

@keyframes ring-pulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.03); opacity: 0.8; }
}

.listening-wave {
  position: absolute;
  width: 400px;
  height: 400px;
}

.wave {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  animation: wave-spread 3s infinite linear;
}

.light-mode .wave { border-color: rgba(0, 0, 0, 0.4); border-width: 2px; }

@keyframes wave-spread {
  0% { transform: scale(0.8); opacity: 0.8; }
  100% { transform: scale(1.5); opacity: 0; }
}
</style>
