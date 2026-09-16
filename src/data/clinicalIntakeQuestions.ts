import { SupportedLanguage } from '../types';

export interface IntakeQuestionStep {
  key: string;
  question: string;
  options: string[];
}

export interface IntakeQuestionBank {
  complaint: IntakeQuestionStep;
  duration: IntakeQuestionStep;
  severity: IntakeQuestionStep;
  associated: IntakeQuestionStep;
  pastHistory: IntakeQuestionStep;
  medications: IntakeQuestionStep;
  review: IntakeQuestionStep;
  [key: string]: IntakeQuestionStep;
}

/**
 * Clean, natural clinical intake question banks for all 10 supported Indian languages.
 * No awkward bilingual slash-separated text (e.g. 'आज सुबह से / Today').
 */
export const CLINICAL_INTAKE_QUESTIONS: Record<SupportedLanguage, IntakeQuestionBank> = {
  en: {
    complaint: {
      key: 'complaint',
      question: 'Hello, please tell me what health problems or symptoms you are experiencing today.',
      options: ['Fever and Cough', 'Chest Pain or Heaviness', 'Stomach Pain or Acidity', 'Joint and Knee Pain', 'Severe Headache']
    },
    duration: {
      key: 'duration',
      question: 'How long have you been experiencing this health problem?',
      options: ['Today', '2–3 Days', '1 Week', 'More than 1 Month']
    },
    severity: {
      key: 'severity',
      question: 'How severe is the pain or discomfort?',
      options: ['Mild', 'Moderate', 'Severe']
    },
    associated: {
      key: 'associated',
      question: 'Do you also have fever, shortness of breath, nausea, or dizziness?',
      options: ['High Fever', 'Shortness of Breath', 'Nausea or Vomiting', 'No Other Symptoms']
    },
    pastHistory: {
      key: 'pastHistory',
      question: 'Do you have any existing chronic medical conditions (e.g. Diabetes, High BP, Asthma)?',
      options: ['Type 2 Diabetes', 'High Blood Pressure', 'Thyroid Disorder', 'Asthma', 'No Existing Conditions']
    },
    medications: {
      key: 'medications',
      question: 'Are you currently taking any regular prescription medications?',
      options: ['Regular BP or Sugar Pills', 'Painkiller Pills', 'No Regular Medications']
    },
    review: {
      key: 'review',
      question: 'Thank you! Your clinical intake has been safely synthesized. Please review and confirm your details.',
      options: ['Review and Confirm Details']
    }
  },
  hi: {
    complaint: {
      key: 'complaint',
      question: 'नमस्ते, कृपया बताएं कि आज आपको क्या शारीरिक परेशानी या लक्षण महसूस हो रहे हैं?',
      options: ['बुखार और खांसी', 'छाती में दर्द या भारीपन', 'पेट दर्द या एसिडिटी', 'जोड़ों और घुटनों का दर्द', 'तेज सिरदर्द']
    },
    duration: {
      key: 'duration',
      question: 'यह समस्या आपको कितने समय से हो रही है?',
      options: ['आज', '2–3 दिन', '1 सप्ताह', '1 महीने से अधिक']
    },
    severity: {
      key: 'severity',
      question: 'दर्द या परेशानी की तीव्रता कितनी है?',
      options: ['हल्का', 'मध्यम', 'तेज']
    },
    associated: {
      key: 'associated',
      question: 'क्या आपको इसके साथ बुखार, सांस फूलना, उल्टी या कमजोरी भी महसूस हो रही है?',
      options: ['तेज बुखार', 'सांस फूलना', 'उल्टी या जी मिचलाना', 'कोई अन्य लक्षण नहीं']
    },
    pastHistory: {
      key: 'pastHistory',
      question: 'क्या आपको पहले से कोई पुरानी बीमारी है (जैसे शुगर, बीपी, थायराइड, दमा)?',
      options: ['डायबिटीज या शुगर', 'हाई ब्लड प्रेशर (BP)', 'थायराइड', 'अस्थमा या दमा', 'कोई पुरानी बीमारी नहीं']
    },
    medications: {
      key: 'medications',
      question: 'क्या आप वर्तमान में कोई नियमित दैनिक दवाइयां ले रहे हैं?',
      options: ['हाँ, BP या शुगर की दवा', 'दर्द निवारक दवा', 'कोई दवा नहीं ले रहे']
    },
    review: {
      key: 'review',
      question: 'धन्यवाद! आपकी सभी स्वास्थ्य जानकारी दर्ज कर ली गई है। कृपया विवरण की समीक्षा और पुष्टि करें।',
      options: ['जानकारी की समीक्षा और पुष्टि करें']
    }
  },
  mr: {
    complaint: {
      key: 'complaint',
      question: 'नमस्कार, कृपया सांगा आज आपल्याला काय शारीरिक त्रास किंवा लक्षणे जाणवत आहेत?',
      options: ['ताप आणि खोकला', 'छातीत दुखणे किंवा जडपणा', 'पोटदुखी आणि उलट्या', 'गुडघेदुखी आणि सांधेदुखी', 'डोकेदुखी आणि चक्कर']
    },
    duration: {
      key: 'duration',
      question: 'हा त्रास आपल्याला किती दिवसांपासून होत आहे?',
      options: ['आज', '२–३ दिवस', '१ आठवडा', '१ महिन्यापेक्षा जास्त']
    },
    severity: {
      key: 'severity',
      question: 'वेदना किंवा त्रासाची तीव्रता किती आहे?',
      options: ['कमी', 'मध्यम', 'खूप जास्त']
    },
    associated: {
      key: 'associated',
      question: 'सोबत ताप, धाप लागणे, उलट्या किंवा चक्कर येत आहे का?',
      options: ['तीव्र ताप', 'धाप लागणे', 'उलट्या होणे', 'इतर कोणताही त्रास नाही']
    },
    pastHistory: {
      key: 'pastHistory',
      question: 'आपल्याला आधीपासून कोणताही आजार आहे का (उदा. मधुमेह, बीपी, थायरॉईड)?',
      options: ['मधुमेह', 'उच्च रक्तदाब (BP)', 'थायरॉईड', 'दमा', 'कोणताही जुना आजार नाही']
    },
    medications: {
      key: 'medications',
      question: 'सध्या आपण नियमितपणे कोणती औषधे घेत आहात का?',
      options: ['हो, BP किंवा मधुमेहाची औषधे', 'वेदना निवारक औषध', 'कोणतीही औषधे घेत नाही']
    },
    review: {
      key: 'review',
      question: 'धन्यवाद! आपली सर्व आरोग्य माहिती सुरक्षितपणे नोंदवली गेली आहे. कृपया तपासा आणि पुष्टी करा.',
      options: ['माहिती तपासा आणि पुष्टी करा']
    }
  },
  ta: {
    complaint: {
      key: 'complaint',
      question: 'வணக்கம், இன்று உங்களுக்கு என்ன உடல்நல பிரச்சனை அல்லது அறிகுறிகள் உள்ளன என்று கூறுங்கள்.',
      options: ['காய்ச்சல் மற்றும் இருமல்', 'நெஞ்சு வலி அல்லது பாரம்', 'வயிற்று வலி', 'மூட்டு வலி', 'கடுமையான தலைவலி']
    },
    duration: {
      key: 'duration',
      question: 'இந்த பிரச்சனை எத்தனை நாட்களாக உள்ளது?',
      options: ['இன்று', '2–3 நாட்கள்', '1 வாரம்', '1 மாதத்திற்கு மேல்']
    },
    severity: {
      key: 'severity',
      question: 'வலியின் தீவிரம் எவ்வளவு?',
      options: ['குறைவு', 'மிதமானது', 'கடுமையானது']
    },
    associated: {
      key: 'associated',
      question: 'இதனுடன் காய்ச்சல், மூச்சுத் திணறல் அல்லது வாந்தி உள்ளதா?',
      options: ['அதிக காய்ச்சல்', 'மூச்சுத் திணறல்', 'வாந்தி', 'வேறு அறிகுறிகள் இல்லை']
    },
    pastHistory: {
      key: 'pastHistory',
      question: 'உங்களுக்கு ஏற்கனவே ஏதேனும் நோய் உள்ளதா (சர்க்கரை நோய், பிபி, ஆஸ்துமா)?',
      options: ['சர்க்கரை நோய்', 'இரத்த அழுத்தம் (BP)', 'தைராய்டு', 'ஆஸ்துமா', 'எதுவும் இல்லை']
    },
    medications: {
      key: 'medications',
      question: 'நீங்கள் தற்போது ஏதேனும் வழக்கமான மருந்துகளை எடுத்துக்கொள்கிறீர்களா?',
      options: ['ஆம், BP அல்லது சர்க்கரை மாத்திரை', 'வலி நிவாரணி', 'மருந்துகள் எதுவும் இல்லை']
    },
    review: {
      key: 'review',
      question: 'நன்றி! உங்கள் மருத்துவ விவரங்கள் பதிவு செய்யப்பட்டுள்ளன. தயவுசெய்து உறுதிப்படுத்தவும்.',
      options: ['விவரங்களை மதிப்பாய்வு செய்து உறுதிப்படுத்தவும்']
    }
  },
  te: {
    complaint: {
      key: 'complaint',
      question: 'నమస్కారం, ఈరోజు మీకు ఎలాంటి ఆరోగ్య సమస్యలు లేదా లక్షణాలు ఉన్నాయో దయచేసి చెప్పండి.',
      options: ['జ్వరం మరియు దగ్గు', 'ఛాతీ నొప్పి లేదా బరువుగా ఉండడం', 'కడుపు నొప్పి', 'కీళ్ల నొప్పులు', 'తీవ్రమైన తలనొప్పి']
    },
    duration: {
      key: 'duration',
      question: 'ఈ సమస్య ఎన్ని రోజుల నుండి ఉంది?',
      options: ['ఈ రోజు', '2–3 రోజులు', '1 వారం', '1 నెల కంటే ఎక్కువ']
    },
    severity: {
      key: 'severity',
      question: 'నొప్పి తీవ్రత ఎంతవరకు ఉంది?',
      options: ['స్వల్పంగా', 'మధ్యస్థంగా', 'చాలా తీవ్రంగా']
    },
    associated: {
      key: 'associated',
      question: 'దీనితో పాటు జ్వరం, ఆయాసం లేదా వాంతులు ఉన్నాయా?',
      options: ['తీవ్ర జ్వరం', 'ఆయాసం లేదా శ్వాస ఇబ్బంది', 'వాంతులు', 'ఇతర లక్షణాలు లేవు']
    },
    pastHistory: {
      key: 'pastHistory',
      question: 'మీకు గతంలో ఏవైనా దీర్ఘకాలిక సమస్యలు ఉన్నాయా (షుగర్, బీపీ, థైరాయిడ్)?',
      options: ['డయాబెటిస్ లేదా షుగర్', 'హై బ్లడ్ ప్రెషర్ (BP)', 'థైరాయిడ్', 'ఆస్తమా', 'ఎలాంటి సమస్యలు లేవు']
    },
    medications: {
      key: 'medications',
      question: 'మీరు ప్రస్తుతం రోజూ ఏవైనా మందులు వాడుతున్నారా?',
      options: ['అవును, BP లేదా షుగర్ మందులు', 'నొప్పి నివారణ మందులు', 'ఎలాంటి మందులు వాడటం లేదు']
    },
    review: {
      key: 'review',
      question: 'ధన్యవాదాలు! మీ ఆరోగ్య సమాచారం భద్రంగా నమోదు చేయబడింది. దయచేసి వివరాలను పరిశీలించి నిర్ధారించండి.',
      options: ['వివరాలను సమీక్షించి నిర్ధారించండి']
    }
  },
  bn: {
    complaint: {
      key: 'complaint',
      question: 'নমস্কার, অনুগ্রহ করে বলুন আজ আপনার কী শারীরিক সমস্যা বা লক্ষণ দেখা দিচ্ছে?',
      options: ['জ্বর ও কাশি', 'বুকে ব্যথা বা অস্বস্তি', 'পেটে ব্যথা ও বমি', 'হাঁটু ও গাঁটের ব্যথা', 'তীব্র মাথা ব্যথা']
    },
    duration: {
      key: 'duration',
      question: 'এই সমস্যা কত দিন ধরে হচ্ছে?',
      options: ['আজ', '২–৩ দিন', '১ সপ্তাহ', '১ মাসের বেশি']
    },
    severity: {
      key: 'severity',
      question: 'ব্যথা বা কষ্টের মাত্রা কেমন?',
      options: ['মৃদু', 'মাঝারি', 'খুব তীব্র']
    },
    associated: {
      key: 'associated',
      question: 'এর সাথে কি জ্বর, শ্বাসকষ্ট বা বমি বমি ভাব রয়েছে?',
      options: ['তীব্র জ্বর', 'শ্বাসকষ্ট', 'বমি ভাব', 'অন্য কোনো লক্ষণ নেই']
    },
    pastHistory: {
      key: 'pastHistory',
      question: 'আপনার কি ডায়াবেটিস, উচ্চ রক্তচাপ বা থাইরয়েডের মতো কোনো পুরনো রোগ আছে?',
      options: ['ডায়াবেটিস', 'উচ্চ রক্তচাপ (BP)', 'থাইরয়েড', 'হাঁপানি', 'কোনো পুরনো রোগ নেই']
    },
    medications: {
      key: 'medications',
      question: 'আপনি কি বর্তমানে কোনো নিয়মিত ওষুধ খাচ্ছেন?',
      options: ['হ্যাঁ, BP বা ডায়াবেটিসের ওষুধ', 'ব্যথার ওষুধ', 'কোনো ওষুধ খাচ্ছি না']
    },
    review: {
      key: 'review',
      question: 'ধন্যবাদ! আপনার স্বাস্থ্য সংক্রান্ত তথ্য নথিভুক্ত করা হয়েছে। অনুগ্রহ করে নিচে দেখে নিশ্চিত করুন।',
      options: ['তথ্য পর্যালোচনা ও নিশ্চিত করুন']
    }
  },
  gu: {
    complaint: {
      key: 'complaint',
      question: 'નમસ્તે, કૃપા કરીને જણાવો કે આજે તમને શું શારીરિક તકલીફ કે લક્ષણો જણાય છે?',
      options: ['તાવ અને ઉધરસ', 'છાતીમાં દુખાવો કે ભારેપણું', 'પેટમાં દુખાવો', 'સાંધા અને ઘૂંટણનો દુખાવો', 'માથાનો દુખાવો']
    },
    duration: {
      key: 'duration',
      question: 'આ તકલીફ કેટલા દિવસથી છે?',
      options: ['આજ', '૨–૩ દિવસ', '૧ અઠવાડિયું', '૧ મહિનાથી વધુ']
    },
    severity: {
      key: 'severity',
      question: 'દુખાવાની તીવ્રતા કેટલી છે?',
      options: ['હળવી', 'મધ્યમ', 'ખૂબ તીવ્ર']
    },
    associated: {
      key: 'associated',
      question: 'સાથે તાવ, શ્વાસ લેવામાં તકલીફ કે ઉલટી જેવું થાય છે?',
      options: ['તીવ્ર તાવ', 'શ્વાસ ચડવો', 'ઉલટી અથવા ઉબકા', 'કોઈ અન્ય લક્ષણ નથી']
    },
    pastHistory: {
      key: 'pastHistory',
      question: 'શું તમને ડાયાબિટીસ, બીપી કે થાઇરોઇડ જેવી કોઈ જૂની બીમારી છે?',
      options: ['ડાયાબિટીસ', 'હાઈ બ્લડ પ્રેશર (BP)', 'થાઇરોઇડ', 'અસ્થમા અથવા દમ', 'કોઈ જૂની બીમારી નથી']
    },
    medications: {
      key: 'medications',
      question: 'શું તમે હાલમાં કોઈ નિયમિત દવાઓ લઈ રહ્યા છો?',
      options: ['હા, BP અથવા સુગરની નિયમિત દવા', 'પેઈન કિલર દવા', 'કોઈ દવા લેતા નથી']
    },
    review: {
      key: 'review',
      question: 'આભાર! તમારી સ્વાસ્થ્ય વિગત નોંધી લેવામાં આવી છે. કૃપા કરીને વિગતો તપાસી કન્ફર્મ કરો.',
      options: ['વિગત તપાસો અને કન્ફર્મ કરો']
    }
  },
  kn: {
    complaint: {
      key: 'complaint',
      question: 'ನಮಸ್ಕಾರ, ಇಂದು ನಿಮಗೆ ಯಾವ ರೀತಿಯ ಆರೋಗ್ಯ ಸಮಸ್ಯೆ ಅಥವಾ ಲಕ್ಷಣಗಳಿವೆ ಎಂದು ದಯವಿಟ್ಟು ತಿಳಿಸಿ.',
      options: ['ಜ್ವರ ಮತ್ತು ಕೆಮ್ಮು', 'ಎದೆ ನೋವು ಅಥವಾ ಭಾರ', 'ಹೊಟ್ಟೆ ನೋವು', 'ಕೀಲು ಮತ್ತು ಮೊಣಕಾಲು ನೋವು', 'ತಲೆನೋವು']
    },
    duration: {
      key: 'duration',
      question: 'ಈ ಸಮಸ್ಯೆ ಎಷ್ಟು ದಿನಗಳಿಂದ ಇದೆ?',
      options: ['ಇಂದು', '2–3 ದಿನಗಳು', '1 ವಾರ', '1 ತಿಂಗಳಿಗಿಂತ ಹೆಚ್ಚು']
    },
    severity: {
      key: 'severity',
      question: 'ನೋವಿನ ತೀವ್ರತೆ ಎಷ್ಟಿದೆ?',
      options: ['ಸೌಮ್ಯ', 'ಮಧ್ಯಮ', 'ತೀವ್ರ']
    },
    associated: {
      key: 'associated',
      question: 'ಇದರ ಜೊತೆಗೆ ಜ್ವರ, ಉಸಿರಾಟದ ತೊಂದರೆ ಅಥವಾ ವಾಂತಿ ಇದೆಯೇ?',
      options: ['ತೀವ್ರ ಜ್ವರ', 'ಉಸಿರಾಟದ ತೊಂದರೆ', 'ವಾಂತಿ', 'ಇತರ ಯಾವುದೇ ಲಕ್ಷಣಗಳಿಲ್ಲ']
    },
    pastHistory: {
      key: 'pastHistory',
      question: 'ನಿಮಗೆ ಮಧುಮೇಹ, ಬಿಪಿ ಅಥವಾ ಥೈರಾಯ್ಡ್‌ನಂತಹ ಹಳೆಯ ಕಾಯಿಲೆಗಳಿವೆಯೇ?',
      options: ['ಮಧುಮೇಹ ಅಥವಾ ಸಕ್ಕರೆ ಕಾಯಿಲೆ', 'ರಕ್ತದೊತ್ತಡ (BP)', 'ಥೈರಾಯ್ಡ್', 'ಅಸ್ತಮಾ', 'ಯಾವುದೇ ಹಳೆಯ ಕಾಯಿಲೆ ಇಲ್ಲ']
    },
    medications: {
      key: 'medications',
      question: 'ನೀವು ಪ್ರಸ್ತುತ ಪ್ರತಿದಿನ ಯಾವುದೇ ಔಷಧಿಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳುತ್ತಿದ್ದೀರಾ?',
      options: ['ಹೌದು, BP ಅಥವಾ ಶುಗರ್ ಮಾತ್ರೆಗಳು', 'ನೋವು ನಿವಾರಕ ಮಾತ್ರೆಗಳು', 'ಯಾವುದೇ ಔಷಧಿ ತೆಗೆದುಕೊಳ್ಳುತ್ತಿಲ್ಲ']
    },
    review: {
      key: 'review',
      question: 'ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಆರೋಗ್ಯ ಮಾಹಿತಿಯನ್ನು ದಾಖಲಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ ದೃಢೀಕರಿಸಿ.',
      options: ['ಮಾಹಿತಿ ಪರಿಶೀಲಿಸಿ ದೃಢೀಕರಿಸಿ']
    }
  },
  ml: {
    complaint: {
      key: 'complaint',
      question: 'നമസ്കാരം, ഇന്ന് നിങ്ങൾക്ക് എന്ത് ആരോഗ്യ പ്രശ്നമാണ് ഉള്ളതെന്ന് ദയവായി പറയുക.',
      options: ['പനിയും ചുമയും', 'നെഞ്ചുവേദന അല്ലെങ്കിൽ ഭാരം', 'വയറുവേദന', 'സന്ധിവേദന', 'തലവേദന']
    },
    duration: {
      key: 'duration',
      question: 'ഈ പ്രശ്നം എത്ര ദിവസമായി ഉണ്ട്?',
      options: ['ഇന്ന്', '2–3 ദിവസം', '1 ആഴ്ച', '1 മാസത്തിൽ കൂടുതൽ']
    },
    severity: {
      key: 'severity',
      question: 'വേദനയുടെ കാഠിന്യം എത്രയാണ്?',
      options: ['കുറവ്', 'മിതമായത്', 'കഠിനമായത്']
    },
    associated: {
      key: 'associated',
      question: 'ഇതിനൊപ്പം പനി, ശ്വാസതടസ്സം അല്ലെങ്കിൽ ഛർദ്ദി ഉണ്ടോ?',
      options: ['കഠിനമായ പനി', 'ശ്വാസതടസ്സം', 'ഛർദ്ദി', 'മറ്റ് ലക്ഷണങ്ങളൊന്നുമില്ല']
    },
    pastHistory: {
      key: 'pastHistory',
      question: 'നിങ്ങൾക്ക് പ്രമേഹം, ബിപി, തൈറോയ്ഡ് തുടങ്ങിയ രോഗങ്ങൾ ഉണ്ടോ?',
      options: ['പ്രമേഹം', 'ഉയർന്ന രಕ್ತസമ്മർദ്ദം (BP)', 'തൈറോയ്ഡ്', 'ആസ്ത്മ', 'മറ്റ് അസുഖങ്ങളൊന്നുമില്ല']
    },
    medications: {
      key: 'medications',
      question: 'നിലവിൽ നിങ്ങൾ സ്ഥിരമായി മരുന്നുകൾ കഴിക്കുന്നുണ്ടോ?',
      options: ['അതെ, BP അല്ലെങ്കിൽ ഷുഗർ മരുന്നുകൾ', 'വേദനസംഹാരികൾ', 'മരുന്നുകളൊന്നും കഴിക്കുന്നില്ല']
    },
    review: {
      key: 'review',
      question: 'നന്ദി! നിങ്ങളുടെ ആരോഗ്യ വിവരങ്ങൾ രേഖപ്പെടുത്തിയിട്ടുണ്ട്. ദയവായി പരിശോധിച്ച് ഉറപ്പാക്കുക.',
      options: ['വിവരങ്ങൾ പരിശോധിച്ച് സ്ഥിരീകരിക്കുക']
    }
  },
  pa: {
    complaint: {
      key: 'complaint',
      question: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਕਿਰਪਾ ਕਰਕੇ ਦੱਸੋ ਕਿ ਅੱਜ ਤੁਹਾਨੂੰ ਕੀ ਤਕਲੀਫ਼ ਜਾਂ ਲੱਛਣ ਮਹਿਸੂਸ ਹੋ ਰਹੇ ਹਨ?',
      options: ['ਬੁਖਾਰ ਅਤੇ ਖੰਘ', 'ਛਾਤੀ ਵਿੱਚ ਦਰਦ ਜਾਂ ਭਾਰੀਪਨ', 'ਪੇਟ ਦਰਦ ਅਤੇ ਉਲਟੀ', 'ਜੋੜਾਂ ਅਤੇ ਗੋਡਿਆਂ ਦਾ ਦਰਦ', 'ਸਿਰਦਰਦ']
    },
    duration: {
      key: 'duration',
      question: 'ਇਹ ਤਕਲੀਫ਼ ਕਿੰਨੇ ਦਿਨਾਂ ਤੋਂ ਹੋ ਰਹੀ ਹੈ?',
      options: ['ਅੱਜ', '2–3 ਦਿਨ', '1 ਹਫ਼ਤਾ', '1 ਮਹੀਨੇ ਤੋਂ ਵੱਧ']
    },
    severity: {
      key: 'severity',
      question: 'ਦਰਦ ਦਾ ਪੱਧਰ ਕਿੰਨਾ ਤੇਜ਼ ਹੈ?',
      options: ['ਹਲਕਾ', 'ਦਰਮਿਆਨਾ', 'ਬਹੁਤ ਤੇਜ਼']
    },
    associated: {
      key: 'associated',
      question: 'ਕੀ ਨਾਲ ਬੁਖਾਰ, ਸਾਹ ਚੜ੍ਹਨਾ ਜਾਂ ਉਲਟੀ ਦੀ ਸ਼ਿਕਾਇਤ ਵੀ ਹੈ?',
      options: ['ਤੇਜ਼ ਬੁਖਾਰ', 'ਸਾਹ ਚੜ੍ਹਨਾ', 'ਉਲਟੀ ਜਾਂ ਜੀਅ ਕੱਚਾ ਹੋਣਾ', 'ਹੋਰ ਕੋਈ ਲੱਛਣ ਨਹੀਂ']
    },
    pastHistory: {
      key: 'pastHistory',
      question: 'ਕੀ ਤੁਹਾਨੂੰ ਸ਼ੂਗਰ, ਬੀਪੀ ਜਾਂ ਥਾਈਰਾਇਡ ਵਰਗੀ ਕੋਈ ਪੁਰਾਣੀ ਬਿਮਾਰੀ ਹੈ?',
      options: ['ਸ਼ੂਗਰ', 'ਹਾਈ ਬਲੱਡ ਪ੍ਰੈਸ਼ਰ (BP)', 'ਥਾਈਰਾਇਡ', 'ਦਮਾ', 'ਕੋਈ ਪੁਰਾਣੀ ਬਿਮਾਰੀ ਨਹੀਂ']
    },
    medications: {
      key: 'medications',
      question: 'ਕੀ ਤੁਸੀਂ ਰੋਜ਼ਾਨਾ ਕੋਈ ਦਵਾਈਆਂ ਲੈ ਰਹੇ ਹੋ?',
      options: ['ਹਾਂ, BP ਜਾਂ ਸ਼ੂਗਰ ਦੀ ਦਵਾਈ', 'ਦਰਦ ਨਿਵਾਰਕ ਦਵਾਈ', 'ਕੋਈ ਦਵਾਈ ਨਹੀਂ ਲੈ ਰਹੇ']
    },
    review: {
      key: 'review',
      question: 'ਧੰਨਵਾਦ! ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ ਸੁਰੱਖਿਅਤ ਦਰਜ ਕਰ ਲਈ ਗਈ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਪੁਸ਼ਟੀ ਕਰੋ।',
      options: ['ਜਾਣਕਾਰੀ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ']
    }
  }
};
