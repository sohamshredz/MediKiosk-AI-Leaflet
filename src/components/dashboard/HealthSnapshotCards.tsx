import React from 'react';
import { Activity, Pill, AlertTriangle, Calendar, Clock, Stethoscope, CheckCircle2 } from 'lucide-react';
import { PatientProfile } from '../../types';

interface HealthSnapshotCardsProps {
  patient: PatientProfile;
  onNavigateToSection?: (section: 'history' | 'prescriptions' | 'appointments') => void;
}

export const HealthSnapshotCards: React.FC<HealthSnapshotCardsProps> = ({
  patient,
  onNavigateToSection
}) => {
  // Extract actual recorded data only
  const knownConditions = patient.pastIllnesses && patient.pastIllnesses.length > 0 
    ? patient.pastIllnesses 
    : [];

  const currentMedications = patient.currentMedications && patient.currentMedications.length > 0
    ? patient.currentMedications
    : [];

  const allergies = patient.allergies && patient.allergies.length > 0
    ? patient.allergies
    : [];

  // Find last consultation from timeline or notes
  const consultationEvent = patient.timeline?.find(e => 
    e.category === 'diagnosis' || 
    e.category === 'prescription' ||
    e.title.toLowerCase().includes('consult') ||
    e.title.toLowerCase().includes('doctor')
  );

  const lastConsultationText = patient.doctorNotes?.verifiedAt
    ? `Dr. ${patient.doctorNotes.verifiedByDoctorName || 'Physician'} (${new Date(patient.doctorNotes.verifiedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })})`
    : consultationEvent
    ? `${consultationEvent.title} • ${consultationEvent.date}`
    : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-700 dark:text-teal-400" />
          <span>Patient Health Snapshot</span>
        </h2>
        <span className="text-[11px] text-slate-500 font-medium">Recorded Clinical Baseline</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* 1. Known Conditions */}
        <div 
          onClick={() => onNavigateToSection?.('history')}
          className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-teal-300 dark:hover:border-teal-700 transition-all cursor-pointer space-y-2 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              <span>Known Conditions</span>
              <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </div>

            {knownConditions.length > 0 ? (
              <div className="space-y-1 mt-1">
                {knownConditions.slice(0, 3).map((c, i) => (
                  <div key={i} className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
                    <span className="truncate">{c}</span>
                  </div>
                ))}
                {knownConditions.length > 3 && (
                  <span className="text-[11px] text-teal-700 dark:text-teal-400 font-bold block pt-0.5">
                    +{knownConditions.length - 3} more condition(s)
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic mt-1">
                Not available in recorded history
              </p>
            )}
          </div>

          <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 block pt-1 border-t border-slate-100 dark:border-slate-800">
            View Condition History →
          </span>
        </div>

        {/* 2. Current Medications */}
        <div 
          onClick={() => onNavigateToSection?.('prescriptions')}
          className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-teal-300 dark:hover:border-teal-700 transition-all cursor-pointer space-y-2 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              <span>Current Medications</span>
              <Pill className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>

            {currentMedications.length > 0 ? (
              <div className="space-y-1 mt-1">
                {currentMedications.slice(0, 3).map((m, i) => (
                  <div key={i} className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                    <span className="truncate">{typeof m === 'string' ? m : `${m.name}${m.dose ? ` (${m.dose})` : ''}`}</span>
                  </div>
                ))}
                {currentMedications.length > 3 && (
                  <span className="text-[11px] text-amber-700 dark:text-amber-400 font-bold block pt-0.5">
                    +{currentMedications.length - 3} more medicine(s)
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic mt-1">
                Not available in recorded history
              </p>
            )}
          </div>

          <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 block pt-1 border-t border-slate-100 dark:border-slate-800">
            View Prescriptions →
          </span>
        </div>

        {/* 3. Allergies */}
        <div 
          onClick={() => onNavigateToSection?.('history')}
          className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-teal-300 dark:hover:border-teal-700 transition-all cursor-pointer space-y-2 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              <span>Allergies</span>
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>

            {allergies.length > 0 ? (
              <div className="space-y-1 mt-1">
                {allergies.map((a, i) => (
                  <span 
                    key={i} 
                    className="inline-block px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-[11px] font-bold mr-1 mb-1"
                  >
                    ⚠️ {typeof a === 'string' ? a : a.substance}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic mt-1">
                No known drug or food allergies recorded
              </p>
            )}
          </div>

          <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 block pt-1 border-t border-slate-100 dark:border-slate-800">
            View Allergy Profile →
          </span>
        </div>

        {/* 4. Last Consultation */}
        <div 
          onClick={() => onNavigateToSection?.('appointments')}
          className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-teal-300 dark:hover:border-teal-700 transition-all cursor-pointer space-y-2 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              <span>Last Consultation</span>
              <Stethoscope className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </div>

            {lastConsultationText ? (
              <div className="mt-1 space-y-0.5">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                  {lastConsultationText}
                </p>
                {patient.doctorNotes?.customDoctorDiagnosis && (
                  <p className="text-[11px] text-teal-800 dark:text-teal-400 font-medium">
                    Diagnosis: {patient.doctorNotes.customDoctorDiagnosis}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic mt-1">
                Not available in recorded history
              </p>
            )}
          </div>

          <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 block pt-1 border-t border-slate-100 dark:border-slate-800">
            View Consultation Log →
          </span>
        </div>

      </div>
    </div>
  );
};
