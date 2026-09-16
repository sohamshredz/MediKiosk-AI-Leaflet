import { PrescriptionRecord } from '../types';

export const SAMPLE_PRESCRIPTIONS: PrescriptionRecord[] = [
  {
    id: 'rx-2026-001',
    patientId: 'pat-001',
    patientName: 'Ramesh Kumar',
    uhid: 'AIIMS-ND-2026-8812',
    doctorId: 'doc-001',
    doctorName: 'Dr. R. K. Sharma, MD, DM (Cardiology)',
    hospitalId: 'hosp-001',
    hospitalName: 'AIIMS New Delhi — Department of Cardiology',
    prescriptionDate: '2026-08-20',
    sourceType: 'upload_image',
    originalFileUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
    fileName: 'AIIMS_Cardio_Prescription_Aug2026.jpg',
    fileMimeType: 'image/jpeg',
    fileSizeBytes: 245000,
    pagesCount: 1,
    ocrText: `AIIMS NEW DELHI - DEPARTMENT OF CARDIOLOGY
OPD Slip No: 8812/2026 | Date: 20-08-2026
Patient: Ramesh Kumar, Age: 58 M
Dx: T2DM / Essential HTN / Suspected IHD (Exertional Angina)

Rx:
1. Tab. Metformin 500 mg - 1 tab BD (1-0-1) x 30 days [After meals]
2. Tab. Telmisartan 40 mg - 1 tab OD (1-0-0) x 30 days [Morning post breakfast]
3. Tab. Glimepiride 2 mg - 1 tab OD (1-0-0) x 30 days [Before breakfast]
4. Tab. Sorbitrate 5 mg - 1 tab SOS under tongue for acute chest pain

Advice: Low salt & low carbohydrate diet. Daily 30 min brisk walk if no angina.
Investigations: HbA1c, Lipid Profile, TMT / Echocardiography.
Follow up: In 4 weeks with reports.
Dr. R. K. Sharma (Reg. No: 48921-DMC)`,
    medications: [
      {
        id: 'med-rx-1',
        prescriptionId: 'rx-2026-001',
        medicineName: 'Metformin',
        strength: '500 mg',
        dosage: '1 tablet',
        frequency: 'Twice daily (1-0-1)',
        duration: '30 days',
        route: 'Oral',
        timing: 'Morning & Night',
        foodInstruction: 'After food',
        specialInstruction: 'Take with full glass of water',
        confidenceScore: 98,
        isLowConfidence: false,
        patientVerified: true,
        createdAt: '2026-08-20T10:15:00Z'
      },
      {
        id: 'med-rx-2',
        prescriptionId: 'rx-2026-001',
        medicineName: 'Telmisartan',
        strength: '40 mg',
        dosage: '1 tablet',
        frequency: 'Once daily (1-0-0)',
        duration: '30 days',
        route: 'Oral',
        timing: 'Morning',
        foodInstruction: 'After food',
        specialInstruction: 'Check BP weekly',
        confidenceScore: 96,
        isLowConfidence: false,
        patientVerified: true,
        createdAt: '2026-08-20T10:15:00Z'
      },
      {
        id: 'med-rx-3',
        prescriptionId: 'rx-2026-001',
        medicineName: 'Glimepiride',
        strength: '2 mg',
        dosage: '1 tablet',
        frequency: 'Once daily (1-0-0)',
        duration: '30 days',
        route: 'Oral',
        timing: 'Morning',
        foodInstruction: 'Before food',
        specialInstruction: 'Take 15 mins before breakfast; carry sugar candies for hypoglycemia risk',
        confidenceScore: 94,
        isLowConfidence: false,
        patientVerified: true,
        createdAt: '2026-08-20T10:15:00Z'
      },
      {
        id: 'med-rx-4',
        prescriptionId: 'rx-2026-001',
        medicineName: 'Isosorbide Dinitrate (Sorbitrate)',
        strength: '5 mg',
        dosage: '1 tablet',
        frequency: 'SOS (As needed)',
        duration: 'As needed for acute chest pain',
        route: 'Sublingual',
        timing: 'Under tongue during chest pain',
        foodInstruction: 'Immediate sublingual',
        specialInstruction: 'Keep under tongue, sit down immediately upon administration',
        confidenceScore: 91,
        isLowConfidence: false,
        patientVerified: true,
        createdAt: '2026-08-20T10:15:00Z'
      }
    ],
    diagnosis: 'Type 2 Diabetes Mellitus with Essential Hypertension and Suspected Exertional Angina',
    recommendedTests: ['HbA1c & Fasting/PP Blood Sugar', 'Fasting Lipid Profile', 'Echocardiography (2D Echo) & TMT'],
    followUpDate: '2026-09-17 (In 4 weeks)',
    generalAdvice: 'Low sodium & diabetic renal diet. Moderate aerobic exercise only within pain-free limits. Avoid heavy lifting.',
    verificationStatus: 'DOCTOR_REVIEWED',
    overallConfidence: 95,
    hasLowConfidenceFields: false,
    patientVerifiedAt: '2026-08-20 11:30 AM',
    doctorReviewedBy: 'Dr. Vivek Malhotra, MD (OPD Senior Resident)',
    doctorReviewedAt: '2026-08-20 12:45 PM',
    doctorClinicalNotes: 'Patient verified all 4 medicines correctly. Cross-checked with hospital pharmacy inventory. Tolerating Metformin + Telmisartan well.',
    auditLogs: [
      {
        id: 'log-1',
        userId: 'pat-001',
        userRole: 'PATIENT',
        userName: 'Ramesh Kumar',
        action: 'PRESCRIPTION_UPLOADED',
        resourceType: 'prescription',
        resourceId: 'rx-2026-001',
        timestamp: '2026-08-20T10:14:22Z',
        note: 'Uploaded prescription JPG image (245 KB)'
      },
      {
        id: 'log-2',
        userId: 'system-ocr',
        userRole: 'ADMIN',
        userName: 'MediKiosk OCR & AI Engine',
        action: 'OCR_COMPLETED',
        resourceType: 'prescription',
        resourceId: 'rx-2026-001',
        timestamp: '2026-08-20T10:14:25Z',
        note: 'Extracted 4 medications with 95% average confidence'
      },
      {
        id: 'log-3',
        userId: 'pat-001',
        userRole: 'PATIENT',
        userName: 'Ramesh Kumar',
        action: 'PATIENT_VERIFIED',
        resourceType: 'prescription',
        resourceId: 'rx-2026-001',
        timestamp: '2026-08-20T10:15:30Z',
        note: 'Patient confirmed all 4 medication dosages via Kiosk Review Screen'
      },
      {
        id: 'log-4',
        userId: 'doc-001',
        userRole: 'DOCTOR',
        userName: 'Dr. Vivek Malhotra',
        action: 'DOCTOR_REVIEWED',
        resourceType: 'prescription',
        resourceId: 'rx-2026-001',
        timestamp: '2026-08-20T12:45:00Z',
        note: 'Doctor verified against original document and signed off'
      }
    ],
    createdAt: '2026-08-20T10:14:22Z',
    updatedAt: '2026-08-20T12:45:00Z'
  },
  {
    id: 'rx-2026-002',
    patientId: 'pat-001',
    patientName: 'Ramesh Kumar',
    uhid: 'AIIMS-ND-2026-8812',
    doctorId: 'doc-002',
    doctorName: 'Dr. Anita Desai, MD (Endocrinology)',
    hospitalId: 'hosp-002',
    hospitalName: 'Safdarjung Hospital — Diabetes Clinic',
    prescriptionDate: '2026-07-15',
    sourceType: 'upload_image',
    originalFileUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=80',
    fileName: 'Safdarjung_Endo_July2026.jpg',
    fileMimeType: 'image/jpeg',
    fileSizeBytes: 189000,
    pagesCount: 1,
    ocrText: `SAFDARJUNG HOSPITAL NEW DELHI
Endocrine OPD | Date: 15-07-2026
Patient: Ramesh Kumar, 58/M

Rx:
- Tab. Metformin 500 mg - 1 tab twice daily
- Tab. Rosuvastatin 10 mg - 1 tab at bedtime (0-0-1) x 30 days
- Tab. B-Complex with Zinc - 1 cap daily after lunch

Advice: Diabetic dietary counseling attended.
Dr. Anita Desai (Endocrinologist)`,
    medications: [
      {
        id: 'med-rx-201',
        prescriptionId: 'rx-2026-002',
        medicineName: 'Metformin',
        strength: '500 mg',
        dosage: '1 tablet',
        frequency: 'Twice daily (1-0-1)',
        duration: '30 days',
        route: 'Oral',
        timing: 'Morning & Night',
        foodInstruction: 'After food',
        confidenceScore: 97,
        isLowConfidence: false,
        patientVerified: true,
        createdAt: '2026-07-15T11:00:00Z'
      },
      {
        id: 'med-rx-202',
        prescriptionId: 'rx-2026-002',
        medicineName: 'Rosuvastatin',
        strength: '10 mg',
        dosage: '1 tablet',
        frequency: 'Once daily at bedtime (0-0-1)',
        duration: '30 days',
        route: 'Oral',
        timing: 'Night (Bedtime)',
        foodInstruction: 'After food',
        specialInstruction: 'Take consistently at night for lipid regulation',
        confidenceScore: 95,
        isLowConfidence: false,
        patientVerified: true,
        createdAt: '2026-07-15T11:00:00Z'
      },
      {
        id: 'med-rx-203',
        prescriptionId: 'rx-2026-002',
        medicineName: 'B-Complex with Zinc (Becozinc)',
        strength: 'Standard therapeutic',
        dosage: '1 capsule',
        frequency: 'Once daily (0-1-0)',
        duration: '30 days',
        route: 'Oral',
        timing: 'Afternoon',
        foodInstruction: 'After food',
        confidenceScore: 92,
        isLowConfidence: false,
        patientVerified: true,
        createdAt: '2026-07-15T11:00:00Z'
      }
    ],
    diagnosis: 'Type 2 Diabetes Mellitus with Mixed Dyslipidemia',
    recommendedTests: ['Fasting Blood Glucose', 'Lipid Profile', 'Serum Creatinine'],
    followUpDate: '2026-08-15',
    generalAdvice: 'Follow strict diabetic diet, avoid sweets and refined flour.',
    verificationStatus: 'PATIENT_VERIFIED',
    overallConfidence: 94,
    hasLowConfidenceFields: false,
    patientVerifiedAt: '2026-07-15 11:20 AM',
    auditLogs: [
      {
        id: 'log-201',
        userId: 'pat-001',
        userRole: 'PATIENT',
        userName: 'Ramesh Kumar',
        action: 'PRESCRIPTION_UPLOADED',
        resourceType: 'prescription',
        resourceId: 'rx-2026-002',
        timestamp: '2026-07-15T11:10:00Z',
        note: 'Scanned from mobile camera'
      },
      {
        id: 'log-202',
        userId: 'pat-001',
        userRole: 'PATIENT',
        userName: 'Ramesh Kumar',
        action: 'PATIENT_VERIFIED',
        resourceType: 'prescription',
        resourceId: 'rx-2026-002',
        timestamp: '2026-07-15T11:20:00Z',
        note: 'Patient confirmed verified data'
      }
    ],
    createdAt: '2026-07-15T11:10:00Z',
    updatedAt: '2026-07-15T11:20:00Z'
  },
  {
    id: 'rx-2026-003',
    patientId: 'pat-002',
    patientName: 'Sunita Sharma',
    uhid: 'AIIMS-ND-2026-9041',
    doctorId: 'doc-003',
    doctorName: 'Dr. Ananya Mukherjee, MD (Pulmonology)',
    hospitalId: 'hosp-003',
    hospitalName: 'Apollo Hospital — Respiratory Medicine Center',
    prescriptionDate: '2026-08-18',
    sourceType: 'upload_image',
    originalFileUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&auto=format&fit=crop&q=80',
    fileName: 'Apollo_Pulmo_Prescription_Sunita.jpg',
    fileMimeType: 'image/jpeg',
    fileSizeBytes: 210000,
    pagesCount: 1,
    ocrText: `APOLLO RESPIRATORY CARE CENTER
Date: 18-08-2026
Patient: Sunita Sharma, 45/F
Diagnosis: Moderate Persistent Bronchial Asthma with Allergic Rhinitis

Prescription:
1. Budesonide + Formoterol Inhaler (Budecort-F 200/6) - 2 puffs BD with Spacer x 60 days
2. Tab. Montelukast 10 mg + Levocetirizine 5 mg (Monticope) - 1 tab at bedtime (0-0-1) x 30 days
3. Salbutamol Inhaler (Asthalin 100mcg) - 2 puffs SOS for acute breathlessness

Instructions: Rinse mouth with water after steroid inhaler puffs. Avoid dust, agarbatti smoke, and cold beverages.
Dr. Ananya Mukherjee`,
    medications: [
      {
        id: 'med-rx-301',
        prescriptionId: 'rx-2026-003',
        medicineName: 'Budesonide + Formoterol (Budecort-F 200/6)',
        strength: '200 mcg / 6 mcg',
        dosage: '2 puffs',
        frequency: 'Twice daily (2-0-2)',
        duration: '60 days',
        route: 'Inhalation (via Spacer)',
        timing: 'Morning & Night',
        foodInstruction: 'Anytime',
        specialInstruction: 'Always rinse mouth and gargle with water after each inhalation to prevent oral thrush',
        confidenceScore: 97,
        isLowConfidence: false,
        patientVerified: true,
        createdAt: '2026-08-18T14:30:00Z'
      },
      {
        id: 'med-rx-302',
        prescriptionId: 'rx-2026-003',
        medicineName: 'Montelukast + Levocetirizine (Monticope)',
        strength: '10 mg + 5 mg',
        dosage: '1 tablet',
        frequency: 'Once daily at bedtime (0-0-1)',
        duration: '30 days',
        route: 'Oral',
        timing: 'Night',
        foodInstruction: 'After food',
        specialInstruction: 'May cause mild drowsiness; avoid nighttime driving',
        confidenceScore: 95,
        isLowConfidence: false,
        patientVerified: true,
        createdAt: '2026-08-18T14:30:00Z'
      },
      {
        id: 'med-rx-303',
        prescriptionId: 'rx-2026-003',
        medicineName: 'Salbutamol (Asthalin Inhaler)',
        strength: '100 mcg / actuation',
        dosage: '2 puffs',
        frequency: 'SOS (As needed)',
        duration: 'As needed for acute wheeze/dyspnea',
        route: 'Inhalation',
        timing: 'During asthma flare-up',
        foodInstruction: 'Immediate inhalation',
        specialInstruction: 'Rescue inhaler: Keep within immediate reach at all times',
        confidenceScore: 93,
        isLowConfidence: false,
        patientVerified: true,
        createdAt: '2026-08-18T14:30:00Z'
      }
    ],
    diagnosis: 'Moderate Persistent Bronchial Asthma with Allergic Rhinosinusitis',
    recommendedTests: ['Spirometry (PFT with bronchodilator reversibility)', 'Absolute Eosinophil Count (AEC)', 'Total Serum IgE'],
    followUpDate: '2026-09-18 (In 4 weeks)',
    generalAdvice: 'Use peak flow meter daily in morning. Strictly avoid smoke, dust mites, pet dander, and sudden cold exposure.',
    verificationStatus: 'DOCTOR_REVIEWED',
    overallConfidence: 96,
    hasLowConfidenceFields: false,
    patientVerifiedAt: '2026-08-18 15:00',
    doctorReviewedBy: 'Dr. Priya Nair (OPD Consultant)',
    doctorReviewedAt: '2026-08-18 16:15',
    doctorClinicalNotes: 'Inhaler technique reviewed with patient. Prescriptions synchronized with ABDM health locker.',
    auditLogs: [
      {
        id: 'log-301',
        userId: 'pat-002',
        userRole: 'PATIENT',
        userName: 'Sunita Sharma',
        action: 'PRESCRIPTION_UPLOADED',
        resourceType: 'prescription',
        resourceId: 'rx-2026-003',
        timestamp: '2026-08-18T14:28:00Z',
        note: 'Uploaded scanned PDF document'
      },
      {
        id: 'log-302',
        userId: 'pat-002',
        userRole: 'PATIENT',
        userName: 'Sunita Sharma',
        action: 'PATIENT_VERIFIED',
        resourceType: 'prescription',
        resourceId: 'rx-2026-003',
        timestamp: '2026-08-18T14:30:00Z',
        note: 'Patient confirmed inhaler dosage and timing'
      }
    ],
    createdAt: '2026-08-18T14:28:00Z',
    updatedAt: '2026-08-18T16:15:00Z'
  }
];
