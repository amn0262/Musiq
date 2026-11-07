import React from 'react';
import { MusicProvider, useMusic } from './context/MusicContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { FullScreenPlayer } from './components/FullScreenPlayer';
import { AddToPlaylistModal } from './components/AddToPlaylistModal';
import { SoundEnhancerModal } from './components/SoundEnhancerModal';
import { SearchModal } from './components/SearchModal';
import { PlaylistsModal } from './components/PlaylistsModal';
import { FavoritesModal } from './components/FavoritesModal';
import { QueueModal } from './components/QueueModal';
import { LyricsModal } from './components/LyricsModal';
import { HistoryModal } from './components/HistoryModal';
import { HomeScreen } from './screens/HomeScreen';

const AppContent: React.FC = () => {
  const { isSoundEnhancerOpen, closeSoundEnhancer } = useMusic();

  return (
    <div className="min-h-screen bg-[#0c0c10] text-[#f3f4f6] flex flex-col font-sans selection:bg-white selection:text-black">
      {/* Sleek Minimal Header */}
      <Header />

      {/* Main Content: Music Player is the Primary Screen (مشغل الموسيقى هو الواجهة الرئيسية) */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-6 pt-3 pb-24">
        <HomeScreen />
      </main>

      {/* Bottom Navigation Dock: Buttons to open each section as modal popup */}
      <BottomNav />

      {/* Section Popups (وباقي الأقسام تظهر بأزرار كنوافذ منبثقة) */}
      {/* 1. Quick Search Modal (البحث والكلمات المؤخرة) */}
      <SearchModal />

      {/* 2. Playlists Modal (قوائم التشغيل) */}
      <PlaylistsModal />

      {/* 3. Favorites Modal (المفضلة) */}
      <FavoritesModal />

      {/* 4. Queue / Up Next Modal (قائمة الانتظار) */}
      <QueueModal />

      {/* 5. Lyrics Modal (كلمات الأغنية) */}
      <LyricsModal />

      {/* 6. History Modal (سجل الاستماع) */}
      <HistoryModal />

      {/* 7. Add To Playlist Dialog */}
      <AddToPlaylistModal />

      {/* 8. Sound Effects & Equalizer Modal */}
      <SoundEnhancerModal isOpen={isSoundEnhancerOpen} onClose={closeSoundEnhancer} />

      {/* 9. Full Screen Player Modal (available for immersive fullscreen visualizer) */}
      <FullScreenPlayer />

      {/* Official YouTube Audio Stream Engine */}
      <div
        id="musiq-yt-player-container"
        className="fixed -bottom-24 -right-24 w-[240px] h-[140px] pointer-events-none opacity-[0.005] z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div id="musiq-yt-player" className="w-full h-full" />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <MusicProvider>
      <AppContent />
    </MusicProvider>
  );
}
