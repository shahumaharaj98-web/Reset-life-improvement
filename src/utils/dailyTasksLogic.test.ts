import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateUnfinishedTasksWarning,
  getYesterdayDateKey,
  getTomorrowDateKey,
  checkPreviousDayExpiredTasks,
  rolloverUnfinishedTasks,
  migrateTaskToNextDay,
  reviewAndRolloverTasks,
} from './dailyTasksLogic.ts';
import { DailyTask, DailyDayPlan } from '../types/index.ts';

test('getYesterdayDateKey returns the preceding calendar date correctly', () => {
  assert.equal(getYesterdayDateKey('2026-10-25'), '2026-10-24');
  assert.equal(getYesterdayDateKey('2026-03-01'), '2026-02-28');
});

test('evaluateUnfinishedTasksWarning warns when hours until midnight are low', () => {
  const tasks: DailyTask[] = [
    { id: '1', title: 'Task 1', completed: true, dateKey: '2026-10-25', createdTimestamp: '' },
    { id: '2', title: 'Task 2', completed: false, dateKey: '2026-10-25', createdTimestamp: '' },
  ];

  // At 11:00 PM (1 hour to midnight) -> urgent warning
  const lateEvening = new Date(2026, 9, 25, 23, 0, 0);
  const urgentResult = evaluateUnfinishedTasksWarning(tasks, lateEvening);
  assert.equal(urgentResult.hasWarning, true);
  assert.equal(urgentResult.urgency, 'urgent');
  assert.equal(urgentResult.unfinishedCount, 1);

  // When all tasks completed
  const allCompleted: DailyTask[] = [
    { id: '1', title: 'Task 1', completed: true, dateKey: '2026-10-25', createdTimestamp: '' },
  ];
  const doneResult = evaluateUnfinishedTasksWarning(allCompleted, lateEvening);
  assert.equal(doneResult.hasWarning, false);
  assert.equal(doneResult.unfinishedCount, 0);
});

test('rolloverUnfinishedTasks successfully carries over uncompleted tasks to today', () => {
  const planner: Record<string, DailyDayPlan> = {
    '2026-10-24': {
      note: 'Yesterday note',
      tasks: [
        { id: '1', title: 'Finished item', completed: true, dateKey: '2026-10-24', createdTimestamp: '' },
        { id: '2', title: 'Unfinished project', completed: false, dateKey: '2026-10-24', createdTimestamp: '' },
      ],
    },
    '2026-10-25': {
      note: 'Today note',
      tasks: [],
    },
  };

  const { updatedPlanner, rolledOverCount } = rolloverUnfinishedTasks(planner, '2026-10-24', '2026-10-25');
  assert.equal(rolledOverCount, 1);
  assert.equal(updatedPlanner['2026-10-25'].tasks.length, 1);
  assert.equal(updatedPlanner['2026-10-25'].tasks[0].title, 'Unfinished project');
  assert.equal(updatedPlanner['2026-10-25'].tasks[0].completed, false);
});

test('getTomorrowDateKey calculates following day properly across months', () => {
  assert.equal(getTomorrowDateKey('2026-10-25'), '2026-10-26');
  assert.equal(getTomorrowDateKey('2026-10-31'), '2026-11-01');
});

test('migrateTaskToNextDay moves single task to tomorrow and can prioritize', () => {
  const planner: Record<string, DailyDayPlan> = {
    '2026-10-25': {
      note: 'Today plan',
      tasks: [
        { id: 't1', title: 'Buy groceries', completed: false, dateKey: '2026-10-25', createdTimestamp: '', priority: 'normal' },
        { id: 't2', title: 'Read book', completed: true, dateKey: '2026-10-25', createdTimestamp: '' },
      ],
    },
  };

  const { updatedPlanner, migratedTask } = migrateTaskToNextDay(planner, 't1', '2026-10-25', { prioritize: true });
  assert.ok(migratedTask);
  assert.equal(migratedTask?.title, 'Buy groceries');
  assert.equal(migratedTask?.priority, 'high');
  assert.equal(migratedTask?.rolledOverFrom, '2026-10-25');
  assert.equal(migratedTask?.dateKey, '2026-10-26');

  // t1 should be removed from source day
  assert.equal(updatedPlanner['2026-10-25'].tasks.length, 1);
  assert.equal(updatedPlanner['2026-10-25'].tasks[0].id, 't2');

  // t1 migrated into tomorrow
  assert.equal(updatedPlanner['2026-10-26'].tasks.length, 1);
  assert.equal(updatedPlanner['2026-10-26'].tasks[0].title, 'Buy groceries');
  assert.equal(updatedPlanner['2026-10-26'].tasks[0].priority, 'high');
});

test('reviewAndRolloverTasks handles batch EOD review choices correctly', () => {
  const planner: Record<string, DailyDayPlan> = {
    '2026-10-25': {
      note: 'Day note',
      tasks: [
        { id: 't1', title: 'Pay bills', completed: false, dateKey: '2026-10-25', createdTimestamp: '' },
        { id: 't2', title: 'File receipts', completed: false, dateKey: '2026-10-25', createdTimestamp: '' },
        { id: 't3', title: 'Unimportant task', completed: false, dateKey: '2026-10-25', createdTimestamp: '' },
      ],
    },
  };

  const decisions = [
    { taskId: 't1', action: 'rollover_priority' as const },
    { taskId: 't2', action: 'rollover_normal' as const },
    { taskId: 't3', action: 'dismiss' as const },
  ];

  const result = reviewAndRolloverTasks(planner, decisions, '2026-10-25', '2026-10-26');
  assert.equal(result.rolledOverCount, 2);
  assert.equal(result.dismissedCount, 1);

  // Source day now has no remaining tasks
  assert.equal(result.updatedPlanner['2026-10-25'].tasks.length, 0);

  // Target day has 2 rolled over tasks
  const tomorrowTasks = result.updatedPlanner['2026-10-26'].tasks;
  assert.equal(tomorrowTasks.length, 2);
  const prioritized = tomorrowTasks.find((t) => t.title === 'Pay bills');
  assert.equal(prioritized?.priority, 'high');
  const normal = tomorrowTasks.find((t) => t.title === 'File receipts');
  assert.equal(normal?.priority, 'normal');
});
