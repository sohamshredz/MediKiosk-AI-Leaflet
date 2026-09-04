import { PrescriptionRecord, PrescriptionMedication, PrescriptionAuditLog, UserRole } from '../types';
import { SAMPLE_PRESCRIPTIONS } from '../data/samplePrescriptions';
import { supabase, savePrescriptionToSupabase } from './supabaseClient';

const STORAGE_KEY = 'medikiosk_prescriptions_v1';

/**
 * Loads all prescription records from local cache, seeding sample data if empty.
 */
export function loadPrescriptionsFromStorage(): PrescriptionRecord[] {
  if (typeof window === 'undefined') return SAMPLE_PRESCRIPTIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_PRESCRIPTIONS));
      return SAMPLE_PRESCRIPTIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return SAMPLE_PRESCRIPTIONS;
  } catch (err) {
    console.warn('Failed to parse prescriptions from local storage, fallback to sample data', err);
    return SAMPLE_PRESCRIPTIONS;
  }
}

/**
 * Saves all prescription records to local cache.
 */
export function savePrescriptionsToStorage(prescriptions: PrescriptionRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prescriptions));
  } catch (err) {
    console.error('Error saving prescriptions to local cache', err);
  }
}

/**
 * Gets all prescriptions for a specific patient.
 */
export function getPrescriptionsForPatient(patientId: string): PrescriptionRecord[] {
  const all = loadPrescriptionsFromStorage();
  return all.filter(p => p.patientId === patientId);
}

/**
 * Gets a single prescription by ID.
 */
export function getPrescriptionById(prescriptionId: string): PrescriptionRecord | null {
  const all = loadPrescriptionsFromStorage();
  return all.find(p => p.id === prescriptionId) || null;
}

/**
 * Saves or updates a prescription, generating an audit log entry.
 */
export async function saveOrUpdatePrescription(
  prescription: PrescriptionRecord,
  user: { id: string; role: UserRole; name: string },
  actionType: PrescriptionAuditLog['action'] = 'PRESCRIPTION_UPDATED',
  actionNote?: string
): Promise<{ success: boolean; prescription: PrescriptionRecord; error?: string }> {
  try {
    const all = loadPrescriptionsFromStorage();
    const existingIndex = all.findIndex(p => p.id === prescription.id);

    const now = new Date().toISOString();

    const auditEntry: PrescriptionAuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      userId: user.id,
      userRole: user.role,
      userName: user.name,
      action: actionType,
      resourceType: 'prescription',
      resourceId: prescription.id,
      timestamp: now,
      note: actionNote || `Prescription ${actionType.toLowerCase().replace(/_/g, ' ')} by ${user.name}`
    };

    const updatedRecord: PrescriptionRecord = {
      ...prescription,
      updatedAt: now,
      auditLogs: [...(prescription.auditLogs || []), auditEntry]
    };

    let updatedList: PrescriptionRecord[];
    if (existingIndex >= 0) {
      updatedList = [...all];
      updatedList[existingIndex] = updatedRecord;
    } else {
      updatedList = [updatedRecord, ...all];
    }

    savePrescriptionsToStorage(updatedList);

    // Sync to Supabase cloud database in background
    try {
      savePrescriptionToSupabase(updatedRecord);
    } catch (dbErr) {
      console.warn('Supabase prescription sync deferred:', dbErr);
    }

    // Also attempt remote Express server sync asynchronously
    try {
      await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRecord)
      });
    } catch {
      // Offline/local fallback continues seamlessly
    }

    return { success: true, prescription: updatedRecord };
  } catch (err: any) {
    console.error('Failed to save prescription:', err);
    return { success: false, prescription, error: err?.message || 'Save failed' };
  }
}

/**
 * Updates prescription review status by a doctor.
 */
export async function markPrescriptionDoctorReviewed(
  prescriptionId: string,
  doctor: { id: string; name: string },
  doctorNotes?: string
): Promise<{ success: boolean; prescription?: PrescriptionRecord; error?: string }> {
  const record = getPrescriptionById(prescriptionId);
  if (!record) {
    return { success: false, error: 'Prescription not found' };
  }

  const updated: PrescriptionRecord = {
    ...record,
    verificationStatus: 'DOCTOR_REVIEWED',
    doctorReviewedBy: doctor.name,
    doctorReviewedAt: new Date().toISOString(),
    doctorClinicalNotes: doctorNotes || record.doctorClinicalNotes
  };

  return await saveOrUpdatePrescription(
    updated,
    { id: doctor.id, role: 'DOCTOR', name: doctor.name },
    'DOCTOR_REVIEWED',
    `Doctor ${doctor.name} reviewed and confirmed prescription records.`
  );
}
