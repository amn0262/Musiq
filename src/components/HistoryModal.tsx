import React, { useEffect } from 'react';
import { useMusic } from '../context/MusicContext';
import { Song } from '../types/music';
import { formatDuration } from '../utils/formatters';
import {
  X,
  History,
  Play,
  Pause,
  Trash2,
  PlusCircle,
  Heart,
  Music,
} from 'lucide-react';

export const HistoryModal: React.FC = () => {
  const {
    isHistoryModalOpen,
    closeHistoryModal,
    recentlyPlayed,
    clearHistory,
    currentSong,
    isPlaying,
    playSong,
    togglePlayPause,
    isFavorite,
    toggleFavorite,
    openAddToPlaylist,
  } = useMusic();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isHistoryModalOpen) {
        closeHistoryModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHistoryModalOpen, closeHistoryModal]);

  if (!isHistoryModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="سجل الاستماع"
    >
      <div className="relative w-full max-w-xl max-h-[85vh] bg-[#121218] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#161620]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">سجل المقاطع المشغلة</h2>
              <p className="text-xs text-gray-400">{recentlyPlayed.length} مقطع في السجل</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {recentlyPlayed.length > 0 && (
              <button
                onClick={clearHistory}
                className="px-2.5 py-1 text-xs text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              >
                مسح السجل
              </button>
            )}
            <button
              onClick={closeHistoryModal}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List of Recently Played (Zero images) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-1.5">
          {recentlyPlayed.length === 0 ? (
            <div className="py-16 text-center text-gray-500 space-y-3">
              <History className="w-10 h-10 mx-auto text-gray-600 opacity-60" />
              <p className="text-sm font-semibold text-gray-300">السجل فارغ حالياً</p>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                أي مقطع تقوم بالاستماع إليه سيتم تسجيله هنا تلقائياً لسرعة العودة إليه
              </p>
            </div>
          ) : (
            recentlyPlayed.map((song, index) => {
              const isCurrent =
                currentSong?.id === song.id ||
                currentSong?.provider_track_id === song.provider_track_id;
              const isFav = isFavorite(song.id);

              return (
                <div
                  key={`${song.id}-${index}`}
                  className={`flex items-center justify-between p-3 rounded-xl transition-colors group border ${
                    isCurrent
                      ? 'bg-white/10 border-white/20'
                      : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/5'
                  }`}
                >
                  <div
                    onClick={() => {
                      if (isCurrent) {
                        togglePlayPause();
                      } else {
                        playSong(song, recentlyPlayed);
                      }
                    }}
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
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isFav
                          ? 'text-red-400 hover:text-gray-400'
                          : 'text-gray-500 hover:text-red-400 hover:bg-white/10'
                      }`}
                      title={isFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
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
