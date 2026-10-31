import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMusic } from '../context/MusicContext';
import { formatDuration, formatRemaining } from '../utils/formatters';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  ListMusic,
  FileText,
  Volume2,
  VolumeX,
  PlusCircle,
  Trash2,
  Info,
  Sliders,
} from 'lucide-react';
import { AudioWaveLine } from './AudioWaveLine';
import { DeveloperInfoModal } from './DeveloperInfoModal';

export const FullScreenPlayer: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isShuffled,
    repeatMode,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seekTo,
    setVolume,
    toggleShuffle,
    cycleRepeatMode,
    isFavorite,
    toggleFavorite,
    openAddToPlaylist,
    isFullScreenPlayerOpen,
    closeFullScreenPlayer,
    queue,
    queueIndex,
    playSong,
    removeFromQueue,
    openSoundEnhancer,
    soundEnhancerEnabled,
    isSoundEnhancerOpen,
    t,
  } = useMusic();

  const [activeTab, setActiveTab] = useState<'cover' | 'lyrics' | 'queue'>('cover');
  const [prevVolume, setPrevVolume] = useState<number>(0.8);
  const [isIdle, setIsIdle] = useState<boolean>(false);
  const [isDevInfoOpen, setIsDevInfoOpen] = useState<boolean>(false);
  const idleTimerRef = useRef<number | null>(null);

  // 5-second inactivity timer to hide all controls except the animated soundwave line
  const resetIdleTimer = useCallback(() => {
    setIsIdle(false);
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }

    // Only set idle countdown if modal is closed
    if (!isDevInfoOpen && !isSoundEnhancerOpen) {
      idleTimerRef.current = window.setTimeout(() => {
        setIsIdle(true);
      }, 5000);
    }
  }, [isDevInfoOpen, isSoundEnhancerOpen]);

  useEffect(() => {
    if (!isFullScreenPlayerOpen) {
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      setIsIdle(false);
      return;
    }

    resetIdleTimer();

    const handleUserActivity = () => {
      resetIdleTimer();
    };

    window.addEventListener('touchstart', handleUserActivity, { passive: true });
    window.addEventListener('touchmove', handleUserActivity, { passive: true });
    window.addEventListener('touchend', handleUserActivity, { passive: true });
    window.addEventListener('mousedown', handleUserActivity);
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);

    return () => {
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('touchmove', handleUserActivity);
      window.removeEventListener('touchend', handleUserActivity);
      window.removeEventListener('mousedown', handleUserActivity);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
    };
  }, [isFullScreenPlayerOpen, resetIdleTimer]);

  if (!isFullScreenPlayerOpen || !currentSong) return null;

  const isFav = isFavorite(currentSong.id);

  const handleMuteToggle = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume || 0.8);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    seekTo(target);
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Full screen music player"
        onPointerDown={resetIdleTimer}
        onTouchStart={resetIdleTimer}
        onClick={resetIdleTimer}
        className={`fixed inset-0 z-50 bg-[#0c0c10] flex flex-col justify-between overflow-hidden text-white transition-all duration-300 select-none ${
          isIdle ? 'cursor-none' : ''
        }`}
      >
        {/* Top Header Bar (Fades out when idle for 5s) */}
        <div
          className={`relative z-20 px-4 sm:px-6 py-4 flex items-center justify-between border-b border-[#1f1f2c] transition-opacity duration-700 ${
            isIdle ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeFullScreenPlayer();
            }}
            className="p-2 -m-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Minimize full player"
          >
            <ChevronDown className="w-6 h-6" />
          </button>

          <div className="text-center">
            <p className="text-[11px] font-bold tracking-wider uppercase text-gray-400">
              Now Playing
            </p>
            <p className="text-xs text-gray-300 font-medium truncate max-w-[200px] sm:max-w-xs">
              {currentSong.album || 'Single'}
            </p>
          </div>

          {/* Right: Sound Effects & Developer Info */}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openSoundEnhancer();
              }}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                soundEnhancerEnabled ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              aria-label="Sound Effects & Equalizer"
              title="Sound Effects & Equalizer"
            >
              <Sliders className="w-4 h-4" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDevInfoOpen(true);
              }}
              className="p-2 -m-1 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Developer Information"
              title="Developer Info"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Center Content (Tabs: Audio Waveform Line, Lyrics, Queue) */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-4 overflow-y-auto no-scrollbar">
          {/* Tab 1: Horizontal Audio Wave Line & Song Meta */}
          {activeTab === 'cover' && (
            <div className="w-full max-w-3xl flex flex-col items-center justify-center my-auto">
              {/* Dynamic Horizontal Wave Line (Always Visible, moves L to R based on audio) */}
              <div className="w-full flex items-center justify-center my-2 sm:my-4">
                <AudioWaveLine isPlaying={isPlaying} className="w-full" />
              </div>

              {/* Song Meta Title & Artist (Fades out when idle) */}
              <div
                className={`w-full text-center mt-2 transition-opacity duration-700 ${
                  isIdle ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
              >
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate px-4">
                  {currentSong.title}
                </h2>
                <p className="text-sm sm:text-base text-gray-400 font-medium mt-1 truncate px-4">
                  {currentSong.artist}
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Lyrics View */}
          {activeTab === 'lyrics' && (
            <div
              className={`w-full max-w-lg h-72 sm:h-96 overflow-y-auto no-scrollbar p-6 bg-[#13131c] rounded-2xl border border-[#222230] text-center flex flex-col justify-center transition-opacity duration-700 ${
                isIdle ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
                Lyrics
              </h3>
              {currentSong.lyrics && (
                <div className="space-y-1.5 text-sm sm:text-base text-gray-300">
                  {currentSong.lyrics.split('\n').map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
              )}
              {currentSong.lyricsAr && !currentSong.lyrics && (
                <div className="space-y-1.5 text-sm sm:text-base text-gray-300">
                  {currentSong.lyricsAr.split('\n').map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
              )}
              {!currentSong.lyrics && !currentSong.lyricsAr && (
                <p className="text-gray-500 text-sm">
                  No lyrics available
                </p>
              )}
            </div>
          )}

          {/* Tab 3: Queue Drawer */}
          {activeTab === 'queue' && (
            <div
              className={`w-full max-w-lg h-72 sm:h-96 overflow-y-auto no-scrollbar p-4 bg-[#13131c] rounded-2xl border border-[#222230] flex flex-col transition-opacity duration-700 ${
                isIdle ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#222230] mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Up Next ({queue.length})
                </h3>
              </div>

              <div className="space-y-1.5 overflow-y-auto flex-1">
                {queue.map((song, idx) => {
                  const isCurrent = idx === queueIndex;
                  return (
                    <div
                      key={`${song.id}-${idx}`}
                      className={`flex items-center justify-between p-2 rounded-xl border transition-colors ${
                        isCurrent
                          ? 'bg-[#1c1c28] border-gray-400 text-white'
                          : 'bg-[#121217] border-transparent text-gray-300 hover:bg-[#181822]'
                      }`}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playSong(song, queue);
                        }}
                        className="flex items-center gap-2.5 text-left flex-1 min-w-0 cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-xs font-mono text-gray-400">
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm truncate ${isCurrent ? 'font-bold text-white' : ''}`}>
                            {song.title}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {song.artist}
                          </p>
                        </div>
                      </button>

                      <div className="flex items-center gap-1.5 ms-2">
                        <span className="text-xs text-gray-500 font-mono">
                          {formatDuration(song.duration)}
                        </span>
                        {queue.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromQueue(idx);
                            }}
                            className="p-1 text-gray-500 hover:text-white transition-colors cursor-pointer"
                            aria-label={`Remove ${song.title} from queue`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Controls Section (Fades out when idle for 5s) */}
        <div
          className={`relative z-20 w-full max-w-xl mx-auto px-6 pb-6 pt-2 transition-opacity duration-700 ${
            isIdle ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* Progress Bar & Timestamps */}
          <div className="w-full mb-3">
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.5"
              value={currentTime}
              onChange={handleSeekChange}
              className="w-full accent-white"
              aria-label="Track progress slider"
            />
            <div className="flex justify-between items-center text-xs text-gray-400 font-mono mt-1 px-1">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatRemaining(currentTime, duration)}</span>
            </div>
          </div>

          {/* Primary Controls */}
          <div className="flex items-center justify-between gap-4 py-2">
            {/* Shuffle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleShuffle();
              }}
              className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
                isShuffled ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white'
              }`}
              aria-label={isShuffled ? 'Disable Shuffle' : 'Enable Shuffle'}
            >
              <Shuffle className="w-5 h-5" />
            </button>

            {/* Previous Track */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevTrack();
              }}
              className="p-3 text-gray-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Previous track"
            >
              <SkipBack className="w-6 h-6" />
            </button>

            {/* Main Play / Pause Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
              className="w-14 h-14 rounded-2xl bg-white text-black hover:bg-gray-200 flex items-center justify-center font-bold shadow-lg transition-transform active:scale-95 cursor-pointer"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ms-0.5" />
              )}
            </button>

            {/* Next Track */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextTrack();
              }}
              className="p-3 text-gray-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Next track"
            >
              <SkipForward className="w-6 h-6" />
            </button>

            {/* Repeat Mode */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                cycleRepeatMode();
              }}
              className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
                repeatMode !== 'off' ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white'
              }`}
              aria-label={`Cycle repeat mode, currently ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
            </button>
          </div>

          {/* Auxiliary Controls */}
          <div className="flex items-center justify-between pt-3 border-t border-[#1f1f2c] gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(currentSong.id);
              }}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isFav ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
              aria-label="Favorite"
            >
              <Heart className={`w-5 h-5 ${isFav ? 'fill-white' : ''}`} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                openAddToPlaylist(currentSong);
              }}
              className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
              aria-label={t('player_add_playlist')}
            >
              <PlusCircle className="w-5 h-5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab(activeTab === 'lyrics' ? 'cover' : 'lyrics');
              }}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'lyrics' ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white'
              }`}
              aria-label={t('player_lyrics')}
            >
              <FileText className="w-5 h-5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab(activeTab === 'queue' ? 'cover' : 'queue');
              }}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'queue' ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white'
              }`}
              aria-label={t('player_queue')}
            >
              <ListMusic className="w-5 h-5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                openSoundEnhancer();
              }}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                soundEnhancerEnabled ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white'
              }`}
              aria-label="Sound Effects & Equalizer"
              title="Sound Effects & Equalizer"
            >
              <Sliders className="w-5 h-5" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2 flex-1 max-w-[130px] ms-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMuteToggle();
                }}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                aria-label={volume === 0 ? 'Unmute' : 'Mute'}
              >
                {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => {
                  e.stopPropagation();
                  setVolume(parseFloat(e.target.value));
                }}
                className="w-full h-1 accent-white"
                aria-label="Volume slider"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Developer Information Modal (Aymen Bakkour) */}
      <DeveloperInfoModal isOpen={isDevInfoOpen} onClose={() => setIsDevInfoOpen(false)} />
    </>
  );
};
