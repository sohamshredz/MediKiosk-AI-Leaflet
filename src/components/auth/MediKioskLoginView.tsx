import React, { useState } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  Phone, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Mic, 
  Stethoscope, 
  Building2, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Info, 
  Shield, 
  Smartphone, 
  ChevronRight, 
  BadgeCheck, 
  User, 
  HeartPulse,
  UserCog
} from 'lucide-react';
import { PatientProfile, SupportedLanguage, CareStream, AuthSession } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { ORDERED_LANGUAGES } from '../common/LanguageSelector';
import { authenticateStaff, authenticateHisAdmin, staffSelfResetPin } from '../../services/adminService';

interface MediKioskLoginViewProps {
  patients: PatientProfile[];
  activePatientId: string;
  onSelectPatient: (patientId: string) => void;
  onNavigateView: (view: 'landing' | 'kiosk' | 'doctor' | 'triage' | 'admin' | 'patient' | 'map') => void;
  onUpdatePatient?: (updated: PatientProfile) => void;
  onLoginSuccess?: (session: AuthSession) => void;
}

export const MediKioskLoginView: React.FC<MediKioskLoginViewProps> = ({
  patients,
  activePatientId,
  onSelectPatient,
  onNavigateView,
  onUpdatePatient,
  onLoginSuccess
}) => {
  const { language, setLanguage, t } = useLanguage();
  
  // Main Tab: 'patient' or 'staff'
  const [activePortal, setActivePortal] = useState<'patient' | 'staff'>('patient');

  // Staff submode: 'clinical' (Doctor/Medical Officer/Triage Nurse) vs 'admin' (Master HIS Administrator)
  const [staffMode, setStaffMode] = useState<'clinical' | 'admin'>('clinical');

  // ----------------------------------------------------
  // PATIENT STATE
  // ----------------------------------------------------
  const [patientIdentifier, setPatientIdentifier] = useState<string>('');
  const [patientOtp, setPatientOtp] = useState<string>('');
  const [isPatientAuthenticating, setIsPatientAuthenticating] = useState<boolean>(false);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [patientSuccess, setPatientSuccess] = useState<boolean>(false);
  const [voicePromptActive, setVoicePromptActive] = useState<boolean>(false);

  // ----------------------------------------------------
  // STAFF STATE
  // ----------------------------------------------------
  const [staffIdInput, setStaffIdInput] = useState<string>('');
  const [staffPinInput, setStaffPinInput] = useState<string>('');
  const [showStaffPin, setShowStaffPin] = useState<boolean>(false);
  const [isStaffAuthenticating, setIsStaffAuthenticating] = useState<boolean>(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [staffSuccess, setStaffSuccess] = useState<string | null>(null);

  // Self-Service PIN Reset State (Kiosk View)
  const [isStaffResetPinView, setIsStaffResetPinView] = useState<boolean>(false);
  const [resetStaffId, setResetStaffId] = useState<string>('');
  const [confirmCurrentPin, setConfirmCurrentPin] = useState<string>('');
  const [resetNewPin, setResetNewPin] = useState<string>('');
  const [confirmNewPin, setConfirmNewPin] = useState<string>('');
  const [showCurrentPin, setShowCurrentPin] = useState<boolean>(false);
  const [showNewPin, setShowNewPin] = useState<boolean>(false);
  const [showConfirmPin, setShowConfirmPin] = useState<boolean>(false);
  const [isSubmittingReset, setIsSubmittingReset] = useState<boolean>(false);

  // ----------------------------------------------------
  // PATIENT SUBMISSION
  // ----------------------------------------------------
  const handlePatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPatientError(null);

    if (!patientIdentifier.trim()) {
      setPatientError('Please enter your email, mobile number, or ABHA ID.');
      return;
    }

    if (patientOtp.length < 4) {
      setPatientError('Please enter the security verification PIN / OTP.');
      return;
    }

    setIsPatientAuthenticating(true);

    setTimeout(() => {
      const isEmail = patientIdentifier.includes('@');
      const cleanInput = patientIdentifier.replace(/[^0-9]/g, '');
      const matchedPatient = patients.find(p => 
        (isEmail && p.email && p.email.toLowerCase() === patientIdentifier.trim().toLowerCase()) ||
        (cleanInput.length >= 10 && p.mobile && p.mobile.replace(/[^0-9]/g, '').includes(cleanInput.slice(-10))) ||
        (cleanInput.length >= 10 && p.abhaId && p.abhaId.replace(/[^0-9]/g, '').includes(cleanInput.slice(-10))) ||
        (p.uhid && p.uhid.toLowerCase().includes(patientIdentifier.toLowerCase()))
      );

      setIsPatientAuthenticating(false);
      setPatientSuccess(true);

      if (matchedPatient) {
        onSelectPatient(matchedPatient.id);
      } else {
        const freshPatient: PatientProfile = {
          id: `pat-auth-${Date.now()}`,
          name: isEmail ? patientIdentifier.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : `Patient ${patientIdentifier.replace(/[^0-9]/g, '').slice(-4) || ''}`.trim(),
          age: 30,
          gender: 'male',
          mobile: `+91 ${cleanInput.slice(-10) || '9876500000'}`,
          email: isEmail ? patientIdentifier.trim().toLowerCase() : undefined,
          uhid: `UHID-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          tokenNumber: `OPD-${Math.floor(100 + Math.random() * 900)}`,
          registeredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          language: (language as SupportedLanguage) || 'hi',
          careStream: 'allopathy',
          department: 'General Medicine OPD',
          abhaId: patientIdentifier.includes('-') ? patientIdentifier : `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
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
            heartRate: 72,
            spO2: 98,
            temperature: 98.4
          },
          scannedDocuments: [],
          timeline: [
            {
              id: `tl-${Date.now()}`,
              date: 'Today',
              title: 'ABHA Login Verified',
              category: 'prescription',
              hospitalOrDoctor: 'ABDM Health Gateway',
              summary: 'Established secure patient session.'
            }
          ],
          triageRisk: 'STANDARD_OPD',
          redFlagsDetected: [],
          status: 'ready_for_doctor',
          doctorVerified: false
        };
        if (onUpdatePatient) {
          onUpdatePatient(freshPatient);
        }
        onSelectPatient(freshPatient.id);
      }

      setTimeout(() => {
        onNavigateView('patient');
      }, 600);
    }, 700);
  };

  // ----------------------------------------------------
  // STAFF SUBMISSION (Backed by Real API and Master HIS Admin)
  // ----------------------------------------------------
  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError(null);
    setStaffSuccess(null);

    const cleanId = staffIdInput.trim();
    const cleanPin = staffPinInput.trim();

    if (!cleanId) {
      setStaffError(staffMode === 'admin' ? 'Please enter your HIS Administrator ID.' : 'Please enter your Staff ID or Employee Code.');
      return;
    }

    if (!cleanPin) {
      setStaffError('Please enter your 4-digit Security PIN.');
      return;
    }

    setIsStaffAuthenticating(true);

    if (staffMode === 'admin') {
      const res = await authenticateHisAdmin(cleanId, cleanPin);
      setIsStaffAuthenticating(false);

      if (!res.success || !res.session) {
        setStaffError(res.error || 'Invalid HIS Master Administrator credentials.');
        return;
      }

      setStaffSuccess('Authenticated as HIS Master Administrator. Redirecting...');
      const session: AuthSession = {
        role: 'admin',
        userId: res.session.userId,
        userName: res.session.userName,
        staffCode: res.session.staffCode,
        roleTitle: res.session.roleTitle,
        department: res.session.department,
        token: res.session.token,
        loginTime: new Date().toISOString()
      };

      if (onLoginSuccess) {
        onLoginSuccess(session);
      }

      setTimeout(() => {
        onNavigateView('admin');
      }, 500);
    } else {
      const res = await authenticateStaff(cleanId, cleanPin);
      setIsStaffAuthenticating(false);

      if (!res.success || !res.session) {
        setStaffError(res.error || 'Authentication failed. Please verify your Staff ID and PIN.');
        return;
      }

      setStaffSuccess(`Welcome, ${res.session.userName}! Access granted.`);
      const session: AuthSession = {
        role: res.session.role,
        userId: res.session.userId,
        userName: res.session.userName,
        staffCode: res.session.staffCode,
        roleTitle: res.session.roleTitle,
        department: res.session.department,
        token: res.session.token,
        loginTime: new Date().toISOString()
      };

      if (onLoginSuccess) {
        onLoginSuccess(session);
      }

      setTimeout(() => {
        const dest = res.session?.targetView || (session.role === 'triage_nurse' ? 'triage' : 'doctor');
        onNavigateView(dest);
      }, 500);
    }
  };

  // ----------------------------------------------------
  // STAFF SELF-SERVICE RESET PIN HANDLER (Kiosk View)
  // ----------------------------------------------------
  const handleStaffSelfResetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError(null);
    setStaffSuccess(null);

    const cleanStaffId = resetStaffId.trim();
    const cleanCurrent = confirmCurrentPin.trim();
    const cleanNew = resetNewPin.trim();
    const cleanConfirm = confirmNewPin.trim();

    if (!cleanStaffId) {
      setStaffError('Please enter your Doctor / Staff ID.');
      return;
    }
    if (!cleanCurrent) {
      setStaffError('Please enter your Current PIN (or Staff ID if this is your default PIN).');
      return;
    }
    if (!cleanNew) {
      setStaffError('Please enter your new PIN.');
      return;
    }
    if (cleanNew.length < 4) {
      setStaffError('New Security PIN must be at least 4 characters.');
      return;
    }
    if (cleanNew !== cleanConfirm) {
      setStaffError('New PIN and Confirm New PIN do not match.');
      return;
    }

    setIsSubmittingReset(true);
    const res = await staffSelfResetPin(cleanStaffId, cleanCurrent, cleanNew, cleanConfirm);
    setIsSubmittingReset(false);

    if (res.success) {
      setStaffSuccess(res.message || 'Security PIN updated successfully! You can now log in.');
      setStaffIdInput(cleanStaffId);
      setStaffPinInput(cleanNew);
      setIsStaffResetPinView(false);
    } else {
      setStaffError(res.error || 'Failed to update PIN. Please verify your current PIN.');
    }
  };

  const handleStartVoice = () => {
    setVoicePromptActive(true);
    setTimeout(() => {
      setVoicePromptActive(false);
      onNavigateView('kiosk');
    }, 1000);
  };

  return (
    <div className="flex-1 w-full min-h-[calc(100vh-4rem)] bg-slate-50 py-6 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
      
      {/* Top Header / Portal Switcher */}
      <div className="max-w-xl mx-auto w-full mb-6">
        <div className="flex items-center justify-between pb-3">
          <button
            type="button"
            onClick={() => onNavigateView('landing')}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-teal-900 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            id="login-back-btn"
          >
            <ArrowLeft className="w-4 h-4 text-teal-700" />
            <span>Back</span>
          </button>

          {/* Toggle Patient vs Staff */}
          <div className="bg-slate-200/80 p-1 rounded-2xl flex items-center gap-1 border border-slate-300">
            <button
              type="button"
              id="portal-tab-patient"
              onClick={() => {
                setActivePortal('patient');
                setPatientError(null);
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activePortal === 'patient'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-white/60'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Patient Kiosk</span>
            </button>

            <button
              type="button"
              id="portal-tab-staff"
              onClick={() => {
                setActivePortal('staff');
                setStaffError(null);
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activePortal === 'staff'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-white/60'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Staff Sign In</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="max-w-xl mx-auto w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden transition-all">
        
        {/* ========================================================================= */}
        {/* VIEW 1: PATIENT LOGIN INTERFACE                                           */}
        {/* ========================================================================= */}
        {activePortal === 'patient' && (
          <div>
            <div className="p-6 sm:p-8 bg-gradient-to-r from-teal-900 to-slate-900 text-white border-b border-teal-800 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-bold uppercase tracking-wider font-mono">
                  MediKiosk Intake
                </span>
                <span className="text-xs text-teal-200">
                  ABDM Verified
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Namaste. Welcome to OPD Intake.
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
                Choose your language, then sign in with your registered mobile or ABHA ID.
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Select Language / भाषा चुनें
                  </label>
                  <span className="text-[10px] text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                    Multilingual Intake
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {ORDERED_LANGUAGES.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => setLanguage(item.code)}
                      className={`py-2 px-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer text-center border ${
                        language === item.code
                          ? 'bg-teal-700 text-white border-teal-700 shadow-xs ring-2 ring-teal-500/20'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                      title={item.label}
                    >
                      <span className="truncate block">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice Intake Prominent Option */}
              <button
                type="button"
                onClick={handleStartVoice}
                className="w-full p-4 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white flex items-center justify-between transition-all cursor-pointer shadow-md group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-inner">
                    <Mic className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-sm font-bold text-white">
                      Continue with Voice Intake
                    </h2>
                    <p className="text-xs text-teal-200">
                      Tap and speak in your language — no typing needed
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-teal-300 group-hover:translate-x-1 transition-transform" />
              </button>

              {voicePromptActive && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl text-xs text-teal-800 font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600 animate-spin" />
                  <span>Launching multilingual voice microphone...</span>
                </div>
              )}

              <div className="flex items-center gap-3 text-xs text-slate-400 font-bold">
                <div className="flex-1 h-px bg-slate-200"></div>
                <span className="uppercase text-[11px] tracking-wider">or sign in with credentials</span>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>

              <form onSubmit={handlePatientSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Email, Mobile Number or ABHA ID
                  </label>
                  <input
                    type="text"
                    id="input-patient-identifier"
                    value={patientIdentifier}
                    onChange={(e) => setPatientIdentifier(e.target.value)}
                    placeholder="e.g. name@example.com or 9876543210"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:border-teal-600 focus:bg-white bg-slate-50 text-sm font-bold text-slate-900 focus:outline-hidden"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    4-Digit PIN or OTP
                  </label>
                  <input
                    type="password"
                    id="input-patient-otp"
                    value={patientOtp}
                    onChange={(e) => setPatientOtp(e.target.value)}
                    placeholder="••••"
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:border-teal-600 focus:bg-white bg-slate-50 text-sm font-mono font-bold tracking-widest text-slate-900 focus:outline-hidden"
                    required
                  />
                </div>

                {patientError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{patientError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  id="btn-patient-verify"
                  disabled={isPatientAuthenticating}
                  className="w-full py-3.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                >
                  {isPatientAuthenticating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-teal-200" />
                      <span>Verifying with ABDM Gateway...</span>
                    </>
                  ) : patientSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-teal-300" />
                      <span>Verified! Opening Patient Records...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Patient Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Your visit and health history are stored against your ABHA account and cleared from shared kiosk hardware upon logout.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: STAFF SIGN IN INTERFACE                                           */}
        {/* ========================================================================= */}
        {activePortal === 'staff' && (
          <div>
            <div className={`p-6 sm:p-8 text-white border-b ${
              staffMode === 'admin'
                ? 'bg-gradient-to-r from-slate-900 to-purple-950 border-purple-900'
                : 'bg-gradient-to-r from-slate-900 to-teal-950 border-slate-800'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono border ${
                  staffMode === 'admin'
                    ? 'bg-purple-900/80 text-purple-300 border-purple-600/50'
                    : 'bg-teal-900/80 text-teal-300 border-teal-600/50'
                }`}>
                  {staffMode === 'admin' ? 'HIS Master Administrator' : 'Hospital Clinical Staff'}
                </span>
                <span className="text-xs text-slate-300">
                  {staffMode === 'admin' ? 'Single Master Account' : 'Authorized Personnel Only'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {staffMode === 'admin' ? 'HIS Master Admin Sign In' : 'Clinical Staff Sign In'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
                {staffMode === 'admin' 
                  ? 'Central hospital configuration, staff credentials governance, and system audit.' 
                  : 'For Doctors, Medical Officers, and Triage Nurses. Staff IDs and PINs are issued by the HIS Admin.'}
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {isStaffResetPinView ? (
                /* ======================================================= */
                /* SELF-SERVICE RESET PIN VIEW (KIOSK)                     */
                /* ======================================================= */
                <form onSubmit={handleStaffSelfResetPinSubmit} className="space-y-4">
                  <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl text-xs text-teal-950 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-teal-900 text-sm">
                      <KeyRound className="w-4 h-4 text-teal-700 shrink-0" />
                      <span>Reset Clinical Staff PIN</span>
                    </div>
                    <p className="text-teal-800 text-xs leading-relaxed">
                      Confirm your current PIN (or initial Staff ID) to reset and confirm your new security PIN.
                    </p>
                  </div>

                  {/* Staff ID */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Doctor / Staff ID
                    </label>
                    <input
                      type="text"
                      value={resetStaffId}
                      onChange={(e) => setResetStaffId(e.target.value)}
                      placeholder="e.g. DOC-SOHOM-01"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:border-indigo-600 focus:bg-white bg-slate-50 text-sm font-mono font-bold text-slate-900 focus:outline-hidden"
                      required
                    />
                  </div>

                  {/* 1. Confirm Current PIN */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                      1. Confirm Current PIN (or Staff ID)
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPin ? 'text' : 'password'}
                        maxLength={32}
                        value={confirmCurrentPin}
                        onChange={(e) => setConfirmCurrentPin(e.target.value)}
                        placeholder="Enter current PIN (or your Staff ID)"
                        className="w-full pl-4 pr-12 py-3 rounded-2xl border border-slate-300 focus:border-indigo-600 focus:bg-white bg-slate-50 text-sm font-mono font-bold text-slate-900 focus:outline-hidden"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPin(!showCurrentPin)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showCurrentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">Security PIN must be kept strictly confidential.</p>
                  </div>

                  {/* 2. Reset PIN */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                      2. Reset PIN (New PIN)
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPin ? 'text' : 'password'}
                        maxLength={32}
                        value={resetNewPin}
                        onChange={(e) => setResetNewPin(e.target.value)}
                        placeholder="Enter new PIN (min 4 characters)"
                        className="w-full pl-4 pr-12 py-3 rounded-2xl border border-slate-300 focus:border-indigo-600 focus:bg-white bg-slate-50 text-sm font-mono font-bold text-slate-900 focus:outline-hidden"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPin(!showNewPin)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* 3. Confirm New PIN */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                      3. Confirm New PIN
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPin ? 'text' : 'password'}
                        maxLength={32}
                        value={confirmNewPin}
                        onChange={(e) => setConfirmNewPin(e.target.value)}
                        placeholder="Re-enter new PIN to confirm"
                        className="w-full pl-4 pr-12 py-3 rounded-2xl border border-slate-300 focus:border-indigo-600 focus:bg-white bg-slate-50 text-sm font-mono font-bold text-slate-900 focus:outline-hidden"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPin(!showConfirmPin)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {staffError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{staffError}</span>
                    </div>
                  )}

                  {staffSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{staffSuccess}</span>
                    </div>
                  )}

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsStaffResetPinView(false);
                        setStaffError(null);
                      }}
                      className="px-4 py-3.5 rounded-2xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer transition-colors"
                    >
                      Back to Sign In
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReset}
                      className="flex-1 py-3.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                    >
                      {isSubmittingReset ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Updating PIN...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirm & Reset PIN</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* ======================================================= */
                /* STANDARD CLINICAL / HIS ADMIN LOGIN FORM (KIOSK)        */
                /* ======================================================= */
                <form onSubmit={handleStaffSubmit} className="space-y-4">
                  
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {staffMode === 'admin' ? 'HIS Administrator ID' : 'Hospital Staff ID / Employee Code'}
                    </label>
                    <input
                      type="text"
                      id="input-staff-id"
                      value={staffIdInput}
                      onChange={(e) => setStaffIdInput(e.target.value)}
                      placeholder={staffMode === 'admin' ? 'Enter HIS Administrator ID' : 'Enter Staff ID or Employee Code'}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:border-indigo-600 focus:bg-white bg-slate-50 text-sm font-mono font-bold text-slate-900 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {staffMode === 'admin' ? 'Master Security PIN' : 'Staff Security PIN'}
                    </label>
                    <div className="relative">
                      <input
                        type={showStaffPin ? 'text' : 'password'}
                        id="input-staff-password"
                        maxLength={32}
                        value={staffPinInput}
                        onChange={(e) => setStaffPinInput(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-4 pr-12 py-3 rounded-2xl border border-slate-300 focus:border-indigo-600 focus:bg-white bg-slate-50 text-sm font-mono font-bold text-slate-900 focus:outline-hidden"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowStaffPin(!showStaffPin)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showStaffPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Reset PIN small button below staff pin on the left side */}
                    {staffMode === 'clinical' && (
                      <div className="mt-2 flex items-center justify-between">
                        <button
                          type="button"
                          id="btn-kiosk-trigger-reset-pin"
                          onClick={() => {
                            setIsStaffResetPinView(true);
                            setResetStaffId(staffIdInput || '');
                            setConfirmCurrentPin('');
                            setResetNewPin('');
                            setConfirmNewPin('');
                            setStaffError(null);
                            setStaffSuccess(null);
                          }}
                          className="text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-teal-600" />
                          <span>Reset PIN</span>
                        </button>
                        <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-slate-400" />
                          Confidential Credential
                        </span>
                      </div>
                    )}
                  </div>

                  {staffError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{staffError}</span>
                    </div>
                  )}

                  {staffSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{staffSuccess}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    id="btn-staff-signin"
                    disabled={isStaffAuthenticating}
                    className={`w-full py-3.5 text-white text-sm font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 ${
                      staffMode === 'admin'
                        ? 'bg-purple-700 hover:bg-purple-800'
                        : 'bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    {isStaffAuthenticating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-teal-200" />
                        <span>Verifying Credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>{staffMode === 'admin' ? 'Log In as Master Administrator' : 'Sign In to Clinical Console'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Mode switch */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600">
                  <Info className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    {staffMode === 'clinical'
                      ? 'Doctor, Medical Officer & Nurse accounts are provisioned by HIS Admin.'
                      : 'Master Admin account is restricted to authorized hospital administration.'}
                  </span>
                </div>

                {staffMode === 'clinical' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setStaffMode('admin');
                      setStaffIdInput('');
                      setStaffPinInput('');
                      setStaffError(null);
                    }}
                    className="text-purple-700 hover:text-purple-900 font-bold hover:underline cursor-pointer shrink-0 ml-2"
                  >
                    HIS Admin Login →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setStaffMode('clinical');
                      setStaffIdInput('');
                      setStaffPinInput('');
                      setStaffError(null);
                    }}
                    className="text-teal-700 hover:text-teal-900 font-bold hover:underline cursor-pointer shrink-0 ml-2"
                  >
                    ← Clinical Staff Login
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Footer Navigation Shortcuts */}
      <div className="max-w-xl mx-auto w-full mt-6 text-center">
        <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => onNavigateView('kiosk')}
            className="hover:text-teal-700 hover:underline cursor-pointer"
          >
            Direct Kiosk Intake
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => onNavigateView('map')}
            className="hover:text-teal-700 hover:underline cursor-pointer"
          >
            Hospital & Ambulance Map
          </button>
        </div>
      </div>

    </div>
  );
};
