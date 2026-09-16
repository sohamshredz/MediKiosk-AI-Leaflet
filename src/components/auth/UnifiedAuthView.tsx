import React, { useState } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  KeyRound, 
  Stethoscope, 
  Activity, 
  BarChart3, 
  Database, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw, 
  Fingerprint, 
  QrCode, 
  User, 
  Users, 
  FileText, 
  Eye, 
  EyeOff, 
  ChevronRight, 
  ArrowLeft,
  Building2,
  BadgeCheck,
  Server,
  Layers,
  HeartPulse,
  UserCog,
  Info
} from 'lucide-react';
import { PatientProfile, SupportedLanguage, CareStream, AuthSession } from '../../types';
import { PatientLogin, PhrRetrievalSummary } from '../patient/PatientLogin';
import { authenticateStaff, authenticateHisAdmin } from '../../services/adminService';

interface UnifiedAuthViewProps {
  patients: PatientProfile[];
  activePatientId: string;
  onSelectPatient: (patientId: string) => void;
  onNavigateView: (view: 'kiosk' | 'doctor' | 'triage' | 'admin' | 'patient') => void;
  onUpdatePatient: (updated: PatientProfile) => void;
  onOpenAbdmModal?: () => void;
  onOpenInfographicModal?: () => void;
  onLoginSuccess?: (session: AuthSession) => void;
}

