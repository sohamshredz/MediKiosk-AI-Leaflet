import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Search, 
  Filter, 
  UserCheck, 
  XCircle, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Stethoscope, 
  Activity, 
  User, 
  ArrowRight, 
  X, 
  AlertTriangle,
  Building2
} from 'lucide-react';
import { OpdAppointment, HospitalStaffMember } from '../../types';
import { 
  fetchOpdAppointments, 
  reassignOpdAppointment, 
  cancelOpdAppointment 
} from '../../services/adminService';

interface AppointmentsOversightTabProps {
  staffList: HospitalStaffMember[];
  onRefreshLogs?: () => void;
  onShowFeedback: (type: 'success' | 'error', message: string) => void;
}

export const AppointmentsOversightTab: React.FC<AppointmentsOversightTabProps> = ({
  staffList,
  onRefreshLogs,
  onShowFeedback
}) => {
  const [appointments, setAppointments] = useState<OpdAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');

  // Reassign Modal
  const [reassignTarget, setReassignTarget] = useState<OpdAppointment | null>(null);
  const [newDoctorId, setNewDoctorId] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);

  // Cancel Modal
  const [cancelTarget, setCancelTarget] = useState<OpdAppointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Load appointments
  const loadAppointments = async () => {
    setIsLoading(true);
    const res = await fetchOpdAppointments();
    if (res.success) {
      setAppointments(res.appointments || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  // Filter clinical staff eligible for reassignment (Doctors and Medical Officers)
  const eligibleDoctors = staffList.filter(s => 
    s.status === 'active' && (s.role === 'doctor' || s.role === 'medical_officer')
  );

  // Filtered appointments
  const filteredAppointments = appointments.filter(apt => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      apt.patientName.toLowerCase().includes(q) ||
      apt.uhid.toLowerCase().includes(q) ||
      apt.doctorName.toLowerCase().includes(q) ||
      apt.tokenNumber.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
    const matchesDept = deptFilter === 'all' || apt.department === deptFilter;
    return matchesSearch && matchesStatus && matchesDept;
  });

  // Extract unique departments
  const departments = Array.from(new Set(appointments.map(a => a.department).filter(Boolean)));

  // Compute status counts
  const stats = {
    total: appointments.length,
    scheduled: appointments.filter(a => a.status === 'Scheduled').length,
    waiting: appointments.filter(a => a.status === 'Waiting').length,
    inConsultation: appointments.filter(a => a.status === 'In Consultation').length,
    completed: appointments.filter(a => a.status === 'Completed').length,
    cancelled: appointments.filter(a => a.status === 'Cancelled').length,
  };

  // Handle Reassign
  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignTarget || !newDoctorId) return;

    const selectedDoc = eligibleDoctors.find(d => d.staffId === newDoctorId || d.id === newDoctorId);
    if (!selectedDoc) return;

    setIsReassigning(true);
    const res = await reassignOpdAppointment(reassignTarget.id, selectedDoc.staffId, selectedDoc.fullName);
    setIsReassigning(false);

    if (res.success) {
      onShowFeedback('success', `Appointment reassigned to ${selectedDoc.fullName}.`);
      setReassignTarget(null);
      setNewDoctorId('');
      loadAppointments();
      if (onRefreshLogs) onRefreshLogs();
    } else {
      onShowFeedback('error', res.error || 'Failed to reassign appointment.');
    }
  };

  // Handle Cancel
  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTarget || !cancelReason.trim()) {
      onShowFeedback('error', 'Please provide a cancellation reason.');
      return;
    }

    setIsCancelling(true);
    const res = await cancelOpdAppointment(cancelTarget.id, cancelReason);
    setIsCancelling(false);

    if (res.success) {
      onShowFeedback('success', `Appointment cancelled for ${cancelTarget.patientName}.`);
      setCancelTarget(null);
      setCancelReason('');
      loadAppointments();
      if (onRefreshLogs) onRefreshLogs();
    } else {
      onShowFeedback('error', res.error || 'Failed to cancel appointment.');
    }
  };

  return (
    <div className="space-y-6">

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Bookings</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">{stats.total}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-xs">
          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Scheduled</span>
          <p className="text-2xl font-black text-indigo-800 font-mono mt-1">{stats.scheduled}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">In Queue / Waiting</span>
          <p className="text-2xl font-black text-amber-800 font-mono mt-1">{stats.waiting}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-teal-200 bg-teal-50/20 shadow-xs">
          <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">In Consultation</span>
          <p className="text-2xl font-black text-teal-800 font-mono mt-1">{stats.inConsultation}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Completed</span>
          <p className="text-2xl font-black text-emerald-800 font-mono mt-1">{stats.completed}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Cancelled</span>
          <p className="text-2xl font-black text-rose-800 font-mono mt-1">{stats.cancelled}</p>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Patient, UHID, Doctor, Token..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Waiting">Waiting in OPD</option>
              <option value="In Consultation">In Consultation</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-hidden"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={loadAppointments}
          className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer self-end lg:self-auto"
          title="Refresh Queue"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Appointments Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Master OPD Queue &amp; Appointment Dispatch ({filteredAppointments.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Hospital-wide Oversight &amp; Reassignment
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
            <span className="text-xs font-bold">Synchronizing appointment schedule...</span>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-sm font-bold">No appointments match the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-mono tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Token &amp; Time Slot</th>
                  <th className="py-3 px-4">Patient Name &amp; UHID</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Assigned Doctor</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Oversight Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Token & Slot */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 font-mono text-sm">{apt.tokenNumber}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{apt.timeSlot} • {apt.date}</span>
                      </div>
                    </td>

                    {/* Patient */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">{apt.patientName}</div>
                      <div className="text-[11px] text-purple-700 font-mono font-semibold">{apt.uhid}</div>
                    </td>

                    {/* Department */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{apt.department}</div>
                    </td>

                    {/* Doctor */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{apt.doctorName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{apt.doctorStaffId}</div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 border ${
                        apt.status === 'In Consultation'
                          ? 'bg-teal-50 text-teal-800 border-teal-200'
                          : apt.status === 'Waiting'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : apt.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : apt.status === 'Cancelled'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          apt.status === 'In Consultation' ? 'bg-teal-500 animate-pulse' :
                          apt.status === 'Waiting' ? 'bg-amber-500' :
                          apt.status === 'Completed' ? 'bg-emerald-500' :
                          apt.status === 'Cancelled' ? 'bg-rose-500' : 'bg-indigo-500'
                        }`} />
                        <span>{apt.status}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      {apt.status !== 'Completed' && apt.status !== 'Cancelled' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Reassign */}
                          <button
                            type="button"
                            onClick={() => {
                              setReassignTarget(apt);
                              setNewDoctorId('');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Reassign to another Doctor"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>Reassign</span>
                          </button>

                          {/* Cancel */}
                          <button
                            type="button"
                            onClick={() => {
                              setCancelTarget(apt);
                              setCancelReason('');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Cancel Appointment"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Cancel</span>
                          </button>

                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No actions</span>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: REASSIGN APPOINTMENT                                             */}
      {/* ========================================================================= */}
      {reassignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-indigo-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-800 text-white flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Reassign OPD Appointment</h3>
                  <p className="text-xs text-indigo-200">{reassignTarget.patientName} ({reassignTarget.tokenNumber})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReassignTarget(null)}
                className="p-1.5 rounded-xl text-indigo-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReassignSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1">
                <div className="text-slate-700">Current Doctor: <strong>{reassignTarget.doctorName}</strong></div>
                <div className="text-slate-700">Department: <strong>{reassignTarget.department}</strong></div>
                <div className="text-slate-700">Time Slot: <strong>{reassignTarget.timeSlot}</strong></div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Select New Attending Doctor *
                </label>
                <select
                  value={newDoctorId}
                  onChange={(e) => setNewDoctorId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                >
                  <option value="">-- Choose active physician --</option>
                  {eligibleDoctors.map((doc) => (
                    <option key={doc.id} value={doc.staffId}>
                      {doc.fullName} ({doc.roleTitle} - {doc.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReassignTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReassigning}
                  className="px-5 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isReassigning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Confirm Reassignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CANCEL APPOINTMENT                                               */}
      {/* ========================================================================= */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-rose-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-800 text-white flex items-center justify-center font-bold">
                  <XCircle className="w-5 h-5 text-rose-200" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Cancel Appointment</h3>
                  <p className="text-xs text-rose-200">{cancelTarget.patientName} ({cancelTarget.tokenNumber})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="p-1.5 rounded-xl text-rose-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCancelSubmit} className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Cancelling will remove this token from the active queue and notify OPD triage. This action is recorded in the administrative audit log.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Cancellation Reason *
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Doctor emergency / patient requested reschedule / duplicate slot"
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCancelTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isCancelling}
                  className="px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isCancelling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  <span>Cancel Appointment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
