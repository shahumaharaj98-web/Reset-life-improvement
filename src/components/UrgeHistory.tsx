import React, { useState } from 'react';
import { Trash2, ChevronDown, ChevronUp, Clock, AlertTriangle, CheckCircle, BarChart2, Lightbulb } from 'lucide-react';
import { UrgeEntry } from '../types/index.ts';
import { getHourlyUrgeDistribution, summarizeUrges } from '../utils/resetLogic.ts';

interface UrgeHistoryProps {
  urges: UrgeEntry[];
  onDeleteUrge: (id: string) => void;
}

export const UrgeHistory: React.FC<UrgeHistoryProps> = ({
  urges,
  onDeleteUrge,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  const summary = summarizeUrges(urges);
  const vulnerability = getHourlyUrgeDistribution(urges);

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <section className="bg-[#181818] border border-[#262626] rounded-xl overflow-hidden">
      {/* Header Accordion Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 sm:p-6 text-left flex items-center justify-between hover:bg-[#1B1B1B] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-base select-none">📊</span>
          <div>
            <div className="text-sm font-semibold text-[#E6E6E6] flex items-center gap-2">
              <span>Urge Journal & Patterns</span>
              <span className="text-xs font-mono text-[#777]">
                ({urges.length} logged)
              </span>
            </div>
            <div className="text-xs text-[#7A7A7A] mt-0.5">
              Review triggers, 24h vulnerability heatmap, and urge surfing victories
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#888]">
          <span className="hidden sm:inline">
            {summary.topTrigger !== 'None' ? `Top trigger: ${summary.topTrigger}` : ''}
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="px-5 sm:px-6 pb-6 pt-1 border-t border-[#232323] space-y-6">
          {/* Summary Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            <div className="bg-[#1C1C1C] border border-[#282828] rounded-lg p-3">
              <div className="text-[11px] text-[#777]">Total Urges</div>
              <div className="text-xl font-bold font-mono text-[#DDD] mt-0.5 tabular-nums">
                {summary.totalLogged}
              </div>
            </div>
            <div className="bg-[#1C1C1C] border border-[#282828] rounded-lg p-3">
              <div className="text-[11px] text-[#777]">Logged Today</div>
              <div className="text-xl font-bold font-mono text-[#DDD] mt-0.5 tabular-nums">
                {summary.todayCount}
              </div>
            </div>
            <div className="bg-[#1C1C1C] border border-[#282828] rounded-lg p-3">
              <div className="text-[11px] text-[#777]">Avg Intensity</div>
              <div className="text-xl font-bold font-mono text-[#DDD] mt-0.5 tabular-nums">
                {summary.averageIntensity} / 10
              </div>
            </div>
            <div className="bg-[#1C1C1C] border border-[#282828] rounded-lg p-3">
              <div className="text-[11px] text-[#777]">Primary Trigger</div>
              <div className="text-base font-semibold text-[#DDD] mt-1 truncate">
                {summary.topTrigger}
              </div>
            </div>
          </div>

          {/* Feature 3: 24-Hour Urge Vulnerability Heatmap */}
          <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#E07A5F]" />
                <h3 className="font-semibold text-xs text-[#E5E5E5] tracking-tight">
                  24-Hour Vulnerability Heatmap
                </h3>
              </div>
              <div className="text-xs font-mono text-[#888]">
                Peak Window: <span className="text-[#E07A5F] font-semibold">{vulnerability.peakWindowLabel}</span>
              </div>
            </div>

            {/* 24-Hour Bars */}
            <div className="pt-2">
              <div className="h-16 flex items-end gap-1 bg-[#141414] p-2 rounded-lg border border-[#242424]">
                {vulnerability.hourlyBuckets.map((bucket) => {
                  const max = vulnerability.maxHourlyCount || 1;
                  const heightPercent = bucket.count > 0 ? Math.max(15, Math.round((bucket.count / max) * 100)) : 4;
                  const isPeak = vulnerability.peakHour === bucket.hour && bucket.count > 0;
                  const isHovered = selectedHour === bucket.hour;

                  return (
                    <button
                      key={bucket.hour}
                      type="button"
                      onMouseEnter={() => setSelectedHour(bucket.hour)}
                      onMouseLeave={() => setSelectedHour(null)}
                      onClick={() => setSelectedHour(selectedHour === bucket.hour ? null : bucket.hour)}
                      className="flex-1 h-full flex flex-col justify-end items-center group relative focus:outline-none"
                    >
                      <div
                        className={`w-full rounded-t transition-all ${
                          isPeak
                            ? 'bg-[#E07A5F]'
                            : bucket.count > 0
                            ? 'bg-[#E5C07B]'
                            : 'bg-[#222] hover:bg-[#333]'
                        } ${isHovered ? 'ring-1 ring-white' : ''}`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Time axis labels */}
              <div className="flex justify-between text-[9px] font-mono text-[#666] mt-1.5 px-1">
                <span>12 AM</span>
                <span>4 AM</span>
                <span>8 AM</span>
                <span>12 PM</span>
                <span>4 PM</span>
                <span>8 PM</span>
                <span>11 PM</span>
              </div>

              {/* Hovered / selected hour indicator */}
              {selectedHour !== null && (
                <div className="mt-2 text-center text-xs text-[#CCC] bg-[#171717] py-1 px-3 rounded border border-[#292929] inline-block font-mono">
                  {vulnerability.hourlyBuckets[selectedHour].label}: {vulnerability.hourlyBuckets[selectedHour].count} urge(s)
                </div>
              )}
            </div>

            {/* Actionable Insight Callout */}
            <div className="bg-[#171717] border border-[#252525] rounded-lg p-3 flex items-start gap-2.5 text-xs">
              <Lightbulb className="w-3.5 h-3.5 text-[#E5C07B] shrink-0 mt-0.5" />
              <p className="text-[#A5A5A5] leading-relaxed text-[11px]">
                {vulnerability.actionableInsight}
              </p>
            </div>
          </div>

          {/* List of Entries */}
          {urges.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#666]">
              No urge events logged yet. Tap "Log an Urge" whenever an impulse strikes.
            </div>
          ) : (
            <div className="divide-y divide-[#242424] border border-[#242424] rounded-lg overflow-hidden bg-[#151515]">
              {urges.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs hover:bg-[#1A1A1A] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-[#E0E0E0] bg-[#222] px-2 py-0.5 rounded text-[11px] border border-[#2E2E2E]">
                        {entry.trigger}
                      </span>
                      <span className="text-[#888] font-mono text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#555]" />
                        {formatTimestamp(entry.timestamp)}
                      </span>
                      {entry.surfedCompleted && (
                        <span className="text-[#A3E635] text-[11px] flex items-center gap-1 font-mono">
                          <CheckCircle className="w-3 h-3" />
                          surfed & held
                        </span>
                      )}
                    </div>

                    {entry.notes && (
                      <p className="text-[#8A8A8A] mt-1 text-[11px] leading-relaxed italic">
                        "{entry.notes}"
                      </p>
                    )}
                  </div>

                  {/* Intensity Indicator & Delete Button */}
                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="text-[#777]">Intensity:</span>
                      <span className="font-bold text-[#DDD] tabular-nums">
                        {entry.intensity}/10
                      </span>
                      <div className="w-12 h-1.5 bg-[#252525] rounded-full overflow-hidden ml-1">
                        <div
                          className={`h-full ${
                            entry.intensity > 7
                              ? 'bg-[#E07A5F]'
                              : entry.intensity > 4
                              ? 'bg-[#E5C07B]'
                              : 'bg-[#98C379]'
                          }`}
                          style={{ width: `${entry.intensity * 10}%` }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteUrge(entry.id)}
                      title="Delete entry"
                      aria-label="Delete entry"
                      className="p-1 text-[#666] hover:text-[#CCC] hover:bg-[#252525] rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
