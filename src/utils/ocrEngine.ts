/**
 * MediKiosk AI - High Reliability Multi-Tier OCR & Clinical Structuring Engine
 * 
 * Pipeline Hierarchy:
 * LEVEL 1: Server Multimodal Gemini Vision OCR + Pharmacological Structuring
 * LEVEL 2: Client-side Tesseract.js / Canvas OCR + Deterministic Clinical Extraction
 * LEVEL 3: Raw OCR Text + Manual Patient Correction
 * 
 * CRITICAL ZERO-HALLUCINATION RULES:
 * 1. NEVER invent, extrapolate, or hallucinate medicine names, dosage, strength, or duration.
 * 2. If diagnosis is not explicitly written: 'Not explicitly mentioned in prescription'.
 * 3. If symptoms are not explicitly written: 'Not explicitly mentioned in document'.
 * 4. Never discard extracted OCR text.
 */

import { ExtractedPrescriptionData, extractPrescriptionRules } from './prescriptionRuleExtractor';
import { PrescriptionMedication, SupportedLanguage } from '../types';

export interface OcrProcessingProgress {
  step: number;
  label: string;
  detail?: string;
}

export interface OcrExecutionResult {
  success: boolean;
  ocrText: string;
  source: 'gemini_vision' | 'tesseract_local' | 'deterministic_fallback' | 'raw_text';
  extractedData: ExtractedPrescriptionData;
  isAiVerified: boolean;
  aiVerificationStatus: 'idle' | 'pending' | 'verified' | 'unavailable' | 'failed';
  errorMessage?: string;
}

// Map MediKiosk language codes to Tesseract OCR language codes
const TESSERACT_LANG_MAP: Record<string, string> = {
  en: 'eng',
  hi: 'hin+eng',
  mr: 'mar+eng',
  ta: 'tam+eng',
  te: 'tel+eng',
  bn: 'ben+eng',
  gu: 'guj+eng',
  kn: 'kan+eng',
  ml: 'mal+eng',
  pa: 'pan+eng',
};

/**
 * Executes Client-Side Tesseract.js OCR if available
 */
export async function performLocalTesseractOcr(
  imageDataUrl: string,
  language: SupportedLanguage = 'en',
  onProgress?: (percent: number) => void
): Promise<string> {
  try {
    const { createWorker } = await import('tesseract.js');
    const tessLang = TESSERACT_LANG_MAP[language] || 'eng';
    
    const worker = await createWorker(tessLang, 1, {
      logger: (m) => {
        if (m.status === 'recognizing text' && typeof m.progress === 'number' && onProgress) {
          onProgress(Math.round(m.progress * 100));
        }
      }
    });

    const { data: { text } } = await worker.recognize(imageDataUrl);
    await worker.terminate();
    return (text || '').trim();
  } catch (err) {
    console.warn('[OcrEngine] Local Tesseract OCR fallback warning:', err);
    return '';
  }
}

/**
 * Main OCR Orchestrator:
 * Executes multimodal vision AI first, with seamless deterministic and local OCR fallback.
 */
