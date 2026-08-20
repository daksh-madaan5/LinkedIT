import React, { useState, useMemo } from 'react';
import type { DeliveryRequest, OptimizationResponse, VehicleRequest, OrderFilterCriteria } from '../../types/optimization';
import { OrdersTable } from './OrdersTable';
import { RoutesTable } from './RoutesTable';
import { TimelineView } from './TimelineView';
import { OrderFilterPopover } from './OrderFilterPopover';
import { LayoutList, Route, Clock, Search, Filter } from 'lucide-react';

interface ResultsTabsProps {
  height?: number;
  jobs: DeliveryRequest[];
  vehicles: VehicleRequest[];
  response: OptimizationResponse | null;
  selectedVehicleId: string | null;
  onSelectVehicle: (vehicleId: string | null) => void;
}

const DEFAULT_FILTERS: OrderFilterCriteria = {
  status: 'all',
  vehicleId: 'all',
  priority: 'all',
};

export const ResultsTabs: React.FC<ResultsTabsProps> = ({
  height,
  jobs,
  vehicles,
  response,
  selectedVehicleId,
  onSelectVehicle,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'routes' | 'timeline'>('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [orderFilters, setOrderFilters] = useState<OrderFilterCriteria>(DEFAULT_FILTERS);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);

  const routesCount = response?.routes?.length || 0;

  const isFilterActive = useMemo(() => {
    return (
      orderFilters.status !== 'all' ||
      orderFilters.vehicleId !== 'all' ||
      orderFilters.priority !== 'all'
    );
  }, [orderFilters]);

  // Dynamically extract available vehicle IDs
  const availableVehicles = useMemo(() => {
    const ids = new Set<string>();
    vehicles.forEach((v) => {
      if (v.id) ids.add(v.id);
    });
    if (response && response.routes) {
      response.routes.forEach((r) => {
        if (r.vehicleId) ids.add(r.vehicleId);
      });
    }
    return Array.from(ids).sort();
  }, [vehicles, response]);

  // Dynamically extract available priority numbers
  const availablePriorities = useMemo(() => {
    const priorities = new Set<number>();
    jobs.forEach((j) => {
      if (j.priority != null && !isNaN(j.priority)) {
        priorities.add(j.priority);
      }
    });
    return Array.from(priorities).sort((a, b) => a - b);
  }, [jobs]);

  const handleResetFilters = () => {
    setOrderFilters(DEFAULT_FILTERS);
  };

  return (
    <div
      style={{ height: height != null ? `${height}px` : '280px' }}
      className="bg-white border-t border-slate-200 flex flex-col shrink-0 overflow-hidden select-none"
    >
      {/* Dispatch Navigation Tabs Bar */}
      <div className="h-10 bg-white border-b border-slate-200 px-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 h-full">
          {/* Orders Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`h-full px-3.5 text-[13px] flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'text-blue-600 border-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-900 border-transparent font-medium'
            }`}
          >
            <LayoutList className="h-3.5 w-3.5 shrink-0" />
            <span>Orders</span>
          </button>

          {/* Routes Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('routes')}
            className={`h-full px-3.5 text-[13px] flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'routes'
                ? 'text-blue-600 border-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-900 border-transparent font-medium'
            }`}
          >
            <Route className="h-3.5 w-3.5 shrink-0" />
            <span>Routes</span>
            {routesCount > 0 && (
              <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded-full">
                {routesCount}
              </span>
            )}
          </button>

          {/* Timeline Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`h-full px-3.5 text-[13px] flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'timeline'
                ? 'text-blue-600 border-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-900 border-transparent font-medium'
            }`}
          >
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>Timeline</span>
          </button>
        </div>

        {/* Right Side: Search & Filter Controls */}
        <div className="flex items-center gap-2">
          {selectedVehicleId && (
            <div className="flex items-center gap-1.5 text-xs mr-1">
              <span className="text-slate-500">Filtered:</span>
              <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-mono text-[11px]">
                {selectedVehicleId}
              </span>
              <button
                type="button"
                onClick={() => onSelectVehicle(null)}
                className="text-xs text-slate-500 hover:text-slate-900 underline cursor-pointer ml-0.5"
              >
                Clear
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            {/* Filter Button & Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFilterPopoverOpen((prev) => !prev)}
                className={`h-7.5 w-7.5 rounded border transition-all cursor-pointer flex items-center justify-center relative ${
                  isFilterActive
                    ? 'text-blue-600 bg-blue-50 border-blue-300'
                    : isFilterPopoverOpen
                    ? 'text-slate-800 bg-slate-100 border-slate-300'
                    : 'text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-50 border-slate-200'
                }`}
                title="Filter orders"
                aria-label="Filter orders"
              >
                <Filter className="h-3.5 w-3.5" />
                {isFilterActive && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-600 rounded-full" />
                )}
              </button>

              <OrderFilterPopover
                isOpen={isFilterPopoverOpen}
                onClose={() => setIsFilterPopoverOpen(false)}
                filters={orderFilters}
                onChangeFilters={setOrderFilters}
                onResetFilters={handleResetFilters}
                availableVehicles={availableVehicles}
                availablePriorities={availablePriorities}
                isFilterActive={isFilterActive}
              />
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search orders..."
                className="w-48 sm:w-52 pl-2.5 pr-7 text-xs bg-white border border-slate-200 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 h-7.5 font-sans"
              />
              <Search className="h-3.5 w-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content Panels */}
      <div className="flex-1 overflow-hidden bg-white">
        {activeTab === 'orders' && (
          <OrdersTable
            jobs={jobs}
            response={response}
            selectedVehicleId={selectedVehicleId}
            onSelectVehicle={onSelectVehicle}
            searchTerm={searchTerm}
            filters={orderFilters}
          />
        )}

        {activeTab === 'routes' && (
          <RoutesTable
            vehicles={vehicles}
            response={response}
            selectedVehicleId={selectedVehicleId}
            onSelectVehicle={onSelectVehicle}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineView
            response={response}
            selectedVehicleId={selectedVehicleId}
            onSelectVehicle={onSelectVehicle}
          />
        )}
      </div>
    </div>
  );
};

