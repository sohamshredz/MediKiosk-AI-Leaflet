// AI Voice Control Service for MediKiosk Hospital Map & Emergency Location System
// Supports Web Speech Recognition and Synthesis across 10 Indian languages, with Gemini AI + Local NLU Fallback.

import { SupportedLanguage } from '../types';

export type VoiceIntentType = 
  | 'NEARBY_HOSPITALS'
  | 'NEAREST_HOSPITAL'
  | 'EMERGENCY_HOSPITALS'
  | 'SEARCH_LOCATION'
  | 'SELECT_HOSPITAL'
  | 'DIRECTIONS'
  | 'ETA_DISTANCE'
  | 'REFRESH_LOCATION'
  | 'HELP'
  | 'UNKNOWN';

export interface VoiceIntentResult {
  intent: VoiceIntentType;
  queryLocation?: string;
  hospitalIndex?: number;
  hospitalName?: string;
  spokenResponse: string;
  confidence?: number;
  source: 'gemini_ai' | 'local_nlu';
}

// BCP-47 Language Tag Mapping for Web Speech Recognition & Synthesis
export const LANGUAGE_SPEECH_CODES: Record<SupportedLanguage, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  bn: 'bn-IN',
  mr: 'mr-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  gu: 'gu-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  pa: 'pa-IN'
};

