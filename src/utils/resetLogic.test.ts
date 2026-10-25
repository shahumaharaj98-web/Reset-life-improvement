import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCleanStreak,
  calculateMilestoneProgress,
  formatDateKey,
  toggleHabitDate,
  calculateHabitStreak,
  summarizeUrges,
  getHourlyUrgeDistribution,
  MILESTONES,
} from './resetLogic.ts';
import { Habit, UrgeEntry } from '../types/index.ts';

test('formatDateKey formats date properly as YYYY-MM-DD', () => {
  const d = new Date(2026, 9, 25, 10, 0, 0); // October 25, 2026
  assert.equal(formatDateKey(d), '2026-10-25');
});

test('calculateCleanStreak computes days, hours, minutes, and seconds accurately', () => {
  const start = '2026-10-20T00:00:00.000Z';
  const now = '2026-10-25T14:30:15.000Z'; // 5 days, 14 hours, 30 mins, 15 secs
  const result = calculateCleanStreak(start, now);
  
  assert.equal(result.days, 5);
  assert.equal(result.hours, 14);
  assert.equal(result.minutes, 30);
  assert.equal(result.seconds, 15);
  assert.ok(result.totalSeconds > 0);
  assert.ok(result.startDateFormatted.length > 0);
});

test('calculateCleanStreak gracefully handles invalid dates and future dates', () => {
  const invalid = calculateCleanStreak('not-a-date');
  assert.equal(invalid.days, 0);
  assert.equal(invalid.totalSeconds, 0);

  const future = calculateCleanStreak('2099-01-01T00:00:00.000Z', '2026-10-25T00:00:00.000Z');
  assert.equal(future.days, 0);
  assert.equal(future.totalSeconds, 0);
});

test('calculateMilestoneProgress identifies current and upcoming milestones correctly', () => {
  // Day 0: next is Day 1
  const m0 = calculateMilestoneProgress(0);
  assert.equal(m0.currentMilestone, null);
  assert.equal(m0.nextMilestone.days, 1);
  assert.equal(m0.daysRemaining, 1);
  assert.equal(m0.progressPercent, 0);

  // Day 5: between Day 3 and Day 7 (span = 4, achieved = 2, 50%)
  const m5 = calculateMilestoneProgress(5);
  assert.equal(m5.currentMilestone?.days, 3);
  assert.equal(m5.nextMilestone.days, 7);
  assert.equal(m5.daysRemaining, 2);
  assert.equal(m5.progressPercent, 50);

  // Day 100: beyond 90 days
  const m100 = calculateMilestoneProgress(100);
  assert.equal(m100.currentMilestone?.days, 90);
  assert.equal(m100.nextMilestone.days, 180);
});

test('toggleHabitDate toggles dates in completion array deterministically', () => {
  const initial: string[] = ['2026-10-20', '2026-10-21'];
  
  // Adding a new date
  const added = toggleHabitDate(initial, '2026-10-22');
  assert.deepEqual(added, ['2026-10-20', '2026-10-21', '2026-10-22']);

  // Removing an existing date
  const removed = toggleHabitDate(added, '2026-10-21');
  assert.deepEqual(removed, ['2026-10-20', '2026-10-22']);
});

test('calculateHabitStreak computes consecutive completed days', () => {
  const dates = ['2026-10-23', '2026-10-24', '2026-10-25'];
  const streak = calculateHabitStreak(dates, '2026-10-25');
  assert.equal(streak, 3);

  // If yesterday was completed but today is not completed yet, streak is still preserved
  const datesYesterday = ['2026-10-23', '2026-10-24'];
  const preservedStreak = calculateHabitStreak(datesYesterday, '2026-10-25');
  assert.equal(preservedStreak, 2);

  // Broken streak
  const brokenDates = ['2026-10-20', '2026-10-21'];
  const brokenStreak = calculateHabitStreak(brokenDates, '2026-10-25');
  assert.equal(brokenStreak, 0);
});

test('summarizeUrges accurately calculates totals, averages, and top triggers', () => {
  const urges: UrgeEntry[] = [
    {
      id: '1',
      timestamp: '2026-10-25T10:00:00Z',
      intensity: 8,
      trigger: 'Stress',
      surfedSeconds: 300,
    },
    {
      id: '2',
      timestamp: '2026-10-25T14:00:00Z',
      intensity: 6,
      trigger: 'Stress',
      surfedSeconds: 120,
    },
    {
      id: '3',
      timestamp: '2026-10-24T18:00:00Z',
      intensity: 4,
      trigger: 'Boredom',
      surfedSeconds: 60,
    },
  ];

  const summary = summarizeUrges(urges, '2026-10-25');
  assert.equal(summary.totalLogged, 3);
  assert.equal(summary.todayCount, 2);
  assert.equal(summary.averageIntensity, 6.0); // (8+6+4)/3 = 6.0
  assert.equal(summary.topTrigger, 'Stress');
  assert.equal(summary.totalSurfedMinutes, 8); // (300+120+60)/60 = 480/60 = 8 min
});

test('getHourlyUrgeDistribution properly aggregates 24h buckets and identifies peak hours', () => {
  const urges: UrgeEntry[] = [
    { id: '1', timestamp: '2026-10-25T22:15:00Z', intensity: 8, trigger: 'Stress' },
    { id: '2', timestamp: '2026-10-24T22:45:00Z', intensity: 7, trigger: 'Late Night' },
    { id: '3', timestamp: '2026-10-25T14:00:00Z', intensity: 5, trigger: 'Boredom' },
  ];

  const report = getHourlyUrgeDistribution(urges);
  assert.equal(report.hourlyBuckets.length, 24);
  assert.ok(report.maxHourlyCount >= 1);
  assert.ok(report.peakHour !== null);
  assert.ok(report.actionableInsight.length > 0);
});

