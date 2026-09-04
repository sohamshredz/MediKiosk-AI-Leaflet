import React, { useState, useEffect } from 'react';
import { SAMPLE_PATIENTS } from './data/samplePatients';
import { PatientProfile, SupportedLanguage } from './types';
import { SUPPORTED_LANGUAGES } from './data/indianLanguages';
import { SidebarDashboard, AppView } from './components/SidebarDashboard';
import { LandingView } from './components/landing/LandingView';
import { UnifiedAuthView } from './components/auth/UnifiedAuthView';
import { MediKioskLoginView } from './components/auth/MediKioskLoginView';
import { PatientLoginPortal } from './components/auth/PatientLoginPortal';
import { KioskIntakeView } from './components/kiosk/KioskIntakeView';
import { DoctorPortalView } from './components/doctor/DoctorPortalView';
import { TriageNurseView } from './components/triage/TriageNurseView';
import { AdminAnalyticsView } from './components/admin/AdminAnalyticsView';
import { PatientPortalView, PatientDashboardSection } from './components/patient/PatientPortalView';
import { HospitalLocatorMap } from './components/map/HospitalLocatorMap';
import { GeminiAssistantView } from './components/gemini/GeminiAssistantView';
import { AbdmArchitectureModal } from './components/abdm/AbdmArchitectureModal';
import { WorkflowInfographicModal } from './components/kiosk/WorkflowInfographicModal';
import { AccessDeniedView } from './components/auth/AccessDeniedView';
import { StaffLoginModal } from './components/auth/StaffLoginModal';
import { 
  AuthSession, 
  getStoredAuthSession, 
  saveAuthSession, 
  clearAuthSession, 
  resolveRoute, 
  isSessionAuthorized,
  RouteProtectionLevel
} from './utils/authStorage';
import { 
  loadKioskDataFromStorage, 
  useKioskAutoSave, 
  clearKioskLocalStorage, 
  KioskSessionMeta,
  saveKioskDataToStorage
} from './utils/kioskStorage';
import { parseHandoffUrl, clearHandoffUrlParams } from './utils/kioskHandoff';
import { 
  ShieldCheck, 
  Heart, 
  Stethoscope, 
  Activity, 
  FileText, 
  CheckCircle2, 
  RotateCcw, 
  AlertCircle, 
  Save, 
  Smartphone, 
  QrCode
} from 'lucide-react';
import { useLanguage } from './context/LanguageContext';

