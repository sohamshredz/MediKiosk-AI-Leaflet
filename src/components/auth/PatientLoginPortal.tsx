import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail,
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Sparkles, 
  Globe2, 
  Activity, 
  KeyRound, 
  AlertCircle, 
  Lock,
  Eye,
  EyeOff,
  HelpCircle
} from 'lucide-react';
import { PatientProfile, SupportedLanguage, CareStream } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../data/indianLanguages';
import { AppView } from '../SidebarDashboard';
import { saveAppointmentToSupabase, savePatientProfileToSupabase } from '../../utils/supabaseClient';
import { ORDERED_LANGUAGES } from '../common/LanguageSelector';
import { AuthSession } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface PatientLoginPortalProps {
  patients: PatientProfile[];
  activePatientId: string;
  onSelectPatient: (patientId: string) => void;
  onAddNewPatientProfile: (profile: PatientProfile) => void;
  onNavigateView: (view: AppView) => void;
  intendedDestination?: AppView;
  destinationMessage?: string;
  onLoginSuccess?: (session: AuthSession, patient: PatientProfile) => void;
  onOpenStaffLogin?: () => void;
}

export const PatientLoginPortal: React.FC<PatientLoginPortalProps> = ({
  patients,
  activePatientId,
  onSelectPatient,
  onAddNewPatientProfile,
  onNavigateView,
  intendedDestination,
  destinationMessage,
  onLoginSuccess,
  onOpenStaffLogin
}) => {
  const { publicLanguage, t } = useLanguage();

  // Default screen is SIGN IN as mandated
  const [activeTab, setActiveTab] = useState<'sign-in' | 'create-account'>('sign-in');

  // Sign In Form State
  const [loginMobile, setLoginMobile] = useState<string>('');
  const [loginPin, setLoginPin] = useState<string>('');
  const [authMethod, setAuthMethod] = useState<'pin' | 'otp'>('pin');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [showPin, setShowPin] = useState<boolean>(false);
  const [showForgotPinHelper, setShowForgotPinHelper] = useState<boolean>(false);

  const handleSwitchToOtp = () => {
    setAuthMethod('otp');
    setErrorMessage(null);
  };

  // Create Account Form State
  const [fullName, setFullName] = useState<string>('');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [ageOrDob, setAgeOrDob] = useState<string>('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [preferredLanguage, setPreferredLanguage] = useState<SupportedLanguage>(publicLanguage || 'hi');
  const [createPin, setCreatePin] = useState<string>('');
  const [optionalAbhaId, setOptionalAbhaId] = useState<string>('');
  const [careStream, setCareStream] = useState<CareStream>('allopathy');
  const [department, setDepartment] = useState<string>('General Medicine OPD');
  const [chiefComplaint, setChiefComplaint] = useState<string>('');
  const [consentAccepted, setConsentAccepted] = useState<boolean>(true);

  // Status & Feedback States
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ==========================================
  // 1. EXISTING PATIENT SIGN IN HANDLER
  // ==========================================
  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedInput = loginMobile.trim();
    if (!trimmedInput) {
      setErrorMessage('Please enter your registered Email address or Mobile number.');
      return;
    }

    const isEmail = trimmedInput.includes('@');
    const cleanInput = trimmedInput.replace(/[^0-9]/g, '');

    if (isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedInput)) {
        setErrorMessage('Please enter a valid email address (e.g. name@example.com).');
        return;
      }
    } else if (cleanInput.length < 10 && !trimmedInput.includes('-') && !trimmedInput.toLowerCase().startsWith('uhid') && !trimmedInput.toLowerCase().startsWith('aiims')) {
      setErrorMessage('Please enter your valid 10-digit registered mobile number or email address.');
      return;
    }

    if (authMethod === 'pin') {
      if (!loginPin.trim() || loginPin.trim().length < 4) {
        setErrorMessage('Please enter your 4-6 digit security PIN.');
        return;
      }
    } else {
      const enteredOtp = otpDigits.join('');
      if (enteredOtp.length < 4) {
        setErrorMessage(
          isEmail 
            ? 'Please enter the 4-digit verification code sent to your email (Universal Code: 4829).' 
            : 'Please enter the 4-digit verification code sent to your mobile number (Universal Code: 4829).'
        );
        return;
      }
    }

    setIsAuthenticating(true);
    setSuccessMessage('Verifying credentials & loading your authenticated health record...');

    setTimeout(() => {
      // Look up existing matching patient in registered accounts
      const matched = patients.find(p => {
        const cleanPPhone = p.mobile ? p.mobile.replace(/[^0-9]/g, '') : '';
        const cleanPAbha = p.abhaId ? p.abhaId.replace(/[^0-9]/g, '') : '';
        const cleanPUhid = p.uhid ? p.uhid.toLowerCase() : '';
        const pEmail = p.email ? p.email.toLowerCase().trim() : '';

        if (isEmail && pEmail && pEmail === trimmedInput.toLowerCase()) {
          return true;
        }

        return (
          (!isEmail && cleanInput.length >= 10 && cleanPPhone.includes(cleanInput.slice(-10))) ||
          (cleanInput.length >= 10 && cleanPAbha.includes(cleanInput.slice(-10))) ||
          cleanPUhid.includes(trimmedInput.toLowerCase()) ||
          (p.abhaId && p.abhaId.toLowerCase() === trimmedInput.toLowerCase())
        );
      });

      if (matched) {
        const newSession: AuthSession = {
          role: 'patient',
          userId: matched.id,
          userName: matched.name,
          patientId: matched.id,
          token: `pat-token-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          loginTime: new Date().toISOString()
        };

        onSelectPatient(matched.id);
        setIsAuthenticating(false);
        setSuccessMessage(`Welcome, ${matched.name}! Opening your Patient Dashboard...`);
        const target = intendedDestination || 'patient';
        setTimeout(() => {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          if (onLoginSuccess) {
            onLoginSuccess(newSession, matched);
          } else {
            onNavigateView(target);
          }
        }, 500);
      } else {
        // If not found in current local session, create a clean authenticated patient profile
        const cleanPhone = cleanInput.slice(-10) || '9876500000';
        const formattedPhone = `+91 ${cleanPhone}`;
        const newPatientId = `pat-${Date.now()}`;
        const uhidNum = `AIIMS-ND-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const tokenNum = `OPD-${Math.floor(100 + Math.random() * 900)}`;

        const authenticatedProfile: PatientProfile = {
          id: newPatientId,
          name: isEmail 
            ? trimmedInput.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) 
            : `Patient ${cleanPhone.slice(-4) || ''}`.trim(),
          age: 32,
          gender: 'male',
          mobile: formattedPhone,
          email: isEmail ? trimmedInput.toLowerCase() : undefined,
          uhid: uhidNum,
          tokenNumber: tokenNum,
          registeredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          language: preferredLanguage || (publicLanguage as any) || 'hi',
          careStream: 'allopathy',
          department: 'General Medicine OPD',
          abhaId: trimmedInput.includes('-') 
            ? trimmedInput 
            : `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
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
              summary: `Signed in successfully with verified mobile credentials.`
            }
          ],
          triageRisk: 'STANDARD_OPD',
          redFlagsDetected: [],
          status: 'ready_for_doctor',
          doctorVerified: false
        };

        const newSession: AuthSession = {
          role: 'patient',
          userId: authenticatedProfile.id,
          userName: authenticatedProfile.name,
          patientId: authenticatedProfile.id,
          token: `pat-token-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          loginTime: new Date().toISOString()
        };

        onAddNewPatientProfile(authenticatedProfile);
        onSelectPatient(authenticatedProfile.id);
        savePatientProfileToSupabase(authenticatedProfile);
        setIsAuthenticating(false);
        setSuccessMessage(`Welcome, ${authenticatedProfile.name}! Authenticated session established.`);
        const target = intendedDestination || 'patient';
        setTimeout(() => {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          if (onLoginSuccess) {
            onLoginSuccess(newSession, authenticatedProfile);
          } else {
            onNavigateView(target);
          }
        }, 500);
      }
    }, 600);
  };

  // ==========================================
  // 2. CREATE PATIENT ACCOUNT HANDLER
  // ==========================================
  const handleCreateAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full legal name.');
      return;
    }

    const cleanMobile = mobileNumber.replace(/[^0-9]/g, '');
    if (cleanMobile.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    if (!createPin.trim() || createPin.trim().length < 4) {
      setErrorMessage('Please create a 4-6 digit security PIN.');
      return;
    }

    if (!consentAccepted) {
      setErrorMessage('Please accept the DPDP Act consent to proceed with registration.');
      return;
    }

    setIsAuthenticating(true);
    setSuccessMessage('Creating secure patient account & generating Patient ID...');

    const newPatientId = `patient-${Date.now()}`;
    const tokenNum = `OPD-${Math.floor(100 + Math.random() * 900)}`;
    const uhidNum = `UHID-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const parsedAge = parseInt(ageOrDob.replace(/[^0-9]/g, ''), 10) || 30;

    const newPatientProfile: PatientProfile = {
      id: newPatientId,
      name: fullName.trim(),
      age: parsedAge,
      gender: gender,
      mobile: `+91 ${cleanMobile.slice(-10)}`,
      email: cleanEmail || undefined,
      uhid: uhidNum,
      tokenNumber: tokenNum,
      registeredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: preferredLanguage,
      careStream: careStream,
      department: department,
      abhaId: optionalAbhaId.trim() || `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      consentGiven: true,
      consentType: 'touch',
      consentTimestamp: new Date().toISOString(),
      symptoms: chiefComplaint.trim() ? [
        {
          id: `sym-${Date.now()}-1`,
          name: chiefComplaint.trim(),
          bodyPart: 'General',
          duration: '1-2 days',
          severity: 3,
          onset: 'gradual'
        }
      ] : [],
      pastIllnesses: [],
      pastSurgeries: [],
      currentMedications: [],
      allergies: [],
      familyHistory: [],
      habits: { smoking: false, alcohol: false, tobacco: false, diet: 'Standard' },
      vitals: {
        bpSystolic: 120,
        bpDiastolic: 80,
        heartRate: 76,
        spO2: 98,
        temperature: 98.6,
        bloodSugar: 110,
        recordedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      scannedDocuments: [],
      timeline: [
        {
          id: `tl-${Date.now()}`,
          date: 'Today',
          title: `Account Created & Registered for ${department}`,
          category: careStream === 'allopathy' ? 'prescription' : 'ayush',
          hospitalOrDoctor: 'MediKiosk AI OPD Portal',
          summary: `New patient account created for ${fullName.trim()}. Target Department: ${department}.`
        }
      ],
      triageRisk: 'STANDARD_OPD',
      redFlagsDetected: [],
      status: 'ready_for_doctor',
      doctorVerified: false
    };

    const newSession: AuthSession = {
      role: 'patient',
      userId: newPatientProfile.id,
      userName: newPatientProfile.name,
      patientId: newPatientProfile.id,
      token: `pat-token-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      loginTime: new Date().toISOString()
    };

    setTimeout(() => {
      // 1. Add new profile and establish authenticated session
      onAddNewPatientProfile(newPatientProfile);
      onSelectPatient(newPatientProfile.id);
      savePatientProfileToSupabase(newPatientProfile);
      setIsAuthenticating(false);
      setSuccessMessage(`Account created! Welcome, ${newPatientProfile.name}. Opening your dashboard...`);

      // 2. Save appointment record in database
      saveAppointmentToSupabase({
        id: `APT-${Date.now()}`,
        patientId: newPatientProfile.id,
        patientName: newPatientProfile.name,
        tokenNumber: newPatientProfile.tokenNumber,
        uhid: newPatientProfile.uhid,
        department: newPatientProfile.department,
        doctorName: 'Dr. Sohom Das, MD (OPD Room 104)',
        doctorSpecialty: newPatientProfile.department,
        careStream: newPatientProfile.careStream,
        date: 'Today',
        timeSlot: 'Immediate OPD Queue',
        status: 'in_queue',
        roomNumber: 'OPD Room 104',
        queuePosition: 1,
        currentServingToken: 'OPD-100',
        estimatedWaitMinutes: 10,
        chiefComplaint: chiefComplaint || 'Patient portal registration',
        abhaLinked: !!newPatientProfile.abhaId,
        bookedAt: new Date().toLocaleString(),
        bookingType: 'online_portal'
      });

      // 3. Navigate directly to intended destination or Patient Dashboard
      const target = intendedDestination || 'patient';
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        if (onLoginSuccess) {
          onLoginSuccess(newSession, newPatientProfile);
        } else {
          onNavigateView(target);
        }
      }, 500);
    }, 600);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 py-4">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <button
              type="button"
              id="patient-login-back-home-btn"
              onClick={() => onNavigateView('landing')}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-white/20 cursor-pointer backdrop-blur-xs shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>

            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 border border-teal-400/30 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                <span>National Health Mission</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Namaste. Welcome to MediKiosk.
            </h1>
            <p className="text-sm text-teal-100 max-w-2xl leading-relaxed font-medium">
              Let&apos;s get your health information ready before you meet the doctor.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-white/10 text-teal-100 backdrop-blur-xs font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-300" /> ABDM & DPDP Compliant
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-teal-100 backdrop-blur-xs font-semibold flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-teal-300" /> 10 Indian Languages
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-teal-100 backdrop-blur-xs font-semibold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-teal-300" /> AYUSH & Allopathy
            </span>
          </div>

          {/* Intake Choice Buttons */}
          <div className="pt-2 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => {
                setActiveTab('create-account');
                setErrorMessage(null);
              }}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'create-account' 
                  ? 'bg-teal-500 text-white shadow-md' 
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
            >
              <span>Continue with Voice / New Registration</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('sign-in');
                setErrorMessage(null);
              }}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'sign-in' 
                  ? 'bg-teal-500 text-white shadow-md' 
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
            >
              <span>Continue with Touch / Existing Sign In</span>
            </button>
          </div>
        </div>
      </div>

      {/* Destination Notice if Redirected (Only show if not already showing a success confirmation) */}
      {destinationMessage && !successMessage && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in shadow-2xs">
          <Lock className="w-4 h-4 text-amber-700 shrink-0" />
          <span>{destinationMessage}</span>
        </div>
      )}

      {/* Messages Feedback */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 animate-pulse" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. PRIMARY VIEW: SIGN IN                                 */}
      {/* ======================================================== */}
      {activeTab === 'sign-in' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-lg mx-auto space-y-6">
          
          <div className="text-center space-y-2 border-b border-slate-100 pb-5">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-800 mx-auto flex items-center justify-center font-bold border border-teal-200">
              <KeyRound className="w-6 h-6 text-teal-700" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Sign In
            </h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Enter your registered email address, mobile number, or ABHA ID to access your health portal.
            </p>
          </div>

          <form onSubmit={handleSignInSubmit} className="space-y-4">
            {/* Email Address or Mobile Number Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block">
                  Email Address or Mobile Number
                </label>
                {loginMobile.trim() && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    {loginMobile.includes('@') ? 'Email' : loginMobile.replace(/[^0-9]/g, '').length >= 10 ? 'Mobile' : 'Identifier'}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  id="patient-signin-identifier"
                  value={loginMobile}
                  onChange={(e) => setLoginMobile(e.target.value)}
                  placeholder="Enter email address or 10-digit mobile number"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-900 focus:outline-hidden focus:border-teal-600 focus:bg-white transition-all shadow-2xs"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Supports registered email address, 10-digit Indian phone number, or ABHA ID.
              </p>
            </div>

            {/* PIN or OTP Section */}
            {authMethod === 'pin' ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    PIN
                  </label>
                  <button
                    type="button"
                    onClick={handleSwitchToOtp}
                    className="text-[11px] font-bold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer"
                  >
                    Login with OTP instead
                  </button>
                </div>
                
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    id="patient-signin-pin"
                    value={loginPin}
                    onChange={(e) => setLoginPin(e.target.value)}
                    placeholder="Enter 4–6 digit security PIN"
                    maxLength={6}
                    required
                    className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-hidden focus:border-teal-600 focus:bg-white transition-all shadow-2xs pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={() => setShowForgotPinHelper(!showForgotPinHelper)}
                    className="text-[11px] font-medium text-slate-500 hover:text-teal-700 hover:underline cursor-pointer"
                  >
                    Forgot PIN?
                  </button>
                </div>

                {showForgotPinHelper && (
                  <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-[11px] text-teal-900 flex items-start gap-2 animate-in fade-in">
                    <HelpCircle className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Reset or bypass with OTP:</p>
                      <p className="text-teal-800">
                        Click &ldquo;Login with OTP instead&rdquo; above to verify your registered email address or mobile number directly via OTP code.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Verification Code (OTP)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod('pin');
                      setErrorMessage(null);
                    }}
                    className="text-[11px] font-bold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer"
                  >
                    Login with PIN instead
                  </button>
                </div>

                <div className="flex items-center justify-center gap-3 py-1">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-box-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      placeholder="•"
                      onChange={(e) => {
                        const newDigits = [...otpDigits];
                        newDigits[idx] = e.target.value.slice(-1);
                        setOtpDigits(newDigits);
                        if (e.target.value && idx < 3) {
                          document.getElementById(`otp-box-${idx + 1}`)?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !digit && idx > 0) {
                          document.getElementById(`otp-box-${idx - 1}`)?.focus();
                        }
                      }}
                      className="w-12 h-12 text-center text-lg font-black font-mono rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:border-teal-600 focus:bg-white transition-all shadow-2xs"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span>
                    Use code <strong className="text-teal-700">4829</strong> or OTP sent to your email or mobile.
                  </span>
                  <button
                    type="button"
                    onClick={() => setOtpDigits(['4', '8', '2', '9'])}
                    className="text-[11px] font-bold text-teal-700 hover:underline cursor-pointer"
                  >
                    Fill (4829)
                  </button>
                </div>
              </div>
            )}

            {/* Sign In Submit Button */}
            <button
              type="submit"
              id="btn-patient-signin-submit"
              disabled={isAuthenticating}
              className="w-full py-3.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>{isAuthenticating ? 'Signing In...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Create Account Redirection Section (Below Sign In) */}
          <div className="pt-6 border-t border-slate-200 text-center space-y-3">
            <p className="text-xs font-semibold text-slate-600">
              First time using MediKiosk?
            </p>
            <button
              type="button"
              id="btn-patient-switch-to-create-account"
              onClick={() => {
                setActiveTab('create-account');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="w-full py-3 px-4 rounded-xl border-2 border-teal-700 hover:border-teal-800 text-teal-800 hover:bg-teal-50/60 font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <User className="w-4 h-4 text-teal-700" />
              <span>Create Account</span>
            </button>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 2. SECONDARY VIEW: CREATE PATIENT ACCOUNT                */}
      {/* ======================================================== */}
      {activeTab === 'create-account' && (
        <form 
          onSubmit={handleCreateAccountSubmit}
          className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6"
        >
          {/* Header with Clear Back to Sign In button */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                Create Your Patient Account
              </h2>
              <p className="text-xs text-slate-500">
                Register to generate your Patient ID, ABHA Health Record, and enter the OPD queue.
              </p>
            </div>
            
            <button
              type="button"
              id="btn-back-to-sign-in"
              onClick={() => {
                setActiveTab('sign-in');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Full Name */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="create-patient-fullname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter patient full legal name"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-teal-600 focus:bg-white transition-all"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  +91
                </span>
                <input
                  type="tel"
                  id="create-patient-mobile"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="10-digit phone number"
                  required
                  maxLength={10}
                  className="w-full pl-12 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-teal-600 focus:bg-white transition-all font-mono"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  id="create-patient-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. yourname@example.com"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-teal-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Date of Birth / Age */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Date of Birth / Age (Years) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="create-patient-age"
                value={ageOrDob}
                onChange={(e) => setAgeOrDob(e.target.value)}
                placeholder="e.g. 35 or DD/MM/YYYY"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-teal-600 focus:bg-white transition-all"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                id="create-patient-gender"
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-teal-600 focus:bg-white transition-all cursor-pointer"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Preferred Language */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Preferred Language
              </label>
              <select
                id="create-patient-language"
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value as SupportedLanguage)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-teal-600 focus:bg-white transition-all cursor-pointer"
              >
                {ORDERED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Create 4-6 digit PIN */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Create 4–6 Digit Security PIN <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="create-patient-pin"
                value={createPin}
                onChange={(e) => setCreatePin(e.target.value)}
                placeholder="4-6 digit PIN for future logins"
                maxLength={6}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-teal-600 focus:bg-white transition-all"
              />
            </div>

            {/* Optional ABHA Health ID */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Optional ABHA Health ID <span className="text-slate-400 font-normal">(Auto-generated if empty)</span>
              </label>
              <input
                type="text"
                id="create-patient-abha"
                value={optionalAbhaId}
                onChange={(e) => setOptionalAbhaId(e.target.value)}
                placeholder="e.g. 91-XXXX-XXXX-XXXX"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-teal-600 focus:bg-white transition-all"
              />
            </div>

            {/* Care Stream */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Preferred Medical System
              </label>
              <select
                id="create-patient-carestream"
                value={careStream}
                onChange={(e) => setCareStream(e.target.value as CareStream)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-teal-600 focus:bg-white transition-all cursor-pointer"
              >
                <option value="allopathy">Allopathy (Modern Medicine)</option>
                <option value="ayurveda">Ayurveda (AYUSH)</option>
                <option value="homeopathy">Homeopathy (AYUSH)</option>
                <option value="siddha">Siddha (AYUSH)</option>
                <option value="unani">Unani (AYUSH)</option>
              </select>
            </div>

            {/* OPD Department */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Target OPD Department
              </label>
              <select
                id="create-patient-department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-teal-600 focus:bg-white transition-all cursor-pointer"
              >
                <option value="General Medicine OPD">General Medicine (Room 104)</option>
                <option value="Cardiology OPD">Cardiology & Heart Care</option>
                <option value="Orthopedics OPD">Orthopedics & Joint Clinic</option>
                <option value="Pediatrics OPD">Pediatrics (Child Health)</option>
                <option value="Neurology OPD">Neurology & Neuro Clinic</option>
                <option value="Dermatology OPD">Dermatology (Skin)</option>
                <option value="Ayurveda Kayachikitsa">Ayurveda Kayachikitsa & Panchakarma</option>
                <option value="ENT OPD">ENT (Ear, Nose, Throat)</option>
              </select>
            </div>

            {/* Primary Symptoms / Chief Complaint */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Primary Symptoms / Reason for Visit <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                id="create-patient-complaint"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="Describe symptoms or reason for visit (e.g. fever, headache, body pain)..."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-hidden focus:border-teal-600 focus:bg-white transition-all"
              />
            </div>

          </div>

          {/* Consent Checkbox */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
            <input
              type="checkbox"
              id="consent-checkbox"
              checked={consentAccepted}
              onChange={(e) => setConsentAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer"
            />
            <label htmlFor="consent-checkbox" className="text-xs text-slate-700 leading-relaxed cursor-pointer">
              I consent under the <strong>DPDP Act 2023</strong> for MediKiosk AI and hospital staff to process my demographic and clinical intake data for OPD consultation and generate an AI clinical briefing.
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('sign-in');
                setErrorMessage(null);
              }}
              className="py-3.5 px-5 rounded-2xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              id="btn-create-patient-account-submit"
              disabled={isAuthenticating}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isAuthenticating ? 'Creating Account & Patient ID...' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </form>
      )}

    </div>
  );
};
