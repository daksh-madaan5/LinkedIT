import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LocationRequest } from '../../types/optimization';
import {
  searchLocations,
  reverseGeocode,
  POPULAR_DEPOT_PRESETS,
  type LocationSearchResult,
  type DepotPreset,
} from '../../utils/geocoding';
import {
  Warehouse,
  Search,
  MapPin,
  Crosshair,
  Check,
  X,
  Loader2,
  Building2,
  Navigation,
  Sparkles,
} from 'lucide-react';

interface DepotOriginModalProps {
  isOpen: boolean;
  currentDepot: LocationRequest;
  onConfirm: (depot: LocationRequest) => void;
  onClose?: () => void;
  isFirstLaunch?: boolean;
}

export const DepotOriginModal: React.FC<DepotOriginModalProps> = ({
  isOpen,
  currentDepot,
  onConfirm,
  onClose,
  isFirstLaunch = false,
}) => {
  const [depotId, setDepotId] = useState(currentDepot.id || 'DEPOT-1');
  const [depotName, setDepotName] = useState(
    currentDepot.name || 'Bhubaneswar Central Depot'
  );
  const [depotAddress, setDepotAddress] = useState(
    currentDepot.address || 'Saheed Nagar, Bhubaneswar, Odisha, India'
  );
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: currentDepot.latitude ?? 20.2961,
    lng: currentDepot.longitude ?? 85.8245,
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync with currentDepot when opened
  useEffect(() => {
    if (isOpen) {
      setDepotId(currentDepot.id || 'DEPOT-1');
      setDepotName(currentDepot.name || 'Bhubaneswar Central Depot');
      setDepotAddress(
        currentDepot.address || 'Saheed Nagar, Bhubaneswar, Odisha, India'
      );
      setCoords({
        lat: currentDepot.latitude ?? 20.2961,
        lng: currentDepot.longitude ?? 85.8245,
      });
      setSearchQuery('');
      setSearchResults([]);
      setIsDropdownOpen(false);
      setLocateError(null);
    }
  }, [isOpen, currentDepot]);

  // Debounced search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setLocateError(null);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (val.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setIsDropdownOpen(false);
      return;
    }

    setIsSearching(true);
    setIsDropdownOpen(true);

    searchDebounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const results = await searchLocations(val, controller.signal);
        setSearchResults(results);
        setIsDropdownOpen(true);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Search geocode error:', err);
        }
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  // Reverse geocode when coordinates change via map click/drag
  const handleMapPositionChange = useCallback(async (lat: number, lng: number) => {
    setCoords({ lat, lng });
    setIsReverseGeocoding(true);

    try {
      const res = await reverseGeocode(lat, lng);
      setDepotName(res.shortName);
      setDepotAddress(res.displayName);
    } catch {
      setDepotName(`Depot Location`);
      setDepotAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } finally {
      setIsReverseGeocoding(false);
    }
  }, []);

  // Update map marker and pan to coords
  const updateMapMarker = useCallback((lat: number, lng: number, shouldPan = true) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (shouldPan) {
      map.setView([lat, lng], 14, { animate: true });
    }

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const depotIcon = L.divIcon({
        className: 'custom-depot-marker',
        html: `
          <div class="depot-pin">
            <div class="depot-badge font-mono">DEPOT</div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const newMarker = L.marker([lat, lng], {
        icon: depotIcon,
        draggable: true,
      }).addTo(map);

      newMarker.on('dragend', (e) => {
        const marker = e.target;
        const position = marker.getLatLng();
        handleMapPositionChange(position.lat, position.lng);
      });

      markerRef.current = newMarker;
    }
  }, [handleMapPositionChange]);

  const handleMapPositionChangeRef = useRef(handleMapPositionChange);
  handleMapPositionChangeRef.current = handleMapPositionChange;

  // Leaflet Map Initialization
  useEffect(() => {
    if (!isOpen) return;

    const initialLat = coords.lat;
    const initialLng = coords.lng;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      // Clean up previous instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Create Depot Marker
      const depotIcon = L.divIcon({
        className: 'custom-depot-marker',
        html: `
          <div class="depot-pin">
            <div class="depot-badge font-mono">DEPOT</div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([initialLat, initialLng], {
        icon: depotIcon,
        draggable: true,
      }).addTo(map);

      marker.on('dragend', (e) => {
        const m = e.target;
        const position = m.getLatLng();
        handleMapPositionChangeRef.current(position.lat, position.lng);
      });

      // Map click handler
      map.on('click', (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        handleMapPositionChangeRef.current(e.latlng.lat, e.latlng.lng);
      });

      markerRef.current = marker;
      mapInstanceRef.current = map;

      // Force recalculation of container size
      map.invalidateSize();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isOpen]);

  // Select Search Result
  const handleSelectResult = (result: LocationSearchResult) => {
    setDepotName(result.name);
    setDepotAddress(result.displayName);
    setCoords({ lat: result.latitude, lng: result.longitude });
    setSearchQuery(result.name);
    setIsDropdownOpen(false);
    updateMapMarker(result.latitude, result.longitude, true);
  };

  // Select Preset Hub
  const handleSelectPreset = (preset: DepotPreset) => {
    setDepotId(preset.id);
    setDepotName(preset.name);
    setDepotAddress(preset.address);
    setCoords({ lat: preset.latitude, lng: preset.longitude });
    setSearchQuery('');
    setIsDropdownOpen(false);
    updateMapMarker(preset.latitude, preset.longitude, true);
  };

  // Geolocation (Current position)
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocateError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocateError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        updateMapMarker(lat, lng, true);
        await handleMapPositionChange(lat, lng);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        setLocateError(
          err.code === 1
            ? 'Location permission was denied.'
            : 'Could not retrieve your location. Please search or pick on map.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Confirm Selection
  const handleConfirm = () => {
    onConfirm({
      id: depotId.trim() || 'DEPOT-1',
      name: depotName.trim() || 'Depot Origin',
      address: depotAddress.trim() || `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
      latitude: coords.lat,
      longitude: coords.lng,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Warehouse className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white tracking-tight">
                  Set Depot Origin Location
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/30">
                  Fleet Hub
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Choose the central departure and return location for your fleet.
              </p>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
          {/* Search Input Bar */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Search Location or City
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-slate-400 pointer-events-none">
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => {
                  if (searchResults.length > 0) setIsDropdownOpen(true);
                }}
                placeholder="Search city, address, landmark (e.g. Bhubaneswar, Indiranagar, Connaught Place)..."
                className="w-full pl-9.5 pr-24 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-xs"
              />
              <div className="absolute right-2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                      setIsDropdownOpen(false);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                  className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  title="Detect and use current device location"
                >
                  {isLocating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Crosshair className="h-3 w-3" />
                  )}
                  <span>GPS</span>
                </button>
              </div>
            </div>

            {/* Error Message if GPS / search failed */}
            {locateError && (
              <p className="mt-1.5 text-xs text-red-600 font-medium">
                {locateError}
              </p>
            )}

            {/* Autocomplete Dropdown */}
            {isDropdownOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-98 duration-100">
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectResult(item)}
                    className="w-full px-4 py-2.5 text-left hover:bg-blue-50/60 flex items-start gap-2.5 transition-colors cursor-pointer group"
                  >
                    <div className="p-1 rounded-md bg-slate-100 group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-700 mt-0.5 shrink-0">
                      <MapPin className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 group-hover:text-blue-900 truncate">
                          {item.name}
                        </span>
                        {item.type && (
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700">
                            {item.type}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5 font-sans">
                        {item.displayName}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Hub Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-blue-600" />
                <span>Popular Logistics Hubs</span>
              </span>
              <span className="text-[10px] text-slate-400">1-Click Selection</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_DEPOT_PRESETS.map((preset) => {
                const isSelected =
                  Math.abs(preset.latitude - coords.lat) < 0.001 &&
                  Math.abs(preset.longitude - coords.lng) < 0.001;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold border border-blue-700 shadow-sm'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Building2 className={`h-3 w-3 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                    <span>{preset.name.replace(' Logistics Hub', '').replace(' Central Depot', '').replace(' Freight Gateway', '').replace(' Distribution Hub', '')}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Leaflet Map Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                <Navigation className="h-3 w-3 text-blue-600" />
                <span>Interactive Map Picker</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Click map or drag pin to position
              </span>
            </div>
            <div className="h-56 w-full rounded-xl border border-slate-300 overflow-hidden shadow-inner relative">
              <div ref={mapContainerRef} className="w-full h-full z-0" />
              {isReverseGeocoding && (
                <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-md flex items-center gap-1.5 z-[1000] shadow-md">
                  <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
                  <span>Resolving address...</span>
                </div>
              )}
            </div>
          </div>

          {/* Active Depot Origin Summary Card */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-xs text-slate-900 truncate">
                    {depotName}
                  </h4>
                  <span className="text-[10px] font-mono font-bold bg-white text-blue-700 px-1.5 py-0.2 rounded border border-blue-200">
                    {depotId || 'DEPOT-1'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 truncate mt-0.5">
                  {depotAddress}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono text-slate-500 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200">
                    Lat: {coords.lat.toFixed(4)}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200">
                    Lng: {coords.lng.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>

            <div className="shrink-0 w-full sm:w-auto">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Depot Identifier
              </label>
              <input
                type="text"
                value={depotId}
                onChange={(e) => setDepotId(e.target.value)}
                placeholder="DEPOT-1"
                className="w-full sm:w-28 px-2.5 py-1 text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div>
            {isFirstLaunch ? (
              <span className="text-[11px] text-slate-500 font-medium">
                You can change the depot origin anytime from the sidebar.
              </span>
            ) : (
              onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )
            )}
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer"
          >
            <Check className="h-4 w-4" />
            <span>Confirm Depot Origin</span>
          </button>
        </div>
      </div>
    </div>
  );
};
