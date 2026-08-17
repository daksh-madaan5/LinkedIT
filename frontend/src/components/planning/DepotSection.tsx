import React, { useState } from 'react';
import type { LocationRequest } from '../../types/optimization';
import { Warehouse, MapPin, Edit3, ChevronDown, ChevronUp } from 'lucide-react';

interface DepotSectionProps {
  depot: LocationRequest;
  onChange: (depot: LocationRequest) => void;
  onOpenLocationModal?: () => void;
}

export const DepotSection: React.FC<DepotSectionProps> = ({
  depot,
  onChange,
  onOpenLocationModal,
}) => {
  const [showCoords, setShowCoords] = useState(false);

  const displayName = depot.name || 'Bhubaneswar Central Depot';
  const displayAddress =
    depot.address ||
    (depot.latitude != null && depot.longitude != null
      ? `${depot.latitude.toFixed(4)}, ${depot.longitude.toFixed(4)}`
      : 'Location not configured');

  return (
    <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs uppercase tracking-wider">
          <Warehouse className="h-3.5 w-3.5 text-blue-600 shrink-0" />
          <span>Depot Origin</span>
        </div>
        <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
          {depot.id || 'DEPOT-1'}
        </span>
      </div>

      {/* Location-First Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-start gap-2.5">
        <div className="h-7 w-7 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
          <MapPin className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-xs font-bold text-slate-900 truncate leading-tight">
              {displayName}
            </h4>
          </div>
          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
            {displayAddress}
          </p>
        </div>
      </div>

      {/* Action to change location via modal popup */}
      <button
        type="button"
        onClick={onOpenLocationModal}
        className="w-full h-8 px-3 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-200 rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
      >
        <Edit3 className="h-3.5 w-3.5" />
        <span>Change Depot Location</span>
      </button>

      {/* Collapsible Coordinates Section */}
      <div>
        <button
          type="button"
          onClick={() => setShowCoords(!showCoords)}
          className="flex items-center justify-between w-full text-[10px] font-semibold text-slate-400 hover:text-slate-600 pt-0.5 cursor-pointer"
        >
          <span>Advanced Coordinates</span>
          {showCoords ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>

        {showCoords && (
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 animate-in fade-in duration-100">
            <div>
              <label className="block text-[10px] font-medium text-slate-500 mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={depot.latitude ?? ''}
                onChange={(e) =>
                  onChange({
                    ...depot,
                    latitude: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="20.2961"
                className="w-full px-2 py-1 text-xs font-mono text-slate-900 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1.5 focus:ring-blue-500/20 focus:border-blue-600 transition-colors h-7.5"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-slate-500 mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={depot.longitude ?? ''}
                onChange={(e) =>
                  onChange({
                    ...depot,
                    longitude: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="85.8245"
                className="w-full px-2 py-1 text-xs font-mono text-slate-900 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1.5 focus:ring-blue-500/20 focus:border-blue-600 transition-colors h-7.5"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
