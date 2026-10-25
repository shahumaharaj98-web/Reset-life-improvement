import React, { useState } from 'react';
import { Quote, Shuffle, Copy, Check, Sparkles } from 'lucide-react';
import { formatDateKey } from '../utils/resetLogic.ts';
import { getDailyMotivationQuote } from '../utils/motivationQuotes.ts';

interface DailyMotivationProps {
  dateKey?: string;
}

export const DailyMotivation: React.FC<DailyMotivationProps> = ({
  dateKey = formatDateKey(),
}) => {
  const [offsetIndex, setOffsetIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const currentQuote = getDailyMotivationQuote(dateKey, offsetIndex);

  const handleNextQuote = () => {
    setOffsetIndex((prev) => prev + 1);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`"${currentQuote.quote}" — ${currentQuote.author}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <section className="bg-[#181818] border border-[#262626] rounded-xl p-5 sm:p-6 relative group transition-colors hover:border-[#303030]">
      {/* Top Notion Header Row */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#232323]">
        <div className="flex items-center gap-2">
          <Quote className="w-3.5 h-3.5 text-[#E07A5F]" />
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#8A8A8A]">
            Daily Motivation
          </h2>
          <span className="text-[#555] text-xs">·</span>
          <span className="text-[11px] text-[#6E6E6E] font-mono">
            {offsetIndex === 0 ? "Today's Principle" : 'Alternative Reflection'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            title="Copy quote to clipboard"
            className="p-1.5 rounded text-[#777] hover:text-[#CCC] hover:bg-[#222] transition-colors flex items-center gap-1 text-[11px]"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#A3E635]" />
                <span className="text-[#A3E635] hidden sm:inline">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleNextQuote}
            title="Cycle next inspirational quote"
            className="p-1.5 rounded text-[#777] hover:text-[#CCC] hover:bg-[#222] transition-colors flex items-center gap-1 text-[11px]"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Next</span>
          </button>
        </div>
      </div>

      {/* Quote Body */}
      <div className="space-y-2.5">
        <blockquote className="text-sm sm:text-base font-medium text-[#ECECEC] leading-relaxed italic">
          "{currentQuote.quote}"
        </blockquote>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-[#808080]">
          <div className="font-semibold text-[#BDBDBD] tracking-tight">
            — {currentQuote.author}
          </div>

          {currentQuote.context && (
            <div className="text-[11px] text-[#6A6A6A] italic">
              {currentQuote.context}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
