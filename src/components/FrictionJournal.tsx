import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Zap,
  ShieldCheck,
  Trophy,
  Target,
  Copy,
  Check,
} from 'lucide-react';

interface FrictionJournalProps {
  note: string;
  dateKey: string;
  isToday: boolean;
  onUpdateNote: (note: string, targetDateKey?: string) => void;
}

export const FrictionJournal: React.FC<FrictionJournalProps> = ({
  note,
  dateKey,
  isToday,
  onUpdateNote,
}) => {
  const [copied, setCopied] = useState(false);

  const wordCount = note.trim() ? note.trim().split(/\s+/).length : 0;
  const charCount = note.length;

  const insertPrompt = (promptHeader: string) => {
    const separator = note.trim() ? '\n\n' : '';
    const updated = `${note}${separator}${promptHeader}\n- `;
    onUpdateNote(updated, dateKey);
  };

  const handleCopy = () => {
    if (!note) return;
    navigator.clipboard.writeText(note);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3 pt-4 border-t border-[#232323]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#C5C5C5]" />
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Friction Journal
            </h3>
            <p className="text-[11px] text-[#7A7A7A]">
              Free-form reflection · Trace triggers and log end-of-day insights
            </p>
          </div>
        </div>

        {/* Word count & copy */}
        <div className="flex items-center gap-3 text-xs text-[#777] font-mono self-start sm:self-auto">
          <span>{wordCount} words</span>
          <span>·</span>
          <span>{charCount} chars</span>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!note.trim()}
            title="Copy journal entry"
            className="hover:text-white transition-colors disabled:opacity-30 disabled:hover:text-[#777] flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#98C379]" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Quick Prompt Chips (Click to insert end-of-day prompt templates) */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[10px] font-mono text-[#666] uppercase mr-1">Prompts:</span>

        <button
          type="button"
          onClick={() => insertPrompt('### ⚡ Friction & Triggers Faced')}
          className="px-2 py-1 rounded-md bg-[#1B1B1B] hover:bg-[#252525] text-[11px] text-[#BBB] hover:text-white border border-[#2B2B2B] flex items-center gap-1 transition-colors"
        >
          <Zap className="w-3 h-3 text-[#E5C07B]" />
          <span>Friction</span>
        </button>

        <button
          type="button"
          onClick={() => insertPrompt('### 🛡️ How I Surfed Resistance')}
          className="px-2 py-1 rounded-md bg-[#1B1B1B] hover:bg-[#252525] text-[11px] text-[#BBB] hover:text-white border border-[#2B2B2B] flex items-center gap-1 transition-colors"
        >
          <ShieldCheck className="w-3 h-3 text-[#61AFEF]" />
          <span>Surfing</span>
        </button>

        <button
          type="button"
          onClick={() => insertPrompt('### 🏆 Wins & Micro-Victories')}
          className="px-2 py-1 rounded-md bg-[#1B1B1B] hover:bg-[#252525] text-[11px] text-[#BBB] hover:text-white border border-[#2B2B2B] flex items-center gap-1 transition-colors"
        >
          <Trophy className="w-3 h-3 text-[#98C379]" />
          <span>Wins</span>
        </button>

        <button
          type="button"
          onClick={() => insertPrompt('### 🎯 #1 Non-Negotiable Priority for Tomorrow')}
          className="px-2 py-1 rounded-md bg-[#1B1B1B] hover:bg-[#252525] text-[11px] text-[#BBB] hover:text-white border border-[#2B2B2B] flex items-center gap-1 transition-colors"
        >
          <Target className="w-3 h-3 text-[#E06C75]" />
          <span>Tomorrow</span>
        </button>
      </div>

      {/* Journal Textarea */}
      <div className="relative">
        <textarea
          rows={9}
          value={note}
          onChange={(e) => onUpdateNote(e.target.value, dateKey)}
          placeholder="Unload thoughts, analyze what triggered friction today, or answer an end-of-day prompt above...&#10;&#10;• What triggered discomfort today?&#10;• Did I surf the urge or avoid it?&#10;• What single adjustment will make tomorrow easier?"
          className="w-full bg-[#141414] border border-[#2D2D2D] hover:border-[#3D3D3D] focus:border-[#666] rounded-xl p-3.5 text-xs text-[#E5E5E5] placeholder-[#505050] focus:outline-none transition-colors resize-none leading-relaxed font-sans"
        />
        <div className="absolute bottom-3 right-3 text-[10px] font-mono text-[#555] pointer-events-none">
          auto-saved
        </div>
      </div>
    </div>
  );
};
