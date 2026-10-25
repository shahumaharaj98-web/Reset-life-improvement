import { DailyDayPlan, DailyTask } from '../types/index.ts';
import { formatDateKey, parseDateKey } from './resetLogic.ts';

export interface UnfinishedWarningResult {
  hasWarning: boolean;
  unfinishedCount: number;
  totalCount: number;
  urgency: 'none' | 'notice' | 'urgent';
  message: string;
}

export function getYesterdayDateKey(todayKey: string = formatDateKey()): string {
  const date = parseDateKey(todayKey);
  date.setDate(date.getDate() - 1);
  return formatDateKey(date);
}

/**
 * Calculates how many hours remain until midnight in local time.
 */
export function getHoursUntilMidnight(now: Date = new Date()): number {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diffMs = midnight.getTime() - now.getTime();
  return Math.max(0, diffMs / (1000 * 60 * 60));
}

/**
 * Evaluates pending tasks for today and warns if tasks remain unfinished
 * before midnight reset.
 */
export function evaluateUnfinishedTasksWarning(
  tasks: DailyTask[],
  now: Date = new Date()
): UnfinishedWarningResult {
  if (!tasks || tasks.length === 0) {
    return {
      hasWarning: false,
      unfinishedCount: 0,
      totalCount: 0,
      urgency: 'none',
      message: '',
    };
  }

  const unfinished = tasks.filter((t) => !t.completed);
  const unfinishedCount = unfinished.length;
  const totalCount = tasks.length;

  if (unfinishedCount === 0) {
    return {
      hasWarning: false,
      unfinishedCount: 0,
      totalCount,
      urgency: 'none',
      message: 'All daily tasks completed! Clean slate for today.',
    };
  }

  const hoursRemaining = getHoursUntilMidnight(now);

  if (hoursRemaining <= 4) {
    return {
      hasWarning: true,
      unfinishedCount,
      totalCount,
      urgency: 'urgent',
      message: `Critical Warning: ${unfinishedCount} unfinished task${unfinishedCount === 1 ? '' : 's'} remaining before midnight auto-reset (${Math.ceil(hoursRemaining)}h left).`,
    };
  } else if (hoursRemaining <= 8) {
    return {
      hasWarning: true,
      unfinishedCount,
      totalCount,
      urgency: 'notice',
      message: `Evening Reminder: ${unfinishedCount} task${unfinishedCount === 1 ? '' : 's'} left to wrap up today.`,
    };
  }

  return {
    hasWarning: false,
    unfinishedCount,
    totalCount,
    urgency: 'none',
    message: `${unfinishedCount} task${unfinishedCount === 1 ? '' : 's'} remaining for today.`,
  };
}

/**
 * Check if yesterday had unfinished tasks that expired.
 */
export function checkPreviousDayExpiredTasks(
  planner: Record<string, DailyDayPlan>,
  todayKey: string = formatDateKey()
): { hasExpiredTasks: boolean; expiredCount: number; yesterdayKey: string } {
  const yesterdayKey = getYesterdayDateKey(todayKey);
  const yesterdayPlan = planner[yesterdayKey];

  if (!yesterdayPlan || !yesterdayPlan.tasks) {
    return { hasExpiredTasks: false, expiredCount: 0, yesterdayKey };
  }

  const unfinished = yesterdayPlan.tasks.filter((t) => !t.completed);
  return {
    hasExpiredTasks: unfinished.length > 0,
    expiredCount: unfinished.length,
    yesterdayKey,
  };
}

/**
 * Carries over unfinished tasks from a previous day into today's task list.
 */
export function rolloverUnfinishedTasks(
  planner: Record<string, DailyDayPlan>,
  fromKey: string,
  toKey: string = formatDateKey()
): { updatedPlanner: Record<string, DailyDayPlan>; rolledOverCount: number } {
  const sourcePlan = planner[fromKey];
  if (!sourcePlan || !sourcePlan.tasks) {
    return { updatedPlanner: planner, rolledOverCount: 0 };
  }

  const unfinished = sourcePlan.tasks.filter((t) => !t.completed);
  if (unfinished.length === 0) {
    return { updatedPlanner: planner, rolledOverCount: 0 };
  }

  const targetPlan = planner[toKey] || { note: '', tasks: [] };
  const existingTitles = new Set(targetPlan.tasks.map((t) => t.title.toLowerCase().trim()));

  const newTasks: DailyTask[] = [];
  for (const t of unfinished) {
    if (!existingTitles.has(t.title.toLowerCase().trim())) {
      newTasks.push({
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: t.title,
        completed: false,
        dateKey: toKey,
        createdTimestamp: new Date().toISOString(),
      });
    }
  }

  // Mark source tasks as rolled over (or keep source untouched and append to target)
  const updatedPlanner = {
    ...planner,
    [toKey]: {
      ...targetPlan,
      tasks: [...targetPlan.tasks, ...newTasks],
    },
  };

  return {
    updatedPlanner,
    rolledOverCount: newTasks.length,
  };
}

export function getTomorrowDateKey(todayKey: string = formatDateKey()): string {
  const date = parseDateKey(todayKey);
  date.setDate(date.getDate() + 1);
  return formatDateKey(date);
}

