import React from 'react';
import { motion } from 'motion/react';
import { Waves } from 'lucide-react';
import { haptics } from '../utils/haptics.ts';

interface UrgeButtonProps {
  onClick: () => void;
  onOpenGrounding: () => void;
  recentUrgesToday: number;
}

export const UrgeButton: React.FC<UrgeButtonProps> = ({
  onClick,
  onOpenGrounding,
  recentUrgesToday,
}) => {
  return (
    <div className="pt-2">
      {/* Prominent Notion Action Bar */}
      <div className="bg-[#181818] border border-[#2B2B2B] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#222] border border-[#333] flex items-center justify-center text-lg select-none shrink-0">
            🌊
          </div>
          <div>
            <div className="text-sm font-semibold text-[#ECECEC] flex items-center gap-2">
              <span>Experiencing an Impulse or Urge?</span>
              {recentUrgesToday > 0 && (
                <span className="text-[11px] font-mono text-[#888]">
                  ({recentUrgesToday} logged today)
                </span>
              )}
            </div>
            <p className="text-xs text-[#808080] mt-0.5">
              Urges peak in 3–5 minutes and naturally subside. Intercept before reacting.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Grounding Button */}
          <button
            type="button"
            onClick={() => {
              haptics.light();
              onOpenGrounding();
            }}
            className="px-3.5 h-12 rounded-lg bg-[#202020] hover:bg-[#282828] border border-[#333] hover:border-[#444] text-xs font-medium text-[#C8C8C8] hover:text-white transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer active:scale-95"
          >
            <span>🧘</span>
            <span>Breathe</span>
          </button>

          {/* Primary "Log an Urge" Button with Subtle Pulsing Animation */}
          <motion.button
            type="button"
            onClick={() => {
              haptics.medium();
              onClick();
            }}
            data-testid="log-an-urge-button"
            animate={{
              scale: [1, 1.025, 1],
              boxShadow: [
                '0 0 0 0 rgba(230, 230, 230, 0.3)',
                '0 0 0 10px rgba(230, 230, 230, 0)',
                '0 0 0 0 rgba(230, 230, 230, 0)',
              ],
            }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            whileTap={{ scale: 0.97 }}
            className="flex-1 sm:flex-none px-6 h-12 rounded-lg bg-[#E6E6E6] hover:bg-white text-[#121212] font-semibold text-sm tracking-tight transition-colors shadow-md flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Waves className="w-4 h-4 text-[#121212]" />
            <span>Log an Urge</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};
