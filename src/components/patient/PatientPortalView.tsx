import React, { useState, useEffect } from 'react';
import { 
  User, 
  Calendar, 
  Clock, 
  Stethoscope, 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Pill,
  Printer,
  Download,
  Activity,
  QrCode,
  ArrowRight,
  ArrowLeft,
  Plus,
  Search,
  KeyRound,
  Phone,
  Mail,
  LogIn,
  LogOut,
  RefreshCw,
  Sliders,
  ChevronRight,
  Heart,
  Eye,
  Check,
  AlertTriangle,
  X,
  Database,
  Mic,
  Camera,
  Languages,
  UserCheck,
  Radio,
  FileCheck,
  Share2,
  FileSpreadsheet,
  Siren,
  Ticket,
  Copy,
  BookmarkCheck
} from 'lucide-react';
import { Appointment, PatientProfile, SupportedLanguage, CareStream, PrescriptionRecord, PatientOneYearSummary, SavedOpdToken } from '../../types';
import { SafeQRCode } from '../common/SafeQRCode';
import { generateHandoffUrl } from '../../utils/kioskHandoff';
import { BookAppointmentModal } from './BookAppointmentModal';
import { BookAmbulanceModal } from './BookAmbulanceModal';
import { AppointmentDetailsModal } from './AppointmentDetailsModal';
import { PatientLogin, PhrRetrievalSummary } from './PatientLogin';
import { SupabaseStatusModal } from '../common/SupabaseStatusModal';
import { MultilingualVoiceAIModule } from '../voice/MultilingualVoiceAIModule';
import { PrescriptionScannerView } from '../prescription/PrescriptionScannerView';
import { PrescriptionListView } from '../prescription/PrescriptionListView';
import { MedicalHistoryModule } from '../history/MedicalHistoryModule';
import { fetchAppointmentsFromSupabase, SUPABASE_PROJECT_ID } from '../../utils/supabaseClient';
import { fetchPatientAppointments, cancelAppointmentApi } from '../../utils/appointmentService';
import { getOrGenerateOneYearClinicalSummary } from '../../services/medicalHistoryService';
import { useLanguage } from '../../context/LanguageContext';
import { ORDERED_LANGUAGES } from '../common/LanguageSelector';
import { DashboardHeader } from '../dashboard/DashboardHeader';
import { HealthSnapshotCards } from '../dashboard/HealthSnapshotCards';
import { OneYearSummarySection } from '../dashboard/OneYearSummarySection';
import { RecentRecordsSection } from '../dashboard/RecentRecordsSection';

export type PatientDashboardSection = 
  | 'dashboard' 
  | 'tokens'
  | 'history' 
  | 'prescriptions' 
  | 'reports' 
  | 'scanner' 
  | 'appointments' 
  | 'profile' 
  | 'voice_ai';

interface PatientPortalViewProps {
  patients: PatientProfile[];
  activePatientId: string;
  onSelectPatient: (patientId: string) => void;
  onStartKioskIntake: (patient: PatientProfile) => void;
  onUpdatePatient: (updatedPatient: PatientProfile) => void;
  onLogout?: () => void;
  onBackToKiosk?: () => void;
  onBackToLanding?: () => void;
  initialSection?: PatientDashboardSection;
}

