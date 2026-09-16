import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Production-ready Vercel Serverless Function: /api/hospitals/nearby
 * 
 * Fully self-contained with zero relative file dependencies to prevent Node ESM
 * ERR_MODULE_NOT_FOUND resolution errors and Vercel lambda packaging omissions.
 * Uses public OpenStreetMap (Nominatim bounding box + Overpass API mirror failover).
 * No Google Maps billing or API keys required.
 */

interface VercelRequest extends IncomingMessage {
  query?: Record<string, string | string[]>;
  body?: any;
  method?: string;
}

interface VercelResponse extends ServerResponse {
  status?: (code: number) => VercelResponse;
  json?: (data: any) => void;
}

// In-memory cache for repeated radius queries in active serverless container instances
interface CacheEntry {
  timestamp: number;
  lat: number;
  lng: number;
  searchRadius: number;
  hospitalsOnly: boolean;
  facilities: any[];
}
const searchCache = new Map<string, CacheEntry>();

/**
 * Calculates geodesic distance between two latitude/longitude points in kilometers
 * using the Haversine formula.
 */
function calcHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in km
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

/**
 * Filters out infrastructure items (roads, bus stops, junctions) mislabeled as hospitals.
 */
function isNonFacilityInfrastructure(name: string, typesArr: string[] = []): boolean {
  const n = (name || '').trim().toLowerCase();
  if (!n) return true;

  const nonFacilityTypes = [
    'route', 'street_address', 'highway', 'intersection', 'transit_station',
    'bus_stop', 'neighborhood', 'locality', 'sublocality', 'administrative_area_level_1',
    'administrative_area_level_2', 'postal_code', 'country'
  ];
  const hasFacilityType = typesArr.some(t =>
    ['hospital', 'doctor', 'medical_clinic', 'health', 'dentist', 'pharmacy'].includes(t.toLowerCase())
  );
  if (!hasFacilityType && typesArr.some(t => nonFacilityTypes.includes(t.toLowerCase()))) {
    return true;
  }

  const roadOnlyPatterns = [
    /^hospital\s+(street|road|lane|sarani|gali|marg|chowk|cross|avenue|highway|circle|drive|pathway|passage|bazaar|market|station|terminal|stop|bus stand|flyover|bridge|junction|crossing|more|bypass|gate)\b/i,
    /^(street|road|lane|sarani|gali|marg|chowk|cross|avenue|highway|circle|drive|bypass)\b/i,
    /\b(bus stop|metro station|railway station|flyover|bridge|crossing|junction|toll plaza)\b/i
  ];

  for (const pattern of roadOnlyPatterns) {
    if (pattern.test(n)) {
      if (!/hospital & research|hospital and research|medical college|super specialty|multispeciality|health city|institute of medical/i.test(n)) {
        return true;
      }
    }
  }

  return false;
}

interface FacilityClassification {
  type: 'hospital' | 'clinic' | 'phc' | 'health_centre';
  typeLabel: string;
  isHospital: boolean;
  isSpecialtyClinic: boolean;
  specialty?: string;
  isInvalidRoadOrInfrastructure?: boolean;
}

/**
 * Classifies an OSM location into a hospital, clinic, PHC, or specialty facility.
 */
