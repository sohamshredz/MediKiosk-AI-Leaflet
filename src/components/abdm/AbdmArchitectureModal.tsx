import React from 'react';
import { ShieldCheck, Lock, Layers, Database, ArrowRight, CheckCircle2, Server, Globe2, X } from 'lucide-react';

interface AbdmArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenInfographicModal?: () => void;
}

export const AbdmArchitectureModal: React.FC<AbdmArchitectureModalProps> = ({
  isOpen,
  onClose,
  onOpenInfographicModal
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200/50 dark:border-teal-800/50">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-slate-100">
                Ayushman Bharat (ABDM) & DPDP Act Compliance Architecture
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                National Health Authority (NHA) certified integration pattern for Indian Hospitals
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* M1 */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 block">
              Milestone 1 (M1)
            </span>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">ABHA Creation & QR Verification</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Instant patient identification via 14-digit ABHA ID, Aadhaar OTP, or paper QR scan at the entrance kiosk.
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-100/60 dark:bg-teal-900/60 px-2 py-0.5 rounded-full">
              ✓ Active at Kiosk Step 1
            </span>
          </div>

          {/* M2 */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block">
              Milestone 2 (M2)
            </span>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">HIP (Health Information Provider)</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Synthesized clinical notes, e-Prescriptions, and verified OCR reports pushed as standardized FHIR R4 Bundles to patient's locker.
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100/60 dark:bg-indigo-900/60 px-2 py-0.5 rounded-full">
              ✓ Integrated in Doctor Portal
            </span>
          </div>

          {/* M3 */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
              Milestone 3 (M3)
            </span>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">HIU (Health Information User)</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Pulling historical records from other hospitals via ABDM Consent Manager to automatically assemble the chronological medical timeline.
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
              ✓ Automated Timeline Synthesis
            </span>
          </div>
        </div>

        {/* FHIR R4 Bundle Data Standard Mapping */}
        <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-teal-300 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              FHIR R4 DiagnosticReport & Clinical Document Mapping
            </h4>
            <span className="text-xs font-mono text-slate-400">HL7 FHIR Release 4</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 bg-slate-800 rounded-xl space-y-1">
              <span className="text-teal-400 font-bold block">1. fhir/Observation</span>
              <p className="text-slate-300 text-[11px]">Maps BP (Systolic/Diastolic), SpO2, Heart Rate, RBS, and BMI from Kiosk IoT sensors.</p>
            </div>
            <div className="p-3 bg-slate-800 rounded-xl space-y-1">
              <span className="text-teal-400 font-bold block">2. fhir/Condition</span>
              <p className="text-slate-300 text-[11px]">SNOMED CT coded Chief Complaints, Onset duration, and Past Medical Illnesses.</p>
            </div>
            <div className="p-3 bg-slate-800 rounded-xl space-y-1">
              <span className="text-teal-400 font-bold block">3. fhir/MedicationStatement</span>
              <p className="text-slate-300 text-[11px]">Active prescriptions parsed via Multimodal OCR with dosage, frequency, and duration.</p>
            </div>
            <div className="p-3 bg-slate-800 rounded-xl space-y-1">
              <span className="text-teal-400 font-bold block">4. fhir/AyushObservation</span>
              <p className="text-slate-300 text-[11px]">NAMASTE portal aligned Prakriti, Agni, Koshtha, and Ayurvedic diagnostic classifications.</p>
            </div>
          </div>
        </div>

        {/* DPDP Act 2023 Data Protection Box */}
        <div className="p-4 bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-2xl space-y-2 text-xs text-teal-900 dark:text-teal-200">
          <h4 className="font-bold text-sm text-teal-950 dark:text-teal-100 flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            Digital Personal Data Protection (DPDP) Act 2023 Principles
          </h4>
          <ul className="space-y-1 leading-relaxed list-disc list-inside">
            <li><strong>Explicit Multilingual Consent:</strong> Recorded prior to data gathering in patient's preferred Indian language (Voice + Touch).</li>
            <li><strong>Purpose Limitation:</strong> Patient clinical records are strictly bound to immediate OPD consultation and Doctor CDS preparation.</li>
            <li><strong>Zero Direct Client-Side API Exposure:</strong> All Gemini intelligence is securely brokered via server-side isolated gateways.</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
          {onOpenInfographicModal ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenInfographicModal();
              }}
              className="px-4 py-2.5 bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-700 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>View 14-Stage Workflow Infographic</span>
              <ArrowRight className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-teal-700 dark:hover:bg-teal-600 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Close Architecture Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
