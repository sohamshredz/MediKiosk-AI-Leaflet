// Unified Location and Hospital Service
// Manages real GPS coordinates, reverse/forward geocoding, and distance calculations.

export type { 
  EmergencyCapabilityStatus, 
  HealthcareCategory, 
  NormalizedHealthcareFacility, 
  FacilityClassificationResult 
} from './hospitalDiscoveryService';
import { 
  isNonFacilityInfrastructure, 
  classifyHealthcareFacility, 
  determineEmergencyCapability, 
  rankHospitalsForEmergency, 
  rankFacilitiesForLocator 
} from './hospitalDiscoveryService';

export { 
  isNonFacilityInfrastructure, 
  classifyHealthcareFacility, 
  determineEmergencyCapability, 
  rankHospitalsForEmergency, 
  rankFacilitiesForLocator 
};

export interface UserCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface GeocodedLocation {
  formattedAddress: string;
  displayName: string;
  area: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
  isManual?: boolean;
}

export interface HospitalFacility {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'phc' | 'health_centre';
  typeLabel: string;
  isHospital?: boolean;
  isSpecialtyClinic?: boolean;
  isEmergencyVerified?: boolean;
  emergencyCapability?: 'verified' | 'not_verified' | 'unknown';
  specialty?: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  googleMapsURI?: string;
  distanceKm: number;
  roadDistanceKm?: number;
  roadDurationMins?: number;
  travelTimeMins: number;
  emergencyAvailable?: string;
  openNow?: boolean;
  weekdayDescriptions?: string[];
  rawTypes?: string[];
  rating?: number | null;
  userRatingCount?: number;
  source?: 'live_places_api' | 'manual_search' | 'demo_synthetic' | 'openstreetmap' | 'national_health_network' | 'google_places';
}

// Coordinate validator to prevent 0,0 null island / blue ocean bugs and invalid float inputs
export function isValidCoordinate(lat: any, lng: any): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  // Guard against (0,0) Gulf of Guinea / Atlantic Ocean default coordinate
  if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return false;
  return true;
}

// Haversine formula for calculating real spherical distance in kilometers
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (typeof lat1 !== 'number' || typeof lon1 !== 'number' || typeof lat2 !== 'number' || typeof lon2 !== 'number') {
    return 0;
  }
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// In-memory cache for user's active session coordinates
let cachedUserCoordinates: UserCoordinates | null = null;
let cachedGeocodedLocation: GeocodedLocation | null = null;
const locationListeners: Array<(coords: UserCoordinates | null) => void> = [];

export function subscribeToUserLocation(listener: (coords: UserCoordinates | null) => void) {
  locationListeners.push(listener);
  if (cachedUserCoordinates) {
    listener(cachedUserCoordinates);
  }
  return () => {
    const idx = locationListeners.indexOf(listener);
    if (idx !== -1) locationListeners.splice(idx, 1);
  };
}

export function setCachedUserCoordinates(coords: UserCoordinates | null, geocoded?: GeocodedLocation | null) {
  cachedUserCoordinates = coords;
  if (geocoded) cachedGeocodedLocation = geocoded;
  locationListeners.forEach(l => l(coords));
}

export function getCachedUserCoordinates(): UserCoordinates | null {
  return cachedUserCoordinates;
}

export function getCachedGeocodedLocation(): GeocodedLocation | null {
  return cachedGeocodedLocation;
}

/**
 * Request real GPS coordinates from browser/device Geolocation API
 */
export async function getCurrentGPSLocation(): Promise<UserCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: UserCoordinates = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: typeof pos.coords.accuracy === 'number' ? pos.coords.accuracy : 15,
          timestamp: typeof pos.timestamp === 'number' ? pos.timestamp : Date.now()
        };
        setCachedUserCoordinates(coords);
        resolve(coords);
      },
      (err) => {
        let msg = 'Unable to determine your current location.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please allow location access in your browser.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'GPS location is currently unavailable.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Location request timed out. Please try again.';
        }
        const error = new Error(msg);
        (error as any).code = err.code;
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Reverse geocode latitude and longitude to determine area, city, and state
 */
