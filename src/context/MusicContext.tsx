import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Song, Playlist, UserProfile, Gender } from '../types/music';
import { INITIAL_SONGS } from '../data/catalog';
import { StorageService, AppSettings, DEFAULT_SETTINGS, DEFAULT_USER } from '../services/storage';
import { audioEngine } from '../services/audioEngine';
import {
  shuffleQueue,
  getNextTrackIndex,
  getPrevTrackIndex,
  canAddSongToPlaylist,
  reorderList,
  RepeatMode,
} from '../utils/playlistRules';
import { youtubeAudioService, SoundEnhancerPreset } from '../services/youtubeAudioService';
import { detectSongTheme, applyThemeVariables, SongTheme } from '../utils/themeSystem';

export type TabType = 'home' | 'search' | 'library' | 'playlists' | 'settings';
export type PlaybackEngineMode = 'audio' | 'youtube';

interface MusicContextType {
  // Navigation & UI
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isFullScreenPlayerOpen: boolean;
  openFullScreenPlayer: () => void;
  closeFullScreenPlayer: () => void;
  isAddToPlaylistOpen: boolean;
  songForPlaylistModal: Song | null;
  openAddToPlaylist: (song: Song) => void;
  closeAddToPlaylist: () => void;
  isSoundEnhancerOpen: boolean;
  openSoundEnhancer: () => void;
  closeSoundEnhancer: () => void;

  // Onboarding & App Tour
  isTourOpen: boolean;
  openTour: () => void;
  closeTour: () => void;
  completeOnboarding: (name: string, gender: Gender, preferredGenres: string[]) => void;

  // Sound Enhancer & Audio Mastering
  soundEnhancerPreset: SoundEnhancerPreset;
  setSoundEnhancerPreset: (preset: SoundEnhancerPreset) => void;
  soundEnhancerEnabled: boolean;
  toggleSoundEnhancer: () => void;

  // Adaptive Visual Theme per Song
  currentTheme: SongTheme;

  // Player State
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isShuffled: boolean;
  repeatMode: RepeatMode;
  playbackMode: PlaybackEngineMode;
  setPlaybackMode: (mode: PlaybackEngineMode) => void;

  // Queue
  queue: Song[];
  queueIndex: number;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  reorderQueueItem: (from: number, to: number) => void;
  clearQueue: () => void;

  // Playback Actions
  playSong: (song: Song, newQueue?: Song[]) => void;
  togglePlayPause: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (val: number) => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;

  // Playlists
  playlists: Playlist[];
  createPlaylist: (name: string, description?: string, coverUrl?: string) => Playlist;
  deletePlaylist: (id: string) => void;
  renamePlaylist: (id: string, newName: string) => void;
  addSongToPlaylist: (playlistId: string, songId: string) => { success: boolean; message?: string };
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;
  reorderPlaylistSong: (playlistId: string, fromIndex: number, toIndex: number) => void;
  getPlaylistById: (id: string) => Playlist | undefined;

  // Favorites & History
  favorites: string[];
  toggleFavorite: (songId: string) => void;
  isFavorite: (songId: string) => boolean;
  recentlyPlayed: Song[];
  clearHistory: () => void;

  // Songs Catalog
  allSongs: Song[];
  findSongById: (id: string) => Song | undefined;

