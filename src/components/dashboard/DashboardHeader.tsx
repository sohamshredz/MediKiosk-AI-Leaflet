import React from 'react';
import { 
  Stethoscope, 
  LogOut, 
  User, 
  ShieldCheck, 
  Sparkles, 
  QrCode,
  Building2,
  Calendar,
  Clock,
  Activity
} from 'lucide-react';
import { AuthSession } from '../../types';

interface DashboardHeaderProps {
  role: 'patient' | 'doctor' | 'staff';
  title?: string;
  subtitle?: string;
  patientName?: string;
  patientId?: string;
  uhid?: string;
  doctorName?: string;
  doctorId?: string;
  department?: string;
  staffName?: string;
  staffId?: string;
  staffRoleTitle?: string;
  onLogout?: () => void;
  onOpenProfile?: () => void;
  onOpenQrModal?: () => void;
  onOpenStandards?: () => void;
  extraActions?: React.ReactNode;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  role,
  title,
  subtitle,
  patientName,
  patientId,
  uhid,
  doctorName,
  doctorId,
  department,
  staffName,
  staffId,
  staffRoleTitle,
  onLogout,
  onOpenProfile,
  onOpenQrModal,
  onOpenStandards,
  extraActions
}) => {
  const currentDateFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <header className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: Brand Identity & Role Context */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Stethoscope className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">
                MediKiosk <span className="text-teal-700 dark:text-teal-400">AI</span>
              </span>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Clinical History Software Platform
              </span>
              <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[10px] font-bold uppercase tracking-wider">
                {role === 'patient' ? 'Patient Portal' : role === 'doctor' ? 'OPD Clinical Workspace' : 'Triage & Operations'}
              </span>
            </div>

            {/* Patient Context */}
            {role === 'patient' && patientName && (
              <div className="mt-1 flex items-center gap-2.5 flex-wrap text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-white">{patientName}</span>
                {patientId && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">ID: <strong className="text-teal-700 dark:text-teal-400 font-semibold">{patientId}</strong></span>
                  </>
                )}
                {uhid && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="font-mono text-slate-500">UHID: {uhid}</span>
                  </>
                )}
              </div>
            )}

            {/* Doctor Context */}
            {role === 'doctor' && (
              <div className="mt-1 flex items-center gap-2.5 flex-wrap text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-white">{doctorName || 'Attending Physician'}</span>
                {doctorId && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="font-mono text-slate-500">ID: {doctorId}</span>
                  </>
                )}
                {department && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-teal-700 dark:text-teal-400 font-medium">{department}</span>
                  </>
                )}
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-slate-500 flex items-center gap-1 font-mono text-[11px]">
                  <Calendar className="w-3 h-3" />
                  {currentDateFormatted}
                </span>
              </div>
            )}

            {/* Staff Context */}
            {role === 'staff' && (
              <div className="mt-1 flex items-center gap-2.5 flex-wrap text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-white">{staffName || 'Triage Officer'}</span>
                {staffRoleTitle && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-slate-600 dark:text-slate-400">{staffRoleTitle}</span>
                  </>
                )}
                {department && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-amber-700 dark:text-amber-400 font-medium">{department}</span>
                  </>
                )}
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-slate-500 flex items-center gap-1 font-mono text-[11px]">
                  <Calendar className="w-3 h-3" />
                  {currentDateFormatted}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center flex-wrap">
          {extraActions}

          {onOpenQrModal && (
            <button
              type="button"
              onClick={onOpenQrModal}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Show Digital ABHA ID Pass"
            >
              <QrCode className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span className="hidden sm:inline">ABHA Pass</span>
            </button>
          )}

          {onOpenProfile && (
            <button
              type="button"
              onClick={onOpenProfile}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Profile & Settings"
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Profile</span>
            </button>
          )}

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Logout session"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Logout</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