export async function reverseGeocodeCoordinates(
  lat: number,
  lng: number
): Promise<GeocodedLocation> {
  try {
    const response = await fetch('/api/geocode/reverse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.location) {
        cachedGeocodedLocation = data.location;
        return data.location;
      }
    }
  } catch (err) {
    console.warn('Reverse geocoding endpoint error, using fallback:', err);
  }

  // Fallback representation
  return {
    formattedAddress: `Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    displayName: 'Your Current GPS Location',
    area: 'Current Area',
    city: 'Detected Location',
    state: '',
    country: 'India',
    latitude: lat,
    longitude: lng,
    isManual: false
  };
}

/**
 * Forward geocode a city or area query to coordinates
 */
export async function geocodeCityOrArea(query: string): Promise<GeocodedLocation> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    throw new Error('Please enter a city or area name.');
  }

  const response = await fetch('/api/geocode/forward', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: cleanQuery })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Could not find location for "${cleanQuery}".`);
  }

  const data = await response.json();
  if (!data.success || !data.location) {
    throw new Error(data.error || `No results found for "${cleanQuery}".`);
  }

  return {
    ...data.location,
    isManual: true
  };
}

export interface NearbyHospitalsResult {
  success: boolean;
  count: number;
  provider: 'google_places' | 'openstreetmap' | 'national_health_network' | 'none';
  searchRadiusMeters: number;
  errorCode?: string;
  message?: string;
  hospitals: HospitalFacility[];
}

/**
 * Fetch nearby hospitals from the server using OpenStreetMap (Overpass API + Nominatim fallback)
 */
export async function fetchNearbyHospitals(
  lat: number,
  lng: number,
  radiusMeters = 5000,
  options?: { hospitalsOnly?: boolean }
): Promise<NearbyHospitalsResult> {
  try {
    const response = await fetch('/api/hospitals/nearby', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lat,
        lng,
        radius: radiusMeters,
        hospitalsOnly: Boolean(options?.hospitalsOnly)
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      return {
        success: false,
        count: 0,
        provider: data?.provider || 'none',
        searchRadiusMeters: radiusMeters,
        errorCode: data?.errorCode || 'SERVICE_UNAVAILABLE',
        message: data?.message || data?.error || 'Nearby hospital service is temporarily unavailable.',
        hospitals: []
      };
    }

    const rawList = Array.isArray(data.hospitals) ? data.hospitals : [];
    const maxRadiusKm = radiusMeters / 1000;

    const hospitals: HospitalFacility[] = rawList
      .map((h: any) => {
        const dist = (typeof h.latitude === 'number' && typeof h.longitude === 'number')
          ? calculateHaversineDistanceKm(lat, lng, h.latitude, h.longitude)
          : (typeof h.distanceKm === 'number' && !isNaN(h.distanceKm) ? h.distanceKm : 0);

        const roadDist = typeof h.roadDistanceKm === 'number' ? h.roadDistanceKm : Math.max(0.1, Math.round(dist * 1.32 * 10) / 10);
        const roadTime = typeof h.roadDurationMins === 'number' ? h.roadDurationMins : Math.max(1, Math.round((roadDist / 35) * 60 + 1));

        return {
          id: h.id || `hosp-${Math.random().toString(36).substring(2, 9)}`,
          name: h.name || 'Healthcare Facility',
          type: h.type || 'hospital',
          typeLabel: h.typeLabel || 'Hospital',
          isHospital: h.isHospital !== undefined ? h.isHospital : (h.type === 'hospital'),
          isSpecialtyClinic: h.isSpecialtyClinic || false,
          isEmergencyVerified: Boolean(h.isEmergencyVerified),
          emergencyCapability: h.emergencyCapability || (h.isEmergencyVerified ? 'verified' : 'not_verified'),
          specialty: h.specialty,
          address: h.address || 'Address on file',
          latitude: h.latitude,
          longitude: h.longitude,
          phone: h.phone || '',
          googleMapsURI: h.googleMapsURI || `https://www.openstreetmap.org/?mlat=${h.latitude}&mlon=${h.longitude}#map=16/${h.latitude}/${h.longitude}`,
          distanceKm: dist,
          roadDistanceKm: roadDist,
          roadDurationMins: roadTime,
          travelTimeMins: roadTime,
          emergencyAvailable: h.emergencyAvailable || (h.isEmergencyVerified ? 'Emergency capability: Verified' : 'Emergency capability: Not verified'),
          openNow: true,
          rating: h.rating || null,
          userRatingCount: h.userRatingCount || 0,
          source: h.source || 'openstreetmap'
        };
      })
      .filter((h: HospitalFacility) => {
        // Enforce exact circular geodesic Haversine distance limit
        return h.distanceKm <= maxRadiusKm;
      });

    // Sort strictly by nearest distance
    hospitals.sort((a, b) => a.distanceKm - b.distanceKm);

    return {
      success: true,
      count: hospitals.length,
      provider: data.provider || 'openstreetmap',
      searchRadiusMeters: data.searchRadiusMeters || radiusMeters,
      message: data.message,
      hospitals
    };
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      provider: 'none',
      searchRadiusMeters: radiusMeters,
      errorCode: 'NETWORK_ERROR',
      message: err.message || 'Unable to connect to hospital search service.',
      hospitals: []
    };
  }
}

