import React, { useState } from 'react';
import { Download, Upload, Lock, Unlock, KeyRound, Compass } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton.tsx';
import { TrackSwitcher } from './TrackSwitcher.tsx';
import { ResetTrack } from '../types/index.ts';

interface HeaderProps {
  tracks: ResetTrack[];
  activeTrackId: string;
  onSwitchTrack: (trackId: string) => void;
  onAddTrack: (name: string, icon: string, motto: string) => void;
  onDeleteTrack: (trackId: string) => void;
  motto: string;
  onUpdateMotto: (newMotto: string) => void;
  onExport: () => void;
  onImport: (json: string) => boolean;
  pinCode: string | null;
  onLockApp: () => void;
  onOpenPinModal: (mode: 'set' | 'remove') => void;
  onOpenOpeningScreen?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  tracks,
  activeTrackId,
  onSwitchTrack,
  onAddTrack,
  onDeleteTrack,
  motto,
  onUpdateMotto,
  onExport,
  onImport,
  pinCode,
  onLockApp,
  onOpenPinModal,
  onOpenOpeningScreen,
}) => {
  const [isEditingMotto, setIsEditingMotto] = useState(false);
  const [mottoText, setMottoText] = useState(motto);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSaveMotto = () => {
    if (mottoText.trim()) {
      onUpdateMotto(mottoText.trim());
    }
    setIsEditingMotto(false);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = onImport(content);
      if (success) {
        setImportStatus('Data restored');
        setTimeout(() => setImportStatus(null), 2500);
      } else {
        setImportStatus('Invalid JSON file');
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="border-b border-[#242424] bg-[#141414] sticky top-0 z-30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Track Switcher & Branding */}
        <div className="flex items-center gap-2">
          <TrackSwitcher
            tracks={tracks}
            activeTrackId={activeTrackId}
            onSwitchTrack={onSwitchTrack}
            onAddTrack={onAddTrack}
            onDeleteTrack={onDeleteTrack}
          />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {importStatus && (
            <span className="text-xs text-[#9B9B9B] px-2 py-1">
              {importStatus}
            </span>
          )}

          {/* Opening Screen / Centering Briefing Button */}
          {onOpenOpeningScreen && (
            <button
              type="button"
              onClick={onOpenOpeningScreen}
              title="Open Daily Centering & Opening Briefing"
              className="text-xs text-[#888] hover:text-white px-2 py-1.5 rounded hover:bg-[#222] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-[#E5C07B]" />
              <span className="hidden sm:inline">Briefing</span>
            </button>
          )}

          {/* In-App PWA Install Button */}
          <PWAInstallButton />

          {/* Privacy PIN Lock / Set Button */}
          {pinCode ? (
            <div className="flex items-center gap-1">
              <button
                onClick={onLockApp}
                title="Lock Application Now"
                className="text-xs text-[#AAA] hover:text-white px-2 py-1.5 rounded hover:bg-[#222] transition-colors flex items-center gap-1"
              >
                <Lock className="w-3.5 h-3.5 text-[#E07A5F]" />
                <span className="hidden sm:inline">Lock</span>
              </button>
              <button
                onClick={() => onOpenPinModal('remove')}
                title="Manage PIN code"
                className="p-1.5 text-[#666] hover:text-[#CCC] hover:bg-[#222] rounded transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenPinModal('set')}
              title="Set Privacy PIN"
              className="text-xs text-[#888] hover:text-[#DDD] px-2 py-1.5 rounded hover:bg-[#222] transition-colors flex items-center gap-1"
            >
              <Unlock className="w-3.5 h-3.5 text-[#777]" />
              <span className="hidden sm:inline">Set PIN</span>
            </button>
          )}

          <label
            title="Import Backup JSON"
            className="cursor-pointer text-xs text-[#888] hover:text-[#DDD] px-2 py-1.5 rounded hover:bg-[#222] transition-colors flex items-center gap-1"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>

          <button
            onClick={onExport}
            title="Export Data as JSON Backup"
            className="text-xs text-[#888] hover:text-[#DDD] px-2 py-1.5 rounded hover:bg-[#222] transition-colors flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Backup</span>
          </button>
        </div>
      </div>

      {/* Notion Callout Box for Intention / Core Principle */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-3 pt-1">
        <div className="bg-[#1C1C1C] border border-[#2B2B2B] rounded-md px-3.5 py-2.5 flex items-start gap-3 text-xs text-[#999]">
          <span className="text-sm select-none mt-0.5">💡</span>
          <div className="flex-1">
            {isEditingMotto ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={mottoText}
                  onChange={(e) => setMottoText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveMotto()}
                  className="w-full bg-[#141414] border border-[#3A3A3A] rounded px-2 py-1 text-xs text-[#ECECEC] focus:outline-none focus:border-[#666]"
                  autoFocus
                />
                <button
                  onClick={handleSaveMotto}
                  className="px-2 py-1 text-xs bg-[#2E2E2E] hover:bg-[#3E3E3E] text-white rounded transition-colors"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between group">
                <span className="text-[#C8C8C8] leading-relaxed italic">
                  "{motto}"
                </span>
                <button
                  onClick={() => setIsEditingMotto(true)}
                  className="opacity-0 group-hover:opacity-100 text-[#777] hover:text-[#BBB] text-[11px] underline ml-2 shrink-0 transition-opacity"
                >
                  edit intention
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
