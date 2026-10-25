import React, { useState, useEffect } from 'react';
import { MoreHorizontal, Calendar, Award, RefreshCw, ChevronRight } from 'lucide-react';
import {
  calculateCleanStreak,
  calculateMilestoneProgress,
  CleanStreakResult,
} from '../utils/resetLogic.ts';

interface StreakCounterProps {
  startDateIso: string;
  longestStreakDays: number;
  onOpenResetModal: () => void;
  onOpenEditDateModal: () => void;
  onOpenMilestonesModal: () => void;
}

export const StreakCounter: React.FC<StreakCounterProps> = ({
  startDateIso,
  longestStreakDays,
  onOpenResetModal,
  onOpenEditDateModal,
  onOpenMilestonesModal,
}) => {
  const [streak, setStreak] = useState<CleanStreakResult>(() =>
    calculateCleanStreak(startDateIso)
  );
  const [showMenu, setShowMenu] = useState(false);

  // Update streak every second for live continuous counter
  useEffect(() => {
    const update = () => {
      setStreak(calculateCleanStreak(startDateIso));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startDateIso]);

  const milestoneInfo = calculateMilestoneProgress(streak.days);

  return (
    <section className="bg-[#181818] border border-[#262626] rounded-xl p-6 sm:p-8 relative">
      {/* Top Bar inside Card: Notion Category label & More actions menu */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs font-mono tracking-wider text-[#8A8A8A] uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#525252]" />
          <span>Active Streak</span>
        </div>

        {/* 3-dot Notion action menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            aria-label="Streak settings and options"
            className="p-1.5 text-[#777] hover:text-[#DDD] hover:bg-[#252525] rounded transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-[#1E1E1E] border border-[#333] rounded-lg shadow-xl py-1.5 z-30 text-xs text-[#CCC]">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onOpenMilestonesModal();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#2A2A2A] flex items-center gap-2 text-[#DDD]"
                >
                  <Award className="w-3.5 h-3.5 text-[#888]" />
                  <span>View Milestones</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onOpenEditDateModal();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#2A2A2A] flex items-center gap-2 text-[#DDD]"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#888]" />
                  <span>Set / Edit Start Date</span>
                </button>
                <div className="h-px bg-[#2C2C2C] my-1" />
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onOpenResetModal();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#2F2121] text-[#E07A5F] flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Streak</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Massive Days Clean Counter */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-3">
            <span
              data-testid="days-clean-count"
              className="text-6xl sm:text-7xl font-extrabold tracking-tight font-mono text-[#FAFAFA] tabular-nums"
            >
              {streak.days}
            </span>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-semibold tracking-tight text-[#E0E0E0]">
                {streak.days === 1 ? 'Day Clean' : 'Days Clean'}
              </span>
              <span className="text-xs text-[#7A7A7A] tracking-normal font-sans">
                unbroken clarity
              </span>
            </div>
          </div>

          {/* Sub-counter in tabular monospace */}
          <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[#8E8E8E] tabular-nums">
            <div className="flex items-center gap-1.5 bg-[#202020] border border-[#2D2D2D] px-2.5 py-1 rounded">
              <span className="text-[#E0E0E0] font-medium">{String(streak.hours).padStart(2, '0')}</span>
              <span className="text-[#666]">h</span>
              <span className="text-[#444]">:</span>
              <span className="text-[#E0E0E0] font-medium">{String(streak.minutes).padStart(2, '0')}</span>
              <span className="text-[#666]">m</span>
              <span className="text-[#444]">:</span>
              <span className="text-[#E0E0E0] font-medium">{String(streak.seconds).padStart(2, '0')}</span>
              <span className="text-[#666]">s</span>
            </div>
            <span className="text-[#555] hidden sm:inline">·</span>
            <span className="text-[#777] hidden sm:inline">
              Since {streak.startDateFormatted}
            </span>
          </div>
        </div>

        {/* Milestone Quick Summary on Desktop */}
        <div className="sm:text-right shrink-0">
          <div className="text-xs text-[#888] mb-1">Current Milestone Goal</div>
          <button
            onClick={onOpenMilestonesModal}
            className="text-sm font-medium text-[#ECECEC] hover:text-white flex items-center sm:justify-end gap-1 group"
          >
            <span>{milestoneInfo.nextMilestone.label}</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#666] group-hover:translate-x-0.5 transition-transform" />
          </button>
          <div className="text-xs text-[#777] mt-0.5">
            {milestoneInfo.daysRemaining === 0
              ? 'Achieved!'
              : `${milestoneInfo.daysRemaining} ${milestoneInfo.daysRemaining === 1 ? 'day' : 'days'} to go`}
          </div>
        </div>
      </div>

      {/* Milestone Progress Bar */}
      <div className="mt-6 pt-5 border-t border-[#232323]">
        <div className="flex items-center justify-between text-xs text-[#888] mb-2 font-mono">
          <span className="text-[#AAA]">
            {milestoneInfo.currentMilestone ? milestoneInfo.currentMilestone.label : 'Start'}
          </span>
          <span className="text-[#888] tabular-nums font-mono text-[11px]">
            {milestoneInfo.progressPercent}% to {milestoneInfo.nextMilestone.label}
          </span>
          <span className="text-[#CCC] font-medium">
            {milestoneInfo.nextMilestone.label} ({milestoneInfo.nextMilestone.days}d)
          </span>
        </div>
        <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#E5E5E5] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${milestoneInfo.progressPercent}%` }}
          />
        </div>
        <div className="mt-2 text-[11px] text-[#707070] italic">
          "{milestoneInfo.nextMilestone.description}"
        </div>
      </div>
    </section>
  );
};
