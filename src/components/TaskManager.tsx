import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, Reorder, PanInfo } from 'motion/react';
import {
  Plus,
  Trash2,
  AlertTriangle,
  ArrowRight,
  Clock,
  RotateCcw,
  GripVertical,
  Sparkles,
  Check,
  Undo2,
  CheckCheck,
} from 'lucide-react';
import { DailyTask, TaskPriority } from '../types/index.ts';
import {
  evaluateUnfinishedTasksWarning,
  getHoursUntilMidnight,
} from '../utils/dailyTasksLogic.ts';
import { haptics } from '../utils/haptics.ts';

interface TaskManagerProps {
  tasks: DailyTask[];
  dateKey: string;
  isToday: boolean;
  onAddTask: (title: string, priority?: TaskPriority, targetDateKey?: string) => void;
  onToggleTask: (taskId: string, targetDateKey?: string) => void;
  onDeleteTask: (taskId: string, targetDateKey?: string) => void;
  onMigrateTask: (taskId: string, fromDateKey?: string, prioritise?: boolean) => void;
  onReorderTasks?: (reorderedTasks: DailyTask[]) => void;
  onClearCompleted?: (dateKey: string) => void;
  onClearAll?: (dateKey: string) => void;
  onOpenEODModal: () => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({
  tasks,
  dateKey,
  isToday,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onMigrateTask,
  onReorderTasks,
  onClearCompleted,
  onClearAll,
  onOpenEODModal,
}) => {
  const [newTaskInput, setNewTaskInput] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority>('normal');
  const [now] = useState(new Date());

  // Spatial drop target tracking
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [activeHoverZone, setActiveHoverZone] = useState<'migrate' | 'delete' | null>(null);
  
  // Status & Undo toast
  const [recentlyMigratedTitle, setRecentlyMigratedTitle] = useState<string | null>(null);
  const [lastDeletedTask, setLastDeletedTask] = useState<{
    id: string;
    title: string;
    priority?: TaskPriority;
    completed: boolean;
  } | null>(null);

  const dropMigrateRef = useRef<HTMLDivElement>(null);
  const dropDeleteRef = useRef<HTMLDivElement>(null);

  const hoursLeft = Math.ceil(getHoursUntilMidnight(now));
  const warning = evaluateUnfinishedTasksWarning(tasks, now);
  const unfinishedCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    haptics.medium();
    onAddTask(newTaskInput.trim(), selectedPriority, dateKey);
    setNewTaskInput('');
    setSelectedPriority('normal');
  };

  const handleReorder = (newOrder: DailyTask[]) => {
    haptics.light();
    if (onReorderTasks) {
      onReorderTasks(newOrder);
    }
  };

  const handleDeleteWithUndo = (task: DailyTask) => {
    haptics.warning();
    setLastDeletedTask({
      id: task.id,
      title: task.title,
      priority: task.priority,
      completed: task.completed,
    });
    onDeleteTask(task.id, dateKey);
  };

  const handleUndoDelete = () => {
    if (!lastDeletedTask) return;
    haptics.success();
    onAddTask(lastDeletedTask.title, lastDeletedTask.priority, dateKey);
    setLastDeletedTask(null);
  };

  const handleClearCompletedTasks = () => {
    if (completedCount === 0) return;
    haptics.warning();
    if (onClearCompleted) {
      onClearCompleted(dateKey);
    } else {
      // Fallback if prop not provided
      tasks.filter((t) => t.completed).forEach((t) => onDeleteTask(t.id, dateKey));
    }
  };

  const handleClearAllTasks = () => {
    if (tasks.length === 0) return;
    if (window.confirm('Delete all tasks for this day?')) {
      haptics.warning();
      if (onClearAll) {
        onClearAll(dateKey);
      } else {
        tasks.forEach((t) => onDeleteTask(t.id, dateKey));
      }
    }
  };

  // Check spatial coordinates against both drop zones
  const detectHoverZone = (pointY: number, pointX: number): 'migrate' | 'delete' | null => {
    if (dropMigrateRef.current) {
      const rect = dropMigrateRef.current.getBoundingClientRect();
      if (
        pointY >= rect.top - 25 &&
        pointY <= rect.bottom + 45 &&
        pointX >= rect.left - 25 &&
        pointX <= rect.right + 25
      ) {
        return 'migrate';
      }
    }

    if (dropDeleteRef.current) {
      const rect = dropDeleteRef.current.getBoundingClientRect();
      if (
        pointY >= rect.top - 25 &&
        pointY <= rect.bottom + 45 &&
        pointX >= rect.left - 25 &&
        pointX <= rect.right + 25
      ) {
        return 'delete';
      }
    }

    return null;
  };