/**
 * Returns whether current time is considered End of Day (EOD)
 * (by default after 5:00 PM or less than 7 hours before midnight).
 */
export function isEODTime(now: Date = new Date()): boolean {
  return now.getHours() >= 17 || getHoursUntilMidnight(now) <= 7;
}

export interface TaskDecision {
  taskId: string;
  action: 'rollover_priority' | 'rollover_normal' | 'dismiss' | 'keep';
}

/**
 * Migrates an individual task to the next day immediately.
 * Optionally elevates its priority to 'high' and stamps `rolledOverFrom`.
 */
export function migrateTaskToNextDay(
  planner: Record<string, DailyDayPlan>,
  taskId: string,
  fromDateKey: string = formatDateKey(),
  options: { prioritize?: boolean } = {}
): { updatedPlanner: Record<string, DailyDayPlan>; migratedTask?: DailyTask } {
  const sourcePlan = planner[fromDateKey];
  if (!sourcePlan) return { updatedPlanner: planner };

  const targetTask = sourcePlan.tasks.find((t) => t.id === taskId);
  if (!targetTask) return { updatedPlanner: planner };

  const tomorrowKey = getTomorrowDateKey(fromDateKey);
  const targetPlan = planner[tomorrowKey] || { note: '', tasks: [] };

  const migratedTask: DailyTask = {
    id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: targetTask.title,
    completed: false,
    dateKey: tomorrowKey,
    createdTimestamp: new Date().toISOString(),
    priority: options.prioritize ? 'high' : (targetTask.priority || 'normal'),
    rolledOverFrom: fromDateKey,
  };

  // Remove or mark from source day so it doesn't duplicate
  const updatedSourceTasks = sourcePlan.tasks.filter((t) => t.id !== taskId);

  const updatedPlanner: Record<string, DailyDayPlan> = {
    ...planner,
    [fromDateKey]: {
      ...sourcePlan,
      tasks: updatedSourceTasks,
    },
    [tomorrowKey]: {
      ...targetPlan,
      tasks: [...targetPlan.tasks, migratedTask],
    },
  };

  return { updatedPlanner, migratedTask };
}

/**
 * Processes batch decisions for unfinished tasks during EOD review.
 */
export function reviewAndRolloverTasks(
  planner: Record<string, DailyDayPlan>,
  decisions: TaskDecision[],
  fromDateKey: string = formatDateKey(),
  toDateKey: string = getTomorrowDateKey(fromDateKey)
): { updatedPlanner: Record<string, DailyDayPlan>; rolledOverCount: number; dismissedCount: number } {
  const sourcePlan = planner[fromDateKey];
  if (!sourcePlan) return { updatedPlanner: planner, rolledOverCount: 0, dismissedCount: 0 };

  const targetPlan = planner[toDateKey] || { note: '', tasks: [] };
  const decisionMap = new Map<string, TaskDecision['action']>(
    decisions.map((d) => [d.taskId, d.action])
  );

  const keptTasks: DailyTask[] = [];
  const newTargetTasks: DailyTask[] = [];
  let rolledOverCount = 0;
  let dismissedCount = 0;

  for (const task of sourcePlan.tasks) {
    const action = decisionMap.get(task.id);
    if (!action || action === 'keep') {
      keptTasks.push(task);
    } else if (action === 'dismiss') {
      dismissedCount++;
      // Not kept on source, not added to target
    } else if (action === 'rollover_priority' || action === 'rollover_normal') {
      rolledOverCount++;
      newTargetTasks.push({
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: task.title,
        completed: false,
        dateKey: toDateKey,
        createdTimestamp: new Date().toISOString(),
        priority: action === 'rollover_priority' ? 'high' : (task.priority || 'normal'),
        rolledOverFrom: fromDateKey,
      });
    }
  }

  const updatedPlanner: Record<string, DailyDayPlan> = {
    ...planner,
    [fromDateKey]: {
      ...sourcePlan,
      tasks: keptTasks,
    },
    [toDateKey]: {
      ...targetPlan,
      tasks: [...targetPlan.tasks, ...newTargetTasks],
    },
  };

  return {
    updatedPlanner,
    rolledOverCount,
    dismissedCount,
  };
}

export function getDefaultPlannerState(todayKey: string = formatDateKey()): Record<string, DailyDayPlan> {
  return {
    [todayKey]: {
      note: 'Focus for today: Protect energy after 6 PM. Complete the hardest task before lunch.',
      tasks: [
        {
          id: 'task-1',
          title: 'Review weekly priorities and schedule deep work',
          completed: true,
          dateKey: todayKey,
          createdTimestamp: new Date().toISOString(),
          priority: 'high',
        },
        {
          id: 'task-2',
          title: 'Hydrate (1.5L) before afternoon coffee',
          completed: true,
          dateKey: todayKey,
          createdTimestamp: new Date().toISOString(),
          priority: 'normal',
        },
        {
          id: 'task-3',
          title: '30m walk outside without listening to podcasts or phone',
          completed: false,
          dateKey: todayKey,
          createdTimestamp: new Date().toISOString(),
          priority: 'medium',
        },
      ],
    },
  };
}
