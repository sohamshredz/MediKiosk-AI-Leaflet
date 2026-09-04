import type { IncomingMessage, ServerResponse } from 'http';
function calcHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
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

interface VercelRequest extends IncomingMessage {
  query?: Record<string, string | string[]>;
  body?: any;
  method?: string;
}

interface VercelResponse extends ServerResponse {
  status: (code: number) => VercelResponse;
  json: (data: any) => void;
  setHeader: (name: string, value: string | number | readonly string[]) => this;
  end: (cb?: () => void) => this;
}

const searchCache = new Map<string, { timestamp: number; payload: any }>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const query = (body?.query ?? req.query?.query ?? body?.q ?? req.query?.q ?? '') as string;
    const cleanQuery = typeof query === 'string' ? query.trim() : '';

    if (!cleanQuery) {
      return res.status(400).json({
        success: false,
        error: 'Query string is required.'
      });
    }

    const rawLat = body?.lat ?? req.query?.lat;
    const rawLng = body?.lng ?? req.query?.lng;
    const numericLat = Number.isFinite(Number(rawLat)) ? Number(rawLat) : undefined;
    const numericLng = Number.isFinite(Number(rawLng)) ? Number(rawLng) : undefined;

    const cacheKey = `${cleanQuery.toLowerCase()}:${numericLat ? numericLat.toFixed(2) : ''}:${numericLng ? numericLng.toFixed(2) : ''}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 1800000) {
      return res.status(200).json(cached.payload);
    }

    let nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}&limit=25&addressdetails=1`;
    if (numericLat !== undefined && numericLng !== undefined) {
      const deg = 0.45; // ~50km box
      const left = (numericLng - deg).toFixed(4);
      const right = (numericLng + deg).toFixed(4);
      const top = (numericLat + deg).toFixed(4);
      const bottom = (numericLat - deg).toFixed(4);
      nominatimUrl += `&viewbox=${left},${top},${right},${bottom}`;
    }

    const osmResponse = await fetch(nominatimUrl, {
      headers: { 'User-Agent': 'MediKioskAI-HealthSystem/1.0 (Leaflet-OSM Healthcare Discovery)' },
      signal: AbortSignal.timeout(6000)
    });

    if (osmResponse.ok) {
      const rawPlaces: any[] = await osmResponse.json();
      const validPlaces = Array.isArray(rawPlaces) ? rawPlaces : [];

      const hospitals = validPlaces
        .map((item: any) => {
          const pLat = parseFloat(item.lat);
          const pLng = parseFloat(item.lon);
          if (!Number.isFinite(pLat) || !Number.isFinite(pLng)) return null;

          const addr = item.address || {};
          const rawName = item.name || addr.hospital || addr.clinic || item.display_name.split(',')[0];
          const name = (rawName || 'Medical Facility').trim();
          const address = item.display_name || [addr.road, addr.suburb, addr.city, addr.state].filter(Boolean).join(', ');

          const dist = (numericLat !== undefined && numericLng !== undefined)
            ? calcHaversineDistanceKm(numericLat, numericLng, pLat, pLng)
            : 0;
          const roadDist = Math.max(0.1, Math.round(dist * (dist < 2 ? 1.35 : dist < 10 ? 1.30 : 1.25) * 10) / 10);
          const roadDuration = Math.max(1, Math.round((roadDist / 36) * 60 + 1));

          const isEmergency = /24x7|trauma|emergency|casualty/i.test(name) || /hospital/i.test(item.type);
          const classification = classifyFacilityType(name, {
            amenity: item.type || item.class,
            types: [item.type, item.class].filter(Boolean)
          });

          if (classification.isInvalidRoadOrInfrastructure || isNonFacilityInfrastructure(name, [item.type, item.class])) {
            return null;
          }

          return {
            id: `osm-${item.osm_type || 'place'}-${item.osm_id || item.place_id}`,
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
          };
        })
        .filter(Boolean);

      const payload = {
        success: true,
        count: hospitals.length,
        hospitals,
        provider: 'openstreetmap'
      };

      if (searchCache.size > 200) {
        const firstK = searchCache.keys().next().value;
        if (firstK) searchCache.delete(firstK);
      }
      searchCache.set(cacheKey, { timestamp: Date.now(), payload });
      return res.status(200).json(payload);
    }

    return res.status(200).json({
      success: true,
      count: 0,
      hospitals: [],
      provider: 'openstreetmap'
    });
  } catch (error: any) {
    console.error('Error in /api/hospitals/search:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to search hospitals'
    });
  }
}
