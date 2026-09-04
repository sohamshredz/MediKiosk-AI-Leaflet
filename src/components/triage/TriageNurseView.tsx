import React, { useState } from 'react';
import { PatientProfile, CareStream, TriageRiskLevel } from '../../types';
import { DashboardHeader } from '../dashboard/DashboardHeader';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  Activity, 
  ArrowRight, 
  ArrowLeft,
  Bell, 
  CheckCircle2, 
  User, 
  Heart, 
  Wind, 
  Building2, 
  PhoneCall, 
  Search, 
  Filter,
  Plus,
  LogOut,
  Sparkles,
  Users,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';

interface TriageNurseViewProps {
  patients: PatientProfile[];
  onSelectPatientForDoctor: (patientId: string) => void;
  onUpdatePatient: (updated: PatientProfile) => void;
  onAddNewPatient?: (newPatient: PatientProfile) => void;
  onBackToLanding?: () => void;
  onLogout?: () => void;
  staffName?: string;
  staffId?: string;
  staffRoleTitle?: string;
  staffDepartment?: string;
}

export const TriageNurseView: React.FC<TriageNurseViewProps> = ({
  patients,
  onSelectPatientForDoctor,
  onUpdatePatient,
  onAddNewPatient,
  onBackToLanding,
  onLogout,
  staffName = 'Sister Nirmala Joseph',
  staffId = 'NURSE-01',
  staffRoleTitle = 'Chief Triage & Vitals Officer',
  staffDepartment = 'OPD Reception & Triage Desk'
}) => {
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // New patient registration form state
  const [regName, setRegName] = useState('');
  const [regAge, setRegAge] = useState(35);
  const [regGender, setRegGender] = useState<'male' | 'female' | 'other'>('male');
  const [regMobile, setRegMobile] = useState('');
  const [regComplaint, setRegComplaint] = useState('');
  const [regCareStream, setRegCareStream] = useState<CareStream>('allopathy');
  const [regDepartment, setRegDepartment] = useState('General Medicine OPD');
  const [regBpSystolic, setRegBpSystolic] = useState(120);
  const [regBpDiastolic, setRegBpDiastolic] = useState(80);
  const [regHeartRate, setRegHeartRate] = useState(76);
  const [regSpO2, setRegSpO2] = useState(98);
  const [regRisk, setRegRisk] = useState<TriageRiskLevel>('STANDARD_OPD');

  // Sort: Critical Emergency first, then Urgent Priority, then Moderate/Standard
  const sortedPatients = [...patients].sort((a, b) => {
    const priorityWeight: Record<string, number> = {
      CRITICAL_EMERGENCY: 1,
      URGENT_PRIORITY: 2,
      STANDARD_OPD: 3,
      ROUTINE: 4
    };
    return (priorityWeight[a.triageRisk] || 4) - (priorityWeight[b.triageRisk] || 4);
  });

  const filtered = sortedPatients.filter(p => {
    const matchesFilter = filterLevel === 'all' || p.triageRisk === filterLevel;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const criticalCount = patients.filter(p => p.triageRisk === 'CRITICAL_EMERGENCY').length;
  const urgentCount = patients.filter(p => p.triageRisk === 'URGENT_PRIORITY').length;
  const standardCount = patients.filter(p => p.triageRisk === 'STANDARD_OPD' || p.triageRisk === 'ROUTINE').length;

  const handleFastTrackToER = (patient: PatientProfile) => {
    const updated: PatientProfile = {
      ...patient,
      department: 'Emergency & Trauma Care (ICU / CCU Fast-Track)',
      status: 'ready_for_doctor',
      redFlagsDetected: Array.from(new Set([...patient.redFlagsDetected, 'Fast-tracked directly to Emergency resuscitation bay by Triage Officer']))
    };
    onUpdatePatient(updated);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) return;

    const newPat: PatientProfile = {
      id: `pat-${Date.now()}`,
      tokenNumber: `OPD-${Math.floor(100 + Math.random() * 900)}`,
      uhid: `AIIMS-ND-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      name: regName.trim(),
      age: Number(regAge),
      gender: regGender,
      mobile: regMobile || '+91 98765 00000',
      language: 'hi',
      careStream: regCareStream,
      department: regDepartment,
      registeredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'ready_for_doctor',
      triageRisk: regRisk,
      consentGiven: true,
      consentType: 'touch',
      consentTimestamp: new Date().toISOString(),
      pastIllnesses: [],
      pastSurgeries: [],
      familyHistory: [],
      habits: { smoking: false, alcohol: false, tobacco: false, diet: 'Standard' },
      currentMedications: [],
      allergies: [],
      scannedDocuments: [],
      timeline: [
        {
          id: `tl-${Date.now()}`,
          date: 'Today',
          title: 'Walk-in Registration at Triage Desk',
          category: 'prescription',
          hospitalOrDoctor: 'Triage Desk',
          summary: `Registered by ${staffName} (${staffId})`
        }
      ],
      symptoms: [
        {
          id: `sym-${Date.now()}`,
          name: regComplaint || 'General OPD Consultation',
          bodyPart: 'General',
          severity: regRisk === 'CRITICAL_EMERGENCY' ? 9 : 5,
          duration: '1 day',
          onset: 'sudden'
        }
      ],
      vitals: {
        bpSystolic: Number(regBpSystolic),
        bpDiastolic: Number(regBpDiastolic),
        heartRate: Number(regHeartRate),
        spO2: Number(regSpO2),
        temperature: 98.4,
        bloodSugar: 110,
        recordedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      redFlagsDetected: regRisk === 'CRITICAL_EMERGENCY' ? ['High acuity registered at Triage Desk'] : [],
      doctorVerified: false
    };

    if (onAddNewPatient) {
      onAddNewPatient(newPat);
    } else {
      onUpdatePatient(newPat);
    }

    setIsRegisterModalOpen(false);
    setRegName('');
    setRegMobile('');
    setRegComplaint('');
  };

  const handleLogoutAction = () => {
    if (onLogout) {
      onLogout();
    } else if (onBackToLanding) {
      onBackToLanding();
    }
  };

  return (
    <div id="triage-nurse-dashboard" className="space-y-6 animate-in fade-in duration-150">
      
      {/* 1. STAFF DASHBOARD HEADER */}
      <DashboardHeader
        role="staff"
        staffName={staffName}
        staffId={staffId}
        staffRoleTitle={staffRoleTitle}
        department={staffDepartment}
        onLogout={handleLogoutAction}
        extraActions={
          <button
            type="button"
            onClick={() => setIsRegisterModalOpen(true)}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Register Patient</span>
          </button>
        }
      />

      {/* 2. SUMMARY STATS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 block">Total OPD Queue</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-slate-900">{patients.length}</span>
            <Users className="w-5 h-5 text-slate-600" />
          </div>
        </div>

        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl shadow-xs space-y-1">
          <span className="text-xs font-bold text-rose-800 block">Level 1: Critical Emergency</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-rose-700">{criticalCount}</span>
            <Bell className={`w-5 h-5 text-rose-600 ${criticalCount > 0 ? 'animate-bounce' : ''}`} />
          </div>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl shadow-xs space-y-1">
          <span className="text-xs font-bold text-amber-800 block">Level 2: Urgent Priority</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-amber-700">{urgentCount}</span>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-xs space-y-1">
          <span className="text-xs font-bold text-emerald-800 block">Standard / Routine OPD</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-emerald-700">{standardCount}</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* 3. FILTER & SEARCH CONTROLS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: `All Patients (${patients.length})` },
            { id: 'CRITICAL_EMERGENCY', label: `🚨 Critical (${criticalCount})` },
            { id: 'URGENT_PRIORITY', label: `⚠️ Urgent (${urgentCount})` },
            { id: 'STANDARD_OPD', label: `✅ Standard (${standardCount})` }
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterLevel(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                filterLevel === f.id
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Name, Token, Dept..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* 4. PATIENT QUEUE CARDS */}
      <div className="space-y-3.5">
        {filtered.map((p, idx) => {
          const isCritical = p.triageRisk === 'CRITICAL_EMERGENCY';
          const isUrgent = p.triageRisk === 'URGENT_PRIORITY';

          return (
            <div
              key={`${p.id}-${idx}`}
              className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                isCritical
                  ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-200'
                  : isUrgent
                  ? 'bg-amber-50/50 border-amber-300'
                  : 'bg-white border-slate-200 hover:border-amber-300'
              }`}
            >
              {/* Left Column: Demographics & Complaints */}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-xs px-2.5 py-1 bg-slate-900 text-white rounded-lg">
                    {p.tokenNumber}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">{p.name}</h3>
                  <span className="text-xs text-slate-500 font-medium">
                    ({p.age} yrs • {p.gender} • UHID: {p.uhid})
                  </span>
                  <span className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                    isCritical
                      ? 'bg-rose-600 text-white animate-pulse'
                      : isUrgent
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-teal-100 text-teal-800'
                  }`}>
                    {p.triageRisk.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Primary Complaint & Vitals Highlights */}
                <div className="text-xs text-slate-700 flex flex-wrap items-center gap-3">
                  <span className="font-semibold text-slate-900">
                    🩺 {p.symptoms[0]?.name || 'Routine Consultation'} ({p.symptoms[0]?.duration || 'recent'})
                  </span>
                  <span>• Dept: <strong>{p.department}</strong></span>
                  <span>• Stream: <strong>{p.careStream.toUpperCase()}</strong></span>
                </div>

                {/* Red Flags if Present */}
                {p.redFlagsDetected && p.redFlagsDetected.length > 0 && (
                  <div className="p-2 bg-rose-100/80 rounded-xl text-xs text-rose-900 font-semibold space-y-0.5">
                    {p.redFlagsDetected.map((rf, i) => (
                      <p key={i} className="flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>{rf}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Middle: Vitals Strip */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs shrink-0 bg-white p-2.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] block font-medium">BP</span>
                  <span className={`font-bold ${p.vitals.bpSystolic && p.vitals.bpSystolic >= 140 ? 'text-rose-600' : 'text-slate-800'}`}>
                    {p.vitals.bpSystolic ? `${p.vitals.bpSystolic}/${p.vitals.bpDiastolic}` : '120/80'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-medium">HR</span>
                  <span className={`font-bold ${p.vitals.heartRate && p.vitals.heartRate > 100 ? 'text-amber-600' : 'text-slate-800'}`}>
                    {p.vitals.heartRate || 72}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-medium">SpO2</span>
                  <span className={`font-bold ${p.vitals.spO2 && p.vitals.spO2 < 94 ? 'text-rose-600' : 'text-slate-800'}`}>
                    {p.vitals.spO2 || 98}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-medium">Sugar</span>
                  <span className="font-bold text-slate-800">{p.vitals.bloodSugar || 110}</span>
                </div>
              </div>

              {/* Right Column: Actions */}
              <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
                {isCritical && (
                  <button
                    type="button"
                    onClick={() => handleFastTrackToER(p)}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Fast-Track to ER</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onSelectPatientForDoctor(p.id)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Open Doctor Dossier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-10 bg-white rounded-3xl border border-slate-200 text-center space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-600 font-medium">No patients found matching the current search or filter.</p>
          </div>
        )}
      </div>

      {/* 5. WALK-IN PATIENT REGISTRATION MODAL */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-amber-600" />
                  <span>Register Walk-in Patient</span>
                </h3>
                <p className="text-xs text-slate-500">Triage Desk Direct Walk-in Intake</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Age</label>
                  <input
                    type="number"
                    value={regAge}
                    onChange={(e) => setRegAge(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Gender</label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Mobile</label>
                  <input
                    type="tel"
                    value={regMobile}
                    onChange={(e) => setRegMobile(e.target.value)}
                    placeholder="9876543210"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Chief Complaint / Symptoms</label>
                <textarea
                  rows={2}
                  value={regComplaint}
                  onChange={(e) => setRegComplaint(e.target.value)}
                  placeholder="e.g. Chest pain, difficulty breathing, high fever..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">OPD Department</label>
                  <select
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="General Medicine OPD">General Medicine OPD</option>
                    <option value="Emergency & Trauma Care">Emergency & Trauma Care</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Pulmonology">Pulmonology</option>
                    <option value="AYUSH & Integrative Medicine">AYUSH & Integrative Medicine</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Initial Triage Risk</label>
                  <select
                    value={regRisk}
                    onChange={(e) => setRegRisk(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="STANDARD_OPD">Level 3/4: Standard OPD</option>
                    <option value="MODERATE_RISK">Level 3: Moderate Risk</option>
                    <option value="URGENT_PRIORITY">Level 2: Urgent Priority</option>
                    <option value="CRITICAL_EMERGENCY">Level 1: Critical Emergency</option>
                  </select>
                </div>
              </div>

              {/* Vitals Input */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider block text-[10px]">Triage Desk Vitals</span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block">BP Sys</span>
                    <input
                      type="number"
                      value={regBpSystolic}
                      onChange={(e) => setRegBpSystolic(Number(e.target.value))}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-center font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">BP Dia</span>
                    <input
                      type="number"
                      value={regBpDiastolic}
                      onChange={(e) => setRegBpDiastolic(Number(e.target.value))}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-center font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Pulse</span>
                    <input
                      type="number"
                      value={regHeartRate}
                      onChange={(e) => setRegHeartRate(Number(e.target.value))}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-center font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">SpO2 %</span>
                    <input
                      type="number"
                      value={regSpO2}
                      onChange={(e) => setRegSpO2(Number(e.target.value))}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Register & Assign Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
