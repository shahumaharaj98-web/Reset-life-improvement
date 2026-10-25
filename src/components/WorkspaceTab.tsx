import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { DailyDayPlan, DailyTask, TaskPriority } from '../types/index.ts';
import { TaskManager } from './TaskManager.tsx';
import { FrictionJournal } from './FrictionJournal.tsx';
import { EODRolloverModal } from './EODRolloverModal.tsx';
import { formatDateKey } from '../utils/resetLogic.ts';
import {
  getYesterdayDateKey,
  getTomorrowDateKey,
  TaskDecision,
} from '../utils/dailyTasksLogic.ts';

interface WorkspaceTabProps {
  planner: Record<string, DailyDayPlan>;
  todayKey?: string;
  onAddTask: (title: string, priority?: TaskPriority, targetDateKey?: string) => void;
  onToggleTask: (taskId: string, targetDateKey?: string) => void;
  onDeleteTask: (taskId: string, targetDateKey?: string) => void;
  onUpdateNote: (note: string, targetDateKey?: string) => void;
  onMigrateTask: (taskId: string, fromDateKey?: string, prioritise?: boolean) => void;
  onReorderTasks?: (targetDateKey: string, reorderedTasks: DailyTask[]) => void;
  onClearCompletedTasks?: (targetDateKey: string) => void;
  onClearAllTasks?: (targetDateKey: string) => void;
  onReviewAndRollover: (decisions: TaskDecision[], fromDateKey?: string) => void;
  onRolloverTasks: (fromKey: string, toKey?: string) => void;
}

export const WorkspaceTab: React.FC<WorkspaceTabProps> = ({
  planner,
  todayKey = formatDateKey(),
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onUpdateNote,
  onMigrateTask,
  onReorderTasks,
  onClearCompletedTasks,
  onClearAllTasks,
  onReviewAndRollover,
  onRolloverTasks,
}) => {
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);
  const [isEODModalOpen, setIsEODModalOpen] = useState(false);

  const yesterdayKey = getYesterdayDateKey(todayKey);
  const tomorrowKey = getTomorrowDateKey(todayKey);

  const isToday = selectedDateKey === todayKey;
  const isTomorrow = selectedDateKey === tomorrowKey;
  const isYesterday = selectedDateKey === yesterdayKey;

  const currentPlan = planner[selectedDateKey] || { note: '', tasks: [] };
  const todayPlan = planner[todayKey] || { note: '', tasks: [] };

  return (
    <div className="space-y-6">
      {/* Date Switcher Bar (Today / Tomorrow / Yesterday) */}
      <div className="flex items-center justify-between bg-[#181818] border border-[#262626] rounded-xl px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedDateKey(yesterdayKey)}
            className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
              isYesterday
                ? 'bg-[#2B2B2B] text-white font-medium'
                : 'text-[#888] hover:text-[#CCC]'
            }`}
          >
            Yesterday
          </button>
          <button
            type="button"
            onClick={() => setSelectedDateKey(todayKey)}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
              isToday
                ? 'bg-[#2B2B2B] text-white font-medium'
                : 'text-[#888] hover:text-[#CCC]'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setSelectedDateKey(tomorrowKey)}
            className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
              isTomorrow
                ? 'bg-[#2B2B2B] text-white font-medium'
                : 'text-[#888] hover:text-[#CCC]'
            }`}
          >
            Tomorrow
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#888]">
          <Calendar className="w-3.5 h-3.5 text-[#666]" />
          <span>{selectedDateKey}</span>
        </div>
      </div>

      {/* Main Workspace Card (Top half Task Manager, Bottom half Friction Journal) */}
      <section className="bg-[#181818] border border-[#262626] rounded-xl p-5 sm:p-6 space-y-6">
        {/* Top Half: Task Manager */}
        <TaskManager
          tasks={currentPlan.tasks}
          dateKey={selectedDateKey}
          isToday={isToday}
          onAddTask={onAddTask}
          onToggleTask={onToggleTask}
          onDeleteTask={onDeleteTask}
          onMigrateTask={onMigrateTask}
          onReorderTasks={(newTasks) => {
            if (onReorderTasks) {
              onReorderTasks(selectedDateKey, newTasks);
            }
          }}
          onClearCompleted={(targetDateKey) => {
            if (onClearCompletedTasks) {
              onClearCompletedTasks(targetDateKey);
            }
          }}
          onClearAll={(targetDateKey) => {
            if (onClearAllTasks) {
              onClearAllTasks(targetDateKey);
            }
          }}
          onOpenEODModal={() => setIsEODModalOpen(true)}
        />

        {/* Bottom Half: Friction Journal */}
        <FrictionJournal
          note={currentPlan.note}
          dateKey={selectedDateKey}
          isToday={isToday}
          onUpdateNote={onUpdateNote}
        />
      </section>

      {/* End-of-Day Rollover Modal */}
      <EODRolloverModal
        isOpen={isEODModalOpen}
        onClose={() => setIsEODModalOpen(false)}
        tasks={todayPlan.tasks}
        todayKey={todayKey}
        onConfirmDecisions={(decisions) => {
          onReviewAndRollover(decisions, todayKey);
        }}
      />
    </div>
  );
};
