import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Loader2, 
  Languages, 
  Keyboard, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Navigation,
  Compass,
  Building2,
  Siren,
  RefreshCw
} from 'lucide-react';
import { SupportedLanguage } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { 
  createSpeechRecognizer, 
  processHospitalVoiceCommand, 
  speakVoiceResponse, 
  stopSpeaking,
  VoiceIntentResult 
} from '../../services/voiceHospitalService';

interface HospitalVoiceControllerProps {
  currentCoords: { lat: number; lng: number } | null;
  onExecuteIntent: (intentResult: VoiceIntentResult) => void;
  isOpen: boolean;
  onClose: () => void;
}

const LANGUAGE_LABELS: Record<SupportedLanguage, { name: string; native: string }> = {
  en: { name: 'English', native: 'English (India)' },
  hi: { name: 'Hindi', native: 'हिन्दी' },
  bn: { name: 'Bengali', native: 'বাংলা' },
  mr: { name: 'Marathi', native: 'मराठी' },
  ta: { name: 'Tamil', native: 'தமிழ்' },
  te: { name: 'Telugu', native: 'తెలుగు' },
  gu: { name: 'Gujarati', native: 'ગુજરાતી' },
  kn: { name: 'Kannada', native: 'ಕನ್ನಡ' },
  ml: { name: 'Malayalam', native: 'മലയാളം' },
  pa: { name: 'Punjabi', native: 'ਪੰਜਾਬੀ' }
};

