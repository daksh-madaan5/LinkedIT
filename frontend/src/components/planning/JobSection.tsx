import React, { useState, useRef } from 'react';
import type { DeliveryRequest } from '../../types/optimization';
import { Package, Plus, Trash2, Edit2, X, Upload, Download } from 'lucide-react';
import { formatCoordinates } from '../../utils/formatting';
import { parseAndValidateJobsCsv, downloadCsvTemplate, type CsvParseResult } from '../../utils/csvParser';
import { CsvImportModal } from './CsvImportModal';

interface JobSectionProps {
  jobs: DeliveryRequest[];
  onAddJob: (job: DeliveryRequest) => void;
  onAddJobs?: (jobs: DeliveryRequest[]) => void;
  onUpdateJob: (index: number, job: DeliveryRequest) => void;
  onRemoveJob: (index: number) => void;
}

export const JobSection: React.FC<JobSectionProps> = ({
  jobs,
  onAddJob,
  onAddJobs,
  onUpdateJob,
  onRemoveJob,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // CSV Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvParseResult, setCsvParseResult] = useState<CsvParseResult | null>(null);
  const [csvFileName, setCsvFileName] = useState('');

  // Form states
  const [formId, setFormId] = useState('');
  const [formLat, setFormLat] = useState<number>(20.3050);
  const [formLng, setFormLng] = useState<number>(85.8170);
  const [formDemand, setFormDemand] = useState<number>(15);
  const [formDuration, setFormDuration] = useState<number>(240); // 4 mins
  const [formPriority, setFormPriority] = useState<number>(2);

  const openAddModal = () => {
    setEditingIndex(null);
    setFormId(`D${jobs.length + 1}`);
    setFormLat(20.3000 + Number((Math.random() * 0.03).toFixed(4)));
    setFormLng(85.8100 + Number((Math.random() * 0.04).toFixed(4)));
    setFormDemand(15);
    setFormDuration(240);
    setFormPriority(2);
    setIsModalOpen(true);
  };

  const openEditModal = (index: number) => {
    const j = jobs[index];
    setEditingIndex(index);
    setFormId(j.id);
    setFormLat(j.latitude);
    setFormLng(j.longitude);
    setFormDemand(j.demand);
    setFormDuration(j.serviceDuration);
    setFormPriority(j.priority ?? 2);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId.trim()) return;
    const job: DeliveryRequest = {
      id: formId.trim(),
      latitude: Number(formLat),
      longitude: Number(formLng),
      demand: Math.max(0, Number(formDemand)),
      serviceDuration: Math.max(0, Number(formDuration)),
      priority: Number(formPriority),
    };

    if (editingIndex !== null) {
      onUpdateJob(editingIndex, job);
    } else {
      onAddJob(job);
    }
    setIsModalOpen(false);
  };

  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const result = parseAndValidateJobsCsv(text || '', jobs);
      setCsvParseResult(result);
      setIsCsvModalOpen(true);
    };
    reader.readAsText(file);

    // Reset value so user can select the same file again if needed
    e.target.value = '';
  };

  const handleConfirmCsvImport = (validJobs: DeliveryRequest[]) => {
    if (onAddJobs) {
      onAddJobs(validJobs);
    } else {
      validJobs.forEach((job) => onAddJob(job));
    }
    setIsCsvModalOpen(false);
    setCsvParseResult(null);
  };

  return (
    <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs space-y-2.5">
      {/* Hidden File Input for CSV Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header with Title and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs uppercase tracking-wider">
          <Package className="h-3.5 w-3.5 text-blue-600 shrink-0" />
          <span>Delivery Jobs</span>
          <span className="text-[11px] font-normal text-slate-500 font-mono">({jobs.length})</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-0.5 rounded transition-colors cursor-pointer"
            title="Add individual delivery job"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add delivery</span>
          </button>

          <button
            type="button"
            onClick={handleTriggerFileInput}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-2 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer"
            title="Import jobs from CSV file"
          >
            <Upload className="h-3 w-3 text-slate-500" />
            <span>Import CSV</span>
          </button>
        </div>
      </div>

      {/* CSV Template Download Bar */}
      <div className="flex items-center justify-between text-[11px] pt-0.5 border-t border-slate-100 text-slate-500">
        <span>Bulk import delivery locations</span>
        <button
          type="button"
          onClick={downloadCsvTemplate}
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
          title="Download sample CSV template format"
        >
          <Download className="h-2.5 w-2.5" />
          <span>Download CSV Template</span>
        </button>
      </div>

      {/* Delivery Jobs List */}
      {jobs.length === 0 ? (
        <p className="text-xs text-slate-400 italic py-2 text-center border border-dashed border-slate-200 rounded">
          No delivery jobs added yet. Add manually or import CSV.
        </p>
      ) : (
        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5">
          {jobs.map((j, idx) => (
            <div
              key={`${j.id}-${idx}`}
              className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-md text-xs hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono font-bold text-slate-900 text-xs shrink-0 w-6">
                  {j.id}
                </span>
                <span className="text-slate-500 font-mono text-[11px] truncate">
                  {formatCoordinates(j.latitude, j.longitude)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-700 shrink-0">
                <span className="font-mono font-bold text-xs w-6 text-right">{j.demand}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(idx)}
                    className="h-6 w-6 flex items-center justify-center text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
                    title="Edit job"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveJob(idx)}
                    className="h-6 w-6 flex items-center justify-center text-slate-400 hover:text-red-600 bg-white border border-slate-200 rounded hover:bg-red-50 transition-colors shadow-xs cursor-pointer"
                    title="Remove job"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightweight Job Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-sm w-full p-4.5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-slate-900 text-xs">
                {editingIndex !== null ? 'Edit Delivery Job' : 'Add Delivery Job'}
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
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Job ID
                </label>
                <input
                  type="text"
                  required
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                  placeholder="e.g. D1"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1.5 focus:ring-blue-500/20 focus:border-blue-600 h-8.5 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formLat}
                    onChange={(e) => setFormLat(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded font-mono focus:outline-none focus:ring-1.5 focus:ring-blue-500/20 focus:border-blue-600 h-8.5"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formLng}
                    onChange={(e) => setFormLng(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded font-mono focus:outline-none focus:ring-1.5 focus:ring-blue-500/20 focus:border-blue-600 h-8.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Demand (u)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formDemand}
                    onChange={(e) => setFormDemand(parseInt(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1.5 focus:ring-blue-500/20 focus:border-blue-600 h-8.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Unload (s)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formDuration}
                    onChange={(e) => setFormDuration(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1.5 focus:ring-blue-500/20 focus:border-blue-600 h-8.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Priority
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formPriority}
                    onChange={(e) => setFormPriority(parseInt(e.target.value) || 1)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1.5 focus:ring-blue-500/20 focus:border-blue-600 h-8.5 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1.5">
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
                  Save Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Preview Modal */}
      {isCsvModalOpen && (
        <CsvImportModal
          parseResult={csvParseResult}
          fileName={csvFileName}
          onConfirm={handleConfirmCsvImport}
          onCancel={() => {
            setIsCsvModalOpen(false);
            setCsvParseResult(null);
          }}
        />
      )}
    </div>
  );
};
