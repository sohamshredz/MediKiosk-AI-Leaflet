import { Appointment } from '../types';

export const SAMPLE_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-101',
    patientId: 'pat-001',
    patientName: 'Ramesh Kumar',
    tokenNumber: 'OPD-102',
    uhid: 'AIIMS-ND-2026-8812',
    department: 'General Medicine & Cardiology',
    doctorName: 'Dr. Anand Deshmukh, MD (Med)',
    doctorSpecialty: 'Internal Medicine & Cardiology',
    careStream: 'allopathy',
    date: '2026-08-28',
    timeSlot: '09:30 AM - 10:00 AM',
    status: 'intake_completed',
    roomNumber: 'OPD Room 04, Ground Floor',
    queuePosition: 2,
    currentServingToken: 'OPD-100',
    estimatedWaitMinutes: 8,
    chiefComplaint: 'Retrosternal chest tightness radiating to left arm & shortness of breath',
    abhaLinked: true,
    bookedAt: '2026-08-28 07:45 AM',
    bookingType: 'kiosk_walkin'
  },
  {
    id: 'apt-102',
    patientId: 'pat-001',
    patientName: 'Ramesh Kumar',
    tokenNumber: 'OPD-078',
    uhid: 'AIIMS-ND-2026-8812',
    department: 'Endocrinology & Diabetology',
    doctorName: 'Dr. Neha Saxena, DM (Endo)',
    doctorSpecialty: 'Endocrinology & Metabolism',
    careStream: 'allopathy',
    date: '2026-06-15',
    timeSlot: '11:00 AM - 11:30 AM',
    status: 'consultation_done',
    roomNumber: 'OPD Room 12, 1st Floor',
    chiefComplaint: 'Uncontrolled blood sugar review and bilateral foot numbness',
    abhaLinked: true,
    bookedAt: '2026-06-10 09:15 AM',
    bookingType: 'online_portal',
    doctorDiagnosis: 'Type 2 Diabetes Mellitus with Peripheral Neuropathy & Mixed Dyslipidemia',
    doctorPrescription: [
      { medicineName: 'Tab. Metformin 500mg', dosage: '500mg', timing: 'Twice daily after meals (1-0-1)', days: 90 },
      { medicineName: 'Tab. Telmisartan 40mg', dosage: '40mg', timing: 'Once daily morning (1-0-0)', days: 90 },
      { medicineName: 'Tab. Glimepiride 2mg', dosage: '2mg', timing: 'Once daily before breakfast (1-0-0)', days: 90 },
      { medicineName: 'Cap. Methylcobalamin 1500mcg', dosage: '1500mcg', timing: 'Once daily after dinner (0-0-1)', days: 30 }
    ],
    doctorAdvice: 'Strict diabetic diet (low glycemic index), 30 mins brisk walk daily, monitor fasting sugar weekly. Repeat HbA1c in 3 months.',
    followUpDate: '2026-09-15'
  },
  {
    id: 'apt-103',
    patientId: 'pat-001',
    patientName: 'Ramesh Kumar',
    tokenNumber: 'OPD-042',
    uhid: 'AIIMS-ND-2026-8812',
    department: 'Ophthalmology',
    doctorName: 'Dr. Rajiv Menon, MS (Ophth)',
    doctorSpecialty: 'Retina & Comprehensive Ophthalmology',
    careStream: 'allopathy',
    date: '2026-02-18',
    timeSlot: '02:00 PM - 02:30 PM',
    status: 'consultation_done',
    roomNumber: 'Eye OPD 03, 2nd Floor',
    chiefComplaint: 'Routine annual diabetic retinopathy screening',
    abhaLinked: true,
    bookedAt: '2026-02-14 10:30 AM',
    bookingType: 'online_portal',
    doctorDiagnosis: 'Mild Non-Proliferative Diabetic Retinopathy (NPDR) - Both Eyes',
    doctorPrescription: [
      { medicineName: 'Carboxymethylcellulose 0.5% Eye Drops', dosage: '1 drop', timing: 'Three times daily (1-1-1)', days: 30 }
    ],
    doctorAdvice: 'Strict glycemic & BP control. Annual fundus examination mandatory. Wear UV protection glasses outdoors.',
    followUpDate: '2027-02-18'
  },
  {
    id: 'apt-201',
    patientId: 'pat-002',
    patientName: 'Priya Sengupta',
    tokenNumber: 'OPD-103',
    uhid: 'AIIMS-ND-2026-9142',
    department: 'Kayachikitsa (Ayurveda)',
    doctorName: 'Vaidya Rajeshwar Sharma, MD (Ayu)',
    doctorSpecialty: 'Ayurvedic Kayachikitsa & Panchakarma',
    careStream: 'ayurveda',
    date: '2026-08-28',
    timeSlot: '10:00 AM - 10:30 AM',
    status: 'intake_completed',
    roomNumber: 'AYUSH Block Room 02',
    queuePosition: 3,
    currentServingToken: 'OPD-100',
    estimatedWaitMinutes: 14,
    chiefComplaint: 'Chronic acidity (Amlapitta), epigastric burning & severe migraine (Suryavarta)',
    abhaLinked: true,
    bookedAt: '2026-08-28 08:00 AM',
    bookingType: 'online_portal'
  },
  {
    id: 'apt-202',
    patientId: 'pat-002',
    patientName: 'Priya Sengupta',
    tokenNumber: 'OPD-065',
    uhid: 'AIIMS-ND-2026-9142',
    department: 'Panchakarma (Ayurveda)',
    doctorName: 'Vaidya Rajeshwar Sharma, MD (Ayu)',
    doctorSpecialty: 'Ayurvedic Kayachikitsa & Panchakarma',
    careStream: 'ayurveda',
    date: '2026-05-12',
    timeSlot: '09:00 AM - 10:00 AM',
    status: 'consultation_done',
    roomNumber: 'AYUSH Block Room 02',
    chiefComplaint: 'Pitta aggravation with sleep disturbance and hyperacidity',
    abhaLinked: true,
    bookedAt: '2026-05-08 11:20 AM',
    bookingType: 'online_portal',
    doctorDiagnosis: 'Urdhwaga Amlapitta (Pitta-Vata Prakopa)',
    doctorPrescription: [
      { medicineName: 'Avipattikar Churna', dosage: '3g with lukewarm water', timing: 'Before meals BD (1-0-1)', days: 45 },
      { medicineName: 'Kamadudha Rasa (Mukta Yukta)', dosage: '250mg with honey', timing: 'Twice daily after food (1-0-1)', days: 30 },
      { medicineName: 'Sutashekhara Rasa', dosage: '1 tablet', timing: 'Morning and night (1-0-1)', days: 30 }
    ],
    doctorAdvice: 'Avoid sour, fermented, fried & excessively spicy foods (Apathya). Follow Dinacharya with early dinner before 8 PM.',
    followUpDate: '2026-08-28'
  },
  {
    id: 'apt-301',
    patientId: 'pat-003',
    patientName: 'Murugan Swaminathan',
    tokenNumber: 'OPD-104',
    uhid: 'AIIMS-ND-2026-7231',
    department: 'General Medicine & Pulmonology',
    doctorName: 'Dr. Anand Deshmukh, MD (Med)',
    doctorSpecialty: 'Internal Medicine & Pulmonology',
    careStream: 'allopathy',
    date: '2026-08-28',
    timeSlot: '10:30 AM - 11:00 AM',
    status: 'in_queue',
    roomNumber: 'OPD Room 04, Ground Floor',
    queuePosition: 4,
    currentServingToken: 'OPD-100',
    estimatedWaitMinutes: 20,
    chiefComplaint: 'Productive purulent cough with high fever and wheezing',
    abhaLinked: true,
    bookedAt: '2026-08-28 08:15 AM',
    bookingType: 'kiosk_walkin'
  },
  {
    id: 'apt-401',
    patientId: 'pat-004',
    patientName: 'Sunita Deshmukh',
    tokenNumber: 'OPD-105',
    uhid: 'AIIMS-ND-2026-5541',
    department: 'Orthopedics & Rheumatology',
    doctorName: 'Dr. Vikramaditya Kulkarni, MS (Ortho)',
    doctorSpecialty: 'Joint Replacement & Spine Surgery',
    careStream: 'allopathy',
    date: '2026-08-28',
    timeSlot: '11:00 AM - 11:30 AM',
    status: 'in_queue',
    roomNumber: 'OPD Room 08, 1st Floor',
    queuePosition: 5,
    currentServingToken: 'OPD-100',
    estimatedWaitMinutes: 28,
    chiefComplaint: 'Bilateral knee joint pain on climbing stairs and morning stiffness',
    abhaLinked: true,
    bookedAt: '2026-08-28 08:20 AM',
    bookingType: 'online_portal'
  }
];