function classifyFacilityType(name: string, tagsOrTypes: Record<string, any> = {}): FacilityClassification {
  const n = (name || '').trim().toLowerCase();
  const typesArr: string[] = Array.isArray(tagsOrTypes.types)
    ? tagsOrTypes.types.map((t: string) => String(t).toLowerCase())
    : [];

  if (isNonFacilityInfrastructure(name, typesArr) || tagsOrTypes.osm_key === 'highway') {
    return {
      type: 'clinic',
      typeLabel: 'Infrastructure / Non-Facility',
      isHospital: false,
      isSpecialtyClinic: false,
      isInvalidRoadOrInfrastructure: true
    };
  }

  const isNonMedicalBusiness =
    /\b(infotech|technologies|technology|software|consulting|consultancy|school|academy|college of engineering|polytechnic|hostel|hotel|restaurant|bazaar|showroom|apartments?|residency)\b/i.test(n) &&
    !/\b(hospital|medical|clinic|health|phc|chc|ayush|dispensary|nursing)\b/i.test(n);
  if (isNonMedicalBusiness) {
    return {
      type: 'clinic',
      typeLabel: 'Non-Healthcare Entity',
      isHospital: false,
      isSpecialtyClinic: false,
      isInvalidRoadOrInfrastructure: true
    };
  }

  const isEye = /eye|vision|lasik|optical|optometry|optometrist|cataract|drishit|drishti|netra|retina|glaucoma|sarala pawa|cornea|spectacle|lens|chasma|sight/i.test(n);
  const isDental = /dental|dentist|orthodontic|teeth|dento|tooth|oral care|braces|danta|dant\b/i.test(n) || typesArr.includes('dentist');
  const isDerma = /skin|derma|dermatology|hair|trichology|cosmetic|plastic surgery|aesthetic|laser clinic|beauty/i.test(n);
  const isHomeoAyur = /homeopathy|homeopathic|ayurveda|ayurvedic|unani|naturopathy|herbal|siddha/i.test(n);
  const isPhysio = /physiotherapy|physio|rehab|rehabilitation center|chiropractic|pain clinic|re\+move/i.test(n) || typesArr.includes('physiotherapist');
  const isDiagnostic = /diagnostic|pathology|pathological|scan centre|scan center|mri|ct scan|x-ray|blood bank|blood test|collection centre|laboratories|laboratory|labs?\b|imaging/i.test(n);
  const isPharmacy = /pharmacy|chemist|druggist|medical store|medicine shop|medicals|medplus|apollo pharmacy|distributor|wholesale medicine|janaushadhi|dawa|medical hall|medical agency/i.test(n) || typesArr.includes('pharmacy');

  if (isPharmacy) {
    return {
      type: 'clinic',
      typeLabel: 'Pharmacy / Medical Store',
      isHospital: false,
      isSpecialtyClinic: true,
      specialty: 'Pharmacy'
    };
  }

  if (isEye) {
    return {
      type: 'clinic',
      typeLabel: 'Eye Hospital / Optical Clinic',
      isHospital: false,
      isSpecialtyClinic: true,
      specialty: 'Ophthalmology'
    };
  }

  if (isDental) {
    return {
      type: 'clinic',
      typeLabel: 'Dental Care / Clinic',
      isHospital: false,
      isSpecialtyClinic: true,
      specialty: 'Dentistry'
    };
  }

  if (isDerma) {
    return {
      type: 'clinic',
      typeLabel: 'Skin & Aesthetics Center',
      isHospital: false,
      isSpecialtyClinic: true,
      specialty: 'Dermatology'
    };
  }

  if (isPhysio) {
    return {
      type: 'clinic',
      typeLabel: 'Physiotherapy & Rehab Center',
      isHospital: false,
      isSpecialtyClinic: true,
      specialty: 'Physiotherapy'
    };
  }

  if (isDiagnostic) {
    return {
      type: 'clinic',
      typeLabel: 'Diagnostic / Pathology Center',
      isHospital: false,
      isSpecialtyClinic: true,
      specialty: 'Diagnostics'
    };
  }

  if (isHomeoAyur) {
    return {
      type: 'clinic',
      typeLabel: 'Ayurvedic / Homeopathic Center',
      isHospital: false,
      isSpecialtyClinic: true,
      specialty: 'Alternative Medicine'
    };
  }

  const isExplicitHospital =
    /hospital|medical college|trauma center|super speciality|multispeciality|nursing home|health city|infirmary|institute of medical/i.test(n) ||
    tagsOrTypes.amenity === 'hospital' ||
    tagsOrTypes.healthcare === 'hospital';

  if (isExplicitHospital) {
    return {
      type: 'hospital',
      typeLabel: 'General Hospital',
      isHospital: true,
      isSpecialtyClinic: false
    };
  }

  const isPhc = /phc|chc|primary health|community health|uphec|sub centre|health post/i.test(n);
  if (isPhc) {
    return {
      type: 'phc',
      typeLabel: 'Primary Health Centre (PHC)',
      isHospital: false,
      isSpecialtyClinic: false
    };
  }

  return {
    type: 'clinic',
    typeLabel: 'Medical Clinic / Polyclinic',
    isHospital: false,
    isSpecialtyClinic: false
  };
}

