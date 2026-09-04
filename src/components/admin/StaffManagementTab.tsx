import React, { useState } from 'react';
import { 
  UserPlus, 
  KeyRound, 
  UserX, 
  UserCheck, 
  Search, 
  Filter, 
  Edit, 
  RefreshCw, 
  Check, 
  X, 
  ShieldCheck, 
  AlertCircle, 
  Stethoscope, 
  Activity, 
  UserCog, 
  Building2, 
  Mail, 
  Phone, 
  Calendar,
  Lock,
  Database,
  CloudUpload,
  Copy,
  CheckCheck,
  Clock,
  MapPin,
  Coins,
  FileText
} from 'lucide-react';
import { HospitalStaffMember, StaffClinicalRole, StaffAccountStatus } from '../../types';
import { 
  createStaffMember, 
  updateStaffMember, 
  resetStaffPin, 
  changeStaffStatus,
  syncStaffBatchToSupabase 
} from '../../services/adminService';
import { SUPABASE_DOCTORS_STAFF_SQL } from '../../utils/supabaseClient';

interface StaffManagementTabProps {
  staffList: HospitalStaffMember[];
  isLoading: boolean;
  onRefresh: () => void;
  onUpdateStaff?: (updatedStaff: HospitalStaffMember) => void;
  onLogAudit?: () => void;
  onShowFeedback: (type: 'success' | 'error', message: string) => void;
}

