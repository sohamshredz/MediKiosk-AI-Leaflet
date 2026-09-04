import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LeafletHospitalMap } from './LeafletHospitalMap';
import { 
  MapPin, 
  Navigation, 
  Phone, 
  Clock, 
  Calendar, 
  Search, 
  CheckCircle2, 
  AlertTriangle,
  ExternalLink,
  LocateFixed,
  X,
  Siren,
  ArrowLeft,
  Building2,
  Loader2,
  RefreshCw,
  Mic,
  Compass,
  Layers,
  Sparkles,
  ShieldCheck,
  Check,
  Car,
  Footprints,
  Bus
} from 'lucide-react';
import { PatientProfile } from '../../types';
import { saveAppointmentToSupabase, saveAmbulanceBookingToSupabase } from '../../utils/supabaseClient';
import { calculateDistanceKm, AmbulanceUnit, SAMPLE_AMBULANCES } from '../../data/sampleHospitals';
import { BookAmbulanceModal } from '../patient/BookAmbulanceModal';
import { 
  getCurrentGPSLocation, 
  reverseGeocodeCoordinates, 
  geocodeCityOrArea, 
  fetchNearbyHospitals, 
  searchHospitalsByText, 
  calculateHaversineDistanceKm,
  getCachedUserCoordinates,
  getCachedGeocodedLocation,
  setCachedUserCoordinates,
  HospitalFacility,
  isValidCoordinate,
  rankFacilitiesForLocator,
  computeLiveRoute,
  computeKinematicRoute
} from '../../services/locationService';
import { HospitalVoiceController } from '../voice/HospitalVoiceController';
import { VoiceIntentResult } from '../../services/voiceHospitalService';
import { useLanguage } from '../../context/LanguageContext';

export interface RealHealthcareFacility {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'phc' | 'health_centre';
  typeLabel: string;
  isHospital?: boolean;
  isSpecialtyClinic?: boolean;
  isEmergencyVerified?: boolean;
  specialty?: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  googleMapsURI?: string;
  weekdayDescriptions?: string[];
  openNow?: boolean;
  distanceKm: number;
  roadDistanceKm?: number;
  roadDurationMins?: number;
  travelTimeMins: number;
  emergencyAvailable?: string;
  source?: 'live_places_api' | 'openstreetmap' | 'manual_search' | 'demo_synthetic' | 'national_health_network' | 'google_places';
  rawTypes?: string[];
  rating?: number | null;
  userRatingCount?: number;
}

interface HospitalLocatorMapProps {
  patients: PatientProfile[];
  activePatientId: string;
  onBookAppointmentToQueue?: (booking: {
    hospital: any;
    department: string;
    patientName: string;
    phone: string;
    slot: string;
    abhaId?: string;
  }) => void;
  onNavigateToKiosk?: () => void;
  onBackToLanding?: () => void;
  initialUserLocation?: { lat: number; lng: number; accuracy?: number; timestamp?: number } | null;
  initialZoom?: number;
  initialSuccessMessage?: string | null;
  onClearInitialLocation?: () => void;
}



