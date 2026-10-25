/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Waves } from 'lucide-react';
import { useResetApp } from './hooks/useResetApp.ts';
import { haptics } from './utils/haptics.ts';
import { LoadingScreen } from './components/LoadingScreen.tsx';
import { OpeningScreen } from './components/OpeningScreen.tsx';
import { Header } from './components/Header.tsx';
import { StreakCounter } from './components/StreakCounter.tsx';
import { HabitsChecklist } from './components/HabitsChecklist.tsx';
import { UrgeButton } from './components/UrgeButton.tsx';
import { UrgeModal } from './components/UrgeModal.tsx';
import { UrgeHistory } from './components/UrgeHistory.tsx';
import { EmergencyKit } from './components/EmergencyKit.tsx';
import { EditHabitsModal } from './components/EditHabitsModal.tsx';
import { ResetConfirmModal } from './components/ResetConfirmModal.tsx';
import { EditDateModal } from './components/EditDateModal.tsx';
import { MilestonesModal } from './components/MilestonesModal.tsx';
import { PinLockModal } from './components/PinLockModal.tsx';
import { DailyMotivation } from './components/DailyMotivation.tsx';
import { StreakTrendChart } from './components/StreakTrendChart.tsx';
import { BadgesModule } from './components/BadgesModule.tsx';
import { WorkspaceTab } from './components/WorkspaceTab.tsx';
import { NavigationTabs, AppTab } from './components/NavigationTabs.tsx';
import {
  calculateCleanStreak,
  formatDateKey,
  summarizeUrges,
  isHabitCompletedOn,
} from './utils/resetLogic.ts';

const TAB_STORAGE_KEY = 'reset_app_active_tab_v1';

