// Unified Healthcare & Hospital Discovery Service
// Standardized classification, normalization, filtering, and road-metric ranking
// Shared across Hospital Locator and Emergency Ambulance Dispatch

export type EmergencyCapabilityStatus = 'verified' | 'not_verified' | 'unknown';
export type HealthcareCategory = 'hospital' | 'clinic' | 'phc' | 'health_centre' | 'diagnostic' | 'pharmacy' | 'other';

export interface NormalizedHealthcareFacility {
  id: string;
  placeId?: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  types: string[];
  rating: number | null;
  userRatingCount: number;
  phone: string;
  googleMapsURI: string;
  website?: string;
  
  // Classification
  isHospital: boolean;
  isSpecialtyClinic: boolean;
  category: HealthcareCategory;
  typeLabel: string;
  specialty?: string;
  
  // Emergency Capability (Decoupled from Hospital Status)
  emergencyCapability: EmergencyCapabilityStatus;
  isEmergencyVerified: boolean;
  emergencyAvailable: string; // e.g. "Emergency capability: Verified" or "Emergency capability: Not verified"
  icuAvailable?: string;
  
  // Distance & Travel Metrics
  distanceKm: number; // Straight-line distance
  roadDistanceKm: number; // Road route distance
  roadDurationMins: number; // Road duration in minutes
  travelTimeMins: number; // Display duration
  
  openNow?: boolean;
  weekdayDescriptions?: string[];
  source: 'live_places_api' | 'google_places' | 'openstreetmap' | 'national_health_network' | 'manual_search' | 'demo_synthetic';
}

/**
 * Check if a place name or metadata represents non-facility infrastructure (e.g. roads, streets, lanes, bridges)
 */
export function isNonFacilityInfrastructure(name: string, typesArr: string[] = []): boolean {
  const n = (name || '').trim().toLowerCase();
  if (!n) return true;

  // Check Google / OSM non-facility types
  const nonFacilityTypes = [
    'route', 'street_address', 'highway', 'intersection', 'transit_station', 
    'bus_stop', 'neighborhood', 'locality', 'sublocality', 'administrative_area_level_1', 
    'administrative_area_level_2', 'postal_code', 'country'
  ];
  const hasFacilityType = typesArr.some(t => ['hospital', 'doctor', 'medical_clinic', 'health', 'dentist', 'pharmacy'].includes(t.toLowerCase()));
  if (!hasFacilityType && typesArr.some(t => nonFacilityTypes.includes(t.toLowerCase()))) {
    return true;
  }

  // Check street / road suffixes where the entry is just a road/street named "Hospital Street" or similar
  const roadOnlyPatterns = [
    /^hospital\s+(street|road|lane|sarani|gali|marg|chowk|cross|avenue|highway|circle|drive|pathway|passage|bazaar|market|station|terminal|stop|bus stand|flyover|bridge|junction|crossing|more|bypass|gate)\b/i,
    /^(street|road|lane|sarani|gali|marg|chowk|cross|avenue|highway|circle|drive|bypass)\b/i,
    /\b(bus stop|metro station|railway station|flyover|bridge|crossing|junction|toll plaza)\b/i
  ];

  for (const pattern of roadOnlyPatterns) {
    if (pattern.test(n)) {
      // If it doesn't also contain explicit facility establishment words, it's a road
      if (!/hospital & research|hospital and research|medical college|super specialty|multispeciality|health city|institute of medical/i.test(n)) {
        return true;
      }
    }
  }

  return false;
}

export interface FacilityClassificationResult {
  isHospital: boolean;
  isSpecialtyClinic: boolean;
  category: HealthcareCategory;
  typeLabel: string;
  specialty?: string;
  isInvalidRoadOrInfrastructure?: boolean;
}

/**
 * Classify a healthcare place based on Google Place types and facility name.
 * Prevents treating streets, single-organ clinics, or pharmacies as general hospitals.
 */
