import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isFitnessHabit,
  getDatesFromActivities,
  syncActivitiesToHabits,
  generateShareText,
  encodeAccountabilitySnapshot,
  decodeAccountabilitySnapshot,
} from './sharingLogic.ts';
import { Habit, StravaActivity, AccountabilityReportSnapshot } from '../types/index.ts';

test('isFitnessHabit accurately matches exercise-related habits', () => {
  assert.equal(isFitnessHabit('Morning 5k Run'), true);
  assert.equal(isFitnessHabit('Evening Walk with Dog'), true);
  assert.equal(isFitnessHabit('Gym Workout 45m'), true);
  assert.equal(isFitnessHabit('Yoga & Stretching'), true);
  assert.equal(isFitnessHabit('Read 10 pages of Stoicism'), false);
  assert.equal(isFitnessHabit('Drink 2L Water'), false);
});

test('getDatesFromActivities extracts clean sorted YYYY-MM-DD dates', () => {
  const activities: StravaActivity[] = [
    {
      id: 1,
      name: 'Run 1',
      distance: 5000,
      moving_time: 1800,
      elapsed_time: 1800,
      type: 'Run',
      start_date_local: '2026-10-24T08:00:00Z',
    },
    {
      id: 2,
      name: 'Walk 1',
      distance: 3000,
      moving_time: 2000,
      elapsed_time: 2000,
      type: 'Walk',
      start_date_local: '2026-10-25T14:30:00Z',
    },
    {
      id: 3,
      name: 'Run 2',
      distance: 6000,
      moving_time: 2100,
      elapsed_time: 2100,
      type: 'Run',
      start_date_local: '2026-10-25T19:00:00Z', // duplicate date
    },
  ];

  const dates = getDatesFromActivities(activities);
  assert.deepEqual(dates, ['2026-10-24', '2026-10-25']);
});

test('syncActivitiesToHabits updates matching habits with workout dates', () => {
  const habits: Habit[] = [
    {
      id: 'h1',
      title: 'Daily 30m Workout',
      completionDates: ['2026-10-23'],
      icon: '🏋️',
    },
    {
      id: 'h2',
      title: 'No Social Media',
      completionDates: [],
      icon: '📵',
    },
  ];

  const activities: StravaActivity[] = [
    {
      id: 101,
      name: 'Evening Ride',
      distance: 12000,
      moving_time: 2400,
      elapsed_time: 2500,
      type: 'Ride',
      start_date_local: '2026-10-24T18:00:00Z',
    },
    {
      id: 102,
      name: 'Morning Run',
      distance: 5000,
      moving_time: 1800,
      elapsed_time: 1800,
      type: 'Run',
      start_date_local: '2026-10-25T07:30:00Z',
    },
  ];

  const result = syncActivitiesToHabits(activities, habits);
  assert.equal(result.matchedHabitsCount, 1);
  assert.deepEqual(result.datesSynced, ['2026-10-24', '2026-10-25']);

  const updatedFitnessHabit = result.updatedHabits.find((h) => h.id === 'h1');
  assert.ok(updatedFitnessHabit);
  assert.ok(updatedFitnessHabit.completionDates.includes('2026-10-23'));
  assert.ok(updatedFitnessHabit.completionDates.includes('2026-10-24'));
  assert.ok(updatedFitnessHabit.completionDates.includes('2026-10-25'));

  // Non-fitness habit should remain untouched
  const updatedDetoxHabit = result.updatedHabits.find((h) => h.id === 'h2');
  assert.deepEqual(updatedDetoxHabit?.completionDates, []);
});

test('generateShareText produces inspirational markdown text', () => {
  const text = generateShareText({
    trackName: 'Digital Detox',
    daysClean: 7,
    motto: 'Focus over distraction.',
    completedHabitsToday: 3,
    totalHabits: 3,
    badgesCount: 4,
    todayQuote: 'We suffer more often in imagination than in reality.',
  });

  assert.ok(text.includes('7 Days Clean on Digital Detox!'));
  assert.ok(text.includes('Focus: "Focus over distraction."'));
  assert.ok(text.includes('3/3 completed today'));
  assert.ok(text.includes('4 badges earned'));
  assert.ok(text.includes('We suffer more often in imagination'));
});

test('encodeAccountabilitySnapshot and decodeAccountabilitySnapshot roundtrip cleanly', () => {
  const snapshot: AccountabilityReportSnapshot = {
    trackName: 'Smoke Free',
    trackIcon: '🚭',
    daysClean: 14,
    longestStreakDays: 20,
    motto: 'Breathe free.',
    generatedAt: '2026-10-25T10:00:00.000Z',
    habitsCompletedToday: 2,
    totalHabits: 3,
    urgesSurfedTotal: 5,
    badgesUnlockedCount: 6,
    recentHabitAdherencePercent: 88,
  };

  const encoded = encodeAccountabilitySnapshot(snapshot);
  assert.ok(typeof encoded === 'string' && encoded.length > 10);

  const decoded = decodeAccountabilitySnapshot(encoded);
  assert.deepEqual(decoded, snapshot);
});
