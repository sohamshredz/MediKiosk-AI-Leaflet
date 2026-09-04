import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Maximize2, 
  Printer, 
  ShieldCheck, 
  QrCode, 
  UserCheck, 
  Languages, 
  Bot, 
  HelpCircle, 
  AlertTriangle, 
  BellRing, 
  CheckCircle2, 
  FileUp, 
  FileSearch, 
  CalendarClock, 
  FileText, 
  Stethoscope, 
  Database, 
  Sparkles, 
  ArrowRight, 
  ChevronRight,
  ExternalLink,
  Info,
  Layers,
  Share2,
  Users
} from 'lucide-react';

interface WorkflowInfographicModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkflowInfographicModal: React.FC<WorkflowInfographicModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'interactive' | 'poster'>('interactive');
  const [highlightedStage, setHighlightedStage] = useState<number | null>(null);

  if (!isOpen) return null;

  const stages = [
    {
      num: 1,
      title: 'IDENTITY VERIFICATION',
      desc: 'Patient enters ABHA ID or completes new patient registration.',
      icon: QrCode,
      category: 'intake',
      color: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/40 shadow-cyan-500/10'
    },
    {
      num: 2,
      title: 'INITIAL CHECK-IN',
      desc: 'Patient enters the clinic and starts the MediKiosk process.',
      icon: UserCheck,
      category: 'intake',
      color: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/40 shadow-cyan-500/10'
    },
    {
      num: 3,
      title: 'LANGUAGE SELECTION & CONSENT',
      desc: 'Patient selects preferred language and provides audio-guided consent.',
      icon: Languages,
      category: 'consent',
      color: 'border-sky-500/40 text-sky-400 bg-sky-950/40 shadow-sky-500/10'
    },
    {
      num: 4,
      title: 'AI-DRIVEN HISTORY',
      desc: 'AI collects chief complaint, HPI, past medical history, drug/allergy history and ROS using voice or touchscreen.',
      icon: Bot,
      category: 'ai_history',
      color: 'border-indigo-500/40 text-indigo-400 bg-indigo-950/40 shadow-indigo-500/10'
    },
    {
      num: 5,
      title: 'AI FOLLOW-UP',
      desc: "AI dynamically asks relevant follow-up questions based on the patient's previous answers.",
      icon: HelpCircle,
      category: 'ai_history',
      color: 'border-indigo-500/40 text-indigo-400 bg-indigo-950/40 shadow-indigo-500/10'
    },
    {
      num: 6,
      title: 'RED-FLAG IDENTIFICATION',
      desc: "AI checks the patient's responses for potential critical or emergency symptoms.",
      icon: AlertTriangle,
      category: 'triage',
      color: 'border-amber-500/40 text-amber-400 bg-amber-950/40 shadow-amber-500/10'
    },
    {
      num: 7,
      title: 'STAFF ALERT (RED FLAG DETECTED)',
      desc: 'If potential red flags are detected, the triage staff is immediately alerted for human assessment.',
      icon: BellRing,
      category: 'alert',
      isBranch: true,
      branchType: 'alert',
      color: 'border-rose-500/60 text-rose-300 bg-rose-950/60 shadow-rose-500/20 ring-1 ring-rose-500/40'
    },
    {
      num: 8,
      title: 'NO RED FLAGS',
      desc: 'If no red flags are detected, the normal patient intake workflow continues.',
      icon: CheckCircle2,
      category: 'normal',
      isBranch: true,
      branchType: 'normal',
      color: 'border-emerald-500/50 text-emerald-300 bg-emerald-950/40 shadow-emerald-500/10'
    },
    {
      num: 9,
      title: 'DOCUMENT UPLOAD',
      desc: 'Patient scans or uploads previous prescriptions, laboratory reports, discharge summaries and other medical documents.',
      icon: FileUp,
      category: 'ocr',
      color: 'border-teal-500/40 text-teal-400 bg-teal-950/40 shadow-teal-500/10'
    },
    {
      num: 10,
      title: 'DATA EXTRACTION',
      desc: 'OCR + AI extracts important information such as diagnoses, medications, dosages, test results and procedures.',
      icon: FileSearch,
      category: 'ocr',
      color: 'border-teal-500/40 text-teal-400 bg-teal-950/40 shadow-teal-500/10'
    },
    {
      num: 11,
      title: 'TIMELINE CREATION',
      desc: 'AI organizes extracted medical records chronologically to create a patient medical timeline.',
      icon: CalendarClock,
      category: 'timeline',
      color: 'border-purple-500/40 text-purple-400 bg-purple-950/40 shadow-purple-500/10'
    },
    {
      num: 12,
      title: 'SUMMARY CREATION',
      desc: "AI combines the patient's conversational history and extracted medical records into a structured clinical summary.",
      icon: FileText,
      category: 'summary',
      color: 'border-purple-500/40 text-purple-400 bg-purple-950/40 shadow-purple-500/10'
    },
    {
      num: 13,
      title: 'DOCTOR REVIEW',
      desc: 'Doctor reviews the AI-generated summary, edits information if necessary, and verifies the final clinical history.',
      icon: Stethoscope,
      category: 'physician',
      color: 'border-emerald-500/50 text-emerald-400 bg-emerald-950/50 shadow-emerald-500/10 ring-1 ring-emerald-500/30'
    },
    {
      num: 14,
      title: 'DATA STORAGE & SHARING',
      desc: 'Verified information is securely stored in the hospital HIS/EMR and shared with the ABDM ecosystem only with appropriate patient consent.',
      icon: Database,
      category: 'abdm',
      color: 'border-blue-500/50 text-blue-400 bg-blue-950/40 shadow-blue-500/10'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-950 w-full max-w-7xl rounded-3xl shadow-2xl border border-slate-800 text-slate-100 flex flex-col my-auto max-h-[96vh] overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  SMART INDIA HACKATHON ARCHITECTURE
                </span>
                <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                  END-TO-END PATIENT INTAKE WORKFLOW
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                MEDIKIOSK – AI-POWERED PATIENT INTAKE WORKFLOW
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('interactive')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                  activeTab === 'interactive' 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Interactive Workflow
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('poster')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                  activeTab === 'poster' 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Poster Slide
              </button>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              title="Print / Save as PDF"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
          
          {activeTab === 'interactive' ? (
            <div className="space-y-8">
              {/* Infographic Hero Banner */}
              <div className="text-center max-w-3xl mx-auto space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  14-Stage Full-Spectrum Healthcare Process Architecture
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-indigo-300">
                  AI-Assisted Patient Intake & Clinical Verification
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Bridging rural/urban OPD queues with multilingual voice conversational intake, OCR timeline extraction, human triage safeguard, and FHIR/ABDM integration.
                </p>
              </div>

              {/* Horizontal Alternating Workflow Timeline Grid */}
              <div className="relative pt-6 pb-6">
                
                {/* Visual Glow Line for Horizontal Timeline */}
                <div className="hidden lg:block absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 rounded-full opacity-30 shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>

                {/* Alternating 14 Stages Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4 relative z-10">
                  {stages.map((stage, idx) => {
                    const Icon = stage.icon;
                    const isEven = stage.num % 2 === 0;
                    const isHighlighted = highlightedStage === stage.num;

                    return (
                      <div
                        key={stage.num}
                        onMouseEnter={() => setHighlightedStage(stage.num)}
                        onMouseLeave={() => setHighlightedStage(null)}
                        className={`group relative flex flex-col justify-between p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                          stage.color
                        } ${
                          isHighlighted 
                            ? 'scale-105 shadow-xl -translate-y-1 z-20 ring-2 ring-cyan-400/50' 
                            : 'hover:border-slate-700/80 hover:-translate-y-0.5'
                        } ${
                          stage.isBranch && stage.branchType === 'alert'
                            ? 'bg-rose-950/80 border-rose-500/80 ring-1 ring-rose-500/50'
                            : ''
                        } ${
                          stage.isBranch && stage.branchType === 'normal'
                            ? 'bg-emerald-950/60 border-emerald-500/60'
                            : ''
                        }`}
                      >
                        {/* Stage Number & Icon */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="w-6 h-6 rounded-full bg-slate-900/90 border border-slate-700 text-xs font-mono font-bold text-slate-200 flex items-center justify-center shadow-xs">
                            {stage.num}
                          </span>
                          <div className="p-1.5 rounded-xl bg-slate-900/80 border border-slate-700/50">
                            <Icon className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-xs leading-snug tracking-tight text-white mb-1.5">
                          {stage.title}
                        </h3>

                        {/* Description */}
                        <p className="text-[11px] leading-relaxed text-slate-300 line-clamp-3 group-hover:line-clamp-none transition-all">
                          {stage.desc}
                        </p>

                        {/* Highlight Special Alert Indicator for Stage 7 */}
                        {stage.num === 7 && (
                          <div className="mt-2 pt-2 border-t border-rose-500/30 flex items-center gap-1 text-[10px] font-bold text-rose-300 uppercase tracking-wider">
                            <Users className="w-3 h-3 text-rose-400" />
                            <span>HUMAN TRIAGE NURSE ONLY</span>
                          </div>
                        )}

                        {/* Arrow indicator to next step */}
                        {idx < stages.length - 1 && (
                          <div className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 text-cyan-400/60 pointer-events-none">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Explicit Red-Flag Human Safety Branch Visualizer */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <h3 className="font-bold text-sm sm:text-base text-white">
                      Stage 6 → 7 vs 8: Safety Triage Decision Logic
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-cyan-400 px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-800">
                    Human-in-the-Loop Safeguard
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Branch A: Red Flag -> Staff Alert */}
                  <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 space-y-2">
                    <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wider">
                      <BellRing className="w-4 h-4 text-rose-400" />
                      <span>Branch A: Critical Red Flag Detected</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      If symptoms indicate severe chest pain, stroke signs (FAST), acute dyspnea, or anaphylaxis:
                    </p>
                    <div className="p-2.5 bg-rose-950/60 rounded-xl border border-rose-500/30 text-xs text-rose-200 font-medium">
                      🚨 <strong>Immediate Human Escalation:</strong> Kiosk alerts OPD Triage Nurse Station with acoustic beacon and priority bed assignment. Kiosk does NOT deliver automated diagnosis.
                    </div>
                  </div>

                  {/* Branch B: Normal Intake */}
                  <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Branch B: No Red Flags (Standard Flow)</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      If patient reports non-critical symptoms (e.g. chronic pain, seasonal cough, routine follow-up):
                    </p>
                    <div className="p-2.5 bg-emerald-950/60 rounded-xl border border-emerald-500/30 text-xs text-emerald-200 font-medium">
                      📄 <strong>Autonomous Progression:</strong> Patient advances seamlessly to OCR Document Upload (Stage 9), Timeline Synthesizer (Stage 11), and Doctor Review (Stage 13).
                    </div>
                  </div>
                </div>
              </div>

              {/* End-to-End Visual Flow Summary Banner */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
                <p className="text-xs font-mono tracking-widest text-cyan-400 uppercase font-bold">
                  HIGH-LEVEL PIPELINE SUMMARY
                </p>
                <div className="text-sm sm:text-base font-extrabold text-white tracking-wide flex items-center justify-center flex-wrap gap-2">
                  <span className="px-2 py-1 bg-cyan-950 rounded-lg border border-cyan-800 text-cyan-300">Talk (Multilingual Voice)</span>
                  <span className="text-slate-600">→</span>
                  <span className="px-2 py-1 bg-teal-950 rounded-lg border border-teal-800 text-teal-300">Scan (OCR EHR)</span>
                  <span className="text-slate-600">→</span>
                  <span className="px-2 py-1 bg-indigo-950 rounded-lg border border-indigo-800 text-indigo-300">Understand (AI HPI)</span>
                  <span className="text-slate-600">→</span>
                  <span className="px-2 py-1 bg-amber-950 rounded-lg border border-amber-800 text-amber-300">Prioritize (Triage)</span>
                  <span className="text-slate-600">→</span>
                  <span className="px-2 py-1 bg-purple-950 rounded-lg border border-purple-800 text-purple-300">Summarize (FHIR)</span>
                  <span className="text-slate-600">→</span>
                  <span className="px-2 py-1 bg-emerald-950 rounded-lg border border-emerald-800 text-emerald-300">Doctor Verification</span>
                </div>
              </div>
            </div>
          ) : (
            /* Poster Slide Image View */
            <div className="space-y-4 text-center">
              <div className="bg-slate-900/90 p-2 sm:p-4 rounded-3xl border border-slate-800 shadow-2xl max-w-5xl mx-auto overflow-hidden">
                <img
                  src="/src/assets/images/medikiosk_workflow_infographic_1787984401663.jpg"
                  alt="MediKiosk AI-Powered Patient Intake Workflow Infographic"
                  className="w-full h-auto rounded-2xl object-cover shadow-lg border border-slate-800"
                />
              </div>

              <p className="text-xs text-slate-400">
                16:9 Presentation-Ready Slide graphic generated for Smart India Hackathon (SIH) & Project Architecture.
              </p>
            </div>
          )}

          {/* Bottom Safety Statement & Tagline Footer */}
          <div className="border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-semibold text-white">
                “Talk → Scan → Understand → Prioritize → Summarize → Doctor Verification”
              </span>
            </div>

            <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px] text-amber-300/90 font-medium">
              ⚠️ <strong>Safety Statement:</strong> AI assists clinical workflow; the doctor retains final clinical decision-making authority.
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