  const handleItemDrag = (_: unknown, info: PanInfo) => {
    const zone = detectHoverZone(info.point.y, info.point.x);
    if (zone !== activeHoverZone) {
      setActiveHoverZone(zone);
      if (zone) {
        haptics.light();
      }
    }
  };

  const handleItemDragEnd = (_: unknown, info: PanInfo, task: DailyTask) => {
    const finalZone = detectHoverZone(info.point.y, info.point.x) || activeHoverZone;

    if (finalZone === 'migrate' && !task.completed) {
      onMigrateTask(task.id, dateKey, false);
      haptics.success();
      setRecentlyMigratedTitle(task.title);
      setTimeout(() => setRecentlyMigratedTitle(null), 3500);
    } else if (finalZone === 'delete') {
      handleDeleteWithUndo(task);
    } else {
      haptics.drop();
    }

    setDraggedTaskId(null);
    setActiveHoverZone(null);
  };

  return (
    <div className="space-y-4">
      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#232323]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              <span>Task Manager</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#202020] text-[#999] border border-[#2B2B2B]">
                Spatial & Interactive
              </span>
            </h3>
            <span className="text-[11px] font-mono text-[#888] bg-[#202020] px-1.5 py-0.5 rounded border border-[#2B2B2B]">
              {completedCount}/{tasks.length} done
            </span>
          </div>
          <p className="text-[11px] text-[#7A7A7A] mt-0.5">
            {isToday
              ? 'Long-press to reorder · Drag to migrate or delete · Tap 🗑️ to delete'
              : `Tasks queued for tomorrow (${dateKey})`}
          </p>
        </div>

        {/* Task Management Actions (EOD, Clear Completed, Clear All) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Clear Completed Action */}
          {completedCount > 0 && (
            <button
              type="button"
              onClick={handleClearCompletedTasks}
              title="Delete all completed tasks from today"
              className="px-2 py-1 text-xs font-medium rounded-md bg-[#221818] hover:bg-[#2F1E1E] text-[#E07A5F] border border-[#482828] transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <Trash2 className="w-3 h-3 text-[#E07A5F]" />
              <span>Clear Done ({completedCount})</span>
            </button>
          )}

          {/* EOD Action or Countdown */}
          {isToday && (
            <>
              <span className="text-xs font-mono text-[#888] hidden sm:inline-flex items-center gap-1 ml-1">
                <Clock className="w-3.5 h-3.5 text-[#666]" />
                <span>{hoursLeft}h left</span>
              </span>
              {unfinishedCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    haptics.medium();
                    onOpenEODModal();
                  }}
                  className="px-2.5 py-1 text-xs font-medium rounded-md bg-[#251D14] hover:bg-[#322517] text-[#E5C07B] border border-[#503A1F] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>EOD Rollover ({unfinishedCount})</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Migration Notification Banner */}
      <AnimatePresence>
        {recentlyMigratedTitle && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="p-2.5 rounded-lg bg-[#18261E] border border-[#2B543A] text-emerald-300 text-xs flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-mono truncate">
              Migrated <strong>"{recentlyMigratedTitle}"</strong> to tomorrow!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Undo Delete Banner */}
      <AnimatePresence>
        {lastDeletedTask && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="p-2.5 rounded-lg bg-[#251818] border border-[#522929] text-[#E07A5F] text-xs flex items-center justify-between gap-2 shadow-md"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                Deleted <strong>"{lastDeletedTask.title}"</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleUndoDelete}
                className="px-2.5 py-1 rounded bg-[#381F1F] hover:bg-[#482828] text-white font-medium text-[11px] flex items-center gap-1 border border-[#633434] cursor-pointer active:scale-95 transition-colors"
              >
                <Undo2 className="w-3 h-3" />
                <span>Undo</span>
              </button>
              <button
                type="button"
                onClick={() => setLastDeletedTask(null)}
                className="text-[#888] hover:text-[#CCC] p-0.5 text-xs"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warning Alert Banner */}
      {isToday && warning.hasWarning && (
        <div
          className={`p-3 rounded-lg border flex items-start justify-between gap-3 text-xs transition-all ${
            warning.urgency === 'urgent'
              ? 'bg-[#261717] border-[#4A2424] text-[#E07A5F]'
              : 'bg-[#241F16] border-[#45371E] text-[#E5C07B]'
          }`}
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white block">Unfinished Tasks Pending</span>
              <p className="text-[11px] text-[#D8D8D8] mt-0.5 leading-relaxed">
                {warning.message} Drag below to roll over or delete.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              haptics.medium();
              onOpenEODModal();
            }}
            className="px-2.5 py-1 rounded bg-[#181818] hover:bg-[#222] text-white text-[11px] font-medium border border-[#3A3A3A] shrink-0 transition-colors cursor-pointer"
          >
            Review Now
          </button>
        </div>
      )}