export default function App() {
  const {
    state,
    activeTrack,
    isLocked,
    switchTrack,
    addTrack,
    deleteTrack,
    toggleHabit,
    updateHabits,
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
  } = useResetApp();

  // Active Tab state (defaults to 'progress' or saved preference)
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    try {
      const saved = localStorage.getItem(TAB_STORAGE_KEY);
      if (saved === 'workspace' || saved === 'progress') return saved;
    } catch {}
    return 'progress';
  });

  const handleTabChange = (tab: AppTab) => {
    haptics.light();
    setActiveTab(tab);
    try {
      localStorage.setItem(TAB_STORAGE_KEY, tab);
    } catch {}
  };

  // Loading & Opening Screen states
  const [isLoading, setIsLoading] = useState(true);
  const [showOpeningScreenPreference, setShowOpeningScreenPreference] = useState(() => {
    try {
      const saved = localStorage.getItem('reset_app_show_opening_screen');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });
  const [isOpeningScreenOpen, setIsOpeningScreenOpen] = useState(false);

  const handleLoadingComplete = () => {
    setIsLoading(false);
    if (showOpeningScreenPreference) {
      setIsOpeningScreenOpen(true);
    }
  };

  const handleToggleShowOpeningScreen = (show: boolean) => {
    setShowOpeningScreenPreference(show);
    try {
      localStorage.setItem('reset_app_show_opening_screen', String(show));
    } catch {}
  };

  // Modals state
  const [isUrgeModalOpen, setIsUrgeModalOpen] = useState(false);
  const [isEmergencyKitOpen, setIsEmergencyKitOpen] = useState(false);
  const [isEditHabitsOpen, setIsEditHabitsOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isEditDateOpen, setIsEditDateOpen] = useState(false);
  const [isMilestonesOpen, setIsMilestonesOpen] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<'set' | 'remove' | null>(null);

  const streakInfo = calculateCleanStreak(activeTrack.cleanStartDate);
  const todayKey = formatDateKey();
  const urgeSummary = summarizeUrges(activeTrack.urges, todayKey);

  const todayPlan = state.dailyPlanner?.[todayKey] || { note: '', tasks: [] };
  const unfinishedTasksCount = todayPlan.tasks.filter((t) => !t.completed).length;
  const completedHabitsToday = activeTrack.habits.filter((h) =>
    isHabitCompletedOn(h, todayKey)
  ).length;

  const handleDownloadBackup = () => {
    const dataStr = exportDataJson();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personal-reset-backup-${todayKey}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-[#E5E5E5] flex flex-col font-sans selection:bg-[#333] selection:text-white pb-24 sm:pb-12">
      {/* Top Notion-style Bar, Multi-Track Switcher, PWA Install & PIN controls */}
      <Header
        tracks={state.tracks}
        activeTrackId={state.activeTrackId}
        onSwitchTrack={switchTrack}
        onAddTrack={addTrack}
        onDeleteTrack={deleteTrack}
        motto={activeTrack.motto}
        onUpdateMotto={updateMotto}
        onExport={handleDownloadBackup}
        onImport={importDataJson}
        pinCode={state.pinCode}
        onLockApp={lockApp}
        onOpenPinModal={(mode) => setPinModalMode(mode)}
        onOpenOpeningScreen={() => {
          haptics.light();
          setIsOpeningScreenOpen(true);
        }}
      />

      {/* Main Notion Modular Document Canvas */}
      <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6 flex-1 space-y-6">
        {/* Navigation Tabs: Progress & Recovery vs Workspace */}
        <NavigationTabs
          activeTab={activeTab}
          onChangeTab={handleTabChange}
          unfinishedTasksCount={unfinishedTasksCount}
        />

        {/* SCREEN 1: PROGRESS TAB (Streak counter, daily stoic quote, habits, badges, analytics, urge button) */}
        {activeTab === 'progress' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* 1. Large 'Days Clean' Streak Counter at the very top */}
            <StreakCounter
              key={activeTrack.id}
              startDateIso={activeTrack.cleanStartDate}
              longestStreakDays={activeTrack.longestStreakDays}
              onOpenResetModal={() => setIsResetConfirmOpen(true)}
              onOpenEditDateModal={() => setIsEditDateOpen(true)}
              onOpenMilestonesModal={() => setIsMilestonesOpen(true)}
            />

            {/* 2. Daily Motivation: Stoic & Minimalist Inspirational Quote */}
            <DailyMotivation dateKey={todayKey} />

            {/* 3. Daily Anchor Habits (Customizable) */}
            <HabitsChecklist
              key={`habits-${activeTrack.id}`}
              habits={activeTrack.habits}
              onToggleHabit={toggleHabit}
              onOpenEditModal={() => setIsEditHabitsOpen(true)}
            />

            {/* 4. Digital Achievements / Badges Module in Side-Grid */}
            <BadgesModule
              key={`badges-${activeTrack.id}`}
              currentStreakDays={streakInfo.days}
              longestStreakDays={activeTrack.longestStreakDays}
              habits={activeTrack.habits}
              urges={activeTrack.urges}
              planner={state.dailyPlanner}
            />

            {/* 5. Streak Trend Chart: Monthly Analytics of Habit Completion vs Logged Urges */}
            <StreakTrendChart
              key={`trend-${activeTrack.id}`}
              habits={activeTrack.habits}
              urges={activeTrack.urges}
            />

            {/* 6. Prominent, Easy-to-Reach 'Log an Urge' Button */}
            <UrgeButton
              onClick={() => setIsUrgeModalOpen(true)}
              onOpenGrounding={() => setIsEmergencyKitOpen(true)}
              recentUrgesToday={urgeSummary.todayCount}
            />

            {/* 7. Notion-style Database: Urge Journal, 24h Heatmap & Trigger Patterns */}
            <UrgeHistory
              key={`urges-${activeTrack.id}`}
              urges={activeTrack.urges}
              onDeleteUrge={deleteUrge}
            />
          </div>
        )}

        {/* SCREEN 2: WORKSPACE TAB (Daily Execution: Task Manager with Migrate ➔ + EOD Rollover & Friction Journal) */}
        {activeTab === 'workspace' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <WorkspaceTab
              planner={state.dailyPlanner || {}}
              todayKey={todayKey}
              onAddTask={addDailyTask}
              onToggleTask={toggleDailyTask}
              onDeleteTask={deleteDailyTask}
              onUpdateNote={updateDailyNote}
              onMigrateTask={migrateDailyTask}
              onReorderTasks={reorderDailyTasks}
              onClearCompletedTasks={clearCompletedDailyTasks}
              onClearAllTasks={clearAllDailyTasks}
              onReviewAndRollover={reviewAndRollover}
              onRolloverTasks={rolloverTasks}
            />
          </div>
        )}

        {/* Notion subtle footer */}
        <footer className="pt-6 border-t border-[#1F1F1F] text-center text-xs text-[#606060]">
          <div className="flex items-center justify-center gap-2 mb-1 flex-wrap">
            <span>Reset</span>
            <span>·</span>
            <span>{activeTrack.name}</span>
            <span>·</span>
            <button
              onClick={() => {
                haptics.light();
                setIsOpeningScreenOpen(true);
              }}
              className="text-[#888] hover:text-[#CCC] underline cursor-pointer"
            >
              Daily Briefing
            </button>
            <span>·</span>
            <button
              onClick={() => setIsMilestonesOpen(true)}
              className="text-[#888] hover:text-[#CCC] underline cursor-pointer"
            >
              Milestones
            </button>
          </div>
          <p className="text-[11px] text-[#505050]">
            PWA enabled · All data stored locally in your browser.
          </p>
        </footer>
      </main>

      {/* Sticky Mobile Ergonomic Bottom Action Bar (Thumb Zone) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-[#121212]/95 backdrop-blur-md border-t border-[#262626] z-40">
        <motion.button
          type="button"
          onClick={() => {
            haptics.medium();
            setIsUrgeModalOpen(true);
          }}
          animate={{
            scale: [1, 1.02, 1],
            boxShadow: [
              '0 0 0 0 rgba(230, 230, 230, 0.25)',
              '0 0 0 8px rgba(230, 230, 230, 0)',
              '0 0 0 0 rgba(230, 230, 230, 0)',
            ],
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          whileTap={{ scale: 0.97 }}
          className="w-full h-12 rounded-xl bg-[#E6E6E6] hover:bg-white text-[#121212] font-semibold text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer"
        >
          <Waves className="w-4 h-4 text-[#121212]" />
          <span>Log an Urge</span>
        </motion.button>
      </div>

      {/* Modals */}
      <UrgeModal
        isOpen={isUrgeModalOpen}
        onClose={() => setIsUrgeModalOpen(false)}
        onSaveUrge={logUrge}
      />

      <EmergencyKit
        isOpen={isEmergencyKitOpen}
        onClose={() => setIsEmergencyKitOpen(false)}
      />

      <EditHabitsModal
        isOpen={isEditHabitsOpen}
        onClose={() => setIsEditHabitsOpen(false)}
        habits={activeTrack.habits}
        onSave={updateHabits}
      />

      <ResetConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        currentStreakDays={streakInfo.days}
        onConfirmReset={resetStreak}
      />

      <EditDateModal
        isOpen={isEditDateOpen}
        onClose={() => setIsEditDateOpen(false)}
        currentStartDateIso={activeTrack.cleanStartDate}
        onSaveStartDate={setCleanStartDate}
      />

      <MilestonesModal
        isOpen={isMilestonesOpen}
        onClose={() => setIsMilestonesOpen(false)}
        currentDays={streakInfo.days}
      />

      {/* PIN Unlock Modal (When app is locked) */}
      <PinLockModal
        isOpen={isLocked}
        mode="unlock"
        savedPin={state.pinCode}
        onSuccess={unlockApp}
      />

      {/* PIN Management Modal (Set or Remove PIN) */}
      <PinLockModal
        isOpen={pinModalMode !== null}
        mode={pinModalMode || 'set'}
        savedPin={state.pinCode}
        onSuccess={(pin) => {
          if (pinModalMode === 'set' && pin) {
            setPinCode(pin);
          } else if (pinModalMode === 'remove') {
            setPinCode(null);
          }
          setPinModalMode(null);
        }}
        onCancel={() => setPinModalMode(null)}
      />

      {/* Loading Boot Screen */}
      <AnimatePresence>
        {isLoading && (
          <LoadingScreen onComplete={handleLoadingComplete} />
        )}
      </AnimatePresence>

      {/* Opening Screen (Daily Intention & Centering Briefing) */}
      <AnimatePresence>
        {!isLoading && isOpeningScreenOpen && (
          <OpeningScreen
            isOpen={isOpeningScreenOpen}
            onEnterApp={() => setIsOpeningScreenOpen(false)}
            onOpenGrounding={() => {
              setIsOpeningScreenOpen(false);
              setIsEmergencyKitOpen(true);
            }}
            activeTrack={activeTrack}
            streakInfo={streakInfo}
            todayKey={todayKey}
            completedHabitsCount={completedHabitsToday}
            totalHabitsCount={activeTrack.habits.length}
            unfinishedTasksCount={unfinishedTasksCount}
            showOnLaunchPreference={showOpeningScreenPreference}
            onToggleShowOnLaunch={handleToggleShowOpeningScreen}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