export function App() {
  const { 
    language: selectedLanguage, 
    publicLanguage, 
    patientLanguage, 
    isPatientMode, 
    setLanguage: setSelectedLanguage, 
    setPublicLanguage, 
    setPatientLanguage, 
    clearPatientLanguage, 
    t 
  } = useLanguage();
  // Load persisted session on initial boot
  const [initialLoaded] = useState(() => loadKioskDataFromStorage());
  const [patients, setPatients] = useState<PatientProfile[]>(initialLoaded.patients);
  const [activePatientId, setActivePatientId] = useState<string>(() => {
    const initialAuth = getStoredAuthSession();
    if (initialAuth && initialAuth.role === 'patient') {
      return initialAuth.patientId || initialAuth.userId || '';
    }
    return '';
  });
  const [sessionMeta, setSessionMeta] = useState<KioskSessionMeta>(initialLoaded.sessionMeta);
  
  // Authentication session state managed via sessionStorage
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => getStoredAuthSession());
  const [intendedDestination, setIntendedDestination] = useState<AppView | null>(null);
  const [intendedDestinationMessage, setIntendedDestinationMessage] = useState<string | null>(null);
  const [accessDeniedDetails, setAccessDeniedDetails] = useState<{
    attemptedView: AppView;
    requiredLevel: RouteProtectionLevel;
    message: string;
  } | null>(null);

  // Synchronize patient language if authenticated on initial mount / reload
  useEffect(() => {
    const initialAuth = getStoredAuthSession();
    if (initialAuth && initialAuth.role === 'patient') {
      const targetId = initialAuth.patientId || initialAuth.userId || '';
      const found = patients.find(p => p.id === targetId);
      if (found && found.language) {
        setPatientLanguage(found.language);
      }
    }
  }, [patients, setPatientLanguage]);

  // Global Staff / Doctor Modal State
  const [isStaffLoginModalOpen, setIsStaffLoginModalOpen] = useState<boolean>(false);
  const [staffLoginTarget, setStaffLoginTarget] = useState<AppView>('doctor');
  const [staffLoginMessage, setStaffLoginMessage] = useState<string | undefined>(undefined);
  const [patientInitialSection, setPatientInitialSection] = useState<PatientDashboardSection>('dashboard');

  // Resolve initial view from URL path and verify against auth protection
  const [currentView, setCurrentView] = useState<AppView | 'access-denied'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.replace(/^\//, '') as AppView;
      const initialAuth = getStoredAuthSession();
      const resolved = resolveRoute(path || 'landing');
      
      if (resolved.protectionLevel === 'public') {
        return resolved.targetView;
      }
      
      if (isSessionAuthorized(initialAuth, resolved.protectionLevel)) {
        return resolved.targetView;
      }
      
      // If unauthorized protected route requested on direct initial boot
      if (resolved.protectionLevel === 'patient_required') {
        return 'login';
      }
      
      return 'landing';
    }
    return 'landing';
  });

  // Derive current user role directly from active auth session
  const userRole: 'patient' | 'doctor' | 'staff' | null = authSession
    ? (authSession.role === 'patient'
        ? 'patient'
        : (authSession.role === 'doctor' || authSession.role === 'medical_officer')
        ? 'doctor'
        : (authSession.role === 'triage_nurse' || authSession.role === 'admin')
        ? 'staff'
        : null)
    : null;

  const [isAbdmModalOpen, setIsAbdmModalOpen] = useState<boolean>(false);
  const [isInfographicModalOpen, setIsInfographicModalOpen] = useState<boolean>(false);
  const [mobileResumedNotice, setMobileResumedNotice] = useState<string | null>(null);
  
  // Hospital Locator Map GPS Target Navigation State
  const [mapTargetLocation, setMapTargetLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapTargetZoom, setMapTargetZoom] = useState<number | undefined>(undefined);
  const [mapStatusMessage, setMapStatusMessage] = useState<string | null>(null);

  const handleLoginSuccess = (session: AuthSession, patientProfile?: PatientProfile) => {
    setAuthSession(session);
    saveAuthSession(session);
    
    if (session.role === 'patient') {
      const targetId = patientProfile ? patientProfile.id : (session.patientId || session.userId);
      setActivePatientId(targetId);
      const found = patientProfile || patients.find(p => p.id === targetId);
      if (found && found.language) {
        setPatientLanguage(found.language);
      } else {
        setPatientLanguage('hi');
      }
    } else {
      // For doctor / staff sessions, clear patient language
      clearPatientLanguage();
    }

    setIsStaffLoginModalOpen(false);
    setAccessDeniedDetails(null);

    const dest = intendedDestination;
    setIntendedDestination(null);
    setIntendedDestinationMessage(null);

    if (dest) {
      navigateToView(dest, { replaceHistory: true, skipAuthCheck: true });
    } else if (session.role === 'patient') {
      navigateToView('patient', { replaceHistory: true });
    } else if (session.role === 'doctor' || session.role === 'medical_officer') {
      navigateToView('doctor', { replaceHistory: true });
    } else if (session.role === 'triage_nurse') {
      navigateToView('triage', { replaceHistory: true });
    } else if (session.role === 'admin') {
      navigateToView('admin', { replaceHistory: true });
    }
  };

  const handleLogout = () => {
    clearPatientLanguage(); // Immediately restores publicLanguage
    setAuthSession(null);
    clearAuthSession();
    setActivePatientId('');
    setIntendedDestination(null);
    setIntendedDestinationMessage(null);
    setAccessDeniedDetails(null);
    setIsStaffLoginModalOpen(false);
    if (typeof window !== 'undefined') {
      window.history.replaceState({ view: 'landing' }, '', '/');
    }
    navigateToView('landing', { replaceHistory: true });
  };

  // Centralized Route-Guarded Navigation Function
  const navigateToView = (
    view: AppView | 'access-denied',
    options?: {
      patientId?: string;
      replaceHistory?: boolean;
      preserveScroll?: boolean;
      skipAuthCheck?: boolean;
      targetMessage?: string;
    }
  ) => {
    // 1. Close any open dialogs or overlays
    setIsAbdmModalOpen(false);
    setIsInfographicModalOpen(false);
    setMobileResumedNotice(null);

    // 2. Auth Guard Checking
    if (view !== 'access-denied' && !options?.skipAuthCheck) {
      const resolved = resolveRoute(view);
      const isAllowed = isSessionAuthorized(authSession, resolved.protectionLevel);

      if (!isAllowed) {
        if (resolved.protectionLevel === 'patient_required') {
          // Patient sign in required
          setIntendedDestination(view);
          setIntendedDestinationMessage(options?.targetMessage || 'Please sign in or register to access patient consultations & medical records.');
          setCurrentView('login');
          if (typeof window !== 'undefined') {
            window.history.pushState({ view: 'login' }, '', '/login');
            if (!options?.preserveScroll) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          }
          return;
        }

        // Staff protection levels ('staff_doctor' | 'staff_triage' | 'staff_admin')
        if (authSession?.role === 'patient') {
          // Role mismatch: logged in as patient trying to access doctor/staff consoles
          setAccessDeniedDetails({
            attemptedView: view,
            requiredLevel: resolved.protectionLevel,
            message: `Your current session is signed in as Patient (${authSession.userName}). Access to ${view.toUpperCase()} requires verified Doctor or Clinical Staff credentials.`
          });
          setCurrentView('access-denied');
          return;
        }

        // Not authenticated at all -> open staff login modal
        setStaffLoginTarget(view);
        setStaffLoginMessage(options?.targetMessage || `Staff credentials required to access ${view.toUpperCase()}.`);
        setIsStaffLoginModalOpen(true);
        return;
      }
    }

    // 3. Clear access denied details if navigating away
    if (view !== 'access-denied') {
      setAccessDeniedDetails(null);
    }

    // 4. Switch active patient if requested
    if (options?.patientId) {
      setActivePatientId(options.patientId);
      const found = patients.find(p => p.id === options.patientId);
      if (found && found.language && authSession?.role === 'patient') {
        setPatientLanguage(found.language);
      }
    }

    // 6. Set current view
    setCurrentView(view);

    // 7. Manage browser history cleanly
    if (typeof window !== 'undefined') {
      const targetPath = view === 'landing' ? '/' : `/${view}`;
      const stateObj = { view, patientId: options?.patientId || activePatientId };
      if (options?.replaceHistory) {
        window.history.replaceState(stateObj, '', targetPath);
      } else {
        window.history.pushState(stateObj, '', targetPath);
      }

      // 8. Reset scroll to top on page navigation
      if (!options?.preserveScroll) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    }
  };

  // Browser Back / Forward Button Popstate Listener with Auth Protection
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const state = e.state;
      const currentAuth = getStoredAuthSession();
      if (state && state.view) {
        const resolved = resolveRoute(state.view);
        if (resolved.protectionLevel === 'public' || isSessionAuthorized(currentAuth, resolved.protectionLevel)) {
          setCurrentView(state.view);
          if (state.patientId) {
            setActivePatientId(state.patientId);
          }
        } else {
          if (resolved.protectionLevel === 'patient_required') {
            setIntendedDestination(state.view);
            setIntendedDestinationMessage('Please sign in to access this patient page.');
            setCurrentView('login');
          } else {
            setCurrentView('landing');
          }
        }
      } else {
        const path = window.location.pathname.replace(/^\//, '') as AppView;
        const resolved = resolveRoute(path || 'landing');
        if (resolved.protectionLevel === 'public' || isSessionAuthorized(currentAuth, resolved.protectionLevel)) {
          setCurrentView(resolved.targetView);
        } else {
          setCurrentView('landing');
        }
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [authSession]);

  // Parse smartphone QR code handoff on page load
  useEffect(() => {
    const handoff = parseHandoffUrl();
    if (handoff.isMobileHandoff) {
      if (handoff.restoredPatient) {
        // If snapshot passed in URL, merge into patients list
        setPatients((prev) => {
          const exists = prev.some(p => p.id === handoff.restoredPatient!.id);
          const updatedList = exists
            ? prev.map(p => p.id === handoff.restoredPatient!.id ? handoff.restoredPatient! : p)
            : [handoff.restoredPatient!, ...prev];
          saveKioskDataToStorage(updatedList, handoff.restoredPatient!.id);
          return updatedList;
        });
      }

      if (handoff.patientId) {
        setActivePatientId(handoff.patientId);
        setSessionMeta((prev) => ({
          ...prev,
          [handoff.patientId!]: {
            step: handoff.step || 1,
            lastUpdated: new Date().toISOString()
          }
        }));
      }

      navigateToView('kiosk', { patientId: handoff.patientId, replaceHistory: true });
      setMobileResumedNotice(`Session resumed on your mobile device at Step ${handoff.step || 1}. Live edits will auto-save to local storage every 5s.`);
      clearHandoffUrlParams();
    }
  }, []);

  // Active patient reference
  const activePatient = patients.find(p => p.id === activePatientId) || patients[0];

  // Debounced auto-save hook running every 5 seconds (5000ms)
  const { saveStatus, lastSavedTimestamp, forceSave } = useKioskAutoSave(
    patients,
    activePatientId,
    sessionMeta,
    {
      debounceMs: 5000,
      onSaved: (ts) => {
        // Debounce write completed
      }
    }
  );

  const handleUpdatePatient = (updated: PatientProfile) => {
    setPatients((prev) => {
      const updatedList = prev.map((p) => (p.id === updated.id ? updated : p));
      try {
        saveKioskDataToStorage(updatedList, updated.id, sessionMeta);
      } catch (e) {}
      return updatedList;
    });
  };

  const handleUpdateKioskStep = (step: number, modality?: 'voice' | 'touch') => {
    setSessionMeta((prev) => ({
      ...prev,
      [activePatientId]: {
        step,
        intakeModality: modality || prev[activePatientId]?.intakeModality || 'voice',
        lastUpdated: new Date().toISOString()
      }
    }));
  };

  const handleAddNewPatient = () => {
    const newTokenNum = `OPD-${100 + patients.length + 1}`;
    const newPatient: PatientProfile = {
      id: 'patient-' + Date.now(),
      name: `Patient OPD-${100 + patients.length + 1}`,
      age: 30,
      gender: 'male',
      mobile: '+91 98000 00000',
      uhid: 'UHID-2026-08' + (patients.length + 1),
      tokenNumber: newTokenNum,
      registeredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: (selectedLanguage as any) || 'hi',
      careStream: 'allopathy',
      department: 'General Medicine OPD',
      consentGiven: false,
      consentType: 'touch',
      consentTimestamp: new Date().toISOString(),
      symptoms: [],
      pastIllnesses: [],
      pastSurgeries: [],
      currentMedications: [],
      allergies: [],
      familyHistory: [],
      habits: { smoking: false, alcohol: false, tobacco: false, diet: 'Standard' },
      vitals: {
        bpSystolic: 120,
        bpDiastolic: 80,
        heartRate: 74,
        spO2: 98,
        temperature: 98.4,
        bloodSugar: 100,
        weightKg: 65,
        heightCm: 168,
        bmi: 23.0,
        recordedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      scannedDocuments: [],
      timeline: [],
      triageRisk: 'STANDARD_OPD',
      redFlagsDetected: [],
      status: 'intake_in_progress',
      doctorVerified: false
    };

    setPatients((prev) => [newPatient, ...prev]);
    setActivePatientId(newPatient.id);
    setSessionMeta((prev) => ({
      ...prev,
      [newPatient.id]: {
        step: 1,
        intakeModality: 'voice',
        lastUpdated: new Date().toISOString()
      }
    }));
    navigateToView('kiosk', { patientId: newPatient.id });
  };

  const handleBookAppointmentToQueue = (booking: {
    hospital: any;
    department: string;
    patientName: string;
    phone: string;
    slot: string;
    abhaId?: string;
  }) => {
    const isAyush = booking.hospital.type === 'ayush' || booking.department.toLowerCase().includes('ayurved') || booking.department.toLowerCase().includes('kayachikitsa');
    const newPatient: PatientProfile = {
      id: `p-map-${Date.now()}`,
      tokenNumber: `OPD-${Math.floor(100 + Math.random() * 900)}`,
      uhid: `UHID-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      name: booking.patientName,
      age: 45,
      gender: 'male',
      mobile: booking.phone,
      language: selectedLanguage as any,
      careStream: isAyush ? 'ayurveda' : 'allopathy',
      registeredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'ready_for_doctor',
      department: booking.department,
      abhaId: booking.abhaId || `${Math.floor(10 + Math.random() * 89)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      consentGiven: true,
      consentType: 'touch',
      consentTimestamp: new Date().toISOString(),
      symptoms: [
        { 
          id: `sym-${Date.now()}-1`,
          name: 'Follow-up Consultation', 
          bodyPart: 'General',
          duration: '3 days', 
          severity: 4,
          onset: 'gradual'
        },
        { 
          id: `sym-${Date.now()}-2`,
          name: 'General Checkup', 
          bodyPart: 'Whole Body',
          duration: '1 week', 
          severity: 2,
          onset: 'gradual'
        }
      ],
      vitals: {
        bpSystolic: 120,
        bpDiastolic: 80,
        heartRate: 74,
        spO2: 98,
        temperature: 98.4,
        respiratoryRate: 16
      },
      pastIllnesses: [],
      pastSurgeries: [],
      familyHistory: [],
      habits: {
        smoking: false,
        alcohol: false,
        tobacco: false,
        diet: 'Vegetarian'
      },
      currentMedications: [],
      allergies: [],
      scannedDocuments: [],
      timeline: [
        {
          id: `tl-${Date.now()}`,
          date: 'Today',
          title: `OPD Slot Booked at ${booking.hospital.name}`,
          category: isAyush ? 'ayush' : 'prescription',
          hospitalOrDoctor: booking.hospital.name,
          summary: `Booked ${booking.department} slot for ${booking.slot}`
        }
      ],
      triageRisk: 'STANDARD_OPD',
      redFlagsDetected: [],
      doctorVerified: false
    };

    setPatients((prev) => [newPatient, ...prev]);
    setActivePatientId(newPatient.id);
  };

  const handleResetStorage = () => {
    if (window.confirm('Reset local kiosk storage to default hospital cases? Any unsaved custom modifications will be cleared.')) {
      clearKioskLocalStorage();
      setPatients(SAMPLE_PATIENTS);
      setActivePatientId(SAMPLE_PATIENTS[0].id);
      setSessionMeta({});
      clearPatientLanguage();
      setPublicLanguage('en');
    }
  };

  const handleChangeLanguage = (newLang: string) => {
    const valid = (newLang in SUPPORTED_LANGUAGES ? newLang : 'en') as SupportedLanguage;
    if (authSession?.role === 'patient') {
      setPatientLanguage(valid);
      if (activePatient) {
        handleUpdatePatient({
          ...activePatient,
          language: valid
        });
      }
    } else {
      setPublicLanguage(valid);
    }
  };

  return (
    <div className={`${currentView === 'map' ? 'h-screen overflow-hidden' : 'min-h-screen'} bg-slate-50 flex flex-col text-slate-900 font-sans antialiased`}>
      {/* Top Bar with Slide-Out Dashboard Drawer */}
      <SidebarDashboard
        currentView={currentView === 'access-denied' ? 'landing' : currentView}
        onChangeView={(view) => navigateToView(view)}
        selectedLanguage={selectedLanguage}
        onChangeLanguage={handleChangeLanguage}
        patients={patients}
        activePatientId={activePatientId}
        onSelectPatient={(id) => {
          setActivePatientId(id);
        }}
        onOpenAbdmModal={() => setIsAbdmModalOpen(true)}
        onOpenInfographicModal={() => setIsInfographicModalOpen(true)}
        onAddNewPatient={handleAddNewPatient}
        saveStatus={saveStatus}
        lastSavedTimestamp={lastSavedTimestamp}
        onForceSave={forceSave}
        onResetStorage={handleResetStorage}
        userRole={userRole}
        authSession={authSession}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 ${currentView === 'map' ? 'min-h-0 overflow-hidden' : ''}`}>
        {/* Mobile QR Handoff Resumption Banner */}
        {mobileResumedNotice && (
          <div className="bg-indigo-900 text-indigo-100 px-4 py-2.5 border-b border-indigo-800 text-xs shadow-sm shrink-0">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-300 shrink-0" />
                <span>
                  <strong>Smartphone Sync Active:</strong> {mobileResumedNotice}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileResumedNotice(null)}
                className="px-2 py-0.5 bg-indigo-800 hover:bg-indigo-700 rounded text-[11px] font-bold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Main Content Workspace */}
        <main className={`flex-1 w-full mx-auto ${currentView === 'landing' ? 'p-0 max-w-none flex flex-col' : currentView === 'map' ? 'p-0 max-w-none flex flex-col h-full min-h-0 overflow-hidden' : 'max-w-7xl p-4 sm:p-6 lg:p-8'}`}>
          {currentView === 'landing' && (
            <LandingView
              onNavigateView={(view) => navigateToView(view)}
              onSelectPatient={(id) => setActivePatientId(id)}
              patients={patients}
              onOpenAbdmModal={() => setIsAbdmModalOpen(true)}
              onOpenInfographicModal={() => setIsInfographicModalOpen(true)}
              onFindMyLocation={(coords, zoom, message) => {
                setMapTargetLocation(coords);
                setMapTargetZoom(zoom || 15);
                setMapStatusMessage(message || 'Your current location has been found.');
                navigateToView('map');
              }}
              authSession={authSession}
              onOpenStaffLoginModal={(target, msg) => {
                setStaffLoginTarget(target || 'doctor');
                setStaffLoginMessage(msg);
                setIsStaffLoginModalOpen(true);
              }}
              onNavigateToPatientLogin={(dest, msg) => {
                setIntendedDestination(dest || 'patient');
                setIntendedDestinationMessage(msg || 'Patient sign-in required.');
                navigateToView('login');
              }}
              onLoginSuccess={handleLoginSuccess}
            />
          )}

          {currentView === 'login' && (
            <PatientLoginPortal
              patients={patients}
              activePatientId={activePatientId}
              onSelectPatient={(id) => setActivePatientId(id)}
              onAddNewPatientProfile={(newProfile) => {
                setPatients(prev => {
                  const filtered = prev.filter(p => p.id !== newProfile.id);
                  const updated = [newProfile, ...filtered];
                  saveKioskDataToStorage(updated, newProfile.id);
                  return updated;
                });
                setActivePatientId(newProfile.id);
              }}
              onNavigateView={(view) => navigateToView(view)}
              intendedDestination={intendedDestination || undefined}
              destinationMessage={intendedDestinationMessage || undefined}
              onLoginSuccess={handleLoginSuccess}
              onOpenStaffLogin={() => {
                setStaffLoginTarget('doctor');
                setStaffLoginMessage('Physician or Clinical Staff credentials required.');
                setIsStaffLoginModalOpen(true);
              }}
            />
          )}

          {currentView === 'access-denied' && (
            <AccessDeniedView
              attemptedView={accessDeniedDetails?.attemptedView || 'doctor'}
              requiredLevel={accessDeniedDetails?.requiredLevel || 'staff_doctor'}
              customMessage={accessDeniedDetails?.message}
              currentSession={authSession}
              onBackToHome={() => navigateToView('landing')}
              onOpenPatientLogin={() => {
                setIntendedDestination(accessDeniedDetails?.attemptedView || 'patient');
                setIntendedDestinationMessage('Please sign in with your patient credentials.');
                navigateToView('login');
              }}
              onOpenStaffLogin={(target) => {
                setStaffLoginTarget(target || accessDeniedDetails?.attemptedView || 'doctor');
                setStaffLoginMessage(`Please authenticate with authorized credentials for ${accessDeniedDetails?.attemptedView || 'this console'}.`);
                setIsStaffLoginModalOpen(true);
              }}
              onLogout={handleLogout}
            />
          )}

          {currentView === 'kiosk' && (
            (authSession && authSession.role === 'patient' && activePatient) ? (
              <KioskIntakeView
                currentPatient={activePatient}
                onUpdatePatient={handleUpdatePatient}
                onGoToDoctorPortal={() => navigateToView('doctor')}
                savedStep={sessionMeta[activePatient.id]?.step}
                savedModality={sessionMeta[activePatient.id]?.intakeModality}
                onStepChange={handleUpdateKioskStep}
                saveStatus={saveStatus}
                lastSavedTimestamp={lastSavedTimestamp}
                onForceSave={forceSave}
                onBackToLanding={() => navigateToView('patient')}
                onSaveToDashboardTokens={(updated) => {
                  handleUpdatePatient(updated);
                  setPatientInitialSection('tokens');
                  navigateToView('patient');
                }}
              />
            ) : (
              <PatientLoginPortal
                patients={patients}
                activePatientId={activePatientId}
                onSelectPatient={(id) => setActivePatientId(id)}
                onAddNewPatientProfile={(newProfile) => {
                  setPatients(prev => {
                    const filtered = prev.filter(p => p.id !== newProfile.id);
                    const updated = [newProfile, ...filtered];
                    saveKioskDataToStorage(updated, newProfile.id);
                    return updated;
                  });
                  setActivePatientId(newProfile.id);
                }}
                onNavigateView={(view) => navigateToView(view)}
                intendedDestination="kiosk"
                destinationMessage="Patient sign-in required to access the Pre-Consultation Kiosk & Voice Intake."
                onLoginSuccess={handleLoginSuccess}
                onOpenStaffLogin={() => {
                  setStaffLoginTarget('doctor');
                  setStaffLoginMessage('Physician or Clinical Staff credentials required.');
                  setIsStaffLoginModalOpen(true);
                }}
              />
            )
          )}

          {currentView === 'triage' && (
            <TriageNurseView
              patients={patients}
              onSelectPatientForDoctor={(id) => {
                setActivePatientId(id);
                navigateToView('doctor', { patientId: id });
              }}
              onUpdatePatient={handleUpdatePatient}
              onAddNewPatient={(newP) => {
                setPatients((prev) => [newP, ...prev]);
                setActivePatientId(newP.id);
              }}
              onBackToLanding={() => navigateToView('landing')}
              onLogout={handleLogout}
            />
          )}

          {currentView === 'doctor' && (
            <DoctorPortalView
              patients={patients}
              activePatientId={activePatientId}
              onSelectPatient={(id) => {
                setActivePatientId(id);
              }}
              onUpdatePatient={handleUpdatePatient}
              onBackToLanding={() => navigateToView('landing')}
              onLogout={handleLogout}
              doctorName={
                authSession && (authSession.role === 'doctor' || authSession.role === 'medical_officer')
                  ? authSession.userName
                  : 'Dr. Sohom Das, MD'
              }
              doctorSpecialty={
                authSession && (authSession.role === 'doctor' || authSession.role === 'medical_officer')
                  ? (authSession.roleTitle || authSession.department || 'Senior Consultant Physician • General Medicine OPD (Room 104)')
                  : 'Senior Consultant Physician • General Medicine OPD (Room 104)'
              }
              doctorId={
                authSession && (authSession.role === 'doctor' || authSession.role === 'medical_officer')
                  ? (authSession.staffCode || authSession.userId || 'DOC-SOHOM-01')
                  : 'DOC-SOHOM-01'
              }
            />
          )}

          {currentView === 'admin' && (
            <AdminAnalyticsView
              patients={patients}
              onOpenInfographicModal={() => setIsInfographicModalOpen(true)}
              onOpenAbdmModal={() => setIsAbdmModalOpen(true)}
              onBackToLanding={() => navigateToView('landing')}
              onUpdatePatient={handleUpdatePatient}
              onDeletePatient={(delId) => {
                setPatients(prev => {
                  const updated = prev.filter(p => p.id !== delId);
                  saveKioskDataToStorage(updated, updated[0]?.id || '');
                  return updated;
                });
                if (activePatientId === delId) {
                  setActivePatientId(patients.find(p => p.id !== delId)?.id || '');
                }
              }}
            />
          )}

          {currentView === 'patient' && (
            (authSession && authSession.role === 'patient') ? (
              <PatientPortalView
                patients={patients}
                activePatientId={activePatientId}
                onSelectPatient={(id) => setActivePatientId(id)}
                onStartKioskIntake={(patient) => {
                  setActivePatientId(patient.id);
                  navigateToView('kiosk', { patientId: patient.id });
                }}
                onUpdatePatient={handleUpdatePatient}
                onBackToKiosk={() => navigateToView('kiosk')}
                onBackToLanding={() => navigateToView('landing')}
                onLogout={handleLogout}
                initialSection={patientInitialSection}
              />
            ) : (
              <PatientLoginPortal
                patients={patients}
                activePatientId={activePatientId}
                onSelectPatient={(id) => setActivePatientId(id)}
                onAddNewPatientProfile={(newProfile) => {
                  setPatients(prev => {
                    const filtered = prev.filter(p => p.id !== newProfile.id);
                    const updated = [newProfile, ...filtered];
                    saveKioskDataToStorage(updated, newProfile.id);
                    return updated;
                  });
                  setActivePatientId(newProfile.id);
                }}
                onNavigateView={(view) => navigateToView(view)}
                intendedDestination="patient"
                destinationMessage="Please sign in to access your Patient Dashboard, Prescriptions, and Health Records."
                onLoginSuccess={handleLoginSuccess}
                onOpenStaffLogin={() => {
                  setStaffLoginTarget('doctor');
                  setStaffLoginMessage('Physician or Clinical Staff credentials required.');
                  setIsStaffLoginModalOpen(true);
                }}
              />
            )
          )}

          {currentView === 'map' && (
            <HospitalLocatorMap
              patients={patients}
              activePatientId={activePatientId}
              onBookAppointmentToQueue={handleBookAppointmentToQueue}
              onNavigateToKiosk={() => navigateToView('kiosk')}
              onBackToLanding={() => navigateToView(authSession?.role === 'patient' ? 'patient' : 'landing')}
              initialUserLocation={mapTargetLocation}
              initialZoom={mapTargetZoom}
              initialSuccessMessage={mapStatusMessage}
              onClearInitialLocation={() => {
                setMapTargetLocation(null);
                setMapTargetZoom(undefined);
                setMapStatusMessage(null);
              }}
            />
          )}

          {currentView === 'assistant' && (
            <GeminiAssistantView
              patients={patients}
              activePatientId={activePatientId}
              onNavigateView={(view) => navigateToView(view)}
            />
          )}
        </main>

        {/* Global Staff / Physician Login Modal */}
        <StaffLoginModal
          isOpen={isStaffLoginModalOpen}
          onClose={() => setIsStaffLoginModalOpen(false)}
          onNavigateView={(view) => navigateToView(view)}
          onSelectPatient={(id) => setActivePatientId(id)}
          patients={patients}
          targetDestination={staffLoginTarget}
          destinationMessage={staffLoginMessage}
          onLoginSuccess={handleLoginSuccess}
        />

        {/* ABDM & DPDP Architecture Modal */}
        <AbdmArchitectureModal
          isOpen={isAbdmModalOpen}
          onClose={() => setIsAbdmModalOpen(false)}
          onOpenInfographicModal={() => setIsInfographicModalOpen(true)}
        />

        {/* SIH Hackathon AI-Powered Patient Intake Workflow Infographic Modal */}
        <WorkflowInfographicModal
          isOpen={isInfographicModalOpen}
          onClose={() => setIsInfographicModalOpen(false)}
        />
      </div>
    </div>
  );
}

export default App;

