import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { Song } from '../types/music';
import { POPULAR_ARTISTS } from '../data/catalog';
import { formatDuration } from '../utils/formatters';
import {
  Heart,
  ListMusic,
  History,
  User,
  Disc,
  Play,
  Pause,
  Trash2,
  PlusCircle,
} from 'lucide-react';

type LibraryTab = 'favorites' | 'history' | 'artists' | 'playlists';

export const LibraryScreen: React.FC = () => {
  const {
    favorites,
    recentlyPlayed,
    playlists,
    findSongById,
    allSongs,
    currentSong,
    isPlaying,
    playSong,
    togglePlayPause,
    toggleFavorite,
    clearHistory,
    setActiveTab,
    openAddToPlaylist,
    isRTL,
    t,
  } = useMusic();

  const [activeSubTab, setActiveSubTab] = useState<LibraryTab>('favorites');

  const favoriteSongs = favorites
    .map((id) => findSongById(id))
    .filter((s): s is Song => Boolean(s));

  const handleSongPlay = (song: Song, queueToUse: Song[]) => {
    if (currentSong?.id === song.id) {
      togglePlayPause();
    } else {
      playSong(song, queueToUse);
    }
  };

  const tabs: { id: LibraryTab; labelKey: string; count: number; icon: React.ElementType }[] = [
    { id: 'favorites', labelKey: 'library_favorites', count: favoriteSongs.length, icon: Heart },
    { id: 'playlists', labelKey: 'nav_playlists', count: playlists.length, icon: ListMusic },
    { id: 'history', labelKey: 'library_history', count: recentlyPlayed.length, icon: History },
    { id: 'artists', labelKey: 'library_artists', count: POPULAR_ARTISTS.length, icon: User },
  ];

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">{t('library_title')}</h1>
        <p className="text-xs text-gray-400 mt-1">
          {isRTL ? 'كل ما تحبه وتستمع إليه في مكان واحد' : 'Your saved music, history and favorite artists'}
        </p>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold flex-shrink-0 transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400'
                  : 'bg-[#1b1b28] hover:bg-[#252538] text-gray-300 border border-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t(tab.labelKey)}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Favorite Songs */}
      {activeSubTab === 'favorites' && (
        <div className="space-y-3">
          {favoriteSongs.length === 0 ? (
            <div className="text-center py-16 bg-[#161622]/40 rounded-3xl border border-white/5 space-y-2">
              <Heart className="w-12 h-12 text-gray-600 mx-auto" />
              <p className="text-sm text-gray-400">
                {isRTL ? 'لم تقم بإضافة أي أغاني للمفضلة بعد' : 'No favorite songs added yet'}
              </p>
              <p className="text-xs text-gray-500">
                {isRTL
                  ? 'اضغط على رمز القلب عند الاستماع لحفظ الأغنية هنا'
                  : 'Tap the heart icon while playing any song to save it here.'}
              </p>
            </div>
          ) : (
            favoriteSongs.map((song) => {
              const isCurrent = currentSong?.id === song.id;
              const isSongPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={`fav-${song.id}`}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-purple-950/30 border-purple-500/40'
                      : 'bg-[#161622] hover:bg-[#1d1d2c] border-white/5'
                  }`}
                >
                  <button
                    onClick={() => handleSongPlay(song, favoriteSongs)}
                    className="flex items-center gap-3.5 flex-1 min-w-0 text-left"
                  >
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={song.artwork_url}
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
                      <div
                        className={`absolute inset-0 bg-black/40 flex items-center justify-center ${
                          isSongPlaying ? 'opacity-100' : 'opacity-0 hover:opacity-100'
                        }`}
                      >
                        {isSongPlaying ? (
                          <Pause className="w-4 h-4 text-white fill-white" />
                        ) : (
                          <Play className="w-4 h-4 text-white fill-white ms-0.5" />
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-bold truncate ${isCurrent ? 'text-purple-300' : 'text-white'}`}>
                        {isRTL && song.titleAr ? song.titleAr : song.title}
                      </p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {isRTL && song.artistAr ? song.artistAr : song.artist}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 ms-2">
                    <span className="text-xs text-gray-400 font-mono">
                      {formatDuration(song.duration)}
                    </span>
                    <button
                      onClick={() => toggleFavorite(song.id)}
                      className="p-2 text-pink-500 hover:text-gray-400 transition-colors"
                      title="Remove from favorites"
                      aria-label="Remove from favorites"
                    >
                      <Heart className="w-4 h-4 fill-pink-500" />
                    </button>
                    <button
                      onClick={() => openAddToPlaylist(song)}
                      className="p-2 text-gray-400 hover:text-purple-300"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => setActiveTab('playlists')}
              className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#161622] hover:bg-[#1d1d2c] border border-white/5 cursor-pointer transition-all"
            >
              <img
                src={pl.cover_url}
                alt={pl.name}
                className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{pl.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {pl.song_ids.length} {t('playlist_songs_count')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Listening History */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {recentlyPlayed.length} {isRTL ? 'أغاني تم الاستماع لها مؤخراً' : 'recently played tracks'}
            </p>
            {recentlyPlayed.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isRTL ? 'مسح سجل الاستماع' : 'Clear History'}</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            {recentlyPlayed.map((song, idx) => (
              <div
                key={`hist-${song.id}-${idx}`}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#161622] hover:bg-[#1d1d2c] border border-white/5"
              >
                <button
                  onClick={() => handleSongPlay(song, recentlyPlayed)}
                  className="flex items-center gap-3.5 flex-1 min-w-0 text-left"
                >
                  <img
                    src={song.artwork_url}
                    alt={song.title}
                    className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate">
                      {isRTL && song.titleAr ? song.titleAr : song.title}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {isRTL && song.artistAr ? song.artistAr : song.artist}
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

      {/* Tab 4: Followed Artists */}
      {activeSubTab === 'artists' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {POPULAR_ARTISTS.map((artist) => (
            <div
              key={artist.id}
              className="p-4 rounded-3xl bg-[#161622] border border-white/5 flex flex-col items-center text-center group"
            >
              <div className="w-20 h-20 rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-purple-500 to-indigo-600 mb-3 group-hover:scale-105 transition-transform">
                <img
                  src={artist.avatar_url}
                  alt={artist.name}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <h4 className="text-sm font-bold text-white truncate w-full">
                {isRTL && artist.nameAr ? artist.nameAr : artist.name}
              </h4>
              <p className="text-xs text-gray-400 mt-0.5">
                {(artist.monthlyListeners / 1_000_000).toFixed(1)}M listeners
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
