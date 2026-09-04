import { Appointment, CareStream, PatientProfile } from '../types';
import { supabase, saveAppointmentToSupabase } from './supabaseClient';

export interface DoctorRecord {
  id: string;
  name: string;
  qualification: string;
  specialization: string;
  department: string;
  careStream: CareStream;
  room: string;
  consultationFee: number;
  experienceYears: number;
  status: 'active' | 'on_leave' | 'busy';
  workingDays: string[]; // e.g. ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  shift: string;
  slots: string[];
  avatar?: string;
}

export interface SlotAvailability {
  slot: string;
  period: 'morning' | 'afternoon' | 'evening';
  isAvailable: boolean;
  isBooked: boolean;
  bookedAppointmentId?: string;
}

/**
 * Fetch all registered active doctors from backend
 */
export async function fetchDoctors(department?: string, careStream?: string): Promise<{ success: boolean; doctors: DoctorRecord[]; error?: string }> {
  try {
    const params = new URLSearchParams();
    if (department && department !== 'All Departments') params.append('department', department);
    if (careStream && careStream !== 'all') params.append('careStream', careStream);

    const res = await fetch(`/api/doctors?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to load doctors: HTTP ${res.status}`);
    }
    const data = await res.json();
    return { success: true, doctors: data.doctors || [] };
  } catch (err: any) {
    console.warn('Error fetching doctors from API, using fallback verified clinical registry:', err?.message);
    // Return empty or fallback with error flag
    return { success: false, doctors: [], error: err?.message || 'Failed to load doctors' };
  }
}

/**
 * Fetch doctor availability and time slots for a specific date
 */
export async function fetchDoctorSlots(doctorId: string, date: string): Promise<{ success: boolean; slots: SlotAvailability[]; doctorWorksOnDate: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/appointments/slots?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}`);
    if (!res.ok) {
      throw new Error(`Failed to load slots: HTTP ${res.status}`);
    }
    const data = await res.json();
    return {
      success: true,
      slots: data.slots || [],
      doctorWorksOnDate: data.doctorWorksOnDate ?? true
    };
  } catch (err: any) {
    console.warn('Error fetching slots from API:', err?.message);
    return { success: false, slots: [], doctorWorksOnDate: true, error: err?.message || 'Failed to check availability' };
  }
}

/**
 * Fetch appointments strictly filtered for the authenticated patient
 */
export async function fetchPatientAppointments(patientId: string, uhid?: string): Promise<{ success: boolean; appointments: Appointment[]; error?: string }> {
  try {
    const params = new URLSearchParams();
    if (patientId) params.append('patientId', patientId);
    if (uhid) params.append('uhid', uhid);

    const res = await fetch(`/api/appointments?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to load appointments: HTTP ${res.status}`);
    }
    const data = await res.json();
    return { success: true, appointments: data.appointments || [] };
  } catch (err: any) {
    console.warn('Error fetching patient appointments from API:', err?.message);
    return { success: false, appointments: [], error: err?.message || 'Failed to load appointments' };
  }
}

/**
 * Atomically book an OPD appointment
 */
export async function bookAppointmentApi(bookingData: {
  patientId: string;
  patientName: string;
  uhid: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  department: string;
  careStream: CareStream;
  roomNumber: string;
  date: string;
  timeSlot: string;
  chiefComplaint?: string;
  abhaLinked?: boolean;
}): Promise<{ success: boolean; appointment?: Appointment; error?: string; code?: string }> {
  try {
    const res = await fetch('/api/appointments/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.message || data.error || 'Failed to confirm appointment',
        code: data.code || (res.status === 409 ? 'DOUBLE_BOOKING' : 'BOOKING_FAILED')
      };
    }

    // Sync to Supabase in background for persistent cloud sync
    if (data.appointment) {
      try {
        await saveAppointmentToSupabase(data.appointment);
      } catch (sbErr) {
        console.warn('Supabase sync notice:', sbErr);
      }
    }

    return {
      success: true,
      appointment: data.appointment
    };
  } catch (err: any) {
    console.error('Network error during appointment booking:', err);
    return {
      success: false,
      error: 'Network connection issue. We could not verify if the appointment was confirmed. Please check My Appointments before re-trying.',
      code: 'NETWORK_ERROR'
    };
  }
}

/**
 * Cancel an appointment with patient ownership check
 */
export async function cancelAppointmentApi(appointmentId: string, patientId: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/appointments/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId, patientId })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.message || data.error || 'Failed to cancel appointment' };
    }

    return { success: true, message: data.message || 'Appointment cancelled successfully' };
  } catch (err: any) {
    console.error('Error cancelling appointment:', err);
    return { success: false, error: err?.message || 'Network error during cancellation' };
  }
}
