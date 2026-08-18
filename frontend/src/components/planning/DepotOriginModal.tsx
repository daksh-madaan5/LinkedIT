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
  Search,
  MapPin,
  Crosshair,
  X,
  Loader2,
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

      map.on('click', (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        handleMapPositionChangeRef.current(e.latlng.lat, e.latlng.lng);
      });

      markerRef.current = marker;
      mapInstanceRef.current = map;

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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none animate-in fade-in duration-150">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Change Depot Location
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Select the location where vehicles start and finish their routes.
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
          {/* Search Input Bar */}
          <div className="relative">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Search location
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-2.5 text-slate-400 pointer-events-none">
                {isSearching ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                ) : (
                  <Search className="h-3.5 w-3.5" />
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
                placeholder="Search city, address or landmark..."
                className="w-full pl-8 pr-16 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1.5 focus:ring-blue-500/20 focus:border-blue-600 h-8"
              />
              <div className="absolute right-1.5 flex items-center gap-0.5">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                      setIsDropdownOpen(false);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                    title="Clear search"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                  className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded cursor-pointer transition-colors"
                  title="Use current GPS location"
                >
                  {isLocating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                  ) : (
                    <Crosshair className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message if GPS / search failed */}
            {locateError && (
              <p className="mt-1 text-[11px] text-red-600">
                {locateError}
              </p>
            )}

            {/* Autocomplete Dropdown */}
            {isDropdownOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-50 max-h-52 overflow-y-auto divide-y divide-slate-100">
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectResult(item)}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-start gap-2 transition-colors cursor-pointer text-xs"
                  >
                    <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900 truncate">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {item.displayName}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Suggested Locations */}
          <div>
            <span className="block text-[11px] font-semibold text-slate-600 mb-1.5">
              Suggested locations
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_DEPOT_PRESETS.map((preset) => {
                const isSelected =
                  Math.abs(preset.latitude - coords.lat) < 0.001 &&
                  Math.abs(preset.longitude - coords.lng) < 0.001;

                const label = preset.name
                  .replace(' Logistics Hub', '')
                  .replace(' Central Depot', '')
                  .replace(' Freight Gateway', '')
                  .replace(' Distribution Hub', '')
                  .replace(' Port Logistics', '')
                  .replace(' Maritime Terminal', '')
                  .replace(' Industrial Logistics Hub', '')
                  .replace(' Fulfillment Center', '');

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Leaflet Map Picker */}
          <div>
            <div className="h-52 w-full rounded border border-slate-200 overflow-hidden relative">
              <div ref={mapContainerRef} className="w-full h-full z-0" />
              {isReverseGeocoding && (
                <div className="absolute top-2 left-2 bg-slate-900/80 text-white text-[11px] px-2 py-1 rounded flex items-center gap-1.5 z-[1000]">
                  <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
                  <span>Resolving address...</span>
                </div>
              )}
            </div>
          </div>

          {/* Selected Depot Information */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Selected Depot
                </span>
                <div className="font-semibold text-slate-900 truncate mt-0.5">
                  {depotName}
                </div>
                <div className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                  {depotAddress}
                </div>
              </div>

              <div className="w-28 shrink-0">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
                  Depot ID
                </label>
                <input
                  type="text"
                  value={depotId}
                  onChange={(e) => setDepotId(e.target.value)}
                  placeholder="DEPOT-1"
                  className="w-full px-2 py-1 text-xs font-mono font-semibold text-slate-900 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 h-7"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/80 flex items-center gap-4 text-[11px] text-slate-500 font-mono">
              <div>
                Latitude: <span className="font-semibold text-slate-700">{coords.lat.toFixed(4)}</span>
              </div>
              <div>
                Longitude: <span className="font-semibold text-slate-700">{coords.lng.toFixed(4)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded border border-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded shadow-xs transition-colors cursor-pointer"
          >
            Confirm Depot
          </button>
        </div>
      </div>
    </div>
  );
};
