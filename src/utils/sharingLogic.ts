import { Habit, ResetTrack, UrgeEntry, DailyDayPlan, StravaActivity, AccountabilityReportSnapshot } from '../types/index.ts';
import { formatDateKey } from './resetLogic.ts';

/**
 * Keywords in habit titles that relate to exercise/workouts from Strava
 */
export const EXERCISE_HABIT_KEYWORDS = [
  'run',
  'running',
  'walk',
  'walking',
  'workout',
  'exercise',
  'gym',
  'train',
  'training',
  'cardio',
  'fitness',
  'stretch',
  'movement',
  'lift',
  'cycling',
  'ride',
  'swim',
  'yoga',
];

/**
 * Checks if a habit title matches typical Strava fitness activities
 */
export function isFitnessHabit(habitTitle: string): boolean {
  const lower = habitTitle.toLowerCase();
  return EXERCISE_HABIT_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Extracts unique dates (YYYY-MM-DD) from a list of Strava activities
 */
export function getDatesFromActivities(activities: StravaActivity[]): string[] {
  const datesSet = new Set<string>();
  for (const act of activities) {
    if (act.start_date_local) {
      const datePart = act.start_date_local.substring(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        datesSet.add(datePart);
      }
    }
  }
  return Array.from(datesSet).sort();
}

/**
 * Synchronizes workout activities from Strava into matching fitness habits.
 * Returns an array of updated habits with newly completed dates added.
 */
export function syncActivitiesToHabits(
  activities: StravaActivity[],
  habits: Habit[]
): {
  updatedHabits: Habit[];
  datesSynced: string[];
  matchedHabitsCount: number;
} {
  const activityDates = getDatesFromActivities(activities);
  let matchedHabitsCount = 0;
  const newlySyncedDates = new Set<string>();

  const updatedHabits = habits.map((habit) => {
    // Check if habit matches fitness keywords or if all habits should be checked
    const matches = isFitnessHabit(habit.title);
    if (!matches) {
      return habit;
    }

    matchedHabitsCount++;
    const currentDatesSet = new Set(habit.completionDates);
    let changed = false;

    for (const d of activityDates) {
      if (!currentDatesSet.has(d)) {
        currentDatesSet.add(d);
        newlySyncedDates.add(d);
        changed = true;
      }
    }

    if (!changed) {
      return habit;
    }

    return {
      ...habit,
      completionDates: Array.from(currentDatesSet).sort(),
    };
  });

  return {
    updatedHabits,
    datesSynced: Array.from(newlySyncedDates).sort(),
    matchedHabitsCount,
  };
}

/**
 * Generates an engaging, formatted text update suitable for instant sharing.
 */
export function generateShareText(params: {
  trackName: string;
  daysClean: number;
  motto: string;
  completedHabitsToday: number;
  totalHabits: number;
  badgesCount?: number;
  todayQuote?: string;
}): string {
  const {
    trackName,
    daysClean,
    motto,
    completedHabitsToday,
    totalHabits,
    badgesCount = 0,
    todayQuote,
  } = params;

  const streakUnit = daysClean === 1 ? 'Day' : 'Days';
  let text = `🔥 Reset Progress: ${daysClean} ${streakUnit} Clean on ${trackName}!\n\n`;

  if (motto) {
    text += `🎯 Focus: "${motto}"\n`;
  }

  text += `⚡ Anchor Habits: ${completedHabitsToday}/${totalHabits} completed today\n`;

  if (badgesCount > 0) {
    text += `🏆 Achievements: ${badgesCount} badges earned\n`;
  }

  if (todayQuote) {
    text += `\n💬 Daily Stoic Thought:\n"${todayQuote}"\n`;
  }

  text += `\nTracked with Reset — Minimalist Habit & Sobriety Dashboard.`;

  return text;
}

/**
 * Creates an accountability snapshot summary.
 */
export function buildAccountabilitySnapshot(
  track: ResetTrack,
  daysClean: number,
  todayKey: string = formatDateKey()
): AccountabilityReportSnapshot {
  const todayCompletedHabits = track.habits.filter((h) =>
    h.completionDates.includes(todayKey)
  ).length;

  const totalUrgesSurfed = track.urges.filter((u) => u.surfedCompleted).length;

  // Calculate 14-day adherence
  let totalOpportunities = track.habits.length * 14;
  let totalCompletions = 0;
  const now = new Date();

  for (let i = 0; i < 14; i++) {
    const d = new Date(now.getTime() - i * 86400 * 1000);
    const key = d.toISOString().substring(0, 10);
    for (const h of track.habits) {
      if (h.completionDates.includes(key)) {
        totalCompletions++;
      }
    }
  }

  const adherencePercent =
    totalOpportunities > 0
      ? Math.round((totalCompletions / totalOpportunities) * 100)
      : 100;

  return {
    trackName: track.name,
    trackIcon: track.icon || '🌱',
    daysClean,
    longestStreakDays: track.longestStreakDays,
    motto: track.motto,
    generatedAt: new Date().toISOString(),
    habitsCompletedToday: todayCompletedHabits,
    totalHabits: track.habits.length,
    urgesSurfedTotal: totalUrgesSurfed,
    badgesUnlockedCount: 0,
    recentHabitAdherencePercent: adherencePercent,
  };
}

/**
 * Encodes an accountability snapshot to a URL-safe Base64 string
 */
export function encodeAccountabilitySnapshot(snapshot: AccountabilityReportSnapshot): string {
  try {
    const json = JSON.stringify(snapshot);
    if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
      return encodeURIComponent(btoa(encodeURIComponent(json)));
    }
    return encodeURIComponent(Buffer.from(json).toString('base64'));
  } catch {
    return '';
  }
}

/**
 * Decodes an accountability snapshot from a URL-safe Base64 string
 */
export function decodeAccountabilitySnapshot(hash: string): AccountabilityReportSnapshot | null {
  try {
    const cleanHash = decodeURIComponent(hash).replace(/^#?(partner-report=|share=)?/, '');
    let jsonStr = '';
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      jsonStr = decodeURIComponent(atob(cleanHash));
    } else {
      jsonStr = Buffer.from(cleanHash, 'base64').toString('utf8');
    }
    const parsed = JSON.parse(jsonStr);
    if (parsed && typeof parsed.daysClean === 'number' && parsed.trackName) {
      return parsed as AccountabilityReportSnapshot;
    }
  } catch {
    return null;
  }
  return null;
}
