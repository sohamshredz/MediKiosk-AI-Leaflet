import React, { useState } from 'react';
import { 
  ShieldCheck, 
  User, 
  ArrowRight, 
  Building2, 
  Stethoscope, 
  Activity, 
  Mic, 
  LocateFixed, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Lock, 
  Globe, 
  Sparkles,
  Siren,
  Calendar,
  FileCheck2,
  HeartPulse,
  Clock,
  Pill,
  Microscope,
  Bed,
  Accessibility,
  Phone,
  Users,
  FileText,
  ChevronRight,
  Languages,
  Heart
} from 'lucide-react';
import { AppView } from '../SidebarDashboard';
import { PatientProfile, AuthSession } from '../../types';
import { BookAppointmentModal } from '../patient/BookAppointmentModal';
import { BookAmbulanceModal } from '../patient/BookAmbulanceModal';
import { StaffLoginModal } from '../auth/StaffLoginModal';
import { Medical3DBackground } from './Medical3DBackground';
import { LanguageSelector } from '../common/LanguageSelector';
import { useLanguage } from '../../context/LanguageContext';
import { getCurrentGPSLocation, reverseGeocodeCoordinates } from '../../services/locationService';

// Authentic Healthcare Visual Assets
import doctorImg from '../../assets/images/doctor_consultation_1788102560962.jpg';
import hospitalImg from '../../assets/images/hospital_building_1788102578071.jpg';
import instrumentsImg from '../../assets/images/medical_instruments_1788102594651.jpg';
import kioskTechImg from '../../assets/images/health_kiosk_tech_1788102614104.jpg';

