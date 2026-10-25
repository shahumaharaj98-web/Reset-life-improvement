import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateStreakTrendData } from './trendLogic.ts';
import { Habit, UrgeEntry } from '../types/index.ts';

test('calculateStreakTrendData partitions 30 days into 4 sequential weekly buckets', () => {
  const refDate = new Date(2026, 9, 25); // Oct 25, 2026
  const habits: Habit[] = [
    {
      id: 'h1',
      title: 'Habit 1',
      icon: '💧',
      completionDates: ['2026-10-25', '2026-10-24', '2026-10-20'],
    },
    {
      id: 'h2',
      title: 'Habit 2',
      icon: '👟',
      completionDates: ['2026-10-25', '2026-10-18'],
    },
  ];
  const urges: UrgeEntry[] = [
    {
      id: 'u1',
      timestamp: '2026-10-25T12:00:00Z',
      intensity: 7,
      trigger: 'Stress',
    },
    {
      id: 'u2',
      timestamp: '2026-10-10T15:00:00Z',
      intensity: 5,
      trigger: 'Boredom',
    },
  ];

  const summary = calculateStreakTrendData(habits, urges, refDate);

  assert.equal(summary.weeklyData.length, 4);
  assert.ok(summary.overallAvgHabitRate >= 0);
  assert.equal(summary.totalUrges30Days, 2);
  assert.ok(summary.trendInsight.length > 0);

  // Latest week should contain the Oct 25 habit completions and urge
  const latestWeek = summary.weeklyData[summary.weeklyData.length - 1];
  assert.equal(latestWeek.urgeCount, 1);
  assert.ok(latestWeek.totalHabitsCompleted >= 2);
});

test('calculateStreakTrendData handles empty habits and urges without dividing by zero', () => {
  const summary = calculateStreakTrendData([], []);
  assert.equal(summary.weeklyData.length, 4);
  assert.equal(summary.overallAvgHabitRate, 0);
  assert.equal(summary.totalUrges30Days, 0);
  for (const bucket of summary.weeklyData) {
    assert.equal(bucket.habitCompletionRate, 0);
    assert.equal(bucket.urgeCount, 0);
  }
});
