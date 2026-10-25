import React from 'react';
import { X, Award, CheckCircle2, Circle } from 'lucide-react';
import { MILESTONES } from '../utils/resetLogic.ts';

interface MilestonesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDays: number;
}

export const MilestonesModal: React.FC<MilestonesModalProps> = ({
  isOpen,
  onClose,
  currentDays,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-[#181818] border border-[#2D2D2D] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-labelledby="milestones-modal-title"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#242424] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base select-none">🏆</span>
            <h2 id="milestones-modal-title" className="text-sm font-semibold text-[#ECECEC]">
              Neurochemical Reset Milestones
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-3 text-xs text-[#CCC]">
          <p className="text-[11px] text-[#888] leading-relaxed mb-4">
            Resetting compulsive dopamine pathways follows established neuroadaptation stages. Track your biological recovery progression:
          </p>

          <div className="space-y-2.5">
            {MILESTONES.map((milestone) => {
              const isAchieved = currentDays >= milestone.days;
              const isNextTarget = !isAchieved && currentDays < milestone.days;

              return (
                <div
                  key={milestone.days}
                  className={`p-3 rounded-lg border transition-colors flex items-start gap-3 ${
                    isAchieved
                      ? 'bg-[#161B16] border-[#293B29] text-[#C4E0C4]'
                      : isNextTarget
                      ? 'bg-[#1E1E1E] border-[#444] text-[#FFF]'
                      : 'bg-[#161616] border-[#242424] text-[#666]'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isAchieved ? (
                      <CheckCircle2 className="w-4 h-4 text-[#4ADE80]" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#444]" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="font-semibold text-xs flex items-center gap-2">
                        <span className={isAchieved ? 'text-white' : isNextTarget ? 'text-[#EEE]' : 'text-[#777]'}>
                          {milestone.label}
                        </span>
                        <span className="font-mono text-[10px] text-[#888]">
                          ({milestone.days} {milestone.days === 1 ? 'day' : 'days'})
                        </span>
                      </div>
                      {isAchieved && (
                        <span className="text-[10px] text-[#4ADE80] font-mono">
                          Completed
                        </span>
                      )}
                      {isNextTarget && (
                        <span className="text-[10px] text-[#E0E0E0] font-mono bg-[#282828] px-1.5 py-0.5 rounded">
                          Next Goal ({milestone.days - currentDays}d left)
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] mt-1 leading-relaxed ${
                      isAchieved ? 'text-[#9BB89B]' : isNextTarget ? 'text-[#AAA]' : 'text-[#555]'
                    }`}>
                      {milestone.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-[#141414] border-t border-[#242424] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-[#2E2E2E] hover:bg-[#3E3E3E] text-white rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
