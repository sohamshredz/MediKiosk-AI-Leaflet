import React, { useState } from 'react';
import { PatientVitals, TriageRiskLevel } from '../../types';
import { Heart, Activity, Thermometer, Wind, Droplet, Weight, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

interface VitalsStationProps {
  vitals: PatientVitals;
  triageRisk: TriageRiskLevel;
  redFlags: string[];
  onChangeVitals: (updatedVitals: PatientVitals) => void;
  onEvaluateTriage: () => void;
}

export const VitalsStation: React.FC<VitalsStationProps> = ({
  vitals,
  triageRisk,
  redFlags,
  onChangeVitals,
  onEvaluateTriage
}) => {
  const [localVitals, setLocalVitals] = useState<PatientVitals>(vitals);

  const handleUpdate = (field: keyof PatientVitals, val: number | undefined) => {
    const updated = { ...localVitals, [field]: val };
    
    // Auto calculate BMI if height and weight present
    if (updated.weightKg && updated.heightCm && updated.heightCm > 50) {
      const heightM = updated.heightCm / 100;
      updated.bmi = parseFloat((updated.weightKg / (heightM * heightM)).toFixed(1));
    }

    setLocalVitals(updated);
    onChangeVitals(updated);
  };

  const applyVitalsPreset = (presetType: 'normal' | 'cardiac_alert' | 'respiratory_alert') => {
    let preset: PatientVitals = {};
    if (presetType === 'normal') {
      preset = {
        bpSystolic: 120,
        bpDiastolic: 80,
        heartRate: 72,
        spO2: 99,
        temperature: 98.4,
        respiratoryRate: 16,
        bloodSugar: 98,
        weightKg: 68,
        heightCm: 170,
        bmi: 23.5,
        recordedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    } else if (presetType === 'cardiac_alert') {
      preset = {
        bpSystolic: 158,
        bpDiastolic: 98,
        heartRate: 104,
        spO2: 93,
        temperature: 98.6,
        respiratoryRate: 22,
        bloodSugar: 218,
        weightKg: 78,
        heightCm: 168,
        bmi: 27.6,
        recordedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    } else if (presetType === 'respiratory_alert') {
      preset = {
        bpSystolic: 110,
        bpDiastolic: 70,
        heartRate: 118,
        spO2: 89,
        temperature: 103.2,
        respiratoryRate: 32,
        bloodSugar: 140,
        weightKg: 55,
        heightCm: 160,
        bmi: 21.5,
        recordedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }

    setLocalVitals(preset);
    onChangeVitals(preset);
    setTimeout(() => onEvaluateTriage(), 100);
  };

  return (
    <div id="vitals-station-container" className="space-y-6">
      {/* Header Info */}
      <div className="p-4 bg-teal-50/80 rounded-xl border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-teal-950 text-base sm:text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" />
            Kiosk Vitals & Emergency Triage Evaluation
          </h3>
          <p className="text-xs sm:text-sm text-teal-800">
            Read from connected kiosk IoT sensors or enter nurse triage vitals. The AI continuously checks for red flags.
          </p>
        </div>

        {/* Quick Kiosk Sensor Simulator Presets */}
        <div className="flex flex-wrap gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => applyVitalsPreset('normal')}
            className="px-2.5 py-1.5 bg-white hover:bg-teal-100 text-teal-800 border border-teal-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Normal Vitals
          </button>
          <button
            type="button"
            onClick={() => applyVitalsPreset('cardiac_alert')}
            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-rose-600" /> Test Cardiac Alert
          </button>
          <button
            type="button"
            onClick={() => applyVitalsPreset('respiratory_alert')}
            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Test Hypoxemia
          </button>
        </div>
      </div>

      {/* Emergency Red Flag Banner if Triggered */}
      {triageRisk === 'CRITICAL_EMERGENCY' && (
        <div className="p-4 bg-rose-600 text-white rounded-2xl shadow-lg border-2 border-rose-700 flex items-start gap-3 animate-pulse">
          <AlertTriangle className="w-7 h-7 text-white shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-extrabold text-base uppercase tracking-wider">
              🚨 CRITICAL EMERGENCY RED-FLAG DETECTED
            </h4>
            <p className="text-xs text-rose-100 leading-relaxed">
              Patient exhibits high-risk vital signs or acute distress. Immediate priority alert sent to Emergency Room & OPD Triage Nurse.
            </p>
            {redFlags.length > 0 && (
              <ul className="text-xs text-white font-medium list-disc list-inside pt-1">
                {redFlags.map((flag, i) => (
                  <li key={i}>{flag}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Vitals Form Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Blood Pressure */}
        <div className={`p-3.5 rounded-xl border ${
          (localVitals.bpSystolic && localVitals.bpSystolic >= 140) ? 'bg-rose-50 border-rose-300' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase">Blood Pressure</span>
            <Activity className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={localVitals.bpSystolic || ''}
              onChange={(e) => handleUpdate('bpSystolic', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="120"
              className="w-14 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-sm text-center"
            />
            <span className="font-bold text-slate-400">/</span>
            <input
              type="number"
              value={localVitals.bpDiastolic || ''}
              onChange={(e) => handleUpdate('bpDiastolic', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="80"
              className="w-14 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-sm text-center"
            />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">mmHg</span>
        </div>

        {/* Pulse / Heart Rate */}
        <div className={`p-3.5 rounded-xl border ${
          (localVitals.heartRate && (localVitals.heartRate > 100 || localVitals.heartRate < 55)) ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase">Heart Rate</span>
            <Heart className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <input
              type="number"
              value={localVitals.heartRate || ''}
              onChange={(e) => handleUpdate('heartRate', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="72"
              className="w-20 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-sm text-center"
            />
            <span className="text-[10px] text-slate-500 font-medium">bpm</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Normal: 60-100</span>
        </div>

        {/* Oxygen Saturation SpO2 */}
        <div className={`p-3.5 rounded-xl border ${
          (localVitals.spO2 && localVitals.spO2 < 94) ? 'bg-rose-50 border-rose-300' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase">SpO2 Oxygen</span>
            <Wind className="w-4 h-4 text-sky-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <input
              type="number"
              value={localVitals.spO2 || ''}
              onChange={(e) => handleUpdate('spO2', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="98"
              className="w-20 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-sm text-center"
            />
            <span className="text-[10px] text-slate-500 font-medium">%</span>
          </div>
          <span className={`text-[10px] font-bold mt-1 block ${localVitals.spO2 && localVitals.spO2 < 94 ? 'text-rose-600' : 'text-slate-500'}`}>
            {localVitals.spO2 && localVitals.spO2 < 94 ? '⚠️ Hypoxemia' : 'Normal: ≥ 95%'}
          </span>
        </div>

        {/* Temperature */}
        <div className={`p-3.5 rounded-xl border ${
          (localVitals.temperature && localVitals.temperature > 99.5) ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase">Temperature</span>
            <Thermometer className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <input
              type="number"
              step="0.1"
              value={localVitals.temperature || ''}
              onChange={(e) => handleUpdate('temperature', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="98.4"
              className="w-20 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-sm text-center"
            />
            <span className="text-[10px] text-slate-500 font-medium">°F</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Normal: 98.4°F</span>
        </div>

        {/* Blood Sugar */}
        <div className={`p-3.5 rounded-xl border ${
          (localVitals.bloodSugar && localVitals.bloodSugar > 180) ? 'bg-rose-50 border-rose-300' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase">Blood Glucose</span>
            <Droplet className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <input
              type="number"
              value={localVitals.bloodSugar || ''}
              onChange={(e) => handleUpdate('bloodSugar', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="110"
              className="w-20 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-sm text-center"
            />
            <span className="text-[10px] text-slate-500 font-medium">mg/dL</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">RBS / Fasting</span>
        </div>

        {/* Weight & BMI */}
        <div className="p-3.5 rounded-xl border bg-white border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase">Weight & BMI</span>
            <Weight className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <input
              type="number"
              value={localVitals.weightKg || ''}
              onChange={(e) => handleUpdate('weightKg', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="70"
              className="w-16 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-sm text-center"
            />
            <span className="text-[10px] text-slate-500 font-medium">kg</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block font-semibold">
            BMI: {localVitals.bmi || '24.2'} kg/m²
          </span>
        </div>
      </div>
    </div>
  );
};
