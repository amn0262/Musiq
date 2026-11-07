import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { Music, Info, Sliders, Search, ListMusic, Heart } from 'lucide-react';
import { DeveloperInfoModal } from './DeveloperInfoModal';

export const Header: React.FC = () => {
  const {
    setActiveTab,
    openSoundEnhancer,
    soundEnhancerEnabled,
    openSearchModal,
    openPlaylistsModal,
    openFavoritesModal,
  } = useMusic();
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-[#0c0c10] border-b border-[#1f1f2c] px-4 sm:px-6 py-3 transition-colors">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 group text-left transition-transform active:scale-95 cursor-pointer"
            aria-label="MUSIQ"
          >
            <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-bold shadow-sm">
              <Music className="w-4 h-4 text-black" />
            </div>
            <span className="text-base font-bold tracking-wider text-white">
              MUSIQ
            </span>
          </button>

          {/* Right: Section Modal Trigger Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Search Modal Button */}
            <button
              onClick={() => openSearchModal()}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-semibold transition-colors cursor-pointer"
              aria-label="بحث في الموسيقى"
              title="بحث (الكلمات المؤخرة)"
            >
              <Search className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs">بحث</span>
            </button>

            {/* Playlists Modal Button */}
            <button
              onClick={openPlaylistsModal}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="قوائم التشغيل"
              title="قوائم التشغيل"
            >
              <ListMusic className="w-4 h-4" />
            </button>

            {/* Favorites Modal Button */}
            <button
              onClick={openFavoritesModal}
              className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="المفضلة"
              title="المفضلة"
            >
              <Heart className="w-4 h-4" />
            </button>

            {/* Sound Enhancer / Equalizer Modal Button */}
            <button
              onClick={openSoundEnhancer}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                soundEnhancerEnabled ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              aria-label="مؤثرات الصوت والمعادل"
              title="مؤثرات الصوت والمعادل"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Info */}
            <button
              onClick={() => setIsInfoOpen(true)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="معلومات التطبيق"
              title="معلومات التطبيق"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <DeveloperInfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
    </>
  );
};
