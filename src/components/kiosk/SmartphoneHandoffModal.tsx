import React, { useState } from 'react';
import { SafeQRCode } from '../common/SafeQRCode';
import { Smartphone, QrCode, Copy, Check, ExternalLink, X, Shield, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import { PatientProfile } from '../../types';
import { generateHandoffUrl } from '../../utils/kioskHandoff';

interface SmartphoneHandoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfile;
  currentStep: number;
}

export const SmartphoneHandoffModal: React.FC<SmartphoneHandoffModalProps> = ({
  isOpen,
  onClose,
  patient,
  currentStep
}) => {
  const [copied, setCopied] = useState(false);
  const [includeFullSnapshot, setIncludeFullSnapshot] = useState(false);

  if (!isOpen) return null;

  const handoffUrl = generateHandoffUrl(patient, currentStep, includeFullSnapshot);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(handoffUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      // fallback
      const textArea = document.createElement('textarea');
      textArea.value = handoffUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenInNewTab = () => {
    window.open(handoffUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-7 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                Continue Kiosk on Smartphone
              </h3>
              <p className="text-xs text-slate-500">
                Scan with your phone's camera to complete OPD intake at your seat
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient Status Pill */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs">
          <div>
            <span className="text-slate-400 font-medium">Patient: </span>
            <span className="font-bold text-slate-900">{patient.name}</span>
            <span className="ml-2 font-mono text-[11px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
              {patient.tokenNumber}
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 font-medium">Step: </span>
            <span className="font-bold text-teal-700">#{currentStep}</span>
          </div>
        </div>

        {/* QR Code Presentation Box */}
        <div className="flex flex-col items-center justify-center p-6 bg-slate-50/70 border-2 border-dashed border-teal-200 rounded-2xl space-y-3 text-center">
          <div className="p-3.5 bg-white rounded-2xl shadow-sm border border-slate-200 inline-block">
            <SafeQRCode
              value={handoffUrl}
              size={180}
              level="M"
              includeMargin={false}
              className="rounded-lg"
              fallbackLabel={`Token: ${patient.tokenNumber}`}
            />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5">
              <QrCode className="w-4 h-4 text-teal-600" />
              Scan with Google Lens / Phone Camera
            </p>
            <p className="text-[11px] text-slate-500 max-w-xs">
              Directly resumes symptoms, voice history, medications & local storage state seamlessly.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-2.5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors border border-slate-200"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-teal-600" />
                  <span className="text-teal-700">Unique Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Copy Session Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleOpenInNewTab}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Test Phone Preview</span>
            </button>
          </div>

          {/* Security & Local Storage Sync info */}
          <div className="p-3 bg-teal-50/60 border border-teal-100 rounded-xl text-[11px] text-teal-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-teal-950">
              <Shield className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>Local Storage & Privacy Guarantee</span>
            </div>
            <p className="text-slate-600 leading-normal">
              Your intake is auto-saved locally every 5 seconds. Scanning will sync your inputs directly to your personal device without requiring an app installation.
            </p>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
