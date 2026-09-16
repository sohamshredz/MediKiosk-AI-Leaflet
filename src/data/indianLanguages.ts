import { SupportedLanguage } from '../types';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  speechCode: string;
  flagEmoji: string;
  greeting: string;
  welcomeVoicePrompt: string;
  sampleComplaints: string[];
  bodyParts: Record<string, string>;
}

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageInfo> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    speechCode: 'en-IN',
    flagEmoji: '🇮🇳',
    greeting: 'Welcome to MediKiosk. How can I help you today?',
    welcomeVoicePrompt: 'Hello, please tell me what health problems or symptoms you are experiencing today. You can speak naturally or tap the screen.',
    sampleComplaints: [
      'Chest pain and breathlessness since 2 days',
      'Severe cough, fever and throat pain',
      'Joint pain in both knees with morning stiffness',
      'Stomach pain and acid reflux after eating'
    ],
    bodyParts: {
      head: 'Head & Neck',
      chest: 'Chest & Heart',
      abdomen: 'Stomach & Digestion',
      limbs: 'Arms, Legs & Joints',
      spine: 'Back & Spine',
      throat: 'Throat & ENT',
      skin: 'Skin & Allergy',
      systemic: 'Whole Body / Fever / Fatigue'
    }
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिंदी',
    speechCode: 'hi-IN',
    flagEmoji: '🇮🇳',
    greeting: 'मेडीकियोस्क में आपका स्वागत है। आज आपकी क्या सहायता कर सकते हैं?',
    welcomeVoicePrompt: 'नमस्ते, कृपया बताएं कि आज आपको क्या तकलीफ या लक्षण महसूस हो रहे हैं? आप बोलकर या स्क्रीन छूकर बता सकते हैं।',
    sampleComplaints: [
      '2 दिनों से सीने में दर्द और सांस फूलने की समस्या है',
      'तेज़ खांसी, बुखार और गले में दर्द',
      'दोनों घुटनों में दर्द और सुबह अकड़न',
      'पेट में दर्द, गैस और खट्टी डकारें'
    ],
    bodyParts: {
      head: 'सिर और गर्दन',
      chest: 'सीना और दिल',
      abdomen: 'पेट और पाचन',
      limbs: 'हाथ, पैर और जोड़',
      spine: 'पीठ और रीढ़',
      throat: 'गला और कान-नाक',
      skin: 'त्वचा और एलर्जी',
      systemic: 'पूरा शरीर / बुखार / थकान'
    }
  },
  mr: {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    speechCode: 'mr-IN',
    flagEmoji: '🇮🇳',
    greeting: 'मेडीकियोस्क मध्ये आपले स्वागत आहे. आज आम्ही आपल्याला कशी मदत करू शकतो?',
    welcomeVoicePrompt: 'नमस्कार, कृपया सांगा आज आपल्याला काय त्रास होत आहे? आपण बोलून किंवा स्क्रीनवर स्पर्श करून सांगू शकता.',
    sampleComplaints: [
      '२ दिवसांपासून छातीत दुखणे आणि धाप लागणे',
      'खोकला, ताप आणि घसा दुखणे',
      'दोन्ही गुडघेदुखी आणि सकाळी ताठरपणा',
      'पोटदुखी आणि अपचनाचा त्रास'
    ],
    bodyParts: {
      head: 'डोके आणि मान',
      chest: 'छाती आणि हृदय',
      abdomen: 'पोट आणि पचन',
      limbs: 'हात, पाय आणि सांधे',
      spine: 'पाठ आणि कणा',
      throat: 'घसा आणि कान-नाक',
      skin: 'त्वचा आणि ऍलर्जी',
      systemic: 'संपूर्ण शरीर / ताप / थकवा'
    }
  },
  ta: {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    speechCode: 'ta-IN',
    flagEmoji: '🇮🇳',
    greeting: 'மெடிகியோஸ்க்கிற்கு நல்வரவு. இன்று உங்களுக்கு எப்படி உதவ முடியும்?',
    welcomeVoicePrompt: 'வணக்கம், இன்று உங்களுக்கு என்ன உடல்நல பிரச்சனை உள்ளது என்று கூறுங்கள். நீங்கள் பேசியோ அல்லது திரையை தொட்டோ தெரிவிக்கலாம்.',
    sampleComplaints: [
      '2 நாட்களாக நெஞ்சு வலி மற்றும் மூச்சுத் திணறல்',
      'கடுமையான இருமல், காய்ச்சல் மற்றும் தொண்டை வலி',
      'முழங்கால் வலி மற்றும் மூட்டு இறுக்கம்',
      'வயிற்று வலி மற்றும் செரிமானக் கோளாறு'
    ],
    bodyParts: {
      head: 'தலை மற்றும் கழுத்து',
      chest: 'மார்பு மற்றும் இதயம்',
      abdomen: 'வயிறு மற்றும் செரிமானம்',
      limbs: 'கைகள், கால்கள் மற்றும் மூட்டுகள்',
      spine: 'முதுகு மற்றும் தண்டுவடம்',
      throat: 'தொண்டை மற்றும் காது-மூக்கு',
      skin: 'தோல் மற்றும் ஒவ்வாமை',
      systemic: 'முழு உடல் / காய்ச்சல் / சோர்வு'
    }
  },
  te: {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    speechCode: 'te-IN',
    flagEmoji: '🇮🇳',
    greeting: 'మెడికియోస్క్‌కు స్వాగతం. ఈరోజు మీకు ఎలా సహాయపడగలం?',
    welcomeVoicePrompt: 'నమస్కారం, ఈరోజు మీకు ఎలాంటి ఆరోగ్య సమస్యలు ఉన్నాయో దయచేసి చెప్పండి. మీరు మాట్లాడవచ్చు లేదా స్క్రీన్ తాకవచ్చు.',
    sampleComplaints: [
      '2 రోజుల నుండి ఛాతీ నొప్పి మరియు ఆయాసం',
      'తీవ్రమైన దగ్గు, జ్వరం మరియు గొంతు నొప్పి',
      'మోకాళ్ల నొప్పులు మరియు ఉదయం పట్టేయడం',
      'కడుపు నొప్పి మరియు అజీర్ణం'
    ],
    bodyParts: {
      head: 'తల మరియు మెడ',
      chest: 'ఛాతీ మరియు గుండె',
      abdomen: 'కడుపు మరియు జీర్ణక్రియ',
      limbs: 'చేతులు, కాళ్లు మరియు కీళ్లు',
      spine: 'వెన్ను మరియు వెన్నెముక',
      throat: 'గొంతు మరియు ఈఎన్‌టీ',
      skin: 'చర్మం మరియు అలెర్జీ',
      systemic: 'మొత్తం శరీరం / జ్వరం / నీరసం'
    }
  },
  bn: {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    speechCode: 'bn-IN',
    flagEmoji: '🇮🇳',
    greeting: 'মেডিকিয়স্কে স্বাগতম। আজ আমরা আপনাকে কীভাবে সাহায্য করতে পারি?',
    welcomeVoicePrompt: 'নমস্কার, অনুগ্রহ করে বলুন আজ আপনার কী শারীরিক সমস্যা হচ্ছে? আপনি মুখে বলতে পারেন বা স্ক্রিন স্পর্শ করতে পারেন।',
    sampleComplaints: [
      '২ দিন ধরে বুকে ব্যথা ও শ্বাসকষ্ট হচ্ছে',
      'তীব্র কাশি, জ্বর এবং গলা ব্যথা',
      'হাঁটুতে ব্যথা ও সকালে গাঁট শক্ত হওয়া',
      'পেটে ব্যথা এবং অম্বলের সমস্যা'
    ],
    bodyParts: {
      head: 'মাথা এবং ঘাড়',
      chest: 'বুক এবং হৃদযন্ত্র',
      abdomen: 'পেট এবং হজম',
      limbs: 'হাত, পা এবং হাড়ের জোড়',
      spine: 'পিঠ এবং মেরুদণ্ড',
      throat: 'গলা এবং কান-নাক',
      skin: 'ত্বক এবং অ্যালার্জি',
      systemic: 'পুরো শরীর / জ্বর / দুর্বলতা'
    }
  },
  gu: {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    speechCode: 'gu-IN',
    flagEmoji: '🇮🇳',
    greeting: 'મેડિકિયોસ્કમાં આપનું સ્વાગત છે. આજે અમે તમને કેવી રીતે મદદ કરી શકીએ?',
    welcomeVoicePrompt: 'નમસ્તે, કૃપા કરીને જણાવો કે આજે તમને શું તકલીફ છે? તમે બોલીને અથવા સ્ક્રીનને અડીને જણાવી શકો છો.',
    sampleComplaints: [
      '2 દિવસથી છાતીમાં દુખાવો અને શ્વાસ લેવામાં તકલીફ',
      'ખાંસી, તાવ અને ગળામાં દુખાવો',
      'ઘૂંટણમાં દુખાવો અને સવારે અકડાઈ જવું',
      'પેટમાં દુખાવો અને એસિડિટી'
    ],
    bodyParts: {
      head: 'માથું અને ગરદન',
      chest: 'છાતી અને હૃદય',
      abdomen: 'પેટ અને પાચન',
      limbs: 'હાથ, પગ અને સાંધા',
      spine: 'પીઠ અને કરોડરજ્જુ',
      throat: 'ગળું અને કાન-નાક',
      skin: 'ચામડી અને એલર્જી',
      systemic: 'આખું શરીર / તાવ / થાક'
    }
  },
  kn: {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    speechCode: 'kn-IN',
    flagEmoji: '🇮🇳',
    greeting: 'ಮೆಡಿಕಿಯೋಸ್ಕ್‌ಗೆ ಸುಸ್ವಾಗತ. ಇಂದು ನಾವು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?',
    welcomeVoicePrompt: 'ನಮಸ್ಕಾರ, ಇಂದು ನಿಮಗೆ ಯಾವ ಆರೋಗ್ಯ ಸಮಸ್ಯೆ ಇದೆ ಎಂದು ದಯವಿಟ್ಟು ತಿಳಿಸಿ. ನೀವು ಮಾತನಾಡಿ ಅಥವಾ ಪರದೆಯನ್ನು ಮುಟ್ಟಿ ತಿಳಿಸಬಹುದು.',
    sampleComplaints: [
      '2 ದಿನಗಳಿಂದ ಎದೆ ನೋವು ಮತ್ತು ಉಸಿರಾಟದ ತೊಂದರೆ',
      'ಕೆಮ್ಮು, ಜ್ವರ ಮತ್ತು ಗಂಟಲು ನೋವು',
      'ಮೊಣಕಾಲು ನೋವು ಮತ್ತು ಕೀಲು ಬಿಗಿತ',
      'ಹೊಟ್ಟೆ ನೋವು ಮತ್ತು ಅಜೀರ್ಣ'
    ],
    bodyParts: {
      head: 'ತಲೆ ಮತ್ತು ಕುತ್ತಿಗೆ',
      chest: 'ಎದೆ ಮತ್ತು ಹೃದಯ',
      abdomen: 'ಹೊಟ್ಟೆ ಮತ್ತು ಜೀರ್ಣಕ್ರಿಯೆ',
      limbs: 'ಕೈಗಳು, ಕಾಲುಗಳು ಮತ್ತು ಕೀಲುಗಳು',
      spine: 'ಬೆನ್ನು ಮತ್ತು ಬೆನ್ನೆಲುಬು',
      throat: 'ಗಂಟಲು ಮತ್ತು ಕಿವಿ-ಮೂಗು',
      skin: 'ಚರ್ಮ ಮತ್ತು ಅಲರ್ಜಿ',
      systemic: 'ಇಡೀ ದೇಹ / ಜ್ವರ / ಆಯಾಸ'
    }
  },
  ml: {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    speechCode: 'ml-IN',
    flagEmoji: '🇮🇳',
    greeting: 'മെഡിക്കിയോസ്കിലേക്ക് സ്വാഗതം. ഇന്ന് നിങ്ങൾക്ക് എങ്ങനെ സഹായിക്കാനാകും?',
    welcomeVoicePrompt: 'നമസ്കാരം, ഇന്ന് നിങ്ങൾക്ക് എന്ത് ആരോഗ്യപ്രശ്നമാണ് ഉള്ളതെന്ന് ദയവായി പറയുക. നിങ്ങൾക്ക് സംസാരിക്കുകയോ സ്ക്രീനിൽ തൊടുകയോ ചെയ്യാം.',
    sampleComplaints: [
      '2 ദിവസമായി നെഞ്ചുവേദനയും ശ്വാസതടസ്സവും',
      'കടുത്ത ചുമയും പനിയും തൊണ്ടവേദനയും',
      'മുട്ടുവേദനയും സന്ധിവേദനയും',
      'വയറുവേദനയും ദഹനക്കേടും'
    ],
    bodyParts: {
      head: 'തലയും കഴുത്തും',
      chest: 'നെഞ്ചും ഹൃദയവും',
      abdomen: 'വയറും ദഹനവും',
      limbs: 'കൈകാലുകളും സന്ധികളും',
      spine: 'പുറവും നട്ടെല്ലും',
      throat: 'തൊണ്ടയും ഇ.എൻ.ടിയും',
      skin: 'ത്വക്കും അലർജിയും',
      systemic: 'ശരീരമാസകലം / പനി / ക്ഷീണം'
    }
  },
  pa: {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    speechCode: 'pa-IN',
    flagEmoji: '🇮🇳',
    greeting: 'ਮੈਡੀਕਿਓਸਕ ਵਿੱਚ ਜੀ ਆਇਆਂ ਨੂੰ। ਅੱਜ ਅਸੀਂ ਤੁਹਾਡੀ ਕੀ ਮਦਦ ਕਰ ਸਕਦੇ ਹਾਂ?',
    welcomeVoicePrompt: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਕਿਰਪਾ ਕਰਕੇ ਦੱਸੋ ਕਿ ਅੱਜ ਤੁਹਾਨੂੰ ਕੀ ਤਕਲੀਫ ਹੈ? ਤੁਸੀਂ ਬੋਲ ਕੇ ਜਾਂ ਸਕ੍ਰੀਨ ਨੂੰ ਛੂਹ ਕੇ ਦੱਸ ਸਕਦੇ ਹੋ।',
    sampleComplaints: [
      '2 ਦਿਨਾਂ ਤੋਂ ਛਾਤੀ ਵਿੱਚ ਦਰਦ ਅਤੇ ਸਾਹ ਚੜ੍ਹਨਾ',
      'ਤੇਜ਼ ਖੰਘ, ਬੁਖ਼ਾਰ ਅਤੇ ਗਲੇ ਵਿੱਚ ਦਰਦ',
      'ਗੋਡਿਆਂ ਦਾ ਦਰਦ ਅਤੇ ਸਵੇਰੇ ਅਕੜਾਅ',
      'ਪੇਟ ਵਿੱਚ ਦਰਦ ਅਤੇ ਗੈਸ ਦੀ ਸਮੱਸਿਆ'
    ],
    bodyParts: {
      head: 'ਸਿਰ ਅਤੇ ਗਰਦਨ',
      chest: 'ਛਾਤੀ ਅਤੇ ਦਿਲ',
      abdomen: 'ਪੇਟ ਅਤੇ ਹਾਜ਼ਮਾ',
      limbs: 'ਹੱਥ, ਪੈਰ ਅਤੇ ਜੋੜ',
      spine: 'ਪਿੱਠ ਅਤੇ ਰੀੜ੍ਹ ਦੀ ਹੱਡੀ',
      throat: 'ਗਲਾ ਅਤੇ ਕੰਨ-ਨੱਕ',
      skin: 'ਚਮੜੀ ਅਤੇ ਐਲਰਜੀ',
      systemic: 'ਪੂਰਾ ਸਰੀਰ / ਬੁਖ਼ਾਰ / ਥਕਾਵਟ'
    }
  }
};
