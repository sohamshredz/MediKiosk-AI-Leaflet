export interface HospitalLocation {
  id: string;
  name: string;
  type: 'tertiary' | 'district' | 'ayush' | 'trauma' | 'community' | 'hospital' | 'clinic' | 'phc' | 'health_centre';
  typeLabel: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  emergencyPhone: string;
  rating: number;
  totalReviews: number;
  open24x7: boolean;
  distanceKm?: number;
  travelTimeMins?: number;
  availableBeds: {
    icu: number;
    general: number;
    oxygen: number;
    emergency: number;
  };
  opdDepartments: string[];
  ayushAvailable: boolean;
  abdmEnabled: boolean;
  facilityCode: string;
  ambulanceStandby: number;
}

export interface AmbulanceUnit {
  id: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  type: 'ALS' | 'BLS' | 'PTS';
  typeLabel: string;
  status: 'available' | 'dispatched' | 'on_route' | 'arrived';
  baseHospitalId: string;
  baseHospitalName: string;
  lat: number;
  lng: number;
  currentEtaMins: number;
  equipment: string[];
}

export const SAMPLE_HOSPITALS: HospitalLocation[] = [
  {
    id: 'hosp-1',
    name: 'All India Institute of Medical Sciences (AIIMS)',
    type: 'tertiary',
    typeLabel: 'Apex Super-Specialty & Research',
    address: 'Sri Aurobindo Marg, Ansari Nagar, New Delhi, Delhi 110029',
    lat: 28.5672,
    lng: 77.2100,
    phone: '+91 11 2658 8500',
    emergencyPhone: '102 / 108',
    rating: 4.8,
    totalReviews: 12450,
    open24x7: true,
    availableBeds: {
      icu: 14,
      general: 142,
      oxygen: 48,
      emergency: 8,
    },
    opdDepartments: [
      'General Medicine',
      'Cardiology',
      'Neurology',
      'Orthopedics',
      'Pulmonology',
      'Pediatrics',
      'Emergency & Trauma',
      'Integrative AYUSH'
    ],
    ayushAvailable: true,
    abdmEnabled: true,
    facilityCode: 'IN-DL-AIIMS-01',
    ambulanceStandby: 6
  },
  {
    id: 'hosp-2',
    name: 'Safdarjung District Civil Hospital',
    type: 'district',
    typeLabel: 'District General Hospital',
    address: 'Ring Road, Opposite AIIMS, New Delhi, Delhi 110029',
    lat: 28.5701,
    lng: 77.2065,
    phone: '+91 11 2616 5060',
    emergencyPhone: '+91 11 2616 5000',
    rating: 4.4,
    totalReviews: 8320,
    open24x7: true,
    availableBeds: {
      icu: 9,
      general: 85,
      oxygen: 32,
      emergency: 12,
    },
    opdDepartments: [
      'General Medicine',
      'Orthopedics',
      'Pediatrics',
      'Obstetrics & Gynaecology',
      'General Surgery',
      'Dermatology',
      'ENT'
    ],
    ayushAvailable: true,
    abdmEnabled: true,
    facilityCode: 'IN-DL-SDJ-04',
    ambulanceStandby: 4
  },
  {
    id: 'hosp-3',
    name: 'National Institute of Ayurveda & AYUSH Centre',
    type: 'ayush',
    typeLabel: 'National AYUSH Centre of Excellence',
    address: 'Panchkuian Marg, Central Zone, New Delhi, Delhi 110001',
    lat: 28.5520,
    lng: 77.2280,
    phone: '+91 11 2358 1200',
    emergencyPhone: '+91 11 2358 1299',
    rating: 4.7,
    totalReviews: 4190,
    open24x7: false,
    availableBeds: {
      icu: 4,
      general: 60,
      oxygen: 20,
      emergency: 4,
    },
    opdDepartments: [
      'Kayachikitsa (Internal Medicine)',
      'Panchakarma Detoxification',
      'Shalya Tantra (Surgical)',
      'Prasuti & Stri Roga',
      'Homeopathy Care',
      'Yoga & Naturopathy'
    ],
    ayushAvailable: true,
    abdmEnabled: true,
    facilityCode: 'IN-DL-AYUSH-09',
    ambulanceStandby: 2
  },
  {
    id: 'hosp-4',
    name: 'Dr. Ram Manohar Lohia Hospital & Trauma Centre',
    type: 'trauma',
    typeLabel: 'Level-1 Emergency & Trauma',
    address: 'Baba Kharak Singh Marg, Connaught Place, New Delhi 110001',
    lat: 28.6258,
    lng: 77.2012,
    phone: '+91 11 2336 5525',
    emergencyPhone: '108 / 112',
    rating: 4.5,
    totalReviews: 9540,
    open24x7: true,
    availableBeds: {
      icu: 18,
      general: 110,
      oxygen: 55,
      emergency: 22,
    },
    opdDepartments: [
      'Trauma & Acute Surgery',
      'Cardiology',
      'Neuro-Trauma',
      'General Medicine',
      'Nephrology',
      'Orthopedics'
    ],
    ayushAvailable: false,
    abdmEnabled: true,
    facilityCode: 'IN-DL-RML-02',
    ambulanceStandby: 8
  },
  {
    id: 'hosp-5',
    name: 'South District Community Health Centre (CHC)',
    type: 'community',
    typeLabel: 'Primary Health & Maternal Hub',
    address: 'Hauz Khas Sector 3, New Delhi, Delhi 110016',
    lat: 28.5480,
    lng: 77.2020,
    phone: '+91 11 2651 3400',
    emergencyPhone: '102',
    rating: 4.2,
    totalReviews: 2410,
    open24x7: true,
    availableBeds: {
      icu: 2,
      general: 35,
      oxygen: 15,
      emergency: 6,
    },
    opdDepartments: [
      'General OPD',
      'Immunization & Child Health',
      'Maternal & Antenatal Care',
      'Ayurvedic Dispensary',
      'NCD Screening'
    ],
    ayushAvailable: true,
    abdmEnabled: true,
    facilityCode: 'IN-DL-CHC-14',
    ambulanceStandby: 3
  }
];

