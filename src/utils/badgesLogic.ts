import { Habit, ResetTrack, UrgeEntry, DailyDayPlan } from '../types/index.ts';
import { formatDateKey } from './resetLogic.ts';

export type BadgeCategory = 'streak' | 'habits' | 'urges' | 'mindfulness';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  targetCount: number;
  unit: string;
}

export interface EvaluatedBadge extends BadgeDefinition {
  isUnlocked: boolean;
  currentCount: number;
  progressPercent: number;
}

export const ALL_BADGES: BadgeDefinition[] = [
  // Streak Badges
  {
    id: 'badge-1day',
    name: 'Day 1 Cleared',
    description: 'Broke the cycle and conquered the first 24 hours.',
    icon: '🌱',
    category: 'streak',
    targetCount: 1,
    unit: 'days clean',
  },
  {
    id: 'badge-3day',
    name: '3-Day Cleansing',
    description: 'Passed the critical 72-hour acute impulse threshold.',
    icon: '⚡',
    category: 'streak',
    targetCount: 3,
    unit: 'days clean',
  },
  {
    id: 'badge-7day',
    name: '1 Week Sovereign',
    description: 'One full week of unbroken discipline and clarity.',
    icon: '🛡️',
    category: 'streak',
    targetCount: 7,
    unit: 'days clean',
  },
  {
    id: 'badge-14day',
    name: 'Fortnight of Clarity',
    description: 'Two weeks clean. Compulsive pathways are actively pruning.',
    icon: '⚔️',
    category: 'streak',
    targetCount: 14,
    unit: 'days clean',
  },
  {
    id: 'badge-30day',
    name: '30-Day Rewiring',
    description: 'A full month of freedom. Significant dopamine recovery.',
    icon: '👑',
    category: 'streak',
    targetCount: 30,
    unit: 'days clean',
  },
  {
    id: 'badge-90day',
    name: 'Total Neuro Reboot',
    description: '90 days clean. Complete baseline psychological transformation.',
    icon: '💎',
    category: 'streak',
    targetCount: 90,
    unit: 'days clean',
  },

  // Habit Badges
  {
    id: 'badge-first-habit',
    name: 'First Habit Milestone',
    description: 'Completed your first anchor habit on your reset journey.',
    icon: '🎯',
    category: 'habits',
    targetCount: 1,
    unit: 'habits done',
  },
  {
    id: 'badge-habit-trio',
    name: 'Full Daily Anchor',
    description: 'Completed all anchor habits in a single calendar day.',
    icon: '🔥',
    category: 'habits',
    targetCount: 1,
    unit: 'perfect days',
  },
  {
    id: 'badge-habit-streak',
    name: 'Habit Momentum',
    description: 'Maintained a 7-day streak on any single anchor habit.',
    icon: '📈',
    category: 'habits',
    targetCount: 7,
    unit: 'habit streak',
  },

  // Urges & Mindfulness Badges
  {
    id: 'badge-first-urge-surfed',
    name: 'Urge Surfer',
    description: 'Used the 5-minute timer to surf and overcome a craving.',
    icon: '🌊',
    category: 'urges',
    targetCount: 1,
    unit: 'urges surfed',
  },
  {
    id: 'badge-five-urges',
    name: 'Iron Interceptor',
    description: 'Overcame 5 distinct urges without compromising your streak.',
    icon: '🧘',
    category: 'urges',
    targetCount: 5,
    unit: 'urges overcome',
  },
  {
    id: 'badge-daily-mastery',
    name: 'Daily Task Finisher',
    description: 'Checked off all daily focus tasks before midnight reset.',
    icon: '✨',
    category: 'mindfulness',
    targetCount: 1,
    unit: 'clean slates',
  },
  {
    id: 'badge-strava',
    name: 'Endurance Sync',
    description: 'Connected Strava and synchronized fitness workouts with daily reset habits.',
    icon: '🏃',
    category: 'habits',
    targetCount: 1,
    unit: 'workouts synced',
  },
  {
    id: 'badge-accountability',
    name: 'Accountability Beacon',
    description: 'Generated and shared your reset progress with an accountability buddy.',
    icon: '🤝',
    category: 'mindfulness',
    targetCount: 1,
    unit: 'shares',
  },
];

