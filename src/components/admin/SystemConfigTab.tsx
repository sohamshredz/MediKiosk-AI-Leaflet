import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  KeyRound, 
  ShieldCheck, 
  History, 
  Search, 
  Filter, 
  RefreshCw, 
  Check, 
  X, 
  Lock, 
  AlertCircle, 
  Clock, 
  Phone, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff,
  Server,
  Settings,
  Shield
} from 'lucide-react';
import { HospitalSystemConfig, SystemAuditLog } from '../../types';
import { 
  fetchHospitalConfig, 
  updateHospitalConfig, 
  changeMasterAdminPin, 
  fetchAuditLogs 
} from '../../services/adminService';

interface SystemConfigTabProps {
  onShowFeedback: (type: 'success' | 'error', message: string) => void;
  onRefreshParentLogs?: () => void;
}

export const SystemConfigTab: React.FC<SystemConfigTabProps> = ({
  onShowFeedback,
  onRefreshParentLogs
}) => {
  const [subTab, setSubTab] = useState<'audit' | 'hospital' | 'security'>('audit');

  // Audit Logs State
  const [logs, setLogs] = useState<SystemAuditLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logFilterAction, setLogFilterAction] = useState('all');

  // Hospital Config State
  const [config, setConfig] = useState<HospitalSystemConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [newDeptInput, setNewDeptInput] = useState('');

  // Change Admin PIN State
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [pinChangeError, setPinChangeError] = useState<string | null>(null);

  // Load audit logs
  const loadLogs = async () => {
    setIsLoadingLogs(true);
    const res = await fetchAuditLogs();
    if (res.success && res.logs) {
      setLogs(res.logs);
    }
    setIsLoadingLogs(false);
  };

  // Load config
  const loadConfig = async () => {
    setIsLoadingConfig(true);
    const res = await fetchHospitalConfig();
    if (res.success && res.config) {
      setConfig(res.config);
    }
    setIsLoadingConfig(false);
  };

  useEffect(() => {
    loadLogs();
    loadConfig();
  }, []);

  // Filtered audit logs
  const filteredLogs = logs.filter((log) => {
    const q = logSearchQuery.toLowerCase();
    const matchesSearch = 
      log.actionType.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      (log.targetName && log.targetName.toLowerCase().includes(q)) ||
      (log.targetId && log.targetId.toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (logFilterAction === 'all') return true;
    return log.actionType.toLowerCase().includes(logFilterAction.toLowerCase());
  });

  // Handle Save Hospital Config
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setIsSavingConfig(true);
    const res = await updateHospitalConfig(config);
    setIsSavingConfig(false);

    if (res.success) {
      onShowFeedback('success', res.message || 'Hospital system configuration saved.');
      loadLogs();
      if (onRefreshParentLogs) onRefreshParentLogs();
    } else {
      onShowFeedback('error', res.error || 'Failed to update hospital configuration.');
    }
  };

  // Add department to config
  const handleAddDept = () => {
    if (!newDeptInput.trim() || !config) return;
    if (config.availableDepartments.includes(newDeptInput.trim())) {
      onShowFeedback('error', 'Department already exists.');
      return;
    }
    setConfig({
      ...config,
      availableDepartments: [...config.availableDepartments, newDeptInput.trim()]
    });
    setNewDeptInput('');
  };

  // Remove department from config
  const handleRemoveDept = (deptToRemove: string) => {
    if (!config) return;
    setConfig({
      ...config,
      availableDepartments: config.availableDepartments.filter(d => d !== deptToRemove)
    });
  };

  // Handle Change Master Admin PIN
  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeError(null);

    if (!currentPin.trim() || !newPin.trim()) {
      setPinChangeError('Please enter both current and new PIN.');
      return;
    }

    if (newPin.length < 4) {
      setPinChangeError('New PIN must be at least 4 digits.');
      return;
    }

    if (newPin !== confirmPin) {
      setPinChangeError('New PIN and Confirm PIN do not match.');
      return;
    }

    setIsChangingPin(true);
    const res = await changeMasterAdminPin(currentPin.trim(), newPin.trim());
    setIsChangingPin(false);

    if (res.success) {
      onShowFeedback('success', 'HIS Master Admin PIN changed successfully. Please remember your new PIN.');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      loadLogs();
      if (onRefreshParentLogs) onRefreshParentLogs();
    } else {
      setPinChangeError(res.error || 'Failed to change admin PIN.');
    }
  };

  return (
    <div className="space-y-6">

      {/* Sub-tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setSubTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            subTab === 'audit'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Security Audit Trail ({logs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('hospital')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            subTab === 'hospital'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Hospital Configuration</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('security')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            subTab === 'security'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Master Admin PIN &amp; Credentials</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: SECURITY AUDIT TRAIL                                           */}
      {/* ========================================================================= */}
      {subTab === 'audit' && (
        <div className="space-y-4">
          
          {/* Audit Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  placeholder="Search audit trail by actor, action, target..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <select
                value={logFilterAction}
                onChange={(e) => setLogFilterAction(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-hidden"
              >
                <option value="all">All Audit Actions</option>
                <option value="STAFF_CREATED">Staff Provisioning</option>
                <option value="STAFF_UPDATED">Staff Edits</option>
                <option value="STAFF_PIN_RESET">Staff PIN Resets</option>
                <option value="STAFF_STATUS_CHANGED">Status Suspensions</option>
                <option value="PATIENT_UPDATED">Patient Demographics Edits</option>
                <option value="PATIENT_DELETED">Patient Deletions</option>
                <option value="SYSTEM_CONFIG_UPDATED">System Configuration</option>
              </select>
            </div>

            <button
              type="button"
              onClick={loadLogs}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer self-end sm:self-auto"
              title="Refresh Audit Trail"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingLogs ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Audit Trail Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Immutable Governance &amp; Security Trail ({filteredLogs.length} Events)
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                SHA-256 Verified • HIS Administration Log
              </span>
            </div>

            {isLoadingLogs ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
                <span className="text-xs font-bold">Loading security events...</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <p className="text-sm font-bold">No audit events match the specified filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-mono tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Action Type</th>
                      <th className="py-3 px-4">Target Entity</th>
                      <th className="py-3 px-4">Details &amp; Audit Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800 font-mono text-[11px]">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.actionType.includes('DELETE') || log.actionType.includes('STATUS')
                              ? 'bg-rose-100 text-rose-800'
                              : log.actionType.includes('CREATE')
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {log.actionType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-purple-900 font-bold whitespace-nowrap">
                          {log.targetName || log.targetId || 'SYSTEM'} ({log.targetType})
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-sans">
                          {log.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: HOSPITAL CONFIGURATION                                         */}
      {/* ========================================================================= */}
      {subTab === 'hospital' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 max-w-3xl">
          {isLoadingConfig || !config ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
              <span className="text-xs font-bold">Loading hospital settings...</span>
            </div>
          ) : (
            <form onSubmit={handleSaveConfig} className="space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-700" />
                  <span>Hospital Entity &amp; Facility Parameters</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Global hospital information rendered across Kiosk headers, Prescriptions, and ABDM tokens.
                </p>
              </div>

              {/* Hospital Name & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Hospital Name *
                  </label>
                  <input
                    type="text"
                    value={config.hospitalName}
                    onChange={(e) => setConfig({ ...config, hospitalName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Hospital Code (System ID)
                  </label>
                  <input
                    type="text"
                    value={config.hospitalCode}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-sm font-mono text-slate-600 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Timings & Emergency */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    OPD Timings *
                  </label>
                  <input
                    type="text"
                    value={config.opdTimings}
                    onChange={(e) => setConfig({ ...config, opdTimings: e.target.value })}
                    placeholder="e.g. 08:00 AM - 04:00 PM"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Emergency Hotline
                  </label>
                  <input
                    type="text"
                    value={config.emergencyContactNumber}
                    onChange={(e) => setConfig({ ...config, emergencyContactNumber: e.target.value })}
                    placeholder="e.g. 011-26588500"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Ambulance SOS
                  </label>
                  <input
                    type="text"
                    value={config.ambulanceSosNumber}
                    onChange={(e) => setConfig({ ...config, ambulanceSosNumber: e.target.value })}
                    placeholder="e.g. 102 / 108"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Available Departments */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Configured OPD Clinical Departments
                </label>
                
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  {config.availableDepartments.map((dept) => (
                    <span
                      key={dept}
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>{dept}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDept(dept)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Remove department"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newDeptInput}
                    onChange={(e) => setNewDeptInput(e.target.value)}
                    placeholder="Enter new department name (e.g. Ophthalmology OPD)..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddDept}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* ABDM Integration parameters */}
              <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-200 space-y-2 text-xs">
                <div className="font-bold text-purple-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-700" />
                  <span>ABDM Health Facility Registry (HFR) Binding</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Facility ID</span>
                    <span className="font-mono font-bold text-slate-800">{config.abdmFacilityId || 'IN0710000001'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">HIP / HIE Node Mode</span>
                    <span className="font-mono text-emerald-700 font-bold">ONLINE (Bridge active)</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSavingConfig ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Configuration</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: MASTER ADMIN PIN & CREDENTIALS                                 */}
      {/* ========================================================================= */}
      {subTab === 'security' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 max-w-xl">
          <div className="border-b border-slate-200 pb-4 mb-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-purple-700" />
              <span>Change Master HIS Administrator PIN</span>
            </h3>
            <p className="text-xs text-slate-500">
              The single Master Administrator PIN guards all staff provisioning, queue dispatch, and patient record governance.
            </p>
          </div>

          <form onSubmit={handleChangePinSubmit} className="space-y-4">
            {pinChangeError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pinChangeError}</span>
              </div>
            )}

            {/* Current PIN */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Current Administrator PIN *
              </label>
              <div className="relative">
                <input
                  type={showCurrentPin ? 'text' : 'password'}
                  maxLength={6}
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                  placeholder="••••"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPin(!showCurrentPin)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showCurrentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New PIN */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                New 4-Digit Security PIN *
              </label>
              <div className="relative">
                <input
                  type={showNewPin ? 'text' : 'password'}
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="••••"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPin(!showNewPin)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New PIN */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Confirm New Security PIN *
              </label>
              <input
                type="password"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                required
              />
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              Note: Changing this PIN will require using the new PIN for all subsequent Master Administrator sign-ins.
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                disabled={isChangingPin}
                className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isChangingPin ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Update Master PIN</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
