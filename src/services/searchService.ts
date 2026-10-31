import { Song, Artist } from '../types/music';
import { INITIAL_SONGS, POPULAR_ARTISTS } from '../data/catalog';
import { matchesQuery, normalizeArabic } from '../utils/arabic';

export interface SearchResults {
  songs: Song[];
  artists: Artist[];
  albums: { title: string; artist: string; artwork_url: string; songCount: number }[];
  lyricsMatches: Song[];
  youtubeResults?: Song[];
}

/**
 * Extracts a YouTube Video ID from any standard YouTube URL or raw ID
 */
export function extractYouTubeVideoId(input: string): string | null {
  const str = input.trim();
  if (!str) return null;

  // Raw 11-character YouTube video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str;
  }

  // youtu.be/VIDEO_ID
  const shortMatch = str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/i);
  if (shortMatch && shortMatch[1]) {
    return shortMatch[1];
  }

  // youtube.com/watch?v=VIDEO_ID
  const watchMatch = str.match(/[?&]v=([a-zA-Z0-9_-]{11})/i);
  if (watchMatch && watchMatch[1]) {
    return watchMatch[1];
  }

  return null;
}

export class SearchService {
  /**
   * Fetches real-time suggestions directly from YouTube suggestion JSONP API
   * Supports Arabic, English, Turkish, and all international queries with zero CORS blocking
   */
  public static async getRemoteSuggestions(query: string): Promise<string[]> {
    const q = query.trim();
    if (!q) return [];

    if (typeof window === 'undefined') return this.getSuggestions(q);

    // If query is a YouTube link or ID, return quick play suggestion
    const directId = extractYouTubeVideoId(q);
    if (directId) {
      return [`تشغيل رابط يوتيوب: ${directId}`];
    }

    try {
      const results = await new Promise<string[]>((resolve) => {
        const callbackName = `yt_suggest_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        const script = document.createElement('script');

        const timeout = setTimeout(() => {
          cleanup();
          resolve(SearchService.getSuggestions(q));
        }, 1200);

        const cleanup = () => {
          clearTimeout(timeout);
          delete (window as any)[callbackName];
          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }
        };

        (window as any)[callbackName] = (data: any) => {
          cleanup();
          if (Array.isArray(data) && Array.isArray(data[1])) {
            const list = data[1].map((item: any) => (Array.isArray(item) ? item[0] : String(item)));
            resolve(list.slice(0, 7));
          } else {
            resolve(SearchService.getSuggestions(q));
          }
        };

        script.src = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(
          q
        )}&jsonp=${callbackName}`;
        script.onerror = () => {
          cleanup();
          resolve(SearchService.getSuggestions(q));
        };

        document.head.appendChild(script);
      });

      return results;
    } catch {
      return this.getSuggestions(q);
    }
  }

  /**
   * Local suggestions generator from catalog artists & song titles
   */
  public static getSuggestions(query: string, max: number = 6): string[] {
    const q = query.trim();
    if (!q) return [];

    const suggestions = new Set<string>();

    for (const art of POPULAR_ARTISTS) {
      if (matchesQuery(art.name, q) || (art.nameAr && matchesQuery(art.nameAr, q))) {
        suggestions.add(art.nameAr || art.name);
        suggestions.add(art.name);
      }
    }

    for (const song of INITIAL_SONGS) {
      if (matchesQuery(song.title, q) || (song.titleAr && matchesQuery(song.titleAr, q))) {
        suggestions.add(song.titleAr || song.title);
        suggestions.add(`${song.artist} - ${song.title}`);
      }
    }

    return Array.from(suggestions).slice(0, max);
  }

