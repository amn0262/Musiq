import React from 'react';
import { useMusic } from '../context/MusicContext';
import { Globe, Music2 } from 'lucide-react';

export const Header: React.FC = () => {
  const { isRTL, settings, updateSettings, setActiveTab } = useMusic();

  const toggleLanguage = () => {
    updateSettings({ language: settings.language === 'ar' ? 'en' : 'ar' });
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-[#0d0d12]/95 backdrop-blur-md border-b border-white/5 px-4 sm:px-6 py-3 transition-all">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <button
          onClick={() => setActiveTab('search')}
          className="flex items-center gap-2.5 group text-left transition-transform active:scale-95"
          aria-label="MUSIQ"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1px] shadow-md shadow-purple-500/20">
            <div className="w-full h-full bg-[#0d0d12] rounded-[11px] flex items-center justify-center">
              <Music2 className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-wider bg-gradient-to-r from-white via-purple-100 to-purple-400 bg-clip-text text-transparent">
                MUSIQ
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-red-600/20 text-red-400 border border-red-500/30">
                YouTube
              </span>
            </div>
          </div>
        </button>

        {/* Right Actions: Clean Status & Language Toggle (Zero User Data) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-gray-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{isRTL ? 'يوتيوب مباشر' : 'YouTube Direct'}</span>
          </div>

          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all active:scale-95"
            title="Switch Language"
            aria-label="Switch Language Arabic/English"
          >
            <Globe className="w-3.5 h-3.5 text-purple-400" />
            <span>{settings.language === 'ar' ? 'English' : 'العربية'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
