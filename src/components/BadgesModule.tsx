import React, { useState } from 'react';
import { Award, CheckCircle2, Lock, Sparkles, ChevronRight, X } from 'lucide-react';
import { Habit, UrgeEntry, DailyDayPlan } from '../types/index.ts';
import { evaluateBadges, EvaluatedBadge, BadgeCategory } from '../utils/badgesLogic.ts';
import { formatDateKey } from '../utils/resetLogic.ts';

interface BadgesModuleProps {
  currentStreakDays: number;
  longestStreakDays: number;
  habits: Habit[];
  urges: UrgeEntry[];
  planner?: Record<string, DailyDayPlan>;
}

export const BadgesModule: React.FC<BadgesModuleProps> = ({
  currentStreakDays,
  longestStreakDays,
  habits,
  urges,
  planner = {},
}) => {
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all');
  const [selectedBadge, setSelectedBadge] = useState<EvaluatedBadge | null>(null);

  const evaluation = evaluateBadges(
    currentStreakDays,
    longestStreakDays,
    habits,
    urges,
    planner,
    formatDateKey()
  );

  const filteredBadges = selectedCategory === 'all'
    ? evaluation.badges
    : evaluation.badges.filter((b) => b.category === selectedCategory);

  return (
    <section className="bg-[#181818] border border-[#262626] rounded-xl p-5 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#232323]">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-[#E5C07B]" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[#ECECEC] tracking-tight">
                Digital Achievements
              </h2>
              <span className="text-[11px] font-mono text-[#E5C07B] bg-[#241F16] border border-[#3E321E] px-2 py-0.5 rounded">
                {evaluation.unlockedCount}/{evaluation.totalCount} Unlocked
              </span>
            </div>
            <p className="text-[11px] text-[#7A7A7A] mt-0.5">
              Automatically awarded as you build momentum and conquer urges
            </p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1 bg-[#141414] p-1 rounded-lg border border-[#262626] self-start sm:self-center">
          {(['all', 'streak', 'habits', 'urges'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 text-xs font-medium rounded capitalize transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#292929] text-white shadow-sm'
                  : 'text-[#777] hover:text-[#CCC]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Small Side-Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {filteredBadges.map((badge) => {
          return (
            <div
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between group ${
                badge.isUnlocked
                  ? 'bg-[#1C1A16] border-[#3D3320] hover:border-[#57482D] text-[#ECECEC]'
                  : 'bg-[#151515] border-[#222] hover:border-[#2C2C2C] text-[#666]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-1 mb-2">
                  <span className={`text-xl select-none ${badge.isUnlocked ? '' : 'grayscale opacity-50'}`}>
                    {badge.icon}
                  </span>
                  {badge.isUnlocked ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#E5C07B] shrink-0" />
                  ) : (
                    <Lock className="w-3 h-3 text-[#555] shrink-0" />
                  )}
                </div>

                <div className={`font-semibold text-xs leading-snug truncate ${
                  badge.isUnlocked ? 'text-white' : 'text-[#888]'
                }`}>
                  {badge.name}
                </div>
                <p className={`text-[10px] mt-1 line-clamp-2 leading-tight ${
                  badge.isUnlocked ? 'text-[#A09886]' : 'text-[#555]'
                }`}>
                  {badge.description}
                </p>
              </div>

              {/* Progress bar / Unlock status */}
              <div className="mt-3 pt-2 border-t border-[#24221D]">
                {badge.isUnlocked ? (
                  <span className="text-[10px] font-mono text-[#E5C07B] flex items-center gap-1">
                    <span>Achieved</span>
                  </span>
                ) : (
                  <div>
                    <div className="flex items-center justify-between text-[9px] font-mono text-[#666] mb-1">
                      <span>{badge.currentCount}/{badge.targetCount}</span>
                      <span>{badge.progressPercent}%</span>
                    </div>
                    <div className="w-full h-1 bg-[#222] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#555] rounded-full"
                        style={{ width: `${badge.progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-sm bg-[#181818] border border-[#2D2D2D] rounded-xl p-5 shadow-2xl text-xs space-y-4"
            role="dialog"
            aria-labelledby="badge-detail-title"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedBadge.icon}</span>
                <div>
                  <h3 id="badge-detail-title" className="font-semibold text-white text-sm">
                    {selectedBadge.name}
                  </h3>
                  <span className="text-[10px] font-mono uppercase text-[#E5C07B]">
                    {selectedBadge.category} Achievement
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="p-1 rounded text-[#777] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#CCC] leading-relaxed">
              {selectedBadge.description}
            </p>

            <div className="bg-[#141414] border border-[#242424] p-3 rounded-lg flex items-center justify-between text-xs font-mono">
              <span className="text-[#888]">Target Requirement:</span>
              <span className="font-bold text-white">
                {selectedBadge.targetCount} {selectedBadge.unit}
              </span>
            </div>

            <div className="bg-[#141414] border border-[#242424] p-3 rounded-lg flex items-center justify-between text-xs font-mono">
              <span className="text-[#888]">Current Progress:</span>
              <span className={`font-bold ${selectedBadge.isUnlocked ? 'text-[#E5C07B]' : 'text-[#BBB]'}`}>
                {selectedBadge.currentCount} / {selectedBadge.targetCount} ({selectedBadge.progressPercent}%)
              </span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-[#282828] hover:bg-[#333] text-white rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