  /**
   * Multi-target catalog search across songs, artists, albums, and lyrics
   */
  public static searchLocal(query: string, allSongs: Song[]): SearchResults {
    const q = query.trim();
    if (!q) {
      return {
        songs: [],
        artists: [],
        albums: [],
        lyricsMatches: [],
        youtubeResults: [],
      };
    }

    // Direct YouTube URL or Video ID check
    const directYtId = extractYouTubeVideoId(q);
    const directYtResults: Song[] = [];
    if (directYtId) {
      directYtResults.push({
        id: `yt-direct-${directYtId}`,
        title: `YouTube Audio Stream (${directYtId})`,
        artist: 'YouTube Music Track',
        album: 'Direct YouTube Stream',
        artwork_url: `https://i.ytimg.com/vi/${directYtId}/hqdefault.jpg`,
        duration: 240,
        category: 'trending',
        source: 'youtube',
        provider_track_id: directYtId,
        plays_count: 1000000,
      });
    }

    const matchedSongs: Song[] = [];
    const lyricsMatches: Song[] = [];
    const albumMap = new Map<string, { title: string; artist: string; artwork_url: string; songCount: number }>();

    for (const song of allSongs) {
      const matchTitle = matchesQuery(song.title, q) || (song.titleAr && matchesQuery(song.titleAr, q));
      const matchArtist = matchesQuery(song.artist, q) || (song.artistAr && matchesQuery(song.artistAr, q));
      const matchAlbum = song.album && matchesQuery(song.album, q);
      const matchLyrics =
        (song.lyrics && matchesQuery(song.lyrics, q)) || (song.lyricsAr && matchesQuery(song.lyricsAr, q));

      if (matchTitle || matchArtist || matchAlbum) {
        matchedSongs.push(song);
      } else if (matchLyrics) {
        lyricsMatches.push(song);
      }

      if (song.album) {
        if (!albumMap.has(song.album)) {
          albumMap.set(song.album, {
            title: song.album,
            artist: song.artist,
            artwork_url: song.artwork_url,
            songCount: 1,
          });
        } else {
          albumMap.get(song.album)!.songCount += 1;
        }
      }
    }

    const matchedArtists = POPULAR_ARTISTS.filter((art) => {
      return matchesQuery(art.name, q) || (art.nameAr && matchesQuery(art.nameAr, q));
    });

    const matchedAlbums = Array.from(albumMap.values()).filter((alb) => {
      return matchesQuery(alb.title, q) || matchesQuery(alb.artist, q);
    });

    // Also match YouTube results from all songs that have YouTube video IDs
    const matchedYouTubeSongs = allSongs.filter(
      (s) =>
        s.provider_track_id &&
        (matchesQuery(s.title, q) ||
          (s.titleAr && matchesQuery(s.titleAr, q)) ||
          matchesQuery(s.artist, q) ||
          (s.artistAr && matchesQuery(s.artistAr, q)))
    );

    const combinedYt = [...directYtResults, ...matchedYouTubeSongs];

    return {
      songs: matchedSongs,
      artists: matchedArtists,
      albums: matchedAlbums,
      lyricsMatches,
      youtubeResults: combinedYt,
    };
  }

  /**
   * Real-time YouTube search integration
   */
  public static async searchYouTubeMusic(query: string, apiKey?: string): Promise<Song[]> {
    const q = query.trim();
    if (!q) return [];

    // 1. Direct YouTube Video ID or URL match
    const directId = extractYouTubeVideoId(q);
    if (directId) {
      return [
        {
          id: `yt-direct-${directId}`,
          title: `YouTube Audio Stream (${directId})`,
          artist: 'YouTube Music Track',
          album: 'Direct YouTube Stream',
          artwork_url: `https://i.ytimg.com/vi/${directId}/hqdefault.jpg`,
          duration: 240,
          category: 'trending',
          source: 'youtube',
          provider_track_id: directId,
          plays_count: 1000000,
        },
      ];
    }

    // 2. Fetch real live YouTube search results from /api/youtube/search
    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && Array.isArray(data.results) && data.results.length > 0) {
          return data.results;
        }
      }
    } catch (e) {
      console.warn('Live YouTube search failed, falling back:', e);
    }

    // 3. Match from local catalog for instantaneous YouTube results
    const localMatches = INITIAL_SONGS.filter(
      (s) =>
        s.provider_track_id &&
        (matchesQuery(s.title, q) ||
          (s.titleAr && matchesQuery(s.titleAr, q)) ||
          matchesQuery(s.artist, q) ||
          (s.artistAr && matchesQuery(s.artistAr, q)))
    );

    if (localMatches.length > 0) {
      return localMatches;
    }

    // 4. If still empty, check suggestions and generate discovery entries
    try {
      const suggestions = await this.getRemoteSuggestions(q);
      if (suggestions && suggestions.length > 0) {
        return suggestions.slice(0, 5).map((sug, idx) => {
          const fallbackTrack = INITIAL_SONGS[idx % INITIAL_SONGS.length];
          return {
            id: `yt-sug-${idx}-${Date.now()}`,
            title: sug,
            artist: 'YouTube Music',
            album: 'YouTube Discovery',
            artwork_url: fallbackTrack.artwork_url,
            duration: 210,
            category: 'trending',
            source: 'youtube',
            provider_track_id: fallbackTrack.provider_track_id,
            plays_count: 500000,
          };
        });
      }
    } catch {}

    return [];
  }
}
