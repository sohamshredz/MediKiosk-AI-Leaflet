export type UserRole = 
  | 'patient' 
  | 'doctor' 
  | 'medical_officer' 
  | 'triage_nurse' 
  | 'admin' 
  | 'abdm_officer'
  | 'PATIENT' 
  | 'DOCTOR' 
  | 'NURSE' 
  | 'ADMIN' 
  | null;

export interface AuthSession {
  role: 'patient' | 'doctor' | 'medical_officer' | 'triage_nurse' | 'admin' | 'abdm_officer';
  userId: string;
  userName: string;
  patientId?: string;
  staffCode?: string;
  roleTitle?: string;
  department?: string;
  token: string;
  loginTime: string;
}

export type SupportedLanguage = 
  | 'en' // English
  | 'hi' // Hindi (हिंदी)
  | 'mr' // Marathi (मराठी)
  | 'ta' // Tamil (தமிழ்)
  | 'te' // Telugu (తెలుగు)
  | 'bn' // Bengali (বাংলা)
  | 'gu' // Gujarati (ગુજરાતી)
  | 'kn' // Kannada (ಕನ್ನಡ)
  | 'ml' // Malayalam (മലയാളം)
  | 'pa'; // Punjabi (ਪੰਜਾਬੀ)

export type CareStream = 'allopathy' | 'ayurveda' | 'integrated';

export type TriageRiskLevel = 'CRITICAL_EMERGENCY' | 'URGENT_PRIORITY' | 'STANDARD_OPD' | 'ROUTINE';

export type PatientStatus = 
  | 'intake_in_progress' 
  | 'waiting_triage' 
  | 'ready_for_doctor' 
  | 'in_consultation' 
  | 'consultation_completed';

export interface SymptomItem {
  id: string;
  name: string;
  nameInSelectedLanguage?: string;
  bodyPart: string;
  severity: number; // 1 to 10
  duration: string; // e.g. "3 days", "2 weeks"
  onset: 'sudden' | 'gradual';
  character?: string; // e.g. "sharp", "throbbing", "dull ache", "burning", "tightness"
  aggravatingFactors?: string;
  relievingFactors?: string;
  associatedSymptoms?: string[];
}

export interface PatientVitals {
  bpSystolic?: number;
  bpDiastolic?: number;
  heartRate?: number;
  spO2?: number;
  temperature?: number; // in °F
  respiratoryRate?: number;
  bloodSugar?: number; // mg/dL
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
  recordedAt?: string;
}

export interface ScannedDocument {
  id: string;
  fileName: string;
  documentTitle?: string;
  documentType?: string;
  dateOfRecord?: string;
  fileType: 'prescription' | 'lab_report' | 'imaging' | 'discharge_summary' | 'ayush_slip';
  imageUrl: string;
  documentDate: string;
  providerName?: string;
  doctorName?: string;
  extractedData?: {
    hospitalOrClinic?: string;
    doctorName?: string;
    date?: string;
    diagnoses?: string[];
    medications?: {
      name: string;
      dose: string;
      frequency: string;
      duration?: string;
      instructions?: string;
      adjustmentType?: 'dose_escalation' | 'switched' | 'new_started' | 'discontinued' | 'maintained';
      adjustmentNote?: string;
      verified?: boolean;
    }[];
    labResults?: {
      testName: string;
      value: string | number;
      unit: string;
      referenceRange: string;
      status: 'normal' | 'high' | 'low' | 'critical';
      clinicalImpact?: string;
      verified?: boolean;
    }[];
    imagingFindings?: string;
    keyObservations?: string[];
    keyFindingsSummary?: {
      medicationAdjustments?: {
        medicationName: string;
        previousRegimen?: string;
        newRegimen: string;
        reason: string;
        impact: 'critical' | 'moderate' | 'routine';
      }[];
      abnormalLabValues?: {
        parameter: string;
        value: string;
        reference: string;
        severity: 'critical' | 'high' | 'low';
        clinicalImplication: string;
      }[];
      clinicalImpression?: string;
      drugInteractionsFlagged?: string[];
    };
    confidenceScore?: number;
    ocrEngine?: string;
  };
  verifiedByPatient?: boolean;
  staffVerified?: boolean;
  staffVerifiedBy?: string;
  staffVerifiedAt?: string;
  staffNotes?: string;
}

