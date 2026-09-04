import React, { useState, useRef, useEffect } from 'react';
import { Languages, ChevronDown, Check, Info } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { SupportedLanguage } from '../../types';

// Strict canonical order as specified
export const ORDERED_LANGUAGES: { code: SupportedLanguage; label: string; nativeName: string; englishName: string }[] = [
  { code: 'en', label: 'English (English)', nativeName: 'English', englishName: 'English' },
  { code: 'hi', label: 'हिंदी (Hindi)', nativeName: 'हिंदी', englishName: 'Hindi' },
  { code: 'mr', label: 'मराठी (Marathi)', nativeName: 'मराठी', englishName: 'Marathi' },
  { code: 'ta', label: 'தமிழ் (Tamil)', nativeName: 'தமிழ்', englishName: 'Tamil' },
  { code: 'te', label: 'తెలుగు (Telugu)', nativeName: 'తెలుగు', englishName: 'Telugu' },
  { code: 'bn', label: 'বাংলা (Bengali)', nativeName: 'বাংলা', englishName: 'Bengali' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)', nativeName: 'ગુજરાતી', englishName: 'Gujarati' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)', nativeName: 'ಕನ್ನಡ', englishName: 'Kannada' },
  { code: 'ml', label: 'മലയാളം (Malayalam)', nativeName: 'മലയാളം', englishName: 'Malayalam' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)', nativeName: 'ਪੰਜਾਬੀ', englishName: 'Punjabi' },
];

interface LanguageSelectorProps {
  variant?: 'header' | 'kiosk' | 'minimal' | 'futuristic-3d' | 'transparent-floating';
  showArchitectureButton?: boolean;
  onOpenArchitectureModal?: () => void;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'header',
  showArchitectureButton = false,
  onOpenArchitectureModal,
  className = ''
}) => {
  const { language, setLanguage, langConfig } = useLanguage();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentItem = ORDERED_LANGUAGES.find(l => l.code === language) || ORDERED_LANGUAGES[0];

  const handleSelectLanguage = (code: SupportedLanguage) => {
    setLanguage(code);
    setIsOpen(false);
  };

  const isFloating = variant === 'transparent-floating';
  const is3D = variant === 'futuristic-3d' || isFloating;

  return (
    <div className={`relative inline-flex items-center gap-1.5 ${className}`} ref={dropdownRef}>
      {/* Main Trigger Button */}
      <button
        type="button"
        id="top-right-language-selector-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={
          isFloating
            ? 'flex items-center gap-1.5 text-sm sm:text-base font-medium text-slate-300 hover:text-white hover:drop-shadow-[0_0_8px_rgba(45,212,191,0.6)] transition-all cursor-pointer select-none bg-transparent border-0 p-0 shadow-none'
            : `flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer select-none ${
                is3D
                  ? isOpen
                    ? 'bg-teal-500/30 text-teal-200 border border-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.5)] backdrop-blur-md'
                    : 'bg-slate-900/70 hover:bg-slate-800/90 text-slate-200 border border-teal-500/30 hover:border-teal-400/60 shadow-[0_4px_16px_rgba(0,0,0,0.4)] backdrop-blur-md hover:text-white'
                  : isOpen
                    ? 'bg-teal-700 text-white ring-2 ring-teal-500 shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-xs hover:border-slate-300'
              }`
        }
        title={`Current Language: ${currentItem.label} - Click to switch`}
      >
        <Languages className={`w-4 h-4 shrink-0 ${isFloating ? 'text-teal-400' : is3D ? 'text-teal-300' : isOpen ? 'text-white' : 'text-teal-700'}`} />
        <span className="tracking-tight whitespace-nowrap">{currentItem.englishName}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-teal-300' : isFloating ? 'text-slate-400' : is3D ? 'text-teal-400/80' : 'text-slate-500'
          }`}
        />
      </button>

      {/* Optional Architecture Info Button */}
      {showArchitectureButton && (
        <button
          type="button"
          onClick={onOpenArchitectureModal}
          className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
            is3D
              ? 'bg-slate-900/70 hover:bg-slate-800 text-teal-300 border border-teal-500/30'
              : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
          }`}
          title="Architecture: Language Preference ≠ Patient Identity"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          id="language-dropdown-list"
          className={`absolute right-0 top-full mt-2 w-60 rounded-2xl shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 ${
            is3D
              ? 'bg-slate-950/95 border border-teal-500/40 text-slate-100 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.8)]'
              : 'bg-white border border-slate-200 text-slate-800 shadow-xl'
          }`}
        >
          <div className={`px-3 py-1.5 flex items-center justify-between border-b ${
            is3D ? 'border-slate-800/80' : 'border-slate-100'
          }`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              is3D ? 'text-teal-300/80' : 'text-slate-500'
            }`}>
              Select Language / भाषा चुनें
            </span>
            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
              is3D ? 'bg-teal-950 text-teal-300 border border-teal-800' : 'bg-teal-50 text-teal-700'
            }`}>
              10 Indic
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto py-1 space-y-0.5">
            {ORDERED_LANGUAGES.map((item) => {
              const isSelected = item.code === language;
              return (
                <button
                  key={item.code}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  id={`lang-option-${item.code}`}
                  onClick={() => handleSelectLanguage(item.code)}
                  className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    is3D
                      ? isSelected
                        ? 'bg-teal-500/20 text-teal-200 font-bold border-l-3 border-teal-400'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      : isSelected
                        ? 'bg-teal-50 text-teal-900 font-bold border-l-3 border-teal-600'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  {isSelected && (
                    <Check className={`w-3.5 h-3.5 shrink-0 ${is3D ? 'text-teal-400' : 'text-teal-700'}`} />
                  )}
                </button>
              );
            })}
          </div>

          <div className={`px-3 py-1.5 border-t rounded-b-2xl ${
            is3D ? 'border-slate-800/80 bg-slate-900/70 text-slate-400' : 'border-slate-100 bg-slate-50/60 text-slate-500'
          }`}>
            <p className="text-[10px] font-medium leading-tight">
              ⚡ Decoupled: <span className={is3D ? 'font-semibold text-teal-300' : 'font-semibold text-slate-700'}>Language ≠ Patient Identity</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