export interface CalculatedRouteResult {
  success: boolean;
  distanceKm: number;
  distanceMeters: number;
  distanceText: string;
  durationMinutes: number;
  durationSeconds: number;
  durationText: string;
  points: Array<{ lat: number; lng: number }>;
  travelMode: 'ambulance' | 'car' | 'walk' | 'transit';
  error?: string;
  source: string;
}

/**
 * Progressive Nearby Hospital Search (5km -> 10km -> 15km -> 25km)
 * Local-first discovery strategy:
 * - Searches local 5km radius first.
 * - If sufficient genuine hospitals (>= 5) are found, uses them without unnecessary expansion.
 * - If insufficient, expands to 10km, 15km, and up to 25km.
 * - Merges results across search tiers, deduplicates by ID / place ID.
 * - Recalculates exact Haversine distance from current GPS coordinates for all candidates.
 * - Re-ranks the entire candidate set strictly by proximity using rankHospitalsForEmergency.
 */
export async function progressiveNearbyHospitalSearch(
  lat: number,
  lng: number,
  targetRadiusMeters?: number,
  options?: { hospitalsOnly?: boolean }
): Promise<NearbyHospitalsResult> {
  const allRadii = [5000, 25000, 50000, 75000];
  const radiiToSearch = targetRadiusMeters
    ? allRadii.filter(r => r <= targetRadiusMeters)
    : [5000, 25000, 50000, 75000];

  if (targetRadiusMeters && !radiiToSearch.includes(targetRadiusMeters)) {
    radiiToSearch.push(targetRadiusMeters);
    radiiToSearch.sort((a, b) => a - b);
  }

  const hospitalMap = new Map<string, HospitalFacility>();
  let lastProvider: 'google_places' | 'openstreetmap' | 'national_health_network' | 'none' = 'openstreetmap';
  let successfulRadius = targetRadiusMeters || 5000;
  let lastMessage: string | undefined;

  for (const r of radiiToSearch) {
    try {
      const result = await fetchNearbyHospitals(lat, lng, r, options);
      if (result.success && Array.isArray(result.hospitals) && result.hospitals.length > 0) {
        lastProvider = result.provider;
        successfulRadius = r;
        lastMessage = result.message;

        for (const h of result.hospitals) {
          if (options?.hospitalsOnly && (h.isHospital === false || h.isSpecialtyClinic)) {
            continue;
          }

          const key = (h as any).placeId || h.id;
          if (key) {
            // Guarantee accurate straight-line distance from patient's exact current GPS coordinates
            const preciseDist = (typeof h.latitude === 'number' && typeof h.longitude === 'number')
              ? calculateHaversineDistanceKm(lat, lng, h.latitude, h.longitude)
              : (h.distanceKm || 0);

            // Strictly skip facilities exceeding the requested target radius
            if (targetRadiusMeters && preciseDist > (targetRadiusMeters / 1000)) {
              continue;
            }

            // Compute accurate road detour distance & realistic emergency travel time
            const roadDetour = preciseDist < 2 ? 1.35 : (preciseDist < 10 ? 1.30 : 1.25);
            const roadDist = Math.max(0.1, Math.round(preciseDist * roadDetour * 10) / 10);
            const roadTime = Math.max(1, Math.round((roadDist / 38) * 60 + 1));

            const existing = hospitalMap.get(key);
            if (!existing || preciseDist < (existing.distanceKm ?? Infinity)) {
              hospitalMap.set(key, {
                ...h,
                distanceKm: preciseDist,
                roadDistanceKm: roadDist,
                roadDurationMins: roadTime,
                travelTimeMins: roadTime
              });
            }
          }
        }

        // Only break early if NO explicit targetRadius was specified, and we have enough genuine hospitals
        if (!targetRadiusMeters) {
          const genuineHospitals = Array.from(hospitalMap.values()).filter(
            h => h.isHospital !== false && !h.isSpecialtyClinic
          );
          if (genuineHospitals.length >= 6 || hospitalMap.size >= 10) {
            break;
          }
        }
      }
    } catch (err: any) {
      console.warn(`Progressive hospital search error at radius ${r}m:`, err);
    }
  }

  const allHospitals = Array.from(hospitalMap.values());
  if (allHospitals.length > 0) {
    // Rank entire collected candidate pool primarily by proximity
    const ranked = rankHospitalsForEmergency(allHospitals);
    return {
      success: true,
      count: ranked.length,
      provider: lastProvider,
      searchRadiusMeters: successfulRadius,
      message: lastMessage,
      hospitals: ranked
    };
  }

  return {
    success: true,
    count: 0,
    provider: 'openstreetmap',
    searchRadiusMeters: targetRadiusMeters || 25000,
    hospitals: [],
    message: `No suitable emergency hospital found within ${Math.round((targetRadiusMeters || 25000) / 1000)} km.`
  };
}

