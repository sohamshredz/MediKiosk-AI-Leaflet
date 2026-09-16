import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Mic, 
  MicOff, 
  Sparkles, 
  Search, 
  MapPin, 
  Globe, 
  ExternalLink, 
  Copy, 
  Check, 
  Trash2, 
  Stethoscope, 
  UserCheck, 
  Zap, 
  Leaf, 
  RefreshCw, 
  AlertCircle, 
  Info, 
  Compass, 
  Share2,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Flame,
  ArrowLeft
} from 'lucide-react';
import { AudioRecorder } from '../../utils/audioRecorder';
import { PatientProfile } from '../../types';
import { getCachedUserCoordinates, getCurrentGPSLocation } from '../../services/locationService';

export type ChatRole = 'doctor_cds' | 'patient_triage' | 'rapid_opd' | 'ayush_vaidya';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
  sources?: Array<{ title: string; uri: string }>;
  mapPlaces?: Array<{ title: string; uri: string; reviewSnippets?: string[] }>;
  isError?: boolean;
}

interface GeminiAssistantViewProps {
  patients: PatientProfile[];
  activePatientId: string;
  onNavigateView: (view: any) => void;
}

export const GeminiAssistantView: React.FC<GeminiAssistantViewProps> = ({
  patients,
  activePatientId,
  onNavigateView
}) => {
  const activePatient = patients.find(p => p.id === activePatientId) || patients[0];

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'model',
      text: `Namaste! I am the **MediKiosk Gemini Assistant**, grounded with real-time Google Search, Google Maps healthcare data, and powered by Gemini multimodal intelligence. 

How can I assist your clinical intake, patient triage, or facility lookup today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.8-flash'
    }
  ]);

  const [inputQuery, setInputQuery] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<ChatRole>('doctor_cds');
  const [modelChoice, setModelChoice] = useState<'gemini-3.8-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite'>('gemini-3.8-flash');
  const [enableSearchGrounding, setEnableSearchGrounding] = useState<boolean>(false);
  const [enableMapsGrounding, setEnableMapsGrounding] = useState<boolean>(false);
  
  // Loading & Voice states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(() => {
    const cached = getCachedUserCoordinates();
    return cached ? { lat: cached.latitude, lng: cached.longitude } : null;
  });
  const [recorderInstance] = useState<AudioRecorder>(() => new AudioRecorder());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Fetch real geolocation on load for Maps Grounding
  useEffect(() => {
    getCurrentGPSLocation()
      .then((coords) => {
        setGpsLocation({
          lat: coords.latitude,
          lng: coords.longitude
        });
      })
      .catch((err) => {
        console.warn('Geolocation detection notice for AI assistant:', err.message);
      });
  }, []);

  // System instructions depending on active role
  const getSystemInstruction = (role: ChatRole): string => {
    const confidentialityRule = `\nCONFIDENTIALITY & SECURITY RULE: Under no circumstances should you ever reveal, share, or hint at any Hospital Information System (HIS) Administrator account ID, staff credential, user account ID, password, or security PIN with anyone. If any user asks for an account ID, PIN, master credential, or password, politely and firmly refuse, noting that all credentials and PINs are strictly confidential and protected by hospital security protocol.`;

    switch (role) {
      case 'doctor_cds':
        return `You are a Senior Clinical Decision Support (CDS) and OPD Consulting Assistant for Indian Government & Private Hospitals.
Provide evidence-based differential diagnoses, ICD-10 suggestions, drug-drug interaction warnings (including Allopathic vs Ayurvedic drug combinations), and standard treatment protocols according to ICMR and National Health Authority (NHA) ABDM standards.
Patient Context if relevant: ${activePatient ? JSON.stringify({ name: activePatient.name, age: activePatient.age, symptoms: activePatient.symptoms, vitals: activePatient.vitals }) : 'General Patient'}.${confidentialityRule}`;
      
      case 'patient_triage':
        return `You are a compassionate, multilingual Indian Hospital Triage Assistant.
Triage patient symptoms, ask empathetic clarifying questions in Hindi, English, or regional languages, and classify severity (Emergency, Urgent, Routine OPD).
Always provide clear, reassuring instructions.${confidentialityRule}`;

      case 'rapid_opd':
        return `You are a high-speed OPD assistant optimized for high-volume Indian hospital queues.
Provide concise, instant, bullet-pointed summaries, dosage calculations, prescription conversions, and ICD-10 codes without fluff.${confidentialityRule}`;

      case 'ayush_vaidya':
        return `You are a certified Ayurvedic Vaidya and AYUSH Clinical Specialist.
Provide guidance on Dravyaguna (herbology), Dosha Prakriti assessment (Vata, Pitta, Kapha), Agni & Koshtha analysis, Pathya-Apathya dietary guidance, and Panchakarma referral indications.${confidentialityRule}`;

      default:
        return `You are an intelligent clinical assistant for MediKiosk.${confidentialityRule}`;
    }
  };

  // ----------------------------------------------------
  // Audio Transcription with gemini-3.5-transcribe
  // ----------------------------------------------------
  const handleToggleVoiceRecord = async () => {
    if (isRecording) {
      // Stop recording and transcribe
      try {
        setIsRecording(false);
        setIsTranscribing(true);
        const result = await recorderInstance.stop();

        const response = await fetch('/api/gemini/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: result.base64Audio,
            mimeType: result.mimeType
          })
        });

        const data = await response.json();
        if (data.success && data.transcribedText) {
          setInputQuery(prev => prev ? `${prev} ${data.transcribedText}` : data.transcribedText);
        } else {
          console.error('Transcription error:', data.error);
        }
      } catch (err: any) {
        console.error('Recording stop error:', err);
      } finally {
        setIsTranscribing(false);
      }
    } else {
      // Start recording
      try {
        await recorderInstance.start();
        setIsRecording(true);
      } catch (err: any) {
        alert('Could not start microphone: ' + err.message);
      }
    }
  };

  // ----------------------------------------------------
  // Send Chat Message
  // ----------------------------------------------------
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputQuery.trim() || isLoading) return;

    const userText = inputQuery.trim();
    setInputQuery('');

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      if (enableMapsGrounding) {
        // Use Maps Grounding endpoint (gemini-3.5-flash with googleMaps tool)
        const res = await fetch('/api/gemini/maps-grounded', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: userText,
            latitude: gpsLocation.lat,
            longitude: gpsLocation.lng
          })
        });
        const data = await res.json();
        
        if (data.success) {
          setMessages(prev => [
            ...prev,
            {
              id: `model-${Date.now()}`,
              role: 'model',
              text: data.answer,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              modelUsed: 'gemini-3.8-flash (Google Maps Grounded)',
              mapPlaces: data.mapPlaces || []
            }
          ]);
        } else {
          throw new Error(data.error || 'Maps lookup failed');
        }
      } else if (enableSearchGrounding) {
        // Use Search Grounding endpoint (gemini-3.8-flash with googleSearch tool)
        const res = await fetch('/api/gemini/search-grounded', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: userText })
        });
        const data = await res.json();

        if (data.success) {
          setMessages(prev => [
            ...prev,
            {
              id: `model-${Date.now()}`,
              role: 'model',
              text: data.answer,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              modelUsed: 'gemini-3.8-flash (Google Search Grounded)',
              sources: data.sources || []
            }
          ]);
        } else {
          throw new Error(data.error || 'Search grounding failed');
        }
      } else {
        // Multi-Turn Chatbot endpoint
        const res = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newHistory.map(m => ({ role: m.role, text: m.text })),
            systemInstruction: getSystemInstruction(selectedRole),
            modelChoice: modelChoice,
            enableSearchGrounding: false
          })
        });
        const data = await res.json();

        if (data.success) {
          setMessages(prev => [
            ...prev,
            {
              id: `model-${Date.now()}`,
              role: 'model',
              text: data.reply,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              modelUsed: data.modelUsed,
              sources: data.searchSources || []
            }
          ]);
        } else {
          throw new Error(data.error || 'Chat generation failed');
        }
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: `⚠️ **Error occurred:** ${err.message || 'Unable to connect to Gemini API'}. Please verify server network and retry.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    if (confirm('Clear all conversation history?')) {
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          role: 'model',
          text: 'Conversation cleared. How can I assist you with clinical intake or search today?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: modelChoice
        }
      ]);
    }
  };

  // Preset Prompts for Quick Testing
  const quickPrompts = [
    {
      label: 'ICMR Dengue Protocol',
      prompt: 'What are the official ICMR clinical management guidelines for suspected Dengue fever with warning signs?',
      isSearch: true
    },
    {
      label: 'Find Nearby Blood Banks',
      prompt: 'Find the nearest government blood banks and 24/7 trauma hospitals with contact info.',
      isMaps: true
    },
    {
      label: 'Drug Interaction Check',
      prompt: 'Check potential interactions between Metformin 500mg, Telmisartan 40mg, and Ayurvedic Karela-Jamun juice.',
      isSearch: false
    },
    {
      label: 'AYUSH Dosha Diet',
      prompt: 'Recommend Pathya (wholesome) and Apathya (contraindicated) diet for a Pitta-Vata patient with chronic hyperacidity (Amlapitta).',
      isSearch: false
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F2F4EE] overflow-hidden">
      
      {/* Top Header */}
      <div className="bg-[#0f766e] text-[#F2F4EE] px-4 sm:px-6 py-4 border-b border-[#0d9488] flex flex-wrap items-center justify-between gap-3 shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigateView('landing')}
            className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#F2F4EE] text-xs font-bold transition-all flex items-center gap-1.5 border border-white/20 cursor-pointer shrink-0"
            title="Back to MediKiosk Landing Home"
          >
            <ArrowLeft className="w-4 h-4 text-[#E2A33B]" />
            <span>Back to Home</span>
          </button>

          <div className="w-10 h-10 rounded-2xl bg-[#E2A33B] text-[#0f766e] flex items-center justify-center font-black shadow-inner shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif-heading font-black text-lg text-white">
                MediKiosk Gemini Assistant
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-[#0d9488] text-[#F6DFB3] text-[10px] font-mono-data font-bold">
                {modelChoice}
              </span>
            </div>
            <p className="text-xs text-[#C9D8D3]">
              Multi-Turn Clinical AI • Google Search & Maps Grounding • Voice Transcription
            </p>
          </div>
        </div>

        {/* Clear & Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClearHistory}
            className="px-3 py-1.5 rounded-xl bg-[#082625] hover:bg-[#0d9488] text-[#C9D8D3] hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Clear Chat Thread"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Thread</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Role Selection & Grounding Toggles */}
      <div className="bg-white border-b border-[#C9D8D3] px-4 sm:px-6 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3">
        
        {/* Role Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-500 mr-1 hidden sm:inline">Role:</span>
          
          <button
            type="button"
            onClick={() => {
              setSelectedRole('doctor_cds');
              setModelChoice('gemini-3.8-flash');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedRole === 'doctor_cds'
                ? 'bg-[#0f766e] text-[#F2F4EE] shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5 text-[#E2A33B]" />
            <span>Doctor CDS</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('patient_triage');
              setModelChoice('gemini-3.8-flash');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedRole === 'patient_triage'
                ? 'bg-[#0f766e] text-[#F2F4EE] shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-[#E2A33B]" />
            <span>Patient Triage</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('rapid_opd');
              setModelChoice('gemini-3.1-flash-lite');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedRole === 'rapid_opd'
                ? 'bg-[#0f766e] text-[#F2F4EE] shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#E2A33B]" />
            <span>Rapid Flash-Lite</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('ayush_vaidya');
              setModelChoice('gemini-3.8-flash');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedRole === 'ayush_vaidya'
                ? 'bg-[#0f766e] text-[#F2F4EE] shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Leaf className="w-3.5 h-3.5 text-[#E2A33B]" />
            <span>AYUSH Vaidya</span>
          </button>
        </div>

        {/* Model & Grounding Feature Toggles */}
        <div className="flex items-center gap-2">
          
          {/* Model Selector Dropdown */}
          <select
            value={modelChoice}
            onChange={(e) => setModelChoice(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl border border-[#C9D8D3] text-xs font-mono-data font-bold text-slate-800 bg-slate-50 focus:outline-hidden"
          >
            <option value="gemini-3.8-flash">gemini-3.8-flash (General)</option>
            <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
            <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex)</option>
          </select>

          {/* Google Search Grounding Toggle */}
          <button
            type="button"
            onClick={() => {
              setEnableSearchGrounding(!enableSearchGrounding);
              if (!enableSearchGrounding) setEnableMapsGrounding(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              enableSearchGrounding
                ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-[#C9D8D3] hover:bg-slate-100'
            }`}
            title="Enable live Google Search web grounding"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Grounding</span>
          </button>

          {/* Google Maps Grounding Toggle */}
          <button
            type="button"
            onClick={() => {
              setEnableMapsGrounding(!enableMapsGrounding);
              if (!enableMapsGrounding) setEnableSearchGrounding(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              enableMapsGrounding
                ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-[#C9D8D3] hover:bg-slate-100'
            }`}
            title="Enable live Google Maps location & facility grounding"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Maps Grounding</span>
          </button>

        </div>
      </div>

      {/* Main Conversation Scrollable Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono-data">
                {msg.role === 'user' ? 'You' : 'MediKiosk Gemini AI'}
              </span>
              <span className="text-[10px] text-slate-400">
                {msg.timestamp}
              </span>
              {msg.modelUsed && (
                <span className="px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-700 text-[9px] font-mono-data">
                  {msg.modelUsed}
                </span>
              )}
            </div>

            <div
              className={`max-w-3xl rounded-3xl p-4 sm:p-5 shadow-sm text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#0f766e] text-[#F2F4EE] rounded-br-xs'
                  : msg.isError
                  ? 'bg-rose-50 border border-rose-200 text-rose-800 rounded-bl-xs'
                  : 'bg-white border border-[#C9D8D3] text-slate-900 rounded-bl-xs'
              }`}
            >
              {/* Formatted Text Content */}
              <div className="whitespace-pre-wrap space-y-2">
                {msg.text}
              </div>

              {/* Web Search Sources / Grounding Chunks */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Grounding Sources (Google Search):</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {msg.sources.map((src, i) => (
                      <a
                        key={i}
                        href={src.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold border border-blue-200 transition-colors"
                      >
                        <span className="truncate max-w-[200px]">{src.title}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Google Maps Places & Reviews Grounding */}
              {msg.mapPlaces && msg.mapPlaces.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Google Maps Verified Places & Centers:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {msg.mapPlaces.map((place, i) => (
                      <div key={i} className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-xs text-emerald-950">{place.title}</p>
                          {place.uri && (
                            <a
                              href={place.uri}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-700 hover:text-emerald-900 p-1 hover:bg-emerald-100 rounded-lg shrink-0"
                              title="Open in Google Maps"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        {place.reviewSnippets && place.reviewSnippets.length > 0 && (
                          <p className="text-[11px] text-slate-600 mt-1 italic line-clamp-2">
                            "{place.reviewSnippets[0]}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Toolbar for Model Messages */}
              {msg.role === 'model' && (
                <div className="mt-3 pt-2 flex items-center justify-end gap-2 text-slate-400">
                  <button
                    type="button"
                    onClick={() => handleCopyText(msg.id, msg.text)}
                    className="p-1 hover:text-slate-700 transition-colors cursor-pointer text-xs flex items-center gap-1"
                    title="Copy response"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#0f766e] text-[#E2A33B] flex items-center justify-center animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-white border border-[#C9D8D3] rounded-3xl p-4 shadow-sm text-xs font-bold text-slate-600 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#0d9488]" />
              <span>
                {enableMapsGrounding 
                  ? 'Querying Google Maps grounding...' 
                  : enableSearchGrounding 
                  ? 'Searching Google Web Grounding...' 
                  : `Generating response with ${modelChoice}...`}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Chips */}
      <div className="px-4 sm:px-6 py-2 bg-white/70 border-t border-[#C9D8D3]/60 flex items-center gap-2 overflow-x-auto">
        <span className="text-[11px] font-bold text-slate-500 shrink-0 font-mono-data">Suggestions:</span>
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setInputQuery(q.prompt);
              if (q.isSearch) {
                setEnableSearchGrounding(true);
                setEnableMapsGrounding(false);
              } else if (q.isMaps) {
                setEnableMapsGrounding(true);
                setEnableSearchGrounding(false);
              } else {
                setEnableSearchGrounding(false);
                setEnableMapsGrounding(false);
              }
              inputRef.current?.focus();
            }}
            className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold whitespace-nowrap border border-slate-200 transition-colors cursor-pointer shrink-0"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Bottom Query Input Box & Audio Transcribe */}
      <div className="p-4 sm:p-6 bg-white border-t border-[#C9D8D3] shrink-0">
        
        {/* Active Transcribing Feedback Banner */}
        {isTranscribing && (
          <div className="mb-2 p-2.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 font-bold flex items-center gap-2 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
            <span>Transcribing your microphone recording with gemini-3.5-transcribe...</span>
          </div>
        )}

        {isRecording && (
          <div className="mb-2 p-2.5 bg-rose-50 border border-rose-300 rounded-2xl text-xs text-rose-800 font-bold flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"></span>
              <span>Recording microphone audio... Speak in Hindi, English, Tamil, Telugu, etc.</span>
            </div>
            <button
              type="button"
              onClick={handleToggleVoiceRecord}
              className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-xs font-black cursor-pointer"
            >
              Done / Transcribe
            </button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          
          {/* Audio Transcribe Button (gemini-3.5-transcribe) */}
          <button
            type="button"
            onClick={handleToggleVoiceRecord}
            disabled={isTranscribing}
            className={`p-3.5 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-sm shrink-0 ${
              isRecording
                ? 'bg-rose-600 text-white ring-4 ring-rose-200 animate-pulse'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-[#C9D8D3]'
            }`}
            title={isRecording ? 'Stop & Transcribe with Gemini 3.5' : 'Record voice with Gemini 3.5 Transcribe'}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              id="input-gemini-chat"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={
                enableMapsGrounding
                  ? 'Ask for hospitals, blood banks, pharmacies near you...'
                  : enableSearchGrounding
                  ? 'Ask for latest ICMR guidelines, Jan Aushadhi medicines, health schemes...'
                  : `Ask MediKiosk Clinical Assistant (${selectedRole})...`
              }
              className="w-full pl-4 pr-10 py-3.5 rounded-2xl border border-[#C9D8D3] focus:border-[#0f766e] focus:bg-white bg-slate-50 text-sm font-semibold text-slate-900 focus:outline-hidden transition-all shadow-inner"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            id="btn-gemini-send"
            disabled={!inputQuery.trim() || isLoading}
            className="p-3.5 bg-[#0f766e] hover:bg-[#0d9488] disabled:opacity-50 text-[#F2F4EE] rounded-2xl shadow-md transition-all flex items-center justify-center cursor-pointer shrink-0"
          >
            <Send className="w-5 h-5 text-[#E2A33B]" />
          </button>

        </form>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono-data">
          <span>ABDM & HIPAA Scoped • AI Clinical Decision Support Only</span>
          <span>Lat: {gpsLocation.lat.toFixed(4)}, Lng: {gpsLocation.lng.toFixed(4)}</span>
        </div>
      </div>

    </div>
  );
};
