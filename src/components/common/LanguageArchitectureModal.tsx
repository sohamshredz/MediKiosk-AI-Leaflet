import React from 'react';
import { X, ShieldCheck, Languages, UserCheck, Stethoscope, Mic, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface LanguageArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LanguageArchitectureModal: React.FC<LanguageArchitectureModalProps> = ({
  isOpen,
  onClose
}) => {
  const { language, langConfig, t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-tight">
                System Architecture: Language Preference ≠ Patient Identity
              </h3>
              <p className="text-xs text-slate-300">
                Core Design Principle of MediKiosk AI Clinical Platform
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Architecture Visual Diagram */}
          <div className="p-5 rounded-2xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto shadow-inner border border-slate-800">
            <div className="text-teal-400 font-bold text-center pb-3 text-sm">
              ARCHITECTURE TOPOLOGY
            </div>
            <pre className="text-emerald-300 leading-relaxed text-center select-all font-mono text-xs sm:text-sm">
{`                 MEDIKIOSK AI
                      │
          ┌───────────┴───────────┐
          ↓                       ↓
   Authentication            Language
          │                 Preference
          ↓                       ↓
    Patient ID              English/Hindi/
          │                  Marathi/etc.
          ↓                       │
   Patient's Data                 ↓
                          Entire UI + TTS/STT`}
            </pre>
          </div>

          {/* Explanation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Branch: Patient Identity */}
            <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/80 space-y-2.5">
              <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200 font-bold text-sm">
                <UserCheck className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                <span>Branch 1: Authentication & Patient Data</span>
              </div>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                  <span><strong>Permanent Identity:</strong> UHID, ABHA Address, Aadhaar/Mobile credentials.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                  <span><strong>Clinical Integrity:</strong> Diagnoses, prescriptions, lab values, and EHR records are immutable by language toggles.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                  <span><strong>ABDM Standard:</strong> FHIR R4 compliant record serialization.</span>
                </li>
              </ul>
            </div>

            {/* Right Branch: Language Preference */}
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
                <Languages className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <span>Branch 2: Language Preference & UI</span>
              </div>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>Dynamic Localization:</strong> Instant real-time UI translation across 10 Indic languages.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>Speech Synthesis (TTS):</strong> Natural audio readback in the patient's chosen tongue.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>Speech-to-Text (STT):</strong> Live AI triage transcription in regional accents & dialects.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Key Advantages */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              Why this separation matters for Indian Healthcare
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              In public hospitals, multiple family members or triage nurses may interact with the same patient's record using different linguistic preferences (e.g. an elderly patient speaking Marathi, a triage nurse speaking Hindi, and a consulting physician reviewing English FHIR data). Decoupling allows everyone to view and hear the records in their preferred language without corrupting the central patient record.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Active: <span className="font-bold text-teal-800 dark:text-teal-300">{langConfig.nativeName} ({langConfig.name})</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-teal-700 dark:hover:bg-teal-600 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
