/**
 * Audio and Haptic feedback engine for meditation, breathing, and urge surfing.
 * Uses Web Audio API oscillator synthesis (zero external audio file dependencies).
 */

class SoundAndHapticsEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  constructor() {
    try {
      const saved = localStorage.getItem('reset_app_audio_muted');
      if (saved !== null) {
        this.isMuted = saved === 'true';
      }
    } catch {
      this.isMuted = false;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    try {
      localStorage.setItem('reset_app_audio_muted', String(muted));
    } catch {}
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Gentle singing bowl tone
   */
  public playTone(frequency: number, duration: number = 1.2, type: OscillatorType = 'sine') {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      // Smooth envelope attack and exponential decay
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio tone play failed', e);
    }
  }

  public triggerInhale() {
    this.playTone(261.63, 1.8); // C4 Inhale root
    this.vibrate([70]);
  }

  public triggerHold() {
    this.playTone(329.63, 1.4); // E4 Hold clarity
    this.vibrate([40, 40]);
  }

  public triggerExhale() {
    this.playTone(196.00, 2.2); // G3 Exhale grounding
    this.vibrate([90]);
  }

  public triggerCompletedChime() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const freqs = [392.00, 523.25, 659.25]; // G4, C5, E5 harmonic chord
      freqs.forEach((f, idx) => {
        setTimeout(() => {
          this.playTone(f, 2.5);
        }, idx * 120);
      });
      this.vibrate([100, 50, 150]);
    } catch {}
  }

  public vibrate(pattern: number | number[]) {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  }
}

export const soundEngine = new SoundAndHapticsEngine();