  // Settings & Localization
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  user: UserProfile;
  updateUser: (newUser: Partial<UserProfile>) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const MusicContext = createContext<MusicContextType | null>(null);

// Bilingual translations dictionary for Arabic & English
const TRANSLATIONS: Record<string, { ar: string; en: string }> = {
  // Navigation
  nav_home: { ar: 'الرئيسية', en: 'Home' },
  nav_search: { ar: 'بحث', en: 'Search' },
  nav_library: { ar: 'المكتبة', en: 'Library' },
  nav_playlists: { ar: 'قوائم التشغيل', en: 'Playlists' },
  nav_settings: { ar: 'الإعدادات', en: 'Settings' },

  // Search
  search_placeholder: { ar: 'ابحث عن أغنية، فنان أو ألبوم…', en: 'Search for songs, artists or albums…' },
  search_history: { ar: 'سجل البحث الأخير', en: 'Recent Searches' },
  search_clear: { ar: 'مسح السجل', en: 'Clear History' },
  search_suggestions: { ar: 'اقتراحات البحث', en: 'Suggestions' },
  search_no_results: { ar: 'لم يتم العثور على نتائج', en: 'No results found' },
  search_tab_all: { ar: 'الكل', en: 'All' },
  search_tab_songs: { ar: 'الأغاني', en: 'Songs' },
  search_tab_artists: { ar: 'الفنانون', en: 'Artists' },
  search_tab_albums: { ar: 'الألبومات', en: 'Albums' },
  search_tab_lyrics: { ar: 'كلمات الأغاني', en: 'Lyrics' },
  search_tab_youtube: { ar: 'يوتيوب ديسكفري', en: 'YouTube Discovery' },

  // Categories
  cat_all: { ar: 'الكل', en: 'All' },
  cat_arabic: { ar: 'موسيقى عربية', en: 'Arabic Music' },
  cat_international: { ar: 'عالمي', en: 'International' },
  cat_pop: { ar: 'بوب', en: 'Pop' },
  cat_rap: { ar: 'راب وهيب هوب', en: 'Rap' },
  cat_classical: { ar: 'طرب وكلاسيك', en: 'Classical' },
  cat_relaxing: { ar: 'استرخاء', en: 'Relaxing' },
  cat_trending: { ar: 'الأكثر رواجاً', en: 'Trending' },

  // Home Sections
  section_recently_played: { ar: 'تم تشغيله مؤخراً', en: 'Recently Played' },
  section_recommended: { ar: 'موسيقى مقترحة لك', en: 'Recommended Music' },
  section_popular_artists: { ar: 'فنانون مميزون', en: 'Popular Artists' },
  section_recent_playlists: { ar: 'قوائم تشغيل مميزة', en: 'Featured Playlists' },
  view_all: { ar: 'عرض الكل', en: 'View All' },

  // Player
  player_playing: { ar: 'قيد التشغيل الآن', en: 'Now Playing' },
  player_queue: { ar: 'قائمة الانتظار', en: 'Up Next / Queue' },
  player_lyrics: { ar: 'كلمات الأغنية', en: 'Lyrics' },
  player_add_playlist: { ar: 'إضافة لقائمة التشغيل', en: 'Add to Playlist' },
  player_added_fav: { ar: 'تمت الإضافة للمفضلة', en: 'Added to Favorites' },
  player_removed_fav: { ar: 'تم الحذف من المفضلة', en: 'Removed from Favorites' },
  player_audio_mode: { ar: 'وضع الصوت عالي النقاء', en: 'Hi-Fi Audio Mode' },
  player_youtube_mode: { ar: 'مشغل يوتيوب الرسمي', en: 'Official YouTube Embed' },

  // Playlists
  playlists_title: { ar: 'قوائم التشغيل الخاصة بك', en: 'Your Playlists' },
  playlist_create_new: { ar: 'إنشاء قائمة تشغيل جديدة', en: 'Create New Playlist' },
  playlist_name_label: { ar: 'اسم القائمة', en: 'Playlist Name' },
  playlist_desc_label: { ar: 'الوصف (اختياري)', en: 'Description (optional)' },
  playlist_save: { ar: 'حفظ وإنشاء', en: 'Create Playlist' },
  playlist_play_all: { ar: 'تشغيل الكل', en: 'Play All' },
  playlist_shuffle: { ar: 'تشغيل عشوائي', en: 'Shuffle Play' },
  playlist_songs_count: { ar: 'أغاني', en: 'songs' },
  playlist_empty: { ar: 'لا توجد أغاني في هذه القائمة بعد', en: 'No songs in this playlist yet' },

  // Library
  library_title: { ar: 'مكتبتي الموسيقية', en: 'Your Music Library' },
  library_favorites: { ar: 'الأغاني المفضلة', en: 'Favorite Songs' },
  library_artists: { ar: 'الفنانون المتابعون', en: 'Followed Artists' },
  library_albums: { ar: 'الألبومات المحفوظة', en: 'Saved Albums' },
  library_history: { ar: 'سجل الاستماع', en: 'Listening History' },

  // Settings
  settings_title: { ar: 'الإعدادات واللغة', en: 'Settings & Language' },
  settings_lang: { ar: 'لغة التطبيق', en: 'App Language' },
  settings_theme: { ar: 'المظهر والألوان', en: 'Theme & Appearance' },
  settings_quality: { ar: 'جودة الصوت', en: 'Audio Quality' },
  settings_equalizer: { ar: 'معادل الصوت (EQ)', en: 'Equalizer Preset' },
  settings_about: { ar: 'عن تطبيق MUSIQ', en: 'About MUSIQ' },
  settings_clear_data: { ar: 'مسح البيانات وسجل الاستماع', en: 'Clear History & Cache' },

  // Onboarding & Dynamic Recommendations
  onboarding_title: { ar: 'أهلاً بك في عالم MUSIQ', en: 'Welcome to MUSIQ' },
  onboarding_sub: { ar: 'دعنا نخصص تجربتك الموسيقية الراقية', en: 'Let us customize your premium musical journey' },
  onboarding_name_label: { ar: 'اسمك الكريم', en: 'Your Name' },
  onboarding_gender_label: { ar: 'الجنس (لتخصيص التحية الودية)', en: 'Gender (for personalized greeting)' },
  onboarding_gender_male: { ar: 'ذكر', en: 'Male' },
  onboarding_gender_female: { ar: 'أنثى', en: 'Female' },
  onboarding_genres_title: { ar: 'اختر أنواع الموسيقى التي تفضلها', en: 'Choose Your Favorite Music Genres' },
  onboarding_genres_sub: { ar: 'سنقوم بتجديد اقتراحاتك تلقائياً كل 3 دقائق بناءً على هذه الاختيارات', en: 'We will rotate suggestions every 3 minutes based on these choices' },
  onboarding_tour_title: { ar: 'جولة سريعة لاكتشاف مزايا التطبيق', en: 'Quick App Feature Tour' },
  onboarding_start_button: { ar: 'ابدأ الاستماع الآن 🎵', en: 'Start Listening Now 🎵' },
  home_rotating_title: { ar: 'اقتراحات خصيصاً لك (تتجدد كل ٣ دقائق)', en: 'Personalized For You (Rotates every 3 min)' },
  home_refresh_now: { ar: 'تجديد فوري', en: 'Refresh Now' },
  home_timer_label: { ar: 'التجديد التلقائي خلال:', en: 'Auto-refreshes in:' },
};

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Settings & Localization
  const [settings, setSettings] = useState<AppSettings>(() => StorageService.getSettings());
  const [user, setUser] = useState<UserProfile>(() => StorageService.getUserProfile());
  const isRTL = settings.language === 'ar';

