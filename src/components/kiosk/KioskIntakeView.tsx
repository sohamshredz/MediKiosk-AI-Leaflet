import React, { useState, useEffect } from 'react';
import { PatientProfile, SymptomItem, CareStream, SupportedLanguage, ScannedDocument, PatientVitals } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../data/indianLanguages';
import { BodyMapSelector } from './BodyMapSelector';
import { VoiceIntakeAssistant } from './VoiceIntakeAssistant';
import { DocumentScanner } from './DocumentScanner';
import { AyushModule } from './AyushModule';
import { VitalsStation } from './VitalsStation';
import { PatientVerificationSlip } from './PatientVerificationSlip';
import { SmartphoneHandoffModal } from './SmartphoneHandoffModal';
import { AutoSaveStatus } from '../../utils/kioskStorage';
import { useLanguage } from '../../context/LanguageContext';
import { 
  User, 
  ShieldCheck, 
  Stethoscope, 
  Compass, 
  Mic, 
  FileText, 
  Activity, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles,
  QrCode,
  Smartphone,
  Check,
  RefreshCw,
  Save,
  HardDrive,
  RotateCcw
} from 'lucide-react';

interface KioskIntakeViewProps {
  currentPatient: PatientProfile;
  onUpdatePatient: (updated: PatientProfile) => void;
  onGoToDoctorPortal: () => void;
  savedStep?: number;
  savedModality?: 'voice' | 'touch';
  onStepChange?: (step: number, modality?: 'voice' | 'touch') => void;
  saveStatus?: AutoSaveStatus;
  lastSavedTimestamp?: string | null;
  onForceSave?: () => void;
  onBackToLanding?: () => void;
  onSaveToDashboardTokens?: (updatedPatient: PatientProfile) => void;
}

