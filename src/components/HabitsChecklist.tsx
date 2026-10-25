import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Edit3, Flame, SkipForward, ArrowRight, ArrowLeft } from 'lucide-react';
import { Habit } from '../types/index.ts';
import {
  calculateHabitStreak,
  formatDateKey,
  getPastNDays,
  isHabitCompletedOn,
} from '../utils/resetLogic.ts';
import { haptics } from '../utils/haptics.ts';

interface HabitsChecklistProps {
  habits: Habit[];
  onToggleHabit: (habitId: string, dateKey?: string) => void;
  onOpenEditModal: () => void;
}

interface SwipeableHabitCardProps {
  habit: Habit;
  index: number;
  todayKey: string;
  past7Days: Array<{ dateKey: string; dayLabel: string }>;
  onToggleHabit: (habitId: string, dateKey?: string) => void;
}

const SWIPE_THRESHOLD = 75;

const SwipeableHabitCard: React.FC<SwipeableHabitCardProps> = ({
  habit,
  index,
  todayKey,
  past7Days,
  onToggleHabit,
}) => {
  const isDoneToday = isHabitCompletedOn(habit, todayKey);
  const streak = calculateHabitStreak(habit.completionDates, todayKey);
  const [dragOffset, setDragOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const handleDrag = (_: unknown, info: { offset: { x: number } }) => {
    setDragOffset(info.offset.x);
  };

  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    setIsSwiping(false);
    const offsetX = info.offset.x;

    // Swipe Right -> Complete
    if (offsetX > SWIPE_THRESHOLD) {
      if (!isDoneToday) {
        onToggleHabit(habit.id, todayKey);
      }
      haptics.success();
    }
    // Swipe Left -> Skip / Reset for today
    else if (offsetX < -SWIPE_THRESHOLD) {
      if (isDoneToday) {
        onToggleHabit(habit.id, todayKey);
      }
      haptics.warning();
    }

    setDragOffset(0);
  };

  const isSwipingRight = dragOffset > 25;
  const isSwipingLeft = dragOffset < -25;
  const reachedRightThreshold = dragOffset >= SWIPE_THRESHOLD;
  const reachedLeftThreshold = dragOffset <= -SWIPE_THRESHOLD;

  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.38,
        delay: Math.min(index * 0.05, 0.4),
        ease: [0.16, 1, 0.3, 1],
      }}
      className="relative overflow-hidden rounded-xl bg-[#161616] select-none touch-pan-y"
    >
      {/* Background Action Indicators (Dismissible Widget Effect) */}
      <div className="absolute inset-0 flex items-center justify-between px-5 pointer-events-none transition-colors">
        {/* Left reveal: Swipe Right to Complete (Green) */}
        <div
          className={`flex items-center gap-2.5 transition-all duration-150 ${
            isSwipingRight
              ? reachedRightThreshold
                ? 'opacity-100 scale-105 text-emerald-300'
                : 'opacity-70 scale-95 text-emerald-400'
              : 'opacity-0 scale-90 text-emerald-500'
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shadow-lg">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider font-mono">
            {reachedRightThreshold ? 'Release to Complete' : 'Swipe to Complete'}
          </span>
        </div>

        {/* Right reveal: Swipe Left to Skip / Reset (Amber/Rose) */}
        <div
          className={`flex items-center gap-2.5 ml-auto transition-all duration-150 ${
            isSwipingLeft
              ? reachedLeftThreshold
                ? 'opacity-100 scale-105 text-amber-300'
                : 'opacity-70 scale-95 text-amber-400'
              : 'opacity-0 scale-90 text-amber-500'
          }`}
        >
          <span className="text-xs font-semibold uppercase tracking-wider font-mono">
            {reachedLeftThreshold ? 'Release to Skip' : 'Swipe to Skip'}
          </span>
          <div className="w-8 h-8 rounded-full bg-amber-600/90 text-white flex items-center justify-center shadow-lg">
            <SkipForward className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Dynamic Background Tint on Drag */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-150"
        style={{
          backgroundColor:
            dragOffset > 0
              ? `rgba(16, 185, 129, ${Math.min(Math.abs(dragOffset) / 220, 0.25)})`
              : dragOffset < 0
              ? `rgba(245, 158, 11, ${Math.min(Math.abs(dragOffset) / 220, 0.25)})`
              : 'transparent',
        }}
      />

      {/* Foreground Swipeable Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.65}
        onDragStart={() => {
          setIsSwiping(true);
          haptics.dragStart();
        }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className={`relative z-10 px-4 py-3.5 sm:py-4 rounded-xl border transition-colors cursor-grab active:cursor-grabbing flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isDoneToday
            ? 'bg-[#181818]/95 border-[#282828]'
            : 'bg-[#1C1C1C] border-[#2A2A2A] hover:border-[#383838]'
        }`}
      >
        {/* Left: Checkbox & Info */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleHabit(habit.id, todayKey);
              if (!isDoneToday) {
                haptics.success();
              } else {
                haptics.medium();
              }
            }}
            aria-label={`Mark "${habit.title}" as ${isDoneToday ? 'incomplete' : 'complete'}`}
            className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center transition-all shrink-0 border cursor-pointer active:scale-95 ${
              isDoneToday
                ? 'bg-[#E5E5E5] border-[#E5E5E5] text-[#121212]'
                : 'border-[#444] bg-[#222] hover:border-[#777] text-transparent'
            }`}
          >
            <Check className={`w-3.5 h-3.5 stroke-[3] ${isDoneToday ? 'opacity-100' : 'opacity-0'}`} />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-base select-none shrink-0">{habit.icon || '⚡'}</span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleHabit(habit.id, todayKey);
                  if (!isDoneToday) {
                    haptics.success();
                  } else {
                    haptics.medium();
                  }
                }}
                className={`text-sm font-medium cursor-pointer transition-all select-none truncate ${
                  isDoneToday
                    ? 'text-[#7A7A7A] line-through'
                    : 'text-[#E8E8E8] hover:text-white'
                }`}
              >
                {habit.title}
              </span>
            </div>

            {habit.description && (
              <p className="text-xs text-[#7A7A7A] mt-0.5 pl-6 leading-relaxed line-clamp-2">
                {habit.description}
              </p>
            )}
          </div>
        </div>

        {/* Right: Streak & 7-Day History Track */}
        <div className="flex items-center gap-3.5 pl-8 sm:pl-0 self-end sm:self-center shrink-0">
          {/* Streak badge */}
          <div
            title={`${streak}-day streak`}
            className={`flex items-center gap-1 text-xs font-mono tabular-nums px-2 py-0.5 rounded ${
              streak > 0
                ? 'text-[#E0E0E0] bg-[#242424] border border-[#303030]'
                : 'text-[#666] bg-[#1E1E1E]'
            }`}
          >
            <Flame
              className={`w-3 h-3 ${
                streak > 0 ? 'text-[#E07A5F]' : 'text-[#555]'
              }`}
            />
            <span>{streak}d</span>
          </div>

          {/* 7-Day Mini Dots Tracker */}
          <div className="flex items-center gap-1 bg-[#161616] px-2 py-1 rounded border border-[#272727]">
            {past7Days.map((day) => {
              const done = isHabitCompletedOn(habit, day.dateKey);
              const isToday = day.dateKey === todayKey;
              return (
                <button
                  key={day.dateKey}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleHabit(habit.id, day.dateKey);
                    haptics.light();
                  }}
                  title={`${day.dateKey} (${day.dayLabel}): ${done ? 'Done' : 'Not done'}`}
                  className={`w-3.5 h-3.5 rounded-sm transition-all flex items-center justify-center text-[8px] font-mono cursor-pointer active:scale-90 ${
                    done
                      ? 'bg-[#E5E5E5] text-[#121212]'
                      : isToday
                      ? 'border border-[#555] bg-[#242424]'
                      : 'bg-[#262626] hover:bg-[#333]'
                  }`}
                >
                  {done ? '✓' : ''}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const HabitsChecklist: React.FC<HabitsChecklistProps> = ({
  habits,
  onToggleHabit,
  onOpenEditModal,
}) => {
  const todayKey = formatDateKey();
  const past7Days = getPastNDays(7);

  const completedTodayCount = habits.filter((h) =>
    isHabitCompletedOn(h, todayKey)
  ).length;

  return (
    <section className="bg-[#181818] border border-[#262626] rounded-xl p-5 sm:p-7 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#242424]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base select-none shrink-0">📋</span>
          <h2 className="text-sm font-semibold tracking-tight text-[#E6E6E6] truncate">
            Daily Anchor Habits
          </h2>
          <span className="text-xs text-[#777] font-mono tabular-nums shrink-0">
            {completedTodayCount}/{habits.length}
          </span>
        </div>

        <button
          onClick={() => {
            haptics.light();
            onOpenEditModal();
          }}
          className="text-xs text-[#888] hover:text-[#E0E0E0] px-2.5 py-1 rounded hover:bg-[#242424] transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Customize</span>
        </button>
      </div>

      {/* Gesture Hint Bar */}
      <div className="py-2.5 px-3 my-3 bg-[#141414] rounded-lg border border-[#222] flex items-center justify-between text-[11px] text-[#7A7A7A]">
        <div className="flex items-center gap-1.5 text-emerald-400/90 font-mono">
          <ArrowRight className="w-3 h-3" />
          <span>Swipe right to Complete</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-400/90 font-mono">
          <span>Swipe left to Skip</span>
          <ArrowLeft className="w-3 h-3" />
        </div>
      </div>

      {/* Habit List with Physics Animations */}
      <div className="space-y-2 mt-2">
        {habits.map((habit, index) => (
          <SwipeableHabitCard
            key={habit.id}
            habit={habit}
            index={index}
            todayKey={todayKey}
            past7Days={past7Days}
            onToggleHabit={onToggleHabit}
          />
        ))}
      </div>

      {/* Footer note */}
      <div className="mt-4 pt-3 border-t border-[#222] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-[#6E6E6E]">
        <span>Interactive dismissible cards · Auto-resets each calendar day</span>
        <span>Tap dots to toggle past 7 days</span>
      </div>
    </section>
  );
};
