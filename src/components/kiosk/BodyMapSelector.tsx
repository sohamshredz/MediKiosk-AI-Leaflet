import React, { useState } from 'react';
import { SymptomItem } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../data/indianLanguages';
import { Activity, Plus, Trash2, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';

interface BodyMapSelectorProps {
  language: string;
  symptoms: SymptomItem[];
  onAddSymptom: (symptom: SymptomItem) => void;
  onRemoveSymptom: (id: string) => void;
}

const BODY_REGIONS = [
  { id: 'head', name: 'Head & Neck', nativeKey: 'head', icon: '🧠', common: ['Severe Headache', 'Dizziness / Giddiness', 'Blurry Vision', 'Memory Loss', 'Throbbing Migraine'] },
  { id: 'throat', name: 'Throat & ENT', nativeKey: 'throat', icon: '🗣️', common: ['Sore Throat', 'Difficulty Swallowing (Dysphagia)', 'Persistent Cough', 'Ear Pain / Discharge', 'Nasal Congestion'] },
  { id: 'chest', name: 'Chest & Heart', nativeKey: 'chest', icon: '🫀', common: ['Chest Pain / Tightness', 'Shortness of Breath (Dyspnea)', 'Palpitations', 'Wheezing', 'Chest Heaviness on Exertion'] },
  { id: 'abdomen', name: 'Stomach & Digestion', nativeKey: 'abdomen', icon: '🥣', common: ['Abdominal Pain / Cramps', 'Severe Acidity / Heartburn', 'Nausea / Vomiting', 'Bloating / Gas', 'Loose Motions / Diarrhea', 'Severe Constipation'] },
  { id: 'spine', name: 'Back & Spine', nativeKey: 'spine', icon: '🦴', common: ['Lower Back Pain (Lumbago)', 'Neck Stiffness (Cervical)', 'Sciatica Pain Radiating to Leg', 'Spinal Tenderness'] },
  { id: 'limbs', name: 'Arms, Legs & Joints', nativeKey: 'limbs', icon: '🦵', common: ['Knee Joint Pain (Sandhishula)', 'Morning Joint Stiffness', 'Swollen Feet / Edema', 'Shoulder Immobility', 'Muscle Weakness'] },
  { id: 'skin', name: 'Skin & Allergy', nativeKey: 'skin', icon: '🩹', common: ['Itchy Skin Rash (Urticaria)', 'Non-healing Ulcer / Wound', 'Boils / Abscess', 'Yellowish Skin (Jaundice)'] },
  { id: 'systemic', name: 'Whole Body / General', nativeKey: 'systemic', icon: '🌡️', common: ['High Fever with Chills', 'Extreme Fatigue / Weakness', 'Unexplained Weight Loss', 'Profuse Night Sweats'] }
];

export const BodyMapSelector: React.FC<BodyMapSelectorProps> = ({
  language,
  symptoms,
  onAddSymptom,
  onRemoveSymptom
}) => {
  const [selectedRegion, setSelectedRegion] = useState<string>('chest');
  const [customSymptomName, setCustomSymptomName] = useState('');
  const [severity, setSeverity] = useState<number>(6);
  const [duration, setDuration] = useState<string>('3 days');
  const [onset, setOnset] = useState<'sudden' | 'gradual'>('gradual');
  const [character, setCharacter] = useState<string>('Dull ache');

  const langInfo = SUPPORTED_LANGUAGES[language as keyof typeof SUPPORTED_LANGUAGES] || SUPPORTED_LANGUAGES.en;
  const currentRegionData = BODY_REGIONS.find((r) => r.id === selectedRegion) || BODY_REGIONS[0];

  const handleAdd = (nameToUse?: string) => {
    const symptomName = (nameToUse || customSymptomName).trim();
    if (!symptomName) return;

    const newSymptom: SymptomItem = {
      id: 'sym-' + Date.now(),
      name: symptomName,
      bodyPart: selectedRegion,
      severity,
      duration,
      onset,
      character,
    };

    onAddSymptom(newSymptom);
    setCustomSymptomName('');
  };

  const getSeverityColor = (val: number) => {
    if (val <= 3) return 'bg-emerald-500 text-white';
    if (val <= 6) return 'bg-amber-500 text-white';
    return 'bg-rose-600 text-white animate-pulse';
  };

  return (
    <div id="body-map-selector-container" className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-teal-50/80 rounded-xl border border-teal-200">
        <div>
          <h3 className="font-bold text-teal-950 text-base sm:text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" />
            Touch-Friendly Anatomical Symptom Picker
          </h3>
          <p className="text-xs sm:text-sm text-teal-800">
            Tap a body area to choose common complaints or type in your specific symptoms.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-teal-100 text-teal-800 rounded-full self-start sm:self-auto">
          {symptoms.length} Symptoms Recorded
        </span>
      </div>

      {/* Body Region Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {BODY_REGIONS.map((region) => {
          const isSelected = selectedRegion === region.id;
          const localizedName = langInfo.bodyParts[region.nativeKey] || region.name;
          const hasSymptom = symptoms.some((s) => s.bodyPart === region.id);

          return (
            <button
              key={region.id}
              id={`region-btn-${region.id}`}
              type="button"
              onClick={() => setSelectedRegion(region.id)}
              className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between min-h-[90px] ${
                isSelected
                  ? 'border-teal-600 bg-teal-600 text-white shadow-md ring-2 ring-teal-200'
                  : hasSymptom
                  ? 'border-teal-300 bg-teal-50 text-teal-950 hover:bg-teal-100/70'
                  : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{region.icon}</span>
                {hasSymptom && !isSelected && (
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-600 ring-2 ring-white"></span>
                )}
              </div>
              <div>
                <p className={`font-bold text-xs sm:text-sm leading-snug ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                  {localizedName}
                </p>
                <p className={`text-[11px] mt-0.5 ${isSelected ? 'text-teal-100' : 'text-slate-500'}`}>
                  {region.name}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail Input Panel for Selected Region */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentRegionData.icon}</span>
            <div>
              <h4 className="font-bold text-slate-900 text-base">
                {langInfo.bodyParts[currentRegionData.nativeKey] || currentRegionData.name}
              </h4>
              <p className="text-xs text-slate-500">Select standard symptom or enter custom details</p>
            </div>
          </div>
        </div>

        {/* Quick Common Symptoms for this Region */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Common Complaints in this Area (Tap to Add)
          </label>
          <div className="flex flex-wrap gap-2">
            {currentRegionData.common.map((symptomText) => {
              const alreadyAdded = symptoms.some((s) => s.name === symptomText);
              return (
                <button
                  key={symptomText}
                  type="button"
                  onClick={() => handleAdd(symptomText)}
                  className={`px-3 py-2 text-xs sm:text-sm rounded-lg font-medium border transition-all flex items-center gap-1.5 ${
                    alreadyAdded
                      ? 'bg-teal-50 border-teal-300 text-teal-800'
                      : 'bg-slate-50 hover:bg-teal-50/60 border-slate-200 text-slate-700 hover:border-teal-300'
                  }`}
                >
                  {alreadyAdded ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  {symptomText}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Symptom Input & Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Or Type Custom Symptom
            </label>
            <div className="flex gap-2">
              <input
                id="custom-symptom-input"
                type="text"
                value={customSymptomName}
                onChange={(e) => setCustomSymptomName(e.target.value)}
                placeholder="e.g. Radiating pain to jaw, severe acidity..."
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd();
                }}
              />
              <button
                type="button"
                onClick={() => handleAdd()}
                disabled={!customSymptomName.trim()}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {/* Character of Pain */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Nature / Character
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['Dull ache', 'Sharp / Stabbing', 'Burning', 'Crushing / Pressure', 'Throbbing', 'Colicky'].map((char) => (
                  <button
                    key={char}
                    type="button"
                    onClick={() => setCharacter(char)}
                    className={`px-2.5 py-1 text-xs rounded-lg border font-medium ${
                      character === char
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {char}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Severity & Duration */}
          <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {/* Severity Slider */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Pain / Severity Level
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${getSeverityColor(severity)}`}>
                  {severity} / 10 {severity >= 8 ? '(Severe / Red Flag)' : severity >= 5 ? '(Moderate)' : '(Mild)'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={severity}
                onChange={(e) => setSeverity(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>1 (Mild)</span>
                <span>5 (Moderate)</span>
                <span>10 (Worst Possible)</span>
              </div>
            </div>

            {/* Duration & Onset */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                >
                  <option value="Few hours">Few hours</option>
                  <option value="1-2 days">1-2 days</option>
                  <option value="3 days">3 days</option>
                  <option value="1 week">1 week</option>
                  <option value="2 weeks">2 weeks</option>
                  <option value="1 month">1 month</option>
                  <option value="3+ months (Chronic)">3+ months (Chronic)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Onset</label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setOnset('gradual')}
                    className={`flex-1 py-1.5 text-xs rounded-lg font-medium border ${
                      onset === 'gradual' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Gradual
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnset('sudden')}
                    className={`flex-1 py-1.5 text-xs rounded-lg font-medium border ${
                      onset === 'sudden' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Sudden
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Currently Added Symptoms List */}
      {symptoms.length > 0 && (
        <div className="p-4 bg-slate-100/80 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              Recorded Complaints for Doctor's Summary ({symptoms.length})
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {symptoms.map((s) => (
              <div
                key={s.id}
                className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-start justify-between gap-3"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${getSeverityColor(s.severity)}`}>
                      {s.severity}/10
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{s.name}</span>
                  </div>
                  <div className="text-xs text-slate-500 flex flex-wrap gap-2">
                    <span>⏱️ {s.duration}</span>
                    <span>• {s.onset} onset</span>
                    {s.character && <span>• {s.character}</span>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveSymptom(s.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Remove symptom"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
