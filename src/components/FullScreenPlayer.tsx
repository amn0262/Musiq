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
  Share2,
  PlusCircle,
  Tv,
  Music,
  Trash2,
  GripVertical,
  Sliders,
  Sparkles,
  Lock,
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
    playbackMode,
    setPlaybackMode,
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
    openSoundEnhancer,
    soundEnhancerPreset,
    soundEnhancerEnabled,
    isFullScreenPlayerOpen,
    closeFullScreenPlayer,
    queue,
    queueIndex,
    playSong,
    removeFromQueue,
    isRTL,
    t,
  } = useMusic();

  const [activeTab, setActiveTab] = useState<'cover' | 'lyrics' | 'queue'>('cover');
  const [prevVolume, setPrevVolume] = useState<number>(0.8);

  if (!isFullScreenPlayerOpen || !currentSong) return null;

  const isFav = isFavorite(currentSong.id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

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
      className="fixed inset-0 z-50 bg-[#0d0d12]/95 backdrop-blur-2xl flex flex-col justify-between overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200"
    >
      {/* Dynamic Ambient Background Glow */}
      <div
        className="absolute inset-0 opacity-25 filter blur-[100px] pointer-events-none scale-125"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 30%, #8b5cf6 0%, #06b6d4 40%, transparent 70%)`,
        }}
      />

      {/* Top Header Bar */}
      <div className="relative z-10 px-4 sm:px-6 py-4 flex items-center justify-between border-b border-white/5">
        <button
          onClick={closeFullScreenPlayer}
          className="p-2 -m-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors active:scale-95"
          aria-label="Minimize full player"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="text-center">
          <p className="text-[11px] font-bold tracking-widest uppercase text-purple-400">
            {t('player_playing')}
          </p>
          <p className="text-xs text-gray-300 font-medium truncate max-w-[200px] sm:max-w-xs">
            {currentSong.album || 'MUSIQ Special'}
          </p>
        </div>

        {/* Playback Mode Switch: Audio vs Official YouTube Embed */}
        <div className="flex items-center gap-1 bg-[#171724] p-1 rounded-full border border-white/10">
          <button
            onClick={() => setPlaybackMode('audio')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
              playbackMode === 'audio'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/40'
                : 'text-gray-400 hover:text-white'
            }`}
            title="High-Fidelity Audio Mode"
          >
            <Music className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hi-Fi</span>
          </button>
          <button
            onClick={() => setPlaybackMode('youtube')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
              playbackMode === 'youtube'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/40'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Official YouTube Player Mode"
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">YouTube</span>
          </button>
        </div>
      </div>

      {/* Main Center Content (Tabs: Cover Art, Lyrics, Queue) */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-2 overflow-y-auto no-scrollbar">
        {/* Tab 1: Cover Artwork or Official YouTube Embed */}
        {activeTab === 'cover' && (
          <div className="w-full max-w-sm sm:max-w-md flex flex-col items-center">
            {playbackMode === 'youtube' && currentSong.provider_track_id ? (
              <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black my-4">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${currentSong.provider_track_id}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent(
                    window.location.origin
                  )}`}
                  title={currentSong.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="relative my-4 sm:my-6 group">
                <div
                  className={`w-64 h-64 sm:w-80 sm:h-80 rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 border border-white/10 ${
                    isPlaying
                      ? 'shadow-purple-500/25 ring-2 ring-purple-500/40 scale-100'
                      : 'shadow-black/60 scale-95 opacity-90'
                  }`}
                >
                  <img
                    src={currentSong.artwork_url}
                    alt={currentSong.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Audio visualizer glow effect */}
                {isPlaying && (
                  <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-purple-600/30 via-indigo-600/20 to-cyan-500/30 filter blur-xl -z-10 animate-pulse" />
                )}
              </div>
            )}

            {/* Song Meta Title & Artist */}
            <div className="w-full text-center mt-3 sm:mt-4">
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {isRTL && currentSong.titleAr ? currentSong.titleAr : currentSong.title}
                </h2>
                {currentSong.titleAr && !isRTL && (
                  <span className="text-sm font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                    {currentSong.titleAr}
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-base text-gray-300 font-medium mt-1">
                {isRTL && currentSong.artistAr ? currentSong.artistAr : currentSong.artist}
              </p>
              {currentSong.releaseYear && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {currentSong.album} • {currentSong.releaseYear}
                </p>
              )}

              {/* Sound Enhancer Quick Trigger & Lock-Screen Status */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3.5">
                <button
                  onClick={openSoundEnhancer}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30 border border-purple-500/40 text-purple-200 text-xs font-semibold shadow-sm transition-all active:scale-95"
                >
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  <span>
                    {isRTL
                      ? `مُحسّن الصوت: ${
                          soundEnhancerPreset === 'studio'
                            ? 'ستوديو احترافي'
                            : soundEnhancerPreset === 'bass_boost'
                            ? 'مضخم البيس'
                            : soundEnhancerPreset === 'vocal'
                            ? 'نقاء الغناء'
                            : 'محيطي 3D'
                        }`
                      : `EQ: ${soundEnhancerPreset.replace('_', ' ').toUpperCase()}`}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </button>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>{isRTL ? 'يعمل في الخلفية وعند قفل الشاشة' : 'Background & Lock-Screen Active'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Synced / Scrollable Lyrics View */}
        {activeTab === 'lyrics' && (
          <div className="w-full max-w-lg h-72 sm:h-96 overflow-y-auto no-scrollbar p-6 bg-[#161622]/80 backdrop-blur-md rounded-3xl border border-white/10 text-center flex flex-col justify-center">
            <h3 className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-4">
              {t('player_lyrics')}
            </h3>
            {currentSong.lyricsAr && (
              <div className="mb-6 space-y-2 font-arabic text-lg sm:text-xl font-semibold text-purple-100 leading-relaxed">
                {currentSong.lyricsAr.split('\n').map((line, idx) => (
                  <p key={idx} className="hover:text-cyan-300 transition-colors cursor-default">
                    {line}
                  </p>
                ))}
              </div>
            )}
            {currentSong.lyrics && (
              <div className="space-y-1.5 text-sm sm:text-base text-gray-300 font-medium">
                {currentSong.lyrics.split('\n').map((line, idx) => (
                  <p key={idx} className="hover:text-purple-300 transition-colors cursor-default">
                    {line}
                  </p>
                ))}
              </div>
            )}
            {!currentSong.lyrics && !currentSong.lyricsAr && (
              <p className="text-gray-400 text-sm">
                {isRTL ? 'كلمات الأغنية غير متوفرة حالياً' : 'Lyrics are not available for this track.'}
              </p>
            )}
          </div>
        )}

        {/* Tab 3: Up Next / Queue Drawer */}
        {activeTab === 'queue' && (
          <div className="w-full max-w-lg h-72 sm:h-96 overflow-y-auto no-scrollbar p-4 bg-[#161622]/90 backdrop-blur-md rounded-3xl border border-white/10 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-purple-400">
                {t('player_queue')} ({queue.length})
              </h3>
              <span className="text-xs text-gray-400">
                {isShuffled ? 'Shuffled' : 'Standard'}
              </span>
            </div>

            <div className="space-y-2 overflow-y-auto flex-1">
              {queue.map((song, idx) => {
                const isCurrent = idx === queueIndex;
                return (
                  <div
                    key={`${song.id}-${idx}`}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-purple-950/40 border-purple-500/40 text-white'
                        : 'bg-white/5 border-transparent text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <button
                      onClick={() => playSong(song, queue)}
                      className="flex items-center gap-3 text-left flex-1 min-w-0"
                    >
                      <img
                        src={song.artwork_url}
                        alt={song.title}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-semibold truncate ${isCurrent ? 'text-purple-300' : ''}`}>
                          {isRTL && song.titleAr ? song.titleAr : song.title}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {isRTL && song.artistAr ? song.artistAr : song.artist}
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-mono">
                        {formatDuration(song.duration)}
                      </span>
                      {queue.length > 1 && (
                        <button
                          onClick={() => removeFromQueue(idx)}
                          className="p-1 text-gray-400 hover:text-rose-400 transition-colors"
                          title="Remove from queue"
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
            className="w-full"
            aria-label="Track progress slider"
          />
          <div className="flex justify-between items-center text-xs text-gray-400 font-mono mt-1 px-1">
            <span>{formatDuration(currentTime)}</span>
            <span>{formatRemaining(currentTime, duration)}</span>
          </div>
        </div>

        {/* Primary Playback Controls Bar */}
        <div className="flex items-center justify-between gap-4 py-2">
          {/* Shuffle Button */}
          <button
            onClick={toggleShuffle}
            className={`p-2.5 rounded-full transition-all ${
              isShuffled
                ? 'text-purple-400 bg-purple-500/20 ring-1 ring-purple-500/40'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Toggle Shuffle"
            aria-label={isShuffled ? 'Disable Shuffle' : 'Enable Shuffle'}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          {/* Previous Track */}
          <button
            onClick={prevTrack}
            className="p-3 text-gray-200 hover:text-white transition-transform active:scale-90"
            title="Previous Track"
            aria-label="Previous track"
          >
            <SkipBack className="w-7 h-7" />
          </button>

          {/* Large Play / Pause Button with Glow */}
          <button
            onClick={togglePlayPause}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:scale-105 text-white flex items-center justify-center shadow-xl shadow-purple-600/50 hover:shadow-purple-600/70 transition-all active:scale-95"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-white" />
            ) : (
              <Play className="w-7 h-7 fill-white ms-1" />
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={nextTrack}
            className="p-3 text-gray-200 hover:text-white transition-transform active:scale-90"
            title="Next Track"
            aria-label="Next track"
          >
            <SkipForward className="w-7 h-7" />
          </button>

          {/* Repeat Mode Button */}
          <button
            onClick={cycleRepeatMode}
            className={`p-2.5 rounded-full transition-all relative ${
              repeatMode !== 'off'
                ? 'text-cyan-400 bg-cyan-500/20 ring-1 ring-cyan-500/40'
                : 'text-gray-400 hover:text-white'
            }`}
            title={`Repeat: ${repeatMode}`}
            aria-label={`Cycle repeat mode, currently ${repeatMode}`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-5 h-5" />
            ) : (
              <Repeat className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Secondary Auxiliary Controls: Favorites, Add to Playlist, Lyrics, Queue, Volume */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5 gap-2">
          {/* Favorite Button */}
          <button
            onClick={() => toggleFavorite(currentSong.id)}
            className={`p-2 rounded-full transition-transform active:scale-90 ${
              isFav ? 'text-pink-500' : 'text-gray-400 hover:text-white'
            }`}
            aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-5 h-5 ${isFav ? 'fill-pink-500' : ''}`} />
          </button>

          {/* Add to Playlist */}
          <button
            onClick={() => openAddToPlaylist(currentSong)}
            className="p-2 text-gray-400 hover:text-purple-300 transition-colors"
            title={t('player_add_playlist')}
            aria-label={t('player_add_playlist')}
          >
            <PlusCircle className="w-5 h-5" />
          </button>

          {/* Lyrics Tab Toggle */}
          <button
            onClick={() => setActiveTab(activeTab === 'lyrics' ? 'cover' : 'lyrics')}
            className={`p-2 rounded-full transition-colors ${
              activeTab === 'lyrics'
                ? 'text-purple-400 bg-purple-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
            title={t('player_lyrics')}
            aria-label={t('player_lyrics')}
          >
            <FileText className="w-5 h-5" />
          </button>

          {/* Queue Tab Toggle */}
          <button
            onClick={() => setActiveTab(activeTab === 'queue' ? 'cover' : 'queue')}
            className={`p-2 rounded-full transition-colors ${
              activeTab === 'queue'
                ? 'text-purple-400 bg-purple-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
            title={t('player_queue')}
            aria-label={t('player_queue')}
          >
            <ListMusic className="w-5 h-5" />
          </button>

          {/* Sound Enhancer EQ Trigger */}
          <button
            onClick={openSoundEnhancer}
            className={`p-2 rounded-full transition-colors ${
              soundEnhancerEnabled
                ? 'text-cyan-400 bg-cyan-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
            title={isRTL ? 'مُحسّن الصوت والـ EQ' : 'Sound Enhancer & EQ'}
            aria-label={isRTL ? 'مُحسّن الصوت والـ EQ' : 'Sound Enhancer & EQ'}
          >
            <Sliders className="w-5 h-5" />
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-2 flex-1 max-w-[140px] ms-2">
            <button
              onClick={handleMuteToggle}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label={volume === 0 ? 'Unmute' : 'Mute'}
            >
              {volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-1"
              aria-label="Volume slider"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
