import React, { useState } from 'react';
import { Smartphone, Download, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed in standalone mode, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop PWA flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        title="Install app to your home screen or desktop"
        className="text-xs text-[#E5E5E5] bg-[#222] hover:bg-[#2C2C2C] border border-[#383838] px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5 font-medium"
      >
        <Download className="w-3.5 h-3.5 text-[#E07A5F]" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="text-xs text-[#AAA] hover:text-white px-2.5 py-1.5 rounded hover:bg-[#222] transition-colors flex items-center gap-1.5"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#888]" />
          <span className="hidden sm:inline">Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-sm rounded-xl bg-[#181818] border border-[#333] p-5 shadow-2xl text-xs text-[#CCC]">
              <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
                <h3 className="font-semibold text-[#ECECEC] text-sm">Install Reset on iPhone / iPad</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded text-[#777] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="py-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <span className="font-mono text-white bg-[#262626] w-5 h-5 rounded flex items-center justify-center shrink-0">1</span>
                  <span>Tap the <strong>Share</strong> button at the bottom of your Safari screen.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="font-mono text-white bg-[#262626] w-5 h-5 rounded flex items-center justify-center shrink-0">2</span>
                  <span>Scroll down and select <strong>"Add to Home Screen"</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="font-mono text-white bg-[#262626] w-5 h-5 rounded flex items-center justify-center shrink-0">3</span>
                  <span>Tap <strong>Add</strong>. Launch directly from your home screen for instant zero-friction urge logging.</span>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full mt-2 rounded-lg bg-[#282828] hover:bg-[#333] py-2 text-xs font-semibold text-white transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop or browsers without beforeinstallprompt triggered yet: show quiet button
  return (
    <button
      onClick={() => setShowIOSGuide(true)}
      title="Install as Progressive Web App"
      className="text-xs text-[#888] hover:text-[#CCC] px-2 py-1.5 rounded hover:bg-[#222] transition-colors flex items-center gap-1.5"
    >
      <Smartphone className="w-3.5 h-3.5 text-[#777]" />
      <span className="hidden sm:inline">Install App</span>
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-xl bg-[#181818] border border-[#333] p-5 shadow-2xl text-xs text-[#CCC]">
            <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
              <h3 className="font-semibold text-[#ECECEC] text-sm">Install Reset App</h3>
              <button
                onClick={(e) => { e.stopPropagation(); setShowIOSGuide(false); }}
                className="p-1 rounded text-[#777] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-4 space-y-3 leading-relaxed text-[#BBB]">
              <p>
                To install Reset to your home screen or application launcher:
              </p>
              <p>
                • <strong>Desktop Chrome/Edge</strong>: Click the install icon in the URL address bar or select "Install Reset" from the browser menu.
              </p>
              <p>
                • <strong>Mobile Safari / Chrome</strong>: Tap Share → "Add to Home Screen".
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setShowIOSGuide(false); }}
              className="w-full mt-2 rounded-lg bg-[#282828] hover:bg-[#333] py-2 text-xs font-semibold text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </button>
  );
};
