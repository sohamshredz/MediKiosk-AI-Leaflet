import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LeafletAmbulanceMap } from '../map/LeafletAmbulanceMap';
import { 
  X, 
  Siren, 
  MapPin, 
  Navigation, 
  Phone, 
  Clock, 
  Check, 
  Building2, 
  AlertTriangle, 
  Sparkles, 
  HeartPulse, 
  Baby, 
  Activity, 
  ArrowRight, 
  RefreshCw, 
  Search, 
  ShieldCheck, 
  Car, 
  Footprints, 
  Bus, 
  ChevronDown, 
  ChevronUp,
  User
} from 'lucide-react';
import { PatientProfile } from '../../types';
import { AmbulanceBookingRecord, saveAmbulanceBookingToSupabase } from '../../utils/supabaseClient';
import { 
  CalculatedRouteResult, 
  progressiveNearbyHospitalSearch, 
  rankHospitalsForEmergency,
  calculateHaversineDistanceKm 
} from '../../services/locationService';

export interface EmergencyHospital {
  id: string;
  name: string;
  type?: 'hospital' | 'clinic' | 'phc' | 'health_centre';
  typeLabel?: string;
  isHospital?: boolean;
  isSpecialtyClinic?: boolean;
  isEmergencyVerified?: boolean;
  specialty?: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  roadDistanceKm?: number;
  roadDurationMins?: number;
  travelTimeMins?: number;
  emergencyAvailable: string;
  icuAvailable?: string;
  phone?: string;
  googleMapsURI?: string;
  source: 'live_places_api' | 'manual_search' | 'demo_synthetic' | 'openstreetmap' | 'national_health_network';
}

export type AmbulanceTier = 'basic' | 'advanced' | 'neonatal';

export interface BookAmbulanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: PatientProfile;
  initialCoords?: { lat: number; lng: number };
  initialAddress?: string;
  onBookingConfirmed?: (record: AmbulanceBookingRecord) => void;
}

interface TierOption {
  id: AmbulanceTier;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  fare: number;
  eta: number;
  features: string[];
  recommendedFor: string;
}

const AMBULANCE_TIERS: TierOption[] = [
  {
    id: 'basic',
    title: 'Basic Life Support (BLS)',
    subtitle: 'Standard Emergency Transport',
    icon: Activity,
    fare: 850,
    eta: 8,
    features: ['Oxygen Support', 'First Aid & Splints', 'EMT Paramedic', 'Stretcher & Wheelchair'],
    recommendedFor: 'Non-critical transfers, fractures, post-op mobility'
  },
  {
    id: 'advanced',
    title: 'Advanced Cardiac (ACLS)',
    subtitle: 'ICU on Wheels with Ventilator',
    icon: HeartPulse,
    fare: 1850,
    eta: 6,
    features: ['Portable Ventilator', 'Multi-param Monitor / ECG', 'Defibrillator', 'Emergency Physician / Paramedic'],
    recommendedFor: 'Chest pain, stroke, severe trauma, hypoxia'
  },
  {
    id: 'neonatal',
    title: 'Neonatal / Pediatric (NICU)',
    subtitle: 'Incubator & Specialized Pediatric Team',
    icon: Baby,
    fare: 2200,
    eta: 10,
    features: ['Transport Incubator', 'Pediatric Ventilator', 'Infusion Pumps', 'NICU Specialist Nurse'],
    recommendedFor: 'Infants, preterm newborns, pediatric respiratory distress'
  }
];

