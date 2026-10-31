import React from 'react';
import { useMusic, TabType } from '../context/MusicContext';
import { Search, ListMusic, Heart } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, isRTL } = useMusic();

  const tabs: { id: TabType; labelAr: string; labelEn: string; icon: React.ElementType }[] = [
    { id: 'search', labelAr: 'البحث ويوتيوب', labelEn: 'Search & YouTube', icon: Search },
    { id: 'playlists', labelAr: 'قوائم التشغيل', labelEn: 'Playlists', icon: ListMusic },
    { id: 'library', labelAr: 'المفضلة', labelEn: 'Favorites', icon: Heart },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-[#0d0d12]/95 backdrop-blur-xl border-t border-white/5 px-2 sm:px-6 py-2 transition-all"
      aria-label="Navigation"
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-2xl transition-all relative ${
                isActive
                  ? 'text-purple-400 font-bold scale-105'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc]" />
                )}
              </div>
              <span className="text-[11px] mt-1 font-medium tracking-tight">
                {isRTL ? tab.labelAr : tab.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
