import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Shield,
  Flame,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Quote,
  X,
  Compass,
} from 'lucide-react';
import { ResetTrack } from '../types/index.ts';
import { CleanStreakResult } from '../utils/resetLogic.ts';
import { getDailyMotivationQuote } from '../utils/motivationQuotes.ts';
import { haptics } from '../utils/haptics.ts';

interface OpeningScreenProps {
  isOpen: boolean;
  onEnterApp: () => void;
  onOpenGrounding: () => void;
  activeTrack: ResetTrack;
  streakInfo: CleanStreakResult;
  todayKey: string;
  completedHabitsCount: number;
  totalHabitsCount: number;
  unfinishedTasksCount: number;
  showOnLaunchPreference: boolean;
  onToggleShowOnLaunch: (show: boolean) => void;
}

export const OpeningScreen: React.FC<OpeningScreenProps> = ({
  isOpen,
  onEnterApp,
  onOpenGrounding,
  activeTrack,
  streakInfo,
  todayKey,
  completedHabitsCount,
  totalHabitsCount,
  unfinishedTasksCount,
  showOnLaunchPreference,
  onToggleShowOnLaunch,
}) => {
  if (!isOpen) return null;

  const now = new Date();
  const hours = now.getHours();
  const greeting =
    hours < 12
      ? 'Good morning'
      : hours < 18
      ? 'Good afternoon'
      : 'Good evening';

  const formattedDate = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const dailyQuote = getDailyMotivationQuote(todayKey);

  const handleEnter = () => {
    haptics.success();
    onEnterApp();
  };

  const handleGrounding = () => {
    haptics.medium();
    onOpenGrounding();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="fixed inset-0 z-50 overflow-y-auto bg-[#0E0E0E]/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
    >
      {/* Background Calm Atmosphere */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-emerald-500/5 blur-[140px] pointer-events-none" />

      {/* Main Container */}
      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 15, opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-xl w-full bg-[#161616] border border-[#282828] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 my-auto"
      >
        {/* Top Header Row with Dismiss X */}
        <div className="flex items-center justify-between border-b border-[#242424] pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl select-none">{activeTrack.icon || '🛡️'}</span>
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-[#888]">
                {greeting} · {formattedDate}
              </div>
              <h2 className="text-sm font-semibold text-white tracking-tight">
                {activeTrack.name}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleEnter}
            title="Enter dashboard"
            className="text-[#666] hover:text-[#CCC] p-1.5 rounded-lg hover:bg-[#222] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hero Section: Clean Streak Days */}
        <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl p-5 text-center space-y-2 relative overflow-hidden group">
          <div className="flex items-center justify-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#E5C07B]">
            <Flame className="w-4 h-4 text-[#E07A5F]" />
            <span>Clean Recovery Streak</span>
          </div>

          <div className="flex items-baseline justify-center gap-2">
            <span className="text-4xl sm:text-5xl font-bold font-mono text-white tracking-tight tabular-nums">
              {streakInfo.days}
            </span>
            <span className="text-sm sm:text-base font-mono text-[#888]">
              {streakInfo.days === 1 ? 'day' : 'days'} clean
            </span>
          </div>

          <p className="text-xs text-[#808080] max-w-sm mx-auto italic">
            "{activeTrack.motto || 'Clarity over compulsion. One day at a time.'}"
          </p>
        </div>

        {/* Stoic Anchor Quote Card */}
        <div className="bg-[#141414] border border-[#222] rounded-xl p-4 sm:p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-[#777]">
            <Quote className="w-3.5 h-3.5 text-[#E07A5F]" />
            <span>Today's Anchor Principle</span>
          </div>
          <blockquote className="text-xs sm:text-sm text-[#DDD] leading-relaxed italic">
            "{dailyQuote.quote}"
          </blockquote>
          <div className="text-[11px] font-mono text-[#888] text-right">
            — {dailyQuote.author}
          </div>
        </div>

        {/* Quick Snapshot: Daily Habits & Tasks */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#141414] border border-[#242424] rounded-xl p-3.5 text-center">
            <span className="text-[10px] uppercase font-mono text-[#777] block mb-1">
              Anchor Habits
            </span>
            <div className="text-lg font-semibold font-mono text-white tabular-nums">
              {completedHabitsCount}/{totalHabitsCount}
            </div>
            <span className="text-[10px] text-[#666]">
              {completedHabitsCount === totalHabitsCount
                ? 'All completed today ✓'
                : 'Pending today'}
            </span>
          </div>

          <div className="bg-[#141414] border border-[#242424] rounded-xl p-3.5 text-center">
            <span className="text-[10px] uppercase font-mono text-[#777] block mb-1">
              Daily Tasks
            </span>
            <div className="text-lg font-semibold font-mono text-white tabular-nums">
              {unfinishedTasksCount}
            </div>
            <span className="text-[10px] text-[#666]">
              {unfinishedTasksCount === 0
                ? 'Clear agenda ✓'
                : 'Unfinished action items'}
            </span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleGrounding}
            className="flex-1 py-3 px-4 rounded-xl bg-[#222] hover:bg-[#2A2A2A] text-white text-xs font-medium border border-[#333] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>🧘</span>
            <span>1-Minute Grounding Breath</span>
          </button>

          <button
            type="button"
            onClick={handleEnter}
            className="flex-1 py-3 px-5 rounded-xl bg-[#E6E6E6] hover:bg-white text-[#121212] font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>Begin Today</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bottom Preference & Launch Settings */}
        <div className="flex items-center justify-between text-[11px] text-[#666] pt-1 border-t border-[#222]">
          <label className="flex items-center gap-2 cursor-pointer select-none hover:text-[#999] transition-colors">
            <input
              type="checkbox"
              checked={showOnLaunchPreference}
              onChange={(e) => onToggleShowOnLaunch(e.target.checked)}
              className="rounded bg-[#202020] border-[#383838] text-white focus:ring-0 w-3.5 h-3.5 cursor-pointer"
            />
            <span>Show opening screen on launch</span>
          </label>

          <span className="font-mono text-[10px]">Tap anywhere to continue</span>
        </div>
      </motion.div>
    </motion.div>
  );
};
