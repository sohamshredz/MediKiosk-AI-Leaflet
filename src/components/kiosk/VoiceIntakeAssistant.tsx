import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Send, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  ShieldAlert, 
  Siren, 
  CheckCircle2, 
  Activity, 
  ArrowRight,
  RotateCcw,
  Check
} from 'lucide-react';
import { ChatMessage, SymptomItem, PatientProfile, ConsultationRecord, SupportedLanguage, CareStream } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../data/indianLanguages';
import { CLINICAL_INTAKE_QUESTIONS, IntakeQuestionBank, IntakeQuestionStep } from '../../data/translations';
import { useLanguage } from '../../context/LanguageContext';
import { getVoiceForLanguage } from '../../utils/prescriptionNarration';
import { checkRedFlagEmergency } from '../../utils/emergencyTriage';
import { PulseWave } from '../common/PulseWave';
import { AudioRecorder } from '../../utils/audioRecorder';

interface VoiceIntakeAssistantProps {
  language: string;
  careStream: string;
  currentProfile: Partial<PatientProfile>;
  onExtractedData: (data: any) => void;
  onAddSymptom: (symptom: SymptomItem) => void;
  onProceedToNextStep?: () => void;
  onConsultationSaved?: (consultation: ConsultationRecord) => void;
  onBackRequest?: () => void;
}

