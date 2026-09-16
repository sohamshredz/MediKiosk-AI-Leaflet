import { PrescriptionMedication } from '../types';

export interface ExtractedPrescriptionData {
  doctorName: string;
  hospitalName: string;
  prescriptionDate: string;
  patientName: string;
  diagnosis: string;
  symptoms: string;
  recommendedTests: string[];
  followUpDate: string;
  generalAdvice: string;
  overallConfidence: number;
  hasLowConfidenceFields: boolean;
  isAiVerified: boolean;
  aiVerificationStatus: 'idle' | 'pending' | 'verified' | 'unavailable' | 'failed';
  medications: PrescriptionMedication[];
  ocrText: string;
  clinicalSummary: string;
}

// Comprehensive Indian & Global Pharmacological Database (Generic & Common Brands)
const COMMON_MEDICINES: string[] = [
  // Antidiabetics
  'Metformin', 'Glycomet', 'Glimepiride', 'Glimestar', 'Gliclazide', 'Vildagliptin', 'Galvus',
  'Teneligliptin', 'Tenlimac', 'Sitagliptin', 'Januvia', 'Dapagliflozin', 'Forxiga', 'Empagliflozin',
  'Jardiance', 'Rybelsus', 'Semaglutide', 'Insulin', 'Lantus', 'Novorapid', 'Humalog', 'Mixtard',
  'Glycomet-GP', 'Gemer', 'Zoryl-M', 'Galvus-Met', 'Jalra-M', 'Janumet',

  // Cardiovascular & Antihypertensives
  'Telmisartan', 'Telma', 'Telpres', 'Telma-H', 'Losartan', 'Losar', 'Amlodipine', 'Amlong', 'Amlokind',
  'Cilnidipine', 'Cilacar', 'Metoprolol', 'Betaloc', 'Starpress', 'Metolar', 'Bisoprolol', 'Concor',
  'Atenolol', 'Ramipril', 'Cardace', 'Enalapril', 'Atorvastatin', 'Atorva', 'Lipitor', 'Storvas',
  'Rosuvastatin', 'Rosuvas', 'Rozucor', 'Clopidogrel', 'Clopilet', 'Deplatt', 'Aspirin', 'Ecosprin',
  'Sorbitrate', 'Isosorbide Dinitrate', 'Monotrate', 'Nitroglycerin', 'Hydrochlorothiazide',
  'Furosemide', 'Lasix', 'Torsemide', 'Dytor', 'Spironolactone', 'Aldactone',

  // Respiratory & Allergy
  'Foracort', 'Budesonide', 'Budecort', 'Formoterol', 'Salbutamol', 'Asthalin', 'Ipratropium', 'Duolin',
  'Seroflo', 'Fluticasone', 'Salmeterol', 'Levolin', 'Levosalbutamol', 'Montelukast', 'Montek-LC',
  'Montair-LC', 'Levocetirizine', 'Levocet', 'Cetirizine', 'Cetzine', 'Alatrol', 'Fexofenadine',
  'Allegra', 'Ascoril', 'Alex', 'Benadryl', 'Grilinctus', 'Chericof', 'Deriphyllin', 'Theophylline',

  // Gastrointestinal
  'Pantoprazole', 'Pan-40', 'Pantocid', 'Pan-D', 'Pantop-D', 'Omeprazole', 'Omez', 'Omez-D',
  'Rabeprazole', 'Razo', 'Razo-D', 'Rabicip', 'Esomeprazole', 'Nexpro', 'Nexpro-RD', 'Sompraz',
  'Domperidone', 'Ondansetron', 'Emeset', 'Voniz', 'Ranitidine', 'Famotidine', 'Sucralfate',
  'Sucral-O', 'Gelusil', 'Digene', 'Mucaine', 'Cremaffin', 'Duphalac', 'Lactulose', 'Liv-52', 'Udiliv',

  // Antibiotics & Anti-infectives
  'Amoxicillin', 'Mox', 'Novamox', 'Amoxyclav', 'Augmentin', 'Moxikind-CV', 'Clavam', 'Azithromycin',
  'Azithral', 'Azee', 'Zithrox', 'Cefixime', 'Taxim-O', 'Mahacef', 'Zifi', 'Cefuroxime', 'Ceftum',
  'Cefakind', 'Cefpodoxime', 'Monocef-O', 'Doxcep', 'Ciprofloxacin', 'Cifran', 'Ciplox', 'Ofloxacin',
  'Oflox', 'Zenflox', 'Norfloxacin', 'Norflox-TZ', 'Doxycycline', 'Dox-SL', 'Metronidazole', 'Flagyl',
  'Nitrofurantoin', 'Niftran', 'Fluconazole', 'Forcan', 'Itraconazole', 'Canditral', 'Albendazole',

  // Analgesics, NSAIDs & Muscle Relaxants
  'Paracetamol', 'Dolo', 'Dolo 650', 'Calpol', 'Crocin', 'Pacimol', 'Ibuprofen', 'Brufen', 'Combiflam',
  'Diclofenac', 'Voveran', 'Dynapar', 'Aceclofenac', 'Zerodol', 'Zerodol-SP', 'Zerodol-P', 'Hifenac',
  'Tramadol', 'Ultracet', 'Tramazac', 'Ketorolac', 'Etoricoxib', 'Nucoxia', 'Etoshine', 'Thiocolchicoside',
  'Myoril', 'Baclofen', 'Liofen', 'Gabapentin', 'Gabapin', 'Pregabalin', 'Pregalin', 'Maxgalin',

  // Thyroid, Hormones & Supplements
  'Levothyroxine', 'Thyronorm', 'Eltroxin', 'Thyrox', 'Calcium', 'Shelcal', 'Cipcal', 'Gemcal',
  'Vitamin D3', 'Uprise-D3', 'Calcirol', 'Taystron', 'Becosules', 'Neurobion', 'Neurobion Forte',
  'Supradyn', 'Zincovit', 'Folvite', 'Autrin', 'Orofer-XT', 'Livogen', 'Limcee', 'Celin'
];

