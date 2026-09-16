import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Keyboard, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ArrowRight, 
  Clock, 
  Activity, 
  FileText, 
  Heart, 
  Stethoscope, 
  Radio, 
  User, 
  ShieldCheck, 
  Info, 
  Sliders, 
  Play, 
  Square, 
  HelpCircle,
  Copy,
  Check,
  ChevronRight,
  Languages,
  Zap,
  PhoneCall,
  Volume1
} from 'lucide-react';
import { PatientProfile, SymptomItem, SupportedLanguage } from '../../types';
import { SUPPORTED_LANGUAGES, LanguageInfo } from '../../data/indianLanguages';
import { AudioRecorder } from '../../utils/audioRecorder';
import { useLanguage } from '../../context/LanguageContext';
import { ORDERED_LANGUAGES } from '../common/LanguageSelector';

interface MultilingualVoiceAIModuleProps {
  currentPatient: PatientProfile;
  selectedLanguage: string;
  onChangeLanguage: (langCode: string) => void;
  onUpdatePatient: (updatedPatient: PatientProfile) => void;
  onNavigateToDoctor?: () => void;
  onNavigateToKiosk?: () => void;
  isStandalone?: boolean;
}

export interface ExtractedVoiceClinicalData {
  detectedLanguage?: string;
  transcriptionSummary?: string;
  symptomsList: Array<{
    name: string;
    duration?: string;
    severity?: number;
    bodyPart?: string;
    isPrimary?: boolean;
    details?: string;
  }>;
  medicalHistoryFound?: string[];
  medicationsFound?: string[];
  isRedFlag?: boolean;
  redFlagReason?: string | null;
  triageUrgency?: 'ROUTINE' | 'MODERATE' | 'URGENT_PRIORITY' | 'CRITICAL_EMERGENCY';
  aiFollowUpSpokenInPatientLanguage?: string;
  aiFollowUpSpokenInEnglish?: string;
  suggestedQuickRepliesInPatientLanguage?: string[];
  doctorConsultationNote?: string;
}

