import React, { useState } from 'react';
import { X, RefreshCw, AlertCircle, Heart } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStreakDays: number;
  onConfirmReset: (reason?: string) => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  currentStreakDays,
  onConfirmReset,
}) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirmReset(reason.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#181818] border border-[#333] rounded-xl shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-labelledby="reset-modal-title"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#252525] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base select-none">🌱</span>
            <h2 id="reset-modal-title" className="text-sm font-semibold text-[#ECECEC]">
              Reset Days Clean Counter
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
        <div className="p-5 space-y-4 text-xs text-[#CCC]">
          <div className="bg-[#201A1A] border border-[#3D2727] rounded-lg p-3.5 flex items-start gap-3">
            <Heart className="w-4 h-4 text-[#E07A5F] shrink-0 mt-0.5" />
            <div className="text-[11px] text-[#D8B4B4] leading-relaxed">
              <span className="font-semibold text-white block mb-0.5">
                Relapse is data, not defeat.
              </span>
              Your {currentStreakDays} days of neurochemical rewiring and discipline are not erased. Reset the clock without shame and begin your next streak right now.
            </div>
          </div>

          <div>
            <label htmlFor="reset-reason" className="block font-medium text-[#DDD] mb-1.5">
              What triggered this slip? (Optional learning reflection)
            </label>
            <textarea
              id="reset-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Was staying up late scrolling on my phone; let my guard down after a tiring workday."
              className="w-full bg-[#141414] border border-[#303030] rounded-lg p-2.5 text-xs text-white placeholder-[#555] focus:outline-none focus:border-[#666] resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-[#141414] border-t border-[#242424] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#888] hover:text-white rounded hover:bg-[#222] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 text-xs font-semibold bg-[#E07A5F] hover:bg-[#D0694E] text-white rounded transition-colors shadow-sm flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Clock & Restart</span>
          </button>
        </div>
      </div>
    </div>
  );
};
