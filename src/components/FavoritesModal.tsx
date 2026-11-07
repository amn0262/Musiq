import React, { useEffect } from 'react';
import { useMusic } from '../context/MusicContext';
import { Song } from '../types/music';
import { formatDuration } from '../utils/formatters';
import {
  X,
  Heart,
  Play,
  Pause,
  Shuffle,
  PlusCircle,
  Music,
} from 'lucide-react';

export const FavoritesModal: React.FC = () => {
  const {
    isFavoritesModalOpen,
    closeFavoritesModal,
    favorites,
    findSongById,
    currentSong,
    isPlaying,
    playSong,
    togglePlayPause,
    toggleFavorite,
    openAddToPlaylist,
  } = useMusic();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFavoritesModalOpen) {
        closeFavoritesModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFavoritesModalOpen, closeFavoritesModal]);

  if (!isFavoritesModalOpen) return null;

  const favoriteSongs = favorites
    .map((id) => findSongById(id))
    .filter((s): s is Song => Boolean(s));

  const handlePlayAll = (shuffle = false) => {
    if (favoriteSongs.length === 0) return;
    if (shuffle) {
      const randomIdx = Math.floor(Math.random() * favoriteSongs.length);
      playSong(favoriteSongs[randomIdx], favoriteSongs);
    } else {
      playSong(favoriteSongs[0], favoriteSongs);
    }
  };

  const handleSongClick = (song: Song) => {
    if (currentSong?.id === song.id || currentSong?.provider_track_id === song.provider_track_id) {
      togglePlayPause();
    } else {
      playSong(song, favoriteSongs);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="المفضلة"
    >
      <div className="relative w-full max-w-xl max-h-[85vh] bg-[#121218] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#161620]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">المقاطع المفضلة</h2>
              <p className="text-xs text-gray-400">{favoriteSongs.length} مقطع في المفضلة</p>
            </div>
          </div>

          <button
            onClick={closeFavoritesModal}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        {favoriteSongs.length > 0 && (
          <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePlayAll(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black text-xs font-bold hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>تشغيل الكل</span>
              </button>
              <button
                onClick={() => handlePlayAll(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-semibold hover:bg-white/15 transition-colors cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>خلط</span>
              </button>
            </div>
            <span className="text-xs text-gray-400 font-mono">
              إجمالي {favoriteSongs.length} مسار
            </span>
          </div>
        )}

        {/* Songs List (Zero images) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-1.5">
          {favoriteSongs.length === 0 ? (
            <div className="py-16 text-center text-gray-500 space-y-3">
              <Heart className="w-10 h-10 mx-auto text-gray-600 opacity-60" />
              <p className="text-sm font-semibold text-gray-300">لا توجد مقاطع مفضلة بعد</p>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                انقر على أيقونة القلب بجانب أي أغنية مشغلة أو مقترحة لإضافتها لقائمتك المفضلة
              </p>
            </div>
          ) : (
            favoriteSongs.map((song, index) => {
              const isCurrent =
                currentSong?.id === song.id ||
                currentSong?.provider_track_id === song.provider_track_id;

              return (
                <div
                  key={song.id}
                  className={`flex items-center justify-between p-3 rounded-xl transition-colors group border ${
                    isCurrent
                      ? 'bg-white/10 border-white/20'
                      : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/5'
                  }`}
                >
                  <div
                    onClick={() => handleSongClick(song)}
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                  >
                    <span className="w-6 text-xs text-gray-500 font-mono text-center flex-shrink-0">
                      {isCurrent && isPlaying ? (
                        <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4
                        className={`text-xs sm:text-sm font-semibold truncate ${
                          isCurrent ? 'text-white font-bold' : 'text-gray-200 group-hover:text-white'
                        }`}
                      >
                        {song.title}
                      </h4>
                      <p className="text-[11px] text-gray-400 truncate">{song.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-500 font-mono">
                      {formatDuration(song.duration)}
                    </span>

                    <button
                      onClick={() => openAddToPlaylist(song)}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                      title="إضافة لقائمة تشغيل"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => toggleFavorite(song.id)}
                      className="p-1.5 text-red-400 hover:text-gray-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                      title="إزالة من المفضلة"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
