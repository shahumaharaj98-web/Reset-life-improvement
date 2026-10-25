import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  ArrowRight,
  Flame,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { DailyTask } from '../types/index.ts';
import { TaskDecision } from '../utils/dailyTasksLogic.ts';
import { haptics } from '../utils/haptics.ts';

interface EODRolloverModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: DailyTask[];
  onConfirmDecisions: (decisions: TaskDecision[]) => void;
  todayKey: string;
}

export const EODRolloverModal: React.FC<EODRolloverModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onConfirmDecisions,
  todayKey,
}) => {
  const unfinishedTasks = tasks.filter((t) => !t.completed);

  // Initialize decisions mapping
  const [decisions, setDecisions] = useState<Record<string, TaskDecision['action']>>(() => {
    const initial: Record<string, TaskDecision['action']> = {};
    for (const t of unfinishedTasks) {
      initial[t.id] = 'rollover_priority'; // default to rolling over with priority
    }
    return initial;
  });

  if (!isOpen) return null;

  const setDecisionForTask = (taskId: string, action: TaskDecision['action']) => {
    setDecisions((prev) => ({
      ...prev,
      [taskId]: action,
    }));
  };

  const setAllDecisions = (action: TaskDecision['action']) => {
    const updated: Record<string, TaskDecision['action']> = {};
    for (const t of unfinishedTasks) {
      updated[t.id] = action;
    }
    setDecisions(updated);
  };

  const handleApply = () => {
    const decisionArray: TaskDecision[] = unfinishedTasks.map((t) => ({
      taskId: t.id,
      action: decisions[t.id] || 'rollover_priority',
    }));
    onConfirmDecisions(decisionArray);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#181818] border border-[#2E2E2E] rounded-xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#262626] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#241F16] border border-[#45371E] flex items-center justify-center text-[#E5C07B]">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">
                End-of-Day Task Rollover
              </h3>
              <p className="text-xs text-[#888]">
                {unfinishedTasks.length} pending task{unfinishedTasks.length === 1 ? '' : 's'} before midnight reset
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#666] hover:text-[#CCC] p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informative Note */}
        <div className="bg-[#141414] border border-[#242424] p-3 rounded-lg text-xs text-[#AAA] flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-[#E5C07B] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Review your unfinished action items. Prioritise tasks that truly matter for tomorrow, or dismiss tasks that no longer serve you to start with a clean slate.
          </p>
        </div>

        {/* Quick Bulk Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span className="text-[#777] font-mono text-[11px] uppercase">Bulk Decision:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                haptics.light();
                setAllDecisions('rollover_priority');
              }}
              className="px-2 py-1 rounded bg-[#202020] hover:bg-[#2A2A2A] text-[#E5C07B] text-[11px] border border-[#333] transition-colors cursor-pointer"
            >
              Roll All (High)
            </button>
            <button
              type="button"
              onClick={() => {
                haptics.light();
                setAllDecisions('rollover_normal');
              }}
              className="px-2 py-1 rounded bg-[#202020] hover:bg-[#2A2A2A] text-[#BBB] text-[11px] border border-[#333] transition-colors cursor-pointer"
            >
              Roll All (Normal)
            </button>
            <button
              type="button"
              onClick={() => {
                haptics.warning();
                setAllDecisions('dismiss');
              }}
              className="px-2 py-1 rounded bg-[#2A1818] hover:bg-[#381F1F] text-[#E07A5F] text-[11px] border border-[#552727] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3 text-[#E07A5F]" />
              <span>Delete All</span>
            </button>
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {unfinishedTasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#777] bg-[#141414] rounded-lg border border-[#222]">
              <CheckCircle2 className="w-6 h-6 text-[#98C379] mx-auto mb-2 opacity-80" />
              <span>All daily tasks completed! Nothing needs rolling over.</span>
            </div>
          ) : (
            unfinishedTasks.map((task) => {
              const currentAction = decisions[task.id] || 'rollover_priority';
              return (
                <div
                  key={task.id}
                  className="p-3 rounded-lg bg-[#141414] border border-[#242424] space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-[#E5E5E5] font-medium truncate flex-1">
                      {task.title}
                    </span>
                    {task.priority === 'high' && (
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#3A1B1B] text-[#E07A5F] border border-[#522525] shrink-0">
                        High Priority
                      </span>
                    )}
                  </div>

                  {/* Actions for this specific task */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        haptics.light();
                        setDecisionForTask(task.id, 'rollover_priority');
                      }}
                      className={`px-2 py-1.5 rounded text-[11px] font-medium flex items-center justify-center gap-1 border transition-colors cursor-pointer ${
                        currentAction === 'rollover_priority'
                          ? 'bg-[#2E2413] border-[#725324] text-[#F3D38C]'
                          : 'bg-[#1C1C1C] border-[#2B2B2B] text-[#888] hover:text-[#CCC]'
                      }`}
                    >
                      <ArrowRight className="w-3 h-3 text-[#E5C07B]" />
                      <span>Prioritise</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        haptics.light();
                        setDecisionForTask(task.id, 'rollover_normal');
                      }}
                      className={`px-2 py-1.5 rounded text-[11px] font-medium flex items-center justify-center gap-1 border transition-colors cursor-pointer ${
                        currentAction === 'rollover_normal'
                          ? 'bg-[#222] border-[#444] text-white'
                          : 'bg-[#1C1C1C] border-[#2B2B2B] text-[#888] hover:text-[#CCC]'
                      }`}
                    >
                      <RotateCcw className="w-3 h-3 text-[#999]" />
                      <span>Roll Over</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        haptics.warning();
                        setDecisionForTask(task.id, 'dismiss');
                      }}
                      title="Permanently delete this task (won't roll over)"
                      className={`px-2 py-1.5 rounded text-[11px] font-medium flex items-center justify-center gap-1 border transition-colors cursor-pointer ${
                        currentAction === 'dismiss'
                          ? 'bg-[#2A1818] border-[#662B2B] text-[#E07A5F] font-semibold'
                          : 'bg-[#1C1C1C] border-[#2B2B2B] text-[#888] hover:text-[#E07A5F]'
                      }`}
                    >
                      <Trash2 className="w-3 h-3 text-[#E07A5F]" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#262626] pt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-xs font-medium text-[#888] hover:text-[#DDD] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={unfinishedTasks.length === 0}
            className="px-4 py-2 text-xs font-semibold bg-[#E6E6E6] hover:bg-white disabled:opacity-40 text-[#121212] rounded-lg transition-colors shadow-sm"
          >
            Confirm Decisions
          </button>
        </div>
      </div>
    </div>
  );
};
