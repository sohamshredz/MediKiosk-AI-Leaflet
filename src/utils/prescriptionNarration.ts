import { PrescriptionMedication, SupportedLanguage } from '../types';
import { SUPPORTED_LANGUAGES } from '../data/indianLanguages';

export interface PrescriptionNarrationInput {
  patientName?: string;
  doctorName?: string;
  hospitalName?: string;
  prescriptionDate?: string;
  diagnosis?: string;
  symptoms?: string;
  medications: PrescriptionMedication[];
  recommendedTests?: string[];
  followUpDate?: string;
  generalAdvice?: string;
  verificationStatus?: 'idle' | 'pending' | 'verified' | 'unavailable' | 'failed';
}

/**
 * Mapping of 10 Indian supported languages with speech codes and display names
 */
export const PRESCRIPTION_VOICE_LANGUAGES: {
  code: SupportedLanguage;
  locale: string;
  name: string;
  nativeName: string;
  flag: string;
}[] = [
  { code: 'en', locale: 'en-IN', name: 'English', nativeName: 'English', flag: '🇮🇳' },
  { code: 'hi', locale: 'hi-IN', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr', locale: 'mr-IN', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'ta', locale: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', locale: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'bn', locale: 'bn-IN', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'gu', locale: 'gu-IN', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'kn', locale: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', locale: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'pa', locale: 'pa-IN', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
];

/**
 * Finds an installed SpeechSynthesisVoice matching the language code in priority order:
 * 1. Exact locale match (e.g. 'hi-IN', 'ta-IN')
 * 2. Base language prefix match (e.g. 'hi', 'ta', 'te')
 * 
 * Returns null if no voice is available for that language (prevents silently speaking wrong language).
 */
export function getVoiceForLanguage(
  languageCode: SupportedLanguage | string,
  availableVoices?: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  const voices = availableVoices && availableVoices.length > 0 
    ? availableVoices 
    : window.speechSynthesis.getVoices();

  if (!voices || voices.length === 0) {
    return null;
  }

  const targetLang = (languageCode || 'en').toLowerCase();
  const baseCode = targetLang.split(/[-_]/)[0];
  const langConfig = SUPPORTED_LANGUAGES[baseCode as SupportedLanguage] || SUPPORTED_LANGUAGES.en;
  const exactSpeechCode = (langConfig?.speechCode || `${baseCode}-IN`).toLowerCase();

  // 1. Exact locale match (e.g. 'hi-in', 'hi_in')
  const exactMatch = voices.find(v => {
    const vLang = v.lang.replace('_', '-').toLowerCase();
    return vLang === exactSpeechCode || vLang === `${baseCode}-in`;
  });
  if (exactMatch) return exactMatch;

  // 2. Base language match (e.g. starts with 'hi', 'ta', 'te')
  const baseMatch = voices.find(v => {
    const vLang = v.lang.replace('_', '-').toLowerCase();
    return vLang.startsWith(`${baseCode}-`) || vLang === baseCode;
  });
  if (baseMatch) return baseMatch;

  // 3. For English specifically, match any English voice (en-US, en-GB, en-AU, etc.)
  if (baseCode === 'en') {
    const enMatch = voices.find(v => v.lang.toLowerCase().startsWith('en'));
    if (enMatch) return enMatch;
  }

  // Do NOT return random voice for Indic languages if device lacks speech engine
  return null;
}

/**
 * Checks if voice playback is physically supported on this device for the selected language
 */
export function isVoiceAvailableForLanguage(
  languageCode: SupportedLanguage | string,
  availableVoices?: SpeechSynthesisVoice[]
): boolean {
  return getVoiceForLanguage(languageCode, availableVoices) !== null;
}

/**
 * Generates natural, empathetic, and clinically clear spoken audio narration
 * for the patient's authenticated prescription across 10 Indian languages.
 * 
 * Strict safety rules:
 * 1. Excludes internal IDs, database codes, confidence numbers, or tech logs.
 * 2. Clearly describes medicine names, strengths, dosages, schedules, and food instructions.
 * 3. Mentions explicit diagnosis and symptoms ONLY if present in the document.
 * 4. NEVER invents or hallucinates unwritten clinical information.
 */
export function generatePrescriptionNarration(
  data: PrescriptionNarrationInput,
  language: SupportedLanguage | string = 'en'
): string {
  const lang = (language || 'en').toLowerCase().slice(0, 2);
  const {
    patientName,
    doctorName,
    hospitalName,
    prescriptionDate,
    diagnosis,
    symptoms,
    medications = [],
    recommendedTests = [],
    followUpDate,
    generalAdvice,
    verificationStatus
  } = data;

  const hasExplicitDiag = diagnosis && 
    !diagnosis.toLowerCase().includes('not explicitly') && 
    !diagnosis.toLowerCase().includes('not detected') && 
    !diagnosis.toLowerCase().includes('unclear');

  const hasExplicitSymp = symptoms && 
    !symptoms.toLowerCase().includes('no symptoms') && 
    !symptoms.toLowerCase().includes('not detected') && 
    !symptoms.toLowerCase().includes('unclear');

  const validDoctor = doctorName && !doctorName.toLowerCase().includes('not detected') && !doctorName.toLowerCase().includes('unclear') ? doctorName : '';
  const validHospital = hospitalName && !hospitalName.toLowerCase().includes('not detected') && !hospitalName.toLowerCase().includes('unclear') ? hospitalName : '';

  // 1. HINDI (hi)
  if (lang === 'hi') {
    const parts: string[] = [];
    parts.push(`नमस्ते ${patientName || 'मरीज़'} जी। यह आपकी प्रिस्क्रिप्शन की जानकारी है।`);

    if (validDoctor) {
      parts.push(`डॉक्टर: ${validDoctor}।`);
    } else {
      parts.push('डॉक्टर का नाम उपलब्ध नहीं है।');
    }

    if (validHospital) {
      parts.push(`अस्पताल: ${validHospital}।`);
    }

    if (prescriptionDate) {
      parts.push(`प्रिस्क्रिप्शन की तारीख: ${prescriptionDate} है।`);
    }

    if (hasExplicitDiag) {
      parts.push(`पर्ची पर लिखा गया निदान: ${diagnosis}।`);
    } else {
      parts.push('प्रिस्क्रिप्शन में कोई स्पष्ट निदान उल्लेखित नहीं है।');
    }

    if (hasExplicitSymp) {
      parts.push(`लिखे गए लक्षण: ${symptoms}।`);
    }

    if (medications.length > 0) {
      parts.push(`निर्धारित दवाएं: कुल ${medications.length} दवाएं लिखी गई हैं।`);
      medications.forEach((med, idx) => {
        const num = idx + 1;
        const name = med.medicineName || 'दवा';
        const str = med.strength ? ` ${med.strength}` : '';
        const dose = med.dosage ? `, खुराक ${med.dosage}` : '';
        const freq = med.frequency ? `, ${med.frequency}` : '';
        const dur = med.duration ? `, ${med.duration} तक` : '';
        const food = med.foodInstruction ? `, ${med.foodInstruction}` : '';
        const spec = med.specialInstruction ? `। विशेष निर्देश: ${med.specialInstruction}` : '';
        parts.push(`दवा नंबर ${num}: ${name}${str}${dose}${freq}${dur}${food}${spec}।`);
      });
    } else {
      parts.push('प्रिस्क्रिप्शन में कोई दवा स्पष्ट रूप से नहीं मिली है। कृपया मूल पर्ची की जाँच करें।');
    }

    if (recommendedTests && recommendedTests.length > 0) {
      parts.push(`सलाह दी गई जांचें: ${recommendedTests.join(', ')}।`);
    }

    if (followUpDate) {
      parts.push(`अगली मुलाक़ात: ${followUpDate}।`);
    }

    if (generalAdvice) {
      parts.push(`सामान्य सलाह: ${generalAdvice}।`);
    }

    if (verificationStatus === 'verified') {
      parts.push('यह प्रिस्क्रिप्शन मेडिकल डेटाबेस द्वारा सत्यापित कर ली गई है।');
    }

    return parts.join(' ');
  }

  // 2. MARATHI (mr)
  if (lang === 'mr') {
    const parts: string[] = [];
    parts.push(`नमस्कार ${patientName || 'रुग्ण'} जी. हा आपल्या प्रिस्क्रिप्शनचा तपशील आहे.`);

    if (validDoctor) {
      parts.push(`डॉक्टर: ${validDoctor}.`);
    } else {
      parts.push('डॉक्टरांचे नाव उपलब्ध नाही.');
    }

    if (validHospital) parts.push(`रुग्णालय: ${validHospital}.`);
    if (prescriptionDate) parts.push(`प्रिस्क्रिप्शनची तारीख: ${prescriptionDate}.`);

    if (hasExplicitDiag) {
      parts.push(`नोंदवलेले निदान: ${diagnosis}.`);
    } else {
      parts.push('प्रिस्क्रिप्शनमध्ये कोणतेही स्पष्ट निदान नमूद केलेले नाही.');
    }

    if (hasExplicitSymp) parts.push(`नोंदवलेली लक्षणे: ${symptoms}.`);

    if (medications.length > 0) {
      parts.push(`निर्धारित औषधे: एकूण ${medications.length} औषधे लिहिलेली आहेत.`);
      medications.forEach((med, idx) => {
        const num = idx + 1;
        const name = med.medicineName || 'औषध';
        const str = med.strength ? ` ${med.strength}` : '';
        const dose = med.dosage ? `, डोस ${med.dosage}` : '';
        const freq = med.frequency ? `, ${med.frequency}` : '';
        const dur = med.duration ? `, ${med.duration} साठी` : '';
        const food = med.foodInstruction ? `, ${med.foodInstruction}` : '';
        const spec = med.specialInstruction ? `. विशेष सूचना: ${med.specialInstruction}` : '';
        parts.push(`औषध क्रमांक ${num}: ${name}${str}${dose}${freq}${dur}${food}${spec}.`);
      });
    } else {
      parts.push('प्रिस्क्रिप्शनमध्ये कोणतीही औषधे स्पष्टपणे आढळली नाहीत.');
    }

    if (recommendedTests && recommendedTests.length > 0) {
      parts.push(`तपासण्या: ${recommendedTests.join(', ')}.`);
    }
    if (followUpDate) parts.push(`पुढील भेट: ${followUpDate}.`);
    if (generalAdvice) parts.push(`सल्ला: ${generalAdvice}.`);

    return parts.join(' ');
  }

  // 3. TAMIL (ta)
  if (lang === 'ta') {
    const parts: string[] = [];
    parts.push(`வணக்கம் ${patientName || 'நோயாளி'}. இது உங்கள் மருந்துச் சீட்டின் விவரம் ஆகும்.`);

    if (validDoctor) {
      parts.push(`மருத்துவர்: ${validDoctor}.`);
    } else {
      parts.push('மருத்துவர் பெயர் கிடைக்கவில்லை.');
    }

    if (validHospital) parts.push(`மருத்துவமனை: ${validHospital}.`);
    if (prescriptionDate) parts.push(`தேதி: ${prescriptionDate}.`);

    if (hasExplicitDiag) {
      parts.push(`நோய் விவரம்: ${diagnosis}.`);
    } else {
      parts.push('மருந்துச் சீட்டில் தெளிவான நோய் விவரம் குறிப்பிடப்படவில்லை.');
    }

    if (hasExplicitSymp) parts.push(`அறிகுறிகள்: ${symptoms}.`);

    if (medications.length > 0) {
      parts.push(`பரிந்துரைக்கப்பட்ட மருந்துகள்: மொத்தம் ${medications.length} மருந்துகள் உள்ளன.`);
      medications.forEach((med, idx) => {
        const num = idx + 1;
        const name = med.medicineName || 'மருந்து';
        const str = med.strength ? ` ${med.strength}` : '';
        const dose = med.dosage ? `, அளவு ${med.dosage}` : '';
        const freq = med.frequency ? `, ${med.frequency}` : '';
        const dur = med.duration ? `, ${med.duration} நாட்களுக்கு` : '';
        const food = med.foodInstruction ? `, ${med.foodInstruction}` : '';
        parts.push(`மருந்து எண் ${num}: ${name}${str}${dose}${freq}${dur}${food}.`);
      });
    } else {
      parts.push('மருந்துச் சீட்டில் மருந்துகள் எதுவும் தெளிவாகக் கண்டறியப்படவில்லை.');
    }

    if (recommendedTests && recommendedTests.length > 0) {
      parts.push(`பரிந்துரைக்கப்பட்ட சோதனைகள்: ${recommendedTests.join(', ')}.`);
    }
    if (followUpDate) parts.push(`அடுத்த மருத்துவ சந்திப்பு: ${followUpDate}.`);

    return parts.join(' ');
  }

  // 4. TELUGU (te)
  if (lang === 'te') {
    const parts: string[] = [];
    parts.push(`నమస్కారం ${patientName || 'రోగి'} గారు. ఇది మీ ప్రిస్క్రిప్షన్ వివరాలు.`);

    if (validDoctor) {
      parts.push(`వైద్యులు: ${validDoctor}.`);
    } else {
      parts.push('వైద్యుల పేరు అందుబాటులో లేదు.');
    }

    if (validHospital) parts.push(`హాస్పిటల్: ${validHospital}.`);
    if (prescriptionDate) parts.push(`తేదీ: ${prescriptionDate}.`);

    if (hasExplicitDiag) {
      parts.push(`రోగ నిర్ధారణ: ${diagnosis}.`);
    } else {
      parts.push('ప్రిస్క్రిప్షన్‌లో ఎటువంటి స్పష్టమైన రోగ నిర్ధారణ పేర్కొనబడలేదు.');
    }

    if (hasExplicitSymp) parts.push(`లక్షణాలు: ${symptoms}.`);

    if (medications.length > 0) {
      parts.push(`సూచించిన మందులు: మొత్తం ${medications.length} మందులు రాయబడ్డాయి.`);
      medications.forEach((med, idx) => {
        const num = idx + 1;
        const name = med.medicineName || 'మందు';
        const str = med.strength ? ` ${med.strength}` : '';
        const dose = med.dosage ? `, మోతాదు ${med.dosage}` : '';
        const freq = med.frequency ? `, ${med.frequency}` : '';
        const dur = med.duration ? `, ${med.duration} పాటు` : '';
        const food = med.foodInstruction ? `, ${med.foodInstruction}` : '';
        parts.push(`మందు సంఖ్య ${num}: ${name}${str}${dose}${freq}${dur}${food}.`);
      });
    } else {
      parts.push('ప్రిస్క్రిప్షన్‌లో మందులు ఏవీ స్పష్టంగా కనుగొనబడలేదు.');
    }

    if (recommendedTests && recommendedTests.length > 0) {
      parts.push(`సూచించిన పరీక్షలు: ${recommendedTests.join(', ')}.`);
    }
    if (followUpDate) parts.push(`తదుపరి సందర్శన: ${followUpDate}.`);

    return parts.join(' ');
  }

  // 5. BENGALI (bn)
  if (lang === 'bn') {
    const parts: string[] = [];
    parts.push(`নমস্কার ${patientName || 'রোগী'}। এটি আপনার প্রেসক্রিপশনের বিবরণ।`);

    if (validDoctor) {
      parts.push(`ডাক্তার: ${validDoctor}।`);
    } else {
      parts.push('ডাক্তারের নাম উপলব্ধ নেই।');
    }

    if (validHospital) parts.push(`হাসপাতাল: ${validHospital}।`);
    if (prescriptionDate) parts.push(`তারিখ: ${prescriptionDate}।`);

    if (hasExplicitDiag) {
      parts.push(`রোগ নির্ণয়: ${diagnosis}।`);
    } else {
      parts.push('প্রেসক্রিপশনে কোনো স্পষ্ট রোগ নির্ণয় উল্লেখ করা হয়নি।');
    }

    if (hasExplicitSymp) parts.push(`লক্ষণ: ${symptoms}।`);

    if (medications.length > 0) {
      parts.push(`প্রেসক্রাইব করা ওষুধ: মোট ${medications.length}টি ওষুধ রয়েছে।`);
      medications.forEach((med, idx) => {
        const num = idx + 1;
        const name = med.medicineName || 'ওষুধ';
        const str = med.strength ? ` ${med.strength}` : '';
        const dose = med.dosage ? `, মাত্রা ${med.dosage}` : '';
        const freq = med.frequency ? `, ${med.frequency}` : '';
        const dur = med.duration ? `, ${med.duration} দিনের জন্য` : '';
        const food = med.foodInstruction ? `, ${med.foodInstruction}` : '';
        parts.push(`ওষুধ নম্বর ${num}: ${name}${str}${dose}${freq}${dur}${food}।`);
      });
    } else {
      parts.push('প্রেসক্রিপশনে কোনো ওষুধ স্পষ্ট পাওয়া যায়নি।');
    }

    if (recommendedTests && recommendedTests.length > 0) {
      parts.push(`পরীক্ষা নিরীক্ষা: ${recommendedTests.join(', ')}।`);
    }
    if (followUpDate) parts.push(`পরবর্তী চেকআপ: ${followUpDate}।`);

    return parts.join(' ');
  }

  // 6. GUJARATI (gu)
  if (lang === 'gu') {
    const parts: string[] = [];
    parts.push(`નમસ્તે ${patientName || 'દર્દી'}. આ તમારા પ્રિસ્ક્રિપ્શનની વિગતો છે.`);

    if (validDoctor) {
      parts.push(`ડૉક્ટર: ${validDoctor}.`);
    } else {
      parts.push('ડૉક્ટરનું નામ ઉપલબ્ધ નથી.');
    }

    if (validHospital) parts.push(`હોસ્પિટલ: ${validHospital}.`);
    if (prescriptionDate) parts.push(`તારીખ: ${prescriptionDate}.`);

    if (hasExplicitDiag) {
      parts.push(`નિદાન: ${diagnosis}.`);
    } else {
      parts.push('પ્રિસ્ક્રિપ્શનમાં કોઈ સ્પષ્ટ નિદાન જણાવેલ નથી.');
    }

    if (hasExplicitSymp) parts.push(`લક્ષણો: ${symptoms}.`);

    if (medications.length > 0) {
      parts.push(`લખાયેલ દવાઓ: કુલ ${medications.length} દવાઓ છે.`);
      medications.forEach((med, idx) => {
        const num = idx + 1;
        const name = med.medicineName || 'દવા';
        const str = med.strength ? ` ${med.strength}` : '';
        const dose = med.dosage ? `, માત્રા ${med.dosage}` : '';
        const freq = med.frequency ? `, ${med.frequency}` : '';
        const dur = med.duration ? `, ${med.duration} માટે` : '';
        const food = med.foodInstruction ? `, ${med.foodInstruction}` : '';
        parts.push(`દવા નંબર ${num}: ${name}${str}${dose}${freq}${dur}${food}.`);
      });
    } else {
      parts.push('પ્રિસ્ક્રિપ્શનમાં કોઈ દવા સ્પષ્ટ મળી નથી.');
    }

    return parts.join(' ');
  }

  // 7. KANNADA (kn)
  if (lang === 'kn') {
    const parts: string[] = [];
    parts.push(`ನಮಸ್ಕಾರ ${patientName || 'ರೋಗಿ'}. ಇದು ನಿಮ್ಮ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ವಿವರಗಳು.`);

    if (validDoctor) {
      parts.push(`ವೈದ್ಯರು: ${validDoctor}.`);
    } else {
      parts.push('ವೈದ್ಯರ ಹೆಸರು ಲಭ್ಯವಿಲ್ಲ.');
    }

    if (validHospital) parts.push(`ಆಸ್ಪತ್ರೆ: ${validHospital}.`);
    if (prescriptionDate) parts.push(`ದಿನಾಂಕ: ${prescriptionDate}.`);

    if (hasExplicitDiag) {
      parts.push(`ರೋಗನಿರ್ಣಯ: ${diagnosis}.`);
    } else {
      parts.push('ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್‌ನಲ್ಲಿ ಯಾವುದೇ ಸ್ಪಷ್ಟ ರೋಗನಿರ್ಣಯವನ್ನು ಉಲ್ಲೇಖಿಸಲಾಗಿಲ್ಲ.');
    }

    if (hasExplicitSymp) parts.push(`ರೋಗಲಕ್ಷಣಗಳು: ${symptoms}.`);

    if (medications.length > 0) {
      parts.push(`ಶಿಫಾರಸು ಮಾಡಿದ ಔಷಧಿಗಳು: ಒಟ್ಟು ${medications.length} ಔಷಧಿಗಳಿವೆ.`);
      medications.forEach((med, idx) => {
        const num = idx + 1;
        const name = med.medicineName || 'ಔಷಧಿ';
        const str = med.strength ? ` ${med.strength}` : '';
        const dose = med.dosage ? `, ಪ್ರಮಾಣ ${med.dosage}` : '';
        const freq = med.frequency ? `, ${med.frequency}` : '';
        const dur = med.duration ? `, ${med.duration} ವರೆಗೆ` : '';
        const food = med.foodInstruction ? `, ${med.foodInstruction}` : '';
        parts.push(`ಔಷಧಿ ಸಂಖ್ಯೆ ${num}: ${name}${str}${dose}${freq}${dur}${food}.`);
      });
    }

    return parts.join(' ');
  }

  // 8. MALAYALAM (ml)
  if (lang === 'ml') {
    const parts: string[] = [];
    parts.push(`നമസ്കാരം ${patientName || 'രോഗി'}. ഇതാണ് നിങ്ങളുടെ പ്രിസ്ക്രിപ്ഷൻ വിവരങ്ങൾ.`);

    if (validDoctor) {
      parts.push(`ഡോക്ടർ: ${validDoctor}.`);
    } else {
      parts.push('ഡോക്ടറുടെ പേര് ലഭ്യമല്ല.');
    }

    if (validHospital) parts.push(`ആശുപത്രി: ${validHospital}.`);
    if (prescriptionDate) parts.push(`തീയതി: ${prescriptionDate}.`);

    if (hasExplicitDiag) {
      parts.push(`രോഗനിർണയം: ${diagnosis}.`);
    } else {
      parts.push('പ്രിസ്ക്രിപ്ഷനിൽ വ്യക്തമായ രോഗനിർണയം പരാമർശിച്ചിട്ടില്ല.');
    }

    if (hasExplicitSymp) parts.push(`ലക്ഷണങ്ങൾ: ${symptoms}.`);

    if (medications.length > 0) {
      parts.push(`നിർദ്ദേശിച്ച മരുന്നുകൾ: ആകെ ${medications.length} മരുന്നുകൾ ഉണ്ട്.`);
      medications.forEach((med, idx) => {
        const num = idx + 1;
        const name = med.medicineName || 'മരുന്ന്';
        const str = med.strength ? ` ${med.strength}` : '';
        const dose = med.dosage ? `, അളവ് ${med.dosage}` : '';
        const freq = med.frequency ? `, ${med.frequency}` : '';
        const dur = med.duration ? `, ${med.duration} ദിവസത്തേക്ക്` : '';
        const food = med.foodInstruction ? `, ${med.foodInstruction}` : '';
        parts.push(`മരുന്ന് നമ്പർ ${num}: ${name}${str}${dose}${freq}${dur}${food}.`);
      });
    }

    return parts.join(' ');
  }

  // 9. PUNJABI (pa)
  if (lang === 'pa') {
    const parts: string[] = [];
    parts.push(`ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ${patientName || 'ਮਰੀਜ਼'} ਜੀ। ਇਹ ਤੁਹਾਡੀ ਪਰਚੀ ਦਾ ਵੇਰਵਾ ਹੈ।`);

    if (validDoctor) {
      parts.push(`ਡਾਕਟਰ: ${validDoctor}।`);
    } else {
      parts.push('ਡਾਕਟਰ ਦਾ ਨਾਮ ਉਪਲਬਧ ਨਹੀਂ ਹੈ।');
    }

    if (validHospital) parts.push(`ਹਸਪਤਾਲ: ${validHospital}।`);
    if (prescriptionDate) parts.push(`ਤਾਰੀਖ: ${prescriptionDate}।`);

    if (hasExplicitDiag) {
      parts.push(`ਬਿਮਾਰੀ: ${diagnosis}।`);
    } else {
      parts.push('ਪਰਚੀ ਵਿੱਚ ਕੋਈ ਸਪੱਸ਼ਟ ਬਿਮਾਰੀ ਜਾਂ ਨਿਦਾਨ ਨਹੀਂ ਲਿਖਿਆ ਗਿਆ।');
    }

    if (hasExplicitSymp) parts.push(`ਲੱਛਣ: ${symptoms}।`);

    if (medications.length > 0) {
      parts.push(`ਦਵਾਈਆਂ ਦਾ ਵੇਰਵਾ: ਕੁੱਲ ${medications.length} ਦਵਾਈਆਂ ਲਿਖੀਆਂ ਗਈਆਂ ਹਨ।`);
      medications.forEach((med, idx) => {
        const num = idx + 1;
        const name = med.medicineName || 'ਦਵਾਈ';
        const str = med.strength ? ` ${med.strength}` : '';
        const dose = med.dosage ? `, ਖ਼ੁਰਾਕ ${med.dosage}` : '';
        const freq = med.frequency ? `, ${med.frequency}` : '';
        const dur = med.duration ? `, ${med.duration} ਲਈ` : '';
        const food = med.foodInstruction ? `, ${med.foodInstruction}` : '';
        parts.push(`ਦਵਾਈ ਨੰਬਰ ${num}: ${name}${str}${dose}${freq}${dur}${food}।`);
      });
    }

    return parts.join(' ');
  }

  // 10. DEFAULT: ENGLISH (en)
  const parts: string[] = [];
  parts.push(`Hello ${patientName ? patientName : 'Patient'}, here is the summary of your prescription.`);

  if (validDoctor) {
    parts.push(`Doctor: ${validDoctor}.`);
  } else {
    parts.push('Doctor name was not detected.');
  }

  if (validHospital) {
    parts.push(`Facility: ${validHospital}.`);
  }

  if (prescriptionDate) {
    parts.push(`Prescription Date: ${prescriptionDate}.`);
  }

  if (hasExplicitDiag) {
    parts.push(`Diagnosis explicitly noted: ${diagnosis}.`);
  } else {
    parts.push('Diagnosis was not explicitly mentioned in the prescription.');
  }

  if (hasExplicitSymp) {
    parts.push(`Symptoms explicitly noted: ${symptoms}.`);
  }

  if (medications.length > 0) {
    parts.push(`There are ${medications.length} prescribed medication${medications.length > 1 ? 's' : ''}:`);
    medications.forEach((med, idx) => {
      const num = idx + 1;
      const name = med.medicineName || 'Medication';
      const str = med.strength ? ` ${med.strength}` : '';
      const dose = med.dosage ? `, take ${med.dosage}` : '';
      const freq = med.frequency ? `, ${med.frequency}` : '';
      const dur = med.duration ? ` for ${med.duration}` : '';
      const route = med.route && med.route !== 'Oral' ? ` via ${med.route}` : '';
      const food = med.foodInstruction ? `, ${med.foodInstruction}` : '';
      const spec = med.specialInstruction ? `. Instructions: ${med.specialInstruction}` : '';
      parts.push(`Medicine ${num}: ${name}${str}${dose}${route}${freq}${dur}${food}${spec}.`);
    });
  } else {
    parts.push('No specific medications were clearly identified. Please check the original prescription document.');
  }

  if (recommendedTests && recommendedTests.length > 0) {
    parts.push(`Recommended diagnostic tests: ${recommendedTests.join(', ')}.`);
  }

  if (followUpDate) {
    parts.push(`Follow-up recommendation: ${followUpDate}.`);
  }

  if (generalAdvice) {
    parts.push(`General advice: ${generalAdvice}.`);
  }

  if (verificationStatus === 'verified') {
    parts.push('This prescription has been verified against the medical terminology database.');
  }

  return parts.join(' ');
}