export interface Medication {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  duration?: string;
  prescribedBy?: string;
  prescribedDate?: string;
  isActive: boolean;
  source?: 'patient_reported' | 'scanned_doc' | 'hospital_records';
}

export interface Allergy {
  id: string;
  substance: string; // e.g. "Penicillin", "Sulfa drugs", "Peanuts"
  reactionType: string; // e.g. "Anaphylaxis", "Urticaria/Rash", "Shortness of breath"
  severity: 'mild' | 'moderate' | 'severe';
}

export interface AyushAssessment {
  prakriti: {
    dominant: 'Vata' | 'Pitta' | 'Kapha' | 'Vata-Pitta' | 'Pitta-Kapha' | 'Vata-Kapha' | 'Tridosha';
    vataScore: number;
    pittaScore: number;
    kaphaScore: number;
  };
  agni: 'Manda (Low)' | 'Tikshna (Intense)' | 'Vishama (Irregular)' | 'Sama (Balanced)';
  koshtha: 'Krura (Hard/Constipated)' | 'Mridu (Soft/Frequent)' | 'Madhyama (Regular)';
  aharaVihara: {
    dietType: 'Vegetarian' | 'Non-Vegetarian' | 'Vegan' | 'Eggetarian';
    dominantRasaPreferences: string[]; // e.g. ["Madhura (Sweet)", "Lavana (Salty)", "Katu (Spicy)"]
    waterIntake: string; // e.g. "1-2 Litres", "3+ Litres"
    sleepQuality: 'Gadha (Deep)' | 'Alpa (Disturbed/Insomnia)' | 'Khandita (Broken)';
    bowelHabits: string;
    physicalActivity: 'Alpa (Sedentary)' | 'Madhyama (Moderate)' | 'Vyayama (Active)';
  };
  ashtavidhaParikshaNotes?: {
    nadi?: string;
    mutra?: string;
    mala?: string;
    jihva?: string; // e.g. "Sama (Coated)", "Nirama (Clean)"
    shabda?: string;
    sparsha?: string;
    druk?: string;
    akruti?: string;
  };
  suggestedPathyaApathya?: {
    pathya: string[]; // Recommended diet/habits
    apathya: string[]; // Foods/habits to avoid
  };
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  category: 'prescription' | 'lab_report' | 'surgery' | 'hospitalization' | 'diagnosis' | 'ayush';
  hospitalOrDoctor: string;
  summary: string;
  keyDetails?: string[];
  documentId?: string;
}

export interface ClinicalSummary {
  executiveSummary: string;
  chiefComplaintSummary: string;
  historyOfPresentIllness: string;
  pastMedicalSurgicalHistory: string[];
  drugAllergyWarnings: {
    hasConflict: boolean;
    warningText?: string;
    conflictingDrugs?: string[];
  };
  timelineHighlights: string[];
  triageAssessment: {
    riskLevel: TriageRiskLevel;
    reasoning: string;
    redFlags: string[];
  };
  diagnosticHypothesesCDS: {
    condition: string;
    rationale: string;
    suggestedFocusExam: string[];
  }[];
  ayushHolisticSummary?: {
    doshaImbalance: string;
    agniKoshthaState: string;
    chikitsaRecommendations: string[];
  };
  recommendedActionsForDoctor: string[];
  abdmFhirCode?: string;
}