export const StaffManagementTab: React.FC<StaffManagementTabProps> = ({
  staffList,
  isLoading,
  onRefresh,
  onUpdateStaff,
  onLogAudit,
  onShowFeedback
}) => {
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Supabase sync & SQL copy states
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [isCopiedSql, setIsCopiedSql] = useState(false);

  // Modal 1: Provision New Staff
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({
    staffId: '',
    fullName: '',
    role: 'doctor' as StaffClinicalRole,
    roleTitle: '',
    department: 'General Medicine OPD',
    specialization: '',
    registrationNumber: '',
    employeeCode: '',
    mobile: '',
    email: '',
    qualification: '',
    roomNumber: 'OPD Room 104',
    opdTimings: '09:00 AM - 01:00 PM',
    consultationFee: 0,
    availableDays: 'Monday, Tuesday, Wednesday, Thursday, Friday',
    bio: '',
    initialPin: ''
  });

  // Modal 2: Edit Staff Details
  const [editTarget, setEditTarget] = useState<HospitalStaffMember | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    roleTitle: '',
    department: '',
    specialization: '',
    registrationNumber: '',
    mobile: '',
    email: '',
    qualification: '',
    roomNumber: '',
    opdTimings: '',
    consultationFee: 0,
    availableDays: '',
    bio: ''
  });

  // Modal 3: Reset Staff PIN
  const [resetPinTarget, setResetPinTarget] = useState<HospitalStaffMember | null>(null);
  const [newPinValue, setNewPinValue] = useState('');
  const [isResettingPin, setIsResettingPin] = useState(false);

  // Modal 4: Change Account Status
  const [statusTarget, setStatusTarget] = useState<HospitalStaffMember | null>(null);
  const [targetStatus, setTargetStatus] = useState<StaffAccountStatus>('suspended');
  const [statusReason, setStatusReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Filtered staff
  const filteredStaff = staffList.filter(s => {
    const matchesSearch = 
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.specialization && s.specialization.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.registrationNumber && s.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Handle Add Staff Submission
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffForm.fullName.trim()) {
      onShowFeedback('error', 'Please provide staff full name.');
      return;
    }
    if (newStaffForm.initialPin.trim() && newStaffForm.initialPin.trim().length < 4) {
      onShowFeedback('error', 'Security PIN must be at least 4 characters.');
      return;
    }

    setIsSubmittingNew(true);
    const res = await createStaffMember(newStaffForm);
    setIsSubmittingNew(false);

    if (res.success) {
      onShowFeedback('success', res.message || 'Staff member provisioned successfully.');
      setIsAddModalOpen(false);
      setNewStaffForm({
        staffId: '',
        fullName: '',
        role: 'doctor',
        roleTitle: '',
        department: 'General Medicine OPD',
        specialization: '',
        registrationNumber: '',
        employeeCode: '',
        mobile: '',
        email: '',
        qualification: '',
        roomNumber: 'OPD Room 104',
        opdTimings: '09:00 AM - 01:00 PM',
        consultationFee: 0,
        availableDays: 'Monday, Tuesday, Wednesday, Thursday, Friday',
        bio: '',
        initialPin: ''
      });
      onRefresh();
      if (onLogAudit) onLogAudit();
    } else {
      onShowFeedback('error', res.error || 'Failed to provision staff account.');
    }
  };

  // Open Edit Modal
  const openEditModal = (staff: HospitalStaffMember) => {
    setEditTarget(staff);
    setEditForm({
      fullName: staff.fullName,
      roleTitle: staff.roleTitle,
      department: staff.department,
      specialization: staff.specialization || '',
      registrationNumber: staff.registrationNumber || '',
      mobile: staff.mobile || '',
      email: staff.email || '',
      qualification: staff.qualification || '',
      roomNumber: staff.roomNumber || '',
      opdTimings: staff.opdTimings || '',
      consultationFee: staff.consultationFee ?? 0,
      availableDays: Array.isArray(staff.availableDays) ? staff.availableDays.join(', ') : (staff.availableDays || ''),
      bio: staff.bio || ''
    });
  };

  // Synchronize staff roster to Supabase
  const handleSyncSupabase = async () => {
    setIsSyncingSupabase(true);
    const res = await syncStaffBatchToSupabase();
    setIsSyncingSupabase(false);
    if (res.success) {
      onShowFeedback('success', res.message || `Successfully synced staff records to Supabase backend!`);
      onRefresh();
    } else {
      onShowFeedback('error', res.error || 'Failed to synchronize staff with Supabase backend.');
    }
  };

  // Copy Supabase SQL for Doctors & Staff
  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_DOCTORS_STAFF_SQL);
    setIsCopiedSql(true);
    onShowFeedback('success', 'Doctors & Staff SQL schema copied to clipboard! Paste into Supabase SQL Editor.');
    setTimeout(() => setIsCopiedSql(false), 3000);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;

    setIsSubmittingEdit(true);
    const res = await updateStaffMember(editTarget.id, editForm);
    setIsSubmittingEdit(false);

    if (res.success) {
      onShowFeedback('success', res.message || 'Doctor / Staff details saved successfully.');
      if (res.staff && onUpdateStaff) {
        onUpdateStaff(res.staff);
      } else if (onUpdateStaff) {
        // Fallback optimistic update with form data
        onUpdateStaff({
          ...editTarget,
          ...editForm,
          updatedAt: new Date().toISOString()
        } as HospitalStaffMember);
      }
      setEditTarget(null);
      onRefresh();
      if (onLogAudit) onLogAudit();
    } else {
      onShowFeedback('error', res.error || 'Failed to update staff details.');
    }
  };

  // Handle Reset PIN
  const handleResetPinSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!resetPinTarget || !newPinValue.trim()) return;
    if (newPinValue.length < 4) {
      onShowFeedback('error', 'Security PIN must be at least 4 characters.');
      return;
    }

    setIsResettingPin(true);
    const res = await resetStaffPin(resetPinTarget.staffId, newPinValue);
    setIsResettingPin(false);

    if (res.success) {
      onShowFeedback('success', res.message || `Security PIN updated for ${resetPinTarget.fullName}.`);
      setResetPinTarget(null);
      setNewPinValue('');
      if (onLogAudit) onLogAudit();
    } else {
      onShowFeedback('error', res.error || 'Failed to reset staff PIN.');
    }
  };

  // Handle Instant Reset PIN to Staff ID (e.g. DOC-SOHOM-01)
  const handleResetToStaffId = async () => {
    if (!resetPinTarget) return;
    setIsResettingPin(true);
    const res = await resetStaffPin(resetPinTarget.staffId, undefined, true);
    setIsResettingPin(false);

    if (res.success) {
      onShowFeedback('success', res.message || `Security PIN for ${resetPinTarget.fullName} reset to Staff ID: "${resetPinTarget.staffId}".`);
      setResetPinTarget(null);
      setNewPinValue('');
      if (onLogAudit) onLogAudit();
    } else {
      onShowFeedback('error', res.error || 'Failed to reset staff PIN.');
    }
  };

  // Open Status Change Modal
  const openStatusModal = (staff: HospitalStaffMember, target: StaffAccountStatus) => {
    setStatusTarget(staff);
    setTargetStatus(target);
    setStatusReason('');
  };

  // Handle Status Change Submit
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusTarget) return;

    setIsUpdatingStatus(true);
    const res = await changeStaffStatus(statusTarget.staffId, targetStatus, statusReason);
    setIsUpdatingStatus(false);

    if (res.success) {
      onShowFeedback('success', `Status for ${statusTarget.fullName} updated to ${targetStatus.toUpperCase()}.`);
      setStatusTarget(null);
      setStatusReason('');
      onRefresh();
      if (onLogAudit) onLogAudit();
    } else {
      onShowFeedback('error', res.error || 'Failed to change staff status.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Controls Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Search & Filter bar */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              id="input-staff-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff by Name, Staff ID, Department, Reg No..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="select-staff-role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-hidden"
            >
              <option value="all">All Roles</option>
              <option value="doctor">Doctors</option>
              <option value="medical_officer">Medical Officers</option>
              <option value="triage_nurse">Triage Nurses</option>
            </select>

            <select
              id="select-staff-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended</option>
              <option value="deactivated">Deactivated</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-end lg:self-auto">
          <button
            type="button"
            onClick={handleCopySql}
            className="px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
            title="Copy SQL for Doctors & Staff tables to run in Supabase SQL editor"
          >
            {isCopiedSql ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-emerald-600" />}
            <span>{isCopiedSql ? 'SQL Copied!' : 'Copy Supabase SQL'}</span>
          </button>

          <button
            type="button"
            onClick={handleSyncSupabase}
            disabled={isSyncingSupabase}
            className="px-3 py-2 rounded-xl border border-cyan-300 bg-cyan-50 hover:bg-cyan-100 text-cyan-900 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs disabled:opacity-60"
            title="Push current staff & doctors roster into Supabase PostgreSQL database"
          >
            <CloudUpload className={`w-3.5 h-3.5 text-cyan-700 ${isSyncingSupabase ? 'animate-bounce' : ''}`} />
            <span>{isSyncingSupabase ? 'Syncing...' : 'Sync with Supabase'}</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
            title="Refresh Staff List"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            id="btn-open-add-staff"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Provision New Staff</span>
          </button>
        </div>
      </div>

      {/* Staff Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCog className="w-4 h-4 text-purple-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Hospital Clinical Staff Directory ({filteredStaff.length} Accounts)
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Provisioned exclusively by Master HIS Admin
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
            <span className="text-xs font-bold">Synchronizing staff roster...</span>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-sm font-bold">No staff members match the specified filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-mono tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Staff ID &amp; Reg No</th>
                  <th className="py-3 px-4">Department &amp; Specialty</th>
                  <th className="py-3 px-4">Contact &amp; Code</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">HIS Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Name & Role */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        {staff.role === 'doctor' ? (
                          <Stethoscope className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        ) : staff.role === 'medical_officer' ? (
                          <Activity className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        )}
                        <span>{staff.fullName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {staff.roleTitle}
                      </div>
                    </td>

                    {/* Staff ID & Registration */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-purple-950 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md inline-block">
                        {staff.staffId}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Reg: {staff.registrationNumber || 'VERIFIED'}
                      </div>
                    </td>

                    {/* Department & OPD Details */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{staff.department}</div>
                      <div className="text-[11px] text-slate-500">{staff.specialization}</div>
                      {(staff.role === 'doctor' || staff.role === 'medical_officer' || staff.roomNumber || staff.opdTimings) && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {staff.roomNumber && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-medium">
                              <MapPin className="w-2.5 h-2.5 shrink-0" />
                              <span>{staff.roomNumber}</span>
                            </span>
                          )}
                          {staff.opdTimings && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-100 text-amber-800 text-[10px] font-medium">
                              <Clock className="w-2.5 h-2.5 shrink-0" />
                              <span>{staff.opdTimings}</span>
                            </span>
                          )}
                          {staff.consultationFee !== undefined && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] font-medium">
                              <Coins className="w-2.5 h-2.5 shrink-0" />
                              <span>{staff.consultationFee === 0 ? 'Free OPD' : `₹${staff.consultationFee}`}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4">
                      <div className="text-[11px] text-slate-700 font-mono">{staff.mobile}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{staff.email}</div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 border ${
                        staff.status === 'active'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : staff.status === 'suspended'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          staff.status === 'active' ? 'bg-emerald-500' : staff.status === 'suspended' ? 'bg-amber-500' : 'bg-rose-500'
                        }`} />
                        <span>{staff.status}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Edit Details */}
                        <button
                          type="button"
                          onClick={() => openEditModal(staff)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Edit Staff Details"
                        >
                          <Edit className="w-3 h-3 text-slate-600" />
                          <span>Edit</span>
                        </button>

                        {/* Reset PIN */}
                        <button
                          type="button"
                          onClick={() => {
                            setResetPinTarget(staff);
                            setNewPinValue('');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Reset Security PIN"
                        >
                          <KeyRound className="w-3 h-3 text-purple-600" />
                          <span>Reset PIN</span>
                        </button>

                        {/* Status Toggle */}
                        {staff.status === 'active' ? (
                          <button
                            type="button"
                            onClick={() => openStatusModal(staff, 'suspended')}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Suspend Account"
                          >
                            <UserX className="w-3 h-3 text-amber-600" />
                            <span>Suspend</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openStatusModal(staff, 'active')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Reactivate Account"
                          >
                            <UserCheck className="w-3 h-3 text-emerald-600" />
                            <span>Activate</span>
                          </button>
                        )}

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: PROVISION NEW STAFF MEMBER                                       */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-purple-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-800 text-white flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5 text-purple-200" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Provision New Hospital Staff</h3>
                  <p className="text-xs text-purple-200">Issue authorized Staff ID &amp; 4-Digit Security PIN</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-purple-300 hover:text-white hover:bg-purple-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name &amp; Title *
                </label>
                <input
                  type="text"
                  value={newStaffForm.fullName}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, fullName: e.target.value })}
                  placeholder="e.g. Dr. Ramesh Gupta, MD"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Staff Clinical Role *
                  </label>
                  <select
                    value={newStaffForm.role}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, role: e.target.value as StaffClinicalRole })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  >
                    <option value="doctor">Doctor (Consultant Physician)</option>
                    <option value="medical_officer">Medical Officer (CMO / Emergency)</option>
                    <option value="triage_nurse">Triage Nurse (Clinical Intake)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Department *
                  </label>
                  <input
                    type="text"
                    value={newStaffForm.department}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, department: e.target.value })}
                    placeholder="e.g. Cardiology OPD"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Doctor / Staff ID (e.g. DOC-SOHOM-01)
                  </label>
                  <input
                    type="text"
                    value={newStaffForm.staffId}
                    onChange={(e) => {
                      const idVal = e.target.value;
                      setNewStaffForm({
                        ...newStaffForm,
                        staffId: idVal,
                        initialPin: (!newStaffForm.initialPin || newStaffForm.initialPin === newStaffForm.staffId) ? idVal : newStaffForm.initialPin
                      });
                    }}
                    placeholder="e.g. DOC-SOHOM-01 (or leave blank for auto)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Leave blank to auto-generate (e.g. DOC-4819)</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Initial Security PIN (Confidential)
                  </label>
                  <input
                    type="password"
                    maxLength={32}
                    value={newStaffForm.initialPin}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, initialPin: e.target.value })}
                    placeholder="•••••••• (Leave blank to generate secure initial PIN)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                  <p className="text-[11px] text-purple-700 font-semibold mt-1">
                    Credentials must only be disclosed directly to the verified clinician.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Specialization
                  </label>
                  <input
                    type="text"
                    value={newStaffForm.specialization}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, specialization: e.target.value })}
                    placeholder="e.g. Interventional Cardiology"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Registration No. (MCI/DMC/INC)
                  </label>
                  <input
                    type="text"
                    value={newStaffForm.registrationNumber}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, registrationNumber: e.target.value })}
                    placeholder="e.g. MCI-2018-99210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Contact Mobile
                  </label>
                  <input
                    type="text"
                    value={newStaffForm.mobile}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, mobile: e.target.value })}
                    placeholder="+91 98000 00000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={newStaffForm.email}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                    placeholder="doctor@hospital.gov.in"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Doctor / OPD Consultation Details for Supabase */}
              <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 uppercase tracking-wider">
                  <Stethoscope className="w-3.5 h-3.5 text-purple-700" />
                  <span>OPD Consultation &amp; Supabase Backend Sync Details</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      OPD Room No.
                    </label>
                    <input
                      type="text"
                      value={newStaffForm.roomNumber}
                      onChange={(e) => setNewStaffForm({ ...newStaffForm, roomNumber: e.target.value })}
                      placeholder="e.g. OPD Room 104"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      OPD Timings
                    </label>
                    <input
                      type="text"
                      value={newStaffForm.opdTimings}
                      onChange={(e) => setNewStaffForm({ ...newStaffForm, opdTimings: e.target.value })}
                      placeholder="e.g. 09:00 AM - 01:00 PM"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Consultation Fee (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={newStaffForm.consultationFee}
                      onChange={(e) => setNewStaffForm({ ...newStaffForm, consultationFee: Number(e.target.value) || 0 })}
                      placeholder="0 for Govt Free"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Available Days
                  </label>
                  <input
                    type="text"
                    value={newStaffForm.availableDays}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, availableDays: e.target.value })}
                    placeholder="Monday, Tuesday, Wednesday, Thursday, Friday"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Doctor Bio / Clinical Profile
                  </label>
                  <textarea
                    rows={2}
                    value={newStaffForm.bio}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, bio: e.target.value })}
                    placeholder="Senior clinician background, clinical sub-specialties, patient care focus..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden bg-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew}
                  className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmittingNew ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Provision Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT STAFF DETAILS                                               */}
      {/* ========================================================================= */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-800 text-purple-300 flex items-center justify-center font-bold">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Edit Staff Details</h3>
                  <p className="text-xs text-slate-300">Staff ID: {editTarget.staffId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name &amp; Title
                </label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Role Title
                  </label>
                  <input
                    type="text"
                    value={editForm.roleTitle}
                    onChange={(e) => setEditForm({ ...editForm, roleTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Specialization
                  </label>
                  <input
                    type="text"
                    value={editForm.specialization}
                    onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    value={editForm.registrationNumber}
                    onChange={(e) => setEditForm({ ...editForm, registrationNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Contact Mobile
                  </label>
                  <input
                    type="text"
                    value={editForm.mobile}
                    onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Doctor / OPD Consultation Details for Supabase */}
              <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 uppercase tracking-wider">
                  <Stethoscope className="w-3.5 h-3.5 text-purple-700" />
                  <span>OPD Consultation &amp; Supabase Backend Sync Details</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      OPD Room No.
                    </label>
                    <input
                      type="text"
                      value={editForm.roomNumber}
                      onChange={(e) => setEditForm({ ...editForm, roomNumber: e.target.value })}
                      placeholder="e.g. OPD Room 104"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      OPD Timings
                    </label>
                    <input
                      type="text"
                      value={editForm.opdTimings}
                      onChange={(e) => setEditForm({ ...editForm, opdTimings: e.target.value })}
                      placeholder="e.g. 09:00 AM - 01:00 PM"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Consultation Fee (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editForm.consultationFee}
                      onChange={(e) => setEditForm({ ...editForm, consultationFee: Number(e.target.value) || 0 })}
                      placeholder="0 for Govt Free"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Available Days
                  </label>
                  <input
                    type="text"
                    value={editForm.availableDays}
                    onChange={(e) => setEditForm({ ...editForm, availableDays: e.target.value })}
                    placeholder="Monday, Tuesday, Wednesday, Thursday, Friday"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Doctor Bio / Clinical Profile
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Senior clinician background, clinical sub-specialties, patient care focus..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden bg-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmittingEdit ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RESET STAFF PIN                                                  */}
      {/* ========================================================================= */}
      {resetPinTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-purple-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-800 text-white flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5 text-purple-200" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Reset Staff Security PIN</h3>
                  <p className="text-xs text-purple-200">{resetPinTarget.fullName} ({resetPinTarget.staffId})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetPinTarget(null)}
                className="p-1.5 rounded-xl text-purple-300 hover:text-white hover:bg-purple-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-2xl text-xs text-purple-950 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Doctor / Staff Name:</span>
                  <span className="font-bold text-slate-900">{resetPinTarget.fullName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Staff ID:</span>
                  <span className="font-mono font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded-md">{resetPinTarget.staffId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Department:</span>
                  <span className="font-semibold text-slate-800">{resetPinTarget.department}</span>
                </div>
              </div>

              {/* OPTION 1: Reset PIN to Staff ID */}
              <div className="p-4 rounded-2xl border-2 border-purple-300 bg-linear-to-br from-purple-50 to-white space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Reset PIN to Staff ID (Recommended)</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Resets this doctor's security PIN directly to their Staff ID (<strong className="font-mono text-purple-900">{resetPinTarget.staffId}</strong>). Both Staff ID and PIN will be the same.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isResettingPin}
                  onClick={handleResetToStaffId}
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 active:scale-[0.99] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isResettingPin ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  <span>Reset PIN to Staff ID ({resetPinTarget.staffId})</span>
                </button>
              </div>

              {/* OPTION 2: Set Custom PIN */}
              <form onSubmit={handleResetPinSubmit} className="pt-3 border-t border-slate-200 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Or Set Custom Security PIN
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      maxLength={32}
                      value={newPinValue}
                      onChange={(e) => setNewPinValue(e.target.value)}
                      placeholder="•••••••• (Enter confidential PIN)"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                    <button
                      type="submit"
                      disabled={isResettingPin || !newPinValue.trim()}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                    >
                      {isResettingPin ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Set PIN</span>
                    </button>
                  </div>
                </div>
              </form>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setResetPinTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CHANGE ACCOUNT STATUS                                            */}
      {/* ========================================================================= */}
      {statusTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className={`p-5 text-white flex items-center justify-between ${
              targetStatus === 'active' ? 'bg-emerald-950' : 'bg-amber-950'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                  targetStatus === 'active' ? 'bg-emerald-800 text-white' : 'bg-amber-800 text-white'
                }`}>
                  {targetStatus === 'active' ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {targetStatus === 'active' ? 'Reactivate Staff Account' : 'Change Staff Account Status'}
                  </h3>
                  <p className="text-xs text-slate-200">{statusTarget.fullName} ({statusTarget.staffId})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStatusTarget(null)}
                className="p-1.5 rounded-xl text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Target Status
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as StaffAccountStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                >
                  <option value="active">Active (Full Portal Access)</option>
                  <option value="suspended">Suspended (Temporary Revocation)</option>
                  <option value="deactivated">Deactivated (Terminated / Inactive)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Reason for Status Change
                </label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="e.g. Leave of absence / departmental transfer / clinical audit"
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStatusTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 ${
                    targetStatus === 'active' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-amber-700 hover:bg-amber-800'
                  }`}
                >
                  {isUpdatingStatus ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Confirm Status Update</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
