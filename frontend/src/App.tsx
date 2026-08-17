import { useState, useEffect } from 'react';
import type { LocationRequest, VehicleRequest, DeliveryRequest, OptimizationResponse } from './types/optimization';
import { AppHeader } from './components/layout/AppHeader';
import { PlanningSidebar } from './components/planning/PlanningSidebar';
import { RoutingMap } from './components/map/RoutingMap';
import { ResultsTabs } from './components/results/ResultsTabs';
import { optimizeRoutes, ApiError } from './api/optimizationApi';
import { BHUBANESWAR_DEMO_DEPOT, BHUBANESWAR_DEMO_VEHICLES, BHUBANESWAR_DEMO_JOBS } from './data/sampleData';
import { AlertCircle, X } from 'lucide-react';

// Refined Layout Constants
const MIN_SIDEBAR_WIDTH = 280;
const DEFAULT_SIDEBAR_WIDTH = 320;
const MAX_SIDEBAR_WIDTH = 450;

const MIN_RESULTS_HEIGHT = 180;
const DEFAULT_RESULTS_HEIGHT = 280;
const MAX_RESULTS_HEIGHT = 480;

export function App() {
  // Input State (Starts empty per requirement)
  const [depot, setDepot] = useState<LocationRequest>({
    id: 'DEPOT-1',
    latitude: 20.2961,
    longitude: 85.8245,
  });
  const [vehicles, setVehicles] = useState<VehicleRequest[]>([]);
  const [jobs, setJobs] = useState<DeliveryRequest[]>([]);

  // Optimization Execution State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<OptimizationResponse | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [fitBoundsCounter, setFitBoundsCounter] = useState(0);

  // Sidebar Open/Collapsed State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Resizable Split-Pane Dimensions (Persisted in localStorage)
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('linkedit.sidebarWidth');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= MIN_SIDEBAR_WIDTH && val <= MAX_SIDEBAR_WIDTH) {
          return val;
        }
      }
    } catch {
      // Ignore localStorage errors
    }
    return DEFAULT_SIDEBAR_WIDTH;
  });

  const [resultsHeight, setResultsHeight] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('linkedit.resultsHeight');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= MIN_RESULTS_HEIGHT && val <= MAX_RESULTS_HEIGHT) {
          return val;
        }
      }
    } catch {
      // Ignore localStorage errors
    }
    return DEFAULT_RESULTS_HEIGHT;
  });

  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [isDraggingResults, setIsDraggingResults] = useState(false);

  // Persist sidebar and results dimensions
  useEffect(() => {
    try {
      localStorage.setItem('linkedit.sidebarWidth', sidebarWidth.toString());
    } catch {
      // Ignore localStorage errors
    }
  }, [sidebarWidth]);

  useEffect(() => {
    try {
      localStorage.setItem('linkedit.resultsHeight', resultsHeight.toString());
    } catch {
      // Ignore localStorage errors
    }
  }, [resultsHeight]);

  // Pointer move and up listeners during active resize
  useEffect(() => {
    if (!isDraggingSidebar && !isDraggingResults) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (isDraggingSidebar) {
        const maxAllowed = Math.min(MAX_SIDEBAR_WIDTH, window.innerWidth - 300);
        const newWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(maxAllowed, e.clientX));
        setSidebarWidth(newWidth);
      } else if (isDraggingResults) {
        const maxAllowed = Math.min(MAX_RESULTS_HEIGHT, window.innerHeight - 200);
        const newHeight = Math.max(
          MIN_RESULTS_HEIGHT,
          Math.min(maxAllowed, window.innerHeight - e.clientY)
        );
        setResultsHeight(newHeight);
      }
    };

    const handlePointerUp = () => {
      setIsDraggingSidebar(false);
      setIsDraggingResults(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isDraggingSidebar, isDraggingResults]);

  const handleSidebarResizeStart = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDraggingSidebar(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleResultsResizeStart = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDraggingResults(true);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  };

  // Reset Layout handler (Restores default sidebar, open state & results height)
  const handleResetLayout = () => {
    setIsSidebarOpen(true);
    setSidebarWidth(DEFAULT_SIDEBAR_WIDTH);
    setResultsHeight(DEFAULT_RESULTS_HEIGHT);
    try {
      localStorage.removeItem('linkedit.sidebarWidth');
      localStorage.removeItem('linkedit.resultsHeight');
    } catch {
      // Ignore
    }
  };

  const hasData = vehicles.length > 0 || jobs.length > 0 || response !== null;

  // Load Bhubaneswar Demo Data Handler
  const handleLoadDemo = () => {
    setDepot(BHUBANESWAR_DEMO_DEPOT);
    setVehicles(BHUBANESWAR_DEMO_VEHICLES);
    setJobs(BHUBANESWAR_DEMO_JOBS);
    setError(null);
    setResponse(null);
    setSelectedVehicleId(null);
    setFitBoundsCounter((prev) => prev + 1);
  };

  // Reset Planning State
  const handleReset = () => {
    setVehicles([]);
    setJobs([]);
    setResponse(null);
    setError(null);
    setSelectedVehicleId(null);
  };

  // Vehicle Handlers
  const handleAddVehicle = (vehicle: VehicleRequest) => {
    setVehicles((prev) => [...prev, vehicle]);
  };

  const handleUpdateVehicle = (index: number, vehicle: VehicleRequest) => {
    setVehicles((prev) => prev.map((v, i) => (i === index ? vehicle : v)));
  };

  const handleRemoveVehicle = (index: number) => {
    setVehicles((prev) => prev.filter((_, i) => i !== index));
  };

  // Single Job Handlers
  const handleAddJob = (job: DeliveryRequest) => {
    setJobs((prev) => [...prev, job]);
    setFitBoundsCounter((prev) => prev + 1);
  };

  // Bulk CSV Jobs Import Handler
  const handleAddJobs = (newJobs: DeliveryRequest[]) => {
    setJobs((prev) => [...prev, ...newJobs]);
    // Clear existing optimization response to avoid stale results with newly added jobs
    setResponse(null);
    setSelectedVehicleId(null);
    // Fit bounds once across all jobs
    setFitBoundsCounter((prev) => prev + 1);
  };

  const handleUpdateJob = (index: number, job: DeliveryRequest) => {
    setJobs((prev) => prev.map((j, i) => (i === index ? job : j)));
  };

  const handleRemoveJob = (index: number) => {
    setJobs((prev) => prev.filter((_, i) => i !== index));
  };

  // Optimize Action Handler
  const handleOptimize = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const res = await optimizeRoutes({
        depot,
        vehicles,
        jobs,
      });

      setResponse(res);
      setSelectedVehicleId(null);
      setFitBoundsCounter((prev) => prev + 1);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.errors.join('; '));
      } else {
        setError((err as Error).message || 'An unexpected optimization error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans antialiased text-slate-900 select-none">
      {/* Top Application Header */}
      <AppHeader
        onLoadDemo={handleLoadDemo}
        onReset={handleReset}
        onResetLayout={handleResetLayout}
        hasData={hasData}
      />

      {/* Error Alert Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center justify-between z-30 shrink-0">
          <div className="flex items-center space-x-2 text-xs text-red-800 font-medium">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 p-0.5 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Workspace Body: Left Sidebar + Vertical Divider + Right Main Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Resizable Planning Sidebar (Conditionally Rendered) */}
        {isSidebarOpen && (
          <>
            <PlanningSidebar
              width={sidebarWidth}
              depot={depot}
              vehicles={vehicles}
              jobs={jobs}
              selectedVehicleId={selectedVehicleId}
              onSelectVehicle={setSelectedVehicleId}
              onDepotChange={setDepot}
              onAddVehicle={handleAddVehicle}
              onUpdateVehicle={handleUpdateVehicle}
              onRemoveVehicle={handleRemoveVehicle}
              onAddJob={handleAddJob}
              onAddJobs={handleAddJobs}
              onUpdateJob={handleUpdateJob}
              onRemoveJob={handleRemoveJob}
              onOptimize={handleOptimize}
              onClose={() => setIsSidebarOpen(false)}
              isLoading={isLoading}
            />

            {/* Vertical Resize Handle (Sidebar Divider) with grip indicator */}
            <div
              onPointerDown={handleSidebarResizeStart}
              className={`resize-handle-x ${isDraggingSidebar ? 'is-dragging' : ''}`}
              title="Drag horizontally to resize planning sidebar"
            >
              <div className="resize-grip-dots-x">⋮</div>
            </div>
          </>
        )}

        {/* Right Workspace: Map (Upper) + Horizontal Divider + Results Workspace (Lower) */}
        <main className="flex-1 flex flex-col overflow-hidden relative min-w-0">
          {/* Map Area */}
          <div className="flex-1 relative overflow-hidden min-h-0">
            <RoutingMap
              depot={depot}
              jobs={jobs}
              response={response}
              selectedVehicleId={selectedVehicleId}
              onSelectVehicle={setSelectedVehicleId}
              shouldFitBoundsTrigger={fitBoundsCounter}
              isSidebarOpen={isSidebarOpen}
              onOpenSidebar={() => setIsSidebarOpen(true)}
              isResizing={isDraggingSidebar || isDraggingResults}
            />
          </div>

          {/* Horizontal Resize Handle (Results Divider) with grip indicator */}
          <div
            onPointerDown={handleResultsResizeStart}
            className={`resize-handle-y ${isDraggingResults ? 'is-dragging' : ''}`}
            title="Drag vertically to resize results workspace"
          >
            <div className="resize-grip-dots-y">⋯</div>
          </div>

          {/* Bottom Resizable Dispatch Workspace */}
          <ResultsTabs
            height={resultsHeight}
            jobs={jobs}
            vehicles={vehicles}
            response={response}
            selectedVehicleId={selectedVehicleId}
            onSelectVehicle={setSelectedVehicleId}
          />
        </main>
      </div>
    </div>
  );
}