export interface SavedOpdToken {
  id: string;
  tokenNumber: string; // e.g. "OPD-104"
  uhid: string;
  patientName: string;
  department: string;
  careStream: CareStream;
  roomNumber?: string;
  estimatedWaitMinutes?: number;
  triageRisk: TriageRiskLevel;
  issuedAt: string;
  status: 'active' | 'called' | 'completed' | 'cancelled';
  complaintsSummary?: string;
  vitalsSummary?: string;
  doctorName?: string;
  scannedDocsCount?: number;
  qrPayload?: string;
}

export interface PatientProfile {
  id: string;
  patientId?: string; // Permanent MediKiosk ID: MKP-2026-XXXXXXXX
  tokenNumber: string; // e.g. "OPD-104"
  abhaId?: string; // e.g. "91-4829-1029-4820"
  uhid: string; // e.g. "UHID-2026-9812"
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  mobile: string;
  email?: string;
  language: SupportedLanguage;
  careStream: CareStream;
  registeredAt: string;
  status: PatientStatus;
  department: string; // e.g. "General Medicine", "Cardiology", "Kayachikitsa (Ayurveda)", "Pulmonology"
  address?: string;
  bloodGroup?: string; // e.g. "O+", "B+", "A-", etc.
  
  // Consent
  consentGiven: boolean;
  consentType: 'voice' | 'touch' | 'digital_signature';
  consentTimestamp: string;
  
  // Clinical data
  symptoms: SymptomItem[];
  vitals: PatientVitals;
  pastIllnesses: string[];
  pastSurgeries: string[];
  familyHistory: string[];
  habits: {
    smoking: boolean;
    alcohol: boolean;
    tobacco: boolean;
    diet: string;
  };
  currentMedications: Medication[];
  allergies: Allergy[];
  scannedDocuments: ScannedDocument[];
  timeline: TimelineEvent[];
  ayushAssessment?: AyushAssessment;
  
  // AI Generated Summaries
  triageRisk: TriageRiskLevel;
  redFlagsDetected: string[];
  clinicalSummary?: ClinicalSummary;
  
  // OPD Tokens & Queue Passes
  savedTokens?: SavedOpdToken[];
  