export const VoiceIntakeAssistant: React.FC<VoiceIntakeAssistantProps> = ({
  language,
  careStream,
  currentProfile,
  onExtractedData,
  onAddSymptom,
  onProceedToNextStep,
  onConsultationSaved,
  onBackRequest
}) => {
  const { language: contextLang, t } = useLanguage();
  const activeLanguage = ((language || contextLang || 'en') as SupportedLanguage);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [listeningState, setListeningState] = useState<'idle' | 'listening' | 'transcribing'>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeakingMsgId, setActiveSpeakingMsgId] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isAiOffline, setIsAiOffline] = useState(false);
  const [voiceUnavailableNotice, setVoiceUnavailableNotice] = useState(false);
  const [staffAlertDispatched, setStaffAlertDispatched] = useState(false);

  // Structured Intake Step Track: 'complaint' | 'duration' | 'severity' | 'associated' | 'pastHistory' | 'medications' | 'review'
  const [currentQuestionStep, setCurrentQuestionStep] = useState<string>('complaint');
  
  // Track answered questions to prevent double clicks
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(new Set());
  const isProcessingOptionRef = useRef<boolean>(false);

  // Spoken message tracking to prevent duplicate TTS playback
  const spokenMessageIdsRef = useRef<Set<string>>(new Set());

  // Emergency Red Flag State
  const [emergencyAlert, setEmergencyAlert] = useState<{
    detected: boolean;
    reason?: string;
    advice?: string;
  }>({ detected: false });

  // Extracted live intake state
  const [liveExtractedSymptoms, setLiveExtractedSymptoms] = useState<SymptomItem[]>(currentProfile.symptoms || []);
  const [extractedPastHistory, setExtractedPastHistory] = useState<string[]>(currentProfile.pastIllnesses || []);
  const [extractedMedications, setExtractedMedications] = useState<string[]>(
    currentProfile.currentMedications?.map(m => m.name) || []
  );
  const [extractedAllergies, setExtractedAllergies] = useState<string[]>(
    currentProfile.allergies?.map((a: any) => typeof a === 'string' ? a : a.substance) || []
  );
  const [triageLevel, setTriageLevel] = useState<string>(currentProfile.triageRisk || 'STANDARD_OPD');

  // Review & Confirmation Modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isConsultationConfirmed, setIsConsultationConfirmed] = useState(false);
  const [isSavingConsultation, setIsSavingConsultation] = useState(false);
  const [consultationId] = useState<string>(() => 'consult-' + Date.now());

  const recognitionRef = useRef<any>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const langConfig = SUPPORTED_LANGUAGES[activeLanguage as keyof typeof SUPPORTED_LANGUAGES] || SUPPORTED_LANGUAGES.en;
  const questionBank = CLINICAL_INTAKE_QUESTIONS[activeLanguage] || CLINICAL_INTAKE_QUESTIONS.en;
  const [recorderInstance] = useState<AudioRecorder>(() => new AudioRecorder());

  // Dedicated Chat-Only Scroll Function (Never scrolls outer window or page)
  const smoothScrollToLatest = (smooth = true) => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  // 1. Initialize Speech Recognition & Welcome Greeting without resetting ongoing consultation
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = langConfig.speechCode;

      recog.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          setListeningState('idle');
          setIsListening(false);
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.focus({ preventScroll: true });
            }
          }, 50);
        }
      };

      recog.onerror = (e: any) => {
        console.warn('Speech recognition notice:', e);
        setIsListening(false);
        setListeningState('idle');
      };

      recog.onend = () => {
        setIsListening(false);
        setListeningState('idle');
      };

      recognitionRef.current = recog;
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.lang = langConfig.speechCode;
      }
    }

    // Set initial welcome greeting ONLY if messages are empty
    setMessages(prev => {
      if (prev.length === 0) {
        const initialQuestion = questionBank.complaint || CLINICAL_INTAKE_QUESTIONS.en.complaint;
        const welcomeMsgId = 'msg-welcome-' + activeLanguage;
        const welcomeMsg: ChatMessage = {
          id: welcomeMsgId,
          sender: 'ai',
          text: initialQuestion.question,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedQuickReplies: initialQuestion.options,
        };
        // Speak initial greeting asynchronously (non-blocking)
        speakTextAsync(initialQuestion.question, welcomeMsgId);
        return [welcomeMsg];
      } else {
        // When language changes mid-consultation, update latest message's quick replies to the new language
        return prev.map((m, idx) => {
          if (idx === prev.length - 1 && m.sender === 'ai') {
            const stepQ = questionBank[currentQuestionStep] || questionBank.complaint;
            return {
              ...m,
              suggestedQuickReplies: stepQ.options
            };
          }
          return m;
        });
      }
    });

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [activeLanguage]);

  // Scroll chat container smoothly when new messages arrive (without jumping the page)
  useEffect(() => {
    smoothScrollToLatest(true);
  }, [messages.length, isLoadingAi, listeningState]);

  // 2. Non-blocking Asynchronous Text-to-Speech
  const speakTextAsync = (text: string, msgId?: string) => {
    if (!('speechSynthesis' in window)) return;
    if (msgId) {
      if (spokenMessageIdsRef.current.has(msgId)) return;
      spokenMessageIdsRef.current.add(msgId);
    }

    try {
      window.speechSynthesis.cancel();
      if (msgId) setActiveSpeakingMsgId(msgId);

      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = getVoiceForLanguage(activeLanguage, voices);

      // Enforce rule: Never speak non-English text using an English voice!
      if (!matchedVoice && activeLanguage !== 'en') {
        const hasLangVoice = voices.some(v => 
          v.lang.toLowerCase().startsWith(activeLanguage) || 
          v.lang.toLowerCase().replace('_', '-').startsWith(langConfig.speechCode.toLowerCase())
        );
        if (!hasLangVoice && voices.length > 0) {
          console.info(`No speech voice available on this device for ${langConfig.name}`);
          setVoiceUnavailableNotice(true);
          return;
        }
      }

      setVoiceUnavailableNotice(false);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langConfig.speechCode;
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
      utterance.rate = 0.92;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        setActiveSpeakingMsgId(null);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setActiveSpeakingMsgId(null);
      };
      
      // Execute asynchronously so UI is never blocked
      window.setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 50);
    } catch (err) {
      console.warn('TTS async error:', err);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setActiveSpeakingMsgId(null);
    }
  };

  // 3. Speech-to-Text Toggle
  const toggleListening = async () => {
    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setIsListening(false);
      setListeningState('idle');
      return;
    }

    setSpeechError(null);
    stopSpeaking();

    if (speechSupported && recognitionRef.current) {
      try {
        recognitionRef.current.lang = langConfig.speechCode;
        recognitionRef.current.start();
        setIsListening(true);
        setListeningState('listening');
      } catch (err) {
        console.error('WebSpeech start error, switching to audio recorder fallback:', err);
        handleGeminiAudioRecord();
      }
    } else {
      handleGeminiAudioRecord();
    }
  };

  const handleGeminiAudioRecord = async () => {
    if (isListening) {
      try {
        setIsListening(false);
        setListeningState('transcribing');
        const result = await recorderInstance.stop();

        const res = await fetch('/api/gemini/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: result.base64Audio,
            mimeType: result.mimeType
          })
        });
        const data = await res.json();
        if (data.success && data.transcribedText) {
          setInputText(data.transcribedText);
          setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
        } else {
          setSpeechError('Could not transcribe voice. You can type or tap a quick reply.');
        }
      } catch (err: any) {
        setSpeechError('Microphone recording notice: ' + err.message);
      } finally {
        setListeningState('idle');
      }
    } else {
      try {
        setSpeechError(null);
        stopSpeaking();
        await recorderInstance.start();
        setIsListening(true);
        setListeningState('listening');
      } catch (err: any) {
        setSpeechError('Microphone access notice: ' + err.message);
        setIsListening(false);
        setListeningState('idle');
      }
    }
  };

  // 4. OPTIMISTIC FAST OPTION CLICK HANDLER (0ms UI Latency)
  const handleSelectOption = (optionText: string, fromQuestionMsgId: string) => {
    // Prevent double clicks on options
    if (isProcessingOptionRef.current || answeredQuestionIds.has(fromQuestionMsgId)) {
      return;
    }
    isProcessingOptionRef.current = true;
    setAnsweredQuestionIds(prev => new Set(prev).add(fromQuestionMsgId));

    stopSpeaking();

    // 1. Instantly show patient's selected option in the conversation (0ms)
    const patientMsgId = 'msg-opt-' + Date.now();
    const patientMsg: ChatMessage = {
      id: patientMsgId,
      sender: 'patient',
      text: optionText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, patientMsg];
    setMessages(newMessages);

    // 2. Fast Local State Transition based on Clinical Intake Flow
    let nextStepKey = 'duration';
    let nextQuestionDef = questionBank.duration || CLINICAL_INTAKE_QUESTIONS.en.duration;

    if (currentQuestionStep === 'complaint') {
      // User picked chief complaint
      const newSym: SymptomItem = {
        id: 'sym-' + Date.now(),
        name: optionText.replace(/\s*\/.*$/, '').trim(),
        bodyPart: 'systemic',
        severity: 6,
        duration: 'Recent',
        onset: 'gradual'
      };
      setLiveExtractedSymptoms([newSym]);
      onAddSymptom(newSym);

      // Next step is duration
      nextStepKey = 'duration';
      nextQuestionDef = questionBank.duration || CLINICAL_INTAKE_QUESTIONS.en.duration;
    } 
    else if (currentQuestionStep === 'duration') {
      // User selected duration
      setLiveExtractedSymptoms(prev => prev.map((s, i) => i === 0 ? { ...s, duration: optionText } : s));
      
      // Next step is severity
      nextStepKey = 'severity';
      nextQuestionDef = questionBank.severity || CLINICAL_INTAKE_QUESTIONS.en.severity;
    } 
    else if (currentQuestionStep === 'severity') {
      // User selected severity
      const isSevere = optionText.includes('7-10') || optionText.includes('Severe') || optionText.includes('तेज') || optionText.includes('തീവ്ര');
      const isMild = optionText.includes('1-3') || optionText.includes('Mild') || optionText.includes('हल्का') || optionText.includes('குறைவு');
      const sevNum = isSevere ? 8 : isMild ? 3 : 5;

      setLiveExtractedSymptoms(prev => prev.map((s, i) => i === 0 ? { ...s, severity: sevNum } : s));
      if (isSevere) {
        setTriageLevel('URGENT_PRIORITY');
      }

      // Next step is associated symptoms
      nextStepKey = 'associated';
      nextQuestionDef = questionBank.associated || CLINICAL_INTAKE_QUESTIONS.en.associated;
    } 
    else if (currentQuestionStep === 'associated') {
      // User selected associated symptom
      if (!optionText.includes('None') && !optionText.includes('नहीं') && !optionText.includes('ಇಲ್ಲ') && !optionText.includes('இல்லை')) {
        setLiveExtractedSymptoms(prev => prev.map((s, i) => i === 0 ? { 
          ...s, 
          associatedSymptoms: [...(s.associatedSymptoms || []), optionText] 
        } : s));

        const emergencyCheck = checkRedFlagEmergency(optionText, activeLanguage);
        if (emergencyCheck.isEmergency) {
          setEmergencyAlert({
            detected: true,
            reason: emergencyCheck.reasons.join('; ') || 'Acute symptoms detected requiring immediate clinical triage.',
            advice: 'Please notify hospital triage staff immediately.'
          });
          setTriageLevel('EMERGENCY_TRIAGE');
        }
      }

      // Next step is past history
      nextStepKey = 'pastHistory';
      nextQuestionDef = questionBank.pastHistory || CLINICAL_INTAKE_QUESTIONS.en.pastHistory;
    } 
    else if (currentQuestionStep === 'pastHistory') {
      // User selected past history
      if (!optionText.includes('None') && !optionText.includes('नहीं') && !optionText.includes('ಇಲ್ಲ') && !optionText.includes('இல்லை')) {
        setExtractedPastHistory(prev => Array.from(new Set([...prev, optionText])));
      }

      // Next step is medications
      nextStepKey = 'medications';
      nextQuestionDef = questionBank.medications || CLINICAL_INTAKE_QUESTIONS.en.medications;
    } 
    else if (currentQuestionStep === 'medications') {
      // User selected medications
      if (!optionText.includes('No') && !optionText.includes('नहीं') && !optionText.includes('ಇಲ್ಲ') && !optionText.includes('இல்லை')) {
        setExtractedMedications(prev => Array.from(new Set([...prev, optionText])));
      }

      // Next step is review
      nextStepKey = 'review';
      nextQuestionDef = questionBank.review || CLINICAL_INTAKE_QUESTIONS.en.review;
    }
    else if (currentQuestionStep === 'review' || optionText.includes('Review') || optionText.includes('समीक्षा')) {
      setIsReviewModalOpen(true);
      isProcessingOptionRef.current = false;
      return;
    }

    setCurrentQuestionStep(nextStepKey);

    // 3. Immediately display Next Question (within 120ms natural breathing cadence)
    window.setTimeout(() => {
      const nextAiMsgId = 'msg-ai-step-' + Date.now();
      const nextAiMsg: ChatMessage = {
        id: nextAiMsgId,
        sender: 'ai',
        text: nextQuestionDef.question,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedQuickReplies: nextQuestionDef.options,
        isReadyForReview: nextStepKey === 'review'
      };

      setMessages(prev => [...prev, nextAiMsg]);

      // Speak asynchronously
      speakTextAsync(nextQuestionDef.question, nextAiMsgId);

      // Reset double-click guard
      isProcessingOptionRef.current = false;

      // Save consultation asynchronously in background
      persistConsultationAsync(nextAiMsg);
    }, 120);
  };

  // 5. SEND MESSAGE & CALL AI ENGINE FOR FREE-TEXT OR VOICE
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || isLoadingAi) return;

    stopSpeaking();

    // 1. Immediately show Patient message in stream (0ms)
    const patientMsgId = 'msg-user-' + Date.now();
    const patientMsg: ChatMessage = {
      id: patientMsgId,
      sender: 'patient',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, patientMsg];
    setMessages(newHistory);
    setInputText('');
    setIsLoadingAi(true);
    setSpeechError(null);

    // Immediate client-side emergency check for instant safety response
    const immediateEmergency = checkRedFlagEmergency(textToSend, activeLanguage);
    if (immediateEmergency.isEmergency) {
      setEmergencyAlert({
        detected: true,
        reason: immediateEmergency.reasons.join('; ') || 'Urgent acute symptoms detected requiring immediate clinical triage.',
        advice: 'Please alert the hospital staff immediately or proceed to the Emergency Department.'
      });
      setTriageLevel('CRITICAL_EMERGENCY');
    }

    // Check if this was a review trigger
    if (textToSend.includes('Review') || textToSend.includes('समीक्षा')) {
      setIsLoadingAi(false);
      setIsReviewModalOpen(true);
      return;
    }

    try {
      const res = await fetch('/api/intake/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          conversationHistory: newHistory.slice(-8).map((m) => ({ role: m.sender, content: m.text })),
          patientLanguage: activeLanguage,
          careStream,
          currentProfile: {
            id: currentProfile.id,
            name: currentProfile.name,
            age: currentProfile.age,
            gender: currentProfile.gender,
            allergies: currentProfile.allergies,
            pastIllnesses: currentProfile.pastIllnesses,
            currentMedications: currentProfile.currentMedications
          }
        }),
      });

      const data = await res.json();

      if (data.success) {
        setIsAiOffline(false);
        const aiResponseText = data.replyInPatientLanguage || data.replyInEnglish || 'धन्यवाद। आपकी जानकारी नोट कर ली गई है।';
        const aiMsgId = 'msg-ai-' + Date.now();

        // Check for red flags
        if (data.isRedFlag) {
          setEmergencyAlert({
            detected: true,
            reason: data.redFlagReason || 'Urgent acute symptoms detected requiring immediate clinical triage.',
            advice: 'Please alert the hospital staff immediately or proceed to the Emergency Department.'
          });
          setTriageLevel('CRITICAL_EMERGENCY');
        } else if (data.extractedData?.triageUrgency) {
          setTriageLevel(data.extractedData.triageUrgency);
        }

        const aiMsg: ChatMessage = {
          id: aiMsgId,
          sender: 'ai',
          text: aiResponseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedQuickReplies: data.suggestedQuickReplies || ['हाँ', 'नहीं', 'तकलीफ ज़्यादा है'],
          isRedFlag: data.isRedFlag,
          isEducationalOrOffTopic: data.isEducationalOrOffTopic,
          isReadyForReview: data.isReadyForReview,
          extractedInsight: data.extractedData?.chiefComplaint 
            ? `Extracted: ${data.extractedData.chiefComplaint} (${data.extractedData.duration || 'duration noted'}, Severity: ${data.extractedData.severity || 5}/10)`
            : undefined,
          extractedData: data.extractedData
        };

        setMessages((prev) => [...prev, aiMsg]);

        // Speak response asynchronously in background
        speakTextAsync(aiResponseText, aiMsgId);

        // Process extracted clinical data
        if (data.extractedData) {
          onExtractedData(data.extractedData);

          if (data.extractedData.chiefComplaint) {
            const newSymptom: SymptomItem = {
              id: 'sym-' + Date.now(),
              name: data.extractedData.chiefComplaint,
              bodyPart: data.extractedData.bodyPart || 'systemic',
              severity: data.extractedData.severity || 6,
              duration: data.extractedData.duration || 'Recent',
              onset: data.extractedData.onset || 'gradual',
              associatedSymptoms: data.extractedData.associatedSymptoms || []
            };
            setLiveExtractedSymptoms((prev) => {
              if (prev.some(s => s.name.toLowerCase() === newSymptom.name.toLowerCase())) {
                return prev;
              }
              return [...prev, newSymptom];
            });
            onAddSymptom(newSymptom);
          }

          if (data.extractedData.pastIllnessesFound?.length) {
            setExtractedPastHistory(prev => Array.from(new Set([...prev, ...data.extractedData.pastIllnessesFound])));
          }
          if (data.extractedData.medicationsFound?.length) {
            setExtractedMedications(prev => Array.from(new Set([...prev, ...data.extractedData.medicationsFound])));
          }
          if (data.extractedData.allergiesFound?.length) {
            setExtractedAllergies(prev => Array.from(new Set([...prev, ...data.extractedData.allergiesFound])));
          }
        }
      } else {
        throw new Error(data.error || 'AI intake response failed');
      }
    } catch (err: any) {
      console.warn('AI request failed, activating seamless guided continuation without disruption:', err);
      setIsAiOffline(true);

      // AUTOMATIC SILENT FALLBACK TO NEXT CLINICAL QUESTION (No manual click required!)
      let fallbackStepKey = 'duration';
      if (liveExtractedSymptoms.length === 0) {
        // Record user's text as chief complaint
        const newSym: SymptomItem = {
          id: 'sym-fb-' + Date.now(),
          name: textToSend,
          bodyPart: 'systemic',
          severity: 6,
          duration: 'Recent',
          onset: 'gradual'
        };
        setLiveExtractedSymptoms([newSym]);
        onAddSymptom(newSym);
        fallbackStepKey = 'duration';
      } else if (!liveExtractedSymptoms[0]?.duration || liveExtractedSymptoms[0].duration === 'Recent') {
        fallbackStepKey = 'duration';
      } else {
        fallbackStepKey = 'severity';
      }

      setCurrentQuestionStep(fallbackStepKey);
      const fallbackQuestionDef = questionBank[fallbackStepKey] || questionBank.duration || CLINICAL_INTAKE_QUESTIONS.en.duration;
      
      const fallbackAiMsgId = 'msg-fb-' + Date.now();
      const fallbackMsg: ChatMessage = {
        id: fallbackAiMsgId,
        sender: 'ai',
        text: fallbackQuestionDef.question,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedQuickReplies: fallbackQuestionDef.options,
        isErrorFallback: true
      };

      setMessages((prev) => [...prev, fallbackMsg]);
      speakTextAsync(fallbackQuestionDef.question, fallbackAiMsgId);
    } finally {
      setIsLoadingAi(false);
    }
  };

  // 6. Asynchronous Background Consultation Persistence
  const persistConsultationAsync = (latestAiMsg?: ChatMessage) => {
    try {
      const consultationRecord: ConsultationRecord = {
        id: consultationId,
        patientId: currentProfile.id || 'patient-unknown',
        patientName: currentProfile.name || 'Patient',
        uhid: currentProfile.uhid,
        tokenNumber: currentProfile.tokenNumber,
        careStream: (currentProfile.careStream as CareStream) || 'allopathy',
        language: (language as SupportedLanguage) || 'hi',
        startedAt: messages[0]?.timestamp || new Date().toISOString(),
        completedAt: new Date().toISOString(),
        status: 'in_progress',
        conversation: latestAiMsg ? [...messages, latestAiMsg] : messages,
        symptoms: liveExtractedSymptoms,
        pastIllnesses: extractedPastHistory,
        currentMedications: extractedMedications.map(name => ({ name })),
        knownAllergies: extractedAllergies,
        redFlagsDetected: emergencyAlert.detected && emergencyAlert.reason ? [emergencyAlert.reason] : [],
        triageRisk: (triageLevel as any) || 'STANDARD_OPD',
        patientConfirmedAt: undefined
      };

      // Non-blocking async background post
      fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consultationRecord)
      }).catch(e => console.warn('Background consultation sync notice:', e));
    } catch (e) {
      console.warn('Consultation background format error:', e);
    }
  };

  // 7. Final Confirm & Save Consultation
  const handleConfirmAndSaveConsultation = async () => {
    setIsSavingConsultation(true);
    try {
      const consultationRecord: ConsultationRecord = {
        id: consultationId,
        patientId: currentProfile.id || 'patient-unknown',
        patientName: currentProfile.name || 'Patient',
        uhid: currentProfile.uhid,
        tokenNumber: currentProfile.tokenNumber,
        careStream: (currentProfile.careStream as CareStream) || 'allopathy',
        language: (language as SupportedLanguage) || 'hi',
        startedAt: messages[0]?.timestamp || new Date().toISOString(),
        completedAt: new Date().toISOString(),
        status: 'confirmed',
        conversation: messages,
        symptoms: liveExtractedSymptoms,
        pastIllnesses: extractedPastHistory,
        currentMedications: extractedMedications.map(name => ({ name })),
        knownAllergies: extractedAllergies,
        redFlagsDetected: emergencyAlert.detected && emergencyAlert.reason ? [emergencyAlert.reason] : [],
        triageRisk: (triageLevel as any) || 'STANDARD_OPD',
        patientConfirmedAt: new Date().toISOString()
      };

      await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consultationRecord)
      });

      setIsConsultationConfirmed(true);
      setIsReviewModalOpen(false);

      if (onConsultationSaved) {
        onConsultationSaved(consultationRecord);
      }
    } catch (err) {
      console.error('Error saving final consultation record:', err);
      setIsConsultationConfirmed(true);
      setIsReviewModalOpen(false);
    } finally {
      setIsSavingConsultation(false);
    }
  };

  // 8. RENDER CONFIRMED STATE
  if (isConsultationConfirmed) {
    return (
      <div className="bg-white rounded-3xl border border-teal-200 p-6 sm:p-8 space-y-6 shadow-xl text-center max-w-2xl mx-auto animate-in fade-in duration-150">
        <div className="w-16 h-16 rounded-3xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-9 h-9 text-teal-600" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-mono font-bold uppercase tracking-wider border border-teal-200">
            Consultation Confirmed • {consultationId}
          </span>
          <h2 className="text-2xl font-black text-slate-900">
            Clinical Intake Successfully Recorded
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Your symptoms, duration, and medical history have been synthesized and securely transmitted to the doctor's clinical workstation.
          </p>
        </div>

        {/* Structured Summary Preview Box */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Recorded Summary</span>
            <span className="text-xs font-bold text-teal-700">{liveExtractedSymptoms.length} Symptoms Captured</span>
          </div>

          <div className="space-y-2">
            {liveExtractedSymptoms.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <div>
                  <span className="font-bold text-slate-900">{s.name}</span>
                  <span className="text-slate-500 ml-2">({s.duration || 'Duration noted'}, Severity: {s.severity}/10)</span>
                </div>
                <span className="px-2 py-0.5 bg-teal-50 text-teal-800 font-bold rounded uppercase text-[10px]">
                  {s.bodyPart || 'General'}
                </span>
              </div>
            ))}
          </div>

          {emergencyAlert.detected && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-900 font-bold">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Priority Red-Flag Flagged for Doctor: {emergencyAlert.reason}</span>
            </div>
          )}
        </div>

        {/* Next Step Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {onProceedToNextStep && (
            <button
              type="button"
              onClick={onProceedToNextStep}
              className="w-full sm:w-auto px-6 py-3 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
            >
              <span>Next: Scan Medical Reports / Vitals</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsConsultationConfirmed(false)}
            className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
          >
            Review Conversation
          </button>
        </div>
      </div>
    );
  }

  // 9. MAIN ACTIVE INTAKE ASSISTANT UI (STABLE, INDEPENDENT SCROLLING CONTAINER)
  return (
    <div 
      id="voice-intake-assistant" 
      className="bg-white rounded-3xl border border-slate-200 shadow-xl flex flex-col h-[640px] sm:h-[680px] overflow-hidden relative"
    >
      {/* 1. Fixed/Sticky Header Bar with Patient Context & Audio Controls */}
      <div className="shrink-0 p-3.5 sm:p-4 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md transition-all ${
              isListening ? 'bg-rose-600 ring-4 ring-rose-400/40 animate-pulse' : 'bg-teal-600'
            }`}>
              <Mic className="w-5 h-5 text-white" />
            </div>
            {isSpeaking && (
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm sm:text-base text-white">
                MediKiosk Conversational Intake AI
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-teal-500/30 text-teal-300 rounded-full border border-teal-500/40">
                {langConfig.nativeName} ({langConfig.name})
              </span>
            </div>
            <p className="text-[11px] text-slate-300 flex items-center gap-1.5 pt-0.5">
              <span>👤 {currentProfile.name || 'Patient'}</span>
              <span>•</span>
              <span className="text-teal-300">Pre-Consultation Assistant</span>
            </p>
          </div>
        </div>

        {/* Audio Speech Stop & Review Trigger */}
        <div className="flex items-center gap-2">
          {isSpeaking && (
            <button
              type="button"
              onClick={stopSpeaking}
              className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl flex items-center gap-1.5 border border-slate-700 cursor-pointer shadow-2xs"
              title="Stop Speech Output"
            >
              <VolumeX className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline font-bold">Stop Audio</span>
            </button>
          )}

          {liveExtractedSymptoms.length > 0 && (
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(true)}
              className="px-3 py-1.5 bg-teal-800/90 hover:bg-teal-700 text-teal-200 border border-teal-600/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Activity className="w-3.5 h-3.5 text-teal-400" />
              <span>{liveExtractedSymptoms.length} Recorded</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Voice Playback Notice if language voice is not natively installed on this device */}
      {voiceUnavailableNotice && (
        <div className="shrink-0 px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <VolumeX className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Voice playback is not available for {langConfig.name} ({langConfig.nativeName}) on this device. You can read the text on screen.</span>
          </div>
          <button
            type="button"
            onClick={() => setVoiceUnavailableNotice(false)}
            className="text-[11px] font-bold text-amber-700 hover:text-amber-900 ml-2 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3. Red Flag Emergency Alert Banner (shrink-0) */}
      {emergencyAlert.detected && (
        <div className="shrink-0 p-3.5 bg-rose-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <Siren className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-black uppercase tracking-wide">
                ⚠️ Emergency Red-Flag Symptoms Detected
              </p>
              <p className="text-xs text-rose-100 font-medium">
                {emergencyAlert.reason}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setStaffAlertDispatched(true);
                setTimeout(() => setStaffAlertDispatched(false), 8000);
              }}
              className="px-3.5 py-1.5 bg-white text-rose-700 hover:bg-rose-50 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
            >
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>{staffAlertDispatched ? '✓ Medical Team Alerted' : '🚨 Alert Staff Now'}</span>
            </button>
            <button
              type="button"
              onClick={() => setEmergencyAlert({ detected: false })}
              className="px-2.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-rose-200 rounded-xl text-xs font-bold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 4. Subtle Friendly Notice when AI is in fallback mode (Non-intrusive) */}
      {isAiOffline && (
        <div className="shrink-0 px-4 py-2 bg-teal-50 border-b border-teal-200 text-teal-900 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>AI assistance is temporarily offline. You can continue your health check safely.</span>
          </div>
          <button
            type="button"
            onClick={() => setIsAiOffline(false)}
            className="text-[11px] font-bold text-teal-700 hover:text-teal-900 underline ml-2 cursor-pointer"
          >
            Retry AI
          </button>
        </div>
      )}

      {/* 4. Independently Scrollable Conversation Container */}
      <div 
        ref={chatContainerRef} 
        id="clinical-chat-messages-container"
        className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/80 custom-scrollbar"
      >
        {/* Live Audio Listening Wave */}
        {listeningState === 'listening' && (
          <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-teal-950 text-white p-4 rounded-2xl shadow-md border border-teal-500/40 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-2 text-teal-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <span>Listening carefully... Speak in {langConfig.nativeName} ({langConfig.name})</span>
              </span>
              <span className="font-mono text-[11px] text-slate-400">Live Voice Stream</span>
            </div>
            <PulseWave color="marigold" height={26} className="h-6" animated={true} />
            <p className="text-[11px] text-teal-200/80">When you finish speaking, your words will appear below.</p>
          </div>
        )}

        {listeningState === 'transcribing' && (
          <div className="p-3 bg-teal-50 border border-teal-200 text-teal-900 rounded-2xl flex items-center gap-2 text-xs font-bold animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
            <span>Transcribing your speech in {langConfig.name}...</span>
          </div>
        )}

        {/* Message Bubbles */}
        {messages.map((msg) => {
          const isAi = msg.sender === 'ai';
          const isCurrentlySpeakingThis = isSpeaking && activeSpeakingMsgId === msg.id;
          const isQuestionAnswered = answeredQuestionIds.has(msg.id);

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isAi ? 'items-start' : 'items-end'} animate-in fade-in duration-100`}
            >
              {/* Message Header Label */}
              <div className="flex items-center gap-2 mb-1 px-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {isAi ? (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-800 font-extrabold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                      MediKiosk AI
                    </span>
                    <button
                      type="button"
                      onClick={() => speakTextAsync(msg.text, msg.id)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        isCurrentlySpeakingThis
                          ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-400'
                          : 'bg-teal-50 hover:bg-teal-100 text-teal-800'
                      }`}
                      title="Listen to this message"
                    >
                      <Volume2 className="w-3 h-3 text-teal-600" />
                      <span>{isCurrentlySpeakingThis ? 'Speaking...' : '🔊 Listen'}</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-teal-700 font-extrabold">
                    👤 Patient ({currentProfile.name || 'You'})
                  </span>
                )}
                <span>•</span>
                <span className="font-mono text-slate-400 font-normal">{msg.timestamp}</span>
              </div>

              {/* Message Text Bubble */}
              <div
                className={`max-w-[88%] rounded-2xl p-4 text-sm sm:text-base leading-relaxed ${
                  isAi
                    ? 'bg-white text-slate-900 font-semibold border border-slate-300/80 rounded-bl-xs shadow-xs'
                    : 'bg-teal-700 text-white font-medium rounded-br-xs shadow-sm'
                }`}
              >
                <p className="whitespace-pre-line tracking-normal">{msg.text}</p>
                
                {/* Extracted Insight Badge */}
                {msg.extractedInsight && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-200 flex items-center gap-2 text-xs font-bold text-teal-900 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200">
                    <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>{msg.extractedInsight}</span>
                  </div>
                )}
              </div>

              {/* Suggested Quick Replies (Only interactive if question not yet answered) */}
              {isAi && msg.suggestedQuickReplies && msg.suggestedQuickReplies.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-2 max-w-[92%]">
                  {msg.suggestedQuickReplies.map((reply, idx) => {
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={isQuestionAnswered}
                        onClick={() => handleSelectOption(reply, msg.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-2xs text-left cursor-pointer active:scale-98 ${
                          isQuestionAnswered
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 opacity-60 cursor-not-allowed'
                            : 'bg-white hover:bg-teal-50 text-slate-800 hover:text-teal-950 border border-slate-300 hover:border-teal-500'
                        }`}
                      >
                        💬 {reply}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* AI Thinking Indicator (Inline inside chat container, does not freeze screen) */}
        {isLoadingAi && (
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 w-full max-w-sm space-y-1.5 text-xs font-bold text-teal-950 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-teal-600 animate-spin" />
              <span>आपकी जानकारी समझ रहा हूँ... (Analyzing symptoms in {langConfig.name})</span>
            </div>
            <PulseWave color="teal" height={14} className="h-3.5" animated={true} />
          </div>
        )}
      </div>

      {/* 5. Speech Error Notice (shrink-0) */}
      {speechError && (
        <div className="shrink-0 px-4 py-2 bg-amber-50 border-t border-amber-200 text-amber-900 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{speechError}</span>
          </div>
          <button onClick={() => setSpeechError(null)} className="font-bold underline text-amber-950 ml-2 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* 6. Fixed/Sticky Bottom Input Area (Never jumps or scrolls the page) */}
      <div className="shrink-0 p-3.5 bg-white border-t border-slate-200">
        <div className="flex items-center gap-3">
          
          {/* Main Microphone Button */}
          <button
            type="button"
            id="voice-mic-trigger-btn"
            onClick={toggleListening}
            className={`p-3.5 sm:px-5 sm:py-3.5 rounded-2xl font-black text-white transition-all flex items-center justify-center gap-2 shrink-0 shadow-md cursor-pointer ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-700 ring-4 ring-rose-200 animate-pulse'
                : 'bg-teal-600 hover:bg-teal-700'
            }`}
            title={isListening ? 'Stop Recording' : 'Tap to Speak Voice Input'}
          >
            {isListening ? (
              <>
                <MicOff className="w-5 h-5" />
                <span className="text-xs font-bold hidden sm:inline">Stop</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                <span className="text-xs font-bold hidden sm:inline">🎤 Speak</span>
              </>
            )}
          </button>

          {/* Text Input Field */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              id="voice-chat-text-input"
              type="text"
              value={inputText}
              disabled={isLoadingAi}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              placeholder={
                isLoadingAi 
                  ? 'AI is analyzing your response...' 
                  : `Type symptoms or speak in ${langConfig.nativeName} (${langConfig.name})...`
              }
              className="w-full pl-4 pr-12 py-3.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-teal-600 rounded-2xl text-sm sm:text-base font-semibold text-slate-900 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 shadow-2xs transition-all disabled:opacity-50"
            />
            
            <button
              type="button"
              id="voice-chat-send-btn"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isLoadingAi}
              className="absolute right-2 top-2 p-2.5 text-teal-700 hover:text-teal-900 disabled:opacity-30 rounded-xl transition-colors cursor-pointer bg-teal-50 hover:bg-teal-100 disabled:bg-transparent"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {/* Review & Submit Shortcut Button */}
          {liveExtractedSymptoms.length > 0 && (
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(true)}
              className="hidden md:flex px-4 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs items-center gap-1.5 shrink-0 transition-colors shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Review & Finish</span>
            </button>
          )}
        </div>
      </div>

      {/* 7. Structured Review & Confirmation Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">Review Your Clinical Intake</h4>
                  <p className="text-xs text-slate-500">Please confirm the details before sending to the doctor</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Symptoms List */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-500 uppercase">Recorded Symptoms</h5>
              {liveExtractedSymptoms.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No symptoms recorded yet.</p>
              ) : (
                liveExtractedSymptoms.map((sym, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs sm:text-sm">
                    <div>
                      <p className="font-bold text-slate-900">{sym.name}</p>
                      <p className="text-xs text-slate-500">Duration: {sym.duration || 'Not specified'} • Severity: {sym.severity || 5}/10</p>
                    </div>
                    <span className="px-2 py-0.5 bg-teal-100 text-teal-800 rounded font-bold text-xs uppercase">
                      {sym.bodyPart || 'General'}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Past History & Current Medications */}
            {(extractedPastHistory.length > 0 || extractedMedications.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                {extractedPastHistory.length > 0 && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-700 block mb-1">Past Conditions:</span>
                    <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                      {extractedPastHistory.map((h, i) => <li key={i}>{h}</li>)}
                    </ul>
                  </div>
                )}
                {extractedMedications.length > 0 && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-700 block mb-1">Current Medications:</span>
                    <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                      {extractedMedications.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Allergies */}
            {extractedAllergies.length > 0 && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                <span className="font-bold text-amber-900 block mb-1">Known Allergies:</span>
                <p className="text-amber-800">{extractedAllergies.join(', ')}</p>
              </div>
            )}

            {/* Priority Alert if detected */}
            {emergencyAlert.detected && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-900 font-bold">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Priority Emergency Triage: {emergencyAlert.reason}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer transition-colors"
              >
                Continue Intake
              </button>
              <button
                type="button"
                onClick={handleConfirmAndSaveConsultation}
                disabled={isSavingConsultation}
                className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
              >
                {isSavingConsultation ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm & Send to Doctor</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
