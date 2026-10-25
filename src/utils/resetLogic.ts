import { Habit, Milestone, ResetAppState, UrgeEntry } from '../types/index.ts';

export const MILESTONES: Milestone[] = [
  { days: 1, label: 'Day 1', description: 'First 24 hours conquered. The cycle is broken.' },
  { days: 3, label: 'Day 3', description: '72-hour acute physical withdrawal threshold.' },
  { days: 7, label: '1 Week', description: 'One full week of self-control. Dopamine resets begin.' },
  { days: 14, label: '2 Weeks', description: 'Neural pathways begin pruning compulsive impulses.' },
  { days: 30, label: '30 Days', description: '1 Month clean! Massive baseline focus restored.' },
  { days: 60, label: '60 Days', description: 'New default identity is settling in.' },
  { days: 90, label: '90 Days', description: 'Total biological reboot. Full neurochemical reset.' },
  { days: 180, label: '6 Months', description: 'Half a year of uncompromised discipline.' },
  { days: 365, label: '1 Year', description: 'Full yearly circle. A completely transformed self.' },
];

export function formatDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

export interface CleanStreakResult {
  totalSeconds: number;
  totalDays: number; // floating point
  days: number; // floor integer
  hours: number;
  minutes: number;
  seconds: number;
  startDateFormatted: string;
}

export function calculateCleanStreak(
  startDateIso: string,
  nowIso?: string
): CleanStreakResult {
  const startMs = new Date(startDateIso).getTime();
  const nowMs = nowIso ? new Date(nowIso).getTime() : Date.now();
  
  if (isNaN(startMs)) {
    return {
      totalSeconds: 0,
      totalDays: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      startDateFormatted: 'Invalid date',
    };
  }

  const diffMs = Math.max(0, nowMs - startMs);
  const totalSeconds = Math.floor(diffMs / 1000);
  const totalDays = diffMs / (1000 * 60 * 60 * 24);

  const days = Math.floor(totalSeconds / 86400);
  const remainderSeconds = totalSeconds % 86400;
  const hours = Math.floor(remainderSeconds / 3600);
  const minutes = Math.floor((remainderSeconds % 3600) / 60);
  const seconds = remainderSeconds % 60;

  const startDateObj = new Date(startMs);
  const startDateFormatted = startDateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return {
    totalSeconds,
    totalDays,
    days,
    hours,
    minutes,
    seconds,
    startDateFormatted,
  };
}

export interface MilestoneProgress {
  currentMilestone: Milestone | null;
  nextMilestone: Milestone;
  progressPercent: number;
  daysRemaining: number;
}

export function calculateMilestoneProgress(currentDays: number): MilestoneProgress {
  const pastMilestones = MILESTONES.filter((m) => currentDays >= m.days);
  const currentMilestone = pastMilestones.length > 0 ? pastMilestones[pastMilestones.length - 1] : null;
  
  const upcomingMilestones = MILESTONES.filter((m) => m.days > currentDays);
  const nextMilestone = upcomingMilestones.length > 0 ? upcomingMilestones[0] : MILESTONES[MILESTONES.length - 1];

  const prevThreshold = currentMilestone ? currentMilestone.days : 0;
  const targetThreshold = nextMilestone.days;

  const span = targetThreshold - prevThreshold;
  const achievedInSpan = currentDays - prevThreshold;
  const rawPercent = span > 0 ? (achievedInSpan / span) * 100 : 100;
  const progressPercent = Math.min(100, Math.max(0, Math.round(rawPercent)));
  const daysRemaining = Math.max(0, targetThreshold - currentDays);

  return {
    currentMilestone,
    nextMilestone,
    progressPercent,
    daysRemaining,
  };
}

export function isHabitCompletedOn(habit: Habit, dateKey: string): boolean {
  return habit.completionDates.includes(dateKey);
}

export function toggleHabitDate(completionDates: string[], dateKey: string): string[] {
  const set = new Set(completionDates);
  if (set.has(dateKey)) {
    set.delete(dateKey);
  } else {
    set.add(dateKey);
  }
  return Array.from(set).sort();
}

