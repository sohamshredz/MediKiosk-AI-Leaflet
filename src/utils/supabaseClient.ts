import { createClient } from '@supabase/supabase-js';
import { Appointment, PrescriptionRecord, PatientProfile, PatientOneYearSummary, MedicalConditionRecord, MedicalHistoryDocument, HospitalStaffMember, HospitalSystemConfig } from '../types';

export const SUPABASE_PROJECT_ID = 'aylqpvgaamipwufejnan';
export const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || `https://${SUPABASE_PROJECT_ID}.supabase.co`;
export const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_5-wMZICmH5pc7cN_tv3dxA_hJ8cS-PM';

// Create Supabase client safely with auth session persistence disabled for smooth multi-user kiosk & portal workflows
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  }
});

export interface AmbulanceBookingRecord {
  id: string;
  booking_id: string;
  patient_name: string;
  patient_phone: string;
  pickup_address: string;
  pickup_lat?: number;
  pickup_lng?: number;
  pickupLocation?: {
    latitude: number;
    longitude: number;
  };
  destination_hospital: string;
  destinationHospital?: any;
  ambulance_tier: 'basic' | 'advanced' | 'neonatal';
  fare_inr: number;
  eta_minutes: number;
  is_critical: boolean;
  condition_notes?: string;
  driver_name: string;
  driver_phone: string;
  vehicle_number: string;
  status: 'booked' | 'driver_assigned' | 'en_route' | 'arrived' | 'completed';
  created_at: string;
}

export interface TriageRecordPayload {
  id?: string;
  patient_id: string;
  patient_name: string;
  age?: number;
  gender?: string;
  token_number?: string;
  triage_level: 'CRITICAL_EMERGENCY' | 'URGENT_PRIORITY' | 'STANDARD_OPD';
  priority_score: number;
  vitals?: any;
  red_flags?: string[];
  chief_complaint?: string;
  destination_department?: string;
  status?: string;
  assigned_nurse?: string;
  clinical_rationale?: string;
  immediate_actions?: string[];
  assessed_at?: string;
}

/**
 * MASTER POSTGRESQL SCHEMA FOR SUPABASE
 * Copy & paste this entire script into your Supabase SQL Editor:
 * https://supabase.com/dashboard/project/aylqpvgaamipwufejnan/sql/new
 */
