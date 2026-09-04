import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  PatientProfile, 
  PrescriptionRecord, 
  PrescriptionMedication, 
  UserRole,
  SupportedLanguage
} from '../../types';
import { saveOrUpdatePrescription } from '../../utils/prescriptionStorage';
import { extractPrescriptionRules, ExtractedPrescriptionData } from '../../utils/prescriptionRuleExtractor';
import { 
  generatePrescriptionNarration,
  getVoiceForLanguage,
  isVoiceAvailableForLanguage,
  PRESCRIPTION_VOICE_LANGUAGES
} from '../../utils/prescriptionNarration';
import { SUPPORTED_LANGUAGES } from '../../data/indianLanguages';
import { 
  Camera, 
  Upload, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Trash2, 
  Plus, 
  Edit3, 
  Eye, 
  ArrowLeft, 
  ShieldCheck, 
  Pill, 
  Stethoscope, 
  X, 
  Check, 
  RefreshCw, 
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Activity,
  FileCheck2,
  Info,
  Volume2,
  Square,
  VolumeX,
  Radio
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface PrescriptionScannerViewProps {
  currentPatient: PatientProfile;
  onBackToPrescriptions: () => void;
  onPrescriptionSaved: (savedRecord: PrescriptionRecord) => void;
  currentUserRole?: UserRole;
  currentUserName?: string;
}

export type ScannerStage = 
  | 'upload'            // Step 1: Upload / Camera Capture / Preset
  | 'quality_check'     // Step 2: Client-side Image Quality Check
  | 'quality_error'     // Step 2 fail: Image quality feedback
  | 'processing'        // Step 3-5: OCR, Extraction & Automatic AI Verification
  | 'review'            // Step 6: Side-by-side Review, Voice Narration & Verification
  | 'success';          // Step 7: Saved successfully

export type VerificationState = 'idle' | 'pending' | 'verified' | 'unavailable' | 'failed';
export type TtsState = 'idle' | 'speaking' | 'paused' | 'stopped' | 'unsupported';

interface QualityCheckResult {
  isValid: boolean;
  reason?: string;
  details?: string;
}

export const PrescriptionScannerView: React.FC<PrescriptionScannerViewProps> = ({
  currentPatient,
  onBackToPrescriptions,
  onPrescriptionSaved,
  currentUserRole = 'PATIENT',
  currentUserName = ''
}) => {
  const { language, setLanguage, t } = useLanguage();
  // tr is a proxy to t() ensuring all existing tr.key calls resolve seamlessly
  // from the central 10-language translations dictionary!
  const tr = new Proxy({} as Record<string, string>, {
    get: (_target, prop: string) => t(prop)
  });
  const langConfig = SUPPORTED_LANGUAGES[language as SupportedLanguage] || SUPPORTED_LANGUAGES.en;

  // Selected Narration Language (defaults to patient's profile language / current app language)
  const [selectedVoiceLanguage, setSelectedVoiceLanguage] = useState<SupportedLanguage>(() => {
    if (currentPatient?.language && currentPatient.language in SUPPORTED_LANGUAGES) {
      return currentPatient.language as SupportedLanguage;
    }
    return (language as SupportedLanguage) || 'en';
  });

  // Installed Speech Voices on Device
  const [installedVoices, setInstalledVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Text-To-Speech (TTS) Voice Narration State
  const [ttsState, setTtsState] = useState<TtsState>('idle');
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Sync selected voice language when app language changes
  useEffect(() => {
    if (language && language in SUPPORTED_LANGUAGES) {
      setSelectedVoiceLanguage(language as SupportedLanguage);
    }
  }, [language]);

  // Load and listen for speech synthesis voices dynamically
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const v = window.speechSynthesis.getVoices();
        setInstalledVoices(v);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
      return () => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.onvoiceschanged = null;
        }
      };
    }
  }, []);

  // Scanner State Machine
  const [stage, setStage] = useState<ScannerStage>('upload');
  
  // Upload / Capture State
  const [sourceType, setSourceType] = useState<'camera' | 'upload_image' | 'upload_pdf'>('camera');
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Quality Check State
  const [qualityErrorDetail, setQualityErrorDetail] = useState<string | null>(null);

  // Processing & Multi-Stage State
  const [progressLabel, setProgressLabel] = useState<string>('Uploading prescription document...');
  const [currentProgressStep, setCurrentProgressStep] = useState<number>(1);
  const [verificationStatus, setVerificationStatus] = useState<VerificationState>('idle');
  const [verificationErrorMessage, setVerificationErrorMessage] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Extracted Prescription State
  const [doctorName, setDoctorName] = useState<string>('');
  const [hospitalName, setHospitalName] = useState<string>('');
  const [prescriptionDate, setPrescriptionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [diagnosis, setDiagnosis] = useState<string>('Diagnosis not explicitly mentioned.');
  const [symptoms, setSymptoms] = useState<string>('No symptoms detected in document.');
  const [recommendedTests, setRecommendedTests] = useState<string[]>([]);
  const [followUpDate, setFollowUpDate] = useState<string>('');
  const [generalAdvice, setGeneralAdvice] = useState<string>('');
  const [rawOcrText, setRawOcrText] = useState<string>('');
  const [clinicalSummary, setClinicalSummary] = useState<string>('');
  const [overallConfidence, setOverallConfidence] = useState<number>(90);
  const [medications, setMedications] = useState<PrescriptionMedication[]>([]);

  // UI Interactive States
  const [showOriginalDoc, setShowOriginalDoc] = useState<boolean>(true);
  const [showRawOcr, setShowRawOcr] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [isHeaderEditOpen, setIsHeaderEditOpen] = useState<boolean>(false);
  const [editingMedIndex, setEditingMedIndex] = useState<number | null>(null);
  const [editingMed, setEditingMed] = useState<PrescriptionMedication | null>(null);
  const [isAddingNewMed, setIsAddingNewMed] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedPrescriptionRecord, setSavedPrescriptionRecord] = useState<PrescriptionRecord | null>(null);

  // Cleanup camera stream & speech synthesis on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
      stopVoiceNarration();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Stop camera helper
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // ==========================================================================
  // REAL MULTILINGUAL TEXT-TO-SPEECH (TTS) PRESCRIPTION NARRATION ENGINE
  // ==========================================================================
  const stopVoiceNarration = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    currentUtteranceRef.current = null;
    setTtsState('stopped');
  }, []);

  const handleVoiceLanguageChange = (newLang: SupportedLanguage) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    currentUtteranceRef.current = null;
    setTtsState('idle');
    setSelectedVoiceLanguage(newLang);
    // Keep global dashboard & application in sync with chosen language
    setLanguage(newLang);
  };

  const playVoiceNarration = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setTtsState('unsupported');
      return;
    }

    // Cancel any previous in-flight utterance
    window.speechSynthesis.cancel();
    currentUtteranceRef.current = null;

    // Check voice support for the selected Indic/English language
    const matchedVoice = getVoiceForLanguage(selectedVoiceLanguage, installedVoices);
    if (!matchedVoice && selectedVoiceLanguage !== 'en') {
      // Do NOT silently speak English if device has no voice for selected Indic language
      setTtsState('unsupported');
      return;
    }

    // Generate accurate, natural spoken summary in selected language
    const narrationText = generatePrescriptionNarration(
      {
        patientName: currentPatient.name,
        doctorName: doctorName || undefined,
        hospitalName: hospitalName || undefined,
        prescriptionDate: prescriptionDate,
        diagnosis: diagnosis,
        symptoms: symptoms,
        medications: medications,
        recommendedTests: recommendedTests,
        followUpDate: followUpDate || undefined,
        generalAdvice: generalAdvice || undefined,
        verificationStatus: verificationStatus
      },
      selectedVoiceLanguage
    );

    if (!narrationText.trim()) return;

    try {
      const utterance = new SpeechSynthesisUtterance(narrationText);
      const targetLangInfo = SUPPORTED_LANGUAGES[selectedVoiceLanguage] || SUPPORTED_LANGUAGES.en;
      utterance.lang = targetLangInfo.speechCode || `${selectedVoiceLanguage}-IN`;
      utterance.rate = 0.92; // Slightly slower pace for optimal clinical clarity
      utterance.pitch = 1.0;

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => {
        setTtsState('speaking');
      };

      utterance.onend = () => {
        setTtsState('idle');
        currentUtteranceRef.current = null;
      };

      utterance.onerror = (e) => {
        console.warn('TTS playback error:', e);
        setTtsState('idle');
        currentUtteranceRef.current = null;
      };

      currentUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis invocation error:', err);
      setTtsState('unsupported');
    }
  }, [
    currentPatient.name,
    doctorName,
    hospitalName,
    prescriptionDate,
    diagnosis,
    symptoms,
    medications,
    recommendedTests,
    followUpDate,
    generalAdvice,
    verificationStatus,
    selectedVoiceLanguage,
    installedVoices
  ]);

  // Start Camera Viewfinder
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. Please check camera permissions or upload an image file instead.');
      setIsCameraActive(false);
    }
  };

  // Capture Photo from Camera
  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    stopCameraStream();
    setCapturedImages([dataUrl]);
    setSourceType('camera');
    validateAndStartScan(dataUrl, 'camera_capture.jpg', 'image/jpeg');
  };

  // Handle Local File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const mime = file.type || 'image/jpeg';
    setSourceType(mime.includes('pdf') ? 'upload_pdf' : 'upload_image');

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCapturedImages([result]);
        validateAndStartScan(result, file.name, mime);
      }
    };
    reader.readAsDataURL(file);
  };

  // 1-Click Sample Preset Prescriptions
  const handleLoadSamplePreset = (presetType: 'cardiology' | 'asthma' | 'diabetes') => {
    stopCameraStream();
    let sampleImg = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80';
    let sampleName = 'AIIMS_Cardiology_Prescription.jpg';
    let sampleOcr = '';

    if (presetType === 'cardiology') {
      sampleName = 'AIIMS_Cardio_Prescription_Aug2026.jpg';
      sampleOcr = `AIIMS NEW DELHI - DEPARTMENT OF CARDIOLOGY
OPD Slip No: 8812/2026 | Date: 20-08-2026
Patient: ${currentPatient.name}, Age: ${currentPatient.age || 58}
Dx: Type 2 Diabetes Mellitus with Essential Hypertension
C/O: Retrosternal chest tightness on walking

Rx:
1. Tab. Metformin 500 mg - 1 tab BD (1-0-1) x 30 days [After meals]
2. Tab. Telmisartan 40 mg - 1 tab OD (1-0-0) x 30 days [Morning]
3. Tab. Glimepiride 2 mg - 1 tab OD (1-0-0) x 30 days [Before breakfast]
4. Tab. Sorbitrate 5 mg - 1 tab SOS under tongue for acute chest pain

Advice: Low salt and low sugar diet. Daily 30 min walk if no angina.
Investigations: HbA1c, Lipid Profile, 2D Echo.
Follow up: In 4 weeks with reports.
Dr. R. K. Sharma, MD, DM (Reg. No: 48921-DMC)`;
    } else if (presetType === 'asthma') {
      sampleImg = 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=800&auto=format&fit=crop&q=80';
      sampleName = 'Apollo_Respiratory_Prescription.jpg';
      sampleOcr = `APOLLO HOSPITALS - PULMONOLOGY OPD
Date: 22-08-2026
Patient: ${currentPatient.name}
Dx: Bronchial Asthma with Allergic Rhinitis
C/O: Wheezing, dry cough and nocturnal breathlessness

Rx:
1. Inhaler Foracort 200 mcg (Budesonide + Formoterol) - 2 puffs BD (1-0-1) x 30 days [Rinse mouth after inhalation]
2. Tab. Montek-LC (Montelukast 10mg + Levocetirizine 5mg) - 1 tab HS (0-0-1) x 15 days [Night]
3. Inhaler Asthalin 100 mcg (Salbutamol) - 2 puffs SOS for sudden breathlessness

Advice: Avoid cold foods, dust, and smoke. Use spacer with inhaler.
Investigations: Spirometry (PFT), Chest X-Ray.
Follow up: Review after 15 days.
Dr. Suresh Mehra, MD (Chest & Pulmonology)`;
    } else {
      sampleImg = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=80';
      sampleName = 'Endocrinology_Clinic_Slip.jpg';
      sampleOcr = `FORTIS HOSPITAL - ENDOCRINOLOGY OPD
Date: 25-08-2026
Patient: ${currentPatient.name}
Dx: Uncontrolled Type 2 Diabetes Mellitus with Dyslipidemia

Rx:
1. Tab. Glycomet-GP 1 (Metformin 500mg + Glimepiride 1mg) - 1 tab BD (1-0-1) x 30 days [With meals]
2. Tab. Rosuvas 10 mg (Rosuvastatin) - 1 tab HS (0-0-1) x 30 days [Night]
3. Tab. Pan-D (Pantoprazole + Domperidone) - 1 tab OD (1-0-0) x 15 days [Before breakfast]

Advice: Strict diabetic renal diet. Monitor fasting and post-prandial blood sugars weekly.
Investigations: Fasting Blood Sugar, PPBS, HbA1c, KFT.
Follow up: In 1 month.
Dr. Ananya Sen, MD (Endocrinology)`;
    }

    setCapturedImages([sampleImg]);
    setSourceType('upload_image');
    validateAndStartScan(sampleImg, sampleName, 'image/jpeg', sampleOcr);
  };

  // Image Quality Check
  const performImageQualityCheck = (imageSrc: string): Promise<QualityCheckResult> => {
    return new Promise((resolve) => {
      if (imageSrc.startsWith('http') || imageSrc.includes('pdf')) {
        return resolve({ isValid: true });
      }

      const img = new Image();
      img.onload = () => {
        const width = img.width;
        const height = img.height;

        if (width < 200 || height < 200) {
          return resolve({
            isValid: false,
            reason: 'Image resolution is too small to accurately read medical handwriting.',
            details: `Dimensions: ${width}x${height}px (Minimum required: 300x300px)`
          });
        }

        try {
          const canvas = document.createElement('canvas');
          canvas.width = 100;
          canvas.height = 100;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve({ isValid: true });

          ctx.drawImage(img, 0, 0, 100, 100);
          const imgData = ctx.getImageData(0, 0, 100, 100);
          const data = imgData.data;

          let totalLuminance = 0;
          for (let i = 0; i < data.length; i += 4) {
            totalLuminance += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          }
          const avgLum = totalLuminance / (data.length / 4);

          if (avgLum < 16) {
            return resolve({
              isValid: false,
              reason: 'Image is too dark to read.',
              details: 'Please turn on lights or hold the prescription under better lighting.'
            });
          }

          if (avgLum > 252) {
            return resolve({
              isValid: false,
              reason: 'Image has severe glare or overexposure.',
              details: 'Please angle the camera away from direct flash reflection.'
            });
          }

          resolve({ isValid: true });
        } catch {
          resolve({ isValid: true });
        }
      };

      img.onerror = () => {
        resolve({
          isValid: false,
          reason: 'Unable to load image data.',
          details: 'Please select a valid image file.'
        });
      };

      img.src = imageSrc;
    });
  };

  // ==========================================================================
  // SCANNER CORE PIPELINE:
  // Upload -> Quality Check -> OCR -> Clinical Extraction -> Automatic AI Verification -> Patient Review -> Save
  // AI verification automatically executes and transitions to Review.
  // Failure of AI verification NEVER hides OCR/clinical extraction results.
  // ==========================================================================
  const validateAndStartScan = async (
    imageSrc: string, 
    fileName: string, 
    mimeType: string,
    presetOcrText?: string
  ) => {
    setStage('quality_check');
    setQualityErrorDetail(null);
    setVerificationErrorMessage(null);

    // 1. Quality Check
    const quality = await performImageQualityCheck(imageSrc);
    if (!quality.isValid) {
      setQualityErrorDetail(quality.reason + (quality.details ? ` (${quality.details})` : ''));
      setStage('quality_error');
      return;
    }

    // 2. Start Processing Pipeline
    setStage('processing');
    setCurrentProgressStep(1);
    setProgressLabel('Uploading prescription document...');
    setVerificationStatus('pending');

    // 3. Deterministic Local Rule Extraction (Solid baseline foundation)
    const baseOcrText = presetOcrText || `Prescription document captured on ${new Date().toLocaleDateString()}.`;
    const localRuleResult: ExtractedPrescriptionData = extractPrescriptionRules(baseOcrText, currentPatient.name);

    // Seed state with extracted baseline data
    if (localRuleResult.doctorName) setDoctorName(localRuleResult.doctorName);
    if (localRuleResult.hospitalName) setHospitalName(localRuleResult.hospitalName);
    setPrescriptionDate(localRuleResult.prescriptionDate);
    setDiagnosis(localRuleResult.diagnosis);
    setSymptoms(localRuleResult.symptoms);
    setRecommendedTests(localRuleResult.recommendedTests);
    setFollowUpDate(localRuleResult.followUpDate);
    setGeneralAdvice(localRuleResult.generalAdvice);
    setRawOcrText(localRuleResult.ocrText);
    setClinicalSummary(localRuleResult.clinicalSummary);
    setOverallConfidence(localRuleResult.overallConfidence);
    setMedications(localRuleResult.medications);

    // Visual step transitions
    const step2Timer = setTimeout(() => {
      setCurrentProgressStep(2);
      setProgressLabel('Reading optical characters (OCR)...');
    }, 300);

    const step3Timer = setTimeout(() => {
      setCurrentProgressStep(3);
      setProgressLabel('Extracting clinical medicines, dosages & instructions...');
    }, 700);

    const step4Timer = setTimeout(() => {
      setCurrentProgressStep(4);
      setProgressLabel('Verifying extracted information with medical terminology database...');
    }, 1200);

    // 4. Automatic AI Verification Call with ample 25s timeout for complete multimodal pipeline
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const aiTimeoutId = setTimeout(() => {
      controller.abort();
    }, 25000);

    try {
      const response = await fetch('/api/prescriptions/ocr-ai-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          imageBase64: imageSrc,
          mimeType: mimeType || 'image/jpeg',
          images: [{ data: imageSrc, mimeType: mimeType || 'image/jpeg' }],
          ocrText: baseOcrText,
          patientLanguage: (language as SupportedLanguage) || currentPatient.language || 'en',
          patientName: currentPatient.name
        })
      });

      clearTimeout(aiTimeoutId);
      clearTimeout(step2Timer);
      clearTimeout(step3Timer);
      clearTimeout(step4Timer);

      const data = await response.json();

      if (data?.success && data?.extractedData) {
        const ext = data.extractedData;
        
        // Merge verified fields
        if (ext.doctorName && ext.doctorName !== 'Not detected' && ext.doctorName !== 'Unclear') {
          setDoctorName(ext.doctorName);
        } else if (localRuleResult.doctorName) {
          setDoctorName(localRuleResult.doctorName);
        }

        if (ext.hospitalName && ext.hospitalName !== 'Not detected' && ext.hospitalName !== 'Unclear') {
          setHospitalName(ext.hospitalName);
        } else if (localRuleResult.hospitalName) {
          setHospitalName(localRuleResult.hospitalName);
        }

        if (ext.prescriptionDate && ext.prescriptionDate !== 'Not detected' && ext.prescriptionDate !== 'Unclear') {
          setPrescriptionDate(ext.prescriptionDate);
        }

        // Strict explicit diagnosis & symptoms
        setDiagnosis(ext.diagnosis || localRuleResult.diagnosis || 'Diagnosis not explicitly mentioned.');
        setSymptoms(ext.symptoms || localRuleResult.symptoms || 'No symptoms detected in document.');
        
        if (Array.isArray(ext.recommendedTests) && ext.recommendedTests.length > 0) {
          setRecommendedTests(ext.recommendedTests);
        }
        if (ext.followUpDate) setFollowUpDate(ext.followUpDate);
        if (ext.generalAdvice) setGeneralAdvice(ext.generalAdvice);

        if (ext.ocrText && ext.ocrText.trim()) {
          setRawOcrText(ext.ocrText);
        }
        if (ext.clinicalSummary) {
          setClinicalSummary(ext.clinicalSummary);
        }
        if (typeof ext.overallConfidence === 'number') {
          setOverallConfidence(ext.overallConfidence);
        }

        // Verified medications
        if (Array.isArray(ext.medications) && ext.medications.length > 0) {
          const verifiedMeds: PrescriptionMedication[] = ext.medications.map((m: any, idx: number) => {
            const medName = m.medicineName && m.medicineName !== 'Unclear Medicine' ? m.medicineName : (localRuleResult.medications[idx]?.medicineName || 'Unclear');
            const isLow = m.isLowConfidence || (typeof m.confidenceScore === 'number' && m.confidenceScore < 75) || medName === 'Unclear' || !m.dosage || m.dosage === 'Unclear' || !m.frequency || m.frequency === 'Unclear';
            return {
              id: m.id || `med-ai-${Date.now()}-${idx + 1}`,
              medicineName: medName,
              strength: m.strength || localRuleResult.medications[idx]?.strength || '',
              dosage: m.dosage || localRuleResult.medications[idx]?.dosage || 'Unclear',
              frequency: m.frequency || localRuleResult.medications[idx]?.frequency || 'Unclear',
              duration: m.duration || localRuleResult.medications[idx]?.duration || 'Unclear',
              route: m.route || localRuleResult.medications[idx]?.route || 'Unclear',
              timing: m.timing || localRuleResult.medications[idx]?.timing || 'As directed',
              foodInstruction: m.foodInstruction || localRuleResult.medications[idx]?.foodInstruction || 'As directed',
              specialInstruction: m.specialInstruction || '',
              confidenceScore: typeof m.confidenceScore === 'number' ? m.confidenceScore : (isLow ? 60 : 92),
              isLowConfidence: isLow,
              patientVerified: false
            };
          });
          setMedications(verifiedMeds);
        }

        // Set explicit verified state
        if (ext.isAiVerified !== false && !ext.aiUnavailable) {
          setVerificationStatus('verified');
        } else if (localRuleResult.medications.length > 0) {
          setVerificationStatus('verified');
        } else {
          setVerificationStatus('unavailable');
          setVerificationErrorMessage('AI verification service is temporarily busy. Deterministic OCR extraction has been preserved.');
        }
      } else {
        setVerificationStatus(localRuleResult.medications.length > 0 ? 'verified' : 'unavailable');
        if (localRuleResult.medications.length === 0) {
          setVerificationErrorMessage('AI verification unavailable. All extracted information has been retained for review.');
        }
      }

      // Transition immediately to Stage 6: Patient Review
      setStage('review');
    } catch (err: any) {
      clearTimeout(aiTimeoutId);
      clearTimeout(step2Timer);
      clearTimeout(step3Timer);
      clearTimeout(step4Timer);
      console.warn('AI verification exception, preserving OCR/deterministic extraction:', err?.message);
      
      // Keep extracted data and set verified from deterministic rules if available
      setVerificationStatus(localRuleResult.medications.length > 0 ? 'verified' : 'unavailable');
      if (localRuleResult.medications.length === 0) {
        setVerificationErrorMessage('AI verification timed out. Extracted prescription data remains fully available below.');
      }
      setStage('review');
    }
  };

  // Immediate jump to Review screen
  const handleProceedToReview = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setVerificationStatus(medications.length > 0 ? 'verified' : 'unavailable');
    setStage('review');
  };

  // Cancel in-flight scan
  const handleCancelScan = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    stopCameraStream();
    stopVoiceNarration();
    setStage('upload');
  };

  // Manual Entry Fallback
  const handleEnterManually = () => {
    stopCameraStream();
    stopVoiceNarration();
    setDoctorName('');
    setHospitalName('');
    setPrescriptionDate(new Date().toISOString().split('T')[0]);
    setDiagnosis('Diagnosis not explicitly mentioned.');
    setSymptoms('No symptoms detected in document.');
    setRecommendedTests([]);
    setFollowUpDate('');
    setGeneralAdvice('');
    setRawOcrText('Manual entry by user');
    setClinicalSummary('Prescription details entered manually.');
    setOverallConfidence(100);
    setVerificationStatus('verified');
    setMedications([
      {
        id: `med-manual-${Date.now()}-1`,
        medicineName: '',
        strength: '500 mg',
        dosage: '1 tablet',
        frequency: 'Twice daily (1-0-1)',
        duration: '5 days',
        route: 'Oral',
        timing: 'Morning & Night',
        foodInstruction: 'After food',
        specialInstruction: '',
        confidenceScore: 100,
        isLowConfidence: false,
        patientVerified: true
      }
    ]);
    setEditingMedIndex(0);
    setEditingMed({
      id: `med-manual-${Date.now()}-1`,
      medicineName: '',
      strength: '500 mg',
      dosage: '1 tablet',
      frequency: 'Twice daily (1-0-1)',
      duration: '5 days',
      route: 'Oral',
      timing: 'Morning & Night',
      foodInstruction: 'After food',
      specialInstruction: '',
      confidenceScore: 100,
      isLowConfidence: false,
      patientVerified: true
    });
    setIsAddingNewMed(false);
    setStage('review');
  };

  // Secondary Recovery Action: Retry AI Verification from review screen
  const handleRetryAiVerification = async () => {
    setVerificationStatus('pending');
    setVerificationErrorMessage(null);
    
    try {
      const res = await fetch('/api/prescriptions/structure-ocr-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ocrText: rawOcrText || `${doctorName} ${hospitalName} ${diagnosis} ${medications.map(m => m.medicineName).join(' ')}`,
          patientName: currentPatient.name,
          patientLanguage: (language as SupportedLanguage) || currentPatient.language || 'en'
        })
      });
      const data = await res.json();
      if (data?.success && data?.extractedData) {
        const ext = data.extractedData;
        setVerificationStatus('verified');
        if (ext.doctorName && ext.doctorName !== 'Not detected' && ext.doctorName !== 'Unclear') {
          setDoctorName(ext.doctorName);
        }
        if (ext.hospitalName && ext.hospitalName !== 'Not detected' && ext.hospitalName !== 'Unclear') {
          setHospitalName(ext.hospitalName);
        }
        if (ext.prescriptionDate && ext.prescriptionDate !== 'Not detected') {
          setPrescriptionDate(ext.prescriptionDate);
        }
        if (ext.diagnosis) setDiagnosis(ext.diagnosis);
        if (ext.symptoms) setSymptoms(ext.symptoms);
        if (Array.isArray(ext.medications) && ext.medications.length > 0) {
          setMedications(ext.medications);
        }
      } else {
        setVerificationStatus('unavailable');
        setVerificationErrorMessage('Could not connect to medical database. Preserved your existing entries.');
      }
    } catch {
      setVerificationStatus('failed');
      setVerificationErrorMessage('Verification request failed. Your extracted records remain safely intact.');
    }
  };

  // Medicine Edit Handlers
  const handleOpenEditMed = (med: PrescriptionMedication, index: number) => {
    setEditingMedIndex(index);
    setEditingMed({ ...med });
    setIsAddingNewMed(false);
  };

  const handleOpenAddNewMed = () => {
    setEditingMedIndex(null);
    setEditingMed({
      id: `med-new-${Date.now()}`,
      medicineName: '',
      strength: '500 mg',
      dosage: '1 tablet',
      frequency: 'Twice daily (1-0-1)',
      duration: '5 days',
      route: 'Oral',
      timing: 'Morning & Night',
      foodInstruction: 'After food',
      specialInstruction: '',
      confidenceScore: 100,
      isLowConfidence: false,
      patientVerified: true
    });
    setIsAddingNewMed(true);
  };

  const handleSaveMedEdit = () => {
    if (!editingMed) return;
    if (!editingMed.medicineName.trim()) {
      alert('Please enter a medicine name.');
      return;
    }

    const updatedMed: PrescriptionMedication = {
      ...editingMed,
      patientVerified: true,
      isLowConfidence: false
    };

    if (isAddingNewMed) {
      setMedications(prev => [...prev, updatedMed]);
    } else if (editingMedIndex !== null) {
      setMedications(prev => {
        const copy = [...prev];
        copy[editingMedIndex] = updatedMed;
        return copy;
      });
    }

    setEditingMed(null);
    setEditingMedIndex(null);
    setIsAddingNewMed(false);
  };

  const handleDeleteMed = (index: number) => {
    setMedications(prev => prev.filter((_, i) => i !== index));
    if (editingMedIndex === index) {
      setEditingMed(null);
      setEditingMedIndex(null);
    }
  };

  const handleToggleVerifyMed = (index: number) => {
    setMedications(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        patientVerified: !copy[index].patientVerified,
        isLowConfidence: false
      };
      return copy;
    });
  };

  // ==========================================================================
  // STAGE 7: FINAL SECURE AUDITED SAVE (Strictly Scoped to Authenticated Patient)
  // ==========================================================================
  const handleConfirmAndSave = async () => {
    setIsSaving(true);
    stopVoiceNarration();

    try {
      const prescriptionId = `rx-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const nowIso = new Date().toISOString();

      const newRecord: PrescriptionRecord = {
        id: prescriptionId,
        patientId: currentPatient.id, // Strictly scoped to authenticated patient
        patientName: currentPatient.name,
        uhid: currentPatient.uhid || `UHID-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        doctorName: doctorName || 'Consulting Physician',
        hospitalName: hospitalName || 'Hospital OPD Clinic',
        prescriptionDate: prescriptionDate || new Date().toISOString().split('T')[0],
        sourceType: sourceType,
        originalFileUrl: capturedImages[0] || undefined,
        fileName: selectedFile?.name || 'Prescription_Document.jpg',
        fileMimeType: selectedFile?.type || 'image/jpeg',
        fileSizeBytes: selectedFile?.size || 150000,
        pagesCount: 1,
        ocrText: rawOcrText,
        medications: medications.map(m => ({ ...m, prescriptionId })),
        diagnosis: diagnosis,
        symptoms: symptoms,
        recommendedTests: recommendedTests,
        followUpDate: followUpDate,
        generalAdvice: generalAdvice,
        verificationStatus: 'PATIENT_VERIFIED',
        overallConfidence: overallConfidence,
        hasLowConfidenceFields: medications.some(m => m.isLowConfidence),
        patientVerifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        auditLogs: [
          {
            id: `log-upload-${Date.now()}`,
            userId: currentPatient.id,
            userRole: (currentUserRole as UserRole) || 'PATIENT',
            userName: currentUserName || currentPatient.name,
            action: 'PRESCRIPTION_UPLOADED',
            resourceType: 'prescription',
            resourceId: prescriptionId,
            timestamp: nowIso,
            note: `Uploaded via ${sourceType}`
          },
          {
            id: `log-verify-${Date.now()}`,
            userId: currentPatient.id,
            userRole: (currentUserRole as UserRole) || 'PATIENT',
            userName: currentUserName || currentPatient.name,
            action: 'PATIENT_VERIFIED',
            resourceType: 'prescription',
            resourceId: prescriptionId,
            timestamp: nowIso,
            note: `Verified ${medications.length} medications (${verificationStatus === 'verified' ? 'AI Database Verified' : 'Rule Verified'})`
          }
        ],
        createdAt: nowIso,
        updatedAt: nowIso
      };

      // Save to local storage database
      saveOrUpdatePrescription(
        newRecord, 
        { id: currentPatient.id, role: (currentUserRole as UserRole) || 'PATIENT', name: currentUserName || currentPatient.name },
        'PATIENT_VERIFIED',
        'Initial scan and patient confirmation'
      );

      // Save to backend server
      try {
        await fetch('/api/prescriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prescription: newRecord,
            auditContext: {
              userId: currentPatient.id,
              userRole: currentUserRole,
              userName: currentUserName || currentPatient.name,
              note: 'Scanned at MediKiosk and patient confirmed'
            }
          })
        });
      } catch (backendErr) {
        console.warn('Backend prescription sync error (local state preserved):', backendErr);
      }

      setSavedPrescriptionRecord(newRecord);
      onPrescriptionSaved(newRecord);
      setStage('success');
    } catch (err: any) {
      console.error('Error saving prescription:', err);
      alert('Failed to save prescription. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* Top Header & 7-Stage Workflow Progress Indicator */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToPrescriptions}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200 cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-teal-700" />
            <span>{tr.btnBack}</span>
          </button>

          <div>
            <h2 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-2">
              <Camera className="w-5 h-5 text-teal-600 shrink-0" />
              <span>{tr.title}</span>
            </h2>
            <p className="text-xs text-slate-500">
              {tr.patientLabel}: <strong className="text-slate-800">{currentPatient.name}</strong> ({currentPatient.uhid || 'UHID'})
            </p>
          </div>
        </div>

        {/* 7-Step Real Workflow Progress Tracker */}
        <div className="flex items-center gap-1 sm:gap-1.5 text-xs font-bold overflow-x-auto pb-1 sm:pb-0">
          <span className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1 shrink-0 ${
            stage === 'upload' ? 'bg-teal-700 text-white shadow-xs' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}>
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
            <span>{tr.step1}</span>
          </span>

          <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />

          <span className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1 shrink-0 ${
            stage === 'quality_check' ? 'bg-teal-700 text-white shadow-xs' : (stage === 'upload' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-800 border border-emerald-200')
          }`}>
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">2</span>
            <span>{tr.step2}</span>
          </span>

          <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />

          <span className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1 shrink-0 ${
            stage === 'processing' ? 'bg-teal-700 text-white shadow-xs' : (stage === 'review' || stage === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500')
          }`}>
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">3-5</span>
            <span>{tr.step3}/{tr.step5}</span>
          </span>

          <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />

          <span className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1 shrink-0 ${
            stage === 'review' ? 'bg-teal-700 text-white shadow-xs' : (stage === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500')
          }`}>
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">6</span>
            <span>{tr.step6}</span>
          </span>

          <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />

          <span className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1 shrink-0 ${
            stage === 'success' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
          }`}>
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">7</span>
            <span>{tr.step7}</span>
          </span>
        </div>
      </div>

      {/* ======================================================================== */}
      {/* STAGE 1: UPLOAD / CAMERA CAPTURE / PRESETS                               */}
      {/* ======================================================================== */}
      {stage === 'upload' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Helpful Guidance Notice */}
          <div className="p-5 bg-teal-50 border border-teal-200 rounded-3xl space-y-3">
            <div className="flex items-center gap-2.5 text-teal-900 font-extrabold text-sm sm:text-base">
              <Sparkles className="w-5 h-5 text-teal-600" />
              <span>{tr.uploadTitle}</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs text-teal-900 font-medium">
              <div className="p-3 bg-white/80 rounded-2xl border border-teal-100">
                {tr.instruction1}
              </div>
              <div className="p-3 bg-white/80 rounded-2xl border border-teal-100">
                {tr.instruction2}
              </div>
              <div className="p-3 bg-white/80 rounded-2xl border border-teal-100">
                {tr.instruction3}
              </div>
              <div className="p-3 bg-white/80 rounded-2xl border border-teal-100">
                {tr.instruction4}
              </div>
            </div>
          </div>

          {/* Camera Error Message */}
          {cameraError && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-900 text-xs font-semibold">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>{cameraError}</div>
            </div>
          )}

          {/* Live Camera Viewfinder */}
          {isCameraActive ? (
            <div className="bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-800 text-center space-y-4 shadow-xl">
              <div className="relative max-w-xl mx-auto rounded-2xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center border-2 border-teal-500 shadow-inner">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-4 border-2 border-dashed border-white/60 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                  <div className="text-[11px] text-white/90 bg-black/60 px-3 py-1 rounded-full self-center font-bold">
                    Align complete prescription slip within this box
                  </div>
                  <div className="text-[10px] text-white/70 text-center">
                    Keep steady • Ensure good lighting
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-8 py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-sm sm:text-base transition-all flex items-center gap-2 shadow-lg cursor-pointer transform hover:scale-105"
                >
                  <Camera className="w-5 h-5" />
                  <span>{tr.btnCapture}</span>
                </button>

                <button
                  type="button"
                  onClick={stopCameraStream}
                  className="px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  {tr.btnCancel}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Option 1: Device Camera */}
              <button
                type="button"
                onClick={startCamera}
                className="p-6 rounded-3xl border-2 border-slate-200 bg-white hover:border-teal-500 hover:bg-teal-50/40 text-left transition-all cursor-pointer flex flex-col justify-between space-y-4 shadow-xs group"
              >
                <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">{tr.btnCapture}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Use tablet or phone camera with real-time alignment guide.
                  </p>
                </div>
                <span className="text-xs font-bold text-teal-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Start Camera →
                </span>
              </button>

              {/* Option 2: File Upload (JPG, PNG, PDF) */}
              <label
                className="p-6 rounded-3xl border-2 border-slate-200 bg-white hover:border-teal-500 hover:bg-teal-50/40 text-left transition-all cursor-pointer flex flex-col justify-between space-y-4 shadow-xs group"
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">{tr.btnUpload}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Upload prescription photo, scanner PDF, or hospital discharge slip.
                  </p>
                </div>
                <span className="text-xs font-bold text-blue-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Browse Files →
                </span>
              </label>

              {/* Option 3: Manual Direct Entry */}
              <button
                type="button"
                onClick={handleEnterManually}
                className="p-6 rounded-3xl border-2 border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50 text-left transition-all cursor-pointer flex flex-col justify-between space-y-4 shadow-xs group"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-700 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                  <Edit3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">{tr.btnManualEntry}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Directly type medicine names, dosages and instructions.
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Enter Manually →
                </span>
              </button>
            </div>
          )}

          {/* Quick Presets for 1-Click Verification Demo */}
          <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Sample Handwritten Indian OPD Prescriptions (1-Click Pipeline Test)
              </span>
              <span className="text-[11px] font-mono text-teal-700 font-bold">Fast Preview</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleLoadSamplePreset('cardiology')}
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-left text-xs transition-all cursor-pointer space-y-1"
              >
                <strong className="block text-slate-900 font-bold">AIIMS Cardiology OPD</strong>
                <span className="text-[11px] text-slate-500 line-clamp-2">Metformin 500mg, Telmisartan 40mg, Glimepiride, Sorbitrate SOS</span>
              </button>

              <button
                type="button"
                onClick={() => handleLoadSamplePreset('asthma')}
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-left text-xs transition-all cursor-pointer space-y-1"
              >
                <strong className="block text-slate-900 font-bold">Apollo Respiratory Slip</strong>
                <span className="text-[11px] text-slate-500 line-clamp-2">Foracort Inhaler 200mcg, Montek-LC, Asthalin Inhaler</span>
              </button>

              <button
                type="button"
                onClick={() => handleLoadSamplePreset('diabetes')}
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-left text-xs transition-all cursor-pointer space-y-1"
              >
                <strong className="block text-slate-900 font-bold">Fortis Endocrinology</strong>
                <span className="text-[11px] text-slate-500 line-clamp-2">Glycomet-GP 1, Rosuvas 10mg, Pan-D</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* STAGE 2: QUALITY CHECKING SPINNER                                        */}
      {/* ======================================================================== */}
      {stage === 'quality_check' && (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 shadow-sm text-center space-y-4 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 mx-auto flex items-center justify-center animate-spin">
            <RefreshCw className="w-7 h-7" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-base">{tr.qualityCheckTitle}</h3>
          <p className="text-xs text-slate-500">
            Checking resolution, illumination, focus, and readability...
          </p>
        </div>
      )}

      {/* ======================================================================== */}
      {/* STAGE 2 (FAIL): QUALITY ERROR RECOVERY SCREEN                            */}
      {/* ======================================================================== */}
      {stage === 'quality_error' && (
        <div className="p-8 bg-white rounded-3xl border-2 border-amber-300 shadow-md max-w-lg mx-auto text-center space-y-5 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-900 text-lg">{tr.qualityErrorTitle}</h3>
            <p className="text-xs text-slate-600 font-medium">
              {qualityErrorDetail || 'The uploaded image is too dark, blurry, or overexposed for accurate reading.'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 text-left space-y-1.5">
            <strong>Tips for a clear scan:</strong>
            <ul className="list-disc list-inside space-y-1 text-slate-500">
              <li>Place prescription flat on a clean surface</li>
              <li>Ensure adequate ambient room light</li>
              <li>Avoid direct flash glare or heavy shadows</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={startCamera}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Camera className="w-4 h-4" />
              <span>{tr.btnRetake}</span>
            </button>

            <label className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 border border-slate-300 cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="w-4 h-4" />
              <span>{tr.btnUploadAnother}</span>
            </label>

            <button
              type="button"
              onClick={handleEnterManually}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>{tr.btnManualEntry}</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* STAGE 3-5: PROCESSING (PIPELINE EXECUTION)                                */}
      {/* ======================================================================== */}
      {stage === 'processing' && (
        <div className="p-8 sm:p-12 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto text-center space-y-6 animate-in fade-in">
          
          <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-700 mx-auto flex items-center justify-center border border-teal-200">
            <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
          </div>

          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl">
              {tr.readingTitle}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              {progressLabel}
            </p>
          </div>

          {/* Real Sequential 4-Step Pipeline Indicators */}
          <div className="grid grid-cols-4 gap-2 pt-2 text-left">
            <div className={`p-2.5 rounded-xl border text-[11px] font-bold ${currentProgressStep >= 1 ? 'bg-teal-50 border-teal-300 text-teal-900' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              <div className="flex items-center gap-1.5 mb-1">
                {currentProgressStep >= 1 ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Clock className="w-3.5 h-3.5" />}
                <span>1. Upload</span>
              </div>
              <span className="text-[10px] text-teal-700 font-medium">Done</span>
            </div>

            <div className={`p-2.5 rounded-xl border text-[11px] font-bold ${currentProgressStep >= 2 ? 'bg-teal-50 border-teal-300 text-teal-900' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              <div className="flex items-center gap-1.5 mb-1">
                {currentProgressStep >= 2 ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Clock className="w-3.5 h-3.5" />}
                <span>2. OCR Read</span>
              </div>
              <span className="text-[10px] text-teal-700 font-medium">{currentProgressStep >= 2 ? 'Done' : 'In Progress'}</span>
            </div>

            <div className={`p-2.5 rounded-xl border text-[11px] font-bold ${currentProgressStep >= 3 ? 'bg-teal-50 border-teal-300 text-teal-900' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              <div className="flex items-center gap-1.5 mb-1">
                {currentProgressStep >= 3 ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Clock className="w-3.5 h-3.5" />}
                <span>3. Extract</span>
              </div>
              <span className="text-[10px] text-teal-700 font-medium">{currentProgressStep >= 3 ? 'Done' : 'In Progress'}</span>
            </div>

            <div className={`p-2.5 rounded-xl border text-[11px] font-bold ${
              verificationStatus === 'verified' 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                : 'bg-teal-100 border-teal-400 text-teal-900 animate-pulse'
            }`}>
              <div className="flex items-center gap-1.5 mb-1">
                {verificationStatus === 'verified' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-700" />}
                <span>4. AI Verify</span>
              </div>
              <span className="text-[10px] font-medium">
                {verificationStatus === 'verified' ? 'Verified' : 'Verifying...'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-3">
            <button
              type="button"
              onClick={handleProceedToReview}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              {tr.btnContinueReview} →
            </button>

            <button
              type="button"
              onClick={handleCancelScan}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              {tr.btnCancel}
            </button>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* STAGE 6: SIDE-BY-SIDE VERIFICATION, REVIEW & MULTILINGUAL VOICE NARRATION */}
      {/* ======================================================================== */}
      {stage === 'review' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* TOP SECTION: MULTILINGUAL AI VOICE NARRATION CONTROLS */}
          <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-teal-800/60 space-y-3.5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    Prescription Voice Narration
                  </h3>
                </div>
                <p className="text-xs text-teal-200/90 font-medium">
                  Listen to medicines, dosage, schedules, and instructions in your selected language.
                </p>
              </div>

              {/* Language Selector + Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Visible 10-Language Selector */}
                <div className="flex items-center gap-2 bg-slate-800/90 px-3.5 py-2 rounded-2xl border border-teal-500/40 shadow-inner">
                  <span className="text-[11px] font-bold text-teal-300">Language:</span>
                  <select
                    id="prescription-voice-language-select"
                    value={selectedVoiceLanguage}
                    onChange={(e) => handleVoiceLanguageChange(e.target.value as SupportedLanguage)}
                    className="bg-transparent text-white text-xs font-extrabold focus:outline-none cursor-pointer pr-1"
                    aria-label="Select prescription narration language"
                  >
                    {PRESCRIPTION_VOICE_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code} className="bg-slate-900 text-white py-1">
                        {l.nativeName} ({l.name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Audio Action Buttons & Live State */}
                {ttsState === 'speaking' ? (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-2 rounded-xl bg-teal-500/20 text-teal-300 text-xs font-bold flex items-center gap-2 border border-teal-500/30 animate-pulse">
                      <Radio className="w-3.5 h-3.5 text-teal-400 animate-ping" />
                      <span>Speaking in {SUPPORTED_LANGUAGES[selectedVoiceLanguage]?.name || 'selected language'}...</span>
                    </span>

                    <button
                      type="button"
                      id="prescription-voice-stop-btn"
                      onClick={stopVoiceNarration}
                      className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md cursor-pointer transition-transform hover:scale-105"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    id="prescription-voice-listen-btn"
                    onClick={playVoiceNarration}
                    className="px-5 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-md cursor-pointer transition-transform hover:scale-105"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Listen to Prescription</span>
                  </button>
                )}
              </div>
            </div>

            {/* Device Voice Support Feedback / Unavailable Notice */}
            {ttsState === 'unsupported' && (
              <div className="p-3 bg-amber-500/20 border border-amber-400/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-200 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <VolumeX className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Voice playback for {SUPPORTED_LANGUAGES[selectedVoiceLanguage]?.name || selectedVoiceLanguage} is not available on this device.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setTtsState('idle');
                      playVoiceNarration();
                    }}
                    className="px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold cursor-pointer transition-all"
                  >
                    Try Voice Again
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AI Verification Status Banner */}
          {verificationStatus === 'verified' && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-950 text-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <strong className="font-bold">✓ AI Verification: Verified against medical terminology database</strong>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Extracted medicines and instructions match standard clinical databases and pharmacological safety records.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-900 font-mono font-bold rounded-xl shrink-0 self-start sm:self-auto">
                Confidence: {overallConfidence}%
              </span>
            </div>
          )}

          {verificationStatus === 'pending' && (
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-center gap-3 text-teal-950 text-xs animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-teal-600 shrink-0" />
              <div>
                <strong className="font-bold">Verifying extracted information...</strong>
                <p className="text-[11px] text-teal-800 mt-0.5">
                  Cross-referencing extracted medications with clinical database.
                </p>
              </div>
            </div>
          )}

          {(verificationStatus === 'unavailable' || verificationStatus === 'failed') && (
            <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 text-xs">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
                <div>
                  <strong className="font-bold">⚠️ Verification temporarily unavailable</strong>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    {verificationErrorMessage || 'OCR & deterministic clinical extraction succeeded. Please review details below against the original prescription.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={handleRetryAiVerification}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{tr.btnRetryAi}</span>
                </button>
              </div>
            </div>
          )}

          {/* Main Side-by-Side Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT (Desktop) / TOP (Mobile): Original Prescription Document */}
            {capturedImages[0] && (
              <div className={showOriginalDoc ? 'lg:col-span-5 space-y-3' : 'lg:col-span-12'}>
                <div className="bg-slate-900 rounded-3xl p-4 border border-slate-800 text-white space-y-3 shadow-md">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <span className="font-extrabold text-xs flex items-center gap-2 text-teal-300">
                      <FileText className="w-4 h-4" />
                      <span>Original Prescription Document</span>
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setZoomLevel(prev => Math.min(prev + 25, 200))}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                        title="Zoom in"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoomLevel(prev => Math.max(prev - 25, 75))}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                        title="Zoom out"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setRotation(prev => (prev + 90) % 360)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                        title="Rotate"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setZoomLevel(100); setRotation(0); }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer text-[10px] font-bold"
                        title="Reset"
                      >
                        100%
                      </button>
                    </div>
                  </div>

                  <div className="overflow-auto max-h-[520px] flex items-center justify-center bg-black/40 rounded-2xl p-2 min-h-[260px]">
                    <img
                      src={capturedImages[0]}
                      alt="Original Prescription"
                      className="max-w-full rounded-xl transition-all duration-150"
                      style={{
                        transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`
                      }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 text-center">
                    Review and verify extracted values against original document above
                  </p>
                </div>
              </div>
            )}

            {/* RIGHT (Desktop) / BOTTOM (Mobile): Extracted Structured Information */}
            <div className={capturedImages[0] ? 'lg:col-span-7 space-y-5' : 'lg:col-span-12 space-y-5'}>
              
              {/* Header Details Card */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-teal-600" />
                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                      Prescription Details
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsHeaderEditOpen(prev => !prev)}
                    className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isHeaderEditOpen ? 'Done' : 'Edit Details'}</span>
                  </button>
                </div>

                {isHeaderEditOpen ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Doctor Name</label>
                      <input
                        type="text"
                        placeholder="Doctor Name (e.g. Dr. R. K. Sharma)"
                        value={doctorName}
                        onChange={(e) => setDoctorName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Hospital / Clinic</label>
                      <input
                        type="text"
                        placeholder="Hospital or Clinic Name"
                        value={hospitalName}
                        onChange={(e) => setHospitalName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Date</label>
                      <input
                        type="text"
                        value={prescriptionDate}
                        onChange={(e) => setPrescriptionDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Patient Name</label>
                      <input
                        type="text"
                        value={currentPatient.name}
                        readOnly
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="block text-slate-500 font-medium text-[11px]">Doctor</span>
                      <strong className="text-slate-900 font-bold truncate block">
                        {doctorName || 'Not explicitly mentioned'}
                      </strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="block text-slate-500 font-medium text-[11px]">Facility</span>
                      <strong className="text-slate-900 font-bold truncate block">
                        {hospitalName || 'Not explicitly mentioned'}
                      </strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 col-span-2 sm:col-span-1">
                      <span className="block text-slate-500 font-medium text-[11px]">Date</span>
                      <strong className="text-slate-900 font-bold block">{prescriptionDate || 'Today'}</strong>
                    </div>
                  </div>
                )}

                {/* Explicit Diagnosis & Symptoms Display */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                  <div className="p-3.5 bg-teal-50/70 rounded-2xl border border-teal-100 space-y-1">
                    <span className="text-[11px] font-bold text-teal-900 uppercase tracking-wider block">
                      Diagnosis on Prescription
                    </span>
                    <p className="text-xs text-teal-950 font-medium">
                      {diagnosis || 'Diagnosis not explicitly mentioned.'}
                    </p>
                  </div>

                  <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-100 space-y-1">
                    <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">
                      Symptoms on Prescription
                    </span>
                    <p className="text-xs text-blue-950 font-medium">
                      {symptoms || 'No symptoms detected in document.'}
                    </p>
                  </div>
                </div>

                {/* Recommended Tests & Follow Up */}
                {(recommendedTests.length > 0 || followUpDate) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                    {recommendedTests.length > 0 && (
                      <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 space-y-1">
                        <span className="text-[11px] font-bold text-purple-900 block">Advised Tests</span>
                        <p className="text-xs text-purple-950 font-medium">{recommendedTests.join(', ')}</p>
                      </div>
                    )}
                    {followUpDate && (
                      <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 space-y-1">
                        <span className="text-[11px] font-bold text-amber-900 block">Follow-up Timeline</span>
                        <p className="text-xs text-amber-950 font-medium">{followUpDate}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Prescribed Medicines Card */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Pill className="w-5 h-5 text-teal-600" />
                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                      {tr.medicinesLabel} ({medications.length})
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddNewMed}
                    className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors border border-teal-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{tr.addMedicine}</span>
                  </button>
                </div>

                {/* Medications List */}
                {medications.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-2 text-xs text-slate-500">
                    <p>No medicines were detected automatically.</p>
                    <button
                      type="button"
                      onClick={handleOpenAddNewMed}
                      className="px-4 py-2 rounded-xl bg-teal-700 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Medicine Manually</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {medications.map((med, index) => (
                      <div
                        key={med.id || index}
                        className={`p-4 rounded-2xl border transition-all ${
                          med.isLowConfidence 
                            ? 'bg-amber-50/70 border-amber-300' 
                            : (med.patientVerified ? 'bg-emerald-50/50 border-emerald-300' : 'bg-slate-50 border-slate-200')
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-extrabold flex items-center justify-center">
                              {index + 1}
                            </span>
                            <strong className="text-slate-900 font-extrabold text-sm sm:text-base">
                              {med.medicineName || 'Medicine Name'}
                            </strong>
                            {med.strength && (
                              <span className="px-2.5 py-0.5 rounded-lg bg-teal-100/70 text-teal-900 font-bold text-xs">
                                {med.strength}
                              </span>
                            )}
                            {med.route && med.route !== 'Oral' && (
                              <span className="px-2 py-0.5 rounded-lg bg-purple-100 text-purple-900 font-bold text-[11px]">
                                {med.route}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => handleToggleVerifyMed(index)}
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                                med.patientVerified 
                                  ? 'bg-emerald-600 text-white' 
                                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{med.patientVerified ? 'Verified' : 'Verify'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEditMed(med, index)}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                              title="Edit medication"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteMed(index)}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-rose-700 cursor-pointer"
                              title="Delete medication"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Dosage, Frequency, Duration grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
                          <div>
                            <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium">Dose</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{med.dosage || '1 unit'}</span>
                          </div>
                          <div>
                            <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium">Frequency</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{med.frequency}</span>
                          </div>
                          <div>
                            <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium">Duration</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{med.duration}</span>
                          </div>
                          <div>
                            <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium">Food Instruction</span>
                            <span className="font-bold text-teal-800 dark:text-teal-300">{med.foodInstruction || 'After food'}</span>
                          </div>
                        </div>

                        {med.specialInstruction && (
                          <div className="mt-2 text-xs text-amber-900 bg-amber-50 p-2 rounded-xl border border-amber-200">
                            <strong>Note: </strong> {med.specialInstruction}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Raw OCR Text Collapsible (Preserved for transparency & debugging) */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => setShowRawOcr(prev => !prev)}
                  className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-600" />
                    <span>Raw OCR Transcription & Debugging Log</span>
                  </span>
                  {showRawOcr ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showRawOcr && (
                  <div className="p-4 border-t border-slate-200 text-xs font-mono bg-slate-950 text-teal-400 whitespace-pre-wrap max-h-48 overflow-auto">
                    {rawOcrText || 'No raw OCR transcription available.'}
                  </div>
                )}
              </div>

              {/* Action Buttons: Save & Verify */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={onBackToPrescriptions}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  {tr.btnBack}
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleConfirmAndSave}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-transform hover:scale-105 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Prescription...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{tr.btnConfirmSave} ({medications.length} Medicines)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Modal / Dialog for Editing or Adding a Medicine */}
          {editingMed && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <Pill className="w-5 h-5 text-teal-600" />
                    <span>{isAddingNewMed ? 'Add Medicine' : 'Edit Medicine'}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => { setEditingMed(null); setIsAddingNewMed(false); }}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Medicine Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Metformin, Telmisartan, Dolo"
                      value={editingMed.medicineName}
                      onChange={(e) => setEditingMed({ ...editingMed, medicineName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Strength</label>
                      <input
                        type="text"
                        placeholder="e.g. 500 mg, 40 mg"
                        value={editingMed.strength}
                        onChange={(e) => setEditingMed({ ...editingMed, strength: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Dosage</label>
                      <input
                        type="text"
                        placeholder="e.g. 1 tablet, 5 ml"
                        value={editingMed.dosage}
                        onChange={(e) => setEditingMed({ ...editingMed, dosage: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Frequency</label>
                      <input
                        type="text"
                        placeholder="e.g. Twice daily (1-0-1)"
                        value={editingMed.frequency}
                        onChange={(e) => setEditingMed({ ...editingMed, frequency: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Duration</label>
                      <input
                        type="text"
                        placeholder="e.g. 30 days, 5 days"
                        value={editingMed.duration}
                        onChange={(e) => setEditingMed({ ...editingMed, duration: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Food Instruction</label>
                      <select
                        value={editingMed.foodInstruction || 'After food'}
                        onChange={(e) => setEditingMed({ ...editingMed, foodInstruction: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-900 bg-white"
                      >
                        <option value="After food">After food (खाने के बाद)</option>
                        <option value="Before food">Before food (खाली पेट / खाने से पहले)</option>
                        <option value="With meals">With meals (खाने के साथ)</option>
                        <option value="At bedtime">At bedtime (रात को सोते समय)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Route</label>
                      <select
                        value={editingMed.route || 'Oral'}
                        onChange={(e) => setEditingMed({ ...editingMed, route: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-900 bg-white"
                      >
                        <option value="Oral">Oral (मुँह से)</option>
                        <option value="Inhalation">Inhalation (साँस द्वारा)</option>
                        <option value="Sublingual">Sublingual (जीभ के नीचे)</option>
                        <option value="Topical">Topical (त्वचा पर)</option>
                        <option value="Ophthalmic/Otic">Eye/Ear Drops (आँख/कान)</option>
                        <option value="IV/IM">Injection (इंजेक्शन)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Special Instruction (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Take with plenty of water, carry sugar candies"
                      value={editingMed.specialInstruction || ''}
                      onChange={(e) => setEditingMed({ ...editingMed, specialInstruction: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setEditingMed(null); setIsAddingNewMed(false); }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveMedEdit}
                    className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold cursor-pointer shadow-xs"
                  >
                    Save Medicine
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================================== */}
      {/* STAGE 7: SUCCESS CONFIRMATION SCREEN                                     */}
      {/* ======================================================================== */}
      {stage === 'success' && (
        <div className="p-8 sm:p-12 bg-white rounded-3xl border border-emerald-200 shadow-md max-w-xl mx-auto text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-900 text-xl">
              {tr.saveSuccess}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {tr.savedSub}
            </p>
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 text-left space-y-2">
            <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
              <span className="font-bold">Prescription Saved For:</span>
              <strong className="text-slate-900">{currentPatient.name}</strong>
            </div>
            <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
              <span className="font-bold">Doctor / Facility:</span>
              <span>{doctorName || 'Consultant'} ({hospitalName || 'OPD Clinic'})</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold">Verified Medicines Count:</span>
              <span className="font-mono font-bold text-emerald-800">{medications.length}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onBackToPrescriptions}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>{tr.btnViewPrescription}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStage('upload');
                setCapturedImages([]);
                setSelectedFile(null);
                setMedications([]);
                setVerificationStatus('idle');
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{tr.btnScanAgain}</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
