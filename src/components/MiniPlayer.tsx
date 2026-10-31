import React from 'react';
import { useMusic } from '../context/MusicContext';
import { Play, Pause, SkipForward, SkipBack, Heart, Maximize2, Music } from 'lucide-react';

export const MiniPlayer: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    togglePlayPause,
    nextTrack,
    prevTrack,
    openFullScreenPlayer,
    isFavorite,
    toggleFavorite,
    isRTL,
  } = useMusic();

  if (!currentSong) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isFav = isFavorite(currentSong.id);

  return (
    <div className="fixed bottom-16 sm:bottom-20 left-0 right-0 z-40 px-2 sm:px-4 pointer-events-none">
      <div className="max-w-4xl mx-auto pointer-events-auto">
        <div className="relative bg-[#14141c] border border-[#262638] rounded-xl shadow-2xl overflow-hidden">
          {/* Top Edge Progress Indicator */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10">
            <div
              className="h-full bg-white transition-all duration-150"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>

          <div className="flex items-center justify-between p-2.5 sm:p-3 gap-2 sm:gap-4">
            {/* Song Info -> Opens Full Player (No Thumbnail Image) */}
            <button
              onClick={openFullScreenPlayer}
              className="flex items-center gap-3 min-w-0 text-left flex-1 group cursor-pointer"
              aria-label="Open Full Player"
            >
              {/* Minimal Audio Icon Box instead of Image */}
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border transition-colors ${
                  isPlaying
                    ? 'bg-white text-black border-white'
                    : 'bg-white/5 border-white/10 text-gray-300'
                }`}
              >
                <Music className="w-4 h-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white truncate group-hover:text-gray-300 transition-colors">
                    {isRTL && currentSong.titleAr ? currentSong.titleAr : currentSong.title}
                  </h4>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/10 text-gray-300 flex-shrink-0">
                    {isRTL ? 'يوتيوب' : 'YouTube'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {isRTL && currentSong.artistAr ? currentSong.artistAr : currentSong.artist}
                </p>
              </div>
            </button>

            {/* Controls */}
            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
              {/* Favorite Button */}
              <button
                onClick={() => toggleFavorite(currentSong.id)}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  isFav ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
                aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
              </button>

              {/* Prev Track */}
              <button
                onClick={prevTrack}
                className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer hidden xs:block"
                aria-label="Previous track"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              {/* Play / Pause Button */}
              <button
                onClick={togglePlayPause}
                className="w-9 h-9 rounded-lg bg-white text-black hover:bg-gray-200 flex items-center justify-center font-bold transition-transform active:scale-95 cursor-pointer shadow"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ms-0.5" />
                )}
              </button>

              {/* Next Track */}
              <button
                onClick={nextTrack}
                className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Next track"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              {/* Open Full Player */}
              <button
                onClick={openFullScreenPlayer}
                className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer hidden sm:block"
                aria-label="Expand player"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
