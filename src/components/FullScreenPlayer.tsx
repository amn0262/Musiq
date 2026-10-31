import React, { useState } from 'react';
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
  Music,
  Trash2,
} from 'lucide-react';

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
    t,
  } = useMusic();

  const [activeTab, setActiveTab] = useState<'cover' | 'lyrics' | 'queue'>('cover');
  const [prevVolume, setPrevVolume] = useState<number>(0.8);

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
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Full screen music player"
      className="fixed inset-0 z-50 bg-[#0c0c10] flex flex-col justify-between overflow-hidden text-white animate-in fade-in duration-150"
    >
      {/* Top Header Bar */}
      <div className="relative z-10 px-4 sm:px-6 py-4 flex items-center justify-between border-b border-[#1f1f2c]">
        <button
          onClick={closeFullScreenPlayer}
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

        <div className="w-6" />
      </div>

      {/* Main Center Content (Tabs: Audio Visualizer, Lyrics, Queue) */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-4 overflow-y-auto no-scrollbar">
        {/* Tab 1: Minimalist Audio Display */}
        {activeTab === 'cover' && (
          <div className="w-full max-w-sm sm:max-w-md flex flex-col items-center">
            {/* Sleek Audio Waveform Box */}
            <div className="w-60 h-60 sm:w-72 sm:h-72 rounded-2xl bg-[#13131c] border border-[#222230] p-6 flex flex-col items-center justify-center shadow-xl my-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-gray-300">
                <Music className="w-8 h-8" />
              </div>

              {/* Animated Audio Equalizer Bars */}
              <div className="flex items-end gap-1.5 h-10 px-4 py-2">
                {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
                  <span
                    key={bar}
                    className={`w-1.5 rounded-full transition-all duration-150 ${
                      isPlaying
                        ? 'bg-white animate-pulse'
                        : 'bg-white/20 h-2'
                    }`}
                    style={{
                      height: isPlaying ? `${Math.max(8, (bar * 5) % 36)}px` : '6px',
                      animationDelay: `${bar * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Song Meta Title & Artist */}
            <div className="w-full text-center mt-3">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate px-2">
                {currentSong.title}
              </h2>
              <p className="text-sm text-gray-400 font-medium mt-1 truncate">
                {currentSong.artist}
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Lyrics View */}
        {activeTab === 'lyrics' && (
          <div className="w-full max-w-lg h-72 sm:h-96 overflow-y-auto no-scrollbar p-6 bg-[#13131c] rounded-2xl border border-[#222230] text-center flex flex-col justify-center">
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
          <div className="w-full max-w-lg h-72 sm:h-96 overflow-y-auto no-scrollbar p-4 bg-[#13131c] rounded-2xl border border-[#222230] flex flex-col">
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
                      onClick={() => playSong(song, queue)}
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
                          onClick={() => removeFromQueue(idx)}
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

      {/* Bottom Controls Section */}
      <div className="relative z-10 w-full max-w-xl mx-auto px-6 pb-6 pt-2">
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
            onClick={toggleShuffle}
            className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
              isShuffled ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white'
            }`}
            aria-label={isShuffled ? 'Disable Shuffle' : 'Enable Shuffle'}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          {/* Previous Track */}
          <button
            onClick={prevTrack}
            className="p-3 text-gray-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Previous track"
          >
            <SkipBack className="w-6 h-6" />
          </button>

          {/* Main Play / Pause Button */}
          <button
            onClick={togglePlayPause}
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
            onClick={nextTrack}
            className="p-3 text-gray-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Next track"
          >
            <SkipForward className="w-6 h-6" />
          </button>

          {/* Repeat Mode */}
          <button
            onClick={cycleRepeatMode}
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
            onClick={() => toggleFavorite(currentSong.id)}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isFav ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
            aria-label="Favorite"
          >
            <Heart className={`w-5 h-5 ${isFav ? 'fill-white' : ''}`} />
          </button>

          <button
            onClick={() => openAddToPlaylist(currentSong)}
            className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
            aria-label={t('player_add_playlist')}
          >
            <PlusCircle className="w-5 h-5" />
          </button>

          <button
            onClick={() => setActiveTab(activeTab === 'lyrics' ? 'cover' : 'lyrics')}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'lyrics' ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white'
            }`}
            aria-label={t('player_lyrics')}
          >
            <FileText className="w-5 h-5" />
          </button>

          <button
            onClick={() => setActiveTab(activeTab === 'queue' ? 'cover' : 'queue')}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'queue' ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white'
            }`}
            aria-label={t('player_queue')}
          >
            <ListMusic className="w-5 h-5" />
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-2 flex-1 max-w-[130px] ms-2">
            <button
              onClick={handleMuteToggle}
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
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-1 accent-white"
              aria-label="Volume slider"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
