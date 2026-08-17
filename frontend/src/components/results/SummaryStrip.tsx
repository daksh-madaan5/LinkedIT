import React from 'react';
import type { OptimizationSummary } from '../../types/optimization';
import { formatDistance, formatDuration } from '../../utils/formatting';
import { Route, Clock, Truck, CheckCircle2, AlertTriangle } from 'lucide-react';

interface SummaryStripProps {
  summary: OptimizationSummary;
  unassignedJobsCount: number;
}

export const SummaryStrip: React.FC<SummaryStripProps> = ({
  summary,
  unassignedJobsCount,
}) => {
  return (
    <div className="bg-slate-900 text-white px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs select-none shrink-0 font-mono">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-1.5">
          <Route className="h-3.5 w-3.5 text-blue-400 shrink-0" />
          <span className="text-slate-400">Total Distance:</span>
          <strong className="text-white font-bold">{formatDistance(summary.totalDistance)}</strong>
        </div>

        <div className="flex items-center space-x-1.5">
          <Clock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span className="text-slate-400">Total Duration:</span>
          <strong className="text-white font-bold">{formatDuration(summary.totalDuration)}</strong>
        </div>

        <div className="flex items-center space-x-1.5">
          <Truck className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span className="text-slate-400">Fleet Used:</span>
          <strong className="text-white font-bold">{summary.vehiclesUsed} Vehicles</strong>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {unassignedJobsCount > 0 ? (
          <div className="flex items-center space-x-1 text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800 text-[11px] font-bold">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>{unassignedJobsCount} Unassigned</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1 text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 text-[11px] font-bold">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{summary.assignedJobs}/{summary.totalJobs} Assigned (100%)</span>
          </div>
        )}
      </div>
    </div>
  );
};