export const UnifiedAuthView: React.FC<UnifiedAuthViewProps> = ({
  patients,
  activePatientId,
  onSelectPatient,
  onNavigateView,
  onUpdatePatient,
  onOpenAbdmModal,
  onOpenInfographicModal,
  onLoginSuccess
}) => {
  // Panel tab mode: 'dual' (both side by side on desktop) | 'admin_only' | 'patient_only'
  const [activeTab, setActiveTab] = useState<'dual' | 'admin' | 'patient'>('dual');

  // Staff portal mode: 'clinical' (Doctor/MO/Triage Nurse) vs 'admin' (Master HIS Administrator)
  const [staffAuthMode, setStaffAuthMode] = useState<'clinical' | 'admin'>('clinical');

  // Credentials state
  const [staffIdInput, setStaffIdInput] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [adminAuthStatus, setAdminAuthStatus] = useState<'idle' | 'authenticating' | 'success'>('idle');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminSuccessMsg, setAdminSuccessMsg] = useState<string | null>(null);

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAdminSuccessMsg(null);

    const cleanId = staffIdInput.trim();
    const cleanPin = pinInput.trim();

    if (!cleanId) {
      setAdminError(staffAuthMode === 'admin' ? 'Please enter your HIS Master Admin ID.' : 'Please enter your Staff ID or Employee Code.');
      return;
    }

    if (cleanPin.length < 4) {
      setAdminError('Security PIN must be at least 4 digits.');
      return;
    }

    setAdminAuthStatus('authenticating');

    if (staffAuthMode === 'admin') {
      const res = await authenticateHisAdmin(cleanId, cleanPin);
      setAdminAuthStatus('idle');

      if (!res.success || !res.session) {
        setAdminError(res.error || 'Invalid HIS Master Administrator credentials.');
        return;
      }

      setAdminSuccessMsg('HIS Master Administrator verified. Launching Governance Dashboard...');
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
      setAdminAuthStatus('idle');

      if (!res.success || !res.session) {
        setAdminError(res.error || 'Authentication failed. Please verify your Staff ID and PIN.');
        return;
      }

      setAdminSuccessMsg(`Welcome, ${res.session.userName}! Authorized for clinical access.`);
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

  // PATIENT LOGIN SUCCESS CALLBACK
  const handlePatientLoginSuccess = (patient: PatientProfile, summary?: PhrRetrievalSummary) => {
    onSelectPatient(patient.id);
    onNavigateView('patient');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Banner & Control Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <ShieldCheck className="w-80 h-80 text-teal-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-700/60 text-teal-300 text-xs font-mono font-bold">
              <Lock className="w-3.5 h-3.5 text-teal-400" />
              <span>Unified Hospital Access & Identity Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              MediKiosk <span className="text-teal-400">Secure Access Gateway</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Separated authentication portals for <strong>Hospital Administration & Clinical Staff</strong> and <strong>Patients (ABHA / PHR Health Locker)</strong>.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700 flex items-center gap-1 self-start md:self-auto shrink-0 shadow-inner">
            <button
              type="button"
              id="tab-auth-dual"
              onClick={() => setActiveTab('dual')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'dual'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Side-by-Side</span> Dual Panel
            </button>

            <button
              type="button"
              id="tab-auth-admin"
              onClick={() => setActiveTab('admin')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Admin & Staff</span>
            </button>

            <button
              type="button"
              id="tab-auth-patient"
              onClick={() => setActiveTab('patient')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'patient'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Patient & ABHA</span>
            </button>
          </div>
        </div>
      </div>

      {/* DUAL PANELS CONTAINER */}
      <div className={`grid gap-6 ${
        activeTab === 'dual' 
          ? 'grid-cols-1 lg:grid-cols-2' 
          : 'grid-cols-1 max-w-2xl mx-auto'
      }`}>

        {/* ========================================================================= */}
        {/* PANEL 1: ADMIN & CLINICAL STAFF LOGIN                                     */}
        {/* ========================================================================= */}
        {(activeTab === 'dual' || activeTab === 'admin') && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col justify-between">
            
            {/* Admin Header */}
            <div>
              <div className={`p-6 text-white relative ${
                staffAuthMode === 'admin'
                  ? 'bg-gradient-to-r from-slate-900 to-purple-950'
                  : 'bg-gradient-to-r from-slate-900 to-indigo-950'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
                      staffAuthMode === 'admin'
                        ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                        : 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300'
                    }`}>
                      {staffAuthMode === 'admin' ? <UserCog className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-lg text-white">
                          {staffAuthMode === 'admin' ? 'HIS Master Administrator' : 'Hospital Clinical Staff Login'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                          staffAuthMode === 'admin'
                            ? 'bg-purple-900/80 border-purple-600/60 text-purple-300'
                            : 'bg-indigo-900/80 border-indigo-600/60 text-indigo-300'
                        }`}>
                          {staffAuthMode === 'admin' ? 'HIS TIER-1 MASTER' : 'CLINICAL PORTAL'}
                        </span>
                      </div>
                      <p className="text-xs text-indigo-200">
                        {staffAuthMode === 'admin'
                          ? 'Central hospital governance, staff provisioning & system audit'
                          : 'Doctors, Medical Officers & Triage Nurses'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Staff Login Form */}
              <div className="p-6 space-y-4">
                <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
                  
                  {/* Staff ID Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      {staffAuthMode === 'admin' ? 'HIS Administrator ID' : 'Hospital Staff ID / Employee Code'}
                    </label>
                    <div className="relative">
                      <BadgeCheck className="w-4 h-4 text-indigo-600 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        id="input-admin-code"
                        value={staffIdInput}
                        onChange={(e) => setStaffIdInput(e.target.value)}
                        placeholder={staffAuthMode === 'admin' ? 'Enter HIS Administrator ID' : 'Enter Staff ID or Employee Code'}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-600 text-xs sm:text-sm font-mono font-bold text-slate-900 bg-slate-50 focus:bg-white shadow-2xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                        required
                      />
                    </div>
                  </div>

                  {/* Security PIN Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      {staffAuthMode === 'admin' ? 'Master Security PIN' : '4-Digit Staff Security PIN'}
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-indigo-600 absolute left-3.5 top-3.5" />
                      <input
                        type={showPin ? 'text' : 'password'}
                        id="input-admin-pin"
                        maxLength={6}
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value)}
                        placeholder="••••"
                        className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-300 focus:border-indigo-600 text-xs sm:text-sm font-mono font-bold text-slate-900 bg-slate-50 focus:bg-white shadow-2xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {adminError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{adminError}</span>
                    </div>
                  )}

                  {adminSuccessMsg && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{adminSuccessMsg}</span>
                    </div>
                  )}

                  {/* Submit Actions */}
                  <div className="space-y-2 pt-1">
                    <button
                      type="submit"
                      id="btn-admin-login-submit"
                      disabled={adminAuthStatus !== 'idle'}
                      className={`w-full py-3.5 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 ${
                        staffAuthMode === 'admin'
                          ? 'bg-purple-700 hover:bg-purple-800'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {adminAuthStatus === 'authenticating' ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Verifying Hospital Credentials...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>{staffAuthMode === 'admin' ? 'Sign In as HIS Master Administrator' : 'Sign In to Clinical Console'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Mode Switcher */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Info className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      {staffAuthMode === 'clinical'
                        ? 'Staff IDs & PINs are issued by the HIS Admin.'
                        : 'Single Master Administrator account.'}
                    </span>
                  </div>

                  {staffAuthMode === 'clinical' ? (
                    <button
                      type="button"
                      id="btn-switch-to-his-admin"
                      onClick={() => {
                        setStaffAuthMode('admin');
                        setStaffIdInput('');
                        setPinInput('');
                        setAdminError(null);
                      }}
                      className="text-purple-700 hover:text-purple-900 font-bold hover:underline cursor-pointer shrink-0 ml-2"
                    >
                      HIS Admin Login →
                    </button>
                  ) : (
                    <button
                      type="button"
                      id="btn-switch-to-staff"
                      onClick={() => {
                        setStaffAuthMode('clinical');
                        setStaffIdInput('');
                        setPinInput('');
                        setAdminError(null);
                      }}
                      className="text-indigo-700 hover:text-indigo-900 font-bold hover:underline cursor-pointer shrink-0 ml-2"
                    >
                      ← Clinical Staff Login
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Admin Panel Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>RBAC & Audit Logging Enabled</span>
              </span>
              <span className="font-mono">ABDM HIS Node #8812</span>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* PANEL 2: PATIENT & ABHA HEALTH LOCKER LOGIN                               */}
        {/* ========================================================================= */}
        {(activeTab === 'dual' || activeTab === 'patient') && (
          <div className="flex flex-col">
            <PatientLogin
              patients={patients}
              onLoginSuccess={handlePatientLoginSuccess}
              onRegisterNew={(newProfile) => {
                onUpdatePatient(newProfile);
                onSelectPatient(newProfile.id);
                onNavigateView('patient');
              }}
              onBackToKiosk={() => onNavigateView('kiosk')}
            />
          </div>
        )}

      </div>

    </div>
  );
};