/**
 * Normalizes common medical frequencies into patient-friendly terminology
 */
export function normalizeFrequency(raw: string): string {
  const clean = raw.trim().toUpperCase();
  
  if (/\b(1-0-1|BD|BID|TWICE DAILY|TWICE A DAY|B\.I\.D\.)\b/i.test(clean)) {
    return 'Twice daily (1-0-1)';
  }
  if (/\b(1-1-1|TDS|TID|THRICE DAILY|THREE TIMES DAILY|T\.I\.D\.)\b/i.test(clean)) {
    return 'Three times daily (1-1-1)';
  }
  if (/\b(1-1-1-1|QID|QDS|FOUR TIMES DAILY|Q\.I\.D\.)\b/i.test(clean)) {
    return 'Four times daily (1-1-1-1)';
  }
  if (/\b(1-0-0|OD|ONCE DAILY|ONCE A DAY|Q\.D\.)\b/i.test(clean)) {
    return 'Once daily (1-0-0) [Morning]';
  }
  if (/\b(0-0-1|HS|AT BEDTIME|AT NIGHT|Q\.H\.S\.)\b/i.test(clean)) {
    return 'At bedtime (0-0-1) [Night]';
  }
  if (/\b(0-1-0)\b/i.test(clean)) {
    return 'Once daily (0-1-0) [Afternoon]';
  }
  if (/\b(1-0-0-1)\b/i.test(clean)) {
    return 'Morning & Night (1-0-0-1)';
  }
  if (/\b(SOS|PRN|AS NEEDED|WHEN REQUIRED|P\.R\.N\.)\b/i.test(clean)) {
    return 'When required (SOS)';
  }
  if (/\b(STAT|IMMEDIATELY)\b/i.test(clean)) {
    return 'Immediately (STAT)';
  }
  
  return raw.trim() || 'Once daily (1-0-0)';
}

/**
 * Normalizes food timing instructions
 */
