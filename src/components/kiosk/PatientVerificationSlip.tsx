import React, { useState } from 'react';
import { SafeQRCode } from '../common/SafeQRCode';
import { PatientProfile, SavedOpdToken } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../data/indianLanguages';
import { generateHandoffUrl } from '../../utils/kioskHandoff';
import { 
  CheckCircle2, 
  QrCode, 
  Volume2, 
  Printer, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  User, 
  Heart, 
  AlertTriangle, 
  Smartphone, 
  ExternalLink,
  Save,
  RefreshCw
} from 'lucide-react';

interface PatientVerificationSlipProps {
  patient: PatientProfile;
  onFinishAndSubmit?: () => void;
  onGoToDoctorPortal?: () => void;
  onOpenSmartphoneHandoff?: () => void;
  onReturnToDashboard?: () => void;
  onSaveTokenToDashboard?: (updatedPatient: PatientProfile) => void;
}

export const PatientVerificationSlip: React.FC<PatientVerificationSlipProps> = ({
  patient,
  onFinishAndSubmit,
  onOpenSmartphoneHandoff,
  onReturnToDashboard,
  onSaveTokenToDashboard
}) => {
  const [isSpeakingSummary, setIsSpeakingSummary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const langConfig = SUPPORTED_LANGUAGES[patient.language as keyof typeof SUPPORTED_LANGUAGES] || SUPPORTED_LANGUAGES.en;

  const handoffUrl = generateHandoffUrl(patient, 7, false);

  const handleSaveTokenToDashboard = () => {
    setIsSaving(true);

    const newSavedToken: SavedOpdToken = {
      id: `tok-${patient.tokenNumber}-${Date.now()}`,
      tokenNumber: patient.tokenNumber,
      uhid: patient.uhid,
      patientName: patient.name,
      department: patient.department,
      careStream: patient.careStream,
      roomNumber: 'Room 04 (Dr. Desk)',
      estimatedWaitMinutes: 8,
      triageRisk: patient.triageRisk,
      issuedAt: new Date().toISOString(),
      status: 'active',
      complaintsSummary: patient.symptoms && patient.symptoms.length > 0
        ? patient.symptoms.map(s => s.name).join(', ')
        : 'General OPD Consultation',
      vitalsSummary: patient.vitals?.bpSystolic
        ? `BP: ${patient.vitals.bpSystolic}/${patient.vitals.bpDiastolic} mmHg, HR: ${patient.vitals.heartRate} bpm, SpO2: ${patient.vitals.spO2}%`
        : undefined,
      doctorName: 'Dr. Desk (Room 04)',
      scannedDocsCount: patient.scannedDocuments?.length || 0,
      qrPayload: handoffUrl
    };

    const existingTokens = patient.savedTokens || [];
    const updatedTokens = [
      newSavedToken,
      ...existingTokens.filter(t => t.tokenNumber !== patient.tokenNumber)
    ];

    const updatedPatient: PatientProfile = {
      ...patient,
      status: 'ready_for_doctor',
      savedTokens: updatedTokens
    };

    setIsSaved(true);
    setIsSaving(false);

    if (onSaveTokenToDashboard) {
      onSaveTokenToDashboard(updatedPatient);
    } else if (onReturnToDashboard) {
      onReturnToDashboard();
    }
  };

  const speakSummaryOutLoud = () => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const mainComplaint = patient.symptoms[0]?.name || 'सामान्य स्वास्थ्य परामर्श';
      const textToSpeak = `नमस्ते ${patient.name} जी। आपका टोकन नंबर है ${patient.tokenNumber}। आपकी मुख्य तकलीफ ${mainComplaint} दर्ज कर ली गई है। कृपया कमरा नंबर 4 के बाहर प्रतीक्षा करें।`;
      
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = langConfig.speechCode;
      utterance.onstart = () => setIsSpeakingSummary(true);
      utterance.onend = () => setIsSpeakingSummary(false);
      utterance.onerror = () => setIsSpeakingSummary(false);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS error:', e);
    }
  };

  return (
    <div id="patient-verification-slip-view" className="space-y-6 max-w-4xl mx-auto">
      {/* Verification Success Header */}
      <div className="p-5 bg-teal-900 text-white rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-7 h-7 text-teal-400" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg sm:text-xl">Pre-Consultation Intake Completed!</h3>
            <p className="text-xs sm:text-sm text-teal-200">
              Your clinical history, vitals, and previous scanned reports are organized for the doctor.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={speakSummaryOutLoud}
          className="px-4 py-2 bg-teal-800 hover:bg-teal-700 text-teal-100 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Volume2 className="w-4 h-4" />
          <span>{isSpeakingSummary ? 'Speaking...' : 'Listen in your Language'}</span>
        </button>
      </div>

      {/* OPD Token & Verification Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recorded Information Verification */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              Verified Patient Intake Summary
            </h4>
            <span className="text-xs px-2.5 py-1 bg-teal-50 text-teal-800 font-semibold rounded-full">
              Consent: Digital & ABDM Linked
            </span>
          </div>

          {/* Patient Demographics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Patient Name</span>
              <span className="font-bold text-slate-900 text-sm">{patient.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Age / Gender</span>
              <span className="font-bold text-slate-900 text-sm">{patient.age} yrs • {patient.gender}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">ABHA Health ID</span>
              <span className="font-mono font-bold text-slate-900 text-xs">{patient.abhaId || '91-4829-1029-4820'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">OPD Department</span>
              <span className="font-bold text-teal-900">{patient.department}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Care Stream</span>
              <span className="font-bold text-slate-800 uppercase">{patient.careStream}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Mobile Number</span>
              <span className="font-mono font-bold text-slate-900">{patient.mobile}</span>
            </div>
          </div>

          {/* Recorded Complaints */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Recorded Complaints ({patient.symptoms.length})
            </h5>
            <div className="space-y-2">
              {patient.symptoms.map((s, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{s.name}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Duration: {s.duration} • Severity: {s.severity}/10 • Onset: {s.onset}
                      {s.character && ` • ${s.character}`}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    s.severity >= 8 ? 'bg-rose-100 text-rose-800' : 'bg-teal-100 text-teal-800'
                  }`}>
                    Level {s.severity}/10
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Vitals Summary */}
          {patient.vitals.bpSystolic && (
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Captured Vitals
              </h5>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 text-[10px] block font-semibold">BP</span>
                  <span className="font-bold text-slate-900 text-sm">{patient.vitals.bpSystolic}/{patient.vitals.bpDiastolic}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 text-[10px] block font-semibold">Heart Rate</span>
                  <span className="font-bold text-slate-900 text-sm">{patient.vitals.heartRate} bpm</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 text-[10px] block font-semibold">SpO2</span>
                  <span className={`font-bold text-sm ${patient.vitals.spO2 && patient.vitals.spO2 < 94 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {patient.vitals.spO2}%
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 text-[10px] block font-semibold">Blood Sugar</span>
                  <span className="font-bold text-slate-900 text-sm">{patient.vitals.bloodSugar || 110} mg/dL</span>
                </div>
              </div>
            </div>
          )}

          {/* Scanned Docs Count */}
          {patient.scannedDocuments.length > 0 && (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-center justify-between">
              <span className="font-semibold">📁 {patient.scannedDocuments.length} Medical Documents & Prescriptions Digitized</span>
              <span className="text-[11px] font-bold text-teal-700">Chronologically Synced</span>
            </div>
          )}
        </div>

        {/* Right 1 Col: Printable Token Slip & Action */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-5 text-center space-y-4 shadow-sm relative overflow-hidden">
            <div className="absolute -top-3 -right-3 w-16 h-16 bg-teal-600/10 rounded-full blur-sm"></div>

            <div className="border-b border-slate-100 pb-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Hospital OPD Kiosk Slip</p>
              <h3 className="font-extrabold text-3xl text-slate-900 mt-1">{patient.tokenNumber}</h3>
              <p className="text-xs font-semibold text-teal-700 mt-0.5">{patient.department}</p>
            </div>

            {/* Dynamic Scannable QR Code */}
            <div className="p-3 bg-white rounded-xl inline-block border border-slate-200 shadow-2xs">
              <SafeQRCode
                value={handoffUrl}
                size={110}
                level="M"
                includeMargin={false}
                className="mx-auto rounded"
                fallbackLabel={`Token: ${patient.tokenNumber}`}
              />
              <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                Scan with Phone Camera
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 text-left bg-slate-50 p-3 rounded-xl">
              <div className="flex justify-between">
                <span>Room No:</span>
                <span className="font-bold text-slate-900">Room 04 (Dr. Desk)</span>
              </div>
              <div className="flex justify-between">
                <span>Est. Wait:</span>
                <span className="font-bold text-slate-900">~ 8 minutes (2 ahead)</span>
              </div>
              <div className="flex justify-between">
                <span>Triage Priority:</span>
                <span className={`font-bold ${patient.triageRisk === 'CRITICAL_EMERGENCY' ? 'text-rose-600' : 'text-teal-700'}`}>
                  {patient.triageRisk === 'CRITICAL_EMERGENCY' ? '🚨 FAST-TRACK' : 'Standard'}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Token
              </button>

              {onOpenSmartphoneHandoff && (
                <button
                  type="button"
                  onClick={onOpenSmartphoneHandoff}
                  className="px-3 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
                  title="Show full size smartphone QR code"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Mobile</span>
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons: Save Token to Patient Dashboard (Tokens Section) & Return to Dashboard */}
          <div className="flex flex-col gap-2.5 pt-1">
            <button
              type="button"
              id="save-token-to-dashboard-btn"
              onClick={handleSaveTokenToDashboard}
              disabled={isSaving}
              className="w-full py-3.5 px-4 bg-teal-700 hover:bg-teal-800 active:scale-[0.99] text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-75"
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-teal-200" />
                  <span>Token Saved! Opening Tokens Section...</span>
                </>
              ) : isSaving ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-teal-200" />
                  <span>Saving to Patient Dashboard...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 text-teal-200" />
                  <span>Save to Patient Dashboard (Tokens Section)</span>
                  <ArrowRight className="w-4 h-4 text-teal-300 ml-1" />
                </>
              )}
            </button>

            {onReturnToDashboard && (
              <button
                type="button"
                id="verification-return-dashboard-btn"
                onClick={onReturnToDashboard}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl border border-slate-200 shadow-2xs transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5 rotate-180 text-slate-500" />
                <span>Return to Patient Home</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
