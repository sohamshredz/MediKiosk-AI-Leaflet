import React, { useState } from 'react';
import { 
  FileText, 
  Pill, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2, 
  Minimize2, 
  ShieldCheck, 
  Check, 
  X, 
  Sparkles, 
  Clock, 
  Building2, 
  User, 
  FlaskConical, 
  Activity, 
  Eye, 
  EyeOff, 
  Edit3, 
  Save, 
  Printer, 
  Download, 
  ChevronRight, 
  Info, 
  Layers,
  ArrowRight,
  TrendingUp,
  Sliders
} from 'lucide-react';
import { ScannedDocument } from '../../types';

interface PatientDocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: ScannedDocument[];
  initialDocumentId?: string;
  onUpdateDocument?: (updatedDoc: ScannedDocument) => void;
  patientName?: string;
  patientUhid?: string;
}

export const PatientDocumentViewerModal: React.FC<PatientDocumentViewerModalProps> = ({
  isOpen,
  onClose,
  documents,
  initialDocumentId,
  onUpdateDocument,
  patientName = 'Patient',
  patientUhid = 'UHID-2026-001'
}) => {
  if (!isOpen || documents.length === 0) return null;

  // Selected document state
  const [selectedDocId, setSelectedDocId] = useState<string>(
    initialDocumentId || documents[0]?.id || ''
  );
  
  const currentDoc = documents.find(d => d.id === selectedDocId) || documents[0];

  // Viewer image zoom & rotation state
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);

  // Active category filter tab in the OCR Key Findings Summary Panel
  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | 'medications' | 'labs' | 'diagnoses' | 'raw'>(
    'all'
  );

  // Staff verification state
  const [isStaffVerified, setIsStaffVerified] = useState<boolean>(currentDoc.staffVerified ?? true);
  const [staffVerifierName, setStaffVerifierName] = useState<string>(
    currentDoc.staffVerifiedBy || 'Sister Anita Sharma, RN (OPD Station 2)'
  );
  const [staffNote, setStaffNote] = useState<string>(
    currentDoc.staffNotes || 'Extracted parameters verified against physical document.'
  );
  const [isEditingStaffNote, setIsEditingStaffNote] = useState<boolean>(false);
  const [verifiedItemIds, setVerifiedItemIds] = useState<Record<string, boolean>>({
    'med-0': true,
    'med-1': true,
    'med-2': true,
    'lab-0': true,
    'lab-1': true,
    'lab-2': true,
    'lab-3': true,
    'lab-4': true,
  });

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const toggleItemVerified = (itemId: string) => {
    setVerifiedItemIds(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleSaveStaffVerification = () => {
    setIsEditingStaffNote(false);
    if (onUpdateDocument) {
      onUpdateDocument({
        ...currentDoc,
        staffVerified: isStaffVerified,
        staffVerifiedBy: staffVerifierName,
        staffVerifiedAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
        staffNotes: staffNote
      });
    }
  };

  const handleToggleStaffVerified = () => {
    const nextState = !isStaffVerified;
    setIsStaffVerified(nextState);
    if (onUpdateDocument) {
      onUpdateDocument({
        ...currentDoc,
        staffVerified: nextState,
        staffVerifiedBy: staffVerifierName,
        staffVerifiedAt: nextState ? new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : undefined,
        staffNotes: staffNote
      });
    }
  };

  // Extract structured findings for rendering
  const extracted = currentDoc.extractedData;
  const keyFindings = extracted?.keyFindingsSummary;
  const medicationAdjustments = keyFindings?.medicationAdjustments || [];
  const medicationsList = extracted?.medications || [];
  const abnormalLabValues = keyFindings?.abnormalLabValues || [];
  const labResultsList = extracted?.labResults || [];
  const diagnoses = extracted?.diagnoses || [];
  const keyObservations = extracted?.keyObservations || [];
  const drugInteractions = keyFindings?.drugInteractionsFlagged || [];

  // Count highlights
  const abnormalLabsCount = abnormalLabValues.length > 0 
    ? abnormalLabValues.length 
    : labResultsList.filter(l => l.status !== 'normal').length;
  
  const medAdjustmentsCount = medicationAdjustments.length > 0 
    ? medicationAdjustments.length 
    : medicationsList.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-7xl h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* TOP MODAL HEADER: Title, Document Switcher, ABDM & Staff Status */}
        <div className="px-5 py-4 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 border-b border-slate-800">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600/90 text-white flex items-center justify-center font-black shrink-0 shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Document Viewer & OCR Findings Summary
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-950 text-teal-300 border border-teal-800">
                  {currentDoc.fileType === 'prescription' ? 'OPD Prescription' : 
                   currentDoc.fileType === 'lab_report' ? 'Pathology Lab Report' : 
                   currentDoc.fileType === 'ayush_slip' ? 'AYUSH Treatment Slip' : 'Clinical Document'}
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  {patientName} • {patientUhid}
                </span>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                <span>{currentDoc.providerName || 'Healthcare Facility'}</span>
                <span>•</span>
                <span>Date: {currentDoc.dateOfRecord || currentDoc.documentDate}</span>
                {currentDoc.doctorName && (
                  <>
                    <span>•</span>
                    <span className="text-teal-400 font-semibold">{currentDoc.doctorName}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* OCR Confidence Badge */}
            <div className="px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center gap-2 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <div className="text-[11px] leading-tight">
                <span className="text-slate-400 block text-[9px]">OCR ENGINE</span>
                <span className="font-bold text-teal-300 font-mono">
                  {extracted?.ocrEngine || 'Gemini 3.5 Multimodal OCR'} ({Math.round((extracted?.confidenceScore || 0.96) * 100)}%)
                </span>
              </div>
            </div>

            {/* Staff Verification Button */}
            <button
              type="button"
              id="toggle-staff-verify-btn"
              onClick={handleToggleStaffVerified}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                isStaffVerified
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
              title="Click to toggle staff verification status"
            >
              {isStaffVerified ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verified by Staff</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" />
                  <span>Pending Staff Verification</span>
                </>
              )}
            </button>

            {/* Close Modal Button */}
            <button
              type="button"
              id="close-document-viewer-modal-btn"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close Viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* DOCUMENT SWITCHER STRIP (If Multiple Documents Exist) */}
        {documents.length > 1 && (
          <div className="px-5 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0 text-xs">
            <span className="text-slate-500 font-semibold text-[11px] shrink-0">Available Documents:</span>
            {documents.map((doc) => {
              const isSelected = doc.id === currentDoc.id;
              const hasMedAdjustments = (doc.extractedData?.keyFindingsSummary?.medicationAdjustments?.length || 0) > 0;
              const hasAbnormalLabs = (doc.extractedData?.keyFindingsSummary?.abnormalLabValues?.length || 0) > 0;

              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => {
                    setSelectedDocId(doc.id);
                    setIsStaffVerified(doc.staffVerified ?? true);
                    setStaffVerifierName(doc.staffVerifiedBy || 'Sister Anita Sharma, RN (OPD Station 2)');
                    setStaffNote(doc.staffNotes || 'Extracted parameters verified against physical document.');
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                  }`}
                >
                  <FileText className={`w-3.5 h-3.5 ${isSelected ? 'text-teal-400' : 'text-slate-500'}`} />
                  <span>{doc.documentTitle || doc.fileName.replace(/_/g, ' ').slice(0, 26)}</span>
                  
                  {hasMedAdjustments && (
                    <span className="px-1.5 py-0.2 rounded-full bg-teal-500/20 text-teal-800 text-[10px] font-mono">
                      Rx
                    </span>
                  )}
                  {hasAbnormalLabs && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-800 text-[10px] font-mono">
                      Lab!
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* MAIN BODY: 2-COLUMN SYNCHRONIZED WORKSPACE */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-slate-50">
          
          {/* LEFT COLUMN (5 cols): Interactive Document Scan Viewer */}
          <div className="lg:col-span-5 border-r border-slate-200 bg-slate-900 flex flex-col relative overflow-hidden">
            
            {/* Viewer Toolbar */}
            <div className="px-4 py-2 bg-slate-950 text-slate-300 flex items-center justify-between border-b border-slate-800 text-xs shrink-0">
              <span className="font-mono text-[11px] text-teal-400 font-bold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Physical Document Scan</span>
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors ${
                    showBoundingBoxes 
                      ? 'bg-teal-600 text-white' 
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                  title="Toggle OCR Detection Bounding Boxes"
                >
                  {showBoundingBoxes ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  <span>OCR Boxes</span>
                </button>

                <div className="w-px h-4 bg-slate-800 mx-1" />

                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleRotate}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Rotate 90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-mono transition-colors cursor-pointer"
                  title="Reset Zoom"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>
              </div>
            </div>

            {/* Document Image Stage */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center relative select-none">
              <div 
                className="relative transition-transform duration-150 ease-out shadow-2xl rounded-lg overflow-hidden max-h-full"
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center'
                }}
              >
                <img
                  src={currentDoc.imageUrl}
                  alt={currentDoc.fileName}
                  className="max-w-full max-h-[70vh] object-contain rounded-md block bg-white"
                  referrerPolicy="no-referrer"
                />

                {/* Simulated OCR Detection Overlays (Bounding Boxes for Medical Entities) */}
                {showBoundingBoxes && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Header Provider Overlay */}
                    <div 
                      className={`absolute top-[6%] left-[10%] w-[80%] h-[12%] border-2 rounded transition-all pointer-events-auto cursor-pointer ${
                        activeHighlightId === 'header' 
                          ? 'border-teal-400 bg-teal-400/20' 
                          : 'border-teal-400/60 bg-teal-400/5 hover:bg-teal-400/15'
                      }`}
                      onClick={() => {
                        setActiveHighlightId('header');
                        setActiveCategoryTab('all');
                      }}
                      title="Detected: Facility Header & Physician"
                    >
                      <span className="absolute -top-4 left-1 bg-teal-700 text-white text-[9px] font-mono font-bold px-1.5 rounded">
                        PROV: {currentDoc.providerName?.slice(0, 20)}
                      </span>
                    </div>

                    {/* Medications / Lab Results Bounding Box 1 */}
                    <div 
                      className={`absolute top-[26%] left-[12%] w-[76%] h-[24%] border-2 rounded transition-all pointer-events-auto cursor-pointer ${
                        activeHighlightId === 'finding-1' 
                          ? 'border-indigo-400 bg-indigo-400/20' 
                          : 'border-indigo-400/60 bg-indigo-400/5 hover:bg-indigo-400/15'
                      }`}
                      onClick={() => {
                        setActiveHighlightId('finding-1');
                        setActiveCategoryTab(currentDoc.fileType === 'lab_report' ? 'labs' : 'medications');
                      }}
                      title="Detected: Prescriptions & Medication Adjustments"
                    >
                      <span className="absolute -top-4 left-1 bg-indigo-700 text-white text-[9px] font-mono font-bold px-1.5 rounded">
                        {currentDoc.fileType === 'lab_report' ? 'LAB BIOMARKERS' : 'MEDICATION REGIMEN'}
                      </span>
                    </div>

                    {/* Pathology / Diagnoses Bounding Box 2 */}
                    <div 
                      className={`absolute top-[55%] left-[12%] w-[76%] h-[22%] border-2 rounded transition-all pointer-events-auto cursor-pointer ${
                        activeHighlightId === 'finding-2' 
                          ? 'border-amber-400 bg-amber-400/20' 
                          : 'border-amber-400/60 bg-amber-400/5 hover:bg-amber-400/15'
                      }`}
                      onClick={() => {
                        setActiveHighlightId('finding-2');
                        setActiveCategoryTab(currentDoc.fileType === 'lab_report' ? 'labs' : 'diagnoses');
                      }}
                      title="Detected: Clinical Observations & Diagnoses"
                    >
                      <span className="absolute -top-4 left-1 bg-amber-700 text-white text-[9px] font-mono font-bold px-1.5 rounded">
                        {currentDoc.fileType === 'lab_report' ? 'ABNORMAL METABOLIC VALUES' : 'CLINICAL INSTRUCTIONS'}
                      </span>
                    </div>

                    {/* Signature Bounding Box */}
                    <div 
                      className="absolute bottom-[6%] right-[10%] w-[35%] h-[12%] border-2 border-emerald-400/60 bg-emerald-400/5 rounded pointer-events-auto cursor-pointer"
                      title="Detected: Authorized Physician Signature & Stamp"
                    >
                      <span className="absolute -top-4 right-1 bg-emerald-700 text-white text-[9px] font-mono font-bold px-1.5 rounded">
                        AUTH SIGNATURE
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Scan Verification Summary Pill */}
            <div className="px-4 py-2.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
              <span className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Original scan preserved under ABDM DPDP Guidelines</span>
              </span>
              <span className="font-mono text-[10px] text-slate-500">
                Resolution: 300 DPI
              </span>
            </div>

          </div>

          {/* RIGHT COLUMN (7 cols): The OCR Key Findings Summary Panel */}
          <div className="lg:col-span-7 flex flex-col h-full overflow-hidden bg-white">
            
            {/* Category Filter Tabs Bar */}
            <div className="px-5 pt-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-2 shrink-0">
              <div className="flex items-center gap-1 overflow-x-auto text-xs font-bold pb-2">
                <button
                  type="button"
                  id="ocr-tab-all"
                  onClick={() => setActiveCategoryTab('all')}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeCategoryTab === 'all'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>All Findings</span>
                </button>

                <button
                  type="button"
                  id="ocr-tab-medications"
                  onClick={() => setActiveCategoryTab('medications')}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeCategoryTab === 'medications'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  <Pill className="w-3.5 h-3.5" />
                  <span>Medication Adjustments</span>
                  {medAdjustmentsCount > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      activeCategoryTab === 'medications' ? 'bg-teal-800 text-teal-100' : 'bg-teal-100 text-teal-800'
                    }`}>
                      {medAdjustmentsCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  id="ocr-tab-labs"
                  onClick={() => setActiveCategoryTab('labs')}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeCategoryTab === 'labs'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>Abnormal Lab Values</span>
                  {abnormalLabsCount > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      activeCategoryTab === 'labs' ? 'bg-rose-700 text-rose-100' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {abnormalLabsCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  id="ocr-tab-diagnoses"
                  onClick={() => setActiveCategoryTab('diagnoses')}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeCategoryTab === 'diagnoses'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Diagnoses & Notes</span>
                </button>

                <button
                  type="button"
                  id="ocr-tab-raw"
                  onClick={() => setActiveCategoryTab('raw')}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeCategoryTab === 'raw'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>ABDM JSON</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 font-medium pb-2 hidden sm:block">
                Verification Assistant for Clinical Staff
              </div>
            </div>

            {/* Scrollable Summary Panel Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* SECTION: Executive Clinical Impression & Drug Safety Alerts */}
              {(activeCategoryTab === 'all' || activeCategoryTab === 'diagnoses') && (
                <div className="space-y-3">
                  {/* Allergy / Interaction Warning if present */}
                  {drugInteractions.length > 0 && (
                    <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 text-xs space-y-2">
                      <div className="flex items-center gap-2 text-rose-900 font-bold">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>OCR Drug Safety & Contraindication Intercept</span>
                      </div>
                      <div className="space-y-1 text-rose-800 font-medium pl-6">
                        {drugInteractions.map((alert, idx) => (
                          <p key={idx}>{alert}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clinical Impression Card */}
                  {keyFindings?.clinicalImpression && (
                    <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-4 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-teal-950 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                          <span>Synthesized Clinical Impression</span>
                        </span>
                        <span className="text-[10px] font-mono text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded">
                          AI Assisted
                        </span>
                      </div>
                      <p className="text-teal-900 leading-relaxed font-medium">
                        {keyFindings.clinicalImpression}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: 1. MEDICATION ADJUSTMENTS & REGIMENS */}
              {(activeCategoryTab === 'all' || activeCategoryTab === 'medications') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                        <Pill className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">
                          Medication Adjustments & Regimens
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Extracted prescription changes with dosage schedules and clinical rationale
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {medicationAdjustments.length > 0 ? `${medicationAdjustments.length} Adjustments` : `${medicationsList.length} Active Items`}
                    </span>
                  </div>

                  {/* Highlighted Medication Adjustment Cards */}
                  {medicationAdjustments.length > 0 ? (
                    <div className="space-y-3">
                      {medicationAdjustments.map((adj, idx) => {
                        const itemId = `med-adj-${idx}`;
                        const isVerified = verifiedItemIds[itemId] ?? true;

                        return (
                          <div 
                            key={idx}
                            className={`p-4 rounded-2xl border transition-all text-xs space-y-2.5 ${
                              adj.impact === 'critical'
                                ? 'bg-amber-50/60 border-amber-300'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-black text-slate-900 text-sm">
                                    {adj.medicationName}
                                  </h4>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    adj.impact === 'critical'
                                      ? 'bg-amber-200 text-amber-900 border border-amber-400'
                                      : 'bg-teal-100 text-teal-800'
                                  }`}>
                                    {adj.impact === 'critical' ? '⚡ Regimen Adjusted' : 'Active Regimen'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600">
                                  <strong>Rationale: </strong>{adj.reason}
                                </p>
                              </div>

                              {/* Staff line-item verification check */}
                              <button
                                type="button"
                                onClick={() => toggleItemVerified(itemId)}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                                  isVerified
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                }`}
                                title="Click to verify this extracted medication"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{isVerified ? 'Verified' : 'Verify'}</span>
                              </button>
                            </div>

                            {/* Previous vs New Regimen Comparison */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-0.5">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                  Previous / Baseline Regimen
                                </span>
                                <span className="font-semibold text-slate-700 block">
                                  {adj.previousRegimen || 'None recorded'}
                                </span>
                              </div>

                              <div className="p-2.5 bg-teal-50/80 rounded-xl border border-teal-200 space-y-0.5">
                                <span className="text-[10px] uppercase font-bold text-teal-700 block flex items-center gap-1">
                                  <ArrowRight className="w-3 h-3 text-teal-600" />
                                  <span>Adjusted Prescription</span>
                                </span>
                                <span className="font-black text-teal-950 block">
                                  {adj.newRegimen}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : medicationsList.length > 0 ? (
                    <div className="space-y-2">
                      {medicationsList.map((m, idx) => {
                        const itemId = `med-raw-${idx}`;
                        const isVerified = verifiedItemIds[itemId] ?? true;

                        return (
                          <div 
                            key={idx}
                            className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <strong className="text-slate-900 font-bold">{m.name}</strong>
                                <span className="text-slate-600 font-mono">({m.dose})</span>
                                {m.adjustmentType && (
                                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-teal-100 text-teal-800">
                                    {m.adjustmentType.replace(/_/g, ' ')}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500">
                                Schedule: <strong className="text-teal-800">{m.frequency}</strong> • Duration: {m.duration || 'Ongoing'} {m.instructions ? `• Instructions: ${m.instructions}` : ''}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleItemVerified(itemId)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0 ${
                                isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              <Check className="w-3 h-3" />
                              <span>{isVerified ? 'Verified' : 'Verify'}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">
                      No medication records extracted from this specific document.
                    </p>
                  )}
                </div>
              )}

              {/* SECTION: 2. ABNORMAL LAB VALUES & BIOMARKERS */}
              {(activeCategoryTab === 'all' || activeCategoryTab === 'labs') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center">
                        <FlaskConical className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">
                          Abnormal Lab Values & Critical Biomarkers
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Extracted pathology values flagged against standard physiological reference intervals
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                      {abnormalLabsCount} Out-of-Range Flags
                    </span>
                  </div>

                  {/* Abnormal Lab Findings List */}
                  {abnormalLabValues.length > 0 ? (
                    <div className="space-y-3">
                      {abnormalLabValues.map((lab, idx) => {
                        const itemId = `lab-abn-${idx}`;
                        const isVerified = verifiedItemIds[itemId] ?? true;

                        return (
                          <div 
                            key={idx}
                            className={`p-4 rounded-2xl border text-xs space-y-2.5 transition-all ${
                              lab.severity === 'critical'
                                ? 'bg-rose-50/70 border-rose-300 shadow-xs'
                                : 'bg-amber-50/60 border-amber-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-black text-slate-900 text-sm">
                                    {lab.parameter}
                                  </h4>
                                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                    lab.severity === 'critical'
                                      ? 'bg-rose-600 text-white animate-pulse'
                                      : 'bg-amber-500 text-white'
                                  }`}>
                                    {lab.severity === 'critical' ? '🚨 CRITICAL HIGH' : '⚠️ HIGH / OUT-OF-RANGE'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-700 font-medium">
                                  <strong>Clinical Implication: </strong>{lab.clinicalImplication}
                                </p>
                              </div>

                              {/* Staff Verification Button */}
                              <button
                                type="button"
                                onClick={() => toggleItemVerified(itemId)}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                                  isVerified
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                }`}
                                title="Verify lab value accuracy"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{isVerified ? 'Verified' : 'Verify'}</span>
                              </button>
                            </div>

                            {/* Measured Value vs Safe Reference Range Visual */}
                            <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                    Measured Value (OCR)
                                  </span>
                                  <span className="text-base font-black text-rose-700 font-mono">
                                    {lab.value}
                                  </span>
                                </div>

                                <div className="w-px h-8 bg-slate-200 hidden sm:block" />

                                <div>
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                    Normal Reference Range
                                  </span>
                                  <span className="text-xs font-mono font-bold text-slate-700">
                                    {lab.reference}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 text-[11px] text-rose-800 font-semibold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 shrink-0">
                                <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
                                <span>Exceeds Target Threshold</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : labResultsList.length > 0 ? (
                    <div className="space-y-2">
                      {labResultsList.map((res, idx) => {
                        const isAbnormal = res.status !== 'normal';
                        const itemId = `lab-res-${idx}`;
                        const isVerified = verifiedItemIds[itemId] ?? true;

                        return (
                          <div 
                            key={idx}
                            className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isAbnormal 
                                ? res.status === 'critical' ? 'bg-rose-50 border-rose-300' : 'bg-amber-50 border-amber-200'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <strong className="text-slate-900 font-bold">{res.testName}</strong>
                                <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full uppercase ${
                                  res.status === 'critical' ? 'bg-rose-600 text-white' :
                                  res.status === 'high' ? 'bg-amber-500 text-white' :
                                  res.status === 'low' ? 'bg-blue-500 text-white' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {res.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600">
                                Value: <strong className="text-slate-900 font-mono">{res.value} {res.unit}</strong> • Ref Range: <span className="font-mono text-slate-500">{res.referenceRange}</span>
                              </p>
                              {res.clinicalImpact && (
                                <p className="text-[10px] text-slate-500 italic">{res.clinicalImpact}</p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleItemVerified(itemId)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0 ${
                                isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              <Check className="w-3 h-3" />
                              <span>{isVerified ? 'Verified' : 'Verify'}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">
                      No biochemistry lab panels detected in this document scan.
                    </p>
                  )}
                </div>
              )}

              {/* SECTION: 3. CLINICAL DIAGNOSES & PHYSICIAN OBSERVATIONS */}
              {(activeCategoryTab === 'all' || activeCategoryTab === 'diagnoses') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">
                          Clinical Diagnoses & Physician Observations
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Identified medical conditions and special instructions
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Diagnoses Pills */}
                  {diagnoses.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Extracted Diagnoses
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {diagnoses.map((d, idx) => (
                          <span 
                            key={idx}
                            className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 font-bold text-xs flex items-center gap-1.5 shadow-2xs"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{d}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key Observations */}
                  {keyObservations.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Key Physician Instructions & Observations
                      </span>
                      <div className="space-y-1.5">
                        {keyObservations.map((obs, idx) => (
                          <div 
                            key={idx}
                            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 flex items-start gap-2"
                          >
                            <ChevronRight className="w-3.5 h-3.5 text-teal-600 mt-0.5 shrink-0" />
                            <span>{obs}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: 4. RAW STRUCTURED JSON / ABDM FHIR */}
              {activeCategoryTab === 'raw' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Standardized ABDM FHIR Diagnostic Bundle
                    </span>
                    <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      FHIR-R4 Standard
                    </span>
                  </div>

                  <pre className="p-4 bg-slate-900 text-teal-300 font-mono text-xs rounded-2xl overflow-x-auto max-h-96 border border-slate-800 leading-relaxed select-all">
                    {JSON.stringify(
                      {
                        resourceType: "Bundle",
                        id: currentDoc.id,
                        meta: {
                          lastUpdated: new Date().toISOString(),
                          source: "MediKiosk-ABDM-OCR-Engine"
                        },
                        documentTitle: currentDoc.documentTitle || currentDoc.fileName,
                        patientReference: {
                          name: patientName,
                          uhid: patientUhid
                        },
                        extractedFindings: currentDoc.extractedData,
                        staffVerificationAudit: {
                          verified: isStaffVerified,
                          verifiedBy: staffVerifierName,
                          notes: staffNote
                        }
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}

              {/* SECTION: STAFF VERIFICATION AUDIT & NOTES DRAWER */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    <h4 className="font-bold text-slate-900 text-xs">
                      Clinical Staff Verification Audit Trail
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditingStaffNote(!isEditingStaffNote)}
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isEditingStaffNote ? 'Cancel Edit' : 'Edit Note / Verifier'}</span>
                  </button>
                </div>

                {isEditingStaffNote ? (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                        Verifier Name & Designation
                      </label>
                      <input
                        type="text"
                        value={staffVerifierName}
                        onChange={(e) => setStaffVerifierName(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-teal-600"
                        placeholder="e.g. Sister Anita Sharma, RN (OPD Station 2)"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                        Staff Verification Audit Note
                      </label>
                      <textarea
                        rows={2}
                        value={staffNote}
                        onChange={(e) => setStaffNote(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-teal-600"
                        placeholder="Add notes on physical verification of dosage or lab values..."
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveStaffVerification}
                      className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Verification Audit</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-xs space-y-1 text-slate-600">
                    <p>
                      <strong>Status: </strong>
                      <span className={`font-bold ${isStaffVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {isStaffVerified ? 'Verified & Approved' : 'Pending Verification'}
                      </span>
                      {isStaffVerified && ` • ${staffVerifierName}`}
                    </p>
                    {staffNote && (
                      <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded-lg border border-slate-200">
                        "{staffNote}"
                      </p>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* BOTTOM SUMMARY FOOTER ACTIONS */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Ready for Doctor Clinical Decision Support (CDS)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allKeys: Record<string, boolean> = {};
                    medicationAdjustments.forEach((_, i) => { allKeys[`med-adj-${i}`] = true; });
                    medicationsList.forEach((_, i) => { allKeys[`med-raw-${i}`] = true; });
                    abnormalLabValues.forEach((_, i) => { allKeys[`lab-abn-${i}`] = true; });
                    labResultsList.forEach((_, i) => { allKeys[`lab-res-${i}`] = true; });
                    setVerifiedItemIds(allKeys);
                    setIsStaffVerified(true);
                    if (onUpdateDocument) {
                      onUpdateDocument({
                        ...currentDoc,
                        staffVerified: true,
                        staffVerifiedBy: staffVerifierName,
                        staffVerifiedAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
                        staffNotes: staffNote
                      });
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Verify All OCR Findings</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
