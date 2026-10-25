import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateBadges, ALL_BADGES } from './badgesLogic.ts';
import { Habit, UrgeEntry } from '../types/index.ts';

test('evaluateBadges unlocks streak badges according to max days clean', () => {
  const habits: Habit[] = [];
  const urges: UrgeEntry[] = [];

  // Streak: 3 days clean -> should unlock 1day and 3day badges, but not 7day
  const result = evaluateBadges(3, 3, habits, urges);
  const badge1 = result.badges.find((b) => b.id === 'badge-1day');
  const badge3 = result.badges.find((b) => b.id === 'badge-3day');
  const badge7 = result.badges.find((b) => b.id === 'badge-7day');

  assert.equal(badge1?.isUnlocked, true);
  assert.equal(badge3?.isUnlocked, true);
  assert.equal(badge7?.isUnlocked, false);
  assert.equal(badge7?.progressPercent, Math.round((3 / 7) * 100));
});

test('evaluateBadges unlocks habit milestone when habit is completed', () => {
  const habits: Habit[] = [
    {
      id: 'h1',
      title: 'Habit 1',
      icon: '💧',
      completionDates: ['2026-10-25'],
    },
  ];

  const result = evaluateBadges(0, 0, habits, []);
  const firstHabitBadge = result.badges.find((b) => b.id === 'badge-first-habit');
  assert.equal(firstHabitBadge?.isUnlocked, true);
});

test('evaluateBadges unlocks urge surfer badge when an urge was surfed and completed', () => {
  const urges: UrgeEntry[] = [
    {
      id: 'u1',
      timestamp: '2026-10-25T10:00:00Z',
      intensity: 7,
      trigger: 'Stress',
      surfedCompleted: true,
    },
  ];

  const result = evaluateBadges(0, 0, [], urges);
  const surferBadge = result.badges.find((b) => b.id === 'badge-first-urge-surfed');
  assert.equal(surferBadge?.isUnlocked, true);

  const fiveUrgesBadge = result.badges.find((b) => b.id === 'badge-five-urges');
  assert.equal(fiveUrgesBadge?.isUnlocked, false);
  assert.equal(fiveUrgesBadge?.currentCount, 1);
});

test('evaluateBadges unlocks Strava and accountability badges when metrics reach threshold', () => {
  const result = evaluateBadges(0, 0, [], [], {}, '2026-10-25', 1, 1);
  const stravaBadge = result.badges.find((b) => b.id === 'badge-strava');
  const accountabilityBadge = result.badges.find((b) => b.id === 'badge-accountability');

  assert.equal(stravaBadge?.isUnlocked, true);
  assert.equal(accountabilityBadge?.isUnlocked, true);
});
