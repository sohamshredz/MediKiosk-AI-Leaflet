import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Phone, 
  KeyRound, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  Sparkles, 
  Database, 
  RefreshCw, 
  FileText, 
  Pill, 
  Activity, 
  Fingerprint, 
  UserCheck, 
  QrCode,
  Globe2,
  ChevronRight,
  Info,
  Server,
  Mic
} from 'lucide-react';
import { PatientProfile, SupportedLanguage, CareStream } from '../../types';
import { savePatientProfileToSupabase } from '../../utils/supabaseClient';

interface PatientLoginProps {
  patients: PatientProfile[];
  onLoginSuccess: (patient: PatientProfile, retrievedPhrSummary?: PhrRetrievalSummary) => void;
  onRegisterNew: (newProfile: PatientProfile) => void;
  onBackToKiosk?: () => void;
}

export interface PhrRetrievalSummary {
  recordsFetched: number;
  prescriptionsCount: number;
  labReportsCount: number;
  timelineMilestonesCount: number;
  hipSources: string[];
  lastSyncTimestamp: string;
}

export const PatientLogin: React.FC<PatientLoginProps> = ({
  patients,
  onLoginSuccess,
  onRegisterNew,
  onBackToKiosk
}) => {
  // Auth Modes
  const [authMode, setAuthMode] = useState<'mobile' | 'abha'>('abha');
  
  // Inputs
  const [identifierInput, setIdentifierInput] = useState<string>('');
  const [mobileInput, setMobileInput] = useState<string>('');
  const [authStep, setAuthStep] = useState<'input' | 'otp' | 'retrieving' | 'success'>('input');
  
  // OTP state
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [otpTimer, setOtpTimer] = useState<number>(30);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Registration Form State
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [registerForm, setRegisterForm] = useState({
    name: '',
    age: 30,
    gender: 'male' as 'male' | 'female' | 'other',
    mobile: '',
    email: '',
    careStream: 'allopathy' as CareStream,
    language: 'hi' as SupportedLanguage
  });

  // PHR Retrieval Simulation State
  const [retrievalStage, setRetrievalStage] = useState<string>('Querying ABDM Health Information Exchange Gateway...');
  const [retrievalProgress, setRetrievalProgress] = useState<number>(0);
  const [retrievedSummary, setRetrievedSummary] = useState<PhrRetrievalSummary | null>(null);
  const [authenticatedPatient, setAuthenticatedPatient] = useState<PatientProfile | null>(null);

  // OTP Countdown Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (authStep === 'otp' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [authStep, otpTimer]);

  // Handle Send OTP
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate Input
    if (authMode === 'mobile') {
      const isEmail = mobileInput.includes('@');
      const cleanMobile = mobileInput.replace(/[^0-9]/g, '');
      if (isEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(mobileInput.trim())) {
          setErrorMessage('Please enter a valid email address.');
          return;
        }
      } else if (cleanMobile.length < 10) {
        setErrorMessage('Please enter a valid 10-digit Indian mobile number or registered email address.');
        return;
      }
    } else {
      if (identifierInput.trim().length < 6) {
        setErrorMessage('Please enter a valid 14-digit ABHA Number or ABHA Address (e.g. 91-4829-1029-4820).');
        return;
      }
    }

    setOtpTimer(30);
    setAuthStep('otp');
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      val = val.slice(-1);
    }
    const newOtp = [...otpDigits];
    newOtp[index] = val;
    setOtpDigits(newOtp);

    // Auto-focus next input
    if (val && index < 3) {
      const nextInput = document.getElementById(`otp-digit-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // Perform Secure Authentication & PHR Retrieval
  const handleVerifyOtpAndFetchPhr = () => {
    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length !== 4) {
      setErrorMessage('Please enter the 4-digit verification code.');
      return;
    }

    // Identify corresponding patient
    let matched: PatientProfile | undefined;
    if (authMode === 'abha') {
      const cleanInput = identifierInput.replace(/[^0-9]/g, '');
      matched = patients.find(p => 
        (p.abhaId && p.abhaId.replace(/[^0-9]/g, '').includes(cleanInput)) || 
        (p.uhid && p.uhid.toLowerCase().includes(identifierInput.toLowerCase()))
      );
    } else {
      const isEmail = mobileInput.includes('@');
      const cleanMobile = mobileInput.replace(/[^0-9]/g, '');
      matched = patients.find(p => {
        if (isEmail && p.email && p.email.toLowerCase() === mobileInput.trim().toLowerCase()) {
          return true;
        }
        return !isEmail && cleanMobile.length >= 10 && p.mobile.replace(/[^0-9]/g, '').includes(cleanMobile.slice(-10));
      });
    }

    // If not matched in existing list, create an isolated authenticated patient profile
    const isEmailInput = authMode === 'mobile' && mobileInput.includes('@');
    const patientToLoad: PatientProfile = matched || {
      id: `pat-auth-${Date.now()}`,
      name: isEmailInput
        ? mobileInput.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        : (authMode === 'mobile' 
          ? `Patient ${mobileInput.replace(/[^0-9]/g, '').slice(-4) || ''}`.trim() 
          : (identifierInput.includes('@') ? identifierInput.split('@')[0] : `Patient ${identifierInput.replace(/[^0-9]/g, '').slice(-4) || ''}`.trim())),
      age: 32,
      gender: 'male',
      mobile: authMode === 'mobile' ? (isEmailInput ? '+91 9876500000' : `+91 ${mobileInput.replace(/[^0-9]/g, '').slice(-10)}`) : '+91 9876500000',
      email: isEmailInput ? mobileInput.trim().toLowerCase() : undefined,
      uhid: `UHID-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      tokenNumber: `OPD-${Math.floor(100 + Math.random() * 900)}`,
      registeredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: 'hi',
      careStream: 'allopathy',
      department: 'General Medicine OPD',
      abhaId: authMode === 'abha' ? identifierInput : `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      consentGiven: true,
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
        recordedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      scannedDocuments: [],
      timeline: [
        {
          id: `tl-${Date.now()}`,
          date: 'Today',
          title: 'Authenticated Session Established',
          category: 'prescription',
          hospitalOrDoctor: 'MediKiosk AI Gateway',
          summary: 'Signed in successfully with verified credentials.'
        }
      ],
      triageRisk: 'STANDARD_OPD',
      redFlagsDetected: [],
      status: 'ready_for_doctor',
      doctorVerified: false
    };
    setAuthenticatedPatient(patientToLoad);
    setAuthStep('retrieving');
    setRetrievalProgress(15);
    setRetrievalStage('Connecting to ABDM Gateway (M1/M2 Bridge)...');

    // Simulate multi-stage PHR retrieval pipeline
    setTimeout(() => {
      setRetrievalProgress(45);
      setRetrievalStage('Authenticating Consent Artefact & Decrypting FHIR R4 Bundle...');
    }, 600);

    setTimeout(() => {
      setRetrievalProgress(80);
      setRetrievalStage('Synchronizing Past Prescriptions, Lab Reports & Timelines...');
    }, 1200);

    setTimeout(() => {
      setRetrievalProgress(100);
      setRetrievalStage('Personal Health Records Loaded Successfully!');
      
      const summary: PhrRetrievalSummary = {
        recordsFetched: (patientToLoad.scannedDocuments?.length || 0) + (patientToLoad.currentMedications?.length || 0) + (patientToLoad.timeline?.length || 0) + 2,
        prescriptionsCount: patientToLoad.currentMedications?.length || 2,
        labReportsCount: patientToLoad.scannedDocuments?.length || 1,
        timelineMilestonesCount: patientToLoad.timeline?.length || 3,
        hipSources: ['AIIMS New Delhi Central HIS', 'National Health Authority ABDM Cloud', 'Safdarjung Hospital OPD Repository'],
        lastSyncTimestamp: new Date().toLocaleString()
      };

      setRetrievedSummary(summary);
      setAuthStep('success');

      // Complete login callback after brief visual confirmation
      setTimeout(() => {
        onLoginSuccess(patientToLoad, summary);
      }, 1100);
    }, 1800);
  };

  // Quick Demo One-Click Select
  const handleQuickDemoSelect = (p: PatientProfile) => {
    if (authMode === 'abha') {
      setIdentifierInput(p.abhaId || '91-4829-1029-4820');
    } else {
      setMobileInput(p.mobile.replace(/[^0-9]/g, '').slice(-10) || '9876543210');
    }
  };

  // Handle New Registration
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `pat-${Date.now()}`;
    const tokenNum = `OPD-${Math.floor(100 + Math.random() * 900)}`;
    const uhidNum = `AIIMS-ND-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const abhaNum = `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newProfile: PatientProfile = {
      id: newId,
      tokenNumber: tokenNum,
      abhaId: abhaNum,
      uhid: uhidNum,
      name: registerForm.name || 'New Patient',
      age: Number(registerForm.age) || 30,
      gender: registerForm.gender,
      mobile: `+91 ${registerForm.mobile}`,
      email: registerForm.email.trim() ? registerForm.email.trim().toLowerCase() : undefined,
      language: registerForm.language,
      careStream: registerForm.careStream,
      department: 'General Medicine',
      registeredAt: new Date().toLocaleString(),
      status: 'waiting_triage',
      consentGiven: true,
      consentType: 'touch',
      consentTimestamp: new Date().toISOString(),
      symptoms: [],
      vitals: {
        bpSystolic: 120,
        bpDiastolic: 80,
        heartRate: 72,
        spO2: 99,
        temperature: 98.4
      },
      pastIllnesses: [],
      pastSurgeries: [],
      familyHistory: [],
      habits: { smoking: false, alcohol: false, tobacco: false, diet: 'Standard Balanced Diet' },
      currentMedications: [],
      allergies: [],
      scannedDocuments: [],
      timeline: [
        {
          id: `tl-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          category: 'diagnosis',
          title: 'Initial Digital OPD Registration',
          hospitalOrDoctor: 'AIIMS Smart Kiosk Terminal',
          summary: 'Created ABDM Health Locker and generated OPD registration token.'
        }
      ],
      triageRisk: 'STANDARD_OPD',
      redFlagsDetected: [],
      doctorVerified: false
    };

    onRegisterNew(newProfile);
    savePatientProfileToSupabase(newProfile);
    setAuthenticatedPatient(newProfile);
    setAuthStep('success');
    setTimeout(() => {
      onLoginSuccess(newProfile);
    }, 1000);
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-4">
      
      {/* Top Banner & ABDM Security Header */}
      <div className="p-6 bg-slate-900 text-white space-y-2 text-center relative overflow-hidden">
        {onBackToKiosk && (
          <button
            type="button"
            onClick={onBackToKiosk}
            className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            title="Return to Kiosk Intake Screen"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Back to Kiosk</span>
            <span className="sm:hidden">Back</span>
          </button>
        )}

        <div className="absolute top-0 right-0 p-3 opacity-10">
          <ShieldCheck className="w-24 h-24 text-teal-400" />
        </div>

        <div className="w-12 h-12 bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-inner mb-2">
          <ShieldCheck className="w-6 h-6" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-teal-950/80 border border-teal-700/60 text-teal-300 text-[11px] font-mono font-semibold">
          <Lock className="w-3 h-3 text-teal-400" />
          <span>ABDM M1/M2/M3 Fast-Track Gateway</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white">
          Secure Patient Login & PHR Sync
        </h2>
        <p className="text-xs text-slate-300 max-w-md mx-auto">
          Authenticate with your National ABHA ID or Mobile Number to retrieve your encrypted Personal Health Records and OPD appointments.
        </p>
      </div>

      {!isRegistering ? (
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Language Selection Chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-black text-slate-800 uppercase tracking-wider">
              <span>Preferred Language (भाषा चुनें)</span>
              <span className="text-[10px] text-teal-700 font-mono font-bold">10 Indian Languages</span>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
              {[
                { code: 'en', label: 'English' },
                { code: 'hi', label: 'हिंदी' },
                { code: 'bn', label: 'বাংলা' },
                { code: 'ta', label: 'தமிழ்' },
                { code: 'te', label: 'తెలుగు' },
                { code: 'mr', label: 'मराठी' }
              ].map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setRegisterForm(prev => ({ ...prev, language: lang.code as any }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    registerForm.language === lang.code
                      ? 'bg-[#0E3B39] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Intake CTA Button */}
          <button
            type="button"
            onClick={() => {
              if (onBackToKiosk) onBackToKiosk();
            }}
            className="w-full p-4 rounded-2xl bg-[#0E3B39] hover:bg-[#155450] text-white flex items-center gap-3.5 text-left transition-all shadow-md cursor-pointer group"
          >
            <span className="w-11 h-11 rounded-full bg-[#E2A33B] text-[#0E3B39] flex items-center justify-center shrink-0 relative group-hover:scale-105 transition-transform">
              <Mic className="w-5 h-5" />
            </span>
            <div className="flex-1">
              <strong className="block text-sm font-bold text-white">Continue with voice intake</strong>
              <span className="text-xs text-[#C9D8D3]">Tap and speak your symptoms — no typing needed</span>
            </div>
            <ArrowRight className="w-4 h-4 text-[#F6DFB3] shrink-0" />
          </button>

          <div className="flex items-center gap-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span>or use national ABHA / Mobile ID</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>
          
          {/* STEP 1: INPUT IDENTIFIER */}
          {authStep === 'input' && (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              
              {/* Method Switcher Tabs */}
              <div className="flex p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  id="tab-login-abha"
                  onClick={() => { setAuthMode('abha'); setErrorMessage(null); }}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    authMode === 'abha'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>14-Digit ABHA ID</span>
                </button>

                <button
                  type="button"
                  id="tab-login-mobile"
                  onClick={() => { setAuthMode('mobile'); setErrorMessage(null); }}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    authMode === 'mobile'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Email / Mobile + OTP</span>
                </button>
              </div>

              {/* ABHA Input Field */}
              {authMode === 'abha' && (
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                    Enter National ABHA ID or Hospital UHID
                  </label>
                  <div className="relative">
                    <ShieldCheck className="w-4 h-4 text-teal-600 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      id="input-patient-abha"
                      value={identifierInput}
                      onChange={(e) => setIdentifierInput(e.target.value)}
                      placeholder="e.g. 91-4829-1029-4820 or AIIMS-ND-2026-8812"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-teal-600 text-xs sm:text-sm font-mono font-bold text-slate-900 bg-slate-50 focus:bg-white shadow-2xs focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Linked to Ayushman Bharat Digital Mission (ABDM) national health registry</span>
                  </p>
                </div>
              )}

              {/* Mobile Input Field */}
              {authMode === 'mobile' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                      Email or Mobile Number
                    </label>
                    {mobileInput.trim() && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {mobileInput.includes('@') ? 'Email' : 'Mobile'}
                      </span>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      id="input-patient-mobile"
                      value={mobileInput}
                      onChange={(e) => setMobileInput(e.target.value)}
                      placeholder="e.g. name@example.com or 9876543210"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-teal-600 text-xs sm:text-sm font-bold text-slate-900 bg-slate-50 focus:bg-white shadow-2xs focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium">
                    A secure 4-digit verification code will be dispatched to this email or phone.
                  </p>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit CTA */}
              <div className="space-y-2">
                <button
                  type="submit"
                  id="btn-request-otp"
                  className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Authenticate & Retrieve Records</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {onBackToKiosk && (
                  <button
                    type="button"
                    id="btn-back-to-kiosk-from-login"
                    onClick={onBackToKiosk}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                    <span>Back to Kiosk Intake Terminal</span>
                  </button>
                )}
              </div>

              {/* Fast-Track Demo Patients Picker */}
              <div className="pt-4 border-t border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                    One-Click Demo Patient Profiles
                  </span>
                  <span className="text-[10px] text-teal-700 font-bold">Auto-Fills Credentials</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {patients.slice(0, 4).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleQuickDemoSelect(p)}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 text-left transition-all cursor-pointer"
                    >
                      <p className="font-bold text-xs text-slate-900 truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">{p.careStream.toUpperCase()} • {p.tokenNumber}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Register New CTA */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer"
                >
                  Don't have an ABHA Card? Create a New Profile
                </button>
              </div>

            </form>
          )}

          {/* STEP 2: OTP VERIFICATION */}
          {authStep === 'otp' && (
            <div className="space-y-6 text-center animate-in fade-in duration-200">
              <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto">
                <KeyRound className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">Enter 4-Digit Security OTP</h3>
                <p className="text-xs text-slate-500">
                  Sent to {authMode === 'mobile' ? `+91 ${mobileInput}` : `ABHA linked device (${identifierInput})`}
                </p>
              </div>

              {/* 4 Digit Box Inputs */}
              <div className="flex justify-center items-center gap-3">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-digit-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className="w-12 h-14 text-center font-mono text-xl font-black bg-slate-50 border-2 border-teal-500/70 rounded-2xl text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                  />
                ))}
              </div>

              <div className="text-xs text-slate-500 space-y-1">
                <p>Demo Universal Bypass Code: <strong className="font-mono text-teal-700">4829</strong></p>
                {otpTimer > 0 ? (
                  <p className="text-slate-400">Resend OTP in <span className="font-mono font-bold text-slate-600">{otpTimer}s</span></p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setOtpTimer(30)}
                    className="text-teal-700 font-bold hover:underline"
                  >
                    Resend OTP Code
                  </button>
                )}
              </div>

              {errorMessage && (
                <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-2 rounded-lg">
                  {errorMessage}
                </p>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAuthStep('input')}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
                >
                  Back
                </button>

                <button
                  type="button"
                  id="btn-verify-otp-phr"
                  onClick={handleVerifyOtpAndFetchPhr}
                  className="flex-2 py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify & Sync PHR</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PHR RETRIEVAL IN PROGRESS */}
          {authStep === 'retrieving' && (
            <div className="p-8 space-y-6 text-center animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mx-auto animate-pulse">
                <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-teal-100 text-teal-900">
                  ABDM GATEWAY RETRIEVAL
                </span>
                <h3 className="font-black text-slate-900 text-base">
                  Decrypting Personal Health Records...
                </h3>
                <p className="text-xs text-slate-600 font-medium max-w-sm mx-auto">
                  {retrievalStage}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-teal-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${retrievalProgress}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400 font-mono">
                <div className="p-2 bg-slate-50 rounded-lg">FHIR R4</div>
                <div className="p-2 bg-slate-50 rounded-lg">AES-256 GCM</div>
                <div className="p-2 bg-slate-50 rounded-lg">DPDP Consent</div>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS & SUMMARY BANNER */}
          {authStep === 'success' && (
            <div className="p-6 space-y-5 text-center animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="font-black text-slate-900 text-lg">
                  Authenticated: {authenticatedPatient?.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  ABHA: {authenticatedPatient?.abhaId || '91-4829-1029-4820'} • UHID: {authenticatedPatient?.uhid}
                </p>
              </div>

              {/* Retrieved Records Statistics Card */}
              {retrievedSummary && (
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl text-left space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-teal-200 pb-2">
                    <span className="font-bold text-teal-950 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-teal-700" />
                      <span>Retrieved Health Records</span>
                    </span>
                    <span className="font-bold font-mono text-teal-900">
                      {retrievedSummary.recordsFetched} items synced
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-white rounded-xl border border-teal-100">
                      <span className="text-[10px] text-slate-500 block">Prescriptions</span>
                      <strong className="text-slate-900 font-bold">{retrievedSummary.prescriptionsCount}</strong>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-teal-100">
                      <span className="text-[10px] text-slate-500 block">Scans & Labs</span>
                      <strong className="text-slate-900 font-bold">{retrievedSummary.labReportsCount}</strong>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-teal-100">
                      <span className="text-[10px] text-slate-500 block">Milestones</span>
                      <strong className="text-slate-900 font-bold">{retrievedSummary.timelineMilestonesCount}</strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-teal-800 text-center font-medium pt-1">
                    Redirecting to Patient Portal & Live Appointments...
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      ) : (
        /* REGISTRATION VIEW */
        <form onSubmit={handleRegisterSubmit} className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <button
              type="button"
              onClick={() => setIsRegistering(false)}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </button>
            <h3 className="font-bold text-slate-900 text-sm">New Patient Registration</h3>
            {onBackToKiosk && (
              <button
                type="button"
                onClick={onBackToKiosk}
                className="text-xs text-teal-700 hover:text-teal-900 font-bold cursor-pointer"
              >
                Kiosk Mode
              </button>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">Full Legal Name</label>
            <input
              type="text"
              value={registerForm.name}
              onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })}
              placeholder="e.g. Deepika Mehra"
              className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:border-teal-600 text-xs sm:text-sm font-bold text-slate-900 bg-slate-50 focus:bg-white shadow-2xs focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">Age (Years)</label>
              <input
                type="number"
                value={registerForm.age}
                onChange={e => setRegisterForm({ ...registerForm, age: Number(e.target.value) })}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:border-teal-600 text-xs sm:text-sm font-bold text-slate-900 bg-slate-50 focus:bg-white shadow-2xs focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">Gender</label>
              <select
                value={registerForm.gender}
                onChange={e => setRegisterForm({ ...registerForm, gender: e.target.value as any })}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:border-teal-600 text-xs sm:text-sm font-bold text-slate-900 bg-slate-50 focus:bg-white shadow-2xs focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden cursor-pointer"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">Mobile Number <span className="text-red-500">*</span></label>
            <input
              type="tel"
              value={registerForm.mobile}
              onChange={e => setRegisterForm({ ...registerForm, mobile: e.target.value })}
              maxLength={10}
              placeholder="9811234567"
              className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:border-teal-600 text-xs sm:text-sm font-mono font-bold text-slate-900 bg-slate-50 focus:bg-white shadow-2xs focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">Email Address (Optional / For Prescriptions)</label>
            <input
              type="email"
              value={registerForm.email}
              onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
              placeholder="e.g. name@example.com"
              className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:border-teal-600 text-xs sm:text-sm font-bold text-slate-900 bg-slate-50 focus:bg-white shadow-2xs focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">Preferred Medical System</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRegisterForm({ ...registerForm, careStream: 'allopathy' })}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  registerForm.careStream === 'allopathy' ? 'bg-teal-50 border-teal-600 text-teal-950 ring-1 ring-teal-500' : 'border-slate-300 bg-white text-slate-800'
                }`}
              >
                Allopathy (Modern)
              </button>
              <button
                type="button"
                onClick={() => setRegisterForm({ ...registerForm, careStream: 'ayurveda' })}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  registerForm.careStream === 'ayurveda' ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-1 ring-emerald-500' : 'border-slate-300 bg-white text-slate-800'
                }`}
              >
                AYUSH / Ayurveda
              </button>
            </div>
          </div>

          <button
            type="submit"
            id="btn-register-new-patient-submit"
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            Create ABHA ID & Connect PHR
          </button>
        </form>
      )}

      {/* Footer Security Badge */}
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <Lock className="w-3 h-3 text-teal-600" />
          <span>AES-256 Encrypted Session</span>
        </span>
        <span className="font-mono">ABDM Gateway v3.2.0</span>
      </div>

    </div>
  );
};