// Natural language intent keywords for instant zero-latency local fallback
export function parseLocalHospitalVoiceIntent(
  rawTranscript: string,
  lang: SupportedLanguage = 'en'
): VoiceIntentResult {
  const text = rawTranscript.trim().toLowerCase();

  // 1. Directions / Routing / ETA
  if (
    text.includes('eta') ||
    text.includes('how far') ||
    text.includes('how long') ||
    text.includes('estimated time') ||
    text.includes('travel time') ||
    text.includes('कितनी दूर') ||
    text.includes('कितना समय') ||
    text.includes('কত দূর') ||
    text.includes('কত সময়')
  ) {
    return {
      intent: 'ETA_DISTANCE',
      spokenResponse: getLocalizedSpokenText('ETA_DISTANCE', lang),
      source: 'local_nlu'
    };
  }

  if (
    text.includes('direction') ||
    text.includes('take me there') ||
    text.includes('route') ||
    text.includes('navigate') ||
    text.includes('how to reach') ||
    text.includes('रास्ता') ||
    text.includes('दिशा') ||
    text.includes('दिशाएं') ||
    text.includes('পথ') ||
    text.includes('দিকনির্দেশ') ||
    text.includes('मार्ग') ||
    text.includes('திசை') ||
    text.includes('రూట్') ||
    text.includes('ರಸ್ತೆ') ||
    text.includes('ਦਿਸ਼ਾ')
  ) {
    return {
      intent: 'DIRECTIONS',
      spokenResponse: getLocalizedSpokenText('DIRECTIONS', lang),
      source: 'local_nlu'
    };
  }

  // 2. Nearest Hospital
  if (
    text.includes('nearest') ||
    text.includes('closest') ||
    text.includes('close to me') ||
    text.includes('সবচেয়ে কাছে') ||
    text.includes('সবচেয়ে কাছের') ||
    text.includes('सबसे पास') ||
    text.includes('सबसे नजदीक') ||
    text.includes('जवळचे') ||
    text.includes('மிகவும் அருகில்') ||
    text.includes('దగ్గరగా ఉన్న') ||
    text.includes('అత్యంత సమీప') ||
    text.includes('સૌથી નજીક') ||
    text.includes('ಹತ್ತಿರದ') ||
    text.includes('ഏറ്റവും അടുത്തുള്ള') ||
    text.includes('ਸਭ ਤੋਂ ਨੇੜੇ')
  ) {
    return {
      intent: 'NEAREST_HOSPITAL',
      spokenResponse: getLocalizedSpokenText('NEAREST_HOSPITAL', lang),
      source: 'local_nlu'
    };
  }

  // 3. Emergency Hospitals
  if (
    text.includes('emergency') ||
    text.includes('trauma') ||
    text.includes('icu') ||
    text.includes('urgent') ||
    text.includes('आपातकालीन') ||
    text.includes('इमरजेंसी') ||
    text.includes('জরুরী') ||
    text.includes('ইমার্জেন্সি') ||
    text.includes('तात्काळ') ||
    text.includes('அவசர') ||
    text.includes('అత్యవసర') ||
    text.includes('ઇમરજન્સી') ||
    text.includes('ತುರ್ತು') ||
    text.includes('അടിയന്തിര') ||
    text.includes('ਐਮਰਜੈਂਸੀ')
  ) {
    return {
      intent: 'EMERGENCY_HOSPITALS',
      spokenResponse: getLocalizedSpokenText('EMERGENCY_HOSPITALS', lang),
      source: 'local_nlu'
    };
  }

  // 4. Select by Order (1st, 2nd, etc.)
  const firstMatch = text.match(/(?:first|1st|पहला|প্রথম|पहिले|முதல்|మొదటి|પ્રથમ|ಮೊದಲ|ആദ്യത്തെ|ਪਹਿਲਾ)/i);
  if (firstMatch) {
    return {
      intent: 'SELECT_HOSPITAL',
      hospitalIndex: 0,
      spokenResponse: getLocalizedSpokenText('SELECT_HOSPITAL', lang, '1'),
      source: 'local_nlu'
    };
  }
  const secondMatch = text.match(/(?:second|2nd|दूसरा|দ্বিতীয়|दुसरे|இரண்டாவது|రెండవ|બીજું|ಎರಡನೇ|രണ്ടാമത്തെ|ਦੂਜਾ)/i);
  if (secondMatch) {
    return {
      intent: 'SELECT_HOSPITAL',
      hospitalIndex: 1,
      spokenResponse: getLocalizedSpokenText('SELECT_HOSPITAL', lang, '2'),
      source: 'local_nlu'
    };
  }

  // 5. City/Location specific search (e.g., "in Kolkata", "near Salt Lake", "in Mumbai", "in Bengaluru")
  const inLocationMatch = text.match(/(?:in|near|around|at|में|मध्ये|இல்|లో|யில்|मधील|ਵਿੱਚ|কাছে|তে)\s+([a-zA-Z\u0900-\u0D7F\s]{3,30})/i);
  if (inLocationMatch && inLocationMatch[1]) {
    const rawLoc = inLocationMatch[1].replace(/(?:hospitals?|hospital|medical|centres?|clinic|डॉक्टर|হাসপাতাল|अस्पताल)/gi, '').trim();
    if (rawLoc.length >= 3) {
      return {
        intent: 'SEARCH_LOCATION',
        queryLocation: rawLoc,
        spokenResponse: getLocalizedSpokenText('SEARCH_LOCATION', lang, rawLoc),
        source: 'local_nlu'
      };
    }
  }

  // 6. Refresh Location / My GPS
  if (
    text.includes('my location') ||
    text.includes('where am i') ||
    text.includes('gps') ||
    text.includes('मेरी लोकेशन') ||
    text.includes('আমার অবস্থান') ||
    text.includes('माझे स्थान') ||
    text.includes('எனது இருப்பிடம்') ||
    text.includes('నా స్థానం') ||
    text.includes('મારું સ્થાન') ||
    text.includes('ನನ್ನ ಸ್ಥಳ') ||
    text.includes('എന്റെ സ്ഥലം') ||
    text.includes('ਮੇਰਾ ਸਥਾਨ')
  ) {
    return {
      intent: 'REFRESH_LOCATION',
      spokenResponse: getLocalizedSpokenText('REFRESH_LOCATION', lang),
      source: 'local_nlu'
    };
  }

  // 7. Generic Nearby Hospitals
  if (
    text.includes('hospital') ||
    text.includes('clinic') ||
    text.includes('doctor') ||
    text.includes('medical') ||
    text.includes('अस्पताल') ||
    text.includes('হাসপাতাল') ||
    text.includes('रुग्णालय') ||
    text.includes('மருத்துவமனை') ||
    text.includes('ఆసుపత్రి') ||
    text.includes('હોસ્પિટલ') ||
    text.includes('ಆಸ್ಪತ್ರೆ') ||
    text.includes('ആശുപത്രി') ||
    text.includes('ਹਸਪਤਾਲ')
  ) {
    return {
      intent: 'NEARBY_HOSPITALS',
      spokenResponse: getLocalizedSpokenText('NEARBY_HOSPITALS', lang),
      source: 'local_nlu'
    };
  }

  return {
    intent: 'NEARBY_HOSPITALS',
    spokenResponse: getLocalizedSpokenText('NEARBY_HOSPITALS', lang),
    source: 'local_nlu'
  };
}

/**
 * Localized Voice Response Strings
 */
