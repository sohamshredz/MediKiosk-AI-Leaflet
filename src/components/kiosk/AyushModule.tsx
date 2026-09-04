import React, { useState } from 'react';
import { AyushAssessment } from '../../types';
import { Sparkles, Moon, Sun, Flame, Wind, Droplets, Check, Compass } from 'lucide-react';

interface AyushModuleProps {
  ayushData?: AyushAssessment;
  onChange: (updated: AyushAssessment) => void;
}

export const AyushModule: React.FC<AyushModuleProps> = ({
  ayushData,
  onChange
}) => {
  const [data, setData] = useState<AyushAssessment>(
    ayushData || {
      prakriti: {
        dominant: 'Vata-Pitta',
        vataScore: 65,
        pittaScore: 50,
        kaphaScore: 30,
      },
      agni: 'Vishama (Irregular)',
      koshtha: 'Krura (Hard/Constipated)',
      aharaVihara: {
        dietType: 'Vegetarian',
        dominantRasaPreferences: ['Katu (Spicy)', 'Lavana (Salty)'],
        waterIntake: '1-2 Litres',
        sleepQuality: 'Alpa (Disturbed/Insomnia)',
        bowelHabits: 'Irregular, dry stools once every 2 days',
        physicalActivity: 'Alpa (Sedentary)',
      },
      ashtavidhaParikshaNotes: {
        nadi: 'Vata-Pradhana (Sarpa Gati)',
        jihva: 'Sama (Mild white coating at base)',
        mala: 'Krura, Vibandha',
        sparsha: 'Sheeta / Ruksha (Dry & cold)',
      },
      suggestedPathyaApathya: {
        pathya: [
          'Ushnodaka (Warm water intake)',
          'Go-Ghrita (Warm cow ghee with meals)',
          'Local Janu Basti / Patra Pinda Sweda for joint lubrication',
          'Light warm khichadi with Jeera & Shunthi'
        ],
        apathya: [
          'Sheeta Ahara (Refrigerated food, ice creams, cold drinks)',
          'Dadhi (Curd at night), Chana, Rajma',
          'Ratri Jagarana (Staying awake late at night)'
        ]
      }
    }
  );

  const handleUpdatePrakriti = (vata: number, pitta: number, kapha: number) => {
    let dominant: any = 'Tridosha';
    if (vata > pitta && vata > kapha) dominant = vata - pitta < 20 ? 'Vata-Pitta' : 'Vata';
    else if (pitta > vata && pitta > kapha) dominant = pitta - vata < 20 ? 'Pitta-Vata' : 'Pitta';
    else if (kapha > vata && kapha > pitta) dominant = kapha - pitta < 20 ? 'Kapha-Pitta' : 'Kapha';

    const updated: AyushAssessment = {
      ...data,
      prakriti: { dominant, vataScore: vata, pittaScore: pitta, kaphaScore: kapha }
    };
    setData(updated);
    onChange(updated);
  };

  const handleUpdateAgni = (agni: any) => {
    const updated = { ...data, agni };
    setData(updated);
    onChange(updated);
  };

  const handleUpdateKoshtha = (koshtha: any) => {
    const updated = { ...data, koshtha };
    setData(updated);
    onChange(updated);
  };

  const handleUpdateDiet = (field: string, val: any) => {
    const updated = {
      ...data,
      aharaVihara: { ...data.aharaVihara, [field]: val }
    };
    setData(updated);
    onChange(updated);
  };

  return (
    <div id="ayush-assessment-module" className="space-y-6">
      {/* Header */}
      <div className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-emerald-950 text-base sm:text-lg flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-700" />
            AYUSH & Ayurvedic Clinical Assessment Module
          </h3>
          <p className="text-xs sm:text-sm text-emerald-800">
            Systematic pre-consultation evaluation of Prakriti, Agni (digestive fire), Koshtha (bowels), Ahara-Vihara (diet & lifestyle), and Dashavidha Pariksha.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full shrink-0">
          Dominant: {data.prakriti.dominant}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 1. Prakriti & Tridosha Radar Card */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              1. Prakriti (Constitutional Balance)
            </h4>
          </div>

          <div className="space-y-3">
            {/* Vata */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1 text-sky-700">
                  <Wind className="w-3.5 h-3.5" /> Vata (Movement / Air & Space)
                </span>
                <span>{data.prakriti.vataScore}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full" style={{ width: `${data.prakriti.vataScore}%` }} />
              </div>
            </div>

            {/* Pitta */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1 text-amber-700">
                  <Flame className="w-3.5 h-3.5" /> Pitta (Transformation / Fire & Water)
                </span>
                <span>{data.prakriti.pittaScore}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${data.prakriti.pittaScore}%` }} />
              </div>
            </div>

            {/* Kapha */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1 text-emerald-700">
                  <Droplets className="w-3.5 h-3.5" /> Kapha (Structure / Earth & Water)
                </span>
                <span>{data.prakriti.kaphaScore}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${data.prakriti.kaphaScore}%` }} />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
            {[
              { label: 'Vata-Pitta (Dry, Sensitive, Agile)', v: 65, p: 50, k: 30 },
              { label: 'Pitta-Kapha (Warm, Strong built)', v: 30, p: 65, k: 50 },
              { label: 'Kapha-Vata (Heavy, Slow)', v: 45, p: 25, k: 70 },
              { label: 'Sama Prakriti (Tridosha Balanced)', v: 33, p: 33, k: 33 }
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleUpdatePrakriti(preset.v, preset.p, preset.k)}
                className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 rounded-lg transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Agni (Digestive Fire) Assessment */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-600" />
            2. Agni (Metabolism & Appetite)
          </h4>

          <div className="space-y-2">
            {[
              {
                id: 'Vishama (Irregular)' as const,
                title: 'Vishama Agni (Irregular)',
                desc: 'Sometimes very hungry, sometimes poor appetite. Gas, bloating, variable digestion (Vata predominant).'
              },
              {
                id: 'Manda (Low)' as const,
                title: 'Manda Agni (Sluggish / Low)',
                desc: 'Poor appetite, heavy feeling in stomach for hours after eating, coated tongue (Kapha predominant).'
              },
              {
                id: 'Tikshna (Intense)' as const,
                title: 'Tikshna Agni (Intense / Acidic)',
                desc: 'Excessive hunger, acid reflux, heartburn, irritable if meals delayed (Pitta predominant).'
              },
              {
                id: 'Sama (Balanced)' as const,
                title: 'Sama Agni (Balanced)',
                desc: 'Healthy, timely hunger, proper digestion in 3-4 hours without heaviness or gas.'
              }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleUpdateAgni(item.id)}
                className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                  data.agni === item.id
                    ? 'bg-amber-50 border-amber-400 text-amber-950 font-semibold ring-1 ring-amber-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{item.title}</span>
                  {data.agni === item.id && <Check className="w-3.5 h-3.5 text-amber-600" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Koshtha & Bowels Assessment */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-600" />
            3. Koshtha (Digestive Tract & Bowels)
          </h4>

          <div className="space-y-2">
            {[
              {
                id: 'Krura (Hard/Constipated)' as const,
                title: 'Krura Koshtha (Hard / Constipated)',
                desc: 'Hard, dry stools, difficulty passing bowels without strong laxatives or warm fluids (Vata).'
              },
              {
                id: 'Mridu (Soft/Frequent)' as const,
                title: 'Mridu Koshtha (Soft / Sensitive)',
                desc: 'Very quick evacuation, loose motions triggered by milk, spices, or mild oils (Pitta).'
              },
              {
                id: 'Madhyama (Regular)' as const,
                title: 'Madhyama Koshtha (Regular / Normal)',
                desc: 'Standard daily bowel movement once in the morning with moderate consistency.'
              }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleUpdateKoshtha(item.id)}
                className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                  data.koshtha === item.id
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold ring-1 ring-emerald-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{item.title}</span>
                  {data.koshtha === item.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
              </button>
            ))}
          </div>

          {/* Sleep Quality */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-indigo-600" /> Nidra (Sleep Quality)
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'Gadha (Deep)' as const, label: 'Deep (Gadha)' },
                { id: 'Alpa (Disturbed/Insomnia)' as const, label: 'Disturbed (Alpa)' },
                { id: 'Khandita (Broken)' as const, label: 'Broken (Khandita)' }
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleUpdateDiet('sleepQuality', s.id)}
                  className={`py-1.5 px-2 text-[11px] rounded-lg border font-medium text-center ${
                    data.aharaVihara.sleepQuality === s.id
                      ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Pathya & Apathya Preview */}
      {data.suggestedPathyaApathya && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" /> Suggested Pathya (Wholesome Regimen)
            </span>
            <ul className="space-y-1 text-xs text-slate-700">
              {data.suggestedPathyaApathya.pathya.map((p, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-600">✓</span> {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
              <span className="text-rose-600 font-bold">✕</span> Suggested Apathya (To Avoid)
            </span>
            <ul className="space-y-1 text-xs text-slate-700">
              {data.suggestedPathyaApathya.apathya.map((ap, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-rose-600">✕</span> {ap}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
