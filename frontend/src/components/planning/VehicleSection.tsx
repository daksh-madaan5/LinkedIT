import React, { useState } from 'react';
import type { VehicleRequest } from '../../types/optimization';
import { Truck, Plus, Trash2, Edit2, X } from 'lucide-react';
import { getVehicleColor } from '../../utils/mapUtils';

interface VehicleSectionProps {
  vehicles: VehicleRequest[];
  selectedVehicleId?: string | null;
  onSelectVehicle?: (vehicleId: string | null) => void;
  onAddVehicle: (vehicle: VehicleRequest) => void;
  onUpdateVehicle: (index: number, vehicle: VehicleRequest) => void;
  onRemoveVehicle: (index: number) => void;
}

export const VehicleSection: React.FC<VehicleSectionProps> = ({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
  onAddVehicle,
  onUpdateVehicle,
  onRemoveVehicle,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formId, setFormId] = useState('');
  const [formCapacity, setFormCapacity] = useState<number>(50);

  const openAddModal = () => {
    setEditingIndex(null);
    setFormId(`V${vehicles.length + 1}`);
    setFormCapacity(50);
    setIsModalOpen(true);
  };

  const openEditModal = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const v = vehicles[index];
    setEditingIndex(index);
    setFormId(v.id);
    setFormCapacity(v.capacity);
    setIsModalOpen(true);
  };

  const handleRemove = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onRemoveVehicle(index);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId.trim()) return;
    const vehicle: VehicleRequest = {
      id: formId.trim(),
      capacity: Number(formCapacity) > 0 ? Number(formCapacity) : 10,
    };
    if (editingIndex !== null) {
      onUpdateVehicle(editingIndex, vehicle);
    } else {
      onAddVehicle(vehicle);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-2.5 bg-white rounded border border-slate-200 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs uppercase tracking-wider font-sans">
          <Truck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
          <span>Vehicle Fleet</span>
          <span className="text-[11px] font-normal text-slate-500 font-mono">({vehicles.length})</span>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add vehicle</span>
        </button>
      </div>

      {vehicles.length === 0 ? (
        <p className="text-xs text-slate-400 italic py-2 text-center border border-dashed border-slate-200 rounded">
          No vehicles configured
        </p>
      ) : (
        <div className="space-y-1 max-h-44 overflow-y-auto pr-0.5">
          {vehicles.map((v, idx) => {
            const isSelected = selectedVehicleId === v.id;
            return (
              <div
                key={`${v.id}-${idx}`}
                onClick={() => onSelectVehicle?.(isSelected ? null : v.id)}
                className={`flex items-center justify-between p-1.5 rounded text-xs transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-blue-50/80 border border-blue-400 text-blue-950 font-medium'
                    : 'bg-white border border-slate-200 text-slate-800 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: getVehicleColor(idx) }}
                  />
                  <span className="font-bold text-xs font-mono text-slate-900">{v.id}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-slate-600 font-mono">
                    Cap: <strong className="font-semibold text-slate-900">{v.capacity}</strong>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => openEditModal(idx, e)}
                      className="h-5.5 w-5.5 flex items-center justify-center text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors cursor-pointer"
                      title="Edit vehicle"
                    >
                      <Edit2 className="h-2.5 w-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleRemove(idx, e)}
                      className="h-5.5 w-5.5 flex items-center justify-center text-slate-400 hover:text-red-600 bg-white border border-slate-200 rounded hover:bg-red-50 transition-colors cursor-pointer"
                      title="Remove vehicle"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}


      {/* Lightweight Vehicle Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-xs w-full p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-slate-900 text-xs">
                {editingIndex !== null ? 'Edit Vehicle' : 'Add Vehicle'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vehicle ID
                </label>
                <input
                  type="text"
                  required
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                  placeholder="e.g. V1"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1.5 focus:ring-blue-500/20 focus:border-blue-600 h-8.5 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Capacity Limit (units)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formCapacity}
                  onChange={(e) => setFormCapacity(parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1.5 focus:ring-blue-500/20 focus:border-blue-600 h-8.5 font-mono"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded h-8 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded shadow-xs h-8 cursor-pointer"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
