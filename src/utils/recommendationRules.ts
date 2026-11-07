import { Song } from '../types/music';
import { matchesQuery } from './arabic';

/**
 * Pure functions for filtering and generating recommendations for same artist or genre/style
 */

export function filterSameArtist(songs: Song[], currentSong: Song): Song[] {
  if (!currentSong || !currentSong.artist) return [];

  const artistNorm = currentSong.artist.trim().toLowerCase();
  const artistArNorm = currentSong.artistAr?.trim().toLowerCase();

  return songs.filter((s) => {
    if (s.id === currentSong.id || s.provider_track_id === currentSong.provider_track_id) {
      return false;
    }

    const sArtist = s.artist.trim().toLowerCase();
    const sArtistAr = s.artistAr?.trim().toLowerCase();

    // Direct equal
    if (sArtist === artistNorm) return true;
    if (artistArNorm && sArtistAr && sArtistAr === artistArNorm) return true;

    // Fuzzy Arabic match
    if (matchesQuery(s.artist, currentSong.artist)) return true;
    if (currentSong.artistAr && matchesQuery(s.artist, currentSong.artistAr)) return true;
    if (s.artistAr && matchesQuery(s.artistAr, currentSong.artist)) return true;

    return false;
  });
}

export function filterSameGenre(songs: Song[], currentSong: Song): Song[] {
  if (!currentSong || !currentSong.category) return [];

  return songs.filter((s) => {
    if (s.id === currentSong.id || s.provider_track_id === currentSong.provider_track_id) {
      return false;
    }

    // Direct category match
    if (s.category && s.category.toLowerCase() === currentSong.category.toLowerCase()) {
      return true;
    }

    return false;
  });
}

export function combineRecommendations(
  sameArtistSongs: Song[],
  sameGenreSongs: Song[],
  currentSongId: string,
  limit: number = 15
): { song: Song; reason: 'artist' | 'genre' }[] {
  const result: { song: Song; reason: 'artist' | 'genre' }[] = [];
  const seenIds = new Set<string>([currentSongId]);

  // First prioritize same artist tracks
  for (const song of sameArtistSongs) {
    const key = song.provider_track_id || song.id;
    if (!seenIds.has(key)) {
      seenIds.add(key);
      result.push({ song, reason: 'artist' });
      if (result.length >= limit) break;
    }
  }

  // Then fill with same genre/style tracks
  for (const song of sameGenreSongs) {
    const key = song.provider_track_id || song.id;
    if (!seenIds.has(key)) {
      seenIds.add(key);
      result.push({ song, reason: 'genre' });
      if (result.length >= limit) break;
    }
  }

  return result;
}

export function getArabicGenreLabel(category: string): string {
  switch (category.toLowerCase()) {
    case 'tarab':
    case 'classical':
      return 'طرب وكلاسيك';
    case 'arabic':
      return 'طرب عربي';
    case 'pop':
      return 'بوب معاصر';
    case 'rap':
      return 'راب وهيب هوب';
    case 'relaxing':
      return 'موسيقى هادئة';
    case 'trending':
      return 'الأكثر رواجاً';
    case 'international':
      return 'عالمي';
    default:
      return 'نفس النمط الموسيقي';
  }
}