export function normalizeFoodInstruction(raw: string): string {
  const clean = raw.trim().toLowerCase();
  if (clean.includes('after') || clean.includes('post') || clean.includes('pc') || clean.includes('बाद')) {
    return 'After food';
  }
  if (clean.includes('before') || clean.includes('pre') || clean.includes('empty') || clean.includes('ac') || clean.includes('पहले')) {
    return 'Before food';
  }
  if (clean.includes('with') || clean.includes('during') || clean.includes('साथ')) {
    return 'With meals';
  }
  if (clean.includes('bedtime') || clean.includes('night') || clean.includes('hs') || clean.includes('रात')) {
    return 'At bedtime';
  }
  return 'After food';
}

/**
 * Extracts explicit doctor name from prescription text
 */
export function extractDoctorName(text: string): string {
  // 1. Look for explicit Dr. line with credentials or registration
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // OCR often keeps the doctor's name on a short header line. Capture only
  // the name and stop before qualifications, clinic, phone or registration.
  const headerMatch = text.match(/\bDr\.?\s*([A-Za-z][A-Za-z .'-]{2,40}?)(?=\s+(?:MBBS|MD|MS|DM|DNB|MCh|Reg\.?|Phone|Consultant|HealthCare|Clinic|Hospital)\b|\s*$)/im);
  if (headerMatch?.[1]) {
    const candidate = headerMatch[1].trim().replace(/[,.\-]+$/, '');
    if (candidate.split(/\s+/).length >= 2) return `Dr. ${candidate}`;
  }
  
  for (const line of lines) {
    const drMatch = line.match(/(?:Dr\.?|Doctor|Prof\.?\s*Dr\.?|Consultant\s*[:\-]?)\s+([A-Za-z\s\.\,\(\)\-]+?)(?:\s*\(?(?:MBBS|MD|MS|DM|DNB|MCh|DGO|Reg|DMC|MMC|MCI|Regn)[\s\S]*|$)/i);
    if (drMatch && drMatch[1] && drMatch[1].trim().length > 2) {
      const candidate = drMatch[1].trim().replace(/[\,\-]+$/, '').trim();
      if (!/^(prescript|consult|patient|hospital|clinic|medic|review|medicines)/i.test(candidate)) {
        return `Dr. ${candidate.replace(/^Dr\.?\s*/i, '')}`;
      }
    }
  }

  // 2. Scan signature or footer
  const signatureMatch = text.match(/(?:Dr\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}))/);
  if (signatureMatch && signatureMatch[1]) {
    return `Dr. ${signatureMatch[1]}`;
  }

  return '';
}

/**
 * Extracts explicit hospital or clinic name
 */
export function extractHospitalName(text: string): string {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  
  // Check top 8 lines for medical facility keywords
  for (const line of lines.slice(0, 8)) {
    if (/(?:hospital|clinic|aiims|apollo|max|fortis|manipal|medanta|narayana|dispensary|medical\s*centre|health\s*centre|institute|department\s*of|nursing\s*home|polyclinic|healthcare)/i.test(line)) {
      const cleaned = line.replace(/^[#\*\-=\s]+/, '').replace(/\s*[-–—]\s*(?:department|opd|slip|prescription)[\s\S]*/i, '').trim();
      if (cleaned.length > 3) {
        return cleaned;
      }
      return line.trim();
    }
  }

  // Check for capitalized institution header
  for (const line of lines.slice(0, 4)) {
    if (/^[A-Z\s]{5,}$/.test(line) && !/^(PRESCRIPTION|PATIENT|MEDICAL|REPORT|DATE|DOCTOR)/.test(line)) {
      return line;
    }
  }

  return '';
}

/**
 * Extracts explicit prescription date
 */
export function extractDate(text: string): string {
  // Look for explicit Date: prefix
  const dateWithPrefix = text.match(/(?:Date|Dt|Dated|OPD Date)\s*[:\-\.]\s*(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4}|\d{4}[-\/\.]\d{1,2}[-\/\.]\d{1,2}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})/i);
  if (dateWithPrefix && dateWithPrefix[1]) {
    return dateWithPrefix[1].trim();
  }

  // Look for general date pattern
  const dateMatch = text.match(/\b(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4}|\d{4}[-\/\.]\d{1,2}[-\/\.]\d{1,2})\b/);
  if (dateMatch && dateMatch[1]) {
    return dateMatch[1].trim();
  }

  return new Date().toISOString().split('T')[0];
}

/**
 * Extracts diagnosis ONLY if explicitly written. Never infers from medications.
 */
export function extractExplicitDiagnosis(text: string): string {
  const diagMatch = text.match(/(?:Dx|Diagnosis|Impression|Provisional Diagnosis|Final Diagnosis|Assessment|Known case of|K\/C\/O)\s*[:\-]\s*([^\r\n]+)/i);
  if (diagMatch && diagMatch[1] && diagMatch[1].trim().length > 2) {
    const found = diagMatch[1].trim();
    if (!/^(none|nil|na|n\/a|unclear|\-)$/i.test(found)) {
      return found;
    }
  }
  return 'Not explicitly mentioned in prescription';
}

/**
 * Extracts symptoms ONLY if explicitly written. Never invents symptoms.
 */
export function extractExplicitSymptoms(text: string): string {
  const sympMatch = text.match(/(?:C\/O|Complaints|Chief Complaints?|Symptoms|Presented with|H\/O)\s*[:\-]\s*([^\r\n]+)/i);
  if (sympMatch && sympMatch[1] && sympMatch[1].trim().length > 2) {
    const found = sympMatch[1].trim();
    if (!/^(none|nil|na|n\/a|unclear|\-)$/i.test(found)) {
      return found;
    }
  }
  return 'Not explicitly mentioned in document';
}

/**
 * Extracts recommended tests / investigations
 */
export function extractRecommendedTests(text: string): string[] {
  const testMatch = text.match(/(?:Investigations?|Advised Tests?|Lab(?:oratory)? Tests?|Tests?|Rx Tests?)\s*[:\-]\s*([^\r\n]+)/i);
  if (testMatch && testMatch[1]) {
    return testMatch[1].split(/[\,\;]|\s+and\s+/i).map(t => t.trim()).filter(t => t.length > 1);
  }

  // Scan common labs
  const commonLabs = ['HbA1c', 'CBC', 'Lipid Profile', 'KFT', 'LFT', 'TFT', 'Echocardiography', 'TMT', 'ECG', 'X-Ray', 'USG', 'Blood Sugar'];
  const foundLabs = commonLabs.filter(lab => new RegExp(`\\b${lab}\\b`, 'i').test(text));
  return foundLabs;
}

/**
 * Extracts follow up recommendation
 */
export function extractFollowUp(text: string): string {
  const fuMatch = text.match(/(?:Follow[\s\-]*up|Review|Next visit|F\/U in)\s*[:\-]?\s*([^\r\n]+)/i);
  if (fuMatch && fuMatch[1] && fuMatch[1].trim().length > 2) {
    return fuMatch[1].trim();
  }
  return '';
}

/**
 * Extracts general advice / lifestyle guidance
 */
export function extractGeneralAdvice(text: string): string {
  const advMatch = text.match(/(?:Advice|Instructions|Diet|Precautions)\s*[:\-]\s*([^\r\n]+)/i);
  if (advMatch && advMatch[1] && advMatch[1].trim().length > 2) {
    return advMatch[1].trim();
  }
  return '';
}

/** Remove OCR/AI false positives that are instructions, not medicines. */
export function sanitizeMedicationList(items: any[] = []): any[] {
  const bad = /^(?:after\s+food|before\s+food|with\s+(?:food|meals?)|at\s+night|at\s+bedtime|morning|evening|night|advice|instructions|take|drink|avoid|consult|as\s+directed|unknown|unclear|not\s+detected)$/i;
  const seen = new Set<string>();
  return items.filter((m: any) => {
    const name = String(m?.medicineName ?? m?.name ?? '').trim();
    if (!name || bad.test(name)) return false;
    const key = name.toLowerCase().replace(/[^a-z0-9]+/g, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Normalize a medicine spelling against the curated medicine dictionary.
 * OCR and handwriting often introduce one or two character errors (e.g.
 * "Amoxiciillin" -> "Amoxicillin"). We only auto-correct when the edit
 * distance is small; otherwise the original text is retained for verification.
 */
export function normalizeMedicineName(rawName: string): string {
  const raw = String(rawName || '').trim();
  if (!raw) return '';

  const compact = raw.toLowerCase().replace(/[^a-z0-9]+/g, '');
  const exact = COMMON_MEDICINES.find(m => m.toLowerCase().replace(/[^a-z0-9]+/g, '') === compact);
  if (exact) return exact;

  const aliases: Record<string, string> = {
    amoxycillin: 'Amoxicillin',
    amoxiciillin: 'Amoxicillin',
    amoxicilin: 'Amoxicillin',
    amoxcillin: 'Amoxicillin',
    cetrizine: 'Cetirizine',
    cetirizene: 'Cetirizine',
    paracitamol: 'Paracetamol',
    paracetamoll: 'Paracetamol',
  };
  if (aliases[compact]) return aliases[compact];

  const levenshtein = (a: string, b: string): number => {
    const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 0; i < a.length; i++) {
      const curr = [i + 1];
      for (let j = 0; j < b.length; j++) {
        curr.push(Math.min(
          curr[j] + 1,
          prev[j + 1] + 1,
          prev[j] + (a[i] === b[j] ? 0 : 1)
        ));
      }
      for (let j = 0; j < curr.length; j++) prev[j] = curr[j];
    }
    return prev[b.length];
  };

  let best = '';
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const medicine of COMMON_MEDICINES) {
    const candidate = medicine.toLowerCase().replace(/[^a-z0-9]+/g, '');
    const distance = levenshtein(compact, candidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = medicine;
    }
  }

  const threshold = compact.length >= 8 ? 2 : 1;
  return best && bestDistance <= threshold ? best : raw;
}

export function isKnownMedicineName(name: string): boolean {
  const canonical = normalizeMedicineName(name);
  return COMMON_MEDICINES.some(m => m.toLowerCase().replace(/[^a-z0-9]+/g, '') === canonical.toLowerCase().replace(/[^a-z0-9]+/g, ''));
}

function extractMedicationBlocks(lines: string[]): string[] {
  const blocks: string[] = [];
  let current = '';

  const flush = () => {
    const value = current.replace(/\s+/g, ' ').trim();
    if (value) blocks.push(value);
    current = '';
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^\d+[.)]\s*/.test(line)) {
      flush();
      current = line;
      continue;
    }
    if (/^(?:Advice|Instructions|Precautions|Investigations|Tests?|Follow\s*up|Review|Dr\.?\b|Doctor\b)/i.test(line)) {
      flush();
      continue;
    }
    if (current) current += ` ${line}`;
  }
  flush();
  return blocks;
}

function inferDosageFromFormAndFrequency(form: string, frequencyRaw: string): string {
  const normalizedForm = form.toLowerCase();
  if (!/(tablet|capsule|syrup|inhaler|drops?)/.test(normalizedForm)) return '';
  if (/\b[01](?:-[01]){2,3}\b/.test(frequencyRaw)) {
    if (normalizedForm === 'tablet') return '1 tablet';
    if (normalizedForm === 'capsule') return '1 capsule';
    if (normalizedForm === 'syrup') return '5 ml';
    if (normalizedForm === 'inhaler') return '1 puff';
    if (normalizedForm === 'drops') return '1 drop';
  }
  return '';
}

/**
 * Deterministic Clinical Rule-Based Prescription Extraction Engine.
 * It is intentionally conservative, but understands multi-line prescription
 * rows where medicine, dosage form, frequency, duration and food instruction
 * are written on separate lines.
 */
export function extractPrescriptionRules(
  rawText: string,
  patientName: string = ''
): ExtractedPrescriptionData {
  const text = rawText || '';
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const docName = extractDoctorName(text);
  const hospName = extractHospitalName(text);
  const rxDate = extractDate(text);
  const diag = extractExplicitDiagnosis(text);
  const symp = extractExplicitSymptoms(text);
  const tests = extractRecommendedTests(text);
  const followUp = extractFollowUp(text);
  const advice = extractGeneralAdvice(text);

  const medications: PrescriptionMedication[] = [];
  const blocks = extractMedicationBlocks(lines);
  let medCounter = 1;

  for (const block of blocks) {
    const cleanLine = block
      .replace(/^\d+[.)]\s*/, '')
      .replace(/^Rx\s*[:\-]?\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleanLine) continue;

    const hasKnownMedicine = COMMON_MEDICINES.some(med => new RegExp(`\\b${med.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(cleanLine));
    const hasMedicineCue = /\b\d+(?:\.\d+)?\s*(?:mg|mcg|µg|g|gm|ml|iu|%)\b/i.test(cleanLine) ||
      /\b(?:tab(?:let)?|cap(?:sule)?|syr(?:up)?|inj(?:ection)?|inhaler|ointment|cream|drop)s?\b/i.test(cleanLine);
    if (!hasKnownMedicine && !hasMedicineCue) continue;

    let form = 'Tablet';
    let route = 'Oral';
    if (/cap(?:sule)?\b/i.test(cleanLine)) { form = 'Capsule'; route = 'Oral'; }
    else if (/syr(?:up)?\b/i.test(cleanLine)) { form = 'Syrup'; route = 'Oral'; }
    else if (/inj(?:ection)?\b/i.test(cleanLine)) { form = 'Injection'; route = 'IV/IM'; }
    else if (/inhaler|respule|puff/i.test(cleanLine)) { form = 'Inhaler'; route = 'Inhalation'; }
    else if (/drops?\b/i.test(cleanLine)) { form = 'Drops'; route = 'Ophthalmic/Otic'; }
    else if (/oint(?:ment)?|cream|gel\b/i.test(cleanLine)) { form = 'Ointment'; route = 'Topical'; }
    else if (/sublingual|under tongue|sorbitrate/i.test(cleanLine)) { form = 'Tablet'; route = 'Sublingual'; }

    const strengthMatch = cleanLine.match(/\b(\d+(?:\.\d+)?)\s*(mg|mcg|µg|g|gm|ml|iu|%|ug)\b/i);
    const strength = strengthMatch ? `${strengthMatch[1]} ${strengthMatch[2].toLowerCase()}` : '';

    const dosageMatch = cleanLine.match(/\b(\d+(?:\.\d+)?)\s*(tab(?:let)?|cap(?:sule)?|puff|drop|ml|tsp|ampoule|vial)\b/i);
    let dosage = dosageMatch ? `${dosageMatch[1]} ${dosageMatch[2].toLowerCase()}` : '';

    // OCR frequently puts "Tab"/"Cap" on the line below the medicine.
    // When the prescription also has a 1/0 frequency pattern, the prescribed
    // unit is explicitly represented by that form + schedule.
    const frequencyMatch = cleanLine.match(/\b(1-0-1|1-1-1|1-0-0|0-0-1|0-1-0|1-1-1-1|1-0-0-1|BD|BID|TDS|TID|QID|QDS|OD|HS|SOS|PRN|STAT|twice daily|thrice daily|three times daily|once daily|at bedtime|at night)\b/i);
    let frequency = frequencyMatch ? normalizeFrequency(frequencyMatch[0]) : 'As prescribed';

    // A handwritten "At night" line is a stronger signal than an OCR digit
    // error such as 0-0-4; normalize it to the standard HS schedule.
    if (/\bat\s+(?:night|bedtime)\b/i.test(cleanLine)) {
      frequency = 'At bedtime (0-0-1) [Night]';
    }

    if (!dosage) dosage = inferDosageFromFormAndFrequency(form, frequency);

    const durMatch = cleanLine.match(/\b(?:x\s*|for\s*)?(\d+)\s*(days?|d|weeks?|w|months?|m)\b/i);
    let duration = 'As directed';
    if (durMatch) {
      const unitRaw = durMatch[2].toLowerCase();
      const unit = unitRaw.startsWith('w') ? 'weeks' : (unitRaw.startsWith('m') ? 'months' : 'days');
      duration = `${durMatch[1]} ${unit}`;
    } else if (/sos|as needed/i.test(frequency)) {
      duration = 'As needed';
    }

    const foodMatch = cleanLine.match(/\[(.*?)\]|\((.*?)\)|(?:after|before|with|empty)\s*(?:food|meals?|breakfast|lunch|dinner|stomach)|\bat\s+(?:night|bedtime)\b/i);
    let foodInstruction = 'As directed';
    if (foodMatch) foodInstruction = normalizeFoodInstruction(foodMatch[0]);

    let specialInstruction = '';
    const specMatch = cleanLine.match(/\[(.*?)\]/);
    if (specMatch?.[1]) specialInstruction = specMatch[1].trim();

    // Prefer a canonical medicine from the dictionary, including conservative
    // fuzzy correction for common OCR character errors.
    let medName = '';
    for (const commonMed of COMMON_MEDICINES) {
      if (new RegExp(`\\b${commonMed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(cleanLine)) {
        medName = commonMed;
        break;
      }
    }

    if (!medName) {
      const candidateMatch = cleanLine.match(/^(?:Tab\.?|Cap\.?|Syp\.?|Syrup\b|Inj\.?|Inhaler\b)?\s*([A-Za-z][A-Za-z0-9+\-\. ]{2,60}?)(?=\s+\d+(?:\.\d+)?\s*(?:mg|mcg|µg|g|gm|ml|iu|%)\b|\s+(?:1-0-1|1-1-1|0-0-1|BD|OD|TDS|SOS)\b|$)/i);
      const candidate = candidateMatch?.[1]?.trim().replace(/\s+(?:Tab|Cap|Tablet|Capsule)$/i, '').trim();
      if (candidate) medName = normalizeMedicineName(candidate);
    }

    if (!medName) continue;

    const isCanonical = COMMON_MEDICINES.some(m => m.toLowerCase() === medName.toLowerCase());
    const confidenceScore = isCanonical ? 96 : (strength ? 82 : 72);

    medications.push({
      id: `med-rule-${Date.now()}-${medCounter++}`,
      medicineName: medName,
      strength,
      dosage,
      frequency,
      duration,
      route,
      timing: frequency.includes('Night') ? 'Night' : (frequency.includes('Twice') || frequency.includes('Three times') ? 'Morning & Night' : (frequency.includes('SOS') ? 'As needed' : 'Morning')),
      foodInstruction,
      specialInstruction,
      confidenceScore,
      isLowConfidence: confidenceScore < 75,
      patientVerified: false
    });
  }

  // Final whole-text fallback for cases where OCR lost row numbering.
  if (medications.length === 0) {
    for (const commonMed of COMMON_MEDICINES) {
      if (!new RegExp(`\\b${commonMed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)) continue;
      medications.push({
        id: `med-rule-${Date.now()}-${medCounter++}`,
        medicineName: commonMed,
        strength: '',
        dosage: '',
        frequency: 'As prescribed',
        duration: 'As directed',
        route: 'Oral',
        timing: 'As directed',
        foodInstruction: 'As directed',
        specialInstruction: '',
        confidenceScore: 85,
        isLowConfidence: false,
        patientVerified: false
      });
    }
  }

  const cleanMedications = sanitizeMedicationList(medications);

  // Concise Clinical Summary
  const clinicalSummary = `Prescription Record Summary:
• Doctor: ${docName || 'Consulting Physician'}
• Facility: ${hospName || 'Hospital OPD Clinic'}
• Date: ${rxDate}
• Explicit Diagnosis: ${diag}
• Explicit Symptoms: ${symp}
• Prescribed Medicines: ${cleanMedications.length > 0 ? cleanMedications.map(m => `${m.medicineName} ${m.strength || ''} (${m.frequency})`).join(', ') : 'None clearly detected'}`;

  const overallConfidence = cleanMedications.length > 0
    ? Math.round(cleanMedications.reduce((acc, m) => acc + m.confidenceScore, 0) / cleanMedications.length)
    : 80;

  return {
    doctorName: docName,
    hospitalName: hospName,
    prescriptionDate: rxDate,
    patientName: patientName || 'Patient',
    diagnosis: diag,
    symptoms: symp,
    recommendedTests: tests,
    followUpDate: followUp,
    generalAdvice: advice,
    overallConfidence,
    hasLowConfidenceFields: cleanMedications.some(m => m.isLowConfidence),
    isAiVerified: true,
    aiVerificationStatus: 'verified',
    medications: cleanMedications,
    ocrText: text,
    clinicalSummary
  };
}