      {/* Inline Add Task Form */}
      <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={newTaskInput}
            onChange={(e) => setNewTaskInput(e.target.value)}
            placeholder={
              isToday
                ? '+ Add daily to-do (Enter to save)...'
                : '+ Add task for tomorrow...'
            }
            className="w-full bg-[#141414] border border-[#2D2D2D] hover:border-[#3D3D3D] focus:border-[#666] rounded-lg px-3 py-2 text-xs text-white placeholder-[#555] focus:outline-none transition-colors"
          />
        </div>

        {/* Priority Selector & Submit Button */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value as TaskPriority)}
            className="bg-[#141414] border border-[#2D2D2D] text-xs text-[#AAA] rounded-lg px-2 py-2 focus:outline-none focus:border-[#666]"
          >
            <option value="normal">Normal</option>
            <option value="medium">Medium</option>
            <option value="high">High Priority</option>
          </select>

          <button
            type="submit"
            disabled={!newTaskInput.trim()}
            className="px-3 py-2 bg-[#262626] hover:bg-[#333] disabled:opacity-40 disabled:hover:bg-[#262626] text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </form>

      {/* Reorderable Spatial Task List */}
      {tasks.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#666] bg-[#141414] rounded-lg border border-[#202020]">
          {isToday
            ? 'No tasks for today. Add what needs to get done.'
            : 'No tasks scheduled for tomorrow yet.'}
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={tasks}
          onReorder={handleReorder}
          className="space-y-1.5"
        >
          {tasks.map((task) => {
            const isDraggingThis = draggedTaskId === task.id;

            return (
              <Reorder.Item
                key={task.id}
                value={task}
                onDragStart={() => {
                  setDraggedTaskId(task.id);
                  haptics.dragStart();
                }}
                onDrag={handleItemDrag}
                onDragEnd={(_e, info) => handleItemDragEnd(_e, info, task)}
                whileDrag={{
                  scale: 1.02,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                  zIndex: 40,
                }}
                className={`relative rounded-lg border transition-colors select-none ${
                  isDraggingThis
                    ? 'border-amber-500/60 bg-[#222]'
                    : task.completed
                    ? 'bg-[#141414] border-[#1F1F1F] opacity-75'
                    : 'bg-[#181818] hover:bg-[#1D1D1D] border-[#262626] hover:border-[#333]'
                }`}
                style={{ listStyle: 'none' }}
              >
                <div className="flex items-center justify-between gap-2.5 p-2.5 group">
                  {/* Drag Handle & Checkbox */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Drag Grab Handle */}
                    <div
                      title="Drag to reorder, or drop into bottom zones to migrate/delete"
                      className="cursor-grab active:cursor-grabbing text-[#4A4A4A] group-hover:text-[#888] transition-colors p-0.5 rounded touch-none"
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>

                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => {
                        onToggleTask(task.id, dateKey);
                        if (!task.completed) {
                          haptics.success();
                        } else {
                          haptics.medium();
                        }
                      }}
                      className={`w-4 h-4 rounded flex items-center justify-center transition-colors shrink-0 border cursor-pointer active:scale-90 ${
                        task.completed
                          ? 'bg-[#E5E5E5] border-[#E5E5E5] text-[#121212]'
                          : 'border-[#444] bg-[#222]'
                      }`}
                    >
                      {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>

                    {/* Task Title & Tags */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                        onClick={() => {
                          onToggleTask(task.id, dateKey);
                          if (!task.completed) haptics.success();
                          else haptics.medium();
                        }}
                        className={`text-xs select-none truncate cursor-pointer ${
                          task.completed
                            ? 'text-[#666] line-through'
                            : 'text-[#DDD] hover:text-white'
                        }`}
                      >
                        {task.title}
                      </span>

                      {/* Priority Pill */}
                      {task.priority === 'high' && (
                        <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-[#331818] text-[#E07A5F] border border-[#482020] shrink-0">
                          High
                        </span>
                      )}
                      {task.priority === 'medium' && (
                        <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-[#2D2515] text-[#E5C07B] border border-[#44361C] shrink-0">
                          Med
                        </span>
                      )}

                      {/* Rolled Over Tag */}
                      {task.rolledOverFrom && (
                        <span
                          title={`Rolled over from ${task.rolledOverFrom}`}
                          className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#1F2420] text-[#98C379] border border-[#2C382F] shrink-0 flex items-center gap-0.5"
                        >
                          <span>➔ from yesterday</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions: Migrate & Delete */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!task.completed && (
                      <button
                        type="button"
                        onClick={() => {
                          haptics.success();
                          onMigrateTask(task.id, dateKey, false);
                          setRecentlyMigratedTitle(task.title);
                          setTimeout(() => setRecentlyMigratedTitle(null), 3000);
                        }}
                        title="Migrate (➔) to next day"
                        className="flex items-center gap-1 px-1.5 py-1 text-[11px] font-mono rounded bg-[#202020] hover:bg-[#2A2A2A] text-[#888] hover:text-[#E5C07B] border border-[#2E2E2E] transition-colors cursor-pointer active:scale-95"
                      >
                        <span>Migrate</span>
                        <ArrowRight className="w-3 h-3 text-[#E5C07B]" />
                      </button>
                    )}

                    {/* Dedicated Delete Button (Visible & Touch-Friendly) */}
                    <button
                      type="button"
                      onClick={() => handleDeleteWithUndo(task)}
                      title="Delete task immediately"
                      aria-label={`Delete task ${task.title}`}
                      className="text-[#777] hover:text-[#E07A5F] hover:bg-[#2D1616] active:bg-[#3D1E1E] p-1.5 rounded-md transition-colors cursor-pointer active:scale-90"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      )}

      {/* Dual Spatial Drop Target Zones at the Bottom */}
      {isToday && tasks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {/* Zone 1: Migrate to Tomorrow */}
          <div
            ref={dropMigrateRef}
            className={`border-2 border-dashed rounded-xl p-3.5 text-center transition-all duration-200 select-none ${
              activeHoverZone === 'migrate'
                ? 'border-amber-400 bg-amber-950/50 text-amber-200 scale-[1.02] shadow-lg shadow-amber-950/50'
                : draggedTaskId
                ? 'border-amber-500/50 bg-amber-950/20 text-amber-300'
                : 'border-[#262626] hover:border-[#383838] bg-[#141414]/50 text-[#777]'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform ${
                  activeHoverZone === 'migrate'
                    ? 'bg-amber-400 text-black scale-110'
                    : 'bg-[#222] text-[#AAA]'
                }`}
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <span className="text-xs font-semibold font-mono tracking-tight block">
                  {activeHoverZone === 'migrate'
                    ? '★ Release to Migrate!'
                    : '➔ Drop to Migrate'}
                </span>
                <span className="text-[10px] text-[#666] block">
                  Reschedule for tomorrow
                </span>
              </div>
            </div>
          </div>

          {/* Zone 2: Discard / Delete */}
          <div
            ref={dropDeleteRef}
            className={`border-2 border-dashed rounded-xl p-3.5 text-center transition-all duration-200 select-none ${
              activeHoverZone === 'delete'
                ? 'border-rose-500 bg-rose-950/60 text-rose-200 scale-[1.02] shadow-lg shadow-rose-950/60'
                : draggedTaskId
                ? 'border-rose-900/50 bg-rose-950/20 text-rose-400'
                : 'border-[#262626] hover:border-[#383838] bg-[#141414]/50 text-[#777]'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform ${
                  activeHoverZone === 'delete'
                    ? 'bg-rose-500 text-white scale-110'
                    : 'bg-[#222] text-[#AAA]'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <span className="text-xs font-semibold font-mono tracking-tight block">
                  {activeHoverZone === 'delete'
                    ? '★ Release to Delete!'
                    : '🗑️ Drop to Delete'}
                </span>
                <span className="text-[10px] text-[#666] block">
                  Remove task permanently
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