interface LandingViewProps {
  onNavigateView: (view: AppView) => void;
  onSelectPatient?: (id: string) => void;
  patients?: PatientProfile[];
  onOpenAbdmModal: () => void;
  onOpenInfographicModal: () => void;
  onFindMyLocation?: (coords: { lat: number; lng: number }, zoom?: number, message?: string) => void;
  authSession?: AuthSession | null;
  onOpenStaffLoginModal?: (targetDestination?: AppView, message?: string) => void;
  onNavigateToPatientLogin?: (intendedDestination?: AppView, message?: string) => void;
  onLoginSuccess?: (session: AuthSession) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onNavigateView,
  onSelectPatient,
  patients = [],
  onOpenAbdmModal,
  onOpenInfographicModal,
  onFindMyLocation,
  authSession,
  onOpenStaffLoginModal,
  onNavigateToPatientLogin,
  onLoginSuccess
}) => {
  const { t } = useLanguage();
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState<boolean>(false);
  const [isAmbulanceModalOpen, setIsAmbulanceModalOpen] = useState<boolean>(false);
  const [isStaffLoginModalOpen, setIsStaffLoginModalOpen] = useState<boolean>(false);
  const [staffLoginTarget, setStaffLoginTarget] = useState<AppView>('doctor');
  const [staffLoginMessage, setStaffLoginMessage] = useState<string | undefined>(undefined);

  // Geolocation states for "Find My Location"
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationSuccess, setLocationSuccess] = useState<string | null>(null);

  const handlePatientLoginClick = () => {
    if (onNavigateToPatientLogin) {
      onNavigateToPatientLogin('patient', 'Please sign in to access your secure patient dashboard and medical records.');
    } else {
      onNavigateView('login');
    }
  };

  const handleDoctorStaffLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onOpenStaffLoginModal) {
      onOpenStaffLoginModal('doctor', 'Doctor, Medical Officer, or Triage Nurse credentials required.');
    } else {
      setStaffLoginTarget('doctor');
      setStaffLoginMessage('Doctor, Medical Officer, or Triage Nurse credentials required.');
      setIsStaffLoginModalOpen(true);
    }
  };

  const handleFindMyLocation = async () => {
    setIsLocating(true);
    setLocationError(null);
    setLocationSuccess(null);

    try {
      const coords = await getCurrentGPSLocation();
      const geocoded = await reverseGeocodeCoordinates(coords.latitude, coords.longitude);
      const friendlyName = geocoded.displayName || 'Your GPS Location';
      
      setIsLocating(false);
      setLocationSuccess(`Location detected: ${friendlyName}`);

      const locationPayload = { lat: coords.latitude, lng: coords.longitude };
      if (onFindMyLocation) {
        onFindMyLocation(locationPayload, 15, `Location detected: ${friendlyName}`);
      } else {
        onNavigateView('map');
      }
    } catch (err: any) {
      setIsLocating(false);
      console.warn('Geolocation acquisition notice:', err.message);
      setLocationError(err.message || 'Unable to retrieve your current GPS location.');
    }
  };

  const activePatient: PatientProfile | null = (authSession && authSession.role === 'patient')
    ? (patients.find(p => p.id === authSession.userId || p.id === authSession.patientId) || null)
    : null;

  // Hospital Facilities & Key Services Data List (11 Supported Services)
  const hospitalServices = [
    {
      id: 'emergency-icu',
      title: t('24/7 Emergency & ICU'),
      desc: t('Emergency and critical care support'),
      icon: Activity,
      color: 'text-rose-600 bg-rose-50 border-rose-200',
      badge: t('24/7 Priority')
    },
    {
      id: 'voice-kiosk',
      title: t('10-Language Voice Kiosk'),
      desc: t('Multilingual voice-assisted patient support'),
      icon: Mic,
      color: 'text-teal-700 bg-teal-50 border-teal-200',
      badge: t('Voice AI')
    },
    {
      id: 'opd-queue',
      title: t('Live OPD Queue Tracking'),
      desc: t('Check OPD queue and consultation status'),
      icon: Clock,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      badge: t('Real-Time')
    },
    {
      id: 'ayush-allopathy',
      title: t('AYUSH & Allopathy'),
      desc: t('Integrated care pathways'),
      icon: Stethoscope,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      badge: t('Integrated')
    },
    {
      id: 'digital-rx',
      title: t('Digital e-Rx & Pharmacy'),
      desc: t('Digital prescriptions and pharmacy support'),
      icon: Pill,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      badge: t('OCR Digitized')
    },
    {
      id: 'pathology-radiology',
      title: t('NABL Pathology & Radiology'),
      desc: t('Diagnostic and imaging services'),
      icon: Microscope,
      color: 'text-cyan-700 bg-cyan-50 border-cyan-200',
      badge: t('NABL Accredited')
    },
    {
      id: 'abha-locker',
      title: t('ABHA Health Locker'),
      desc: t('Secure digital health records'),
      icon: ShieldCheck,
      color: 'text-teal-700 bg-teal-50 border-teal-200',
      badge: t('ABDM FHIR')
    },
    {
      id: 'bed-availability',
      title: t('Live Bed Availability'),
      desc: t('Check available hospital beds'),
      icon: Bed,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      badge: t('Live Status')
    },
    {
      id: 'wheelchair-assist',
      title: t('Wheelchair Assistance'),
      desc: t('Accessibility assistance for patients'),
      icon: Accessibility,
      color: 'text-slate-700 bg-slate-100 border-slate-200',
      badge: t('Accessibility')
    },
    {
      id: 'opd-timings',
      title: t('OPD Timings'),
      desc: t('View current outpatient department timings'),
      icon: Calendar,
      color: 'text-violet-600 bg-violet-50 border-violet-200',
      badge: '08:00 - 20:00'
    },
    {
      id: 'ambulance-sos',
      title: t('Ambulance / SOS'),
      desc: t('Emergency ambulance assistance'),
      icon: Siren,
      color: 'text-rose-600 bg-rose-50 border-rose-200',
      badge: t('Emergency SOS'),
      isEmergency: true,
      onClick: () => setIsAmbulanceModalOpen(true)
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-150 overflow-x-hidden selection:bg-teal-100 selection:text-teal-900">
      
      {/* ========================================================================= */}
      {/* 1. TOP NAVIGATION: Clean, Professional White Header Bar                    */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <nav 
            aria-label="Main Navigation"
            className="w-full flex items-center justify-between gap-3 sm:gap-6"
          >
            
            {/* BRAND LOGO (Left) */}
            <button
              type="button"
              id="nav-brand-logo"
              onClick={() => onNavigateView('landing')}
              className="flex items-center gap-2.5 cursor-pointer select-none group text-left bg-transparent border-0 p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 rounded-xl"
            >
              <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold shadow-xs group-hover:bg-teal-800 transition-colors shrink-0">
                <HeartPulse className="w-5 h-5 text-teal-100" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight block leading-tight">
                  MediKiosk <span className="text-teal-700 font-extrabold">AI</span>
                </span>
                <span className="hidden sm:inline-block text-[11px] text-slate-500 font-medium -mt-0.5">
                  Clinical History Platform
                </span>
              </div>
            </button>

            {/* CENTER NAVIGATION LINKS */}
            <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
              <button
                type="button"
                id="nav-link-home"
                onClick={() => onNavigateView('landing')}
                className="px-3.5 py-1.5 rounded-lg text-sm font-semibold text-teal-800 bg-teal-50/80 hover:bg-teal-100/70 transition-all cursor-pointer select-none"
              >
                {t('Home')}
              </button>
              <button
                type="button"
                id="nav-link-kiosk"
                onClick={() => onNavigateView('kiosk')}
                className="px-3.5 py-1.5 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer select-none"
              >
                {t('Smart Kiosk')}
              </button>
              <button
                type="button"
                id="nav-link-map"
                onClick={() => onNavigateView('map')}
                className="px-3.5 py-1.5 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer select-none"
              >
                {t('Hospital Map')}
              </button>
              <button
                type="button"
                id="nav-link-standards"
                onClick={onOpenAbdmModal}
                className="px-3.5 py-1.5 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer select-none"
                title="ABDM Health Locker, DPDP Act 2023 & HL7 FHIR Standards Architecture"
              >
                {t('Standards')}
              </button>
              <button
                type="button"
                id="nav-link-workflow"
                onClick={onOpenInfographicModal}
                className="px-3.5 py-1.5 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer select-none"
                title="Clinical Workflow Architecture"
              >
                {t('Workflow')}
              </button>
            </div>

            {/* RIGHT SIDE CONTROLS & AUTH */}
            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageSelector
                variant="header"
              />

              <button
                type="button"
                id="nav-btn-patient-login"
                onClick={handlePatientLoginClick}
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm shadow-xs hover:shadow transition-all cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-teal-100" />
                <span>{t('Sign In')}</span>
              </button>
            </div>

          </nav>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION: Clean Light Background with Subtle Clinical Accents      */}
      {/* ========================================================================= */}
      <section className="relative w-full overflow-hidden bg-linear-to-b from-[#F8FAFC] via-white to-[#F1F5F9] pb-16 sm:pb-24 border-b border-slate-200/90">
        
        {/* Subtle Light Medical Canvas Layer */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Medical3DBackground />
        </div>

        <div className="relative z-20 w-full max-w-7xl mx-auto pt-10 sm:pt-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
          
          {/* Integrated Hospital Infrastructure Imagery Preview (Clean White Cards) */}
          <div className="w-full max-w-5xl mb-12 sm:mb-16 grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4 select-none">
            
            <button
              type="button"
              id="top-panel-hospital-map"
              onClick={() => onNavigateView('map')}
              className="relative h-28 sm:h-32 rounded-2xl overflow-hidden border border-slate-200/90 bg-white shadow-xs hover:shadow-md group transition-all cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <img 
                src={hospitalImg} 
                alt="Hospital Complex Infrastructure" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
              <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate drop-shadow-sm group-hover:text-teal-200 transition-colors">
                  {t('Hospital Campus')}
                </span>
                <span className="w-2 h-2 rounded-full bg-teal-400 shadow-xs" />
              </div>
            </button>

            <button
              type="button"
              id="top-panel-specialist-opd"
              onClick={handleDoctorStaffLinkClick}
              className="relative h-28 sm:h-32 rounded-2xl overflow-hidden border border-slate-200/90 bg-white shadow-xs hover:shadow-md group transition-all cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <img 
                src={doctorImg} 
                alt="Specialist OPD Physician Care" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
              <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate drop-shadow-sm group-hover:text-teal-200 transition-colors">
                  {t('Specialist OPD')}
                </span>
                <span className="w-2 h-2 rounded-full bg-teal-400 shadow-xs" />
              </div>
            </button>

            <button
              type="button"
              id="top-panel-clinical-telemetry"
              onClick={() => setIsAmbulanceModalOpen(true)}
              className="relative h-28 sm:h-32 rounded-2xl overflow-hidden border border-slate-200/90 bg-white shadow-xs hover:shadow-md group transition-all cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-rose-600"
            >
              <img 
                src={instrumentsImg} 
                alt="Precision Clinical Diagnostics & Telemetry" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
              <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate drop-shadow-sm group-hover:text-rose-200 transition-colors">
                  {t('Clinical Telemetry')}
                </span>
                <span className="w-2 h-2 rounded-full bg-rose-400 shadow-xs" />
              </div>
            </button>

            <button
              type="button"
              id="top-panel-smart-kiosk"
              onClick={() => onNavigateView('kiosk')}
              className="relative h-28 sm:h-32 rounded-2xl overflow-hidden border border-slate-200/90 bg-white shadow-xs hover:shadow-md group transition-all cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <img 
                src={kioskTechImg} 
                alt="Smart Kiosk & Voice Intake Technology" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
              <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate drop-shadow-sm group-hover:text-teal-200 transition-colors">
                  {t('Smart Kiosk AI')}
                </span>
                <span className="w-2 h-2 rounded-full bg-teal-400 shadow-xs" />
              </div>
            </button>

          </div>

          {/* Central Hero Branding & Patient CTA */}
          <div className="w-full max-w-3xl mx-auto text-center flex flex-col items-center">
            
            {/* Clinical Workflow Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/90 text-xs font-bold uppercase tracking-wider mb-5 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>{t('Pre-Consultation Clinical Intake & Triage')}</span>
            </div>

            {/* Official Brand Name: MediKiosk AI */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-2 font-['Plus_Jakarta_Sans',sans-serif]">
              MediKiosk <span className="text-teal-700">AI</span>
            </h1>

            {/* Solution Name: Clinical History Software Platform */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 tracking-tight mb-3 font-['Plus_Jakarta_Sans',sans-serif]">
              {t('Clinical History Software Platform')}
            </h2>

            {/* Functional Subtitle */}
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-slate-700 tracking-tight mb-4 font-['Plus_Jakarta_Sans',sans-serif]">
              {t('AI-Powered Clinical History & Pre-Consultation Platform')}
            </h3>

            {/* Supporting Description */}
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8 font-normal">
              {t('Capture your medical history, digitize existing health records, and prepare a clinician-ready history before consultation.')}
            </p>

            {/* PRIMARY LANDING CTA: PATIENT LOGIN */}
            <div className="w-full max-w-md flex flex-col items-center gap-3">
              <button
                type="button"
                id="btn-landing-patient-login"
                onClick={handlePatientLoginClick}
                className="w-full py-4 sm:py-4.5 px-8 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-base sm:text-lg shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer group select-none border border-teal-600/30"
              >
                <User className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                <span>{t('patientLogin', 'Patient Login')}</span>
                <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1.5 transition-transform" />
              </button>

              {/* Supporting Text Directly Below Button */}
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {t('Access your secure patient portal')}
              </p>
            </div>

            {/* Clinical Telemetry Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-8 text-xs text-slate-700 font-medium">
              <span className="px-3.5 py-1.5 rounded-full bg-white/95 border border-slate-200/90 text-slate-700 shadow-2xs backdrop-blur-xs">
                📋 {t('Conversational Clinical History')}
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-white/95 border border-slate-200/90 text-slate-700 shadow-2xs backdrop-blur-xs">
                📄 {t('Medical Document OCR Digitization')}
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-white/95 border border-slate-200/90 text-slate-700 shadow-2xs backdrop-blur-xs">
                🏥 {t('HIS & ABHA Health Locker Link')}
              </span>
            </div>

          </div>

        </div>

      </section>

      {/* ========================================================================= */}
      {/* 4. HOSPITAL INFRASTRUCTURE & CLINICAL FACILITY SHOWCASE                    */}
      {/* ========================================================================= */}
      <section className="relative z-10 w-full bg-white border-t border-slate-200/90 py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200/80 inline-block">
                {t('hospitalInfrastructure', 'Hospital Infrastructure & Technology')}
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
                {t('smartHospitalEcosystem', 'Smart Hospital Ecosystem & Clinical Facilities')}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>{t('NABH Accredited • ABDM M1/M2/M3 Standards')}</span>
            </div>
          </div>

          {/* 4-Card Healthcare Visual Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* CARD 1: HOSPITAL BUILDING & GPS FINDER */}
            <div className="bg-[#F8FAFC] rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col group">
              <div className="relative h-52 sm:h-56 overflow-hidden bg-slate-100">
                <img 
                  src={hospitalImg} 
                  alt="Modern Multi-Specialty Hospital Complex" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent"></div>
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-600 text-white font-mono font-bold text-[10px] uppercase tracking-wider">
                    {t('24/7 Multi-Specialty Hospital')}
                  </span>
                  <h4 className="text-base sm:text-lg font-bold text-white mt-1 leading-tight">
                    {t('State-of-the-Art Healthcare Campus')}
                  </h4>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {t('NABH-accredited tertiary care facility featuring 500+ general and ICU beds, dedicated trauma bays, advanced operation theaters, and rapid ambulance dispatch network.')}
                </p>

                {/* Inline Geolocation Status Alerts */}
                {locationError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{locationError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLocationError(null)}
                      className="text-rose-500 hover:text-rose-800 cursor-pointer p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {locationSuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-1.5 font-bold shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{locationSuccess}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-teal-800 font-semibold flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-teal-700" />
                    {t('Live Hospital & Emergency Map')}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="btn-find-my-location-card"
                      onClick={handleFindMyLocation}
                      disabled={isLocating}
                      className="px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60 active:scale-95"
                      title="Find your current GPS coordinates and show nearby hospitals"
                    >
                      {isLocating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-200" />
                          <span>{t('Locating...')}</span>
                        </>
                      ) : (
                        <>
                          <LocateFixed className="w-3.5 h-3.5 text-amber-300" />
                          <span>{t('Find My Location')}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      id="btn-view-hospital-map-card"
                      onClick={() => onNavigateView('map')}
                      className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-teal-50 transition-colors"
                    >
                      <span>{t('viewHospitalMap', 'View Hospital Map')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: DOCTOR CLINICAL CONSULTATION */}
            <div className="bg-[#F8FAFC] rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col group">
              <div className="relative h-52 sm:h-56 overflow-hidden bg-slate-100">
                <img 
                  src={doctorImg} 
                  alt="Specialist Physician in OPD Consultation" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent"></div>
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-mono font-bold text-[10px] uppercase tracking-wider">
                    {t('OPD Clinical Care')}
                  </span>
                  <h4 className="text-base sm:text-lg font-bold text-white mt-1 leading-tight">
                    {t('Specialist Doctors & Medical Officers')}
                  </h4>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {t('Physicians empowered with real-time AI pre-consultation voice briefings, OCR prescription digitizers, AYUSH cross-referencing, and ABDM-compliant digital e-Prescribing.')}
                </p>
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-teal-700" />
                    {t('General & Specialty OPDs')}
                  </span>
                  <button
                    type="button"
                    id="btn-clinical-briefings"
                    onClick={handleDoctorStaffLinkClick}
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-teal-50 transition-all active:scale-95"
                    title="Open Doctor & Staff Portal for AI Clinical Briefings"
                  >
                    <span>{t('Clinical Briefings Ready')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* CARD 3: MEDICAL INSTRUMENTS & TELEMETRY */}
            <div className="bg-[#F8FAFC] rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col group">
              <div className="relative h-52 sm:h-56 overflow-hidden bg-slate-100">
                <img 
                  src={instrumentsImg} 
                  alt="High-Precision Medical Instruments and Diagnostics" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent"></div>
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-mono font-bold text-[10px] uppercase tracking-wider">
                    {t('Precision Diagnostics')}
                  </span>
                  <h4 className="text-base sm:text-lg font-bold text-white mt-1 leading-tight">
                    {t('Advanced Clinical Instruments & Telemetry')}
                  </h4>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {t('Connected diagnostic sensors for non-invasive vitals logging (NIBP, SpO2, Blood Sugar, 12-lead ECG), coupled with real-time nurse triage red-flag warning systems.')}
                </p>
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-rose-600" />
                    {t('Continuous Vitals Monitoring')}
                  </span>
                  <button
                    type="button"
                    id="btn-emergency-triage"
                    onClick={() => setIsAmbulanceModalOpen(true)}
                    className="text-xs font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-all active:scale-95"
                    title="Open Emergency Triage & Ambulance Fast-Track"
                  >
                    <span>{t('Emergency Triage Fast-Track')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* CARD 4: SMART AI KIOSK TECHNOLOGY */}
            <div className="bg-[#F8FAFC] rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col group">
              <div className="relative h-52 sm:h-56 overflow-hidden bg-slate-100">
                <img 
                  src={kioskTechImg} 
                  alt="Multilingual Smart Healthcare Kiosk Terminal" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent"></div>
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-600 text-white font-mono font-bold text-[10px] uppercase tracking-wider">
                    {t('multilingualVoiceAI', 'Multilingual Voice AI')}
                  </span>
                  <h4 className="text-base sm:text-lg font-bold text-white mt-1 leading-tight">
                    {t('kioskTerminal', 'Smart Kiosk & ABHA Self-Intake')}
                  </h4>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {t('Interactive self-service terminals supporting 10 Indian regional languages for natural voice symptom recording, queue token generation, and ABHA card QR integration.')}
                </p>
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
                    <Mic className="w-4 h-4 text-teal-700" />
                    {t('10 Indian Regional Languages')}
                  </span>
                  <button
                    type="button"
                    id="btn-voice-touch-intake"
                    onClick={() => onNavigateView('kiosk')}
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-teal-50 transition-all active:scale-95"
                    title="Launch Multilingual Smart Kiosk Voice & Touch Intake"
                  >
                    <span>{t('Voice & Touch Intake')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. HOSPITAL FACILITIES & KEY SERVICES (CLEAN WHITE CARD GRID)             */}
      {/* ========================================================================= */}
      <section className="relative z-10 w-full bg-[#F8FAFC] py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-200/90">
        <div className="max-w-6xl mx-auto space-y-10">
          
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-3.5 py-1 rounded-full border border-teal-200/80 inline-block shadow-2xs">
              {t('Healthcare Infrastructure')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
              {t('HOSPITAL FACILITIES & KEY SERVICES')}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-normal">
              {t('Connected hospital infrastructure and patient support services')}
            </p>
          </div>

          {/* 11-Card Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {hospitalServices.map((service) => {
              const IconComp = service.icon;
              const isClickable = !!service.onClick;

              return (
                <div
                  key={service.id}
                  id={`facility-card-${service.id}`}
                  onClick={service.onClick}
                  className={`relative flex flex-col justify-between p-5 rounded-2xl bg-white border transition-all duration-200 shadow-xs hover:shadow-md ${
                    service.isEmergency 
                      ? 'border-rose-300 bg-linear-to-b from-rose-50/40 via-white to-white ring-2 ring-rose-500/20' 
                      : 'border-slate-200/90 hover:border-teal-500/40'
                  } ${isClickable ? 'cursor-pointer active:scale-[0.98] group' : ''}`}
                >
                  <div className="space-y-3.5">
                    {/* Top Row: Icon & Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-2xs ${service.color}`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                        service.isEmergency 
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {service.badge}
                      </span>
                    </div>

                    {/* Title & Short Description */}
                    <div className="space-y-1">
                      <h3 className={`text-base font-bold tracking-tight text-slate-900 ${isClickable ? 'group-hover:text-rose-600 transition-colors' : ''}`}>
                        {service.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {service.desc}
                      </p>
                    </div>
                  </div>

                  {/* Optional Interactive CTA for Emergency Cards */}
                  {service.isEmergency && (
                    <div className="mt-4 pt-3 border-t border-rose-200/60 flex items-center justify-between text-xs font-bold text-rose-600">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" />
                        {t('Call & Book SOS')}
                      </span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. QUICK PATIENT SERVICES: Essential Patient Modules                      */}
      {/* ========================================================================= */}
      <section className="relative z-10 w-full bg-white py-14 px-4 sm:px-6 lg:px-8 border-t border-slate-200/90">
        <div className="max-w-6xl mx-auto space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200/80 inline-block">
                {t('Direct OPD Actions')}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
                {t('QUICK PATIENT SERVICES')}
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {t('Immediate self-service actions for patients and accompanying relatives')}
            </p>
          </div>

          {/* Quick Action Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Quick Action 1: Patient Login (Primary) */}
            <button
              type="button"
              id="btn-quick-patient-login"
              onClick={handlePatientLoginClick}
              className="flex flex-col items-start justify-between p-4 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold transition-all shadow-xs hover:shadow-md active:scale-98 cursor-pointer text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-800/90 flex items-center justify-center mb-3">
                <User className="w-4 h-4 text-teal-200" />
              </div>
              <div>
                <span className="text-sm font-extrabold block">{t('Patient Login')}</span>
                <span className="text-xs text-teal-100 font-normal mt-0.5 block">{t('Access health records')}</span>
              </div>
              <div className="w-full pt-3 mt-2 border-t border-teal-600/60 flex items-center justify-between text-xs text-teal-200">
                <span>{t('Sign in')}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Quick Action 2: Ambulance / SOS */}
            <button
              type="button"
              id="btn-quick-ambulance-sos"
              onClick={() => setIsAmbulanceModalOpen(true)}
              className="flex flex-col items-start justify-between p-4 rounded-2xl bg-rose-50 hover:bg-rose-100/80 border border-rose-200 text-slate-900 font-bold transition-all shadow-2xs hover:shadow-md active:scale-98 cursor-pointer text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center mb-3 shadow-2xs">
                <Siren className="w-4 h-4 text-rose-100" />
              </div>
              <div>
                <span className="text-sm font-extrabold block text-rose-700">{t('Ambulance / SOS')}</span>
                <span className="text-xs text-slate-600 font-normal mt-0.5 block">{t('Emergency dispatch (108)')}</span>
              </div>
              <div className="w-full pt-3 mt-2 border-t border-rose-200 flex items-center justify-between text-xs text-rose-600">
                <span>{t('Call SOS')}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Quick Action 3: Hospital Map */}
            <button
              type="button"
              id="btn-quick-hospital-map"
              onClick={() => onNavigateView('map')}
              className="flex flex-col items-start justify-between p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-bold transition-all shadow-2xs hover:shadow-md active:scale-98 cursor-pointer text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center mb-3">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-extrabold block">{t('Hospital Map')}</span>
                <span className="text-xs text-slate-600 font-normal mt-0.5 block">{t('Find nearby OPD campus')}</span>
              </div>
              <div className="w-full pt-3 mt-2 border-t border-slate-200 flex items-center justify-between text-xs text-teal-700">
                <span>{t('View Map')}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Quick Action 4: OPD Queue & Intake */}
            <button
              type="button"
              id="btn-quick-opd-queue"
              onClick={handlePatientLoginClick}
              className="flex flex-col items-start justify-between p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-bold transition-all shadow-2xs hover:shadow-md active:scale-98 cursor-pointer text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center mb-3">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-extrabold block">{t('OPD Queue')}</span>
                <span className="text-xs text-slate-600 font-normal mt-0.5 block">{t('Check token & status')}</span>
              </div>
              <div className="w-full pt-3 mt-2 border-t border-slate-200 flex items-center justify-between text-xs text-amber-700">
                <span>{t('Check Queue')}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Quick Action 5: Appointments */}
            <button
              type="button"
              id="btn-quick-book-appointment"
              onClick={() => setIsAppointmentModalOpen(true)}
              className="flex flex-col items-start justify-between p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-bold transition-all shadow-2xs hover:shadow-md active:scale-98 cursor-pointer text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center mb-3">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-extrabold block">{t('Appointments')}</span>
                <span className="text-xs text-slate-600 font-normal mt-0.5 block">{t('Book doctor slot')}</span>
              </div>
              <div className="w-full pt-3 mt-2 border-t border-slate-200 flex items-center justify-between text-xs text-indigo-700">
                <span>{t('Book Slot')}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. HOSPITAL STATS STRIP                                                   */}
      {/* ========================================================================= */}
      <section className="bg-slate-900 text-white py-10 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
          <div>
            <b className="text-2xl sm:text-3xl text-amber-400 block font-black font-mono">1,000+</b>
            <span className="text-xs text-slate-300">{t('daily patient footfall handled')}</span>
          </div>
          <div>
            <b className="text-2xl sm:text-3xl text-teal-400 block font-black font-mono">10 Indian</b>
            <span className="text-xs text-slate-300">{t('regional languages voice AI')}</span>
          </div>
          <div>
            <b className="text-2xl sm:text-3xl text-amber-400 block font-black font-mono">ABDM Fast</b>
            <span className="text-xs text-slate-300">{t('ABHA & FHIR compliant')}</span>
          </div>
          <div>
            <b className="text-2xl sm:text-3xl text-teal-400 block font-black font-mono">100% Secure</b>
            <span className="text-xs text-slate-300">{t('DPDP Act 2023 privacy standard')}</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. INSTITUTIONAL FOOTER                                                   */}
      {/* ========================================================================= */}
      <footer className="w-full bg-[#F1F5F9] border-t border-slate-200 py-14 px-4 sm:px-6 lg:px-8 text-slate-600">
        <div className="max-w-6xl mx-auto space-y-10">
          
          {/* Main 4-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6">
            
            {/* COLUMN 1: MediKiosk AI Identity & Mission */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold shadow-xs">
                  <HeartPulse className="w-4 h-4 text-teal-100" />
                </div>
                <span className="text-base font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
                  MediKiosk <span className="text-teal-700">AI</span>
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                {t('AI-powered clinical history software platform enabling conversational medical intake, physical document OCR digitization, clinician-ready history summaries, and hospital information system (HIS) & ABHA integration.')}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                  {t('ABDM Certified')}
                </span>
                <span className="text-[10px] font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                  HL7 FHIR R4
                </span>
                <span className="text-[10px] font-bold bg-white text-teal-800 px-2 py-0.5 rounded border border-teal-200 shadow-2xs">
                  DPDP Act 2023
                </span>
              </div>
            </div>

            {/* COLUMN 2: Patient Services */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                {t('Patient Services')}
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button 
                    type="button" 
                    onClick={handlePatientLoginClick}
                    className="hover:text-teal-700 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <ChevronRight className="w-3 h-3 text-teal-600" />
                    <span>{t('Patient Login & Health Records')}</span>
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => setIsAppointmentModalOpen(true)}
                    className="hover:text-teal-700 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <ChevronRight className="w-3 h-3 text-teal-600" />
                    <span>{t('Book OPD Doctor Appointment')}</span>
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => onNavigateView('map')}
                    className="hover:text-teal-700 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <ChevronRight className="w-3 h-3 text-teal-600" />
                    <span>{t('Hospital Campus Locator')}</span>
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => setIsAmbulanceModalOpen(true)}
                    className="text-rose-600 hover:text-rose-700 font-bold transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <ChevronRight className="w-3 h-3 text-rose-500" />
                    <span>{t('Emergency Ambulance / SOS (108)')}</span>
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={handlePatientLoginClick}
                    className="hover:text-teal-700 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <ChevronRight className="w-3 h-3 text-teal-600" />
                    <span>{t('Prescription OCR Scanner')}</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* COLUMN 3: Information & Architecture */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                {t('Information & Architecture')}
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button 
                    type="button" 
                    onClick={onOpenAbdmModal}
                    className="hover:text-teal-700 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <ShieldCheck className="w-3 h-3 text-teal-600" />
                    <span>{t('ABHA Health Locker (M1/M2/M3)')}</span>
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={onOpenInfographicModal}
                    className="hover:text-teal-700 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <FileText className="w-3 h-3 text-teal-600" />
                    <span>{t('Intake Workflow & Architecture')}</span>
                  </button>
                </li>
                <li className="text-slate-600 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{t('OPD Hours: Mon–Sat 08:00 – 20:00')}</span>
                </li>
                <li className="text-slate-600 flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-rose-500" />
                  <span>{t('Emergency & Trauma: 24/7 Active')}</span>
                </li>
                <li className="text-slate-600 flex items-center gap-1.5">
                  <Accessibility className="w-3 h-3 text-slate-400" />
                  <span>{t('Wheelchair & AYUSH Assistance')}</span>
                </li>
              </ul>
            </div>

            {/* COLUMN 4: Doctor & Staff */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                {t('Doctor & Staff')}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('Authorized clinical officers, triage nurses, and hospital administration portal.')}
              </p>
              
              {/* Secondary Doctor / Staff & Admin Access Links */}
              <div className="pt-1 space-y-1.5">
                <button
                  type="button"
                  id="link-doctor-staff-portal"
                  onClick={handleDoctorStaffLinkClick}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-700 hover:text-teal-800 font-semibold transition-colors cursor-pointer group bg-transparent border-0 p-0"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-700 transition-colors" />
                  <span className="underline underline-offset-4 decoration-slate-300 hover:decoration-teal-600">{t('Doctor & Staff Portal')}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 group-hover:text-teal-700 transition-all" />
                </button>

                <div>
                  <button
                    type="button"
                    id="link-his-admin-portal"
                    onClick={(e) => {
                      e.preventDefault();
                      if (onOpenStaffLoginModal) {
                        onOpenStaffLoginModal('admin', 'HIS Master Administrator credentials required.');
                      } else {
                        setStaffLoginTarget('admin');
                        setStaffLoginMessage('HIS Master Administrator credentials required.');
                        setIsStaffLoginModalOpen(true);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-purple-800 font-medium transition-colors cursor-pointer group bg-transparent border-0 p-0"
                  >
                    <Building2 className="w-3 h-3 text-slate-400 group-hover:text-purple-700 transition-colors" />
                    <span className="hover:underline">{t('HIS Administrator')}</span>
                  </button>
                </div>
              </div>

              <span className="text-[11px] text-slate-500 block pt-1">
                {t('Authorized medical personnel only')}
              </span>
            </div>

          </div>

          {/* Bottom Bar: Copyright & Compliance */}
          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">MediKiosk AI</span>
              <span>© {new Date().getFullYear()}</span>
              <span>•</span>
              <span>{t('National Digital Health Mission Compatible')}</span>
            </div>
            <div className="flex items-center gap-4 text-slate-500 text-[11px]">
              <span>{t('Privacy Standard')}</span>
              <span>•</span>
              <span>{t('ISO 27001 Certified')}</span>
              <span>•</span>
              <span>{t('HL7 FHIR Interoperability')}</span>
            </div>
          </div>

        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 9. MODALS                                                                 */}
      {/* ========================================================================= */}
      <BookAppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        patient={activePatient}
        onAppointmentBooked={() => {}}
        onStartKioskIntake={() => {
          setIsAppointmentModalOpen(false);
          onNavigateView('kiosk');
        }}
        onNavigateToLogin={() => {
          setIsAppointmentModalOpen(false);
          handlePatientLoginClick();
        }}
      />

      <BookAmbulanceModal
        isOpen={isAmbulanceModalOpen}
        onClose={() => setIsAmbulanceModalOpen(false)}
        patient={activePatient}
      />

      <StaffLoginModal
        isOpen={isStaffLoginModalOpen}
        onClose={() => setIsStaffLoginModalOpen(false)}
        onNavigateView={onNavigateView}
        onSelectPatient={onSelectPatient}
        patients={patients}
        targetDestination={staffLoginTarget}
        destinationMessage={staffLoginMessage}
        onLoginSuccess={onLoginSuccess}
      />

    </div>
  );
};
