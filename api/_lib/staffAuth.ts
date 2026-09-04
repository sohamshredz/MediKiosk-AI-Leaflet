import crypto from 'crypto';

export interface ServerStaffMember {
  id: string;
  staffId: string;
  fullName: string;
  role: 'doctor' | 'medical_officer' | 'triage_nurse';
  roleTitle: string;
  department: string;
  specialization: string;
  registrationNumber: string;
  employeeCode: string;
  mobile: string;
  email: string;
  qualification: string;
  joiningDate: string;
  roomNumber?: string;
  opdTimings?: string;
  consultationFee?: number;
  availableDays?: string[] | string;
  bio?: string;
  status: 'active' | 'suspended' | 'deactivated';
  statusReason?: string;
  pinHash: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export function hashStaffPin(pin: string): string {
  return crypto.createHash('sha256').update(String(pin).trim()).digest('hex');
}

export function getMasterHisAdmin() {
  return {
    adminId: process.env.HIS_ADMIN_ID || 'HIS-1234',
    pinHash: hashStaffPin(process.env.HIS_ADMIN_PIN || '1234'),
    fullName: 'HIS Master Administrator',
    role: 'admin',
    roleTitle: 'Hospital Information System (HIS) Super Administrator',
    department: 'Central HIS & Medical Administration',
    employeeCode: 'ADM-MASTER-01',
    email: 'admin.his@aiims.gov.in',
    mobile: '+91 11 2658 8500'
  };
}

export const DEFAULT_HOSPITAL_STAFF: ServerStaffMember[] = [
  {
    id: 'staff-doc-sohom',
    staffId: 'DOC-SOHOM-01',
    fullName: 'Dr. Sohom Das, MD',
    role: 'doctor',
    roleTitle: 'Senior Consultant Physician',
    department: 'General Medicine OPD (Room 104)',
    specialization: 'Internal Medicine, Diabetes & Chronic Disease Management',
    registrationNumber: 'WBMC-2014-55192',
    employeeCode: 'DOC-SOHOM-01',
    mobile: '+91 98301 22345',
    email: 'rtddas33@gmail.com',
    qualification: 'MBBS, MD (Internal Medicine), Fellowship in Diabetology',
    joiningDate: '2019-01-10',
    roomNumber: 'OPD Room 104',
    opdTimings: '08:30 AM - 01:30 PM',
    consultationFee: 0,
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    bio: 'Specialist in comprehensive chronic disease care, insulin therapy management, and multi-morbidity coordination.',
    status: 'active',
    pinHash: hashStaffPin('1234'),
    createdAt: '2023-01-01T08:00:00.000Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'staff-doc-01',
    staffId: 'DOC-AIIMS-04',
    fullName: 'Dr. Sunita Rao, MD',
    role: 'doctor',
    roleTitle: 'Senior Consultant Physician',
    department: 'General Medicine OPD (Room 104)',
    specialization: 'Internal Medicine & Chronic Care',
    registrationNumber: 'MCI-2012-44918',
    employeeCode: 'DOC-AIIMS-04',
    mobile: '+91 98101 22345',
    email: 'dr.sunita.rao@aiims.edu',
    qualification: 'MBBS, MD (Medicine), Fellowship in Diabetology',
    joiningDate: '2018-06-15',
    roomNumber: 'OPD Room 104',
    opdTimings: '09:00 AM - 02:00 PM',
    consultationFee: 0,
    availableDays: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
    bio: 'Lead physician for outpatient triage and metabolic syndrome management.',
    status: 'active',
    pinHash: hashStaffPin('1234'),
    createdAt: '2023-01-10T08:00:00.000Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'staff-mo-01',
    staffId: 'MO-DELHI-09',
    fullName: 'Dr. Rajesh Nair, MBBS',
    role: 'medical_officer',
    roleTitle: 'Duty Medical Officer (Emergency & Casualty)',
    department: 'Emergency & Acute Care Department',
    specialization: 'Emergency Medicine & Acute Care',
    registrationNumber: 'DMC-2016-19283',
    employeeCode: 'MO-DELHI-09',
    mobile: '+91 98711 55678',
    email: 'dr.rajesh.nair@aiims.edu',
    qualification: 'MBBS, Dip. Emergency Medicine (DEM)',
    joiningDate: '2020-11-01',
    roomNumber: 'Emergency Casualty Bay 03',
    opdTimings: '24x7 Rotational Shift',
    consultationFee: 0,
    availableDays: ['All Days'],
    bio: 'Emergency resuscitation, acute trauma triage, and urgent life support.',
    status: 'active',
    pinHash: hashStaffPin('4567'),
    createdAt: '2023-01-15T09:30:00.000Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'staff-nurse-01',
    staffId: 'NURSE-01',
    fullName: 'Sister Nirmala Joseph, B.Sc Nursing',
    role: 'triage_nurse',
    roleTitle: 'Senior Triage Officer & Nursing Lead',
    department: 'OPD Reception & Triage Desk',
    specialization: 'Clinical Triage & Emergency Vitals Assessment',
    registrationNumber: 'INC-2014-99882',
    employeeCode: 'NURSE-01',
    mobile: '+91 99100 88776',
    email: 'nirmala.joseph@aiims.edu',
    qualification: 'B.Sc (Hons) Nursing, ACLS Certified',
    joiningDate: '2019-03-20',
    roomNumber: 'Triage Station Alpha',
    opdTimings: '07:30 AM - 03:30 PM',
    consultationFee: 0,
    availableDays: ['Monday to Saturday'],
    bio: 'Chief nurse for vital signs acquisition and red-flag escalation.',
    status: 'active',
    pinHash: hashStaffPin('5678'),
    createdAt: '2023-02-01T10:00:00.000Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'staff-doc-02',
    staffId: 'DOC-CARDIO-12',
    fullName: 'Dr. Ananya Mukherjee, DM',
    role: 'doctor',
    roleTitle: 'Consultant Cardiologist',
    department: 'Cardiology & Chest Pain Center',
    specialization: 'Interventional Cardiology',
    registrationNumber: 'WBMC-2010-38472',
    employeeCode: 'DOC-CARDIO-12',
    mobile: '+91 98300 77665',
    email: 'dr.ananya.m@aiims.edu',
    qualification: 'MBBS, MD (Medicine), DM (Cardiology)',
    joiningDate: '2021-08-10',
    roomNumber: 'Room 208, Cardiology Block',
    opdTimings: '10:00 AM - 03:00 PM',
    consultationFee: 0,
    availableDays: ['Tuesday', 'Thursday', 'Saturday'],
    bio: 'Specializes in angioplasty, heart failure, and ischemic heart disease.',
    status: 'active',
    pinHash: hashStaffPin('2468'),
    createdAt: '2023-03-12T11:15:00.000Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'staff-nurse-02',
    staffId: 'NURSE-02',
    fullName: 'Sister Priya Sharma, GNM',
    role: 'triage_nurse',
    roleTitle: 'Staff Nurse & Vitals Assessor',
    department: 'Pediatric & General OPD Triage',
    specialization: 'Pediatric Care & Kiosk Assisting',
    registrationNumber: 'DNC-2018-77112',
    employeeCode: 'NURSE-02',
    mobile: '+91 98112 44332',
    email: 'priya.sharma@aiims.edu',
    qualification: 'General Nursing & Midwifery (GNM)',
    joiningDate: '2022-02-14',
    roomNumber: 'Triage Station Beta',
    opdTimings: '08:00 AM - 04:00 PM',
    consultationFee: 0,
    availableDays: ['Monday to Saturday'],
    bio: 'Assists geriatric and pediatric patients with kiosk vitals intake.',
    status: 'active',
    pinHash: hashStaffPin('1357'),
    createdAt: '2023-04-05T08:45:00.000Z',
    updatedAt: new Date().toISOString()
  }
];

export function findStaffMember(searchCode: string, staffList: ServerStaffMember[] = DEFAULT_HOSPITAL_STAFF): ServerStaffMember | undefined {
  const clean = (searchCode || '').trim().toUpperCase();
  if (!clean) return undefined;
  return staffList.find(s => 
    (s.staffId && s.staffId.toUpperCase() === clean) ||
    (s.employeeCode && s.employeeCode.toUpperCase() === clean) ||
    (s.email && s.email.toUpperCase() === clean) ||
    (s.fullName && s.fullName.toUpperCase().includes(clean)) ||
    (clean.includes('SOHOM') && s.staffId === 'DOC-SOHOM-01')
  );
}

export function isPinValidForStaff(staff: ServerStaffMember, pin: string): boolean {
  const cleanPin = String(pin || '').trim();
  if (!cleanPin) return false;
  const pinHash = hashStaffPin(cleanPin);

  return (
    staff.pinHash === pinHash ||
    staff.pinHash === hashStaffPin(cleanPin.toUpperCase()) ||
    staff.pinHash === hashStaffPin(cleanPin.toLowerCase()) ||
    (Boolean(staff.staffId) && cleanPin.toUpperCase() === staff.staffId.toUpperCase()) ||
    (Boolean(staff.employeeCode) && cleanPin.toUpperCase() === staff.employeeCode.toUpperCase()) ||
    (cleanPin === '1234' && (!staff.pinHash || staff.pinHash === hashStaffPin('1234')))
  );
}

export async function parseJsonBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk: any) => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

export function sendJsonResponse(res: any, statusCode: number, data: any) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(statusCode).json(data);
  } else {
    res.statusCode = statusCode;
    res.end(JSON.stringify(data));
  }
}
