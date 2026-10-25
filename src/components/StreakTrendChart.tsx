import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TrendingUp, Activity, CheckCircle2, Waves, Info } from 'lucide-react';
import { Habit, UrgeEntry } from '../types/index.ts';
import { calculateStreakTrendData } from '../utils/trendLogic.ts';

interface StreakTrendChartProps {
  habits: Habit[];
  urges: UrgeEntry[];
}

export const StreakTrendChart: React.FC<StreakTrendChartProps> = ({
  habits,
  urges,
}) => {
  const [viewMode, setViewMode] = useState<'both' | 'habits' | 'urges'>('both');
  const trendSummary = calculateStreakTrendData(habits, urges);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1C1C1C] border border-[#333] rounded-lg p-3 shadow-2xl text-xs space-y-1.5 font-sans">
          <div className="font-semibold text-white border-b border-[#2A2A2A] pb-1 font-mono text-[11px]">
            {data.weekLabel}
          </div>
          <div className="flex items-center justify-between gap-4 text-[#DDD]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#E5E5E5]" />
              <span>Habit Completion:</span>
            </span>
            <span className="font-mono font-bold tabular-nums">
              {data.habitCompletionRate}%
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 text-[#DDD]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#E07A5F]" />
              <span>Urges Intercepted:</span>
            </span>
            <span className="font-mono font-bold text-[#E07A5F] tabular-nums">
              {data.urgeCount}
            </span>
          </div>
          {data.avgUrgeIntensity > 0 && (
            <div className="text-[10px] text-[#777] font-mono pt-0.5 border-t border-[#262626]">
              Avg Craving Intensity: {data.avgUrgeIntensity}/10
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <section className="bg-[#181818] border border-[#262626] rounded-xl p-5 sm:p-6 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#232323]">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#E5E5E5]" />
          <div>
            <h2 className="text-sm font-semibold text-[#ECECEC] tracking-tight">
              Streak & Recovery Trend
            </h2>
            <p className="text-[11px] text-[#7A7A7A] mt-0.5">
              30-day weekly progression of habit discipline vs. urge frequency
            </p>
          </div>
        </div>

        {/* View Mode Segmented Controls */}
        <div className="flex items-center gap-1 bg-[#141414] p-1 rounded-lg border border-[#262626] self-start sm:self-center">
          <button
            type="button"
            onClick={() => setViewMode('both')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === 'both'
                ? 'bg-[#292929] text-white shadow-sm'
                : 'text-[#777] hover:text-[#CCC]'
            }`}
          >
            Combined
          </button>
          <button
            type="button"
            onClick={() => setViewMode('habits')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === 'habits'
                ? 'bg-[#292929] text-white shadow-sm'
                : 'text-[#777] hover:text-[#CCC]'
            }`}
          >
            Habits %
          </button>
          <button
            type="button"
            onClick={() => setViewMode('urges')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === 'urges'
                ? 'bg-[#292929] text-white shadow-sm'
                : 'text-[#777] hover:text-[#CCC]'
            }`}
          >
            Urges
          </button>
        </div>
      </div>

      {/* Summary Stat Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div className="bg-[#1C1C1C] border border-[#262626] rounded-lg p-3">
          <div className="text-[11px] text-[#7A7A7A] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-[#A3E635]" />
            <span>30-Day Habit Avg</span>
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1 tabular-nums">
            {trendSummary.overallAvgHabitRate}%
          </div>
        </div>

        <div className="bg-[#1C1C1C] border border-[#262626] rounded-lg p-3">
          <div className="text-[11px] text-[#7A7A7A] flex items-center gap-1">
            <Waves className="w-3 h-3 text-[#E07A5F]" />
            <span>Urges Intercepted</span>
          </div>
          <div className="text-xl font-bold font-mono text-[#E07A5F] mt-1 tabular-nums">
            {trendSummary.totalUrges30Days}
          </div>
        </div>

        <div className="bg-[#1C1C1C] border border-[#262626] rounded-lg p-3 col-span-2 sm:col-span-1">
          <div className="text-[11px] text-[#7A7A7A] flex items-center gap-1">
            <Activity className="w-3 h-3 text-[#E5C07B]" />
            <span>Discipline Shift</span>
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1 tabular-nums flex items-baseline gap-1">
            <span>
              {trendSummary.habitRateChange >= 0
                ? `+${trendSummary.habitRateChange}%`
                : `${trendSummary.habitRateChange}%`}
            </span>
            <span className="text-[10px] text-[#777] font-normal font-sans">
              vs month start
            </span>
          </div>
        </div>
      </div>

      {/* Recharts Chart Canvas */}
      <div className="h-64 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={trendSummary.weeklyData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="habitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E5E5E5" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#E5E5E5" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#242424"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="weekLabel"
              stroke="#666"
              tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={{ stroke: '#2A2A2A' }}
            />

            {(viewMode === 'both' || viewMode === 'habits') && (
              <YAxis
                yAxisId="left"
                stroke="#666"
                domain={[0, 100]}
                tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }}
                tickLine={false}
                axisLine={false}
                unit="%"
              />
            )}

            {(viewMode === 'both' || viewMode === 'urges') && (
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#666"
                domain={[0, 'dataMax + 2']}
                allowDecimals={false}
                tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }}
                tickLine={false}
                axisLine={false}
              />
            )}

            <Tooltip content={<CustomTooltip />} />

            {(viewMode === 'both' || viewMode === 'urges') && (
              <Bar
                yAxisId={viewMode === 'urges' ? 'right' : 'right'}
                dataKey="urgeCount"
                name="Urges"
                fill="#E07A5F"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
            )}

            {(viewMode === 'both' || viewMode === 'habits') && (
              <Area
                yAxisId={viewMode === 'habits' ? 'left' : 'left'}
                type="monotone"
                dataKey="habitCompletionRate"
                name="Habit Rate (%)"
                stroke="#E5E5E5"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#habitGradient)"
                dot={{ stroke: '#E5E5E5', strokeWidth: 2, r: 3.5, fill: '#141414' }}
                activeDot={{ r: 5, stroke: '#FFF', strokeWidth: 2, fill: '#E5E5E5' }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Insight Callout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#232323] text-xs">
        <div className="flex items-center gap-4 text-[11px] text-[#888]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-[#E5E5E5]" />
            <span>Habit Completion Rate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#E07A5F] rounded-xs" />
            <span>Urges Intercepted</span>
          </div>
        </div>

        <div className="text-[11px] text-[#7A7A7A] italic leading-relaxed sm:text-right max-w-sm">
          {trendSummary.trendInsight}
        </div>
      </div>
    </section>
  );
};
