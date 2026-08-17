import React from 'react';
import type { LocationRequest } from '../../types/optimization';
import { Warehouse } from 'lucide-react';

interface DepotSectionProps {
  depot: LocationRequest;
  onChange: (depot: LocationRequest) => void;
}

export const DepotSection: React.FC<DepotSectionProps> = ({ depot, onChange }) => {
  return (
    <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs uppercase tracking-wider">
          <Warehouse className="h-3.5 w-3.5 text-blue-600 shrink-0" />
          <span>Depot Origin</span>
        </div>
        <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
          {depot.id || 'DEPOT-1'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">
            Latitude
          </label>
          <input
            type="number"
            step="any"
            value={depot.latitude ?? ''}
            onChange={(e) =>
              onChange({ ...depot, latitude: parseFloat(e.target.value) || 0 })
            }
            placeholder="20.2961"
            className="w-full px-2.5 py-1.5 text-xs font-mono text-slate-900 bg-white border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-blue-500/20 focus:border-blue-600 transition-colors h-8.5"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">
            Longitude
          </label>
          <input
            type="number"
            step="any"
            value={depot.longitude ?? ''}
            onChange={(e) =>
              onChange({ ...depot, longitude: parseFloat(e.target.value) || 0 })
            }
            placeholder="85.8245"
            className="w-full px-2.5 py-1.5 text-xs font-mono text-slate-900 bg-white border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-blue-500/20 focus:border-blue-600 transition-colors h-8.5"
          />
        </div>
      </div>
    </div>
  );
};
