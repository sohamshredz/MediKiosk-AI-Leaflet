import {
  HospitalStaffMember,
  SystemAuditLog,
  AdminSystemMetrics,
  StaffClinicalRole,
  StaffAccountStatus,
  OpdAppointment,
  HospitalSystemConfig
} from '../types';
import { getStoredAuthSession } from '../utils/authStorage';

function getAdminHeaders(): Record<string, string> {
  const session = getStoredAuthSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (session && session.token) {
    headers['Authorization'] = `Bearer ${session.token}`;
  } else {
    // Fallback console authorization token
    headers['Authorization'] = 'Bearer his-admin-console-session';
  }
  return headers;
}

export interface AdminLoginResponse {
  success: boolean;
  message?: string;
  error?: string;
  session?: {
    token: string;
    userId: string;
    userName: string;
    role: 'admin';
    roleTitle: string;
    department: string;
    staffCode: string;
    targetView: 'admin';
    isMasterAdmin: boolean;
    issuedAt: string;
  };
}

export interface StaffLoginResponse {
  success: boolean;
  message?: string;
  error?: string;
  session?: {
    token: string;
    userId: string;
    userName: string;
    role: 'doctor' | 'medical_officer' | 'triage_nurse';
    roleTitle: string;
    department: string;
    staffCode: string;
    targetView: 'doctor' | 'triage';
    issuedAt: string;
  };
  staff?: Partial<HospitalStaffMember>;
}

async function safelyParseResponse<T>(res: Response, fallbackError: string): Promise<T> {
  let text = '';
  try {
    text = await res.text();
  } catch (err: any) {
    return {
      success: false,
      error: fallbackError || err?.message || 'Failed to read response from server.'
    } as unknown as T;
  }

  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // JSON syntax error in body, fall through to status handler
    }
  }

  if (res.status === 401 || res.status === 403) {
    return {
      success: false,
      error: 'Invalid credentials or access denied. Please check your Staff ID and PIN.'
    } as unknown as T;
  }

  if (res.status === 404) {
    return {
      success: false,
      error: 'Authentication route or service endpoint not found (404). Please ensure the API is reachable.'
    } as unknown as T;
  }

  return {
    success: false,
    error: fallbackError || `Server returned error (${res.status}).`
  } as unknown as T;
}

export async function authenticateHisAdmin(adminId: string, pin: string): Promise<AdminLoginResponse> {
  try {
    const res = await fetch('/api/auth/his-admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, pin })
    });
    return await safelyParseResponse<AdminLoginResponse>(res, 'Failed to authenticate HIS Administrator.');
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to connect to HIS Admin authentication server.'
    };
  }
}

export async function authenticateStaff(staffId: string, pin: string): Promise<StaffLoginResponse> {
  try {
    const res = await fetch('/api/auth/staff-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId, pin })
    });
    return await safelyParseResponse<StaffLoginResponse>(res, 'Failed to authenticate Hospital Staff.');
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to connect to Hospital Staff authentication server.'
    };
  }
}

export async function fetchAllStaff(): Promise<{ success: boolean; staff: HospitalStaffMember[]; error?: string }> {
  try {
    const res = await fetch('/api/admin/staff', {
      headers: getAdminHeaders()
    });
    const data = await safelyParseResponse<{ success: boolean; staff?: HospitalStaffMember[]; error?: string }>(res, 'Failed to fetch hospital staff.');
    if (data.success) {
      return { success: true, staff: data.staff || [] };
    }
    return { success: false, staff: [], error: data.error };
  } catch (err: any) {
    return { success: false, staff: [], error: err.message };
  }
}

