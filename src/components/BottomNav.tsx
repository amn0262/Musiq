import React from 'react';
import { useMusic } from '../context/MusicContext';
import {
  Disc3,
  Search,
  ListMusic,
  Heart,
  Sliders,
  FileText,
  History,
  Layers,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const {
    openSearchModal,
    openPlaylistsModal,
    openFavoritesModal,
    openQueueModal,
    openSoundEnhancer,
    openLyricsModal,
    openHistoryModal,
    favorites,
    queue,
    playlists,
  } = useMusic();

  const scrollToPlayer = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-[#0c0c10]/95 backdrop-blur-md border-t border-[#1f1f2c] px-2 sm:px-4 py-2 transition-colors"
      aria-label="Navigation Actions"
    >
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
        {/* Button 1: Player (المشغل) */}
        <button
          onClick={scrollToPlayer}
          className="flex flex-col items-center justify-center py-1 px-2.5 sm:px-3 rounded-xl text-white hover:text-gray-200 transition-colors cursor-pointer flex-shrink-0"
          aria-label="مشغل الموسيقى"
          title="مشغل الموسيقى"
        >
          <Disc3 className="w-5 h-5 text-white" />
          <span className="text-[10px] sm:text-[11px] mt-0.5 font-bold">المشغل</span>
        </button>

        {/* Button 2: Quick Search (البحث) */}
        <button
          onClick={() => openSearchModal()}
          className="flex flex-col items-center justify-center py-1 px-2.5 sm:px-3 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer flex-shrink-0"
          aria-label="بحث في الموسيقى"
          title="بحث في الموسيقى"
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] sm:text-[11px] mt-0.5 font-medium">بحث</span>
        </button>

        {/* Button 3: Playlists (قوائم التشغيل) */}
        <button
          onClick={openPlaylistsModal}
          className="relative flex flex-col items-center justify-center py-1 px-2.5 sm:px-3 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer flex-shrink-0"
          aria-label="قوائم التشغيل"
          title="قوائم التشغيل"
        >
          <ListMusic className="w-5 h-5" />
          <span className="text-[10px] sm:text-[11px] mt-0.5 font-medium">القوائم</span>
          {playlists.length > 0 && (
            <span className="absolute top-0.5 right-2 w-1.5 h-1.5 rounded-full bg-white/60" />
          )}
        </button>

        {/* Button 4: Favorites (المفضلة) */}
        <button
          onClick={openFavoritesModal}
          className="relative flex flex-col items-center justify-center py-1 px-2.5 sm:px-3 rounded-xl text-gray-400 hover:text-red-400 transition-colors cursor-pointer flex-shrink-0"
          aria-label="المفضلة"
          title="المفضلة"
        >
          <Heart className="w-5 h-5" />
          <span className="text-[10px] sm:text-[11px] mt-0.5 font-medium">المفضلة</span>
          {favorites.length > 0 && (
            <span className="absolute top-0.5 right-2 text-[9px] px-1 py-0.2 rounded-full bg-red-500/80 text-white font-mono">
              {favorites.length}
            </span>
          )}
        </button>

        {/* Button 5: Queue / Up Next (الانتظار) */}
        <button
          onClick={openQueueModal}
          className="relative flex flex-col items-center justify-center py-1 px-2.5 sm:px-3 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer flex-shrink-0"
          aria-label="قائمة الانتظار"
          title="قائمة الانتظار"
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] sm:text-[11px] mt-0.5 font-medium">الانتظار</span>
          {queue.length > 0 && (
            <span className="absolute top-0.5 right-2 text-[9px] px-1 py-0.2 rounded-full bg-white/20 text-white font-mono">
              {queue.length}
            </span>
          )}
        </button>

        {/* Button 6: Sound Effects / Equalizer (المؤثرات) */}
        <button
          onClick={openSoundEnhancer}
          className="flex flex-col items-center justify-center py-1 px-2.5 sm:px-3 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer flex-shrink-0"
          aria-label="المؤثرات"
          title="مؤثرات الصوت والمعادل"
        >
          <Sliders className="w-5 h-5" />
          <span className="text-[10px] sm:text-[11px] mt-0.5 font-medium">المؤثرات</span>
        </button>

        {/* Button 7: Lyrics (الكلمات) */}
        <button
          onClick={openLyricsModal}
          className="flex flex-col items-center justify-center py-1 px-2.5 sm:px-3 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer flex-shrink-0"
          aria-label="كلمات الأغنية"
          title="كلمات الأغنية"
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px] sm:text-[11px] mt-0.5 font-medium">الكلمات</span>
        </button>

        {/* Button 8: History (السجل) */}
        <button
          onClick={openHistoryModal}
          className="flex flex-col items-center justify-center py-1 px-2.5 sm:px-3 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer flex-shrink-0"
          aria-label="سجل الاستماع"
          title="سجل الاستماع"
        >
          <History className="w-5 h-5" />
          <span className="text-[10px] sm:text-[11px] mt-0.5 font-medium">السجل</span>
        </button>
      </div>
    </nav>
  );
};