export function calculateHabitStreak(completionDates: string[], referenceDateKey: string = formatDateKey()): number {
  const set = new Set(completionDates);
  if (set.size === 0) return 0;

  const refDate = parseDateKey(referenceDateKey);
  let streak = 0;

  // Check if today is completed
  const hasCompletedToday = set.has(referenceDateKey);
  
  // Starting point for streak loop
  const checkDate = new Date(refDate);
  if (!hasCompletedToday) {
    // If today is not completed yet, check if yesterday was completed
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const key = formatDateKey(checkDate);
    if (set.has(key)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function getPastNDays(n: number = 7, referenceDate: Date = new Date()): { dateKey: string; dayLabel: string; dayNum: number }[] {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - i);
    days.push({
      dateKey: formatDateKey(d),
      dayLabel: d.toLocaleDateString('en-US', { weekday: 'narrow' }), // M, T, W...
      dayNum: d.getDate(),
    });
  }
  return days;
}

export interface UrgeSummary {
  totalLogged: number;
  todayCount: number;
  averageIntensity: number;
  topTrigger: string;
  totalSurfedMinutes: number;
}

export function summarizeUrges(urges: UrgeEntry[], todayKey: string = formatDateKey()): UrgeSummary {
  if (urges.length === 0) {
    return {
      totalLogged: 0,
      todayCount: 0,
      averageIntensity: 0,
      topTrigger: 'None',
      totalSurfedMinutes: 0,
    };
  }

  let totalIntensity = 0;
  let todayCount = 0;
  let totalSurfedSec = 0;
  const triggerCounts: Record<string, number> = {};

  for (const urge of urges) {
    totalIntensity += urge.intensity;
    if (urge.timestamp.startsWith(todayKey)) {
      todayCount++;
    }
    if (urge.surfedSeconds) {
      totalSurfedSec += urge.surfedSeconds;
    }
    triggerCounts[urge.trigger] = (triggerCounts[urge.trigger] || 0) + 1;
  }

  let topTrigger = 'None';
  let maxCount = 0;
  for (const [trigger, count] of Object.entries(triggerCounts)) {
    if (count > maxCount) {
      maxCount = count;
      topTrigger = trigger;
    }
  }

  return {
    totalLogged: urges.length,
    todayCount,
    averageIntensity: Number((totalIntensity / urges.length).toFixed(1)),
    topTrigger,
    totalSurfedMinutes: Math.round(totalSurfedSec / 60),
  };
}

export interface HourlyUrgeBucket {
  hour: number;
  label: string;
  count: number;
  percentage: number;
}

export interface UrgeVulnerabilityReport {
  hourlyBuckets: HourlyUrgeBucket[];
  peakHour: number | null;
  peakHourLabel: string;
  peakWindowLabel: string;
  maxHourlyCount: number;
  actionableInsight: string;
}

export function getHourlyUrgeDistribution(urges: UrgeEntry[]): UrgeVulnerabilityReport {
  const counts = new Array(24).fill(0);

  for (const urge of urges) {
    const d = new Date(urge.timestamp);
    if (!isNaN(d.getTime())) {
      const h = d.getHours();
      counts[h] = (counts[h] || 0) + 1;
    }
  }

  const maxCount = Math.max(...counts);
  let peakHour: number | null = null;
  if (maxCount > 0) {
    peakHour = counts.indexOf(maxCount);
  }

  const hourlyBuckets: HourlyUrgeBucket[] = counts.map((count, hour) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayH = hour % 12 === 0 ? 12 : hour % 12;
    return {
      hour,
      label: `${displayH} ${period}`,
      count,
      percentage: urges.length > 0 ? Math.round((count / urges.length) * 100) : 0,
    };
  });

  let peakHourLabel = 'No urges recorded';
  let peakWindowLabel = 'Calm baseline';
  let actionableInsight = 'Log urges as they occur to map your biological peak vulnerability times.';

  if (peakHour !== null && maxCount > 0) {
    const startPeriod = peakHour >= 12 ? 'PM' : 'AM';
    const startH = peakHour % 12 === 0 ? 12 : peakHour % 12;
    const endHRaw = (peakHour + 2) % 24;
    const endPeriod = endHRaw >= 12 ? 'PM' : 'AM';
    const endH = endHRaw % 12 === 0 ? 12 : endHRaw % 12;

    peakHourLabel = `${startH}:00 ${startPeriod}`;
    peakWindowLabel = `${startH}:00 ${startPeriod} – ${endH}:00 ${endPeriod}`;

    if (peakHour >= 21 || peakHour <= 3) {
      actionableInsight = 'Urges peak during late-night hours. Protect this window by charging your phone outside the bedroom and adhering to the screen-free wind-down habit.';
    } else if (peakHour >= 14 && peakHour <= 17) {
      actionableInsight = 'Urges spike in the mid-afternoon energy slump. Schedule a brisk walk, cold water, or 5-minute breathing before 3:00 PM to intercept the dip.';
    } else {
      actionableInsight = `Your highest vulnerability window is around ${peakWindowLabel}. Prepare a non-screen distraction beforehand.`;
    }
  }

  return {
    hourlyBuckets,
    peakHour,
    peakHourLabel,
    peakWindowLabel,
    maxHourlyCount: maxCount,
    actionableInsight,
  };
}