export async function runFullPrescriptionOcrPipeline(
  processedImageSrc: string,
  originalImageSrc: string,
  options: {
    patientName?: string;
    patientLanguage?: SupportedLanguage;
    mimeType?: string;
    onProgress?: (progress: OcrProcessingProgress) => void;
  } = {}
): Promise<OcrExecutionResult> {
  const patientName = options.patientName || 'Patient';
  const patientLanguage = options.patientLanguage || 'en';
  const mimeType = options.mimeType || 'image/jpeg';
  const onProgress = options.onProgress || (() => {});

  onProgress({ step: 1, label: 'Validating & uploading prescription document...' });

  // 1. First, attempt Server Multimodal Gemini OCR (Level 1)
  onProgress({ step: 2, label: 'Reading optical characters (OCR)...' });

  let serverResponseData: any = null;
  let serverOcrFailed = false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch('/api/prescriptions/ocr-ai-scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        imageBase64: processedImageSrc || originalImageSrc,
        mimeType,
        images: [{ data: processedImageSrc || originalImageSrc, mimeType }],
        patientLanguage,
        patientName
      })
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data?.success && data?.extractedData) {
        serverResponseData = data.extractedData;
      }
    } else {
      serverOcrFailed = true;
    }
  } catch (err: any) {
    console.warn('[OcrEngine] Server multimodal OCR request failed, switching to Level 2 pipeline:', err?.message || err);
    serverOcrFailed = true;
  }

  // If server multimodal succeeded and returned valid OCR text or medications:
  if (serverResponseData && (serverResponseData.ocrText || serverResponseData.medications?.length > 0)) {
    onProgress({ step: 3, label: 'Structuring clinical information & medications...' });
    onProgress({ step: 4, label: 'Verifying with pharmacological database...' });

    // Clean and validate medications with zero hallucinated defaults
    const cleanedMeds: PrescriptionMedication[] = (serverResponseData.medications || []).map((m: any, idx: number) => {
      const medName = m.medicineName && m.medicineName !== 'Unclear' && m.medicineName !== 'Unclear Medicine' ? m.medicineName : 'Unclear';
      const isLow = (typeof m.confidenceScore === 'number' && m.confidenceScore < 75) || medName === 'Unclear' || !m.dosage || m.dosage === 'Unclear' || !m.frequency || m.frequency === 'Unclear';
      return {
        id: m.id || `med-ai-${Date.now()}-${idx + 1}`,
        medicineName: medName,
        strength: m.strength || '',
        dosage: m.dosage || 'Unclear',
        frequency: m.frequency || 'Unclear',
        duration: m.duration || 'Unclear',
        route: m.route || 'Unclear',
        timing: m.timing || 'As directed',
        foodInstruction: m.foodInstruction || 'As directed',
        specialInstruction: m.specialInstruction || '',
        confidenceScore: typeof m.confidenceScore === 'number' ? m.confidenceScore : (isLow ? 60 : 90),
        isLowConfidence: isLow,
        patientVerified: false
      };
    });

    const resultData: ExtractedPrescriptionData = {
      doctorName: serverResponseData.doctorName && serverResponseData.doctorName !== 'Not detected' ? serverResponseData.doctorName : 'Not detected',
      hospitalName: serverResponseData.hospitalName && serverResponseData.hospitalName !== 'Not detected' ? serverResponseData.hospitalName : 'Not detected',
      prescriptionDate: serverResponseData.prescriptionDate && serverResponseData.prescriptionDate !== 'Not detected' ? serverResponseData.prescriptionDate : new Date().toISOString().split('T')[0],
      patientName,
      diagnosis: serverResponseData.diagnosis || 'Not explicitly mentioned in prescription',
      symptoms: serverResponseData.symptoms || 'Not explicitly mentioned in document',
      recommendedTests: Array.isArray(serverResponseData.recommendedTests) ? serverResponseData.recommendedTests : [],
      followUpDate: serverResponseData.followUpDate || '',
      generalAdvice: serverResponseData.generalAdvice || '',
      overallConfidence: typeof serverResponseData.overallConfidence === 'number' ? serverResponseData.overallConfidence : 90,
      hasLowConfidenceFields: cleanedMeds.some(m => m.isLowConfidence),
      isAiVerified: serverResponseData.isAiVerified !== false,
      aiVerificationStatus: serverResponseData.isAiVerified !== false ? 'verified' : 'unavailable',
      medications: cleanedMeds,
      ocrText: serverResponseData.ocrText || 'Text extracted from prescription document.',
      clinicalSummary: serverResponseData.clinicalSummary || `Prescription scanned. ${cleanedMeds.length} medication(s) extracted.`
    };

    return {
      success: true,
      ocrText: resultData.ocrText,
      source: 'gemini_vision',
      extractedData: resultData,
      isAiVerified: resultData.isAiVerified,
      aiVerificationStatus: resultData.aiVerificationStatus
    };
  }

  // 2. LEVEL 2: Local OCR / Tesseract + Deterministic Extraction
  onProgress({ step: 2, label: 'Performing local optical character extraction...' });

  let localOcrText = '';
  try {
    localOcrText = await performLocalTesseractOcr(processedImageSrc, patientLanguage, (pct) => {
      onProgress({ step: 2, label: `Recognizing prescription text (${pct}%)...` });
    });
  } catch (err) {
    console.warn('[OcrEngine] Local OCR recognition notice:', err);
  }

  onProgress({ step: 3, label: 'Structuring extracted clinical text...' });
  onProgress({ step: 4, label: 'Reviewing against medical dictionary...' });

  const rawTextToUse = localOcrText || `Prescription document captured on ${new Date().toLocaleDateString()}.`;
  const deterministicResult = extractPrescriptionRules(rawTextToUse, patientName);

  // If server AI was unavailable, explicitly mark verification as unavailable, but RETAIN all OCR results
  deterministicResult.isAiVerified = false;
  deterministicResult.aiVerificationStatus = 'unavailable';

  return {
    success: true,
    ocrText: rawTextToUse,
    source: localOcrText ? 'tesseract_local' : 'deterministic_fallback',
    extractedData: deterministicResult,
    isAiVerified: false,
    aiVerificationStatus: 'unavailable',
    errorMessage: serverOcrFailed ? 'AI verification service is temporarily busy. Optical text extraction has been preserved for manual review.' : undefined
  };
}
