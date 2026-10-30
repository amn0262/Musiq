import React from 'react';
import { useMusic } from '../context/MusicContext';
import { Play, Pause, SkipForward, SkipBack, Heart, Maximize2, Radio, Sparkles, Sliders } from 'lucide-react';

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
    openSoundEnhancer,
    soundEnhancerPreset,
    soundEnhancerEnabled,
    isFavorite,
    toggleFavorite,
    isRTL,
    playbackMode,
  } = useMusic();

  if (!currentSong) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isFav = isFavorite(currentSong.id);

  return (
    <div className="fixed bottom-16 sm:bottom-20 left-0 right-0 z-40 px-2 sm:px-4 pointer-events-none">
      <div className="max-w-4xl mx-auto pointer-events-auto">
        <div className="relative bg-[#161622]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden transition-all duration-300 hover:border-purple-500/40">
          {/* Top Edge Progress Indicator */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 transition-all duration-150"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>

          <div className="flex items-center justify-between p-2.5 sm:p-3 gap-2 sm:gap-4">
            {/* Song Info & Artwork -> Opens Full Player */}
            <button
              onClick={openFullScreenPlayer}
              className="flex items-center gap-3 min-w-0 text-left flex-1 group"
              aria-label="Open Full Player"
            >
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                <img
                  src={currentSong.artwork_url}
                  alt={currentSong.title}
                  className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${
                    isPlaying ? 'brightness-105' : 'brightness-90'
                  }`}
                />
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="flex items-end gap-0.5 h-3">
                      <span className="w-1 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s] h-3" />
                      <span className="w-1 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s] h-2" />
                      <span className="w-1 bg-purple-300 rounded-full animate-bounce h-3" />
                    </div>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                    {isRTL && currentSong.titleAr ? currentSong.titleAr : currentSong.title}
                  </h4>
                  {playbackMode === 'youtube' && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-red-600/20 text-red-400 border border-red-500/30 flex-shrink-0">
                      YT
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {isRTL && currentSong.artistAr ? currentSong.artistAr : currentSong.artist}
                </p>
              </div>
            </button>

            {/* Quick Actions & Playback Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {/* Sound Enhancer Trigger */}
              <button
                onClick={openSoundEnhancer}
                className={`p-2 rounded-full transition-all ${
                  soundEnhancerEnabled
                    ? 'text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 border border-cyan-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Sound Enhancer & Lock Screen Controls"
                aria-label="Sound Enhancer and Lock Screen Controls"
              >
                <Sliders className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>

              {/* Favorite Button */}
              <button
                onClick={() => toggleFavorite(currentSong.id)}
                className={`p-2 rounded-full transition-colors ${
                  isFav
                    ? 'text-pink-500 hover:text-pink-400'
                    : 'text-gray-400 hover:text-white'
                }`}
                aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isFav ? 'fill-pink-500' : ''}`} />
              </button>

              {/* Prev Track */}
              <button
                onClick={prevTrack}
                className="p-2 text-gray-300 hover:text-white transition-colors active:scale-95 hidden xs:block"
                aria-label="Previous track"
              >
                <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Play / Pause Button with Glow */}
              <button
                onClick={togglePlayPause}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-purple-600/40 hover:shadow-purple-600/60 transition-all active:scale-90"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                ) : (
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white ms-0.5" />
                )}
              </button>

              {/* Next Track */}
              <button
                onClick={nextTrack}
                className="p-2 text-gray-300 hover:text-white transition-colors active:scale-95"
                aria-label="Next track"
              >
                <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Open Full Player Icon */}
              <button
                onClick={openFullScreenPlayer}
                className="p-2 text-gray-400 hover:text-white transition-colors hidden sm:block"
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
