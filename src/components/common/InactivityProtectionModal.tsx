import React, { useEffect, useState, useRef } from 'react';
import { ShieldAlert, Clock, LogOut, CheckCircle2 } from 'lucide-react';

interface InactivityProtectionModalProps {
  isActive: boolean; // true when user is authenticated in a session
  timeoutMs?: number; // default 5 minutes = 300,000ms
  warningMs?: number; // default 30s warning = 30,000ms
  onLogout: () => void;
}

export const InactivityProtectionModal: React.FC<InactivityProtectionModalProps> = ({
  isActive,
  timeoutMs = 5 * 60 * 1000, // 5 minutes
  warningMs = 45 * 1000, // 45 seconds warning before logout
  onLogout
}) => {
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(Math.floor(warningMs / 1000));
  const lastActivityRef = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset timer on user interaction
  const recordActivity = () => {
    lastActivityRef.current = Date.now();
    if (showWarning) {
      setShowWarning(false);
      setSecondsRemaining(Math.floor(warningMs / 1000));
    }
  };

  const handleContinueSession = () => {
    recordActivity();
  };

  const handleEndSession = () => {
    setShowWarning(false);
    onLogout();
  };

  useEffect(() => {
    if (!isActive) {
      setShowWarning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    lastActivityRef.current = Date.now();

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    const handleUserEvent = () => {
      // Only reset activity automatically if warning modal is not yet triggered
      if (!showWarning) {
        lastActivityRef.current = Date.now();
      }
    };

    activityEvents.forEach(evt => window.addEventListener(evt, handleUserEvent, { passive: true }));

    // Check timer every 1 second
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const timeRemaining = timeoutMs - elapsed;

      if (timeRemaining <= 0) {
        // Expired -> auto logout
        setShowWarning(false);
        onLogout();
      } else if (timeRemaining <= warningMs) {
        // In warning window
        setShowWarning(true);
        setSecondsRemaining(Math.max(1, Math.ceil(timeRemaining / 1000)));
      } else {
        setShowWarning(false);
      }
    }, 1000);

    return () => {
      activityEvents.forEach(evt => window.removeEventListener(evt, handleUserEvent));
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timeoutMs, warningMs, showWarning, onLogout]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="inactivity-title"
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-amber-300 dark:border-amber-700/60 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 id="inactivity-title" className="text-base font-bold text-amber-950 dark:text-amber-200">
              Your session is about to expire
            </h3>
            <p className="text-xs text-amber-800 dark:text-amber-400">
              Shared Hospital Kiosk Privacy Protection
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            For patient privacy and medical confidentiality, this kiosk session will automatically end in{' '}
            <strong className="text-rose-600 dark:text-rose-400 font-mono text-base font-bold">{secondsRemaining}s</strong> if no action is taken.
          </p>

          <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
            <ShieldAlert className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <span>
              Ending the session securely clears all temporary inputs, active search tokens, and cached previews from this terminal.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleContinueSession}
              className="w-full py-3 px-4 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Continue Session</span>
            </button>
            <button
              type="button"
              onClick={handleEndSession}
              className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer border border-slate-200 dark:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <LogOut className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>End Session</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