export const DEPARTMENTS_AND_DOCTORS = [
  {
    department: 'General Medicine & Internal Medicine',
    careStream: 'allopathy' as const,
    icon: 'Stethoscope',
    doctors: [
      { name: 'Dr. Anand Deshmukh', qualifications: 'MD (Med), AIIMS Delhi', room: 'OPD Room 04', availableDays: 'Mon - Sat', rating: 4.9, slots: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:30 AM', '02:00 PM', '02:30 PM'] },
      { name: 'Dr. Shweta Rastogi', qualifications: 'MD (Int Med), DNB', room: 'OPD Room 05', availableDays: 'Mon - Fri', rating: 4.8, slots: ['09:15 AM', '10:15 AM', '11:00 AM', '03:00 PM'] }
    ]
  },
  {
    department: 'Cardiology & Heart Care',
    careStream: 'allopathy' as const,
    icon: 'Heart',
    doctors: [
      { name: 'Dr. Arvind Mehra', qualifications: 'DM (Cardio), FACC', room: 'Cardio Suite 01', availableDays: 'Mon, Wed, Fri', rating: 4.95, slots: ['10:00 AM', '11:00 AM', '12:00 PM', '03:30 PM'] },
      { name: 'Dr. Preeti Chawla', qualifications: 'MD, DNB (Cardiology)', room: 'Cardio Suite 02', availableDays: 'Tue, Thu, Sat', rating: 4.85, slots: ['09:30 AM', '10:30 AM', '02:00 PM'] }
    ]
  },
  {
    department: 'Endocrinology & Diabetology',
    careStream: 'allopathy' as const,
    icon: 'Activity',
    doctors: [
      { name: 'Dr. Neha Saxena', qualifications: 'DM (Endocrinology), AIIMS', room: 'OPD Room 12', availableDays: 'Mon - Fri', rating: 4.9, slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:30 PM'] }
    ]
  },
  {
    department: 'Orthopedics & Joint Care',
    careStream: 'allopathy' as const,
    icon: 'Bone',
    doctors: [
      { name: 'Dr. Vikramaditya Kulkarni', qualifications: 'MS (Ortho), MCh', room: 'OPD Room 08', availableDays: 'Mon - Sat', rating: 4.9, slots: ['09:30 AM', '10:30 AM', '11:30 AM', '03:00 PM', '04:00 PM'] }
    ]
  },
  {
    department: 'Kayachikitsa & Panchakarma (Ayurveda)',
    careStream: 'ayurveda' as const,
    icon: 'Flower2',
    doctors: [
      { name: 'Vaidya Rajeshwar Sharma', qualifications: 'BAMS, MD (Ayurveda, Kayachikitsa)', room: 'AYUSH Block Room 02', availableDays: 'Mon - Sat', rating: 4.92, slots: ['08:30 AM', '09:30 AM', '10:30 AM', '11:30 AM', '02:00 PM'] },
      { name: 'Dr. Sunanda Joshi', qualifications: 'MD (Ayu, Dravyaguna)', room: 'AYUSH Block Room 03', availableDays: 'Tue, Thu, Sat', rating: 4.88, slots: ['09:00 AM', '10:00 AM', '03:00 PM'] }
    ]
  },
  {
    department: 'Pulmonology & Chest Clinic',
    careStream: 'allopathy' as const,
    icon: 'Wind',
    doctors: [
      { name: 'Dr. Alok Srivastava', qualifications: 'MD (Pulm Med), FCCP', room: 'Chest Clinic 01', availableDays: 'Mon - Fri', rating: 4.85, slots: ['10:00 AM', '11:00 AM', '02:00 PM', '03:30 PM'] }
    ]
  },
  {
    department: 'Pediatrics & Child Care',
    careStream: 'allopathy' as const,
    icon: 'Baby',
    doctors: [
      { name: 'Dr. Meenakshi Sundaram', qualifications: 'MD (Pediatrics), DCH', room: 'Pediatric OPD 01', availableDays: 'Mon - Sat', rating: 4.93, slots: ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '04:00 PM'] }
    ]
  }
];