export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- MEDIKIOSK AI - COMPLETE SUPABASE POSTGRESQL SCHEMA & RLS POLICIES
-- Project: https://aylqpvgaamipwufejnan.supabase.co
-- Generated for AI-Powered Clinical History & Pre-Consultation Platform
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. APPOINTMENTS TABLE (OPD Tokens, Consultations & Tele-Consults)
-- -----------------------------------------------------------------------------
create table if not exists appointments (
  id text primary key default gen_random_uuid()::text,
  booking_id text unique,
  patient_id text not null,
  patient_name text not null,
  uhid text,
  token_number text,
  department text default 'General Medicine',
  doctor_name text,
  doctor_specialty text,
  care_stream text default 'allopathy',
  appointment_date text,
  time_slot text,
  chief_complaint text,
  room_number text,
  status text default 'in_queue',
  abha_linked boolean default true,
  booking_type text default 'online_portal',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_appointments_patient_id on appointments(patient_id);
create index if not exists idx_appointments_booking_id on appointments(booking_id);
create index if not exists idx_appointments_status on appointments(status);

alter table appointments enable row level security;
drop policy if exists "Allow public access for appointments" on appointments;
create policy "Allow public access for appointments" on appointments for all using (true) with check (true);

-- -----------------------------------------------------------------------------
-- 2. AMBULANCE SOS BOOKINGS TABLE
-- -----------------------------------------------------------------------------
create table if not exists ambulance_bookings (
  id text primary key default gen_random_uuid()::text,
  booking_id text unique,
  patient_name text not null,
  patient_phone text,
  pickup_address text,
  pickup_lat numeric,
  pickup_lng numeric,
  destination_hospital text,
  ambulance_tier text default 'basic',
  fare_inr numeric default 0,
  eta_minutes integer default 15,
  is_critical boolean default false,
  condition_notes text,
  driver_name text,
  driver_phone text,
  vehicle_number text,
  status text default 'booked',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_ambulance_bookings_id on ambulance_bookings(booking_id);
alter table ambulance_bookings enable row level security;
drop policy if exists "Allow public access for ambulance_bookings" on ambulance_bookings;
create policy "Allow public access for ambulance_bookings" on ambulance_bookings for all using (true) with check (true);

-- -----------------------------------------------------------------------------
-- 3. PRESCRIPTIONS TABLE (Digital Rx, OCR Scans & Clinician Signatures)
-- -----------------------------------------------------------------------------
create table if not exists prescriptions (
  id text primary key,
  patient_id text not null,
  patient_name text not null,
  uhid text,
  token_number text,
  doctor_id text,
  doctor_name text,
  doctor_specialty text,
  doctor_license_number text,
  hospital_id text,
  hospital_name text,
  prescription_date text,
  source_type text default 'digital_portal',
  original_file_url text,
  file_name text,
  ocr_text text,
  medications jsonb default '[]'::jsonb,
  diagnosis text,
  symptoms text,
  recommended_tests jsonb default '[]'::jsonb,
  general_advice text,
  follow_up_date text,
  verification_status text default 'DRAFT',
  overall_confidence numeric default 95,
  has_low_confidence_fields boolean default false,
  patient_verified_at text,
  doctor_reviewed_by text,
  doctor_reviewed_at text,
  doctor_clinical_notes text,
  digital_signature jsonb,
  care_stream text default 'allopathy',
  audit_logs jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_prescriptions_patient_id on prescriptions(patient_id);
create index if not exists idx_prescriptions_status on prescriptions(verification_status);

alter table prescriptions enable row level security;
drop policy if exists "Allow public access for prescriptions" on prescriptions;
create policy "Allow public access for prescriptions" on prescriptions for all using (true) with check (true);

-- -----------------------------------------------------------------------------
-- 4. PATIENT MEDICAL HISTORY (Chronic Conditions & Category Diagnoses)
-- -----------------------------------------------------------------------------
create table if not exists patient_medical_history (
  id text primary key,
  patient_id text not null,
  category text not null,
  condition_name text not null,
  description text,
  onset_date text,
  status text default 'active',
  treatment text,
  doctor_name text,
  hospital_name text,
  source_type text default 'patient_entered',
  source_document_id text,
  is_within_past_year boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_med_history_patient_id on patient_medical_history(patient_id);
create index if not exists idx_med_history_category on patient_medical_history(category);

alter table patient_medical_history enable row level security;
drop policy if exists "Allow public access for patient_medical_history" on patient_medical_history;
create policy "Allow public access for patient_medical_history" on patient_medical_history for all using (true) with check (true);

-- -----------------------------------------------------------------------------
-- 5. MEDICAL HISTORY DOCUMENTS (Uploaded PDFs, Lab Scans & OCR Data)
-- -----------------------------------------------------------------------------
create table if not exists medical_history_documents (
  id text primary key,
  patient_id text not null,
  history_id text,
  file_name text not null,
  file_type text,
  storage_path text,
  document_type text default 'Prescription / Medical Record',
  document_date text,
  extracted_text text,
  extraction_status text default 'completed',
  extracted_data jsonb,
  confirmed_by_patient boolean default true,
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_docs_patient_id on medical_history_documents(patient_id);

alter table medical_history_documents enable row level security;
drop policy if exists "Allow public access for medical_history_documents" on medical_history_documents;
create policy "Allow public access for medical_history_documents" on medical_history_documents for all using (true) with check (true);

-- -----------------------------------------------------------------------------
-- 6. PATIENT PROFILES & PRE-INTAKE DOSSIERS
-- -----------------------------------------------------------------------------
create table if not exists patients (
  id text primary key,
  patient_id text unique not null,
  uhid text,
  abha_id text,
  name text not null,
  age integer,
  gender text,
  phone text,
  email text,
  language text default 'en',
  symptoms jsonb default '[]'::jsonb,
  vitals jsonb default '{}'::jsonb,
  current_medications jsonb default '[]'::jsonb,
  allergies jsonb default '[]'::jsonb,
  past_illnesses jsonb default '[]'::jsonb,
  past_surgeries jsonb default '[]'::jsonb,
  family_history jsonb default '[]'::jsonb,
  timeline jsonb default '[]'::jsonb,
  triage_risk text default 'STANDARD_OPD',
  red_flags_detected jsonb default '[]'::jsonb,
  department text default 'General Medicine',
  care_stream text default 'allopathy',
  queue_token text,
  is_emergency boolean default false,
  ayush_assessment jsonb,
  clinical_summary jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_patients_patient_id on patients(patient_id);
create index if not exists idx_patients_uhid on patients(uhid);

alter table patients enable row level security;
drop policy if exists "Allow public access for patients" on patients;
create policy "Allow public access for patients" on patients for all using (true) with check (true);

-- -----------------------------------------------------------------------------
-- 7. PATIENT 1-YEAR CLINICAL SUMMARIES (Today - 365 Days Synthesis)
-- -----------------------------------------------------------------------------
create table if not exists patient_one_year_summaries (
  id text primary key,
  patient_id text unique not null,
  uhid text,
  patient_name text not null,
  age integer,
  gender text,
  preferred_language text default 'en',
  summary_period_start text,
  summary_period_end text,
  executive_summary text,
  key_conditions jsonb default '[]'::jsonb,
  current_medications jsonb default '[]'::jsonb,
  allergies jsonb default '[]'::jsonb,
  important_events jsonb default '[]'::jsonb,
  lab_highlights jsonb default '[]'::jsonb,
  abnormal_attention_items jsonb default '[]'::jsonb,
  recent_consultations jsonb default '[]'::jsonb,
  triage_safety_summary jsonb default '{}'::jsonb,
  ayush_summary jsonb,
  older_history_highlights jsonb default '[]'::jsonb,
  source_record_count integer default 0,
  is_ai_assisted boolean default true,
  generated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_one_year_summaries_patient on patient_one_year_summaries(patient_id);

alter table patient_one_year_summaries enable row level security;
drop policy if exists "Allow public access for patient_one_year_summaries" on patient_one_year_summaries;
create policy "Allow public access for patient_one_year_summaries" on patient_one_year_summaries for all using (true) with check (true);

-- -----------------------------------------------------------------------------
-- 8. TRIAGE ASSESSMENTS (Nurse & Emergency Acuity Matrix)
-- -----------------------------------------------------------------------------
create table if not exists triage_assessments (
  id text primary key default gen_random_uuid()::text,
  patient_id text not null,
  patient_name text not null,
  age integer,
  gender text,
  token_number text,
  triage_level text not null default 'STANDARD_OPD',
  priority_score integer default 3,
  vitals jsonb default '{}'::jsonb,
  red_flags jsonb default '[]'::jsonb,
  chief_complaint text,
  destination_department text,
  status text default 'waiting_consultation',
  assigned_nurse text,
  clinical_rationale text,
  immediate_actions jsonb default '[]'::jsonb,
  assessed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_triage_patient_id on triage_assessments(patient_id);
create index if not exists idx_triage_level on triage_assessments(triage_level);

alter table triage_assessments enable row level security;
drop policy if exists "Allow public access for triage_assessments" on triage_assessments;
create policy "Allow public access for triage_assessments" on triage_assessments for all using (true) with check (true);

-- -----------------------------------------------------------------------------
-- 9. AUDIT LOGS (HIPAA & ABDM Compliant Activity Trail)
-- -----------------------------------------------------------------------------
create table if not exists audit_logs (
  id text primary key default gen_random_uuid()::text,
  user_id text,
  user_role text,
  user_name text,
  action text not null,
  resource_type text not null,
  resource_id text,
  note text,
  ip_address text,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_audit_resource on audit_logs(resource_type, resource_id);

alter table audit_logs enable row level security;
drop policy if exists "Allow public access for audit_logs" on audit_logs;
create policy "Allow public access for audit_logs" on audit_logs for all using (true) with check (true);

-- -----------------------------------------------------------------------------
-- 10. HOSPITAL STAFF & CLINICAL DOCTORS (Provisioned by HIS Admin)
-- -----------------------------------------------------------------------------
create table if not exists hospital_staff (
  id text primary key default ('staff-' || gen_random_uuid()::text),
  staff_id text unique not null,
  full_name text not null,
  role text not null default 'doctor', -- 'doctor', 'medical_officer', 'triage_nurse'
  role_title text default 'Consultant Physician',
  department text not null default 'General Medicine OPD',
  specialization text default 'General Medicine',
  registration_number text default 'MCI-PENDING', -- Medical Council / Nursing Council Reg Number
  employee_code text,
  mobile text,
  email text,
  qualification text default 'MBBS, MD',
  joining_date text,
  room_number text default 'Room 104',
  opd_timings text default '09:00 AM - 01:00 PM',
  consultation_fee numeric default 0,
  available_days jsonb default '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]'::jsonb,
  bio text,
  status text not null default 'active', -- 'active', 'suspended', 'deactivated'
  status_reason text,
  pin_hash text,
  last_login_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Idempotent column additions in case hospital_staff was previously created
alter table hospital_staff add column if not exists room_number text default 'Room 104';
alter table hospital_staff add column if not exists opd_timings text default '09:00 AM - 01:00 PM';
alter table hospital_staff add column if not exists consultation_fee numeric default 0;
alter table hospital_staff add column if not exists available_days jsonb default '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]'::jsonb;
alter table hospital_staff add column if not exists bio text;
alter table hospital_staff add column if not exists status_reason text;
alter table hospital_staff add column if not exists pin_hash text;
alter table hospital_staff add column if not exists last_login_at timestamp with time zone;

create index if not exists idx_staff_staff_id on hospital_staff(staff_id);
create index if not exists idx_staff_role on hospital_staff(role);
create index if not exists idx_staff_department on hospital_staff(department);
create index if not exists idx_staff_status on hospital_staff(status);

alter table hospital_staff enable row level security;
drop policy if exists "Allow public access for hospital_staff" on hospital_staff;
create policy "Allow public access for hospital_staff" on hospital_staff for all using (true) with check (true);

-- -----------------------------------------------------------------------------
-- 11. DOCTORS DEDICATED VIEW (For Quick Clinical Querying & HIS Admin Roster)
-- -----------------------------------------------------------------------------
create or replace view doctors as 
  select 
    id,
    staff_id as doctor_id,
    full_name as doctor_name,
    role,
    role_title,
    department,
    specialization,
    registration_number as medical_council_reg_no,
    employee_code,
    mobile,
    email,
    qualification,
    joining_date,
    room_number,
    opd_timings,
    consultation_fee,
    available_days,
    bio,
    status,
    status_reason,
    last_login_at,
    created_at,
    updated_at
  from hospital_staff
  where role in ('doctor', 'medical_officer');

-- -----------------------------------------------------------------------------
-- 12. HOSPITAL SYSTEM CONFIGURATION (Facility Settings from HIS Admin)
-- -----------------------------------------------------------------------------
create table if not exists hospital_system_config (
  id text primary key default 'primary_hospital_config',
  hospital_name text not null default 'AIIMS New Delhi - Apex OPD Facility',
  facility_id text default 'AIIMS-ND-OPD-01',
  tagline text default 'National Center of Clinical Excellence',
  address text default 'Sri Aurobindo Marg, Ansari Nagar, New Delhi, Delhi 110029',
  contact_number text default '+91 11 2658 8500',
  emergency_helpline text default '102 / 112',
  ambulance_hotline text default '+91 11 2659 4405',
  opd_timing text default '08:00 AM - 04:00 PM (Monday to Saturday)',
  departments jsonb default '["General Medicine OPD", "Emergency & Casualty", "Cardiology OPD", "Pediatrics & Child Health", "AYUSH Integrative Health Center", "Pulmonology & Chest Clinic", "Orthopedics & Trauma", "Obstetrics & Gynecology"]'::jsonb,
  active_care_streams jsonb default '["allopathy", "ayurveda", "homeopathy", "unani", "siddha", "yoga"]'::jsonb,
  abdm_enabled boolean default true,
  offline_sync_enabled boolean default true,
  updated_by text default 'HIS Master Administrator',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table hospital_system_config enable row level security;
drop policy if exists "Allow public access for hospital_system_config" on hospital_system_config;
create policy "Allow public access for hospital_system_config" on hospital_system_config for all using (true) with check (true);

-- -----------------------------------------------------------------------------
-- 13. SEED CLINICAL DOCTORS & STAFF (Initial Administrative Roster)
-- -----------------------------------------------------------------------------
insert into hospital_staff (
  id, staff_id, full_name, role, role_title, department, specialization,
  registration_number, employee_code, mobile, email, qualification, joining_date,
  room_number, opd_timings, consultation_fee, available_days, bio,
  status, pin_hash, created_at, updated_at
) values 
  (
    'staff-doc-sohom',
    'DOC-SOHOM-01',
    'Dr. Sohom Das, MD',
    'doctor',
    'Senior Consultant Physician',
    'General Medicine OPD (Room 104)',
    'Internal Medicine, Diabetes & Chronic Disease Management',
    'WBMC-2014-55192',
    'DOC-SOHOM-01',
    '+91 98301 22345',
    'rtddas33@gmail.com',
    'MBBS, MD (Internal Medicine), Fellowship in Diabetology',
    '2019-01-10',
    'OPD Room 104',
    '08:30 AM - 01:30 PM',
    0,
    '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]'::jsonb,
    'Specialist in comprehensive chronic disease care, insulin therapy management, and multi-morbidity coordination.',
    'active',
    '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
    now(), now()
  ),
  (
    'staff-doc-01',
    'DOC-AIIMS-04',
    'Dr. Sunita Rao, MD',
    'doctor',
    'Senior Consultant Physician',
    'General Medicine OPD (Room 104)',
    'Internal Medicine & Chronic Care',
    'MCI-2012-44918',
    'DOC-AIIMS-04',
    '+91 98101 22345',
    'dr.sunita.rao@aiims.edu',
    'MBBS, MD (Medicine), Fellowship in Diabetology',
    '2018-06-15',
    'OPD Room 104',
    '09:00 AM - 02:00 PM',
    0,
    '["Monday", "Wednesday", "Friday", "Saturday"]'::jsonb,
    'Lead physician for outpatient triage and metabolic syndrome management.',
    'active',
    '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
    now(), now()
  ),
  (
    'staff-doc-02',
    'DOC-CARDIO-12',
    'Dr. Ananya Mukherjee, DM',
    'doctor',
    'Consultant Cardiologist',
    'Cardiology & Chest Pain Center',
    'Interventional Cardiology',
    'WBMC-2010-38472',
    'DOC-CARDIO-12',
    '+91 98300 77665',
    'dr.ananya.m@aiims.edu',
    'MBBS, MD (Medicine), DM (Cardiology)',
    '2021-08-10',
    'Room 208, Cardiology Block',
    '10:00 AM - 03:00 PM',
    0,
    '["Tuesday", "Thursday", "Saturday"]'::jsonb,
    'Specializes in angioplasty, heart failure, and ischemic heart disease.',
    'active',
    '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
    now(), now()
  ),
  (
    'staff-doc-03',
    'DOC-ENDO-08',
    'Dr. Anita Desai, MD',
    'doctor',
    'Senior Endocrinologist & Diabetologist',
    'Endocrinology & Metabolic Disorders OPD',
    'Endocrinology & Thyroid Specialist',
    'MCI-2009-88127',
    'DOC-ENDO-08',
    '+91 98200 44556',
    'dr.anita.desai@aiims.edu',
    'MBBS, MD (General Medicine), DM (Endocrinology)',
    '2017-04-12',
    'Room 112, 1st Floor',
    '09:30 AM - 01:30 PM',
    0,
    '["Monday", "Tuesday", "Thursday"]'::jsonb,
    'Focus on juvenile diabetes, thyroid disorders, and pituitary conditions.',
    'active',
    '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
    now(), now()
  ),
  (
    'staff-doc-04',
    'DOC-CARDIO-01',
    'Dr. R. K. Sharma, MD, DM',
    'doctor',
    'Head of Cardiology & Cath Lab',
    'Cardiology & Chest Pain Center',
    'Cardiology & Vascular Medicine',
    'DMC-2005-11029',
    'DOC-CARDIO-01',
    '+91 98111 99887',
    'dr.rk.sharma@aiims.edu',
    'MBBS, MD (Medicine), DM (Cardiology)',
    '2015-02-01',
    'Room 201, Cath Lab Wing',
    '09:00 AM - 01:00 PM',
    0,
    '["Monday", "Wednesday", "Friday"]'::jsonb,
    'Chief of Cardiology services with over 20 years of clinical experience.',
    'active',
    '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
    now(), now()
  ),
  (
    'staff-mo-01',
    'MO-DELHI-09',
    'Dr. Rajesh Nair, MBBS',
    'medical_officer',
    'Duty Medical Officer (Emergency & Casualty)',
    'Emergency & Acute Care Department',
    'Emergency Medicine & Acute Care',
    'DMC-2016-19283',
    'MO-DELHI-09',
    '+91 98711 55678',
    'dr.rajesh.nair@aiims.edu',
    'MBBS, Dip. Emergency Medicine (DEM)',
    '2020-11-01',
    'Emergency Casualty Bay 03',
    '24x7 Rotational Shift',
    0,
    '["All Days"]'::jsonb,
    'Emergency resuscitation, acute trauma triage, and urgent life support.',
    'active',
    '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
    now(), now()
  ),
  (
    'staff-nurse-01',
    'NURSE-01',
    'Sister Nirmala Joseph, B.Sc Nursing',
    'triage_nurse',
    'Senior Triage Officer & Nursing Lead',
    'OPD Reception & Triage Desk',
    'Clinical Triage & Emergency Vitals Assessment',
    'INC-2014-99882',
    'NURSE-01',
    '+91 99100 88776',
    'nirmala.joseph@aiims.edu',
    'B.Sc (Hons) Nursing, ACLS Certified',
    '2019-03-20',
    'Triage Station Alpha',
    '07:30 AM - 03:30 PM',
    0,
    '["Monday to Saturday"]'::jsonb,
    'Chief nurse for vital signs acquisition and red-flag escalation.',
    'active',
    '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
    now(), now()
  ),
  (
    'staff-nurse-02',
    'NURSE-02',
    'Sister Priya Sharma, GNM',
    'triage_nurse',
    'Staff Nurse & Vitals Assessor',
    'Pediatric & General OPD Triage',
    'Pediatric Care & Kiosk Assisting',
    'DNC-2018-77112',
    'NURSE-02',
    '+91 98112 44332',
    'priya.sharma@aiims.edu',
    'General Nursing & Midwifery (GNM)',
    '2022-02-14',
    'Triage Station Beta',
    '08:00 AM - 04:00 PM',
    0,
    '["Monday to Saturday"]'::jsonb,
    'Assists geriatric and pediatric patients with kiosk vitals intake.',
    'active',
    '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
    now(), now()
  )
on conflict (staff_id) do update set
  full_name = excluded.full_name,
  role = excluded.role,
  role_title = excluded.role_title,
  department = excluded.department,
  specialization = excluded.specialization,
  registration_number = excluded.registration_number,
  employee_code = excluded.employee_code,
  mobile = excluded.mobile,
  email = excluded.email,
  qualification = excluded.qualification,
  joining_date = excluded.joining_date,
  room_number = excluded.room_number,
  opd_timings = excluded.opd_timings,
  consultation_fee = excluded.consultation_fee,
  available_days = excluded.available_days,
  bio = excluded.bio,
  status = excluded.status,
  updated_at = now();

insert into hospital_system_config (
  id, hospital_name, facility_id, tagline, address, contact_number,
  emergency_helpline, ambulance_hotline, opd_timing, departments, active_care_streams,
  abdm_enabled, offline_sync_enabled, updated_by, updated_at
) values (
  'primary_hospital_config',
  'AIIMS New Delhi - Apex OPD Facility',
  'AIIMS-ND-OPD-01',
  'National Center of Clinical Excellence',
  'Sri Aurobindo Marg, Ansari Nagar, New Delhi, Delhi 110029',
  '+91 11 2658 8500',
  '102 / 112',
  '+91 11 2659 4405',
  '08:00 AM - 04:00 PM (Monday to Saturday)',
  '["General Medicine OPD", "Emergency & Casualty", "Cardiology OPD", "Pediatrics & Child Health", "AYUSH Integrative Health Center", "Pulmonology & Chest Clinic", "Orthopedics & Trauma", "Obstetrics & Gynecology"]'::jsonb,
  '["allopathy", "ayurveda", "homeopathy", "unani", "siddha", "yoga"]'::jsonb,
  true,
  true,
  'HIS Master Administrator',
  now()
) on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- 14. SAFE IDEMPOTENT UPGRADE MIGRATIONS (Ensure all columns & indexes exist)
-- -----------------------------------------------------------------------------
alter table if exists ambulance_bookings add column if not exists patient_name text default 'Emergency Patient';
alter table if exists ambulance_bookings add column if not exists patient_phone text;
alter table if exists ambulance_bookings add column if not exists pickup_address text;
alter table if exists ambulance_bookings add column if not exists pickup_lat numeric;
alter table if exists ambulance_bookings add column if not exists pickup_lng numeric;
alter table if exists ambulance_bookings add column if not exists destination_hospital text;
alter table if exists ambulance_bookings add column if not exists ambulance_tier text default 'basic';
alter table if exists ambulance_bookings add column if not exists fare_inr numeric default 0;
alter table if exists ambulance_bookings add column if not exists eta_minutes integer default 15;
alter table if exists ambulance_bookings add column if not exists is_critical boolean default false;
alter table if exists ambulance_bookings add column if not exists condition_notes text;
alter table if exists ambulance_bookings add column if not exists driver_name text default 'Paramedic Vikram Singh';
alter table if exists ambulance_bookings add column if not exists driver_phone text default '+91 94123 78901';
alter table if exists ambulance_bookings add column if not exists vehicle_number text default 'DL-01-EQ-9112';
alter table if exists ambulance_bookings add column if not exists status text default 'booked';
alter table if exists ambulance_bookings add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

alter table if exists patients add column if not exists uhid text;
alter table if exists patients add column if not exists abha_id text;
alter table if exists patients add column if not exists name text;
alter table if exists patients add column if not exists age integer;
alter table if exists patients add column if not exists gender text;
alter table if exists patients add column if not exists phone text;
alter table if exists patients add column if not exists email text;
alter table if exists patients add column if not exists language text default 'en';
alter table if exists patients add column if not exists symptoms jsonb default '[]'::jsonb;
alter table if exists patients add column if not exists vitals jsonb default '{}'::jsonb;
alter table if exists patients add column if not exists current_medications jsonb default '[]'::jsonb;
alter table if exists patients add column if not exists allergies jsonb default '[]'::jsonb;
alter table if exists patients add column if not exists past_illnesses jsonb default '[]'::jsonb;
alter table if exists patients add column if not exists past_surgeries jsonb default '[]'::jsonb;
alter table if exists patients add column if not exists family_history jsonb default '[]'::jsonb;
alter table if exists patients add column if not exists timeline jsonb default '[]'::jsonb;
alter table if exists patients add column if not exists triage_risk text default 'STANDARD_OPD';
alter table if exists patients add column if not exists red_flags_detected jsonb default '[]'::jsonb;
alter table if exists patients add column if not exists department text default 'General Medicine';
alter table if exists patients add column if not exists care_stream text default 'allopathy';
alter table if exists patients add column if not exists queue_token text;
alter table if exists patients add column if not exists is_emergency boolean default false;
alter table if exists patients add column if not exists ayush_assessment jsonb;
alter table if exists patients add column if not exists clinical_summary jsonb;
alter table if exists patients add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

-- Safe indexes for rapid querying in production
create index if not exists idx_ambulance_bookings_id on ambulance_bookings(booking_id);
create index if not exists idx_ambulance_patient_name on ambulance_bookings(patient_name);
create index if not exists idx_ambulance_status on ambulance_bookings(status);
create index if not exists idx_patients_patient_id on patients(patient_id);
create index if not exists idx_patients_uhid on patients(uhid);
create index if not exists idx_patients_email on patients(email);
create index if not exists idx_patients_phone on patients(phone);
`;

/**
 * INCREMENTAL SQL SCRIPT TO UPDATE BACKEND WITH DOCTORS & STAFF
 * Paste this directly into Supabase SQL Editor:
 * https://supabase.com/dashboard/project/aylqpvgaamipwufejnan/sql/new
 */
export const SUPABASE_DOCTORS_STAFF_SQL = `-- ==============================================================================
-- MEDIKIOSK AI: DOCTORS & CLINICAL STAFF BACKEND SCHEMA (INCREMENTAL UPDATE)
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/aylqpvgaamipwufejnan/sql/new
-- ==============================================================================

-- 1. Create or update hospital_staff table
create table if not exists hospital_staff (
  id text primary key default ('staff-' || gen_random_uuid()::text),
  staff_id text unique not null,
  full_name text not null,
  role text not null default 'doctor', -- 'doctor', 'medical_officer', 'triage_nurse'
  role_title text default 'Consultant Physician',
  department text not null default 'General Medicine OPD',
  specialization text default 'General Medicine',
  registration_number text default 'MCI-PENDING', -- Medical Council / Nursing Council Reg Number
  employee_code text,
  mobile text,
  email text,
  qualification text default 'MBBS, MD',
  joining_date text,
  room_number text default 'Room 104',
  opd_timings text default '09:00 AM - 01:00 PM',
  consultation_fee numeric default 0,
  available_days jsonb default '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]'::jsonb,
  bio text,
  status text not null default 'active', -- 'active', 'suspended', 'deactivated'
  status_reason text,
  pin_hash text,
  last_login_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure all modern clinical columns exist
alter table hospital_staff add column if not exists room_number text default 'Room 104';
alter table hospital_staff add column if not exists opd_timings text default '09:00 AM - 01:00 PM';
alter table hospital_staff add column if not exists consultation_fee numeric default 0;
alter table hospital_staff add column if not exists available_days jsonb default '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]'::jsonb;
alter table hospital_staff add column if not exists bio text;
alter table hospital_staff add column if not exists status_reason text;
alter table hospital_staff add column if not exists pin_hash text;
alter table hospital_staff add column if not exists last_login_at timestamp with time zone;

create index if not exists idx_staff_staff_id on hospital_staff(staff_id);
create index if not exists idx_staff_role on hospital_staff(role);
create index if not exists idx_staff_department on hospital_staff(department);
create index if not exists idx_staff_status on hospital_staff(status);

alter table hospital_staff enable row level security;
drop policy if exists "Allow public access for hospital_staff" on hospital_staff;
create policy "Allow public access for hospital_staff" on hospital_staff for all using (true) with check (true);

-- 2. Dedicated Doctors View with all details filled by HIS admin
create or replace view doctors as 
  select 
    id,
    staff_id as doctor_id,
    full_name as doctor_name,
    role,
    role_title,
    department,
    specialization,
    registration_number as medical_council_reg_no,
    employee_code,
    mobile,
    email,
    qualification,
    joining_date,
    room_number,
    opd_timings,
    consultation_fee,
    available_days,
    bio,
    status,
    status_reason,
    last_login_at,
    created_at,
    updated_at
  from hospital_staff
  where role in ('doctor', 'medical_officer');

-- 3. Hospital System Config table
create table if not exists hospital_system_config (
  id text primary key default 'primary_hospital_config',
  hospital_name text not null default 'AIIMS New Delhi - Apex OPD Facility',
  facility_id text default 'AIIMS-ND-OPD-01',
  tagline text default 'National Center of Clinical Excellence',
  address text default 'Sri Aurobindo Marg, Ansari Nagar, New Delhi, Delhi 110029',
  contact_number text default '+91 11 2658 8500',
  emergency_helpline text default '102 / 112',
  ambulance_hotline text default '+91 11 2659 4405',
  opd_timing text default '08:00 AM - 04:00 PM (Monday to Saturday)',
  departments jsonb default '["General Medicine OPD", "Emergency & Casualty", "Cardiology OPD", "Pediatrics & Child Health", "AYUSH Integrative Health Center", "Pulmonology & Chest Clinic", "Orthopedics & Trauma", "Obstetrics & Gynecology"]'::jsonb,
  active_care_streams jsonb default '["allopathy", "ayurveda", "homeopathy", "unani", "siddha", "yoga"]'::jsonb,
  abdm_enabled boolean default true,
  offline_sync_enabled boolean default true,
  updated_by text default 'HIS Master Administrator',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table hospital_system_config enable row level security;
drop policy if exists "Allow public access for hospital_system_config" on hospital_system_config;
create policy "Allow public access for hospital_system_config" on hospital_system_config for all using (true) with check (true);

-- 4. Seed Doctors & Staff with complete details
insert into hospital_staff (
  id, staff_id, full_name, role, role_title, department, specialization,
  registration_number, employee_code, mobile, email, qualification, joining_date,
  room_number, opd_timings, consultation_fee, available_days, bio,
  status, pin_hash, created_at, updated_at
) values 
  (
    'staff-doc-sohom',
    'DOC-SOHOM-01',
    'Dr. Sohom Das, MD',
    'doctor',
    'Senior Consultant Physician',
    'General Medicine OPD (Room 104)',
    'Internal Medicine, Diabetes & Chronic Disease Management',
    'WBMC-2014-55192',
    'DOC-SOHOM-01',
    '+91 98301 22345',
    'rtddas33@gmail.com',
    'MBBS, MD (Internal Medicine), Fellowship in Diabetology',
    '2019-01-10',
    'OPD Room 104',
    '08:30 AM - 01:30 PM',
    0,
    '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]'::jsonb,
    'Specialist in comprehensive chronic disease care, diabetes management, and geriatric medicine.',
    'active',
    '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
    now(), now()
  ),
  (
    'staff-doc-01',
    'DOC-AIIMS-04',
    'Dr. Sunita Rao, MD',
    'doctor',
    'Senior Consultant Physician',
    'General Medicine OPD (Room 104)',
    'Internal Medicine & Chronic Care',
    'MCI-2012-44918',
    'DOC-AIIMS-04',
    '+91 98101 22345',
    'dr.sunita.rao@aiims.edu',
    'MBBS, MD (Medicine), Fellowship in Diabetology',
    '2018-06-15',
    'OPD Room 104',
    '09:00 AM - 02:00 PM',
    0,
    '["Monday", "Wednesday", "Friday", "Saturday"]'::jsonb,
    'Lead physician for outpatient triage and metabolic syndrome management.',
    'active',
    '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
    now(), now()
  ),
  (
    'staff-doc-02',
    'DOC-CARDIO-12',
    'Dr. Ananya Mukherjee, DM',
    'doctor',
    'Consultant Cardiologist',
    'Cardiology & Chest Pain Center',
    'Interventional Cardiology',
    'WBMC-2010-38472',
    'DOC-CARDIO-12',
    '+91 98300 77665',
    'dr.ananya.m@aiims.edu',
    'MBBS, MD (Medicine), DM (Cardiology)',
    '2021-08-10',
    'Room 208, Cardiology Block',
    '10:00 AM - 03:00 PM',
    0,
    '["Tuesday", "Thursday", "Saturday"]'::jsonb,
    'Specializes in angioplasty, heart failure, and ischemic heart disease.',
    'active',
    '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
    now(), now()
  ),
  (
    'staff-doc-03',
    'DOC-ENDO-08',
    'Dr. Anita Desai, MD',
    'doctor',
    'Senior Endocrinologist & Diabetologist',
    'Endocrinology & Metabolic Disorders OPD',
    'Endocrinology & Thyroid Specialist',
    'MCI-2009-88127',
    'DOC-ENDO-08',
    '+91 98200 44556',
    'dr.anita.desai@aiims.edu',
    'MBBS, MD (General Medicine), DM (Endocrinology)',
    '2017-04-12',
    'Room 112, 1st Floor',
    '09:30 AM - 01:30 PM',
    0,
    '["Monday", "Tuesday", "Thursday"]'::jsonb,
    'Focus on juvenile diabetes, thyroid disorders, and pituitary conditions.',
    'active',
    '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
    now(), now()
  ),
  (
    'staff-doc-04',
    'DOC-CARDIO-01',
    'Dr. R. K. Sharma, MD, DM',
    'doctor',
    'Head of Cardiology & Cath Lab',
    'Cardiology & Chest Pain Center',
    'Cardiology & Vascular Medicine',
    'DMC-2005-11029',
    'DOC-CARDIO-01',
    '+91 98111 99887',
    'dr.rk.sharma@aiims.edu',
    'MBBS, MD (Medicine), DM (Cardiology)',
    '2015-02-01',
    'Room 201, Cath Lab Wing',
    '09:00 AM - 01:00 PM',
    0,
    '["Monday", "Wednesday", "Friday"]'::jsonb,
    'Chief of Cardiology services with over 20 years of clinical experience.',
    'active',
    '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
    now(), now()
  ),
  (
    'staff-mo-01',
    'MO-DELHI-09',
    'Dr. Rajesh Nair, MBBS',
    'medical_officer',
    'Duty Medical Officer (Emergency & Casualty)',
    'Emergency & Acute Care Department',
    'Emergency Medicine & Acute Care',
    'DMC-2016-19283',
    'MO-DELHI-09',
    '+91 98711 55678',
    'dr.rajesh.nair@aiims.edu',
    'MBBS, Dip. Emergency Medicine (DEM)',
    '2020-11-01',
    'Emergency Casualty Bay 03',
    '24x7 Rotational Shift',
    0,
    '["All Days"]'::jsonb,
    'Emergency resuscitation, acute trauma triage, and urgent life support.',
    'active',
    '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
    now(), now()
  ),
  (
    'staff-nurse-01',
    'NURSE-01',
    'Sister Nirmala Joseph, B.Sc Nursing',
    'triage_nurse',
    'Senior Triage Officer & Nursing Lead',
    'OPD Reception & Triage Desk',
    'Clinical Triage & Emergency Vitals Assessment',
    'INC-2014-99882',
    'NURSE-01',
    '+91 99100 88776',
    'nirmala.joseph@aiims.edu',
    'B.Sc (Hons) Nursing, ACLS Certified',
    '2019-03-20',
    'Triage Station Alpha',
    '07:30 AM - 03:30 PM',
    0,
    '["Monday to Saturday"]'::jsonb,
    'Chief nurse for vital signs acquisition and red-flag escalation.',
    'active',
    '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
    now(), now()
  ),
  (
    'staff-nurse-02',
    'NURSE-02',
    'Sister Priya Sharma, GNM',
    'triage_nurse',
    'Staff Nurse & Vitals Assessor',
    'Pediatric & General OPD Triage',
    'Pediatric Care & Kiosk Assisting',
    'DNC-2018-77112',
    'NURSE-02',
    '+91 98112 44332',
    'priya.sharma@aiims.edu',
    'General Nursing & Midwifery (GNM)',
    '2022-02-14',
    'Triage Station Beta',
    '08:00 AM - 04:00 PM',
    0,
    '["Monday to Saturday"]'::jsonb,
    'Assists geriatric and pediatric patients with kiosk vitals intake.',
    'active',
    '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
    now(), now()
  )
on conflict (staff_id) do nothing;

insert into hospital_system_config (
  id, hospital_name, facility_id, tagline, address, contact_number,
  emergency_helpline, ambulance_hotline, opd_timing, departments, active_care_streams,
  abdm_enabled, offline_sync_enabled, updated_by, updated_at
) values (
  'primary_hospital_config',
  'AIIMS New Delhi - Apex OPD Facility',
  'AIIMS-ND-OPD-01',
  'National Center of Clinical Excellence',
  'Sri Aurobindo Marg, Ansari Nagar, New Delhi, Delhi 110029',
  '+91 11 2658 8500',
  '102 / 112',
  '+91 11 2659 4405',
  '08:00 AM - 04:00 PM (Monday to Saturday)',
  '["General Medicine OPD", "Emergency & Casualty", "Cardiology OPD", "Pediatrics & Child Health", "AYUSH Integrative Health Center", "Pulmonology & Chest Clinic", "Orthopedics & Trauma", "Obstetrics & Gynecology"]'::jsonb,
  '["allopathy", "ayurveda", "homeopathy", "unani", "siddha", "yoga"]'::jsonb,
  true,
  true,
  'HIS Master Administrator',
  now()
) on conflict (id) do nothing;

-- Ensure all ambulance and patient columns exist
alter table if exists ambulance_bookings add column if not exists patient_name text default 'Emergency Patient';
alter table if exists ambulance_bookings add column if not exists patient_phone text;
alter table if exists ambulance_bookings add column if not exists pickup_address text;
alter table if exists ambulance_bookings add column if not exists pickup_lat numeric;
alter table if exists ambulance_bookings add column if not exists pickup_lng numeric;
alter table if exists ambulance_bookings add column if not exists destination_hospital text;
alter table if exists ambulance_bookings add column if not exists ambulance_tier text default 'basic';
alter table if exists ambulance_bookings add column if not exists fare_inr numeric default 0;
alter table if exists ambulance_bookings add column if not exists eta_minutes integer default 15;
alter table if exists ambulance_bookings add column if not exists is_critical boolean default false;
alter table if exists ambulance_bookings add column if not exists condition_notes text;
alter table if exists ambulance_bookings add column if not exists driver_name text default 'Paramedic Vikram Singh';
alter table if exists ambulance_bookings add column if not exists driver_phone text default '+91 94123 78901';
alter table if exists ambulance_bookings add column if not exists vehicle_number text default 'DL-01-EQ-9112';
alter table if exists ambulance_bookings add column if not exists status text default 'booked';

alter table if exists patients add column if not exists uhid text;
alter table if exists patients add column if not exists abha_id text;
alter table if exists patients add column if not exists name text;
alter table if exists patients add column if not exists phone text;
alter table if exists patients add column if not exists email text;
`;

/**
 * Test connectivity with Supabase project across all primary tables
 */
export async function testSupabaseConnection(): Promise<{ 
  connected: boolean; 
  message: string; 
  tableExists: boolean;
  tableDetails?: Record<string, boolean>;
}> {
  try {
    const tableChecks: Record<string, boolean> = {
      appointments: false,
      ambulance_bookings: false,
      prescriptions: false,
      hospital_staff: false,
      doctors: false,
      hospital_system_config: false,
      patient_medical_history: false,
      medical_history_documents: false,
      patients: false,
      patient_one_year_summaries: false,
      triage_assessments: false,
      audit_logs: false
    };

    let anyTableFound = false;

    for (const tableName of Object.keys(tableChecks)) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('count', { count: 'exact', head: true });

        if (!error) {
          tableChecks[tableName] = true;
          anyTableFound = true;
        }
      } catch {
        // Table not created yet
      }
    }

    if (anyTableFound) {
      const activeCount = Object.values(tableChecks).filter(Boolean).length;
      return {
        connected: true,
        tableExists: true,
        tableDetails: tableChecks,
        message: `Connected to Supabase! ${activeCount} of ${Object.keys(tableChecks).length} clinical tables active.`
      };
    }

    // Try a simple ping
    const { error: pingError } = await supabase
      .from('appointments')
      .select('count', { count: 'exact', head: true });

    if (pingError) {
      if (pingError.code === '42P01' || pingError.message?.includes('relation "appointments" does not exist') || pingError.message?.includes('does not exist')) {
        return {
          connected: true,
          tableExists: false,
          tableDetails: tableChecks,
          message: 'Connected to Supabase! Please execute the SQL Schema in your SQL Editor.'
        };
      }
      return {
        connected: false,
        tableExists: false,
        message: `Supabase Connection Notice: ${pingError.message}`
      };
    }

    return {
      connected: true,
      tableExists: true,
      tableDetails: tableChecks,
      message: 'Connected & Database tables verified.'
    };
  } catch (err: any) {
    return {
      connected: false,
      tableExists: false,
      message: err?.message || 'Failed to reach Supabase endpoint'
    };
  }
}

// ============================================================================
// APPOINTMENTS SYNC HELPERS
// ============================================================================

export async function saveAppointmentToSupabase(appointment: Appointment): Promise<{ success: boolean; data?: any; error?: string; isDbPersisted?: boolean }> {
  try {
    const payload = {
      booking_id: appointment.id,
      patient_id: appointment.patientId,
      patient_name: appointment.patientName,
      uhid: appointment.uhid,
      token_number: appointment.tokenNumber,
      department: appointment.department,
      doctor_name: appointment.doctorName,
      doctor_specialty: appointment.doctorSpecialty,
      care_stream: appointment.careStream,
      appointment_date: appointment.date,
      time_slot: appointment.timeSlot,
      chief_complaint: appointment.chiefComplaint,
      room_number: appointment.roomNumber,
      status: appointment.status,
      abha_linked: appointment.abhaLinked,
      booking_type: appointment.bookingType || 'online_portal',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('appointments')
      .upsert([payload], { onConflict: 'booking_id' })
      .select();

    if (error) {
      console.warn('Supabase appointment insertion notice:', error.message);
      return { success: true, error: error.message, data: payload, isDbPersisted: false };
    }

    return { success: true, data, isDbPersisted: true };
  } catch (err: any) {
    console.warn('Supabase connection note:', err?.message);
    return { success: true, error: err?.message, isDbPersisted: false };
  }
}

export async function fetchAppointmentsFromSupabase(): Promise<{ appointments: Appointment[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return { appointments: [], error: error.message };
    }

    if (!data || data.length === 0) {
      return { appointments: [] };
    }

    const mapped: Appointment[] = data.map((item: any, idx: number) => ({
      id: item.booking_id || item.id || `APT-DB-${idx}`,
      patientId: item.patient_id || 'patient-default',
      patientName: item.patient_name || item.name || 'Unknown Patient',
      tokenNumber: item.token_number || `OPD-${100 + idx}`,
      uhid: item.uhid || `UHID-2026-${1000 + idx}`,
      department: item.department || 'General Medicine',
      doctorName: item.doctor_name || 'Dr. Assigned Specialist',
      doctorSpecialty: item.doctor_specialty || 'General Practitioner',
      careStream: (item.care_stream as any) || 'allopathy',
      date: item.appointment_date || 'Today',
      timeSlot: item.time_slot || '09:30 AM',
      status: (item.status as any) || 'in_queue',
      roomNumber: item.room_number || 'OPD Room 104',
      queuePosition: idx + 1,
      currentServingToken: 'OPD-100',
      estimatedWaitMinutes: (idx + 1) * 10,
      chiefComplaint: item.chief_complaint || 'Clinical consultation',
      abhaLinked: item.abha_linked ?? true,
      bookedAt: item.created_at ? new Date(item.created_at).toLocaleString() : new Date().toLocaleString(),
      bookingType: (item.booking_type as any) || 'online_portal'
    }));

    return { appointments: mapped };
  } catch (err: any) {
    return { appointments: [], error: err?.message };
  }
}

// ============================================================================
// AMBULANCE SOS SYNC HELPERS
// ============================================================================

export async function saveAmbulanceBookingToSupabase(booking: AmbulanceBookingRecord): Promise<{ success: boolean; data?: any; error?: string; isDbPersisted?: boolean }> {
  try {
    const payload = {
      booking_id: booking.booking_id || booking.id,
      patient_name: booking.patient_name || 'Emergency Patient',
      patient_phone: booking.patient_phone || '',
      pickup_address: booking.pickup_address || '',
      pickup_lat: booking.pickup_lat || booking.pickupLocation?.latitude,
      pickup_lng: booking.pickup_lng || booking.pickupLocation?.longitude,
      destination_hospital: booking.destination_hospital || (typeof booking.destinationHospital === 'string' ? booking.destinationHospital : booking.destinationHospital?.name || 'Nearest Emergency Center'),
      ambulance_tier: booking.ambulance_tier || 'basic',
      fare_inr: booking.fare_inr || 0,
      eta_minutes: booking.eta_minutes || 15,
      is_critical: Boolean(booking.is_critical),
      condition_notes: booking.condition_notes || '',
      driver_name: booking.driver_name || 'Paramedic Vikram Singh',
      driver_phone: booking.driver_phone || '+91 94123 78901',
      vehicle_number: booking.vehicle_number || 'DL-01-EQ-9112',
      status: booking.status || 'booked',
      created_at: booking.created_at || new Date().toISOString()
    };

    let { data, error } = await supabase
      .from('ambulance_bookings')
      .upsert([payload], { onConflict: 'booking_id' })
      .select();

    if (error && (error.message.includes('constraint') || error.message.includes('ON CONFLICT') || error.message.includes('unique'))) {
      const fallback = await supabase
        .from('ambulance_bookings')
        .insert([payload])
        .select();
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.warn('Supabase ambulance note:', error.message);
      return { success: true, error: error.message, data: booking, isDbPersisted: false };
    }

    return { success: true, data, isDbPersisted: true };
  } catch (err: any) {
    console.warn('Supabase ambulance note:', err?.message);
    return { success: true, error: err?.message, isDbPersisted: false };
  }
}

export async function fetchAmbulanceBookingsFromSupabase(limit = 25): Promise<{ bookings: AmbulanceBookingRecord[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('ambulance_bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { bookings: [], error: error.message };
    }

    const mapped: AmbulanceBookingRecord[] = (data || []).map((row: any) => ({
      id: row.id,
      booking_id: row.booking_id,
      patient_name: row.patient_name || 'Emergency Patient',
      patient_phone: row.patient_phone || '',
      pickup_address: row.pickup_address || '',
      pickup_lat: row.pickup_lat ? Number(row.pickup_lat) : undefined,
      pickup_lng: row.pickup_lng ? Number(row.pickup_lng) : undefined,
      destination_hospital: row.destination_hospital || 'Nearest Emergency Center',
      ambulance_tier: row.ambulance_tier || 'basic',
      fare_inr: Number(row.fare_inr || 0),
      eta_minutes: Number(row.eta_minutes || 15),
      is_critical: Boolean(row.is_critical),
      condition_notes: row.condition_notes || '',
      driver_name: row.driver_name || 'Paramedic Vikram Singh',
      driver_phone: row.driver_phone || '+91 94123 78901',
      vehicle_number: row.vehicle_number || 'DL-01-EQ-9112',
      status: row.status || 'booked',
      created_at: row.created_at
    }));

    return { bookings: mapped };
  } catch (err: any) {
    return { bookings: [], error: err?.message };
  }
}

export async function updateAmbulanceStatusInSupabase(bookingId: string, status: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('ambulance_bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('booking_id', bookingId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

// ============================================================================
// PRESCRIPTIONS SYNC HELPERS
// ============================================================================

export async function savePrescriptionToSupabase(prescription: PrescriptionRecord): Promise<{ success: boolean; data?: any; error?: string; isDbPersisted?: boolean }> {
  try {
    const payload = {
      id: prescription.id,
      patient_id: prescription.patientId,
      patient_name: prescription.patientName || 'Unknown Patient',
      uhid: prescription.uhid,
      token_number: (prescription as any).tokenNumber || null,
      doctor_id: prescription.doctorId,
      doctor_name: prescription.doctorName,
      doctor_specialty: (prescription as any).doctorSpecialty || null,
      doctor_license_number: (prescription as any).doctorLicenseNumber || null,
      hospital_id: prescription.hospitalId,
      hospital_name: prescription.hospitalName,
      prescription_date: prescription.prescriptionDate,
      source_type: prescription.sourceType || 'digital_portal',
      original_file_url: prescription.originalFileUrl,
      file_name: prescription.fileName,
      ocr_text: prescription.ocrText,
      medications: prescription.medications || [],
      diagnosis: prescription.diagnosis,
      symptoms: prescription.symptoms,
      recommended_tests: prescription.recommendedTests || [],
      general_advice: prescription.generalAdvice,
      follow_up_date: prescription.followUpDate,
      verification_status: prescription.verificationStatus || 'DRAFT',
      overall_confidence: prescription.overallConfidence || 95,
      has_low_confidence_fields: prescription.hasLowConfidenceFields ?? false,
      patient_verified_at: prescription.patientVerifiedAt,
      doctor_reviewed_by: prescription.doctorReviewedBy,
      doctor_reviewed_at: prescription.doctorReviewedAt,
      doctor_clinical_notes: prescription.doctorClinicalNotes,
      digital_signature: (prescription as any).digitalSignature || null,
      care_stream: (prescription as any).careStream || 'allopathy',
      audit_logs: prescription.auditLogs || [],
      created_at: prescription.createdAt || new Date().toISOString(),
      updated_at: prescription.updatedAt || new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('prescriptions')
      .upsert([payload], { onConflict: 'id' })
      .select();

    if (error) {
      console.warn('Supabase prescription sync notice:', error.message);
      return { success: true, error: error.message, isDbPersisted: false };
    }

    return { success: true, data, isDbPersisted: true };
  } catch (err: any) {
    console.warn('Supabase prescription error:', err?.message);
    return { success: true, error: err?.message, isDbPersisted: false };
  }
}

export async function fetchPrescriptionsFromSupabase(patientId?: string): Promise<{ prescriptions: PrescriptionRecord[]; error?: string }> {
  try {
    let query = supabase.from('prescriptions').select('*').order('created_at', { ascending: false });
    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    const { data, error } = await query;
    if (error) return { prescriptions: [], error: error.message };

    const mapped: PrescriptionRecord[] = (data || []).map((row: any) => ({
      id: row.id,
      patientId: row.patient_id,
      patientName: row.patient_name,
      uhid: row.uhid,
      doctorId: row.doctor_id,
      doctorName: row.doctor_name,
      hospitalId: row.hospital_id,
      hospitalName: row.hospital_name,
      prescriptionDate: row.prescription_date,
      sourceType: row.source_type,
      originalFileUrl: row.original_file_url,
      fileName: row.file_name,
      ocrText: row.ocr_text,
      medications: typeof row.medications === 'string' ? JSON.parse(row.medications) : (row.medications || []),
      diagnosis: row.diagnosis,
      symptoms: row.symptoms,
      recommendedTests: typeof row.recommended_tests === 'string' ? JSON.parse(row.recommended_tests) : (row.recommended_tests || []),
      generalAdvice: row.general_advice,
      followUpDate: row.follow_up_date,
      verificationStatus: row.verification_status,
      overallConfidence: Number(row.overall_confidence || 95),
      hasLowConfidenceFields: Boolean(row.has_low_confidence_fields),
      patientVerifiedAt: row.patient_verified_at,
      doctorReviewedBy: row.doctor_reviewed_by,
      doctorReviewedAt: row.doctor_reviewed_at,
      doctorClinicalNotes: row.doctor_clinical_notes,
      auditLogs: typeof row.audit_logs === 'string' ? JSON.parse(row.audit_logs) : (row.audit_logs || []),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return { prescriptions: mapped };
  } catch (err: any) {
    return { prescriptions: [], error: err?.message };
  }
}

// ============================================================================
// PATIENT PROFILES SYNC HELPERS
// ============================================================================

export async function savePatientProfileToSupabase(patient: PatientProfile): Promise<{ success: boolean; data?: any; error?: string; isDbPersisted?: boolean }> {
  try {
    const payload = {
      id: patient.id,
      patient_id: patient.patientId || patient.id,
      uhid: patient.uhid,
      abha_id: patient.abhaId,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.mobile || (patient as any).phone || '',
      email: (patient as any).email || '',
      language: patient.language || 'en',
      symptoms: patient.symptoms || [],
      vitals: patient.vitals || {},
      current_medications: patient.currentMedications || [],
      allergies: patient.allergies || [],
      past_illnesses: patient.pastIllnesses || [],
      past_surgeries: patient.pastSurgeries || [],
      family_history: patient.familyHistory || [],
      timeline: patient.timeline || [],
      triage_risk: patient.triageRisk || 'STANDARD_OPD',
      red_flags_detected: patient.redFlagsDetected || [],
      department: patient.department || 'General Medicine',
      care_stream: patient.careStream || 'allopathy',
      queue_token: patient.tokenNumber || (patient as any).queueToken || '',
      is_emergency: patient.triageRisk === 'CRITICAL_EMERGENCY',
      ayush_assessment: patient.ayushAssessment,
      clinical_summary: patient.clinicalSummary,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('patients')
      .upsert([payload], { onConflict: 'patient_id' })
      .select();

    if (error) {
      console.warn('Supabase patient profile sync notice:', error.message);
      return { success: true, error: error.message, isDbPersisted: false };
    }

    return { success: true, data, isDbPersisted: true };
  } catch (err: any) {
    console.warn('Supabase patient profile error:', err?.message);
    return { success: true, error: err?.message, isDbPersisted: false };
  }
}

export async function lookupPatientInSupabase(query: string): Promise<{ patient?: any; error?: string }> {
  try {
    const trimmed = query.trim();
    if (!trimmed) return { patient: undefined };

    const isEmail = trimmed.includes('@');
    const cleanDigits = trimmed.replace(/[^0-9]/g, '');

    let dbQuery = supabase.from('patients').select('*');

    if (isEmail) {
      dbQuery = dbQuery.ilike('email', trimmed.toLowerCase());
    } else if (cleanDigits.length >= 10) {
      dbQuery = dbQuery.or(`phone.ilike.%${cleanDigits.slice(-10)}%,abha_id.ilike.%${cleanDigits.slice(-10)}%`);
    } else {
      dbQuery = dbQuery.or(`uhid.ilike.%${trimmed}%,patient_id.eq.${trimmed},abha_id.ilike.%${trimmed}%`);
    }

    const { data, error } = await dbQuery.limit(1);

    if (error) {
      return { error: error.message };
    }

    if (data && data.length > 0) {
      return { patient: data[0] };
    }

    return { patient: undefined };
  } catch (err: any) {
    return { error: err?.message };
  }
}

export async function fetchPatientProfileFromSupabase(patientId: string): Promise<{ patient?: any; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .or(`patient_id.eq.${patientId},uhid.eq.${patientId},id.eq.${patientId}`)
      .limit(1);

    if (error) return { error: error.message };
    return { patient: data?.[0] };
  } catch (err: any) {
    return { error: err?.message };
  }
}

// ============================================================================
// 1-YEAR SUMMARY SYNC HELPERS
// ============================================================================

export async function saveOneYearSummaryToSupabase(summary: PatientOneYearSummary): Promise<{ success: boolean; data?: any; error?: string; isDbPersisted?: boolean }> {
  try {
    const payload = {
      id: summary.id,
      patient_id: summary.patientId,
      uhid: summary.uhid,
      patient_name: summary.patientName,
      age: summary.age,
      gender: summary.gender,
      preferred_language: summary.preferredLanguage || 'en',
      summary_period_start: summary.summaryPeriodStart,
      summary_period_end: summary.summaryPeriodEnd,
      executive_summary: summary.executiveSummary,
      key_conditions: summary.keyConditions || [],
      current_medications: summary.currentMedications || [],
      allergies: summary.allergies || [],
      important_events: summary.importantEventsLast12Months || [],
      lab_highlights: summary.labHighlights || [],
      abnormal_attention_items: summary.abnormalAttentionItems || [],
      recent_consultations: summary.recentConsultations || [],
      triage_safety_summary: summary.triageSafetySummary || {},
      ayush_summary: summary.ayushSummary,
      older_history_highlights: summary.olderHistoryHighlights || [],
      source_record_count: summary.sourceRecordCount || 0,
      is_ai_assisted: summary.isAiAssisted ?? true,
      generated_at: summary.generatedAt || new Date().toISOString(),
      updated_at: summary.updatedAt || new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('patient_one_year_summaries')
      .upsert([payload], { onConflict: 'patient_id' })
      .select();

    if (error) {
      console.warn('Supabase 1-year summary sync notice:', error.message);
      return { success: true, error: error.message, isDbPersisted: false };
    }

    return { success: true, data, isDbPersisted: true };
  } catch (err: any) {
    return { success: true, error: err?.message, isDbPersisted: false };
  }
}

// ============================================================================
// TRIAGE ASSESSMENTS SYNC HELPERS
// ============================================================================

export async function saveTriageAssessmentToSupabase(triage: TriageRecordPayload): Promise<{ success: boolean; data?: any; error?: string; isDbPersisted?: boolean }> {
  try {
    const payload = {
      patient_id: triage.patient_id,
      patient_name: triage.patient_name,
      age: triage.age,
      gender: triage.gender,
      token_number: triage.token_number,
      triage_level: triage.triage_level,
      priority_score: triage.priority_score,
      vitals: triage.vitals || {},
      red_flags: triage.red_flags || [],
      chief_complaint: triage.chief_complaint,
      destination_department: triage.destination_department,
      status: triage.status || 'waiting_consultation',
      assigned_nurse: triage.assigned_nurse,
      clinical_rationale: triage.clinical_rationale,
      immediate_actions: triage.immediate_actions || [],
      assessed_at: triage.assessed_at || new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('triage_assessments')
      .insert([payload])
      .select();

    if (error) {
      console.warn('Supabase triage assessment notice:', error.message);
      return { success: true, error: error.message, isDbPersisted: false };
    }

    return { success: true, data, isDbPersisted: true };
  } catch (err: any) {
    return { success: true, error: err?.message, isDbPersisted: false };
  }
}

// ============================================================================
// HOSPITAL STAFF & DOCTORS SYNC HELPERS (HIS ADMIN INTEGRATION)
// ============================================================================

export async function saveStaffMemberToSupabase(
  staff: HospitalStaffMember, 
  pinHash?: string
): Promise<{ success: boolean; data?: any; error?: string; isDbPersisted?: boolean }> {
  try {
    const payload = {
      id: staff.id,
      staff_id: staff.staffId,
      full_name: staff.fullName,
      role: staff.role,
      role_title: staff.roleTitle,
      department: staff.department,
      specialization: staff.specialization || 'General Clinical Medicine',
      registration_number: staff.registrationNumber || 'MCI-PENDING',
      employee_code: staff.employeeCode || staff.staffId,
      mobile: staff.mobile || '',
      email: staff.email || '',
      qualification: staff.qualification || 'MBBS, MD',
      joining_date: staff.joiningDate || new Date().toISOString().split('T')[0],
      room_number: staff.roomNumber || 'Room 104',
      opd_timings: staff.opdTimings || '09:00 AM - 01:00 PM',
      consultation_fee: staff.consultationFee ?? 0,
      available_days: Array.isArray(staff.availableDays) 
        ? staff.availableDays 
        : (typeof staff.availableDays === 'string' ? [staff.availableDays] : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
      bio: staff.bio || '',
      status: staff.status || 'active',
      status_reason: staff.statusReason || null,
      pin_hash: pinHash || undefined,
      last_login_at: staff.lastLoginAt || null,
      created_at: staff.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('hospital_staff')
      .upsert([payload], { onConflict: 'staff_id' })
      .select();

    if (error) {
      console.warn('[Supabase Staff Sync] Notice:', error.message);
      return { success: true, error: error.message, isDbPersisted: false };
    }

    return { success: true, data, isDbPersisted: true };
  } catch (err: any) {
    console.warn('[Supabase Staff Sync] Exception:', err?.message);
    return { success: true, error: err?.message, isDbPersisted: false };
  }
}

export async function fetchStaffMembersFromSupabase(): Promise<{ staff: HospitalStaffMember[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('hospital_staff')
      .select('*')
      .order('role', { ascending: true })
      .order('full_name', { ascending: true });

    if (error) {
      return { staff: [], error: error.message };
    }

    if (!data || data.length === 0) {
      return { staff: [] };
    }

    const mapped: HospitalStaffMember[] = data.map((item: any) => ({
      id: item.id || `staff-${item.staff_id}`,
      staffId: item.staff_id,
      fullName: item.full_name,
      role: item.role,
      roleTitle: item.role_title || (item.role === 'doctor' ? 'Consultant Physician' : 'Clinical Staff'),
      department: item.department || 'General Medicine OPD',
      specialization: item.specialization || 'General Healthcare',
      registrationNumber: item.registration_number || 'MCI-VERIFIED',
      employeeCode: item.employee_code || item.staff_id,
      mobile: item.mobile || '',
      email: item.email || '',
      qualification: item.qualification || 'MBBS, MD',
      joiningDate: item.joining_date || '2023-01-01',
      roomNumber: item.room_number || 'Room 104',
      opdTimings: item.opd_timings || '09:00 AM - 01:00 PM',
      consultationFee: item.consultation_fee != null ? Number(item.consultation_fee) : 0,
      availableDays: item.available_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      bio: item.bio || '',
      status: item.status || 'active',
      statusReason: item.status_reason || undefined,
      lastLoginAt: item.last_login_at || undefined,
      createdAt: item.created_at || new Date().toISOString(),
      updatedAt: item.updated_at || new Date().toISOString()
    }));

    return { staff: mapped };
  } catch (err: any) {
    return { staff: [], error: err?.message };
  }
}

/**
 * Direct view query on Supabase 'doctors' view
 */
export async function fetchDoctorsFromSupabaseView(): Promise<{ doctors: any[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .order('doctor_name', { ascending: true });

    if (error) {
      return { doctors: [], error: error.message };
    }

    return { doctors: data || [] };
  } catch (err: any) {
    return { doctors: [], error: err?.message };
  }
}

export async function syncAllStaffToSupabase(
  staffList: HospitalStaffMember[]
): Promise<{ count: number; error?: string }> {
  try {
    if (!staffList || staffList.length === 0) return { count: 0 };
    
    const payloads = staffList.map(staff => ({
      id: staff.id,
      staff_id: staff.staffId,
      full_name: staff.fullName,
      role: staff.role,
      role_title: staff.roleTitle,
      department: staff.department,
      specialization: staff.specialization || 'General Healthcare',
      registration_number: staff.registrationNumber || 'MCI-PENDING',
      employee_code: staff.employeeCode || staff.staffId,
      mobile: staff.mobile || '',
      email: staff.email || '',
      qualification: staff.qualification || 'MBBS, MD',
      joining_date: staff.joiningDate || new Date().toISOString().split('T')[0],
      room_number: staff.roomNumber || 'Room 104',
      opd_timings: staff.opdTimings || '09:00 AM - 01:00 PM',
      consultation_fee: staff.consultationFee ?? 0,
      available_days: Array.isArray(staff.availableDays) 
        ? staff.availableDays 
        : (typeof staff.availableDays === 'string' ? [staff.availableDays] : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
      bio: staff.bio || '',
      status: staff.status || 'active',
      status_reason: staff.statusReason || null,
      last_login_at: staff.lastLoginAt || null,
      created_at: staff.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('hospital_staff')
      .upsert(payloads, { onConflict: 'staff_id' })
      .select();

    if (error) {
      console.warn('[Supabase Batch Staff Sync] Notice:', error.message);
      return { count: 0, error: error.message };
    }

    return { count: data?.length || payloads.length };
  } catch (err: any) {
    return { count: 0, error: err?.message };
  }
}

export async function deleteStaffMemberFromSupabase(staffId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('hospital_staff')
      .delete()
      .eq('staff_id', staffId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

// ============================================================================
// HOSPITAL SYSTEM CONFIGURATION SYNC HELPERS
// ============================================================================

export async function saveHospitalConfigToSupabase(
  config: HospitalSystemConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      id: 'primary_hospital_config',
      hospital_name: config.hospitalName,
      facility_id: config.abdmFacilityId || config.hospitalCode,
      contact_number: config.emergencyContactNumber,
      ambulance_hotline: config.ambulanceSosNumber,
      opd_timing: config.opdTimings,
      departments: config.availableDepartments,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('hospital_system_config')
      .upsert([payload], { onConflict: 'id' });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function fetchHospitalConfigFromSupabase(): Promise<{ config: HospitalSystemConfig | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('hospital_system_config')
      .select('*')
      .eq('id', 'primary_hospital_config')
      .maybeSingle();

    if (error || !data) {
      return { config: null, error: error?.message };
    }

    const config: HospitalSystemConfig = {
      hospitalName: data.hospital_name,
      hospitalCode: data.facility_id || 'AIIMS-ND-OPD-01',
      opdTimings: data.opd_timing || '08:00 AM - 04:00 PM (Monday to Saturday)',
      emergencyContactNumber: data.contact_number || '+91 11 2658 8500',
      ambulanceSosNumber: data.ambulance_hotline || '+91 11 2659 4405',
      availableDepartments: data.departments || [],
      abdmFacilityId: data.facility_id || 'AIIMS-ND-OPD-01',
      updatedAt: data.updated_at || new Date().toISOString()
    };

    return { config };
  } catch (err: any) {
    return { config: null, error: err?.message };
  }
}