  // Navigation
  const [activeTab, setActiveTab] = useState<TabType>('search');
  const [isFullScreenPlayerOpen, setIsFullScreenPlayerOpen] = useState(false);
  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState(false);
  const [songForPlaylistModal, setSongForPlaylistModal] = useState<Song | null>(null);
  const [isSoundEnhancerOpen, setIsSoundEnhancerOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

  const openTour = useCallback(() => setIsTourOpen(true), []);
  const closeTour = useCallback(() => setIsTourOpen(false), []);

  const completeOnboarding = useCallback((name: string, gender: Gender, preferredGenres: string[]) => {
    setUser((prev) => {
      const updated: UserProfile = {
        ...prev,
        name: name.trim() || prev.name,
        gender,
        preferredGenres: preferredGenres.length > 0 ? preferredGenres : prev.preferredGenres,
        onboardingCompleted: true,
        tourCompleted: true,
      };
      StorageService.saveUserProfile(updated);
      return updated;
    });
    setIsTourOpen(false);
  }, []);

  // Sound Enhancer State
  const [soundEnhancerPreset, setSoundEnhancerPresetState] = useState<SoundEnhancerPreset>('studio');
  const [soundEnhancerEnabled, setSoundEnhancerEnabled] = useState<boolean>(true);

  const setSoundEnhancerPreset = useCallback((preset: SoundEnhancerPreset) => {
    setSoundEnhancerPresetState(preset);
    youtubeAudioService.applySoundPreset(preset);
  }, []);

  const toggleSoundEnhancer = useCallback(() => {
    setSoundEnhancerEnabled((prev) => {
      const next = !prev;
      youtubeAudioService.setEnhancerEnabled(next);
      return next;
    });
  }, []);

  const openSoundEnhancer = useCallback(() => setIsSoundEnhancerOpen(true), []);
  const closeSoundEnhancer = useCallback(() => setIsSoundEnhancerOpen(false), []);

  // Playlists, Favorites, Songs Catalog
  const [allSongs, setAllSongs] = useState<Song[]>(INITIAL_SONGS);
  const [playlists, setPlaylists] = useState<Playlist[]>(() => StorageService.getPlaylists());
  const [favorites, setFavorites] = useState<string[]>(() => StorageService.getFavorites());
  const [recentlyPlayedIds, setRecentlyPlayedIds] = useState<string[]>(() => StorageService.getRecentlyPlayed());

  // Player States
  const [currentSong, setCurrentSong] = useState<Song | null>(() => INITIAL_SONGS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(INITIAL_SONGS[0].duration);
  const [volume, setVolumeState] = useState<number>(0.85);
  const [isShuffled, setIsShuffled] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');
  const [playbackMode, setPlaybackMode] = useState<PlaybackEngineMode>('youtube');

  // Queue
  const [queue, setQueue] = useState<Song[]>(INITIAL_SONGS);
  const [queueIndex, setQueueIndex] = useState<number>(0);

  // Sync RTL attribute on document
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = settings.language;
  }, [isRTL, settings.language]);

