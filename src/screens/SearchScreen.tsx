import React, { useState, useEffect, useTransition } from 'react';
import { useMusic } from '../context/MusicContext';
import { SearchService, SearchResults } from '../services/searchService';
import { StorageService } from '../services/storage';
import { Song, Artist } from '../types/music';
import { formatDuration } from '../utils/formatters';
import {
  Search,
  X,
  History,
  Trash2,
  Play,
  Pause,
  Heart,
  PlusCircle,
  Tv,
  Music,
  User,
  Disc,
  Sparkles,
} from 'lucide-react';

type SearchFilterTab = 'all' | 'songs' | 'artists' | 'albums' | 'lyrics' | 'youtube';

export const SearchScreen: React.FC = () => {
  const {
    allSongs,
    currentSong,
    isPlaying,
    playSong,
    togglePlayPause,
    isFavorite,
    toggleFavorite,
    openAddToPlaylist,
    isRTL,
    t,
  } = useMusic();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<SearchFilterTab>('all');
  const [searchHistory, setSearchHistory] = useState<string[]>(() => StorageService.getSearchHistory());
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [results, setResults] = useState<SearchResults>({
    songs: [],
    artists: [],
    albums: [],
    lyricsMatches: [],
    youtubeResults: [],
  });
  const [isSearchingYouTube, setIsSearchingYouTube] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#search-bar-container')) {
        setShowSuggestions(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Debounce search input by 250ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update suggestions while typing using real-time YouTube suggest
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      SearchService.getRemoteSuggestions(searchQuery).then((sug) => {
        setSuggestions(sug);
        if (sug.length > 0) {
          setShowSuggestions(true);
        }
      });
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  // Execute search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults({
        songs: [],
        artists: [],
        albums: [],
        lyricsMatches: [],
        youtubeResults: [],
      });
      return;
    }

    startTransition(() => {
      const localRes = SearchService.searchLocal(debouncedQuery, allSongs);
      setResults((prev) => ({ ...prev, ...localRes }));
    });

    // Save to history when search has substance
    if (debouncedQuery.trim().length >= 2) {
      const updated = StorageService.addSearchQuery(debouncedQuery);
      setSearchHistory(updated);
    }

    // Trigger instant YouTube search
    setIsSearchingYouTube(true);
    SearchService.searchYouTubeMusic(debouncedQuery)
      .then((yt) => {
        setResults((prev) => ({ ...prev, youtubeResults: yt }));
      })
      .finally(() => {
        setIsSearchingYouTube(false);
      });
  }, [debouncedQuery, allSongs]);

  /**
   * Immediately hides suggestions and triggers instant audio playback of the selected track
   */
  const handleSelectSuggestionAndPlay = async (q: string) => {
    // 1. Immediately dismiss suggestions dropdown
    setShowSuggestions(false);
    setSuggestions([]);
    setSearchQuery(q);
    setDebouncedQuery(q);

    // 2. Immediate audio playback from local catalog if matched
    const norm = q.toLowerCase().trim();
    const localMatch = allSongs.find(
      (s) =>
        s.title.toLowerCase().includes(norm) ||
        (s.titleAr && s.titleAr.toLowerCase().includes(norm)) ||
        s.artist.toLowerCase().includes(norm) ||
        (s.artistAr && s.artistAr.toLowerCase().includes(norm))
    );

    if (localMatch) {
      playSong(localMatch, allSongs);
    }

    // 3. Immediately query YouTube for official streaming track
    setIsSearchingYouTube(true);
    try {
      const ytResults = await SearchService.searchYouTubeMusic(q);
      if (ytResults && ytResults.length > 0) {
        setResults((prev) => ({ ...prev, youtubeResults: ytResults }));
        // If local match was not present, play first YouTube result immediately!
        if (!localMatch) {
          playSong(ytResults[0], ytResults);
        }
      }
    } catch (e) {
      console.warn('Direct suggestion play error:', e);
    } finally {
      setIsSearchingYouTube(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      handleSelectSuggestionAndPlay(searchQuery);
    }
  };

  const handleClearHistory = () => {
    StorageService.clearSearchHistory();
    setSearchHistory([]);
  };

  const handleRemoveHistoryItem = (item: string) => {
    const updated = StorageService.removeSearchQuery(item);
    setSearchHistory(updated);
  };

  const handleSongPlay = (song: Song, queueToUse?: Song[]) => {
    if (currentSong?.id === song.id) {
      togglePlayPause();
    } else {
      playSong(song, queueToUse);
    }
  };

  const filterTabs: { id: SearchFilterTab; labelKey: string }[] = [
    { id: 'all', labelKey: 'search_tab_all' },
    { id: 'songs', labelKey: 'search_tab_songs' },
    { id: 'artists', labelKey: 'search_tab_artists' },
    { id: 'albums', labelKey: 'search_tab_albums' },
    { id: 'lyrics', labelKey: 'search_tab_lyrics' },
    { id: 'youtube', labelKey: 'search_tab_youtube' },
  ];

  const hasQuery = Boolean(searchQuery.trim());
  const totalMatchesCount =
    results.songs.length +
    results.artists.length +
    results.albums.length +
    results.lyricsMatches.length +
    (results.youtubeResults?.length || 0);

  return (
    <div className="space-y-6 pb-32">
      {/* Prominent Large Search Bar */}
      <div id="search-bar-container" className="relative">
        <div className="relative flex items-center bg-[#161624] border-2 border-purple-500/40 focus-within:border-purple-500 rounded-2xl px-4 py-3.5 shadow-2xl transition-all">
          <Search className="w-5 h-5 text-purple-400 me-3 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={t('search_placeholder')}
            className="w-full bg-transparent text-white placeholder-gray-400 text-base sm:text-lg focus:outline-none"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSuggestions([]);
                setShowSuggestions(false);
              }}
              className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Clear search input"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Real-time search suggestions dropdown - immediately disappears on click and starts playing */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 z-30 bg-[#161624]/98 backdrop-blur-2xl border border-purple-500/30 rounded-2xl p-2 shadow-2xl shadow-purple-950/80 animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 mb-1">
              <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                <span>{t('search_suggestions')}</span>
              </span>
              <span className="text-[10px] text-gray-400 font-medium">
                {isRTL ? 'اضغط للتشغيل الفوري' : 'Tap to Play Instantly'}
              </span>
            </div>

            <div className="space-y-1">
              {suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSuggestionAndPlay(sug)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-gray-200 hover:text-white hover:bg-purple-600/30 border border-transparent hover:border-purple-500/30 transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 text-left">
                    <Search className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform flex-shrink-0" />
                    <span className="truncate font-medium group-hover:text-purple-200">{sug}</span>
                  </div>

                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-semibold group-hover:bg-purple-600 group-hover:text-white transition-colors ms-2 flex-shrink-0">
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isRTL ? 'تشغيل' : 'Play'}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs (All, Songs, Artists, Albums, Lyrics, YouTube) */}
      {hasQuery && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'bg-[#1b1b28] hover:bg-[#252538] text-gray-300 border border-white/5'
                }`}
              >
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>
      )}

      {/* Search History Chips (when input is empty) */}
      {!hasQuery && searchHistory.length > 0 && (
        <div className="space-y-3 p-4 rounded-3xl bg-[#161622]/60 border border-white/5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <History className="w-4 h-4 text-purple-400" />
              <span>{t('search_history')}</span>
            </h3>
            <button
              onClick={handleClearHistory}
              className="text-xs font-semibold text-gray-400 hover:text-rose-400 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('search_clear')}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {searchHistory.map((item, idx) => (
              <div
                key={idx}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1e1e2d] hover:bg-purple-600/20 border border-white/5 hover:border-purple-500/30 text-xs text-gray-300 hover:text-white transition-all"
              >
                <button onClick={() => handleSelectSuggestionAndPlay(item)} className="cursor-pointer">
                  {item}
                </button>
                <button
                  onClick={() => handleRemoveHistoryItem(item)}
                  className="text-gray-500 hover:text-white transition-colors"
                  aria-label={`Remove ${item} from history`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Results Display */}
      {hasQuery && (
        <div className="space-y-6">
          {totalMatchesCount === 0 && !isSearchingYouTube ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center text-gray-500">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">{t('search_no_results')}</h3>
              <p className="text-sm text-gray-400 max-w-sm mx-auto">
                {isRTL
                  ? 'جرب البحث باسم فنان آخر أو كتابة الحروف بدون تشكيل'
                  : 'Try searching with a different artist name or spelling.'}
              </p>
            </div>
          ) : null}

          {/* 1. Songs Results */}
          {(activeFilter === 'all' || activeFilter === 'songs') && results.songs.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400">
                {t('search_tab_songs')} ({results.songs.length})
              </h3>
              <div className="space-y-2">
                {results.songs.map((song) => {
                  const isCurrent = currentSong?.id === song.id;
                  const isSongPlaying = isCurrent && isPlaying;
                  const isFav = isFavorite(song.id);

                  return (
                    <div
                      key={song.id}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'bg-purple-950/30 border-purple-500/40'
                          : 'bg-[#161622] hover:bg-[#1d1d2c] border-white/5'
                      }`}
                    >
                      <button
                        onClick={() => handleSongPlay(song, results.songs)}
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

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-mono">
                          {formatDuration(song.duration)}
                        </span>
                        <button
                          onClick={() => toggleFavorite(song.id)}
                          className={`p-2 rounded-full ${
                            isFav ? 'text-pink-500' : 'text-gray-400 hover:text-white'
                          }`}
                          aria-label="Favorite"
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-pink-500' : ''}`} />
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
                })}
              </div>
            </div>
          )}

          {/* 2. YouTube Music Discovery Results */}
          {(activeFilter === 'all' || activeFilter === 'youtube') &&
            results.youtubeResults &&
            results.youtubeResults.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-red-400 flex items-center gap-2">
                    <Tv className="w-4 h-4" />
                    <span>{t('search_tab_youtube')}</span>
                  </h3>
                  <span className="text-[10px] text-gray-400 px-2 py-0.5 rounded bg-white/5 border border-white/5">
                    Official API Stream
                  </span>
                </div>

                <div className="space-y-2">
                  {results.youtubeResults.map((song) => {
                    const isCurrent = currentSong?.id === song.id;
                    const isSongPlaying = isCurrent && isPlaying;

                    return (
                      <div
                        key={song.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-[#18151f] hover:bg-[#201c2a] border border-red-500/20 hover:border-red-500/40 transition-all"
                      >
                        <button
                          onClick={() => handleSongPlay(song, results.youtubeResults)}
                          className="flex items-center gap-3.5 flex-1 min-w-0 text-left"
                        >
                          <div className="relative w-14 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-black">
                            <img
                              src={song.artwork_url}
                              alt={song.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              {isSongPlaying ? (
                                <Pause className="w-4 h-4 text-white fill-white" />
                              ) : (
                                <Play className="w-4 h-4 text-white fill-white ms-0.5" />
                              )}
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-white truncate">
                              {song.title}
                            </p>
                            <p className="text-xs text-gray-400 truncate mt-0.5">
                              {song.artist}
                            </p>
                          </div>
                        </button>

                        <div className="flex items-center gap-2 ms-2">
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
                  })}
                </div>
              </div>
            )}

          {/* 3. Artists Results */}
          {(activeFilter === 'all' || activeFilter === 'artists') && results.artists.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span>{t('search_tab_artists')}</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {results.artists.map((art) => (
                  <div
                    key={art.id}
                    className="p-4 rounded-2xl bg-[#161622] border border-white/5 flex flex-col items-center text-center"
                  >
                    <img
                      src={art.avatar_url}
                      alt={art.name}
                      className="w-16 h-16 rounded-full object-cover mb-2 border border-purple-500/30"
                    />
                    <p className="text-sm font-bold text-white truncate w-full">
                      {isRTL && art.nameAr ? art.nameAr : art.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {isRTL ? 'فنان' : 'Artist'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Lyrics Match Results */}
          {(activeFilter === 'all' || activeFilter === 'lyrics') && results.lyricsMatches.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                {t('search_tab_lyrics')} ({results.lyricsMatches.length})
              </h3>
              <div className="space-y-2">
                {results.lyricsMatches.map((song) => (
                  <div
                    key={`lyr-${song.id}`}
                    onClick={() => handleSongPlay(song)}
                    className="p-3.5 rounded-2xl bg-[#171622] hover:bg-[#1f1d2e] border border-white/5 cursor-pointer space-y-1.5 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-white">
                        {isRTL && song.titleAr ? song.titleAr : song.title}
                      </p>
                      <span className="text-xs text-gray-400">{song.artist}</span>
                    </div>
                    <p className="text-xs text-purple-200/80 italic line-clamp-2 font-mono">
                      "{song.lyricsAr || song.lyrics}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
