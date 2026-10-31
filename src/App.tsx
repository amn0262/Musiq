import React from 'react';
import { MusicProvider, useMusic } from './context/MusicContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { MiniPlayer } from './components/MiniPlayer';
import { FullScreenPlayer } from './components/FullScreenPlayer';
import { AddToPlaylistModal } from './components/AddToPlaylistModal';
import { SearchScreen } from './screens/SearchScreen';
import { PlaylistsScreen } from './screens/PlaylistsScreen';
import { LibraryScreen } from './screens/LibraryScreen';

const AppContent: React.FC = () => {
  const { activeTab } = useMusic();

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-[#f3f4f6] flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Sleek Minimal Header */}
      <Header />

      {/* Main Content: Search Box & YouTube Discovery, Playlists, or Favorites */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-6 pt-4">
        {activeTab === 'playlists' ? (
          <PlaylistsScreen />
        ) : activeTab === 'library' ? (
          <LibraryScreen />
        ) : (
          <SearchScreen />
        )}
      </main>

      {/* Integrated Music Player: Persistent Floating Mini Player */}
      <MiniPlayer />

      {/* Minimal Navigation: Search, Playlists, Favorites */}
      <BottomNav />

      {/* Integrated Music Player: Full-Screen Player Modal */}
      <FullScreenPlayer />

      {/* Add To Playlist Dialog */}
      <AddToPlaylistModal />

      {/* Official YouTube Audio Stream Engine: Off-screen unthrottled audio decoding */}
      <div
        id="musiq-yt-player-container"
        className="fixed -top-[9999px] -left-[9999px] w-[320px] h-[240px] pointer-events-none opacity-100 -z-50"
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
