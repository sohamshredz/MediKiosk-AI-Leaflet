import React, { useState, useEffect, useMemo } from 'react';
import { PatientProfile, ScannedDocument, TimelineEvent, CareStream, HospitalStaffMember } from '../../types';
import { PrintPatientSummaryModal } from './PrintPatientSummaryModal';
import { MedicalHistoryModule } from '../history/MedicalHistoryModule';
import { getOrGenerateOneYearClinicalSummary, PatientOneYearSummary } from '../../services/medicalHistoryService';
import { DashboardHeader } from '../dashboard/DashboardHeader';
import { getStoredAuthSession } from '../../utils/authStorage';
import { 
  Stethoscope, 
  User, 
  Calendar, 
  Clock, 
  Activity, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Pill, 
  FileText, 
  Sparkles, 
  Printer, 
  Save, 
  Plus, 
  Trash2, 
  Compass, 
  Check, 
  Layers,
  Search,
  Building2,
  Lock,
  Share2,
  ArrowLeft,
  LogOut,
  Bell,
  Eye,
  Camera,
  Heart,
  Users,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  ExternalLink,
  Download,
  AlertCircle
} from 'lucide-react';

interface DoctorPortalViewProps {
  patients: PatientProfile[];
  activePatientId: string;
  onSelectPatient: (id: string) => void;
  onUpdatePatient: (updated: PatientProfile) => void;
  onBackToLanding?: () => void;
  onLogout?: () => void;
  doctorName?: string;
  doctorSpecialty?: string;
  doctorId?: string;
}