function getLocalizedSpokenText(intent: VoiceIntentType, lang: SupportedLanguage, param?: string): string {
  switch (lang) {
    case 'hi':
      if (intent === 'NEAREST_HOSPITAL') return 'आपके सबसे नज़दीक उपलब्ध अस्पताल की जानकारी दिखाई जा रही है।';
      if (intent === 'EMERGENCY_HOSPITALS') return 'आस-पास के आपातकालीन और ट्रॉमा अस्पतालों को खोजा जा रहा है।';
      if (intent === 'DIRECTIONS') return 'चयनित अस्पताल का रास्ता मैप पर दिखाया जा रहा है।';
      if (intent === 'ETA_DISTANCE') return 'अस्पताल की दूरी और अनुमानित समय (ETA) की गणना की गई है।';
      if (intent === 'SEARCH_LOCATION') return `${param || 'स्थान'} के नज़दीकी अस्पतालों की खोज की जा रही है।`;
      if (intent === 'SELECT_HOSPITAL') return `अस्पताल संख्या ${param || '1'} को चुना गया है।`;
      if (intent === 'REFRESH_LOCATION') return 'आपकी वर्तमान जीपीएस लोकेशन को अपडेट किया जा रहा है।';
      return 'आपके आस-पास के अस्पतालों की सूची अपडेट की जा रही है।';

    case 'bn':
      if (intent === 'NEAREST_HOSPITAL') return 'আপনার সবচেয়ে কাছের হাসপাতালের তথ্য দেখানো হচ্ছে।';
      if (intent === 'EMERGENCY_HOSPITALS') return 'জরুরী ও ট্রমা সেবাযুক্ত হাসপাতাল খোঁজা হচ্ছে।';
      if (intent === 'DIRECTIONS') return 'নির্বাচিত হাসপাতালের দিকনির্দেশ ম্যাপে দেখানো হচ্ছে।';
      if (intent === 'ETA_DISTANCE') return 'হাসপাতালের দূরত্ব ও পৌঁছানোর আনুমানিক সময় দেখানো হচ্ছে।';
      if (intent === 'SEARCH_LOCATION') return `${param || 'এলাকার'} নিকটবর্তী হাসপাতাল খোঁজা হচ্ছে।`;
      if (intent === 'SELECT_HOSPITAL') return `${param || '১'} নম্বর হাসপাতালটি নির্বাচন করা হয়েছে।`;
      return 'আপনার আশেপাশের হাসপাতালের তালিকা খোঁজা হচ্ছে।';

    case 'mr':
      if (intent === 'NEAREST_HOSPITAL') return 'तुमच्या सर्वात जवळचे रुग्णालय शोधले जात आहे.';
      if (intent === 'EMERGENCY_HOSPITALS') return 'तातडीच्या वैद्यकीय सेवा असणारी रुग्णालये शोधली जात आहेत.';
      if (intent === 'DIRECTIONS') return 'निवडलेल्या रुग्णालयाचा मार्ग नकाशावर दाखवला जात आहे.';
      if (intent === 'ETA_DISTANCE') return 'रुग्णालयाचे अंतर आणि पोहोचण्याचा वेळ दाखवला जात आहे.';
      return 'जवळची रुग्णालये शोधली जात आहेत.';

    case 'ta':
      if (intent === 'NEAREST_HOSPITAL') return 'உங்களுக்கு மிக அருகில் உள்ள மருத்துவமனை காண்பிக்கப்படுகிறது.';
      if (intent === 'EMERGENCY_HOSPITALS') return 'அவசர சிகிச்சை மருத்துவமனைகள் தேடப்படுகின்றன.';
      if (intent === 'DIRECTIONS') return 'தேர்ந்தெடுக்கப்பட்ட மருத்துவமனைக்கான வழி வரைபடத்தில் காட்டப்படுகிறது.';
      if (intent === 'ETA_DISTANCE') return 'மருத்துவமனைக்கான தூரம் மற்றும் பயண நேரம் கணக்கிடப்பட்டது.';
      return 'அருகிலுள்ள மருத்துவமனைகள் தேடப்படுகின்றன.';

    case 'te':
      if (intent === 'NEAREST_HOSPITAL') return 'మీకు అత్యంత సమీపంలో ఉన్న ఆసుపత్రి వివరాలు చూపబడుతున్నాయి.';
      if (intent === 'EMERGENCY_HOSPITALS') return 'అత్యవసర చికిత్స ఆసుపత్రుల కోసం శోధిస్తున్నాము.';
      if (intent === 'ETA_DISTANCE') return 'ఆసుపత్రి దూరం మరియు చేరుకోవడానికి పట్టే సమయం లెక్కించబడింది.';
      return 'సమీప ఆసుపత్రుల వివరాలు సేకరించబడుతున్నాయి.';

    default: // 'en'
      if (intent === 'NEAREST_HOSPITAL') return 'Finding and highlighting the closest hospital to your location.';
      if (intent === 'EMERGENCY_HOSPITALS') return 'Searching for nearby verified emergency and trauma hospitals.';
      if (intent === 'DIRECTIONS') return 'Calculating and displaying the driving directions on the map.';
      if (intent === 'ETA_DISTANCE') return 'Calculating the live travel distance and estimated arrival time.';
      if (intent === 'SEARCH_LOCATION') return `Searching for hospitals in and around ${param || 'the specified location'}.`;
      if (intent === 'SELECT_HOSPITAL') return `Selected hospital option ${param || '1'}.`;
      if (intent === 'REFRESH_LOCATION') return 'Updating your current GPS location coordinates.';
      return 'Searching for nearby hospitals around your current location.';
  }
}

