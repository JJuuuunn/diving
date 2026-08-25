import { ref } from 'vue';

export function useAudioBeep() {
  const audioCtxRef = ref<AudioContext | null>(null);

  const initAudio = () => {
    if (typeof window === 'undefined') return;
    if (!audioCtxRef.value) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.value = new AudioCtx();
      }
    }
    if (audioCtxRef.value && audioCtxRef.value.state === 'suspended') {
      audioCtxRef.value.resume();
    }
  };

  const playTone = (freq: number, durationMs: number, type: OscillatorType = 'sine', gainVal = 0.15) => {
    try {
      initAudio();
      if (!audioCtxRef.value) return;

      const ctx = audioCtxRef.value;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {
      // Audio playback fails gracefully if muted or blocked
    }
  };

  const vibrate = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore vibration errors
      }
    }
  };

  // Countdown short beep (3, 2, 1)
  const playCountdownBeep = () => {
    playTone(520, 90, 'sine', 0.2);
    vibrate(50);
  };

  // Phase transition long high beep (GO / HOLD / REST)
  const playPhaseStartBeep = () => {
    playTone(880, 280, 'sine', 0.25);
    vibrate([100, 50, 100]);
  };

  // Contraction recorded click/beep
  const playContractionBeep = () => {
    playTone(660, 120, 'triangle', 0.18);
    vibrate(80);
  };

  // Training complete celebration chime
  const playFinishedChime = () => {
    setTimeout(() => playTone(523.25, 200, 'sine', 0.2), 0);
    setTimeout(() => playTone(659.25, 200, 'sine', 0.2), 150);
    setTimeout(() => playTone(783.99, 400, 'sine', 0.25), 300);
    vibrate([150, 100, 250]);
  };

  // Interval notice chime for free static time milestones
  const playIntervalNoticeBeep = () => {
    setTimeout(() => playTone(783.99, 120, 'sine', 0.22), 0);
    setTimeout(() => playTone(1046.5, 200, 'sine', 0.25), 100);
    vibrate([80, 40, 80]);
  };

  return {
    initAudio,
    playTone,
    playCountdownBeep,
    playPhaseStartBeep,
    playContractionBeep,
    playFinishedChime,
    playIntervalNoticeBeep
  };
}
