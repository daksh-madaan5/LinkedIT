import type { DeliveryRequest } from '../types/optimization';

export interface CsvParsedRow {
  rowNumber: number;
  id: string;
  latitude: number | null;
  longitude: number | null;
  demand: number | null;
  serviceDuration: number | null;
  priority: number | null;
  timeWindow?: { start: number; end: number };
  status: 'valid' | 'invalid' | 'conflict';
  errors: string[];
  job?: DeliveryRequest;
}

export interface CsvParseResult {
  rows: CsvParsedRow[];
  validJobs: DeliveryRequest[];
  validCount: number;
  invalidCount: number;
  conflictCount: number;
  totalCount: number;
  headerError?: string;
}

/**
 * Parses raw CSV text into a 2D array of strings handling quotes and newlines.
 */
function parseCsvToRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentVal += '"';
        i++; // Skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // Skip \r\n
      }
      currentRow.push(currentVal.trim());
      currentVal = '';
      if (currentRow.some((field) => field.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentVal += char;
    }
  }

  // Handle any remaining field/row
  if (currentVal.length > 0 || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some((field) => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Validates and converts parsed CSV rows into frontend DeliveryRequest objects.
 */
export function parseAndValidateJobsCsv(
  csvText: string,
  existingJobs: DeliveryRequest[]
): CsvParseResult {
  const rawRows = parseCsvToRows(csvText);

  if (rawRows.length === 0) {
    return {
      rows: [],
      validJobs: [],
      validCount: 0,
      invalidCount: 0,
      conflictCount: 0,
      totalCount: 0,
      headerError: 'The CSV file is empty.',
    };
  }

  // Normalize header names
  const headers = rawRows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  const idIdx = headers.findIndex((h) => h === 'id' || h === 'jobid' || h === 'orderid');
  const latIdx = headers.findIndex(
    (h) => h === 'latitude' || h === 'lat' || h === 'yloc'
  );
  const lngIdx = headers.findIndex(
    (h) => h === 'longitude' || h === 'lng' || h === 'lon' || h === 'xloc'
  );
  const demandIdx = headers.findIndex(
    (h) => h === 'demand' || h === 'capacity' || h === 'units' || h === 'size'
  );
  const durationIdx = headers.findIndex(
    (h) =>
      h === 'serviceduration' ||
      h === 'duration' ||
      h === 'service' ||
      h === 'servicetime'
  );
  const priorityIdx = headers.findIndex((h) => h === 'priority' || h === 'prio');
  const twStartIdx = headers.findIndex(
    (h) =>
      h === 'timewindowstart' ||
      h === 'twstart' ||
      h === 'start' ||
      h === 'windowstart'
  );
  const twEndIdx = headers.findIndex(
    (h) =>
      h === 'timewindowend' ||
      h === 'twend' ||
      h === 'end' ||
      h === 'windowend'
  );

  const missingHeaders: string[] = [];
  if (idIdx === -1) missingHeaders.push('id');
  if (latIdx === -1) missingHeaders.push('latitude');
  if (lngIdx === -1) missingHeaders.push('longitude');
  if (demandIdx === -1) missingHeaders.push('demand');

  if (missingHeaders.length > 0) {
    return {
      rows: [],
      validJobs: [],
      validCount: 0,
      invalidCount: 0,
      conflictCount: 0,
      totalCount: 0,
      headerError: `Missing required CSV column(s): ${missingHeaders.join(', ')}. Expected headers: id,latitude,longitude,demand,serviceDuration,priority`,
    };
  }

  const existingIdSet = new Set(existingJobs.map((j) => j.id.toLowerCase()));
  const seenCsvIds = new Set<string>();
  const parsedRows: CsvParsedRow[] = [];
  const validJobs: DeliveryRequest[] = [];

  for (let r = 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    const errors: string[] = [];
    const rowNumber = r + 1; // 1-indexed for user visibility (Header is row 1)

    const rawId = (row[idIdx] || '').trim();
    const rawLat = (row[latIdx] || '').trim();
    const rawLng = (row[lngIdx] || '').trim();
    const rawDemand = (row[demandIdx] || '').trim();
    const rawDuration = durationIdx !== -1 ? (row[durationIdx] || '').trim() : '';
    const rawPriority = priorityIdx !== -1 ? (row[priorityIdx] || '').trim() : '';
    const rawTwStart = twStartIdx !== -1 ? (row[twStartIdx] || '').trim() : '';
    const rawTwEnd = twEndIdx !== -1 ? (row[twEndIdx] || '').trim() : '';

    // 1. Validate ID
    if (!rawId) {
      errors.push('Missing ID');
    } else {
      const lowerId = rawId.toLowerCase();
      if (seenCsvIds.has(lowerId)) {
        errors.push(`Duplicate ID '${rawId}' in CSV`);
      } else if (existingIdSet.has(lowerId)) {
        errors.push(`Job '${rawId}' already exists`);
      }
      seenCsvIds.add(lowerId);
    }

    // 2. Validate Latitude
    let lat: number | null = null;
    if (!rawLat) {
      errors.push('Missing latitude');
    } else {
      const parsedLat = parseFloat(rawLat);
      if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
        errors.push(`Invalid latitude: '${rawLat}' (must be between -90 and 90)`);
      } else {
        lat = parsedLat;
      }
    }

    // 3. Validate Longitude
    let lng: number | null = null;
    if (!rawLng) {
      errors.push('Missing longitude');
    } else {
      const parsedLng = parseFloat(rawLng);
      if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
        errors.push(`Invalid longitude: '${rawLng}' (must be between -180 and 180)`);
      } else {
        lng = parsedLng;
      }
    }

    // 4. Validate Demand
    let demand: number | null = null;
    if (!rawDemand) {
      errors.push('Missing demand');
    } else {
      const parsedDemand = parseFloat(rawDemand);
      if (isNaN(parsedDemand) || parsedDemand <= 0) {
        errors.push(`Invalid demand: '${rawDemand}' (must be a positive number)`);
      } else {
        demand = parsedDemand;
      }
    }

    // 5. Validate Service Duration (default 240s = 4m if empty)
    let serviceDuration = 240;
    if (rawDuration) {
      const parsedDuration = parseFloat(rawDuration);
      if (isNaN(parsedDuration) || parsedDuration < 0) {
        errors.push(`Invalid service duration: '${rawDuration}' (must be >= 0)`);
      } else {
        serviceDuration = parsedDuration;
      }
    }

    // 6. Validate Priority (default 2 if empty, range 1-10)
    let priority = 2;
    if (rawPriority) {
      const parsedPriority = parseInt(rawPriority, 10);
      if (isNaN(parsedPriority) || parsedPriority < 1 || parsedPriority > 10) {
        errors.push(`Invalid priority: '${rawPriority}' (must be integer 1-10)`);
      } else {
        priority = parsedPriority;
      }
    }

    // 7. Optional Time Window
    let timeWindow: { start: number; end: number } | undefined = undefined;
    if (rawTwStart || rawTwEnd) {
      const startSec = rawTwStart ? parseFloat(rawTwStart) : 0;
      const endSec = rawTwEnd ? parseFloat(rawTwEnd) : 86400;
      if (isNaN(startSec) || isNaN(endSec) || startSec < 0 || startSec > endSec) {
        errors.push(`Invalid time window: start=${rawTwStart}, end=${rawTwEnd}`);
      } else {
        timeWindow = { start: startSec, end: endSec };
      }
    }

    let status: 'valid' | 'invalid' | 'conflict' = 'valid';
    if (errors.some((e) => e.includes('already exists'))) {
      status = 'conflict';
    } else if (errors.length > 0) {
      status = 'invalid';
    }

    let job: DeliveryRequest | undefined = undefined;
    if (status === 'valid' && lat != null && lng != null && demand != null) {
      job = {
        id: rawId,
        latitude: lat,
        longitude: lng,
        demand: demand,
        serviceDuration: serviceDuration,
        priority: priority,
        timeWindow: timeWindow,
      };
      validJobs.push(job);
    }

    parsedRows.push({
      rowNumber,
      id: rawId || `Row ${rowNumber}`,
      latitude: lat,
      longitude: lng,
      demand: demand,
      serviceDuration: serviceDuration,
      priority: priority,
      timeWindow: timeWindow,
      status,
      errors,
      job,
    });
  }

  const validCount = parsedRows.filter((r) => r.status === 'valid').length;
  const conflictCount = parsedRows.filter((r) => r.status === 'conflict').length;
  const invalidCount = parsedRows.filter((r) => r.status === 'invalid').length;

  return {
    rows: parsedRows,
    validJobs,
    validCount,
    invalidCount,
    conflictCount,
    totalCount: parsedRows.length,
  };
}

/**
 * Generates and triggers browser download of a sample CSV template.
 */
export function downloadCsvTemplate(): void {
  const csvContent = [
    'id,latitude,longitude,demand,serviceDuration,priority,timeWindowStart,timeWindowEnd',
    'D10,20.3120,85.8340,15,240,2,28800,43200',
    'D11,20.2980,85.8190,22,300,1,32400,46800',
    'D12,20.2850,85.8510,14,180,3,,',
    'D13,20.3340,85.8220,18,240,2,,',
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'linkedit_delivery_jobs_template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