export const SAMPLE_AMBULANCES: AmbulanceUnit[] = [
  {
    id: 'amb-1',
    vehicleNumber: 'DL 01 EM 1081',
    driverName: 'Suresh Kumar (EMT Certified)',
    driverPhone: '+91 98112 34501',
    type: 'ALS',
    typeLabel: 'Advanced Life Support (ALS)',
    status: 'available',
    baseHospitalId: 'hosp-1',
    baseHospitalName: 'AIIMS Apex Trauma',
    lat: 28.5685,
    lng: 77.2120,
    currentEtaMins: 4,
    equipment: ['Ventilator', 'Defibrillator (AED)', 'Multipara Monitor', 'Emergency Drugs Kit', 'Spinal Board']
  },
  {
    id: 'amb-2',
    vehicleNumber: 'DL 01 EM 1082',
    driverName: 'Rajesh Verma (Paramedic)',
    driverPhone: '+91 98112 34502',
    type: 'BLS',
    typeLabel: 'Basic Life Support (BLS)',
    status: 'available',
    baseHospitalId: 'hosp-2',
    baseHospitalName: 'Safdarjung Hospital',
    lat: 28.5690,
    lng: 77.2040,
    currentEtaMins: 7,
    equipment: ['Oxygen Cylinder', 'Suction Machine', 'First Aid Kit', 'Collapsible Stretcher', 'BP & Pulse Oximeter']
  },
  {
    id: 'amb-3',
    vehicleNumber: 'DL 01 EM 1083',
    driverName: 'Amit Singh (First Responder)',
    driverPhone: '+91 98112 34503',
    type: 'ALS',
    typeLabel: 'Advanced Life Support (ALS)',
    status: 'available',
    baseHospitalId: 'hosp-4',
    baseHospitalName: 'RML Trauma Centre',
    lat: 28.6230,
    lng: 77.2035,
    currentEtaMins: 9,
    equipment: ['Cardiac Monitor', 'Intubation Kit', 'IV Infusion Pump', 'Oxygen Delivery System', 'AED']
  },
  {
    id: 'amb-4',
    vehicleNumber: 'DL 01 EM 1084',
    driverName: 'Manoj Sharma',
    driverPhone: '+91 98112 34504',
    type: 'PTS',
    typeLabel: 'Patient Transport Service (PTS)',
    status: 'available',
    baseHospitalId: 'hosp-5',
    baseHospitalName: 'South District CHC',
    lat: 28.5460,
    lng: 77.2000,
    currentEtaMins: 11,
    equipment: ['Wheelchair Access', 'Stretcher', 'Basic First Aid', 'Oxygen Mask']
  }
];

// Helper: Calculate distance between two lat/lng coordinates in km (Haversine formula)
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}
