import { SupportedLanguage } from '../types';

export interface EmergencyCheckResult {
  detected: boolean;
  isEmergency?: boolean;
  category?: 'cardiac' | 'respiratory' | 'stroke' | 'hemorrhage' | 'trauma';
  reasons?: string[];
  reasonInLanguage?: string;
  reasonInEnglish?: string;
}

// Emergency keywords across all 10 supported Indian languages
const EMERGENCY_KEYWORDS: Record<string, { category: 'cardiac' | 'respiratory' | 'stroke' | 'hemorrhage' | 'trauma'; terms: string[] }> = {
  cardiac: {
    category: 'cardiac',
    terms: [
      'chest pain', 'chest pressure', 'chest heaviness', 'angina', 'heart attack',
      'सीने में दर्द', 'छाती में दर्द', 'सीने में भारीपन', 'दिल का दौरा',
      'छातीत दुखणे', 'छातीत जडपणा', 'हृदयविकार',
      'நெஞ்சு வலி', 'நெஞ்சு பாரம்', 'மாரடைப்பு',
      'ఛాతీ నొప్పి', 'గుండె నొప్పి', 'ఛాతీలో బరువు',
      'বুকে ব্যথা', 'বুকে চাপ', 'হার্ট অ্যাটাক',
      'છાતીમાં દુખાવો', 'છાતીમાં ભાર', 'હાર્ટ એટેક',
      'ಎದೆ ನೋವು', 'ಎದೆಯಲ್ಲಿ ಭಾರ', 'ಹೃದಯಾಘಾತ',
      'നെഞ്ചുവേദന', 'നെഞ്ചിൽ ഭാരം', 'ഹൃദയാഘാതം',
      'ਛਾਤੀ ਵਿੱਚ ਦਰਦ', 'ਛਾਤੀ ਵਿੱਚ ਭਾਰ', 'ਦਿਲ ਦਾ ਦੌਰਾ'
    ]
  },
  respiratory: {
    category: 'respiratory',
    terms: [
      'breathless', 'breathlessness', 'cannot breathe', 'difficulty breathing', 'shortness of breath', 'choking', 'suffocating',
      'सांस फूल', 'सांस लेने में तकलीफ', 'दम घुटना',
      'धाप लागणे', 'श्वास घेण्यास त्रास',
      'மூச்சுத் திணறல்', 'மூச்சு விட சிரமம்',
      'ఆయాసం', 'శ్వాస ఆడకపోవడం', 'శ్వాస తీసుకోవడంలో ఇబ్బంది',
      'শ্বাসকষ্ট', 'দমবন্ধ', 'শ্বাস নিতে কষ্ট',
      'શ્વાસ ચડવો', 'શ્વાસ લેવામાં તકલીફ',
      'ಉಸಿರಾಟದ ತೊಂದರೆ', 'ಉಸಿರು ಕಟ್ಟುವಿಕೆ',
      'ശ്വാസതടസ്സം', 'ശ്വാസമെടുക്കാൻ ബുദ്ധിമുട്ട്',
      'ਸਾਹ ਚੜ੍ਹਨਾ', 'ਸਾਹ ਲੈਣ ਵਿੱਚ ਤਕਲੀਫ਼'
    ]
  },
  stroke: {
    category: 'stroke',
    terms: [
      'stroke', 'facial droop', 'face drooping', 'slurred speech', 'slur', 'paralysis', 'unconscious', 'fainting', 'fainted',
      'लकवा', 'फालिज', 'आवाज लड़खड़ाना', 'बेहोश', 'चक्कर खाकर गिरना',
      'पक्षाघात', 'लकवा', 'बोलताना अडखळणे', 'बेशुद्ध',
      'பக்கவாதம்', 'பேச்சு குழறுதல்', 'மயக்கம்',
      'పక్షవాతం', 'మాట తడబడడం', 'స్పృహ తప్పడం',
      'স্ট্রোক', 'পক্ষাঘাত', 'কথা জড়িয়ে যাওয়া', 'অজ্ঞান',
      'લકવો', 'પક્ષઘાત', 'બોલવામાં તકલીફ', 'બેભાન',
      'ಪಾರ್ಶ್ವವಾಯು', 'ಮಾತು ತೊದಲುವಿಕೆ', 'ಪ್ರಜ್ಞೆ ತಪ್ಪುವುದು',
      'പക്ഷാഘാതം', 'സംസാര വൈകല്യം', 'ബോധക്ഷയം',
      'ਅਧਰੰਗ', 'ਲਕਵਾ', 'ਬੇਹੋਸ਼'
    ]
  },
  hemorrhage: {
    category: 'hemorrhage',
    terms: [
      'heavy bleeding', 'bleeding heavily', 'coughing blood', 'vomiting blood', 'blood vomiting', 'hemorrhage',
      'खून बहना', 'खून की उल्टी', 'खून की खांसी', 'भारी रक्तस्राव',
      'रक्तस्राव', 'रक्ताची उलटी', 'खूप रक्त वाहणे',
      'அதிக இரத்தப்போக்கு', 'ரத்த வாந்தி',
      'అధిక రక్తస్రావం', 'రక్తపు వాంతులు',
      'রক্তক্ষরণ', 'রক্তের বমি',
      'લોહી વહેવું', 'લોહીની ઉલટી',
      'ರಕ್ತಸ್ರಾವ', 'ರಕ್ತದ ವಾಂತಿ',
      'അമിത രക്തസ്രാവം', 'രക്തം ഛർദ്ദിക്കുക',
      'ਖੂਨ ਵਹਿਣਾ', 'ਖੂਨ ਦੀ ਉਲਟੀ'
    ]
  }
};