  // Translation helper
  const t = useCallback(
    (key: string): string => {
      const entry = TRANSLATIONS[key];
      if (!entry) return key;
      return settings.language === 'ar' ? entry.ar : entry.en;
    },
    [settings.language]
  );

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      StorageService.saveSettings(updated);
      return updated;
    });
  }, []);

  const updateUser = useCallback((newUser: Partial<UserProfile>) => {
    setUser((prev) => {
      const updated = { ...prev, ...newUser };
      StorageService.saveUserProfile(updated);
      return updated;
    });
  }, []);

  // Adaptive Song Theme State
  const [currentTheme, setCurrentTheme] = useState<SongTheme>(() => detectSongTheme(INITIAL_SONGS[0]));

  // Dynamically update theme colors and CSS variables whenever song changes
  useEffect(() => {
    if (currentSong) {
      const detected = detectSongTheme(currentSong);
      setCurrentTheme(detected);
      applyThemeVariables(detected);
    }
  }, [currentSong]);

  // Refs to always access latest track control functions without stale closure
  const handleTrackEndedRef = React.useRef<() => void>(() => {});
  const handleNextTrackRef = React.useRef<() => void>(() => {});

  // Track ended handler
  const handleTrackEnded = useCallback(() => {
    if (repeatMode === 'one' && currentSong) {
      youtubeAudioService.seek(0);
      youtubeAudioService.play();
      return;
    }
    const nextIdx = getNextTrackIndex(queueIndex, queue.length, repeatMode);
    if (nextIdx >= 0) {
      setQueueIndex(nextIdx);
      const nextSong = queue[nextIdx];
      setCurrentSong(nextSong);
      youtubeAudioService.loadAndPlay(nextSong, true);
      const updatedRecent = StorageService.addRecentlyPlayed(nextSong.id);
      setRecentlyPlayedIds(updatedRecent);
    } else {
      setIsPlaying(false);
    }
  }, [queue, queueIndex, repeatMode, currentSong]);

  useEffect(() => {
    handleTrackEndedRef.current = handleTrackEnded;
  }, [handleTrackEnded]);

  // Set up official YouTube audio engine callbacks
  useEffect(() => {
    youtubeAudioService.initPlayer('musiq-yt-player', {
      onReady: () => {
        if (currentSong) {
          youtubeAudioService.loadAndPlay(currentSong, false);
        }
      },
      onTimeUpdate: (cur, dur) => {
        setCurrentTime(cur);
        if (dur > 0) setDuration(dur);
      },
      onPlayStateChange: (playing) => {
        setIsPlaying(playing);
      },
      onEnded: () => {
        handleTrackEndedRef.current();
      },
      onError: (err) => {
        console.warn('YouTube Audio Player error handled:', err);
        // If an embed restriction occurs on a specific video, smoothly advance to next playable track
        setTimeout(() => {
          handleNextTrackRef.current();
        }, 1000);
      },
    }, currentSong?.provider_track_id || 'KzJ7XZqp4rc');
  }, []);

  // Play a song directly from YouTube, optionally loading a new playlist queue
  const playSong = useCallback(
    (song: Song, newQueue?: Song[]) => {
      let targetQueue = newQueue || queue;
      
      // If the song is not in the queue, add it
      if (!targetQueue.some((s) => s.id === song.id)) {
        targetQueue = [song, ...targetQueue];
      }

      const songIdx = targetQueue.findIndex((s) => s.id === song.id);
      setQueue(targetQueue);
      setQueueIndex(songIdx >= 0 ? songIdx : 0);
      setCurrentSong(song);

      // Add to catalog if not present (e.g. from YouTube search or direct link)
      setAllSongs((prev) => {
        if (!prev.some((s) => s.id === song.id)) {
          return [song, ...prev];
        }
        return prev;
      });

      // Update recently played
      const updatedRecent = StorageService.addRecentlyPlayed(song.id);
      setRecentlyPlayedIds(updatedRecent);

      // Trigger authentic YouTube audio playback
      youtubeAudioService.loadAndPlay(song, true);
    },
    [queue]
  );

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      youtubeAudioService.pause();
    } else {
      if (currentSong) {
        youtubeAudioService.play();
      }
    }
  }, [isPlaying, currentSong]);

  const nextTrack = useCallback(() => {
    if (queue.length === 0) return;
    const nextIdx = getNextTrackIndex(queueIndex, queue.length, repeatMode);
    if (nextIdx >= 0) {
      setQueueIndex(nextIdx);
      const nextSong = queue[nextIdx];
      setCurrentSong(nextSong);
      youtubeAudioService.loadAndPlay(nextSong, true);
      const updatedRecent = StorageService.addRecentlyPlayed(nextSong.id);
      setRecentlyPlayedIds(updatedRecent);
    }
  }, [queue, queueIndex, repeatMode]);

  const prevTrack = useCallback(() => {
    if (queue.length === 0) return;
    const { targetIndex, shouldRewind } = getPrevTrackIndex(queueIndex, queue.length, currentTime);
    if (shouldRewind) {
      youtubeAudioService.seek(0);
      setCurrentTime(0);
      return;
    }
    if (targetIndex >= 0) {
      setQueueIndex(targetIndex);
      const prevSong = queue[targetIndex];
      setCurrentSong(prevSong);
      youtubeAudioService.loadAndPlay(prevSong, true);
      const updatedRecent = StorageService.addRecentlyPlayed(prevSong.id);
      setRecentlyPlayedIds(updatedRecent);
    }
  }, [queue, queueIndex, currentTime]);

  useEffect(() => {
    handleNextTrackRef.current = nextTrack;
  }, [nextTrack]);

  // Update MediaSession lock screen actions for native background audio
  useEffect(() => {
    const handlers = {
      onPlay: () => {
        youtubeAudioService.play();
      },
      onPause: () => {
        youtubeAudioService.pause();
      },
      onNext: () => nextTrack(),
      onPrev: () => prevTrack(),
      onSeek: (seconds: number) => {
        youtubeAudioService.seek(seconds);
      },
    };

    youtubeAudioService.setMediaSessionHandlers(handlers);
  }, [nextTrack, prevTrack]);

  const seekTo = useCallback((seconds: number) => {
    youtubeAudioService.seek(seconds);
    setCurrentTime(seconds);
  }, []);

  const setVolume = useCallback((val: number) => {
    setVolumeState(val);
    youtubeAudioService.setVolume(val);
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffled((prev) => {
      const nextState = !prev;
      if (nextState) {
        // Shuffle queue keeping active song first
        const shuffled = shuffleQueue(queue, queueIndex);
        setQueue(shuffled);
        setQueueIndex(0);
      } else {
        // Re-sort back to original catalog order
        const restored = [...allSongs];
        setQueue(restored);
        const newIdx = restored.findIndex((s) => s.id === currentSong?.id);
        setQueueIndex(newIdx >= 0 ? newIdx : 0);
      }
      return nextState;
    });
  }, [queue, queueIndex, allSongs, currentSong]);

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const addToQueue = useCallback((song: Song) => {
    setQueue((prev) => [...prev, song]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (index === queueIndex) {
        // If current song removed, play next available
        if (next.length > 0) {
          const nextIdx = Math.min(index, next.length - 1);
          setQueueIndex(nextIdx);
          setCurrentSong(next[nextIdx]);
          youtubeAudioService.loadAndPlay(next[nextIdx], isPlaying);
        } else {
          setCurrentSong(null);
          youtubeAudioService.pause();
        }
      } else if (index < queueIndex) {
        setQueueIndex((i) => i - 1);
      }
      return next;
    });
  }, [queueIndex, isPlaying]);

  const reorderQueueItem = useCallback((from: number, to: number) => {
    setQueue((prev) => {
      const reordered = reorderList(prev, from, to);
      // adjust active index
      if (queueIndex === from) {
        setQueueIndex(to);
      } else if (from < queueIndex && to >= queueIndex) {
        setQueueIndex((i) => i - 1);
      } else if (from > queueIndex && to <= queueIndex) {
        setQueueIndex((i) => i + 1);
      }
      return reordered;
    });
  }, [queueIndex]);

  const clearQueue = useCallback(() => {
    if (currentSong) {
      setQueue([currentSong]);
      setQueueIndex(0);
    } else {
      setQueue([]);
      setQueueIndex(0);
    }
  }, [currentSong]);

  // Playlist management
  const createPlaylist = useCallback((name: string, description?: string, coverUrl?: string): Playlist => {
    const newPl: Playlist = {
      id: `pl-${Date.now()}`,
      name: name.trim() || 'My Playlist',
      description: description?.trim() || '',
      cover_url: coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop',
      color: 'from-purple-600 to-indigo-950',
      created_at: new Date().toISOString().split('T')[0],
      song_ids: [],
      is_custom: true,
    };
    setPlaylists((prev) => {
      const updated = [newPl, ...prev];
      StorageService.savePlaylists(updated);
      return updated;
    });
    return newPl;
  }, []);

  const deletePlaylist = useCallback((id: string) => {
    setPlaylists((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      StorageService.savePlaylists(updated);
      return updated;
    });
  }, []);

  const renamePlaylist = useCallback((id: string, newName: string) => {
    setPlaylists((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, name: newName.trim() } : p));
      StorageService.savePlaylists(updated);
      return updated;
    });
  }, []);

  const addSongToPlaylist = useCallback(
    (playlistId: string, songId: string): { success: boolean; message?: string } => {
      const targetPl = playlists.find((p) => p.id === playlistId);
      if (!targetPl) return { success: false, message: 'Playlist not found' };

      const check = canAddSongToPlaylist(targetPl.song_ids, songId, false);
      if (!check.allowed) {
        return { success: false, message: check.reason };
      }

      setPlaylists((prev) => {
        const updated = prev.map((p) => {
          if (p.id === playlistId) {
            return { ...p, song_ids: [...p.song_ids, songId] };
          }
          return p;
        });
        StorageService.savePlaylists(updated);
        return updated;
      });

      return { success: true };
    },
    [playlists]
  );

  const removeSongFromPlaylist = useCallback((playlistId: string, songId: string) => {
    setPlaylists((prev) => {
      const updated = prev.map((p) => {
        if (p.id === playlistId) {
          return { ...p, song_ids: p.song_ids.filter((id) => id !== songId) };
        }
        return p;
      });
      StorageService.savePlaylists(updated);
      return updated;
    });
  }, []);

  const reorderPlaylistSong = useCallback((playlistId: string, fromIndex: number, toIndex: number) => {
    setPlaylists((prev) => {
      const updated = prev.map((p) => {
        if (p.id === playlistId) {
          return { ...p, song_ids: reorderList(p.song_ids, fromIndex, toIndex) };
        }
        return p;
      });
      StorageService.savePlaylists(updated);
      return updated;
    });
  }, []);

  const getPlaylistById = useCallback((id: string) => {
    return playlists.find((p) => p.id === id);
  }, [playlists]);

  // Favorites
  const toggleFavorite = useCallback((songId: string) => {
    setFavorites((prev) => {
      let updated: string[];
      if (prev.includes(songId)) {
        updated = prev.filter((id) => id !== songId);
      } else {
        updated = [songId, ...prev];
      }
      StorageService.saveFavorites(updated);
      return updated;
    });
  }, []);

  const isFavorite = useCallback(
    (songId: string) => {
      return favorites.includes(songId);
    },
    [favorites]
  );

  const clearHistory = useCallback(() => {
    StorageService.clearRecentlyPlayed();
    StorageService.clearSearchHistory();
    setRecentlyPlayedIds([]);
  }, []);

  const findSongById = useCallback(
    (id: string) => {
      return allSongs.find((s) => s.id === id);
    },
    [allSongs]
  );

  const recentlyPlayed = useMemo(() => {
    return recentlyPlayedIds
      .map((id) => findSongById(id))
      .filter((s): s is Song => Boolean(s));
  }, [recentlyPlayedIds, findSongById]);

  // Modals
  const openFullScreenPlayer = useCallback(() => setIsFullScreenPlayerOpen(true), []);
  const closeFullScreenPlayer = useCallback(() => setIsFullScreenPlayerOpen(false), []);
  const openAddToPlaylist = useCallback((song: Song) => {
    setSongForPlaylistModal(song);
    setIsAddToPlaylistOpen(true);
  }, []);
  const closeAddToPlaylist = useCallback(() => {
    setIsAddToPlaylistOpen(false);
    setSongForPlaylistModal(null);
  }, []);

  return (
    <MusicContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isFullScreenPlayerOpen,
        openFullScreenPlayer,
        closeFullScreenPlayer,
        isAddToPlaylistOpen,
        songForPlaylistModal,
        openAddToPlaylist,
        closeAddToPlaylist,
        isSoundEnhancerOpen,
        openSoundEnhancer,
        closeSoundEnhancer,

        isTourOpen,
        openTour,
        closeTour,
        completeOnboarding,

        soundEnhancerPreset,
        setSoundEnhancerPreset,
        soundEnhancerEnabled,
        toggleSoundEnhancer,

        currentTheme,

        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,
        isShuffled,
        repeatMode,
        playbackMode,
        setPlaybackMode,

        queue,
        queueIndex,
        addToQueue,
        removeFromQueue,
        reorderQueueItem,
        clearQueue,

        playSong,
        togglePlayPause,
        nextTrack,
        prevTrack,
        seekTo,
        setVolume,
        toggleShuffle,
        cycleRepeatMode,

        playlists,
        createPlaylist,
        deletePlaylist,
        renamePlaylist,
        addSongToPlaylist,
        removeSongFromPlaylist,
        reorderPlaylistSong,
        getPlaylistById,

        favorites,
        toggleFavorite,
        isFavorite,
        recentlyPlayed,
        clearHistory,

        allSongs,
        findSongById,

        settings,
        updateSettings,
        user,
        updateUser,
        t,
        isRTL,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};
