import React from 'react';
import { useMusic, TabType } from '../context/MusicContext';
import { Home, Search, Library, ListMusic, Settings } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, t } = useMusic();

  const tabs: { id: TabType; labelKey: string; icon: React.ElementType }[] = [
    { id: 'home', labelKey: 'nav_home', icon: Home },
    { id: 'search', labelKey: 'nav_search', icon: Search },
    { id: 'library', labelKey: 'nav_library', icon: Library },
    { id: 'playlists', labelKey: 'nav_playlists', icon: ListMusic },
    { id: 'settings', labelKey: 'nav_settings', icon: Settings },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-[#101014]/95 backdrop-blur-xl border-t border-white/10 px-2 sm:px-6 py-2 transition-all"
      aria-label="Main Navigation"
    >
      <div className="max-w-md sm:max-w-xl mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
                isActive
                  ? 'text-purple-400 font-bold scale-105'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              aria-label={t(tab.labelKey)}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc]" />
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight truncate max-w-[65px]">
                {t(tab.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
