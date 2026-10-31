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
    <div className="min-h-screen bg-[#0c0c10] text-[#f3f4f6] flex flex-col font-sans selection:bg-white selection:text-black">
      {/* Sleek Minimal Header */}
      <Header />

      {/* Main Content: Search & YouTube Streaming, Playlists, or Favorites */}
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

      {/* Official YouTube Audio Stream Engine: In-viewport non-throttled audio playback */}
      <div
        id="musiq-yt-player-container"
        className="fixed bottom-0 right-0 w-1 h-1 pointer-events-none opacity-[0.01] z-0 overflow-hidden"
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
