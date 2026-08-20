import React from 'react';
import type { LocationRequest, VehicleRequest, DeliveryRequest } from '../../types/optimization';
import { DepotSection } from './DepotSection';
import { VehicleSection } from './VehicleSection';
import { JobSection } from './JobSection';
import { Play, Loader2, X } from 'lucide-react';

interface PlanningSidebarProps {
  width?: number;
  depot: LocationRequest;
  vehicles: VehicleRequest[];
  jobs: DeliveryRequest[];
  selectedVehicleId?: string | null;
  onSelectVehicle?: (vehicleId: string | null) => void;
  onDepotChange: (depot: LocationRequest) => void;
  onOpenDepotModal?: () => void;
  onAddVehicle: (vehicle: VehicleRequest) => void;
  onUpdateVehicle: (index: number, vehicle: VehicleRequest) => void;
  onRemoveVehicle: (index: number) => void;
  onAddJob: (job: DeliveryRequest) => void;
  onAddJobs?: (jobs: DeliveryRequest[]) => void;
  onUpdateJob: (index: number, job: DeliveryRequest) => void;
  onRemoveJob: (index: number) => void;
  onOptimize: () => void;
  onClose?: () => void;
  isLoading: boolean;
}

export const PlanningSidebar: React.FC<PlanningSidebarProps> = ({
  width,
  depot,
  vehicles,
  jobs,
  selectedVehicleId,
  onSelectVehicle,
  onDepotChange,
  onOpenDepotModal,
  onAddVehicle,
  onUpdateVehicle,
  onRemoveVehicle,
  onAddJob,
  onAddJobs,
  onUpdateJob,
  onRemoveJob,
  onOptimize,
  onClose,
  isLoading,
}) => {
  const isFormValid =
    depot.latitude != null &&
    depot.longitude != null &&
    vehicles.length > 0 &&
    jobs.length > 0;

  return (
    <aside
      style={{ width: width != null ? `${width}px` : '315px', minWidth: '280px', maxWidth: '380px' }}
      className="bg-slate-50 border-r border-slate-200 flex flex-col h-full shrink-0 overflow-hidden select-none"
    >
      {/* Top Header */}
      <div className="px-3.5 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
        <h2 className="font-bold text-slate-900 text-xs tracking-wider uppercase font-sans">
          Planning Inputs
        </h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
            title="Collapse Planning Inputs sidebar"
            aria-label="Collapse Planning Inputs sidebar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Scrollable Configuration Sections */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
        <DepotSection
          depot={depot}
          onChange={onDepotChange}
          onOpenLocationModal={onOpenDepotModal}
        />

        <VehicleSection
          vehicles={vehicles}
          selectedVehicleId={selectedVehicleId}
          onSelectVehicle={onSelectVehicle}
          onAddVehicle={onAddVehicle}
          onUpdateVehicle={onUpdateVehicle}
          onRemoveVehicle={onRemoveVehicle}
        />

        <JobSection
          jobs={jobs}
          onAddJob={onAddJob}
          onAddJobs={onAddJobs}
          onUpdateJob={onUpdateJob}
          onRemoveJob={onRemoveJob}
        />
      </div>

      {/* Sticky Bottom Optimize Action */}
      <div className="p-2.5 bg-white border-t border-slate-200 shrink-0">
        <button
          type="button"
          onClick={onOptimize}
          disabled={!isFormValid || isLoading}
          className={`w-full h-11 px-4 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 select-none ${
            isLoading
              ? 'bg-blue-500 text-white cursor-wait opacity-90'
              : !isFormValid
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs cursor-pointer'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              <span>Optimizing routes...</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current shrink-0" />
              <span>Optimize Routes</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

