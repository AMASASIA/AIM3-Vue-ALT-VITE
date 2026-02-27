import { ref } from 'vue';

let audioCtx: AudioContext | null = null;
const activeSources = new Set<AudioBufferSourceNode | OscillatorNode>();

const getAudioCtx = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtx;
};

export const useAmasAudio = () => {
    const stopAll = () => {
        activeSources.forEach(source => {
            try { source.stop(); } catch (e) {}
        });
        activeSources.clear();
        if (audioCtx && audioCtx.state !== 'closed') {
            // We don't close the context, just suspend if needed, but usually we just stop sources
        }
    };

    const registerSource = (source: AudioBufferSourceNode | OscillatorNode) => {
        activeSources.add(source);
        source.onended = () => activeSources.delete(source);
    };

    const playSanctuaryBell = () => {
        const ctx = getAudioCtx();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.frequency.setValueAtTime(2637.02, ctx.currentTime);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.8);

        oscillator.connect(gainNode).connect(ctx.destination);
        if (ctx.state === 'suspended') ctx.resume();
        
        registerSource(oscillator);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 3.0);
    };

    const playSemanticTone = (type: 'task' | 'reflection' | 'success' | 'error') => {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        switch (type) {
            case 'task':
                osc.frequency.setValueAtTime(1760, ctx.currentTime);
                osc.type = 'sine';
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
                break;
            case 'reflection':
                osc.frequency.setValueAtTime(329.63, ctx.currentTime);
                osc.type = 'sine';
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
                break;
            case 'success':
                osc.frequency.setValueAtTime(440, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.5);
                osc.type = 'sine';
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
                break;
            case 'error':
                osc.frequency.setValueAtTime(150, ctx.currentTime);
                osc.type = 'triangle';
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
                gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                break;
        }

        osc.connect(gain).connect(ctx.destination);
        if (ctx.state === 'suspended') ctx.resume();
        
        registerSource(osc);
        osc.start();
        osc.stop(ctx.currentTime + 2.0);
    };

    return { playSanctuaryBell, playSemanticTone, stopAll };
};
