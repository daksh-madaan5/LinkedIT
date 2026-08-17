export interface LocationSearchResult {
  id: string;
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
  type?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface DepotPreset {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  region: string;
}

export const POPULAR_DEPOT_PRESETS: DepotPreset[] = [
  {
    id: 'DEPOT-BBI',
    name: 'Bhubaneswar Central Depot',
    address: 'Saheed Nagar, Bhubaneswar, Odisha, India',
    latitude: 20.2961,
    longitude: 85.8245,
    region: 'Odisha',
  },
  {
    id: 'DEPOT-BLR',
    name: 'Bengaluru Logistics Hub',
    address: 'Electronic City, Bengaluru, Karnataka, India',
    latitude: 12.9716,
    longitude: 77.5946,
    region: 'Karnataka',
  },
  {
    id: 'DEPOT-MUM',
    name: 'Mumbai Freight Gateway',
    address: 'Bandra-Kurla Complex / JNPT, Mumbai, Maharashtra, India',
    latitude: 19.0760,
    longitude: 72.8777,
    region: 'Maharashtra',
  },
  {
    id: 'DEPOT-DEL',
    name: 'Delhi NCR Fulfillment Center',
    address: 'Okhla Industrial Area, New Delhi, Delhi, India',
    latitude: 28.6139,
    longitude: 77.2090,
    region: 'Delhi NCR',
  },
  {
    id: 'DEPOT-HYD',
    name: 'Hyderabad Distribution Hub',
    address: 'HITEC City, Madhapur, Hyderabad, Telangana, India',
    latitude: 17.3850,
    longitude: 78.4867,
    region: 'Telangana',
  },
  {
    id: 'DEPOT-KOL',
    name: 'Kolkata Port Logistics',
    address: 'Salt Lake Sector V, Kolkata, West Bengal, India',
    latitude: 22.5726,
    longitude: 88.3639,
    region: 'West Bengal',
  },
  {
    id: 'DEPOT-MAA',
    name: 'Chennai Maritime Terminal',
    address: 'Guindy Industrial Estate, Chennai, Tamil Nadu, India',
    latitude: 13.0827,
    longitude: 80.2707,
    region: 'Tamil Nadu',
  },
  {
    id: 'DEPOT-PUN',
    name: 'Pune Industrial Logistics Hub',
    address: 'Hinjawadi Phase 1, Pune, Maharashtra, India',
    latitude: 18.5204,
    longitude: 73.8567,
    region: 'Maharashtra',
  },
];

/**
 * Search locations worldwide using OpenStreetMap Nominatim Geocoding API.
 */
export async function searchLocations(
  query: string,
  signal?: AbortSignal
): Promise<LocationSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) {
    return [];
  }

  // Check matching local presets first for instant response
  const lower = trimmed.toLowerCase();
  const matchedPresets: LocationSearchResult[] = POPULAR_DEPOT_PRESETS.filter(
    (p) =>
      p.name.toLowerCase().includes(lower) ||
      p.address.toLowerCase().includes(lower) ||
      p.region.toLowerCase().includes(lower)
  ).map((p) => ({
    id: `preset-${p.id}`,
    name: p.name,
    displayName: p.address,
    latitude: p.latitude,
    longitude: p.longitude,
    type: 'logistics_hub',
  }));

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      trimmed
    )}&addressdetails=1&limit=6`;

    const res = await fetch(url, {
      signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      return matchedPresets;
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      return matchedPresets;
    }

    const apiResults: LocationSearchResult[] = data.map((item: any) => {
      const address = item.address || {};
      const placeName =
        address.amenity ||
        address.building ||
        address.road ||
        address.neighbourhood ||
        address.suburb ||
        address.city ||
        address.town ||
        address.village ||
        address.county ||
        item.name ||
        trimmed;

      return {
        id: `osm-${item.place_id || Math.random()}`,
        name: placeName,
        displayName: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        type: item.type || item.category || 'location',
        city: address.city || address.town || address.village,
        state: address.state,
        country: address.country,
      };
    });

    // Merge without exact coordinate duplicates
    const combined = [...matchedPresets];
    for (const r of apiResults) {
      if (
        !combined.some(
          (c) =>
            Math.abs(c.latitude - r.latitude) < 0.0005 &&
            Math.abs(c.longitude - r.longitude) < 0.0005
        )
      ) {
        combined.push(r);
      }
    }

    return combined.slice(0, 8);
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    return matchedPresets;
  }
}

/**
 * Reverse geocode latitude and longitude to get a human-readable place name.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  signal?: AbortSignal
): Promise<{ shortName: string; displayName: string }> {
  // Check if matches known preset
  const presetMatch = POPULAR_DEPOT_PRESETS.find(
    (p) =>
      Math.abs(p.latitude - latitude) < 0.001 &&
      Math.abs(p.longitude - longitude) < 0.001
  );
  if (presetMatch) {
    return {
      shortName: presetMatch.name,
      displayName: presetMatch.address,
    };
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`;
    const res = await fetch(url, {
      signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      return {
        shortName: `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
        displayName: `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      };
    }

    const data = await res.json();
    const address = data.address || {};
    const shortName =
      address.amenity ||
      address.building ||
      address.road ||
      address.suburb ||
      address.city ||
      address.town ||
      address.county ||
      'Depot Location';

    return {
      shortName,
      displayName: data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    };
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    return {
      shortName: `Depot Location`,
      displayName: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    };
  }
}
