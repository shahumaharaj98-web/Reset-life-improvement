import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Calendar,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import { DailyDayPlan, DailyTask } from '../types/index.ts';
import {
  evaluateUnfinishedTasksWarning,
  checkPreviousDayExpiredTasks,
  getHoursUntilMidnight,
} from '../utils/dailyTasksLogic.ts';
import { formatDateKey } from '../utils/resetLogic.ts';

interface DailyTasksAndNotesProps {
  planner: Record<string, DailyDayPlan>;
  todayKey?: string;
  onAddTask: (title: string, dateKey?: string) => void;
  onToggleTask: (taskId: string, dateKey?: string) => void;
  onDeleteTask: (taskId: string, dateKey?: string) => void;
  onUpdateNote: (note: string, dateKey?: string) => void;
  onRolloverTasks: (fromKey: string, toKey?: string) => void;
}

export const DailyTasksAndNotes: React.FC<DailyTasksAndNotesProps> = ({
  planner,
  todayKey = formatDateKey(),
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onUpdateNote,
  onRolloverTasks,
}) => {
  const [activeDateKey, setActiveDateKey] = useState(todayKey);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [now, setNow] = useState(new Date());

  // Update clock every minute for accurate hours-to-midnight countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const plan = planner[activeDateKey] || { note: '', tasks: [] };
  const warning = evaluateUnfinishedTasksWarning(plan.tasks, now);
  const yesterdayExpired = checkPreviousDayExpiredTasks(planner, todayKey);
  const hoursLeft = Math.ceil(getHoursUntilMidnight(now));

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    onAddTask(newTaskInput.trim(), activeDateKey);
    setNewTaskInput('');
  };

  const completedCount = plan.tasks.filter((t) => t.completed).length;

  return (
    <section className="bg-[#181818] border border-[#262626] rounded-xl p-5 sm:p-6 space-y-5">
      {/* Notion Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#232323]">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#ECECEC]" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[#ECECEC] tracking-tight">
                Daily Tasks & Scratchpad
              </h2>
              <span className="text-[11px] font-mono text-[#777] bg-[#202020] px-1.5 py-0.5 rounded border border-[#2C2C2C]">
                {completedCount}/{plan.tasks.length} done
              </span>
            </div>
            <p className="text-[11px] text-[#7A7A7A] mt-0.5">
              Daily task list resets automatically at midnight · Keep tabs on immediate priorities
            </p>
          </div>
        </div>

        {/* Date / Day Indicator */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#888] self-start sm:self-center">
          <Clock className="w-3.5 h-3.5 text-[#666]" />
          <span>{hoursLeft}h until midnight reset</span>
        </div>
      </div>

      {/* Unfinished Tasks Warning Banner */}
      {warning.hasWarning && activeDateKey === todayKey && (
        <div className={`p-3.5 rounded-lg border flex items-start gap-3 transition-all ${
          warning.urgency === 'urgent'
            ? 'bg-[#261717] border-[#4A2424] text-[#E07A5F]'
            : 'bg-[#241F16] border-[#45371E] text-[#E5C07B]'
        }`}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <div className="font-semibold text-white">
              Unfinished Tasks Warning
            </div>
            <p className="text-[11px] mt-0.5 leading-relaxed text-[#DDD]">
              {warning.message} Daily tasks clear at midnight. Wrap them up or carry them over.
            </p>
          </div>
        </div>
      )}

      {/* Yesterday Expired Tasks Notice & One-Tap Rollover */}
      {yesterdayExpired.hasExpiredTasks && activeDateKey === todayKey && (
        <div className="bg-[#1C1C1C] border border-[#2B2B2B] p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-[#AAA]">
            <RotateCcw className="w-3.5 h-3.5 text-[#E07A5F]" />
            <span>
              {yesterdayExpired.expiredCount} task{yesterdayExpired.expiredCount === 1 ? '' : 's'} were left unfinished yesterday ({yesterdayExpired.yesterdayKey}).
            </span>
          </div>
          <button
            type="button"
            onClick={() => onRolloverTasks(yesterdayExpired.yesterdayKey, todayKey)}
            className="px-2.5 py-1 text-xs font-medium bg-[#282828] hover:bg-[#333] text-white rounded transition-colors self-start sm:self-auto shrink-0 flex items-center gap-1.5"
          >
            <span>Carry Over to Today</span>
          </button>
        </div>
      )}

      {/* Split Grid: Left = Tasks Checklist, Right = Daily Scratchpad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Interactive Daily Tasks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-[#888] uppercase tracking-wider">
            <span>Today's Action Items</span>
            <span>{plan.tasks.length} total</span>
          </div>

          {/* New Task Inline Form */}
          <form onSubmit={handleCreateTask} className="flex items-center gap-2">
            <input
              type="text"
              value={newTaskInput}
              onChange={(e) => setNewTaskInput(e.target.value)}
              placeholder="+ Add a task for today (Enter to save)..."
              className="flex-1 bg-[#141414] border border-[#2D2D2D] hover:border-[#404040] focus:border-[#666] rounded-lg px-3 py-2 text-xs text-white placeholder-[#555] focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!newTaskInput.trim()}
              className="px-3 py-2 bg-[#262626] hover:bg-[#333] disabled:opacity-40 disabled:hover:bg-[#262626] text-white rounded-lg text-xs font-medium transition-colors shrink-0"
            >
              Add
            </button>
          </form>

          {/* Task List */}
          {plan.tasks.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#555] bg-[#141414] rounded-lg border border-[#202020]">
              No tasks added yet for today. Type above to add your first priority.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {plan.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-2.5 p-2.5 rounded-lg bg-[#151515] hover:bg-[#1A1A1A] border border-[#222] transition-colors group"
                >
                  <button
                    type="button"
                    onClick={() => onToggleTask(task.id, activeDateKey)}
                    className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center transition-colors shrink-0 border ${
                      task.completed
                        ? 'bg-[#E5E5E5] border-[#E5E5E5] text-[#121212]'
                        : 'border-[#444] bg-[#1E1E1E]'
                    }`}>
                      {task.completed && <span className="text-[10px] font-bold">✓</span>}
                    </div>

                    <span className={`text-xs select-none truncate ${
                      task.completed
                        ? 'text-[#666] line-through'
                        : 'text-[#DDD] hover:text-white'
                    }`}>
                      {task.title}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteTask(task.id, activeDateKey)}
                    title="Delete task"
                    className="opacity-0 group-hover:opacity-100 text-[#555] hover:text-[#CCC] p-1 rounded transition-opacity shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Daily Scratchpad & Notes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-[#888] uppercase tracking-wider">
            <span>Daily Scratchpad</span>
            <span className="text-[11px] text-[#666] lowercase">auto-saved</span>
          </div>

          <div className="relative">
            <textarea
              rows={8}
              value={plan.note}
              onChange={(e) => onUpdateNote(e.target.value, activeDateKey)}
              placeholder="Jot down notes, reflections, intentions, or things to keep on your radar for today...&#10;&#10;• What is my main objective today?&#10;• What friction did I overcome?"
              className="w-full bg-[#141414] border border-[#2D2D2D] hover:border-[#404040] focus:border-[#666] rounded-lg p-3 text-xs text-[#E5E5E5] placeholder-[#555] focus:outline-none transition-colors resize-none leading-relaxed font-sans"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