  // Doctor Verification & Notes
  doctorVerified: boolean;
  doctorNotes?: {
    verifiedAt?: string;
    verifiedByDoctorName?: string;
    customDoctorDiagnosis?: string;
    doctorPrescription?: {
      medicineName: string;
      dosage: string;
      timing: string;
      days: number;
    }[];
    doctorAdvice?: string;
    followUpInDays?: number;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'patient';
  text: string;
  audioAvailable?: boolean;
  timestamp: string;
  suggestedQuickReplies?: string[];
  extractedInsight?: string;
  isRedFlag?: boolean;
  isEducationalOrOffTopic?: boolean;
  isReadyForReview?: boolean;
  isErrorFallback?: boolean;
  extractedData?: {
    chiefComplaint?: string;
    bodyPart?: string;
    severity?: number;
    duration?: string;
    onset?: string;
    associatedSymptoms?: string[];
    pastIllnessesFound?: string[];
    medicationsFound?: string[];
    allergiesFound?: string[];
    triageUrgency?: string;
    doctorNotes?: string;
  };
}

export interface ConsultationRecord {
  id: string;
  patientId: string;
  patientName: string;
  uhid?: string;
  tokenNumber?: string;
  careStream: CareStream;
  language: SupportedLanguage;
  startedAt: string;
  completedAt?: string;
  status: 'draft' | 'in_progress' | 'ready_for_review' | 'confirmed' | 'completed';
  conversation: ChatMessage[];
  symptoms: SymptomItem[];
  pastIllnesses: string[];
  currentMedications: { name: string; dose?: string; frequency?: string }[];
  knownAllergies: string[];
  redFlagsDetected: string[];
  triageRisk: TriageRiskLevel;
  clinicalSummary?: ClinicalSummary;
  patientConfirmedAt?: string;
  doctorNotes?: {
    verifiedAt?: string;
    verifiedByDoctorName?: string;
    customDoctorDiagnosis?: string;
    doctorPrescription?: {
      medicineName: string;
      dosage: string;
      timing: string;
      days: number;
    }[];
    doctorAdvice?: string;
    followUpInDays?: number;
  };
}

export type AppointmentStatus = 
  | 'confirmed' 
  | 'in_queue' 
  | 'intake_completed' 
  | 'consultation_done' 
  | 'cancelled';

export type PrescriptionStatus = 
  | 'PROCESSING'
  | 'OCR_COMPLETED'
  | 'NEEDS_REVIEW'
  | 'PATIENT_VERIFIED'
  | 'DOCTOR_REVIEWED'
  | 'ARCHIVED';

export interface PrescriptionMedication {
  id: string;
  prescriptionId?: string;
  medicineName: string;
  strength: string; // e.g. "500 mg", "10 mg", or "Unclear"
  dosage: string; // e.g. "1 tablet", "1 capsule", "5 ml"
  frequency: string; // e.g. "Twice daily", "1-0-1", "TDS", "OD"
  duration: string; // e.g. "5 days", "1 month", "Ongoing"
  route?: string; // e.g. "Oral", "Topical", "Inhalation", "IV/IM"
  timing?: string; // e.g. "Morning & Night", "Before breakfast", "Bedtime"
  foodInstruction?: string; // e.g. "After food", "Before food", "With meals", "Empty stomach"
  specialInstruction?: string; // e.g. "Take with plenty of water", "Avoid dairy"
  confidenceScore: number; // 0 - 100 percentage
  isLowConfidence?: boolean;
  patientVerified: boolean;
  notes?: string;
  createdAt?: string;
}

export interface PrescriptionAuditLog {
  id: string;
  userId: string;
  userRole: UserRole;
  userName: string;
  action: 
    | 'PRESCRIPTION_UPLOADED'
    | 'OCR_STARTED'
    | 'OCR_COMPLETED'
    | 'AI_EXTRACTION_COMPLETED'
    | 'PATIENT_EDITED'
    | 'PATIENT_VERIFIED'
    | 'DOCTOR_VIEWED'
    | 'DOCTOR_REVIEWED'
    | 'DOCUMENT_ACCESSED'
    | 'PRESCRIPTION_UPDATED';
  resourceType: 'prescription';
  resourceId: string;
  timestamp: string;
  note?: string;
}

export interface PrescriptionRecord {
  id: string;
  patientId: string;
  patientName?: string;
  uhid?: string;
  doctorId?: string;
  doctorName?: string;
  hospitalId?: string;
  hospitalName?: string;
  prescriptionDate: string; // YYYY-MM-DD or formatted date string
  sourceType: 'camera' | 'upload_image' | 'upload_pdf';
  originalFileUrl: string; // Base64 data URL or private storage reference
  fileName?: string;
  fileMimeType?: string;
  fileSizeBytes?: number;
  pagesCount?: number;
  ocrText?: string;
  medications: PrescriptionMedication[];
  diagnosis?: string;
  symptoms?: string;
  recommendedTests?: string[];
  followUpDate?: string;
  generalAdvice?: string;
  verificationStatus: PrescriptionStatus;
  overallConfidence: number; // 0 - 100
  hasLowConfidenceFields: boolean;
  patientVerifiedAt?: string;
  doctorReviewedBy?: string;
  doctorReviewedAt?: string;
  doctorClinicalNotes?: string;
  auditLogs: PrescriptionAuditLog[];
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  tokenNumber: string; // e.g. "OPD-102"
  uhid: string;
  department: string;
  doctorName: string;
  doctorSpecialty: string;
  careStream: CareStream;
  date: string; // e.g. "2026-08-28"
  timeSlot: string; // e.g. "09:30 AM - 10:00 AM"
  status: AppointmentStatus;
  roomNumber: string; // e.g. "Room 04 (General Medicine)"
  queuePosition?: number;
  currentServingToken?: string;
  estimatedWaitMinutes?: number;
  chiefComplaint?: string;
  abhaLinked: boolean;
  bookedAt: string;
  bookingType: 'online_portal' | 'kiosk_walkin' | 'doctor_referral';
  doctorDiagnosis?: string;
  doctorPrescription?: {
    medicineName: string;
    dosage: string;
    timing: string;
    days: number;
  }[];
  doctorAdvice?: string;
  followUpDate?: string;
}

// ==========================================
// MEDICAL HISTORY & 1-YEAR CLINICAL SUMMARY
// ==========================================

export type MedicalConditionCategory =
  | 'Prescription & Active Medications'
  | 'Skin diseases / Dermatology'
  | 'Infectious diseases'
  | 'Autoimmune & inflammatory diseases'
  | 'Cancer / Oncology'
  | 'Heart & cardiovascular'
  | 'Diabetes & endocrine'
  | 'Respiratory / Lung'
  | 'Neurological'
  | 'Kidney / Renal'
  | 'Liver / Hepatobiliary'
  | 'Gastrointestinal / Digestive'
  | 'Bone, joint & musculoskeletal'
  | 'Blood / Hematology'
  | 'Mental health'
  | 'Eye / Ophthalmology'
  | 'Ear, Nose & Throat'
  | 'Dental / Oral health'
  | 'Gynecology / Women\'s health'
  | 'Urology / Men\'s health'
  | 'Reproductive health'
  | 'Genetic / Congenital conditions'
  | 'Surgery / Major procedures'
  | 'Hospitalization history'
  | 'Other medical conditions'
  | 'No significant medical history'
  | 'Not sure';

export interface MedicalHistoryDocument {
  id: string;
  patientId: string; // Permanent MediKiosk Patient ID
  historyId?: string;
  fileName: string;
  fileType: 'pdf' | 'image' | 'prescription' | 'lab_report' | 'discharge_summary' | 'scan' | 'doctor_note' | 'other';
  storagePath?: string;
  fileDataUrl?: string;
  documentType: string;
  documentDate: string;
  extractedText?: string;
  extractionStatus: 'pending' | 'completed' | 'failed' | 'patient_confirmed';
  extractedData?: {
    patientName?: string;
    hospitalOrClinic?: string;
    doctorName?: string;
    documentType?: string;
    documentDate?: string;
    diagnoses?: string[];
    symptoms?: string[];
    medications?: {
      name: string;
      dose?: string;
      frequency?: string;
      duration?: string;
    }[];
    labResults?: {
      testName: string;
      value: string | number;
      unit?: string;
      referenceRange?: string;
      status?: 'normal' | 'high' | 'low' | 'critical';
    }[];
    surgeriesOrProcedures?: string[];
    hospitalizationDetails?: string;
    keyFindings?: string[];
  };
  confirmedByPatient: boolean;
  uploadedAt: string;
}

export interface MedicalConditionRecord {
  id: string;
  patientId: string; // Permanent MediKiosk Patient ID
  category: MedicalConditionCategory;
  conditionName: string;
  description?: string;
  onsetDate: string; // approximate date or YYYY-MM
  isStillPresent: 'Yes' | 'No' | 'Not sure';
  treatmentReceived?: string;
  hospitalOrDoctor?: string;
  additionalNotes?: string;
  sourceType: 'patient_entered' | 'voice_intake' | 'document_ocr' | 'hospital_records';
  sourceDocumentId?: string;
  sourceDocumentName?: string;
  isWithinPastYear: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PatientOneYearSummary {
  id: string;
  patientId: string; // Permanent MediKiosk Patient ID
  uhid: string;
  patientName: string;
  age: number;
  gender: string;
  bloodGroup?: string;
  preferredLanguage: string;
  summaryPeriodStart: string; // Today - 365 days
  summaryPeriodEnd: string; // Today
  executiveSummary: string;
  keyConditions: {
    condition: string;
    category: string;
    status: string;
    onsetDate: string;
    isPastYear: boolean;
  }[];
  currentMedications: {
    name: string;
    dosage?: string;
    frequency?: string;
    prescribedFor?: string;
  }[];
  allergies: {
    substance: string;
    reaction?: string;
    severity?: string;
  }[];
  importantEventsLast12Months: {
    date: string;
    title: string;
    type: string;
    summary: string;
    sourceDocumentId?: string;
    sourceDocumentName?: string;
  }[];
  labHighlights: {
    testName: string;
    value: string;
    date: string;
    isAbnormal: boolean;
    implication?: string;
    sourceDocumentId?: string;
  }[];
  abnormalAttentionItems: string[];
  recentConsultations: {
    date: string;
    doctorName?: string;
    department?: string;
    summary: string;
  }[];
  triageSafetySummary: {
    riskLevel: TriageRiskLevel;
    redFlags: string[];
    notes?: string;
  };
  ayushSummary?: {
    prakriti?: string;
    doshaImbalance?: string;
    recommendations?: string[];
  };
  olderHistoryHighlights: string[];
  generatedAt: string;
  updatedAt: string;
  sourceRecordCount: number;
  isAiAssisted: true;
  disclaimer: 'AI-assisted summary — clinician verification required.';
}

// ==========================================
// HOSPITAL STAFF & HIS ADMINISTRATION TYPES
// ==========================================

export type StaffClinicalRole = 'doctor' | 'medical_officer' | 'triage_nurse';
export type StaffAccountStatus = 'active' | 'suspended' | 'deactivated';

export interface HospitalStaffMember {
  id: string;
  staffId: string; // e.g. DOC-AIIMS-04, MO-DELHI-09, NURSE-01
  fullName: string;
  role: StaffClinicalRole;
  roleTitle: string;
  department: string;
  specialization: string;
  registrationNumber: string; // Medical Council / Nursing Council Reg No
  employeeCode: string;
  mobile: string;
  email: string;
  qualification: string;
  joiningDate: string;
  roomNumber?: string; // OPD Chamber / Room (e.g. Room 104)
  opdTimings?: string; // Consultation Hours (e.g. 09:00 AM - 01:00 PM)
  consultationFee?: number; // Fee in INR (e.g. 0 for government, 500 for private)
  availableDays?: string[] | string; // e.g. ["Mon", "Tue", "Wed", "Thu", "Fri"]
  bio?: string;
  status: StaffAccountStatus;
  statusReason?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemAuditLog {
  id: string;
  timestamp: string;
  adminId: string;
  adminName: string;
  actionType: 
    | 'STAFF_CREATED'
    | 'STAFF_UPDATED'
    | 'STAFF_PIN_RESET'
    | 'STAFF_STATUS_CHANGED'
    | 'PATIENT_UPDATED'
    | 'PATIENT_DELETED'
    | 'SYSTEM_CONFIG_UPDATED';
  targetType: 'STAFF' | 'PATIENT' | 'SYSTEM';
  targetId: string;
  targetName?: string;
  details: string;
  metadata?: Record<string, any>;
}

export interface AdminSystemMetrics {
  totalPatients: number;
  activeDoctors: number;
  activeMedicalOfficers: number;
  activeTriageNurses: number;
  todayAppointments: number;
  waitingIntakeCount: number;
  activeOpdCount: number;
  sosAlertCount: number;
}

export interface OpdAppointment {
  id: string;
  patientId: string;
  patientName: string;
  uhid: string;
  tokenNumber: string;
  department: string;
  doctorStaffId: string;
  doctorName: string;
  date: string;
  timeSlot: string;
  status: 'Scheduled' | 'Waiting' | 'In Consultation' | 'Completed' | 'Cancelled';
  cancellationReason?: string;
  reassignedFrom?: string;
  notes?: string;
}

export interface HospitalSystemConfig {
  hospitalName: string;
  hospitalCode: string;
  opdTimings: string;
  emergencyContactNumber: string;
  ambulanceSosNumber: string;
  availableDepartments: string[];
  abdmFacilityId: string;
  updatedAt: string;
}


