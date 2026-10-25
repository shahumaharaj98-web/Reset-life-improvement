import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, CheckCircle2, Shield, HeartHandshake } from 'lucide-react';
import { UrgeTrigger } from '../types/index.ts';
import { soundEngine } from '../utils/audioHaptics.ts';

interface UrgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveUrge: (data: {
    intensity: number;
    trigger: UrgeTrigger;
    notes?: string;
    surfedSeconds?: number;
    surfedCompleted?: boolean;
  }) => void;
}

const TRIGGERS: UrgeTrigger[] = [
  'Stress',
  'Boredom',
  'Fatigue',
  'Loneliness',
  'Late Night',
  'Social Media',
  'Emotional Trigger',
  'Habit Loop',
  'Other',
];

export const UrgeModal: React.FC<UrgeModalProps> = ({
  isOpen,
  onClose,
  onSaveUrge,
}) => {
  const [intensity, setIntensity] = useState<number>(6);
  const [trigger, setTrigger] = useState<UrgeTrigger>('Stress');
  const [notes, setNotes] = useState<string>('');
  const [surfedCompleted, setSurfedCompleted] = useState<boolean>(false);

  // 5-minute Urge Surfing timer (300 seconds)
  const [timerSeconds, setTimerSeconds] = useState<number>(300);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            setSurfedCompleted(true);
            soundEngine.triggerCompletedChime();
            return 0;
          }
          return prev - 1;
        });
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, timerSeconds]);

  if (!isOpen) return null;

  const handleResetTimer = () => {
    setTimerRunning(false);
    setTimerSeconds(300);
    setElapsedSeconds(0);
  };

  const handleSave = () => {
    onSaveUrge({
      intensity,
      trigger,
      notes: notes.trim() || undefined,
      surfedSeconds: elapsedSeconds > 0 ? elapsedSeconds : undefined,
      surfedCompleted,
    });
    onClose();
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${String(s).padStart(2, '0')}`;
  };

  const getIntensityLabel = (val: number) => {
    if (val <= 3) return 'Mild passing thought';
    if (val <= 6) return 'Moderate craving (distracting)';
    if (val <= 8) return 'Intense visceral urge';
    return 'Critical peak storm';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-[#181818] border border-[#2D2D2D] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-labelledby="urge-modal-title"
      >
        {/* Modal Top Bar */}
        <div className="px-5 py-4 border-b border-[#242424] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base select-none">🌊</span>
            <h2 id="urge-modal-title" className="text-sm font-semibold text-[#ECECEC]">
              Log & Intercept Urge
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded text-[#777] hover:text-[#CCC] hover:bg-[#252525] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-[#CCC]">
          {/* Urge Surfing Timer Card */}
          <div className="bg-[#1C1C1C] border border-[#292929] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-[#E0E0E0] text-xs flex items-center gap-1.5">
                <span>⏱️</span>
                <span>Surf the Urge (5-Min Delay)</span>
              </span>
              <span className="text-[11px] text-[#888] font-mono">
                {surfedCompleted ? 'Threshold Reached' : 'Neuro-delay'}
              </span>
            </div>
            <p className="text-[11px] text-[#7E7E7E] mb-3 leading-relaxed">
              Dopamine spikes peak and crash within 5 minutes. Breathe and observe the sensation without acting.
            </p>

            <div className="flex items-center justify-between gap-4 bg-[#141414] border border-[#242424] px-4 py-2.5 rounded-md">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-bold text-white tabular-nums">
                  {formatTimer(timerSeconds)}
                </span>
                <span className="text-[10px] text-[#666] uppercase tracking-wider">
                  remaining
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTimerRunning(!timerRunning)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    timerRunning
                      ? 'bg-[#2E2E2E] text-white hover:bg-[#3E3E3E]'
                      : 'bg-[#E5E5E5] text-[#121212] hover:bg-white'
                  }`}
                >
                  {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{timerRunning ? 'Pause' : 'Start Surfing'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetTimer}
                  title="Reset 5m timer"
                  className="p-1.5 rounded text-[#777] hover:text-[#CCC] hover:bg-[#252525]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Urge Intensity Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="intensity-slider" className="font-medium text-[#DDD]">
                Urge Intensity
              </label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-white tabular-nums bg-[#222] px-2 py-0.5 rounded border border-[#333]">
                  {intensity}/10
                </span>
                <span className="text-[11px] text-[#888]">
                  {getIntensityLabel(intensity)}
                </span>
              </div>
            </div>
            <input
              id="intensity-slider"
              type="range"
              min="1"
              max="10"
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-full h-1.5 bg-[#2A2A2A] rounded-lg appearance-none cursor-pointer accent-[#E5E5E5]"
            />
            <div className="flex justify-between text-[10px] text-[#666] font-mono mt-1">
              <span>1 (Mild)</span>
              <span>5 (Moderate)</span>
              <span>10 (Severe)</span>
            </div>
          </div>

          {/* Primary Trigger Selection */}
          <div>
            <label className="block font-medium text-[#DDD] mb-2">
              Primary Trigger
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {TRIGGERS.map((t) => {
                const isSelected = trigger === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTrigger(t)}
                    className={`px-2.5 py-2 rounded text-left text-xs transition-colors border ${
                      isSelected
                        ? 'bg-[#292929] border-[#4A4A4A] text-white font-medium shadow-sm'
                        : 'bg-[#181818] border-[#262626] text-[#888] hover:text-[#CCC] hover:bg-[#202020]'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reflection Note */}
          <div>
            <label htmlFor="urge-notes" className="block font-medium text-[#DDD] mb-1.5">
              Mindful Reflection (What is this craving pointing to?)
            </label>
            <textarea
              id="urge-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Felt overwhelmed by deadline; my brain wants an escape rather than doing the hard task."
              className="w-full bg-[#141414] border border-[#2B2B2B] rounded-lg p-2.5 text-xs text-[#E5E5E5] placeholder-[#555] focus:outline-none focus:border-[#555] resize-none"
            />
          </div>

          {/* Overcame Checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer bg-[#1A1A1A] border border-[#282828] p-3 rounded-lg select-none hover:bg-[#202020] transition-colors">
            <input
              type="checkbox"
              checked={surfedCompleted}
              onChange={(e) => setSurfedCompleted(e.target.checked)}
              className="rounded bg-[#222] border-[#444] text-[#E5E5E5] focus:ring-0 w-4 h-4 cursor-pointer accent-[#E5E5E5]"
            />
            <div>
              <div className="font-medium text-[#ECECEC] text-xs">
                I surfed / overcame this urge
              </div>
              <div className="text-[11px] text-[#777]">
                Mark this urge as successfully handled without compromising the streak
              </div>
            </div>
          </label>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-[#141414] border-t border-[#242424] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#888] hover:text-white rounded hover:bg-[#222] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            data-testid="save-urge-log-btn"
            className="px-5 py-2 text-xs font-semibold bg-[#E5E5E5] hover:bg-white text-[#121212] rounded transition-colors shadow-sm"
          >
            Save Urge Log
          </button>
        </div>
      </div>
    </div>
  );
};