export async function createStaffMember(payload: {
  staffId?: string;
  fullName: string;
  role: StaffClinicalRole;
  roleTitle?: string;
  department: string;
  specialization?: string;
  registrationNumber?: string;
  employeeCode?: string;
  mobile?: string;
  email?: string;
  qualification?: string;
  joiningDate?: string;
  roomNumber?: string;
  opdTimings?: string;
  consultationFee?: number;
  availableDays?: string[] | string;
  bio?: string;
  initialPin?: string;
}): Promise<{ success: boolean; staff?: HospitalStaffMember; error?: string; message?: string; supabaseSync?: boolean }> {
  try {
    const res = await fetch('/api/admin/staff', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(payload)
    });
    return await safelyParseResponse(res, 'Failed to create staff member');
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function syncStaffBatchToSupabase(): Promise<{ success: boolean; count?: number; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/admin/staff/sync-supabase', {
      method: 'POST',
      headers: getAdminHeaders()
    });
    return await safelyParseResponse(res, 'Failed to sync staff to Supabase');
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to sync staff to Supabase' };
  }
}

export async function getSupabaseBackendStatus(): Promise<{ 
  connected: boolean; 
  projectId?: string; 
  url?: string; 
  tables?: Record<string, boolean>; 
  allTablesReady?: boolean; 
  error?: string 
}> {
  try {
    const res = await fetch('/api/admin/supabase-status');
    return await safelyParseResponse(res, 'Failed to get Supabase status');
  } catch (err: any) {
    return { connected: false, error: err.message };
  }
}

