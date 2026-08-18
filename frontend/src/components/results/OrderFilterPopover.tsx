import React, { useEffect, useRef } from 'react';
import type { OrderFilterCriteria, OrderStatusFilter } from '../../types/optimization';
import { RotateCcw, X, Filter } from 'lucide-react';

interface OrderFilterPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  filters: OrderFilterCriteria;
  onChangeFilters: (newFilters: OrderFilterCriteria) => void;
  onResetFilters: () => void;
  availableVehicles: string[];
  availablePriorities: number[];
  isFilterActive: boolean;
}

export const OrderFilterPopover: React.FC<OrderFilterPopoverProps> = ({
  isOpen,
  onClose,
  filters,
  onChangeFilters,
  onResetFilters,
  availableVehicles,
  availablePriorities,
  isFilterActive,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside of the popover
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChangeFilters({
      ...filters,
      status: e.target.value as OrderStatusFilter,
    });
  };

  const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChangeFilters({
      ...filters,
      vehicleId: e.target.value,
    });
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChangeFilters({
      ...filters,
      priority: e.target.value,
    });
  };

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-lg border border-slate-200 shadow-xl p-3.5 z-40 space-y-3 select-none animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-blue-600" />
          <span className="font-bold text-slate-800 text-xs">Filter Orders</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isFilterActive && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="h-2.5 w-2.5" />
              <span>Reset</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded hover:bg-slate-100 cursor-pointer"
            title="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="space-y-2.5">
        {/* Status Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={handleStatusChange}
            className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded font-sans text-slate-800 focus:outline-none focus:ring-1.5 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </div>

        {/* Assigned Vehicle Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Assigned Vehicle
          </label>
          <select
            value={filters.vehicleId}
            onChange={handleVehicleChange}
            className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded font-sans text-slate-800 focus:outline-none focus:ring-1.5 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            <option value="all">All Vehicles</option>
            {availableVehicles.map((vId) => (
              <option key={vId} value={vId}>
                {vId}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Priority
          </label>
          <select
            value={filters.priority}
            onChange={handlePriorityChange}
            className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded font-sans text-slate-800 focus:outline-none focus:ring-1.5 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            <option value="all">All Priorities</option>
            {availablePriorities.map((p) => (
              <option key={p} value={p.toString()}>
                Priority {p} (P{p})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
