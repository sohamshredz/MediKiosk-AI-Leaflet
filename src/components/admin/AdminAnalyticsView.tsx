import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  FileSearch, 
  Zap, 
  CheckCircle2, 
  Activity, 
  Building2, 
  Languages, 
  Layers, 
  RefreshCw,
  Sparkles,
  Server,
  Lock,
  ArrowLeft,
  UserPlus,
  UserCheck,
  UserX,
  KeyRound,
  Search,
  Filter,
  Trash2,
  Edit,
  Eye,
  AlertCircle,
  History,
  FileText,
  UserCog,
  Calendar,
  Pill,
  Settings,
  Check,
  X
} from 'lucide-react';
import { PatientProfile, HospitalStaffMember } from '../../types';
import { 
  fetchAllStaff, 
  fetchAuditLogs, 
  fetchHospitalConfig 
} from '../../services/adminService';
import { StaffManagementTab } from './StaffManagementTab';
import { PatientManagementTab } from './PatientManagementTab';
import { AppointmentsOversightTab } from './AppointmentsOversightTab';
import { PrescriptionsTab } from './PrescriptionsTab';
import { SystemConfigTab } from './SystemConfigTab';

interface AdminAnalyticsViewProps {
  patients: PatientProfile[];
  onOpenInfographicModal?: () => void;
  onOpenAbdmModal?: () => void;
  onBackToLanding?: () => void;
  onUpdatePatient?: (updated: PatientProfile) => void;
  onDeletePatient?: (id: string) => void;
}

type AdminTab = 'staff' | 'patients' | 'appointments' | 'documents' | 'system' | 'analytics';

