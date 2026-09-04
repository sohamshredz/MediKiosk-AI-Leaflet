import React from 'react';
import { 
  ShieldAlert, 
  Lock, 
  ArrowLeft, 
  UserCheck, 
  Stethoscope, 
  Home, 
  AlertTriangle,
  User,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { AuthSession } from '../../types';
import { AppView } from '../SidebarDashboard';

export interface AccessDeniedViewProps {
  currentSession: AuthSession | null;
  targetView?: AppView;
  attemptedView?: AppView;
  requiredLevel?: string;
  customMessage?: string;
  onNavigateView?: (view: AppView) => void;
  onBackToHome?: () => void;
  onOpenStaffLogin: (targetDestination?: AppView, message?: string) => void;
  onOpenPatientLogin: () => void;
  onLogout: () => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  currentSession,
  targetView,
  attemptedView,
  requiredLevel,
  customMessage,
  onNavigateView,
  onBackToHome,
  onOpenStaffLogin,
  onOpenPatientLogin,
  onLogout
}) => {
  const isPatient = currentSession?.role === 'patient';
  const isStaff = !isPatient && currentSession !== null;
  const destination = attemptedView || targetView || 'doctor';
  const handleHomeClick = () => {
    if (onBackToHome) onBackToHome();
    else if (onNavigateView) onNavigateView('landing');
  };

  return (
    <div className="max-w-2xl mx-auto my-8 p-6 sm:p-8 bg-white rounded-3xl border-2 border-rose-100 shadow-xl space-y-6 animate-in fade-in duration-200">
      
      {/* Header Badge & Icon */}
      <div className="flex items-center justify-between">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-xs">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold font-mono uppercase tracking-wider">
          ACCESS RESTRICTED (HTTP 403)
        </span>
      </div>

      {/* Main Warning Title */}
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Clinical Authorization Required
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          {customMessage ? (
            <span>{customMessage}</span>
          ) : (
            <>
              The requested portal (<strong className="text-slate-900 font-mono">/{destination}</strong>) is restricted to authorized hospital personnel. 
              {isPatient ? (
                <span> You are currently signed in under a <strong>Patient Account</strong>.</span>
              ) : isStaff ? (
                <span> Your current staff role (<strong className="font-mono">{currentSession?.roleTitle || currentSession?.role}</strong>) does not have clearance for this module.</span>
              ) : (
                <span> Please authenticate with valid credentials to proceed.</span>
              )}
            </>
          )}
        </p>
      </div>

      {/* Active Session Info Box */}
      {currentSession && (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Current Authenticated Session:</span>
            <span className="text-emerald-700 font-mono flex items-center gap-1 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                {isPatient ? <User className="w-4 h-4" /> : <Stethoscope className="w-4 h-4 text-teal-700" />}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{currentSession.userName}</p>
                <p className="text-[11px] text-slate-500">
                  {currentSession.roleTitle || currentSession.role.toUpperCase()}
                  {currentSession.staffCode ? ` • ${currentSession.staffCode}` : ''}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Guidance Alert */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">DPDP & ABDM Security Guardrail</p>
          <p className="text-amber-800 leading-relaxed">
            Patient health records and physician consoles are strictly compartmentalized under the Digital Personal Data Protection (DPDP) Act 2023.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
        {isPatient ? (
          <>
            <button
              type="button"
              onClick={() => {
                if (onNavigateView) onNavigateView('patient');
                else if (onBackToHome) onBackToHome();
              }}
              className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <User className="w-4 h-4 text-teal-200" />
              <span>Return to My Patient Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenStaffLogin(destination, 'Please sign in with Doctor or Clinical Staff credentials.')}
              className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4 text-teal-300" />
              <span>Switch to Hospital Staff Login</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleHomeClick}
              className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4 text-slate-600" />
              <span>Back to Home</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenStaffLogin(destination, 'Please sign in with authorized credentials for this section.')}
              className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-teal-200" />
              <span>Sign In with Different Staff Account</span>
            </button>
          </>
        )}
      </div>

    </div>
  );
};