export function getInitialDefaultState(): ResetAppState {
  const today = formatDateKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterday);

  // 12 days clean by default for an authentic first load experience
  const defaultStartDate = new Date(Date.now() - 12 * 86400 * 1000 - 4 * 3600 * 1000).toISOString();
  const screenStartDate = new Date(Date.now() - 5 * 86400 * 1000 - 2 * 3600 * 1000).toISOString();

  return {
    activeTrackId: 'track-dopamine',
    pinCode: null,
    tracks: [
      {
        id: 'track-dopamine',
        name: 'Dopamine & Focus Reset',
        icon: '🛡️',
        cleanStartDate: defaultStartDate,
        longestStreakDays: 12,
        motto: 'Clarity over compulsion. Peace of mind is non-negotiable.',
        habits: [
          {
            id: 'habit-1',
            title: 'Morning Cold Water & 5m Breathwork',
            description: 'Wake the nervous system without digital dopamine.',
            icon: '💧',
            completionDates: [yesterdayKey, today],
          },
          {
            id: 'habit-2',
            title: '20-Minute Movement or Outdoor Walk',
            description: 'Metabolize cortisol and physical restlessness.',
            icon: '👟',
            completionDates: [yesterdayKey],
          },
          {
            id: 'habit-3',
            title: 'Screen-Free Wind Down (No phone in bed)',
            description: 'Protect REM sleep and prevent late-night relapse triggers.',
            icon: '🌙',
            completionDates: [yesterdayKey],
          },
        ],
        urges: [
          {
            id: 'urge-1',
            timestamp: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
            intensity: 7,
            trigger: 'Stress',
            notes: 'Felt overwhelming urge after work deadline. Sat down and did 5-minute breathing instead.',
            surfedSeconds: 300,
            surfedCompleted: true,
          },
          {
            id: 'urge-2',
            timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
            intensity: 5,
            trigger: 'Boredom',
            notes: 'Idle scrolling impulse. Drank a large glass of ice water and stepped outside.',
            surfedSeconds: 180,
            surfedCompleted: true,
          },
        ],
        resetHistory: [],
      },
      {
        id: 'track-screen',
        name: 'Digital & Screen Detox',
        icon: '📵',
        cleanStartDate: screenStartDate,
        longestStreakDays: 5,
        motto: 'Attention is life. Do not give it to algorithms.',
        habits: [
          {
            id: 'habit-s1',
            title: 'No Phone First 60 Minutes of the Day',
            description: 'Start your morning in the real physical world.',
            icon: '☀️',
            completionDates: [today],
          },
          {
            id: 'habit-s2',
            title: 'Read 15 Pages of a Physical Book',
            description: 'Rebuild deep linear focus and sustained attention span.',
            icon: '📖',
            completionDates: [yesterdayKey],
          },
          {
            id: 'habit-s3',
            title: 'All Devices in Grayscale / Do Not Disturb',
            description: 'Remove artificial hyper-stimulatory visual cues.',
            icon: '🕶️',
            completionDates: [yesterdayKey, today],
          },
        ],
        urges: [
          {
            id: 'urge-s1',
            timestamp: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
            intensity: 6,
            trigger: 'Habit Loop',
            notes: 'Reflexively tapped to open social feed. Caught myself and put phone face down.',
            surfedSeconds: 120,
            surfedCompleted: true,
          },
        ],
        resetHistory: [],
      },
    ],
  };
}
