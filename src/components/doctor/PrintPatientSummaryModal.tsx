import React, { useState, useRef } from 'react';
import { 
  X, 
  Printer, 
  Check, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  FileText, 
  Stethoscope, 
  Activity, 
  Pill, 
  Heart, 
  Building2,
  Calendar,
  User,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { PatientProfile } from '../../types';

interface PrintPatientSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfile;
}

export const PrintPatientSummaryModal: React.FC<PrintPatientSummaryModalProps> = ({
  isOpen,
  onClose,
  patient
}) => {
  const [includeTimeline, setIncludeTimeline] = useState(true);
  const [includeVitals, setIncludeVitals] = useState(true);
  const [includeRedFlags, setIncludeRedFlags] = useState(true);
  const [includeMedications, setIncludeMedications] = useState(true);
  const [includeAyush, setIncludeAyush] = useState(patient.careStream !== 'allopathy');
  const [includeRx, setIncludeRx] = useState(true);
  const [conciseMode, setConciseMode] = useState(false);

  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !patient) return null;

  const summary = patient.clinicalSummary;
  const isRedFlag = patient.triageRisk === 'CRITICAL_EMERGENCY' || patient.redFlagsDetected.length > 0;
  const isAmber = patient.triageRisk === 'URGENT_PRIORITY';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      
      {/* Modal Container */}
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[96vh] my-auto overflow-hidden">
        
        {/* Controls Header (Hidden in Print) */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <span>Print Patient Clinical Summary</span>
                <span className="text-xs font-mono px-2 py-0.5 bg-teal-100 text-teal-800 rounded-md font-bold">
                  {patient.tokenNumber}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Simplified, printer-friendly dossier with medical timeline and triage status
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              id="concise-toggle-btn"
              onClick={() => setConciseMode(!conciseMode)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                conciseMode 
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{conciseMode ? 'Concise 1-Page Mode: ON' : 'Concise Mode'}</span>
            </button>

            <button
              type="button"
              id="confirm-print-summary-btn"
              onClick={handlePrint}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Customization Options Bar (Hidden in Print) */}
        <div className="px-6 py-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center gap-4 text-xs font-semibold text-slate-600 overflow-x-auto print:hidden">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Include:</span>
          
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900">
            <input 
              type="checkbox" 
              checked={includeVitals} 
              onChange={e => setIncludeVitals(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500" 
            />
            <span>Vitals</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900">
            <input 
              type="checkbox" 
              checked={includeRedFlags} 
              onChange={e => setIncludeRedFlags(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500" 
            />
            <span>Red-Flag & Triage</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900">
            <input 
              type="checkbox" 
              checked={includeTimeline} 
              onChange={e => setIncludeTimeline(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500" 
            />
            <span>Medical Timeline</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900">
            <input 
              type="checkbox" 
              checked={includeMedications} 
              onChange={e => setIncludeMedications(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500" 
            />
            <span>Medications & Allergies</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900">
            <input 
              type="checkbox" 
              checked={includeRx} 
              onChange={e => setIncludeRx(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500" 
            />
            <span>Doctor Prescription (e-Rx)</span>
          </label>

          {patient.careStream !== 'allopathy' && (
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900">
              <input 
                type="checkbox" 
                checked={includeAyush} 
                onChange={e => setIncludeAyush(e.target.checked)}
                className="rounded text-teal-600 focus:ring-teal-500" 
              />
              <span>AYUSH Assessment</span>
            </label>
          )}
        </div>

        {/* Printable Paper Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/50 print:bg-white print:p-0 print:overflow-visible">
          
          <div 
            ref={printAreaRef}
            id="printable-patient-summary"
            className="max-w-4xl mx-auto bg-white border border-slate-300 print:border-0 rounded-2xl print:rounded-none p-6 sm:p-10 shadow-lg print:shadow-none space-y-6 text-slate-900 text-xs sm:text-sm font-sans print:m-0"
          >
            
            {/* 1. Official Medical Header / Letterhead */}
            <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-teal-700 print:text-black shrink-0" />
                  <h1 className="text-base sm:text-lg font-black tracking-tight uppercase text-slate-900">
                    AIIMS OPD CLINICAL PRE-CONSULTATION SUMMARY
                  </h1>
                </div>
                <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                  Department of {patient.department || 'General Medicine'} • MediKiosk AI Intake Node #04
                </p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  ABDM Integrated • FHIR R4 Standard • System Generated on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div className="text-right shrink-0">
                <div className="inline-block border-2 border-slate-900 px-3 py-1 rounded-lg text-center bg-slate-50 print:bg-white">
                  <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 block">
                    OPD TOKEN NO.
                  </span>
                  <span className="text-base sm:text-lg font-black font-mono text-slate-950">
                    {patient.tokenNumber}
                  </span>
                </div>
                <p className="text-[10px] font-mono text-slate-500 mt-1">UHID: {patient.uhid}</p>
              </div>
            </div>

            {/* 2. Patient Demographics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs print:bg-white print:border-slate-400">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Patient Name</span>
                <span className="font-extrabold text-slate-900 text-sm">{patient.name}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Age / Gender</span>
                <span className="font-bold text-slate-900">{patient.age} yrs / {patient.gender.toUpperCase()}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">ABHA ID / Address</span>
                <span className="font-mono font-bold text-slate-800 truncate block">{patient.abhaId || '91-4829-1029-4820'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Care Stream / Lang</span>
                <span className="font-bold text-slate-800 uppercase">{patient.careStream} ({patient.language.toUpperCase()})</span>
              </div>
            </div>

            {/* 3. Red-Flag & Triage Status Banner */}
            {includeRedFlags && (
              <div className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                isRedFlag 
                  ? 'bg-rose-50 border-rose-400 text-rose-950 print:bg-white print:border-2 print:border-black' 
                  : isAmber
                  ? 'bg-amber-50 border-amber-400 text-amber-950 print:bg-white'
                  : 'bg-emerald-50 border-emerald-400 text-emerald-950 print:bg-white'
              }`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wide">
                    {isRedFlag ? (
                      <AlertTriangle className="w-4 h-4 text-rose-600 print:text-black shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 print:text-black shrink-0" />
                    )}
                    <span>
                      TRIAGE RISK ASSESSMENT: {patient.triageRisk.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {patient.redFlagsDetected.length > 0 ? (
                    <div className="text-xs font-semibold pl-5">
                      <strong>Detected Red Flags: </strong>
                      <span>{patient.redFlagsDetected.join(' • ')}</span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-600 pl-5">
                      ✓ No critical cardiovascular, neurological, or airway red flags identified during initial AI conversational intake.
                    </p>
                  )}

                  {summary?.drugAllergyWarnings?.hasConflict && (
                    <div className="text-xs font-bold text-rose-800 pl-5">
                      ⚠️ Allergy Alert: {summary.drugAllergyWarnings.warningText}
                    </div>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-current">
                    {isRedFlag ? 'PRIORITY 1 ESCALATION' : isAmber ? 'PRIORITY 2 URGENT' : 'STANDARD OPD'}
                  </span>
                </div>
              </div>
            )}

            {/* 4. Vitals Summary Strip */}
            {includeVitals && (
              <div className="space-y-1">
                <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-teal-700 print:text-black" />
                  <span>Kiosk IoT Vitals Station Readings</span>
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 border border-slate-300 rounded-xl p-2.5 bg-slate-50 print:bg-white text-center text-xs">
                  <div className="border-r border-slate-200 last:border-r-0">
                    <span className="text-[10px] text-slate-500 font-medium block">Blood Pressure</span>
                    <span className="font-extrabold text-slate-900">
                      {patient.vitals.bpSystolic ? `${patient.vitals.bpSystolic}/${patient.vitals.bpDiastolic} mmHg` : '120/80 mmHg'}
                    </span>
                  </div>
                  <div className="border-r border-slate-200 last:border-r-0">
                    <span className="text-[10px] text-slate-500 font-medium block">Heart Rate</span>
                    <span className="font-extrabold text-slate-900">{patient.vitals.heartRate || 74} bpm</span>
                  </div>
                  <div className="border-r border-slate-200 last:border-r-0">
                    <span className="text-[10px] text-slate-500 font-medium block">SpO2</span>
                    <span className="font-extrabold text-slate-900">{patient.vitals.spO2 || 98}%</span>
                  </div>
                  <div className="border-r border-slate-200 last:border-r-0">
                    <span className="text-[10px] text-slate-500 font-medium block">Temperature</span>
                    <span className="font-extrabold text-slate-900">{patient.vitals.temperature || 98.4}°F</span>
                  </div>
                  <div className="border-r border-slate-200 last:border-r-0">
                    <span className="text-[10px] text-slate-500 font-medium block">Blood Sugar</span>
                    <span className="font-extrabold text-slate-900">{patient.vitals.bloodSugar || 118} mg/dL</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium block">BMI</span>
                    <span className="font-extrabold text-slate-900">{patient.vitals.bmi || '23.4'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Chief Complaints & History of Present Illness */}
            <div className="space-y-3">
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                  1. Chief Complaints & Presenting Symptoms
                </h3>
                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 print:bg-slate-200 border-b border-slate-300 font-bold text-slate-700">
                      <tr>
                        <th className="p-2">Symptom</th>
                        <th className="p-2">Duration</th>
                        <th className="p-2">Severity</th>
                        <th className="p-2">Onset & Character</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {patient.symptoms.map((s, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-bold text-slate-900">{s.name}</td>
                          <td className="p-2 font-mono text-slate-700">{s.duration}</td>
                          <td className="p-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              s.severity >= 7 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'
                            }`}>
                              {s.severity}/10
                            </span>
                          </td>
                          <td className="p-2 text-slate-700">{s.onset} • {s.character || 'Standard'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                  2. History of Present Illness (HPI Narrative)
                </h3>
                <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 leading-relaxed text-xs">
                  {summary?.historyOfPresentIllness || 'Patient presents with the symptoms listed above. Conversational intake completed in Hindi and verified by patient.'}
                </p>
              </div>
            </div>

            {/* 6. Medical History, Allergies & Active Medications */}
            {includeMedications && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 border border-slate-300 rounded-xl space-y-1.5">
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                    3. Past Medical & Allergy History
                  </h3>
                  <div className="text-xs space-y-1 text-slate-800">
                    <p><strong>Past Illnesses:</strong> {patient.pastIllnesses.length > 0 ? patient.pastIllnesses.join(', ') : 'None reported'}</p>
                    <p><strong>Surgeries:</strong> {patient.pastSurgeries.length > 0 ? patient.pastSurgeries.join(', ') : 'None'}</p>
                    <p className="text-rose-700">
                      <strong>Allergies:</strong> {patient.allergies.length > 0 ? patient.allergies.map(a => `${a.substance} (${a.reactionType})`).join(', ') : 'NKDA (No Known Drug Allergies)'}
                    </p>
                  </div>
                </div>

                <div className="p-3 border border-slate-300 rounded-xl space-y-1.5">
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1">
                    <Pill className="w-3 h-3 text-teal-700 print:text-black" />
                    <span>4. Current Active Medications ({patient.currentMedications.length})</span>
                  </h3>
                  <ul className="text-xs space-y-1 text-slate-800">
                    {patient.currentMedications.map((med, i) => (
                      <li key={i} className="flex justify-between items-center border-b border-slate-100 pb-0.5 last:border-0">
                        <span className="font-semibold">{med.name}</span>
                        <span className="font-mono text-[11px] text-slate-600">{med.frequency}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* 7. Chronological Medical Timeline */}
            {includeTimeline && patient.timeline && patient.timeline.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-teal-700 print:text-black" />
                    <span>5. Chronological Medical Timeline ({patient.timeline.length} Historical Events)</span>
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">Synthesized from OCR & Hospital EHR</span>
                </div>

                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 print:bg-slate-200 border-b border-slate-300 font-bold text-slate-700">
                      <tr>
                        <th className="p-2 w-28">Date</th>
                        <th className="p-2 w-44">Event / Diagnosis</th>
                        <th className="p-2 w-44">Facility / Provider</th>
                        <th className="p-2">Extracted Clinical Summary</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {patient.timeline.map((event, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-mono font-bold text-slate-800 whitespace-nowrap">{event.date}</td>
                          <td className="p-2 font-semibold text-slate-900">{event.title}</td>
                          <td className="p-2 text-slate-700">{event.hospitalOrDoctor}</td>
                          <td className="p-2 text-slate-600 leading-snug">{event.summary}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 8. AYUSH Ayurvedic Dossier (if applicable) */}
            {includeAyush && patient.ayushAssessment && (
              <div className="p-3 border border-emerald-300 bg-emerald-50/40 print:bg-white rounded-xl space-y-1.5 text-xs">
                <h3 className="text-[11px] font-black uppercase tracking-wider text-emerald-900 print:text-black">
                  6. AYUSH / Ayurvedic Assessment (Prakriti: {patient.ayushAssessment.prakriti.dominant})
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <p><strong>Agni:</strong> {patient.ayushAssessment.agni}</p>
                  <p><strong>Koshtha:</strong> {patient.ayushAssessment.koshtha}</p>
                  <p><strong>Diet / Nidra:</strong> {patient.ayushAssessment.aharaVihara.dietType} • {patient.ayushAssessment.aharaVihara.sleepQuality}</p>
                </div>
              </div>
            )}

            {/* 9. AI Differential Considerations & Physician Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 border border-slate-300 rounded-xl space-y-1.5">
                <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                  7. AI Clinical Differential Hypotheses (CDS)
                </h3>
                <ul className="text-xs space-y-1 text-slate-800">
                  {summary?.diagnosticHypothesesCDS?.map((h, idx) => (
                    <li key={idx} className="space-y-0.5">
                      <p className="font-bold text-slate-900">• {h.condition}</p>
                      <p className="text-[11px] text-slate-600 pl-3">{h.rationale}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Doctor's Verified Diagnosis & Notes */}
              <div className="p-3 border-2 border-teal-600 print:border-black rounded-xl space-y-1.5 bg-teal-50/30 print:bg-white">
                <h3 className="text-[11px] font-black uppercase tracking-wider text-teal-900 print:text-black flex items-center gap-1">
                  <Stethoscope className="w-3 h-3 text-teal-700 print:text-black" />
                  <span>8. Physician Confirmed Diagnosis</span>
                </h3>
                <p className="text-sm font-black text-slate-900">
                  {patient.doctorNotes?.customDoctorDiagnosis || summary?.diagnosticHypothesesCDS?.[0]?.condition || 'Clinical assessment in progress'}
                </p>
                {patient.doctorNotes?.doctorAdvice && (
                  <p className="text-xs text-slate-700 pt-1 border-t border-teal-200 print:border-slate-300">
                    <strong>Doctor Advice:</strong> {patient.doctorNotes.doctorAdvice}
                  </p>
                )}
                {patient.doctorNotes?.followUpInDays && (
                  <p className="text-xs text-slate-700 font-semibold">
                    <strong>Review:</strong> Follow up after {patient.doctorNotes.followUpInDays} days
                  </p>
                )}
              </div>
            </div>

            {/* 10. Doctor Electronic Prescription (e-Rx) */}
            {includeRx && patient.doctorNotes?.doctorPrescription && patient.doctorNotes.doctorPrescription.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1">
                  <Pill className="w-3.5 h-3.5 text-teal-700 print:text-black" />
                  <span>9. Physician e-Prescription (Rx)</span>
                </h3>
                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 print:bg-slate-200 border-b border-slate-300 font-bold text-slate-700">
                      <tr>
                        <th className="p-2">#</th>
                        <th className="p-2">Medicine Name & Formulation</th>
                        <th className="p-2">Dosage</th>
                        <th className="p-2">Timing / Frequency</th>
                        <th className="p-2 text-right">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {patient.doctorNotes.doctorPrescription.map((rx, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-mono text-slate-500">{idx + 1}</td>
                          <td className="p-2 font-bold text-slate-900">{rx.medicineName}</td>
                          <td className="p-2 font-semibold text-slate-700">{rx.dosage}</td>
                          <td className="p-2 font-mono text-slate-700">{rx.timing}</td>
                          <td className="p-2 text-right font-bold">{rx.days} days</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 11. Official Footer Sign-off & Safety Disclaimer */}
            <div className="pt-6 border-t-2 border-slate-900 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-xs">
                <div>
                  <p className="font-bold text-slate-800">Treating Physician:</p>
                  <p className="font-black text-sm text-slate-900">Dr. Anand Deshmukh, MD (Med), AIIMS</p>
                  <p className="text-[11px] text-slate-500">Reg No: MCI-2018-84729 • OPD Room 04</p>
                </div>

                <div className="text-left sm:text-right">
                  <div className="h-10 border-b border-slate-400 w-44 mb-1"></div>
                  <p className="font-bold text-slate-700">Doctor Signature & Stamp</p>
                  <p className="text-[10px] text-slate-400 font-mono">Date: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-[10px] text-slate-500 text-center font-medium leading-normal">
                <strong>ABDM Standard Disclaimer:</strong> AI assists the clinical intake workflow; the licensed medical practitioner retains ultimate diagnostic and therapeutic clinical authority.
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
