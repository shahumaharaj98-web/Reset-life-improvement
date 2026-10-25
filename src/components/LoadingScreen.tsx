import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  onComplete: () => void;
  minDurationMs?: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  onComplete,
  minDurationMs = 900,
}) => {
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Restoring focus state...');

  useEffect(() => {
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const p = Math.min(100, Math.floor((elapsed / minDurationMs) * 100));
      setProgress(p);

      if (p > 35 && p <= 75) {
        setStatusMessage('Syncing habits & streak telemetry...');
      } else if (p > 75) {
        setStatusMessage('Grounding your space...');
      }

      if (elapsed >= minDurationMs) {
        clearInterval(interval);
        setTimeout(() => {
          onComplete();
        }, 150);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [minDurationMs, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0D0D0D] text-[#ECECEC] p-6 select-none"
    >
      {/* Subtle Background Glow */}
      <div className="absolute w-72 h-72 rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-xs w-full text-center space-y-6">
        {/* Animated Brand Emblem */}
        <div className="relative flex items-center justify-center">
          {/* Subtle Outer Pulsing Halo */}
          <motion.div
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.2, 0.45, 0.2],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#333] to-[#222] border border-[#444]/40"
          />

          {/* Central Shield Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="w-16 h-16 rounded-2xl bg-[#181818] border border-[#2F2F2F] flex items-center justify-center shadow-2xl relative z-10"
          >
            <Shield className="w-7 h-7 text-[#E5E5E5] stroke-[2]" />
          </motion.div>
        </div>

        {/* Minimalist Typographic Title */}
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-[0.3em] font-mono text-white uppercase pl-1">
            RESET
          </h1>
          <p className="text-xs text-[#707070] font-sans">
            Clarity over compulsion · One day at a time
          </p>
        </div>

        {/* Minimalist Micro Progress Bar */}
        <div className="w-48 space-y-2">
          <div className="w-full h-1 bg-[#1F1F1F] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#E5E5E5] to-[#A3E635] rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut' }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-[#555]">
            <span className="truncate">{statusMessage}</span>
            <span className="tabular-nums">{progress}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
