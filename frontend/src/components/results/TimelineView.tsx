import React from 'react';
import type { OptimizationResponse } from '../../types/optimization';
import { formatTime12Hour, formatDuration } from '../../utils/formatting';
import { getVehicleColor } from '../../utils/mapUtils';

interface TimelineViewProps {
  response: OptimizationResponse | null;
  selectedVehicleId: string | null;
  onSelectVehicle: (vehicleId: string | null) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  response,
  selectedVehicleId,
  onSelectVehicle,
}) => {
  if (!response || !response.routes || response.routes.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs italic">
        No timeline data available. Optimize routes first to inspect vehicle schedules.
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto p-4 space-y-3 bg-white select-none">
      {response.routes.map((route, idx) => {
        const isSelected = selectedVehicleId === route.vehicleId;
        const color = getVehicleColor(idx);

        return (
          <div
            key={route.vehicleId}
            onClick={() => onSelectVehicle(isSelected ? null : route.vehicleId)}
            className={`p-3 rounded-lg border transition-all cursor-pointer ${
              isSelected
                ? 'bg-blue-50/70 border-blue-400 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-xs"
                  style={{ backgroundColor: color }}
                />
                <span className="font-bold text-xs text-slate-900 font-mono">
                  {route.vehicleId}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  ({route.stops.length} stops · {formatDuration(route.duration)})
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-600 font-semibold">
                Start: {formatTime12Hour(route.stops[0]?.arrivalTime ? route.stops[0].arrivalTime - 300 : 28800)}
              </span>
            </div>

            {/* Horizontal Timeline Chain */}
            <div className="flex items-center gap-2 overflow-x-auto py-1 text-xs font-mono">
              <div className="px-2 py-1 bg-slate-900 text-white rounded text-[10px] font-bold shrink-0">
                DEPOT
              </div>
              <span className="text-slate-400">→</span>

              {route.stops.map((stop, sIdx) => (
                <React.Fragment key={stop.jobId}>
                  <div
                    className="flex flex-col items-center px-2 py-1 bg-white border border-slate-200 rounded shadow-xs shrink-0"
                    style={{ borderTop: `3px solid ${color}` }}
                  >
                    <span className="font-bold text-slate-900 text-[11px]">
                      {stop.jobId}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {formatTime12Hour(stop.arrivalTime)}
                    </span>
                  </div>
                  {sIdx < route.stops.length - 1 && (
                    <span className="text-slate-400">→</span>
                  )}
                </React.Fragment>
              ))}


              <span className="text-slate-400">→</span>
              <div className="px-2 py-1 bg-slate-900 text-white rounded text-[10px] font-bold shrink-0">
                DEPOT
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
