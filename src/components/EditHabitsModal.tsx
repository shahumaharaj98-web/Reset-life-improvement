import React, { useState } from 'react';
import { X, Plus, Trash2, Sparkles, AlertCircle } from 'lucide-react';
import { Habit } from '../types/index.ts';

interface EditHabitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  onSave: (updatedHabits: Habit[]) => void;
}

const PRESET_ICONS = [
  '💧', '🧘', '👟', '🌙', '📵', '📖', '🥦', '✍️', '☀️', '🍵', '🚿', '🧠', '🍎', '🏋️', '🚶', '🌱'
];

export const EditHabitsModal: React.FC<EditHabitsModalProps> = ({
  isOpen,
  onClose,
  habits,
  onSave,
}) => {
  const [editedHabits, setEditedHabits] = useState<Habit[]>(habits);

  if (!isOpen) return null;

  const handleChange = (
    index: number,
    field: 'title' | 'description' | 'icon',
    value: string
  ) => {
    setEditedHabits((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: value,
      };
      return copy;
    });
  };

  const handleAddHabit = () => {
    if (editedHabits.length >= 15) return;
    const newHabit: Habit = {
      id: `habit-${Date.now()}`,
      title: '',
      description: '',
      icon: PRESET_ICONS[editedHabits.length % PRESET_ICONS.length],
      completionDates: [],
    };
    setEditedHabits((prev) => [...prev, newHabit]);
  };

  const handleRemoveHabit = (index: number) => {
    if (editedHabits.length <= 1) return;
    setEditedHabits((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // Filter out completely empty title habits unless it's the only one
    const cleaned = editedHabits.map((h, i) => ({
      ...h,
      title: h.title.trim() || `Anchor Habit 0${i + 1}`,
      description: h.description?.trim() || undefined,
    }));
    onSave(cleaned);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-[#181818] border border-[#2D2D2D] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-labelledby="edit-habits-title"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#242424] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base select-none">✏️</span>
            <div>
              <h2 id="edit-habits-title" className="text-sm font-semibold text-[#ECECEC]">
                Customize Daily Anchor Habits
              </h2>
              <p className="text-[11px] text-[#777]">
                Manage 1 to 15 non-negotiable daily anchors ({editedHabits.length}/15 active)
              </p>
            </div>
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
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-[#CCC]">
          <div className="space-y-3">
            {editedHabits.map((habit, idx) => (
              <div
                key={habit.id || idx}
                className="bg-[#1C1C1C] border border-[#282828] rounded-lg p-3.5 space-y-2.5 relative group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[#777] uppercase tracking-wider">
                      Habit {String(idx + 1).padStart(2, '0')}
                    </span>
                    {/* Emoji selector */}
                    <select
                      value={habit.icon}
                      onChange={(e) => handleChange(idx, 'icon', e.target.value)}
                      className="bg-[#141414] border border-[#333] rounded px-1.5 py-0.5 text-xs text-[#EEE] focus:outline-none"
                    >
                      {PRESET_ICONS.map((emoji) => (
                        <option key={emoji} value={emoji}>
                          {emoji}
                        </option>
                      ))}
                    </select>
                  </div>

                  {editedHabits.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveHabit(idx)}
                      title="Remove habit"
                      className="text-[#666] hover:text-[#E07A5F] p-1 rounded hover:bg-[#262626] transition-colors flex items-center gap-1 text-[11px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label htmlFor={`habit-title-${idx}`} className="block font-medium text-[#DDD] mb-1 text-[11px]">
                      Habit Name
                    </label>
                    <input
                      id={`habit-title-${idx}`}
                      type="text"
                      value={habit.title}
                      onChange={(e) => handleChange(idx, 'title', e.target.value)}
                      placeholder="e.g. 10m Morning Breathwork"
                      className="w-full bg-[#141414] border border-[#303030] rounded px-2.5 py-1.5 text-xs text-white placeholder-[#555] focus:outline-none focus:border-[#666]"
                    />
                  </div>

                  <div>
                    <label htmlFor={`habit-desc-${idx}`} className="block font-medium text-[#999] mb-1 text-[11px]">
                      Purpose / Intention
                    </label>
                    <input
                      id={`habit-desc-${idx}`}
                      type="text"
                      value={habit.description || ''}
                      onChange={(e) => handleChange(idx, 'description', e.target.value)}
                      placeholder="e.g. Ground nervous system early."
                      className="w-full bg-[#141414] border border-[#303030] rounded px-2.5 py-1.5 text-xs text-[#BBB] placeholder-[#555] focus:outline-none focus:border-[#666]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Habit Button */}
          {editedHabits.length < 15 ? (
            <button
              type="button"
              onClick={handleAddHabit}
              className="w-full py-2.5 border border-dashed border-[#333] hover:border-[#555] rounded-lg text-xs font-medium text-[#888] hover:text-[#DDD] hover:bg-[#1A1A1A] transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Anchor Habit ({editedHabits.length}/15)</span>
            </button>
          ) : (
            <div className="text-center text-[11px] text-[#777] italic py-1">
              Maximum of 15 habits reached to prevent cognitive overwhelm.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-[#141414] border-t border-[#242424] flex items-center justify-between">
          <div className="text-[11px] text-[#666]">
            {editedHabits.length} habits configured
          </div>
          <div className="flex items-center gap-2">
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
              className="px-5 py-2 text-xs font-semibold bg-[#E5E5E5] hover:bg-white text-[#121212] rounded transition-colors shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