export function classifyHealthcareFacility(name: string, tagsOrTypes: Record<string, any> = {}): FacilityClassificationResult {
  const n = (name || '').trim().toLowerCase();
  const typesArr: string[] = Array.isArray(tagsOrTypes.types) 
    ? tagsOrTypes.types.map((t: string) => String(t).toLowerCase()) 
    : [];
  const amenity = (tagsOrTypes.amenity || tagsOrTypes.osm_value || tagsOrTypes.type || '').toLowerCase();
  const healthcare = (tagsOrTypes.healthcare || tagsOrTypes.class || '').toLowerCase();

  // 0. Check for Road / Infrastructure
  if (isNonFacilityInfrastructure(name, typesArr) || tagsOrTypes.osm_key === 'highway') {
    return {
      isHospital: false,
      isSpecialtyClinic: false,
      category: 'other',
      typeLabel: 'Infrastructure / Non-Facility',
      isInvalidRoadOrInfrastructure: true
    };
  }

  // 1. Single-organ, non-emergency specialty clinics & labs
  const isEye = /eye|vision|lasik|optical|optometry|optometrist|cataract|drishit|drishti|netra|retina|glaucoma|sarala pawa|cornea|spectacle|lens|chasma|sight/i.test(n);
  const isDental = /dental|dentist|orthodontic|teeth|dento|tooth|oral care|braces|danta|dant\b/i.test(n) || typesArr.includes('dentist');
  const isDerma = /skin|derma|dermatology|hair|trichology|cosmetic|plastic surgery|aesthetic|laser clinic|beauty/i.test(n);
  const isHomeoAyur = /homeopathy|homeopathic|ayurveda|ayurvedic|unani|naturopathy|herbal|siddha/i.test(n);
  const isPhysio = /physiotherapy|physio|rehab|rehabilitation center|chiropractic|pain clinic|re\+move/i.test(n) || typesArr.includes('physiotherapist');
  const isDiagnostic = /diagnostic|pathology|pathological|scan centre|scan center|mri|ct scan|x-ray|blood bank|blood test|collection centre|laboratories|laboratory|labs?\b|imaging/i.test(n);
  const isPharmacy = /pharmacy|chemist|druggist|medical store|medicine shop|medicals|medplus|apollo pharmacy|distributor|wholesale medicine|janaushadhi|dawa|medical hall|medical agency/i.test(n) || typesArr.includes('pharmacy');

  if (isEye) {
    return { isHospital: false, isSpecialtyClinic: true, category: 'clinic', typeLabel: 'Eye Care / Optical Clinic', specialty: 'Ophthalmology / Eye Care' };
  }
  if (isDental) {
    return { isHospital: false, isSpecialtyClinic: true, category: 'clinic', typeLabel: 'Dental Care Clinic', specialty: 'Dental Surgery & Oral Care' };
  }
  if (isDerma) {
    return { isHospital: false, isSpecialtyClinic: true, category: 'clinic', typeLabel: 'Dermatology & Skin Clinic', specialty: 'Dermatology' };
  }
  if (isHomeoAyur) {
    return { isHospital: false, isSpecialtyClinic: true, category: 'clinic', typeLabel: 'Ayurvedic / Homeopathic Clinic', specialty: 'Alternative Medicine' };
  }
  if (isPhysio) {
    return { isHospital: false, isSpecialtyClinic: true, category: 'clinic', typeLabel: 'Physiotherapy & Pain Clinic', specialty: 'Physiotherapy' };
  }
  if (isDiagnostic) {
    return { isHospital: false, isSpecialtyClinic: true, category: 'diagnostic', typeLabel: 'Diagnostic & Pathology Lab', specialty: 'Diagnostics' };
  }
  if (isPharmacy) {
    return { isHospital: false, isSpecialtyClinic: true, category: 'pharmacy', typeLabel: 'Pharmacy / Medical Store', specialty: 'Pharmacy' };
  }

  // Pure medicine stores or distributor shops named "XYZ Medical" without hospital
  if (/\bmedical\b/i.test(n) && !/\b(hospital|college|institute|centre|center|nursing home|health|care)\b/i.test(n)) {
    return { isHospital: false, isSpecialtyClinic: true, category: 'pharmacy', typeLabel: 'Pharmacy / Medical Store', specialty: 'Pharmacy' };
  }

  // Doctor private chambers or individual physicians
  if ((/^(dr\.?|doctor)\b/i.test(n) || /\b(physician|consultant|mbbs|md|ms)\b/i.test(n)) && !/\b(hospital|nursing home|medical college|meditreat|institute)\b/i.test(n)) {
    return { isHospital: false, isSpecialtyClinic: false, category: 'clinic', typeLabel: 'Doctor Chamber / Clinic' };
  }

  // 2. Primary & Community Health Centres (PHC / CHC)
  if (/\bphc\b|primary health centre|primary health center|sub-centre|swasthya kendra/i.test(n) || healthcare === 'phc') {
    return { isHospital: true, isSpecialtyClinic: false, category: 'phc', typeLabel: 'Primary Health Centre (PHC)' };
  }
  if (/\b(chc|uphc)\b|community health|urban primary health|health center|health centre/i.test(n) || healthcare === 'centre' || healthcare === 'medical_centre') {
    return { isHospital: true, isSpecialtyClinic: false, category: 'health_centre', typeLabel: 'Community Health Centre (CHC)' };
  }

  // 3. Multi-speciality Clinics & Doctor Chambers (Dr. Alis Multispeciality Clinic, Polyclinics)
  const isClinicKeyword = /\b(clinic|polyclinic|dispensary|chamber|doctor's|consultant|day care centre|day care)\b/i.test(n);
  const isHospitalKeyword = /\b(hospital|medical college|aiims|district hospital|civil hospital|state general hospital|nursing home|superspeciality hospital|multispeciality hospital|cancer institute|meditreat|swasthya sadan|arogya niketan|seba sadan|sevasadan|matri sadan)\b/i.test(n);
  
  if (isClinicKeyword && !isHospitalKeyword) {
    return {
      isHospital: false,
      isSpecialtyClinic: false,
      category: 'clinic',
      typeLabel: 'Medical Clinic / Polyclinic'
    };
  }

  // 4. Genuine Hospitals (Medical Colleges, District, Multi-Specialty, General, Nursing Homes)
  if (/medical college|aiims|ipgmer|pgimer|institute of medical|hospital & research institute|hospital and research/i.test(n)) {
    return { isHospital: true, isSpecialtyClinic: false, category: 'hospital', typeLabel: 'Medical College & Hospital' };
  }
  if (/district hospital|state general hospital|sub-divisional hospital|sadar hospital|civil hospital/i.test(n)) {
    return { isHospital: true, isSpecialtyClinic: false, category: 'hospital', typeLabel: 'District / Govt Hospital' };
  }
  if (/cancer institute|cancer hospital|heart institute|cardiac centre|maternity hospital|matri sadan|pediatric hospital|children's hospital/i.test(n)) {
    return { isHospital: true, isSpecialtyClinic: false, category: 'hospital', typeLabel: 'Specialized Hospital / Institute' };
  }
  if (/super specialty|superspeciality|multispeciality|multi-specialty|multi specialty|apex|health city|trauma centre|trauma center/i.test(n)) {
    return { isHospital: true, isSpecialtyClinic: false, category: 'hospital', typeLabel: 'Multi-Specialty Hospital' };
  }
  if (/nursing home|hospitex|meditreat|swasthya sadan|arogya niketan|seba sadan|sevasadan/i.test(n)) {
    return { isHospital: true, isSpecialtyClinic: false, category: 'hospital', typeLabel: 'Hospital / Nursing Home' };
  }

  // If place type is 'hospital' or name includes hospital
  if (isHospitalKeyword || /hospital/i.test(n)) {
    return { isHospital: true, isSpecialtyClinic: false, category: 'hospital', typeLabel: 'General Hospital' };
  }

  if (typesArr.includes('hospital')) {
    const hasHospitalEvidence = /\b(hospital|health|care|nursing|centre|center|med|sadan|niketan|seba|seva|shree|mission|trust|foundation)\b/i.test(n);
    if (hasHospitalEvidence) {
      return { isHospital: true, isSpecialtyClinic: false, category: 'hospital', typeLabel: 'General Hospital' };
    }
    return { isHospital: false, isSpecialtyClinic: false, category: 'clinic', typeLabel: 'Medical Practice / Clinic' };
  }

  // Default fallback for doctor/medical_clinic without explicit hospital indicators
  if (typesArr.includes('medical_clinic') || typesArr.includes('doctor') || amenity === 'clinic' || amenity === 'doctors') {
    return { isHospital: false, isSpecialtyClinic: false, category: 'clinic', typeLabel: 'Medical Clinic / Dispensary' };
  }

  return { isHospital: false, isSpecialtyClinic: false, category: 'clinic', typeLabel: 'Medical Facility' };
}

/**
 * Determine emergency capability without false assumptions.
 * Only verified if explicit 24/7 hours or explicit emergency/trauma data exists.
 */
export function determineEmergencyCapability(rawPlace: any): {
  emergencyCapability: EmergencyCapabilityStatus;
  isEmergencyVerified: boolean;
  emergencyAvailable: string;
} {
  const name = (rawPlace.displayName?.text || rawPlace.name || '').toLowerCase();
  const hours = rawPlace.regularOpeningHours;
  
  // Check if open 24 hours
  const is24x7 = hours?.weekdayDescriptions?.some((desc: string) => 
    desc.toLowerCase().includes('open 24 hours') || 
    desc.toLowerCase().includes('24 hours') || 
    desc.toLowerCase().includes('24x7') ||
    desc.toLowerCase().includes('round the clock')
  ) || rawPlace.opening_hours === '24/7' || rawPlace.emergency === 'yes';

  const hasExplicitTraumaName = /trauma centre|trauma center|level-1 trauma|casualty & trauma|emergency trauma/i.test(name);
  const isVerifiedInRegistry = rawPlace.emergencyAvailable?.includes('24x7') || rawPlace.emergencyAvailable?.includes('Level-1');

  if (is24x7 || hasExplicitTraumaName || isVerifiedInRegistry) {
    return {
      emergencyCapability: 'verified',
      isEmergencyVerified: true,
      emergencyAvailable: 'Emergency capability: Verified'
    };
  }

  return {
    emergencyCapability: 'not_verified',
    isEmergencyVerified: false,
    emergencyAvailable: 'Emergency capability: Not verified'
  };
}

/**
 * Rank hospitals for SOS & Emergency Ambulance Destination Selection:
 * 1. Genuine healthcare facilities (true hospitals before specialty single-organ clinics)
 * 2. Actual proximity to current patient GPS (distanceKm ascending as primary ranking factor)
 * 3. Actual/available road distance & road duration (when straight-line distances are close)
 * 4. Emergency capability as a secondary safety indicator / tie-breaker
 * 5. Rating / review count as final tie-breaker
 * 
 * Ensures a nearby genuine hospital (e.g. 1.5 km) is NEVER superseded by a farther hospital (e.g. 7.5 km)
 * simply because the farther hospital has a verified emergency badge.
 */
export function rankHospitalsForEmergency<T extends { 
  id?: string;
  placeId?: string;
  isHospital?: boolean; 
  isSpecialtyClinic?: boolean; 
  isEmergencyVerified?: boolean; 
  emergencyCapability?: string;
  roadDurationMins?: number; 
  travelTimeMins?: number; 
  distanceKm?: number;
  roadDistanceKm?: number;
  rating?: number | null;
  userRatingCount?: number;
}>(hospitals: T[]): T[] {
  return hospitals.slice().sort((a, b) => {
    // 1. Primary sorting: Actual proximity to current patient GPS (distanceKm ascending)
    const distA = typeof a.distanceKm === 'number' && !isNaN(a.distanceKm) ? a.distanceKm : 999;
    const distB = typeof b.distanceKm === 'number' && !isNaN(b.distanceKm) ? b.distanceKm : 999;
    const distDiff = distA - distB;

    // If there is any distinct difference in proximity (>= 0.05 km / 50 meters), proximity strictly wins
    if (Math.abs(distDiff) >= 0.05) {
      return distDiff;
    }

    // 2. Genuine healthcare facilities (true general/multi-specialty hospitals before single-organ clinics if distance is virtually identical)
    const aIsHosp = a.isHospital !== false && !a.isSpecialtyClinic;
    const bIsHosp = b.isHospital !== false && !b.isSpecialtyClinic;
    if (aIsHosp !== bIsHosp) return aIsHosp ? -1 : 1;

    // 3. When facilities are virtually at identical proximity (< 0.05 km difference), compare road distance & duration
    const roadDistA = typeof a.roadDistanceKm === 'number' && !isNaN(a.roadDistanceKm) ? a.roadDistanceKm : distA * 1.3;
    const roadDistB = typeof b.roadDistanceKm === 'number' && !isNaN(b.roadDistanceKm) ? b.roadDistanceKm : distB * 1.3;
    const roadDistDiff = roadDistA - roadDistB;
    if (Math.abs(roadDistDiff) >= 0.3) {
      return roadDistDiff;
    }

    // Compare road duration / ETA if available
    const aTime = a.roadDurationMins || a.travelTimeMins || 0;
    const bTime = b.roadDurationMins || b.travelTimeMins || 0;
    if (aTime > 0 && bTime > 0 && Math.abs(aTime - bTime) >= 1.5) {
      return aTime - bTime;
    }

    // 4. Secondary safety tie-breaker: Verified emergency capability
    const aVerified = Boolean(a.isEmergencyVerified || a.emergencyCapability === 'verified');
    const bVerified = Boolean(b.isEmergencyVerified || b.emergencyCapability === 'verified');
    if (aVerified !== bVerified) {
      return aVerified ? -1 : 1;
    }

    // 5. Tie-breaker: fine straight-line distance, then rating & review popularity
    if (Math.abs(distDiff) > 0.001) {
      return distDiff;
    }

    const aRating = (a.rating || 0) * Math.log10((a.userRatingCount || 0) + 1);
    const bRating = (b.rating || 0) * Math.log10((b.userRatingCount || 0) + 1);
    return bRating - aRating;
  });
}

/**
 * Rank facilities for General Hospital Locator:
 * 1. PRIMARY: Proximity distance from current GPS coordinates (distanceKm ascending)
 * 2. SECONDARY: Real road distance (if actual routing distance is present)
 * 3. TERTIARY: Real road duration (if actual routing duration is present)
 * 4. THEN: Facility quality/type (true hospitals before single-organ specialty clinics if at identical distance)
 * 5. THEN: User rating & review count as final tie-breaker
 * 
 * NOTE: Emergency verification is purely informational and does NOT alter the proximity ranking.
 */
export function rankFacilitiesForLocator<T extends { 
  isHospital?: boolean; 
  isSpecialtyClinic?: boolean; 
  isEmergencyVerified?: boolean; 
  emergencyCapability?: string;
  roadDurationMins?: number; 
  travelTimeMins?: number; 
  distanceKm?: number;
  roadDistanceKm?: number;
  rating?: number | null;
  userRatingCount?: number;
}>(facilities: T[]): T[] {
  return facilities.slice().sort((a, b) => {
    // 1. PRIMARY: Straight-line distance from current location (distanceKm ascending)
    const distA = typeof a.distanceKm === 'number' && !isNaN(a.distanceKm) ? a.distanceKm : 9999;
    const distB = typeof b.distanceKm === 'number' && !isNaN(b.distanceKm) ? b.distanceKm : 9999;
    const distDiff = distA - distB;

    // Any clear difference in distance (> 0.05 km / 50 meters) strictly determines ranking
    if (Math.abs(distDiff) >= 0.05) {
      return distDiff;
    }

    // 2. SECONDARY: Actual road distance if both have real road distance available
    if (
      typeof a.roadDistanceKm === 'number' && 
      typeof b.roadDistanceKm === 'number' && 
      !isNaN(a.roadDistanceKm) && 
      !isNaN(b.roadDistanceKm)
    ) {
      const roadDistDiff = a.roadDistanceKm - b.roadDistanceKm;
      if (Math.abs(roadDistDiff) >= 0.1) {
        return roadDistDiff;
      }
    }

    // 3. TERTIARY: Actual road travel time if available
    const timeA = a.roadDurationMins || 0;
    const timeB = b.roadDurationMins || 0;
    if (timeA > 0 && timeB > 0 && Math.abs(timeA - timeB) >= 1) {
      return timeA - timeB;
    }

    // 4. Facility quality/type: True general/multi-specialty hospitals before single-organ clinics
    const aIsHosp = a.isHospital !== false && !a.isSpecialtyClinic;
    const bIsHosp = b.isHospital !== false && !b.isSpecialtyClinic;
    if (aIsHosp !== bIsHosp) return aIsHosp ? -1 : 1;

    // 5. Rating and review count as final tie-breaker
    const aRating = (a.rating || 0) * Math.log10((a.userRatingCount || 0) + 1);
    const bRating = (b.rating || 0) * Math.log10((b.userRatingCount || 0) + 1);
    if (Math.abs(bRating - aRating) > 0.1) {
      return bRating - aRating;
    }

    return distDiff;
  });
}
