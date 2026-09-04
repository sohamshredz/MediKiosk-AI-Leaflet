import { AuthSession, UserRole } from '../types';
import { AppView } from '../components/SidebarDashboard';

export type { AuthSession, UserRole };

const AUTH_STORAGE_KEY = 'medikiosk_active_session_v2';
const LEGACY_AUTH_STORAGE_KEY = 'medikiosk_auth_session_v1';

/**
 * Retrieve active auth session from browser sessionStorage if valid.
 * Per shared kiosk safety rules, active authentication sessions do NOT survive
 * browser restart or fresh window open.
 */
export function getStoredAuthSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    // Purge any legacy localStorage session if present to prevent accidental session revival
    if (localStorage.getItem(LEGACY_AUTH_STORAGE_KEY)) {
      localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
    }

    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (parsed && parsed.role && parsed.userId && parsed.token) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.warn('Error reading stored auth session from sessionStorage:', err);
    return null;
  }
}

/**
 * Save active auth session to sessionStorage (cleared on browser/tab close)
 */
export function saveAuthSession(session: AuthSession): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    // Clean legacy key from localStorage
    localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
  } catch (err) {
    console.warn('Error saving auth session to sessionStorage:', err);
  }
}

/**
 * Completely clear active auth session and sensitive temporary data
 */
export function clearStoredAuthSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
    localStorage.removeItem('medikiosk_active_patient_id_v1');
    // Clear temporary session items
    sessionStorage.removeItem('medikiosk_temp_active_patient');
    sessionStorage.removeItem('medikiosk_temp_consultation');
    sessionStorage.removeItem('medikiosk_temp_ocr_state');
    sessionStorage.removeItem('medikiosk_temp_search_state');
  } catch (err) {
    console.warn('Error clearing auth session:', err);
  }
}

export const clearAuthSession = clearStoredAuthSession;

/**
 * Route protection requirement levels
 */
export type RouteProtectionLevel = 
  | 'public' 
  | 'patient_required' 
  | 'staff_doctor' 
  | 'staff_nurse'
  | 'staff_triage' 
  | 'staff_admin';

export interface RouteResolution {
  targetView: AppView;
  protection: RouteProtectionLevel;
  protectionLevel: RouteProtectionLevel;
  redirectReason?: string;
  isStaffPortal?: boolean;
}

/**
 * Maps raw URL paths or aliases to canonical AppView and its security access level
 */
export function resolveRoute(pathOrAlias: string): RouteResolution {
  const clean = pathOrAlias.replace(/^\//, '').toLowerCase().split('?')[0].trim();

  switch (clean) {
    case '':
    case 'landing':
    case 'home':
    case 'about':
      return { targetView: 'landing', protection: 'public', protectionLevel: 'public' };

    case 'login':
    case 'signin':
    case 'sign-in':
    case 'auth':
      return { targetView: 'login', protection: 'public', protectionLevel: 'public' };

    case 'map':
    case 'locator':
    case 'hospitals':
    case 'hospital-map':
      return { targetView: 'map', protection: 'public', protectionLevel: 'public' };

    case 'assistant':
    case 'ai-assistant':
    case 'gemini':
    case 'help':
      return { targetView: 'assistant', protection: 'public', protectionLevel: 'public' };

    // PATIENT PROTECTED ROUTES
    case 'patient':
    case 'dashboard':
    case 'my-dashboard':
    case 'prescriptions':
    case 'history':
    case 'my-appointments':
    case 'reports':
    case 'profile':
      return {
        targetView: 'patient',
        protection: 'patient_required',
        protectionLevel: 'patient_required',
        redirectReason: 'Patient sign-in is required to view your health records, prescriptions, and timeline.'
      };

    case 'kiosk':
    case 'consultation':
    case 'voice-intake':
    case 'voice_intake':
    case 'intake':
    case 'terminal':
      return {
        targetView: 'kiosk',
        protection: 'patient_required',
        protectionLevel: 'patient_required',
        redirectReason: 'Patient authentication is required to access the Pre-Consultation Kiosk Terminal and Voice Intake.'
      };

    // DOCTOR & MEDICAL OFFICER PROTECTED ROUTES
    case 'doctor':
    case 'doctor-console':
    case 'doctor_console':
    case 'medical-officer':
    case 'medical_officer':
    case 'physician':
    case 'records':
      return {
        targetView: 'doctor',
        protection: 'staff_doctor',
        protectionLevel: 'staff_doctor',
        redirectReason: 'Doctor or Medical Officer credentials required to access the Physician OPD Station.',
        isStaffPortal: true
      };

    // NURSE & TRIAGE PROTECTED ROUTES
    case 'triage':
    case 'nurse':
    case 'telemetry':
    case 'vitals':
      return {
        targetView: 'triage',
        protection: 'staff_nurse',
        protectionLevel: 'staff_triage',
        redirectReason: 'Clinical Staff or Triage Nurse authentication required to access Live Triage & Telemetry.',
        isStaffPortal: true
      };

    // ADMIN PROTECTED ROUTES
    case 'admin':
    case 'analytics':
    case 'superintendent':
      return {
        targetView: 'admin',
        protection: 'staff_admin',
        protectionLevel: 'staff_admin',
        redirectReason: 'Hospital Administrator credentials required to access the Management & Analytics Console.',
        isStaffPortal: true
      };

    default:
      return { targetView: 'landing', protection: 'public', protectionLevel: 'public' };
  }
}

/**
 * Checks whether the given session satisfies the route protection level
 */
export function isSessionAuthorized(
  arg1: RouteProtectionLevel | AuthSession | null,
  arg2?: AuthSession | RouteProtectionLevel | null
): boolean {
  let protection: RouteProtectionLevel;
  let session: AuthSession | null = null;

  if (typeof arg1 === 'string') {
    protection = arg1 as RouteProtectionLevel;
    session = (arg2 as AuthSession | null) || null;
  } else {
    session = arg1;
    protection = (arg2 as RouteProtectionLevel) || 'public';
  }

  if (protection === 'public') return true;
  if (!session) return false;

  switch (protection) {
    case 'patient_required':
      return session.role === 'patient';

    case 'staff_doctor':
      return (
        session.role === 'doctor' ||
        session.role === 'medical_officer' ||
        session.role === 'admin'
      );

    case 'staff_nurse':
    case 'staff_triage':
      return (
        session.role === 'triage_nurse' ||
        session.role === 'doctor' ||
        session.role === 'medical_officer' ||
        session.role === 'admin'
      );

    case 'staff_admin':
      return session.role === 'admin';

    default:
      return false;
  }
}