const EMERGENCY_REASONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    cardiac: 'Acute chest pain or cardiac distress reported. Immediate emergency physician evaluation required.',
    respiratory: 'Severe acute breathlessness or respiratory distress reported. Oxygen support may be needed.',
    stroke: 'Acute neurological signs (weakness, speech difficulty, or loss of consciousness) detected.',
    hemorrhage: 'Active heavy bleeding or blood loss reported requiring urgent clinical intervention.'
  },
  hi: {
    cardiac: 'सीने में तेज दर्द या संभावित हृदय संबंधी लक्षण। तत्काल आपातकालीन डॉक्टर की आवश्यकता है।',
    respiratory: 'गंभीर सांस फूलना या सांस लेने में तीव्र कठिनाई दर्ज की गई है। तुरंत ध्यान दें।',
    stroke: 'अचानक कमजोरी, आवाज लड़खड़ाना या बेहोशी जैसे लक्षण दर्ज किए गए हैं।',
    hemorrhage: 'अत्यधिक रक्तस्राव या खून की उल्टी के लक्षण दर्ज किए गए हैं। तत्काल उपचार आवश्यक है।'
  },
  mr: {
    cardiac: 'छातीत तीव्र दुखणे किंवा हृदयविकाराची संभाव्य लक्षणे आढळली आहेत. तातडीने डॉक्टरकडे जाणे आवश्यक आहे.',
    respiratory: 'तीव्र धाप लागणे किंवा श्वास घेण्यास अडचण नोंदवली गेली आहे.',
    stroke: 'अचानक पक्षाघात, बोलताना अडखळणे किंवा बेशुद्ध पडल्याची लक्षणे आहेत.',
    hemorrhage: 'तीव्र रक्तस्राव किंवा रक्ताची उलटी झाल्याची नोंद झाली आहे.'
  },
  ta: {
    cardiac: 'கடுமையான நெஞ்சு வலி அல்லது இதயப் பிரச்சனை அறிகுறிகள் கண்டறியப்பட்டுள்ளன.',
    respiratory: 'கடுமையான மூச்சுத் திணறல் பதிவாகியுள்ளது. அவசர சிகிச்சை தேவை.',
    stroke: 'திடீர் பலவீனம், பேச்சு குழறுதல் அல்லது மயக்கம் போன்ற அறிகுறிகள் கண்டறியப்பட்டுள்ளன.',
    hemorrhage: 'அதிக இரத்தப்போக்கு அல்லது ரத்த வாந்தி அறிகுறிகள் பதிவாகியுள்ளன.'
  },
  te: {
    cardiac: 'తీవ్రమైన ఛాతీ నొప్పి లేదా గుండె సంబంధిత అత్యవసర లక్షణాలు గుర్తించబడ్డాయి.',
    respiratory: 'తీవ్రమైన ఆయాసం లేదా శ్వాస తీసుకోవడంలో ఇబ్బంది నమోదైంది.',
    stroke: 'మాట తడబడడం లేదా స్పృహ తప్పడం వంటి నరాల సంబంధిత అత్యవసర లక్షణాలు ఉన్నాయి.',
    hemorrhage: 'అధిక రక్తస్రావం లేదా రక్తపు వాంతులు గుర్తించబడ్డాయి.'
  },
  bn: {
    cardiac: 'বুকে তীব্র ব্যথা বা হৃদরোগের লক্ষণ চিহ্নিত করা হয়েছে। জরুরি মূল্যায়ন প্রয়োজন।',
    respiratory: 'তীব্র শ্বাসকষ্ট নথিভুক্ত হয়েছে। অবিলম্বে অক্সিজেন সহায়তা প্রয়োজন হতে পারে।',
    stroke: 'হঠাৎ দুর্বলতা, কথা জড়িয়ে যাওয়া বা অজ্ঞান হওয়ার লক্ষণ চিহ্নিত হয়েছে।',
    hemorrhage: 'অতিরিক্ত রক্তক্ষরণ বা রক্তের বমি রেকর্ড করা হয়েছে।'
  },
  gu: {
    cardiac: 'છાતીમાં તીવ્ર દુખાવો કે હૃદય સંબંધી ગંભીર લક્ષણ જણાયા છે. તાત્કાલિક ડોક્ટર જરૂરી છે.',
    respiratory: 'ગંભીર શ્વાસ ચડવો કે શ્વાસ લેવામાં તકલીફ નોંધાઈ છે.',
    stroke: 'અચાનક કમજોરી, બોલવામાં તકલીફ કે બેભાન થવાના લક્ષણો છે.',
    hemorrhage: 'વધુ પડતું લોહી વહેવું કે લોહીની ઉલટીની નોંધ થઈ છે.'
  },
  kn: {
    cardiac: 'ತೀವ್ರವಾದ ಎದೆ ನೋವು ಅಥವಾ ಹೃದಯ ಸಂಬಂಧಿ ತುರ್ತು ಲಕ್ಷಣಗಳು ಕಂಡುಬಂದಿವೆ.',
    respiratory: 'ತೀವ್ರ ಉಸಿರಾಟದ ತೊಂದರೆ ದಾಖಲಾಗಿದೆ. ತಕ್ಷಣದ ವೈದ್ಯಕೀಯ ನೆರವು ಅಗತ್ಯವಿದೆ.',
    stroke: 'ಮಾತು ತೊದಲುವಿಕೆ ಅಥವಾ ಪ್ರಜ್ಞೆ ತಪ್ಪುವಿಕೆಯಂತಹ ತುರ್ತು ಲಕ್ಷಣಗಳು ಕಂಡುಬಂದಿವೆ.',
    hemorrhage: 'ಅಧಿಕ ರಕ್ತಸ್ರಾವ ಅಥವಾ ರಕ್ತದ ವಾಂತಿಯ ಲಕ್ಷಣಗಳು ದಾಖಲಾಗಿವೆ.'
  },
  ml: {
    cardiac: 'കഠിനമായ നെഞ്ചുവേദന അല്ലെങ്കിൽ ഹൃദയസംബന്ധമായ ലക്ഷണങ്ങൾ റിപ്പോർട്ട് ചെയ്യപ്പെട്ടു.',
    respiratory: 'കഠിനമായ ശ്വാസതടസ്സം രേഖപ്പെടുത്തിയിട്ടുണ്ട്. അടിയന്തര ശ്രദ്ധ ആവശ്യമാണ്.',
    stroke: 'സംസാര വൈകല്യം അല്ലെങ്കിൽ ബോധക്ഷയം പോലുള്ള അടിയന്തര ലക്ഷണങ്ങൾ കണ്ടെത്തി.',
    hemorrhage: 'അമിത രക്തസ്രാവം അല്ലെങ്കിൽ രക്തം ഛർദ്ദിച്ചതായി റിപ്പോർട്ട് ചെയ്തു.'
  },
  pa: {
    cardiac: 'ਛਾਤੀ ਵਿੱਚ ਤੇਜ਼ ਦਰਦ ਜਾਂ ਦਿਲ ਦੇ ਦੌਰੇ ਦੇ ਲੱਛਣ ਦਰਜ ਹੋਏ ਹਨ। ਤੁਰੰਤ ਡਾਕਟਰੀ ਮਦਦ ਦੀ ਲੋੜ ਹੈ।',
    respiratory: 'ਬਹੁਤ ਤੇਜ਼ ਸਾਹ ਚੜ੍ਹਨਾ ਜਾਂ ਸਾਹ ਲੈਣ ਵਿੱਚ ਤਕਲੀਫ਼ ਦਰਜ ਹੋਈ ਹੈ।',
    stroke: 'ਅਚਾਨਕ ਕਮਜ਼ੋਰੀ, ਆਵਾਜ਼ ਲੜਖੜਾਉਣਾ ਜਾਂ ਬੇਹੋਸ਼ ਹੋਣ ਦੇ ਲੱਛਣ ਮਿਲੇ ਹਨ।',
    hemorrhage: 'ਬਹੁਤ ਜ਼ਿਆਦਾ ਖੂਨ ਵਹਿਣਾ ਜਾਂ ਖੂਨ ਦੀ ਉਲਟੀ ਹੋਣ ਦੇ ਲੱਛਣ ਦਰਜ ਹੋਏ ਹਨ।'
  }
};

export function checkRedFlagEmergency(text: string, language: string = 'en'): EmergencyCheckResult {
  if (!text) return { detected: false, isEmergency: false, reasons: [] };
  const lower = text.toLowerCase();
  const safeLang = (language in EMERGENCY_REASONS ? language : 'en') as SupportedLanguage;

  for (const [, info] of Object.entries(EMERGENCY_KEYWORDS)) {
    for (const term of info.terms) {
      if (lower.includes(term.toLowerCase())) {
        const langReasons = EMERGENCY_REASONS[safeLang] || EMERGENCY_REASONS.en;
        const enReasons = EMERGENCY_REASONS.en;
        const langMsg = langReasons[info.category] || enReasons[info.category];
        const enMsg = enReasons[info.category];
        return {
          detected: true,
          isEmergency: true,
          category: info.category,
          reasons: [langMsg || enMsg],
          reasonInLanguage: langMsg,
          reasonInEnglish: enMsg
        };
      }
    }
  }

  return { detected: false, isEmergency: false, reasons: [] };
}
