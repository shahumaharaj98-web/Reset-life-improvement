import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Heart, Droplets, Footprints, Wind, Volume2, VolumeX } from 'lucide-react';
import { soundEngine } from '../utils/audioHaptics.ts';

interface EmergencyKitProps {
  isOpen: boolean;
  onClose: () => void;
}

type BreathingPhase = 'Inhale' | 'Hold' | 'Exhale' | 'Ready';

export const EmergencyKit: React.FC<EmergencyKitProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'breathe' | 'sensory' | 'halt'>('breathe');
  const [isMuted, setIsMuted] = useState(soundEngine.isMuted);

  // 4-7-8 Breathing exercise
  const [breathingActive, setBreathingActive] = useState(false);
  const [phase, setPhase] = useState<BreathingPhase>('Ready');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(4);
  const [cyclesCompleted, setCyclesCompleted] = useState<number>(0);

  // Sensory steps checklist
  const [sensoryChecked, setSensoryChecked] = useState<Record<number, boolean>>({});

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMuted(next);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (breathingActive) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            if (phase === 'Ready' || phase === 'Exhale') {
              setPhase('Inhale');
              soundEngine.triggerInhale();
              return 4;
            } else if (phase === 'Inhale') {
              setPhase('Hold');
              soundEngine.triggerHold();
              return 7;
            } else if (phase === 'Hold') {
              setPhase('Exhale');
              soundEngine.triggerExhale();
              setCyclesCompleted((c) => c + 1);
              return 8;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [breathingActive, phase]);

  if (!isOpen) return null;

  const handleStartBreathe = () => {
    setBreathingActive(true);
    setPhase('Inhale');
    soundEngine.triggerInhale();
    setSecondsRemaining(4);
  };

  const handleStopBreathe = () => {
    setBreathingActive(false);
    setPhase('Ready');
    setSecondsRemaining(4);
  };

  const toggleSensory = (idx: number) => {
    setSensoryChecked((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-[#181818] border border-[#2D2D2D] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-labelledby="emergency-kit-title"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#242424] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base select-none">🧘</span>
            <h2 id="emergency-kit-title" className="text-sm font-semibold text-[#ECECEC]">
              Immediate Grounding Reset
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleSound}
              title={isMuted ? 'Unmute meditation sounds' : 'Mute meditation sounds'}
              className="p-1 rounded text-[#777] hover:text-[#CCC] hover:bg-[#252525] transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-[#888]" /> : <Volume2 className="w-4 h-4 text-[#A3E635]" />}
            </button>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-1 rounded text-[#777] hover:text-[#CCC] hover:bg-[#252525] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-[#242424] text-xs">
          <button
            onClick={() => setActiveTab('breathe')}
            className={`pb-2.5 px-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'breathe'
                ? 'border-[#E5E5E5] text-[#ECECEC]'
                : 'border-transparent text-[#777] hover:text-[#CCC]'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>4-7-8 Breathing</span>
          </button>
          <button
            onClick={() => setActiveTab('sensory')}
            className={`pb-2.5 px-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'sensory'
                ? 'border-[#E5E5E5] text-[#ECECEC]'
                : 'border-transparent text-[#777] hover:text-[#CCC]'
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>5-4-3-2-1 Sensory</span>
          </button>
          <button
            onClick={() => setActiveTab('halt')}
            className={`pb-2.5 px-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'halt'
                ? 'border-[#E5E5E5] text-[#ECECEC]'
                : 'border-transparent text-[#777] hover:text-[#CCC]'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>H.A.L.T. Check</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto text-xs text-[#CCC]">
          {activeTab === 'breathe' && (
            <div className="text-center space-y-6">
              <div>
                <p className="text-xs text-[#8E8E8E] max-w-sm mx-auto leading-relaxed">
                  The 4-7-8 breathing cadence directly stimulates the vagus nerve and shuts down the sympathetic fight-or-flight impulse.
                </p>
              </div>

              {/* Animated Circle */}
              <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                <div
                  className={`absolute inset-0 rounded-full border border-[#3A3A3A] transition-all duration-1000 ${
                    phase === 'Inhale'
                      ? 'scale-110 bg-[#252525] border-[#666]'
                      : phase === 'Hold'
                      ? 'scale-110 bg-[#2C2C2C] border-[#888]'
                      : phase === 'Exhale'
                      ? 'scale-90 bg-[#1A1A1A] border-[#333]'
                      : 'scale-95 bg-[#1F1F1F]'
                  }`}
                />
                <div className="relative z-10 flex flex-col items-center">
                  <span className="text-base font-semibold text-white tracking-wide uppercase">
                    {phase}
                  </span>
                  {breathingActive && (
                    <span className="text-3xl font-mono font-bold text-[#E5E5E5] mt-1 tabular-nums">
                      {secondsRemaining}s
                    </span>
                  )}
                  {cyclesCompleted > 0 && (
                    <span className="text-[10px] text-[#777] font-mono mt-1">
                      {cyclesCompleted} {cyclesCompleted === 1 ? 'cycle' : 'cycles'} done
                    </span>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3">
                {!breathingActive ? (
                  <button
                    onClick={handleStartBreathe}
                    className="px-6 py-2.5 rounded-lg bg-[#E5E5E5] hover:bg-white text-[#121212] font-semibold text-xs transition-colors flex items-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Begin Breathing Session</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStopBreathe}
                    className="px-6 py-2.5 rounded-lg bg-[#2E2E2E] hover:bg-[#3E3E3E] text-white font-medium text-xs transition-colors flex items-center gap-2"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause / Stop</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'sensory' && (
            <div className="space-y-4">
              <p className="text-xs text-[#8E8E8E] leading-relaxed">
                Re-anchor your mind to physical reality. Complete each sensory check:
              </p>

              <div className="space-y-2">
                {[
                  { count: 5, label: 'Notice 5 things you can SEE around you', sub: 'Look for colors, edges, or shapes.' },
                  { count: 4, label: 'Notice 4 things you can physically TOUCH', sub: 'The chair beneath you, clothing fabric, temperature.' },
                  { count: 3, label: 'Notice 3 things you can HEAR', sub: 'Distant traffic, hum of a fan, your own breath.' },
                  { count: 2, label: 'Notice 2 things you can SMELL', sub: 'Fresh air, coffee, skin, room scent.' },
                  { count: 1, label: 'Notice 1 thing you can TASTE', sub: 'Sip water or notice the clean taste on your tongue.' },
                ].map((item, idx) => {
                  const isChecked = !!sensoryChecked[idx];
                  return (
                    <div
                      key={item.count}
                      onClick={() => toggleSensory(idx)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 select-none ${
                        isChecked
                          ? 'bg-[#1D1D1D] border-[#3E3E3E] text-[#888]'
                          : 'bg-[#181818] border-[#2A2A2A] text-[#DDD] hover:border-[#444]'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                        isChecked ? 'bg-[#333] text-[#777]' : 'bg-[#292929] text-[#EEE]'
                      }`}>
                        {item.count}
                      </span>
                      <div className="flex-1">
                        <div className={`font-medium ${isChecked ? 'line-through text-[#777]' : 'text-[#EEE]'}`}>
                          {item.label}
                        </div>
                        <div className="text-[11px] text-[#6E6E6E] mt-0.5">{item.sub}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'halt' && (
            <div className="space-y-4">
              <p className="text-xs text-[#8E8E8E] leading-relaxed">
                Most compulsive urges are false solutions to basic physiological needs. Check HALT:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#1D1D1D] border border-[#2B2B2B] rounded-lg p-3.5">
                  <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <span>🍎</span>
                    <span>H — Hungry?</span>
                  </div>
                  <p className="text-[11px] text-[#7E7E7E] mt-1 leading-relaxed">
                    Low blood sugar amplifies craving signals. Eat a nutritious snack or protein before deciding.
                  </p>
                </div>

                <div className="bg-[#1D1D1D] border border-[#2B2B2B] rounded-lg p-3.5">
                  <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <span>⚡</span>
                    <span>A — Angry / Anxious?</span>
                  </div>
                  <p className="text-[11px] text-[#7E7E7E] mt-1 leading-relaxed">
                    Urge is an escape hatch from emotional friction. Write down the frustration or step away.
                  </p>
                </div>

                <div className="bg-[#1D1D1D] border border-[#2B2B2B] rounded-lg p-3.5">
                  <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <span>👥</span>
                    <span>L — Lonely / Isolated?</span>
                  </div>
                  <p className="text-[11px] text-[#7E7E7E] mt-1 leading-relaxed">
                    Compulsions thrive in isolation. Send a brief text to a friend or go for a walk among people.
                  </p>
                </div>

                <div className="bg-[#1D1D1D] border border-[#2B2B2B] rounded-lg p-3.5">
                  <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <span>💤</span>
                    <span>T — Tired / Fatigued?</span>
                  </div>
                  <p className="text-[11px] text-[#7E7E7E] mt-1 leading-relaxed">
                    Prefrontal willpower fails when exhausted. Wash face with cold water or lie down to rest.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-[#141414] border-t border-[#242424] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-[#2E2E2E] hover:bg-[#3E3E3E] text-white rounded transition-colors"
          >
            I feel grounded · Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
