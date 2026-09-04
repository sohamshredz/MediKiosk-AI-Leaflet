import React from 'react';
import { 
  FileText, 
  Pill, 
  Stethoscope, 
  Camera, 
  Calendar, 
  Clock, 
  ChevronRight,
  ExternalLink,
  Eye,
  FileCheck
} from 'lucide-react';
import { PatientProfile, ScannedDocument, TimelineEvent } from '../../types';

interface RecentRecordsSectionProps {
  patient: PatientProfile;
  onNavigateToSection: (section: 'history' | 'prescriptions' | 'reports' | 'appointments') => void;
  onViewDocument?: (doc: ScannedDocument) => void;
}

export const RecentRecordsSection: React.FC<RecentRecordsSectionProps> = ({
  patient,
  onNavigateToSection,
  onViewDocument
}) => {
  const documents = patient.scannedDocuments || [];
  const timelineEvents = patient.timeline || [];

  // Group recent records
  const recentPrescriptions = documents.filter(d => d.fileType === 'prescription' || d.documentType === 'Prescription').slice(0, 3);
  const recentLabReports = documents.filter(d => d.fileType === 'lab_report' || d.documentType === 'Lab Report' || d.fileType === 'imaging').slice(0, 3);
  const recentConsultations = timelineEvents.filter(t => t.category === 'diagnosis' || t.title.toLowerCase().includes('consult') || t.title.toLowerCase().includes('opd')).slice(0, 3);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5 transition-colors">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-teal-700 dark:text-teal-400" />
            <span>Recent Clinical Records & Digitized Documents</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Consultations, e-prescriptions, diagnostic labs and verified documents
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateToSection('reports')}
          className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 self-start sm:self-center cursor-pointer"
        >
          <span>View all records</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* 1. Recent Prescriptions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Prescriptions</span>
            </span>
            <button
              type="button"
              onClick={() => onNavigateToSection('prescriptions')}
              className="text-[11px] font-bold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
            >
              View all
            </button>
          </div>

          {recentPrescriptions.length > 0 ? (
            <div className="space-y-2">
              {recentPrescriptions.map((doc, idx) => (
                <div key={idx} className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                    <span className="truncate">{doc.documentTitle || doc.fileName}</span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">{doc.documentDate || doc.dateOfRecord}</span>
                  </div>
                  {doc.doctorName && (
                    <p className="text-[11px] text-slate-500">Dr. {doc.doctorName}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-2">
              No recent prescription slips digitized yet.
            </p>
          )}
        </div>

        {/* 2. Lab & Diagnostic Reports */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Lab Reports & Imaging</span>
            </span>
            <button
              type="button"
              onClick={() => onNavigateToSection('reports')}
              className="text-[11px] font-bold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
            >
              View all
            </button>
          </div>

          {recentLabReports.length > 0 ? (
            <div className="space-y-2">
              {recentLabReports.map((doc, idx) => (
                <div key={idx} className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                    <span className="truncate">{doc.documentTitle || doc.fileName}</span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">{doc.documentDate || doc.dateOfRecord}</span>
                  </div>
                  <p className="text-[11px] text-teal-700 dark:text-teal-400">{doc.providerName || doc.documentType}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-2">
              No lab tests or imaging scans uploaded.
            </p>
          )}
        </div>

        {/* 3. Recent Consultations */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Consultation History</span>
            </span>
            <button
              type="button"
              onClick={() => onNavigateToSection('history')}
              className="text-[11px] font-bold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
            >
              View all
            </button>
          </div>

          {recentConsultations.length > 0 ? (
            <div className="space-y-2">
              {recentConsultations.map((ev, idx) => (
                <div key={idx} className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                    <span className="truncate">{ev.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">{ev.date}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{ev.hospitalOrDoctor || ev.summary}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-2">
              No previous consultations recorded in timeline.
            </p>
          )}
        </div>

      </div>

    </div>
  );
};
