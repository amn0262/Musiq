import React from 'react';
import { useMusic } from '../context/MusicContext';
import { Globe, Music } from 'lucide-react';

export const Header: React.FC = () => {
  const { isRTL, settings, updateSettings, setActiveTab } = useMusic();

  const toggleLanguage = () => {
    updateSettings({ language: settings.language === 'ar' ? 'en' : 'ar' });
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-[#0c0c10] border-b border-[#1f1f2c] px-4 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <button
          onClick={() => setActiveTab('search')}
          className="flex items-center gap-2.5 group text-left transition-transform active:scale-95 cursor-pointer"
          aria-label="MUSIQ"
        >
          <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-bold">
            <Music className="w-4 h-4 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-wider text-white">
                MUSIQ
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white/10 text-gray-300">
                YouTube
              </span>
            </div>
          </div>
        </button>

        {/* Right Actions: Clean Status & Language Toggle */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-medium text-gray-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{isRTL ? 'يوتيوب مباشر' : 'YouTube Direct'}</span>
          </div>

          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-colors cursor-pointer"
            title="Switch Language"
            aria-label="Switch Language Arabic/English"
          >
            <Globe className="w-3.5 h-3.5 text-gray-400" />
            <span>{settings.language === 'ar' ? 'English' : 'العربية'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
