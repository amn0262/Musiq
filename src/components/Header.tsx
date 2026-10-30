import React from 'react';
import { useMusic } from '../context/MusicContext';
import { Search, Globe, Music2, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  const { t, isRTL, settings, updateSettings, user, setActiveTab } = useMusic();

  const toggleLanguage = () => {
    updateSettings({ language: settings.language === 'ar' ? 'en' : 'ar' });
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-[#101014]/90 backdrop-blur-md border-b border-white/5 px-4 sm:px-6 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <button
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 group text-left transition-transform active:scale-95"
          aria-label="MUSIQ Home"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-shadow">
            <div className="w-full h-full bg-[#101014] rounded-[11px] flex items-center justify-center">
              <Music2 className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-purple-100 to-purple-400 bg-clip-text text-transparent">
                MUSIQ
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium hidden sm:block">
              {isRTL ? 'استماع ذكي بلا حدود' : 'Smart Music Streaming'}
            </p>
          </div>
        </button>

        {/* Global Quick Search Bar Button */}
        <button
          onClick={() => setActiveTab('search')}
          className="flex-1 max-w-md hidden md:flex items-center gap-3 px-4 py-2.5 rounded-full bg-[#171722] hover:bg-[#1e1e2d] border border-white/10 hover:border-purple-500/40 text-gray-400 hover:text-white transition-all shadow-inner text-sm group"
          aria-label={t('search_placeholder')}
        >
          <Search className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
          <span className="truncate">{t('search_placeholder')}</span>
          <kbd className="ms-auto text-[10px] font-mono bg-white/10 text-gray-300 px-2 py-0.5 rounded">
            ⌘K
          </kbd>
        </button>

        {/* Right Action Icons: Language Toggle & User Avatar */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all active:scale-95"
            title="Switch Language"
            aria-label="Switch Language Arabic/English"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>{settings.language === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          {/* User Profile Avatar */}
          <button
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-purple-500/50 transition-all"
            aria-label="User Profile"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-purple-500/40"
            />
          </button>
        </div>
      </div>
    </header>
  );
};
