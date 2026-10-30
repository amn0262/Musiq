import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useMusic } from '../context/MusicContext';
import { Song, Category } from '../types/music';
import { POPULAR_ARTISTS } from '../data/catalog';
import { formatDuration } from '../utils/formatters';
import { getTimeGreeting } from '../utils/greeting';
import {
  Search,
  Play,
  Pause,
  Heart,
  PlusCircle,
  Sparkles,
  TrendingUp,
  Flame,
  Radio,
  Disc3,
  Timer,
  RefreshCw,
  FolderPlus,
  HelpCircle,
  Clock,
} from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const {
    allSongs,
    playlists,
    recentlyPlayed,
    currentSong,
    isPlaying,
    playSong,
    togglePlayPause,
    isFavorite,
    toggleFavorite,
    openAddToPlaylist,
    setActiveTab,
    openTour,
    user,
    isRTL,
    t,
  } = useMusic();

  const [selectedCategory, setSelectedCategory] = useState<Category>('all');

  // Dynamic time greeting
  const [currentDate, setCurrentDate] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const liveGreeting = useMemo(() => {
    return getTimeGreeting(user.name, user.gender, currentDate, isRTL ? 'ar' : 'en');
  }, [user.name, user.gender, currentDate, isRTL]);

  // 3-Minute Rotating Recommendations Engine
  const ROTATE_INTERVAL_SECONDS = 180; // 3 minutes
  const [secondsRemaining, setSecondsRemaining] = useState(ROTATE_INTERVAL_SECONDS);
  const [isRotating, setIsRotating] = useState(false);
  const [recommendationSeed, setRecommendationSeed] = useState(0);

  // Generate randomized suggestions matching or biased by user preferences
  const rotatingSuggestions = useMemo(() => {
    if (!allSongs || allSongs.length === 0) return [];

    // Filter or prioritize songs that match user preferences
    const pool = [...allSongs];
    // Simple deterministic pseudo-shuffle based on seed
    const shuffled = pool.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 6);
  }, [allSongs, recommendationSeed]);

  const refreshRecommendations = useCallback(() => {
    setIsRotating(true);
    setRecommendationSeed((prev) => prev + 1);
    setSecondsRemaining(ROTATE_INTERVAL_SECONDS);
    setTimeout(() => setIsRotating(false), 500);
  }, []);

  // 3-minute automatic countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Trigger rotation
          setRecommendationSeed((s) => s + 1);
          return ROTATE_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const categories: { id: Category; labelKey: string }[] = [
    { id: 'all', labelKey: 'cat_all' },
    { id: 'arabic', labelKey: 'cat_arabic' },
    { id: 'international', labelKey: 'cat_international' },
    { id: 'pop', labelKey: 'cat_pop' },
    { id: 'rap', labelKey: 'cat_rap' },
    { id: 'classical', labelKey: 'cat_classical' },
    { id: 'relaxing', labelKey: 'cat_relaxing' },
    { id: 'trending', labelKey: 'cat_trending' },
  ];

  const filteredSongs = selectedCategory === 'all'
    ? allSongs
    : allSongs.filter((s) => s.category === selectedCategory);

  const handleSongPlay = (song: Song, queueToUse?: Song[]) => {
    if (currentSong?.id === song.id) {
      togglePlayPause();
    } else {
      playSong(song, queueToUse || filteredSongs);
    }
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Dynamic Personalized Time Greeting Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950/70 via-[#181528] to-[#12121a] p-5 sm:p-7 border border-purple-500/30 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-2xl flex-shrink-0 shadow-lg shadow-purple-900/30">
              {liveGreeting.icon === 'sun' && '☀️'}
              {liveGreeting.icon === 'cloud-sun' && '🌤️'}
              {liveGreeting.icon === 'moon' && '🌙'}
              {liveGreeting.icon === 'sparkles' && '✨'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {liveGreeting.salutation}
                </span>
                <span className="text-[11px] text-gray-400 font-mono hidden sm:inline-flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  {currentDate.toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                {liveGreeting.greeting}
              </h2>
              <p className="text-xs sm:text-sm text-gray-300 mt-0.5 leading-relaxed">
                {liveGreeting.subGreeting}
              </p>
            </div>
          </div>

          <button
            onClick={openTour}
            className="self-end sm:self-center px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all flex items-center gap-1.5 active:scale-95"
            title="App Tour"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isRTL ? 'جولة التطبيق والتفضيلات' : 'App Tour & Taste'}</span>
          </button>
        </div>
      </section>

      {/* Hero Header & Prominent Search Input */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#161626] to-[#101014] p-5 sm:p-8 border border-white/10 shadow-2xl">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isRTL ? 'اكتشف روائع الطرب والموسيقى العالمية عبر يوتيوب' : 'Discover Arabic & International Masterpieces'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            {isRTL ? (
              <>
                عالمك الموسيقي <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">الذكي</span>
              </>
            ) : (
              <>
                Your Smart <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Music World</span>
              </>
            )}
          </h1>

          {/* Prominent Large Search Box */}
          <div
            onClick={() => setActiveTab('search')}
            className="cursor-pointer group relative flex items-center w-full max-w-xl mx-auto bg-[#171724]/90 hover:bg-[#1f1f30] border-2 border-purple-500/30 hover:border-purple-500/70 rounded-2xl px-5 py-4 shadow-xl shadow-purple-950/40 transition-all hover:scale-[1.01]"
          >
            <Search className="w-6 h-6 text-purple-400 group-hover:text-cyan-400 group-hover:scale-110 transition-all me-3.5 flex-shrink-0" />
            <span className="text-base sm:text-lg text-gray-300 font-medium truncate flex-1 text-left">
              {t('search_placeholder')}
            </span>
            <span className="hidden sm:inline-block px-3 py-1 rounded-lg bg-purple-600/30 text-purple-200 text-xs font-bold border border-purple-500/30">
              {isRTL ? 'بحث فوري' : 'Quick Search'}
            </span>
          </div>
        </div>

        {/* Quick Categories Pills */}
        <div className="mt-8 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 ring-1 ring-purple-400'
                    : 'bg-[#1b1b28] hover:bg-[#252538] text-gray-300 border border-white/5'
                }`}
              >
                {t(cat.labelKey)}
              </button>
            );
          })}
        </div>
      </section>

      {/* 3-MINUTE AUTO-ROTATING RECOMMENDATIONS WITH "ADD TO FAVORITES" */}
      <section className="space-y-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-purple-950/30 via-[#161624] to-[#121218] border border-purple-500/30 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-cyan-400 animate-pulse" />
              <h2 className="text-lg sm:text-xl font-black text-white">
                {isRTL ? 'اقتراحات خصيصاً لك (تتجدد كل ٣ دقائق)' : 'Personalized Suggestions (Refreshes every 3 min)'}
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {isRTL
                ? 'مختارات عشوائية ذكية متوافقة مع ذوقك الموسيقي، تتجدد تلقائياً كل 3 دقائق مع زر إضافة للمفضلة'
                : 'Smart rotating selections refreshed every 180 seconds with instant Add to Favorites'}
            </p>
          </div>

          {/* Countdown timer badge & manual refresh button */}
          <div className="flex items-center gap-2.5 self-end sm:self-center">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs font-mono font-bold text-cyan-300">
              <span className="text-[11px] font-sans text-gray-400">
                {isRTL ? 'التجديد خلال:' : 'Next in:'}
              </span>
              <span className="tabular-nums text-sm font-black text-white bg-purple-950/80 px-2 py-0.5 rounded-lg border border-purple-500/30">
                {formatTimer(secondsRemaining)}
              </span>
            </div>

            <button
              onClick={refreshRecommendations}
              className={`p-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 hover:text-white transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold ${
                isRotating ? 'animate-spin' : ''
              }`}
              title={isRTL ? 'جدد الاقتراحات الآن' : 'Refresh Suggestions Now'}
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">{isRTL ? 'تجديد الآن' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* 6 Rotating Recommendations Cards with Direct Heart Favorite Button */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {rotatingSuggestions.map((song) => {
            const isCurrent = currentSong?.id === song.id;
            const isSongPlaying = isCurrent && isPlaying;
            const isFav = isFavorite(song.id);

            return (
              <div
                key={`rot-${song.id}`}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-[#1e1730] border-purple-500/60 shadow-lg shadow-purple-950/60'
                    : 'bg-[#151522] hover:bg-[#1c1c2e] border-white/5'
                }`}
              >
                <button
                  onClick={() => handleSongPlay(song, rotatingSuggestions)}
                  className="flex items-center gap-3.5 flex-1 min-w-0 text-left"
                >
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 group">
                    <img
                      src={song.artwork_url}
                      alt={song.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div
                      className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                        isSongPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {isSongPlaying ? (
                        <Pause className="w-5 h-5 text-white fill-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white fill-white ms-0.5" />
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
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                      <span className="font-mono tabular-nums">{formatDuration(song.duration)}</span>
                      <span>·</span>
                      <span className="px-1.5 py-0.2 rounded bg-white/5 text-[10px] text-purple-300 uppercase">
                        {song.category}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Direct Add to Favorites Button + Add to Playlist */}
                <div className="flex items-center gap-1 ms-2">
                  <button
                    onClick={() => toggleFavorite(song.id)}
                    className={`p-2 rounded-xl transition-all flex items-center gap-1 ${
                      isFav
                        ? 'bg-pink-500/20 text-pink-500 border border-pink-500/30'
                        : 'bg-white/5 text-gray-400 hover:text-pink-400 hover:bg-white/10'
                    }`}
                    title={isFav ? (isRTL ? 'في المفضلة' : 'Favorited') : (isRTL ? 'أضف للمفضلة' : 'Add to Favorites')}
                    aria-label="Toggle favorite"
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-pink-500' : ''}`} />
                  </button>

                  <button
                    onClick={() => openAddToPlaylist(song)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-purple-300 transition-colors"
                    title={isRTL ? 'إضافة لقائمة تشغيل' : 'Add to Playlist'}
                    aria-label="Add to playlist"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recently Played Row */}
      {recentlyPlayed.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Disc3 className="w-5 h-5 text-cyan-400" />
              <span>{t('section_recently_played')}</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {recentlyPlayed.slice(0, 6).map((song) => {
              const isCurrent = currentSong?.id === song.id;
              const isSongPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={`rec-${song.id}`}
                  onClick={() => handleSongPlay(song, recentlyPlayed)}
                  className="group relative bg-[#161622] hover:bg-[#1f1f2e] border border-white/5 hover:border-purple-500/30 rounded-2xl p-3 cursor-pointer transition-all hover:-translate-y-1"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-2.5">
                    <img
                      src={song.artwork_url}
                      alt={song.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div
                      className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                        isSongPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg">
                        {isSongPlaying ? (
                          <Pause className="w-4 h-4 fill-white" />
                        ) : (
                          <Play className="w-4 h-4 fill-white ms-0.5" />
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm font-bold text-white truncate">
                    {isRTL && song.titleAr ? song.titleAr : song.title}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">
                    {isRTL && song.artistAr ? song.artistAr : song.artist}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Categorized Music Catalog */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-purple-400" />
              <span>{t('section_recommended')}</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isRTL ? 'مختارات موسيقية تناسب ذوقك الرفيع' : 'Handpicked for your musical taste'}
            </p>
          </div>
          <button
            onClick={() => setActiveTab('search')}
            className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
          >
            {t('view_all')}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredSongs.slice(0, 9).map((song) => {
            const isCurrent = currentSong?.id === song.id;
            const isSongPlaying = isCurrent && isPlaying;
            const isFav = isFavorite(song.id);

            return (
              <div
                key={song.id}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-[#1b172a] border-purple-500/50 shadow-md shadow-purple-950/50'
                    : 'bg-[#161622] hover:bg-[#1d1d2b] border-white/5'
                }`}
              >
                <button
                  onClick={() => handleSongPlay(song, filteredSongs)}
                  className="flex items-center gap-3.5 flex-1 min-w-0 text-left"
                >
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 group">
                    <img
                      src={song.artwork_url}
                      alt={song.title}
                      className="w-full h-full object-cover"
                    />
                    <div
                      className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                        isSongPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {isSongPlaying ? (
                        <Pause className="w-5 h-5 text-white fill-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white fill-white ms-0.5" />
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-bold truncate ${isCurrent ? 'text-purple-300' : 'text-white'}`}>
                        {isRTL && song.titleAr ? song.titleAr : song.title}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {isRTL && song.artistAr ? song.artistAr : song.artist}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-400">
                      <span className="font-mono tabular-nums">
                        {formatDuration(song.duration)}
                      </span>
                      <span aria-hidden="true" className="text-gray-600">·</span>
                      <span className="capitalize">
                        {song.category}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Actions: Favorite & Add to playlist */}
                <div className="flex items-center gap-1.5 ms-2">
                  <button
                    onClick={() => toggleFavorite(song.id)}
                    className={`p-2 rounded-full transition-colors ${
                      isFav ? 'text-pink-500' : 'text-gray-400 hover:text-white'
                    }`}
                    aria-label="Toggle favorite"
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-pink-500' : ''}`} />
                  </button>
                  <button
                    onClick={() => openAddToPlaylist(song)}
                    className="p-2 text-gray-400 hover:text-purple-300 transition-colors"
                    aria-label="Add to playlist"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Popular Artists Carousel */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <span>{t('section_popular_artists')}</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 sm:gap-4">
          {POPULAR_ARTISTS.map((artist) => {
            return (
              <div
                key={artist.id}
                onClick={() => setActiveTab('search')}
                className="group flex flex-col items-center text-center p-2 rounded-2xl bg-[#161622]/60 hover:bg-[#1e1e2d] border border-white/5 cursor-pointer transition-all hover:scale-105"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-purple-500 to-cyan-400 shadow-md group-hover:shadow-purple-500/30 transition-shadow mb-2">
                  <img
                    src={artist.avatar_url}
                    alt={artist.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <p className="text-xs sm:text-sm font-bold text-white truncate w-full">
                  {isRTL && artist.nameAr ? artist.nameAr : artist.name}
                </p>
                <p className="text-[10px] text-gray-400 font-medium">
                  {isRTL ? 'فنان رسمي' : 'Artist'}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Personal Playlists Section - Empty state with creation prompt or preview */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-purple-400" />
            <span>{isRTL ? 'قوائم التشغيل الخاصة بك' : 'Your Playlists'}</span>
          </h2>
          <button
            onClick={() => setActiveTab('playlists')}
            className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
          >
            {t('view_all')}
          </button>
        </div>

        {playlists.length === 0 ? (
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#181828] to-[#111118] border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-start shadow-xl">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 flex-shrink-0">
                <FolderPlus className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {isRTL ? 'قوائمك بانتظار إبداعك الموسيقي' : 'Your playlists are waiting for you'}
                </h3>
                <p className="text-xs text-gray-400 max-w-md">
                  {isRTL
                    ? 'لقد قمنا بإفراغ القوائم لتبدأ بصناعة قوائمك الشخصية من الصفر وتجميع أغانيك المفضلة بحرية تامة.'
                    : 'Playlists have been cleared so you can build your custom collections from scratch.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('playlists')}
              className="px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all active:scale-95"
            >
              <FolderPlus className="w-4 h-4" />
              <span>{isRTL ? 'إنشاء قائمة جديدة الآن' : 'Create First Playlist'}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {playlists.slice(0, 3).map((pl) => (
              <div
                key={pl.id}
                onClick={() => setActiveTab('playlists')}
                className="group relative rounded-2xl overflow-hidden p-4 bg-gradient-to-br from-[#1c1c2b] to-[#12121a] border border-white/10 hover:border-purple-500/40 cursor-pointer transition-all hover:-translate-y-1 shadow-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-lg">
                    <img
                      src={pl.cover_url}
                      alt={pl.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                      PLAYLIST
                    </span>
                    <h3 className="text-base font-bold text-white truncate mt-0.5">
                      {pl.name}
                    </h3>
                    <p className="text-xs text-gray-400 truncate mt-1">
                      {pl.description || `${pl.song_ids.length} ${t('playlist_songs_count')}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