export const MultilingualVoiceAIModule: React.FC<MultilingualVoiceAIModuleProps> = ({
  currentPatient,
  selectedLanguage,
  onChangeLanguage,
  onUpdatePatient,
  onNavigateToDoctor,
  onNavigateToKiosk,
  isStandalone = false
}) => {
  // Input Modes: 'voice' | 'type' | 'announcements' | 'voice_registration'
  const [activeMode, setActiveMode] = useState<'voice' | 'type' | 'announcements' | 'voice_registration'>('voice');
  
  // Speech-to-Text State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [recordedAudioTime, setRecordedAudioTime] = useState<number>(0);
  const [inputText, setInputText] = useState<string>('');
  const [isProcessingAI, setIsProcessingAI] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [liveTranscriptInterim, setLiveTranscriptInterim] = useState<string>('');

  // Text-to-Speech State
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(0.95);
  const [currentSpokenText, setCurrentSpokenText] = useState<string>('');
  
  // Structured Output State
  const [extractedData, setExtractedData] = useState<ExtractedVoiceClinicalData | null>(null);
  const [lastSpokenInput, setLastSpokenInput] = useState<string>('');
  const [isSyncedToEhr, setIsSyncedToEhr] = useState<boolean>(false);
  const [copiedNote, setCopiedNote] = useState<boolean>(false);

  // Announcement State
  const [announcementType, setAnnouncementType] = useState<'token_announcement' | 'appointment_confirmation' | 'emergency_instruction' | 'prescription_dosage' | 'ai_question'>('token_announcement');
  const [tokenInput, setTokenInput] = useState<string>(currentPatient.tokenNumber || 'B-042');
  const [doctorNameInput, setDoctorNameInput] = useState<string>('Dr. R. K. Sharma');
  const [roomInput, setRoomInput] = useState<string>('Room 4 (Cardiology OPD)');
  const [generatedAnnouncement, setGeneratedAnnouncement] = useState<{
    spokenTextInPatientLanguage: string;
    spokenTextInEnglish: string;
    displayHeadline: string;
  } | null>(null);
  const [isGeneratingAnnouncement, setIsGeneratingAnnouncement] = useState<boolean>(false);

  // Voice Registration State
  const [voiceRegName, setVoiceRegName] = useState<string>('');
  const [voiceRegAge, setVoiceRegAge] = useState<string>('');
  const [voiceRegGender, setVoiceRegGender] = useState<'male' | 'female' | 'other'>('male');
  const [voiceRegComplaint, setVoiceRegComplaint] = useState<string>('');
  const [voiceRegSuccess, setVoiceRegSuccess] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const recordingTimerRef = useRef<any>(null);
  const recorderInstance = useRef<AudioRecorder>(new AudioRecorder());
  const { language, setLanguage, t } = useLanguage();
  const activeLangCode = selectedLanguage || language || 'hi';
  const currentLang = SUPPORTED_LANGUAGES[activeLangCode as keyof typeof SUPPORTED_LANGUAGES] || SUPPORTED_LANGUAGES.hi;

  // Initialize Speech Recognition & Greeting
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      try {
        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = true;
        recog.lang = currentLang.speechCode;

        recog.onresult = (event: any) => {
          let interim = '';
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          if (interim) {
            setLiveTranscriptInterim(interim);
          }
          if (finalTranscript) {
            setLiveTranscriptInterim('');
            setInputText(finalTranscript);
            handleAnalyzeSpokenInput(finalTranscript);
            setIsListening(false);
          }
        };

        recog.onerror = (e: any) => {
          console.warn('Speech recognition warning:', e);
          setIsListening(false);
          setLiveTranscriptInterim('');
          if (e.error !== 'no-speech') {
            setSpeechError('Microphone not recognized or speech paused. You can use manual typing or sample prompt chips.');
          }
        };

        recog.onend = () => {
          setIsListening(false);
          setLiveTranscriptInterim('');
          if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
          }
        };

        recognitionRef.current = recog;
      } catch (e) {
        console.warn('SpeechRecognition init error:', e);
      }
    }

    return () => {
      stopSpeaking();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [selectedLanguage]);

  // Audio Playback / TTS Helper
  const speakText = async (text: string, langCode: string = currentLang.speechCode) => {
    if (!text) return;
    stopSpeaking();
    setCurrentSpokenText(text);

    if ('speechSynthesis' in window) {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langCode;
        utterance.rate = speechRate;
        utterance.pitch = 1.0;
        
        // Find best matching voice if available
        const voices = window.speechSynthesis.getVoices();
        const matchingVoice = voices.find(v => v.lang.startsWith(langCode.substring(0, 2)) || v.lang === langCode);
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('TTS error:', err);
        setIsSpeaking(false);
      }
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Toggle Microphone Listening
  const toggleListening = async () => {
    if (isListening) {
      // Stop listening
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (inputText.trim()) {
        handleAnalyzeSpokenInput(inputText);
      }
    } else {
      // Start listening
      setSpeechError(null);
      stopSpeaking();
      setLiveTranscriptInterim('');
      setRecordedAudioTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordedAudioTime(prev => prev + 1);
      }, 1000);

      if (speechSupported && recognitionRef.current) {
        try {
          recognitionRef.current.lang = currentLang.speechCode;
          recognitionRef.current.start();
          setIsListening(true);
        } catch (err) {
          console.warn('Recognition start failed, fallback to audio recorder:', err);
          handleFallbackGeminiRecord();
        }
      } else {
        handleFallbackGeminiRecord();
      }
    }
  };

  const handleFallbackGeminiRecord = async () => {
    try {
      await recorderInstance.current.start();
      setIsListening(true);
    } catch (err: any) {
      setSpeechError('Microphone permission needed: ' + err.message);
      setIsListening(false);
    }
  };

  // Analyze Spoken / Typed Input with AI
  const handleAnalyzeSpokenInput = async (textToProcess: string) => {
    if (!textToProcess || !textToProcess.trim()) return;
    setIsProcessingAI(true);
    setLastSpokenInput(textToProcess);
    setSpeechError(null);
    setIsSyncedToEhr(false);

    try {
      const response = await fetch('/api/voice-ai/analyze-symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spokenText: textToProcess,
          language: selectedLanguage,
          patientProfile: {
            name: currentPatient.name,
            age: currentPatient.age,
            gender: currentPatient.gender,
            existingSymptoms: currentPatient.symptoms
          }
        })
      });

      const data = await response.json();
      if (data.success && data.analysis) {
        setExtractedData(data.analysis);
        
        // Auto-play AI follow-up response in patient's language if voice mode is active
        if (data.analysis.aiFollowUpSpokenInPatientLanguage) {
          speakText(data.analysis.aiFollowUpSpokenInPatientLanguage);
        }
      } else {
        // Fallback local extractor for offline/demo reliability
        const fallbackAnalysis: ExtractedVoiceClinicalData = {
          detectedLanguage: selectedLanguage,
          transcriptionSummary: textToProcess,
          symptomsList: [
            {
              name: textToProcess.includes('fever') || textToProcess.includes('बुखार') ? 'Fever / Pyrexia' : 'Chief Complaint',
              duration: textToProcess.match(/\d+\s*(din|day|days|दिन)/i)?.[0] || 'Reported duration',
              severity: 6,
              bodyPart: 'systemic',
              isPrimary: true,
              details: textToProcess
            }
          ],
          medicalHistoryFound: [],
          medicationsFound: [],
          isRedFlag: textToProcess.toLowerCase().includes('chest pain') || textToProcess.includes('सीना') || textToProcess.includes('শ্বাসকষ্ট'),
          redFlagReason: textToProcess.toLowerCase().includes('chest pain') ? 'Potential acute coronary syndrome / cardiac discomfort' : null,
          triageUrgency: textToProcess.toLowerCase().includes('chest pain') ? 'URGENT_PRIORITY' : 'ROUTINE',
          aiFollowUpSpokenInPatientLanguage: currentLang.code === 'hi' 
            ? 'धन्यवाद। क्या आपको इसके साथ चक्कर या मतली भी आ रही है?' 
            : 'Thank you. Are you experiencing any dizziness, nausea, or sweating with this?',
          aiFollowUpSpokenInEnglish: 'Thank you. Are you experiencing any dizziness, nausea, or sweating with this?',
          suggestedQuickRepliesInPatientLanguage: currentLang.sampleComplaints.slice(0, 3),
          doctorConsultationNote: `Patient reports: "${textToProcess}". Vitals stable. Advised clinical evaluation.`
        };
        setExtractedData(fallbackAnalysis);
        if (fallbackAnalysis.aiFollowUpSpokenInPatientLanguage) {
          speakText(fallbackAnalysis.aiFollowUpSpokenInPatientLanguage);
        }
      }
    } catch (err: any) {
      console.error('Error analyzing spoken input:', err);
      setSpeechError('Network issue analyzing speech. Please retry.');
    } finally {
      setIsProcessingAI(false);
    }
  };

  // Sync Extracted Symptoms into Active Patient Profile
  const handleSyncToEhr = () => {
    if (!extractedData) return;

    const newSymptoms: SymptomItem[] = extractedData.symptomsList.map((s, idx) => ({
      id: `sym-voice-${Date.now()}-${idx}`,
      name: s.name,
      bodyPart: (s.bodyPart || 'systemic') as any,
      severity: s.severity || 5,
      duration: s.duration || '2-3 days',
      onset: 'gradual',
      character: s.details || s.name
    }));

    const updatedProfile: PatientProfile = {
      ...currentPatient,
      symptoms: [
        ...currentPatient.symptoms.filter(existing => !newSymptoms.some(n => n.name.toLowerCase() === existing.name.toLowerCase())),
        ...newSymptoms
      ],
      triageRisk: extractedData.isRedFlag ? 'URGENT_PRIORITY' : currentPatient.triageRisk,
      redFlagsDetected: extractedData.redFlagReason 
        ? Array.from(new Set([...(currentPatient.redFlagsDetected || []), extractedData.redFlagReason]))
        : (currentPatient.redFlagsDetected || []),
      clinicalSummary: {
        ...(currentPatient.clinicalSummary || {
          executiveSummary: '',
          pastMedicalSurgicalHistory: [],
          drugAllergyWarnings: { hasConflict: false },
          timelineHighlights: [],
          triageAssessment: { riskLevel: 'ROUTINE', reasoning: '', redFlags: [] },
          diagnosticHypothesesCDS: [],
          recommendedActionsForDoctor: []
        }),
        chiefComplaintSummary: extractedData.symptomsList[0]
          ? `${extractedData.symptomsList[0].name}${extractedData.symptomsList[0].duration ? ' (' + extractedData.symptomsList[0].duration + ')' : ''}`
          : (currentPatient.clinicalSummary?.chiefComplaintSummary || ''),
        historyOfPresentIllness: extractedData.transcriptionSummary || (currentPatient.clinicalSummary?.historyOfPresentIllness || '')
      }
    };

    onUpdatePatient(updatedProfile);
    setIsSyncedToEhr(true);
  };

  // Generate & Speak Live Hospital Announcement
  const handleTriggerAnnouncement = async (typeOverride?: any) => {
    const selectedType = typeOverride || announcementType;
    setIsGeneratingAnnouncement(true);

    try {
      const response = await fetch('/api/voice-ai/generate-announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          tokenNumber: tokenInput,
          doctorName: doctorNameInput,
          roomNumber: roomInput,
          language: selectedLanguage,
          patientName: currentPatient.name,
          department: currentPatient.department || 'Cardiology OPD'
        })
      });

      const data = await response.json();
      if (data.success && data.announcement) {
        setGeneratedAnnouncement(data.announcement);
        speakText(data.announcement.spokenTextInPatientLanguage);
      } else {
        // Fallback announcement
        const fallbackText = selectedLanguage === 'hi'
          ? `कृपया ध्यान दें। टोकन नंबर ${tokenInput}। कृपया ${doctorNameInput} के लिए ${roomInput} में जाएं।`
          : `Please wait. Your token number is ${tokenInput}. Please proceed to ${roomInput} for ${doctorNameInput}.`;
        
        const fallbackAnn = {
          spokenTextInPatientLanguage: fallbackText,
          spokenTextInEnglish: `Please wait. Your token number is ${tokenInput}. Please proceed to ${roomInput} for ${doctorNameInput}.`,
          displayHeadline: `Token ${tokenInput} → ${roomInput}`
        };
        setGeneratedAnnouncement(fallbackAnn);
        speakText(fallbackText);
      }
    } catch (err) {
      console.error('Error generating announcement:', err);
    } finally {
      setIsGeneratingAnnouncement(false);
    }
  };

  // Voice-Based Registration Submit
  const handleVoiceRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voiceRegName || !voiceRegAge) return;

    const newProfile: PatientProfile = {
      id: `pat-${Date.now()}`,
      name: voiceRegName,
      age: parseInt(voiceRegAge, 10) || 45,
      gender: voiceRegGender,
      mobile: '+91 98765 43210',
      language: selectedLanguage as SupportedLanguage,
      careStream: 'allopathy',
      abhaId: `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      uhid: `AIIMS-ND-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      tokenNumber: `V-${Math.floor(10 + Math.random() * 89)}`,
      department: 'General OPD',
      status: 'intake_in_progress',
      symptoms: voiceRegComplaint ? [
        {
          id: `sym-reg-${Date.now()}`,
          name: voiceRegComplaint,
          bodyPart: 'systemic',
          severity: 5,
          duration: 'Reported during voice registration',
          onset: 'gradual'
        }
      ] : [],
      vitals: {
        bpSystolic: 120,
        bpDiastolic: 80,
        heartRate: 76,
        spO2: 98,
        temperature: 98.4,
        respiratoryRate: 16,
        bloodSugar: 110,
        recordedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      currentMedications: [],
      scannedDocuments: [],
      timeline: [],
      pastIllnesses: [],
      pastSurgeries: [],
      familyHistory: [],
      habits: {
        smoking: false,
        alcohol: false,
        tobacco: false,
        diet: 'Vegetarian'
      },
      allergies: [],
      redFlagsDetected: [],
      doctorVerified: false,
      triageRisk: 'ROUTINE',
      consentGiven: true,
      consentType: 'voice',
      consentTimestamp: new Date().toISOString(),
      registeredAt: new Date().toLocaleDateString('en-GB')
    };

    onUpdatePatient(newProfile);
    setVoiceRegSuccess(true);
    
    // Announce confirmation aloud in chosen language
    const regConfirmSpeech = selectedLanguage === 'hi'
      ? `नमस्ते ${voiceRegName} जी। आपका वॉइस रजिस्ट्रेशन पूरा हो गया है। आपका टोकन नंबर ${newProfile.tokenNumber} है।`
      : `Hello ${voiceRegName}. Your voice registration is complete. Your token number is ${newProfile.tokenNumber}.`;
    
    speakText(regConfirmSpeech);
  };

  const copyDoctorNoteToClipboard = () => {
    if (extractedData?.doctorConsultationNote) {
      navigator.clipboard.writeText(extractedData.doctorConsultationNote);
      setCopiedNote(true);
      setTimeout(() => setCopiedNote(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Multilingual Language Selector & Header */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-7 border border-teal-800/60 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-mono font-bold flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                Live Multilingual Voice AI Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
                Speech-to-Text & Text-to-Speech
              </span>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-bold font-serif-fraunces text-white flex items-center gap-2">
              <span>Patient Speaks</span>
              <ArrowRight className="w-4 h-4 text-teal-400" />
              <span>AI Converts to Clinical Intake</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Voice-powered medical intake for OPDs. Supports 10 Indian languages, conversational follow-up questions, token audio announcements, and low-literacy guidance.
            </p>
          </div>

          {/* Language Selector Chips Bar */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-2.5 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-xs text-slate-300 px-1 font-bold">
              <span className="flex items-center gap-1 text-teal-300">
                <Languages className="w-3.5 h-3.5" />
                Language / भाषा:
              </span>
              <span className="text-[11px] text-slate-400 font-mono">10 Indian Dialects</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {ORDERED_LANGUAGES.map((item) => {
                const info = SUPPORTED_LANGUAGES[item.code];
                const isSelected = activeLangCode === item.code;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      setLanguage(item.code);
                      onChangeLanguage(item.code);
                    }}
                    className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-teal-400 text-slate-950 shadow-md ring-2 ring-teal-300'
                        : 'bg-slate-700/70 hover:bg-slate-700 text-slate-200'
                    }`}
                    title={item.label}
                  >
                    <span>{info?.flagEmoji || '🇮🇳'}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs sm:text-sm font-bold">
        <button
          type="button"
          id="tab-voice-speak"
          onClick={() => setActiveMode('voice')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeMode === 'voice'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Mic className="w-4 h-4 text-amber-300" />
          <span>🎙️ Tap to Speak (Voice AI Intake)</span>
        </button>

        <button
          type="button"
          id="tab-voice-type"
          onClick={() => setActiveMode('type')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeMode === 'type'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Keyboard className="w-4 h-4 text-teal-300" />
          <span>⌨️ Type Instead (Manual Fallback)</span>
        </button>

        <button
          type="button"
          id="tab-voice-announcements"
          onClick={() => setActiveMode('announcements')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeMode === 'announcements'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Volume2 className="w-4 h-4 text-emerald-300" />
          <span>🔊 Spoken Audio & Token Announcements</span>
        </button>

        <button
          type="button"
          id="tab-voice-registration"
          onClick={() => setActiveMode('voice_registration')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeMode === 'voice_registration'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <User className="w-4 h-4 text-blue-300" />
          <span>🗣️ Voice-Based Registration</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. PRIMARY VOICE & SPEECH-TO-TEXT INTAKE SECTION */}
      {/* ========================================================================= */}
      {(activeMode === 'voice' || activeMode === 'type') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Voice Recording Terminal & Audio Controls */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Interactive Recording Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-400 font-mono">
                    Step 1 • Multilingual Audio Capture
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                    {activeMode === 'voice' ? 'Speak Naturally in ' + currentLang.nativeName : 'Type Symptoms in Any Language'}
                  </h3>
                </div>

                {/* TTS Voice Speed Controller */}
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl px-2.5 py-1 text-xs">
                  <Volume1 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Speed:</span>
                  <button
                    type="button"
                    onClick={() => setSpeechRate(0.8)}
                    className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${speechRate === 0.8 ? 'bg-teal-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    title="Slow for elderly patients"
                  >
                    0.8x
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpeechRate(0.95)}
                    className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${speechRate === 0.95 ? 'bg-teal-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    title="Normal clinical pace"
                  >
                    1.0x
                  </button>
                </div>
              </div>

              {/* Central Voice Recording Stage */}
              {activeMode === 'voice' ? (
                <div className="flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-teal-50/60 to-slate-50 dark:from-slate-800/60 dark:to-slate-900 border-2 border-dashed border-teal-200 dark:border-teal-800/60 text-center space-y-4">
                  
                  {/* Large Push to Talk Button */}
                  <div className="relative">
                    {isListening && (
                      <div className="absolute inset-0 rounded-full bg-red-400/30 animate-ping pointer-events-none scale-125"></div>
                    )}
                    
                    <button
                      type="button"
                      id="btn-voice-ai-tap-to-speak"
                      onClick={toggleListening}
                      disabled={isProcessingAI}
                      className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center font-bold transition-all shadow-xl cursor-pointer ${
                        isListening
                          ? 'bg-red-600 hover:bg-red-700 text-white ring-8 ring-red-200 dark:ring-red-950 animate-pulse'
                          : 'bg-teal-600 hover:bg-teal-700 text-white ring-8 ring-teal-100 dark:ring-teal-950/60 hover:scale-105'
                      }`}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="w-8 h-8 mb-1" />
                          <span className="text-[11px] uppercase tracking-wider">Tap to Stop</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-8 h-8 mb-1 text-amber-300" />
                          <span className="text-[11px] uppercase tracking-wider">Tap to Speak</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Status Indicator */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${isListening ? 'bg-red-500 animate-ping' : isProcessingAI ? 'bg-amber-500 animate-bounce' : 'bg-teal-500'}`}></span>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {isListening 
                          ? `Listening to your voice (${recordedAudioTime}s)...` 
                          : isProcessingAI 
                            ? 'AI analyzing symptoms & translating...' 
                            : `Ready. Tap mic and speak in ${currentLang.nativeName} (${currentLang.name})`}
                      </p>
                    </div>

                    {/* Live Interim Transcript Bubble */}
                    {liveTranscriptInterim && (
                      <p className="text-xs italic text-teal-800 dark:text-teal-300 bg-teal-100/70 dark:bg-teal-950/80 px-3 py-1.5 rounded-xl animate-fade-in font-medium max-w-md">
                        "{liveTranscriptInterim}"
                      </p>
                    )}

                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Supports regional languages and Indian dialects (e.g. Hindi, Bengali, Hinglish)
                    </p>
                  </div>

                  {/* Audio Status Banner / Stop Audio */}
                  {isSpeaking && (
                    <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2 text-xs text-amber-900 dark:text-amber-200 animate-pulse">
                      <Volume2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="font-bold">AI is speaking to patient...</span>
                      <button
                        type="button"
                        onClick={stopSpeaking}
                        className="ml-2 px-2 py-0.5 bg-amber-200 dark:bg-amber-800 hover:bg-amber-300 dark:hover:bg-amber-700 rounded text-[11px] font-bold text-amber-950 dark:text-amber-100 cursor-pointer"
                      >
                        Stop Audio
                      </button>
                    </div>
                  )}

                  {speechError && (
                    <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-200 text-left">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>{speechError}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Type Instead Mode */
                <div className="space-y-3">
                  <label htmlFor="manual-symptom-input-area" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Type Patient Symptoms or Complaint in any script:
                  </label>
                  <div className="relative">
                    <textarea
                      id="manual-symptom-input-area"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="e.g. Mujhe 3 din se fever hai aur headache bhi hai. / ২ দিন ধরে বুকে ব্যথা..."
                      rows={4}
                      className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 p-3.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                    <button
                      type="button"
                      id="btn-submit-typed-symptom"
                      onClick={() => handleAnalyzeSpokenInput(inputText)}
                      disabled={isProcessingAI || !inputText.trim()}
                      className="absolute right-3 bottom-3 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {isProcessingAI ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Analyze with AI</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Sample Spoken Prompts & Quick Chips (Exact Example Scenarios) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
                  <span>💡 Try Example Patient Voice Inputs:</span>
                  <span className="text-[11px] text-teal-700">Tap any chip to simulate</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setInputText("Mujhe 3 din se fever hai aur headache bhi hai.");
                      handleAnalyzeSpokenInput("Mujhe 3 din se fever hai aur headache bhi hai.");
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 rounded-xl text-xs text-slate-800 text-left transition-all cursor-pointer font-medium"
                  >
                    🗣️ "Mujhe 3 din se fever hai aur headache bhi hai."
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setInputText("मेरे पेट में दर्द हो रहा है और उल्टी जैसा लग रहा है।");
                      handleAnalyzeSpokenInput("मेरे पेट में दर्द हो रहा है और उल्टी जैसा लग रहा है।");
                    }}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:border-teal-300 dark:hover:border-teal-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 text-left transition-all cursor-pointer font-medium"
                  >
                    🗣️ "मेरे पेट में दर्द हो रहा है।" (Hindi)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setInputText("২ দিন ধরে বুকে ব্যথা ও শ্বাসকষ্ট হচ্ছে");
                      handleAnalyzeSpokenInput("২ দিন ধরে বুকে ব্যথা ও শ্বাসকষ্ট হচ্ছে");
                    }}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:border-teal-300 dark:hover:border-teal-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 text-left transition-all cursor-pointer font-medium"
                  >
                    🗣️ "২ দিন ধরে বুকে ব্যথা" (Bengali)
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setInputText("2 நாட்களாக நெஞ்சு வலி மற்றும் மூச்சுத் திணறல்");
                      handleAnalyzeSpokenInput("2 நாட்களாக நெஞ்சு வலி மற்றும் மூச்சுத் திணறல்");
                    }}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:border-teal-300 dark:hover:border-teal-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 text-left transition-all cursor-pointer font-medium"
                  >
                    🗣️ "நெஞ்சு வலி" (Tamil)
                  </button>
                </div>
              </div>

            </div>

            {/* AI Follow-up & Spoken Response Card */}
            {extractedData && (
              <div className="bg-gradient-to-br from-teal-900 to-slate-900 text-white rounded-3xl p-6 border border-teal-800 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">AI Spoken Follow-up Response</h4>
                      <p className="text-[11px] text-teal-300">Conversational Clinical Dialogue</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => speakText(extractedData.aiFollowUpSpokenInPatientLanguage || '')}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>🔊 Listen to AI</span>
                  </button>
                </div>

                <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/80 space-y-2">
                  <div className="text-base font-bold text-teal-200">
                    "{extractedData.aiFollowUpSpokenInPatientLanguage}"
                  </div>
                  <div className="text-xs text-slate-400 font-mono border-t border-slate-700 pt-2">
                    Translation: "{extractedData.aiFollowUpSpokenInEnglish}"
                  </div>
                </div>

                {/* Suggested Quick Reply Chips */}
                {extractedData.suggestedQuickRepliesInPatientLanguage && extractedData.suggestedQuickRepliesInPatientLanguage.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                      Patient Quick Voice Replies:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {extractedData.suggestedQuickRepliesInPatientLanguage.map((reply, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setInputText(reply);
                            handleAnalyzeSpokenInput(reply);
                          }}
                          className="px-3 py-1 bg-slate-800 hover:bg-teal-900 border border-slate-700 rounded-xl text-xs text-slate-200 transition-all cursor-pointer font-medium"
                        >
                          "{reply}"
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Right Column: Structured Clinical Intake Result */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 sticky top-20">
              
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center font-black">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Structured Clinical Intake</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Auto-structured from voice audio</p>
                  </div>
                </div>

                {extractedData && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    extractedData.isRedFlag ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                  }`}>
                    {extractedData.triageUrgency || 'ROUTINE'}
                  </span>
                )}
              </div>

              {/* Red Flag Warning Banner if detected */}
              {extractedData?.isRedFlag && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <h5 className="font-bold text-red-950 dark:text-red-200">Red Flag Emergency Symptom Detected</h5>
                    <p className="text-red-800 dark:text-red-300 font-medium">{extractedData.redFlagReason}</p>
                    <p className="text-red-700 dark:text-red-400 text-[11px]">System has prioritized patient for Immediate Triage Nurse review.</p>
                  </div>
                </div>
              )}

              {/* Symptoms Extraction Card List */}
              {extractedData ? (
                <div className="space-y-4">
                  
                  {/* Primary & Additional Symptoms */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Extracted Symptoms & Duration:
                    </span>
                    <div className="space-y-2">
                      {extractedData.symptomsList.map((sym, idx) => (
                        <div 
                          key={idx} 
                          className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 flex items-start justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{sym.name}</span>
                              {sym.isPrimary && (
                                <span className="px-2 py-0.2 bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 rounded text-[10px] font-bold">
                                  Primary
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                              <span className="font-semibold text-teal-700 dark:text-teal-400">⏱️ Duration: {sym.duration || 'Not specified'}</span>
                              <span>•</span>
                              <span>Severity: {sym.severity || 5}/10</span>
                            </div>
                            {sym.details && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 italic">"{sym.details}"</p>
                            )}
                          </div>

                          <span className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-700 dark:text-slate-300 capitalize">
                            {sym.bodyPart || 'Systemic'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Doctor Consultation SOAP Note */}
                  {extractedData.doctorConsultationNote && (
                    <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2 border border-slate-800">
                      <div className="flex items-center justify-between text-xs font-bold text-teal-300">
                        <span className="flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5" />
                          Physician SOAP Consultation Note
                        </span>
                        <button
                          type="button"
                          onClick={copyDoctorNoteToClipboard}
                          className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          {copiedNote ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span className="text-[10px]">{copiedNote ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <p className="text-xs font-mono text-slate-200 leading-relaxed">
                        {extractedData.doctorConsultationNote}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      id="btn-sync-voice-symptoms-to-ehr"
                      onClick={handleSyncToEhr}
                      disabled={isSyncedToEhr}
                      className={`w-full py-3 rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isSyncedToEhr
                          ? 'bg-emerald-600 text-white'
                          : 'bg-teal-600 hover:bg-teal-700 text-white'
                      }`}
                    >
                      {isSyncedToEhr ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Synced to {currentPatient.name}'s Medical File</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>Save & Sync into Patient EHR File</span>
                        </>
                      )}
                    </button>

                    {onNavigateToDoctor && (
                      <button
                        type="button"
                        onClick={onNavigateToDoctor}
                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
                        <span>Send to Doctor's Live Consultation Queue</span>
                      </button>
                    )}
                  </div>

                </div>
              ) : (
                /* Empty Placeholder State */
                <div className="text-center py-10 px-4 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Mic className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-700">No voice recorded yet</h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Tap the microphone button on the left or type symptoms. The AI will convert speech into structured symptoms.
                    </p>
                  </div>

                  <div className="pt-2 text-left bg-slate-50 p-3 rounded-xl text-xs space-y-1 border border-slate-200">
                    <span className="font-bold text-slate-700 block">Example Conversion:</span>
                    <span className="text-slate-600 block">Patient: <em>"Mujhe 3 din se fever hai aur headache bhi hai."</em></span>
                    <span className="text-teal-800 font-medium block">→ Symptoms: Fever — 3 days, Headache</span>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TEXT-TO-SPEECH & SPOKEN AUDIO ANNOUNCEMENTS HUB */}
      {/* ========================================================================= */}
      {activeMode === 'announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Announcement Customizer Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800 font-mono">
                  Text-to-Speech Engine
                </span>
                <h3 className="text-lg font-bold text-slate-900">Hospital Audio & Token Announcements</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5" />
                Live TTS Player
              </span>
            </div>

            {/* Type Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Select Announcement Type:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'token_announcement', label: '🎟️ Token & Room Callout', desc: '"Please wait. Your token number is B-042"' },
                  { id: 'appointment_confirmation', label: '📅 Appointment Confirmation', desc: 'Spoken confirmation with doctor & time' },
                  { id: 'emergency_instruction', label: '🚨 Emergency Triage Call', desc: 'Calm urgent instructions for patient' },
                  { id: 'prescription_dosage', label: '💊 Spoken Medicine Dosage', desc: 'Low-literacy slow medicine guide' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setAnnouncementType(item.id as any);
                      handleTriggerAnnouncement(item.id);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      announcementType === item.id
                        ? 'bg-teal-50/80 border-teal-500 ring-2 ring-teal-400/30'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900">{item.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Parameters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Token Number:</label>
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Assigned Doctor:</label>
                <input
                  type="text"
                  value={doctorNameInput}
                  onChange={(e) => setDoctorNameInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Room / Department:</label>
                <input
                  type="text"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold"
                />
              </div>
            </div>

            {/* Generate & Play Button */}
            <div className="pt-2">
              <button
                type="button"
                id="btn-generate-speak-announcement"
                onClick={() => handleTriggerAnnouncement()}
                disabled={isGeneratingAnnouncement}
                className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isGeneratingAnnouncement ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Volume2 className="w-4 h-4 text-amber-300" />
                )}
                <span>Generate & Speak Aloud in {currentLang.nativeName}</span>
              </button>
            </div>
          </div>

          {/* Spoken Output Stage Card */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-teal-400">
                🔊 Spoken Audio Display
              </span>
              {isSpeaking && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold animate-pulse">
                  Playing Voice...
                </span>
              )}
            </div>

            {generatedAnnouncement ? (
              <div className="space-y-4">
                <div className="bg-slate-800/90 rounded-2xl p-5 border border-slate-700 space-y-3">
                  <div className="text-xs text-teal-300 font-bold uppercase tracking-wider">
                    Spoken in {currentLang.nativeName}:
                  </div>
                  <div className="text-lg font-bold text-white leading-relaxed font-serif-fraunces">
                    "{generatedAnnouncement.spokenTextInPatientLanguage}"
                  </div>

                  <div className="border-t border-slate-700/80 pt-3 text-xs text-slate-300">
                    <span className="font-bold text-slate-400">English: </span>
                    "{generatedAnnouncement.spokenTextInEnglish}"
                  </div>
                </div>

                {/* Audio Controls */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => speakText(generatedAnnouncement.spokenTextInPatientLanguage)}
                    className="flex-1 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Replay Announcement</span>
                  </button>

                  <button
                    type="button"
                    onClick={stopSpeaking}
                    className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 px-4 space-y-3">
                <Volume2 className="w-10 h-10 text-teal-400/50 mx-auto" />
                <p className="text-xs text-slate-300 max-w-xs mx-auto">
                  Select an announcement type on the left to hear the AI speak live in your selected Indian language.
                </p>
                <div className="bg-slate-800/50 p-3 rounded-xl text-xs text-slate-300 text-left border border-slate-700">
                  <span className="font-bold text-teal-300 block">Example Audio Callout:</span>
                  <span>"Please wait. Your token number is B-042. Room 4 with Dr. R. K. Sharma."</span>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VOICE-BASED REGISTRATION FOR LOW-LITERACY & ELDERLY USERS */}
      {/* ========================================================================= */}
      {activeMode === 'voice_registration' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 font-mono">
                Accessible Voice OPD Registration
              </span>
              <h3 className="text-xl font-bold text-slate-900">
                Register by Voice (Designed for Elderly & Low-Literacy Patients)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Speak your name, age, and health problem to instantly generate an ABHA-linked token.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setVoiceRegName('Ramesh Kumar');
                setVoiceRegAge('58');
                setVoiceRegGender('male');
                setVoiceRegComplaint('सीने में हल्का दर्द और 3 दिनों से थकान');
              }}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer self-start"
            >
              ⚡ Fill Sample Voice Intake
            </button>
          </div>

          <form onSubmit={handleVoiceRegisterSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Patient Full Name:</span>
                  <span className="text-[11px] text-teal-700">बोलकर या लिखकर भरें</span>
                </label>
                <input
                  type="text"
                  required
                  value={voiceRegName}
                  onChange={(e) => setVoiceRegName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar / रामेश्वर"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Age / उम्र (Years):</label>
                <input
                  type="number"
                  required
                  value={voiceRegAge}
                  onChange={(e) => setVoiceRegAge(e.target.value)}
                  placeholder="e.g. 58"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Gender / लिंग:</label>
                <select
                  value={voiceRegGender}
                  onChange={(e) => setVoiceRegGender(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="male">Male (पुरुष)</option>
                  <option value="female">Female (महिला)</option>
                  <option value="other">Other (अन्य)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Spoken Chief Health Complaint:</span>
                <span className="text-[11px] text-teal-700">What health problem are you facing?</span>
              </label>
              <textarea
                value={voiceRegComplaint}
                onChange={(e) => setVoiceRegComplaint(e.target.value)}
                placeholder="e.g. 3 din se fever hai aur pet me dard ho raha hai..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {voiceRegSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h5 className="font-bold text-emerald-950 text-sm">Voice Registration Successful!</h5>
                    <p className="text-xs text-emerald-800">
                      Token assigned: <strong>{currentPatient.tokenNumber || 'V-42'}</strong>. Profile saved to MediKiosk Queue.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => speakText(`नमस्ते ${voiceRegName} जी। आपका वॉइस रजिस्ट्रेशन पूरा हो गया है। आपका टोकन नंबर ${currentPatient.tokenNumber || 'V-42'} है।`)}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer shrink-0"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Hear Confirmation</span>
                </button>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                id="btn-complete-voice-registration"
                className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Voice Registration & Issue Token</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
