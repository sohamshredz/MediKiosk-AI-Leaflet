import React, { useState } from 'react';
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
  Pill,
  Printer,
  Download,
  Activity,
  QrCode,
  ArrowRight,
  Trash2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Appointment, PatientProfile } from '../../types';

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  patient: PatientProfile;
  onStartKioskIntake?: (appointment: Appointment) => void;
  onCancelAppointment?: (appointmentId: string) => Promise<void> | void;
}

export const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({
  isOpen,
  onClose,
  appointment,
  patient,
  onStartKioskIntake,
  onCancelAppointment
}) => {
  const [isConfirmingCancel, setIsConfirmingCancel] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  if (!isOpen || !appointment) return null;

  const isCompleted = appointment.status === 'consultation_done';
  const isCancelled = appointment.status === 'cancelled';
  const isUpcoming = appointment.status === 'in_queue' || appointment.status === 'confirmed' || appointment.status === 'intake_completed';

  const handlePrint = () => {
    window.print();
  };

  const handleCancel = async () => {
    if (!onCancelAppointment) return;
    setIsCancelling(true);
    try {
      await onCancelAppointment(appointment.id);
      setIsConfirmingCancel(false);
      onClose();
    } catch (err) {
      console.error('Error cancelling appointment:', err);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-mono font-bold">
              {appointment.tokenNumber}
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
                <span>Appointment Summary & Record</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                  isCompleted 
                    ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50' 
                    : isCancelled
                    ? 'bg-red-900/60 text-red-300 border border-red-700/50'
                    : 'bg-teal-900/60 text-teal-300 border border-teal-700/50'
                }`}>
                  {appointment.status.replace(/_/g, ' ')}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                AIIMS Hospital OPD • ABDM Resource ID: {appointment.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Print Record"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Cancellation Confirmation Alert */}
          {isConfirmingCancel && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-red-950">Cancel OPD Appointment Confirmation</h4>
                  <p className="text-[11px] text-red-800">
                    Are you sure you want to cancel this appointment with {appointment.doctorName} for {appointment.date} at {appointment.timeSlot}? This will release the slot back to the clinic queue.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsConfirmingCancel(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Keep Appointment
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isCancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Yes, Cancel Appointment</span>
                </button>
              </div>
            </div>
          )}

          {/* Key Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Patient Name</span>
              <span className="font-extrabold text-slate-900">{patient.name}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">UHID / Token</span>
              <span className="font-mono font-bold text-teal-700">{patient.uhid || patient.id} ({appointment.tokenNumber})</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Date & Slot</span>
              <span className="font-bold text-slate-800">{appointment.date} • {appointment.timeSlot}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Care Stream</span>
              <span className="font-bold text-slate-800 uppercase">{appointment.careStream}</span>
            </div>
          </div>

          {/* Attending Physician & Department */}
          <div className="p-4 border border-slate-200 rounded-2xl flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <p className="font-black text-slate-900 text-sm">{appointment.doctorName}</p>
                <p className="text-xs text-teal-700 font-semibold">{appointment.doctorSpecialty}</p>
                <p className="text-[11px] text-slate-500">{appointment.department} • {appointment.roomNumber}</p>
              </div>
            </div>

            {appointment.abhaLinked && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>ABHA Health Locker Linked</span>
              </div>
            )}
          </div>

          {/* Reason for Visit */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Chief Complaint & Reason for Visit
            </h3>
            <p className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed font-medium">
              {appointment.chiefComplaint || 'Routine medical evaluation and health review'}
            </p>
          </div>

          {/* Live Queue Status (If upcoming) */}
          {isUpcoming && !isCancelled && (
            <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">
                  #{appointment.queuePosition || 1}
                </div>
                <div>
                  <p className="font-bold text-xs text-teal-950">
                    Live Queue Position: Token {appointment.tokenNumber}
                  </p>
                  <p className="text-[11px] text-teal-800">
                    Currently serving: <strong className="font-mono">{appointment.currentServingToken || 'OPD-100'}</strong> • Est. Wait: <strong>{appointment.estimatedWaitMinutes || 10} mins</strong>
                  </p>
                </div>
              </div>

              {onStartKioskIntake && (
                <button
                  type="button"
                  id="open-kiosk-from-apt-details-btn"
                  onClick={() => {
                    onStartKioskIntake(appointment);
                    onClose();
                  }}
                  className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Launch Pre-Intake Form</span>
                </button>
              )}
            </div>
          )}

          {/* Doctor Verified Diagnosis & Prescription (If Completed) */}
          {isCompleted && (
            <div className="space-y-4">
              {appointment.doctorDiagnosis && (
                <div className="p-4 border-2 border-teal-600 bg-teal-50/40 rounded-2xl space-y-1.5">
                  <span className="text-[10px] font-bold text-teal-900 uppercase tracking-wider block">
                    Confirmed Doctor Diagnosis
                  </span>
                  <p className="font-black text-slate-900 text-sm">
                    {appointment.doctorDiagnosis}
                  </p>
                  {appointment.doctorAdvice && (
                    <p className="text-xs text-slate-700 pt-2 border-t border-teal-200 mt-2">
                      <strong>Physician Advice: </strong>{appointment.doctorAdvice}
                    </p>
                  )}
                  {appointment.followUpDate && (
                    <p className="text-xs text-teal-900 font-bold mt-1">
                      📅 Review / Next Follow-up: {appointment.followUpDate}
                    </p>
                  )}
                </div>
              )}

              {/* Prescription Table */}
              {appointment.doctorPrescription && appointment.doctorPrescription.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Pill className="w-4 h-4 text-teal-600" />
                      <span>Digital e-Prescription (Rx)</span>
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400">Digital Signature Verified</span>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                        <tr>
                          <th className="p-2.5">Medicine Name</th>
                          <th className="p-2.5">Dosage</th>
                          <th className="p-2.5">Timing / Frequency</th>
                          <th className="p-2.5 text-right">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {appointment.doctorPrescription.map((rx, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{rx.medicineName}</td>
                            <td className="p-2.5 text-slate-700">{rx.dosage}</td>
                            <td className="p-2.5 font-mono text-slate-700">{rx.timing}</td>
                            <td className="p-2.5 text-right font-bold text-teal-700">{rx.days} days</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {isUpcoming && onCancelAppointment && !isConfirmingCancel && (
              <button
                type="button"
                onClick={() => setIsConfirmingCancel(true)}
                className="px-3.5 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Cancel Appointment</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