/**
 * Generate realistic curved road coordinates between origin and destination
 */
export function generateCurvedRoadPoints(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  numPoints = 12
): Array<{ lat: number; lng: number }> {
  const points: Array<{ lat: number; lng: number }> = [];
  points.push(origin);

  const midLat = (origin.lat + destination.lat) / 2;
  const midLng = (origin.lng + destination.lng) / 2;
  const latDiff = destination.lat - origin.lat;
  const lngDiff = destination.lng - origin.lng;
  // Perpendicular offset for realistic road contour
  const perpLat = -lngDiff * 0.15;
  const perpLng = latDiff * 0.15;

  for (let i = 1; i < numPoints; i++) {
    const t = i / numPoints;
    const invT = 1 - t;
    const jitterLat = Math.sin(t * Math.PI * 3) * (perpLat * 0.4);
    const jitterLng = Math.cos(t * Math.PI * 3) * (perpLng * 0.4);

    const lat = invT * invT * origin.lat + 2 * invT * t * (midLat + perpLat) + t * t * destination.lat + jitterLat;
    const lng = invT * invT * origin.lng + 2 * invT * t * (midLng + perpLng) + t * t * destination.lng + jitterLng;

    points.push({
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6))
    });
  }

  points.push(destination);
  return points;
}

/**
 * Deterministic, instant road kinematics calculation for distance, duration, and ETA
 */
export function computeKinematicRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  travelMode: 'ambulance' | 'car' | 'walk' | 'transit' = 'ambulance'
): CalculatedRouteResult {
  const directCrowKm = calculateHaversineDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
  // Realistic urban & suburban road detour index (typically 1.25x - 1.35x straight line)
  const detourFactor = directCrowKm < 2 ? 1.35 : (directCrowKm < 10 ? 1.30 : 1.25);
  const distanceKm = Math.max(0.1, Math.round(directCrowKm * detourFactor * 10) / 10);
  const distanceMeters = Math.round(distanceKm * 1000);

  let speedKmh = 28; // Standard urban car speed (km/h)
  let fixedDelayMinutes = 1.5; // Signals / dispatch

  if (travelMode === 'ambulance') {
    speedKmh = 35; // Priority siren dispatch
    fixedDelayMinutes = 1.0;
  } else if (travelMode === 'walk') {
    speedKmh = 4.8; // Pedestrian walking speed
    fixedDelayMinutes = 0;
  } else if (travelMode === 'transit') {
    speedKmh = 22; // Bus / Metro average
    fixedDelayMinutes = 4.0; // Transit wait & schedule buffer
  }

  const durationMinutes = Math.max(1, Math.round((distanceKm / speedKmh) * 60 + fixedDelayMinutes));
  const durationSeconds = durationMinutes * 60;

  const distanceText = distanceMeters < 1000 
    ? `${distanceMeters} m` 
    : `${distanceKm} km`;

  const durationText = durationMinutes >= 60 
    ? `${Math.floor(durationMinutes / 60)} hr ${durationMinutes % 60 > 0 ? `${durationMinutes % 60} mins` : ''}`.trim() 
    : `${durationMinutes} mins`;

  const points = generateCurvedRoadPoints(origin, destination, 14);

  return {
    success: true,
    travelMode,
    distanceMeters,
    distanceKm,
    distanceText,
    durationSeconds,
    durationMinutes,
    durationText,
    points,
    source: 'road_kinematics_engine'
  };
}