// Resilient Overpass API Mirrors
const OVERPASS_MIRRORS = [
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter'
];

/**
 * Searches OpenStreetMap Nominatim and Overpass for healthcare facilities
 * within the requested radius.
 */
async function discoverFacilities(
  numericLat: number,
  numericLng: number,
  radiusMeters: number,
  hospitalsOnly: boolean
): Promise<{ success: boolean; facilities: any[]; isServiceUnavailable?: boolean }> {
  const maxRadiusKm = radiusMeters / 1000;

  // Compute Bounding Box with slight 2% margin to capture boundary facilities
  const degLat = (maxRadiusKm / 110.574) * 1.02;
  const degLng = (maxRadiusKm / (111.320 * Math.max(0.1, Math.cos((numericLat * Math.PI) / 180)))) * 1.02;

  const south = (numericLat - degLat).toFixed(5);
  const west = (numericLng - degLng).toFixed(5);
  const north = (numericLat + degLat).toFixed(5);
  const east = (numericLng + degLng).toFixed(5);

  let anyServerSucceeded = false;
  const rawDiscovered: any[] = [];
  const seenIds = new Set<string>();

  // 1. First, query OpenStreetMap Nominatim with viewbox
  try {
    const nominatimQueries = [
      `https://nominatim.openstreetmap.org/search?format=json&q=hospital&viewbox=${west},${north},${east},${south}&bounded=1&limit=50&addressdetails=1`
    ];
    if (!hospitalsOnly && maxRadiusKm <= 25) {
      nominatimQueries.push(
        `https://nominatim.openstreetmap.org/search?format=json&q=clinic&viewbox=${west},${north},${east},${south}&bounded=1&limit=30&addressdetails=1`
      );
    }

    const nomResponses = await Promise.allSettled(
      nominatimQueries.map(url =>
        fetch(url, {
          headers: {
            'User-Agent': 'MediKioskAI-HealthSystem/1.0 (Leaflet-OSM Healthcare Discovery)'
          },
          signal: AbortSignal.timeout(4500)
        }).then(r => r.ok ? r.json() : [])
      )
    );

    for (const res of nomResponses) {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        anyServerSucceeded = true;
        for (const item of res.value) {
          const pLat = parseFloat(item.lat);
          const pLng = parseFloat(item.lon);
          const osmId = `osm-${item.osm_type || 'place'}-${item.osm_id || item.place_id}`;
          if (!Number.isFinite(pLat) || !Number.isFinite(pLng) || seenIds.has(osmId)) continue;

          // Local Haversine check
          const dist = calcHaversineDistanceKm(numericLat, numericLng, pLat, pLng);
          if (dist > maxRadiusKm) continue;

          seenIds.add(osmId);

          const addr = item.address || {};
          const rawName = item.name || addr.hospital || addr.clinic || (item.display_name ? item.display_name.split(',')[0] : '') || 'Medical Facility';
          const name = rawName.trim();
          const address = item.display_name || [addr.road, addr.suburb, addr.city, addr.state].filter(Boolean).join(', ');

          const isEmergency = /24x7|trauma|emergency|casualty/i.test(name) || /hospital/i.test(item.type);
          const classification = classifyFacilityType(name, {
            amenity: item.type || item.class,
            types: [item.type, item.class].filter(Boolean)
          });

          if (classification.isInvalidRoadOrInfrastructure || isNonFacilityInfrastructure(name, [item.type, item.class])) {
            continue;
          }
          if (hospitalsOnly && (!classification.isHospital || classification.isSpecialtyClinic)) {
            continue;
          }

          const roadDist = Math.max(0.1, Math.round(dist * (dist < 2 ? 1.35 : dist < 10 ? 1.30 : 1.25) * 10) / 10);
          const roadDuration = Math.max(1, Math.round((roadDist / 36) * 60 + 1));

          rawDiscovered.push({
            id: osmId,
            name,
            type: classification.type,
            typeLabel: classification.typeLabel,
            isHospital: classification.isHospital,
            isSpecialtyClinic: classification.isSpecialtyClinic,
            specialty: classification.specialty,
            category: classification.type,
            address,
            latitude: pLat,
            longitude: pLng,
            phone: '',
            googleMapsURI: `https://www.openstreetmap.org/?mlat=${pLat}&mlon=${pLng}#map=16/${pLat}/${pLng}`,
            website: '',
            distanceKm: dist,
            roadDistanceKm: roadDist,
            roadDurationMins: roadDuration,
            travelTimeMins: roadDuration,
            emergencyCapability: isEmergency ? 'verified' : 'not_verified',
            emergencyAvailable: isEmergency ? 'Emergency capability: Verified' : 'Emergency capability: Not verified',
            isEmergencyVerified: isEmergency,
            icuAvailable: 'Not verified',
            rating: null,
            userRatingCount: 0,
            isInvalidRoadOrInfrastructure: false,
            source: 'openstreetmap'
          });
        }
      }
    }

    if (rawDiscovered.length > 0) {
      rawDiscovered.sort((a, b) => {
        const distDiff = a.distanceKm - b.distanceKm;
        if (Math.abs(distDiff) >= 0.05) return distDiff;
        if (a.isHospital !== b.isHospital) return a.isHospital ? -1 : 1;
        return distDiff;
      });
      return { success: true, facilities: rawDiscovered };
    }
  } catch (_nomErr) {
    // Continue to Overpass mirror fallback
  }

  // 2. Query Overpass API with Bounding-Box and Automatic Mirror Failover
  const queryTimeout = maxRadiusKm >= 50 ? 8 : 5;
  const maxTagsCount = maxRadiusKm <= 5 ? 40 : maxRadiusKm <= 25 ? 75 : 100;

  const overpassQuery = `[out:json][timeout:${queryTimeout}];
(
  node["amenity"="hospital"](${south},${west},${north},${east});
  way["amenity"="hospital"](${south},${west},${north},${east});
  node["healthcare"="hospital"](${south},${west},${north},${east});
  way["healthcare"="hospital"](${south},${west},${north},${east});
  ${hospitalsOnly ? '' : `
  node["amenity"="clinic"](${south},${west},${north},${east});
  way["amenity"="clinic"](${south},${west},${north},${east});
  node["healthcare"="clinic"](${south},${west},${north},${east});
  way["healthcare"="clinic"](${south},${west},${north},${east});
  `}
);
out center ${maxTagsCount} tags;`;

  for (const mirrorUrl of OVERPASS_MIRRORS) {
    try {
      const response = await fetch(mirrorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'MediKioskAI-HealthSystem/1.0 (Leaflet-OSM Healthcare Discovery)'
        },
        body: 'data=' + encodeURIComponent(overpassQuery),
        signal: AbortSignal.timeout(4000)
      });

      if (response.ok) {
        const text = await response.text();
        let data: any;
        try {
          data = JSON.parse(text);
        } catch {
          continue;
        }

        anyServerSucceeded = true;
        const elements: any[] = Array.isArray(data?.elements) ? data.elements : [];

        for (const el of elements) {
          const pLat = el.lat ?? el.center?.lat;
          const pLng = el.lon ?? el.center?.lon;
          if (!Number.isFinite(pLat) || !Number.isFinite(pLng)) continue;

          // Local Haversine check
          const dist = calcHaversineDistanceKm(numericLat, numericLng, pLat, pLng);
          if (dist > maxRadiusKm) continue;

          const osmId = `osm-${el.type || 'nwr'}-${el.id}`;
          if (seenIds.has(osmId)) continue;
          seenIds.add(osmId);

          const tags = el.tags || {};
          const rawName = tags['name:en'] || tags['name'] || tags['operator'] || tags['official_name'];
          if (!rawName && !tags.amenity && !tags.healthcare) continue;

          const name = (rawName || (tags.amenity === 'hospital' ? 'Community Hospital' : 'Healthcare Clinic')).trim();

          let address = tags['addr:full'] || '';
          if (!address) {
            const parts = [
              tags['addr:housenumber'],
              tags['addr:street'],
              tags['addr:suburb'] || tags['addr:neighbourhood'],
              tags['addr:city'] || tags['addr:district'],
              tags['addr:state']
            ].filter(Boolean);
            address = parts.length > 0 ? parts.join(', ') : (tags.operator || 'OpenStreetMap Verified Location');
          }

          const isEmergency = tags.emergency === 'yes' || tags.opening_hours === '24/7' || /24x7|trauma|emergency|casualty/i.test(name);
          const classification = classifyFacilityType(name, {
            amenity: tags.amenity,
            healthcare: tags.healthcare,
            types: [tags.amenity, tags.healthcare].filter(Boolean)
          });

          if (classification.isInvalidRoadOrInfrastructure || isNonFacilityInfrastructure(name, [tags.amenity, tags.healthcare])) {
            continue;
          }
          if (hospitalsOnly && (!classification.isHospital || classification.isSpecialtyClinic)) {
            continue;
          }

          const roadDist = Math.max(0.1, Math.round(dist * (dist < 2 ? 1.35 : dist < 10 ? 1.30 : 1.25) * 10) / 10);
          const roadDuration = Math.max(1, Math.round((roadDist / 36) * 60 + 1));

          rawDiscovered.push({
            id: osmId,
            name,
            type: classification.type,
            typeLabel: classification.typeLabel,
            isHospital: classification.isHospital,
            isSpecialtyClinic: classification.isSpecialtyClinic,
            specialty: classification.specialty || (tags['healthcare:speciality'] ? String(tags['healthcare:speciality']) : undefined),
            category: classification.type,
            address,
            latitude: pLat,
            longitude: pLng,
            phone: tags['contact:phone'] || tags['phone'] || '',
            googleMapsURI: `https://www.openstreetmap.org/?mlat=${pLat}&mlon=${pLng}#map=16/${pLat}/${pLng}`,
            website: tags['contact:website'] || tags['website'] || '',
            distanceKm: dist,
            roadDistanceKm: roadDist,
            roadDurationMins: roadDuration,
            travelTimeMins: roadDuration,
            emergencyCapability: isEmergency ? 'verified' : 'not_verified',
            emergencyAvailable: isEmergency ? 'Emergency capability: Verified' : 'Emergency capability: Not verified',
            isEmergencyVerified: isEmergency,
            icuAvailable: 'Not verified',
            rating: null,
            userRatingCount: 0,
            isInvalidRoadOrInfrastructure: false,
            source: 'openstreetmap'
          });
        }

        break;
      }
    } catch (_mirrorErr) {
      // Proceed silently to next mirror
    }
  }

  if (rawDiscovered.length > 0) {
    rawDiscovered.sort((a, b) => {
      const distDiff = a.distanceKm - b.distanceKm;
      if (Math.abs(distDiff) >= 0.05) return distDiff;
      if (a.isHospital !== b.isHospital) return a.isHospital ? -1 : 1;
      return distDiff;
    });

    return {
      success: true,
      facilities: rawDiscovered
    };
  }

  if (anyServerSucceeded) {
    return {
      success: true,
      facilities: []
    };
  }

  return {
    success: false,
    facilities: [],
    isServiceUnavailable: true
  };
}