export const AdminAnalyticsView: React.FC<AdminAnalyticsViewProps> = ({
  patients,
  onOpenInfographicModal,
  onOpenAbdmModal,
  onBackToLanding,
  onUpdatePatient = () => {},
  onDeletePatient
}) => {
  // Navigation Tabs inside HIS Admin Dashboard
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('staff');

  // Staff State with cached initial fallback
  const [staffList, setStaffList] = useState<HospitalStaffMember[]>(() => {
    try {
      const cached = localStorage.getItem('medikiosk_cached_staff_list');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [isLoadingStaff, setIsLoadingStaff] = useState<boolean>(false);

  // Global Feedback Toast
  const [adminFeedback, setAdminFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Hospital info
  const [hospitalName, setHospitalName] = useState<string>('AIIMS New Delhi - Apex OPD Kiosk');

  // Load staff
  const loadStaff = async () => {
    setIsLoadingStaff(true);
    const res = await fetchAllStaff();
    setIsLoadingStaff(false);
    if (res.success && res.staff && res.staff.length > 0) {
      setStaffList(res.staff);
      try {
        localStorage.setItem('medikiosk_cached_staff_list', JSON.stringify(res.staff));
      } catch (e) {}
    }
  };

  // Immediate state update when doctor or staff data is saved
  const handleUpdateStaff = (updatedStaff: HospitalStaffMember) => {
    setStaffList((prev) => {
      const next = prev.map((s) => (s.id === updatedStaff.id || s.staffId === updatedStaff.staffId ? updatedStaff : s));
      try {
        localStorage.setItem('medikiosk_cached_staff_list', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Load config name
  const loadHospitalData = async () => {
    const res = await fetchHospitalConfig();
    if (res.success && res.config?.hospitalName) {
      setHospitalName(res.config.hospitalName);
    }
  };

  useEffect(() => {
    loadStaff();
    loadHospitalData();
  }, []);

  const handleShowFeedback = (type: 'success' | 'error', message: string) => {
    setAdminFeedback({ type, message });
    setTimeout(() => {
      setAdminFeedback((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Telemetry Analytics Data
  const stats = {
    todayPatients: 4826,
    historiesCompleted: 4210,
    completionRate: 87.2,
    highPriorityFlagged: 137,
    documentsProcessed: 2846,
    avgIntakeTime: '4.2m',
    manualIntakeBaseline: '12.5m',
    avgDoctorReviewTime: '1.8m',
    manualDoctorBaseline: '8.5m',
    timeSavedPerPatient: '14.9m',
    ocrConfidenceAvg: '94.6%'
  };

  const languageBreakdown = [
    { lang: 'Hindi (हिंदी)', count: 2027, pct: 42, color: 'bg-teal-500' },
    { lang: 'Bengali (বাংলা)', count: 1158, pct: 24, color: 'bg-indigo-500' },
    { lang: 'Tamil (தமிழ்)', count: 675, pct: 14, color: 'bg-cyan-500' },
    { lang: 'Telugu (తెలుగు)', count: 531, pct: 11, color: 'bg-sky-500' },
    { lang: 'Marathi (मराठी)', count: 435, pct: 9, color: 'bg-purple-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner: Master HIS Administration Authority */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-purple-950 text-white rounded-3xl p-6 sm:p-8 border border-purple-900/40 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              {onBackToLanding && (
                <button
                  type="button"
                  onClick={onBackToLanding}
                  className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Back to Landing Home"
                >
                  <ArrowLeft className="w-4 h-4 text-purple-400" />
                  <span>Back</span>
                </button>
              )}
              <span className="text-[10px] font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-700/60 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                HIS MASTER ADMINISTRATIVE AUTHORITY
              </span>
              <span className="text-xs font-mono text-purple-300/90">
                Dr. Amitabh Verma, MS (Hospital Administrator)
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Hospital Information System <span className="text-purple-400">Master Console</span>
            </h1>
            
            <p className="text-xs sm:text-sm text-purple-200/90 leading-relaxed">
              Full administrative authority over Clinical Staff, Patient Electronic Records, OPD Appointment Queues, Prescriptions, and System Governance.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {onOpenInfographicModal && (
              <button
                type="button"
                onClick={onOpenInfographicModal}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>14-Stage Workflow</span>
              </button>
            )}

            {onOpenAbdmModal && (
              <button
                type="button"
                onClick={onOpenAbdmModal}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>ABDM Architecture</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Admin Module 6-Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        
        {/* TAB 1: Staff Management */}
        <button
          type="button"
          id="admin-tab-staff"
          onClick={() => setActiveAdminTab('staff')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeAdminTab === 'staff'
              ? 'bg-purple-700 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <UserCog className="w-4 h-4" />
          <span>Staff Management</span>
          <span className="px-1.5 py-0.5 rounded-full bg-purple-900/40 text-[10px] font-mono">
            {staffList.length}
          </span>
        </button>

        {/* TAB 2: Patient Management */}
        <button
          type="button"
          id="admin-tab-patients"
          onClick={() => setActiveAdminTab('patients')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeAdminTab === 'patients'
              ? 'bg-purple-700 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Patient Registry &amp; EHR</span>
          <span className="px-1.5 py-0.5 rounded-full bg-purple-900/40 text-[10px] font-mono">
            {patients.length}
          </span>
        </button>

        {/* TAB 3: OPD Appointments */}
        <button
          type="button"
          id="admin-tab-appointments"
          onClick={() => setActiveAdminTab('appointments')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeAdminTab === 'appointments'
              ? 'bg-purple-700 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>OPD Queue &amp; Appointments</span>
        </button>

        {/* TAB 4: Prescriptions & Documents */}
        <button
          type="button"
          id="admin-tab-documents"
          onClick={() => setActiveAdminTab('documents')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeAdminTab === 'documents'
              ? 'bg-purple-700 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Prescriptions &amp; Documents</span>
        </button>

        {/* TAB 5: System Configuration & Audit */}
        <button
          type="button"
          id="admin-tab-system"
          onClick={() => setActiveAdminTab('system')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeAdminTab === 'system'
              ? 'bg-purple-700 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Configuration &amp; Audit</span>
        </button>

        {/* TAB 6: Analytics & Telemetry */}
        <button
          type="button"
          id="admin-tab-analytics"
          onClick={() => setActiveAdminTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeAdminTab === 'analytics'
              ? 'bg-purple-700 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>OPD Telemetry &amp; Impact</span>
        </button>

      </div>

      {/* Global Action Feedback Banner */}
      {adminFeedback && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-bold animate-in fade-in ${
          adminFeedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-2">
            {adminFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{adminFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setAdminFeedback(null)}
            className="p-1 hover:bg-black/5 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION A: STAFF PROVISIONING & CREDENTIAL MANAGEMENT                      */}
      {/* ========================================================================= */}
      {activeAdminTab === 'staff' && (
        <StaffManagementTab
          staffList={staffList}
          isLoading={isLoadingStaff}
          onRefresh={loadStaff}
          onUpdateStaff={handleUpdateStaff}
          onShowFeedback={handleShowFeedback}
        />
      )}

      {/* ========================================================================= */}
      {/* SECTION B: PATIENT MANAGEMENT & DATA GOVERNANCE                           */}
      {/* ========================================================================= */}
      {activeAdminTab === 'patients' && (
        <PatientManagementTab
          patients={patients}
          onUpdatePatient={onUpdatePatient}
          onDeletePatient={onDeletePatient}
          onShowFeedback={handleShowFeedback}
        />
      )}

      {/* ========================================================================= */}
      {/* SECTION C: APPOINTMENTS & OPD QUEUE OVERSIGHT                             */}
      {/* ========================================================================= */}
      {activeAdminTab === 'appointments' && (
        <AppointmentsOversightTab
          staffList={staffList}
          onShowFeedback={handleShowFeedback}
        />
      )}

      {/* ========================================================================= */}
      {/* SECTION D: CLINICAL DOCUMENTS & PRESCRIPTIONS                             */}
      {/* ========================================================================= */}
      {activeAdminTab === 'documents' && (
        <PrescriptionsTab
          patients={patients}
          hospitalName={hospitalName}
        />
      )}

      {/* ========================================================================= */}
      {/* SECTION E: SYSTEM CONFIGURATION & AUDIT TRAIL                             */}
      {/* ========================================================================= */}
      {activeAdminTab === 'system' && (
        <SystemConfigTab
          onShowFeedback={handleShowFeedback}
        />
      )}

      {/* ========================================================================= */}
      {/* SECTION F: OPD TELEMETRY & ANALYTICS                                      */}
      {/* ========================================================================= */}
      {activeAdminTab === 'analytics' && (
        <div className="space-y-6">
          {/* Primary KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Today's Patients</span>
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 font-mono">{stats.todayPatients.toLocaleString()}</p>
              <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +14.2% vs yesterday
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Intake Completed</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 font-mono">{stats.historiesCompleted.toLocaleString()}</p>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                {stats.completionRate}% Autonomous
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Triage Alerts</span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-2xl font-black text-rose-700 font-mono">{stats.highPriorityFlagged}</p>
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                Human Escalated
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Docs Processed</span>
                <FileSearch className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 font-mono">{stats.documentsProcessed.toLocaleString()}</p>
              <span className="text-[10px] font-medium text-slate-500">
                OCR Conf: {stats.ocrConfidenceAvg}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Avg Intake Time</span>
                <Clock className="w-4 h-4 text-teal-600" />
              </div>
              <p className="text-2xl font-black text-teal-700 font-mono">{stats.avgIntakeTime}</p>
              <span className="text-[10px] text-slate-500 line-through">
                Manual: {stats.manualIntakeBaseline}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Dr Review Time</span>
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-indigo-700 font-mono">{stats.avgDoctorReviewTime}</p>
              <span className="text-[10px] text-slate-500 line-through">
                Manual: {stats.manualDoctorBaseline}
              </span>
            </div>
          </div>

          {/* Multilingual & Workflow Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Languages className="w-4 h-4 text-teal-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Multilingual Intake Breakdown</h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">6 Indian Languages</span>
              </div>

              <div className="space-y-3">
                {languageBreakdown.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{item.lang}</span>
                      <span className="font-mono text-slate-500">{item.count.toLocaleString()} ({item.pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Clinical Time Shift: Pre-Consultation vs Consultation</h3>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  ⚡ 66.4% OPD Velocity Boost
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2">
                  <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                    Traditional OPD Bottleneck
                  </span>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <div className="flex justify-between">
                      <span>Manual History-Taking:</span>
                      <span className="font-bold text-rose-700">7.5 mins</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Flipping Paper Records:</span>
                      <span className="font-bold text-rose-700">3.5 mins</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prescription &amp; Advice:</span>
                      <span className="font-bold text-slate-800">4.0 mins</span>
                    </div>
                    <div className="pt-2 border-t border-rose-200 flex justify-between font-black text-rose-900 text-sm">
                      <span>Total Consultation:</span>
                      <span>15.0 mins/pt</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-teal-300 bg-teal-50/50 space-y-2">
                  <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                    MediKiosk AI-Powered OPD
                  </span>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <div className="flex justify-between">
                      <span>AI Pre-Consultation:</span>
                      <span className="font-bold text-teal-700">0 min (During Wait)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Doctor 10-Sec Rapid Read:</span>
                      <span className="font-bold text-teal-700">0.5 mins</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Focused Exam &amp; Treatment:</span>
                      <span className="font-bold text-slate-900">2.5 mins</span>
                    </div>
                    <div className="pt-2 border-t border-teal-300 flex justify-between font-black text-teal-950 text-sm">
                      <span>Total Consultation:</span>
                      <span>3.0 mins/pt</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
                <span><strong>Hospital Capacity Expansion:</strong> +320 additional patients seen per doctor shift without physician fatigue.</span>
                <span className="font-mono text-purple-700 font-bold">14.9 mins saved / patient</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
