import { Playlist, UserProfile } from '../types/music';
import { INITIAL_PLAYLISTS } from '../data/catalog';

const STORAGE_KEYS = {
  PLAYLISTS: 'musiq_playlists_v1',
  FAVORITES: 'musiq_favorites_v1',
  RECENTLY_PLAYED: 'musiq_recently_played_v1',
  SEARCH_HISTORY: 'musiq_search_history_v1',
  SETTINGS: 'musiq_settings_v1',
  USER_PROFILE: 'musiq_user_profile_v1',
};

export interface AppSettings {
  language: 'ar' | 'en';
  theme: 'dark' | 'oled' | 'midnight';
  audioQuality: '320' | '192' | '96';
  equalizer: 'flat' | 'bass_boost' | 'tarab_oriental' | 'vocal' | 'acoustic';
  autoplay: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'ar',
  theme: 'dark',
  audioQuality: '320',
  equalizer: 'tarab_oriental',
  autoplay: true,
};

export const DEFAULT_USER: UserProfile = {
  id: 'usr-1',
  name: 'صديق MUSIQ',
  gender: 'male',
  email: 'music.lover@musiq.app',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
  plan: 'MUSIQ Premium',
  preferredGenres: ['arabic_tarab', 'fairuz_classics', 'arabic_pop'],
  onboardingCompleted: false,
  tourCompleted: false,
};

export class StorageService {
  public static getPlaylists(): Playlist[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PLAYLISTS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Storage read failed', e);
    }
    // Playlists are initialized empty so the user creates their own custom playlists
    return [];
  }

  public static savePlaylists(playlists: Playlist[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
    } catch (e) {
      console.warn('Storage write failed', e);
    }
  }

  public static getFavorites(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Favorites read failed', e);
    }
    return ['ar-1', 'ar-2', 'int-1', 'ar-5'];
  }

  public static saveFavorites(favorites: string[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    } catch (e) {
      console.warn('Favorites write failed', e);
    }
  }

  public static getRecentlyPlayed(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECENTLY_PLAYED);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Recently played read failed', e);
    }
    return ['ar-2', 'int-1', 'ar-1', 'ar-6'];
  }

  public static addRecentlyPlayed(songId: string): string[] {
    const list = this.getRecentlyPlayed().filter((id) => id !== songId);
    list.unshift(songId);
    const capped = list.slice(0, 30);
    try {
      localStorage.setItem(STORAGE_KEYS.RECENTLY_PLAYED, JSON.stringify(capped));
    } catch (e) {
      console.warn(e);
    }
    return capped;
  }

  public static clearRecentlyPlayed(): void {
    localStorage.removeItem(STORAGE_KEYS.RECENTLY_PLAYED);
  }

  public static getSearchHistory(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn(e);
    }
    return ['عمرو دياب', 'Fairuz', 'The Weeknd', 'طرب أصيل', 'Nancy Ajram'];
  }

  public static addSearchQuery(query: string): string[] {
    const q = query.trim();
    if (!q) return this.getSearchHistory();
    const history = this.getSearchHistory().filter((item) => item.toLowerCase() !== q.toLowerCase());
    history.unshift(q);
    const capped = history.slice(0, 15);
    try {
      localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(capped));
    } catch (e) {
      console.warn(e);
    }
    return capped;
  }

  public static removeSearchQuery(query: string): string[] {
    const history = this.getSearchHistory().filter((item) => item !== query);
    try {
      localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.warn(e);
    }
    return history;
  }

  public static clearSearchHistory(): void {
    localStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
  }

  public static getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (e) {
      console.warn(e);
    }
    return DEFAULT_SETTINGS;
  }

  public static saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn(e);
    }
  }

  public static getUserProfile(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (data) return { ...DEFAULT_USER, ...JSON.parse(data) };
    } catch (e) {
      console.warn(e);
    }
    return DEFAULT_USER;
  }

  public static saveUserProfile(user: UserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(user));
    } catch (e) {
      console.warn(e);
    }
  }
}
