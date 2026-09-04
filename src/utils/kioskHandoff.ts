import { PatientProfile } from '../types';
import { STORAGE_KEYS, saveKioskDataToStorage } from './kioskStorage';

export interface HandoffPayload {
  version: number;
  patientId: string;
  tokenNumber: string;
  step: number;
  timestamp: string;
  patientSnapshot?: PatientProfile;
}

/**
 * Encodes patient and step state into a portable URL for smartphone QR code scanning.
 * Default is a lightweight URL with patientId & step (< 150 chars) to prevent QR capacity limits.
 */
export function generateHandoffUrl(
  patient: PatientProfile,
  step: number = 1,
  includeSnapshot: boolean = false
): string {
  if (typeof window === 'undefined') return '';

  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  
  let base64Payload: string | null = null;

  // Only create a minimal snapshot if explicitly requested, ensuring strict size limit (< 400 chars)
  if (includeSnapshot) {
    try {
      const minimalSnapshot = {
        id: patient.id,
        patientId: patient.patientId,
        name: patient.name,
        tokenNumber: patient.tokenNumber,
        age: patient.age,
        gender: patient.gender,
        careStream: patient.careStream,
        department: patient.department
      };

      const payload = {
        v: 1,
        pid: patient.id,
        tok: patient.tokenNumber,
        step,
        timestamp: new Date().toISOString(),
        snap: minimalSnapshot
      };

      const jsonStr = JSON.stringify(payload);
      const encoded = btoa(encodeURIComponent(jsonStr));
      // Only keep snapshot if encoded size is well under QR limit (< 400 chars)
      if (encoded.length < 400) {
        base64Payload = encoded;
      }
    } catch {
      base64Payload = null;
    }
  }

  try {
    const url = new URL(baseUrl);
    url.searchParams.set('resume', 'mobile');
    url.searchParams.set('pid', patient.id);
    url.searchParams.set('step', String(step));
    if (patient.tokenNumber) {
      url.searchParams.set('tok', patient.tokenNumber);
    }
    if (base64Payload) {
      url.searchParams.set('data', base64Payload);
    }
    return url.toString();
  } catch (err) {
    console.warn('Failed to construct handoff url:', err);
    return `${baseUrl}?resume=mobile&pid=${encodeURIComponent(patient.id)}&step=${step}`;
  }
}

/**
 * Checks URL query params for a smartphone handoff payload and integrates with local storage
 */
export function parseHandoffUrl(): {
  isMobileHandoff: boolean;
  patientId: string | null;
  step: number;
  restoredPatient: PatientProfile | null;
} {
  if (typeof window === 'undefined') {
    return { isMobileHandoff: false, patientId: null, step: 1, restoredPatient: null };
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const isMobileHandoff = params.get('resume') === 'mobile' || params.has('pid');
    
    if (!isMobileHandoff) {
      return { isMobileHandoff: false, patientId: null, step: 1, restoredPatient: null };
    }

    const patientId = params.get('pid');
    const step = parseInt(params.get('step') || '1', 10);
    const dataStr = params.get('data');

    let restoredPatient: PatientProfile | null = null;
    if (dataStr) {
      try {
        const decodedJson = decodeURIComponent(atob(dataStr));
        const payload = JSON.parse(decodedJson);
        const snapshot = payload.snap || payload.patientSnapshot;
        if (snapshot && (snapshot.id || snapshot.patientId)) {
          restoredPatient = snapshot as PatientProfile;
        }
      } catch (e) {
        console.warn('Could not parse handoff data payload:', e);
      }
    }

    return {
      isMobileHandoff: true,
      patientId: patientId || restoredPatient?.id || null,
      step: isNaN(step) ? 1 : step,
      restoredPatient
    };
  } catch (err) {
    console.warn('Error reading URL params for handoff:', err);
    return { isMobileHandoff: false, patientId: null, step: 1, restoredPatient: null };
  }
}

/**
 * Clears handoff search params from URL without page reload
 */
export function clearHandoffUrlParams(): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('resume');
    url.searchParams.delete('pid');
    url.searchParams.delete('step');
    url.searchParams.delete('data');
    window.history.replaceState({}, '', url.toString());
  } catch (e) {
    // Ignore history error
  }
}
