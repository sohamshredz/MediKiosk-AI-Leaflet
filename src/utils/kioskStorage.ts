import { useState, useEffect, useRef, useCallback } from 'react';
import { PatientProfile } from '../types';
import { SAMPLE_PATIENTS } from '../data/samplePatients';
import { ensurePatientId } from '../services/patientIdService';

export const STORAGE_KEYS = {
  PATIENTS: 'medikiosk_patients_data_v1',
  ACTIVE_PATIENT_ID: 'medikiosk_active_patient_id_v1',
  SESSION_META: 'medikiosk_kiosk_session_meta_v1',
  LAST_SAVED: 'medikiosk_last_saved_timestamp_v1'
} as const;

export interface KioskSessionMeta {
  [patientId: string]: {
    step: number;
    intakeModality?: 'voice' | 'touch';
    lastUpdated: string;
  };
}

/**
 * Loads patient records and session state from LocalStorage.
 * Falls back safely to initial SAMPLE_PATIENTS if nothing is stored or parsing fails.
 */
export function loadKioskDataFromStorage(): {
  patients: PatientProfile[];
  activePatientId: string;
  sessionMeta: KioskSessionMeta;
  isRestoredFromStorage: boolean;
  lastSavedAt: string | null;
} {
  if (typeof window === 'undefined') {
    return {
      patients: SAMPLE_PATIENTS,
      activePatientId: SAMPLE_PATIENTS[0]?.id || '',
      sessionMeta: {},
      isRestoredFromStorage: false,
      lastSavedAt: null
    };
  }

  try {
    const storedPatients = localStorage.getItem(STORAGE_KEYS.PATIENTS);
    const storedActiveId = localStorage.getItem(STORAGE_KEYS.ACTIVE_PATIENT_ID);
    const storedMeta = localStorage.getItem(STORAGE_KEYS.SESSION_META);
    const storedLastSaved = localStorage.getItem(STORAGE_KEYS.LAST_SAVED);

    if (storedPatients) {
      const parsedPatients = JSON.parse(storedPatients) as PatientProfile[];
      if (Array.isArray(parsedPatients) && parsedPatients.length > 0) {
        // Deduplicate parsed patients by id to prevent duplicate keys in state
        const seenIds = new Set<string>();
        const uniquePatients = parsedPatients
          .filter(p => {
            if (!p || !p.id) return false;
            if (seenIds.has(p.id)) return false;
            seenIds.add(p.id);
            return true;
          })
          .map(p => ({
            ...p,
            patientId: ensurePatientId(p)
          }));

        if (uniquePatients.length > 0) {
          const parsedMeta = storedMeta ? JSON.parse(storedMeta) : {};
          const validActiveId = uniquePatients.some(p => p.id === storedActiveId)
            ? (storedActiveId as string)
            : uniquePatients[0].id;

          return {
            patients: uniquePatients,
            activePatientId: validActiveId,
            sessionMeta: parsedMeta,
            isRestoredFromStorage: true,
            lastSavedAt: storedLastSaved
          };
        }
      }
    }
  } catch (err) {
    console.warn('[MediKiosk] Failed to load local storage session:', err);
  }

  const safeSamplePatients = SAMPLE_PATIENTS.map(p => ({
    ...p,
    patientId: ensurePatientId(p)
  }));

  return {
    patients: safeSamplePatients,
    activePatientId: safeSamplePatients[0]?.id || '',
    sessionMeta: {},
    isRestoredFromStorage: false,
    lastSavedAt: null
  };
}

/**
 * Direct write to LocalStorage with error handling
 */
export function saveKioskDataToStorage(
  patients: PatientProfile[],
  activePatientId: string,
  sessionMeta?: KioskSessionMeta
): string {
  try {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PATIENT_ID, activePatientId);
    if (sessionMeta) {
      localStorage.setItem(STORAGE_KEYS.SESSION_META, JSON.stringify(sessionMeta));
    }
    localStorage.setItem(STORAGE_KEYS.LAST_SAVED, timestamp);
    return timestamp;
  } catch (err) {
    console.warn('[MediKiosk] Failed to write to localStorage:', err);
    return '';
  }
}

/**
 * Clears saved kiosk sessions and resets to sample records
 */
export function clearKioskLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.PATIENTS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_PATIENT_ID);
    localStorage.removeItem(STORAGE_KEYS.SESSION_META);
    localStorage.removeItem(STORAGE_KEYS.LAST_SAVED);
  } catch (err) {
    console.warn('[MediKiosk] Failed to clear localStorage:', err);
  }
}

export type AutoSaveStatus = 'saved' | 'saving' | 'idle' | 'recovered' | 'error';

export interface UseKioskAutoSaveOptions {
  debounceMs?: number; // default: 5000ms (5 seconds)
  onSaved?: (timestamp: string) => void;
}

/**
 * React Hook that manages debounced auto-saving to local storage every 5 seconds
 */
export function useKioskAutoSave(
  patients: PatientProfile[],
  activePatientId: string,
  sessionMeta: KioskSessionMeta,
  options: UseKioskAutoSaveOptions = {}
) {
  const { debounceMs = 5000, onSaved } = options;

  const [saveStatus, setSaveStatus] = useState<AutoSaveStatus>('idle');
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.LAST_SAVED);
    }
    return null;
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);
  const latestDataRef = useRef({ patients, activePatientId, sessionMeta });

  // Update latest ref on every render
  latestDataRef.current = { patients, activePatientId, sessionMeta };

  // Synchronous flush save function
  const flushSave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const { patients: curPatients, activePatientId: curActiveId, sessionMeta: curMeta } = latestDataRef.current;
    const time = saveKioskDataToStorage(curPatients, curActiveId, curMeta);
    if (time) {
      setLastSavedTimestamp(time);
      setSaveStatus('saved');
      onSaved?.(time);
    }
  }, [onSaved]);

  // Debounced auto-save effect
  useEffect(() => {
    // Skip initial mount save to prevent unnecessary writes
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Set status to saving / pending
    setSaveStatus('saving');

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      const { patients: curPatients, activePatientId: curActiveId, sessionMeta: curMeta } = latestDataRef.current;
      const time = saveKioskDataToStorage(curPatients, curActiveId, curMeta);
      if (time) {
        setLastSavedTimestamp(time);
        setSaveStatus('saved');
        onSaved?.(time);
      } else {
        setSaveStatus('error');
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [patients, activePatientId, sessionMeta, debounceMs, onSaved]);

  // Ensure unhandled window close / refresh immediately flushes data
  useEffect(() => {
    const handleBeforeUnload = () => {
      const { patients: curPatients, activePatientId: curActiveId, sessionMeta: curMeta } = latestDataRef.current;
      saveKioskDataToStorage(curPatients, curActiveId, curMeta);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return {
    saveStatus,
    lastSavedTimestamp,
    forceSave: flushSave
  };
}
