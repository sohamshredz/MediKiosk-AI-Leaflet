import type { IncomingMessage, ServerResponse } from 'http';
import { 
  DEFAULT_HOSPITAL_STAFF, 
  findStaffMember, 
  hashStaffPin, 
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
    const { staffId, currentPin, newPin, confirmNewPin } = body || {};

    if (!staffId || !currentPin || !newPin || !confirmNewPin) {
      return sendJsonResponse(res, 400, {
        success: false,
        error: 'Staff ID, current PIN, new PIN, and PIN confirmation are all required.'
      });
    }

    const cleanStaffId = String(staffId).trim().toUpperCase();
    const cleanCurrentPin = String(currentPin).trim();
    const cleanNewPin = String(newPin).trim();
    const cleanConfirmPin = String(confirmNewPin).trim();

    if (cleanNewPin !== cleanConfirmPin) {
      return sendJsonResponse(res, 400, {
        success: false,
        error: 'New PIN and Confirm New PIN do not match. Please re-enter carefully.'
      });
    }

    if (cleanNewPin.length < 4) {
      return sendJsonResponse(res, 400, {
        success: false,
        error: 'New Security PIN must be at least 4 characters long.'
      });
    }

    const staff: ServerStaffMember | undefined = findStaffMember(cleanStaffId, DEFAULT_HOSPITAL_STAFF);

    if (!staff) {
      return sendJsonResponse(res, 404, {
        success: false,
        error: `Staff account with ID "${staffId}" was not found in the hospital registry.`
      });
    }

    if (staff.status === 'suspended' || staff.status === 'deactivated') {
      return sendJsonResponse(res, 403, {
        success: false,
        error: `Staff account is currently ${staff.status}. PIN reset is not allowed.`
      });
    }

    const isCurrentValid = isPinValidForStaff(staff, cleanCurrentPin);
    if (!isCurrentValid) {
      return sendJsonResponse(res, 401, {
        success: false,
        error: `Current PIN is incorrect. If your account was newly provisioned by HIS, your default PIN is your Staff ID (${staff.staffId}).`
      });
    }

    staff.pinHash = hashStaffPin(cleanNewPin);
    staff.updatedAt = new Date().toISOString();

    return sendJsonResponse(res, 200, {
      success: true,
      message: `Security PIN for ${staff.fullName} (${staff.staffId}) has been updated successfully. You can now log in using your new PIN.`
    });
  } catch (error: any) {
    console.error('Serverless error in /api/auth/staff-reset-pin:', error);
    return sendJsonResponse(res, 500, {
      success: false,
      error: 'An unexpected internal error occurred during PIN reset. Please try again.'
    });
  }
}