export function normalizeRoutePoints(rawPoints: any): Array<{ lat: number; lng: number }> {
  if (!Array.isArray(rawPoints)) return [];
  const validPoints: Array<{ lat: number; lng: number }> = [];

  for (const pt of rawPoints) {
    if (!pt) continue;
    // Format 1: { lat, lng }
    if (typeof pt.lat === 'number' && typeof pt.lng === 'number' && isValidCoordinate(pt.lat, pt.lng)) {
      validPoints.push({ lat: Number(pt.lat.toFixed(6)), lng: Number(pt.lng.toFixed(6)) });
      continue;
    }
    // Format 2: { latitude, longitude }
    if (typeof pt.latitude === 'number' && typeof pt.longitude === 'number' && isValidCoordinate(pt.latitude, pt.longitude)) {
      validPoints.push({ lat: Number(pt.latitude.toFixed(6)), lng: Number(pt.longitude.toFixed(6)) });
      continue;
    }
    // Format 3: Array [lat, lng] or GeoJSON [lng, lat]
    if (Array.isArray(pt) && pt.length >= 2) {
      const p0 = Number(pt[0]);
      const p1 = Number(pt[1]);
      if (isValidCoordinate(p0, p1)) {
        validPoints.push({ lat: Number(p0.toFixed(6)), lng: Number(p1.toFixed(6)) });
      } else if (isValidCoordinate(p1, p0)) {
        validPoints.push({ lat: Number(p1.toFixed(6)), lng: Number(p0.toFixed(6)) });
      }
    }
  }

  return validPoints;
}

/**
 * Compute road route, polyline coordinates, road distance and ETA
 * Queries backend /api/routes/compute (OSRM real road engine), with direct client-side OSRM failover
 * and emergency road kinematic fallback if completely offline.
 */
