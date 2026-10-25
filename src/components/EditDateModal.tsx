import React, { useState } from 'react';
import { X, Calendar } from 'lucide-react';

interface EditDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStartDateIso: string;
  onSaveStartDate: (isoString: string) => void;
}

export const EditDateModal: React.FC<EditDateModalProps> = ({
  isOpen,
  onClose,
  currentStartDateIso,
  onSaveStartDate,
}) => {
  // Convert ISO string to format YYYY-MM-DDTHH:mm for datetime-local input
  const getInitialInputValue = (iso: string) => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '';
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      return local.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  const [dateTimeValue, setDateTimeValue] = useState(() =>
    getInitialInputValue(currentStartDateIso)
  );

  if (!isOpen) return null;

  const handleSave = () => {
    if (!dateTimeValue) return;
    const selectedDate = new Date(dateTimeValue);
    if (!isNaN(selectedDate.getTime())) {
      onSaveStartDate(selectedDate.toISOString());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm bg-[#181818] border border-[#2D2D2D] rounded-xl shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-labelledby="edit-date-title"
      >
        <div className="px-5 py-4 border-b border-[#242424] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#AAA]" />
            <h2 id="edit-date-title" className="text-sm font-semibold text-[#ECECEC]">
              Calibrate Start Date & Time
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

        <div className="p-5 space-y-4 text-xs text-[#CCC]">
          <p className="text-[11px] text-[#888] leading-relaxed">
            Specify the exact timestamp when your clean streak began to keep your live counter strictly accurate.
          </p>

          <div>
            <label htmlFor="start-datetime" className="block font-medium text-[#DDD] mb-1.5">
              Streak Start Timestamp
            </label>
            <input
              id="start-datetime"
              type="datetime-local"
              value={dateTimeValue}
              onChange={(e) => setDateTimeValue(e.target.value)}
              className="w-full bg-[#141414] border border-[#333] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#666]"
            />
          </div>
        </div>

        <div className="px-5 py-3.5 bg-[#141414] border-t border-[#242424] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#888] hover:text-white rounded hover:bg-[#222] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold bg-[#E5E5E5] hover:bg-white text-[#121212] rounded transition-colors shadow-sm"
          >
            Update Start Date
          </button>
        </div>
      </div>
    </div>
  );
};