/**
 * Full Natural Language Processing: First queries server Gemini AI endpoint, falls back to local NLU.
 */
export async function processHospitalVoiceCommand(
  transcript: string,
  lang: SupportedLanguage = 'en',
  currentCoords?: { lat: number; lng: number }
): Promise<VoiceIntentResult> {
  try {
    const response = await fetch('/api/voice/hospital-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: transcript,
        language: lang,
        currentCoords
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.intent) {
        return {
          intent: data.intent,
          queryLocation: data.queryLocation,
          hospitalIndex: data.hospitalIndex,
          hospitalName: data.hospitalName,
          spokenResponse: data.spokenResponse || getLocalizedSpokenText(data.intent, lang, data.queryLocation),
          confidence: data.confidence || 0.95,
          source: 'gemini_ai'
        };
      }
    }
  } catch (err) {
    console.warn('Backend Gemini voice intent endpoint unavailable, using local NLU parser:', err);
  }

  // Instant local rule-based intent fallback
  return parseLocalHospitalVoiceIntent(transcript, lang);
}

/**
 * Text to Speech Voice Playback using Web Speech API
 */
let activeUtterance: SpeechSynthesisUtterance | null = null;

export function speakVoiceResponse(
  text: string,
  lang: SupportedLanguage = 'en',
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): () => void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    if (onEnd) onEnd();
    return () => {};
  }

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    activeUtterance = utterance;

    const speechCode = LANGUAGE_SPEECH_CODES[lang] || 'en-IN';
    utterance.lang = speechCode;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick preferred voice if available
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang.startsWith(speechCode.split('-')[0]) || v.lang === speechCode);
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      activeUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      activeUtterance = null;
      if (onError) onError(e);
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
      activeUtterance = null;
    };
  } catch (err) {
    console.warn('Speech synthesis error:', err);
    if (onEnd) onEnd();
    return () => {};
  }
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  }
}

/**
 * Speech Recognition Listener Helper
 */
export function createSpeechRecognizer(
  lang: SupportedLanguage,
  onResult: (transcript: string, isFinal: boolean) => void,
  onError: (error: string) => void,
  onEnd: () => void
): { start: () => void; stop: () => void; isSupported: boolean } {
  if (typeof window === 'undefined') {
    return { start: () => {}, stop: () => {}, isSupported: false };
  }

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) {
    return { start: () => {}, stop: () => {}, isSupported: false };
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = LANGUAGE_SPEECH_CODES[lang] || 'en-IN';

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (final.trim()) {
        onResult(final.trim(), true);
      } else if (interim.trim()) {
        onResult(interim.trim(), false);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition event error:', event.error);
      onError(event.error || 'Speech recognition failed');
    };

    recognition.onend = () => {
      onEnd();
    };

    return {
      start: () => {
        try {
          recognition.start();
        } catch (e) {
          console.warn('Recognition start error:', e);
        }
      },
      stop: () => {
        try {
          recognition.stop();
        } catch (e) {
          console.warn('Recognition stop error:', e);
        }
      },
      isSupported: true
    };
  } catch (err) {
    console.warn('SpeechRecognition initialization error:', err);
    return { start: () => {}, stop: () => {}, isSupported: false };
  }
}
