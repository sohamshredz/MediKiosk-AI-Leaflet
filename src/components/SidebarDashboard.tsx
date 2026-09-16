import React, { useState } from 'react';
import { 
  Stethoscope, 
  Mic, 
  AlertTriangle, 
  ShieldCheck, 
  Globe, 
  Save, 
  CheckCircle2, 
  RefreshCw, 
  Database, 
  Sparkles, 
  BarChart3, 
  Calendar, 
  User, 
  Users, 
  LogIn, 
  LogOut,
  UserCheck, 
  Activity, 
  Heart, 
  FileText, 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  RotateCcw,
  Smartphone,
  Lock,
  Layers,
  MapPin,
  Siren,
  Navigation,
  ArrowRight,
  UserRound,
  Pill,
  Camera,
  Building2
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../data/indianLanguages';
import { PatientProfile, AuthSession } from '../types';
import { AutoSaveStatus } from '../utils/kioskStorage';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './common/LanguageSelector';
import { LanguageArchitectureModal } from './common/LanguageArchitectureModal';
import { SupabaseStatusModal } from './common/SupabaseStatusModal';

export type AppView = 'landing' | 'login' | 'kiosk' | 'doctor' | 'triage' | 'admin' | 'patient' | 'map' | 'assistant';

interface SidebarDashboardProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  selectedLanguage: string;
  onChangeLanguage: (lang: string) => void;
  patients: PatientProfile[];
  activePatientId: string;
  onSelectPatient: (id: string) => void;
  onOpenAbdmModal: () => void;
  onOpenInfographicModal?: () => void;
  onAddNewPatient: () => void;
  saveStatus?: AutoSaveStatus;
  lastSavedTimestamp?: string | null;
  onForceSave?: () => void;
  onResetStorage?: () => void;
  isOpen?: boolean;
  onToggleOpen?: () => void;
  userRole?: 'patient' | 'doctor' | 'staff' | null;
  authSession?: AuthSession | null;
  onLogout?: () => void;
}

