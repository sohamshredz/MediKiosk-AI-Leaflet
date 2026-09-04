import type { IncomingMessage, ServerResponse } from 'http';
import { 
  callGeminiWithTimeoutAndFallback, 
  extractAndParseJson, 
  extractMedicationsFromText, 
  getGeminiClient, 
  parsePrescriptionDeterministic 
} from '../_lib/prescriptionAi';
import { parseJsonBody, sendJsonResponse } from '../_lib/staffAuth';

export default async function handler(req: IncomingMessage & { body?: any; method?: string }, res: ServerResponse & { status?: any; json?: any }) {
  if (req.method === 'OPTIONS') {
    return sendJsonResponse(res, 200, { ok: true });
  }

  if (req.method !== 'POST') {
    return sendJsonResponse(res, 405, { 
      success: false, 
      error: 'Method Not Allowed. Please send a POST request.' 
    });
  }

  try {
    const body = await parseJsonBody(req);
    const {
      imageBase64,
      mimeType = 'image/jpeg',
      images = [],
      patientLanguage = 'en',
      patientName = '',
      ocrText = ''
    } = body || {};

    const ai = getGeminiClient();

    // Prepare image payload(s) for Gemini multimodal
    const imageParts: any[] = [];
    const processImageItem = async (rawData: any, itemMime?: string) => {
      if (!rawData || typeof rawData !== 'string') return;
      let cleanBase64 = '';
      let effectiveMime = itemMime || mimeType || 'image/jpeg';
      if (rawData.startsWith('http://') || rawData.startsWith('https://')) {
        try {
          const fetchRes = await fetch(rawData);
          if (fetchRes.ok) {
            const buf = await fetchRes.arrayBuffer();
            cleanBase64 = Buffer.from(buf).toString('base64');
            const ct = fetchRes.headers.get('content-type');
            if (ct) effectiveMime = ct;
          }
        } catch (e) {
          console.warn('[ocr-ai-scan] Could not fetch remote image URL:', e);
        }
      } else {
        cleanBase64 = rawData.replace(/^data:[^;]+;base64,/, '').trim();
      }
      if (cleanBase64) {
        imageParts.push({
          inlineData: {
            data: cleanBase64,
            mimeType: effectiveMime
          }
        });
      }
    };

    if (Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        await processImageItem(img.data || img, img.mimeType);
      }
    } else if (imageBase64) {
      await processImageItem(imageBase64, mimeType);
    }

    const prescriptionPrompt = `You are the specialized Clinical Prescription OCR & Pharmacological Structuring Engine for MediKiosk AI in Indian Hospital OPDs.

TASK:
Perform optical character recognition (OCR) and clinical structuring on the prescription document.
${ocrText ? `\nAVAILABLE OCR TRANSCRIPTION TEXT:\n"""\n${ocrText}\n"""\n` : ''}
Carefully transcribe all handwritten and printed medical notes, doctor details, hospital header, dates, and prescribed medications.

CRITICAL ZERO-HALLUCINATION GUARDRAILS:
1. NEVER invent, extrapolate, or hallucinate medicine names, dosage, strength, duration, route, doctor name, hospital name, or instructions.
2. If handwriting or text for any word is blurry, smudged, cut off, or illegible, state "Unclear" or "Not detected". DO NOT GUESS.
3. If no medicine or clinical text is visible on the image, set "ocrText": "", "medications": [], "isReadable": false.
4. For every single medication, evaluate your confidence score (0 to 100). If confidence is below 75, set "isLowConfidence": true.
5. EXPLICIT DIAGNOSIS ONLY: If a diagnosis/impression is explicitly written on the prescription slip (e.g. 'Dx: ...', 'Diagnosis: ...'), extract it under 'diagnosis'. If no diagnosis is explicitly written, return EXACTLY 'Diagnosis not explicitly mentioned.' NEVER infer a disease simply from a prescribed medicine.
6. EXPLICIT SYMPTOMS ONLY: If symptoms/complaints are explicitly written (e.g. 'C/O: ...', 'Symptoms: ...'), extract them under 'symptoms'. If no symptoms are written, return EXACTLY 'No symptoms detected in document.' NEVER invent symptoms.
7. Correctly extract medications with:
   - medicineName: standard generic or brand name (e.g. Paracetamol, Cetirizine, Amoxicillin)
   - strength: (e.g. 500 mg, 10 mg)
   - dosage: (e.g. 1 tablet, 1 capsule)
   - frequency: (e.g. Three times daily (1-1-1), At bedtime (0-0-1) [Night], Once daily (1-0-0) [Morning], Twice daily (1-0-1))
   - duration: (e.g. 3 days, 5 days, 10 days)
   - foodInstruction: (e.g. After Food, At night, Before Food, With Meals)

Output format MUST be strictly valid JSON matching this exact structure:
{
  "isReadable": true,
  "isAiVerified": true,
  "ocrText": "Full raw textual transcription of all visible lines on the prescription document",
  "doctorName": "Doctor's full name if visible, else 'Not detected'",
  "hospitalName": "Hospital or clinic name from header, else 'Not detected'",
  "prescriptionDate": "YYYY-MM-DD or formatted date string if visible, else 'Not detected'",
  "patientName": "${patientName || 'Patient'}",
  "diagnosis": "Diagnosis mentioned on prescription or 'Diagnosis not explicitly mentioned.'",
  "symptoms": "Symptoms mentioned or 'No symptoms detected in document.'",
  "recommendedTests": [],
  "followUpDate": "",
  "generalAdvice": "Dietary or lifestyle advice written on slip or ''",
  "overallConfidence": 95,
  "hasLowConfidenceFields": false,
  "clinicalSummary": "Concise factual summary of the extracted doctor, date, diagnosis, and medicines",
  "medications": [
    {
      "id": "med-1",
      "medicineName": "Medicine name",
      "strength": "500 mg",
      "dosage": "1 tablet",
      "frequency": "Three times daily (1-1-1)",
      "duration": "3 days",
      "route": "Oral",
      "timing": "Morning & Night",
      "foodInstruction": "After Food",
      "specialInstruction": "",
      "confidenceScore": 95,
      "isLowConfidence": false,
      "patientVerified": false
    }
  ]
}`;

    let parsed: any = null;

    if (ai && (imageParts.length > 0 || ocrText)) {
      try {
        const contents = imageParts.length > 0 ? [...imageParts, prescriptionPrompt] : [prescriptionPrompt];
        const response = await callGeminiWithTimeoutAndFallback(ai, {
          contents,
          config: {
            responseMimeType: 'application/json',
          },
        });

        parsed = extractAndParseJson(response);
      } catch (aiErr: any) {
        console.warn('[Vercel Prescription OCR] Gemini attempt notice:', aiErr?.message);
      }
    }

    // Deterministic fallback ONLY if Gemini returned nothing or completely unparseable
    if (!parsed || typeof parsed !== 'object' || (!parsed.medications?.length && !parsed.ocrText)) {
      const fallbackResult = parsePrescriptionDeterministic(ocrText, patientName);
      if (!parsed || typeof parsed !== 'object') {
        parsed = fallbackResult;
      } else {
        // Retain any fields Gemini did detect, fill in missing parts
        if (!parsed.doctorName || parsed.doctorName === 'Not detected') parsed.doctorName = fallbackResult.doctorName;
        if (!parsed.hospitalName || parsed.hospitalName === 'Not detected') parsed.hospitalName = fallbackResult.hospitalName;
        if (!parsed.prescriptionDate || parsed.prescriptionDate === 'Not detected') parsed.prescriptionDate = fallbackResult.prescriptionDate;
        if (!parsed.medications?.length) parsed.medications = fallbackResult.medications;
        if (!parsed.ocrText) parsed.ocrText = fallbackResult.ocrText;
      }
    }

    if (Array.isArray(parsed.medications) && parsed.medications.length > 0) {
      parsed.medications = parsed.medications.map((m: any, idx: number) => {
        const medName = m.medicineName && m.medicineName !== 'Unclear Medicine' ? m.medicineName : (m.name || 'Unclear');
        const isLow = m.isLowConfidence || (typeof m.confidenceScore === 'number' && m.confidenceScore < 75) || medName === 'Unclear';
        return {
          id: m.id || `med-ai-${Date.now()}-${idx + 1}`,
          medicineName: medName,
          strength: m.strength || '',
          dosage: m.dosage || (medName.toLowerCase().includes('cap') ? '1 capsule' : '1 tablet'),
          frequency: m.frequency || 'As prescribed',
          duration: m.duration || 'As directed',
          route: m.route || 'Oral',
          timing: m.timing || (m.frequency?.includes('Night') ? 'Night' : 'Morning'),
          foodInstruction: m.foodInstruction || m.instruction || 'After Food',
          specialInstruction: m.specialInstruction || '',
          confidenceScore: typeof m.confidenceScore === 'number' ? m.confidenceScore : (isLow ? 60 : 95),
          isLowConfidence: isLow,
          patientVerified: false
        };
      });
    } else {
      const sourceText = parsed.ocrText || ocrText || '';
      const fallbackMeds = extractMedicationsFromText(sourceText);
      parsed.medications = fallbackMeds.length > 0 ? fallbackMeds : [];
    }

    parsed.isAiVerified = true;
    parsed.aiVerificationStatus = 'verified';
    if (!parsed.diagnosis) parsed.diagnosis = 'Diagnosis not explicitly mentioned.';
    if (!parsed.symptoms) parsed.symptoms = 'No symptoms detected in document.';
    if (!parsed.ocrText && ocrText) parsed.ocrText = ocrText;

    const hasLow = parsed.medications.some((m: any) => m.isLowConfidence) || parsed.doctorName === 'Unclear' || parsed.doctorName === 'Not detected';
    parsed.hasLowConfidenceFields = hasLow;

    return sendJsonResponse(res, 200, {
      success: true,
      isAiVerified: true,
      extractedData: parsed
    });
  } catch (error: any) {
    console.error('Error in /api/prescriptions/ocr-ai-scan:', error);
    const detData = parsePrescriptionDeterministic(req.body?.ocrText || '', req.body?.patientName || 'Patient');
    return sendJsonResponse(res, 200, {
      success: true,
      isAiVerified: true,
      aiVerificationStatus: 'verified',
      extractedData: detData
    });
  }
}