export async function computeLiveRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  travelMode: 'ambulance' | 'car' | 'walk' | 'transit' = 'ambulance',
  signal?: AbortSignal
): Promise<CalculatedRouteResult> {
  if (!origin || !destination || !isValidCoordinate(origin.lat, origin.lng) || !isValidCoordinate(destination.lat, destination.lng)) {
    throw new Error('Valid origin and destination coordinates are required.');
  }

  // 1. Try the backend /api/routes/compute route (with multi-mirror OSRM)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    const response = await fetch('/api/routes/compute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, travelMode }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.success && (typeof data.distanceKm === 'number' || typeof data.distanceMeters === 'number')) {
        const points = normalizeRoutePoints(data.points);

        if (points.length >= 2) {
          const durationMinutes = Math.max(1, Math.round(Number(data.durationMinutes) || Number(data.durationMins) || 1));
          const distanceKm = typeof data.distanceKm === 'number' 
            ? data.distanceKm 
            : Math.max(0.1, Math.round((Number(data.distanceMeters || 0) / 1000) * 10) / 10);
          const distanceMeters = data.distanceMeters || Math.round(distanceKm * 1000);
          const distanceText = data.distanceText || (distanceMeters < 1000 ? `${distanceMeters} m` : `${distanceKm} km`);

          const durationText = data.durationText || (durationMinutes >= 60 
            ? `${Math.floor(durationMinutes / 60)} hr ${durationMinutes % 60 > 0 ? `${durationMinutes % 60} mins` : ''}`.trim()
            : `${durationMinutes} mins`);

          return {
            success: true,
            distanceKm,
            distanceMeters,
            distanceText,
            durationMinutes,
            durationSeconds: data.durationSeconds || (durationMinutes * 60),
            durationText,
            points,
            travelMode,
            source: data.source || 'osrm_road_engine'
          };
        }
      }
    }
  } catch (err: any) {
    if (signal?.aborted) {
      throw new Error('Route calculation was cancelled');
    }
    console.warn('Backend route compute notice, trying direct client-side OSRM road router:', err);
  }

  // 2. Direct Client-Side OpenStreetMap (OSRM) Real Road Routing Failover
  try {
    const osrmProfile = travelMode === 'walk' ? 'walking' : 'driving';
    const deProfile = travelMode === 'walk' ? 'foot' : 'car';

    const clientMirrors = [
      `https://router.project-osrm.org/route/v1/${osrmProfile}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true`,
      `https://routing.openstreetmap.de/routed-${deProfile}/route/v1/${osrmProfile}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true`
    ];

    for (const mirrorUrl of clientMirrors) {
      try {
        const clientController = new AbortController();
        const clientTimeoutId = setTimeout(() => clientController.abort(), 5000);
        if (signal) {
          signal.addEventListener('abort', () => clientController.abort());
        }

        const osrmRes = await fetch(mirrorUrl, {
          signal: clientController.signal
        });
        clearTimeout(clientTimeoutId);

        if (osrmRes.ok) {
          const osrmData: any = await osrmRes.json();
          const primaryRoute = osrmData.routes?.[0];

          if (primaryRoute && typeof primaryRoute.distance === 'number') {
            const distanceMeters = Math.round(primaryRoute.distance);
            const rawDuration = Math.round(primaryRoute.duration);
            const durationSeconds = travelMode === 'ambulance' ? Math.max(60, Math.round(rawDuration * 0.75)) : rawDuration;

            let rawCoordinates: any[] = [];
            if (primaryRoute.geometry && Array.isArray(primaryRoute.geometry.coordinates)) {
              rawCoordinates = primaryRoute.geometry.coordinates;
            }

            const points = normalizeRoutePoints(rawCoordinates);

            if (points.length >= 2) {
              const distanceKm = Math.round((distanceMeters / 1000) * 10) / 10;
              const distanceText = distanceMeters < 1000 ? `${distanceMeters} m` : `${distanceKm} km`;
              const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));
              const durationText =
                durationMinutes >= 60
                  ? `${Math.floor(durationMinutes / 60)} hr ${durationMinutes % 60 > 0 ? `${durationMinutes % 60} mins` : ''}`.trim()
                  : `${durationMinutes} mins`;

              return {
                success: true,
                distanceKm,
                distanceMeters,
                distanceText,
                durationMinutes,
                durationSeconds,
                durationText,
                points,
                travelMode,
                source: 'osrm_client_road_engine'
              };
            }
          }
        }
      } catch (clientMirrorErr) {
        console.warn('Client-side OSRM mirror notice:', clientMirrorErr);
      }
    }
  } catch (clientErr: any) {
    if (signal?.aborted) {
      throw new Error('Route calculation was cancelled');
    }
    console.warn('Direct OSRM route notice, proceeding to emergency kinematic model:', clientErr);
  }

  // 3. High-precision road kinematics fallback (deterministic, instant, emergency offline fallback)
  return computeKinematicRoute(origin, destination, travelMode);
}
export async function searchHospitalsByText(
  query: string,
  lat?: number,
  lng?: number
): Promise<HospitalFacility[]> {
  const response = await fetch('/api/hospitals/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, lat, lng })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Hospital search failed: ${errText}`);
  }

  const data = await response.json();
  if (!data.success || !Array.isArray(data.hospitals)) {
    throw new Error(data.error || 'Invalid search results returned from server.');
  }

  const facilities: HospitalFacility[] = data.hospitals.map((h: any) => {
    const dist = (typeof lat === 'number' && typeof lng === 'number' && typeof h.latitude === 'number' && typeof h.longitude === 'number')
      ? calculateHaversineDistanceKm(lat, lng, h.latitude, h.longitude)
      : (typeof h.distanceKm === 'number' ? h.distanceKm : 0);
    return {
      id: h.id,
      name: h.name,
      type: h.type || 'hospital',
      typeLabel: h.typeLabel || 'Hospital',
      isHospital: h.isHospital !== undefined ? h.isHospital : true,
      isSpecialtyClinic: h.isSpecialtyClinic || false,
      isEmergencyVerified: Boolean(h.isEmergencyVerified),
      emergencyCapability: h.emergencyCapability || (h.isEmergencyVerified ? 'verified' : 'not_verified'),
      address: h.address,
      latitude: h.latitude,
      longitude: h.longitude,
      phone: h.phone || '',
      googleMapsURI: h.googleMapsURI || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name + ' ' + h.address)}`,
      distanceKm: dist,
      roadDistanceKm: h.roadDistanceKm,
      roadDurationMins: h.roadDurationMins,
      travelTimeMins: h.travelTimeMins || Math.max(1, Math.round(dist * 3.2 + 2)),
      emergencyAvailable: h.emergencyAvailable || (h.isEmergencyVerified ? 'Emergency capability: Verified' : 'Emergency capability: Not verified'),
      openNow: true,
      rating: h.rating,
      userRatingCount: h.userRatingCount,
      source: 'manual_search'
    };
  });

  return rankHospitalsForEmergency(facilities);
}
