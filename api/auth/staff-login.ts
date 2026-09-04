import type { IncomingMessage, ServerResponse } from 'http';
import { 
  DEFAULT_HOSPITAL_STAFF, 
  findStaffMember, 
  isPinValidForStaff, 
  parseJsonBody, 
  sendJsonResponse,
  ServerStaffMember 
} from '../_lib/staffAuth';

export default async function handler(req: IncomingMessage & { body?: any; method?: string }, res: ServerResponse & { status?: any; json?: any }) {
  if (req.method === 'OPTIONS') {
    return sendJsonResponse(res, 200, { ok: true });
  }

  if (req.method !== 'POST') {
    return sendJsonResponse(res, 405, { 
      success: false, 
      error: 'Method Not Allowed. Please send a POST request with JSON credentials.' 
    });
  }

  try {
    const body = await parseJsonBody(req);
    const { staffId, pin } = body || {};

    if (!staffId || !pin) {
      return sendJsonResponse(res, 400, {
        success: false,
        error: 'Staff ID / Employee Code and Security PIN are required.'
      });
    }

    const cleanStaffId = String(staffId).trim().toUpperCase();
    let staff: ServerStaffMember | undefined = findStaffMember(cleanStaffId, DEFAULT_HOSPITAL_STAFF);

    // Optional Supabase lookup if environment credentials are present
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!staff && supabaseUrl && supabaseKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data, error } = await supabase
          .from('hospital_staff')
          .select('*')
          .or(`staff_id.ilike.${cleanStaffId},employee_code.ilike.${cleanStaffId},email.ilike.${cleanStaffId}`)
          .maybeSingle();

        if (!error && data) {
          staff = {
            id: data.id || `staff-${data.staff_id}`,
            staffId: data.staff_id,
            fullName: data.full_name,
            role: data.role,
            roleTitle: data.role_title || (data.role === 'doctor' ? 'Senior Consultant Physician' : 'Clinical Staff'),
            department: data.department || 'General Medicine OPD',
            specialization: data.specialization || 'Internal Medicine',
            registrationNumber: data.registration_number || 'REG-PENDING',
            employeeCode: data.employee_code || data.staff_id,
            mobile: data.mobile || '',
            email: data.email || '',
            qualification: data.qualification || 'MBBS, MD',
            joiningDate: data.joining_date || '2023-01-01',
            roomNumber: data.room_number || 'Room 104',
            opdTimings: data.opd_timings || '09:00 AM - 02:00 PM',
            consultationFee: data.consultation_fee != null ? Number(data.consultation_fee) : 0,
            availableDays: data.available_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            bio: data.bio || '',
            status: data.status || 'active',
            statusReason: data.status_reason || undefined,
            pinHash: data.pin_hash || '',
            lastLoginAt: data.last_login_at || undefined,
            createdAt: data.created_at || new Date().toISOString(),
            updatedAt: data.updated_at || new Date().toISOString()
          };
        }
      } catch (sbErr) {
        console.warn('[Vercel Staff Auth] Supabase check notice:', sbErr);
      }
    }

    if (!staff) {
      return sendJsonResponse(res, 401, {
        success: false,
        error: 'Staff ID not found. Staff accounts must be created and authorized by the HIS Master Administrator.'
      });
    }

    if (staff.status === 'suspended') {
      return sendJsonResponse(res, 403, {
        success: false,
        error: `Staff account is temporarily suspended. Reason: ${staff.statusReason || 'Administrative review'}. Please contact your HIS Administrator.`
      });
    }

    if (staff.status === 'deactivated') {
      return sendJsonResponse(res, 403, {
        success: false,
        error: `Staff account has been deactivated. Reason: ${staff.statusReason || 'Tenure concluded'}. Access is revoked.`
      });
    }

    const isPinValid = isPinValidForStaff(staff, pin);
    if (!isPinValid) {
      return sendJsonResponse(res, 401, {
        success: false,
        error: 'Invalid Security PIN for this staff member. You can use the "Reset PIN" option below, or log in with your Staff ID if your PIN was set by HIS.'
      });
    }

    staff.lastLoginAt = new Date().toISOString();

    const targetView = (staff.role === 'triage_nurse') ? 'triage' : 'doctor';

    const session = {
      token: `staff-${staff.id}-${Date.now()}`,
      userId: staff.staffId,
      userName: staff.fullName,
      role: staff.role,
      roleTitle: staff.roleTitle,
      department: staff.department,
      staffCode: staff.staffId,
      targetView,
      issuedAt: new Date().toISOString()
    };

    return sendJsonResponse(res, 200, {
      success: true,
      message: `Welcome, ${staff.fullName}`,
      session,
      staff: {
        id: staff.id,
        staffId: staff.staffId,
        fullName: staff.fullName,
        role: staff.role,
        roleTitle: staff.roleTitle,
        department: staff.department,
        specialization: staff.specialization,
        employeeCode: staff.employeeCode,
        roomNumber: staff.roomNumber,
        opdTimings: staff.opdTimings,
        consultationFee: staff.consultationFee,
        availableDays: staff.availableDays,
        bio: staff.bio,
        status: staff.status
      }
    });
  } catch (error: any) {
    console.error('Serverless error in /api/auth/staff-login:', error);
    return sendJsonResponse(res, 500, {
      success: false,
      error: 'An unexpected internal error occurred during staff authentication. Please try again.'
    });
  }
}
