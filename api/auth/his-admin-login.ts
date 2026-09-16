import type { IncomingMessage, ServerResponse } from 'http';
import { 
  getMasterHisAdmin, 
  hashStaffPin, 
  parseJsonBody, 
  sendJsonResponse 
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
    const { adminId, pin } = body || {};

    if (!adminId || !pin) {
      return sendJsonResponse(res, 400, {
        success: false,
        error: 'HIS Master Admin ID and Security PIN are required.'
      });
    }

    const masterAdmin = getMasterHisAdmin();
    const cleanAdminId = String(adminId).trim().toUpperCase();
    const inputPinHash = hashStaffPin(pin);

    if (cleanAdminId !== masterAdmin.adminId.toUpperCase()) {
      return sendJsonResponse(res, 401, {
        success: false,
        error: 'Invalid HIS Administrator ID. This portal is restricted to the single hospital master administrator.'
      });
    }

    if (inputPinHash !== masterAdmin.pinHash) {
      return sendJsonResponse(res, 401, {
        success: false,
        error: 'Invalid Master Administrator Security PIN. Access denied.'
      });
    }

    const session = {
      token: `his-admin-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      userId: masterAdmin.adminId,
      userName: masterAdmin.fullName,
      role: 'admin',
      roleTitle: masterAdmin.roleTitle,
      department: masterAdmin.department,
      staffCode: masterAdmin.adminId,
      targetView: 'admin',
      isMasterAdmin: true,
      issuedAt: new Date().toISOString()
    };

    return sendJsonResponse(res, 200, {
      success: true,
      message: 'Master HIS Administrator authenticated successfully.',
      session
    });
  } catch (error: any) {
    console.error('Serverless error in /api/auth/his-admin-login:', error);
    return sendJsonResponse(res, 500, {
      success: false,
      error: 'An unexpected internal error occurred during administrative authentication. Please try again.'
    });
  }
}
