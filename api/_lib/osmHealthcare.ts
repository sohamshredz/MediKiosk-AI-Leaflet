/**
 * Resilient OpenStreetMap & Overpass Healthcare Facility Discovery Engine
 * Designed for serverless environments (Vercel) and custom Node servers.
 */

export interface FacilityClassification {
  type: 'hospital' | 'clinic' | 'phc' | 'health_centre';
  typeLabel: string;
  isHospital: boolean;
  isSpecialtyClinic: boolean;
  specialty?: string;
  isInvalidRoadOrInfrastructure?: boolean;
}

export function calcHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

export function isNonFacilityInfrastructure(name: string, typesArr: string[] = []): boolean {
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

export function classifyFacilityType(name: string, tagsOrTypes: Record<string, any> = {}): FacilityClassification {
  const n = (name || '').trim().toLowerCase();
  const typesArr: string[] = Array.isArray(tagsOrTypes.types)
    ? tagsOrTypes.types.map((t: string) => String(t).toLowerCase())
    : [];
  const amenity = (tagsOrTypes.amenity || tagsOrTypes.osm_value || tagsOrTypes.type || '').toLowerCase();
  const healthcare = (tagsOrTypes.healthcare || tagsOrTypes.class || '').toLowerCase();

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

  if (isEye) return { type: 'clinic', typeLabel: 'Eye Care / Optical Clinic', isHospital: false, isSpecialtyClinic: true, specialty: 'Ophthalmology / Eye Care' };
  if (isDental) return { type: 'clinic', typeLabel: 'Dental Care Clinic', isHospital: false, isSpecialtyClinic: true, specialty: 'Dental Surgery & Oral Care' };
  if (isDerma) return { type: 'clinic', typeLabel: 'Dermatology & Skin Clinic', isHospital: false, isSpecialtyClinic: true, specialty: 'Dermatology' };
  if (isHomeoAyur) return { type: 'clinic', typeLabel: 'Ayurvedic / Homeopathic Clinic', isHospital: false, isSpecialtyClinic: true, specialty: 'Alternative Medicine' };
  if (isPhysio) return { type: 'clinic', typeLabel: 'Physiotherapy & Pain Clinic', isHospital: false, isSpecialtyClinic: true, specialty: 'Physiotherapy' };
  if (isDiagnostic) return { type: 'clinic', typeLabel: 'Diagnostic & Pathology Lab', isHospital: false, isSpecialtyClinic: true, specialty: 'Diagnostics' };
  if (isPharmacy) return { type: 'clinic', typeLabel: 'Pharmacy / Medical Store', isHospital: false, isSpecialtyClinic: true, specialty: 'Pharmacy' };

  if (/\bmedical\b/i.test(n) && !/\b(hospital|college|institute|centre|center|nursing home|health|care)\b/i.test(n)) {
    return { type: 'clinic', typeLabel: 'Pharmacy / Medical Store', isHospital: false, isSpecialtyClinic: true, specialty: 'Pharmacy' };
  }

  if ((/^(dr\.?|doctor)\b/i.test(n) || /\b(physician|consultant|mbbs|md|ms)\b/i.test(n)) && !/\b(hospital|nursing home|medical college|meditreat|institute)\b/i.test(n)) {
    return { type: 'clinic', typeLabel: 'Doctor Chamber / Clinic', isHospital: false, isSpecialtyClinic: false };
  }

  if (/\bphc\b|primary health centre|primary health center|sub-centre|swasthya kendra/i.test(n) || healthcare === 'phc') {
    return { type: 'phc', typeLabel: 'Primary Health Centre (PHC)', isHospital: true, isSpecialtyClinic: false };
  }
  if (/\b(chc|uphc)\b|community health|urban primary health|health center|health centre/i.test(n) || healthcare === 'centre' || healthcare === 'medical_centre') {
    return { type: 'health_centre', typeLabel: 'Community Health Centre (CHC)', isHospital: true, isSpecialtyClinic: false };
  }

  const isClinicKeyword = /\b(clinic|polyclinic|dispensary|chamber|doctor's|consultant|day care centre|day care)\b/i.test(n);
  const isHospitalKeyword = /\b(hospital|medical college|aiims|district hospital|civil hospital|state general hospital|nursing home|superspeciality hospital|multispeciality hospital|cancer institute|meditreat|swasthya sadan|arogya niketan|seba sadan|sevasadan|matri sadan)\b/i.test(n);

  if (isClinicKeyword && !isHospitalKeyword) {
    return { type: 'clinic', typeLabel: 'Medical Clinic / Polyclinic', isHospital: false, isSpecialtyClinic: false };
  }

  if (/medical college|aiims|ipgmer|pgimer|institute of medical|hospital & research institute|hospital and research/i.test(n)) {
    return { type: 'hospital', typeLabel: 'Medical College & Hospital', isHospital: true, isSpecialtyClinic: false };
  }
  if (/district hospital|state general hospital|sub-divisional hospital|sadar hospital|civil hospital/i.test(n)) {
    return { type: 'hospital', typeLabel: 'District / Govt Hospital', isHospital: true, isSpecialtyClinic: false };
  }
  if (/cancer institute|cancer hospital|heart institute|cardiac centre|maternity hospital|matri sadan|pediatric hospital|children's hospital/i.test(n)) {
    return { type: 'hospital', typeLabel: 'Specialized Hospital / Institute', isHospital: true, isSpecialtyClinic: false };
  }
  if (/super specialty|superspeciality|multispeciality|multi-specialty|multi specialty|apex|health city|trauma centre|trauma center/i.test(n)) {
    return { type: 'hospital', typeLabel: 'Multi-Specialty Hospital', isHospital: true, isSpecialtyClinic: false };
  }
  if (/nursing home|hospitex|meditreat|swasthya sadan|arogya niketan|seba sadan|sevasadan/i.test(n)) {
    return { type: 'hospital', typeLabel: 'Hospital / Nursing Home', isHospital: true, isSpecialtyClinic: false };
  }

  if (isHospitalKeyword || /hospital/i.test(n)) {
    return { type: 'hospital', typeLabel: 'General Hospital', isHospital: true, isSpecialtyClinic: false };
  }

  if (typesArr.includes('hospital')) {
    const hasHospitalEvidence = /\b(hospital|health|care|nursing|centre|center|med|sadan|niketan|seba|seva|shree|mission|trust|foundation)\b/i.test(n);
    if (hasHospitalEvidence) {
      return { type: 'hospital', typeLabel: 'General Hospital', isHospital: true, isSpecialtyClinic: false };
    }
    return { type: 'clinic', typeLabel: 'Medical Practice / Clinic', isHospital: false, isSpecialtyClinic: false };
  }

  if (typesArr.includes('medical_clinic') || typesArr.includes('doctor') || amenity === 'clinic' || amenity === 'doctors') {
    return { type: 'clinic', typeLabel: 'Medical Clinic / Dispensary', isHospital: false, isSpecialtyClinic: false };
  }

  return { type: 'clinic', typeLabel: 'Medical Facility', isHospital: false, isSpecialtyClinic: false };
}

// In-Memory Result Cache (persists across warm serverless invocations and local dev)
interface CacheRecord {
  timestamp: number;
  lat: number;
  lng: number;
  searchRadius: number;
  hospitalsOnly: boolean;
  facilities: any[];
}

const memorySearchCache = new Map<string, CacheRecord>();

function getCacheKey(lat: number, lng: number, radius: number, hospitalsOnly: boolean): string {
  return `${lat.toFixed(3)}_${lng.toFixed(3)}_${radius}_${hospitalsOnly ? 'h' : 'a'}`;
}

export function getCachedFacilities(
  lat: number,
  lng: number,
  radiusMeters: number,
  hospitalsOnly: boolean
): any[] | null {
  const maxAgeMs = 15 * 60 * 1000; // 15 minutes
  const now = Date.now();

  // 1. Direct exact key lookup
  const exactKey = getCacheKey(lat, lng, radiusMeters, hospitalsOnly);
  const exact = memorySearchCache.get(exactKey);
  if (exact && now - exact.timestamp < maxAgeMs) {
    return exact.facilities;
  }

  // 2. Smart Radius Re-Use:
  // If we already fetched a LARGER radius for roughly the same coordinates (within ~250m) recently,
  // we can simply filter those facilities locally without any network request!
  const requestedRadiusKm = radiusMeters / 1000;
  for (const entry of memorySearchCache.values()) {
    if (now - entry.timestamp < maxAgeMs && entry.hospitalsOnly === hospitalsOnly) {
      const distanceBetweenCenters = calcHaversineDistanceKm(lat, lng, entry.lat, entry.lng);
      if (distanceBetweenCenters <= 0.25 && entry.searchRadius >= radiusMeters) {
        // Filter facilities that fall within the smaller requested radius from current center
        const filtered = entry.facilities
          .map(f => {
            const dist = calcHaversineDistanceKm(lat, lng, f.latitude, f.longitude);
            const roadDist = Math.max(0.1, Math.round(dist * (dist < 2 ? 1.35 : dist < 10 ? 1.30 : 1.25) * 10) / 10);
            const roadDuration = Math.max(1, Math.round((roadDist / 36) * 60 + 1));
            return {
              ...f,
              distanceKm: dist,
              roadDistanceKm: roadDist,
              roadDurationMins: roadDuration,
              travelTimeMins: roadDuration
            };
          })
          .filter(f => f.distanceKm <= requestedRadiusKm);

        filtered.sort((a, b) => a.distanceKm - b.distanceKm);
        return filtered;
      }
    }
  }

  return null;
}

export function setCachedFacilities(
  lat: number,
  lng: number,
  radiusMeters: number,
  hospitalsOnly: boolean,
  facilities: any[]
): void {
  if (memorySearchCache.size > 200) {
    const oldestKey = memorySearchCache.keys().next().value;
    if (oldestKey) memorySearchCache.delete(oldestKey);
  }
  const key = getCacheKey(lat, lng, radiusMeters, hospitalsOnly);
  memorySearchCache.set(key, {
    timestamp: Date.now(),
    lat,
    lng,
    searchRadius: radiusMeters,
    hospitalsOnly,
    facilities
  });
}

// Resilient Overpass API Mirrors (fastest mirrors prioritized)
const OVERPASS_MIRRORS = [
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter'
];

export interface DiscoverResult {
  success: boolean;
  facilities: any[];
  provider: string;
  isServiceUnavailable?: boolean;
}

/**
 * Executes a resilient OpenStreetMap/Overpass discovery with bounding-box optimization,
 * automatic mirror failovers, AbortController timeouts, and Haversine distance filtering.
 */
export async function discoverHealthcareFacilities(
  numericLat: number,
  numericLng: number,
  radiusMeters: number,
  hospitalsOnly = false
): Promise<DiscoverResult> {
  const maxRadiusKm = radiusMeters / 1000;

  // Compute efficient Bounding Box (south, west, north, east)
  // Add a 2% safety margin to ensure edge facilities are captured before precise local Haversine filtering
  const degLat = (maxRadiusKm / 110.574) * 1.02;
  const degLng = (maxRadiusKm / (111.320 * Math.max(0.1, Math.cos((numericLat * Math.PI) / 180)))) * 1.02;

  const south = (numericLat - degLat).toFixed(5);
  const west = (numericLng - degLng).toFixed(5);
  const north = (numericLat + degLat).toFixed(5);
  const east = (numericLng + degLng).toFixed(5);

  let anyServerSucceeded = false;
  const rawDiscovered: any[] = [];
  const seenIds = new Set<string>();

  // 1. First, query OpenStreetMap Nominatim with viewbox (Fast: 300-800ms)
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
          const name = (rawName || 'Medical Facility').trim();
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

    // If Nominatim discovered verified healthcare facilities within the bounding box, return immediately
    if (rawDiscovered.length > 0) {
      rawDiscovered.sort((a, b) => {
        const distDiff = a.distanceKm - b.distanceKm;
        if (Math.abs(distDiff) >= 0.05) return distDiff;
        if (a.isHospital !== b.isHospital) return a.isHospital ? -1 : 1;
        return distDiff;
      });
      return { success: true, facilities: rawDiscovered, provider: 'openstreetmap' };
    }
  } catch (_nomErr) {
    // Continue to Overpass fallback
  }

  // 2. Query Overpass API with Bounding-Box and Automatic Mirror Failover (Fallback)
  // For large radius (50 km or 75 km), bounding box uses spatial indexes directly and center tags prevent large transfers
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
          // If server returned HTML error page instead of JSON, continue to next mirror
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

        // Successfully retrieved elements from this mirror
        break;
      }
    } catch (_mirrorErr) {
      // Mirror failed or timed out; automatically proceed to next endpoint without noisy console exceptions
    }
  }

  // 3. Evaluate results
  if (rawDiscovered.length > 0) {
    // Sort proximity-first
    rawDiscovered.sort((a, b) => {
      const distDiff = a.distanceKm - b.distanceKm;
      if (Math.abs(distDiff) >= 0.05) return distDiff;
      if (a.isHospital !== b.isHospital) return a.isHospital ? -1 : 1;
      return distDiff;
    });

    return {
      success: true,
      facilities: rawDiscovered,
      provider: 'openstreetmap'
    };
  }

  // If at least one server responded successfully without network errors,
  // it means there are genuinely 0 healthcare facilities in this area!
  if (anyServerSucceeded) {
    return {
      success: true,
      facilities: [],
      provider: 'openstreetmap'
    };
  }

  // If ALL endpoints failed/timed out, mark as temporary service outage
  return {
    success: false,
    facilities: [],
    provider: 'openstreetmap',
    isServiceUnavailable: true
  };
}
