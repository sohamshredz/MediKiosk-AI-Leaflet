import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Trash2, 
  Edit, 
  Eye, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  UserX, 
  X, 
  Save, 
  Activity, 
  AlertTriangle,
  Stethoscope,
  Pill,
  History,
  Shield,
  Phone,
  Calendar,
  Building2
} from 'lucide-react';
import { PatientProfile, CareStream } from '../../types';
import { updatePatientRecord, deletePatientRecord } from '../../services/adminService';

interface PatientManagementTabProps {
  patients: PatientProfile[];
  onUpdatePatient: (updated: PatientProfile) => void;
  onDeletePatient?: (id: string) => void;
  onShowFeedback: (type: 'success' | 'error', message: string) => void;
}

export const PatientManagementTab: React.FC<PatientManagementTabProps> = ({
  patients,
  onUpdatePatient,
  onDeletePatient,
  onShowFeedback
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [streamFilter, setStreamFilter] = useState('all');

  // Viewing EHR Detail Modal
  const [viewingPatient, setViewingPatient] = useState<PatientProfile | null>(null);

  // Edit Patient Modal
  const [editingPatient, setEditingPatient] = useState<PatientProfile | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    age: 0,
    gender: 'male' as 'male' | 'female' | 'other',
    mobile: '',
    department: '',
    address: '',
    careStream: 'allopathy' as CareStream
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Patient Modal
  const [deleteTarget, setDeleteTarget] = useState<PatientProfile | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered patients
  const filteredPatients = patients.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      p.name.toLowerCase().includes(q) ||
      p.uhid.toLowerCase().includes(q) ||
      (p.abhaId && p.abhaId.toLowerCase().includes(q)) ||
      (p.mobile && p.mobile.includes(q)) ||
      (p.department && p.department.toLowerCase().includes(q));

    const matchesStream = streamFilter === 'all' || p.careStream === streamFilter;
    return matchesSearch && matchesStream;
  });

  // Open Edit Modal
  const handleOpenEdit = (pat: PatientProfile) => {
    setEditingPatient(pat);
    setEditForm({
      name: pat.name,
      age: pat.age,
      gender: pat.gender,
      mobile: pat.mobile || '',
      department: pat.department || 'General Medicine',
      address: pat.address || '',
      careStream: pat.careStream
    });
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;

    setIsSavingEdit(true);
    const updatedRecord: PatientProfile = {
      ...editingPatient,
      name: editForm.name.trim(),
      age: Number(editForm.age),
      gender: editForm.gender,
      mobile: editForm.mobile.trim(),
      department: editForm.department.trim(),
      address: editForm.address.trim(),
      careStream: editForm.careStream
    };

    const res = await updatePatientRecord(editingPatient.id, updatedRecord);
    setIsSavingEdit(false);

    if (res.success) {
      onUpdatePatient(updatedRecord);
      onShowFeedback('success', `Patient demographic record updated for ${updatedRecord.name}.`);
      setEditingPatient(null);
      if (viewingPatient && viewingPatient.id === updatedRecord.id) {
        setViewingPatient(updatedRecord);
      }
    } else {
      onShowFeedback('error', res.error || 'Failed to update patient record.');
    }
  };

  // Submit Delete
  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteTarget || !deleteReason.trim()) {
      onShowFeedback('error', 'Please enter a justification for deleting the patient record.');
      return;
    }

    setIsDeleting(true);
    const res = await deletePatientRecord(deleteTarget.id, deleteReason);
    setIsDeleting(false);

    if (res.success) {
      if (onDeletePatient) {
        onDeletePatient(deleteTarget.id);
      }
      onShowFeedback('success', `Patient record for ${deleteTarget.name} (${deleteTarget.uhid}) deleted.`);
      setDeleteTarget(null);
      setDeleteReason('');
      if (viewingPatient && viewingPatient.id === deleteTarget.id) {
        setViewingPatient(null);
      }
    } else {
      onShowFeedback('error', res.error || 'Failed to delete patient record.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Patient Name, UHID, ABHA ID, Mobile, Dept..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <select
            value={streamFilter}
            onChange={(e) => setStreamFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-hidden"
          >
            <option value="all">All Care Streams</option>
            <option value="allopathy">Allopathy</option>
            <option value="ayurveda">Ayurveda</option>
            <option value="integrated">Integrated</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-bold hidden sm:block">
          Total Registered: <span className="font-mono text-purple-700">{patients.length}</span> Records
        </div>
      </div>

      {/* Patient Master Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Electronic Health Records (EHR) &amp; Registry ({filteredPatients.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            ABDM Token &amp; Clinical Privacy Governance
          </span>
        </div>

        {filteredPatients.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-sm font-bold">No patient records found matching query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-mono tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Patient Profile &amp; Demographics</th>
                  <th className="py-3 px-4">Identifiers (UHID / ABHA)</th>
                  <th className="py-3 px-4">Department &amp; Care Stream</th>
                  <th className="py-3 px-4">Clinical Status</th>
                  <th className="py-3 px-4">Vitals &amp; Symptoms</th>
                  <th className="py-3 px-4 text-right">HIS Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredPatients.map((pat) => (
                  <tr key={pat.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Patient Name */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">{pat.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span>{pat.age} yrs</span>
                        <span>•</span>
                        <span className="capitalize">{pat.gender}</span>
                        <span>•</span>
                        <span className="font-mono">{pat.mobile}</span>
                      </div>
                    </td>

                    {/* Identifiers */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-purple-900 text-xs">
                        {pat.uhid}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {pat.abhaId ? `ABHA: ${pat.abhaId}` : 'No ABHA linked'}
                      </div>
                      <span className="inline-block mt-1 px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-mono text-slate-600">
                        Token: {pat.tokenNumber}
                      </span>
                    </td>

                    {/* Department */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{pat.department}</div>
                      <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        pat.careStream === 'ayurveda' 
                          ? 'bg-amber-100 text-amber-800'
                          : pat.careStream === 'integrated'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-teal-100 text-teal-800'
                      }`}>
                        {pat.careStream}
                      </span>
                    </td>

                    {/* Clinical Status */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                        pat.triageRisk === 'CRITICAL_EMERGENCY'
                          ? 'bg-rose-100 text-rose-800'
                          : pat.triageRisk === 'URGENT_PRIORITY'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          pat.triageRisk === 'CRITICAL_EMERGENCY' ? 'bg-rose-600 animate-ping' :
                          pat.triageRisk === 'URGENT_PRIORITY' ? 'bg-amber-600' : 'bg-emerald-600'
                        }`} />
                        <span>{pat.triageRisk.replace('_', ' ')}</span>
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1 capitalize">
                        {pat.status.replace(/_/g, ' ')}
                      </div>
                    </td>

                    {/* Vitals Summary */}
                    <td className="py-3 px-4">
                      {pat.vitals ? (
                        <div className="text-[11px] font-mono text-slate-600 space-y-0.5">
                          {pat.vitals.bpSystolic && (
                            <div>BP: <strong>{pat.vitals.bpSystolic}/{pat.vitals.bpDiastolic}</strong> mmHg</div>
                          )}
                          {pat.vitals.spO2 && (
                            <div>SpO2: <strong>{pat.vitals.spO2}%</strong> | HR: <strong>{pat.vitals.heartRate || '--'}</strong></div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No vitals</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* View EHR */}
                        <button
                          type="button"
                          onClick={() => setViewingPatient(pat)}
                          className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 cursor-pointer transition-colors"
                          title="View Full Electronic Health Record (EHR)"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit Demographics */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(pat)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
                          title="Edit Patient Demographics"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Delete Patient */}
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteTarget(pat);
                            setDeleteReason('');
                          }}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer transition-colors"
                          title="Delete Patient Record (HIS Master Admin authorization)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

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
      {/* MODAL 1: EDIT PATIENT DEMOGRAPHICS                                        */}
      {/* ========================================================================= */}
      {editingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Edit Patient Demographics</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingPatient(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between font-mono">
                <span>UHID: <strong>{editingPatient.uhid}</strong></span>
                <span>Token: <strong>{editingPatient.tokenNumber}</strong></span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Age (Years) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={editForm.age}
                    onChange={(e) => setEditForm({ ...editForm, age: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Gender *
                  </label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value as 'male' | 'female' | 'other' })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    value={editForm.mobile}
                    onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    OPD Department *
                  </label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Care Stream *
                  </label>
                  <select
                    value={editForm.careStream}
                    onChange={(e) => setEditForm({ ...editForm, careStream: e.target.value as CareStream })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  >
                    <option value="allopathy">Allopathy (Modern)</option>
                    <option value="ayurveda">Ayurveda (Traditional)</option>
                    <option value="integrated">Integrated Holistic</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Residential Address
                </label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="e.g. B-42, Hauz Khas, New Delhi"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPatient(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Demographic Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DELETE PATIENT CONFIRMATION                                      */}
      {/* ========================================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-rose-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-800 text-white flex items-center justify-center font-bold">
                  <UserX className="w-5 h-5 text-rose-200" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Delete Patient Record</h3>
                  <p className="text-xs text-rose-200">HIS Master Governance Action</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="p-1.5 rounded-xl text-rose-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeleteSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <div className="font-bold text-rose-950">{deleteTarget.name}</div>
                <div className="text-rose-700 font-mono">UHID: {deleteTarget.uhid} | Token: {deleteTarget.tokenNumber}</div>
              </div>

              <p className="text-slate-600 leading-relaxed">
                Deleting a patient will purge their EHR record, vitals, intake questionnaire, and OPD tokens. This administrative action is permanently recorded in the system audit trail.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Reason for Deletion (Audit Mandatory) *
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="e.g. Duplicate registration / patient test data / legal request"
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeleting}
                  className="px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Permanently Delete</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: VIEW COMPREHENSIVE EHR RECORD                                    */}
      {/* ========================================================================= */}
      {viewingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-3xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-800 text-white flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5 text-purple-200" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{viewingPatient.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-purple-300 font-mono">
                    <span>UHID: {viewingPatient.uhid}</span>
                    <span>•</span>
                    <span>Token: {viewingPatient.tokenNumber}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingPatient(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-800">
              
              {/* Demographics */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Demographics</span>
                  <span className="font-bold text-slate-800">{viewingPatient.age} yrs • {viewingPatient.gender}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Mobile</span>
                  <span className="font-mono font-bold text-slate-800">{viewingPatient.mobile || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Department</span>
                  <span className="font-semibold text-slate-800">{viewingPatient.department}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Care Stream</span>
                  <span className="font-bold uppercase text-purple-700">{viewingPatient.careStream}</span>
                </div>
              </div>

              {/* Vitals */}
              {viewingPatient.vitals && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-purple-700" />
                    <span>Clinical Vitals at Triage</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-bold">Blood Pressure</span>
                      <span className="text-sm font-black text-slate-900 font-mono">
                        {viewingPatient.vitals.bpSystolic ? `${viewingPatient.vitals.bpSystolic}/${viewingPatient.vitals.bpDiastolic} mmHg` : 'Not recorded'}
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-bold">Pulse Rate</span>
                      <span className="text-sm font-black text-slate-900 font-mono">
                        {viewingPatient.vitals.heartRate ? `${viewingPatient.vitals.heartRate} bpm` : 'Not recorded'}
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-bold">Oxygen (SpO2)</span>
                      <span className="text-sm font-black text-slate-900 font-mono">
                        {viewingPatient.vitals.spO2 ? `${viewingPatient.vitals.spO2}%` : 'Not recorded'}
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-bold">Body Temperature</span>
                      <span className="text-sm font-black text-slate-900 font-mono">
                        {viewingPatient.vitals.temperature ? `${viewingPatient.vitals.temperature} °F` : 'Not recorded'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Reported Symptoms */}
              {viewingPatient.symptoms && viewingPatient.symptoms.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Chief Complaints &amp; Symptoms</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingPatient.symptoms.map((s, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <span className="font-bold text-slate-900">{s.name}</span>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Severity: {s.severity}/10 • Duration: {s.duration}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Doctor Notes & Prescriptions */}
              {viewingPatient.doctorNotes && (
                <div className="space-y-3 p-4 bg-purple-50/50 rounded-2xl border border-purple-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-purple-700" />
                      <span>Doctor Evaluation &amp; Verification</span>
                    </h4>
                    <span className="text-[10px] font-mono text-purple-700">
                      Verified by: {viewingPatient.doctorNotes.verifiedByDoctorName || 'Attending Physician'}
                    </span>
                  </div>

                  {viewingPatient.doctorNotes.customDoctorDiagnosis && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Diagnosis</span>
                      <p className="text-xs font-semibold text-slate-800">{viewingPatient.doctorNotes.customDoctorDiagnosis}</p>
                    </div>
                  )}

                  {viewingPatient.doctorNotes.doctorAdvice && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Doctor Advice</span>
                      <p className="text-xs text-slate-700">{viewingPatient.doctorNotes.doctorAdvice}</p>
                    </div>
                  )}

                  {viewingPatient.doctorNotes.doctorPrescription && viewingPatient.doctorNotes.doctorPrescription.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-purple-200">
                      <span className="text-[10px] font-bold text-purple-900 uppercase block">Prescribed Medicines</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {viewingPatient.doctorNotes.doctorPrescription.map((rx, i) => (
                          <div key={i} className="p-2 bg-white rounded-xl border border-purple-200 text-xs">
                            <span className="font-bold text-slate-900">{rx.medicineName}</span>
                            <div className="text-[10px] text-slate-500">
                              {rx.dosage} • {rx.timing} • {rx.days} days
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Current Medications */}
              {viewingPatient.currentMedications && viewingPatient.currentMedications.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Active Medications on Record</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {viewingPatient.currentMedications.map((med, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <span className="font-bold text-slate-900">{med.name}</span>
                        <div className="text-[10px] text-slate-500">{med.dose} • {med.frequency}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingPatient(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Record
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
