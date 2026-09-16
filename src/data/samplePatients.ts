import { PatientProfile } from '../types';

export const SAMPLE_PATIENTS: PatientProfile[] = [
  {
    id: 'pat-001',
    patientId: 'MKP-2026-001',
    tokenNumber: 'OPD-102',
    abhaId: '91-4829-1029-4820',
    uhid: 'AIIMS-ND-2026-8812',
    name: 'Ramesh Kumar',
    age: 58,
    gender: 'male',
    mobile: '+91 98765 43210',
    email: 'ramesh.kumar@example.com',
    language: 'hi',
    careStream: 'allopathy',
    department: 'General Medicine & Cardiology',
    registeredAt: '2026-08-28 08:30 AM',
    status: 'ready_for_doctor',
    consentGiven: true,
    consentType: 'voice',
    consentTimestamp: '2026-08-28 08:32:15',
    symptoms: [
      {
        id: 'sym-1',
        name: 'Retrosternal Chest Pain / Tightness',
        nameInSelectedLanguage: 'सीने में भारीपन और तेज दबाव',
        bodyPart: 'chest',
        severity: 8,
        duration: '3 days',
        onset: 'gradual',
        character: 'Heavy crushing pressure radiating to left arm and jaw on climbing stairs',
        aggravatingFactors: 'Walking uphill, climbing stairs, post heavy meals',
        relievingFactors: 'Resting for 10-15 minutes',
        associatedSymptoms: ['Shortness of breath (Dyspnea)', 'Cold profuse sweating', 'Nausea']
      }
    ],
    vitals: {
      bpSystolic: 158,
      bpDiastolic: 98,
      heartRate: 104,
      spO2: 93,
      temperature: 98.4,
      respiratoryRate: 22,
      bloodSugar: 218,
      weightKg: 78,
      heightCm: 168,
      bmi: 27.6,
      recordedAt: '08:35 AM'
    },
    pastIllnesses: [
      'Type 2 Diabetes Mellitus (12 years, poorly controlled)',
      'Essential Hypertension (8 years)',
      'Dyslipidemia (4 years)'
    ],
    pastSurgeries: ['Appendectomy (2014)'],
    familyHistory: ['Father had myocardial infarction at age 62', 'Mother had T2DM'],
    habits: {
      smoking: false,
      alcohol: false,
      tobacco: true, // tobacco chewing
      diet: 'North Indian mixed diet'
    },
    currentMedications: [
      {
        id: 'med-1',
        name: 'Tab. Metformin 500mg',
        dose: '500mg',
        frequency: '1-0-1 (Twice daily after food)',
        duration: 'Ongoing',
        isActive: true,
        source: 'scanned_doc'
      },
      {
        id: 'med-2',
        name: 'Tab. Telmisartan 40mg',
        dose: '40mg',
        frequency: '1-0-0 (Morning)',
        duration: 'Ongoing',
        isActive: true,
        source: 'scanned_doc'
      },
      {
        id: 'med-3',
        name: 'Tab. Glimepiride 2mg',
        dose: '2mg',
        frequency: '1-0-0 (Before breakfast)',
        duration: 'Ongoing',
        isActive: true,
        source: 'scanned_doc'
      }
    ],
    allergies: [
      {
        id: 'alg-1',
        substance: 'Sulfa Drugs (Sulfonamides)',
        reactionType: 'Generalized skin rash & facial swelling',
        severity: 'moderate'
      }
    ],
    scannedDocuments: [
      {
        id: 'doc-1',
        fileName: 'District_Hospital_Prescription_2024.jpg',
        documentTitle: 'District Hospital OPD Prescription',
        documentType: 'Handwritten Clinical Prescription',
        dateOfRecord: '14-Nov-2024',
        fileType: 'prescription',
        imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
        documentDate: '2024-11-14',
        providerName: 'District Civil Hospital, Moradabad',
        doctorName: 'Dr. S. K. Verma, MD (Med)',
        extractedData: {
          hospitalOrClinic: 'District Civil Hospital, Moradabad',
          doctorName: 'Dr. S. K. Verma, MD',
          date: '14-Nov-2024',
          diagnoses: ['Uncontrolled T2DM', 'Hypertension Stage II', 'Early Diabetic Dyslipidemia'],
          medications: [
            { 
              name: 'Tab Metformin', 
              dose: '500mg', 
              frequency: '1-0-1 (BD)', 
              duration: '3 months', 
              instructions: 'After meals',
              adjustmentType: 'maintained',
              adjustmentNote: 'Maintained baseline biguanide therapy',
              verified: true 
            },
            { 
              name: 'Tab Telmisartan', 
              dose: '40mg', 
              frequency: '1-0-0 (OD)', 
              duration: '3 months', 
              instructions: 'Morning',
              adjustmentType: 'switched',
              adjustmentNote: 'Switched from Amlodipine 5mg to provide nephroprotection and resolve ankle edema',
              verified: true 
            },
            { 
              name: 'Tab Glimepiride', 
              dose: '2mg', 
              frequency: '1-0-0 (OD)', 
              duration: '3 months', 
              instructions: 'Before breakfast',
              adjustmentType: 'new_started',
              adjustmentNote: 'Initiated new sulfonylurea add-on due to persistent postprandial hyperglycemia',
              verified: true 
            }
          ],
          keyFindingsSummary: {
            medicationAdjustments: [
              {
                medicationName: 'Tab. Telmisartan 40mg',
                previousRegimen: 'Tab. Amlodipine 5mg OD',
                newRegimen: 'Tab. Telmisartan 40mg OD (Morning)',
                reason: 'Switched to ARB class for blood pressure control with enhanced renal protection',
                impact: 'critical'
              },
              {
                medicationName: 'Tab. Glimepiride 2mg',
                previousRegimen: 'None (Dual therapy prior)',
                newRegimen: 'Tab. Glimepiride 2mg OD (Before breakfast)',
                reason: 'New sulfonylurea add-on to intensify glycemic control (Fasting BG > 200 mg/dL)',
                impact: 'critical'
              },
              {
                medicationName: 'Tab. Metformin 500mg',
                previousRegimen: 'Tab. Metformin 500mg BD',
                newRegimen: 'Tab. Metformin 500mg BD (After meals)',
                reason: 'Continued standard insulin-sensitizing baseline dosage',
                impact: 'routine'
              }
            ],
            clinicalImpression: 'Patient transitioning from monotherapy to triple oral hypoglycemic & antihypertensive regimen. Irregular adherence reported.',
            drugInteractionsFlagged: [
              'Glimepiride is a Sulfonylurea: cross-check with patient documented Sulfa allergy history'
            ]
          },
          keyObservations: [
            'Advised Lipid profile and HbA1c testing within 4 weeks',
            'Patient cautioned regarding hypoglycemia signs with Glimepiride',
            'Advised dietary restriction of refined carbohydrates and excess salt'
          ],
          confidenceScore: 0.96,
          ocrEngine: 'Gemini 3.5 Multimodal OCR'
        },
        verifiedByPatient: true,
        staffVerified: true,
        staffVerifiedBy: 'Sister Anita Sharma, RN (OPD Station 2)',
        staffVerifiedAt: '2026-08-28 08:40 AM',
        staffNotes: 'Cross-checked against physical paper slip. Dosage numbers verified.'
      },
      {
        id: 'doc-2',
        fileName: 'Lab_Report_Biochemistry_2025.jpg',
        documentTitle: 'Metabolic & Renal Biochemistry Panel',
        documentType: 'Printed Diagnostic Pathology Report',
        dateOfRecord: '20-Jun-2025',
        fileType: 'lab_report',
        imageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80',
        documentDate: '2025-06-20',
        providerName: 'Apex Diagnostic Care Centre, New Delhi',
        doctorName: 'Dr. V. K. Aggarwal, MD (Pathology)',
        extractedData: {
          hospitalOrClinic: 'Apex Diagnostic Care Centre',
          doctorName: 'Dr. V. K. Aggarwal, MD (Path)',
          date: '20-Jun-2025',
          diagnoses: ['Severe Glycemic Decompensation', 'Diabetic Dyslipidemia', 'Stage 2 Chronic Kidney Disease (Borderline)'],
          labResults: [
            { 
              testName: 'HbA1c (Glycated Hemoglobin)', 
              value: '9.2', 
              unit: '%', 
              referenceRange: '4.0 - 5.6 %', 
              status: 'critical',
              clinicalImpact: 'Severely elevated glycemic index reflecting chronic poor glucose control over prior 90 days.',
              verified: true 
            },
            { 
              testName: 'Fasting Blood Glucose (FBG)', 
              value: '218', 
              unit: 'mg/dL', 
              referenceRange: '70 - 100 mg/dL', 
              status: 'high',
              clinicalImpact: 'Marked fasting hyperglycemia (>2x normal upper limit).',
              verified: true 
            },
            { 
              testName: 'Serum Creatinine', 
              value: '1.42', 
              unit: 'mg/dL', 
              referenceRange: '0.7 - 1.2 mg/dL', 
              status: 'high',
              clinicalImpact: 'Elevated biomarker indicating early microvascular renal filtration deficit (estimated eGFR ≈ 54 mL/min).',
              verified: true 
            },
            { 
              testName: 'Total Cholesterol', 
              value: '246', 
              unit: 'mg/dL', 
              referenceRange: '< 200 mg/dL', 
              status: 'high',
              clinicalImpact: 'Hypercholesterolemia with increased atherosclerotic plaque liability.',
              verified: true 
            },
            { 
              testName: 'LDL Cholesterol (Direct)', 
              value: '162', 
              unit: 'mg/dL', 
              referenceRange: '< 100 mg/dL', 
              status: 'high',
              clinicalImpact: 'Atherogenic low-density lipoprotein elevated; Statin therapy indicated.',
              verified: true 
            },
            { 
              testName: 'Serum Triglycerides', 
              value: '210', 
              unit: 'mg/dL', 
              referenceRange: '< 150 mg/dL', 
              status: 'high',
              clinicalImpact: 'Diabetic hypertriglyceridemia associated with insulin resistance.',
              verified: true 
            },
            { 
              testName: 'HDL Cholesterol', 
              value: '42', 
              unit: 'mg/dL', 
              referenceRange: '> 40 mg/dL', 
              status: 'normal',
              clinicalImpact: 'Within normal baseline range.',
              verified: true 
            }
          ],
          keyFindingsSummary: {
            abnormalLabValues: [
              {
                parameter: 'HbA1c (Glycated Hemoglobin)',
                value: '9.2 %',
                reference: '4.0 - 5.6 % (Target < 7.0%)',
                severity: 'critical',
                clinicalImplication: 'High cardiovascular & microvascular complication risk; requires prompt anti-diabetic medication review.'
              },
              {
                parameter: 'Serum Creatinine',
                value: '1.42 mg/dL',
                reference: '0.7 - 1.2 mg/dL',
                severity: 'high',
                clinicalImplication: 'Borderline renal dysfunction; monitor nephrotoxic agents and review Metformin clearance.'
              },
              {
                parameter: 'LDL Cholesterol',
                value: '162 mg/dL',
                reference: '< 100 mg/dL',
                severity: 'high',
                clinicalImplication: 'High atherogenic lipid fraction; strong indication for HMG-CoA reductase inhibitor (Statin).'
              },
              {
                parameter: 'Fasting Blood Glucose',
                value: '218 mg/dL',
                reference: '70 - 100 mg/dL',
                severity: 'high',
                clinicalImplication: 'Severe fasting dysglycemia.'
              }
            ],
            clinicalImpression: 'Metabolic syndromic triad: Uncontrolled Diabetes + Dyslipidemia + Early Renal Impairment. High cardiovascular vulnerability.'
          },
          keyObservations: [
            'Marked diabetic dyslipidemia requiring lipid lowering therapy',
            'Early borderline elevation of serum creatinine requires urine microalbumin / creatinine ratio check',
            'Quality control sample calibration passed (ISO 15189 Certified Lab)'
          ],
          confidenceScore: 0.99,
          ocrEngine: 'Gemini 3.5 High-Precision Lab Engine'
        },
        verifiedByPatient: true,
        staffVerified: true,
        staffVerifiedBy: 'Sister Anita Sharma, RN (OPD Station 2)',
        staffVerifiedAt: '2026-08-28 08:42 AM',
        staffNotes: 'Biochemistry values extracted with 99% accuracy against printed diagnostic sheet.'
      }
    ],
    timeline: [
      {
        id: 'tl-1',
        date: '2014-03-10',
        title: 'Appendectomy Surgery',
        category: 'surgery',
        hospitalOrDoctor: 'Govt. General Hospital',
        summary: 'Uncomplicated laparoscopic appendectomy.'
      },
      {
        id: 'tl-2',
        date: '2014-08-15',
        title: 'T2DM & Hypertension Diagnosis',
        category: 'diagnosis',
        hospitalOrDoctor: 'Primary Health Centre',
        summary: 'Diagnosed with fasting glucose 190 mg/dL and BP 150/95 mmHg. Started on Metformin and Amlodipine.'
      },
      {
        id: 'tl-3',
        date: '2024-11-14',
        title: 'OPD Review & Medication Adjustment',
        category: 'prescription',
        hospitalOrDoctor: 'Dr. S. K. Verma, District Civil Hospital',
        summary: 'Switched BP medication to Telmisartan 40mg and added Glimepiride 2mg for glycemic control.'
      },
      {
        id: 'tl-4',
        date: '2025-06-20',
        title: 'Abnormal Metabolic Panel',
        category: 'lab_report',
        hospitalOrDoctor: 'Apex Diagnostics',
        summary: 'HbA1c elevated at 9.2%, Fasting Glucose 218 mg/dL, Total Cholesterol 246 mg/dL, Creatinine 1.42 mg/dL.'
      },
      {
        id: 'tl-5',
        date: '2026-08-28',
        title: 'Current Visit: Acute Exertional Angina / Red Flag Alert',
        category: 'diagnosis',
        hospitalOrDoctor: 'MediKiosk AI Intake - AIIMS OPD',
        summary: 'Presenting with 3 days of progressive retrosternal crushing chest pain, SpO2 93%, BP 158/98 mmHg, HR 104 bpm.'
      }
    ],
    triageRisk: 'CRITICAL_EMERGENCY',
    redFlagsDetected: [
      '🚨 Acute retrosternal chest pain radiating to left shoulder/jaw with exertion',
      '🚨 Resting Tachycardia (HR 104 bpm) + Stage 2 Hypertension (158/98 mmHg)',
      '🚨 Mild Hypoxemia (SpO2 93% on room air)',
      '🚨 High cardiovascular risk profile: Longstanding T2DM (HbA1c 9.2%) + Dyslipidemia + Active Tobacco use'
    ],
    clinicalSummary: {
      executiveSummary: '58-year-old male with 12-year history of poorly controlled T2DM and HTN presenting with 3-day history of crescendo exertional chest tightness radiating to left arm and jaw, accompanied by dyspnea and diaphoresis. Vitals show BP 158/98, HR 104, SpO2 93%. Triage classified as High-Priority Cardiac Emergency.',
      chiefComplaintSummary: 'Retrosternal crushing chest pain on exertion × 3 days, radiating to left arm, associated with dyspnea and cold sweats.',
      historyOfPresentIllness: 'Patient reports progressive retrosternal chest tightness over the past 72 hours. Initially triggered while walking 100 meters, now occurs upon climbing half a flight of stairs. Resolves partially with 15 mins rest. Episodes accompanied by diaphoresis and nausea. No history of cough, hemoptysis, or syncope.',
      pastMedicalSurgicalHistory: [
        'Type 2 Diabetes Mellitus × 12 years (Recent HbA1c 9.2%)',
        'Hypertension × 8 years on Telmisartan 40mg',
        'Dyslipidemia (LDL 162 mg/dL in 2025 records)',
        'Tobacco chewer (15 pack-years equivalent)'
      ],
      drugAllergyWarnings: {
        hasConflict: true,
        warningText: 'PATIENT HAS DOCUMENTED SULFA ALLERGY. Avoid Sulfonamide derivatives (e.g., Furosemide, Thiazides, Sulfonylureas cross-reactivity caution; patient is currently on Glimepiride which is a sulfonylurea - review tolerability).',
        conflictingDrugs: ['Sulfa drugs', 'Sulfonylureas']
      },
      timelineHighlights: [
        'June 2025: Uncontrolled glycemic state with HbA1c 9.2% and borderline renal impairment (Cr 1.42)',
        'November 2024: Medication dose escalation at District Hospital'
      ],
      triageAssessment: {
        riskLevel: 'CRITICAL_EMERGENCY',
        reasoning: 'Symptoms consistent with Acute Coronary Syndrome (Unstable Angina / Non-ST or ST-Elevation Myocardial Infarction) in a high-risk diabetic patient.',
        redFlags: [
          'Acute anginal chest pain with radiation',
          'Tachycardia (104 bpm) & Hypertension (158/98 mmHg)',
          'SpO2 93%'
        ]
      },
      diagnosticHypothesesCDS: [
        {
          condition: 'Acute Coronary Syndrome (ACS / Unstable Angina vs NSTEMI)',
          rationale: 'Classic crescendo exertional anginal pattern in a patient with 3 major CV risk factors (T2DM, HTN, Dyslipidemia, Tobacco).',
          suggestedFocusExam: ['Immediate 12-lead STAT ECG', 'Serum Cardiac Troponin I/T', 'Auscultate for S3/S4 gallop or pulmonary rales']
        },
        {
          condition: 'Aortic Dissection (Less likely but critical differential)',
          rationale: 'Severe chest discomfort in severe hypertension. Check bilateral radial pulses and blood pressure differential.',
          suggestedFocusExam: ['Check bilateral arm BP differential (>20 mmHg)', 'Assess peripheral pulses']
        }
      ],
      recommendedActionsForDoctor: [
        'Perform STAT 12-lead ECG within 10 minutes of arrival',
        'Order STAT Cardiac Troponins, CPK-MB, and Electrolytes',
        'Administer Chewable Aspirin 300mg + Clopidogrel 300mg if ACS suspected & no contraindication',
        'Initiate Sublingual Nitroglycerin 0.5mg if BP > 100 mmHg and no right ventricular infarct signs',
        'Bedside 2D Echocardiography & Fast-track transfer to Cardiac Care Unit / Cath Lab if ECG shows STEMI'
      ],
      abdmFhirCode: 'FHIR-R4-DIAGNOSTIC-REPORT-ACS-TRIAGE-2026'
    },
    doctorVerified: false
  },
  {
    id: 'pat-002',
    patientId: 'MKP-2026-002',
    tokenNumber: 'AYUSH-044',
    abhaId: '33-8821-4920-1192',
    uhid: 'AIIA-DEL-2026-4401',
    name: 'Sunita Devi',
    age: 44,
    gender: 'female',
    mobile: '+91 94123 78901',
    email: 'sunita.devi@example.com',
    language: 'hi',
    careStream: 'ayurveda',
    department: 'Kayachikitsa & Shalya / AYUSH OPD',
    registeredAt: '2026-08-28 09:10 AM',
    status: 'ready_for_doctor',
    consentGiven: true,
    consentType: 'touch',
    consentTimestamp: '2026-08-28 09:11:40',
    symptoms: [
      {
        id: 'sym-201',
        name: 'Sandhivata (Bilateral Knee Joint Pain & Stiffness)',
        nameInSelectedLanguage: 'दोनों घुटनों में तेज दर्द, सूजन और सुबह की अकड़न',
        bodyPart: 'limbs',
        severity: 6,
        duration: '6 months',
        onset: 'gradual',
        character: 'Crepitus (Sandhisphutana), stiffness for 30 mins after waking, difficulty squatting',
        aggravatingFactors: 'Cold weather (Sheeta Vata), climbing stairs, standing for prolonged hours',
        relievingFactors: 'Warm fomentation (Swedana), resting with legs elevated',
        associatedSymptoms: ['Ajeerna (Bloating & indigestion)', 'Alpanidra (Disturbed sleep due to joint ache)', 'Constipation']
      }
    ],
    vitals: {
      bpSystolic: 124,
      bpDiastolic: 80,
      heartRate: 74,
      spO2: 98,
      temperature: 98.2,
      respiratoryRate: 16,
      weightKg: 64,
      heightCm: 156,
      bmi: 26.3,
      recordedAt: '09:14 AM'
    },
    pastIllnesses: ['Mild Hypothyroidism (diagnosed 2021)'],
    pastSurgeries: ['Cesarean section (2010)'],
    familyHistory: ['Mother had Osteoarthritis'],
    habits: {
      smoking: false,
      alcohol: false,
      tobacco: false,
      diet: 'Vegetarian, irregular meal timings'
    },
    currentMedications: [
      {
        id: 'med-21',
        name: 'Tab. Thyronorm 25mcg',
        dose: '25mcg',
        frequency: '1-0-0 (Fasting morning)',
        duration: 'Ongoing',
        isActive: true,
        source: 'patient_reported'
      },
      {
        id: 'med-22',
        name: 'Yograj Guggulu',
        dose: '2 tabs (500mg)',
        frequency: '1-0-1 (With warm water)',
        duration: '3 weeks',
        isActive: true,
        source: 'scanned_doc'
      }
    ],
    allergies: [],
    scannedDocuments: [
      {
        id: 'doc-21',
        fileName: 'Ayurveda_Prescription_Slip_2025.jpg',
        documentTitle: 'AYUSH Chikitsa OPD Prescription Slip',
        documentType: 'Classical Ayurvedic Prescription Slip',
        dateOfRecord: '12-Oct-2025',
        fileType: 'ayush_slip',
        imageUrl: 'https://images.unsplash.com/photo-1512290900672-1f00b7b6294d?auto=format&fit=crop&w=800&q=80',
        documentDate: '2025-10-12',
        providerName: 'Govt. Ayurvedic Dispensary, Varanasi',
        doctorName: 'Vaidya R. K. Shastri, BAMS, MD (Ayu)',
        extractedData: {
          hospitalOrClinic: 'Govt. Ayurvedic Dispensary, Varanasi',
          doctorName: 'Vaidya R. K. Shastri',
          date: '12-Oct-2025',
          diagnoses: ['Sandhivata (Janu Sandhi Osteoarthritis)', 'Agnimandya (Sluggish Digestion)'],
          medications: [
            { 
              name: 'Yograj Guggulu', 
              dose: '2 tabs (500mg)', 
              frequency: '1-0-1 (BD)', 
              duration: '1 month', 
              instructions: 'With warm water (Ushnodaka) post meals',
              adjustmentType: 'new_started',
              adjustmentNote: 'Initiated classic Shothahara & Vedana-shamaka Vata-pacifying formulation',
              verified: true 
            },
            { 
              name: 'Mahanarayana Taila', 
              dose: 'Ext application (10ml)', 
              frequency: 'Local Abhyanga + Swedana', 
              duration: '1 month', 
              instructions: 'Gentle warm massage over knees followed by hot fomentation',
              adjustmentType: 'new_started',
              adjustmentNote: 'Topical anti-inflammatory external oil',
              verified: true 
            },
            { 
              name: 'Dashamularishta', 
              dose: '15ml with equal water', 
              frequency: '1-0-1 (BD)', 
              duration: '1 month', 
              instructions: 'Twice daily after meals',
              adjustmentType: 'new_started',
              adjustmentNote: 'Deepana-Pachana & Vata-anulomana formulation',
              verified: true 
            }
          ],
          keyFindingsSummary: {
            medicationAdjustments: [
              {
                medicationName: 'Yograj Guggulu (500mg)',
                previousRegimen: 'OTC NSAID (Ibuprofen SOS)',
                newRegimen: '2 tablets BD with warm water',
                reason: 'Switched from NSAIDs to herbal anti-inflammatory to avoid gastric irritation',
                impact: 'moderate'
              },
              {
                medicationName: 'Mahanarayana Taila (Local)',
                previousRegimen: 'None',
                newRegimen: 'Daily local warm oil massage (Abhyanga)',
                reason: 'Targeted joint lubrication and stiffness reduction',
                impact: 'routine'
              }
            ],
            clinicalImpression: 'Vata-Pitta Prakriti with chronic Vata aggrevation in Janu Asthi-Sandhi. Responding favorably to combined internal-external AYUSH therapy.'
          },
          keyObservations: [
            'Prakriti Assessment: Vata-Pitta dominant',
            'Advised avoidance of Sheeta Ahara (cold drinks, nighttime curd, fermented foods)',
            'Recommended 15 minutes of non-weight-bearing knee mobilization exercises'
          ],
          confidenceScore: 0.96,
          ocrEngine: 'Gemini 3.5 AYUSH Multilingual OCR'
        },
        verifiedByPatient: true,
        staffVerified: true,
        staffVerifiedBy: 'Vaidya Assistant Rajesh Tiwari (AYUSH Node)',
        staffVerifiedAt: '2026-08-28 09:16 AM',
        staffNotes: 'Ayurvedic formulations and dosage regimens verified against dispensary register.'
      }
    ],
    ayushAssessment: {
      prakriti: {
        dominant: 'Vata-Pitta',
        vataScore: 68,
        pittaScore: 48,
        kaphaScore: 24
      },
      agni: 'Vishama (Irregular)',
      koshtha: 'Krura (Hard/Constipated)',
      aharaVihara: {
        dietType: 'Vegetarian',
        dominantRasaPreferences: ['Katu (Spicy)', 'Lavana (Salty)', 'Amla (Sour)'],
        waterIntake: '1-2 Litres (Mostly cold/room temp)',
        sleepQuality: 'Alpa (Disturbed/Insomnia)',
        bowelHabits: 'Irregular, dry stools, once every 2 days (Vibandha)',
        physicalActivity: 'Alpa (Sedentary)'
      },
      ashtavidhaParikshaNotes: {
        nadi: 'Vata-Pradhana (Sarpa Gati - rapid, irregular)',
        mutra: 'Prakrita (Normal straw colored, 4-5 times/day)',
        mala: 'Krura, Sashula Vibandha (Constipated with mild pain)',
        jihva: 'Sama (Mild white coating at base, indicating Ama)',
        shabda: 'Prakrita (Clear voice)',
        sparsha: 'Sheeta / Ruksha (Dry skin, cold limbs)',
        druk: 'Prakrita (Clear vision)',
        akruti: 'Madhyama (Medium built, slight central adiposity)'
      },
      suggestedPathyaApathya: {
        pathya: [
          'Ushnodaka (Warm water intake throughout the day)',
          'Ghee (Go-Ghrita in small quantities)',
          'Local Janu Basti / Patra Pinda Sweda fomentation',
          'Light digestible warm meals (Mudga Yusha, Khichadi with Jeera & Shunthi)',
          'Light joint mobilization yoga (Sukshma Vyayama)'
        ],
        apathya: [
          'Sheeta Ahara (Refrigerated food, ice creams, cold drinks)',
          'Dadhi (Curd at night), Chana, Rajma, Vatala foods',
          'Ratri Jagarana (Staying up late at night)',
          'Ati-Vyayama (Strenuous cross-legged sitting / excessive stairs)'
        ]
      }
    },
    timeline: [
      {
        id: 'tl-21',
        date: '2021-04-10',
        title: 'Hypothyroidism Diagnosis',
        category: 'diagnosis',
        hospitalOrDoctor: 'Govt. District Hospital',
        summary: 'TSH 6.8 mIU/L. Started on Thyronorm 25mcg.'
      },
      {
        id: 'tl-22',
        date: '2025-10-12',
        title: 'Ayurvedic OPD Evaluation - Sandhivata',
        category: 'ayush',
        hospitalOrDoctor: 'Govt. Ayurvedic Dispensary, Varanasi',
        summary: 'Diagnosed with Sandhivata and Agnimandya. Prescribed Yograj Guggulu & Mahanarayana Taila.'
      },
      {
        id: 'tl-23',
        date: '2026-08-28',
        title: 'Current Visit: Ayurvedic Pre-Consultation Intake',
        category: 'ayush',
        hospitalOrDoctor: 'AIIA AYUSH OPD MediKiosk',
        summary: 'Structured assessment of Prakriti (Vata-Pitta), Agni (Vishama), Koshtha (Krura), and bilateral Janu Sandhivata.'
      }
    ],
    triageRisk: 'STANDARD_OPD',
    redFlagsDetected: [],
    clinicalSummary: {
      executiveSummary: '44-year-old female presenting with 6-month history of bilateral Janu Sandhivata (Osteoarthritis of knees) with morning stiffness and crepitus, alongside Agnimandya (irregular digestion) and Vibandha (constipation). Prakriti assessment indicates Vata-Pitta dominance with Vata Vikriti.',
      chiefComplaintSummary: 'Bilateral knee pain with stiffness (Janu Sandhishula) × 6 months, aggravated by cold and climbing stairs, associated with constipation and indigestion.',
      historyOfPresentIllness: 'Gradual onset of pain in both knee joints for 6 months, worse in right knee. Patient experiences crepitus during flexion and difficulty squatting. Associated with sluggish metabolism, irregular appetite (Vishamagni), and hard stools.',
      pastMedicalSurgicalHistory: [
        'Hypothyroidism (Thyronorm 25mcg daily)',
        'Cesarean section (2010)'
      ],
      drugAllergyWarnings: {
        hasConflict: false,
        warningText: 'No documented drug allergies.'
      },
      timelineHighlights: [
        'Moderate relief reported during previous course of Yograj Guggulu in late 2025'
      ],
      triageAssessment: {
        riskLevel: 'STANDARD_OPD',
        reasoning: 'Non-emergency chronic musculoskeletal complaint with systemic Vata dosha vitiation.',
        redFlags: []
      },
      diagnosticHypothesesCDS: [
        {
          condition: 'Janu Sandhivata (Bilateral Primary Knee Osteoarthritis) with Sama Avastha',
          rationale: 'Clinical features of joint crepitus, stiffness, and Ama signs (coated tongue, sluggish bowels).',
          suggestedFocusExam: ['Examine knee swelling, local warmth, range of motion, crepitus on passive flexion', 'Check tongue coating for Ama status']
        }
      ],
      ayushHolisticSummary: {
        doshaImbalance: 'Vata Pradhana Pittanubandhi Vikriti with Kapha Kshaya in Sandhi (Shleshaka Kapha reduction)',
        agniKoshthaState: 'Vishamagni with Krura Koshtha and Sama Lakshana',
        chikitsaRecommendations: [
          'Deepana & Pachana (Shunthi-Musta Kwatha or Trikatu to clear Ama)',
          'Shothahara & Vedanashamaka Guggulu formulations (Punarnava Guggulu / Yograj Guggulu)',
          'Panchakarma: Janu Basti with Ksheerabala Taila / Dhanwantharam Taila, Patra Pinda Sweda',
          'Virechana / Nitya Mridu Anulomana (Gandharva Haritaki at bedtime for Krura Koshtha)'
        ]
      },
      recommendedActionsForDoctor: [
        'Confirm Ama vs Nirama state before initiating heavy Sneha (oil) therapies',
        'Consider digital bilateral knee X-ray (AP/Lateral weight-bearing) to assess joint space narrowing',
        'Prescribe Deepana-Pachana drugs followed by Vatashamaka Rasayana',
        'Advice tailored Ayurvedic lifestyle (Pathya Ahara & gentle knee strengthening asanas)'
      ],
      abdmFhirCode: 'FHIR-R4-AYUSH-CLINICAL-INTAKE-2026'
    },
    doctorVerified: false
  },
  {
    id: 'pat-003',
    patientId: 'MKP-2026-003',
    tokenNumber: 'OPD-108',
    abhaId: '74-1928-3920-5512',
    uhid: 'CIVIL-PUN-2026-3190',
    name: 'Priya Sharma',
    age: 28,
    gender: 'female',
    mobile: '+91 97654 32198',
    email: 'priya.sharma@example.com',
    language: 'en',
    careStream: 'allopathy',
    department: 'Pulmonology & Respiratory Medicine',
    registeredAt: '2026-08-28 09:35 AM',
    status: 'ready_for_doctor',
    consentGiven: true,
    consentType: 'digital_signature',
    consentTimestamp: '2026-08-28 09:37:12',
    symptoms: [
      {
        id: 'sym-301',
        name: 'Productive Cough with Mucopurulent Sputum',
        bodyPart: 'throat',
        severity: 7,
        duration: '8 days',
        onset: 'gradual',
        character: 'Spasmodic bouts of coughing, yellowish-green sputum, audible wheezing',
        aggravatingFactors: 'Night time, lying flat, dust, cold air',
        relievingFactors: 'Steam inhalation, hot beverages',
        associatedSymptoms: ['Low-grade evening fever (100.2°F)', 'Throat irritation', 'Chest soreness on coughing']
      }
    ],
    vitals: {
      bpSystolic: 118,
      bpDiastolic: 76,
      heartRate: 88,
      spO2: 97,
      temperature: 100.2,
      respiratoryRate: 18,
      weightKg: 52,
      heightCm: 162,
      bmi: 19.8,
      recordedAt: '09:40 AM'
    },
    pastIllnesses: ['Childhood Bronchial Asthma (quiescent for 5 years)', 'Allergic Rhinitis'],
    pastSurgeries: [],
    familyHistory: ['Mother has Asthma'],
    habits: {
      smoking: false,
      alcohol: false,
      tobacco: false,
      diet: 'Vegetarian'
    },
    currentMedications: [
      {
        id: 'med-31',
        name: 'Tab. Levocetirizine 5mg',
        dose: '5mg',
        frequency: '0-0-1 (Night)',
        duration: '5 days',
        isActive: true,
        source: 'patient_reported'
      }
    ],
    allergies: [
      {
        id: 'alg-31',
        substance: 'Penicillins / Amoxicillin',
        reactionType: 'Acute urticaria, facial angioedema, bronchospasm',
        severity: 'severe'
      }
    ],
    scannedDocuments: [
      {
        id: 'doc-31',
        fileName: 'Local_Clinic_Handwritten_Prescription.jpg',
        documentTitle: 'City Polyclinic Acute Care Rx',
        documentType: 'Handwritten Outpatient Slip',
        dateOfRecord: '25-Aug-2026',
        fileType: 'prescription',
        imageUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80',
        documentDate: '2026-08-25',
        providerName: 'City Polyclinic, Central Hub',
        doctorName: 'Dr. R. Mehta, MBBS',
        extractedData: {
          hospitalOrClinic: 'City Polyclinic',
          doctorName: 'Dr. R. Mehta',
          date: '25-Aug-2026',
          diagnoses: ['Acute Bronchitis', 'Upper Respiratory Tract Infection', 'Penicillin Allergy Conflict'],
          medications: [
            { 
              name: 'Cap. Amoxicillin + Clavulanic Acid 625mg', 
              dose: '625mg', 
              frequency: '1-0-1', 
              duration: '5 days', 
              instructions: 'CONTRAINDICATED / NOT DISPENSED - Penicillin Allergy',
              adjustmentType: 'discontinued',
              adjustmentNote: 'Flagged and intercepted by Kiosk OCR safety validation engine',
              verified: true
            },
            { 
              name: 'Syrup Ascoril D', 
              dose: '10ml', 
              frequency: '1-1-1 (TDS)', 
              duration: '5 days',
              instructions: 'Post meals with warm water',
              adjustmentType: 'new_started',
              adjustmentNote: 'Symptomatic antitussive therapy for dry cough',
              verified: true
            },
            {
              name: 'Tab. Azithromycin 500mg',
              dose: '500mg',
              frequency: '1-0-0 (OD)',
              duration: '3 days',
              instructions: 'Safe non-beta-lactam alternative recommended',
              adjustmentType: 'new_started',
              adjustmentNote: 'Macrolide alternative for bacterial bronchitis coverage in penicillin-allergic patient',
              verified: true
            }
          ],
          keyFindingsSummary: {
            medicationAdjustments: [
              {
                medicationName: 'Cap. Amoxicillin-Clavulanate 625mg',
                previousRegimen: 'Prescription Attempted',
                newRegimen: 'DISCONTINUED / BLOCKED',
                reason: 'Documented severe anaphylactoid allergy to Penicillin class',
                impact: 'critical'
              },
              {
                medicationName: 'Tab. Azithromycin 500mg (Alternative)',
                previousRegimen: 'None',
                newRegimen: '1 tab OD for 3 days',
                reason: 'Safe macrolide substitute avoiding beta-lactam cross-reactivity',
                impact: 'critical'
              },
              {
                medicationName: 'Syrup Ascoril D (10ml)',
                previousRegimen: 'None',
                newRegimen: '10ml TDS',
                reason: 'Cough reflex suppression',
                impact: 'routine'
              }
            ],
            clinicalImpression: 'Acute Bronchial inflammation with allergic hypersensitivity safeguard alert triggered.',
            drugInteractionsFlagged: [
              '🚨 CRITICAL CONTRAINDICATION: Beta-lactam antibiotic (Amoxicillin) blocked due to history of facial angioedema'
            ]
          },
          keyObservations: [
            '⚠️ CRITICAL ALLERGY INTERACTION: Doctor initially wrote Amoxicillin-Clavulanate; patient flagged penicillin anaphylaxis',
            'Patient advised to maintain hydration and avoid cold exposure'
          ],
          confidenceScore: 0.97,
          ocrEngine: 'Gemini 3.5 Multimodal Safety Engine'
        },
        verifiedByPatient: true,
        staffVerified: true,
        staffVerifiedBy: 'Sister Meena Kurup, Senior Triage Nurse',
        staffVerifiedAt: '2026-08-28 09:44 AM',
        staffNotes: 'Crucial allergy alert verified with patient and flagged in EMR.'
      }
    ],
    timeline: [
      {
        id: 'tl-31',
        date: '2020-02-14',
        title: 'Severe Penicillin Anaphylactoid Reaction',
        category: 'hospitalization',
        hospitalOrDoctor: 'Emergency Department, Civil Hospital',
        summary: 'Developed generalized hives, lip swelling, and wheezing 30 mins after oral Amoxicillin. Required IV Hydrocortisone & Epinephrine.'
      },
      {
        id: 'tl-32',
        date: '2026-08-25',
        title: 'Local Clinic Visit - Prescription Interception',
        category: 'prescription',
        hospitalOrDoctor: 'City Polyclinic',
        summary: 'Prescribed Amox-Clav 625mg. Patient did not consume due to allergy awareness.'
      },
      {
        id: 'tl-33',
        date: '2026-08-28',
        title: 'Current Visit: Pulmonology Pre-Consultation',
        category: 'diagnosis',
        hospitalOrDoctor: 'Civil Hospital OPD MediKiosk',
        summary: '8 days productive cough with fever 100.2°F, SpO2 97%. Penicillin allergy highlighted with high priority.'
      }
    ],
    triageRisk: 'URGENT_PRIORITY',
    redFlagsDetected: [
      '⚠️ Severe documented Penicillin / Beta-lactam anaphylaxis history',
      '⚠️ Active fever (100.2°F) with purulent sputum and reactive airway wheezing'
    ],
    clinicalSummary: {
      executiveSummary: '28-year-old female with childhood asthma presenting with 8-day history of acute purulent bronchitis, low-grade fever (100.2°F), and wheezing. CRITICAL: Confirmed severe Type I hypersensitivity to Penicillins/Amoxicillin (angioedema/bronchospasm history).',
      chiefComplaintSummary: 'Productive cough with yellow-green sputum × 8 days, low-grade evening fever, nocturnal wheezing.',
      historyOfPresentIllness: 'Began 8 days ago as nasal congestion and sore throat, progressed to chest congestion and paroxysmal cough with mucopurulent expectoration. Associated with low-grade pyrexia and mild exertional dyspnea.',
      pastMedicalSurgicalHistory: [
        'Childhood Asthma (inactive since age 23)',
        'Allergic Rhinitis'
      ],
      drugAllergyWarnings: {
        hasConflict: true,
        warningText: 'CRITICAL SAFETY ALERT: Severe Type-I Penicillin/Beta-Lactam Allergy (Past Epinephrine use). DO NOT PRESCRIBE Amoxicillin, Ampicillin, Piperacillin, or first-generation Cephalosporins without extreme caution.',
        conflictingDrugs: ['Penicillin', 'Amoxicillin-Clavulanate', 'Ampicillin']
      },
      timelineHighlights: [
        '2020 ER visit for Penicillin angioedema',
        '25-Aug-2026: Amoxicillin prescription avoided by patient'
      ],
      triageAssessment: {
        riskLevel: 'URGENT_PRIORITY',
        reasoning: 'Infective bronchitis with reactive airway exacerbation requiring non-penicillin antimicrobial and bronchodilator coverage.',
        redFlags: ['Documented Penicillin allergy safety flag', 'Pyrexia with purulent sputum']
      },
      diagnosticHypothesesCDS: [
        {
          condition: 'Acute Infective Bronchitis with Mild Asthma Exacerbation',
          rationale: 'Purulent sputum, fever, past atopic asthma background, normal SpO2 97%.',
          suggestedFocusExam: ['Chest auscultation for bilateral polyphonic expiratory wheezes and coarse crepitations', 'Check peak expiratory flow rate (PEFR)']
        },
        {
          condition: 'Atypical Community-Acquired Pneumonia (Differential)',
          rationale: 'Prolonged fever and persistent cough. Check for localized bronchial breathing or crackles.',
          suggestedFocusExam: ['Auscultate lung bases', 'Consider Chest X-Ray PA view if focal signs present']
        }
      ],
      recommendedActionsForDoctor: [
        'Strictly record Penicillin Allergy in Electronic Health Record / ABDM profile',
        'Consider Macrolide (e.g. Tab. Azithromycin 500mg OD × 3 days or Clarithromycin 500mg BD × 5 days) or Doxycycline as safe alternative antimicrobials',
        'Inhaled Bronchodilator (e.g., Levosalbutamol + Ipratropium MDI with spacer)',
        'Antipyretic (Tab. Paracetamol 650mg SOS for fever > 100°F)'
      ],
      abdmFhirCode: 'FHIR-R4-PULMONARY-BRONCHITIS-2026'
    },
    doctorVerified: false
  }
];
