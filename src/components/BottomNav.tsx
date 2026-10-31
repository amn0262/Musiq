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
      className="fixed bottom-0 left-0 right-0 z-30 bg-[#0c0c10] border-t border-[#1f1f2c] px-2 sm:px-6 py-2 transition-colors"
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
              className={`flex flex-col items-center justify-center py-1 px-4 rounded-xl transition-colors cursor-pointer ${
                isActive
                  ? 'text-white font-bold'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] mt-1 font-medium">
                {isRTL ? tab.labelAr : tab.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
