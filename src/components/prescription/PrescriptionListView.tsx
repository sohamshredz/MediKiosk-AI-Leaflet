import React, { useState, useEffect } from 'react';
import { 
  PatientProfile, 
  PrescriptionRecord, 
  UserRole,
  PrescriptionMedication
} from '../../types';
import { 
  loadPrescriptionsFromStorage, 
  getPrescriptionsForPatient,
  markPrescriptionDoctorReviewed
} from '../../utils/prescriptionStorage';
import { PrescriptionDetailModal } from './PrescriptionDetailModal';
import { 
  Pill, 
  Camera, 
  Search, 
  Filter, 
  Calendar, 
  Stethoscope, 
  Building2, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Printer, 
  Eye, 
  Plus, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  FileCheck
} from 'lucide-react';

interface PrescriptionListViewProps {
  currentPatient: PatientProfile;
  onNavigateToScanner: () => void;
  currentUserRole?: UserRole;
  currentUserName?: string;
  onImportToDoctorConsultation?: (medications: PrescriptionMedication[]) => void;
}

export const PrescriptionListView: React.FC<PrescriptionListViewProps> = ({
  currentPatient,
  onNavigateToScanner,
  currentUserRole = 'PATIENT',
  currentUserName = 'Ramesh Kumar',
  onImportToDoctorConsultation
}) => {
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PATIENT_VERIFIED' | 'DOCTOR_REVIEWED' | 'NEEDS_REVIEW'>('ALL');
  
  // Selected prescription for modal detail inspection
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Load prescriptions for patient
  const loadData = () => {
    const list = getPrescriptionsForPatient(currentPatient.id);
    setPrescriptions(list);
  };

  useEffect(() => {
    loadData();
  }, [currentPatient.id]);

  const handleOpenDetails = (rx: PrescriptionRecord) => {
    setSelectedPrescription(rx);
    setIsDetailModalOpen(true);
  };

  const handleDoctorReview = async (prescriptionId: string, doctorNotes: string) => {
    const res = await markPrescriptionDoctorReviewed(
      prescriptionId,
      { id: 'doc-001', name: currentUserName || 'Dr. Vivek Malhotra' },
      doctorNotes
    );
    if (res.success && res.prescription) {
      loadData();
      setSelectedPrescription(res.prescription);
    }
  };

  // Filtered list
  const filteredPrescriptions = prescriptions.filter((rx) => {
    const matchesSearch = 
      (rx.doctorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rx.hospitalName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rx.diagnosis || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.medications.some(m => m.medicineName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = 
      statusFilter === 'ALL' || rx.verificationStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalMedicinesCount = prescriptions.reduce((acc, rx) => acc + (rx.medications?.length || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-700 text-white flex items-center justify-center font-bold shadow-xs">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                Prescription & Digitized Rx Records
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-bold font-mono">
                {prescriptions.length} Records
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              OCR-scanned handwritten prescriptions, patient-verified dosages & doctor signed records
            </p>
          </div>
        </div>

        {/* Scan Prescription Action Button */}
        <button
          type="button"
          id="scan-new-prescription-btn"
          onClick={onNavigateToScanner}
          className="px-5 py-3 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        >
          <Camera className="w-4 h-4" />
          <span>Scan New Prescription</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Prescriptions</span>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 font-mono">{prescriptions.length}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Digitized Medicines</span>
            <p className="text-xl font-extrabold text-teal-700 dark:text-teal-400 mt-0.5 font-mono">{totalMedicinesCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 flex items-center justify-center">
            <Pill className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Doctor Verified</span>
            <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5 font-mono">
              {prescriptions.filter(p => p.verificationStatus === 'DOCTOR_REVIEWED').length}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search doctor, hospital, medicine..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-teal-500 font-medium"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {(['ALL', 'PATIENT_VERIFIED', 'DOCTOR_REVIEWED'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                statusFilter === st
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {st === 'ALL' ? 'All Prescriptions' : st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Prescriptions List */}
      {filteredPrescriptions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-10 text-center space-y-4 shadow-xs transition-colors">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 flex items-center justify-center mx-auto">
            <Pill className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">No Prescriptions Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {searchQuery ? 'No prescriptions match your search query.' : 'You have not scanned any prescriptions yet. Tap the button below to digitize your paper records.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateToScanner}
            className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition-all shadow-xs cursor-pointer inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <Camera className="w-4 h-4" />
            <span>Scan First Prescription</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPrescriptions.map((rx) => (
            <div
              key={rx.id}
              className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-teal-300 dark:hover:border-teal-700 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 flex items-center justify-center font-bold shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                        {rx.hospitalName || 'Hospital OPD Clinic'}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        rx.verificationStatus === 'DOCTOR_REVIEWED'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : rx.verificationStatus === 'PATIENT_VERIFIED'
                          ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      }`}>
                        {rx.verificationStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Doctor: <strong>{rx.doctorName || 'Consultant'}</strong> • Date: <span className="font-mono">{rx.prescriptionDate}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenDetails(rx)}
                    className="px-3.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-teal-800 dark:text-teal-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-teal-200 dark:border-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  >
                    <Eye className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                    <span>View & Compare</span>
                  </button>
                </div>
              </div>

              {/* Diagnosis if available */}
              {rx.diagnosis && (
                <div className="text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Diagnosis: </span>
                  <span className="font-medium">{rx.diagnosis}</span>
                </div>
              )}

              {/* Medicines Pills Ribbon */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Prescribed Medicines ({rx.medications.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {rx.medications.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                      <span className="font-extrabold text-slate-900 dark:text-white">{m.medicineName}</span>
                      <span className="text-slate-500 dark:text-slate-400 font-medium font-mono text-[11px]">({m.strength})</span>
                      <span className="px-1.5 py-0.5 bg-slate-200/80 dark:bg-slate-700 rounded text-[10px] text-slate-700 dark:text-slate-300 font-bold font-mono">
                        {m.frequency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer Meta */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                <span>Prescription ID: {rx.id}</span>
                <span>Verified: {rx.patientVerifiedAt ? new Date(rx.patientVerifiedAt).toLocaleDateString() : 'Yes'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prescription Detail Modal */}
      <PrescriptionDetailModal
        prescription={selectedPrescription}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        currentUserRole={currentUserRole}
        currentUserName={currentUserName}
        onMarkDoctorReviewed={handleDoctorReview}
        onImportToConsultation={onImportToDoctorConsultation}
      />

    </div>
  );
};
