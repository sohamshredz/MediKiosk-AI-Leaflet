import React, { useState, useEffect } from 'react';
import { 
  X, 
  Stethoscope, 
  ShieldCheck, 
  Activity, 
  Lock, 
  KeyRound, 
  UserCheck, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Eye, 
  EyeOff,
  UserCog,
  RefreshCw,
  Info
} from 'lucide-react';
import { AppView } from '../SidebarDashboard';
import { PatientProfile, AuthSession } from '../../types';
import { authenticateStaff, authenticateHisAdmin, staffSelfResetPin } from '../../services/adminService';

interface StaffLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateView: (view: AppView) => void;
  onSelectPatient?: (id: string) => void;
  patients?: PatientProfile[];
  targetDestination?: AppView;
  destinationMessage?: string;
  onLoginSuccess?: (session: AuthSession) => void;
}

export const StaffLoginModal: React.FC<StaffLoginModalProps> = ({
  isOpen,
  onClose,
  onNavigateView,
  onSelectPatient,
  patients = [],
  targetDestination,
  destinationMessage,
  onLoginSuccess
}) => {
  // Mode: 'staff' (Doctor / Medical Officer / Triage Nurse) vs 'admin' (Discreet Master HIS Administrator)
  const [authMode, setAuthMode] = useState<'staff' | 'admin'>(() => 
    targetDestination === 'admin' ? 'admin' : 'staff'
  );

  // Form inputs
  const [identifierInput, setIdentifierInput] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);

  // State
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Self-Service PIN Reset state
  const [isResetPinView, setIsResetPinView] = useState<boolean>(false);
  const [resetStaffId, setResetStaffId] = useState<string>('');
  const [confirmCurrentPin, setConfirmCurrentPin] = useState<string>('');
  const [resetNewPin, setResetNewPin] = useState<string>('');
  const [confirmNewPin, setConfirmNewPin] = useState<string>('');
  const [showCurrentPin, setShowCurrentPin] = useState<boolean>(false);
  const [showNewPin, setShowNewPin] = useState<boolean>(false);
  const [showConfirmPin, setShowConfirmPin] = useState<boolean>(false);
  const [isSubmittingReset, setIsSubmittingReset] = useState<boolean>(false);

  // Sync mode with targetDestination when modal opens
  useEffect(() => {
    if (isOpen) {
      if (targetDestination === 'admin') {
        setAuthMode('admin');
        setIdentifierInput('');
      } else {
        setAuthMode('staff');
        setIdentifierInput('');
      }
      setPinInput('');
      setIsResetPinView(false);
      setAuthError(null);
      setAuthSuccess(null);
      setIsAuthenticating(false);
    }
  }, [isOpen, targetDestination]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    const cleanId = identifierInput.trim();
    const cleanPin = pinInput.trim();

    if (!cleanId) {
      setAuthError(authMode === 'admin' ? 'Please enter your HIS Administrator ID.' : 'Please enter your Staff ID or Employee Code.');
      return;
    }
    if (!cleanPin) {
      setAuthError('Please enter your 4-digit Security PIN.');
      return;
    }

    setIsAuthenticating(true);

    if (authMode === 'admin') {
      // Authenticate via Master HIS Admin API
      const result = await authenticateHisAdmin(cleanId, cleanPin);
      setIsAuthenticating(false);

      if (!result.success || !result.session) {
        setAuthError(result.error || 'HIS Master Administrator authentication failed.');
        return;
      }

      setAuthSuccess('Master Administrator verified. Redirecting to HIS Administration Dashboard...');
      const session: AuthSession = {
        role: 'admin',
        userId: result.session.userId,
        userName: result.session.userName,
        staffCode: result.session.staffCode,
        roleTitle: result.session.roleTitle,
        department: result.session.department,
        token: result.session.token,
        loginTime: new Date().toISOString()
      };

      setTimeout(() => {
        onClose();
        if (onLoginSuccess) {
          onLoginSuccess(session);
        }
        onNavigateView('admin');
      }, 500);
    } else {
      // Authenticate Clinical Staff (Doctor, Medical Officer, Triage Nurse)
      const result = await authenticateStaff(cleanId, cleanPin);
      setIsAuthenticating(false);

      if (!result.success || !result.session) {
        setAuthError(result.error || 'Authentication failed. Please verify your Staff ID and PIN.');
        return;
      }

      const session: AuthSession = {
        role: result.session.role,
        userId: result.session.userId,
        userName: result.session.userName,
        staffCode: result.session.staffCode,
        roleTitle: result.session.roleTitle,
        department: result.session.department,
        token: result.session.token,
        loginTime: new Date().toISOString()
      };

      setAuthSuccess(`Welcome, ${result.session.userName}! Authorized for clinical access.`);

      setTimeout(() => {
        onClose();
        if (patients.length > 0 && onSelectPatient) {
          onSelectPatient(patients[0].id);
        }
        if (onLoginSuccess) {
          onLoginSuccess(session);
        }
        const destination = targetDestination || result.session?.targetView || (session.role === 'triage_nurse' ? 'triage' : 'doctor');
        onNavigateView(destination);
      }, 500);
    }
  };

  // Self-Service PIN Reset Handler
  const handleSelfResetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    const cleanStaffId = resetStaffId.trim();
    const cleanCurrent = confirmCurrentPin.trim();
    const cleanNew = resetNewPin.trim();
    const cleanConfirm = confirmNewPin.trim();

    if (!cleanStaffId) {
      setAuthError('Please enter your Doctor / Staff ID.');
      return;
    }
    if (!cleanCurrent) {
      setAuthError('Please enter your Current PIN (or Staff ID if this is your default PIN).');
      return;
    }
    if (!cleanNew) {
      setAuthError('Please enter your new PIN.');
      return;
    }
    if (cleanNew.length < 4) {
      setAuthError('New Security PIN must be at least 4 characters.');
      return;
    }
    if (cleanNew !== cleanConfirm) {
      setAuthError('New PIN and Confirm New PIN do not match.');
      return;
    }

    setIsSubmittingReset(true);
    const res = await staffSelfResetPin(cleanStaffId, cleanCurrent, cleanNew, cleanConfirm);
    setIsSubmittingReset(false);

    if (res.success) {
      setAuthSuccess(res.message || 'Security PIN updated successfully! You can now log in.');
      setIdentifierInput(cleanStaffId);
      setPinInput(cleanNew);
      setIsResetPinView(false);
    } else {
      setAuthError(res.error || 'Failed to update PIN. Please verify your current PIN.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-login-modal-title"
      >
        {/* MODAL HEADER */}
        <div className={`p-5 text-white flex items-center justify-between ${
          authMode === 'admin' 
            ? 'bg-gradient-to-r from-slate-900 to-purple-950' 
            : 'bg-gradient-to-r from-slate-900 to-teal-950'
        }`}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              aria-label="Back to previous screen"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-xs ${
              authMode === 'admin' ? 'bg-purple-600 text-white' : 'bg-teal-700 text-white'
            }`}>
              {authMode === 'admin' ? <UserCog className="w-5 h-5 text-purple-200" /> : <Stethoscope className="w-5 h-5 text-teal-200" />}
            </div>
            <div>
              <h3 id="staff-login-modal-title" className="text-base font-bold leading-tight text-white flex items-center gap-2">
                {authMode === 'admin' ? 'HIS Master Administrator' : 'Clinical Staff Portal'}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                  authMode === 'admin' 
                    ? 'bg-purple-900/80 text-purple-300 border-purple-600/50' 
                    : 'bg-teal-900/80 text-teal-300 border-teal-600/50'
                }`}>
                  {authMode === 'admin' ? 'HIS TIER-1 MASTER' : 'AUTHORIZED PERSONNEL'}
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                {authMode === 'admin'
                  ? 'Central hospital governance, staff provisioning & system audit'
                  : 'Doctors, Medical Officers & Triage Nurses access'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-5">
          {destinationMessage && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{destinationMessage}</span>
            </div>
          )}

          {authSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{authSuccess}</span>
            </div>
          )}

          {authError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {isResetPinView ? (
            /* ======================================================= */
            /* SELF-SERVICE RESET PIN VIEW                             */
            /* ======================================================= */
            <form onSubmit={handleSelfResetPinSubmit} className="space-y-4">
              <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-2xl text-xs text-teal-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-teal-900">
                  <KeyRound className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>Reset Staff Security PIN</span>
                </div>
                <p className="text-teal-800 text-[11px] leading-relaxed">
                  Enter your Doctor / Staff ID, confirm your current PIN (or initial Staff ID), then set and confirm your new PIN.
                </p>
              </div>

              {/* Staff ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Doctor / Staff ID
                </label>
                <input
                  type="text"
                  value={resetStaffId}
                  onChange={(e) => setResetStaffId(e.target.value)}
                  placeholder="e.g. DOC-SOHOM-01"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Step 1: Confirm Current PIN */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  1. Confirm Current PIN (or Staff ID)
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPin ? 'text' : 'password'}
                    maxLength={32}
                    value={confirmCurrentPin}
                    onChange={(e) => setConfirmCurrentPin(e.target.value)}
                    placeholder="Enter current PIN (or Staff ID if default)"
                    className="w-full pl-3.5 pr-11 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPin(!showCurrentPin)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showCurrentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Credentials must be kept strictly confidential.</p>
              </div>

              {/* Step 2: Reset PIN */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  2. Reset PIN (New PIN)
                </label>
                <div className="relative">
                  <input
                    type={showNewPin ? 'text' : 'password'}
                    maxLength={32}
                    value={resetNewPin}
                    onChange={(e) => setResetNewPin(e.target.value)}
                    placeholder="Enter new PIN (min 4 characters)"
                    className="w-full pl-3.5 pr-11 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPin(!showNewPin)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Step 3: Confirm New PIN */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  3. Confirm New PIN
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPin ? 'text' : 'password'}
                    maxLength={32}
                    value={confirmNewPin}
                    onChange={(e) => setConfirmNewPin(e.target.value)}
                    placeholder="Re-enter new PIN to confirm"
                    className="w-full pl-3.5 pr-11 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetPinView(false);
                    setAuthError(null);
                  }}
                  className="px-4 py-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  Back to Sign In
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReset}
                  className="flex-1 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmittingReset ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Updating Security PIN...</span>
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
            /* STANDARD CLINICAL / HIS ADMIN LOGIN FORM                */
            /* ======================================================= */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  {authMode === 'admin' ? 'HIS Administrator ID' : 'Hospital Staff ID / Employee Code'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="input-staff-modal-id"
                    value={identifierInput}
                    onChange={(e) => setIdentifierInput(e.target.value)}
                    placeholder={authMode === 'admin' ? 'Enter HIS Administrator ID' : 'Enter Staff ID or Employee Code'}
                    className="w-full pl-3.5 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  {authMode === 'admin' ? 'Master Security PIN' : 'Staff Security PIN'}
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    id="input-staff-modal-pin"
                    maxLength={32}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3.5 pr-11 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Reset PIN small button in below staff pin in small in left side */}
                {authMode === 'staff' && (
                  <div className="mt-2 flex items-center justify-between">
                    <button
                      type="button"
                      id="btn-trigger-staff-reset-pin"
                      onClick={() => {
                        setIsResetPinView(true);
                        setResetStaffId(identifierInput || '');
                        setConfirmCurrentPin('');
                        setResetNewPin('');
                        setConfirmNewPin('');
                        setAuthError(null);
                        setAuthSuccess(null);
                      }}
                      className="text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-teal-600" />
                      <span>Reset PIN</span>
                    </button>
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-slate-400" />
                      Confidential Security Credential
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                id="btn-staff-modal-submit"
                disabled={isAuthenticating}
                className={`w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${
                  authMode === 'admin'
                    ? 'bg-purple-700 hover:bg-purple-800'
                    : 'bg-teal-700 hover:bg-teal-800'
                }`}
              >
                {isAuthenticating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Hospital Credentials...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>{authMode === 'admin' ? 'Sign In as HIS Master Administrator' : 'Sign In to Clinical Console'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Discreet Admin Mode Switcher / Notice */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                {authMode === 'staff' 
                  ? 'Staff ID & PIN are issued by the HIS Master Administrator.' 
                  : 'Master Administrator account with full system governance.'}
              </span>
            </div>

            {authMode === 'staff' ? (
              <button
                type="button"
                id="btn-switch-to-his-admin"
                onClick={() => {
                  setAuthMode('admin');
                  setIdentifierInput('');
                  setPinInput('');
                  setAuthError(null);
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
                  setAuthMode('staff');
                  setIdentifierInput('');
                  setPinInput('');
                  setAuthError(null);
                }}
                className="text-teal-700 hover:text-teal-900 font-bold hover:underline cursor-pointer shrink-0 ml-2"
              >
                ← Clinical Staff Login
              </button>
            )}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-teal-600" />
            <span>National Health Authority • ABDM M3 Certified HIS</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
