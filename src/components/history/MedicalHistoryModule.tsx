import React, { useState, useEffect, useRef } from 'react';
import { 
  PatientProfile, 
  MedicalConditionRecord, 
  MedicalHistoryDocument, 
  MedicalConditionCategory,
  PatientOneYearSummary 
} from '../../types';
import { 
  MEDICAL_HISTORY_CATEGORIES, 
  CATEGORY_ICONS_AND_COLORS,
  fetchPatientMedicalConditions,
  savePatientMedicalCondition,
  deletePatientMedicalCondition,
  fetchPatientMedicalDocuments,
  savePatientMedicalDocument,
  extractMedicalDocumentAi,
  getOrGenerateOneYearClinicalSummary,
  isDateWithinPast365Days
} from '../../services/medicalHistoryService';
import { 
  FileText, 
  Upload, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Sparkles, 
  Volume2, 
  VolumeX,
  Mic, 
  MicOff, 
  Trash2, 
  ExternalLink, 
  Eye, 
  ShieldCheck, 
  Activity, 
  Layers, 
  ArrowLeft,
  Search,
  Filter,
  RefreshCw,
  X,
  ChevronRight,
  FileCheck,
  Stethoscope,
  Heart,
  Pill
} from 'lucide-react';

interface MedicalHistoryModuleProps {
  patient: PatientProfile;
  onBack?: () => void;
  isDoctorView?: boolean;
}

