import React, { useState, useEffect, useMemo } from 'react';
import { useMusic } from '../context/MusicContext';
import { Song } from '../types/music';
import { formatDuration, formatRemaining } from '../utils/formatters';
import { SearchService } from '../services/searchService';
import { AudioVisualizer } from '../components/AudioVisualizer';
import { VisualizerStyle } from '../services/storage';
import {
  filterSameArtist,
  filterSameGenre,
  combineRecommendations,
  getArabicGenreLabel,
} from '../utils/recommendationRules';
import {
  Search,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  PlusCircle,
  History,
  Trash2,
  Music,
  Clock,
  Sparkles,
  Sliders,
  Maximize2,
  Loader2,
  ListMusic,
  Disc3,
  User,
  Volume2,
  VolumeX,
  FileText,
  Layers,
} from 'lucide-react';

const VISUALIZER_CYCLE: { id: VisualizerStyle; label: string }[] = [
  { id: 'wave', label: 'موجي' },
  { id: 'bars', label: 'أعمدة' },
  { id: 'circle', label: 'دائري' },
  { id: 'particles', label: 'مجرة' },
  { id: 'ribbon', label: 'شريطي' },
];

export const HomeScreen: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isShuffled,
    repeatMode,
    playSong,
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
    openSearchModal,
    openFullScreenPlayer,
    openSoundEnhancer,
    soundEnhancerEnabled,
    openPlaylistsModal,
    openFavoritesModal,
    openQueueModal,
    openLyricsModal,
    openHistoryModal,
    visualizerStyle,
    setVisualizerStyle,
    searchHistory,
    clearSearchHistory,
    recentlyPlayed,
    queue,
    allSongs,
  } = useMusic();

  const activeSong = currentSong || allSongs[0];

  const [recommendationFilter, setRecommendationFilter] = useState<'all' | 'artist' | 'genre'>('all');
  const [remoteArtistSongs, setRemoteArtistSongs] = useState<Song[]>([]);
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);
  const [prevVolume, setPrevVolume] = useState<number>(0.85);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [scrubTime, setScrubTime] = useState<number>(0);

  // Auto-initialize currentSong with first song if none loaded
  useEffect(() => {
    if (!currentSong && allSongs.length > 0) {
      playSong(allSongs[0], allSongs);
    }
  }, [currentSong, allSongs, playSong]);

  // Dynamically fetch live suggestions for the same singer/artist whenever activeSong changes
  useEffect(() => {
    if (!activeSong?.artist) return;

    let isMounted = true;
    setIsLoadingRemote(true);

    SearchService.searchYouTubeMusic(activeSong.artist)
      .then((res) => {
        if (isMounted && res) {
          const filtered = res.filter(
            (s) => s.id !== activeSong.id && s.provider_track_id !== activeSong.provider_track_id
          );
          setRemoteArtistSongs(filtered.slice(0, 10));
        }
        if (isMounted) setIsLoadingRemote(false);
      })
      .catch((err) => {
        console.warn('Failed to load related artist songs:', err);
        if (isMounted) setIsLoadingRemote(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeSong?.artist, activeSong?.id]);

  // Compute recommendations for the same artist and style/genre
  const { sameArtistList, sameGenreList, combinedList } = useMemo(() => {
    if (!activeSong) {
      return { sameArtistList: [], sameGenreList: [], combinedList: [] };
    }

    const poolMap = new Map<string, Song>();
    allSongs.forEach((s) => poolMap.set(s.provider_track_id || s.id, s));
    recentlyPlayed.forEach((s) => poolMap.set(s.provider_track_id || s.id, s));
    remoteArtistSongs.forEach((s) => poolMap.set(s.provider_track_id || s.id, s));
    const combinedPool = Array.from(poolMap.values());

    const artistMatches = filterSameArtist(combinedPool, activeSong);
    const genreMatches = filterSameGenre(combinedPool, activeSong);
    const combined = combineRecommendations(artistMatches, genreMatches, activeSong.id, 16);

    return {
      sameArtistList: artistMatches,
      sameGenreList: genreMatches,
      combinedList: combined,
    };
  }, [activeSong, allSongs, recentlyPlayed, remoteArtistSongs]);

  // Displayed recommendations based on active filter
  const displayedRecommendations = useMemo(() => {
    if (recommendationFilter === 'artist') {
      return sameArtistList.map((song) => ({ song, reason: 'artist' as const }));
    }
    if (recommendationFilter === 'genre') {
      return sameGenreList.map((song) => ({ song, reason: 'genre' as const }));
    }
    return combinedList;
  }, [recommendationFilter, sameArtistList, sameGenreList, combinedList]);

  const handleSongPlay = (song: Song, queueToUse?: Song[]) => {
    if (currentSong?.id === song.id || currentSong?.provider_track_id === song.provider_track_id) {
      togglePlayPause();
    } else {
      playSong(
        song,
        queueToUse ||
          displayedRecommendations.map((r) => r.song).concat(recentlyPlayed.length > 0 ? recentlyPlayed : allSongs)
      );
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setScrubTime(val);
  };

  const handleSeekStart = () => {
    setIsScrubbing(true);
    setScrubTime(currentTime);
  };

  const handleSeekCommit = () => {
    if (isScrubbing) {
      seekTo(scrubTime, true);
      setIsScrubbing(false);
    }
  };

  const cycleVisualizer = () => {
    const idx = VISUALIZER_CYCLE.findIndex((v) => v.id === visualizerStyle);
    const next = VISUALIZER_CYCLE[(idx + 1) % VISUALIZER_CYCLE.length].id;
    setVisualizerStyle(next);
  };

  const currentVisualizerLabel =
    VISUALIZER_CYCLE.find((v) => v.id === visualizerStyle)?.label || 'موجي';

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume || 0.85);
    }
  };

  const genreLabel = currentSong ? getArabicGenreLabel(currentSong.category) : '';

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-150">
      {/* 1. Quick Modals Launcher Toolbar (الأقسام تظهر بأزرار كنوافذ منبثقة) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {/* Search Modal Button */}
        <button
          onClick={() => openSearchModal()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-black hover:bg-gray-200 text-xs font-bold transition-all shadow-sm flex-shrink-0 cursor-pointer"
          title="البحث عن أغنية أو فنان"
        >
          <Search className="w-3.5 h-3.5" />
          <span>بحث</span>
        </button>

        {/* Playlists Modal Button */}
        <button
          onClick={openPlaylistsModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161622] hover:bg-[#202030] text-gray-200 hover:text-white border border-[#2a2a3e] text-xs font-medium transition-colors flex-shrink-0 cursor-pointer"
          title="فتح قوائم التشغيل كشاشة منبثقة"
        >
          <ListMusic className="w-3.5 h-3.5 text-gray-400" />
          <span>قوائم التشغيل</span>
        </button>

        {/* Favorites Modal Button */}
        <button
          onClick={openFavoritesModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161622] hover:bg-[#202030] text-gray-200 hover:text-red-400 border border-[#2a2a3e] text-xs font-medium transition-colors flex-shrink-0 cursor-pointer"
          title="فتح المفضلة كشاشة منبثقة"
        >
          <Heart className="w-3.5 h-3.5 text-red-400" />
          <span>المفضلة</span>
        </button>

        {/* Queue Modal Button */}
        <button
          onClick={openQueueModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161622] hover:bg-[#202030] text-gray-200 hover:text-white border border-[#2a2a3e] text-xs font-medium transition-colors flex-shrink-0 cursor-pointer"
          title="عرض قائمة الانتظار الحالية"
        >
          <Layers className="w-3.5 h-3.5 text-gray-400" />
          <span>قائمة الانتظار</span>
          {queue.length > 0 && (
            <span className="text-[10px] px-1 py-0.2 rounded bg-white/10 font-mono">
              {queue.length}
            </span>
          )}
        </button>

        {/* Lyrics Modal Button */}
        <button
          onClick={openLyricsModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161622] hover:bg-[#202030] text-gray-200 hover:text-white border border-[#2a2a3e] text-xs font-medium transition-colors flex-shrink-0 cursor-pointer"
          title="عرض كلمات الأغنية"
        >
          <FileText className="w-3.5 h-3.5 text-gray-400" />
          <span>الكلمات</span>
        </button>

        {/* Sound Enhancer Modal Button */}
        <button
          onClick={openSoundEnhancer}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex-shrink-0 cursor-pointer ${
            soundEnhancerEnabled
              ? 'bg-white/20 text-white border border-white/30'
              : 'bg-[#161622] hover:bg-[#202030] text-gray-200 border border-[#2a2a3e]'
          }`}
          title="معادل الصوت والمؤثرات"
        >
          <Sliders className="w-3.5 h-3.5 text-gray-300" />
          <span>المؤثرات</span>
        </button>

        {/* History Modal Button */}
        <button
          onClick={openHistoryModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161622] hover:bg-[#202030] text-gray-200 hover:text-white border border-[#2a2a3e] text-xs font-medium transition-colors flex-shrink-0 cursor-pointer"
          title="سجل المقاطع المشغلة"
        >
          <History className="w-3.5 h-3.5 text-gray-400" />
          <span>السجل</span>
        </button>
      </div>

      {/* 2. الكلمات المؤخرة (Recent Search Keywords) */}
      {searchHistory.length > 0 && (
        <div className="p-3 rounded-xl bg-[#14141c] border border-[#222232] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 flex-shrink-0 text-gray-400">
            <History className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold text-gray-300">الكلمات المؤخرة:</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1">
            {searchHistory.map((word, idx) => (
              <button
                key={`home-hist-${idx}-${word}`}
                type="button"
                onClick={() => openSearchModal(word)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1c1c28] hover:bg-[#262638] border border-[#2c2c40] text-xs text-gray-300 hover:text-white transition-colors cursor-pointer flex-shrink-0"
              >
                <span>{word}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={clearSearchHistory}
            className="text-[11px] text-gray-500 hover:text-gray-300 px-1 transition-colors cursor-pointer flex-shrink-0"
            title="مسح الكلمات المؤخرة"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 3. مشغل الموسيقى الرئيسي (المشغل هو الواجهة الرئيسية) */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[#121218] border border-[#26263a] shadow-2xl space-y-4">
        {/* Top Header Bar of the Main Player */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/10 text-white border border-white/10">
              <span
                className={`w-2 h-2 rounded-full ${
                  isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'
                }`}
              />
              <span>{isPlaying ? 'قيد التشغيل الآن' : 'جاهزة للتشغيل'}</span>
            </span>

            {genreLabel && (
              <span className="text-[11px] text-gray-400 font-mono px-2 py-0.5 rounded bg-white/5 hidden sm:inline">
                {genreLabel}
              </span>
            )}
          </div>

          {/* Visualizer Style Switcher & Full Screen Mode */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={cycleVisualizer}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-medium transition-colors cursor-pointer"
              title="تغيير نمط المؤثرات البصرية"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>{currentVisualizerLabel}</span>
            </button>

            <button
              onClick={openFullScreenPlayer}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="عرض كامل الشاشة مع المؤثرات"
              aria-label="Full screen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas Visualizer Display (Live Audio Reaction - No Images) */}
        <div className="relative w-full h-32 sm:h-44 rounded-xl bg-black/60 border border-white/10 overflow-hidden flex items-center justify-center">
          <AudioVisualizer isPlaying={isPlaying} style={visualizerStyle} className="w-full h-full" />
        </div>

        {/* Current Song Title & Artist (Clean Typography, Zero Images) */}
        {activeSong ? (
          <div className="space-y-3 pt-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight leading-snug">
                  {activeSong.title}
                </h1>
                <div className="flex items-center gap-2 mt-1 text-xs sm:text-sm text-gray-300">
                  <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="font-semibold text-gray-200">{activeSong.artist}</span>
                  {activeSong.album && (
                    <>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-400 truncate">{activeSong.album}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Direct Track Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => toggleFavorite(activeSong.id)}
                  className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
                    isFavorite(activeSong.id)
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
                  }`}
                  aria-label="المفضلة"
                  title={isFavorite(activeSong.id) ? 'في المفضلة' : 'إضافة للمفضلة'}
                >
                  <Heart
                    className={`w-4 h-4 ${isFavorite(activeSong.id) ? 'fill-current text-red-400' : ''}`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => openAddToPlaylist(activeSong)}
                  className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5 transition-colors cursor-pointer"
                  aria-label="إضافة لقائمة تشغيل"
                  title="إضافة لقائمة تشغيل"
                >
                  <PlusCircle className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Seekable Range Slider & Timestamps */}
            <div className="space-y-1.5 pt-2">
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.2"
                value={isScrubbing ? scrubTime : currentTime}
                onPointerDown={handleSeekStart}
                onTouchStart={handleSeekStart}
                onChange={handleSeekChange}
                onPointerUp={handleSeekCommit}
                onTouchEnd={handleSeekCommit}
                onKeyUp={handleSeekCommit}
                className="w-full accent-white cursor-pointer h-2 bg-white/10 rounded-lg"
                aria-label="Seek track"
              />
              <div className="flex justify-between items-center text-xs text-gray-400 font-mono px-0.5">
                <span>{formatDuration(isScrubbing ? scrubTime : currentTime)}</span>
                <span>{formatRemaining(isScrubbing ? scrubTime : currentTime, duration)}</span>
              </div>
            </div>

            {/* Transport Playback Controls (Shuffle, Prev, Big Play/Pause, Next, Repeat) */}
            <div className="flex items-center justify-between pt-2">
              {/* Shuffle Toggle */}
              <button
                type="button"
                onClick={toggleShuffle}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isShuffled ? 'text-white bg-white/10' : 'text-gray-500 hover:text-gray-300'
                }`}
                title="خلط المقاطع"
                aria-label="Toggle shuffle"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              {/* Center Controls */}
              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={prevTrack}
                  className="p-2 sm:p-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  aria-label="Previous track"
                  title="السابق"
                >
                  <SkipBack className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                <button
                  type="button"
                  onClick={togglePlayPause}
                  className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white text-black hover:bg-gray-200 flex items-center justify-center font-bold shadow-xl transition-transform active:scale-95 cursor-pointer"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ms-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={nextTrack}
                  className="p-2 sm:p-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  aria-label="Next track"
                  title="التالي"
                >
                  <SkipForward className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Repeat Mode Cycle */}
              <button
                type="button"
                onClick={cycleRepeatMode}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  repeatMode !== 'off' ? 'text-white bg-white/10' : 'text-gray-500 hover:text-gray-300'
                }`}
                title={`تكرار: ${repeatMode}`}
                aria-label="Cycle repeat mode"
              >
                {repeatMode === 'one' ? (
                  <Repeat1 className="w-4 h-4" />
                ) : (
                  <Repeat className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Bottom Row of Player: Volume & Quick Section Triggers */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/5">
              {/* Volume Slider */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={toggleMute}
                  className="p-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
                  title={volume === 0 ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
                >
                  {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-24 sm:w-28 accent-white cursor-pointer h-1.5"
                  aria-label="Volume slider"
                />
                <span className="text-[10px] text-gray-400 font-mono w-7">
                  {Math.round(volume * 100)}%
                </span>
              </div>

              {/* Direct Buttons to open other sections as popups */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={openLyricsModal}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs transition-colors cursor-pointer"
                  title="فتح كلمات الأغنية كشاشة منبثقة"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>الكلمات</span>
                </button>

                <button
                  onClick={openQueueModal}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs transition-colors cursor-pointer"
                  title="فتح قائمة الانتظار كشاشة منبثقة"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>الانتظار ({queue.length})</span>
                </button>

                <button
                  onClick={openSoundEnhancer}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs transition-colors cursor-pointer"
                  title="فتح معادل الصوت كشاشة منبثقة"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>المؤثرات</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500 space-y-2">
            <Disc3 className="w-8 h-8 mx-auto animate-spin" />
            <p className="text-xs">جاري تجهيز المشغل الموسيقي...</p>
          </div>
        )}
      </div>

      {/* 4. اقتراحات لنفس المطرب أو النمط (Suggestions Under the Active Player) */}
      {activeSong && (
        <div className="space-y-3 pt-2">
          {/* Header of Suggestions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-1 border-b border-[#222232]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-white" />
              <h2 className="text-sm sm:text-base font-bold text-white">
                اقتراحات لنفس المطرب أو النمط
              </h2>
              {isLoadingRemote && (
                <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin ms-1" />
              )}
            </div>

            {/* Filter Tabs: All, Same Artist, Same Genre */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setRecommendationFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  recommendationFilter === 'all'
                    ? 'bg-white text-black'
                    : 'bg-[#181822] text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                الكل
              </button>

              <button
                type="button"
                onClick={() => setRecommendationFilter('artist')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  recommendationFilter === 'artist'
                    ? 'bg-white text-black'
                    : 'bg-[#181822] text-gray-400 hover:text-white border border-white/5'
                }`}
                title={`أغاني الفنان: ${activeSong.artist}`}
              >
                {activeSong.artist}
              </button>

              {genreLabel && (
                <button
                  type="button"
                  onClick={() => setRecommendationFilter('genre')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    recommendationFilter === 'genre'
                      ? 'bg-white text-black'
                      : 'bg-[#181822] text-gray-400 hover:text-white border border-white/5'
                  }`}
                  title={`أغاني من نمط: ${genreLabel}`}
                >
                  {genreLabel}
                </button>
              )}
            </div>
          </div>

          {/* Suggestions List: Zero Images, pure typography */}
          {displayedRecommendations.length === 0 ? (
            <div className="text-center py-8 rounded-xl bg-[#14141c] border border-[#222232] space-y-2">
              <Music className="w-6 h-6 text-gray-600 mx-auto" />
              <p className="text-xs text-gray-400">
                {isLoadingRemote
                  ? 'جاري تحميل مقترحات مشابهة...'
                  : 'لا توجد مقترحات إضافية حالياً، استخدم البحث لاستكشاف المزيد'}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {displayedRecommendations.map(({ song, reason }, index) => {
                const isCurrent =
                  currentSong?.id === song.id ||
                  currentSong?.provider_track_id === song.provider_track_id;
                const isFav = isFavorite(song.id);

                return (
                  <div
                    key={`rec-${song.id}-${index}`}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all group border ${
                      isCurrent
                        ? 'bg-white/10 border-white/20'
                        : 'bg-[#14141c] hover:bg-[#1a1a26] border-[#222232]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleSongPlay(
                          song,
                          displayedRecommendations.map((r) => r.song)
                        )
                      }
                      className="flex items-center gap-3 flex-1 min-w-0 text-right cursor-pointer"
                    >
                      <div className="w-6 text-center text-xs text-gray-500 font-mono flex-shrink-0">
                        {isCurrent && isPlaying ? (
                          <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" />
                        ) : (
                          index + 1
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-xs sm:text-sm font-semibold truncate ${
                              isCurrent
                                ? 'text-white font-bold'
                                : 'text-gray-200 group-hover:text-white'
                            }`}
                          >
                            {song.title}
                          </p>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-medium flex-shrink-0 ${
                              reason === 'artist'
                                ? 'bg-white/10 text-gray-300'
                                : 'bg-white/5 text-gray-400'
                            }`}
                          >
                            {reason === 'artist' ? 'نفس المطرب' : 'نفس النمط'}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{song.artist}</p>
                      </div>
                    </button>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[11px] text-gray-500 font-mono px-1">
                        {formatDuration(song.duration)}
                      </span>

                      <button
                        type="button"
                        onClick={() => toggleFavorite(song.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isFav
                            ? 'text-red-400 hover:text-gray-400'
                            : 'text-gray-500 hover:text-red-400 hover:bg-white/5'
                        }`}
                        title={isFav ? 'في المفضلة' : 'إضافة للمفضلة'}
                        aria-label="Toggle favorite"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => openAddToPlaylist(song)}
                        className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                        title="إضافة إلى قائمة تشغيل"
                        aria-label="Add to playlist"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
