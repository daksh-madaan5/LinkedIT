import React, { useState } from 'react';
import type { DeliveryRequest, OptimizationResponse, VehicleRequest } from '../../types/optimization';
import { OrdersTable } from './OrdersTable';
import { RoutesTable } from './RoutesTable';
import { TimelineView } from './TimelineView';
import { LayoutList, Route, Clock, Search, Filter } from 'lucide-react';

interface ResultsTabsProps {
  height?: number;
  jobs: DeliveryRequest[];
  vehicles: VehicleRequest[];
  response: OptimizationResponse | null;
  selectedVehicleId: string | null;
  onSelectVehicle: (vehicleId: string | null) => void;
}

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

  const routesCount = response?.routes?.length || 0;

  return (
    <div
      style={{ height: height != null ? `${height}px` : '280px' }}
      className="bg-white border-t border-slate-200 flex flex-col shrink-0 overflow-hidden select-none"
    >
      {/* Dispatch Navigation Tabs Bar */}
      <div className="h-11 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6 h-full">
          {/* Orders Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`h-full text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'text-blue-600 border-blue-600 font-bold'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <LayoutList className="h-3.5 w-3.5 shrink-0" />
            <span>Orders</span>
          </button>

          {/* Routes Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('routes')}
            className={`h-full text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'routes'
                ? 'text-blue-600 border-blue-600 font-bold'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Route className="h-3.5 w-3.5 shrink-0" />
            <span>Routes</span>
            {routesCount > 0 && (
              <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full">
                {routesCount}
              </span>
            )}
          </button>

          {/* Timeline Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`h-full text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'timeline'
                ? 'text-blue-600 border-blue-600 font-bold'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>Timeline</span>
          </button>
        </div>

        {/* Right Side: Search & Filter Controls */}
        <div className="flex items-center gap-2">
          {selectedVehicleId && (
            <div className="flex items-center gap-1.5 text-xs mr-2">
              <span className="text-slate-500">Filtered:</span>
              <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-mono">
                {selectedVehicleId}
              </span>
              <button
                type="button"
                onClick={() => onSelectVehicle(null)}
                className="text-xs text-slate-500 hover:text-slate-900 underline cursor-pointer ml-1"
              >
                Clear
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition-colors"
              title="Filter"
            >
              <Filter className="h-3.5 w-3.5" />
            </button>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search orders..."
                className="w-48 pl-2.5 pr-7 py-1 text-xs bg-white border border-slate-200 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1.5 focus:ring-blue-500/20 focus:border-blue-500 h-7.5 font-sans"
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