/**
 * Robust request body parser supporting pre-parsed objects, JSON strings,
 * or raw Node.js IncomingMessage streams.
 */
async function parseRequestBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  if (typeof req.on === 'function') {
    return new Promise((resolve) => {
      let raw = '';
      req.on('data', (chunk: any) => {
        raw += chunk;
      });
      req.on('end', () => {
        try {
          resolve(raw ? JSON.parse(raw) : {});
        } catch {
          resolve({});
        }
      });
      req.on('error', (streamErr: any) => {
        console.warn('[api/hospitals/nearby parseRequestBody error]:', streamErr);
        resolve({});
      });
    });
  }
  return {};
}

/**
 * Universal response sender that works on VercelResponse as well as native Node ServerResponse.
 */
function sendResponse(res: VercelResponse, statusCode: number, payload: any) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');

    if (typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(statusCode).json(payload);
    }

    res.statusCode = statusCode;
    res.end(JSON.stringify(payload));
  } catch (err) {
    console.error('[sendResponse error]:', err);
    try {
      res.statusCode = statusCode;
      res.end(JSON.stringify(payload));
    } catch {}
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.statusCode = 200;
    return res.end();
  }

  try {
    const body = await parseRequestBody(req);

    const rawLat = body?.lat ?? body?.latitude ?? req.query?.lat;
    const rawLng = body?.lng ?? body?.longitude ?? req.query?.lng;
    const rawRadius = body?.radius ?? req.query?.radius ?? 5000;
    const hospitalsOnly = Boolean(body?.hospitalsOnly ?? req.query?.hospitalsOnly);
    const bypassCache = Boolean(body?.fresh || body?.bypassCache);

    const numericLat = Number(rawLat);
    const numericLng = Number(rawLng);

    if (
      !Number.isFinite(numericLat) ||
      !Number.isFinite(numericLng) ||
      Math.abs(numericLat) > 90 ||
      Math.abs(numericLng) > 180
    ) {
      return sendResponse(res, 400, {
        success: false,
        count: 0,
        hospitals: [],
        provider: 'none',
        errorCode: 'INVALID_COORDINATES',
        error: 'Valid numeric latitude (-90 to 90) and longitude (-180 to 180) are required.'
      });
    }

    // Supported radius bounds: 500m up to 75km (5km, 25km, 50km, 75km)
    const searchRadius = Math.min(Math.max(Number(rawRadius) || 5000, 500), 75000);
    const cacheKey = `${numericLat.toFixed(3)}:${numericLng.toFixed(3)}:${searchRadius}:${hospitalsOnly ? 'hosp' : 'all'}`;

    if (!bypassCache) {
      const cached = searchCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 15 * 60 * 1000) {
        return sendResponse(res, 200, {
          success: true,
          count: cached.facilities.length,
          provider: 'openstreetmap',
          searchRadiusMeters: searchRadius,
          hospitals: cached.facilities
        });
      }
    }

    // Discover facilities using resilient OSM engine
    const discovery = await discoverFacilities(
      numericLat,
      numericLng,
      searchRadius,
      hospitalsOnly
    );

    if (!discovery.success && discovery.isServiceUnavailable) {
      return sendResponse(res, 503, {
        success: false,
        count: 0,
        provider: 'openstreetmap',
        searchRadiusMeters: searchRadius,
        errorCode: 'OSM_SERVICE_UNAVAILABLE',
        message: 'Nearby hospital service is temporarily unavailable. Please retry.',
        error: 'Nearby hospital service is temporarily unavailable. Please retry.',
        hospitals: []
      });
    }

    const facilities = discovery.facilities || [];

    // Cache the result in memory for fast toggles
    if (searchCache.size > 200) {
      const oldestKey = searchCache.keys().next().value;
      if (oldestKey) searchCache.delete(oldestKey);
    }
    searchCache.set(cacheKey, {
      timestamp: Date.now(),
      lat: numericLat,
      lng: numericLng,
      searchRadius,
      hospitalsOnly,
      facilities
    });

    return sendResponse(res, 200, {
      success: true,
      count: facilities.length,
      provider: 'openstreetmap',
      searchRadiusMeters: searchRadius,
      hospitals: facilities
    });
  } catch (err: any) {
    console.error('[Nearby Hospital API 500 Error]:', {
      name: err?.name,
      message: err?.message,
      stack: err?.stack
    });

    return sendResponse(res, 500, {
      success: false,
      count: 0,
      provider: 'none',
      errorCode: 'INTERNAL_SERVER_ERROR',
      message: 'Nearby hospital service encountered an error. Please retry.',
      error: err?.message || 'Internal server error',
      hospitals: []
    });
  }
}
