export type Category = 
  | 'all'
  | 'arabic'
  | 'international'
  | 'pop'
  | 'rap'
  | 'classical'
  | 'relaxing'
  | 'trending';

export interface Song {
  id: string;
  title: string;
  titleAr?: string;
  artist: string;
  artistAr?: string;
  album: string;
  artwork_url: string;
  duration: number; // in seconds
  category: Category;
  source: 'catalog' | 'youtube';
  provider_track_id?: string; // YouTube video ID or external ID
  audio_url?: string;
  lyrics?: string;
  lyricsAr?: string;
  plays_count?: number;
  releaseYear?: number;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  cover_url: string;
  color?: string;
  created_at: string;
  song_ids: string[];
  is_custom?: boolean;
}

export interface Artist {
  id: string;
  name: string;
  nameAr?: string;
  avatar_url: string;
  category: 'arabic' | 'international';
  monthlyListeners: number;
  bio?: string;
  bioAr?: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  cover_url: string;
  year: number;
  song_ids: string[];
}

export type Gender = 'male' | 'female';

export interface UserProfile {
  id: string;
  name: string;
  gender: Gender;
  email: string;
  avatar: string;
  plan: 'MUSIQ Premium' | 'Free';
  preferredGenres: string[];
  onboardingCompleted: boolean;
  tourCompleted: boolean;
}

export interface SearchFilter {
  type: 'all' | 'songs' | 'artists' | 'albums' | 'lyrics' | 'youtube';
}
