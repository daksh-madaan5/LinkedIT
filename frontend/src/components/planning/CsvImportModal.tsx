import React from 'react';
import type { DeliveryRequest } from '../../types/optimization';
import type { CsvParseResult } from '../../utils/csvParser';
import { formatCoordinates, formatServiceTime } from '../../utils/formatting';
import { CheckCircle2, AlertTriangle, X, Upload, FileText } from 'lucide-react';

interface CsvImportModalProps {
  parseResult: CsvParseResult | null;
  fileName: string;
  onConfirm: (validJobs: DeliveryRequest[]) => void;
  onCancel: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  parseResult,
  fileName,
  onConfirm,
  onCancel,
}) => {
  if (!parseResult) return null;

  const {
    rows,
    validJobs,
    validCount,
    invalidCount,
    conflictCount,
    headerError,
  } = parseResult;

  const totalErrors = invalidCount + conflictCount;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
              <Upload className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                CSV Import Preview
              </h3>
              <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                <FileText className="h-3 w-3" />
                <span>{fileName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Validation Summary Bar */}
        <div className="px-5 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md font-semibold text-xs">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{validCount} valid {validCount === 1 ? 'job' : 'jobs'}</span>
            </div>

            {totalErrors > 0 && (
              <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md font-semibold text-xs">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>
                  {totalErrors} {totalErrors === 1 ? 'issue' : 'issues'} (
                  {conflictCount > 0 && `${conflictCount} ${conflictCount === 1 ? 'conflict' : 'conflicts'}`}
                  {conflictCount > 0 && invalidCount > 0 && ', '}
                  {invalidCount > 0 && `${invalidCount} invalid`})
                </span>
              </div>
            )}
          </div>

          <span className="text-slate-500 font-mono text-[11px]">
            Total rows: {rows.length}
          </span>
        </div>

        {/* Header Error Alert (if schema invalid) */}
        {headerError && (
          <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">CSV Schema Error:</strong>
              <p className="mt-0.5 text-[11px]">{headerError}</p>
            </div>
          </div>
        )}

        {/* Preview Table */}
        {!headerError && (
          <div className="flex-1 overflow-auto bg-white p-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-slate-700">
                <tr>
                  <th className="py-2 px-2.5 font-semibold w-12 text-slate-500">Row</th>
                  <th className="py-2 px-2.5 font-semibold w-20">ID</th>
                  <th className="py-2 px-2.5 font-semibold">Location</th>
                  <th className="py-2 px-2.5 font-semibold text-right w-20">Demand</th>
                  <th className="py-2 px-2.5 font-semibold text-right w-24">Service</th>
                  <th className="py-2 px-2.5 font-semibold text-center w-16">Priority</th>
                  <th className="py-2 px-2.5 font-semibold w-40">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => {
                  const isValid = row.status === 'valid';
                  const isConflict = row.status === 'conflict';

                  return (
                    <tr
                      key={`csv-row-${row.rowNumber}`}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !isValid ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="py-2 px-2.5 text-slate-400 font-mono text-[11px]">
                        #{row.rowNumber}
                      </td>
                      <td className="py-2 px-2.5 font-mono font-bold text-slate-900">
                        {row.id}
                      </td>
                      <td className="py-2 px-2.5 font-mono text-slate-600 text-[11px]">
                        {row.latitude != null && row.longitude != null
                          ? formatCoordinates(row.latitude, row.longitude)
                          : <span className="text-red-500 italic">Invalid coords</span>}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900">
                        {row.demand != null ? `${row.demand} u` : '-'}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono text-slate-700 text-[11px]">
                        {row.serviceDuration != null ? formatServiceTime(row.serviceDuration) : '-'}
                      </td>
                      <td className="py-2 px-2.5 text-center font-mono text-slate-600">
                        {row.priority ? `P${row.priority}` : '-'}
                      </td>
                      <td className="py-2 px-2.5">
                        {isValid ? (
                          <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Valid
                          </span>
                        ) : isConflict ? (
                          <span
                            className="inline-flex items-center text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300"
                            title={row.errors.join('; ')}
                          >
                            {row.errors[0] || 'Conflict'}
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200"
                            title={row.errors.join('; ')}
                          >
                            {row.errors[0] || 'Invalid'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-md border border-slate-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(validJobs)}
            disabled={validCount === 0 || !!headerError}
            className={`px-4 py-1.5 text-xs font-bold rounded-md shadow-xs transition-colors flex items-center gap-1.5 select-none ${
              validCount === 0 || !!headerError
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 shadow-none'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white cursor-pointer'
            }`}
          >
            <span>Import {validCount} Valid {validCount === 1 ? 'Job' : 'Jobs'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
