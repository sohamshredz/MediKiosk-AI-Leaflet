import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ChevronRight, 
  Heart, 
  Activity, 
  ArrowRight, 
  Star, 
  Printer, 
  Check, 
  Tag,
  Database,
  Lock,
  Loader2,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { Appointment, CareStream, PatientProfile } from '../../types';
import { 
  DoctorRecord, 
  SlotAvailability, 
  fetchDoctors, 
  fetchDoctorSlots, 
  bookAppointmentApi 
} from '../../utils/appointmentService';
import { SUPABASE_PROJECT_ID } from '../../utils/supabaseClient';
import { SupabaseStatusModal } from '../common/SupabaseStatusModal';

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: PatientProfile | null;
  onAppointmentBooked: (newAppointment: Appointment) => void;
  onStartKioskIntake?: (appointment: Appointment) => void;
  onNavigateToLogin?: () => void;
}

export const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({
  isOpen,
  onClose,
  patient,
  onAppointmentBooked,
  onStartKioskIntake,
  onNavigateToLogin
}) => {
  // 7-day Date Strip generator
  const dateStrip = useMemo(() => {
    const list = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const isToday = i === 0;
      const isTomorrow = i === 1;
      const dayName = isToday ? 'Today' : isTomorrow ? 'Tmrw' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateStr = d.toISOString().split('T')[0];
      const monthStr = d.toLocaleDateString('en-US', { month: 'short' });
      const dayNum = d.getDate();
      list.push({ dateStr, dayName, dayNum, monthStr });
    }
    return list;
  }, []);

  // State Management
  const [step, setStep] = useState<'selection' | 'review' | 'confirmed'>('selection');
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState<boolean>(true);
  const [doctorsError, setDoctorsError] = useState<string | null>(null);

  const [selectedDept, setSelectedDept] = useState<string>('All Departments');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(dateStrip[0].dateStr);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [slotPeriodFilter, setSlotPeriodFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');

  // Slots State
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [doctorWorksOnDate, setDoctorWorksOnDate] = useState<boolean>(true);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Form Details
  const [chiefComplaint, setChiefComplaint] = useState<string>('Routine medical evaluation and health review');
  const [isAbhaLinked, setIsAbhaLinked] = useState<boolean>(true);

  // Booking Execution State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookedAppointment, setBookedAppointment] = useState<Appointment | null>(null);
  const [showSupabaseModal, setShowSupabaseModal] = useState<boolean>(false);

  // 1. Fetch real doctors from backend on mount or modal open
  const loadDoctors = useCallback(async () => {
    setIsLoadingDoctors(true);
    setDoctorsError(null);
    try {
      const res = await fetchDoctors();
      if (res.success && res.doctors.length > 0) {
        setDoctors(res.doctors);
        if (!selectedDoctorId) {
          setSelectedDoctorId(res.doctors[0].id);
        }
      } else {
        setDoctorsError(res.error || 'Unable to load active doctors from hospital registry.');
      }
    } catch (err: any) {
      setDoctorsError(err?.message || 'Network error loading doctor catalog');
    } finally {
      setIsLoadingDoctors(false);
    }
  }, [selectedDoctorId]);

  useEffect(() => {
    if (isOpen) {
      loadDoctors();
    }
  }, [isOpen, loadDoctors]);

  // Derived filtered doctors
  const filteredDoctors = useMemo(() => {
    if (selectedDept === 'All Departments') return doctors;
    return doctors.filter(doc => doc.department.toLowerCase() === selectedDept.toLowerCase());
  }, [doctors, selectedDept]);

  // Distinct departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    doctors.forEach(d => {
      if (d.department) set.add(d.department);
    });
    return ['All Departments', ...Array.from(set)];
  }, [doctors]);

  // Selected Doctor Object
  const selectedDoctor = useMemo(() => {
    return doctors.find(d => d.id === selectedDoctorId) || filteredDoctors[0] || doctors[0];
  }, [doctors, filteredDoctors, selectedDoctorId]);

  // Auto select first doctor in filtered list when department changes
  useEffect(() => {
    if (filteredDoctors.length > 0) {
      const exists = filteredDoctors.some(d => d.id === selectedDoctorId);
      if (!exists) {
        setSelectedDoctorId(filteredDoctors[0].id);
      }
    }
  }, [filteredDoctors, selectedDoctorId]);

  // 2. Fetch Slots for selected Doctor & Date
  const loadSlots = useCallback(async (docId: string, date: string) => {
    if (!docId || !date) return;
    setIsLoadingSlots(true);
    setSlotsError(null);
    try {
      const res = await fetchDoctorSlots(docId, date);
      if (res.success) {
        setSlots(res.slots);
        setDoctorWorksOnDate(res.doctorWorksOnDate);

        // Auto-select first available slot if current selected slot is not available
        const firstAvailable = res.slots.find(s => s.isAvailable);
        if (firstAvailable) {
          setSelectedTimeSlot(firstAvailable.slot);
        } else {
          setSelectedTimeSlot('');
        }
      } else {
        setSlotsError(res.error || 'Failed to check doctor slot availability.');
      }
    } catch (err: any) {
      setSlotsError(err?.message || 'Error checking availability');
    } finally {
      setIsLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDoctor?.id && selectedDate) {
      loadSlots(selectedDoctor.id, selectedDate);
    }
  }, [selectedDoctor?.id, selectedDate, loadSlots]);

  // Filtered Time Slots by period
  const filteredTimeSlots = useMemo(() => {
    if (slotPeriodFilter === 'all') return slots;
    return slots.filter(s => s.period === slotPeriodFilter);
  }, [slots, slotPeriodFilter]);

  // Handle Review Step Proceed
  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    if (!patient || !patient.id) {
      setBookingError('Patient authentication required. Please sign in.');
      return;
    }

    if (!selectedDoctor) {
      setBookingError('Please select a doctor for your appointment.');
      return;
    }

    if (!selectedTimeSlot) {
      setBookingError('Please select an available time slot.');
      return;
    }

    setStep('review');
  };

  // Handle Final Confirmed Booking with Atomic Double-Booking Check
  const handleConfirmBooking = async () => {
    if (!patient || !selectedDoctor || !selectedTimeSlot) return;

    setIsSubmitting(true);
    setBookingError(null);

    const bookingPayload = {
      patientId: patient.id,
      patientName: patient.name,
      uhid: patient.uhid || `UHID-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      doctorSpecialty: selectedDoctor.specialization || selectedDoctor.department,
      department: selectedDoctor.department,
      careStream: selectedDoctor.careStream || 'allopathy',
      roomNumber: selectedDoctor.room,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      chiefComplaint: chiefComplaint || 'Routine medical evaluation and health review',
      abhaLinked: isAbhaLinked
    };

    const res = await bookAppointmentApi(bookingPayload);

    setIsSubmitting(false);

    if (res.success && res.appointment) {
      setBookedAppointment(res.appointment);
      setStep('confirmed');
      onAppointmentBooked(res.appointment);
    } else {
      // Handle Double Booking or Validation Rejections gracefully
      if (res.code === 'DOUBLE_BOOKING') {
        setBookingError('⚠️ This appointment slot was just booked by another patient. Please select another available time.');
        // Refresh slot availability for user
        loadSlots(selectedDoctor.id, selectedDate);
        setStep('selection');
      } else if (res.code === 'PATIENT_DUPLICATE') {
        setBookingError('⚠️ You already have an active appointment scheduled at this time slot.');
      } else {
        setBookingError(res.error || 'Failed to confirm appointment. Please try again.');
      }
    }
  };

  const resetAndClose = () => {
    setStep('selection');
    setBookedAppointment(null);
    setBookingError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-teal-200 shadow-inner">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
                <span>Book OPD Doctor Appointment</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-900/60 text-teal-300 border border-teal-600/50">
                  Live Clinic Sync
                </span>
              </h2>
              {patient ? (
                <p className="text-xs text-teal-100/90 flex items-center gap-1.5">
                  <span>Patient: <strong className="text-white">{patient.name}</strong></span>
                  <span>•</span>
                  <span>UHID: <strong className="text-teal-200 font-mono">{patient.uhid || patient.id}</strong></span>
                </p>
              ) : (
                <p className="text-xs text-amber-200 font-semibold">
                  Authentication Required
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={resetAndClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* VIEW 0: AUTHENTICATION REQUIRED GUARD */}
        {/* ------------------------------------------------------------- */}
        {!patient ? (
          <div className="p-8 sm:p-12 text-center space-y-6 bg-slate-50 flex-1 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-xl font-bold text-slate-900">
                Patient Authentication Required
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                To prevent unauthorized appointments and ensure accurate clinical record linking, you must sign in with your patient account or Mobile OTP.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={resetAndClose}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetAndClose();
                  if (onNavigateToLogin) {
                    onNavigateToLogin();
                  }
                }}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer shadow-md transition-all flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>Sign In to Patient Portal</span>
              </button>
            </div>
          </div>
        ) : (

          /* ------------------------------------------------------------- */
          /* VIEW 1: SELECTION FORM */
          /* ------------------------------------------------------------- */
          step === 'selection' ? (
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 bg-slate-50">
              
              {/* Left Col (8 cols): Interactive Form Controls */}
              <form onSubmit={handleProceedToReview} className="lg:col-span-8 p-5 sm:p-6 space-y-6 border-r border-slate-200">
                
                {/* Global Error Banner */}
                {bookingError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-800 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold">{bookingError}</p>
                    </div>
                  </div>
                )}

                {/* 1. Department Filter */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      1. Select OPD Department
                    </label>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {departments.length - 1} Specialties Available
                    </span>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    {departments.map((dept) => {
                      const isSelected = selectedDept === dept;
                      return (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => setSelectedDept(dept)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                            isSelected
                              ? 'bg-teal-700 text-white shadow-xs'
                              : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          {dept}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Doctor Directory from Database */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      2. Select Authorized Doctor
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-teal-700 font-semibold">
                        {filteredDoctors.length} doctors found
                      </span>
                      <button
                        type="button"
                        onClick={loadDoctors}
                        title="Refresh Doctors"
                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDoctors ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {isLoadingDoctors ? (
                    /* Doctors Skeleton Loader */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="p-3.5 rounded-2xl border border-slate-200 bg-white animate-pulse space-y-2.5">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-slate-200" />
                            <div className="space-y-1.5 flex-1">
                              <div className="h-3 bg-slate-200 rounded w-3/4" />
                              <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                            </div>
                          </div>
                          <div className="h-4 bg-slate-100 rounded w-full" />
                        </div>
                      ))}
                    </div>
                  ) : doctorsError ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 space-y-2">
                      <p className="font-bold">Error loading doctor registry: {doctorsError}</p>
                      <button
                        type="button"
                        onClick={loadDoctors}
                        className="px-3 py-1 bg-amber-700 text-white rounded-lg font-bold text-[11px]"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : filteredDoctors.length === 0 ? (
                    <div className="p-6 bg-white border border-slate-200 rounded-2xl text-center space-y-1">
                      <p className="text-xs font-bold text-slate-700">No doctors found for this department</p>
                      <p className="text-[11px] text-slate-500">Please choose another department or view all specialists.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                      {filteredDoctors.map((doc) => {
                        const isSelected = selectedDoctorId === doc.id;
                        return (
                          <div
                            key={doc.id}
                            id={`doctor-card-${doc.id}`}
                            onClick={() => setSelectedDoctorId(doc.id)}
                            className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                              isSelected
                                ? 'border-teal-600 bg-teal-50/70 shadow-sm ring-2 ring-teal-500/20'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            {isSelected && (
                              <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </span>
                            )}

                            <div className="flex items-start gap-3">
                              <img
                                src={doc.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=256&q=80'}
                                alt={doc.name}
                                className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div className="space-y-0.5">
                                <h4 className="font-bold text-xs text-slate-900 leading-tight">{doc.name}</h4>
                                <p className="text-[11px] text-teal-800 font-semibold">{doc.specialization}</p>
                                <p className="text-[10px] text-slate-500">{doc.qualification}</p>
                                
                                <div className="flex items-center gap-2 pt-1">
                                  <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                                    {doc.experienceYears}y exp
                                  </span>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                    doc.careStream === 'ayurveda' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {doc.careStream}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 text-xs">
                              <span className="font-bold text-teal-800 font-mono">₹{doc.consultationFee}</span>
                              <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                {doc.room}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 3. 7-Day Date Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    3. Select Date (7-Day Schedule)
                  </label>

                  <div className="grid grid-cols-7 gap-2">
                    {dateStrip.map((item) => {
                      const isSelected = selectedDate === item.dateStr;
                      return (
                        <button
                          key={item.dateStr}
                          type="button"
                          onClick={() => setSelectedDate(item.dateStr)}
                          className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                            isSelected
                              ? 'bg-teal-700 text-white border-teal-700 shadow-md ring-2 ring-teal-600/30'
                              : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                          }`}
                        >
                          <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-teal-200' : 'text-slate-400'}`}>
                            {item.dayName}
                          </span>
                          <span className="text-base font-black my-0.5">
                            {item.dayNum}
                          </span>
                          <span className={`text-[9px] ${isSelected ? 'text-teal-100' : 'text-slate-500'}`}>
                            {item.monthStr}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Live Availability Time Slot Grid */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      4. Real Availability Time Slots
                    </label>
                    
                    <div className="flex items-center gap-1 text-[11px] font-bold">
                      {(['all', 'morning', 'afternoon', 'evening'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setSlotPeriodFilter(p)}
                          className={`px-2 py-0.5 rounded-lg capitalize cursor-pointer ${
                            slotPeriodFilter === p ? 'bg-teal-600 text-white' : 'text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {isLoadingSlots ? (
                    /* Slots Skeleton Loader */
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-10 bg-slate-200 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : !doctorWorksOnDate ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span>Doctor is not scheduled on this day</span>
                      </p>
                      <p className="text-[11px] text-amber-800">
                        {selectedDoctor?.name} is available on {selectedDoctor?.workingDays.join(', ')}. Please choose another date.
                      </p>
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="p-4 bg-slate-100 rounded-2xl text-center text-xs text-slate-600">
                      No appointment slots configured for this date.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {filteredTimeSlots.map((item) => {
                        const isSelected = selectedTimeSlot === item.slot;
                        const isBooked = item.isBooked || !item.isAvailable;
                        return (
                          <button
                            key={item.slot}
                            type="button"
                            disabled={isBooked}
                            onClick={() => setSelectedTimeSlot(item.slot)}
                            className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                              isBooked
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through opacity-75'
                                : isSelected
                                ? 'bg-teal-600 text-white border-teal-600 shadow-xs ring-2 ring-teal-400/40'
                                : 'bg-white text-slate-700 hover:border-teal-400 border-slate-200 cursor-pointer'
                            }`}
                          >
                            <span>{item.slot}</span>
                            {isBooked ? (
                              <span className="text-[9px] font-normal uppercase bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded not-italic">
                                Booked
                              </span>
                            ) : isSelected ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 5. Chief Complaint / Reason */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    5. Reason for Visit & Symptoms
                  </label>
                  <textarea
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 bg-white"
                    placeholder="Describe your primary symptoms, duration, or reason for OPD consultation..."
                  />
                </div>

                {/* ABDM Link Toggle */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-teal-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Link ABDM / ABHA Health Locker</span>
                      <span className="text-[11px] text-slate-500">Auto-syncs verified clinical records and prescriptions</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isAbhaLinked}
                    onChange={(e) => setIsAbhaLinked(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 cursor-pointer"
                  />
                </div>

                {/* Proceed Button */}
                <button
                  type="submit"
                  disabled={!selectedTimeSlot || !doctorWorksOnDate}
                  className={`w-full py-3.5 px-6 rounded-2xl text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    !selectedTimeSlot || !doctorWorksOnDate
                      ? 'bg-slate-400 cursor-not-allowed opacity-75'
                      : 'bg-teal-600 hover:bg-teal-700 hover:shadow-lg'
                  }`}
                >
                  <span>Review Appointment Details (₹{selectedDoctor?.consultationFee || 400})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

              </form>

              {/* Right Col (4 cols): Live Booking Summary Sidebar */}
              <div className="lg:col-span-4 p-5 sm:p-6 space-y-4 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span>Live Booking Summary</span>
                  </h3>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    Real-time
                  </span>
                </div>

                {/* Doctor Card in summary */}
                {selectedDoctor && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedDoctor.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=256&q=80'}
                        alt={selectedDoctor.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{selectedDoctor.name}</h4>
                        <p className="text-[11px] text-teal-800 font-semibold">{selectedDoctor.specialization}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{selectedDoctor.room}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-200 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Date:</span>
                        <strong className="text-slate-900">{selectedDate}</strong>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Time Slot:</span>
                        <strong className="text-teal-700">{selectedTimeSlot || 'Not selected'}</strong>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Care Stream:</span>
                        <strong className="text-slate-900 capitalize">{selectedDoctor.careStream}</strong>
                      </div>
                      <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                        <span>Consultation Fee:</span>
                        <strong className="text-slate-900 text-sm font-mono">₹{selectedDoctor.consultationFee}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Authenticated Patient info */}
                <div className="p-3.5 bg-teal-50/70 rounded-2xl border border-teal-200 text-xs space-y-1 text-teal-950">
                  <span className="text-[10px] font-bold text-teal-800 uppercase block">
                    Authenticated Patient
                  </span>
                  <p className="font-extrabold text-sm text-slate-900">{patient.name}</p>
                  <p className="text-slate-600 font-mono text-[11px]">UHID: {patient.uhid || patient.id}</p>
                  <p className="text-slate-600 text-[11px]">Mobile: {patient.mobile || 'Registered'}</p>
                </div>

                {/* Cloud Sync Indicator */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Database Live Sync (<code className="font-mono text-teal-700 font-bold">{SUPABASE_PROJECT_ID}</code>)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSupabaseModal(true)}
                    className="text-teal-700 hover:text-teal-900 font-bold underline cursor-pointer text-[10px]"
                  >
                    SQL Status
                  </button>
                </div>
              </div>

            </div>
          ) : step === 'review' ? (

            /* ------------------------------------------------------------- */
            /* VIEW 2: REVIEW BEFORE FINAL BOOKING (MANDATORY REQUIREMENT) */
            /* ------------------------------------------------------------- */
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[80vh] bg-slate-50 flex-1">
              <div className="max-w-2xl mx-auto space-y-6">
                
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold text-slate-900">
                    Review Appointment Details
                  </h3>
                  <p className="text-xs text-slate-600">
                    Please review your booking details before confirming your OPD consultation token.
                  </p>
                </div>

                {bookingError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span className="font-bold">{bookingError}</span>
                  </div>
                )}

                {/* Review Table */}
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm text-xs">
                  <div className="p-4 bg-teal-800 text-white flex items-center justify-between">
                    <span className="font-bold">AIIMS Hospital OPD Appointment Summary</span>
                    <span className="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded">
                      Pre-Booking Verification
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    <div className="p-4 grid grid-cols-3 gap-2">
                      <span className="text-slate-500 font-medium">Patient Name</span>
                      <span className="col-span-2 font-bold text-slate-900">{patient.name}</span>
                    </div>
                    <div className="p-4 grid grid-cols-3 gap-2 bg-slate-50/50">
                      <span className="text-slate-500 font-medium">UHID / Patient ID</span>
                      <span className="col-span-2 font-mono font-bold text-teal-800">{patient.uhid || patient.id}</span>
                    </div>
                    <div className="p-4 grid grid-cols-3 gap-2">
                      <span className="text-slate-500 font-medium">Attending Specialist</span>
                      <div className="col-span-2 space-y-0.5">
                        <p className="font-bold text-slate-900">{selectedDoctor?.name}</p>
                        <p className="text-[11px] text-teal-700">{selectedDoctor?.specialization} ({selectedDoctor?.qualification})</p>
                      </div>
                    </div>
                    <div className="p-4 grid grid-cols-3 gap-2 bg-slate-50/50">
                      <span className="text-slate-500 font-medium">Department & Care Stream</span>
                      <span className="col-span-2 font-semibold text-slate-800">
                        {selectedDoctor?.department} • <span className="uppercase text-teal-700">{selectedDoctor?.careStream}</span>
                      </span>
                    </div>
                    <div className="p-4 grid grid-cols-3 gap-2">
                      <span className="text-slate-500 font-medium">Date & Time Slot</span>
                      <span className="col-span-2 font-bold text-slate-900">
                        {selectedDate} • {selectedTimeSlot}
                      </span>
                    </div>
                    <div className="p-4 grid grid-cols-3 gap-2 bg-slate-50/50">
                      <span className="text-slate-500 font-medium">OPD Room / Location</span>
                      <span className="col-span-2 text-slate-800 font-semibold">{selectedDoctor?.room}</span>
                    </div>
                    <div className="p-4 grid grid-cols-3 gap-2">
                      <span className="text-slate-500 font-medium">Chief Complaint / Reason</span>
                      <span className="col-span-2 text-slate-800">{chiefComplaint || 'Routine medical evaluation'}</span>
                    </div>
                    <div className="p-4 grid grid-cols-3 gap-2 bg-slate-50/50">
                      <span className="text-slate-500 font-medium">Consultation Fee</span>
                      <span className="col-span-2 font-black text-sm text-slate-900 font-mono">
                        ₹{selectedDoctor?.consultationFee}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBookingError(null);
                      setStep('selection');
                    }}
                    className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer transition-colors"
                  >
                    Modify / Back
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmBooking}
                    disabled={isSubmitting}
                    className="px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying & Locking Slot...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm Appointment Booking</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>
          ) : (

            /* ------------------------------------------------------------- */
            /* VIEW 3: BOOKING CONFIRMATION SCREEN (MANDATORY REQUIREMENT) */
            /* ------------------------------------------------------------- */
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[80vh] bg-slate-50 flex-1">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Appointment Confirmed & Token Generated!
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Your appointment has been recorded in the hospital registry with real-time atomic queue assignment.
                </p>

                {/* Supabase Persistence Banner */}
                <div className="max-w-md mx-auto p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-[11px] text-left">
                      <strong>Cloud Synced:</strong> Dispatched to Supabase <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded">appointments</code>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSupabaseModal(true)}
                    className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-[10px] cursor-pointer"
                  >
                    SQL Audit
                  </button>
                </div>
              </div>

              {/* Generated Token Card */}
              <div className="max-w-md mx-auto bg-gradient-to-br from-teal-600 to-teal-800 text-white rounded-3xl p-6 shadow-xl text-center relative overflow-hidden">
                <span className="text-[11px] uppercase tracking-widest font-bold text-teal-200">
                  Your OPD Token Number
                </span>
                <div className="text-4xl sm:text-5xl font-black text-white font-mono my-2 tracking-tight">
                  {bookedAppointment?.tokenNumber}
                </div>
                <div className="text-xs text-teal-100">
                  {bookedAppointment?.department} • {bookedAppointment?.roomNumber}
                </div>
                <div className="mt-4 pt-3 border-t border-teal-500/50 flex items-center justify-between text-xs text-teal-100">
                  <span>Est. Wait: <strong>~{bookedAppointment?.estimatedWaitMinutes || 10} mins</strong></span>
                  <span>Queue Pos: <strong>#{bookedAppointment?.queuePosition || 1} in line</strong></span>
                </div>
              </div>

              {/* Full Details Table */}
              <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs text-xs">
                <div className="p-3 bg-slate-100 border-b border-slate-200 font-bold text-slate-800 flex items-center justify-between">
                  <span>Appointment Confirmation Details</span>
                  <span className="font-mono text-[10px] text-teal-700 bg-white px-2 py-0.5 rounded">
                    Booking ID: {bookedAppointment?.id}
                  </span>
                </div>
                <table className="w-full text-left border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="p-3 text-slate-500 font-semibold w-1/3">Patient Name</td>
                      <td className="p-3 font-bold text-slate-900">{bookedAppointment?.patientName}</td>
                    </tr>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <td className="p-3 text-slate-500 font-semibold">UHID / Patient ID</td>
                      <td className="p-3 font-mono text-slate-800">{bookedAppointment?.uhid} (ABHA Linked)</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="p-3 text-slate-500 font-semibold">Specialist Doctor</td>
                      <td className="p-3 font-bold text-teal-900">{bookedAppointment?.doctorName} ({bookedAppointment?.doctorSpecialty})</td>
                    </tr>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <td className="p-3 text-slate-500 font-semibold">Date & Time Slot</td>
                      <td className="p-3 font-bold text-slate-900">{bookedAppointment?.date} • {bookedAppointment?.timeSlot}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="p-3 text-slate-500 font-semibold">Room & Care Stream</td>
                      <td className="p-3 text-slate-800">{bookedAppointment?.roomNumber} • <span className="capitalize">{bookedAppointment?.careStream}</span></td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="p-3 text-slate-500 font-semibold">Chief Complaint / Reason</td>
                      <td className="p-3 text-slate-800">{bookedAppointment?.chiefComplaint}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Done / View My Portal
                </button>

                {onStartKioskIntake && bookedAppointment && (
                  <button
                    type="button"
                    onClick={() => {
                      resetAndClose();
                      onStartKioskIntake(bookedAppointment);
                    }}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Proceed to MediKiosk AI Intake</span>
                  </button>
                )}
              </div>

            </div>
          )
        )}

      </div>

      {/* Supabase Connection & SQL Schema Viewer */}
      <SupabaseStatusModal
        isOpen={showSupabaseModal}
        onClose={() => setShowSupabaseModal(false)}
      />
    </div>
  );
};