export const KioskIntakeView: React.FC<KioskIntakeViewProps> = ({
  currentPatient,
  onUpdatePatient,
  onGoToDoctorPortal,
  savedStep,
  savedModality,
  onStepChange,
  saveStatus = 'saved',
  lastSavedTimestamp,
  onForceSave,
  onBackToLanding,
  onSaveToDashboardTokens
}) => {
  const { t } = useLanguage();
  // Always default to Step 1 on fresh mount to avoid unexpected auto-navigation
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [intakeModality, setIntakeModality] = useState<'voice' | 'touch'>(() => savedModality || 'voice');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isHandoffModalOpen, setIsHandoffModalOpen] = useState(false);
  // Prompt user whether to resume unfinished draft
  const [draftResumeOffer, setDraftResumeOffer] = useState<number | null>(
    savedStep && savedStep > 1 ? savedStep : null
  );

  // When patient changes, check if they have a saved draft step
  useEffect(() => {
    if (savedStep && savedStep > 1) {
      setDraftResumeOffer(savedStep);
    } else {
      setDraftResumeOffer(null);
    }
  }, [currentPatient.id, savedStep]);

  const updateStepAndPersist = (newStep: number, newModality?: 'voice' | 'touch') => {
    setCurrentStep(newStep);
    setDraftResumeOffer(null);
    const mod = newModality || intakeModality;
    if (newModality) {
      setIntakeModality(newModality);
    }
    onStepChange?.(newStep, mod);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const handleResumeDraft = () => {
    if (draftResumeOffer) {
      setCurrentStep(draftResumeOffer);
      setDraftResumeOffer(null);
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  };

  const handleStartFresh = () => {
    setCurrentStep(1);
    setDraftResumeOffer(null);
    onStepChange?.(1, intakeModality);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const langConfig = SUPPORTED_LANGUAGES[currentPatient.language as keyof typeof SUPPORTED_LANGUAGES] || SUPPORTED_LANGUAGES.en;

  const handleConsent = (consentType: 'voice' | 'touch' | 'digital_signature') => {
    const updated = {
      ...currentPatient,
      consentGiven: true,
      consentType,
      consentTimestamp: new Date().toISOString()
    };
    onUpdatePatient(updated);
    updateStepAndPersist(2);
  };

  const handleSelectStream = (careStream: CareStream) => {
    const updated = {
      ...currentPatient,
      careStream,
      department: careStream === 'ayurveda' ? 'Kayachikitsa / AYUSH OPD' : 'General Medicine OPD'
    };
    onUpdatePatient(updated);
    updateStepAndPersist(3);
  };

  const handleAddSymptom = (symptom: SymptomItem) => {
    const updated = {
      ...currentPatient,
      symptoms: [...currentPatient.symptoms.filter(s => s.name !== symptom.name), symptom]
    };
    onUpdatePatient(updated);
  };

  const handleRemoveSymptom = (id: string) => {
    const updated = {
      ...currentPatient,
      symptoms: currentPatient.symptoms.filter(s => s.id !== id)
    };
    onUpdatePatient(updated);
  };

  const handleAddDocument = (doc: ScannedDocument) => {
    const updatedDocs = [...currentPatient.scannedDocuments, doc];
    
    // Also build a chronological timeline event
    const newTimelineEvent = {
      id: 'tl-' + Date.now(),
      date: doc.documentDate,
      title: `${doc.fileType.toUpperCase()}: ${doc.providerName || 'Uploaded Record'}`,
      category: (doc.fileType === 'ayush_slip' ? 'ayush' : doc.fileType === 'lab_report' ? 'lab_report' : 'prescription') as any,
      hospitalOrDoctor: doc.doctorName || doc.providerName || 'Hospital Clinic',
      summary: doc.extractedData?.keyObservations?.[0] || 'Digitized previous medical record',
      documentId: doc.id
    };

    const updated = {
      ...currentPatient,
      scannedDocuments: updatedDocs,
      timeline: [...currentPatient.timeline, newTimelineEvent].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    };

    onUpdatePatient(updated);
  };

  const handleRemoveDocument = (id: string) => {
    const updated = {
      ...currentPatient,
      scannedDocuments: currentPatient.scannedDocuments.filter(d => d.id !== id)
    };
    onUpdatePatient(updated);
  };

  const handleEvaluateTriage = async () => {
    try {
      const res = await fetch('/api/intake/evaluate-triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: currentPatient.age,
          gender: currentPatient.gender,
          symptoms: currentPatient.symptoms,
          vitals: currentPatient.vitals,
          pastIllnesses: currentPatient.pastIllnesses
        })
      });
      const data = await res.json();
      if (data.success && data.triage) {
        onUpdatePatient({
          ...currentPatient,
          triageRisk: data.triage.riskLevel || currentPatient.triageRisk,
          redFlagsDetected: data.triage.redFlagsDetected || currentPatient.redFlagsDetected
        });
      }
    } catch (e) {
      console.warn('Triage evaluation fallback:', e);
    }
  };

  const generateFinalClinicalSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const res = await fetch('/api/intake/generate-clinical-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientProfile: currentPatient })
      });
      const data = await res.json();
      if (data.success && data.clinicalSummary) {
        onUpdatePatient({
          ...currentPatient,
          clinicalSummary: data.clinicalSummary,
          status: 'ready_for_doctor'
        });
      }
    } catch (err) {
      console.warn('Clinical summary generation error:', err);
    } finally {
      setIsGeneratingSummary(false);
      updateStepAndPersist(7);
    }
  };

  const STEPS = [
    { num: 1, title: 'Identification & Consent', icon: ShieldCheck },
    { num: 2, title: 'Care Stream', icon: Stethoscope },
    { num: 3, title: 'Voice & Touch Intake', icon: Mic },
    { num: 4, title: 'AYUSH Assessment', icon: Compass, optional: currentPatient.careStream !== 'ayurveda' && currentPatient.careStream !== 'integrated' },
    { num: 5, title: 'Medical Records OCR', icon: FileText },
    { num: 6, title: 'Vitals & Triage', icon: Activity },
    { num: 7, title: 'Verification & Token', icon: CheckCircle2 }
  ];

  return (
    <div id="kiosk-intake-main-wrapper" className="space-y-6">
      {/* Progress Steps Header + Auto-Save Status Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            {onBackToLanding && (
              <button
                type="button"
                id="kiosk-progress-back-btn"
                onClick={onBackToLanding}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200 cursor-pointer shrink-0"
                title="Return to Patient Dashboard"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-teal-700" />
                <span>Back to Dashboard</span>
              </button>
            )}
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              OPD Kiosk Progress:
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Step {currentStep} of {STEPS.filter(s => !s.optional).length}
            </span>
          </div>

          {/* Local Storage Debounced Auto-Save Pill + Smartphone Resume Button */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              id="kiosk-smartphone-resume-btn"
              onClick={() => setIsHandoffModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-[11px] font-bold transition-all shadow-2xs cursor-pointer"
              title="Scan QR code to immediately resume this session on your personal phone"
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
              <QrCode className="w-3 h-3 text-indigo-500" />
              <span>Resume on Phone</span>
            </button>

            <div 
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors"
              onClick={onForceSave}
              title="Debounced every 5 seconds to local browser storage. Click to save immediately."
            >
              <HardDrive className="w-3.5 h-3.5 text-teal-600" />
              {saveStatus === 'saving' ? (
                <span className="flex items-center gap-1 font-medium text-amber-600">
                  <RefreshCw className="w-3 h-3 animate-spin text-amber-500" />
                  Auto-saving (5s debounce)...
                </span>
              ) : (
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <Check className="w-3 h-3 text-teal-600" />
                  Saved to Local Storage {lastSavedTimestamp ? `(${lastSavedTimestamp})` : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between overflow-x-auto gap-2 pb-1">
          {STEPS.map((s) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            const isSkipped = s.optional;

            if (isSkipped) return null;

            return (
              <button
                key={s.num}
                type="button"
                onClick={() => isCompleted && updateStepAndPersist(s.num)}
                disabled={!isCompleted && !isCurrent}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isCurrent
                    ? 'bg-teal-600 text-white shadow-xs'
                    : isCompleted
                    ? 'bg-teal-50 text-teal-800 hover:bg-teal-100'
                    : 'text-slate-400 bg-slate-50 opacity-60'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isCurrent ? 'bg-white text-teal-800' : isCompleted ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {isCompleted ? <Check className="w-3 h-3" /> : s.num}
                </div>
                <span>{s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Unfinished Draft Form Resume Notification (Explicit User Choice) */}
      {draftResumeOffer && currentStep === 1 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-950">
                Unfinished Intake Draft Detected
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                We found previous progress at <strong>Step {draftResumeOffer} ({STEPS[draftResumeOffer - 1]?.title})</strong> for {currentPatient.name}. Would you like to resume where you left off or start clean?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={handleStartFresh}
              className="px-3 py-1.5 bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Start from Step 1
            </button>
            <button
              type="button"
              onClick={handleResumeDraft}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Resume Step {draftResumeOffer}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 1: Identification & Consent */}
      {currentStep === 1 && (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Welcome to Hospital OPD Intake Kiosk
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
              Ayushman Bharat Digital Mission (ABDM) & DPDP Act 2023 Compliant Pre-Consultation System.
            </p>
          </div>

          {/* Patient Quick Info Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-400">Current Patient Identity</span>
              <span className="text-xs font-bold text-teal-700 bg-teal-100/60 px-2.5 py-0.5 rounded-full">
                ABHA ID Verified
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Name</span>
                <span className="font-bold text-slate-900 text-sm">{currentPatient.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Age & Gender</span>
                <span className="font-bold text-slate-900">{currentPatient.age} yrs • {currentPatient.gender}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">ABHA Health ID</span>
                <span className="font-mono font-bold text-slate-900">{currentPatient.abhaId || '91-4829-1029-4820'}</span>
              </div>
            </div>
          </div>

          {/* Consent Agreement Box */}
          <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-2 text-xs text-teal-900">
            <h4 className="font-bold text-sm text-teal-950 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              Patient Informed Consent & Privacy Declaration
            </h4>
            <p className="leading-relaxed">
              I consent to providing my medical history, symptoms, and previous prescriptions to MediKiosk AI.
              I understand that this information will be prepared as a <strong>structured clinical decision support summary for my consulting doctor</strong> and is encrypted according to Ayushman Bharat standards.
            </p>
          </div>

          {/* Consent Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              id="consent-voice-btn"
              onClick={() => handleConsent('voice')}
              className="p-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 group"
            >
              <Mic className="w-5 h-5 text-teal-200 group-hover:scale-110 transition-transform" />
              <span>Voice Consent ("I Agree")</span>
            </button>

            <button
              type="button"
              id="consent-touch-btn"
              onClick={() => handleConsent('touch')}
              className="p-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Touch Screen Agreement</span>
            </button>
          </div>

          {/* Mobile QR Transfer Option */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-800">Prefer completing on your smartphone?</p>
                <p className="text-[11px] text-slate-500">Scan a unique QR code to continue while waiting in the OPD lounge.</p>
              </div>
            </div>
            <button
              type="button"
              id="step1-show-qr-btn"
              onClick={() => setIsHandoffModalOpen(true)}
              className="px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Show QR Code</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Care Stream Selection (Allopathy vs. AYUSH / Ayurveda vs. Integrated) */}
      {currentStep === 2 && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Select Your Consultation OPD Stream
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Choose the clinical department you are visiting today to tailor your pre-consultation intake.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Allopathy Card */}
            <button
              type="button"
              id="stream-allopathy-btn"
              onClick={() => handleSelectStream('allopathy')}
              className={`p-6 rounded-2xl border-2 text-left transition-all flex flex-col justify-between space-y-4 hover:shadow-md ${
                currentPatient.careStream === 'allopathy'
                  ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-200'
                  : 'border-slate-200 bg-white hover:border-teal-300'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-slate-900">Modern Medicine (Allopathy)</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  General Medicine, Cardiology, Pulmonology, Nephrology, Surgery & Pediatrics.
                </p>
              </div>
              <span className="text-xs font-bold text-teal-700 flex items-center gap-1">
                Standard Clinical Intake <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>

            {/* Ayurveda / AYUSH Card */}
            <button
              type="button"
              id="stream-ayurveda-btn"
              onClick={() => handleSelectStream('ayurveda')}
              className={`p-6 rounded-2xl border-2 text-left transition-all flex flex-col justify-between space-y-4 hover:shadow-md ${
                currentPatient.careStream === 'ayurveda'
                  ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-200'
                  : 'border-slate-200 bg-white hover:border-emerald-300'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Compass className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-slate-900">AYUSH & Ayurveda OPD</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Kayachikitsa, Panchakarma, Shalya, Prakriti, Agni & Koshtha comprehensive assessment.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                Ayurvedic Intake Track <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>

            {/* Integrated OPD */}
            <button
              type="button"
              id="stream-integrated-btn"
              onClick={() => handleSelectStream('integrated')}
              className={`p-6 rounded-2xl border-2 text-left transition-all flex flex-col justify-between space-y-4 hover:shadow-md ${
                currentPatient.careStream === 'integrated'
                  ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-200'
                  : 'border-slate-200 bg-white hover:border-indigo-300'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-slate-900">Integrated Care OPD</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Joint consultation bridging modern clinical diagnostics with holistic AYUSH protocols.
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-700 flex items-center gap-1">
                Combined Holistic Intake <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
          </div>

          {/* Navigation Back to Step 1 */}
          <div className="flex justify-start pt-2">
            <button
              type="button"
              id="back-to-step-1-btn"
              onClick={() => updateStepAndPersist(1)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Language & Patient Selection</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Voice & Touch Intake */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Patient Medical History Intake
              </h2>
              <p className="text-xs text-slate-500">
                You can converse naturally via Voice AI or tap on the Anatomical Body Map.
              </p>
            </div>

            {/* Modality Toggle Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setIntakeModality('voice')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  intakeModality === 'voice'
                    ? 'bg-white text-teal-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mic className="w-4 h-4 text-teal-600" />
                <span>Voice Conversation AI</span>
              </button>
              <button
                type="button"
                onClick={() => setIntakeModality('touch')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  intakeModality === 'touch'
                    ? 'bg-white text-teal-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Activity className="w-4 h-4 text-teal-600" />
                <span>Touchscreen Body Map</span>
              </button>
            </div>
          </div>

          {/* Active Intake View */}
          {intakeModality === 'voice' ? (
            <VoiceIntakeAssistant
              language={currentPatient.language}
              careStream={currentPatient.careStream}
              currentProfile={currentPatient}
              onExtractedData={(extracted) => {
                const updated: Partial<PatientProfile> = {};
                
                if (extracted.pastIllnessesFound?.length) {
                  updated.pastIllnesses = Array.from(new Set([...(currentPatient.pastIllnesses || []), ...extracted.pastIllnessesFound]));
                }
                
                if (extracted.isRedFlag && extracted.redFlagReason) {
                  updated.triageRisk = 'CRITICAL_EMERGENCY';
                  updated.redFlagsDetected = Array.from(new Set([...(currentPatient.redFlagsDetected || []), extracted.redFlagReason]));
                } else if (extracted.triageUrgency) {
                  updated.triageRisk = extracted.triageUrgency;
                }

                if (Object.keys(updated).length > 0) {
                  onUpdatePatient({
                    ...currentPatient,
                    ...updated
                  });
                }
              }}
              onAddSymptom={handleAddSymptom}
              onProceedToNextStep={() => {
                if (currentPatient.careStream === 'ayurveda' || currentPatient.careStream === 'integrated') {
                  updateStepAndPersist(4);
                } else {
                  updateStepAndPersist(5);
                }
              }}
              onConsultationSaved={(consultation) => {
                onUpdatePatient({
                  ...currentPatient,
                  symptoms: consultation.symptoms,
                  pastIllnesses: consultation.pastIllnesses,
                  allergies: consultation.knownAllergies.map(substance => ({
                    id: 'all-' + Date.now(),
                    substance,
                    severity: 'moderate',
                    reactionType: 'Reported during clinical intake'
                  })),
                  redFlagsDetected: consultation.redFlagsDetected,
                  triageRisk: consultation.triageRisk,
                  status: 'ready_for_doctor'
                });
              }}
              onBackRequest={() => updateStepAndPersist(2)}
            />
          ) : (
            <BodyMapSelector
              language={currentPatient.language}
              symptoms={currentPatient.symptoms}
              onAddSymptom={handleAddSymptom}
              onRemoveSymptom={handleRemoveSymptom}
            />
          )}

          {/* Navigation Bar */}
          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={() => updateStepAndPersist(2)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <button
              type="button"
              id="proceed-from-intake-btn"
              onClick={() => {
                if (currentPatient.careStream === 'ayurveda' || currentPatient.careStream === 'integrated') {
                  updateStepAndPersist(4);
                } else {
                  updateStepAndPersist(5);
                }
              }}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md"
            >
              <span>Next: {currentPatient.careStream === 'allopathy' ? 'Scan Medical Reports' : 'AYUSH Assessment'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: AYUSH Module */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <AyushModule
            ayushData={currentPatient.ayushAssessment}
            onChange={(updatedAyush) => {
              onUpdatePatient({ ...currentPatient, ayushAssessment: updatedAyush });
            }}
          />

          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={() => updateStepAndPersist(3)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back to History Intake
            </button>

            <button
              type="button"
              onClick={() => updateStepAndPersist(5)}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md"
            >
              <span>Next: Medical Document Scanner</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Medical Document Scanner & Intelligent OCR */}
      {currentStep === 5 && (
        <div className="space-y-6">
          <DocumentScanner
            documents={currentPatient.scannedDocuments}
            onAddDocument={handleAddDocument}
            onRemoveDocument={handleRemoveDocument}
          />

          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={() => {
                if (currentPatient.careStream === 'ayurveda' || currentPatient.careStream === 'integrated') {
                  updateStepAndPersist(4);
                } else {
                  updateStepAndPersist(3);
                }
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <button
              type="button"
              id="proceed-to-vitals-btn"
              onClick={() => updateStepAndPersist(6)}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md"
            >
              <span>Next: Kiosk Vitals & Triage</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: Kiosk Vitals & Red Flag Triage */}
      {currentStep === 6 && (
        <div className="space-y-6">
          <VitalsStation
            vitals={currentPatient.vitals}
            triageRisk={currentPatient.triageRisk}
            redFlags={currentPatient.redFlagsDetected}
            onChangeVitals={(updatedV) => {
              onUpdatePatient({ ...currentPatient, vitals: updatedV });
            }}
            onEvaluateTriage={handleEvaluateTriage}
          />

          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={() => updateStepAndPersist(5)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Documents
            </button>

            <button
              type="button"
              id="finalize-and-generate-summary-btn"
              disabled={isGeneratingSummary}
              onClick={generateFinalClinicalSummary}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg"
            >
              <Sparkles className="w-4 h-4 text-teal-200" />
              <span>{isGeneratingSummary ? 'Synthesizing Physician Summary with Gemini AI...' : 'Verify Intake & Generate OPD Token'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 7: Patient Verification & OPD Token Slip */}
      {currentStep === 7 && (
        <PatientVerificationSlip
          patient={currentPatient}
          onFinishAndSubmit={() => {}}
          onOpenSmartphoneHandoff={() => setIsHandoffModalOpen(true)}
          onReturnToDashboard={onBackToLanding}
          onSaveTokenToDashboard={(updated) => {
            onUpdatePatient(updated);
            if (onSaveToDashboardTokens) {
              onSaveToDashboardTokens(updated);
            } else if (onBackToLanding) {
              onBackToLanding();
            }
          }}
        />
      )}

      {/* Smartphone Resume & Local Storage Handoff Modal */}
      <SmartphoneHandoffModal
        isOpen={isHandoffModalOpen}
        onClose={() => setIsHandoffModalOpen(false)}
        patient={currentPatient}
        currentStep={currentStep}
      />
    </div>
  );
};