export const BookAmbulanceModal: React.FC<BookAmbulanceModalProps> = ({
  isOpen,
  onClose,
  patient,
  initialCoords,
  initialAddress,
  onBookingConfirmed
}) => {
  // 1. Booking Form State
  const [selectedTier, setSelectedTier] = useState<AmbulanceTier>('advanced');

  // 2. Real GPS State
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pickupAddress, setPickupAddress] = useState<string>('Detecting current GPS location...');
  const [pickupLocality, setPickupLocality] = useState<string | null>(null);
  const [pickupAccuracy, setPickupAccuracy] = useState<number | null>(null);
  const [lastLocationUpdate, setLastLocationUpdate] = useState<Date | null>(null);
  const [showLocationDetails, setShowLocationDetails] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // 3. Dynamic Nearby Hospital Discovery State (Genuine hospitals only, with adjustable search radius)
  const [hospitals, setHospitals] = useState<EmergencyHospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');
  const [isSearchingHospitals, setIsSearchingHospitals] = useState<boolean>(false);
  const [hospitalSearchError, setHospitalSearchError] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(5000);
  const [selectedRadius, setSelectedRadius] = useState<number>(5000);
  const [hasNoResults, setHasNoResults] = useState<boolean>(false);

  // 4. Manual Hospital Search State
  const [showManualSearch, setShowManualSearch] = useState<boolean>(false);
  const [manualQuery, setManualQuery] = useState<string>('');
  const [isManualSearching, setIsManualSearching] = useState<boolean>(false);
  const [manualSearchError, setManualSearchError] = useState<string | null>(null);

  // 5. Live Travel Modes & Routing State
  const [travelMode, setTravelMode] = useState<'ambulance' | 'car' | 'walk' | 'transit'>('ambulance');
  const [routeStatus, setRouteStatus] = useState<'idle' | 'calculating' | 'available' | 'unavailable'>('idle');
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeDistanceText, setRouteDistanceText] = useState<string | null>(null);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const [routeDurationText, setRouteDurationText] = useState<string | null>(null);
  const [routeDurationMinutes, setRouteDurationMinutes] = useState<number | null>(null);
  const [estimatedArrivalTime, setEstimatedArrivalTime] = useState<string | null>(null);
  const [routeRetryTrigger, setRouteRetryTrigger] = useState<number>(0);

  // 6. Patient / Triage details (With dedicated Patient Name)
  const [patientName, setPatientName] = useState<string>(patient?.name || '');
  const [isCriticalCase, setIsCriticalCase] = useState<boolean>(true);
  const [conditionNotes, setConditionNotes] = useState<string>('Acute breathing difficulty, severe chest tightness, vitals unstable.');
  const [patientPhone, setPatientPhone] = useState<string>(patient?.mobile || '+91 98765 43210');

  // Keep patient profile synced if prop updates
  useEffect(() => {
    if (patient?.name && !patientName) {
      setPatientName(patient.name);
    }
  }, [patient?.name]);

  useEffect(() => {
    if (patient?.mobile && !patientPhone) {
      setPatientPhone(patient.mobile);
    }
  }, [patient?.mobile]);

  // 7. Tracking Screen State
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [bookingRecord, setBookingRecord] = useState<AmbulanceBookingRecord | null>(null);
  const [trackingStep, setTrackingStep] = useState<number>(1);
  const [remainingMinutes, setRemainingMinutes] = useState<number>(6);
  const [syncStatus, setSyncStatus] = useState<string>('Connecting to Supabase...');

  // Genuine Hospital Fetcher (starting with nearest genuine hospitals like Peoples Meditreat, then expanding radius)
  const fetchNearbyHospitals = useCallback(async (lat: number, lng: number, customRadius?: number) => {
    setIsSearchingHospitals(true);
    setHospitalSearchError(null);
    setHasNoResults(false);

    const radiusToQuery = customRadius || selectedRadius;

    try {
      // hospitalsOnly: true guarantees non-hospital facilities (path labs, optical, dental, distributor shops) are excluded
      const result = await progressiveNearbyHospitalSearch(lat, lng, radiusToQuery, { hospitalsOnly: true });

      if (result.success && Array.isArray(result.hospitals) && result.hospitals.length > 0) {
        // Enforce strict emergency ranking: True multi-specialty / general hospitals first, verified emergency first, shortest road ETA
        const hospitalList = rankHospitalsForEmergency(result.hospitals as EmergencyHospital[]);

        setHospitals(hospitalList);
        const resolvedRadius = result.searchRadiusMeters || radiusToQuery;
        setSearchRadius(resolvedRadius);
        setSelectedRadius(resolvedRadius);
        setHasNoResults(false);

        if (hospitalList.length > 0) {
          setSelectedHospitalId(prev => {
            const exists = hospitalList.some(h => h.id === prev);
            return exists ? prev : hospitalList[0].id;
          });
        }
      } else {
        setHospitals([]);
        setHasNoResults(true);
        setHospitalSearchError(result.message || `No suitable emergency hospital found within ${Math.round(radiusToQuery / 1000)} km.`);
      }
    } catch (err: any) {
      console.warn('Nearby hospital search error:', err);
      setHospitalSearchError('Nearby hospital search is temporarily unavailable.');
    } finally {
      setIsSearchingHospitals(false);
    }
  }, [selectedRadius]);

  const handleSelectRadius = (r: number) => {
    setSelectedRadius(r);
    setSearchRadius(r);
    if (pickupCoords) {
      fetchNearbyHospitals(pickupCoords.lat, pickupCoords.lng, r);
    }
  };

  const handleIncreaseRadius = () => {
    const nextRadius = searchRadius < 25000 ? 25000 : searchRadius < 50000 ? 50000 : 75000;
    setSelectedRadius(nextRadius);
    setSearchRadius(nextRadius);
    if (pickupCoords) {
      fetchNearbyHospitals(pickupCoords.lat, pickupCoords.lng, nextRadius);
    }
  };

  // Geolocation fetcher using real browser GPS
  const fetchRealLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationError('Location permission is required to find nearby emergency hospitals.');
      setIsLocating(false);
      setPickupCoords(null);
      setPickupLocality('Location permission not supported or unavailable.');
      setPickupAddress('Location permission not supported or unavailable.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);
    setPickupAddress('Detecting current GPS location...');
    setPickupLocality('Requesting browser GPS position...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy || 15;
        const coords = { lat, lng };

        setPickupCoords(coords);
        setPickupAccuracy(accuracy);
        setLastLocationUpdate(new Date());
        setPickupAddress(`Current GPS Location (${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E)`);
        setLocationError(null);
        setRouteStatus('calculating');
        setRouteError(null);
        setIsLocating(false);

        // Fetch progressive nearby hospitals around these coordinates
        fetchNearbyHospitals(lat, lng);

        // Reverse geocode locality name asynchronously
        fetch('/api/geocode/reverse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng })
        })
          .then(res => res.json())
          .then(data => {
            if (data.success && (data.displayName || data.location?.displayName)) {
              const localityName = data.displayName || data.location?.displayName || '';
              setPickupLocality(localityName);
              setPickupAddress(`${localityName} (GPS: ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`);
            } else {
              setPickupLocality(`GPS (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`);
            }
          })
          .catch(err => {
            console.warn('Reverse geocode in SOS notice:', err);
            setPickupLocality(`GPS (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`);
          });
      },
      (error) => {
        console.warn('Emergency SOS Geolocation permission/access error:', error);
        let msg = 'Location permission is required to find nearby emergency hospitals.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please allow location access in your browser.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'GPS location is currently unavailable.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Please try again.';
        }
        setLocationError(msg);
        setPickupCoords(null);
        setPickupAccuracy(null);
        setPickupLocality('Location access denied or unavailable.');
        setPickupAddress('Location permission denied or unavailable.');
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  }, [fetchNearbyHospitals]);

  // When modal is opened, initialize and detect location
  useEffect(() => {
    if (isOpen) {
      setIsConfirmed(false);
      setBookingRecord(null);
      setTrackingStep(1);
      setRouteDistanceText(null);
      setRouteDurationText(null);
      setRouteStatus('calculating');
      setRouteError(null);
      setShowManualSearch(false);
      setTravelMode('ambulance');

      if (initialCoords && typeof initialCoords.lat === 'number' && typeof initialCoords.lng === 'number') {
        setPickupCoords(initialCoords);
        setPickupAccuracy(18);
        setLastLocationUpdate(new Date());
        setPickupAddress(initialAddress || `Current GPS Location (${initialCoords.lat.toFixed(5)}° N, ${initialCoords.lng.toFixed(5)}° E)`);
        setPickupLocality(initialAddress || 'Current GPS Location');
        fetchNearbyHospitals(initialCoords.lat, initialCoords.lng);
      } else {
        fetchRealLocation();
      }
    }
  }, [isOpen, initialCoords, initialAddress, fetchRealLocation, fetchNearbyHospitals]);

  // Selected Hospital object
  const selectedHospital: EmergencyHospital | null = useMemo(() => {
    if (hospitals.length === 0) return null;
    return hospitals.find(h => h.id === selectedHospitalId) || hospitals[0];
  }, [hospitals, selectedHospitalId]);

  // Count of hospitals under 1km for clear user confirmation
  const hospitalsUnder1KmCount = useMemo(() => {
    return hospitals.filter(h => typeof h.distanceKm === 'number' && h.distanceKm < 1.0).length;
  }, [hospitals]);

  // Route calculation callbacks
  const handleRouteCalculated = useCallback((data: CalculatedRouteResult) => {
    setRouteStatus('available');
    setRouteError(null);
    setRouteDistanceText(data.distanceText);
    setRouteDistanceKm(data.distanceKm);
    setRouteDurationText(data.durationText);
    setRouteDurationMinutes(data.durationMinutes);

    const durSec = data.durationSeconds || (data.durationMinutes * 60) || 360;
    const arrivalTime = new Date(Date.now() + durSec * 1000);
    setEstimatedArrivalTime(arrivalTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
  }, []);

  const handleRouteError = useCallback((errorMsg: string) => {
    setRouteStatus('unavailable');
    setRouteError(errorMsg || 'Unable to calculate a route right now.');
    setRouteDistanceText(null);
    setRouteDurationText(null);
    setEstimatedArrivalTime(null);
  }, []);

  const handleTravelModeChange = (mode: 'ambulance' | 'car' | 'walk' | 'transit') => {
    if (mode === travelMode) return;
    setTravelMode(mode);
    setRouteStatus('calculating');
    setRouteError(null);
  };

  const handleRetryRoute = () => {
    setRouteStatus('calculating');
    setRouteError(null);
    setRouteRetryTrigger(prev => prev + 1);
  };

  const handleHospitalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHospitalId = e.target.value;
    setSelectedHospitalId(newHospitalId);
    setRouteStatus('calculating');
    setRouteError(null);
    setRouteDistanceText(null);
    setRouteDurationText(null);
  };

  // Manual hospital search
  const handleExecuteManualSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualQuery.trim()) return;

    setIsManualSearching(true);
    setManualSearchError(null);

    try {
      const response = await fetch('/api/hospitals/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: manualQuery.trim(),
          lat: pickupCoords?.lat,
          lng: pickupCoords?.lng
        })
      });

      if (!response.ok) throw new Error(`Search failed: ${response.status}`);
      const data = await response.json();

      if (data.success && Array.isArray(data.hospitals) && data.hospitals.length > 0) {
        const rawManual = data.hospitals.map((h: any) => {
          const dist = (pickupCoords && typeof h.latitude === 'number' && typeof h.longitude === 'number')
            ? calculateHaversineDistanceKm(pickupCoords.lat, pickupCoords.lng, h.latitude, h.longitude)
            : (h.distanceKm || 0);
          return {
            ...h,
            distanceKm: dist
          };
        });

        // Merge manual candidates with existing candidates and recalculate distances
        const mergedMap = new Map<string, EmergencyHospital>();
        for (const h of rawManual) {
          mergedMap.set(h.id, h);
        }
        for (const prevH of hospitals) {
          if (!mergedMap.has(prevH.id)) {
            const prevDist = (pickupCoords && typeof prevH.latitude === 'number' && typeof prevH.longitude === 'number')
              ? calculateHaversineDistanceKm(pickupCoords.lat, pickupCoords.lng, prevH.latitude, prevH.longitude)
              : prevH.distanceKm;
            mergedMap.set(prevH.id, {
              ...prevH,
              distanceKm: prevDist
            });
          }
        }

        const rankedList = rankHospitalsForEmergency(Array.from(mergedMap.values()));
        setHospitals(rankedList);
        if (rankedList.length > 0) {
          setSelectedHospitalId(rankedList[0].id);
        }
        setHasNoResults(false);
        setHospitalSearchError(null);
      } else {
        setManualSearchError(`No hospital facilities found matching "${manualQuery}".`);
      }
    } catch (err: any) {
      setManualSearchError(err?.message || 'Manual hospital search failed.');
    } finally {
      setIsManualSearching(false);
    }
  };

  // Booking submission
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pickupCoords) {
      setLocationError('Location permission is required to find nearby emergency hospitals and dispatch ambulance.');
      return;
    }

    if (!selectedHospital) {
      setHospitalSearchError('Please select a destination emergency hospital.');
      return;
    }

    const activeTierConfig = AMBULANCE_TIERS.find(t => t.id === selectedTier) || AMBULANCE_TIERS[1];
    const bookingId = `AMB-${Math.floor(100000 + Math.random() * 900000)}`;

    const newRecord: AmbulanceBookingRecord = {
      id: `amb-rec-${Date.now()}`,
      booking_id: bookingId,
      patient_name: patientName.trim() || patient?.name || 'Emergency Patient',
      patient_phone: patientPhone,
      pickup_address: pickupAddress,
      pickup_lat: pickupCoords.lat,
      pickup_lng: pickupCoords.lng,
      pickupLocation: {
        latitude: pickupCoords.lat,
        longitude: pickupCoords.lng
      },
      destination_hospital: `${selectedHospital.name} (${selectedHospital.address})`,
      destinationHospital: selectedHospital as any,
      ambulance_tier: selectedTier,
      fare_inr: activeTierConfig.fare,
      eta_minutes: routeDurationMinutes ? routeDurationMinutes : activeTierConfig.eta,
      is_critical: isCriticalCase,
      condition_notes: conditionNotes,
      driver_name: 'Paramedic Vikram Singh',
      driver_phone: '+91 94123 78901',
      vehicle_number: 'DL-01-EQ-9112',
      status: 'booked',
      created_at: new Date().toISOString()
    };

    setBookingRecord(newRecord);
    setIsConfirmed(true);
    setRemainingMinutes(routeDurationMinutes ? routeDurationMinutes : activeTierConfig.eta);
    setTrackingStep(1);

    setSyncStatus('Saving to Supabase Database...');
    const result = await saveAmbulanceBookingToSupabase(newRecord);
    if (result.success) {
      setSyncStatus('Synced with Supabase Cloud backend.');
    }

    if (onBookingConfirmed) {
      onBookingConfirmed(newRecord);
    }
  };

  // Stepper progression for tracking screen
  useEffect(() => {
    if (!isConfirmed) return;

    const timer1 = setTimeout(() => setTrackingStep(2), 2500);
    const timer2 = setTimeout(() => {
      setTrackingStep(3);
      setRemainingMinutes(prev => Math.max(prev - 2, 2));
    }, 6000);
    const timer3 = setTimeout(() => {
      setTrackingStep(4);
      setRemainingMinutes(0);
    }, 15000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isConfirmed]);

  if (!isOpen) return null;

  const currentTierObj = AMBULANCE_TIERS.find(t => t.id === selectedTier) || AMBULANCE_TIERS[1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md text-teal-200 flex items-center justify-center shadow-inner">
              <Siren className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">
                  Emergency Ambulance Dispatch
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 uppercase tracking-wide">
                  GPS Live
                </span>
              </div>
              <p className="text-xs text-teal-100/80">
                Rapid SOS dispatch with dynamic nearby emergency hospital search & live routing
              </p>
            </div>
          </div>

          <button
            type="button"
            id="close-sos-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL CONTENT */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 bg-slate-50">
          {!isConfirmed ? (
            <form onSubmit={handleConfirmBooking} className="space-y-6">
              
              {/* 1. Google Maps & Geolocation + Dynamic Hospital Destination */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                    <MapPin className="w-4 h-4 text-teal-600" />
                    <span>Pickup Location & Destination Hospital</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="refresh-location-btn"
                      onClick={fetchRealLocation}
                      disabled={isLocating}
                      className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold transition-all flex items-center gap-1.5 border border-teal-200 cursor-pointer disabled:opacity-50"
                      title="Request real device GPS location"
                    >
                      <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                      <span>{isLocating ? 'Detecting GPS...' : 'Refresh Location'}</span>
                    </button>

                    <button
                      type="button"
                      id="toggle-manual-search-btn"
                      onClick={() => setShowManualSearch(!showManualSearch)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors flex items-center gap-1 border border-slate-200 cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{showManualSearch ? 'Hide Search' : 'Search Hospital'}</span>
                    </button>
                  </div>
                </div>

                {/* Manual Hospital Search Box */}
                {showManualSearch && (
                  <div className="p-3 bg-slate-100/90 rounded-xl border border-slate-300 space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700">
                        Manual Hospital Search (by Name / Locality)
                      </span>
                      <span className="text-[10px] text-slate-500">Searches hospital registry</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="manual-hospital-search-input"
                        value={manualQuery}
                        onChange={(e) => setManualQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleExecuteManualSearch())}
                        placeholder="e.g. Apollo Hospital, AIIMS, Fortis, Manipal, General Hospital..."
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      />
                      <button
                        type="button"
                        id="exec-manual-search-btn"
                        onClick={() => handleExecuteManualSearch()}
                        disabled={isManualSearching || !manualQuery.trim()}
                        className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                      >
                        <Search className={`w-3.5 h-3.5 ${isManualSearching ? 'animate-spin' : ''}`} />
                        <span>{isManualSearching ? 'Searching...' : 'Find'}</span>
                      </button>
                    </div>
                    {manualSearchError && (
                      <p className="text-[11px] text-red-600 flex items-center gap-1 font-medium">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span>{manualSearchError}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Interactive Leaflet + OpenStreetMap View with Live Route */}
                <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner z-0 isolate">
                  <LeafletAmbulanceMap
                    origin={pickupCoords && Number.isFinite(pickupCoords.lat) && Number.isFinite(pickupCoords.lng) ? pickupCoords : null}
                    destination={selectedHospital && Number.isFinite(selectedHospital.latitude) && Number.isFinite(selectedHospital.longitude) ? { lat: selectedHospital.latitude, lng: selectedHospital.longitude } : null}
                    travelMode={travelMode}
                    destinationName={selectedHospital?.name}
                    onRouteCalculated={handleRouteCalculated}
                    onRouteError={handleRouteError}
                    onLoading={(loading) => {
                      if (loading) setRouteStatus('calculating');
                    }}
                    retryTrigger={routeRetryTrigger}
                  />

                  {/* Map Overlay Badges */}
                  {isLocating ? (
                    <div className="absolute top-2 left-2 px-2.5 py-1.5 rounded-lg bg-slate-900/90 text-white text-[11px] font-medium backdrop-blur-xs flex items-center gap-1.5 shadow-sm border border-slate-700 pointer-events-none z-[400]">
                      <Navigation className="w-3.5 h-3.5 text-teal-400 animate-spin" />
                      <span>Detecting GPS location...</span>
                    </div>
                  ) : locationError && !pickupCoords ? (
                    <div className="absolute top-2 left-2 px-2.5 py-1.5 rounded-lg bg-red-950/90 text-red-200 text-[11px] font-medium backdrop-blur-xs flex items-center gap-1.5 shadow-sm border border-red-800 pointer-events-none z-[400]">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span>{locationError}</span>
                    </div>
                  ) : pickupCoords ? (
                    <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-slate-900/85 text-white text-[10px] font-medium backdrop-blur-xs flex items-center gap-1.5 shadow-sm border border-slate-700/60 pointer-events-none z-[400]">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>Live GPS Connected</span>
                    </div>
                  ) : null}

                  {pickupCoords && selectedHospital && (
                    <div className="absolute bottom-2 right-2 px-3 py-1.5 rounded-lg bg-slate-900/90 text-white text-[11px] font-bold backdrop-blur-xs flex items-center gap-2 shadow-sm border border-slate-700 pointer-events-none z-[400]">
                      {routeStatus === 'calculating' ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                          <span className="text-amber-200">Calculating route...</span>
                        </>
                      ) : routeStatus === 'unavailable' ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                          <span className="text-red-200">{routeError || 'ETA unavailable'}</span>
                        </>
                      ) : (
                        <>
                          <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                          <span>
                            {routeDistanceText ? `Road: ${routeDistanceText}` : `${typeof selectedHospital.distanceKm === 'number' ? selectedHospital.distanceKm.toFixed(1) : ''} km away`}
                            {' • '}
                            <span className="text-emerald-300">{routeDurationText || 'Calculated'}</span>
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Structured Information Architecture Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  
                  {/* CARD 1: PICKUP LOCATION */}
                  <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200/90 shadow-2xs space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                          <span>Current Location</span>
                        </span>
                        {pickupAccuracy !== null && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                            GPS accuracy: ±{Math.round(pickupAccuracy)} m
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs font-semibold text-slate-900 line-clamp-2">
                        {pickupLocality || pickupAddress || 'Detecting locality...'}
                      </p>
                      
                      {locationError && !pickupCoords && (
                        <div className="mt-1.5 flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-red-600 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
                            <span>{locationError}</span>
                          </span>
                          <button
                            type="button"
                            onClick={fetchRealLocation}
                            className="text-teal-700 font-bold hover:underline cursor-pointer ml-2 shrink-0"
                          >
                            Allow GPS
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Secondary Location Details Accordion */}
                    <div className="pt-2 border-t border-slate-200/70">
                      <button
                        type="button"
                        id="toggle-location-details-btn"
                        onClick={() => setShowLocationDetails(!showLocationDetails)}
                        className="text-[11px] font-medium text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>{showLocationDetails ? 'Hide Location Details' : 'Show Location Details'}</span>
                        {showLocationDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {showLocationDetails && (
                        <div className="mt-2 p-2.5 bg-white rounded-lg border border-slate-200 text-[10px] space-y-1 text-slate-600 animate-in fade-in duration-100">
                          <div className="flex justify-between">
                            <span className="font-medium text-slate-500">Coordinates:</span>
                            <span className="font-mono font-bold text-slate-800">
                              {pickupCoords ? `${pickupCoords.lat.toFixed(5)}° N, ${pickupCoords.lng.toFixed(5)}° E` : 'Unavailable'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-slate-500">Accuracy Radius:</span>
                            <span className="font-semibold text-slate-800">
                              {pickupAccuracy ? `±${Math.round(pickupAccuracy)} meters` : 'High accuracy'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-slate-500">Last Synced:</span>
                            <span className="text-slate-800">
                              {lastLocationUpdate ? lastLocationUpdate.toLocaleTimeString() : 'Just now'}
                            </span>
                          </div>
                          <div className="pt-1.5">
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                              Custom Landmark / House Note:
                            </label>
                            <input
                              type="text"
                              value={pickupAddress}
                              onChange={(e) => setPickupAddress(e.target.value)}
                              placeholder="Add flat no, gate, or landmark"
                              className="w-full px-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CARD 2: DESTINATION HOSPITAL */}
                  <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200/90 shadow-2xs space-y-2.5 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <label 
                            htmlFor="destination-hospital-dropdown" 
                            className="text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Building2 className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>Destination Hospital</span>
                          </label>
                          <button
                            type="button"
                            id="btn-refresh-destination-hospitals"
                            onClick={() => {
                              if (pickupCoords) {
                                fetchNearbyHospitals(pickupCoords.lat, pickupCoords.lng);
                              } else {
                                fetchRealLocation();
                              }
                            }}
                            title="Re-scan nearest hospitals"
                            className="p-1 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isSearchingHospitals ? 'animate-spin text-teal-600' : ''}`} />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-300">
                            Nearest Hospitals Only
                          </span>
                          {hospitalsUnder1KmCount > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                              {hospitalsUnder1KmCount} &lt; 1 km
                            </span>
                          )}
                          {selectedHospital && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              selectedHospital.isEmergencyVerified 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {selectedHospital.isEmergencyVerified ? 'Emergency: Verified' : 'Emergency: Not verified'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Dynamic Radius Selector & Increase Radius Control */}
                      <div className="flex items-center justify-between gap-1 p-2 bg-white rounded-lg border border-slate-200 text-[11px] flex-wrap">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500 font-medium">Search Radius:</span>
                          <span className="font-bold text-teal-800">{searchRadius >= 1000 ? `${searchRadius / 1000} km` : `${searchRadius} m`}</span>
                        </div>

                        <div className="flex items-center gap-1 flex-wrap">
                          {[5000, 25000, 50000, 75000].map(r => (
                            <button
                              key={r}
                              type="button"
                              id={`btn-amb-radius-${r / 1000}km`}
                              onClick={() => handleSelectRadius(r)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                searchRadius === r
                                  ? 'bg-teal-700 text-white shadow-xs'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {r / 1000} km
                            </button>
                          ))}
                          <button
                            type="button"
                            id="btn-increase-radius"
                            onClick={handleIncreaseRadius}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-all cursor-pointer flex items-center gap-0.5"
                            title="Expand search radius to discover more hospitals"
                          >
                            <span>+ Increase Radius</span>
                          </button>
                        </div>
                      </div>

                      <select
                        id="destination-hospital-dropdown"
                        name="destination_hospital"
                        value={selectedHospitalId}
                        onChange={handleHospitalChange}
                        disabled={isSearchingHospitals || hospitals.length === 0}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white text-slate-900 font-semibold cursor-pointer shadow-2xs hover:border-slate-400 block disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSearchingHospitals ? (
                          <option value="">Finding nearest genuine emergency hospitals...</option>
                        ) : hospitals.length === 0 ? (
                          <option value="">
                            {locationError ? 'Enable location to load nearby hospitals' : 'No nearby emergency hospitals found'}
                          </option>
                        ) : (
                          hospitals.map((hosp, idx) => {
                            const isNearerThan1Km = typeof hosp.distanceKm === 'number' && hosp.distanceKm < 1.0;
                            const distText = typeof hosp.distanceKm === 'number'
                              ? (isNearerThan1Km
                                  ? `${Math.round(hosp.distanceKm * 1000)}m (${hosp.distanceKm.toFixed(2)} km)`
                                  : `${hosp.distanceKm.toFixed(1)} km`)
                              : 'Nearby';
                            const emergencyText = hosp.isEmergencyVerified ? 'Verified' : 'Unverified';
                            return (
                              <option key={hosp.id} value={hosp.id} className="py-1 text-slate-900 bg-white">
                                {idx + 1}. {hosp.name} — {distText} {isNearerThan1Km ? '★ NEAREST (< 1 km)' : ''} [{hosp.typeLabel || 'Hospital'}]
                              </option>
                            );
                          })
                        )}
                      </select>

                      {/* Quick Hospital Tags for Instant 1-Click Pick */}
                      {hospitals.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          <span className="text-[10px] font-bold text-slate-500">Quick Pick:</span>
                          {hospitals.slice(0, 4).map((h) => {
                            const isSelected = h.id === selectedHospitalId;
                            const isUnder1Km = typeof h.distanceKm === 'number' && h.distanceKm < 1.0;
                            return (
                              <button
                                key={h.id}
                                type="button"
                                onClick={() => {
                                  setSelectedHospitalId(h.id);
                                  setRouteStatus('calculating');
                                  setRouteError(null);
                                }}
                                className={`px-2 py-0.5 rounded-md text-[10px] transition-all cursor-pointer flex items-center gap-1 ${
                                  isSelected
                                    ? 'bg-teal-700 text-white font-bold shadow-xs'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {isUnder1Km && <span className="text-amber-300 font-bold">★</span>}
                                <span className="truncate max-w-[130px]">{h.name.split(',')[0]}</span>
                                <span className="opacity-75 text-[9px]">({typeof h.distanceKm === 'number' ? `${h.distanceKm.toFixed(1)}k` : ''})</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {selectedHospital && (
                        <div className="mt-1.5 space-y-0.5">
                          <p className="text-[11px] text-slate-600 truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{selectedHospital.address}</span>
                          </p>
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 flex-wrap gap-1">
                            <span className="flex items-center gap-1.5">
                              <span>Distance:</span>{' '}
                              <span className={typeof selectedHospital.distanceKm === 'number' && selectedHospital.distanceKm < 1.0 ? 'text-emerald-700 font-black' : 'text-slate-800 font-bold'}>
                                {typeof selectedHospital.distanceKm === 'number'
                                  ? (selectedHospital.distanceKm < 1.0
                                      ? `${Math.round(selectedHospital.distanceKm * 1000)} meters away (${selectedHospital.distanceKm.toFixed(2)} km)`
                                      : `${selectedHospital.distanceKm.toFixed(1)} km away`)
                                  : 'Nearby'}
                              </span>
                              {typeof selectedHospital.distanceKm === 'number' && selectedHospital.distanceKm < 1.0 && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-emerald-200 text-emerald-900 rounded">
                                  &lt; 1 km Nearest
                                </span>
                              )}
                            </span>
                            {routeDistanceText && routeStatus === 'available' && (
                              <span className="text-teal-700 font-bold">
                                Road: {routeDistanceText}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Search Failure / Expand Controls */}
                    {hasNoResults && !isSearchingHospitals && (
                      <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1.5">
                        <div className="flex items-center gap-1 font-bold">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>No genuine emergency hospital found within {searchRadius / 1000} km.</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={handleIncreaseRadius}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded cursor-pointer"
                          >
                            Expand Radius ({searchRadius < 25000 ? '25 km' : searchRadius < 50000 ? '50 km' : '75 km'})
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowManualSearch(true)}
                            className="px-2.5 py-1 bg-teal-700 hover:bg-teal-800 text-white text-[10px] font-bold rounded cursor-pointer"
                          >
                            Search by Hospital Name
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* CARD 3: ESTIMATED ARRIVAL & TRAVEL MODE CONTROLS */}
                <div className="bg-gradient-to-br from-teal-900 via-slate-900 to-slate-950 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-teal-800/40 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-400" />
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
                          Estimated Arrival & Live Routing
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                            {routeStatus === 'calculating' ? (
                              <span className="text-amber-300 text-xl font-bold flex items-center gap-2">
                                <RefreshCw className="w-4 h-4 animate-spin" /> Calculating ETA...
                              </span>
                            ) : routeStatus === 'unavailable' ? (
                              <span className="text-red-400 text-xl font-bold">ETA Unavailable</span>
                            ) : (
                              routeDurationText || 'Calculated'
                            )}
                          </span>
                          {estimatedArrivalTime && routeStatus === 'available' && (
                            <span className="text-xs font-medium text-teal-200/90">
                              (Est. Arrival ~ {estimatedArrivalTime})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Route Status Badge */}
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-xs">
                      {routeStatus === 'available' ? (
                        <div className="flex items-center gap-1.5 text-emerald-300 bg-emerald-950/60 border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          <span>Route calculated</span>
                        </div>
                      ) : routeStatus === 'calculating' ? (
                        <div className="flex items-center gap-1.5 text-amber-300 bg-amber-950/60 border-amber-500/40 px-2.5 py-0.5 rounded-full">
                          <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
                          <span>Calculating route...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-rose-300 bg-rose-950/60 border-rose-500/40 px-2.5 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          <span>Route unavailable</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Route Error Notification with Retry */}
                  {routeStatus === 'unavailable' && (
                    <div className="p-3 bg-red-950/80 border border-red-700/60 rounded-xl text-red-200 text-xs space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                        <span className="font-semibold">{routeError || 'Unable to calculate a route right now.'}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          id="retry-route-btn"
                          onClick={handleRetryRoute}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Retry Route</span>
                        </button>
                        <button
                          type="button"
                          id="change-hospital-btn"
                          onClick={() => {
                            const nextIdx = hospitals.findIndex(h => h.id === selectedHospitalId) + 1;
                            if (hospitals[nextIdx]) {
                              setSelectedHospitalId(hospitals[nextIdx].id);
                            } else if (hospitals[0]) {
                              setSelectedHospitalId(hospitals[0].id);
                            }
                          }}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors"
                        >
                          Try Next Hospital
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Travel Mode Toggle Pills */}
                  <div className="pt-2 border-t border-teal-800/60 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-teal-200/80">
                      <span className="font-semibold">Travel Mode:</span>
                      <span className="text-[11px] text-teal-300/60">
                        {travelMode === 'ambulance' ? 'Priority emergency siren' : 'Standard road routing'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-teal-900/60">
                      <button
                        type="button"
                        id="mode-ambulance-btn"
                        onClick={() => handleTravelModeChange('ambulance')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          travelMode === 'ambulance'
                            ? 'bg-amber-500 text-slate-950 shadow-sm ring-2 ring-amber-300/50'
                            : 'text-slate-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Siren className="w-3.5 h-3.5" />
                        <span>Ambulance</span>
                      </button>

                      <button
                        type="button"
                        id="mode-car-btn"
                        onClick={() => handleTravelModeChange('car')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          travelMode === 'car'
                            ? 'bg-teal-600 text-white shadow-sm ring-2 ring-teal-400/50'
                            : 'text-slate-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Car className="w-3.5 h-3.5" />
                        <span>Car</span>
                      </button>

                      <button
                        type="button"
                        id="mode-walk-btn"
                        onClick={() => handleTravelModeChange('walk')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          travelMode === 'walk'
                            ? 'bg-teal-600 text-white shadow-sm ring-2 ring-teal-400/50'
                            : 'text-slate-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Footprints className="w-3.5 h-3.5" />
                        <span>Walk</span>
                      </button>

                      <button
                        type="button"
                        id="mode-transit-btn"
                        onClick={() => handleTravelModeChange('transit')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          travelMode === 'transit'
                            ? 'bg-teal-600 text-white shadow-sm ring-2 ring-teal-400/50'
                            : 'text-slate-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Bus className="w-3.5 h-3.5" />
                        <span>Transit</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Three Ambulance Tiers Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                    <HeartPulse className="w-4 h-4 text-teal-600" />
                    <span>Select Ambulance Tier (Fleet Response)</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    All tiers include GPS live telemetry & hospital pre-alert
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {AMBULANCE_TIERS.map((tier) => {
                    const isSelected = selectedTier === tier.id;
                    const IconComp = tier.icon;

                    return (
                      <div
                        key={tier.id}
                        onClick={() => setSelectedTier(tier.id)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-teal-600 bg-teal-50/60 shadow-md ring-2 ring-teal-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                              isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'
                            }`}>
                              <IconComp className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-slate-900">{tier.title}</h4>
                              <p className="text-[10px] text-slate-500">{tier.subtitle}</p>
                            </div>
                          </div>

                          <div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
                            <span className="text-base font-black text-slate-900">
                              ₹{tier.fare}
                            </span>
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              ETA ~{routeDurationMinutes ? Math.max(2, routeDurationMinutes + (tier.id === 'neonatal' ? 2 : tier.id === 'advanced' ? 1 : 0)) : tier.eta} mins
                            </span>
                          </div>

                          <ul className="space-y-1 pt-1 text-[11px] text-slate-600">
                            {tier.features.map((feat, idx) => (
                              <li key={idx} className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-500 italic">
                          Ideal: {tier.recommendedFor}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Patient Information & Emergency Triage */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-slate-100">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                    <User className="w-4 h-4 text-teal-600" />
                    <span>Patient Details & Emergency Information</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Verified for hospital admission and dispatch unit
                  </span>
                </div>

                {/* Patient Name & Emergency Contact Section */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label htmlFor="patient-full-name" className="text-xs font-bold text-slate-800 flex items-center gap-1 mb-1">
                        <User className="w-3.5 h-3.5 text-teal-600" />
                        <span>Patient Full Name</span>
                        <span className="text-rose-500 font-black">*</span>
                      </label>
                      <input
                        type="text"
                        id="patient-full-name"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white font-medium text-slate-900 shadow-2xs"
                        placeholder="e.g. Rahul Sharma or Patient Name"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Registered with emergency driver and destination hospital
                      </span>
                    </div>

                    <div>
                      <label htmlFor="patient-emergency-phone" className="text-xs font-bold text-slate-800 flex items-center gap-1 mb-1">
                        <Phone className="w-3.5 h-3.5 text-teal-600" />
                        <span>Emergency Contact Phone</span>
                        <span className="text-rose-500 font-black">*</span>
                      </label>
                      <input
                        type="tel"
                        id="patient-emergency-phone"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white font-medium text-slate-900 shadow-2xs"
                        placeholder="+91 98765 43210"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Direct line for paramedic and driver coordination
                      </span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="patient-condition-notes" className="text-xs font-bold text-slate-800 block mb-1">
                      Patient Symptoms & Clinical Notes
                    </label>
                    <input
                      type="text"
                      id="patient-condition-notes"
                      value={conditionNotes}
                      onChange={(e) => setConditionNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white text-slate-900 shadow-2xs"
                      placeholder="e.g. Acute breathing difficulty, severe chest tightness, vitals unstable"
                    />
                  </div>
                </div>

                {/* Critical Emergency Flag Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-amber-950">Critical Emergency Flag</h4>
                      <p className="text-[11px] text-amber-800">
                        Pre-alerts {selectedHospital ? selectedHospital.name.split(',')[0] : 'hospital'} emergency triage department & critical care team
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="critical-emergency-toggle"
                      checked={isCriticalCase}
                      onChange={(e) => setIsCriticalCase(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:width-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>
              </div>

              {/* Submit & Dispatch Button */}
              <div className="pt-2 space-y-2">
                {locationError && !pickupCoords && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span className="font-semibold">We couldn't determine your current location. Please allow location access.</span>
                    </div>
                    <button
                      type="button"
                      onClick={fetchRealLocation}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold shrink-0 cursor-pointer"
                    >
                      Allow Location Access
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  id="confirm-dispatch-ambulance-btn"
                  disabled={isLocating || !pickupCoords || !selectedHospital}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Siren className="w-5 h-5 text-amber-300 animate-pulse" />
                  <span>
                    {isLocating
                      ? 'Detecting current GPS location...'
                      : !pickupCoords
                      ? 'Enable GPS Location to Dispatch SOS'
                      : isSearchingHospitals
                      ? 'Finding nearby emergency hospitals...'
                      : !selectedHospital
                      ? 'Select Destination Hospital to Dispatch'
                      : `Confirm & Dispatch ${currentTierObj.title} to ${selectedHospital.name.split(',')[0]} (₹${currentTierObj.fare})`}
                  </span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>

            </form>
          ) : (
            /* LIVE-TRACKING SCREEN */
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Stepper Header Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded uppercase border border-teal-200">
                      Booking Ref: {bookingRecord?.booking_id}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                      Ambulance Dispatched & En Route
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold">
                    <Clock className="w-4 h-4 text-emerald-600 animate-spin" />
                    <span>ETA: ~{remainingMinutes} Mins</span>
                  </div>
                </div>

                {/* 4-Step Status Stepper */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { step: 1, label: 'Booked', desc: 'Dispatched to Fleet' },
                    { step: 2, label: 'Driver Assigned', desc: 'Paramedic Vikram S.' },
                    { step: 3, label: 'En Route', desc: 'Siren Activated' },
                    { step: 4, label: 'Arrived', desc: 'At Pickup Location' }
                  ].map((s) => {
                    const isDone = trackingStep >= s.step;
                    const isCurrent = trackingStep === s.step;

                    return (
                      <div 
                        key={s.step} 
                        className={`p-3 rounded-2xl border text-center transition-all ${
                          isCurrent
                            ? 'bg-teal-50 border-teal-500 shadow-xs ring-2 ring-teal-500/20'
                            : isDone
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                            : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-full mx-auto flex items-center justify-center font-bold text-xs mb-1.5 ${
                          isDone ? 'bg-teal-600 text-white' : 'bg-slate-300 text-slate-700'
                        }`}>
                          {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : s.step}
                        </div>
                        <div className="font-bold text-xs text-slate-900">{s.label}</div>
                        <div className="text-[10px] text-slate-500">{s.desc}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Live map view during transit (Leaflet + OpenStreetMap) */}
                <div className="relative w-full h-52 sm:h-64 rounded-2xl overflow-hidden border border-slate-200 shadow-inner z-0 isolate">
                  <LeafletAmbulanceMap
                    origin={pickupCoords && Number.isFinite(pickupCoords.lat) && Number.isFinite(pickupCoords.lng) ? pickupCoords : null}
                    destination={selectedHospital && Number.isFinite(selectedHospital.latitude) && Number.isFinite(selectedHospital.longitude) ? { lat: selectedHospital.latitude, lng: selectedHospital.longitude } : null}
                    travelMode={travelMode}
                    destinationName={selectedHospital?.name}
                    isTrackingView={true}
                  />
                  <div className="absolute top-3 left-3 bg-slate-900/90 text-white px-3 py-1.5 rounded-xl text-xs font-mono backdrop-blur-xs flex items-center gap-2 pointer-events-none z-[400]">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>Live GPS Telemetry Active • Route to {selectedHospital ? selectedHospital.name.split(',')[0] : 'Destination'}</span>
                  </div>
                </div>
              </div>

              {/* Patient & Triage Summary Card */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 mb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Patient Emergency Record</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    bookingRecord?.is_critical 
                      ? 'bg-amber-100 text-amber-900 border-amber-300' 
                      : 'bg-teal-50 text-teal-800 border-teal-200'
                  }`}>
                    {bookingRecord?.is_critical ? 'Critical Case (Priority 1)' : 'Emergency Case'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Patient Name</span>
                    <strong className="text-slate-900 font-bold text-sm">{bookingRecord?.patient_name}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Emergency Contact</span>
                    <span className="text-slate-800 font-medium">{bookingRecord?.patient_phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Condition / Symptoms</span>
                    <span className="text-slate-700 truncate block" title={bookingRecord?.condition_notes}>
                      {bookingRecord?.condition_notes || 'Emergency transport requested'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Driver & Destination Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-black text-base shadow-sm">
                      VS
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Assigned Driver & Paramedic
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{bookingRecord?.driver_name}</h4>
                      <p className="text-xs text-slate-500 font-mono">Vehicle: {bookingRecord?.vehicle_number}</p>
                    </div>
                  </div>

                  <a
                    href={`tel:${bookingRecord?.driver_phone}`}
                    className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Driver</span>
                  </a>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Destination Emergency Unit
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{selectedHospital?.emergencyAvailable || 'Emergency Verified'}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <strong className="text-slate-900 text-xs">{bookingRecord?.destination_hospital}</strong>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Emergency triage pre-alerted. Distance: {routeDistanceText || `${selectedHospital?.distanceKm} km`}.
                  </p>
                </div>
              </div>

              {/* Supabase backend status sync */}
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-xs text-teal-900">
                <div className="flex items-center gap-2 font-medium">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>{syncStatus}</span>
                </div>
                <span className="font-mono text-[10px] text-teal-700 bg-white px-2 py-0.5 rounded border border-teal-200">
                  Supabase Project: aylqpvgaamipwufejnan
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  id="modify-dispatch-btn"
                  onClick={() => setIsConfirmed(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Modify Dispatch Details
                </button>
                <button
                  type="button"
                  id="close-tracker-btn"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Done / Close Tracker
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