// Internal Map Content Component consuming Google Maps Places & Location Service
const HospitalLocatorMapContent: React.FC<HospitalLocatorMapProps & { apiKey: string }> = ({
  patients,
  activePatientId,
  onBookAppointmentToQueue,
  onNavigateToKiosk,
  onBackToLanding,
  initialUserLocation,
  initialZoom,
  initialSuccessMessage,
  apiKey
}) => {
  const { t } = useLanguage();
  // Neutral India center as overview when location is not yet known
  const INDIA_OVERVIEW_CENTER = { lat: 20.5937, lng: 78.9629 };

  // User GPS Coordinates State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(() => {
    if (initialUserLocation) return initialUserLocation;
    const cached = getCachedUserCoordinates();
    if (cached) return { lat: cached.latitude, lng: cached.longitude };
    return null;
  });

  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(() => {
    if (initialUserLocation?.accuracy) return initialUserLocation.accuracy;
    const cached = getCachedUserCoordinates();
    return cached?.accuracy || null;
  });

  const [locationTimestamp, setLocationTimestamp] = useState<Date | null>(() => {
    if (initialUserLocation?.timestamp) return new Date(initialUserLocation.timestamp);
    const cached = getCachedUserCoordinates();
    return cached?.timestamp ? new Date(cached.timestamp) : null;
  });

  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(() => {
    if (initialUserLocation) return initialUserLocation;
    const cached = getCachedUserCoordinates();
    if (cached) return { lat: cached.latitude, lng: cached.longitude };
    return INDIA_OVERVIEW_CENTER;
  });

  const [mapZoom, setMapZoom] = useState<number>(() => {
    if (initialZoom) return initialZoom;
    if (initialUserLocation || getCachedUserCoordinates()) return 14;
    return 5;
  });

  const [locationName, setLocationName] = useState<string>(() => {
    if (initialUserLocation) return 'Your Current GPS Location';
    const cachedGeocoded = getCachedGeocodedLocation();
    if (cachedGeocoded) return cachedGeocoded.displayName;
    return 'Default map view — location not yet detected';
  });

  const [isManualLocation, setIsManualLocation] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationSuccessNotice, setLocationSuccessNotice] = useState<string | null>(() => {
    return initialSuccessMessage || (initialUserLocation ? 'Your current location has been detected.' : null);
  });

  // OpenStreetMap Healthcare Facilities State
  const [facilities, setFacilities] = useState<RealHealthcareFacility[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchRadiusKm, setSearchRadiusKm] = useState<number>(5);
  const [searchProvider, setSearchProvider] = useState<'google_places' | 'openstreetmap' | 'national_health_network' | 'none'>('openstreetmap');
  const [searchErrorCode, setSearchErrorCode] = useState<string | null>(null);
  const [isDebugPanelOpen, setIsDebugPanelOpen] = useState<boolean>(false);

  // Filters & Selection
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFacility, setSelectedFacility] = useState<RealHealthcareFacility | null>(null);
  const [infoWindowFacility, setInfoWindowFacility] = useState<RealHealthcareFacility | null>(null);
  const [activeRouteFacility, setActiveRouteFacility] = useState<RealHealthcareFacility | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [routeTravelMode, setRouteTravelMode] = useState<'ambulance' | 'car' | 'walk' | 'transit'>('car');
  const [isRouteLoading, setIsRouteLoading] = useState<boolean>(false);
  const [routeErrorMessage, setRouteErrorMessage] = useState<string | null>(null);
  const [routeRefreshTrigger, setRouteRefreshTrigger] = useState<number>(0);

  // Synchronize road route and live ETA calculation for activeRouteFacility
  useEffect(() => {
    if (!activeRouteFacility || !userLocation || !isValidCoordinate(userLocation.lat, userLocation.lng) || !isValidCoordinate(activeRouteFacility.lat, activeRouteFacility.lng)) {
      setRouteInfo(null);
      setIsRouteLoading(false);
      return;
    }

    let isCancelled = false;
    setIsRouteLoading(true);
    setRouteErrorMessage(null);

    const calcRoute = async () => {
      try {
        const result = await computeLiveRoute(
          userLocation,
          { lat: activeRouteFacility.lat, lng: activeRouteFacility.lng },
          routeTravelMode
        );

        if (isCancelled) return;

        const distanceStr = result.distanceKm < 1 ? `${Math.round(result.distanceKm * 1000)} m` : `${result.distanceKm.toFixed(1)} km`;
        const durationStr = result.durationMinutes < 60 ? `~${result.durationMinutes} mins` : `~${Math.floor(result.durationMinutes / 60)}h ${result.durationMinutes % 60}m`;

        setRouteInfo({
          distance: distanceStr,
          duration: `${durationStr} ETA`
        });
      } catch (err: any) {
        if (isCancelled) return;
        console.warn('Hospital route computation notice, falling back to kinematic calculation:', err);
        const fallback = computeKinematicRoute(
          userLocation,
          { lat: activeRouteFacility.lat, lng: activeRouteFacility.lng },
          routeTravelMode
        );
        const distanceStr = fallback.distanceKm < 1 ? `${Math.round(fallback.distanceKm * 1000)} m` : `${fallback.distanceKm.toFixed(1)} km`;
        const durationStr = fallback.durationMinutes < 60 ? `~${fallback.durationMinutes} mins` : `~${Math.floor(fallback.durationMinutes / 60)}h ${fallback.durationMinutes % 60}m`;
        setRouteInfo({
          distance: distanceStr,
          duration: `${durationStr} ETA`
        });
      } finally {
        if (!isCancelled) {
          setIsRouteLoading(false);
        }
      }
    };

    calcRoute();

    return () => {
      isCancelled = true;
    };
  }, [
    activeRouteFacility?.id,
    activeRouteFacility?.lat,
    activeRouteFacility?.lng,
    userLocation?.lat,
    userLocation?.lng,
    routeTravelMode,
    routeRefreshTrigger
  ]);

  // Voice AI Assistant Modal
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);

  // Booking Modal States
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [bookingFacility, setBookingFacility] = useState<RealHealthcareFacility | null>(null);
  const [bookingDepartment, setBookingDepartment] = useState<string>('General OPD Consultation');
  const [bookingSlot, setBookingSlot] = useState<string>('Today Morning (10:00 AM - 11:30 AM)');
  const [bookingName, setBookingName] = useState<string>('');
  const [bookingPhone, setBookingPhone] = useState<string>('+91 98765 43210');
  const [bookingAbha, setBookingAbha] = useState<string>('');
  const [bookingSuccessToken, setBookingSuccessToken] = useState<string | null>(null);

  // Ambulance Dispatch Modal & Tracking
  const [isAmbulanceModalOpen, setIsAmbulanceModalOpen] = useState<boolean>(false);
  const [dispatchedAmbulance, setDispatchedAmbulance] = useState<AmbulanceUnit | null>(null);
  const [ambulanceProgress, setAmbulanceProgress] = useState<number>(0);
  const [ambulanceEta, setAmbulanceEta] = useState<number>(5);

  const activePatient = patients.find(p => p.id === activePatientId) || patients[0];

  // Auto-fill booking form from active patient profile
  useEffect(() => {
    if (activePatient) {
      setBookingName(activePatient.name);
      setBookingPhone(activePatient.mobile || '+91 98765 43210');
      setBookingAbha(activePatient.abhaId || '');
    }
  }, [activePatient]);

  /**
   * Search real hospitals nearby using Places API (New) backend endpoint with sequential OSM fallback
   */
  const searchNearbyHealthcare = useCallback(async (lat: number, lng: number, radiusMeters = 5000) => {
    setIsSearching(true);
    setSearchError(null);
    setSearchErrorCode(null);
    setActiveRouteFacility(null);
    setRouteInfo(null);

    const radiusKm = Math.round(radiusMeters / 1000);
    setSearchRadiusKm(radiusKm);

    try {
      const result = await fetchNearbyHospitals(lat, lng, radiusMeters);

      setSearchProvider(result.provider);

      if (!result.success) {
        setFacilities([]);
        setSearchErrorCode(result.errorCode || 'SERVICE_UNAVAILABLE');
        setSearchError(result.message || 'Nearby hospital services are temporarily unavailable. Please use the search bar above.');
        return;
      }

      const parsed: RealHealthcareFacility[] = result.hospitals.map(h => {
        const dist = (typeof h.latitude === 'number' && typeof h.longitude === 'number')
          ? calculateHaversineDistanceKm(lat, lng, h.latitude, h.longitude)
          : (typeof h.distanceKm === 'number' ? h.distanceKm : 0);

        return {
          id: h.id,
          name: h.name,
          type: h.type || 'hospital',
          typeLabel: h.typeLabel || 'Hospital',
          isHospital: h.isHospital !== undefined ? h.isHospital : (h.type === 'hospital'),
          isSpecialtyClinic: h.isSpecialtyClinic || false,
          isEmergencyVerified: Boolean(h.isEmergencyVerified),
          specialty: h.specialty,
          address: h.address,
          lat: h.latitude,
          lng: h.longitude,
          phone: h.phone,
          googleMapsURI: h.googleMapsURI,
          weekdayDescriptions: ['OPD & Emergency Services Available'],
          openNow: true,
          distanceKm: dist,
          roadDistanceKm: h.roadDistanceKm,
          roadDurationMins: h.roadDurationMins || h.travelTimeMins,
          travelTimeMins: h.travelTimeMins,
          emergencyAvailable: h.emergencyAvailable || (h.isEmergencyVerified ? 'Emergency capability: Verified' : 'Emergency capability: Not verified'),
          source: h.source || 'openstreetmap',
          rawTypes: ['hospital', 'health'],
          rating: h.rating,
          userRatingCount: h.userRatingCount
        };
      });

      // Strictly filter by actual geographic Haversine distance <= radiusKm
      const withinRadius = parsed.filter(f => f.distanceKm <= radiusKm);
      const ranked = rankFacilitiesForLocator(withinRadius);

      if (ranked.length === 0) {
        setFacilities([]);
        setSearchError(`No healthcare facilities found within ${radiusKm} km.`);
      } else {
        setFacilities(ranked);
        setSelectedFacility(ranked[0]);
      }
    } catch (err: any) {
      console.warn('Nearby hospital search error:', err);
      setFacilities([]);
      setSearchProvider('none');
      setSearchErrorCode('SEARCH_FAILED');
      setSearchError('Nearby hospital search is temporarily unavailable. Please use the search bar to find hospitals by city or area.');
    } finally {
      setIsSearching(false);
    }
  }, []);

  /**
   * Reverse Geocode active GPS coordinates and refresh nearby hospitals
   */
  const handleLocateMe = useCallback(async () => {
    setIsLocating(true);
    setLocationError(null);
    setLocationSuccessNotice(null);

    try {
      const coords = await getCurrentGPSLocation();
      setUserLocation({ lat: coords.latitude, lng: coords.longitude });
      setLocationAccuracy(coords.accuracy);
      setLocationTimestamp(new Date(coords.timestamp));
      setMapCenter({ lat: coords.latitude, lng: coords.longitude });
      setMapZoom(15);
      setIsManualLocation(false);

      // Reverse geocode to get city/area name
      const geocoded = await reverseGeocodeCoordinates(coords.latitude, coords.longitude);
      const locality = geocoded.displayName || `${coords.latitude.toFixed(4)}° N, ${coords.longitude.toFixed(4)}° E`;
      setLocationName(`Nearby Hospitals in ${locality}`);
      setLocationSuccessNotice(`Location acquired: ${locality}`);

      // Search real hospitals around the user's GPS
      await searchNearbyHealthcare(coords.latitude, coords.longitude);
    } catch (err: any) {
      console.warn('Locate me error:', err);
      setLocationError(err.message || 'Unable to retrieve your current GPS location.');
    } finally {
      setIsLocating(false);
    }
  }, [searchNearbyHealthcare]);

  /**
   * Search hospitals or cities manually
   */
  const handleManualLocationSearch = async (queryText: string) => {
    const clean = queryText.trim();
    if (!clean) return;

    setIsSearching(true);
    setSearchError(null);
    setActiveRouteFacility(null);
    setRouteInfo(null);

    try {
      // 1. First forward geocode the query (e.g. "Kolkata", "Salt Lake", "Mumbai")
      const geocoded = await geocodeCityOrArea(clean);
      
      setUserLocation({ lat: geocoded.latitude, lng: geocoded.longitude });
      setMapCenter({ lat: geocoded.latitude, lng: geocoded.longitude });
      setMapZoom(14);
      setLocationName(`Hospitals in ${geocoded.displayName}`);
      setIsManualLocation(true);
      setLocationSuccessNotice(`Centered on ${geocoded.displayName} (Manual Search)`);

      // 2. Fetch nearby hospitals in that location
      await searchNearbyHealthcare(geocoded.latitude, geocoded.longitude);
    } catch (err: any) {
      console.warn('Manual city search error, falling back to text query search:', err);
      try {
        const textResults = await searchHospitalsByText(clean, userLocation?.lat, userLocation?.lng);
        if (textResults.length > 0) {
          const first = textResults[0];
          setUserLocation({ lat: first.latitude, lng: first.longitude });
          setMapCenter({ lat: first.latitude, lng: first.longitude });
          setMapZoom(14);
          setLocationName(`Hospitals for "${clean}"`);
          setIsManualLocation(true);

          const parsed: RealHealthcareFacility[] = textResults.map(h => ({
            id: h.id,
            name: h.name,
            type: h.type || 'hospital',
            typeLabel: h.typeLabel || 'Hospital',
            isHospital: h.isHospital !== undefined ? h.isHospital : (h.type === 'hospital'),
            isSpecialtyClinic: h.isSpecialtyClinic || false,
            isEmergencyVerified: Boolean(h.isEmergencyVerified),
            specialty: h.specialty,
            address: h.address,
            lat: h.latitude,
            lng: h.longitude,
            phone: h.phone,
            googleMapsURI: h.googleMapsURI,
            weekdayDescriptions: ['Open for OPD & Emergency Services'],
            openNow: true,
            distanceKm: h.distanceKm,
            roadDistanceKm: h.roadDistanceKm,
            roadDurationMins: h.roadDurationMins || h.travelTimeMins,
            travelTimeMins: h.travelTimeMins,
            emergencyAvailable: h.emergencyAvailable || (h.isEmergencyVerified ? 'Emergency capability: Verified' : 'Emergency capability: Not verified'),
            source: 'manual_search',
            rating: h.rating,
            userRatingCount: h.userRatingCount
          }));

          const ranked = rankFacilitiesForLocator(parsed);
          setFacilities(ranked);
          if (ranked.length > 0) {
            setSelectedFacility(ranked[0]);
          }
        } else {
          setSearchError(`No hospitals found matching "${clean}".`);
        }
      } catch (subErr: any) {
        setSearchError(subErr.message || `Could not find hospitals for "${clean}".`);
      }
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Handle Voice Assistant Intent Execution
   */
  const handleExecuteVoiceIntent = async (intentResult: VoiceIntentResult) => {
    switch (intentResult.intent) {
      case 'REFRESH_LOCATION':
      case 'NEARBY_HOSPITALS':
        await handleLocateMe();
        break;

      case 'NEAREST_HOSPITAL':
        if (facilities.length > 0) {
          const nearest = facilities[0];
          setSelectedFacility(nearest);
          setInfoWindowFacility(nearest);
          setMapCenter({ lat: nearest.lat, lng: nearest.lng });
          setMapZoom(15);
        } else {
          await handleLocateMe();
        }
        break;

      case 'EMERGENCY_HOSPITALS':
        setSelectedType('hospital');
        if (userLocation) {
          await searchNearbyHealthcare(userLocation.lat, userLocation.lng);
        } else {
          await handleLocateMe();
        }
        break;

      case 'SEARCH_LOCATION':
        if (intentResult.queryLocation) {
          setSearchQuery(intentResult.queryLocation);
          await handleManualLocationSearch(intentResult.queryLocation);
        }
        break;

      case 'SELECT_HOSPITAL':
        if (typeof intentResult.hospitalIndex === 'number' && facilities[intentResult.hospitalIndex]) {
          const picked = facilities[intentResult.hospitalIndex];
          setSelectedFacility(picked);
          setInfoWindowFacility(picked);
          setMapCenter({ lat: picked.lat, lng: picked.lng });
        }
        break;

      case 'DIRECTIONS':
      case 'ETA_DISTANCE':
        const target = selectedFacility || facilities[0];
        if (target && userLocation) {
          setActiveRouteFacility(target);
          setSelectedFacility(target);
        }
        break;

      default:
        if (intentResult.queryLocation) {
          await handleManualLocationSearch(intentResult.queryLocation);
        }
        break;
    }
  };

  // If initial location was passed from landing page or cache, search immediately on mount
  useEffect(() => {
    if (initialUserLocation) {
      setUserLocation(initialUserLocation);
      setLocationAccuracy(initialUserLocation.accuracy || 15);
      setLocationTimestamp(initialUserLocation.timestamp ? new Date(initialUserLocation.timestamp) : new Date());
      setMapCenter(initialUserLocation);
      setMapZoom(initialZoom || 15);
      setIsManualLocation(false);
      searchNearbyHealthcare(initialUserLocation.lat, initialUserLocation.lng);
      reverseGeocodeCoordinates(initialUserLocation.lat, initialUserLocation.lng).then((geocoded) => {
        if (geocoded.displayName) {
          setLocationName(`Nearby Hospitals in ${geocoded.displayName}`);
        }
      });
    } else {
      const cached = getCachedUserCoordinates();
      if (cached) {
        setUserLocation({ lat: cached.latitude, lng: cached.longitude });
        setLocationAccuracy(cached.accuracy);
        setLocationTimestamp(new Date(cached.timestamp));
        setMapCenter({ lat: cached.latitude, lng: cached.longitude });
        setMapZoom(15);
        searchNearbyHealthcare(cached.latitude, cached.longitude);
        reverseGeocodeCoordinates(cached.latitude, cached.longitude).then((geocoded) => {
          if (geocoded.displayName) {
            setLocationName(`Nearby Hospitals in ${geocoded.displayName}`);
          }
        });
      } else {
        // Automatically request browser GPS when user navigates to Hospital Map
        handleLocateMe();
      }
    }
  }, [initialUserLocation, handleLocateMe, searchNearbyHealthcare]);

  // Filter facilities by category & keyword
  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      // Emergency capability is NOT used to filter the Hospitals tab. A hospital is a hospital regardless of verified emergency status.
      const isTrueHospital = f.isHospital === true || (f.type === 'hospital' && !f.isSpecialtyClinic);
      const matchesType = 
        selectedType === 'all' ? true :
        selectedType === 'hospital' ? isTrueHospital :
        selectedType === 'clinic' ? (!isTrueHospital || f.type === 'clinic' || f.isSpecialtyClinic || f.type === 'phc' || f.type === 'health_centre') :
        selectedType === 'phc' ? (f.type === 'phc' || f.type === 'health_centre' || f.typeLabel.toLowerCase().includes('phc') || f.typeLabel.toLowerCase().includes('health')) : true;

      const matchesSearch = searchQuery.trim() === '' ? true :
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.typeLabel.toLowerCase().includes(searchQuery.toLowerCase());

      // Ensure facility does not exceed the currently selected radius
      const matchesRadius = typeof f.distanceKm === 'number' ? f.distanceKm <= searchRadiusKm : true;

      return matchesType && matchesSearch && matchesRadius;
    });
  }, [facilities, selectedType, searchQuery, searchRadiusKm]);

  // Handle booking form submission
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingFacility) return;

    const token = `OPD-${Math.floor(100 + Math.random() * 900)}`;
    setBookingSuccessToken(token);

    if (onBookAppointmentToQueue) {
      onBookAppointmentToQueue({
        hospital: bookingFacility,
        department: bookingDepartment,
        patientName: bookingName,
        phone: bookingPhone,
        slot: bookingSlot,
        abhaId: bookingAbha
      });
    }

    try {
      await saveAppointmentToSupabase({
        id: `apt-${Date.now()}`,
        patientId: activePatient.id,
        patientName: bookingName,
        tokenNumber: token,
        uhid: activePatient.uhid || 'UHID-REG',
        department: bookingDepartment,
        doctorName: 'OPD Duty Physician',
        doctorSpecialty: bookingDepartment,
        careStream: 'allopathy',
        date: new Date().toISOString().split('T')[0],
        timeSlot: bookingSlot,
        status: 'confirmed',
        roomNumber: 'OPD Consultation Room',
        abhaLinked: Boolean(bookingAbha),
        bookedAt: new Date().toISOString(),
        bookingType: 'online_portal'
      });
    } catch (err) {
      console.warn('Appointment save notice:', err);
    }
  };

  const getDirectionsUrl = (facility: RealHealthcareFacility) => {
    if (facility.googleMapsURI) return facility.googleMapsURI;
    const dest = `${facility.lat},${facility.lng}`;
    const orig = userLocation ? `${userLocation.lat},${userLocation.lng}` : '';
    return orig 
      ? `https://www.google.com/maps/dir/?api=1&origin=${orig}&destination=${dest}&travelmode=driving`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(facility.name + ' ' + facility.address)}`;
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-100 dark:bg-slate-950 min-h-0 relative">
      
      {/* TOP SUB-HEADER BAR */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 shrink-0 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: Navigation, Location Title & GPS Status Badges */}
          <div className="flex items-center gap-3">
            {onBackToLanding && (
              <button
                type="button"
                id="btn-back-to-landing-from-map"
                onClick={onBackToLanding}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('Home')}</span>
              </button>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
                  <Building2 className="w-5 h-5 text-teal-700 dark:text-teal-400" />
                  <span>{t('Hospital & Emergency Locator')}</span>
                </h1>

                {userLocation && !isManualLocation && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{t('Location detected')}</span>
                  </div>
                )}

                {isManualLocation && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                    {t('Manual Search Area')}
                  </span>
                )}
              </div>

              {/* Subtitle / Locality and Metadata */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs sm:max-w-md">
                  {t(locationName)}
                </span>

                {userLocation && !isManualLocation && locationAccuracy !== null && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    locationAccuracy > 300 
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800 font-bold' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}>
                    {t(`GPS accuracy: ±${Math.round(locationAccuracy)} m`)}
                  </span>
                )}

                {userLocation && !isManualLocation && locationTimestamp && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {t(`Updated: ${locationTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Action Controls: Voice, GPS Locate, Emergency SOS */}
          <div className="flex items-center gap-2">
            
            {/* AI Voice Assistant Button */}
            <button
              type="button"
              id="btn-voice-assistant-map"
              onClick={() => setIsVoiceModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer group"
              title={t('Speak voice command in any of 10 Indian languages')}
            >
              <Mic className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
              <span>{t('Find by Voice')}</span>
            </button>

            {/* Locate Me GPS Button */}
            <button
              type="button"
              id="btn-locate-me-map"
              onClick={handleLocateMe}
              disabled={isLocating}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:shadow transition-all cursor-pointer disabled:opacity-60 ${
                userLocation 
                  ? 'bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-700' 
                  : 'bg-teal-700 hover:bg-teal-800 text-white shadow-xs'
              }`}
              title={t('Detect real device GPS coordinates')}
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                  <span>{t('Locating...')}</span>
                </>
              ) : (
                <>
                  <LocateFixed className={`w-4 h-4 ${userLocation ? 'text-teal-700 dark:text-teal-400' : 'text-amber-300'}`} />
                  <span>{userLocation ? t('Refresh Location') : t('Locate Me')}</span>
                </>
              )}
            </button>

            {/* SOS Emergency Dispatch Button */}
            <button
              type="button"
              id="btn-sos-ambulance-map"
              onClick={() => setIsAmbulanceModalOpen(true)}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer animate-pulse"
              title={t('Rapid Ambulance Dispatch & Live Route')}
            >
              <Siren className="w-4 h-4 text-amber-300" />
              <span>{t('SOS Ambulance')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* LOCATION PROMPT BANNER (Shown when location is not yet known) */}
      {!userLocation && !locationError && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-xs text-amber-950 shadow-2xs">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-700 shrink-0" />
              <div>
                <p className="font-bold text-amber-950">{t('Default map view — location not yet detected')}</p>
                <p className="text-amber-800 text-[11px]">{t('To show verified hospitals nearest to you, use your device GPS or search an area.')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-banner-use-gps"
                onClick={handleLocateMe}
                disabled={isLocating}
                className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <LocateFixed className="w-3.5 h-3.5 text-amber-300" />
                <span>{t('Find My Location')}</span>
              </button>
              <button
                type="button"
                id="btn-banner-voice-prompt"
                onClick={() => setIsVoiceModalOpen(true)}
                className="px-3.5 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-bold text-xs cursor-pointer flex items-center gap-1"
              >
                <Mic className="w-3.5 h-3.5 text-teal-700" />
                <span>{t('Voice Search')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOW ACCURACY WARNING BANNER */}
      {userLocation && locationAccuracy !== null && locationAccuracy > 300 && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{t(`Your location accuracy is low (±${Math.round(locationAccuracy)} m). Move to an open area and try again.`)}</span>
          </div>
          <button
            type="button"
            onClick={handleLocateMe}
            className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg font-bold text-[11px] cursor-pointer"
          >
            {t('Refresh GPS', 'Refresh GPS')}
          </button>
        </div>
      )}

      {/* LOCATION SUCCESS / NOTICE BANNER */}
      {locationSuccessNotice && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs text-emerald-900 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{t(locationSuccessNotice)}</span>
          </div>
          <button
            type="button"
            onClick={() => setLocationSuccessNotice(null)}
            className="text-emerald-700 hover:text-emerald-950 p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* LOCATION ERROR BANNER WITH ACTION BUTTONS */}
      {locationError && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-3 text-xs text-rose-900 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{t(locationError)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-retry-gps-location"
              onClick={handleLocateMe}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t('Try Again')}</span>
            </button>
            <button
              type="button"
              id="btn-search-hospital-manually"
              onClick={() => {
                setLocationError(null);
                const searchInput = document.getElementById('hospital-map-search-input');
                if (searchInput) searchInput.focus();
              }}
              className="px-3 py-1.5 bg-white hover:bg-rose-100 text-rose-900 border border-rose-300 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5 text-rose-700" />
              <span>{t('Search Hospital Manually')}</span>
            </button>
            <button
              type="button"
              onClick={() => setLocationError(null)}
              className="text-rose-700 hover:text-rose-950 p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* MAIN TWO-COLUMN WORKSPACE: LEFT LIST & RIGHT GOOGLE MAP */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        
        {/* LEFT PANEL: SEARCH, FILTERS & LIST (400px fixed width on desktop) */}
        <div className="w-full md:w-[420px] lg:w-[460px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 z-10 shadow-sm overflow-hidden">
          
          {/* SEARCH BOX & FILTERS */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 space-y-2.5 shrink-0">
            
            {/* Search Input Bar */}
            <div className="relative">
              <input
                type="text"
                id="hospital-map-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleManualLocationSearch(searchQuery))}
                placeholder={t('Search city, area, or hospital name...')}
                className="w-full pl-9 pr-24 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500 shadow-2xs"
              />
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
              <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
                <button
                  type="button"
                  id="btn-quick-gps-search"
                  onClick={handleLocateMe}
                  disabled={isLocating}
                  title={t('Detect real device GPS coordinates')}
                  className="p-1 bg-slate-100 dark:bg-slate-700 hover:bg-teal-50 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-100 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer disabled:opacity-50"
                >
                  <LocateFixed className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  id="btn-submit-search-map"
                  onClick={() => handleManualLocationSearch(searchQuery)}
                  disabled={!searchQuery.trim() || isSearching}
                  className="px-2.5 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-[11px] font-bold disabled:opacity-40 cursor-pointer"
                >
                  {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : t('Find')}
                </button>
              </div>
            </div>

            {/* Filter Category Chips & Radius Selector */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  id="filter-all-btn"
                  onClick={() => setSelectedType('all')}
                  className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap cursor-pointer transition-colors ${
                    selectedType === 'all'
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {t(`All Facilities (${facilities.length})`)}
                </button>

                <button
                  type="button"
                  id="filter-hospitals-btn"
                  onClick={() => setSelectedType('hospital')}
                  className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap cursor-pointer transition-colors ${
                    selectedType === 'hospital'
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {t('Hospitals')}
                </button>

                <button
                  type="button"
                  id="filter-clinics-btn"
                  onClick={() => setSelectedType('clinic')}
                  className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap cursor-pointer transition-colors ${
                    selectedType === 'clinic'
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {t('Clinics & PHCs')}
                </button>
              </div>

              {/* Radius Selector Pills */}
              <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-200/60 dark:border-slate-700 text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-semibold text-[10px] uppercase tracking-wider">{t('Search Radius:')}</span>
                <div className="flex items-center gap-1">
                  {[5, 25, 50, 75].map((rKm) => (
                    <button
                      key={rKm}
                      type="button"
                      id={`btn-radius-${rKm}km`}
                      onClick={() => {
                        const targetLat = userLocation?.lat ?? mapCenter.lat;
                        const targetLng = userLocation?.lng ?? mapCenter.lng;
                        if (isValidCoordinate(targetLat, targetLng)) {
                          searchNearbyHealthcare(targetLat, targetLng, rKm * 1000);
                        }
                      }}
                      className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                        searchRadiusKm === rKm
                          ? 'bg-teal-700 text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {t(`${rKm} km`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* DIAGNOSTIC / STATUS BAR */}
          <div className="px-3 py-1.5 bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="truncate font-medium">
                {t(`OpenStreetMap: ${facilities.length} found (${searchRadiusKm} km)`)}
              </span>
            </div>
            <button
              type="button"
              id="btn-toggle-diagnostics"
              onClick={() => setIsDebugPanelOpen(prev => !prev)}
              className="text-[10px] font-bold text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-300 cursor-pointer underline shrink-0"
            >
              {isDebugPanelOpen ? t('Hide Info') : t('Diagnostics')}
            </button>
          </div>

          {/* DIAGNOSTICS EXPANDABLE PANEL */}
          {isDebugPanelOpen && (
            <div className="p-3 bg-slate-900 text-slate-200 text-[11px] font-mono border-b border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between font-bold text-teal-300 pb-1 border-b border-slate-800">
                <span>PIPELINE DIAGNOSTICS</span>
                <span className="text-[10px] text-slate-400">REAL DATA STREAM</span>
              </div>
              <p><span className="text-slate-400">GPS Position:</span> {userLocation ? `${userLocation.lat.toFixed(5)}°, ${userLocation.lng.toFixed(5)}°` : 'Pending / Not set'}</p>
              <p><span className="text-slate-400">Search Radius:</span> {searchRadiusKm} km ({searchRadiusKm * 1000} meters)</p>
              <p><span className="text-slate-400">Active Provider:</span> <span className="text-emerald-400 font-bold">OpenStreetMap (Overpass / Nominatim)</span></p>
              <p><span className="text-slate-400">Facilities Loaded:</span> {facilities.length} verified physical locations</p>
              <p><span className="text-slate-400">Error Status:</span> {searchErrorCode || 'None (Healthy)'}</p>
            </div>
          )}

          {/* ACTIVE ROUTE BANNER (When user requests directions with travel mode selector and refresh) */}
          {activeRouteFacility && (
            <div className="p-3 bg-teal-950 text-white border-b border-teal-800 shrink-0 space-y-2 text-xs shadow-inner">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  <Navigation className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
                  <div className="truncate">
                    <p className="font-bold truncate text-slate-100">{t(`Route to ${activeRouteFacility.name}`)}</p>
                    <p className="text-[11px] text-teal-200">
                      {isRouteLoading 
                        ? t('Calculating road route & ETA...') 
                        : routeErrorMessage 
                          ? t(routeErrorMessage) 
                          : routeInfo 
                            ? t(`${routeInfo.distance} • ${routeInfo.duration}`) 
                            : t('Route ready')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setRouteErrorMessage(null);
                      setRouteRefreshTrigger(prev => prev + 1);
                    }}
                    disabled={isRouteLoading}
                    className="p-1.5 rounded-lg bg-teal-800/80 hover:bg-teal-700 text-teal-100 cursor-pointer disabled:opacity-50 transition-colors"
                    title={t('Refresh live route')}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRouteLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveRouteFacility(null);
                      setRouteInfo(null);
                      setRouteErrorMessage(null);
                    }}
                    className="p-1.5 rounded-lg bg-teal-800/80 hover:bg-teal-700 text-teal-100 cursor-pointer transition-colors"
                    title={t('Clear active route')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Travel Mode Selector Buttons */}
              <div className="flex items-center gap-1.5 pt-1 border-t border-teal-900">
                <span className="text-[10px] uppercase font-bold tracking-wider text-teal-300/80 mr-1">{t('Mode:')}</span>
                
                <button
                  type="button"
                  onClick={() => setRouteTravelMode('ambulance')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    routeTravelMode === 'ambulance'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-teal-900/90 text-teal-200 hover:bg-teal-800'
                  }`}
                >
                  <Siren className="w-3 h-3 text-amber-300" />
                  <span>{t('Ambulance')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRouteTravelMode('car')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    routeTravelMode === 'car'
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'bg-teal-900/90 text-teal-200 hover:bg-teal-800'
                  }`}
                >
                  <Car className="w-3 h-3" />
                  <span>{t('Drive')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRouteTravelMode('walk')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    routeTravelMode === 'walk'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-teal-900/90 text-teal-200 hover:bg-teal-800'
                  }`}
                >
                  <Footprints className="w-3 h-3" />
                  <span>{t('Walk')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRouteTravelMode('transit')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    routeTravelMode === 'transit'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'bg-teal-900/90 text-teal-200 hover:bg-teal-800'
                  }`}
                >
                  <Bus className="w-3 h-3" />
                  <span>{t('Transit')}</span>
                </button>
              </div>
            </div>
          )}

          {/* HOSPITAL CARDS SCROLLABLE LIST */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {isSearching ? (
              <div className="p-8 text-center space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-teal-700 dark:text-teal-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{t('Searching verified medical facilities...')}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('Querying real nearby healthcare registry')}</p>
              </div>
            ) : searchError ? (
              <div className="p-6 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-center space-y-3">
                <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400 mx-auto" />
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{t('OpenStreetMap Search')}</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">{t(searchError)}</p>
                </div>
                
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  {userLocation && (
                    <button
                      type="button"
                      id="btn-retry-hospital-search"
                      onClick={() => searchNearbyHealthcare(userLocation.lat, userLocation.lng, searchRadiusKm * 1000)}
                      className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{t('Retry Search')}</span>
                    </button>
                  )}
                  {searchRadiusKm < 25 && userLocation && (
                    <button
                      type="button"
                      id="btn-expand-radius-25km"
                      onClick={() => searchNearbyHealthcare(userLocation.lat, userLocation.lng, 25000)}
                      className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      {t('Expand to 25 km')}
                    </button>
                  )}
                  {searchRadiusKm < 50 && userLocation && (
                    <button
                      type="button"
                      id="btn-expand-radius-50km"
                      onClick={() => searchNearbyHealthcare(userLocation.lat, userLocation.lng, 50000)}
                      className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      {t('Expand to 50 km')}
                    </button>
                  )}
                  {searchRadiusKm < 75 && userLocation && (
                    <button
                      type="button"
                      id="btn-expand-radius-75km"
                      onClick={() => searchNearbyHealthcare(userLocation.lat, userLocation.lng, 75000)}
                      className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      {t('Expand to 75 km')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleLocateMe}
                    className="px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    {t('Retry GPS Location')}
                  </button>
                </div>
              </div>
            ) : filteredFacilities.length === 0 ? (
              <div className="p-8 text-center space-y-2 text-slate-500 dark:text-slate-400">
                <Building2 className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{t('No facilities matching your filter.')}</p>
                <p className="text-[11px]">{t('Try switching filters or searching another area.')}</p>
              </div>
            ) : (
              filteredFacilities.map((facility, index) => {
                const isSelected = selectedFacility?.id === facility.id;
                const isRouting = activeRouteFacility?.id === facility.id;

                return (
                  <div
                    key={facility.id}
                    id={`facility-card-${index}`}
                    onClick={() => {
                      setSelectedFacility(facility);
                      setInfoWindowFacility(facility);
                      setMapCenter({ lat: facility.lat, lng: facility.lng });
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left relative ${
                      isSelected
                        ? 'bg-teal-50/80 dark:bg-teal-950/50 border-teal-500 dark:border-teal-400 shadow-sm ring-1 ring-teal-500/20'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-2xs'
                    }`}
                  >
                    {/* Header Row: Title & Distance Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-teal-700 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                            {facility.name}
                          </h3>
                        </div>
                        <span className="text-[11px] text-teal-800 dark:text-teal-300 font-semibold mt-0.5 block">
                          {t(facility.typeLabel)}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-block text-xs font-black px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-900/60 text-teal-900 dark:text-teal-200">
                          {facility.distanceKm.toFixed(1)} km
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          {t(`~${facility.travelTimeMins} mins`)}
                        </span>
                      </div>
                    </div>

                    {/* Address */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-2">
                      {facility.address}
                    </p>

                    {/* Emergency Capability Badge */}
                    <div className={`mt-2 flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg border ${
                      facility.isEmergencyVerified 
                        ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                        : 'text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700'
                    }`}>
                      <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${facility.isEmergencyVerified ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`} />
                      <span>{facility.isEmergencyVerified ? t('Emergency capability: Verified') : t('Emergency capability: Not verified')}</span>
                    </div>

                    {/* Card Action Buttons */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        id={`btn-route-to-${facility.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (userLocation) {
                            setActiveRouteFacility(facility);
                            setSelectedFacility(facility);
                          } else {
                            handleLocateMe();
                          }
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                          isRouting
                            ? 'bg-teal-900 dark:bg-teal-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <Navigation className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                        <span>{isRouting ? t('Routing Active') : t('Directions')}</span>
                      </button>

                      <button
                        type="button"
                        id={`btn-book-opd-${facility.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setBookingFacility(facility);
                          setBookingSuccessToken(null);
                          setIsBookingOpen(true);
                        }}
                        className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5 text-amber-300" />
                        <span>{t('Book OPD Token')}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: INTERACTIVE MAP (Leaflet + OpenStreetMap) */}
        <div className="flex-1 min-h-[300px] md:min-h-0 relative isolate overflow-hidden">
          <div className="relative w-full h-full">
            <LeafletHospitalMap
              center={mapCenter && isValidCoordinate(mapCenter.lat, mapCenter.lng) ? mapCenter : { lat: 20.5937, lng: 78.9629 }}
              zoom={Number.isFinite(mapZoom) && mapZoom > 0 ? mapZoom : 13}
              userLocation={userLocation && isValidCoordinate(userLocation.lat, userLocation.lng) ? userLocation : null}
              facilities={filteredFacilities.filter(Boolean).filter(f => f && isValidCoordinate(f.lat, f.lng))}
              selectedFacility={selectedFacility}
              onSelectFacility={(facility) => {
                setSelectedFacility(facility);
              }}
              activeRouteFacility={activeRouteFacility}
              travelMode={routeTravelMode}
              onShowRoute={(facility) => {
                setActiveRouteFacility(facility);
              }}
              onBookToken={(facility) => {
                setBookingFacility(facility);
                setIsBookingOpen(true);
              }}
              getDirectionsUrl={getDirectionsUrl}
            />
          </div>
        </div>
      </div>

      {/* MULTILINGUAL AI VOICE CONTROLLER MODAL */}
      <HospitalVoiceController
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        currentCoords={userLocation}
        onExecuteIntent={handleExecuteVoiceIntent}
      />

      {/* BOOK OPD APPOINTMENT MODAL */}
      {isBookingOpen && bookingFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="font-bold text-sm text-white">{t('Book OPD Consultation Token')}</h3>
                  <p className="text-xs text-teal-100/80">{bookingFacility.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBookingOpen(false)}
                className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/15 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Confirmation or Form */}
            {bookingSuccessToken ? (
              <div className="p-6 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900">{t('OPD Slot Confirmed!')}</h4>
                  <p className="text-xs text-slate-600 mt-1">{t('Your consultation token has been generated.')}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-sm font-black text-teal-800">
                  {t('Token:')} {bookingSuccessToken}
                </div>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsBookingOpen(false);
                      if (onNavigateToKiosk) onNavigateToKiosk();
                    }}
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    {t('Start Pre-Intake at Kiosk →')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBookingOpen(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    {t('Done')}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="p-6 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('Select Department / Specialty')}</label>
                  <select
                    value={bookingDepartment}
                    onChange={(e) => setBookingDepartment(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold"
                  >
                    <option value="General OPD Consultation">{t('General OPD Consultation')}</option>
                    <option value="Emergency Medicine & Triage">{t('Emergency Medicine & Triage')}</option>
                    <option value="Internal Medicine">{t('Internal Medicine')}</option>
                    <option value="Pediatrics & Child Care">{t('Pediatrics & Child Care')}</option>
                    <option value="Cardiology Consultation">{t('Cardiology Consultation')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('Preferred Time Slot')}</label>
                  <select
                    value={bookingSlot}
                    onChange={(e) => setBookingSlot(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold"
                  >
                    <option value="Today Morning (10:00 AM - 11:30 AM)">{t('Today Morning (10:00 AM - 11:30 AM)')}</option>
                    <option value="Today Afternoon (01:00 PM - 03:00 PM)">{t('Today Afternoon (01:00 PM - 03:00 PM)')}</option>
                    <option value="Tomorrow Morning (09:30 AM - 11:30 AM)">{t('Tomorrow Morning (09:30 AM - 11:30 AM)')}</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('Patient Name')}</label>
                    <input
                      type="text"
                      required
                      value={bookingName}
                      onChange={(e) => setBookingName(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('Mobile Number')}</label>
                    <input
                      type="tel"
                      required
                      value={bookingPhone}
                      onChange={(e) => setBookingPhone(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('ABHA Health ID (Optional)')}</label>
                  <input
                    type="text"
                    value={bookingAbha}
                    onChange={(e) => setBookingAbha(e.target.value)}
                    placeholder="e.g. 91-4829-1029-4821 or name@abdm"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBookingOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    {t('Cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t('Confirm Token')}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* SOS AMBULANCE DISPATCH MODAL */}
      <BookAmbulanceModal
        isOpen={isAmbulanceModalOpen}
        onClose={() => setIsAmbulanceModalOpen(false)}
        patient={activePatient}
        initialCoords={userLocation}
        initialAddress={locationName}
        onBookingConfirmed={(booking) => {
          setDispatchedAmbulance({
            id: booking.id,
            vehicleNumber: booking.vehicle_number,
            driverName: booking.driver_name,
            driverPhone: booking.driver_phone,
            type: 'ALS',
            typeLabel: 'Advanced Life Support (ALS)',
            status: 'dispatched',
            baseHospitalId: 'hosp-1',
            baseHospitalName: booking.destination_hospital,
            lat: userLocation?.lat || 22.5726,
            lng: userLocation?.lng || 88.3639,
            currentEtaMins: booking.eta_minutes,
            equipment: ['Ventilator', 'Defibrillator', 'Multi-param Monitor', 'Oxygen']
          });
          setAmbulanceEta(booking.eta_minutes);
          setAmbulanceProgress(15);
        }}
      />
    </div>
  );
};

// Root HospitalLocatorMap component
export const HospitalLocatorMap: React.FC<HospitalLocatorMapProps> = (props) => {
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  return (
    <HospitalLocatorMapContent {...props} apiKey={GOOGLE_MAPS_API_KEY} />
  );
};
