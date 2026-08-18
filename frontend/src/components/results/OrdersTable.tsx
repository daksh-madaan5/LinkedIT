import React, { useMemo } from 'react';
import type { DeliveryRequest, OptimizationResponse, OrderFilterCriteria } from '../../types/optimization';
import { formatCoordinates, formatServiceTime, formatTime12Hour, formatTimeWindow } from '../../utils/formatting';
import { getVehicleColor } from '../../utils/mapUtils';

interface OrdersTableProps {
  jobs: DeliveryRequest[];
  response: OptimizationResponse | null;
  selectedVehicleId: string | null;
  onSelectVehicle: (vehicleId: string | null) => void;
  searchTerm?: string;
  filters?: OrderFilterCriteria;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  jobs,
  response,
  selectedVehicleId,
  onSelectVehicle,
  searchTerm = '',
  filters,
}) => {
  // Build lookup mapping for stop details from optimization response
  const stopMap = useMemo(() => {
    const map = new Map<
      string,
      {
        vehicleId: string;
        vehicleIndex: number;
        sequence: number;
        arrivalTime: number;
        departureTime: number;
        remainingLoad: number;
      }
    >();

    if (response && response.routes) {
      response.routes.forEach((route, vIdx) => {
        route.stops.forEach((stop) => {
          map.set(stop.jobId, {
            vehicleId: route.vehicleId,
            vehicleIndex: vIdx,
            sequence: stop.sequence,
            arrivalTime: stop.arrivalTime,
            departureTime: stop.departureTime,
            remainingLoad: stop.remainingLoad,
          });
        });
      });
    }
    return map;
  }, [response]);

  const unassignedSet = useMemo(() => {
    return new Set(response?.unassignedJobs || []);
  }, [response]);

  // Filter jobs based on search term & filter criteria composably
  const filteredJobs = useMemo(() => {
    if (jobs.length === 0) return [];
    return jobs.filter((job) => {
      const stopInfo = stopMap.get(job.id);
      const isUnassigned = unassignedSet.has(job.id);
      const isAssigned = Boolean(response && stopInfo && !isUnassigned);
      const isPending = !response;

      // 1. Status Filter
      if (filters?.status === 'pending' && !isPending) return false;
      if (filters?.status === 'assigned' && !isAssigned) return false;
      if (filters?.status === 'unassigned' && !isUnassigned) return false;

      // 2. Assigned Vehicle Filter
      if (filters?.vehicleId && filters.vehicleId !== 'all') {
        if (!stopInfo || stopInfo.vehicleId !== filters.vehicleId) {
          return false;
        }
      }

      // 3. Priority Filter
      if (filters?.priority && filters.priority !== 'all') {
        if (job.priority == null || job.priority.toString() !== filters.priority) {
          return false;
        }
      }

      // 4. Search Term (Composable with active filters)
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const matchesId = job.id.toLowerCase().includes(term);
        const matchesVehicle = stopInfo?.vehicleId.toLowerCase().includes(term) ?? false;
        const matchesLat = job.latitude.toString().includes(term);
        const matchesLng = job.longitude.toString().includes(term);
        const matchesDemand = job.demand.toString().includes(term);
        const matchesPriority = job.priority
          ? `p${job.priority}`.includes(term) || job.priority.toString().includes(term)
          : false;

        if (
          !matchesId &&
          !matchesVehicle &&
          !matchesLat &&
          !matchesLng &&
          !matchesDemand &&
          !matchesPriority
        ) {
          return false;
        }
      }

      return true;
    });
  }, [jobs, stopMap, unassignedSet, response, filters, searchTerm]);

  // Dynamic counter description
  const counterText = useMemo(() => {
    if (jobs.length === 0 || filteredJobs.length === 0) {
      return 'No orders found';
    }
    if (filteredJobs.length === 1 && jobs.length === 1) {
      return 'Showing 1 to 1 of 1 order';
    }
    return `Showing 1 to ${filteredJobs.length} of ${jobs.length} ${
      jobs.length === 1 ? 'order' : 'orders'
    }`;
  }, [filteredJobs.length, jobs.length]);

  if (jobs.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs italic">
        No delivery orders added yet. Add deliveries in the left panel or click "Load Bhubaneswar Demo".
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col justify-between overflow-hidden bg-white">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-slate-700 select-none">
            <tr>
              <th className="py-2.5 px-3.5 font-semibold w-20">Order ID</th>
              <th className="py-2.5 px-3.5 font-semibold w-24">Status</th>
              <th className="py-2.5 px-3.5 font-semibold w-32">Assigned Vehicle</th>
              <th className="py-2.5 px-3.5 font-semibold w-16 text-center">Stop #</th>
              <th className="py-2.5 px-3.5 font-semibold">Location</th>
              <th className="py-2.5 px-3.5 font-semibold text-right w-20">Demand</th>
              <th className="py-2.5 px-3.5 font-semibold text-right w-24">Service Time</th>
              <th className="py-2.5 px-3.5 font-semibold text-center w-28">Time Window</th>
              <th className="py-2.5 px-3.5 font-semibold text-center w-24">Est. Arrival</th>
              <th className="py-2.5 px-3.5 font-semibold text-center w-24">Est. Depart</th>
              <th className="py-2.5 px-3.5 font-semibold text-center w-16">Priority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredJobs.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-slate-400 text-xs italic">
                  No orders match the selected filters or search term.
                </td>
              </tr>
            ) : (
              filteredJobs.map((job) => {
                const stopInfo = stopMap.get(job.id);
                const isUnassigned = unassignedSet.has(job.id);
                const isVehicleSelected =
                  stopInfo && selectedVehicleId === stopInfo.vehicleId;

                return (
                  <tr
                    key={job.id}
                    onClick={() => {
                      if (stopInfo) {
                        onSelectVehicle(
                          selectedVehicleId === stopInfo.vehicleId ? null : stopInfo.vehicleId
                        );
                      }
                    }}
                    className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                      isVehicleSelected ? 'bg-blue-50/70 font-medium' : ''
                    }`}
                  >
                    {/* Order ID */}
                    <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900">
                      {job.id}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3.5">
                      {!response ? (
                        <span className="inline-flex items-center text-[11px] text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full font-medium border border-blue-200">
                          Pending
                        </span>
                      ) : isUnassigned ? (
                        <span className="inline-flex items-center text-[11px] text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full font-medium border border-amber-200">
                          Unassigned
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-medium border border-emerald-200">
                          Assigned
                        </span>
                      )}
                    </td>

                    {/* Assigned Vehicle */}
                    <td className="py-2.5 px-3.5">
                      {stopInfo ? (
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0 shadow-xs"
                            style={{
                              backgroundColor: getVehicleColor(stopInfo.vehicleIndex),
                            }}
                          />
                          <span className="font-bold text-slate-900 font-mono">
                            {stopInfo.vehicleId}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono">-</span>
                      )}
                    </td>

                    {/* Stop # */}
                    <td className="py-2.5 px-3.5 text-center font-mono font-semibold text-slate-800">
                      {stopInfo ? `#${stopInfo.sequence}` : '-'}
                    </td>

                    {/* Coordinates Location */}
                    <td className="py-2.5 px-3.5 font-mono text-slate-600 text-[11px]">
                      {formatCoordinates(job.latitude, job.longitude)}
                    </td>

                    {/* Demand */}
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900">
                      {job.demand} u
                    </td>

                    {/* Service Duration */}
                    <td className="py-2.5 px-3.5 text-right font-mono text-slate-700">
                      {formatServiceTime(job.serviceDuration)}
                    </td>

                    {/* Time Window */}
                    <td className="py-2.5 px-3.5 text-center font-mono text-[11px] text-slate-400">
                      {formatTimeWindow(job.timeWindow?.start, job.timeWindow?.end)}
                    </td>

                    {/* Est. Arrival (12-hour AM/PM) */}
                    <td className="py-2.5 px-3.5 text-center font-mono text-slate-800">
                      {stopInfo ? formatTime12Hour(stopInfo.arrivalTime) : '-'}
                    </td>

                    {/* Est. Depart (12-hour AM/PM) */}
                    <td className="py-2.5 px-3.5 text-center font-mono text-slate-800">
                      {stopInfo ? formatTime12Hour(stopInfo.departureTime) : '-'}
                    </td>

                    {/* Priority */}
                    <td className="py-2.5 px-3.5 text-center font-mono text-slate-600">
                      {job.priority ? `P${job.priority}` : '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 font-sans flex items-center justify-between shrink-0">
        <span>{counterText}</span>
      </div>
    </div>
  );
};

