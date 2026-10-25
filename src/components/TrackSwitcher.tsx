import React, { useState } from 'react';
import { ChevronDown, Plus, Trash2, Check, Shield } from 'lucide-react';
import { ResetTrack } from '../types/index.ts';

interface TrackSwitcherProps {
  tracks: ResetTrack[];
  activeTrackId: string;
  onSwitchTrack: (trackId: string) => void;
  onAddTrack: (name: string, icon: string, motto: string) => void;
  onDeleteTrack: (trackId: string) => void;
}

const PRESET_ICONS = ['🛡️', '📵', '🌱', '☕', '🧘', '🚭', '👟', '🥦', '⚡', '💧'];

export const TrackSwitcher: React.FC<TrackSwitcherProps> = ({
  tracks,
  activeTrackId,
  onSwitchTrack,
  onAddTrack,
  onDeleteTrack,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('🌱');
  const [newMotto, setNewMotto] = useState('');

  const activeTrack = tracks.find((t) => t.id === activeTrackId) || tracks[0];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddTrack(newName.trim(), newIcon, newMotto.trim() || 'One day at a time.');
    setNewName('');
    setNewMotto('');
    setIsAdding(false);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#181818] hover:bg-[#222] border border-[#2B2B2B] text-xs font-medium text-[#ECECEC] transition-colors"
      >
        <span className="text-sm select-none">{activeTrack.icon}</span>
        <span className="truncate max-w-[130px] sm:max-w-[200px]">{activeTrack.name}</span>
        <ChevronDown className="w-3.5 h-3.5 text-[#777]" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => {
              setIsOpen(false);
              setIsAdding(false);
            }}
          />
          <div className="absolute left-0 top-full mt-1.5 w-72 bg-[#1C1C1C] border border-[#333] rounded-xl shadow-2xl z-40 p-2 text-xs">
            <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[#777]">
              Reset Tracks
            </div>

            <div className="space-y-1 mt-1">
              {tracks.map((track) => {
                const isActive = track.id === activeTrackId;
                return (
                  <div
                    key={track.id}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors ${
                      isActive ? 'bg-[#262626] text-white font-medium' : 'text-[#BBB] hover:bg-[#222] hover:text-white'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSwitchTrack(track.id);
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-2 flex-1 text-left min-w-0"
                    >
                      <span className="text-sm select-none">{track.icon}</span>
                      <span className="truncate">{track.name}</span>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      {isActive && <Check className="w-3.5 h-3.5 text-[#E07A5F]" />}
                      {tracks.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTrack(track.id);
                          }}
                          title="Delete track"
                          className="p-1 text-[#666] hover:text-[#E07A5F] hover:bg-[#333] rounded transition-colors ml-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Track Flow */}
            {!isAdding ? (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="w-full mt-2 pt-2 border-t border-[#292929] px-2 py-1.5 text-left text-xs text-[#888] hover:text-[#CCC] flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Track</span>
              </button>
            ) : (
              <form onSubmit={handleCreate} className="mt-2 pt-2 border-t border-[#292929] space-y-2 p-1">
                <div className="flex items-center gap-1.5">
                  <select
                    value={newIcon}
                    onChange={(e) => setNewIcon(e.target.value)}
                    className="bg-[#141414] border border-[#333] rounded px-1.5 py-1 text-xs text-white"
                  >
                    {PRESET_ICONS.map((ic) => (
                      <option key={ic} value={ic}>{ic}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Track Name (e.g. Sugar Cleanse)"
                    className="flex-1 bg-[#141414] border border-[#333] rounded px-2 py-1 text-xs text-white placeholder-[#555] focus:outline-none focus:border-[#666]"
                    autoFocus
                  />
                </div>
                <input
                  type="text"
                  value={newMotto}
                  onChange={(e) => setNewMotto(e.target.value)}
                  placeholder="Guiding intention (optional)"
                  className="w-full bg-[#141414] border border-[#333] rounded px-2 py-1 text-xs text-white placeholder-[#555] focus:outline-none focus:border-[#666]"
                />
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-2 py-1 text-[11px] text-[#777] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-[11px] bg-[#E5E5E5] text-[#121212] font-semibold rounded hover:bg-white"
                  >
                    Create
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
};
