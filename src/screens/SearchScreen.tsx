import React, { useState, useEffect, useTransition } from 'react';
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
  Sparkles,
  Link2,
  Loader2,
  TrendingUp,
} from 'lucide-react';

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
  const [searchHistory, setSearchHistory] = useState<string[]>(() => StorageService.getSearchHistory());
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [youtubeResults, setYoutubeResults] = useState<Song[]>([]);
  const [isSearchingYouTube, setIsSearchingYouTube] = useState(false);
  const [directLinkInput, setDirectLinkInput] = useState('');
  const [, startTransition] = useTransition();

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

  // Debounce search input by 280ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch real-time YouTube suggestions while typing
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

  // Execute real YouTube search when debounced query changes
  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q) {
      setYoutubeResults([]);
      setIsSearchingYouTube(false);
      return;
    }

    // Save to history when search has substance
    if (q.length >= 2) {
      const updated = StorageService.addSearchQuery(q);
      setSearchHistory(updated);
    }

    setIsSearchingYouTube(true);
    SearchService.searchYouTubeMusic(q)
      .then((results) => {
        startTransition(() => {
          setYoutubeResults(results || []);
        });
      })
      .catch((e) => {
        console.warn('YouTube search error:', e);
      })
      .finally(() => {
        setIsSearchingYouTube(false);
      });
  }, [debouncedQuery]);

  /**
   * Immediately hides suggestions and triggers instant audio playback of the selected track
   */
  const handleSelectSuggestionAndPlay = async (q: string) => {
    setShowSuggestions(false);
    setSuggestions([]);
    setSearchQuery(q);
    setDebouncedQuery(q);

    // 1. Direct YouTube Video ID or URL paste support
    const directYtId = extractYouTubeVideoId(q);
    if (directYtId) {
      const directTrack: Song = {
        id: `yt-direct-${directYtId}`,
        title: `YouTube Audio Stream (${directYtId})`,
        artist: 'YouTube Track',
        album: 'Direct Stream',
        artwork_url: `https://i.ytimg.com/vi/${directYtId}/hqdefault.jpg`,
        duration: 240,
        category: 'trending',
        source: 'youtube',
        provider_track_id: directYtId,
        plays_count: 1000000,
      };
      playSong(directTrack, [directTrack, ...allSongs]);
      return;
    }

    // 2. Immediate playback from catalog if matched
    const localMatch = allSongs.find(
      (s) =>
        matchesQuery(s.title, q) ||
        (s.titleAr && matchesQuery(s.titleAr, q)) ||
        matchesQuery(s.artist, q) ||
        (s.artistAr && matchesQuery(s.artistAr, q))
    );

    if (localMatch) {
      playSong(localMatch, allSongs);
      return;
    }

    // 3. Query YouTube live endpoint and immediately play first result
    setIsSearchingYouTube(true);
    try {
      const ytResults = await SearchService.searchYouTubeMusic(q);
      if (ytResults && ytResults.length > 0) {
        setYoutubeResults(ytResults);
        playSong(ytResults[0], ytResults);
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
      playSong(song, queueToUse || (youtubeResults.length > 0 ? youtubeResults : allSongs));
    }
  };

  const handleDirectLinkSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!directLinkInput.trim()) return;
    handleSelectSuggestionAndPlay(directLinkInput.trim());
    setDirectLinkInput('');
  };

  const hasQuery = Boolean(searchQuery.trim());

  return (
    <div className="space-y-6 pb-32">
      {/* Prominent Large Search Box */}
      <div id="search-bar-container" className="relative">
        <div className="relative flex items-center bg-[#13131c] border-2 border-purple-500/40 focus-within:border-purple-500 rounded-2xl px-4 py-3.5 shadow-xl transition-all">
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
            placeholder={isRTL ? 'ابحث في يوتيوب عن أي أغنية، فنان أو ألبوم...' : 'Search YouTube for any song, artist or album...'}
            className="w-full bg-transparent text-white placeholder-gray-500 text-base sm:text-lg focus:outline-none"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSuggestions([]);
                setShowSuggestions(false);
                setYoutubeResults([]);
              }}
              className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Clear"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Real-time search suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 z-30 bg-[#161624]/98 backdrop-blur-2xl border border-purple-500/30 rounded-2xl p-2 shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 mb-1">
              <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                <span>{isRTL ? 'اقتراحات يوتيوب' : 'YouTube Suggestions'}</span>
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

                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-semibold group-hover:bg-purple-600 group-hover:text-white transition-colors ms-2 flex-shrink-0">
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isRTL ? 'تشغيل' : 'Play'}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Direct YouTube Link/ID Quick Input */}
      <form
        onSubmit={handleDirectLinkSubmit}
        className="flex items-center gap-2 p-2.5 sm:p-3 rounded-2xl bg-[#13131c] border border-white/10 focus-within:border-red-500/50 shadow-md"
      >
        <Link2 className="w-4 h-4 text-red-400 ms-2 flex-shrink-0" />
        <input
          type="text"
          value={directLinkInput}
          onChange={(e) => setDirectLinkInput(e.target.value)}
          placeholder={isRTL ? 'أو الصق رابط يوتيوب مباشر أو معرف فيديو هنا للتشغيل الفوري...' : 'Or paste a YouTube URL / Video ID here to stream instantly...'}
          className="w-full bg-transparent text-white placeholder-gray-500 text-xs sm:text-sm focus:outline-none px-1"
        />
        <button
          type="submit"
          disabled={!directLinkInput.trim()}
          className="px-3 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-900/30 transition-all active:scale-95 flex-shrink-0"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isRTL ? 'تشغيل' : 'Play'}</span>
        </button>
      </form>

      {/* Search History Chips */}
      {!hasQuery && searchHistory.length > 0 && (
        <div className="space-y-2 p-3.5 rounded-2xl bg-[#13131c]/60 border border-white/5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-purple-400" />
              <span>{isRTL ? 'سجل البحث' : 'Recent Searches'}</span>
            </h3>
            <button
              onClick={handleClearHistory}
              className="text-xs text-gray-400 hover:text-rose-400 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>{isRTL ? 'مسح' : 'Clear'}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {searchHistory.map((item, idx) => (
              <div
                key={idx}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1c1c28] hover:bg-purple-600/20 border border-white/5 hover:border-purple-500/30 text-xs text-gray-300 hover:text-white transition-all"
              >
                <button onClick={() => handleSelectSuggestionAndPlay(item)} className="cursor-pointer">
                  {item}
                </button>
                <button
                  onClick={() => handleRemoveHistoryItem(item)}
                  className="text-gray-500 hover:text-white transition-colors"
                  aria-label="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active YouTube Live Search Results */}
      {hasQuery && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-red-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>{isRTL ? 'نتائج يوتيوب المباشرة' : 'Live YouTube Search Results'}</span>
            </h3>
            {isSearchingYouTube && (
              <span className="text-xs text-gray-400 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                <span>{isRTL ? 'جاري البحث في يوتيوب...' : 'Searching YouTube...'}</span>
              </span>
            )}
          </div>

          {youtubeResults.length === 0 && !isSearchingYouTube ? (
            <div className="text-center py-12 space-y-2 rounded-2xl bg-[#13131c]/50 border border-white/5">
              <p className="text-sm text-gray-400">
                {isRTL ? 'لم يتم العثور على نتائج، جرب كلمات بحث أخرى' : 'No results found on YouTube, try another keyword'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {youtubeResults.map((song) => {
                const isCurrent = currentSong?.provider_track_id === song.provider_track_id || currentSong?.id === song.id;
                const isSongPlaying = isCurrent && isPlaying;
                const isFav = isFavorite(song.id);

                return (
                  <div
                    key={song.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-purple-950/30 border-purple-500/50 shadow-lg shadow-purple-950/50'
                        : 'bg-[#13131c] hover:bg-[#1a1a27] border-white/5'
                    }`}
                  >
                    <button
                      onClick={() => handleSongPlay(song, youtubeResults)}
                      className="flex items-center gap-3.5 flex-1 min-w-0 text-left cursor-pointer"
                    >
                      <div className="relative w-14 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-black">
                        <img
                          src={song.artwork_url}
                          alt={song.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
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
                          {song.title}
                        </p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {song.artist}
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 ms-2">
                      <span className="text-xs text-gray-400 font-mono hidden sm:inline">
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
          )}
        </div>
      )}

      {/* When no search query, show Top YouTube Streaming Catalog */}
      {!hasQuery && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>{isRTL ? 'الأكثر استماعاً على يوتيوب' : 'Trending on YouTube'}</span>
            </h3>
            <span className="text-xs text-gray-400 font-medium">
              {isRTL ? `${allSongs.length} أغنية جاهزة للتشغيل` : `${allSongs.length} songs ready`}
            </span>
          </div>

          <div className="space-y-2">
            {allSongs.map((song) => {
              const isCurrent = currentSong?.id === song.id;
              const isSongPlaying = isCurrent && isPlaying;
              const isFav = isFavorite(song.id);

              return (
                <div
                  key={song.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-purple-950/30 border-purple-500/50 shadow-lg shadow-purple-950/50'
                      : 'bg-[#13131c] hover:bg-[#1a1a27] border-white/5'
                  }`}
                >
                  <button
                    onClick={() => handleSongPlay(song, allSongs)}
                    className="flex items-center gap-3.5 flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-black">
                      <img
                        src={song.artwork_url}
                        alt={song.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
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

                  <div className="flex items-center gap-2 ms-2">
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
    </div>
  );
};
