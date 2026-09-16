import { SupportedLanguage } from '../types';

export interface ClinicalQuestionDef {
  key: 'complaint' | 'duration' | 'severity' | 'associated' | 'pastHistory' | 'medications' | 'review';
  question: string;
  options: string[];
}

export const CLINICAL_INTAKE_QUESTIONS: Record<SupportedLanguage | string, Record<string, ClinicalQuestionDef>> = {
  hi: {
    complaint: {
      key: 'complaint',
      question: 'नमस्ते, कृपया बताएं कि आज आपको क्या तकलीफ या लक्षण महसूस हो रहे हैं?',
      options: ['बुखार और खांसी', 'सीने में भारीपन या दर्द', 'पेट दर्द और उल्टी', 'घुटनों व जोड़ों में दर्द', 'सिरदर्द और चक्कर']
    },
    duration: {
      key: 'duration',
      question: 'यह तकलीफ आपको कितने समय से हो रही है?',
      options: ['आज सुबह से / Today', '2-3 दिन / 2-3 Days', '1 सप्ताह / 1 Week', '1 महीने से अधिक / > 1 Month']
    },
    severity: {
      key: 'severity',
      question: 'दर्द या परेशानी का स्तर कितना तेज है?',
      options: ['हल्का (1-3) / Mild', 'मध्यम (4-6) / Moderate', 'बहुत तेज (7-10) / Severe']
    },
    associated: {
      key: 'associated',
      question: 'क्या आपको इसके साथ बुखार, सांस फूलना, उल्टी या कमजोरी भी महसूस हो रही है?',
      options: ['तेज बुखार / High Fever', 'सांस फूलना / Breathlessness', 'उल्टी या जी मिचलाना / Nausea', 'कोई अन्य लक्षण नहीं / None']
    },
    pastHistory: {
      key: 'pastHistory',
      question: 'क्या आपको पहले से कोई पुरानी बीमारी है (जैसे शुगर, बीपी, थायराइड, दमा)?',
      options: ['डायबिटीज / Diabetes', 'हाई ब्लड प्रेशर (BP)', 'थायराइड / Thyroid', 'अस्थमा / Asthma', 'कोई पुरानी बीमारी नहीं / None']
    },
    medications: {
      key: 'medications',
      question: 'क्या आप वर्तमान में कोई नियमित दैनिक दवाइयां ले रहे हैं?',
      options: ['हाँ, BP / शुगर की नियमित दवा', 'दर्द निवारक दवाइयां', 'कोई दवा नहीं ले रहा / No Medications']
    },
    review: {
      key: 'review',
      question: 'धन्यवाद! आपकी सभी स्वास्थ्य जानकारी सुरक्षित रूप से दर्ज कर ली गई है। कृपया नीचे दी गई जानकारी की पुष्टि करें।',
      options: ['जानकारी की समीक्षा और पुष्टि करें / Review & Confirm']
    }
  },
  en: {
    complaint: {
      key: 'complaint',
      question: 'Hello, please tell me what health problems or symptoms you are experiencing today.',
      options: ['Fever and Cough', 'Chest Pain / Heaviness', 'Stomach Pain / Acidity', 'Joint & Knee Pain', 'Severe Headache']
    },
    duration: {
      key: 'duration',
      question: 'How long have you been experiencing this health problem?',
      options: ['Since Today', '2-3 Days', 'About 1 Week', 'More than 1 Month']
    },
    severity: {
      key: 'severity',
      question: 'How severe is the pain or discomfort?',
      options: ['Mild (1-3)', 'Moderate (4-6)', 'Severe (7-10)']
    },
    associated: {
      key: 'associated',
      question: 'Do you also have fever, shortness of breath, nausea, or dizziness?',
      options: ['High Fever', 'Shortness of Breath', 'Nausea / Vomiting', 'No Other Symptoms']
    },
    pastHistory: {
      key: 'pastHistory',
      question: 'Do you have any existing chronic medical conditions (e.g. Diabetes, High BP, Asthma)?',
      options: ['Type 2 Diabetes', 'High Blood Pressure', 'Thyroid Disorder', 'Asthma', 'No Existing Conditions']
    },
    medications: {
      key: 'medications',
      question: 'Are you currently taking any regular prescription medications?',
      options: ['Regular BP / Sugar Pills', 'Painkiller Pills', 'No Regular Medications']
    },
    review: {
      key: 'review',
      question: 'Thank you! Your clinical intake has been safely synthesized. Please review and confirm your details.',
      options: ['Review & Confirm Details']
    }
  },
  mr: {
    complaint: {
      key: 'complaint',
      question: 'नमस्कार, कृपया सांगा आज आपल्याला काय त्रास होत आहे?',
      options: ['ताप आणि खोकला', 'छातीत दुखणे किंवा जडपणा', 'पोटदुखी आणि उलट्या', 'गुडघेदुखी आणि सांधेदुखी', 'डोकेदुखी आणि चक्कर']
    },
    duration: {
      key: 'duration',
      question: 'हा त्रास किती दिवसांपासून होत आहे?',
      options: ['आजपासून / Today', '२-३ दिवस / 2-3 Days', '१ आठवडा / 1 Week', '१ महिन्यापेक्षा जास्त']
    },
    severity: {
      key: 'severity',
      question: 'वेदना किंवा त्रासाची तीव्रता किती आहे?',
      options: ['कमी (१-३) / Mild', 'मध्यम (४-६) / Moderate', 'खूप जास्त (७-१०) / Severe']
    },
    associated: {
      key: 'associated',
      question: 'सोबत ताप, धाप लागणे, उलट्या किंवा चक्कर येत आहे का?',
      options: ['तीव्र ताप', 'धाप लागणे', 'उलट्या होणे', 'इतर कोणताही त्रास नाही']
    },
    pastHistory: {
      key: 'pastHistory',
      question: 'आपल्याला आधीपासून कोणताही आजार आहे का (उदा. मधुमेह, बीपी, थायरॉईड)?',
      options: ['मधुमेह / Diabetes', 'उच्च रक्तदाब (BP)', 'थायरॉईड / Thyroid', 'दमा / Asthma', 'कोणताही जुना आजार नाही']
    },
    medications: {
      key: 'medications',
      question: 'सध्या आपण नियमितपणे कोणती औषधे घेत आहात का?',
      options: ['हो, BP / मधुमेहाची औषधे', 'वेदना निवारक औषध', 'कोणतीही औषधे घेत नाही']
    },
    review: {
      key: 'review',
      question: 'धन्यवाद! आपली सर्व आरोग्य माहिती सुरक्षितपणे नोंदवली गेली आहे. कृपया तपासा आणि पुष्टी करा.',
      options: ['माहिती तपासा आणि पुष्टी करा / Review & Confirm']
    }
  },
  ta: {
    complaint: {
      key: 'complaint',
      question: 'வணக்கம், இன்று உங்களுக்கு என்ன உடல்நல பிரச்சனை உள்ளது என்று கூறுங்கள்.',
      options: ['காய்ச்சல் மற்றும் இருமல்', 'நெஞ்சு வலி / பாரம்', 'வயிற்று வலி', 'மூட்டு வலி', 'தலைவலி']
    },
    duration: {
      key: 'duration',
      question: 'இந்த பிரச்சனை எத்தனை நாட்களாக உள்ளது?',
      options: ['இன்று முதல் / Today', '2-3 நாட்கள் / 2-3 Days', '1 வாரம் / 1 Week', '1 மாதத்திற்கு மேல்']
    },
    severity: {
      key: 'severity',
      question: 'வலியின் தீவிரம் எவ்வளவு?',
      options: ['குறைவு (1-3)', 'மிதமானது (4-6)', 'கடுமையானது (7-10)']
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
      options: ['ஆம், BP/சர்க்கரை மாத்திரை', 'வலி நிவாரணி', 'மருந்துகள் எதுவும் இல்லை']
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
      question: 'నమస్కారం, ఈరోజు మీకు ఎలాంటి ఆరోగ్య సమస్యలు ఉన్నాయో దయచేసి చెప్పండి.',
      options: ['జ్వరం మరియు దగ్గు', 'ఛాతీ నొప్పి / బరువుగా ఉండడం', 'కడుపు నొప్పి', 'కీళ్ల నొప్పులు', 'తీవ్రమైన తలనొప్పి']
    },
    duration: {
      key: 'duration',
      question: 'ఈ సమస్య ఎన్ని రోజుల నుండి ఉంది?',
      options: ['ఈ రోజు నుండి / Today', '2-3 రోజులు / 2-3 Days', '1 వారం / 1 Week', '1 నెల కంటే ఎక్కువ']
    },
    severity: {
      key: 'severity',
      question: 'నొప్పి తీవ్రత ఎంతవరకు ఉంది?',
      options: ['స్వల్పంగా (1-3)', 'మధ్యస్థంగా (4-6)', 'చాలా తీవ్రంగా (7-10)']
    },
    associated: {
      key: 'associated',
      question: 'దీనితో పాటు జ్వరం, ఆయాసం లేదా వాంతులు ఉన్నాయా?',
      options: ['తీవ్ర జ్వరం', 'ఆయాసం / శ్వాస తీసుకోవడంలో ఇబ్బంది', 'వాంతులు', 'ఇతర లక్షణాలు లేవు']
    },
    pastHistory: {
      key: 'pastHistory',
      question: 'మీకు గతంలో ఏవైనా దీర్ఘకాలిక సమస్యలు ఉన్నాయా (షుగర్, బీపీ, థైరాయిడ్)?',
      options: ['డయాబెటిస్ / షుగర్', 'హై బ్లడ్ ప్రెషర్ (BP)', 'థైరాయిడ్', 'ఆస్తమా', 'ఎలాంటి సమస్యలు లేవు']
    },
    medications: {
      key: 'medications',
      question: 'మీరు ప్రస్తుతం రోజూ ఏవైనా మందులు వాడుతున్నారా?',
      options: ['అవును, BP / షుగర్ మందులు', 'నొప్పి నివారణ మందులు', 'ఎలాంటి మందులు వాడటం లేదు']
    },
    review: {
      key: 'review',
      question: 'ధన్యవాదాలు! మీ ఆరోగ్య సమాచారం భద్రంగా నమోదు చేయబడింది. దయచేసి వివరాలను పరిశీలించి నిర్ధారించండి.',
      options: ['వివరాలను సమీక్షించి నిర్ధారించండి / Review & Confirm']
    }
  },
  bn: {
    complaint: {
      key: 'complaint',
      question: 'নমস্কার, অনুগ্রহ করে বলুন আজ আপনার কী শারীরিক সমস্যা হচ্ছে?',
      options: ['জ্বর ও কাশি', 'বুকে ব্যথা বা অস্বস্তি', 'পেটে ব্যথা ও বমি', 'হাঁটু ও গাঁটের ব্যথা', 'তীব্র মাথা ব্যথা']
    },
    duration: {
      key: 'duration',
      question: 'এই সমস্যা কত দিন ধরে হচ্ছে?',
      options: ['আজ থেকে / Today', '২-৩ দিন / 2-3 Days', '১ সপ্তাহ / 1 Week', '১ মাসের বেশি']
    },
    severity: {
      key: 'severity',
      question: 'ব্যথা বা কষ্টের মাত্রা কেমন?',
      options: ['মৃদু (১-৩)', 'মাঝারি (৪-৬)', 'খুব তীব্র (৭-১০)']
    },
    associated: {
      key: 'associated',
      question: 'এর সাথে কি জ্বর, শ্বাসকষ্ট বা বমি বমি ভাব রয়েছে?',
      options: ['তীব্র জ্বর', 'শ্বাসকষ্ট', 'বমি ভাব', 'অন্য কোনো লক্ষণ নেই']
    },
    pastHistory: {
      key: 'pastHistory',
      question: 'আপনার কি ডায়াবেটিস, উচ্চ রক্তচাপ বা থাইরয়েডের মতো কোনো পুরনো রোগ আছে?',
      options: ['ডায়াবেটিস / Sugar', 'উচ্চ রক্তচাপ (BP)', 'থাইরয়েড', 'হাঁপানি / Asthma', 'কোনো পুরনো রোগ নেই']
    },
    medications: {
      key: 'medications',
      question: 'আপনি কি বর্তমানে কোনো নিয়মিত ওষুধ খাচ্ছেন?',
      options: ['হ্যাঁ, BP/ডায়াবেটিসের ওষুধ', 'ব্যথার ওষুধ', 'কোনো ওষুধ খাচ্ছি না']
    },
    review: {
      key: 'review',
      question: 'ধন্যবাদ! আপনার স্বাস্থ্য সংক্রান্ত তথ্য নথিভুক্ত করা হয়েছে। অনুগ্রহ করে নিচে দেখে নিশ্চিত করুন।',
      options: ['তথ্য পর্যালোচনা ও নিশ্চিত করুন / Review & Confirm']
    }
  },
  gu: {
    complaint: {
      key: 'complaint',
      question: 'નમસ્તે, કૃપા કરીને જણાવો કે આજે તમને શું તકલીફ છે?',
      options: ['તાવ અને ઉધરસ', 'છાતીમાં દુખાવો કે ભારેપણું', 'પેટમાં દુખાવો', 'સાંધા અને ઘૂંટણનો દુખાવો', 'માથાનો દુખાવો']
    },
    duration: {
      key: 'duration',
      question: 'આ તકલીફ કેટલા દિવસથી છે?',
      options: ['આજથી / Today', '૨-૩ દિવસ / 2-3 Days', '૧ અઠવાડિયું / 1 Week', '૧ મહિનાથી વધુ']
    },
    severity: {
      key: 'severity',
      question: 'દુખાવાની તીવ્રતા કેટલી છે?',
      options: ['હળવી (૧-૩)', 'મધ્યમ (૪-૬)', 'ખૂબ તીવ્ર (૭-૧૦)']
    },
    associated: {
      key: 'associated',
      question: 'સાથે તાવ, શ્વાસ લેવામાં તકલીફ કે ઉલટી જેવું થાય છે?',
      options: ['તીવ્ર તાવ', 'શ્વાસ ચડવો', 'ઉલટી / ઉબકા', 'કોઈ અન્ય લક્ષણ નથી']
    },
    pastHistory: {
      key: 'pastHistory',
      question: 'શું તમને ડાયાબિટીસ, બીપી કે થાઇરોઇડ જેવી કોઈ જૂની બીમારી છે?',
      options: ['ડાયાબિટીસ', 'હાઈ બ્લડ પ્રેશર (BP)', 'થાઇરોઇડ', 'અસ્થમા / દમ', 'કોઈ જૂની બીમારી નથી']
    },
    medications: {
      key: 'medications',
      question: 'શું તમે હાલમાં કોઈ નિયમિત દવાઓ લઈ રહ્યા છો?',
      options: ['હા, BP/સુગરની નિયમિત દવા', 'પેઈન કિલર દવા', 'કોઈ દવા લેતા નથી']
    },
    review: {
      key: 'review',
      question: 'આભાર! તમારી સ્વાસ્થ્ય વિગત નોંધી લેવામાં આવી છે. કૃપા કરીને વિગતો તપાસી કન્ફર્મ કરો.',
      options: ['વિગત તપાસો અને કન્ફર્મ કરો / Review & Confirm']
    }
  },
  kn: {
    complaint: {
      key: 'complaint',
      question: 'ನಮಸ್ಕಾರ, ಇಂದು ನಿಮಗೆ ಯಾವ ರೀತಿಯ ಆರೋಗ್ಯ ಸಮಸ್ಯೆ ಇದೆ ಎಂದು ದಯವಿಟ್ಟು ತಿಳಿಸಿ.',
      options: ['ಜ್ವರ ಮತ್ತು ಕೆಮ್ಮು', 'ಎದೆ ನೋವು / ಭಾರ', 'ಹೊಟ್ಟೆ ನೋವು', 'ಕೀಲು ಮತ್ತು ಮೊಣಕಾಲು ನೋವು', 'ತಲೆನೋವು']
    },
    duration: {
      key: 'duration',
      question: 'ಈ ಸಮಸ್ಯೆ ಎಷ್ಟು ದಿನಗಳಿಂದ ಇದೆ?',
      options: ['ಇಂದಿನಿಂದ / Today', '2-3 ದಿನಗಳು / 2-3 Days', '1 ವಾರ / 1 Week', '1 ತಿಂಗಳಿಗಿಂತ ಹೆಚ್ಚು']
    },
    severity: {
      key: 'severity',
      question: 'ನೋವಿನ ತೀವ್ರತೆ ಎಷ್ಟಿದೆ?',
      options: ['ಸೌಮ್ಯ (1-3)', 'ಮಧ್ಯಮ (4-6)', 'ತೀವ್ರ (7-10)']
    },
    associated: {
      key: 'associated',
      question: 'ಇದರ ಜೊತೆಗೆ ಜ್ವರ, ಉಸಿರಾಟದ ತೊಂದರೆ ಅಥವಾ ವಾಂತಿ ಇದೆಯೇ?',
      options: ['ತೀವ್ರ ಜ್ವರ', 'ಉಸಿರಾಟದ ತೊಂದರೆ', 'ವಾಂತಿ', 'ಇತರ ಯಾವುದೇ ಲಕ್ಷಣಗಳಿಲ್ಲ']
    },
    pastHistory: {
      key: 'pastHistory',
      question: 'ನಿಮಗೆ ಮಧುಮೇಹ, ಬಿಪಿ ಅಥವಾ ಥೈರಾಯ್ಡ್‌ನಂತಹ ಹಳೆಯ ಕಾಯಿಲೆಗಳಿವೆಯೇ?',
      options: ['ಡಯಾಬಿಟಿಸ್ / ಸಕ್ಕರೆ ಕಾಯಿಲೆ', 'ರಕ್ತದೊತ್ತಡ (BP)', 'ಥೈರಾಯ್ಡ್', 'ಅಸ್ತಮಾ', 'ಯಾವುದೇ ಹಳೆಯ ಕಾಯಿಲೆ ಇಲ್ಲ']
    },
    medications: {
      key: 'medications',
      question: 'ನೀವು ಪ್ರಸ್ತುತ ಪ್ರತಿದಿನ ಯಾವುದೇ ಔಷಧಿಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳುತ್ತಿದ್ದೀರಾ?',
      options: ['ಹೌದು, BP / ಶುಗರ್ ಮಾತ್ರೆಗಳು', 'ನೋವು ನಿವಾರಕ ಮಾತ್ರೆಗಳು', 'ಯಾವುದೇ ಔಷಧಿ ತೆಗೆದುಕೊಳ್ಳುತ್ತಿಲ್ಲ']
    },
    review: {
      key: 'review',
      question: 'ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಆರೋಗ್ಯ ಮಾಹಿತಿಯನ್ನು ದಾಖಲಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ ದೃಢೀಕರಿಸಿ.',
      options: ['ಮಾಹಿತಿ ಪರಿಶೀಲಿಸಿ ದೃಢೀಕರಿಸಿ / Review & Confirm']
    }
  },
  ml: {
    complaint: {
      key: 'complaint',
      question: 'നമസ്കാരം, ഇന്ന് നിങ്ങൾക്ക് എന്ത് ആരോഗ്യ പ്രശ്നമാണ് ഉള്ളതെന്ന് ദയവായി പറയുക.',
      options: ['പനിയും ചുമയും', 'നെഞ്ചുവേദന / ഭാരം', 'വയറുവേദന', 'സന്ധിവേദന', 'തലവേദന']
    },
    duration: {
      key: 'duration',
      question: 'ഈ പ്രശ്നം എത്ര ദിവസമായി ഉണ്ട്?',
      options: ['ഇന്ന് മുതൽ / Today', '2-3 ദിവസം / 2-3 Days', '1 ആഴ്ച / 1 Week', '1 മാസത്തിൽ കൂടുതൽ']
    },
    severity: {
      key: 'severity',
      question: 'വേദനയുടെ കാഠിന്യം എത്രയാണ്?',
      options: ['കുറവ് (1-3)', 'മിതമായത് (4-6)', 'കഠിനമായത് (7-10)']
    },
    associated: {
      key: 'associated',
      question: 'ഇതിനൊപ്പം പനി, ശ്വാസതടസ്സം അല്ലെങ്കിൽ ഛർദ്ദി ഉണ്ടോ?',
      options: ['കഠിനമായ പനി', 'ശ്വാസതടസ്സം', 'ഛർദ്ദി', 'മറ്റ് ലക്ഷണങ്ങളൊന്നുമില്ല']
    },
    pastHistory: {
      key: 'pastHistory',
      question: 'നിങ്ങൾക്ക് പ്രമേഹം, ബിപി, തൈറോയ്ഡ് തുടങ്ങിയ രോഗങ്ങൾ ഉണ്ടോ?',
      options: ['പ്രമേഹം (Diabetes)', 'ഉയർന്ന രക്തസമ്മർദ്ദം (BP)', 'തൈറോയ്ഡ്', 'ആസ്ത്മ', 'മറ്റ് അസുഖങ്ങളൊന്നുമില്ല']
    },
    medications: {
      key: 'medications',
      question: 'നിലവിൽ നിങ്ങൾ സ്ഥിരമായി മരുന്നുകൾ കഴിക്കുന്നുണ്ടോ?',
      options: ['അതെ, BP / ഷുഗർ മരുന്നുകൾ', 'വേദനസംഹാരികൾ', 'മരുന്നുകളൊന്നും കഴിക്കുന്നില്ല']
    },
    review: {
      key: 'review',
      question: 'നന്ദി! നിങ്ങളുടെ ആരോഗ്യ വിവരങ്ങൾ രേഖപ്പെടുത്തിയിട്ടുണ്ട്. ദയവായി പരിശോധിച്ച് ഉറപ്പാക്കുക.',
      options: ['വിവരങ്ങൾ പരിശോധിച്ച് സ്ഥിരീകരിക്കുക / Review & Confirm']
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
      options: ['ਅੱਜ ਤੋਂ / Today', '2-3 ਦਿਨ / 2-3 Days', '1 ਹਫ਼ਤਾ / 1 Week', '1 ਮਹੀਨੇ ਤੋਂ ਵੱਧ']
    },
    severity: {
      key: 'severity',
      question: 'ਦਰਦ ਦਾ ਪੱਧਰ ਕਿੰਨਾ ਤੇਜ਼ ਹੈ?',
      options: ['ਹਲਕਾ (1-3)', 'ਦਰਮਿਆਨਾ (4-6)', 'ਬਹੁਤ ਤੇਜ਼ (7-10)']
    },
    associated: {
      key: 'associated',
      question: 'ਕੀ ਨਾਲ ਬੁਖਾਰ, ਸਾਹ ਚੜ੍ਹਨਾ ਜਾਂ ਉਲਟੀ ਦੀ ਸ਼ਿਕਾਇਤ ਵੀ ਹੈ?',
      options: ['ਤੇਜ਼ ਬੁਖਾਰ', 'ਸਾਹ ਚੜ੍ਹਨਾ', 'ਉਲਟੀ ਜਾਂ ਜੀਅ ਕੱਚਾ ਹੋਣਾ', 'ਹੋਰ ਕੋਈ ਲੱਛਣ ਨਹੀਂ']
    },
    pastHistory: {
      key: 'pastHistory',
      question: 'ਕੀ ਤੁਹਾਨੂੰ ਸ਼ੂਗਰ, ਬੀਪੀ ਜਾਂ ਥਾਈਰਾਇਡ ਵਰਗੀ ਕੋਈ ਪੁਰਾਣੀ ਬਿਮਾਰੀ ਹੈ?',
      options: ['ਸ਼ੂਗਰ / Diabetes', 'ਹਾਈ ਬਲੱਡ ਪ੍ਰੈਸ਼ਰ (BP)', 'ਥਾਈਰਾਇਡ', 'ਦਮਾ / Asthma', 'ਕੋਈ ਪੁਰਾਣੀ ਬਿਮਾਰੀ ਨਹੀਂ']
    },
    medications: {
      key: 'medications',
      question: 'ਕੀ ਤੁਸੀਂ ਰੋਜ਼ਾਨਾ ਕੋਈ ਦਵਾਈਆਂ ਲੈ ਰਹੇ ਹੋ?',
      options: ['ਹਾਂ, BP / ਸ਼ੂਗਰ ਦੀ ਦਵਾਈ', 'ਦਰਦ ਨਿਵਾਰਕ ਦਵਾਈ', 'ਕੋਈ ਦਵਾਈ ਨਹੀਂ ਲੈ ਰਹੇ']
    },
    review: {
      key: 'review',
      question: 'ਧੰਨਵਾਦ! ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ ਸੁਰੱਖਿਅਤ ਦਰਜ ਕਰ ਲਈ ਗਈ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਪੁਸ਼ਟੀ ਕਰੋ।',
      options: ['ਜਾਣਕਾਰੀ ਦੀ ਸਮੀਖਿਆ ਕਰੋ ਅਤੇ ਪੁਸ਼ਟੀ ਕਰੋ / Review & Confirm']
    }
  }
};
