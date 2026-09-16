import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  PrescriptionRecord, 
  PrescriptionMedication, 
  UserRole,
  SupportedLanguage
} from '../../types';
import { generatePrescriptionNarration } from '../../utils/prescriptionNarration';
import { SUPPORTED_LANGUAGES } from '../../data/indianLanguages';
import { useLanguage } from '../../context/LanguageContext';
import { 
  X, 
  FileText, 
  CheckCircle2, 
  Stethoscope, 
  Building2, 
  Calendar, 
  User, 
  Clock, 
  Pill, 
  Printer, 
  Download, 
  ShieldCheck, 
  AlertTriangle, 
  Eye, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Sparkles, 
  History,
  FileCheck,
  PlusCircle,
  Volume2,
  Square,
  VolumeX,
  Radio
} from 'lucide-react';

interface PrescriptionDetailModalProps {
  prescription: PrescriptionRecord | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserRole?: UserRole;
  currentUserName?: string;
  onMarkDoctorReviewed?: (prescriptionId: string, doctorNotes: string) => Promise<void>;
  onImportToConsultation?: (medications: PrescriptionMedication[]) => void;
}

export const PrescriptionDetailModal: React.FC<PrescriptionDetailModalProps> = ({
  prescription,
  isOpen,
  onClose,
  currentUserRole = 'PATIENT',
  currentUserName = 'Ramesh Kumar',
  onMarkDoctorReviewed,
  onImportToConsultation
}) => {
  const [activeTab, setActiveTab] = useState<'structured' | 'original' | 'ocr_raw' | 'audit'>('structured');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [doctorNotes, setDoctorNotes] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewSuccess, setReviewSuccess] = useState<boolean>(false);

  if (!isOpen || !prescription) return null;

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 25, 250));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleDoctorReviewSubmit = async () => {
    if (!onMarkDoctorReviewed) return;
    setIsSubmittingReview(true);
    try {
      await onMarkDoctorReviewed(prescription.id, doctorNotes);
      setReviewSuccess(true);
      setTimeout(() => {
        setReviewSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Doctor review failed:', err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isDoctor = currentUserRole === 'DOCTOR' || currentUserRole === 'ADMIN' || currentUserRole === 'NURSE';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600/90 text-white flex items-center justify-center font-bold">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  Prescription Record
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-800 text-teal-300 border border-slate-700">
                  {prescription.id}
                </span>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  prescription.verificationStatus === 'DOCTOR_REVIEWED'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : prescription.verificationStatus === 'PATIENT_VERIFIED'
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {prescription.verificationStatus.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {prescription.hospitalName || 'Hospital OPD'} • Date: {prescription.prescriptionDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Print Prescription Slip"
            >
              <Printer className="w-4 h-4 text-teal-400" />
              <span className="hidden sm:inline">Print Slip</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('structured')}
              className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'structured'
                  ? 'border-teal-600 text-teal-700 dark:text-teal-400 bg-white dark:bg-slate-800'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Pill className="w-4 h-4" />
              <span>Structured Medicines ({prescription.medications?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('original')}
              className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'original'
                  ? 'border-teal-600 text-teal-700 dark:text-teal-400 bg-white dark:bg-slate-800'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Original Document</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ocr_raw')}
              className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'ocr_raw'
                  ? 'border-teal-600 text-teal-700 dark:text-teal-400 bg-white dark:bg-slate-800'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Raw OCR Transcription</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'audit'
                  ? 'border-teal-600 text-teal-700 dark:text-teal-400 bg-white dark:bg-slate-800'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Audit Logs ({prescription.auditLogs?.length || 0})</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>ABHA FHIR R4 Ready</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-slate-900">
          
          {/* TAB 1: STRUCTURED MEDICINES */}
          {activeTab === 'structured' && (
            <div className="space-y-6">
              
              {/* Doctor & Hospital Header Card */}
              <div className="p-4 sm:p-5 bg-teal-50/50 dark:bg-teal-950/20 rounded-2xl border border-teal-200/80 dark:border-teal-800/60 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> Prescribing Doctor
                  </span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {prescription.doctorName || 'Unclear in scan'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> Hospital / Health Facility
                  </span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {prescription.hospitalName || 'Unclear in scan'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> Prescription Date
                  </span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm font-mono">
                    {prescription.prescriptionDate || 'Not detected'}
                  </p>
                </div>
              </div>

              {/* Diagnosis & Recommended Tests (if present) */}
              {(prescription.diagnosis || (prescription.recommendedTests && prescription.recommendedTests.length > 0)) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {prescription.diagnosis && (
                    <div className="p-4 bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-1.5">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Clinical Diagnosis / Impression
                      </span>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">
                        {prescription.diagnosis}
                      </p>
                    </div>
                  )}

                  {prescription.recommendedTests && prescription.recommendedTests.length > 0 && (
                    <div className="p-4 bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-1.5">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Recommended Investigations / Lab Tests
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {prescription.recommendedTests.map((t, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold">
                            🔬 {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Medicines List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <Pill className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>Prescribed Medications & Dosages ({prescription.medications?.length || 0})</span>
                  </h3>
                  
                  {isDoctor && onImportToConsultation && (
                    <button
                      type="button"
                      onClick={() => onImportToConsultation(prescription.medications)}
                      className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Import into Active Consultation e-Rx</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {prescription.medications?.map((med, idx) => (
                    <div 
                      key={med.id || idx}
                      className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs hover:border-teal-300 dark:hover:border-teal-600 transition-all space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 font-bold text-xs flex items-center justify-center shrink-0 font-mono">
                            {idx + 1}
                          </span>
                          <div>
                            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                              {med.medicineName}
                            </h4>
                            <span className="text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800 font-mono">
                              Strength: {med.strength || 'Standard'}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs font-mono">
                            {med.dosage || '1 unit'} • {med.frequency || 'Daily'}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium font-mono">
                            ⏳ {med.duration || 'As directed'}
                          </span>
                          {med.patientVerified && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Patient Verified
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Instructions & Route details */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700 text-xs">
                        <div className="text-slate-600 dark:text-slate-400">
                          <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[10px]">ROUTE & TIMING</span>
                          <span className="font-mono text-[11px]">{med.route || 'Oral'} • {med.timing || 'As directed'}</span>
                        </div>
                        <div className="text-slate-600 dark:text-slate-400">
                          <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[10px]">MEAL INSTRUCTION</span>
                          <span className="font-medium text-teal-800 dark:text-teal-300">{med.foodInstruction || 'After food'}</span>
                        </div>
                        <div className="text-slate-600 dark:text-slate-400">
                          <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[10px]">SPECIAL INSTRUCTION</span>
                          <span className="italic">{med.specialInstruction || 'Take with water'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* General Advice & Follow-up */}
              {(prescription.generalAdvice || prescription.followUpDate) && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                  {prescription.generalAdvice && (
                    <p className="text-slate-700">
                      <strong>General Lifestyle Advice:</strong> {prescription.generalAdvice}
                    </p>
                  )}
                  {prescription.followUpDate && (
                    <p className="text-slate-700">
                      <strong>Follow-up Date:</strong> <span className="text-teal-700 font-bold">{prescription.followUpDate}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Doctor Review Action Box (For Doctors / Staff) */}
              {isDoctor && (
                <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-4 border border-slate-800 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-5 h-5 text-teal-400" />
                      <h4 className="font-extrabold text-sm text-white">
                        Physician Review & Clinical Sign-Off
                      </h4>
                    </div>
                    {prescription.verificationStatus === 'DOCTOR_REVIEWED' && (
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Signed off by {prescription.doctorReviewedBy || 'Doctor'}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300">
                    Verify this digitized prescription against the physical hospital copy. Adding your sign-off makes this record part of the authenticated ABDM patient EHR.
                  </p>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">
                      Doctor's Clinical Notes / Pharmacy Re-check:
                    </label>
                    <input
                      type="text"
                      value={doctorNotes}
                      onChange={(e) => setDoctorNotes(e.target.value)}
                      placeholder="e.g. Cross-checked with hospital pharmacy inventory. Dosage confirmed for ongoing maintenance."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-hidden focus:border-teal-500"
                    />
                  </div>

                  {reviewSuccess && (
                    <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Prescription marked as DOCTOR REVIEWED and signed into patient record!</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleDoctorReviewSubmit}
                      disabled={isSubmittingReview}
                      className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>{isSubmittingReview ? 'Signing...' : 'Sign & Mark as Doctor Reviewed'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ORIGINAL DOCUMENT VIEWER */}
          {activeTab === 'original' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-100 p-3 rounded-2xl border border-slate-200">
                <div className="text-xs text-slate-700">
                  <span>File: <strong>{prescription.fileName || 'prescription_document.jpg'}</strong></span>
                  <span className="mx-2">•</span>
                  <span>Zoom: {zoomLevel}%</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    className="p-1.5 bg-white hover:bg-slate-200 rounded-lg text-slate-700 border border-slate-300 cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    className="p-1.5 bg-white hover:bg-slate-200 rounded-lg text-slate-700 border border-slate-300 cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRotate}
                    className="p-1.5 bg-white hover:bg-slate-200 rounded-lg text-slate-700 border border-slate-300 cursor-pointer"
                    title="Rotate 90 deg"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-900 rounded-3xl border border-slate-800 flex items-center justify-center min-h-[450px] overflow-auto">
                {prescription.originalFileUrl ? (
                  <img
                    src={prescription.originalFileUrl}
                    alt="Original Prescription"
                    style={{
                      transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                      transition: 'transform 0.2s ease'
                    }}
                    className="max-h-[600px] object-contain rounded-xl shadow-lg"
                  />
                ) : (
                  <div className="text-center text-slate-400 space-y-2">
                    <FileText className="w-12 h-12 mx-auto text-slate-600" />
                    <p className="text-xs">Original image binary not loaded in memory</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: RAW OCR TRANSCRIPTION */}
          {activeTab === 'ocr_raw' && (
            <div className="space-y-4">
              <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-200 text-xs text-teal-900">
                <p className="font-semibold">
                  This is the unedited optical character recognition (OCR) transcript extracted from the prescription document before clinical structuring.
                </p>
              </div>

              <div className="p-5 bg-slate-950 text-emerald-400 font-mono text-xs rounded-2xl border border-slate-800 whitespace-pre-wrap leading-relaxed max-h-[450px] overflow-y-auto">
                {prescription.ocrText || 'No raw OCR text available.'}
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700">
                <p className="font-semibold">
                  Immutable DPDP-compliant audit trail recording every upload, OCR extraction, patient verification, and doctor review event.
                </p>
              </div>

              <div className="space-y-2.5">
                {prescription.auditLogs?.map((log) => (
                  <div 
                    key={log.id}
                    className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono font-bold text-[10px]">
                          {log.action}
                        </span>
                        <span className="font-bold text-slate-900">
                          {log.userName} ({log.userRole})
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{log.note}</p>
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono shrink-0">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>MediKiosk Health System • ISO 27001 & ABDM Validated</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
