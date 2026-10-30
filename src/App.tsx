import React from 'react';
import { MusicProvider, useMusic } from './context/MusicContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { MiniPlayer } from './components/MiniPlayer';
import { FullScreenPlayer } from './components/FullScreenPlayer';
import { AddToPlaylistModal } from './components/AddToPlaylistModal';
import { SoundEnhancerModal } from './components/SoundEnhancerModal';
import { OnboardingModal } from './components/OnboardingModal';
import { HomeScreen } from './screens/HomeScreen';
import { SearchScreen } from './screens/SearchScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { PlaylistsScreen } from './screens/PlaylistsScreen';
import { SettingsScreen } from './screens/SettingsScreen';

const AppContent: React.FC = () => {
  const { activeTab, isSoundEnhancerOpen, closeSoundEnhancer } = useMusic();

  return (
    <div className="min-h-screen bg-[#101014] text-[#f3f4f6] flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Top Header */}
      <Header />

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-5">
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'search' && <SearchScreen />}
        {activeTab === 'library' && <LibraryScreen />}
        {activeTab === 'playlists' && <PlaylistsScreen />}
        {activeTab === 'settings' && <SettingsScreen />}
      </main>

      {/* Floating Mini Player */}
      <MiniPlayer />

      {/* Pinned Bottom Navigation */}
      <BottomNav />

      {/* Full-Screen Detailed Player Modal */}
      <FullScreenPlayer />

      {/* Add To Playlist Dialog */}
      <AddToPlaylistModal />

      {/* Sound Enhancer & Lock Screen Audio Modal */}
      <SoundEnhancerModal isOpen={isSoundEnhancerOpen} onClose={closeSoundEnhancer} />

      {/* First-Launch Welcome Onboarding & Guided App Tour */}
      <OnboardingModal />

      {/* Persistent Official YouTube Player Anchor for Real Background & Silent Playback */}
      <div
        id="musiq-yt-player-container"
        className="fixed -top-[9999px] -left-[9999px] w-1 h-1 overflow-hidden pointer-events-none opacity-0"
        aria-hidden="true"
      >
        <div id="musiq-yt-player" />
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