export const SidebarDashboard: React.FC<SidebarDashboardProps> = ({
  currentView,
  onChangeView,
  selectedLanguage,
  onChangeLanguage,
  patients,
  activePatientId,
  onSelectPatient,
  onOpenAbdmModal,
  onOpenInfographicModal,
  onAddNewPatient,
  saveStatus = 'saved',
  lastSavedTimestamp,
  onForceSave,
  onResetStorage,
  isOpen = false,
  onToggleOpen,
  userRole,
  authSession,
  onLogout
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [isSlideOpen, setIsSlideOpen] = useState<boolean>(isOpen);
  const [isLanguageArchModalOpen, setIsLanguageArchModalOpen] = useState<boolean>(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);

  // Sync internal state with external prop if provided
  const openState = onToggleOpen ? isOpen : isSlideOpen;
  const toggleDrawer = () => {
    if (onToggleOpen) {
      onToggleOpen();
    } else {
      setIsSlideOpen(prev => !prev);
    }
  };

  const activePatient = (authSession && authSession.role === 'patient')
    ? (patients.find(p => p.id === activePatientId) || null)
    : null;
  const criticalCount = patients.filter(p => p.triageRisk === 'CRITICAL_EMERGENCY').length;
  const currentLangCode = language || selectedLanguage || 'en';
  const currentLangConfig = SUPPORTED_LANGUAGES[currentLangCode as keyof typeof SUPPORTED_LANGUAGES] || SUPPORTED_LANGUAGES.en;

  const handleNavClick = (view: AppView) => {
    onChangeView(view);
    if (window.innerWidth < 1024) {
      toggleDrawer();
    }
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. TOP HEADER / APP BAR (Rendered for non-landing views)                  */}
      {/* ========================================================================= */}
      {currentView !== 'landing' && (
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-2.5 shadow-2xs transition-colors duration-150">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand Logo & Drawer Menu Trigger */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleDrawer}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              title="Toggle Navigation Menu"
              aria-label="Toggle Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div 
              onClick={() => {
                if (authSession) {
                  if (authSession.role === 'patient') handleNavClick('patient');
                  else if (authSession.role === 'doctor' || authSession.role === 'medical_officer') handleNavClick('doctor');
                  else if (authSession.role === 'triage_nurse' || authSession.role === 'admin') handleNavClick('triage');
                } else {
                  handleNavClick('landing');
                }
              }}
              className="flex items-center gap-2 cursor-pointer select-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-xl"
            >
              <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center font-black shadow-xs group-hover:bg-teal-800 transition-colors">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <span className="font-black text-slate-900 dark:text-white text-sm sm:text-base tracking-tight group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                  MediKiosk <span className="text-teal-700 dark:text-teal-400">AI</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] text-slate-600 dark:text-slate-400 block -mt-1 font-medium">
                  {authSession && authSession.role === 'patient' 
                    ? 'Patient Portal' 
                    : authSession && (authSession.role === 'doctor' || authSession.role === 'medical_officer') 
                    ? 'Doctor Portal' 
                    : authSession && (authSession.role === 'triage_nurse' || authSession.role === 'admin') 
                    ? 'Staff Portal' 
                    : t('Hospital OPD System')}
                </span>
              </div>
            </div>
          </div>

          {/* Center Navigation Shortcuts (Strictly Auth-Session Aware) */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            
            {/* If Authenticated Doctor */}
            {authSession && (authSession.role === 'doctor' || authSession.role === 'medical_officer') && (
              <>
                <button
                  type="button"
                  onClick={() => handleNavClick('doctor')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                    currentView === 'doctor' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                  }`}
                >
                  {t('Doctor OPD Station')}
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('triage')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                    currentView === 'triage' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                  }`}
                >
                  {t('Emergency Triage')}
                </button>
              </>
            )}

            {/* If Authenticated Staff */}
            {authSession && (authSession.role === 'triage_nurse' || authSession.role === 'admin') && (
              <>
                <button
                  type="button"
                  onClick={() => handleNavClick('triage')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                    currentView === 'triage' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                  }`}
                >
                  {t('Triage & Vitals Desk')}
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('doctor')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                    currentView === 'doctor' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                  }`}
                >
                  {t('Doctor Station')}
                </button>
              </>
            )}

            {/* If Logged Out / Public Session */}
            {!authSession && (
              <>
                <button
                  type="button"
                  onClick={() => handleNavClick('landing')}
                  className="px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
                >
                  {t('Home')}
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('kiosk')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                    currentView === 'kiosk' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                  }`}
                >
                  {t('Smart Kiosk')}
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('map')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                    currentView === 'map' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                  }`}
                >
                  {t('Hospital Map')}
                </button>
              </>
            )}
          </nav>

          {/* Right Controls: Language Selector, Theme Switcher & User Profile */}
          <div className="flex items-center gap-2">
            <LanguageSelector
              variant="header"
            />

            {/* Standards & Compliance Architecture Button */}
            <button
              type="button"
              id="header-standards-btn"
              onClick={onOpenAbdmModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 shadow-2xs"
              title="ABDM Health Locker, DPDP Act 2023 & HL7 FHIR Standards Architecture"
              aria-label="Standards Architecture"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span className="hidden sm:inline">{t('Standards')}</span>
            </button>

            {authSession && (
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200 text-xs font-bold">
                  <UserCheck className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" />
                  <span className="truncate max-w-[120px]">
                    {authSession.userName || (authSession.role === 'patient' ? activePatient?.name : authSession.role.toUpperCase())}
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>
      )}

      {/* ========================================================================= */}
      {/* 2. SLIDE-OUT DRAWER NAVIGATION                                            */}
      {/* ========================================================================= */}
      {openState && (
        <div 
          onClick={toggleDrawer}
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-2xs transition-opacity"
        />
      )}

      <aside className={`fixed top-0 left-0 bottom-0 z-50 w-72 sm:w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-transform duration-200 ease-in-out ${
        openState ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center font-black">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 dark:text-white text-sm">MediKiosk AI Navigation</h2>
              <span className="text-[10px] text-teal-800 dark:text-teal-400 font-bold uppercase tracking-wider">
                {authSession ? `${authSession.role.toUpperCase()} SESSION` : 'PUBLIC MODE'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleDrawer}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
          
          {/* ===================================================================== */}
          {/* PATIENT ROLE MENU (ONLY WHEN AUTHENTICATED AS PATIENT)                 */}
          {/* ===================================================================== */}
          {authSession && authSession.role === 'patient' && (
            <div className="space-y-1">
              <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                {t('Patient Services')}
              </span>

              {[
                { id: 'patient' as AppView, label: t('My Patient Dashboard'), desc: t('Personal Records & Prescriptions'), icon: User },
                { id: 'kiosk' as AppView, label: t('Start New Consultation'), desc: t('AI Pre-Consultation Intake'), icon: Stethoscope },
                { id: 'map' as AppView, label: t('Hospital Map & SOS'), desc: t('OPD Rooms & Emergency Route'), icon: MapPin },
                { id: 'assistant' as AppView, label: t('Gemini Health Assistant'), desc: t('Multilingual Clinical QA'), icon: Sparkles }
              ].map((item) => {
                const isSelected = currentView === item.id;
                const IconComp = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full p-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                      isSelected ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-400'
                    }`}>
                      <IconComp className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className="font-bold text-xs truncate">{item.label}</p>
                      <p className={`text-[10px] truncate ${isSelected ? 'text-teal-100' : 'text-slate-400 dark:text-slate-500'}`}>
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ===================================================================== */}
          {/* DOCTOR ROLE MENU                                                      */}
          {/* ===================================================================== */}
          {authSession && (authSession.role === 'doctor' || authSession.role === 'medical_officer') && (
            <div className="space-y-1">
              <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                {t('Physician Station')}
              </span>

              {[
                { id: 'doctor' as AppView, label: t('Doctor OPD Console'), desc: t('Queue, Dossiers & e-Prescriptions'), icon: Stethoscope },
                { id: 'triage' as AppView, label: t('Emergency Triage Live'), desc: t('Critical Red Flags & Vitals'), icon: Activity },
                { id: 'assistant' as AppView, label: t('Gemini Medical Assistant'), desc: t('Clinical Guidelines & CDS'), icon: Sparkles }
              ].map((item) => {
                const isSelected = currentView === item.id;
                const IconComp = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full p-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                      isSelected ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-400'
                    }`}>
                      <IconComp className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className="font-bold text-xs truncate">{item.label}</p>
                      <p className={`text-[10px] truncate ${isSelected ? 'text-teal-100' : 'text-slate-400 dark:text-slate-500'}`}>
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ===================================================================== */}
          {/* STAFF ROLE MENU                                                       */}
          {/* ===================================================================== */}
          {authSession && (authSession.role === 'triage_nurse' || authSession.role === 'admin') && (
            <div className="space-y-1">
              <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                {t('Staff & Triage Station')}
              </span>

              {[
                { id: 'triage' as AppView, label: t('Staff Triage Dashboard'), desc: t('Live OPD Queue & Triage Desk'), icon: Activity },
                { id: 'doctor' as AppView, label: t('Doctor OPD Console'), desc: t('Doctor Station Preview'), icon: Stethoscope },
                { id: 'map' as AppView, label: t('Hospital Emergency Map'), desc: t('Bed Tracking & SOS'), icon: MapPin }
              ].map((item) => {
                const isSelected = currentView === item.id;
                const IconComp = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full p-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                      isSelected ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-amber-700 dark:text-amber-400'
                    }`}>
                      <IconComp className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className="font-bold text-xs truncate">{item.label}</p>
                      <p className={`text-[10px] truncate ${isSelected ? 'text-amber-100' : 'text-slate-400 dark:text-slate-500'}`}>
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ===================================================================== */}
          {/* PUBLIC / GENERAL PORTALS (WHEN NOT LOGGED IN)                         */}
          {/* ===================================================================== */}
          {!authSession && (
            <div className="space-y-1">
              <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                {t('MediKiosk Portals')}
              </span>

              {[
                { id: 'landing' as AppView, label: t('Hospital Home & Gateways'), desc: t('Public Entry & Information'), icon: Building2 },
                { id: 'kiosk' as AppView, label: t('Smart Kiosk Mode'), desc: t('Voice & Touch Multilingual Intake'), icon: Mic },
                { id: 'login' as AppView, label: t('Patient Portal Sign In'), desc: t('Access My Medical Records'), icon: User },
                { id: 'map' as AppView, label: t('Hospital Locator & SOS'), desc: t('Live GPS, SOS & Bed Tracking'), icon: MapPin },
                { id: 'assistant' as AppView, label: t('Gemini AI Assistant'), desc: t('Clinical QA & Translation'), icon: Sparkles }
              ].map((item) => {
                const isSelected = currentView === item.id;
                const IconComp = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full p-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                      isSelected ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-400'
                    }`}>
                      <IconComp className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className="font-bold text-xs truncate">{item.label}</p>
                      <p className={`text-[10px] truncate ${isSelected ? 'text-teal-100' : 'text-slate-400 dark:text-slate-500'}`}>
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ARCHITECTURE & COMPLIANCE MODALS (All Roles) */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              {t('Standards & Compliance')}
            </span>

            <button
              type="button"
              onClick={() => {
                setIsLanguageArchModalOpen(true);
                toggleDrawer();
              }}
              className="w-full p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-teal-900 dark:text-teal-200 text-xs font-bold transition-all flex items-center gap-2 border border-teal-200/80 dark:border-teal-800/60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <Globe className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
              <span>{t('Language ≠ Identity')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenAbdmModal();
                toggleDrawer();
              }}
              className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
              <span>{t('ABDM & DPDP Compliance')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSupabaseModalOpen(true);
                toggleDrawer();
              }}
              className="w-full p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-900 dark:text-emerald-200 text-xs font-bold transition-all flex items-center gap-2 border border-emerald-200/80 dark:border-emerald-800/60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <Database className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>{t('Supabase SQL & Sync Status')}</span>
            </button>
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${saveStatus === 'saving' ? 'bg-amber-500 animate-spin' : 'bg-emerald-500'}`}></span>
            <span className="font-medium">{t('Data Auto-Saved')}</span>
          </div>

          {authSession && onLogout ? (
            <button
              type="button"
              onClick={() => {
                toggleDrawer();
                onLogout();
              }}
              className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded px-1"
            >
              {t('Logout')}
            </button>
          ) : onResetStorage ? (
            <button
              type="button"
              onClick={onResetStorage}
              className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
            >
              {t('Reset Data')}
            </button>
          ) : null}
        </div>

      </aside>

      {/* Language Decoupled Architecture Modal */}
      <LanguageArchitectureModal
        isOpen={isLanguageArchModalOpen}
        onClose={() => setIsLanguageArchModalOpen(false)}
      />

      {/* Supabase Pro Database Status & Sync Modal */}
      <SupabaseStatusModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        appointments={[]}
      />
    </>
  );
};

