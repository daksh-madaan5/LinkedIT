import React from 'react';
import type { OptimizationResponse, VehicleRequest } from '../../types/optimization';
import { formatDistance, formatDuration } from '../../utils/formatting';
import { getVehicleColor } from '../../utils/mapUtils';

interface RoutesTableProps {
  vehicles: VehicleRequest[];
  response: OptimizationResponse | null;
  selectedVehicleId: string | null;
  onSelectVehicle: (vehicleId: string | null) => void;
}

export const RoutesTable: React.FC<RoutesTableProps> = ({
  vehicles,
  response,
  selectedVehicleId,
  onSelectVehicle,
}) => {
  if (!response || !response.routes || response.routes.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs italic">
        No routes generated yet. Click "Optimize Routes" to calculate vehicle routes.
      </div>
    );
  }

  const vehicleCapacityMap = new Map<string, number>();
  vehicles.forEach((v) => vehicleCapacityMap.set(v.id, v.capacity));

  return (
    <div className="w-full h-full overflow-auto bg-white">
      <table className="w-full text-left border-collapse text-xs">
        <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-slate-700 select-none">
          <tr>
            <th className="py-2.5 px-3.5 font-semibold w-28">Vehicle</th>
            <th className="py-2.5 px-3.5 font-semibold w-24 text-center">Total Stops</th>
            <th className="py-2.5 px-3.5 font-semibold text-right w-28">Distance</th>
            <th className="py-2.5 px-3.5 font-semibold text-right w-28">Duration</th>
            <th className="py-2.5 px-3.5 font-semibold w-40">Capacity Utilization</th>
            <th className="py-2.5 px-3.5 font-semibold">Stop Sequence</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {response.routes.map((route, idx) => {
            const isSelected = selectedVehicleId === route.vehicleId;
            const color = getVehicleColor(idx);
            const totalDemand = route.deliveredLoad || route.initialLoad || 0;
            const capLimit = vehicleCapacityMap.get(route.vehicleId) || 50;
            const capPercent = Math.min(100, Math.round((totalDemand / capLimit) * 100));

            return (
              <tr
                key={route.vehicleId}
                onClick={() =>
                  onSelectVehicle(isSelected ? null : route.vehicleId)
                }
                className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                  isSelected ? 'bg-blue-50/70 font-medium' : ''
                }`}
              >
                <td className="py-2.5 px-3.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-bold text-slate-900 font-mono">
                      {route.vehicleId}
                    </span>
                  </div>
                </td>

                <td className="py-2.5 px-3.5 text-center font-mono font-bold text-slate-900">
                  {route.stops.length} stops
                </td>

                <td className="py-2.5 px-3.5 text-right font-mono text-slate-800">
                  {formatDistance(route.distance)}
                </td>

                <td className="py-2.5 px-3.5 text-right font-mono text-slate-800">
                  {formatDuration(route.duration)}
                </td>

                <td className="py-2.5 px-3.5">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-slate-600">
                      <span>{totalDemand} / {capLimit} u</span>
                      <span className="font-semibold">{capPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${capPercent}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                </td>

                <td className="py-2.5 px-3.5 font-mono text-[11px] text-slate-600">
                  <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                    <span className="text-slate-400">DEPOT →</span>
                    {route.stops.map((s, sIdx) => (
                      <span key={s.jobId} className="flex items-center gap-1">
                        <span className="font-bold text-slate-800 bg-slate-100 px-1 py-0.5 rounded border border-slate-200">
                          {s.jobId}
                        </span>
                        {sIdx < route.stops.length - 1 && <span className="text-slate-400">→</span>}
                      </span>
                    ))}
                    <span className="text-slate-400">→ DEPOT</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