/**
 * Automatically evaluates all achievements based on current track and planner state.
 */
export function evaluateBadges(
  currentStreakDays: number,
  longestStreakDays: number,
  habits: Habit[],
  urges: UrgeEntry[],
  planner: Record<string, DailyDayPlan> = {},
  todayKey: string = formatDateKey(),
  syncedWorkoutsCount: number = 0,
  sharedCount: number = 0
): { badges: EvaluatedBadge[]; unlockedCount: number; totalCount: number } {
  const maxStreak = Math.max(currentStreakDays, longestStreakDays);

  // 1. Total habits completed count across all time
  let totalHabitCompletions = 0;
  let maxHabitStreak = 0;
  let hasPerfectDay = false;

  // Track unique completion days
  const allDates = new Set<string>();
  for (const h of habits) {
    totalHabitCompletions += h.completionDates.length;
    for (const d of h.completionDates) {
      allDates.add(d);
    }
  }

  // Check if any single date had all habits completed
  if (habits.length > 0) {
    for (const d of allDates) {
      const allDone = habits.every((h) => h.completionDates.includes(d));
      if (allDone) {
        hasPerfectDay = true;
        break;
      }
    }
  }

  // Calculate max habit streak across all habits
  for (const h of habits) {
    let currentStreak = 0;
    const sorted = [...h.completionDates].sort();
    for (let i = 0; i < sorted.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const prev = new Date(sorted[i - 1]);
        const curr = new Date(sorted[i]);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (86400 * 1000));
        if (diffDays === 1) {
          currentStreak++;
        } else if (diffDays > 1) {
          currentStreak = 1;
        }
      }
      if (currentStreak > maxHabitStreak) {
        maxHabitStreak = currentStreak;
      }
    }
  }

  // 2. Urges surfed and overcome
  const surfedCompletedUrges = urges.filter((u) => u.surfedCompleted).length;

  // 3. Daily planner tasks completion
  const todayTasks = planner[todayKey]?.tasks || [];
  const hasFinishedAllTasksToday =
    todayTasks.length > 0 && todayTasks.every((t) => t.completed);

  const evaluated: EvaluatedBadge[] = ALL_BADGES.map((b) => {
    let current = 0;

    switch (b.id) {
      case 'badge-1day':
      case 'badge-3day':
      case 'badge-7day':
      case 'badge-14day':
      case 'badge-30day':
      case 'badge-90day':
        current = maxStreak;
        break;

      case 'badge-first-habit':
        current = totalHabitCompletions;
        break;

      case 'badge-habit-trio':
        current = hasPerfectDay ? 1 : 0;
        break;

      case 'badge-habit-streak':
        current = maxHabitStreak;
        break;

      case 'badge-first-urge-surfed':
      case 'badge-five-urges':
        current = surfedCompletedUrges;
        break;

      case 'badge-daily-mastery':
        current = hasFinishedAllTasksToday ? 1 : 0;
        break;

      case 'badge-strava':
        current = syncedWorkoutsCount;
        break;

      case 'badge-accountability':
        current = sharedCount;
        break;

      default:
        current = 0;
    }

    const isUnlocked = current >= b.targetCount;
    const progressPercent = Math.min(
      100,
      Math.max(0, Math.round((current / b.targetCount) * 100))
    );

    return {
      ...b,
      currentCount: current,
      isUnlocked,
      progressPercent,
    };
  });

  const unlockedCount = evaluated.filter((b) => b.isUnlocked).length;

  return {
    badges: evaluated,
    unlockedCount,
    totalCount: evaluated.length,
  };
}