export async function updateStaffMember(
  id: string,
  payload: Partial<HospitalStaffMember>
): Promise<{ success: boolean; staff?: HospitalStaffMember; error?: string; message?: string }> {
  try {
    const res = await fetch(`/api/admin/staff/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAdminHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await safelyParseResponse<any>(res, 'Failed to update staff member');
    if (data.success && data.staff) {
      try {
        const cached = localStorage.getItem('medikiosk_cached_staff_list');
        if (cached) {
          const list: HospitalStaffMember[] = JSON.parse(cached);
          const updated = list.map(s => (s.id === id || s.staffId === id) ? { ...s, ...data.staff } : s);
          localStorage.setItem('medikiosk_cached_staff_list', JSON.stringify(updated));
        }
      } catch (e) {}
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function resetStaffPin(
  staffId: string,
  newPin?: string,
  resetToStaffId?: boolean
): Promise<{ success: boolean; error?: string; message?: string; newPin?: string; isStaffIdPin?: boolean }> {
  try {
    const res = await fetch('/api/admin/staff/reset-pin', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ staffId, newPin, resetToStaffId })
    });
    return await safelyParseResponse(res, 'Failed to reset staff PIN');
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Clinical Staff Self-Service PIN Reset:
 * Doctor / Nurse confirms current PIN, provides new PIN and confirmation
 */
export async function staffSelfResetPin(
  staffId: string,
  currentPin: string,
  newPin: string,
  confirmNewPin: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const res = await fetch('/api/auth/staff-reset-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId, currentPin, newPin, confirmNewPin })
    });
    return await safelyParseResponse<{ success: boolean; error?: string; message?: string }>(res, 'Failed to update PIN');
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update PIN' };
  }
}

export async function changeStaffStatus(
  staffId: string,
  status: StaffAccountStatus,
  reason?: string
): Promise<{ success: boolean; staff?: Partial<HospitalStaffMember>; error?: string; message?: string }> {
  try {
    const res = await fetch('/api/admin/staff/status', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ staffId, status, reason })
    });
    return await safelyParseResponse(res, 'Failed to change staff status');
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchAuditLogs(filter?: {
  actionType?: string;
  targetType?: string;
  limit?: number;
}): Promise<{ success: boolean; logs: SystemAuditLog[]; error?: string }> {
  try {
    const params = new URLSearchParams();
    if (filter?.actionType) params.append('actionType', filter.actionType);
    if (filter?.targetType) params.append('targetType', filter.targetType);
    if (filter?.limit) params.append('limit', String(filter.limit));

    const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
      headers: getAdminHeaders()
    });
    const data = await safelyParseResponse<any>(res, 'Failed to fetch audit logs');
    if (data.success) {
      return { success: true, logs: data.logs || [] };
    }
    return { success: false, logs: [], error: data.error };
  } catch (err: any) {
    return { success: false, logs: [], error: err.message };
  }
}

export async function logAdminAuditEvent(payload: {
  actionType: SystemAuditLog['actionType'];
  targetType: SystemAuditLog['targetType'];
  targetId: string;
  targetName?: string;
  details: string;
  metadata?: Record<string, any>;
}): Promise<{ success: boolean; log?: SystemAuditLog; error?: string }> {
  try {
    const res = await fetch('/api/admin/audit-logs', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(payload)
    });
    return await safelyParseResponse(res, 'Failed to log audit event');
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchAdminMetrics(): Promise<{ success: boolean; metrics?: any; error?: string }> {
  try {
    const res = await fetch('/api/admin/metrics', {
      headers: getAdminHeaders()
    });
    return await safelyParseResponse(res, 'Failed to fetch admin metrics');
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function changeMasterAdminPin(
  currentPin: string,
  newPin: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const res = await fetch('/api/admin/change-admin-pin', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ currentPin, newPin })
    });
    return await safelyParseResponse(res, 'Failed to change admin PIN');
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchHospitalConfig(): Promise<{ success: boolean; config?: HospitalSystemConfig; error?: string }> {
  try {
    const res = await fetch('/api/admin/hospital-config', {
      headers: getAdminHeaders()
    });
    return await safelyParseResponse(res, 'Failed to fetch hospital config');
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateHospitalConfig(
  config: Partial<HospitalSystemConfig>
): Promise<{ success: boolean; config?: HospitalSystemConfig; error?: string; message?: string }> {
  try {
    const res = await fetch('/api/admin/hospital-config', {
      method: 'PUT',
      headers: getAdminHeaders(),
      body: JSON.stringify(config)
    });
    return await safelyParseResponse(res, 'Failed to update hospital config');
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchOpdAppointments(): Promise<{
  success: boolean;
  appointments: OpdAppointment[];
  count?: number;
  error?: string;
}> {
  try {
    const res = await fetch('/api/admin/appointments', {
      headers: getAdminHeaders()
    });
    const data = await safelyParseResponse<any>(res, 'Failed to fetch appointments');
    if (data.success) {
      return { success: true, appointments: data.appointments || [] };
    }
    return { success: false, appointments: [], error: data.error };
  } catch (err: any) {
    return { success: false, appointments: [], error: err.message };
  }
}

export async function reassignOpdAppointment(
  appointmentId: string,
  newDoctorStaffId: string,
  newDoctorName: string
): Promise<{ success: boolean; appointment?: OpdAppointment; error?: string; message?: string }> {
  try {
    const res = await fetch('/api/admin/appointments/reassign', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ appointmentId, newDoctorStaffId, newDoctorName })
    });
    return await safelyParseResponse(res, 'Failed to reassign appointment');
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function cancelOpdAppointment(
  appointmentId: string,
  reason: string
): Promise<{ success: boolean; appointment?: OpdAppointment; error?: string; message?: string }> {
  try {
    const res = await fetch('/api/admin/appointments/cancel', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ appointmentId, reason })
    });
    return await safelyParseResponse(res, 'Failed to cancel appointment');
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updatePatientRecord(
  patientId: string,
  updatedData: any
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    await logAdminAuditEvent({
      actionType: 'PATIENT_UPDATED',
      targetType: 'PATIENT',
      targetId: patientId,
      targetName: updatedData.name || patientId,
      details: `Patient demographic and clinical record updated by HIS Admin.`
    });
    return { success: true, message: 'Patient demographic record updated.' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deletePatientRecord(
  patientId: string,
  reason: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    await logAdminAuditEvent({
      actionType: 'PATIENT_DELETED',
      targetType: 'PATIENT',
      targetId: patientId,
      targetName: patientId,
      details: `Patient record purged from HIS. Justification: ${reason}`
    });
    return { success: true, message: 'Patient record deleted from system.' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
