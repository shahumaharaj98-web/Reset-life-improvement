/**
 * Tactile Haptic Feedback Utility
 * Combines navigator.vibrate with Web Audio API synthetic micro-clicks
 * so tactile feedback works reliably across Android, iOS Safari, and desktop.
 */

class HapticsController {
  private audioCtx: AudioContext | null = null;
  private audioInitialized = false;

  private initAudio() {
    if (this.audioInitialized) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
        this.audioInitialized = true;
      }
    } catch {
      // AudioContext not permitted or not supported
    }
  }

  /**
   * Generates a subtle, high-fidelity synthetic micro-click
   * @param frequency Hz of the tone
   * @param duration seconds
   * @param volume peak volume (0.0 - 1.0)
   */
  private playClick(frequency = 220, duration = 0.03, volume = 0.08, type: OscillatorType = 'sine') {
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, frequency * 0.5), now + duration);

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Silently ignore audio playback errors
    }
  }

  /**
   * Light tactile tap (e.g., button press, dragging item over slot)
   */
  light() {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {}
    }
    this.playClick(320, 0.02, 0.05);
  }

  /**
   * Medium tactile click (e.g., checkbox toggle, grab to drag)
   */
  medium() {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(25);
      } catch {}
    }
    this.playClick(240, 0.035, 0.08);
  }

  /**
   * Success gesture (e.g., habit completed by swipe right, task dropped to migrate)
   */
  success() {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([20, 40, 30]);
      } catch {}
    }
    // Pleasant subtle two-tone chord
    this.playClick(350, 0.04, 0.08, 'triangle');
    setTimeout(() => {
      this.playClick(520, 0.05, 0.09, 'sine');
    }, 45);
  }

  /**
   * Warning / Skip gesture (e.g., habit swipe left to skip)
   */
  warning() {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([35, 30, 20]);
      } catch {}
    }
    this.playClick(180, 0.045, 0.07, 'sawtooth');
  }

  /**
   * Drag initiation (holding task to reorder)
   */
  dragStart() {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(30);
      } catch {}
    }
    this.playClick(280, 0.03, 0.06);
  }

  /**
   * Drop release
   */
  drop() {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(20);
      } catch {}
    }
    this.playClick(220, 0.03, 0.07);
  }
}

export const haptics = new HapticsController();
