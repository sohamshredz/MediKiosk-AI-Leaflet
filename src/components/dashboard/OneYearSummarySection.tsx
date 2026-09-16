import React from 'react';
import { 
  Sparkles, 
  Calendar, 
  Activity, 
  Pill, 
  AlertTriangle, 
  FileText, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  ChevronRight,
  Info,
  Building2,
  Stethoscope
} from 'lucide-react';
import { PatientOneYearSummary, PatientProfile } from '../../types';

interface OneYearSummarySectionProps {
  summary: PatientOneYearSummary | null;
  patient: PatientProfile;
  isLoading?: boolean;
  onOpenFullHistory?: () => void;
  isDoctorView?: boolean;
}

export const OneYearSummarySection: React.FC<OneYearSummarySectionProps> = ({
  summary,
  patient,
  isLoading = false,
  onOpenFullHistory,
  isDoctorView = false
}) => {
  if (isLoading) {
    return (
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse space-y-4">
        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  // Fallback if summary is null: derive from patient direct fields
  const keyConditions = summary?.keyConditions 
    ? summary.keyConditions.map(k => typeof k === 'string' ? k : k.condition)
    : (patient.pastIllnesses || []);

  const currentMedications = summary?.currentMedications
    ? summary.currentMedications.map(m => typeof m === 'string' ? m : `${m.name}${m.dosage ? ` (${m.dosage})` : ''}`)
    : (patient.currentMedications ? patient.currentMedications.map(m => typeof m === 'string' ? m : `${m.name}${m.dose ? ` (${m.dose})` : ''}`) : []);

  const allergies = summary?.allergies
    ? summary.allergies.map(a => typeof a === 'string' ? a : a.substance)
    : (patient.allergies ? patient.allergies.map(a => typeof a === 'string' ? a : a.substance) : []);

  const recentConsultations = summary?.recentConsultations || [];
  const labHighlights = summary?.labHighlights || [];
  const attentionItems = summary?.abnormalAttentionItems || [];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5 transition-colors">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                1-Year Clinical Summary
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-[10px] font-bold border border-teal-200 dark:border-teal-800">
                Past 365 Days
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Synthesized medical history, active medications, lab trends and consultations
            </p>
          </div>
        </div>

        {onOpenFullHistory && (
          <button
            type="button"
            onClick={onOpenFullHistory}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-teal-800 dark:text-teal-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-center shrink-0"
          >
            <span>View Full Timeline</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Mandatory Verification Notice */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
        <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
        <span>
          <strong>AI-generated clinical summary</strong> — verify with source records.
        </span>
      </div>

      {/* Narrative Summary if available */}
      {summary?.executiveSummary && (
        <div className="p-4 bg-teal-50/60 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-900 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
          <p className="font-semibold text-teal-900 dark:text-teal-300 mb-1 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            <span>Clinical Narrative Synthesis</span>
          </p>
          <p>{summary.executiveSummary}</p>
        </div>
      )}

      {/* Attention Items & Red Flags Banner */}
      {attentionItems.length > 0 && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl space-y-1.5">
          <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Attention Items & Clinical Warnings</span>
          </span>
          <ul className="space-y-1 text-xs text-rose-900 dark:text-rose-200">
            {attentionItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 3-Column Key Clinical Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Key Conditions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Key Conditions</span>
            </span>
            <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono">
              {keyConditions.length}
            </span>
          </div>
          {keyConditions.length > 0 ? (
            <ul className="space-y-1 text-xs text-slate-800 dark:text-slate-200">
              {keyConditions.map((cond, i) => (
                <li key={i} className="flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
                  <span>{cond}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic">No chronic conditions recorded</p>
          )}
        </div>

        {/* Current Medications */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Current Medications</span>
            </span>
            <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono">
              {currentMedications.length}
            </span>
          </div>
          {currentMedications.length > 0 ? (
            <ul className="space-y-1 text-xs text-slate-800 dark:text-slate-200">
              {currentMedications.map((med, i) => (
                <li key={i} className="flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span>{med}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic">No active medications recorded</p>
          )}
        </div>

        {/* Allergies */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Allergies</span>
            </span>
            <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono">
              {allergies.length}
            </span>
          </div>
          {allergies.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {allergies.map((all, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-900">
                  {all}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No drug / food allergies recorded</p>
          )}
        </div>

      </div>

      {/* 2-Column Grid: Important Lab Highlights & Recent Consultations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Lab Highlights */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Important Lab Highlights</span>
            </span>
          </div>
          {labHighlights.length > 0 ? (
            <div className="space-y-1.5">
              {labHighlights.map((lab, i) => (
                <div key={i} className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{lab.testName}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-teal-700 dark:text-teal-400">{lab.value}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{lab.date}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-2">
              No recent abnormal lab highlights in 365-day window.
            </p>
          )}
        </div>

        {/* Recent Consultations */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Recent Consultations (Past Year)</span>
            </span>
          </div>
          {recentConsultations.length > 0 ? (
            <div className="space-y-1.5">
              {recentConsultations.map((c, i) => (
                <div key={i} className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs space-y-0.5">
                  <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                    <span>{c.doctorName || c.department || 'Consultation'}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{c.date}</span>
                  </div>
                  {c.summary && (
                    <p className="text-[11px] text-teal-700 dark:text-teal-400 font-medium">
                      {c.summary}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-2">
              No previous OPD consultations recorded within 365 days.
            </p>
          )}
        </div>

      </div>

    </div>
  );
};
