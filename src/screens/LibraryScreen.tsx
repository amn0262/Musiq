import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { Song } from '../types/music';
import { formatDuration } from '../utils/formatters';
import {
  Heart,
  ListMusic,
  History,
  Play,
  Pause,
  Trash2,
  PlusCircle,
  Music,
} from 'lucide-react';

type LibraryTab = 'favorites' | 'history' | 'playlists';

export const LibraryScreen: React.FC = () => {
  const {
    favorites,
    recentlyPlayed,
    playlists,
    findSongById,
    currentSong,
    isPlaying,
    playSong,
    togglePlayPause,
    toggleFavorite,
    clearHistory,
    setActiveTab,
    openAddToPlaylist,
  } = useMusic();

  const [activeSubTab, setActiveSubTab] = useState<LibraryTab>('favorites');

  const favoriteSongs = favorites
    .map((id) => findSongById(id))
    .filter((s): s is Song => Boolean(s));

  const handleSongPlay = (song: Song, queueToUse: Song[]) => {
    if (currentSong?.id === song.id || currentSong?.provider_track_id === song.provider_track_id) {
      togglePlayPause();
    } else {
      playSong(song, queueToUse);
    }
  };

  const tabs: { id: LibraryTab; label: string; count: number; icon: React.ElementType }[] = [
    { id: 'favorites', label: 'Favorites', count: favoriteSongs.length, icon: Heart },
    { id: 'playlists', label: 'Playlists', count: playlists.length, icon: ListMusic },
    { id: 'history', label: 'History', count: recentlyPlayed.length, icon: History },
  ];

  return (
    <div className="space-y-4 pb-32">
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-white">Library</h1>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-colors cursor-pointer ${
                isActive
                  ? 'bg-white text-black'
                  : 'bg-[#14141c] hover:bg-[#1a1a24] text-gray-300 border border-[#242434]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded ${isActive ? 'bg-black/10' : 'bg-white/10'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Favorite Songs */}
      {activeSubTab === 'favorites' && (
        <div className="space-y-1.5">
          {favoriteSongs.length === 0 ? (
            <div className="text-center py-14 bg-[#121217] rounded-xl border border-[#22222e] space-y-2">
              <Heart className="w-8 h-8 text-gray-600 mx-auto" />
              <p className="text-sm font-semibold text-gray-400">
                No favorites yet
              </p>
            </div>
          ) : (
            favoriteSongs.map((song) => {
              const isCurrent =
                currentSong?.id === song.id || currentSong?.provider_track_id === song.provider_track_id;
              const isSongPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={`fav-${song.id}`}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                    isCurrent
                      ? 'bg-[#1c1c28] border-gray-400 text-white'
                      : 'bg-[#121217] hover:bg-[#181822] border-[#22222e] text-gray-300'
                  }`}
                >
                  <button
                    onClick={() => handleSongPlay(song, favoriteSongs)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                        isCurrent ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-gray-400'
                      }`}
                    >
                      {isSongPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ms-0.5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold truncate ${isCurrent ? 'text-white font-bold' : 'text-gray-200'}`}>
                        {song.title}
                      </p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {song.artist}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-1.5 ms-2 flex-shrink-0">
                    <span className="text-xs text-gray-500 font-mono hidden sm:inline">
                      {formatDuration(song.duration)}
                    </span>
                    <button
                      onClick={() => toggleFavorite(song.id)}
                      className="p-1.5 text-white hover:text-gray-300 transition-colors cursor-pointer"
                      title="Remove from favorites"
                      aria-label="Remove from favorites"
                    >
                      <Heart className="w-4 h-4 fill-white" />
                    </button>
                    <button
                      onClick={() => openAddToPlaylist(song)}
                      className="p-1.5 text-gray-500 hover:text-gray-300 cursor-pointer"
                      aria-label="Add to playlist"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Playlists Quick Jump */}
      {activeSubTab === 'playlists' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => setActiveTab('playlists')}
              className="flex items-center gap-3 p-3 rounded-xl bg-[#121217] hover:bg-[#181822] border border-[#22222e] cursor-pointer transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-gray-300">
                <ListMusic className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{pl.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {pl.song_ids.length} songs
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Listening History */}
      {activeSubTab === 'history' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between pb-1">
            <p className="text-xs text-gray-400">
              {recentlyPlayed.length} tracks
            </p>
            {recentlyPlayed.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-xs font-semibold text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            {recentlyPlayed.map((song, idx) => (
              <div
                key={`hist-${song.id}-${idx}`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#121217] hover:bg-[#181822] border border-[#22222e]"
              >
                <button
                  onClick={() => handleSongPlay(song, recentlyPlayed)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-gray-400">
                    <Music className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">
                      {song.title}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {song.artist}
                    </p>
                  </div>
                </button>
                <span className="text-xs text-gray-500 font-mono">
                  {formatDuration(song.duration)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
