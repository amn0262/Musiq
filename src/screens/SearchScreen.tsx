import React, { useState, useEffect, useRef } from 'react';
import { useMusic } from '../context/MusicContext';
import { SearchService, extractYouTubeVideoId } from '../services/searchService';
import { StorageService } from '../services/storage';
import { Song } from '../types/music';
import { formatDuration } from '../utils/formatters';
import { matchesQuery } from '../utils/arabic';
import {
  Search,
  X,
  History,
  Trash2,
  Play,
  Pause,
  Heart,
  PlusCircle,
  Link2,
  Loader2,
  Music,
  Clock,
} from 'lucide-react';

export const SearchScreen: React.FC = () => {
  const {
    recentlyPlayed,
    currentSong,
    isPlaying,
    playSong,
    togglePlayPause,
    isFavorite,
    toggleFavorite,
    openAddToPlaylist,
    clearHistory,
    isRTL,
  } = useMusic();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>(() => StorageService.getSearchHistory());
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [youtubeResults, setYoutubeResults] = useState<Song[]>([]);
  const [isSearchingYouTube, setIsSearchingYouTube] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [directLinkInput, setDirectLinkInput] = useState('');

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  /**
   * Primary Search Function: Fetches live YouTube search results and returns all items without truncation
   */
  const performSearch = async (queryText: string, autoPlayFirst = false) => {
    const q = queryText.trim();
    if (!q) {
      setYoutubeResults([]);
      setHasSearched(false);
      setIsSearchingYouTube(false);
      return;
    }

    setShowSuggestions(false);
    setIsSearchingYouTube(true);
    setHasSearched(true);

    // 1. Direct YouTube Video ID or URL support
    const directYtId = extractYouTubeVideoId(q);
    if (directYtId) {
      const directTrack: Song = {
        id: `yt-direct-${directYtId}`,
        title: `YouTube Audio Stream (${directYtId})`,
        artist: 'YouTube',
        album: 'Direct Stream',
        artwork_url: '',
        duration: 240,
        category: 'trending',
        source: 'youtube',
        provider_track_id: directYtId,
        plays_count: 1000000,
      };
      setYoutubeResults([directTrack]);
      setIsSearchingYouTube(false);
      playSong(directTrack, [directTrack]);
      return;
    }

    // Save to history
    if (q.length >= 2) {
      const updated = StorageService.addSearchQuery(q);
      setSearchHistory(updated);
    }

    try {
      const results = await SearchService.searchYouTubeMusic(q);
      if (results && results.length > 0) {
        setYoutubeResults(results);
        if (autoPlayFirst) {
          playSong(results[0], results);
        }
      } else {
        // Fallback to recently played matches
        const localMatches = recentlyPlayed.filter(
          (s) =>
            matchesQuery(s.title, q) ||
            (s.titleAr && matchesQuery(s.titleAr, q)) ||
            matchesQuery(s.artist, q) ||
            (s.artistAr && matchesQuery(s.artistAr, q))
        );
        setYoutubeResults(localMatches);
        if (autoPlayFirst && localMatches.length > 0) {
          playSong(localMatches[0], localMatches);
        }
      }
    } catch (e) {
      console.warn('Search error:', e);
      const localMatches = recentlyPlayed.filter(
        (s) =>
          matchesQuery(s.title, q) ||
          (s.titleAr && matchesQuery(s.titleAr, q)) ||
          matchesQuery(s.artist, q) ||
          (s.artistAr && matchesQuery(s.artistAr, q))
      );
      setYoutubeResults(localMatches);
      if (autoPlayFirst && localMatches.length > 0) {
        playSong(localMatches[0], localMatches);
      }
    } finally {
      setIsSearchingYouTube(false);
    }
  };

  // Debounced search on input change
  const handleInputChange = (val: string) => {
    setSearchQuery(val);
    setShowSuggestions(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!val.trim()) {
      setSuggestions([]);
      setYoutubeResults([]);
      setHasSearched(false);
      setIsSearchingYouTube(false);
      return;
    }

    // Fetch quick suggestions
    SearchService.getRemoteSuggestions(val).then((sug) => {
      setSuggestions(sug);
    });

    // Debounce the live search by 400ms
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(val, false);
    }, 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      performSearch(searchQuery, false);
    }
  };

  const handleSelectSuggestionAndPlay = (sug: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setSearchQuery(sug);
    performSearch(sug, true);
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
    if (currentSong?.id === song.id || currentSong?.provider_track_id === song.provider_track_id) {
      togglePlayPause();
    } else {
      playSong(song, queueToUse || (youtubeResults.length > 0 ? youtubeResults : recentlyPlayed));
    }
  };

  const handleDirectLinkSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!directLinkInput.trim()) return;
    performSearch(directLinkInput.trim(), true);
    setDirectLinkInput('');
  };

  const hasQuery = Boolean(searchQuery.trim());

  return (
    <div className="space-y-4 pb-32">
      {/* Search Input Container */}
      <div id="search-bar-container" className="relative">
        <div className="relative flex items-center bg-[#121217] border border-[#242432] focus-within:border-gray-300 rounded-xl px-3.5 py-3 shadow-md transition-colors">
          <Search className="w-5 h-5 text-gray-400 me-2.5 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={isRTL ? 'ابحث في يوتيوب عن أي أغنية أو فنان...' : 'Search YouTube for any song or artist...'}
            className="w-full bg-transparent text-white placeholder-gray-500 text-sm sm:text-base focus:outline-none"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => {
                if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                setSearchQuery('');
                setSuggestions([]);
                setShowSuggestions(false);
                setYoutubeResults([]);
                setHasSearched(false);
                setIsSearchingYouTube(false);
              }}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Clear"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {isSearchingYouTube && (
            <Loader2 className="w-4 h-4 text-gray-300 animate-spin ms-2 flex-shrink-0" />
          )}
        </div>

        {/* Search Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 z-30 bg-[#14141c] border border-[#262636] rounded-xl p-1.5 shadow-xl animate-in fade-in duration-100">
            <div className="space-y-0.5">
              {suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSuggestionAndPlay(sug)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{sug}</span>
                  </div>
                  <span className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded ms-2 flex-shrink-0">
                    {isRTL ? 'تشغيل' : 'Play'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Direct YouTube Link/ID Quick Stream Input */}
      <form
        onSubmit={handleDirectLinkSubmit}
        className="flex items-center gap-2 p-2 rounded-xl bg-[#121217] border border-[#242432] focus-within:border-gray-400"
      >
        <Link2 className="w-4 h-4 text-gray-400 ms-2 flex-shrink-0" />
        <input
          type="text"
          value={directLinkInput}
          onChange={(e) => setDirectLinkInput(e.target.value)}
          placeholder={isRTL ? 'أو الصق رابط يوتيوب مباشر أو معرف المقطع للتشغيل الفوري...' : 'Or paste a YouTube URL / Video ID to stream directly...'}
          className="w-full bg-transparent text-white placeholder-gray-500 text-xs sm:text-sm focus:outline-none px-1"
        />
        <button
          type="submit"
          disabled={!directLinkInput.trim()}
          className="px-3.5 py-1.5 rounded-lg bg-white text-black hover:bg-gray-200 disabled:opacity-30 disabled:pointer-events-none text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>{isRTL ? 'تشغيل' : 'Play'}</span>
        </button>
      </form>

      {/* Search History Chips (when no query) */}
      {!hasQuery && searchHistory.length > 0 && (
        <div className="space-y-2 p-3 rounded-xl bg-[#121217] border border-[#22222e]">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-gray-400" />
              <span>{isRTL ? 'سجل البحث' : 'Recent Searches'}</span>
            </h3>
            <button
              onClick={handleClearHistory}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>{isRTL ? 'مسح' : 'Clear'}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {searchHistory.map((item, idx) => (
              <div
                key={idx}
                className="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a1a24] border border-[#282838] text-xs text-gray-300 hover:text-white transition-colors"
              >
                <button onClick={() => handleSelectSuggestionAndPlay(item)} className="cursor-pointer">
                  {item}
                </button>
                <button
                  onClick={() => handleRemoveHistoryItem(item)}
                  className="text-gray-500 hover:text-white transition-colors cursor-pointer"
                  aria-label="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active YouTube Search Results (All Results, No Images, Simple Colors) */}
      {hasQuery && (
        <div className="space-y-2">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white" />
              <span>{isRTL ? 'نتائج البحث في يوتيوب' : 'YouTube Search Results'}</span>
              <span className="text-xs text-gray-500 font-normal">
                ({youtubeResults.length} {isRTL ? 'نتيجة' : 'results'})
              </span>
            </h3>
            {isSearchingYouTube && (
              <span className="text-xs text-gray-400 flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin text-gray-300" />
                <span>{isRTL ? 'جاري البحث...' : 'Searching...'}</span>
              </span>
            )}
          </div>

          {/* Loading Skeleton */}
          {isSearchingYouTube && youtubeResults.length === 0 && (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#121217] border border-[#22222e]">
                  <div className="w-10 h-10 rounded-lg bg-white/5" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-white/10 rounded w-2/3" />
                    <div className="h-2.5 bg-white/5 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results Message */}
          {!isSearchingYouTube && hasSearched && youtubeResults.length === 0 && (
            <div className="text-center py-12 space-y-2 rounded-xl bg-[#121217] border border-[#22222e]">
              <Search className="w-8 h-8 text-gray-500 mx-auto" />
              <p className="text-sm text-gray-300">
                {isRTL ? 'لم يتم العثور على نتائج، جرب كلمات بحث أخرى' : 'No results found on YouTube, try another keyword'}
              </p>
            </div>
          )}

          {/* Results List: Showing ALL results, No Images */}
          {youtubeResults.length > 0 && (
            <div className="space-y-1.5">
              {youtubeResults.map((song, index) => {
                const isCurrent =
                  currentSong?.provider_track_id === song.provider_track_id || currentSong?.id === song.id;
                const isSongPlaying = isCurrent && isPlaying;
                const isFav = isFavorite(song.id);

                return (
                  <div
                    key={song.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                      isCurrent
                        ? 'bg-[#1c1c28] border-gray-400 text-white'
                        : 'bg-[#121217] hover:bg-[#181822] border-[#22222e] text-gray-300'
                    }`}
                  >
                    <button
                      onClick={() => handleSongPlay(song, youtubeResults)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
                    >
                      {/* Audio Icon Box instead of Image */}
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                          isCurrent
                            ? 'bg-white text-black border-white'
                            : 'bg-white/5 border-white/10 text-gray-400'
                        }`}
                      >
                        {isSongPlaying ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ms-0.5" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-semibold truncate ${isCurrent ? 'text-white font-bold' : 'text-gray-200'}`}>
                          {song.title}
                        </p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {song.artist}
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-1.5 ms-2 flex-shrink-0">
                      <span className="text-xs text-gray-500 font-mono hidden sm:inline">
                        {formatDuration(song.duration)}
                      </span>
                      <button
                        onClick={() => toggleFavorite(song.id)}
                        className={`p-1.5 rounded-lg cursor-pointer ${
                          isFav ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                        }`}
                        aria-label="Favorite"
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
                      </button>
                      <button
                        onClick={() => openAddToPlaylist(song)}
                        className="p-1.5 text-gray-500 hover:text-gray-300 cursor-pointer"
                        aria-label="Add to playlist"
                      >
                        <PlusCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* When no active search query: Show Recently Played Songs (Most recent at the top!) */}
      {!hasQuery && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>{isRTL ? 'الأغاني التي تم تشغيلها مؤخراً' : 'Recently Played Songs'}</span>
            </h3>
            {recentlyPlayed.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>{isRTL ? 'مسح السجل' : 'Clear'}</span>
              </button>
            )}
          </div>

          {recentlyPlayed.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-xl bg-[#121217] border border-[#22222e] space-y-2">
              <Music className="w-10 h-10 text-gray-600 mx-auto" />
              <p className="text-sm font-semibold text-gray-300">
                {isRTL ? 'لا توجد أغانٍ تم تشغيلها مؤخراً' : 'No recently played songs yet'}
              </p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                {isRTL
                  ? 'ابحث في يوتيوب في مربع البحث أعلاه أو الصق رابطاً لتشغيل الأغاني مباشرة وسوف تظهر هنا مرتبة حسب آخر أغنية استمعت إليها.'
                  : 'Search YouTube above or paste a link to start streaming; your recent tracks will appear here with the latest on top.'}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentlyPlayed.map((song, index) => {
                const isCurrent =
                  currentSong?.id === song.id || currentSong?.provider_track_id === song.provider_track_id;
                const isSongPlaying = isCurrent && isPlaying;
                const isFav = isFavorite(song.id);

                return (
                  <div
                    key={`${song.id}-${index}`}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                      isCurrent
                        ? 'bg-[#1c1c28] border-gray-400 text-white'
                        : 'bg-[#121217] hover:bg-[#181822] border-[#22222e] text-gray-300'
                    }`}
                  >
                    <button
                      onClick={() => handleSongPlay(song, recentlyPlayed)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
                    >
                      {/* Audio Icon Box instead of Image */}
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                          isCurrent
                            ? 'bg-white text-black border-white'
                            : 'bg-white/5 border-white/10 text-gray-400'
                        }`}
                      >
                        {isSongPlaying ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ms-0.5" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold truncate ${isCurrent ? 'text-white font-bold' : 'text-gray-200'}`}>
                            {isRTL && song.titleAr ? song.titleAr : song.title}
                          </p>
                          {index === 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/10 text-gray-300 flex-shrink-0">
                              {isRTL ? 'الأحدث' : 'Latest'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {isRTL && song.artistAr ? song.artistAr : song.artist}
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-1.5 ms-2 flex-shrink-0">
                      <span className="text-xs text-gray-500 font-mono hidden sm:inline">
                        {formatDuration(song.duration)}
                      </span>
                      <button
                        onClick={() => toggleFavorite(song.id)}
                        className={`p-1.5 rounded-lg cursor-pointer ${
                          isFav ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                        }`}
                        aria-label="Favorite"
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
                      </button>
                      <button
                        onClick={() => openAddToPlaylist(song)}
                        className="p-1.5 text-gray-500 hover:text-gray-300 cursor-pointer"
                        aria-label="Add to playlist"
                      >
                        <PlusCircle className="w-4 h-4" />
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
