export type UrgeTrigger =
  | 'Boredom'
  | 'Stress'
  | 'Fatigue'
  | 'Loneliness'
  | 'Late Night'
  | 'Social Media'
  | 'Emotional Trigger'
  | 'Habit Loop'
  | 'Other';

export interface Habit {
  id: string;
  title: string;
  description?: string;
  icon: string;
  completionDates: string[]; // YYYY-MM-DD strings
}

export interface UrgeEntry {
  id: string;
  timestamp: string; // ISO 8601
  intensity: number; // 1 to 10
  trigger: UrgeTrigger;
  notes?: string;
  surfedSeconds?: number;
  surfedCompleted?: boolean;
}

export interface ResetEvent {
  id: string;
  timestamp: string; // ISO 8601
  streakDays: number;
  reason?: string;
}

export type TaskPriority = 'high' | 'medium' | 'normal';

export interface DailyTask {
  id: string;
  title: string;
  completed: boolean;
  dateKey: string; // YYYY-MM-DD
  createdTimestamp: string;
  priority?: TaskPriority;
  rolledOverFrom?: string; // dateKey it was migrated/rolled over from
}

export interface DailyDayPlan {
  note: string;
  tasks: DailyTask[];
}

export interface ResetTrack {
  id: string;
  name: string;
  icon: string;
  cleanStartDate: string; // ISO 8601
  longestStreakDays: number;
  habits: Habit[]; // Flexible customizable habits (1 to 15+)
  urges: UrgeEntry[];
  resetHistory: ResetEvent[];
  motto: string;
}

export interface ResetAppState {
  activeTrackId: string;
  tracks: ResetTrack[];
  pinCode: string | null;
  dailyPlanner?: Record<string, DailyDayPlan>; // Keyed by YYYY-MM-DD
}

export interface Milestone {
  days: number;
  label: string;
  description: string;
}

export interface StravaAthlete {
  id: number;
  username?: string;
  firstname: string;
  lastname: string;
  profile?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface StravaActivity {
  id: number | string;
  name: string;
  distance: number; // in meters
  moving_time: number; // in seconds
  elapsed_time: number; // in seconds
  total_elevation_gain?: number;
  type: string; // Run, Ride, Walk, Workout, WeightTraining, Yoga, etc.
  sport_type?: string;
  start_date_local: string; // ISO 8601 YYYY-MM-DDTHH:mm:ssZ
  average_speed?: number; // m/s
  max_speed?: number;
  has_heartrate?: boolean;
  average_heartrate?: number;
  kudos_count?: number;
}

export interface StravaAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // unix timestamp in seconds
  athlete?: StravaAthlete;
}

export interface StravaConfig {
  clientId?: string;
  clientSecret?: string;
}

export interface AccountabilityReportSnapshot {
  trackName: string;
  trackIcon: string;
  daysClean: number;
  longestStreakDays: number;
  motto: string;
  generatedAt: string;
  habitsCompletedToday: number;
  totalHabits: number;
  urgesSurfedTotal: number;
  badgesUnlockedCount: number;
  recentHabitAdherencePercent: number;
}