export const HospitalVoiceController: React.FC<HospitalVoiceControllerProps> = ({
  currentCoords,
  onExecuteIntent,
  isOpen,
  onClose
}) => {
  const { language, setLanguage } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(language as SupportedLanguage || 'en');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [lastIntent, setLastIntent] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [audioFeedbackEnabled, setAudioFeedbackEnabled] = useState<boolean>(true);
  const [showKeyboardFallback, setShowKeyboardFallback] = useState<boolean>(false);
  const [manualTextQuery, setManualTextQuery] = useState<string>('');

  const recognizerRef = useRef<{ start: () => void; stop: () => void; isSupported: boolean } | null>(null);

  // Sync selectedLang with LanguageContext
  useEffect(() => {
    if (language) {
      setSelectedLang(language as SupportedLanguage);
    }
  }, [language]);

  // Clean up speech synthesis on unmount or close
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
    };
  }, []);

  const handleStartListening = () => {
    setErrorMessage(null);
    setTranscript('');
    setLastResponse(null);
    setLastIntent(null);
    stopSpeaking();

    const recognizer = createSpeechRecognizer(
      selectedLang,
      (text, isFinal) => {
        setTranscript(text);
        if (isFinal) {
          handleProcessVoiceInput(text);
        }
      },
      (error) => {
        setIsListening(false);
        if (error === 'not-allowed') {
          setErrorMessage('Microphone access was denied. You can type your command below.');
          setShowKeyboardFallback(true);
        } else {
          setErrorMessage(`Speech recognition notice: ${error}. Try speaking again or type your query.`);
        }
      },
      () => {
        setIsListening(false);
      }
    );

    recognizerRef.current = recognizer;

    if (!recognizer.isSupported) {
      setErrorMessage('Voice recognition is not supported in this browser. Please use keyboard search below.');
      setShowKeyboardFallback(true);
      return;
    }

    try {
      setIsListening(true);
      recognizer.start();
    } catch (e) {
      setIsListening(false);
      console.warn('Failed to start speech recognition:', e);
    }
  };

  const handleStopListening = () => {
    if (recognizerRef.current) {
      recognizerRef.current.stop();
    }
    setIsListening(false);
    if (transcript.trim() && !isProcessing) {
      handleProcessVoiceInput(transcript);
    }
  };

  const handleProcessVoiceInput = async (inputText: string) => {
    if (!inputText || !inputText.trim()) return;

    setIsListening(false);
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const intentResult = await processHospitalVoiceCommand(
        inputText.trim(),
        selectedLang,
        currentCoords || undefined
      );

      setLastIntent(intentResult.intent);
      setLastResponse(intentResult.spokenResponse);

      // Execute intent on parent map component
      onExecuteIntent(intentResult);

      // Speak response if audio feedback enabled
      if (audioFeedbackEnabled && intentResult.spokenResponse) {
        setIsSpeaking(true);
        speakVoiceResponse(
          intentResult.spokenResponse,
          selectedLang,
          () => setIsSpeaking(true),
          () => setIsSpeaking(false),
          () => setIsSpeaking(false)
        );
      }
    } catch (err: any) {
      console.error('Error processing voice command:', err);
      setErrorMessage('Could not process voice command. Please try again or type below.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTextQuery.trim()) return;
    handleProcessVoiceInput(manualTextQuery);
    setManualTextQuery('');
  };

  const handleQuickChipClick = (phrase: string) => {
    setTranscript(phrase);
    handleProcessVoiceInput(phrase);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="px-5 py-4 bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-teal-200">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                AI Voice Hospital Assistant
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-500/30 text-teal-200 border border-teal-400/30">
                  Multilingual
                </span>
              </h3>
              <p className="text-xs text-teal-100/80">Speak naturally in any of 10 Indian languages</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setAudioFeedbackEnabled(!audioFeedbackEnabled);
                if (isSpeaking) stopSpeaking();
              }}
              className={`p-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                audioFeedbackEnabled ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title={audioFeedbackEnabled ? 'Audio Speech Feedback ON' : 'Audio Feedback Muted'}
            >
              {audioFeedbackEnabled ? <Volume2 className="w-4 h-4 text-emerald-300" /> : <VolumeX className="w-4 h-4" />}
            </button>
            
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* LANGUAGE SELECTOR */}
          <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Languages className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>Voice Language:</span>
            </div>
            <select
              value={selectedLang}
              onChange={(e) => {
                const newL = e.target.value as SupportedLanguage;
                setSelectedLang(newL);
                setLanguage(newL);
              }}
              className="px-3 py-1 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-2xs"
            >
              {Object.entries(LANGUAGE_LABELS).map(([code, info]) => (
                <option key={code} value={code}>
                  {info.native} ({info.name})
                </option>
              ))}
            </select>
          </div>

          {/* MAIN VOICE INTERACTION AREA */}
          <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-teal-50/60 to-slate-50 dark:from-slate-800/60 dark:to-slate-900 rounded-2xl border border-teal-100 dark:border-slate-700 text-center relative overflow-hidden">
            
            {/* Animated Audio Wave Rings when Listening */}
            {isListening && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="absolute w-28 h-28 rounded-full bg-teal-400/20 animate-ping" />
                <span className="absolute w-36 h-36 rounded-full bg-teal-500/10 animate-pulse" />
              </div>
            )}

            {/* Mic Button */}
            <button
              type="button"
              id="voice-assistant-mic-btn"
              onClick={isListening ? handleStopListening : handleStartListening}
              disabled={isProcessing}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all transform active:scale-95 cursor-pointer ${
                isListening
                  ? 'bg-rose-600 text-white ring-4 ring-rose-300 animate-pulse shadow-rose-500/40'
                  : isProcessing
                  ? 'bg-amber-500 text-white shadow-amber-500/30'
                  : 'bg-teal-700 hover:bg-teal-800 text-white shadow-teal-700/30 hover:scale-105'
              }`}
            >
              {isListening ? (
                <MicOff className="w-8 h-8 animate-bounce" />
              ) : isProcessing ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>

            <div className="mt-3">
              <p className="font-bold text-sm text-slate-800 dark:text-slate-100">
                {isListening
                  ? 'Listening... Speak now'
                  : isProcessing
                  ? 'Analyzing voice intent...'
                  : 'Tap Microphone to Speak'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isListening
                  ? 'Say "Find nearest hospital", "Show emergency hospitals", "Hospitals in Kolkata"...'
                  : `Active Speech Model: ${LANGUAGE_LABELS[selectedLang].native}`}
              </p>
            </div>

            {/* Realtime Live Transcript */}
            {(transcript || isListening) && (
              <div className="w-full mt-4 p-3 bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-700/60 rounded-xl text-xs text-slate-800 dark:text-slate-200 text-left shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 block mb-1">
                  {isListening ? 'Live Transcript:' : 'You Said:'}
                </span>
                <p className="font-medium italic text-slate-900 dark:text-slate-100">
                  {transcript ? `"${transcript}"` : 'Listening for your voice...'}
                </p>
              </div>
            )}

            {/* AI Spoken Response Box */}
            {lastResponse && (
              <div className="w-full mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-950 dark:text-emerald-200 text-left shadow-2xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                      MediKiosk AI Response
                    </span>
                    {lastIntent && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 bg-emerald-200/80 dark:bg-emerald-800/80 rounded text-emerald-900 dark:text-emerald-100 font-bold">
                        {lastIntent}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-emerald-900 dark:text-emerald-100 font-medium">{lastResponse}</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="w-full mt-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-200 text-left flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <p className="flex-1">{errorMessage}</p>
              </div>
            )}
          </div>

          {/* QUICK INTENT SUGGESTION CHIPS */}
          <div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-2">
              Try saying or tapping:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickChipClick('Find hospitals near me')}
                className="p-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 rounded-xl text-left font-medium text-slate-700 dark:text-slate-300 hover:text-teal-900 dark:hover:text-teal-200 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="truncate">"Hospitals near me"</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickChipClick('Find the nearest hospital')}
                className="p-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 rounded-xl text-left font-medium text-slate-700 dark:text-slate-300 hover:text-teal-900 dark:hover:text-teal-200 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="truncate">"Nearest hospital"</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickChipClick('Find an emergency hospital')}
                className="p-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-700 rounded-xl text-left font-medium text-slate-700 dark:text-slate-300 hover:text-rose-900 dark:hover:text-rose-200 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Siren className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                <span className="truncate">"Emergency trauma center"</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickChipClick('Show directions to the nearest hospital')}
                className="p-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-xl text-left font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-900 dark:hover:text-indigo-200 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="truncate">"Show driving directions"</span>
              </button>
            </div>
          </div>

          {/* KEYBOARD INPUT FALLBACK TOGGLE & FORM */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            {!showKeyboardFallback ? (
              <button
                type="button"
                onClick={() => setShowKeyboardFallback(true)}
                className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-300 flex items-center gap-1.5 cursor-pointer py-1"
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>Prefer typing? Open text query fallback</span>
              </button>
            ) : (
              <form onSubmit={handleManualSubmit} className="space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Type Voice Command or Location</span>
                  <button
                    type="button"
                    onClick={() => setShowKeyboardFallback(false)}
                    className="text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    Hide
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualTextQuery}
                    onChange={(e) => setManualTextQuery(e.target.value)}
                    placeholder="e.g. Find emergency hospitals in Kolkata..."
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="submit"
                    disabled={!manualTextQuery.trim() || isProcessing}
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    Send
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Integrates with OpenStreetMap & Live GPS</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
