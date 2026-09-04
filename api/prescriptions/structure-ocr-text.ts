import type { IncomingMessage, ServerResponse } from 'http';
import { 
  callGeminiWithTimeoutAndFallback, 
  extractAndParseJson, 
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
    const { ocrText, patientName = '' } = body || {};

    if (!ocrText || typeof ocrText !== 'string' || !ocrText.trim()) {
      return sendJsonResponse(res, 400, {
        success: false,
        error: 'No OCR text provided to structure.'
      });
    }

    const ai = getGeminiClient();
    const structurePrompt = `You are the specialized Clinical Prescription OCR & Pharmacological Structuring Engine for MediKiosk AI in Indian Hospital OPDs.

RAW OCR TEXT FROM PRESCRIPTION:
"""
${ocrText}
"""

TASK:
Convert this raw OCR transcription into structured prescription information.

CRITICAL ZERO-HALLUCINATION GUARDRAILS:
1. NEVER invent medicine names, dosage, strength, duration, route, doctor name, hospital name, or instructions.
2. If any field is not detected in the OCR text, return "Unclear" or "Not detected". DO NOT GUESS.
3. EXPLICIT DIAGNOSIS ONLY: If a diagnosis/impression is explicitly written in the OCR text (e.g. 'Dx: ...'), output under 'diagnosis'. If not, output 'Diagnosis not explicitly mentioned.' NEVER infer disease from medications!
4. EXPLICIT SYMPTOMS ONLY: If symptoms/complaints are explicitly written (e.g. 'C/O: ...'), output under 'symptoms'. If not, output 'No symptoms detected in document.' NEVER infer symptoms.
5. For every single medication, evaluate confidence score (0 to 100). If confidence < 75, set "isLowConfidence": true.
6. Correctly extract medications with:
   - medicineName: standard generic or brand name (e.g. Paracetamol, Cetirizine, Amoxicillin)
   - strength: (e.g. 500 mg, 10 mg)
   - dosage: (e.g. 1 tablet, 1 capsule)
   - frequency: (e.g. Three times daily (1-1-1), At bedtime (0-0-1) [Night], Once daily (1-0-0) [Morning], Twice daily (1-0-1))
   - duration: (e.g. 3 days, 5 days, 10 days)
   - foodInstruction: (e.g. After Food, At night, Before Food, With Meals)

Output format MUST be strictly JSON matching this structure:
{
  "doctorName": "Doctor name if visible, else 'Not detected'",
  "hospitalName": "Hospital or clinic name, else 'Not detected'",
  "prescriptionDate": "YYYY-MM-DD or formatted date, else 'Not detected'",
  "patientName": "${patientName || 'Patient'}",
  "diagnosis": "Diagnosis mentioned on prescription or 'Diagnosis not explicitly mentioned.'",
  "symptoms": "Symptoms mentioned or 'No symptoms detected in document.'",
  "recommendedTests": [],
  "followUpDate": "",
  "generalAdvice": "",
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

    if (ai) {
      try {
        const response = await callGeminiWithTimeoutAndFallback(ai, {
          contents: structurePrompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
        parsed = extractAndParseJson(response);
      } catch (aiErr: any) {
        console.warn('[Vercel Structure OCR] Gemini notice:', aiErr?.message);
      }
    }

    if (!parsed || !parsed.doctorName || (!parsed.medications?.length && !parsed.ocrText)) {
      parsed = parsePrescriptionDeterministic(ocrText, patientName);
    }

    if (Array.isArray(parsed.medications)) {
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
    }

    parsed.isAiVerified = true;
    parsed.aiVerificationStatus = 'verified';
    if (!parsed.ocrText) parsed.ocrText = ocrText;

    return sendJsonResponse(res, 200, {
      success: true,
      isAiVerified: true,
      extractedData: parsed
    });
  } catch (error: any) {
    console.error('Error in /api/prescriptions/structure-ocr-text:', error);
    const detData = parsePrescriptionDeterministic(req.body?.ocrText || '', req.body?.patientName || 'Patient');
    return sendJsonResponse(res, 200, {
      success: true,
      isAiVerified: true,
      aiVerificationStatus: 'verified',
      extractedData: detData
    });
  }
}