export const PatientPortalView: React.FC<PatientPortalViewProps> = ({
  patients,
  activePatientId,
  onSelectPatient,
  onStartKioskIntake,
  onUpdatePatient,
  onLogout,
  onBackToKiosk,
  onBackToLanding,
  initialSection
}) => {
  const { language, setLanguage, t } = useLanguage();
  
  // Authentication & View State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [currentSection, setCurrentSection] = useState<PatientDashboardSection>(initialSection || 'dashboard');
  const [copiedToken, setCopiedToken] = useState<boolean>(false);

  useEffect(() => {
    if (initialSection) {
      setCurrentSection(initialSection);
    }
  }, [initialSection]);
  
  // Modals state
  const [isBookModalOpen, setIsBookModalOpen] = useState<boolean>(false);
  const [isAmbulanceModalOpen, setIsAmbulanceModalOpen] = useState<boolean>(false);
  const [selectedAppointmentForDetails, setSelectedAppointmentForDetails] = useState<Appointment | null>(null);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [showSupabaseStatusModal, setShowSupabaseStatusModal] = useState<boolean>(false);

  // 1-Year Summary state
  const [oneYearSummary, setOneYearSummary] = useState<PatientOneYearSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(true);

  // Appointments State
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState<boolean>(true);

  // Strict: Fetch ONLY the active authenticated patient
  const activePatient = patients.find(p => p.id === activePatientId) || null;

  // Load 1-Year summary for active patient
  useEffect(() => {
    if (activePatient) {
      setIsLoadingSummary(true);
      getOrGenerateOneYearClinicalSummary(activePatient)
        .then(summary => {
          setOneYearSummary(summary);
          setIsLoadingSummary(false);
        })
        .catch(() => setIsLoadingSummary(false));
    }
  }, [activePatient?.id, activePatient?.timeline, activePatient?.pastIllnesses, activePatient?.scannedDocuments]);

  // Load real patient appointments from API & Supabase
  const loadPatientAppointments = React.useCallback(async () => {
    if (!activePatient) return;
    setIsLoadingAppointments(true);
    try {
      const res = await fetchPatientAppointments(activePatient.id, activePatient.uhid);
      if (res.success && res.appointments) {
        const { appointments: dbAppointments } = await fetchAppointmentsFromSupabase();
        const combined = [...res.appointments];
        if (dbAppointments && dbAppointments.length > 0) {
          const existingIds = new Set(combined.map(a => a.id));
          dbAppointments.forEach(da => {
            if (da && da.id && !existingIds.has(da.id)) {
              if (
                da.patientId === activePatient.id || 
                (da.uhid && da.uhid === activePatient.uhid) ||
                (da.patientName && da.patientName.toLowerCase() === activePatient.name.toLowerCase())
              ) {
                combined.push(da);
                existingIds.add(da.id);
              }
            }
          });
        }
        setAppointments(combined);
      }
    } catch (err) {
      console.error('Error loading patient appointments:', err);
    } finally {
      setIsLoadingAppointments(false);
    }
  }, [activePatient?.id, activePatient?.uhid, activePatient?.name]);

  useEffect(() => {
    loadPatientAppointments();
  }, [loadPatientAppointments]);

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!activePatient) return;
    const res = await cancelAppointmentApi(appointmentId, activePatient.id);
    if (res.success) {
      setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status: 'cancelled' } : a));
      if (selectedAppointmentForDetails && selectedAppointmentForDetails.id === appointmentId) {
        setSelectedAppointmentForDetails(prev => prev ? { ...prev, status: 'cancelled' } : null);
      }
    }
  };

  if (!activePatient) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 mx-auto flex items-center justify-center">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Patient Session Required</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">Please sign in to access your personal patient dashboard and health records.</p>
        <div className="pt-2 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => onBackToLanding ? onBackToLanding() : setIsLoggedIn(false)}
            className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Filter ONLY this patient's appointments (Security & Privacy)
  const patientAppointments = appointments.filter(a => 
    a.patientId === activePatient.id || 
    (a.uhid && a.uhid === activePatient.uhid) ||
    (a.patientName && a.patientName.toLowerCase() === activePatient.name.toLowerCase())
  );
  const upcomingAppointments = patientAppointments.filter(a => a.status !== 'consultation_done' && a.status !== 'cancelled');
  const pastAppointments = patientAppointments.filter(a => a.status === 'consultation_done' || a.status === 'cancelled');

  // Saved Tokens List for this patient (Persisted from Kiosk & Session)
  const savedTokensList: SavedOpdToken[] = React.useMemo(() => {
    if (!activePatient) return [];
    const tokens = activePatient.savedTokens ? [...activePatient.savedTokens] : [];
    // If active patient has a tokenNumber and it's not yet in savedTokens, synthesize an active token entry
    if (activePatient.tokenNumber && !tokens.some(t => t.tokenNumber === activePatient.tokenNumber)) {
      tokens.unshift({
        id: `tok-${activePatient.tokenNumber}`,
        tokenNumber: activePatient.tokenNumber,
        uhid: activePatient.uhid,
        patientName: activePatient.name,
        department: activePatient.department,
        careStream: activePatient.careStream,
        roomNumber: 'Room 04 (Dr. Desk)',
        estimatedWaitMinutes: 8,
        triageRisk: activePatient.triageRisk,
        issuedAt: activePatient.registeredAt || new Date().toISOString(),
        status: 'active',
        complaintsSummary: activePatient.symptoms && activePatient.symptoms.length > 0 
          ? activePatient.symptoms.map(s => s.name).join(', ') 
          : 'General OPD Consultation',
        vitalsSummary: activePatient.vitals?.bpSystolic 
          ? `BP: ${activePatient.vitals.bpSystolic}/${activePatient.vitals.bpDiastolic} mmHg, HR: ${activePatient.vitals.heartRate} bpm, SpO2: ${activePatient.vitals.spO2}%` 
          : undefined,
        doctorName: 'Dr. Desk (Room 04)',
        scannedDocsCount: activePatient.scannedDocuments?.length || 0,
        qrPayload: generateHandoffUrl(activePatient, 7, false)
      });
    }
    return tokens;
  }, [activePatient?.savedTokens, activePatient?.tokenNumber, activePatient?.uhid, activePatient?.symptoms, activePatient?.vitals, activePatient?.department, activePatient?.careStream, activePatient?.triageRisk, activePatient?.registeredAt, activePatient?.scannedDocuments]);

  const activeToken = savedTokensList.find(t => t.tokenNumber === activePatient?.tokenNumber) || savedTokensList[0] || null;

  const handleCopyToken = () => {
    if (activeToken?.tokenNumber) {
      navigator.clipboard.writeText(activeToken.tokenNumber);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleLoginSuccess = (patient: PatientProfile) => {
    onSelectPatient(patient.id);
    setIsLoggedIn(true);
    setCurrentSection('dashboard');
  };

  const handleRegisterNewPatient = (newProfile: PatientProfile) => {
    onUpdatePatient(newProfile);
    onSelectPatient(newProfile.id);
    setIsLoggedIn(true);
    setCurrentSection('dashboard');
  };

  const handleLogoutAction = () => {
    setIsLoggedIn(false);
    setCurrentSection('dashboard');
    if (onLogout) {
      onLogout();
    } else if (onBackToLanding) {
      onBackToLanding();
    }
  };

  const handlePrescriptionSaved = (record: PrescriptionRecord) => {
    const newDoc = {
      id: record.id,
      fileName: record.fileName || 'Scanned Prescription',
      documentTitle: record.diagnosis ? `Prescription: ${record.diagnosis}` : 'Scanned Prescription',
      documentType: 'Prescription',
      dateOfRecord: record.prescriptionDate || new Date().toISOString().split('T')[0],
      fileType: 'prescription' as const,
      imageUrl: record.originalFileUrl,
      documentDate: record.prescriptionDate || new Date().toISOString().split('T')[0],
      extractedData: {
        diagnoses: record.diagnosis ? [record.diagnosis] : [],
        medications: record.medications.map(m => ({
          name: m.medicineName,
          dose: m.dosage,
          frequency: m.frequency,
          duration: m.duration
        }))
      }
    };

    const updatedPatient: PatientProfile = {
      ...activePatient,
      scannedDocuments: [newDoc, ...(activePatient.scannedDocuments || [])]
    };
    onUpdatePatient(updatedPatient);
    setCurrentSection('prescriptions');
  };

  // 1. If not logged in, render the clean login screen
  if (!isLoggedIn) {
    return (
      <PatientLogin
        patients={patients}
        onLoginSuccess={handleLoginSuccess}
        onRegisterNew={handleRegisterNewPatient}
        onBackToKiosk={onBackToKiosk}
      />
    );
  }

  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // 2. MAIN PATIENT DASHBOARD & INNER SECTIONS
  return (
    <div id="patient-dashboard-container" className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6 animate-in fade-in duration-150">
      
      {/* 2.1 DASHBOARD HEADER (Consistent across Patient Views) */}
      <DashboardHeader
        role="patient"
        patientName={activePatient.name}
        patientId={activePatient.patientId || activePatient.id}
        uhid={activePatient.uhid}
        onLogout={handleLogoutAction}
        onOpenProfile={() => setCurrentSection('profile')}
        onOpenQrModal={() => setShowQrModal(true)}
      />

      {/* ========================================================================= */}
      {/* 2.2 DASHBOARD HOME VIEW                                                   */}
      {/* ========================================================================= */}
      {currentSection === 'dashboard' && (
        <div className="space-y-6">
          
          {/* Welcome Banner: Reassuring & Human */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {getGreetingTime()}, {activePatient.name}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Your clinical history is ready for your next consultation.
              </p>
            </div>

            {/* Quick Consultation Trigger */}
            <button
              type="button"
              onClick={() => onStartKioskIntake(activePatient)}
              className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0 self-start md:self-center"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Start Intake Consultation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Actions Bar (7 Essential Patient Actions including OPD Tokens) */}
          <div className="space-y-2.5">
            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              
              {/* 1. OPD Tokens & Passes (Prominent Kiosk Token Section) */}
              <button
                type="button"
                id="quick-action-tokens-section-btn"
                onClick={() => setCurrentSection('tokens')}
                className="p-3.5 rounded-xl bg-teal-50/80 hover:bg-teal-100/90 dark:bg-teal-950/60 dark:hover:bg-teal-900/80 text-teal-900 dark:text-teal-200 flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer border-2 border-teal-400 dark:border-teal-700 shadow-xs"
              >
                <div className="w-9 h-9 rounded-lg bg-teal-700 text-white flex items-center justify-center shadow-xs">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-xs block leading-tight text-teal-950 dark:text-white">OPD Tokens</span>
                  <span className="text-[10px] font-bold font-mono text-teal-700 dark:text-teal-400">
                    {activeToken ? activeToken.tokenNumber : 'Queue Pass'}
                  </span>
                </div>
              </button>

              {/* 2. Start Consultation */}
              <button
                type="button"
                onClick={() => onStartKioskIntake(activePatient)}
                className="p-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer shadow-xs border border-teal-600"
              >
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-bold text-xs block leading-tight">Start Consultation</span>
                  <span className="text-[10px] text-teal-100">AI Intake</span>
                </div>
              </button>

              {/* 3. Medical History */}
              <button
                type="button"
                onClick={() => setCurrentSection('history')}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-teal-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer border border-slate-200 dark:border-slate-800"
              >
                <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-xs block leading-tight">Medical History</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Timeline & Illnesses</span>
                </div>
              </button>

              {/* 4. Prescriptions */}
              <button
                type="button"
                onClick={() => setCurrentSection('prescriptions')}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer border border-slate-200 dark:border-slate-800"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-xs block leading-tight">Prescriptions</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Active Medicines</span>
                </div>
              </button>

              {/* 5. Reports & Documents */}
              <button
                type="button"
                onClick={() => setCurrentSection('reports')}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer border border-slate-200 dark:border-slate-800"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-xs block leading-tight">Reports & Docs</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Lab Scans & OCR</span>
                </div>
              </button>

              {/* 6. Appointments */}
              <button
                type="button"
                onClick={() => setCurrentSection('appointments')}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer border border-slate-200 dark:border-slate-800"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-xs block leading-tight">Appointments</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{upcomingAppointments.length} Scheduled</span>
                </div>
              </button>

              {/* 7. SOS Ambulance (Visually Distinct Emergency Action) */}
              <button
                type="button"
                onClick={() => setIsAmbulanceModalOpen(true)}
                className="p-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-800 dark:text-rose-200 flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer border-2 border-rose-400 dark:border-rose-700 shadow-xs"
              >
                <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center animate-pulse">
                  <Siren className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-black text-xs block leading-tight text-rose-800 dark:text-rose-200">SOS Ambulance</span>
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">Emergency</span>
                </div>
              </button>

            </div>
          </div>

          {/* Health Snapshot Section (Actual recorded data with fallbacks) */}
          <HealthSnapshotCards
            patient={activePatient}
            onNavigateToSection={(sec) => setCurrentSection(sec)}
          />

          {/* 1-Year Clinical Summary (Prominent Section) */}
          <OneYearSummarySection
            summary={oneYearSummary}
            patient={activePatient}
            isLoading={isLoadingSummary}
            onOpenFullHistory={() => setCurrentSection('history')}
          />

          {/* Recent Records Section (Consultations, Prescriptions, Lab Reports) */}
          <RecentRecordsSection
            patient={activePatient}
            onNavigateToSection={(sec) => setCurrentSection(sec)}
          />

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2.3 INNER VIEW: 🎟️ OPD TOKENS & QUEUE PASSES                             */}
      {/* ========================================================================= */}
      {currentSection === 'tokens' && (
        <div className="space-y-6">
          {/* Top Bar Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <button
              type="button"
              id="tokens-back-to-dashboard-btn"
              onClick={() => setCurrentSection('dashboard')}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-teal-700 dark:text-teal-400" />
              <span>← Back to Dashboard</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="print-active-token-btn"
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <Printer className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span>Print Token Slip</span>
              </button>

              <button
                type="button"
                id="kiosk-new-token-btn"
                onClick={() => onStartKioskIntake(activePatient)}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-teal-200" />
                <span>Start New OPD Intake</span>
              </button>
            </div>
          </div>

          {/* Section Header Notice */}
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/30 p-4 sm:p-5 rounded-3xl border border-teal-200 dark:border-teal-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-teal-700 dark:text-teal-400" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  My OPD Tokens & Queue Passes
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 text-[10px] font-black uppercase tracking-wider border border-teal-300 dark:border-teal-700">
                  {savedTokensList.length} Saved in Dashboard
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                Here are your verified consultation tokens saved directly from the OPD Kiosk. Keep your token number ready when Room 04 calls your turn.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono font-bold text-teal-800 dark:text-teal-300 bg-white/80 dark:bg-slate-900/80 px-3.5 py-2 rounded-xl border border-teal-200 dark:border-teal-800 shrink-0">
              <Clock className="w-4 h-4 text-teal-600" />
              <span>Queue Status: Active</span>
            </div>
          </div>

          {/* Main Active Token Slip Card */}
          {activeToken ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-teal-600/50 dark:border-teal-500/40 p-6 sm:p-8 shadow-sm space-y-6">
              {/* Slip Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-black uppercase tracking-widest text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2.5 py-1 rounded-md border border-teal-200 dark:border-teal-800">
                      GOVERNMENT GENERAL HOSPITAL OPD
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Saved Verification Slip
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {activePatient.department} • {activePatient.careStream.toUpperCase()} Stream
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    {copiedToken ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 dark:text-emerald-400 font-black">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                        <span>Copy Token</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-teal-200 dark:border-teal-800"
                  >
                    <Printer className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                    <span>Print Slip</span>
                  </button>
                </div>
              </div>

              {/* Big Token Number & Room Showcase */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
                <div className="md:col-span-2 p-5 bg-gradient-to-br from-teal-50 to-slate-50 dark:from-slate-800/70 dark:to-slate-900 rounded-2xl border border-teal-100 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Assigned Token Number
                    </span>
                    <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-teal-900 dark:text-teal-300 block my-1">
                      {activeToken.tokenNumber}
                    </span>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        Active in OPD Queue
                      </span>
                      {activeToken.triageRisk === 'CRITICAL_EMERGENCY' && (
                        <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-300">
                          🚨 Emergency Fast-Track
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-700 pt-3 sm:pt-0 sm:pl-6 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-semibold block text-[10px]">Consultation Desk</span>
                      <span className="font-extrabold text-slate-900 dark:text-white text-sm">Room 04 (Dr. Desk)</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-semibold block text-[10px]">Estimated Wait Time</span>
                      <span className="font-bold text-teal-800 dark:text-teal-300">~ 8 mins (2 patients ahead)</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-semibold block text-[10px]">Saved To</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Patient Dashboard • Tokens</span>
                    </div>
                  </div>
                </div>

                {/* QR Code Container */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center space-y-2">
                  <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200">
                    <SafeQRCode
                      value={activeToken.qrPayload || generateHandoffUrl(activePatient, 7, false)}
                      size={110}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                    Scan at Doctor Desk
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">
                    UHID: {activePatient.uhid}
                  </span>
                </div>
              </div>

              {/* Patient & Clinical Snapshot Attached to Token */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Patient Name</span>
                  <strong className="text-slate-900 dark:text-white">{activePatient.name}</strong>
                  <span className="text-[10px] text-slate-500 block font-mono">Age {activePatient.age} • {activePatient.gender}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">ABHA Address</span>
                  <strong className="text-teal-800 dark:text-teal-300 font-mono text-[11px] block truncate">
                    {activePatient.abhaId || '91-4829-1029-4820'}
                  </strong>
                  <span className="text-[10px] text-slate-500 block">Authenticated Consent</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Chief Complaints</span>
                  <strong className="text-slate-900 dark:text-white truncate block">
                    {activeToken.complaintsSummary || (activePatient.symptoms && activePatient.symptoms.length > 0 ? activePatient.symptoms.map(s => s.name).join(', ') : 'General Consultation')}
                  </strong>
                  <span className="text-[10px] text-slate-500 block">Logged via Kiosk</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Captured Vitals</span>
                  <strong className="text-slate-900 dark:text-white block font-mono text-[11px]">
                    {activePatient.vitals?.bpSystolic ? `${activePatient.vitals.bpSystolic}/${activePatient.vitals.bpDiastolic} mmHg` : 'Standard Baseline'}
                  </strong>
                  <span className="text-[10px] text-slate-500 block">HR: {activePatient.vitals?.heartRate || 72} bpm • SpO2: {activePatient.vitals?.spO2 || 98}%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-3 shadow-xs">
              <Ticket className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">No OPD Tokens Saved Yet</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Complete your clinical intake using the OPD Kiosk to generate and save your consultation token pass right here.
              </p>
              <button
                type="button"
                onClick={() => onStartKioskIntake(activePatient)}
                className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-teal-200" />
                <span>Start OPD Kiosk Intake</span>
              </button>
            </div>
          )}

          {/* Saved Tokens History / Queue Passes */}
          {savedTokensList.length > 1 && (
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Saved OPD Tokens & Queue Passes ({savedTokensList.length})</span>
              </h4>

              <div className="space-y-3">
                {savedTokensList.map((tok, idx) => (
                  <div
                    key={`tok-hist-${tok.id || tok.tokenNumber}-${idx}`}
                    className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-teal-900 dark:text-teal-300">
                          {tok.tokenNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {tok.department || activePatient.department}
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          {tok.roomNumber || 'Room 04 (Dr. Desk)'}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">
                        Complaints: {tok.complaintsSummary || 'General OPD Consultation'} • Issued: {new Date(tok.issuedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <span className="text-[10px] font-bold px-2 py-1 rounded bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                        Saved in Tokens
                      </span>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2.3 INNER VIEW: 📋 MEDICAL HISTORY & TIMELINE                             */}
      {/* ========================================================================= */}
      {currentSection === 'history' && (
        <MedicalHistoryModule 
          patient={activePatient} 
          onBack={() => setCurrentSection('dashboard')} 
        />
      )}

      {/* ========================================================================= */}
      {/* 2.4 INNER VIEW: 💊 PRESCRIPTIONS & MEDICATIONS                            */}
      {/* ========================================================================= */}
      {currentSection === 'prescriptions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <button
              type="button"
              onClick={() => setCurrentSection('dashboard')}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-teal-700 dark:text-teal-400" />
              <span>← Back to Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentSection('scanner')}
              className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Camera className="w-4 h-4" />
              <span>Scan New Prescription</span>
            </button>
          </div>

          <PrescriptionListView
            currentPatient={activePatient}
            onNavigateToScanner={() => setCurrentSection('scanner')}
            currentUserRole="PATIENT"
            currentUserName={activePatient.name}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2.5 INNER VIEW: 📄 LAB & DIAGNOSTIC REPORTS                               */}
      {/* ========================================================================= */}
      {currentSection === 'reports' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <button
              type="button"
              onClick={() => setCurrentSection('dashboard')}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-teal-700 dark:text-teal-400" />
              <span>← Back to Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentSection('scanner')}
              className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Camera className="w-4 h-4" />
              <span>Scan New Report</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-700 dark:text-teal-400" />
              <span>Digitized Lab & Diagnostic Documents</span>
            </h3>

            <div className="space-y-3">
              {(activePatient.scannedDocuments || []).map((doc, idx) => (
                <div key={`doc-${doc.id || idx}-${idx}`} className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <strong className="text-slate-900 dark:text-white text-sm">{doc.fileName || doc.documentTitle}</strong>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">
                      {doc.providerName || doc.documentType} • Date: {doc.documentDate || doc.dateOfRecord}
                    </p>
                    {doc.extractedData?.diagnoses && doc.extractedData.diagnoses.length > 0 && (
                      <p className="text-teal-800 dark:text-teal-300 font-medium">
                        Extracted: {doc.extractedData.diagnoses.join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] font-mono font-bold text-teal-800 dark:text-teal-300 bg-teal-100 dark:bg-teal-950 px-2.5 py-1 rounded-lg self-start sm:self-center border border-teal-200 dark:border-teal-800">
                    {(doc.fileType || doc.documentType || 'DOC').toUpperCase()} • OCR Extracted
                  </span>
                </div>
              ))}

              {(!activePatient.scannedDocuments || activePatient.scannedDocuments.length === 0) && (
                <p className="text-xs text-slate-500 dark:text-slate-400 p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-center">
                  No medical reports or lab scans digitized yet. Click "Scan New Report" above to add one.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2.6 INNER VIEW: 📷 DOCUMENT / PRESCRIPTION SCANNER                        */}
      {/* ========================================================================= */}
      {currentSection === 'scanner' && (
        <div className="space-y-6">
          <PrescriptionScannerView
            currentPatient={activePatient}
            onBackToPrescriptions={() => setCurrentSection('dashboard')}
            onPrescriptionSaved={handlePrescriptionSaved}
            currentUserRole="PATIENT"
            currentUserName={activePatient.name}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2.7 INNER VIEW: 📅 MY APPOINTMENTS                                        */}
      {/* ========================================================================= */}
      {currentSection === 'appointments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <button
              type="button"
              onClick={() => setCurrentSection('dashboard')}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-teal-700 dark:text-teal-400" />
              <span>← Back to Dashboard</span>
            </button>

            <button
              type="button"
              id="book-new-appointment-btn"
              onClick={() => setIsBookModalOpen(true)}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-700 dark:text-teal-400" />
              <span>My Scheduled Appointments ({upcomingAppointments.length})</span>
            </h3>

            {upcomingAppointments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingAppointments.map((apt, idx) => (
                  <div
                    key={`${apt.id}-${idx}`}
                    className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-teal-600/40 dark:border-teal-700/60 p-5 shadow-xs space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-teal-900 dark:text-teal-300 font-mono">
                            Token {apt.tokenNumber}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                            {apt.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-1">{apt.department}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">{apt.doctorName}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">{apt.date}</span>
                        <span className="text-[11px] font-mono text-teal-700 dark:text-teal-400">{apt.timeSlot}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1 text-xs">
                      <div className="flex justify-between text-slate-700 dark:text-slate-300">
                        <span>Room / Desk:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{apt.roomNumber}</span>
                      </div>
                      <div className="flex justify-between text-slate-700 dark:text-slate-300">
                        <span>Queue Status:</span>
                        <span className="font-bold text-teal-700 dark:text-teal-400">
                          Serving {apt.currentServingToken || 'OPD-100'} • Est. wait: {apt.estimatedWaitMinutes || 8} mins
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setSelectedAppointmentForDetails(apt)}
                        className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Summary</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onStartKioskIntake(activePatient)}
                        className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Start AI Intake</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-3 shadow-xs">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">No upcoming appointments found for your account.</p>
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(true)}
                  className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Book New OPD Consultation
                </button>
              </div>
            )}
          </div>

          {pastAppointments.length > 0 && (
            <div className="space-y-3 pt-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Past Completed Consultations ({pastAppointments.length})</span>
              </h3>

              <div className="space-y-3">
                {pastAppointments.map((apt, idx) => (
                  <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{apt.date}</span>
                        <span className="font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">{apt.department}</span>
                        <span className="text-slate-600 dark:text-slate-400">{apt.doctorName}</span>
                      </div>
                      {apt.doctorDiagnosis && (
                        <p className="text-slate-700 dark:text-slate-300 font-medium mt-1">Diagnosis: <strong>{apt.doctorDiagnosis}</strong></p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedAppointmentForDetails(apt)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold transition-colors cursor-pointer self-start sm:self-center"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2.8 INNER VIEW: 👤 PROFILE & SETTINGS                                     */}
      {/* ========================================================================= */}
      {currentSection === 'profile' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <button
              type="button"
              onClick={() => setCurrentSection('dashboard')}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-teal-700 dark:text-teal-400" />
              <span>← Back to Dashboard</span>
            </button>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Patient Profile & ABHA Identity</span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-700 text-white font-black text-2xl flex items-center justify-center shadow-md">
                {activePatient.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{activePatient.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">UHID: {activePatient.uhid} • Age: {activePatient.age} yrs • Gender: {activePatient.gender}</p>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs">
                  <span className="text-teal-700 dark:text-teal-400 font-bold">ABHA: {activePatient.abhaId || 'Not linked'}</span>
                  <span className="text-slate-600 dark:text-slate-400 font-mono flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{activePatient.mobile}</span>
                  </span>
                  {activePatient.email && (
                    <span className="text-slate-600 dark:text-slate-400 font-mono flex items-center gap-1">
                      <Mail className="w-3 h-3 text-teal-600" />
                      <span>{activePatient.email}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">Recorded Health Baseline</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Blood Pressure</span>
                  <span className="font-bold text-slate-900 dark:text-white">{activePatient.vitals?.bpSystolic || 120}/{activePatient.vitals?.bpDiastolic || 80} mmHg</span>
                </div>
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Heart Rate</span>
                  <span className="font-bold text-slate-900 dark:text-white">{activePatient.vitals?.heartRate || 74} bpm</span>
                </div>
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Oxygen (SpO2)</span>
                  <span className="font-bold text-slate-900 dark:text-white">{activePatient.vitals?.spO2 || 98}%</span>
                </div>
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Temperature</span>
                  <span className="font-bold text-slate-900 dark:text-white">{activePatient.vitals?.temperature || 98.4}°F</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-300 block font-bold">Preferred Interface Language</span>
                  <Languages className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </div>
                <select
                  value={activePatient.language || language}
                  onChange={(e) => {
                    const newLang = e.target.value as SupportedLanguage;
                    setLanguage(newLang);
                    if (onUpdatePatient) {
                      onUpdatePatient({
                        ...activePatient,
                        language: newLang
                      });
                    }
                  }}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {ORDERED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.nativeName} ({l.englishName})
                    </option>
                  ))}
                </select>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-slate-600 dark:text-slate-300 block font-bold">Care Stream Preference</span>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
                  {activePatient.careStream || 'Allopathy'}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="px-4 py-2 bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Show Digital Pass</span>
              </button>

              <button
                type="button"
                onClick={handleLogoutAction}
                className="px-4 py-2 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}

      {/* Book Appointment Modal */}
      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        patient={activePatient}
        onAppointmentBooked={(newApt) => {
          setAppointments(prev => [newApt, ...prev.filter(a => a.id !== newApt.id)]);
        }}
        onStartKioskIntake={() => onStartKioskIntake(activePatient)}
        onNavigateToLogin={() => setIsLoggedIn(false)}
      />

      {/* Book Ambulance SOS Modal */}
      <BookAmbulanceModal
        isOpen={isAmbulanceModalOpen}
        onClose={() => setIsAmbulanceModalOpen(false)}
        patient={activePatient}
      />

      {/* Appointment Details Modal */}
      <AppointmentDetailsModal
        isOpen={!!selectedAppointmentForDetails}
        onClose={() => setSelectedAppointmentForDetails(null)}
        appointment={selectedAppointmentForDetails}
        patient={activePatient}
        onStartKioskIntake={() => onStartKioskIntake(activePatient)}
        onCancelAppointment={handleCancelAppointment}
      />

      {/* ABDM QR Pass Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ABHA Digital Pass</span>
              <button onClick={() => setShowQrModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl inline-block mx-auto border border-slate-200 dark:border-slate-700">
              <QrCode className="w-40 h-40 text-slate-900 dark:text-white mx-auto" />
            </div>

            <div className="space-y-1">
              <h3 className="font-black text-slate-900 dark:text-white text-base">{activePatient.name}</h3>
              <p className="text-xs font-mono font-bold text-teal-700 dark:text-teal-400">{activePatient.abhaId || activePatient.uhid}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Scan at MediKiosk Intake Node for instant check-in</p>
            </div>
          </div>
        </div>
      )}

      {/* Supabase Backend Sync Status Modal */}
      <SupabaseStatusModal
        isOpen={showSupabaseStatusModal}
        onClose={() => setShowSupabaseStatusModal(false)}
      />

    </div>
  );
};


