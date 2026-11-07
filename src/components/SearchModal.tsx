import React, { useState, useEffect, useRef } from 'react';
import { useMusic } from '../context/MusicContext';
import { SearchService, extractYouTubeVideoId } from '../services/searchService';
import { Song } from '../types/music';
import { formatDuration } from '../utils/formatters';
import { matchesQuery } from '../utils/arabic';
import { detectContentType, getContentTypeInfo } from '../utils/contentType';
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
  Film,
  Mic,
  Radio,
  Video,
  Sparkles,
} from 'lucide-react';

export const SearchModal: React.FC = () => {
  const {
    isSearchModalOpen,
    closeSearchModal,
    searchModalInitialQuery,
    searchHistory,
    addSearchHistoryItem,
    removeSearchHistoryItem,
    clearSearchHistory,
    currentSong,
    isPlaying,
    playSong,
    togglePlayPause,
    isFavorite,
    toggleFavorite,
    openAddToPlaylist,
    openFullScreenPlayer,
    recentlyPlayed,
  } = useMusic();

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [results, setResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [directLinkInput, setDirectLinkInput] = useState('');
  const [showDirectLink, setShowDirectLink] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync initial query when opened
  useEffect(() => {
    if (isSearchModalOpen) {
      const q = searchModalInitialQuery || '';
      setQuery(q);
      setSuggestions([]);
      setShowSuggestions(false);
      setResults([]);
      setHasSearched(false);
      setIsSearching(false);
      setShowDirectLink(false);
      setDirectLinkInput('');

      // Focus input
      setTimeout(() => {
        inputRef.current?.focus();
        if (q) {
          executeSearch(q, false);
        }
      }, 50);
    }
  }, [isSearchModalOpen, searchModalInitialQuery]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchModalOpen) {
        closeSearchModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchModalOpen, closeSearchModal]);

  const executeSearch = async (queryText: string, autoPlayFirst = false) => {
    const q = queryText.trim();
    if (!q) {
      setResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    setShowSuggestions(false);
    setIsSearching(true);
    setHasSearched(true);

    // Check direct video id or url
    const directYtId = extractYouTubeVideoId(q);
    if (directYtId) {
      const directTrack: Song = {
        id: `yt-direct-${directYtId}`,
        title: `YouTube Audio (${directYtId})`,
        artist: 'YouTube Direct',
        album: 'Direct Stream',
        artwork_url: '',
        duration: 240,
        category: 'trending',
        source: 'youtube',
        provider_track_id: directYtId,
        plays_count: 1000000,
      };
      setResults([directTrack]);
      setIsSearching(false);
      playSong(directTrack, [directTrack]);
      addSearchHistoryItem(q);
      closeSearchModal();
      openFullScreenPlayer();
      return;
    }

    // Save to recent search keywords
    addSearchHistoryItem(q);

    try {
      const fetched = await SearchService.searchYouTubeMusic(q);
      if (fetched && fetched.length > 0) {
        setResults(fetched);
        if (autoPlayFirst) {
          playSong(fetched[0], fetched);
          closeSearchModal();
          openFullScreenPlayer();
        }
      } else {
        // Fallback to local recently played matches
        const localMatches = recentlyPlayed.filter(
          (s) =>
            matchesQuery(s.title, q) ||
            (s.titleAr && matchesQuery(s.titleAr, q)) ||
            matchesQuery(s.artist, q) ||
            (s.artistAr && matchesQuery(s.artistAr, q))
        );
        setResults(localMatches);
        if (autoPlayFirst && localMatches.length > 0) {
          playSong(localMatches[0], localMatches);
          closeSearchModal();
          openFullScreenPlayer();
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
      setResults(localMatches);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (val: string) => {
    setQuery(val);
    setShowSuggestions(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!val.trim()) {
      setSuggestions([]);
      setResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    // Fetch live suggestions
    SearchService.getRemoteSuggestions(val).then((sug) => {
      setSuggestions(sug);
    });

    searchTimeoutRef.current = setTimeout(() => {
      executeSearch(val, false);
    }, 450);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      executeSearch(query, false);
    }
  };

  const handlePickKeyword = (keyword: string) => {
    setQuery(keyword);
    setShowSuggestions(false);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    executeSearch(keyword, false);
  };

  const handleDirectLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directLinkInput.trim()) return;
    executeSearch(directLinkInput.trim(), true);
    setDirectLinkInput('');
  };

  const handleTrackClick = (song: Song) => {
    const queueToUse = results.length > 0 ? results : [song];
    playSong(song, queueToUse);
    closeSearchModal();
    openFullScreenPlayer();
  };

  if (!isSearchModalOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search Modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 animate-in fade-in duration-150 overflow-y-auto"
      onClick={closeSearchModal}
    >
      <div
        className="w-full max-w-2xl bg-[#111117] border border-[#262638] rounded-2xl shadow-2xl overflow-hidden flex flex-col my-4 sm:my-8 text-white max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header & Search Bar */}
        <div className="p-3 sm:p-4 border-b border-[#20202e] bg-[#14141c] space-y-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/10 text-white flex items-center justify-center">
                <Search className="w-4 h-4" />
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                البحث الموسيقي السريع
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDirectLink(!showDirectLink)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  showDirectLink
                    ? 'bg-white text-black border-white'
                    : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
                }`}
                title="رابط يوتيوب مباشر"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">رابط مباشر</span>
              </button>

              <button
                type="button"
                onClick={closeSearchModal}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search Input Box */}
          <div className="relative flex items-center bg-[#0c0c10] border border-[#2b2b3d] focus-within:border-gray-400 rounded-xl px-3.5 py-2.5 transition-colors">
            <Search className="w-4 h-4 text-gray-400 me-2.5 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب اسم الأغنية أو الفنان أو الكلمة..."
              className="w-full bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none"
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                  setQuery('');
                  setSuggestions([]);
                  setShowSuggestions(false);
                  setResults([]);
                  setHasSearched(false);
                  setIsSearching(false);
                  inputRef.current?.focus();
                }}
                className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Clear search text"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {isSearching && (
              <Loader2 className="w-4 h-4 text-gray-300 animate-spin ms-2 flex-shrink-0" />
            )}
          </div>

          {/* Direct link input drawer if toggled */}
          {showDirectLink && (
            <form
              onSubmit={handleDirectLinkSubmit}
              className="flex items-center gap-2 p-2 rounded-xl bg-[#0c0c10] border border-[#2b2b3d] animate-in fade-in"
            >
              <Link2 className="w-4 h-4 text-gray-400 ms-1 flex-shrink-0" />
              <input
                type="text"
                value={directLinkInput}
                onChange={(e) => setDirectLinkInput(e.target.value)}
                placeholder="الصق رابط فيديو يوتيوب أو معرف الفيديو (Video ID)..."
                className="w-full bg-transparent text-white placeholder-gray-500 text-xs focus:outline-none px-1"
              />
              <button
                type="submit"
                disabled={!directLinkInput.trim()}
                className="px-3 py-1 rounded-lg bg-white text-black hover:bg-gray-200 disabled:opacity-30 text-xs font-bold transition-colors cursor-pointer flex-shrink-0"
              >
                تشغيل
              </button>
            </form>
          )}

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="bg-[#171722] border border-[#2d2d40] rounded-xl p-1.5 shadow-xl max-h-48 overflow-y-auto no-scrollbar">
              {suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePickKeyword(sug)}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Search className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{sug}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">
                    بحث
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Modal Body: Recent Words (الكلمات المؤخرة) & Results */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 no-scrollbar">
          {/* الكلمات المؤخرة (Recent Searches) Section */}
          <div className="space-y-2.5 p-3 rounded-xl bg-[#14141c] border border-[#242436]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-gray-400" />
                <h3 className="text-xs font-bold text-gray-300">
                  الكلمات المؤخرة
                </h3>
                <span className="text-[10px] text-gray-500 font-mono">
                  ({searchHistory.length})
                </span>
              </div>

              {searchHistory.length > 0 && (
                <button
                  type="button"
                  onClick={clearSearchHistory}
                  className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1 cursor-pointer"
                  title="مسح الكلمات المؤخرة"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>مسح السجل</span>
                </button>
              )}
            </div>

            {searchHistory.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-1">
                لا توجد كلمات بحث مؤخرة بعد
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {searchHistory.map((item, idx) => (
                  <div
                    key={`hist-${idx}-${item}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1c1c28] hover:bg-[#252538] border border-[#2d2d42] text-xs text-gray-200 transition-colors group"
                  >
                    <button
                      type="button"
                      onClick={() => handlePickKeyword(item)}
                      className="cursor-pointer hover:text-white"
                    >
                      {item}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSearchHistoryItem(item)}
                      className="text-gray-500 hover:text-white transition-colors cursor-pointer p-0.5 ms-0.5"
                      aria-label={`Remove ${item}`}
                      title="حذف هذه الكلمة"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search Results List (NO IMAGES) */}
          {hasSearched && (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span>نتائج البحث ({results.length})</span>
                </h3>
                {isSearching && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>جاري البحث في يوتيوب...</span>
                  </span>
                )}
              </div>

              {/* Loading State */}
              {isSearching && results.length === 0 && (
                <div className="space-y-2 animate-pulse py-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[#14141c] border border-[#242436]"
                    >
                      <div className="w-9 h-9 rounded-lg bg-white/5" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 bg-white/10 rounded w-1/2" />
                        <div className="h-2.5 bg-white/5 rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No Results State */}
              {!isSearching && results.length === 0 && (
                <div className="text-center py-10 space-y-2 rounded-xl bg-[#14141c] border border-[#242436]">
                  <Search className="w-8 h-8 text-gray-500 mx-auto" />
                  <p className="text-sm text-gray-300 font-medium">لم يتم العثور على نتائج</p>
                  <p className="text-xs text-gray-500">جرب البحث بكلمة أخرى أو فنان آخر</p>
                </div>
              )}

              {/* Results Rows - Strictly NO IMAGES */}
              {results.length > 0 && (
                <div className="space-y-1.5">
                  {results.map((song) => {
                    const isCurrent =
                      currentSong?.provider_track_id === song.provider_track_id || currentSong?.id === song.id;
                    const isSongPlaying = isCurrent && isPlaying;
                    const isFav = isFavorite(song.id);

                    const cType = song.contentType || detectContentType(song.title, song.artist);
                    const info = getContentTypeInfo(cType);

                    return (
                      <div
                        key={song.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                          isCurrent
                            ? 'bg-[#1c1c28] border-gray-400 text-white'
                            : 'bg-[#14141c] hover:bg-[#1b1b26] border-[#222232] text-gray-300'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleTrackClick(song)}
                          className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
                        >
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                              isCurrent
                                ? 'bg-white text-black border-white font-bold'
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
                            <p
                              className={`text-sm font-semibold truncate ${
                                isCurrent ? 'text-white font-bold' : 'text-gray-200'
                              }`}
                            >
                              {song.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 min-w-0">
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.2 rounded border flex-shrink-0 ${info.badgeClass}`}
                              >
                                {cType === 'movie' && <Film className="w-2.5 h-2.5" />}
                                {cType === 'podcast' && <Mic className="w-2.5 h-2.5" />}
                                {cType === 'live' && <Radio className="w-2.5 h-2.5" />}
                                {cType === 'video' && <Video className="w-2.5 h-2.5" />}
                                {cType === 'music' && <Music className="w-2.5 h-2.5" />}
                                <span>{info.label}</span>
                              </span>
                              <p className="text-xs text-gray-400 truncate">
                                {song.artist}
                              </p>
                            </div>
                          </div>
                        </button>

                        <div className="flex items-center gap-1.5 ms-2 flex-shrink-0">
                          <span className="text-xs text-gray-500 font-mono hidden sm:inline">
                            {formatDuration(song.duration)}
                          </span>

                          <button
                            type="button"
                            onClick={() => toggleFavorite(song.id)}
                            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                              isFav ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                            }`}
                            aria-label="Toggle favorite"
                            title={isFav ? 'في المفضلة' : 'أضف للمفضلة'}
                          >
                            <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
                          </button>

                          <button
                            type="button"
                            onClick={() => openAddToPlaylist(song)}
                            className="p-1.5 text-gray-500 hover:text-gray-300 cursor-pointer transition-colors"
                            aria-label="Add to playlist"
                            title="إضافة إلى قائمة تشغيل"
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
      </div>
    </div>
  );
};