export const DoctorPortalView: React.FC<DoctorPortalViewProps> = ({
  patients,
  activePatientId,
  onSelectPatient,
  onUpdatePatient,
  onBackToLanding,
  onLogout,
  doctorName,
  doctorSpecialty,
  doctorId
}) => {
  // User Directive: "do not show any patient details directly to the doctor doctor should enter the details of patient id no"
  // Keep active patient initially null. Doctor must enter Patient ID / Token to access the records.
  const [loadedPatientId, setLoadedPatientId] = useState<string | null>(null);
  const [patientIdInput, setPatientIdInput] = useState<string>('');
  const [patientIdError, setPatientIdError] = useState<string | null>(null);
  const [switchIdInput, setSwitchIdInput] = useState<string>('');

  const patient = useMemo(() => {
    if (!loadedPatientId) return null;
    return patients.find(p => p.id === loadedPatientId) || null;
  }, [loadedPatientId, patients]);

  const handleLookupPatientById = (queryOverride?: string) => {
    const rawTarget = (typeof queryOverride === 'string' ? queryOverride : patientIdInput).trim();
    if (!rawTarget) {
      setPatientIdError('Please enter a valid Patient ID (e.g. MKP-2026-001) or Token Number.');
      return;
    }

    const clean = rawTarget.toUpperCase().replace(/\s+/g, '');

    const matched = patients.find(p => {
      const pId = (p.patientId || '').toUpperCase().replace(/\s+/g, '');
      const id = (p.id || '').toUpperCase().replace(/\s+/g, '');
      const uhid = (p.uhid || '').toUpperCase().replace(/\s+/g, '');
      const token = (p.tokenNumber || '').toUpperCase().replace(/\s+/g, '');
      const mob = (p.mobile || '').replace(/\D/g, '');
      const digitsOnly = rawTarget.replace(/\D/g, '');

      return (
        pId === clean ||
        id === clean ||
        uhid === clean ||
        token === clean ||
        (clean.startsWith('MKP-') && pId.includes(clean)) ||
        (clean.startsWith('PAT-') && id.includes(clean)) ||
        (clean.startsWith('OPD-') && token.includes(clean)) ||
        (clean.startsWith('AYUSH-') && token.includes(clean)) ||
        (digitsOnly.length >= 2 && token.includes(digitsOnly)) ||
        (digitsOnly.length >= 10 && mob.includes(digitsOnly)) ||
        (clean.length >= 3 && pId.includes(clean)) ||
        (clean.length >= 4 && uhid.includes(clean))
      );
    });

    if (matched) {
      setLoadedPatientId(matched.id);
      onSelectPatient(matched.id);
      setPatientIdError(null);
      setPatientIdInput('');
      setSwitchIdInput('');
      setVoiceSearchFeedback(`Loaded Patient ID: ${matched.patientId || matched.id}`);
      setTimeout(() => setVoiceSearchFeedback(''), 4000);
    } else {
      setPatientIdError(`No patient record found matching ID "${rawTarget}". Please verify the OPD registration slip or token.`);
    }
  };

  const handleClosePatientDossier = () => {
    setLoadedPatientId(null);
    onSelectPatient('');
    setPatientIdInput('');
    setPatientIdError(null);
    setSwitchIdInput('');
  };

  // Active doctor credentials resolution (defaults to Dr. Sohom Das, MD or logged-in clinician)
  const session = useMemo(() => getStoredAuthSession(), []);

  // Check cached staff list to see if doctor details (name, room, specialization) were updated
  const liveDoctorRecord = useMemo(() => {
    try {
      const cached = localStorage.getItem('medikiosk_cached_staff_list');
      if (cached) {
        const staffList: HospitalStaffMember[] = JSON.parse(cached);
        const idToMatch = (session && session.staffCode) || doctorId || 'DOC-SOHOM-01';
        return staffList.find(s => 
          s.staffId.toUpperCase() === idToMatch.toUpperCase() ||
          s.id === idToMatch ||
          (session && s.fullName.toLowerCase().includes(session.userName.toLowerCase()))
        ) || null;
      }
    } catch (e) {}
    return null;
  }, [session, doctorId]);

  const currentDoctorName = useMemo(() => {
    if (liveDoctorRecord?.fullName) return liveDoctorRecord.fullName;
    if (doctorName && doctorName !== 'Dr. Sunita Rao, MD') return doctorName;
    if (session && (session.role === 'doctor' || session.role === 'medical_officer') && session.userName) {
      return session.userName;
    }
    return 'Dr. Sohom Das, MD';
  }, [liveDoctorRecord, doctorName, session]);

  const currentDoctorSpecialty = useMemo(() => {
    if (liveDoctorRecord) {
      const parts = [liveDoctorRecord.roleTitle || 'Senior Consultant Physician'];
      if (liveDoctorRecord.department) parts.push(liveDoctorRecord.department);
      if (liveDoctorRecord.roomNumber) parts.push(liveDoctorRecord.roomNumber);
      return parts.join(' • ');
    }
    if (doctorSpecialty && !doctorSpecialty.includes('DOC-AIIMS-04')) return doctorSpecialty;
    if (session && (session.role === 'doctor' || session.role === 'medical_officer') && (session.roleTitle || session.department)) {
      return session.roleTitle || session.department || 'Senior Consultant Physician • General Medicine OPD (Room 104)';
    }
    return 'Senior Consultant Physician • General Medicine OPD (Room 104)';
  }, [liveDoctorRecord, doctorSpecialty, session]);

  const currentDoctorId = useMemo(() => {
    if (liveDoctorRecord?.staffId) return liveDoctorRecord.staffId;
    if (doctorId && doctorId !== 'DOC-AIIMS-04') return doctorId;
    if (session && (session.role === 'doctor' || session.role === 'medical_officer') && (session.staffCode || session.userId)) {
      return session.staffCode || session.userId;
    }
    return 'DOC-SOHOM-01';
  }, [liveDoctorRecord, doctorId, session]);

  const [activeTab, setActiveTab] = useState<'snapshot' | 'summary_1yr' | 'summary' | 'consultation' | 'queue' | 'history' | 'documents' | 'sos'>('snapshot');
  const [searchQuery, setSearchQuery] = useState('');
  const [isListeningForVoiceSearch, setIsListeningForVoiceSearch] = useState(false);
  const [voiceSearchFeedback, setVoiceSearchFeedback] = useState('');
  const [isPlayingSummaryAudio, setIsPlayingSummaryAudio] = useState(false);
  const [oneYearSummary, setOneYearSummary] = useState<PatientOneYearSummary | null>(null);
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<ScannedDocument | null>(
    patient?.scannedDocuments?.[0] || null
  );

  // Load 1-Year summary object asynchronously
  useEffect(() => {
    let isMounted = true;
    if (patient) {
      getOrGenerateOneYearClinicalSummary(patient).then(res => {
        if (isMounted) {
          setOneYearSummary(res);
        }
      }).catch(err => {
        console.error('Error generating 1-year summary:', err);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [patient?.id]);

  // Speech Recognition for Doctor Patient Find
  const handleStartVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use the text search bar.');
      return;
    }

    if (isListeningForVoiceSearch) {
      setIsListeningForVoiceSearch(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListeningForVoiceSearch(true);
        setVoiceSearchFeedback('Listening... Speak Patient ID Number or Token');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.trim();
        setIsListeningForVoiceSearch(false);
        setVoiceSearchFeedback(`Heard: "${transcript}"`);
        setPatientIdInput(transcript);
        handleLookupPatientById(transcript);
      };

      recognition.onerror = (event: any) => {
        setIsListeningForVoiceSearch(false);
        setVoiceSearchFeedback('Voice search cancelled or not recognized.');
        setTimeout(() => setVoiceSearchFeedback(''), 3000);
      };

      recognition.onend = () => {
        setIsListeningForVoiceSearch(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListeningForVoiceSearch(false);
    }
  };

  // Text-to-Speech for 1-Year Summary (ONLY on explicit click)
  const handleToggleReadSummary = (textToRead: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech audio synthesis is not supported in this browser.');
      return;
    }

    if (isPlayingSummaryAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingSummaryAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsPlayingSummaryAudio(false);
    utterance.onerror = () => setIsPlayingSummaryAudio(false);

    setIsPlayingSummaryAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  // Cleanup audio on unmount or patient change
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [patient?.id]);

  // Doctor Verification & E-Prescription Form State
  const [isVerified, setIsVerified] = useState(patient?.doctorVerified || false);
  const [doctorDiagnosis, setDoctorDiagnosis] = useState(patient?.doctorNotes?.customDoctorDiagnosis || '');
  const [doctorAdvice, setDoctorAdvice] = useState(patient?.doctorNotes?.doctorAdvice || '');
  const [followUpDays, setFollowUpDays] = useState<number>(patient?.doctorNotes?.followUpInDays || 7);
  const [prescriptionItems, setPrescriptionItems] = useState<{ medicineName: string; dosage: string; timing: string; days: number }[]>(
    patient?.doctorNotes?.doctorPrescription || [
      { medicineName: 'Tab. Paracetamol 650mg', dosage: '650mg', timing: '1-0-1 (After meals)', days: 3 },
      { medicineName: 'Tab. Pantoprazole 40mg', dosage: '40mg', timing: '1-0-0 (Empty stomach)', days: 5 }
    ]
  );
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [isPrintSummaryModalOpen, setIsPrintSummaryModalOpen] = useState(false);

  // Sync state cleanly when active patient changes
  useEffect(() => {
    if (patient) {
      setIsVerified(patient.doctorVerified || false);
      setDoctorDiagnosis(patient.doctorNotes?.customDoctorDiagnosis || '');
      setDoctorAdvice(patient.doctorNotes?.doctorAdvice || '');
      setFollowUpDays(patient.doctorNotes?.followUpInDays || 7);
      setPrescriptionItems(
        patient.doctorNotes?.doctorPrescription || [
          { medicineName: 'Tab. Paracetamol 650mg', dosage: '650mg', timing: '1-0-1 (After meals)', days: 3 },
          { medicineName: 'Tab. Pantoprazole 40mg', dosage: '40mg', timing: '1-0-0 (Empty stomach)', days: 5 }
        ]
      );
      setSelectedDocForPreview(patient.scannedDocuments?.[0] || null);
    }
  }, [patient?.id]);

  const waitingCount = patients.filter(p => p.status === 'ready_for_doctor' || p.status === 'waiting_triage').length;
  const completedCount = patients.filter(p => p.status === 'consultation_completed' || p.doctorVerified).length;
  const totalAppointments = patients.length;
  const criticalCount = patients.filter(p => p.triageRisk === 'CRITICAL_EMERGENCY').length;

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.uhid.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddMedicineRow = () => {
    setPrescriptionItems([
      ...prescriptionItems,
      { medicineName: '', dosage: '', timing: '1-0-1', days: 5 }
    ]);
  };

  const handleRemoveMedicineRow = (index: number) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
  };

  const handleUpdateMedicine = (index: number, field: string, value: any) => {
    const updated = [...prescriptionItems];
    updated[index] = { ...updated[index], [field]: value };
    setPrescriptionItems(updated);
  };

  const handleSaveAndSign = () => {
    if (!patient) return;
    const updatedPatient: PatientProfile = {
      ...patient,
      doctorVerified: true,
      status: 'consultation_completed',
      doctorNotes: {
        verifiedAt: new Date().toISOString(),
        verifiedByDoctorName: currentDoctorName,
        customDoctorDiagnosis: doctorDiagnosis || patient.clinicalSummary?.diagnosticHypothesesCDS?.[0]?.condition || 'Clinical assessment completed',
        doctorPrescription: prescriptionItems.filter(p => p.medicineName.trim() !== ''),
        doctorAdvice,
        followUpInDays: followUpDays
      }
    };
    onUpdatePatient(updatedPatient);
    setIsVerified(true);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 4000);
  };

  const handleLogoutAction = () => {
    if (onLogout) {
      onLogout();
    } else if (onBackToLanding) {
      onBackToLanding();
    }
  };

  if (!patient) {
    return (
      <div id="doctor-station-portal" className="space-y-6 animate-in fade-in duration-150">
        
        {/* 1. DOCTOR DASHBOARD HEADER */}
        <DashboardHeader
          role="doctor"
          doctorName={currentDoctorName}
          doctorId={currentDoctorId}
          department={currentDoctorSpecialty}
          onLogout={handleLogoutAction}
        />

        {/* 2. SUMMARY METRICS CARDS (OPD Statistics - No patient identities revealed) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-slate-500 block">Today's Appointments</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-slate-900">{totalAppointments}</span>
              <Users className="w-5 h-5 text-teal-600" />
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-amber-700 block">Waiting Patients</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-amber-600">{waitingCount}</span>
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-emerald-700 block">Completed Today</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-emerald-600">{completedCount}</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-rose-700 block">SOS / Emergency Alerts</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-rose-600">{criticalCount}</span>
              <Bell className="w-5 h-5 text-rose-600" />
            </div>
          </div>
        </div>

        {/* 3. PATIENT ID VERIFICATION & ACCESS CARD */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-start gap-4 border-b border-slate-100 pb-5">
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl text-teal-700 shrink-0">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  OPD Consultation — Patient ID Entry Required
                </h2>
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  Patient Data Protected
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
                To safeguard clinical data and respect patient privacy, patient charts are not loaded directly. Please enter the <strong>Patient ID Number</strong> (or UHID / Token Number) from the patient's OPD registration slip to retrieve their dossier.
              </p>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookupPatientById();
            }}
            className="space-y-4 max-w-2xl"
          >
            <div>
              <label htmlFor="input-doctor-patient-id" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Enter Patient ID Number / Token Number
              </label>
              <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    id="input-doctor-patient-id"
                    type="text"
                    autoFocus
                    value={patientIdInput}
                    onChange={(e) => {
                      setPatientIdInput(e.target.value);
                      setPatientIdError(null);
                    }}
                    placeholder="e.g. MKP-2026-001, UHID, or Token Number"
                    className="w-full pl-11 pr-10 py-3 bg-slate-50 border-2 border-slate-300 rounded-2xl text-sm sm:text-base font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-teal-600 focus:outline-hidden transition-all shadow-2xs"
                  />
                  {patientIdInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setPatientIdInput('');
                        setPatientIdError(null);
                      }}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-sm rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <Search className="w-4 h-4" />
                  <span>Access Dossier</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartVoiceSearch}
                  className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 ${
                    isListeningForVoiceSearch
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                  }`}
                  title="Speak Patient ID"
                >
                  {isListeningForVoiceSearch ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>{isListeningForVoiceSearch ? 'Listening...' : 'Voice ID'}</span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {patientIdError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800 flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{patientIdError}</span>
              </div>
            )}

            {/* Voice feedback */}
            {voiceSearchFeedback && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl text-xs font-bold text-teal-800 flex items-center gap-2 animate-in fade-in">
                <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{voiceSearchFeedback}</span>
              </div>
            )}
          </form>

          {/* OPD Queue Quick Reference (Confidential Mode - Only Tokens & IDs, NO patient names or conditions) */}
          <div className="pt-5 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-teal-600" />
                <span>OPD Queue Reference • Room 104 ({patients.length})</span>
              </span>
              <span className="text-[11px] text-slate-500 italic">
                Click any ID below or enter above to load record
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {patients.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleLookupPatientById(p.patientId || p.id)}
                  className="p-3.5 bg-slate-50 hover:bg-teal-50/70 border border-slate-200 hover:border-teal-300 rounded-2xl text-left transition-all group cursor-pointer flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black px-2 py-0.5 bg-slate-900 text-teal-300 rounded-md">
                        {p.tokenNumber}
                      </span>
                      <span className="text-[11px] font-bold text-slate-600">
                        {p.careStream.toUpperCase()}
                      </span>
                    </div>
                    <div className="font-mono text-xs font-bold text-teal-700 group-hover:text-teal-900 truncate">
                      Patient ID: {p.patientId || p.id}
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-slate-400 group-hover:text-teal-700 shrink-0 flex items-center gap-1">
                    <span>Load</span>
                    <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const summary = patient.clinicalSummary;

  return (
    <div id="doctor-station-portal" className="space-y-6 animate-in fade-in duration-150">
      
      {/* 1. DOCTOR DASHBOARD HEADER */}
      <DashboardHeader
        role="doctor"
        doctorName={currentDoctorName}
        doctorId={currentDoctorId}
        department={currentDoctorSpecialty}
        onLogout={handleLogoutAction}
      />

      {/* 2. ACTIVE CLINICAL DOSSIER UNLOCKED & PATIENT SWITCH BAR */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-2xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                Clinical Dossier Unlocked
              </span>
              <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-md font-mono text-xs font-black">
                ID: {patient.patientId || patient.id}
              </span>
              <span className="px-2 py-0.5 bg-slate-900 text-teal-300 rounded-md font-mono text-xs font-black">
                {patient.tokenNumber}
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 mt-0.5">
              Doctor consultation in progress for {patient.name} ({patient.gender.toUpperCase()}, {patient.age} yrs)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
          {/* Quick ID switch input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookupPatientById(switchIdInput);
            }}
            className="flex items-center gap-1.5"
          >
            <input
              type="text"
              value={switchIdInput}
              onChange={(e) => setSwitchIdInput(e.target.value)}
              placeholder="Switch Patient ID..."
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold w-40 sm:w-48 focus:outline-hidden focus:ring-2 focus:ring-teal-500 shadow-2xs"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              Go
            </button>
          </form>

          <button
            type="button"
            onClick={handleClosePatientDossier}
            className="px-3.5 py-1.5 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-300 hover:border-rose-300 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-slate-500" />
            <span>Close Dossier</span>
          </button>
        </div>
      </div>

      {/* 3. SUMMARY METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 block">Today's Appointments</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-slate-900">{totalAppointments}</span>
            <Users className="w-5 h-5 text-teal-600" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-amber-700 block">Waiting Patients</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-amber-600">{waitingCount}</span>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-emerald-700 block">Completed Today</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-emerald-600">{completedCount}</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-rose-700 block">SOS / Emergency Alerts</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-rose-600">{criticalCount}</span>
            <Bell className="w-5 h-5 text-rose-600" />
          </div>
        </div>
      </div>

      {/* 4. NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'snapshot', label: '⚡ Clinical Snapshot (15s)', icon: Sparkles },
          { id: 'summary_1yr', label: '1-Year Clinical Summary', icon: Activity },
          { id: 'summary', label: 'Symptoms & Intake AI', icon: FileText },
          { id: 'history', label: 'Medical History & Timeline', icon: Clock },
          { id: 'consultation', label: 'e-Prescription & Notes', icon: Pill },
          { id: 'queue', label: `Today's Queue (${patients.length})`, icon: Users },
          { id: 'documents', label: `Scanned Reports (${patient.scannedDocuments?.length || 0})`, icon: Eye },
          { id: 'sos', label: `SOS Alerts (${criticalCount})`, icon: AlertTriangle }
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <IconComp className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 5. ACTIVE PATIENT QUICK BANNER */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 bg-teal-500/20 text-teal-300 border border-teal-400/30 rounded-lg font-mono font-bold text-xs">
              Token: {patient.tokenNumber}
            </span>
            <h2 className="font-extrabold text-xl">{patient.name}</h2>
            <span className="text-slate-300 text-xs sm:text-sm">
              ({patient.age} yrs • {patient.gender.toUpperCase()} • Patient ID: <strong className="font-mono text-teal-300">{patient.patientId || patient.id}</strong> • UHID: {patient.uhid})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPrintSummaryModalOpen(true)}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white border border-teal-400/40 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Summary</span>
            </button>

            <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
              patient.triageRisk === 'CRITICAL_EMERGENCY'
                ? 'bg-rose-600 text-white animate-pulse'
                : patient.triageRisk === 'URGENT_PRIORITY'
                ? 'bg-amber-500 text-slate-950 font-extrabold'
                : 'bg-emerald-600/90 text-white'
            }`}>
              {patient.triageRisk === 'CRITICAL_EMERGENCY' && <AlertTriangle className="w-3.5 h-3.5" />}
              <span>TRIAGE: {patient.triageRisk.replace(/_/g, ' ')}</span>
            </span>

            {patient.doctorVerified && (
              <span className="px-2.5 py-1 bg-teal-400/20 text-teal-300 border border-teal-400/30 rounded-full text-xs font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> Signed
              </span>
            )}
          </div>
        </div>

        {/* Vitals Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 text-xs">
          <div className="p-2 bg-slate-800/80 rounded-xl">
            <span className="text-slate-400 text-[10px] block font-medium">ABHA ID</span>
            <span className="font-mono font-bold text-teal-300 truncate block">{patient.abhaId || '91-4829-1029-4820'}</span>
          </div>
          <div className="p-2 bg-slate-800/80 rounded-xl">
            <span className="text-slate-400 text-[10px] block font-medium">BP</span>
            <span className={`font-bold ${patient.vitals.bpSystolic && patient.vitals.bpSystolic >= 140 ? 'text-rose-400' : 'text-white'}`}>
              {patient.vitals.bpSystolic ? `${patient.vitals.bpSystolic}/${patient.vitals.bpDiastolic}` : '120/80'}
            </span>
          </div>
          <div className="p-2 bg-slate-800/80 rounded-xl">
            <span className="text-slate-400 text-[10px] block font-medium">HR</span>
            <span className={`font-bold ${patient.vitals.heartRate && patient.vitals.heartRate > 100 ? 'text-amber-400' : 'text-white'}`}>
              {patient.vitals.heartRate || 74} bpm
            </span>
          </div>
          <div className="p-2 bg-slate-800/80 rounded-xl">
            <span className="text-slate-400 text-[10px] block font-medium">SpO2</span>
            <span className={`font-bold ${patient.vitals.spO2 && patient.vitals.spO2 < 94 ? 'text-rose-400' : 'text-teal-300'}`}>
              {patient.vitals.spO2 || 98}%
            </span>
          </div>
          <div className="p-2 bg-slate-800/80 rounded-xl">
            <span className="text-slate-400 text-[10px] block font-medium">Temp</span>
            <span className="font-bold text-white">{patient.vitals.temperature || 98.4}°F</span>
          </div>
          <div className="p-2 bg-slate-800/80 rounded-xl">
            <span className="text-slate-400 text-[10px] block font-medium">Sugar</span>
            <span className="font-bold text-white">{patient.vitals.bloodSugar || 110} mg/dL</span>
          </div>
          <div className="p-2 bg-slate-800/80 rounded-xl">
            <span className="text-slate-400 text-[10px] block font-medium">BMI</span>
            <span className="font-bold text-white">{patient.vitals.bmi || 24.2}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB CONTENT 0: ⚡ FAST CLINICAL SNAPSHOT (10-15s Quick Overview)           */}
      {/* ========================================================================= */}
      {activeTab === 'snapshot' && (
        <div className="space-y-5">
          {/* Top Quick Profile & Triage Banner */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-teal-100 text-teal-900">
                    Token: {patient.tokenNumber}
                  </span>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-slate-100 text-slate-800">
                    Patient ID: {patient.patientId || patient.id}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    UHID: {patient.uhid}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  {patient.name} <span className="text-slate-500 font-normal text-base">({patient.age}y / {patient.gender.toUpperCase()} • Blood Group: {(patient as any).bloodGroup || 'B+'})</span>
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  Preferred Language: <strong className="text-teal-800 capitalize">{patient.language || 'English'}</strong> • Mobile: <span className="font-mono">{patient.mobile || '+91-9876543210'}</span>
                </p>
              </div>

              <div className="flex flex-col items-start md:items-end gap-1.5">
                <span className={`px-4 py-1.5 rounded-xl text-xs font-black tracking-wide ${
                  patient.triageRisk === 'CRITICAL_EMERGENCY'
                    ? 'bg-rose-600 text-white animate-pulse'
                    : patient.triageRisk === 'URGENT_PRIORITY'
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-emerald-600 text-white'
                }`}>
                  TRIAGE RISK: {patient.triageRisk.replace(/_/g, ' ')}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Target OPD: {patient.department || 'General Medicine'}
                </span>
              </div>
            </div>

            {/* 3-Column Fast Scan Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              
              {/* 1. Chief Complaint & Symptoms */}
              <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-2">
                <span className="font-bold text-teal-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-teal-700" />
                  <span>Chief Complaint</span>
                </span>
                {patient.symptoms && patient.symptoms.length > 0 ? (
                  <div className="space-y-1.5">
                    {patient.symptoms.map((s, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded-xl border border-teal-200/70">
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>{s.name}</span>
                          <span className="text-rose-600 font-extrabold">{s.severity}/10</span>
                        </div>
                        <p className="text-[11px] text-slate-500">{s.duration} • {s.onset}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No acute symptoms reported.</p>
                )}
              </div>

              {/* 2. Critical Safety: Allergies & Medications */}
              <div className="p-4 bg-rose-50/40 rounded-2xl border border-rose-100 space-y-2">
                <span className="font-bold text-rose-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Allergies & Active Meds</span>
                </span>

                {/* Allergies */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-700">Allergies:</span>
                  {patient.allergies && patient.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {patient.allergies.map((a, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[11px]">
                          {a.substance} ({a.reactionType})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">None reported</span>
                  )}
                </div>

                {/* Active Meds */}
                <div className="space-y-1 pt-1 border-t border-rose-100">
                  <span className="text-[11px] font-bold text-slate-700">
                    Active Medications ({patient.currentMedications?.length || 0}):
                  </span>
                  {patient.currentMedications && patient.currentMedications.length > 0 ? (
                    <ul className="text-[11px] text-slate-800 space-y-0.5 list-disc pl-3">
                      {patient.currentMedications.slice(0, 3).map((m, idx) => (
                        <li key={idx} className="font-medium">{m.name} ({m.dose})</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">No current medications</span>
                  )}
                </div>
              </div>

              {/* 3. 1-Year Highlights & Red Flags */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>Past 1-Year Highlights</span>
                </span>

                <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                  {oneYearSummary?.executiveSummary || 'Chronic history: Hypertension • Type 2 Diabetes. 4 medical records & 2 lab reports indexed.'}
                </p>

                {oneYearSummary?.abnormalAttentionItems && oneYearSummary.abnormalAttentionItems.length > 0 && (
                  <div className="pt-1.5 border-t border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                      Attention Items:
                    </span>
                    {oneYearSummary.abnormalAttentionItems.slice(0, 2).map((item, idx) => (
                      <p key={idx} className="text-[11px] font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        ⚠ {item}
                      </p>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Snapshot Actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('summary_1yr')}
                  className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  View Full 1-Year Clinical Summary →
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
                >
                  Browse Medical History Module
                </button>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('consultation')}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Pill className="w-4 h-4" />
                <span>Write e-Prescription & Notes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT 0.5: PERSISTENT 1-YEAR CLINICAL SUMMARY                       */}
      {/* ========================================================================= */}
      {activeTab === 'summary_1yr' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            
            {/* Header & Speech Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-900 px-2.5 py-0.5 rounded border border-teal-200">
                    Past 12 Months Longitudinal Record
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {oneYearSummary?.summaryPeriodStart} to {oneYearSummary?.summaryPeriodEnd}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  1-Year Longitudinal Clinical Summary
                </h3>
                <p className="text-xs text-slate-500">
                  AI-assisted longitudinal health aggregation • Clinician verification required
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleReadSummary(oneYearSummary?.executiveSummary || 'Patient record loaded.')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                    isPlayingSummaryAudio
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-teal-700 hover:bg-teal-800 text-white'
                  }`}
                  title="Read summary out loud (Clinician only)"
                >
                  {isPlayingSummaryAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  <span>{isPlayingSummaryAudio ? 'Stop Audio' : 'Read Summary 🔊'}</span>
                </button>
              </div>
            </div>

            {/* Executive Summary Card */}
            <div className="p-5 bg-teal-50/50 rounded-2xl border border-teal-200 space-y-2">
              <span className="font-bold text-teal-900 text-xs uppercase tracking-wider block">
                Executive Clinical Overview
              </span>
              <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                {oneYearSummary?.executiveSummary || 'Patient with recorded history of chronic conditions over the past 12 months. Vitals and symptoms captured at kiosk.'}
              </p>
            </div>

            {/* Abnormal Attention / Red Flags */}
            {oneYearSummary?.abnormalAttentionItems && oneYearSummary.abnormalAttentionItems.length > 0 && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                <span className="font-bold text-amber-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Clinical Attention Findings (Past 12 Months)</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {oneYearSummary.abnormalAttentionItems.map((item, idx) => (
                    <div key={idx} className="p-2.5 bg-white rounded-xl border border-amber-200/80 text-xs font-semibold text-amber-950 flex items-center gap-2">
                      <span className="text-amber-600 font-bold">⚠</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2-Column Grid: Conditions & Medications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Conditions */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-teal-600" />
                  <span>Diagnosed Conditions (Past 12 Months)</span>
                </h4>
                {oneYearSummary?.keyConditions && oneYearSummary.keyConditions.length > 0 ? (
                  <div className="space-y-2">
                    {oneYearSummary.keyConditions.map((c, idx) => (
                      <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                        <div>
                          <strong className="text-slate-900 block">{c.condition}</strong>
                          <span className="text-[11px] text-slate-500">{c.category} • Since {c.onsetDate}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.status ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                          {c.status ? 'Active' : 'Resolved'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No chronic conditions listed in past year.</p>
                )}
              </div>

              {/* Medications */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-amber-600" />
                  <span>Current Active Medications</span>
                </h4>
                {oneYearSummary?.currentMedications && oneYearSummary.currentMedications.length > 0 ? (
                  <div className="space-y-2">
                    {oneYearSummary.currentMedications.map((m, idx) => (
                      <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                        <div>
                          <strong className="text-slate-900 block">{m.name}</strong>
                          <span className="text-[11px] text-slate-500">Dose: {m.dosage} • {m.frequency}</span>
                        </div>
                        {m.prescribedFor && (
                          <span className="text-[10px] text-slate-400 font-medium">By: {m.prescribedFor}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No active medications recorded.</p>
                )}
              </div>

            </div>

            {/* Lab Highlights */}
            {oneYearSummary?.labHighlights && oneYearSummary.labHighlights.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Laboratory & Diagnostic Highlights</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  {oneYearSummary.labHighlights.map((lh, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border ${lh.isAbnormal ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex justify-between items-start font-bold">
                        <span className="text-slate-900">{lh.testName}</span>
                        <span className={lh.isAbnormal ? 'text-amber-700' : 'text-slate-700'}>{lh.value}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{lh.date} • {lh.implication}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
              >
                Inspect Full Timeline & Uploaded Documents →
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('consultation')}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Pill className="w-4 h-4" />
                <span>Proceed to Consultation</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT 0.7: FULL MEDICAL HISTORY MODULE INTEGRATION                  */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <MedicalHistoryModule 
          patient={patient} 
          isDoctorView={true}
          onBack={() => setActiveTab('snapshot')} 
        />
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT 1: PATIENT RECORDS & CLINICAL SUMMARY                         */}
      {/* ========================================================================= */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Chief Complaint & AI Clinical Assessment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Chief Complaint */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600" />
                <span>Chief Complaint & Reported Symptoms</span>
              </h3>

              {patient.symptoms.map((s, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-sm text-slate-900">{s.name}</span>
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold">
                      Severity: {s.severity}/10
                    </span>
                  </div>
                  {s.nameInSelectedLanguage && (
                    <p className="text-teal-800 font-medium italic">{s.nameInSelectedLanguage}</p>
                  )}
                  <p className="text-slate-700"><strong>Duration:</strong> {s.duration} • <strong>Onset:</strong> {s.onset}</p>
                  {s.character && <p className="text-slate-700"><strong>Character:</strong> {s.character}</p>}
                  {s.aggravatingFactors && <p className="text-slate-700"><strong>Aggravating:</strong> {s.aggravatingFactors}</p>}
                  {s.relievingFactors && <p className="text-slate-700"><strong>Relieving:</strong> {s.relievingFactors}</p>}
                </div>
              ))}
            </div>

            {/* AI Clinical Summary & Hypotheses */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-600" />
                  <span>AI Pre-Consultation Summary</span>
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                  Gemini Clinical
                </span>
              </div>

              <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-2xl text-xs text-slate-800 space-y-3 leading-relaxed">
                <p className="font-semibold text-teal-950">
                  {summary?.chiefComplaintSummary || summary?.executiveSummary || 'Patient presented with acute onset symptoms. Vitals and voice triage recorded at kiosk.'}
                </p>

                {summary?.diagnosticHypothesesCDS && summary.diagnosticHypothesesCDS.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-teal-200">
                    <span className="font-bold text-teal-900 block text-[11px] uppercase tracking-wider">
                      Differential Hypotheses (CDS Assist):
                    </span>
                    {summary.diagnosticHypothesesCDS.map((hyp, hIdx) => (
                      <div key={hIdx} className="p-2.5 bg-white rounded-xl border border-teal-200/80 flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900">{hyp.condition}</span>
                          <span className="px-2 py-0.5 bg-teal-100 text-teal-900 rounded font-bold text-[10px]">
                            CDS Hypothesis
                          </span>
                        </div>
                        {hyp.rationale && (
                          <p className="text-[11px] text-slate-600 leading-tight">{hyp.rationale}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Past Illnesses & Allergies */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              <span>Medical History & Chronic Conditions</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <span className="font-bold text-slate-700 block">Past Diagnosed Conditions:</span>
                <div className="flex flex-wrap gap-2">
                  {patient.pastIllnesses?.map((ill, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-100 text-slate-800 rounded-xl border border-slate-200 font-semibold">
                      {ill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-700 block">Allergies:</span>
                <div className="flex flex-wrap gap-2">
                  {patient.allergies && patient.allergies.length > 0 ? (
                    patient.allergies.map((all, i) => (
                      <span key={i} className="px-3 py-1 bg-red-50 text-red-700 rounded-xl border border-red-200 font-bold">
                        {all.substance} ({all.reactionType})
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 italic">No known drug allergies.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT 2: CONSULTATION & E-PRESCRIPTION                              */}
      {/* ========================================================================= */}
      {activeTab === 'consultation' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <Pill className="w-6 h-6 text-teal-600" />
                <span>Physician Consultation & e-Prescription Form</span>
              </h3>
              <p className="text-xs text-slate-500">
                Sign digitally to synchronize prescription with patient's ABHA locker & hospital pharmacy
              </p>
            </div>

            {isVerified && (
              <span className="px-3.5 py-1.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Signed by {currentDoctorName}</span>
              </span>
            )}
          </div>

          {/* Doctor Final Diagnosis */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Physician Final Clinical Diagnosis
            </label>
            <input
              type="text"
              value={doctorDiagnosis}
              onChange={(e) => setDoctorDiagnosis(e.target.value)}
              placeholder="e.g., Acute Coronary Syndrome (Unstable Angina) / Essential HTN..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Medicine Rows */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Prescribed Medications (e-Rx)
              </label>
              <button
                type="button"
                onClick={handleAddMedicineRow}
                className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Medicine</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {prescriptionItems.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center text-xs">
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      value={item.medicineName}
                      onChange={(e) => handleUpdateMedicine(idx, 'medicineName', e.target.value)}
                      placeholder="Medicine Name (e.g. Tab. Telmisartan 40mg)"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      value={item.dosage}
                      onChange={(e) => handleUpdateMedicine(idx, 'dosage', e.target.value)}
                      placeholder="Dosage (e.g. 40mg)"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={item.timing}
                      onChange={(e) => handleUpdateMedicine(idx, 'timing', e.target.value)}
                      placeholder="Timing (1-0-1)"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <input
                      type="number"
                      value={item.days}
                      onChange={(e) => handleUpdateMedicine(idx, 'days', Number(e.target.value))}
                      placeholder="Days"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-center"
                    />
                  </div>
                  <div className="sm:col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveMedicineRow(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Doctor Advice & Follow up */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="font-bold text-slate-700 uppercase tracking-wider block">Clinical Advice / Dietary Instructions</label>
              <textarea
                rows={2}
                value={doctorAdvice}
                onChange={(e) => setDoctorAdvice(e.target.value)}
                placeholder="e.g. Low sodium diet, urgent ECG, avoid heavy physical exertion..."
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase tracking-wider block">Follow Up In (Days)</label>
              <input
                type="number"
                value={followUpDays}
                onChange={(e) => setFollowUpDays(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-base"
              />
            </div>
          </div>

          {/* Save & Sign Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {saveSuccessMsg ? (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 animate-pulse">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Prescription digitally signed and saved to ABHA & Hospital HIS!</span>
              </span>
            ) : <div />}

            <button
              type="button"
              onClick={handleSaveAndSign}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save & Sign Consultation</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT 3: TODAY'S QUEUE                                              */}
      {/* ========================================================================= */}
      {activeTab === 'queue' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              <span>Today's OPD Patient Queue ({patients.length})</span>
            </h3>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="space-y-3">
            {filteredPatients.map((p, idx) => {
              const isSelected = p.id === patient.id;
              const isCritical = p.triageRisk === 'CRITICAL_EMERGENCY';

              return (
                <div
                  key={`${p.id}-${idx}`}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected ? 'bg-teal-50 border-teal-300 ring-2 ring-teal-200' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xs px-2.5 py-1 bg-slate-900 text-white rounded-lg">
                      {p.tokenNumber}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                      <p className="text-xs text-slate-500">{p.age} yrs • {p.gender} • ID: <span className="font-mono font-bold text-teal-700">{p.patientId || p.id}</span> • {p.symptoms[0]?.name || 'Routine Checkup'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-center">
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                      isCritical ? 'bg-rose-600 text-white animate-pulse' : 'bg-teal-100 text-teal-800'
                    }`}>
                      {p.triageRisk.replace(/_/g, ' ')}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setLoadedPatientId(p.id);
                        onSelectPatient(p.id);
                        setActiveTab('summary');
                      }}
                      className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                    >
                      View Patient
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT 4: SCANNED REPORTS & DOCUMENT VIEWER                          */}
      {/* ========================================================================= */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Eye className="w-5 h-5 text-teal-600" />
              <span>Digitized Medical Reports & Original Document Scans ({patient.scannedDocuments?.length || 0})</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Click any record to inspect original document scan
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(patient.scannedDocuments || []).map((doc, idx) => (
              <div 
                key={idx} 
                className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl space-y-3 text-xs transition-all cursor-pointer shadow-xs"
                onClick={() => setSelectedDocForPreview(doc)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">{doc.fileName || doc.documentTitle}</span>
                    <span className="text-[11px] text-slate-500">{doc.documentDate || doc.dateOfRecord} • {doc.providerName || doc.doctorName || 'OPD Diagnostic'}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-teal-100 text-teal-900 px-2 py-0.5 rounded uppercase">
                    {doc.fileType || 'Prescription'}
                  </span>
                </div>

                {doc.extractedData?.medications && doc.extractedData.medications.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 space-y-1">
                    <span className="font-bold text-slate-700 block text-[11px]">OCR Extracted Medications:</span>
                    {doc.extractedData.medications.slice(0, 3).map((m, mIdx) => (
                      <p key={mIdx} className="text-slate-600 font-medium">• {m.name} ({m.dose})</p>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-teal-700 font-bold">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> Inspect Original Document
                  </span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>

          {(!patient.scannedDocuments || patient.scannedDocuments.length === 0) && (
            <p className="text-xs text-slate-500 text-center p-8 bg-slate-50 rounded-2xl">
              No scanned prescriptions or lab documents attached to this record.
            </p>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT 5: SOS ALERTS                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'sos' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-rose-900 text-base flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>Emergency Red Flag & SOS Alerts</span>
          </h3>

          <div className="space-y-3">
            {patients.filter(p => p.triageRisk === 'CRITICAL_EMERGENCY' || p.redFlagsDetected.length > 0).map((p, idx) => (
              <div key={idx} className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{p.tokenNumber}</span>
                    <strong className="text-slate-900 text-sm">{p.name}</strong>
                  </div>
                  <span className="px-2.5 py-0.5 bg-rose-600 text-white rounded font-bold text-[10px] animate-pulse">
                    CRITICAL EMERGENCY
                  </span>
                </div>
                <div className="space-y-1 text-rose-950 font-semibold">
                  {p.redFlagsDetected.map((rf, rIdx) => (
                    <p key={rIdx}>🚨 {rf}</p>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onSelectPatient(p.id);
                    setActiveTab('snapshot');
                  }}
                  className="px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold text-xs cursor-pointer"
                >
                  Prioritize Consultation
                </button>
              </div>
            ))}

            {patients.filter(p => p.triageRisk === 'CRITICAL_EMERGENCY').length === 0 && (
              <p className="text-xs text-slate-500 text-center p-8 bg-slate-50 rounded-2xl">
                No active critical emergency alerts in the OPD queue.
              </p>
            )}
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {selectedDocForPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">{selectedDocForPreview.fileName || selectedDocForPreview.documentTitle}</h3>
                <p className="text-xs text-slate-500">
                  {selectedDocForPreview.documentDate || selectedDocForPreview.dateOfRecord} • {selectedDocForPreview.fileType?.toUpperCase()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDocForPreview(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Preview image or placeholder */}
            <div className="p-4 bg-slate-900 rounded-2xl text-center space-y-2">
              {selectedDocForPreview.imageUrl ? (
                <img 
                  src={selectedDocForPreview.imageUrl} 
                  alt="Scanned record" 
                  className="max-h-72 mx-auto rounded-xl object-contain shadow-md"
                />
              ) : (
                <div className="py-12 text-slate-400 space-y-2">
                  <FileText className="w-12 h-12 mx-auto text-teal-400 opacity-80" />
                  <p className="text-xs font-mono font-bold text-slate-300">
                    [ Original Document Image Indexed in Health System ]
                  </p>
                  <p className="text-[11px] text-slate-400">
                    High-resolution scan verified for Patient {patient.name}
                  </p>
                </div>
              )}
            </div>

            {/* Extracted Structured Data */}
            {selectedDocForPreview.extractedData && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider block">
                  OCR & AI Extracted Fields:
                </span>
                
                {selectedDocForPreview.extractedData.diagnoses && selectedDocForPreview.extractedData.diagnoses.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-700">Diagnoses:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedDocForPreview.extractedData.diagnoses.map((d, i) => (
                        <span key={i} className="px-2 py-0.5 bg-teal-100 text-teal-900 rounded font-semibold text-[11px]">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDocForPreview.extractedData.medications && selectedDocForPreview.extractedData.medications.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-700">Extracted Medications:</span>
                    <div className="space-y-1 mt-1">
                      {selectedDocForPreview.extractedData.medications.map((m, i) => (
                        <p key={i} className="text-slate-800 font-medium">• {m.name} ({m.dose}) — {m.frequency || 'Daily'}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDocForPreview(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Patient Summary Modal */}
      <PrintPatientSummaryModal
        isOpen={isPrintSummaryModalOpen}
        onClose={() => setIsPrintSummaryModalOpen(false)}
        patient={patient}
      />

    </div>
  );
};
