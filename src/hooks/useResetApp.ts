import { useState, useEffect } from 'react';
import { Habit, ResetAppState, ResetTrack, UrgeEntry, ResetEvent, DailyTask, DailyDayPlan, TaskPriority } from '../types/index.ts';
import { formatDateKey, getInitialDefaultState, toggleHabitDate } from '../utils/resetLogic.ts';
import {
  getDefaultPlannerState,
  rolloverUnfinishedTasks,
  migrateTaskToNextDay,
  reviewAndRolloverTasks,
  TaskDecision,
} from '../utils/dailyTasksLogic.ts';

const STORAGE_KEY = 'minimalist_reset_app_state_v3';
const LEGACY_STORAGE_KEY_V2 = 'minimalist_reset_app_state_v2';

export function useResetApp() {
  const [state, setState] = useState<ResetAppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.tracks) && parsed.tracks.length > 0) {
          if (!parsed.dailyPlanner) {
            parsed.dailyPlanner = getDefaultPlannerState();
          }
          return parsed;
        }
      }

      // Check legacy v2
      const legacyV2 = localStorage.getItem(LEGACY_STORAGE_KEY_V2);
      if (legacyV2) {
        const parsed = JSON.parse(legacyV2);
        if (parsed && Array.isArray(parsed.tracks)) {
          return {
            ...parsed,
            dailyPlanner: getDefaultPlannerState(),
          };
        }
      }
    } catch (e) {
      console.warn('Failed to load state from localStorage', e);
    }

    const defaultState = getInitialDefaultState();
    return {
      ...defaultState,
      dailyPlanner: getDefaultPlannerState(),
    };
  });

  // PIN lock session state
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return !!parsed.pinCode;
      }
    } catch {}
    return false;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save state to localStorage', e);
    }
  }, [state]);

  const activeTrack =
    state.tracks.find((t) => t.id === state.activeTrackId) || state.tracks[0];

  const updateActiveTrack = (updater: (prev: ResetTrack) => ResetTrack) => {
    setState((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => (t.id === prev.activeTrackId ? updater(t) : t)),
    }));
  };

  const switchTrack = (trackId: string) => {
    setState((prev) => ({
      ...prev,
      activeTrackId: trackId,
    }));
  };

  const addTrack = (name: string, icon: string, motto: string) => {
    const newTrack: ResetTrack = {
      id: `track-${Date.now()}`,
      name,
      icon,
      cleanStartDate: new Date().toISOString(),
      longestStreakDays: 0,
      motto: motto || 'One day at a time.',
      habits: [
        {
          id: `h1-${Date.now()}`,
          title: 'Morning Centering Routine',
          description: 'Ground yourself before daily stimulus.',
          icon: '🧘',
          completionDates: [],
        },
        {
          id: `h2-${Date.now()}`,
          title: 'Physical Activity or Walk',
          description: 'Discharge nervous physical energy.',
          icon: '👟',
          completionDates: [],
        },
        {
          id: `h3-${Date.now()}`,
          title: 'Nightly Screen-Free Wind Down',
          description: 'Deep sleep and recovery protection.',
          icon: '🌙',
          completionDates: [],
        },
      ],
      urges: [],
      resetHistory: [],
    };

    setState((prev) => ({
      ...prev,
      tracks: [...prev.tracks, newTrack],
      activeTrackId: newTrack.id,
    }));
  };

  const deleteTrack = (trackId: string) => {
    if (state.tracks.length <= 1) return;
    setState((prev) => {
      const remaining = prev.tracks.filter((t) => t.id !== trackId);
      return {
        ...prev,
        tracks: remaining,
        activeTrackId: prev.activeTrackId === trackId ? remaining[0].id : prev.activeTrackId,
      };
    });
  };

  // Habit management (now supports arbitrary number of habits: 3 to 15+)
  const toggleHabit = (habitId: string, dateKey: string = formatDateKey()) => {
    updateActiveTrack((track) => {
      const updatedHabits = track.habits.map((habit) => {
        if (habit.id === habitId) {
          return {
            ...habit,
            completionDates: toggleHabitDate(habit.completionDates, dateKey),
          };
        }
        return habit;
      });

      return {
        ...track,
        habits: updatedHabits,
      };
    });
  };

  const updateHabits = (newHabits: Habit[]) => {
    updateActiveTrack((track) => ({
      ...track,
      habits: newHabits,
    }));
  };

  const addHabit = (habitData: { title: string; description?: string; icon: string }) => {
    updateActiveTrack((track) => {
      if (track.habits.length >= 15) return track;
      const newHabit: Habit = {
        id: `habit-${Date.now()}`,
        title: habitData.title,
        description: habitData.description,
        icon: habitData.icon || '⚡',
        completionDates: [],
      };
      return {
        ...track,
        habits: [...track.habits, newHabit],
      };
    });
  };

  const removeHabit = (habitId: string) => {
    updateActiveTrack((track) => {
      if (track.habits.length <= 1) return track; // keep at least 1
      return {
        ...track,
        habits: track.habits.filter((h) => h.id !== habitId),
      };
    });
  };

  // Daily Tasks & Notes (resets by end of day, warns about unfinished tasks)
  const todayKey = formatDateKey();
  const planner = state.dailyPlanner || getDefaultPlannerState();
  const todayPlan: DailyDayPlan = planner[todayKey] || { note: '', tasks: [] };

  const addDailyTask = (
    title: string,
    priority: TaskPriority = 'normal',
    targetDateKey: string = todayKey
  ) => {
    if (!title.trim()) return;
    const newTask: DailyTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      completed: false,
      dateKey: targetDateKey,
      createdTimestamp: new Date().toISOString(),
      priority,
    };

    setState((prev) => {
      const currentPlanner = prev.dailyPlanner || {};
      const plan = currentPlanner[targetDateKey] || { note: '', tasks: [] };
      return {
        ...prev,
        dailyPlanner: {
          ...currentPlanner,
          [targetDateKey]: {
            ...plan,
            tasks: [...plan.tasks, newTask],
          },
        },
      };
    });
  };

  const toggleDailyTask = (taskId: string, targetDateKey: string = todayKey) => {
    setState((prev) => {
      const currentPlanner = prev.dailyPlanner || {};
      const plan = currentPlanner[targetDateKey] || { note: '', tasks: [] };
      const updatedTasks = plan.tasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      );
      return {
        ...prev,
        dailyPlanner: {
          ...currentPlanner,
          [targetDateKey]: {
            ...plan,
            tasks: updatedTasks,
          },
        },
      };
    });
  };

  const deleteDailyTask = (taskId: string, targetDateKey: string = todayKey) => {
    setState((prev) => {
      const currentPlanner = prev.dailyPlanner || {};
      const plan = currentPlanner[targetDateKey] || { note: '', tasks: [] };
      return {
        ...prev,
        dailyPlanner: {
          ...currentPlanner,
          [targetDateKey]: {
            ...plan,
            tasks: plan.tasks.filter((t) => t.id !== taskId),
          },
        },
      };
    });
  };

  const reorderDailyTasks = (targetDateKey: string = todayKey, reorderedTasks: DailyTask[]) => {
    setState((prev) => {
      const currentPlanner = prev.dailyPlanner || {};
      const plan = currentPlanner[targetDateKey] || { note: '', tasks: [] };
      return {
        ...prev,
        dailyPlanner: {
          ...currentPlanner,
          [targetDateKey]: {
            ...plan,
            tasks: reorderedTasks,
          },
        },
      };
    });
  };

  const clearCompletedDailyTasks = (targetDateKey: string = todayKey) => {
    setState((prev) => {
      const currentPlanner = prev.dailyPlanner || {};
      const plan = currentPlanner[targetDateKey] || { note: '', tasks: [] };
      return {
        ...prev,
        dailyPlanner: {
          ...currentPlanner,
          [targetDateKey]: {
            ...plan,
            tasks: plan.tasks.filter((t) => !t.completed),
          },
        },
      };
    });
  };

  const clearAllDailyTasks = (targetDateKey: string = todayKey) => {
    setState((prev) => {
      const currentPlanner = prev.dailyPlanner || {};
      const plan = currentPlanner[targetDateKey] || { note: '', tasks: [] };
      return {
        ...prev,
        dailyPlanner: {
          ...currentPlanner,
          [targetDateKey]: {
            ...plan,
            tasks: [],
          },
        },
      };
    });
  };

  const updateDailyNote = (note: string, targetDateKey: string = todayKey) => {
    setState((prev) => {
      const currentPlanner = prev.dailyPlanner || {};
      const plan = currentPlanner[targetDateKey] || { note: '', tasks: [] };
      return {
        ...prev,
        dailyPlanner: {
          ...currentPlanner,
          [targetDateKey]: {
            ...plan,
            note,
          },
        },
      };
    });
  };

  const rolloverTasks = (fromKey: string, toKey: string = todayKey) => {
    setState((prev) => {
      const currentPlanner = prev.dailyPlanner || {};
      const { updatedPlanner } = rolloverUnfinishedTasks(currentPlanner, fromKey, toKey);
      return {
        ...prev,
        dailyPlanner: updatedPlanner,
      };
    });
  };

  const migrateDailyTask = (taskId: string, fromDateKey: string = todayKey, prioritise: boolean = false) => {
    setState((prev) => {
      const currentPlanner = prev.dailyPlanner || {};
      const { updatedPlanner } = migrateTaskToNextDay(currentPlanner, taskId, fromDateKey, { prioritize: prioritise });
      return {
        ...prev,
        dailyPlanner: updatedPlanner,
      };
    });
  };

  const reviewAndRollover = (decisions: TaskDecision[], fromDateKey: string = todayKey) => {
    setState((prev) => {
      const currentPlanner = prev.dailyPlanner || {};
      const { updatedPlanner } = reviewAndRolloverTasks(currentPlanner, decisions, fromDateKey);
      return {
        ...prev,
        dailyPlanner: updatedPlanner,
      };
    });
  };

  // Urge and reset management
  const logUrge = (entry: Omit<UrgeEntry, 'id' | 'timestamp'>) => {
    const newEntry: UrgeEntry = {
      ...entry,
      id: `urge-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    updateActiveTrack((track) => ({
      ...track,
      urges: [newEntry, ...track.urges],
    }));

    return newEntry;
  };

  const deleteUrge = (id: string) => {
    updateActiveTrack((track) => ({
      ...track,
      urges: track.urges.filter((u) => u.id !== id),
    }));
  };

  const resetStreak = (reason?: string) => {
    const now = new Date();
    updateActiveTrack((track) => {
      const currentStartMs = new Date(track.cleanStartDate).getTime();
      const streakDays = Math.floor(Math.max(0, now.getTime() - currentStartMs) / (86400 * 1000));

      const resetEvent: ResetEvent = {
        id: `reset-${Date.now()}`,
        timestamp: now.toISOString(),
        streakDays,
        reason,
      };

      return {
        ...track,
        cleanStartDate: now.toISOString(),
        longestStreakDays: Math.max(track.longestStreakDays, streakDays),
        resetHistory: [resetEvent, ...track.resetHistory],
      };
    });
  };

  const setCleanStartDate = (isoString: string) => {
    updateActiveTrack((track) => ({
      ...track,
      cleanStartDate: isoString,
    }));
  };

  const updateMotto = (motto: string) => {
    updateActiveTrack((track) => ({
      ...track,
      motto,
    }));
  };

  const setPinCode = (pin: string | null) => {
    setState((prev) => ({
      ...prev,
      pinCode: pin,
    }));
    setIsLocked(false);
  };

  const lockApp = () => {
    if (state.pinCode) {
      setIsLocked(true);
    }
  };

  const unlockApp = () => {
    setIsLocked(false);
  };

  const exportDataJson = () => {
    return JSON.stringify(state, null, 2);
  };

  const importDataJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && Array.isArray(parsed.tracks) && parsed.tracks.length > 0) {
        setState(parsed);
        return true;
      }
    } catch {
      return false;
    }
    return false;
  };

  return {
    state,
    activeTrack,
    isLocked,
    todayPlan,
    switchTrack,
    addTrack,
    deleteTrack,
    toggleHabit,
    updateHabits,
    addHabit,
    removeHabit,
    addDailyTask,
    toggleDailyTask,
    deleteDailyTask,
    reorderDailyTasks,
    clearCompletedDailyTasks,
    clearAllDailyTasks,
    updateDailyNote,
    rolloverTasks,
    migrateDailyTask,
    reviewAndRollover,
    logUrge,
    deleteUrge,
    resetStreak,
    setCleanStartDate,
    updateMotto,
    setPinCode,
    lockApp,
    unlockApp,
    exportDataJson,
    importDataJson,
  };
}
