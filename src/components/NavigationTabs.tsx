import React from 'react';
import { Activity, CheckSquare, Sparkles } from 'lucide-react';

export type AppTab = 'progress' | 'workspace';

interface NavigationTabsProps {
  activeTab: AppTab;
  onChangeTab: (tab: AppTab) => void;
  unfinishedTasksCount: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onChangeTab,
  unfinishedTasksCount,
}) => {
  return (
    <div className="flex items-center justify-center w-full">
      <div className="bg-[#181818] border border-[#262626] rounded-xl p-1 flex items-center gap-1 w-full max-w-sm sm:max-w-md shadow-xs">
        {/* Progress & Recovery Tab */}
        <button
          type="button"
          onClick={() => onChangeTab('progress')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'progress'
              ? 'bg-[#292929] text-white shadow-xs border border-[#383838]'
              : 'text-[#888] hover:text-[#CCC] hover:bg-[#1E1E1E]'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-[#E5C07B]" />
          <span>Progress & Recovery</span>
        </button>

        {/* Workspace Tab */}
        <button
          type="button"
          onClick={() => onChangeTab('workspace')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer relative ${
            activeTab === 'workspace'
              ? 'bg-[#292929] text-white shadow-xs border border-[#383838]'
              : 'text-[#888] hover:text-[#CCC] hover:bg-[#1E1E1E]'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5 text-[#61AFEF]" />
          <span>Workspace</span>

          {unfinishedTasksCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-[#E5C07B] animate-pulse" />
          )}
        </button>
      </div>
    </div>
  );
};
