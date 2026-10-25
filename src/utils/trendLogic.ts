import { Habit, UrgeEntry } from '../types/index.ts';
import { formatDateKey } from './resetLogic.ts';

export interface WeeklyTrendBucket {
  id: string;
  weekLabel: string;
  shortLabel: string;
  startDate: string;
  endDate: string;
  habitCompletionRate: number; // percentage 0 - 100
  totalHabitsCompleted: number;
  totalHabitOpportunities: number;
  urgeCount: number;
  avgUrgeIntensity: number;
}

export interface StreakTrendSummary {
  weeklyData: WeeklyTrendBucket[];
  overallAvgHabitRate: number;
  totalUrges30Days: number;
  habitRateChange: number; // difference between latest week and first week
  urgeCountChange: number; // difference in urges between latest week and first week
  trendInsight: string;
}

/**
 * Calculates weekly progression over the last 30 days (4 distinct weekly intervals).
 */
export function calculateStreakTrendData(
  habits: Habit[],
  urges: UrgeEntry[],
  referenceDate: Date = new Date()
): StreakTrendSummary {
  const weeklyData: WeeklyTrendBucket[] = [];

  // Break the last 28-30 days into 4 consecutive 7-day blocks:
  // Week 1: Day -27 to -21
  // Week 2: Day -20 to -14
  // Week 3: Day -13 to -7
  // Week 4 (Current): Day -6 to Day 0
  const totalWeeks = 4;
  const daysPerWeek = 7;

  let grandTotalHabitsCompleted = 0;
  let grandTotalHabitsPossible = 0;
  let totalUrges30Days = 0;

  for (let w = totalWeeks - 1; w >= 0; w--) {
    const startOffset = w * daysPerWeek + (daysPerWeek - 1);
    const endOffset = w * daysPerWeek;

    const startD = new Date(referenceDate);
    startD.setDate(startD.getDate() - startOffset);

    const endD = new Date(referenceDate);
    endD.setDate(endD.getDate() - endOffset);

    const startKey = formatDateKey(startD);
    const endKey = formatDateKey(endD);

    const startStr = startD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = endD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const weekLabel = `${startStr} – ${endStr}`;
    const shortLabel = w === 0 ? 'Current' : `Wk -${w}`;

    // Compute habit completions in this 7-day range
    let weekHabitsCompleted = 0;
    const weekHabitsPossible = habits.length * daysPerWeek;

    // Check each day in the week
    for (let d = 0; d < daysPerWeek; d++) {
      const cur = new Date(startD);
      cur.setDate(cur.getDate() + d);
      const dayKey = formatDateKey(cur);

      for (const h of habits) {
        if (h.completionDates.includes(dayKey)) {
          weekHabitsCompleted++;
        }
      }
    }

    // Compute urges in this range
    let weekUrgeCount = 0;
    let weekUrgeIntensitySum = 0;

    for (const urge of urges) {
      const urgeDate = new Date(urge.timestamp);
      if (!isNaN(urgeDate.getTime())) {
        const uKey = formatDateKey(urgeDate);
        if (uKey >= startKey && uKey <= endKey) {
          weekUrgeCount++;
          weekUrgeIntensitySum += urge.intensity;
          totalUrges30Days++;
        }
      }
    }

    const habitRate = weekHabitsPossible > 0
      ? Math.round((weekHabitsCompleted / weekHabitsPossible) * 100)
      : 0;

    const avgIntensity = weekUrgeCount > 0
      ? Number((weekUrgeIntensitySum / weekUrgeCount).toFixed(1))
      : 0;

    grandTotalHabitsCompleted += weekHabitsCompleted;
    grandTotalHabitsPossible += weekHabitsPossible;

    weeklyData.push({
      id: `week-${w}`,
      weekLabel,
      shortLabel,
      startDate: startKey,
      endDate: endKey,
      habitCompletionRate: habitRate,
      totalHabitsCompleted: weekHabitsCompleted,
      totalHabitOpportunities: weekHabitsPossible,
      urgeCount: weekUrgeCount,
      avgUrgeIntensity: avgIntensity,
    });
  }

  const overallAvgHabitRate = grandTotalHabitsPossible > 0
    ? Math.round((grandTotalHabitsCompleted / grandTotalHabitsPossible) * 100)
    : 0;

  const firstWeek = weeklyData[0];
  const latestWeek = weeklyData[weeklyData.length - 1];

  const habitRateChange = latestWeek ? latestWeek.habitCompletionRate - firstWeek.habitCompletionRate : 0;
  const urgeCountChange = latestWeek ? latestWeek.urgeCount - firstWeek.urgeCount : 0;

  let trendInsight = 'Keep logging habits and urges to establish long-term trajectory patterns.';
  if (habitRateChange > 0 && urgeCountChange <= 0) {
    trendInsight = `Habit consistency improved by +${habitRateChange}% over the month while cravings decreased. Positive neurological rewiring is taking hold.`;
  } else if (habitRateChange >= 0 && urgeCountChange > 0) {
    trendInsight = `Slight uptick in urge activity this week (+${urgeCountChange}). Strengthen anchor habits and prepare grounding techniques before peak hours.`;
  } else if (habitRateChange < 0) {
    trendInsight = `Habit completion dipped slightly by ${Math.abs(habitRateChange)}% compared to earlier weeks. Focus on completing just 1 anchor habit tomorrow morning.`;
  } else {
    trendInsight = `Stable baseline: ${overallAvgHabitRate}% average habit consistency maintained across the last 30 days.`;
  }

  return {
    weeklyData,
    overallAvgHabitRate,
    totalUrges30Days,
    habitRateChange,
    urgeCountChange,
    trendInsight,
  };
}