export const MedicalHistoryModule: React.FC<MedicalHistoryModuleProps> = ({
  patient,
  onBack,
  isDoctorView = false
}) => {
  const patientId = patient.patientId || patient.id;

  // Active view tab: 'timeline' | 'add_condition' | 'upload_doc' | 'summary'
  const [activeTab, setActiveTab] = useState<'timeline' | 'add_condition' | 'upload_doc' | 'summary'>('timeline');
  const [timeFilter, setTimeFilter] = useState<'past_year' | 'all'>('past_year');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Data states
  const [conditions, setConditions] = useState<MedicalConditionRecord[]>([]);
  const [documents, setDocuments] = useState<MedicalHistoryDocument[]>([]);
  const [oneYearSummary, setOneYearSummary] = useState<PatientOneYearSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Form State for Add Condition
  const [selectedCategory, setSelectedCategory] = useState<MedicalConditionCategory>('Diabetes & endocrine');
  const [conditionName, setConditionName] = useState<string>('');
  const [onsetDate, setOnsetDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isStillPresent, setIsStillPresent] = useState<'Yes' | 'No' | 'Not sure'>('Yes');
  const [treatmentReceived, setTreatmentReceived] = useState<string>('');
  const [hospitalOrDoctor, setHospitalOrDoctor] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [isSavingCondition, setIsSavingCondition] = useState<boolean>(false);

  // Document Upload State
  const [uploadedFile, setUploadedFile] = useState<{
    file: File;
    name: string;
    type: string;
    dataUrl: string;
  } | null>(null);
  const [isExtractingDoc, setIsExtractingDoc] = useState<boolean>(false);
  const [extractedReviewData, setExtractedReviewData] = useState<MedicalHistoryDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Document Viewer Modal State
  const [previewDoc, setPreviewDoc] = useState<MedicalHistoryDocument | null>(null);

  // Voice Input State
  const [isListeningVoice, setIsListeningVoice] = useState<boolean>(false);
  const [voiceTargetField, setVoiceTargetField] = useState<'conditionName' | 'treatment' | 'notes' | null>(null);
  const [voiceStatusText, setVoiceStatusText] = useState<string>('');
  const recognitionRef = useRef<any>(null);

  // Speech synthesis for 1-Year summary
  const [isSpeakingSummary, setIsSpeakingSummary] = useState<boolean>(false);

  // Load patient data
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [fetchedConds, fetchedDocs] = await Promise.all([
        fetchPatientMedicalConditions(patientId),
        fetchPatientMedicalDocuments(patientId)
      ]);
      setConditions(fetchedConds);
      setDocuments(fetchedDocs);

      const summary = await getOrGenerateOneYearClinicalSummary(patient, fetchedConds, fetchedDocs);
      setOneYearSummary(summary);
    } catch (err) {
      console.warn('Error loading patient medical history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [patientId]);

  // Voice speech synthesis toggle (ONLY triggers on explicit user click)
  const handleToggleReadSummary = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (isSpeakingSummary) {
      window.speechSynthesis.cancel();
      setIsSpeakingSummary(false);
      return;
    }

    if (!oneYearSummary) return;

    window.speechSynthesis.cancel();
    const textToRead = `Clinical summary for ${oneYearSummary.patientName}. ${oneYearSummary.executiveSummary} Important conditions: ${oneYearSummary.keyConditions.map(c => c.condition).join(', ') || 'None recorded'}. Current medications: ${oneYearSummary.currentMedications.map(m => m.name).join(', ') || 'None recorded'}. Triage assessment: ${oneYearSummary.triageSafetySummary.riskLevel}. Clinician verification required.`;
    
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeakingSummary(false);
    utterance.onerror = () => setIsSpeakingSummary(false);

    setIsSpeakingSummary(true);
    window.speechSynthesis.speak(utterance);
  };

  // Voice Recognition for form fields (Starts ONLY on explicit button click)
  const handleStartVoiceInput = (targetField: 'conditionName' | 'treatment' | 'notes') => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in this browser. Please type into the field.');
      return;
    }

    if (isListeningVoice) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListeningVoice(false);
      setVoiceTargetField(null);
      setVoiceStatusText('');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = patient.language === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.interimResults = true;
      recognition.continuous = false;

      setIsListeningVoice(true);
      setVoiceTargetField(targetField);
      setVoiceStatusText('Listening... please speak clearly');

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');

        setVoiceStatusText(`Transcribed: "${transcript}"`);

        if (targetField === 'conditionName') setConditionName(transcript);
        else if (targetField === 'treatment') setTreatmentReceived(transcript);
        else if (targetField === 'notes') setAdditionalNotes(transcript);
      };

      recognition.onerror = (event: any) => {
        setVoiceStatusText('Could not hear clearly. Tap mic to try again.');
        setIsListeningVoice(false);
        setVoiceTargetField(null);
      };

      recognition.onend = () => {
        setIsListeningVoice(false);
        setVoiceTargetField(null);
        setTimeout(() => setVoiceStatusText(''), 3000);
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition error:', err);
      setIsListeningVoice(false);
      setVoiceTargetField(null);
    }
  };

  // Handle Save Condition
  const handleSaveConditionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conditionName.trim()) {
      alert('Please specify the condition or disease name.');
      return;
    }

    setIsSavingCondition(true);
    const newRecord: MedicalConditionRecord = {
      id: `cond-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      patientId,
      category: selectedCategory,
      conditionName: conditionName.trim(),
      onsetDate,
      isStillPresent,
      treatmentReceived: treatmentReceived.trim() || undefined,
      hospitalOrDoctor: hospitalOrDoctor.trim() || undefined,
      additionalNotes: additionalNotes.trim() || undefined,
      sourceType: 'patient_entered',
      isWithinPastYear: isDateWithinPast365Days(onsetDate),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await savePatientMedicalCondition(newRecord);
      // Refresh state
      const updated = [newRecord, ...conditions.filter(c => c.id !== newRecord.id)];
      setConditions(updated);
      const newSummary = await getOrGenerateOneYearClinicalSummary(patient, updated, documents);
      setOneYearSummary(newSummary);

      // Reset form
      setConditionName('');
      setTreatmentReceived('');
      setHospitalOrDoctor('');
      setAdditionalNotes('');
      setActiveTab('timeline');
    } catch (err) {
      alert('Failed to save condition. Please try again.');
    } finally {
      setIsSavingCondition(false);
    }
  };

  // Handle Document File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const dataUrl = evt.target?.result as string;
      setUploadedFile({
        file,
        name: file.name,
        type: file.type || 'application/octet-stream',
        dataUrl
      });

      // Automatically trigger OCR / AI Extraction
      setIsExtractingDoc(true);
      try {
        const extraction = await extractMedicalDocumentAi(dataUrl, file.name, file.type);
        
        const docRecord: MedicalHistoryDocument = {
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          patientId,
          fileName: file.name,
          fileType: file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'prescription',
          fileDataUrl: dataUrl,
          documentType: extraction.extractedData?.documentType || 'Prescription / Lab Record',
          documentDate: extraction.extractedData?.documentDate || new Date().toISOString().split('T')[0],
          extractedText: extraction.extractedText,
          extractionStatus: 'completed',
          extractedData: extraction.extractedData,
          confirmedByPatient: false,
          uploadedAt: new Date().toISOString()
        };

        setExtractedReviewData(docRecord);
      } catch (err) {
        console.warn('Extraction failure:', err);
      } finally {
        setIsExtractingDoc(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Confirm & Save Extracted Document
  const handleConfirmExtractedDocument = async () => {
    if (!extractedReviewData) return;

    const confirmedDoc: MedicalHistoryDocument = {
      ...extractedReviewData,
      confirmedByPatient: true,
      extractionStatus: 'patient_confirmed'
    };

    await savePatientMedicalDocument(confirmedDoc);

    const newConds: MedicalConditionRecord[] = [];

    // 1. Store extracted medications into patient's medical condition & prescription records
    if (confirmedDoc.extractedData?.medications && confirmedDoc.extractedData.medications.length > 0) {
      for (const med of confirmedDoc.extractedData.medications) {
        if (!med.name) continue;
        const treatmentDetails = [
          med.dose,
          med.frequency,
          med.duration
        ].filter(Boolean).join(' • ') || 'Prescription medication';

        const condRec: MedicalConditionRecord = {
          id: `cond-med-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          patientId,
          category: 'Prescription & Active Medications',
          conditionName: med.name,
          onsetDate: confirmedDoc.documentDate,
          isStillPresent: 'Yes',
          treatmentReceived: treatmentDetails,
          hospitalOrDoctor: confirmedDoc.extractedData.hospitalOrClinic || confirmedDoc.extractedData.doctorName || 'Prescribing Physician',
          sourceType: 'document_ocr',
          sourceDocumentId: confirmedDoc.id,
          sourceDocumentName: confirmedDoc.fileName,
          isWithinPastYear: isDateWithinPast365Days(confirmedDoc.documentDate),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await savePatientMedicalCondition(condRec);
        newConds.push(condRec);
      }
    }

    // 2. If valid diagnoses were extracted (excluding dummy/fallback text), store them
    const isDummyDiagnosis = (name?: string) => {
      if (!name) return true;
      const lower = name.toLowerCase();
      return lower.includes('clinical record documented') || lower.includes('documented in source file');
    };

    if (confirmedDoc.extractedData?.diagnoses && confirmedDoc.extractedData.diagnoses.length > 0) {
      for (const diag of confirmedDoc.extractedData.diagnoses) {
        if (isDummyDiagnosis(diag)) continue;
        const condRec: MedicalConditionRecord = {
          id: `cond-doc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          patientId,
          category: 'Other medical conditions',
          conditionName: diag,
          onsetDate: confirmedDoc.documentDate,
          isStillPresent: 'Yes',
          treatmentReceived: confirmedDoc.extractedData.medications?.map(m => m.name).join(', '),
          hospitalOrDoctor: confirmedDoc.extractedData.hospitalOrClinic || confirmedDoc.extractedData.doctorName,
          sourceType: 'document_ocr',
          sourceDocumentId: confirmedDoc.id,
          sourceDocumentName: confirmedDoc.fileName,
          isWithinPastYear: isDateWithinPast365Days(confirmedDoc.documentDate),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await savePatientMedicalCondition(condRec);
        newConds.push(condRec);
      }
    }

    const updatedDocs = [confirmedDoc, ...documents.filter(d => d.id !== confirmedDoc.id)];
    const updatedConds = [...newConds, ...conditions];
    setDocuments(updatedDocs);
    setConditions(updatedConds);

    const newSummary = await getOrGenerateOneYearClinicalSummary(patient, updatedConds, updatedDocs);
    setOneYearSummary(newSummary);

    setUploadedFile(null);
    setExtractedReviewData(null);
    setActiveTab('timeline');
  };

  const handleDeleteCondition = async (id: string) => {
    if (!confirm('Are you sure you want to remove this medical condition record?')) return;
    await deletePatientMedicalCondition(id, patientId);
    const updated = conditions.filter(c => c.id !== id);
    setConditions(updated);
    const newSummary = await getOrGenerateOneYearClinicalSummary(patient, updated, documents);
    setOneYearSummary(newSummary);
  };

  // Filtered conditions for display
  const filteredConditions = conditions.filter(c => {
    if (timeFilter === 'past_year' && !isDateWithinPast365Days(c.onsetDate || c.createdAt)) {
      return false;
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return (
        c.conditionName.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.hospitalOrDoctor && c.hospitalOrDoctor.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const pastYearCount = conditions.filter(c => isDateWithinPast365Days(c.onsetDate || c.createdAt)).length;
  const olderCount = conditions.filter(c => !isDateWithinPast365Days(c.onsetDate || c.createdAt)).length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Medical History & 1-Year Clinical Timeline
              </h1>
              <span className="px-3 py-1 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 text-xs font-semibold rounded-full border border-teal-200 dark:border-teal-800 font-mono">
                Patient ID: {patient.patientId || patient.id}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Comprehensive 1-year clinical records, prescription uploads, OCR data extraction, and physician summary for {patient.name} ({patient.age}y, {patient.gender}).
            </p>
          </div>
        </div>

        {/* Quick Action Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
              activeTab === 'timeline'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Timeline & Records <span className="font-mono">({conditions.length})</span></span>
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
              activeTab === 'summary'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>1-Year Clinical Summary</span>
          </button>
          <button
            onClick={() => setActiveTab('upload_doc')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
              activeTab === 'upload_doc'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Report / PDF</span>
          </button>
          <button
            onClick={() => setActiveTab('add_condition')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
              activeTab === 'add_condition'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-200 dark:border-teal-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Add Condition</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Filter Window:</span>
              <button
                onClick={() => setTimeFilter('past_year')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer font-mono ${
                  timeFilter === 'past_year'
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Past 1 Year (12 Months) • {pastYearCount}
              </button>
              <button
                onClick={() => setTimeFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer font-mono ${
                  timeFilter === 'all'
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All Time • {conditions.length} ({olderCount} older)
              </button>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                placeholder="Search condition or hospital..."
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white dark:focus:bg-slate-800"
              />
            </div>
          </div>

          {/* List of Conditions & Timeline */}
          {filteredConditions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-200 dark:border-slate-800 text-center space-y-4 transition-colors">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                {timeFilter === 'past_year' ? 'No records in the past 1 year' : 'No medical history records yet'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                Recording prior diagnoses, surgeries, medications, or uploading past prescription reports helps the physician make safer, faster clinical assessments.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('add_condition')}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Condition Manually / Voice
                </button>
                <button
                  onClick={() => setActiveTab('upload_doc')}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-xl flex items-center gap-2 transition cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Upload Prescription / PDF
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredConditions.map(item => {
                const categoryStyle = CATEGORY_ICONS_AND_COLORS[item.category] || {
                  bg: 'bg-slate-50 dark:bg-slate-800',
                  text: 'text-slate-700 dark:text-slate-300',
                  border: 'border-slate-200 dark:border-slate-700'
                };
                const isPastYear = isDateWithinPast365Days(item.onsetDate || item.createdAt);

                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition space-y-3 relative flex flex-col justify-between"
                  >
                    <div>
                      {/* Header Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}>
                          {item.category}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-md font-mono ${
                            isPastYear ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          }`}>
                            {isPastYear ? 'Past 1 Year' : 'Older History'}
                          </span>
                          <button
                            onClick={() => handleDeleteCondition(item.id)}
                            className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Condition Name */}
                      <h4 className="text-base font-bold text-slate-900 dark:text-white mt-2 flex items-center gap-2">
                        {item.category === 'Prescription & Active Medications' && (
                          <Pill className="w-4 h-4 text-teal-600 shrink-0" />
                        )}
                        <span>{item.conditionName}</span>
                      </h4>

                      {/* Details */}
                      <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mt-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Started: <strong className="font-mono text-slate-800 dark:text-slate-200">{item.onsetDate || 'Not specified'}</strong></span>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span>Active Now: <strong className="text-slate-800 dark:text-slate-200">{item.isStillPresent}</strong></span>
                        </div>

                        {item.treatmentReceived && (
                          <div className="flex items-start gap-2 pt-1">
                            <Stethoscope className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                            <span>Treatment: <span className="font-mono text-slate-800 dark:text-slate-200">{item.treatmentReceived}</span></span>
                          </div>
                        )}

                        {item.hospitalOrDoctor && (
                          <div className="text-slate-500 dark:text-slate-400">
                            Provider: {item.hospitalOrDoctor}
                          </div>
                        )}

                        {item.additionalNotes && (
                          <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 rounded-lg p-2 mt-2 italic">
                            "{item.additionalNotes}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Footer Meta */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
                      <span className="capitalize">Source: {item.sourceType.replace('_', ' ')}</span>
                      {item.sourceDocumentName && (
                        <span className="text-teal-700 dark:text-teal-400 font-semibold flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          {item.sourceDocumentName}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Uploaded Supporting Documents Section */}
          {documents.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-['Inter',Arial,sans-serif]">
                    Uploaded Source Documents & Reports ({documents.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Original files available for clinical inspection and OCR data verification.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('upload_doc')}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Another
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {documents.map(doc => (
                  <div
                    key={doc.id}
                    className="border border-slate-200 rounded-xl p-3.5 hover:border-teal-300 transition flex items-center justify-between gap-3 bg-slate-50/50"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <h5 className="text-xs font-bold text-slate-900 truncate">
                          {doc.fileName}
                        </h5>
                        <p className="text-[11px] text-slate-500">
                          {doc.documentType} • {doc.documentDate}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-teal-50 hover:text-teal-700 text-slate-700 text-xs font-semibold rounded-lg shrink-0 flex items-center gap-1 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* View: 1-Year Clinical Summary */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {oneYearSummary ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Summary Header */}
              <div className="bg-slate-900 text-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-teal-500/20 text-teal-300 text-xs font-semibold rounded-md border border-teal-500/30">
                      1-Year Clinical Summary
                    </span>
                    <span className="text-xs text-slate-400">
                      Window: {oneYearSummary.summaryPeriodStart} to {oneYearSummary.summaryPeriodEnd}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1 font-['Inter',Arial,sans-serif]">
                    {oneYearSummary.patientName} • {oneYearSummary.patientId}
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    UHID: {oneYearSummary.uhid} | Age: {oneYearSummary.age} | Gender: {oneYearSummary.gender} | Language: {oneYearSummary.preferredLanguage.toUpperCase()}
                  </p>
                </div>

                {/* Read Summary Voice Action Button */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleToggleReadSummary}
                    className={`px-4 py-2.5 text-xs font-semibold rounded-xl flex items-center gap-2 transition cursor-pointer ${
                      isSpeakingSummary
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-lg animate-pulse'
                        : 'bg-teal-600 hover:bg-teal-500 text-white'
                    }`}
                  >
                    {isSpeakingSummary ? (
                      <>
                        <VolumeX className="w-4 h-4" />
                        Stop Reading
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4" />
                        Read Summary (Voice)
                      </>
                    )}
                  </button>
                  <button
                    onClick={loadAllData}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
                    title="Refresh Summary"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Mandatory Medical Safety Disclaimer */}
              <div className="bg-amber-50 border-y border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="font-semibold">
                    {oneYearSummary.disclaimer}
                  </span>
                </div>
                <span className="text-[11px] text-amber-800">
                  Synthesized from {oneYearSummary.sourceRecordCount} indexed records
                </span>
              </div>

              {/* Executive Summary Narrative */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Executive Clinical Overview
                </h4>
                <p className="text-sm text-slate-800 leading-relaxed font-medium">
                  {oneYearSummary.executiveSummary}
                </p>
              </div>

              {/* Grid of Clinical Domains */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Key Conditions in Past 12 Months */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-teal-600" />
                    Key Conditions (Past 12 Months)
                  </h4>
                  {oneYearSummary.keyConditions.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No chronic or acute conditions recorded in past 1 year.</p>
                  ) : (
                    <div className="space-y-2">
                      {oneYearSummary.keyConditions.map((kc, i) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                          <div>
                            <strong className="text-slate-900">{kc.condition}</strong>
                            <div className="text-[11px] text-slate-500">{kc.category} • Since {kc.onsetDate}</div>
                          </div>
                          <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 font-semibold">
                            {kc.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Current Medications & Allergies */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-2">
                      <Stethoscope className="w-4 h-4 text-teal-600" />
                      Active Medications
                    </h4>
                    {oneYearSummary.currentMedications.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No active medications registered.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {oneYearSummary.currentMedications.map((m, i) => (
                          <span key={i} className="px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold rounded-lg">
                            {m.name} {m.dosage ? `(${m.dosage})` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      Known Allergies & Contraindications
                    </h4>
                    {oneYearSummary.allergies.length === 0 ? (
                      <span className="text-xs text-slate-500 italic">No known drug/food allergies recorded.</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {oneYearSummary.allergies.map((a, i) => (
                          <span key={i} className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold rounded-lg">
                            {a.substance} ({a.reaction || 'Hypersensitivity'})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Lab Highlights & Abnormal Findings */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-teal-600" />
                    Key Laboratory Results & Attention Items
                  </h4>
                  {oneYearSummary.abnormalAttentionItems.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1.5">
                      <span className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-red-700" />
                        Attention Findings Requiring Clinical Review:
                      </span>
                      <ul className="list-disc list-inside text-xs text-red-800 space-y-0.5">
                        {oneYearSummary.abnormalAttentionItems.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {oneYearSummary.labHighlights.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {oneYearSummary.labHighlights.map((lh, i) => (
                        <div key={i} className={`p-2.5 rounded-xl border text-xs ${lh.isAbnormal ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="font-bold text-slate-900">{lh.testName}</div>
                          <div className={`font-mono text-sm font-bold ${lh.isAbnormal ? 'text-amber-800' : 'text-slate-700'}`}>{lh.value}</div>
                          <div className="text-[10px] text-slate-500">{lh.date}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No lab findings recorded.</p>
                  )}
                </div>

                {/* 4. Triage & AYUSH Integration */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    Triage & Holistic Health Assessment
                  </h4>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Kiosk Triage Status:</span>
                      <span className="font-bold text-slate-900">{oneYearSummary.triageSafetySummary.riskLevel}</span>
                    </div>

                    {oneYearSummary.ayushSummary && (
                      <div className="pt-2 border-t border-slate-200">
                        <div className="font-bold text-emerald-800">AYUSH / Holistic Profile:</div>
                        <div className="text-slate-700 mt-0.5">
                          Prakriti: <strong>{oneYearSummary.ayushSummary.prakriti || 'Assessment recorded'}</strong> • Balance: {oneYearSummary.ayushSummary.doshaImbalance}
                        </div>
                      </div>
                    )}
                  </div>

                  {oneYearSummary.olderHistoryHighlights.length > 0 && (
                    <div className="pt-2">
                      <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Older History (&gt;12 Months Ago)
                      </h5>
                      <div className="text-xs text-slate-600 space-y-0.5">
                        {oneYearSummary.olderHistoryHighlights.map((oh, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            <span>{oh}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-500">
              Generating 1-Year Clinical Summary...
            </div>
          )}
        </div>
      )}

      {/* View: Add Condition Manually / Voice */}
      {activeTab === 'add_condition' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm max-w-3xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-['Inter',Arial,sans-serif]">
              Record Medical Condition / Past History
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Select category and enter diagnosis or treatment details using keyboard or voice microphone.
            </p>
          </div>

          <form onSubmit={handleSaveConditionSubmit} className="space-y-5">
            {/* Category Grid */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Medical Category (26 Standard Specialties)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-2 border border-slate-200 rounded-xl custom-scrollbar">
                {MEDICAL_HISTORY_CATEGORIES.map(cat => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`p-2.5 text-xs text-left rounded-lg border font-medium transition cursor-pointer ${
                        isSelected
                          ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Condition Name with Voice Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Condition / Disease Name <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleStartVoiceInput('conditionName')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                    isListeningVoice && voiceTargetField === 'conditionName'
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  {isListeningVoice && voiceTargetField === 'conditionName' ? 'Listening (Tap to stop)' : 'Speak Condition'}
                </button>
              </div>
              <input
                type="text"
                value={conditionName}
                onChange={e => setConditionName(e.target.value)}
                placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma, Dengue..."
                required
                className="w-full px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
              {voiceStatusText && voiceTargetField === 'conditionName' && (
                <p className="text-xs text-teal-700 font-medium animate-pulse">{voiceStatusText}</p>
              )}
            </div>

            {/* When did it start & is it still present */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  When did it start (Onset Date / Year)
                </label>
                <input
                  type="date"
                  value={onsetDate}
                  onChange={e => setOnsetDate(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Is it still present?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Yes', 'No', 'Not sure'] as const).map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setIsStillPresent(opt)}
                      className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                        isStillPresent === opt
                          ? 'bg-teal-700 text-white border-teal-700'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Treatment Received */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Treatment / Medication Received
                </label>
                <button
                  type="button"
                  onClick={() => handleStartVoiceInput('treatment')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                    isListeningVoice && voiceTargetField === 'treatment'
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  Speak Treatment
                </button>
              </div>
              <input
                type="text"
                value={treatmentReceived}
                onChange={e => setTreatmentReceived(e.target.value)}
                placeholder="e.g. Tab. Metformin 500mg, Daily inhaler, Physiotherapy..."
                className="w-full px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Hospital / Doctor */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Hospital / Treating Doctor (Optional)
              </label>
              <input
                type="text"
                value={hospitalOrDoctor}
                onChange={e => setHospitalOrDoctor(e.target.value)}
                placeholder="e.g. AIIMS Delhi, Dr. Sharma Clinic..."
                className="w-full px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Additional Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Additional Clinical Notes
              </label>
              <textarea
                rows={2}
                value={additionalNotes}
                onChange={e => setAdditionalNotes(e.target.value)}
                placeholder="Any special remarks, side effects, or recovery details..."
                className="w-full px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('timeline')}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingCondition}
                className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSavingCondition ? 'Saving Record...' : 'Confirm & Save Condition'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View: Upload Prescription / PDF with OCR Confirmation */}
      {activeTab === 'upload_doc' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm max-w-3xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-['Inter',Arial,sans-serif]">
              Upload Past Medical Record / Prescription / PDF
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Upload doctor prescriptions, discharge summaries, laboratory reports, or diagnostic scans. AI OCR extracts key diagnoses and medications for your review.
            </p>
          </div>

          {!uploadedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/40 rounded-2xl p-10 text-center space-y-4 cursor-pointer transition"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Click to select or drag and drop files here
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Supports PDF documents, JPG, PNG, WEBP camera photos (Prescriptions, Lab tests, Discharge papers)
                </p>
              </div>
              <button
                type="button"
                className="px-4 py-2 bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs"
              >
                Browse Document
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Document Info Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{uploadedFile.name}</h4>
                    <p className="text-xs text-slate-500">
                      {(uploadedFile.file.size / 1024).toFixed(1)} KB • {uploadedFile.type}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setUploadedFile(null);
                    setExtractedReviewData(null);
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 transition"
                  title="Remove file"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Extraction in progress */}
              {isExtractingDoc && (
                <div className="p-8 text-center space-y-3 bg-teal-50/50 rounded-xl border border-teal-200">
                  <RefreshCw className="w-8 h-8 text-teal-700 animate-spin mx-auto" />
                  <h4 className="text-sm font-bold text-teal-900">
                    Extracting Clinical Data with AI OCR...
                  </h4>
                  <p className="text-xs text-teal-700">
                    Scanning hospital name, prescription date, diagnoses, medications, and laboratory values.
                  </p>
                </div>
              )}

              {/* Confirmation Step: "We found these details" */}
              {extractedReviewData && !isExtractingDoc && (
                <div className="border border-teal-200 bg-teal-50/30 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-teal-700" />
                    <h3 className="text-base font-bold text-slate-900">
                      We found these clinical details from your document
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600">
                    Please review the extracted information. You can confirm to index these into your 1-year medical history, or make corrections.
                  </p>

                  <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500">Document Type:</span>
                        <div className="font-bold text-slate-900">{extractedReviewData.documentType}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Document Date:</span>
                        <div className="font-bold text-slate-900">{extractedReviewData.documentDate}</div>
                      </div>
                    </div>

                    {extractedReviewData.extractedData?.hospitalOrClinic && (
                      <div>
                        <span className="text-slate-500">Hospital / Clinic:</span>
                        <div className="font-bold text-slate-900">{extractedReviewData.extractedData.hospitalOrClinic}</div>
                      </div>
                    )}

                    {extractedReviewData.extractedData?.doctorName && (
                      <div>
                        <span className="text-slate-500">Prescribing Doctor:</span>
                        <div className="font-bold text-slate-900">{extractedReviewData.extractedData.doctorName}</div>
                      </div>
                    )}

                    {/* Prescribed Medicine Data Extracted from Document */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700 font-bold flex items-center gap-1.5">
                          <Pill className="w-3.5 h-3.5 text-teal-600" />
                          Prescribed Medications & Medicine Data:
                        </span>
                        <span className="text-[11px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {extractedReviewData.extractedData?.medications?.length || 0} Medicine(s) Found
                        </span>
                      </div>

                      {extractedReviewData.extractedData?.medications && extractedReviewData.extractedData.medications.length > 0 ? (
                        <div className="space-y-1.5 mt-2">
                          {extractedReviewData.extractedData.medications.map((m, i) => (
                            <div key={i} className="p-2.5 bg-teal-50/40 rounded-xl border border-teal-200/80 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                                  {i + 1}
                                </span>
                                <div>
                                  <span className="font-bold text-slate-900 text-sm">{m.name}</span>
                                  <div className="text-slate-600 text-[11px] font-medium">
                                    {[m.dose, m.frequency, m.duration].filter(Boolean).join(' • ') || 'As prescribed'}
                                  </div>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 bg-white border border-teal-200 text-teal-800 rounded text-[10px] font-bold font-mono uppercase">
                                Active Rx
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-xs">
                          No specific medications automatically parsed. Prescribing doctor or clinic details will be archived for clinical review.
                        </div>
                      )}
                    </div>

                    {extractedReviewData.extractedData?.labResults && extractedReviewData.extractedData.labResults.length > 0 && (
                      <div>
                        <span className="text-slate-500">Extracted Laboratory Values:</span>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          {extractedReviewData.extractedData.labResults.map((l, i) => (
                            <div key={i} className="p-2 bg-slate-50 rounded border border-slate-200">
                              <div className="font-bold text-slate-900">{l.testName}</div>
                              <div className="text-teal-700 font-mono font-bold">{l.value} {l.unit}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => {
                        setUploadedFile(null);
                        setExtractedReviewData(null);
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                    >
                      Reject & Re-upload
                    </button>
                    <button
                      onClick={handleConfirmExtractedDocument}
                      className="px-6 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Confirm & Save to Medical History
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Document Viewer Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-teal-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">{previewDoc.fileName}</h3>
                  <p className="text-xs text-slate-400">{previewDoc.documentType} • {previewDoc.documentDate}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1">
              {/* Document Image or PDF Preview */}
              {previewDoc.fileDataUrl ? (
                previewDoc.fileType === 'pdf' || previewDoc.fileName.toLowerCase().endsWith('.pdf') ? (
                  <div className="border border-slate-200 rounded-xl p-8 text-center bg-slate-50 space-y-2">
                    <FileText className="w-12 h-12 text-teal-700 mx-auto" />
                    <p className="text-sm font-bold text-slate-800">PDF Medical Document</p>
                    <a
                      href={previewDoc.fileDataUrl}
                      download={previewDoc.fileName}
                      className="inline-block px-4 py-2 bg-teal-700 text-white text-xs font-semibold rounded-xl"
                    >
                      Download Original PDF
                    </a>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center p-2">
                    <img
                      src={previewDoc.fileDataUrl}
                      alt={previewDoc.fileName}
                      className="max-h-[50vh] object-contain rounded-lg"
                    />
                  </div>
                )
              ) : (
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                  Original file preview loaded in hospital archive.
                </div>
              )}

              {/* Extracted summary details */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2">
                <h4 className="font-bold text-slate-900">Extracted Clinical Data</h4>
                <p className="text-slate-700">
                  {previewDoc.extractedText || 'Original document verified and indexed into patient profile.'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
