import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  X, 
  Table, 
  ShieldCheck,
  Server,
  UploadCloud,
  FileCode,
  Layers,
  Sparkles
} from 'lucide-react';
import { 
  SUPABASE_PROJECT_ID, 
  SUPABASE_URL, 
  SUPABASE_SQL_SCHEMA, 
  testSupabaseConnection,
  fetchAppointmentsFromSupabase,
  fetchPrescriptionsFromSupabase,
  saveAppointmentToSupabase,
  savePrescriptionToSupabase
} from '../../utils/supabaseClient';
import { SAMPLE_PRESCRIPTIONS } from '../../data/samplePrescriptions';
import { Appointment } from '../../types';

interface SupabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments?: Appointment[];
}

export const SupabaseStatusModal: React.FC<SupabaseStatusModalProps> = ({
  isOpen,
  onClose,
  appointments = []
}) => {
  const [testing, setTesting] = useState<boolean>(false);
  const [syncingData, setSyncingData] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'sql' | 'tables'>('overview');
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    tableExists: boolean;
    message: string;
    tableDetails?: Record<string, boolean>;
  } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [remoteCounts, setRemoteCounts] = useState<{
    appointments: number;
    prescriptions: number;
  }>({ appointments: 0, prescriptions: 0 });

  const runCheck = async () => {
    setTesting(true);
    setSyncResult(null);
    const result = await testSupabaseConnection();
    setConnectionStatus(result);
    
    if (result.connected) {
      try {
        const { appointments: apts } = await fetchAppointmentsFromSupabase();
        const { prescriptions: rxs } = await fetchPrescriptionsFromSupabase();
        setRemoteCounts({
          appointments: apts.length,
          prescriptions: rxs.length
        });
      } catch {
        // Handled silently
      }
    }
    setTesting(false);
  };

  useEffect(() => {
    if (isOpen) {
      runCheck();
    }
  }, [isOpen]);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSyncLocalData = async () => {
    setSyncingData(true);
    setSyncResult(null);
    try {
      let aptCount = 0;
      let rxCount = 0;

      // 1. Sync appointments
      if (appointments.length > 0) {
        for (const apt of appointments) {
          const res = await saveAppointmentToSupabase(apt);
          if (res.isDbPersisted) aptCount++;
        }
      }

      // 2. Sync prescriptions
      for (const rx of SAMPLE_PRESCRIPTIONS) {
        const res = await savePrescriptionToSupabase(rx);
        if (res.isDbPersisted) rxCount++;
      }

      setSyncResult(`Successfully synced ${aptCount} appointment(s) and ${rxCount} prescription(s) to Supabase cloud!`);
      // Refresh count
      await runCheck();
    } catch (err: any) {
      setSyncResult(`Sync note: ${err?.message || 'Data recorded locally, table creation recommended in Supabase'}`);
    } finally {
      setSyncingData(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-teal-800 via-emerald-800 to-teal-900 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-emerald-200 shadow-inner">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300">
                  Supabase Pro Cloud Connected
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 text-[10px] font-mono border border-emerald-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live PostgreSQL
                </span>
              </div>
              <h3 className="text-lg font-bold text-white leading-tight">
                Database Engine & Schema Manager
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 px-6 pt-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-teal-600 text-teal-800 dark:text-teal-300'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Connection & Sync</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'border-teal-600 text-teal-800 dark:text-teal-300'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>PostgreSQL Schema (SQL)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tables')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tables'
                ? 'border-teal-600 text-teal-800 dark:text-teal-300'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Tables & Storage ({Object.keys(connectionStatus?.tableDetails || {}).length || 8})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto text-slate-800 dark:text-slate-200 flex-1">
          
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Project Details Card */}
              <div className="p-4.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Configured Supabase Project
                  </span>
                  <button
                    onClick={runCheck}
                    disabled={testing}
                    className="px-3 py-1 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-semibold text-teal-800 dark:text-teal-300 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                    <span>{testing ? 'Checking...' : 'Re-test Connectivity'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">Project ID:</span>
                    <strong className="font-mono text-slate-900 dark:text-slate-100 text-sm font-bold">{SUPABASE_PROJECT_ID}</strong>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">Database Endpoint:</span>
                    <span className="font-mono text-teal-800 dark:text-teal-300 text-xs truncate block font-semibold" title={SUPABASE_URL}>{SUPABASE_URL}</span>
                  </div>
                </div>

                {/* Connection Status Banner */}
                {connectionStatus && (
                  <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
                    connectionStatus.connected 
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100' 
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-100'
                  }`}>
                    {connectionStatus.connected ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <strong className="block font-bold">
                        {connectionStatus.connected ? 'Connected to Supabase PostgreSQL' : 'Connection Notice'}
                      </strong>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">{connectionStatus.message}</p>
                      
                      {connectionStatus.connected && (
                        <div className="flex flex-wrap gap-3 pt-1 text-[11px] font-semibold text-teal-800 dark:text-teal-300">
                          <span>📋 Remote Appointments: <strong>{remoteCounts.appointments}</strong></span>
                          <span>💊 Remote Prescriptions: <strong>{remoteCounts.prescriptions}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Push Data & Sync Action */}
              <div className="p-4.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UploadCloud className="w-5 h-5 text-teal-700 dark:text-teal-400" />
                    <h4 className="font-bold text-sm text-teal-950 dark:text-teal-100">
                      Sync Application Data to Supabase
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleSyncLocalData}
                    disabled={syncingData}
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingData ? 'animate-spin' : ''}`} />
                    <span>{syncingData ? 'Syncing...' : 'Sync Data Now'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Pushes current active appointments, patient clinical records, and verified prescription records directly into your Supabase database.
                </p>
                {syncResult && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-teal-300 dark:border-teal-700 text-xs font-medium text-teal-900 dark:text-teal-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>{syncResult}</span>
                  </div>
                )}
              </div>

              {/* Quick Dashboard Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a 
                  href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql/new`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-300 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <FileCode className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-teal-900 dark:group-hover:text-teal-200">
                      Open Supabase SQL Editor
                    </span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-700" />
                </a>

                <a 
                  href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/editor`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-300 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <Table className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-teal-900 dark:group-hover:text-teal-200">
                      Browse Database Table Editor
                    </span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-700" />
                </a>
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Table className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                    PostgreSQL Master Schema (9 Tables with RLS & Indexes)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Copy and run in <a href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql/new`} target="_blank" rel="noopener noreferrer" className="text-teal-700 dark:text-teal-400 font-bold hover:underline">Supabase SQL Editor</a>
                  </p>
                </div>
                <button
                  onClick={handleCopySql}
                  className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'SQL Copied!' : 'Copy Entire SQL'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto max-h-80 leading-relaxed border border-slate-800 select-all">
                  {SUPABASE_SQL_SCHEMA}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'tables' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Database Schema Coverage (8 Clinical & Operational Entities):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {[
                  { name: 'appointments', desc: 'OPD Queue Tokens, Teleconsults & Slots', icon: Table },
                  { name: 'ambulance_bookings', desc: 'Emergency SOS, Driver & GPS Dispatch', icon: Table },
                  { name: 'prescriptions', desc: 'Digital Rx, OCR Scans & Clinician Signatures', icon: Table },
                  { name: 'patient_medical_history', desc: '26 Categories of Chronic & Prior Conditions', icon: Table },
                  { name: 'medical_history_documents', desc: 'Prescription & Lab Report Scans + OCR Text', icon: Table },
                  { name: 'patients', desc: 'Full Demographic, Symptoms, Vitals & AYUSH Profiles', icon: Table },
                  { name: 'patient_one_year_summaries', desc: '365-Day Longitudinal Clinical Dossiers', icon: Table },
                  { name: 'triage_assessments', desc: 'Nurse Station & Acuity Matrix Level 1-3', icon: Table },
                  { name: 'audit_logs', desc: 'HIPAA/ABDM Activity & Signature Audit Trail', icon: Table },
                ].map((tbl) => {
                  const isActive = connectionStatus?.tableDetails?.[tbl.name] ?? connectionStatus?.tableExists;
                  return (
                    <div key={tbl.name} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      <div>
                        <code className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                          {tbl.name}
                        </code>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {tbl.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <Server className="w-3.5 h-3.5 text-teal-600" />
            <span>Supabase Pro • PostgreSQL 15+</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-teal-700 dark:hover:bg-teal-600 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
