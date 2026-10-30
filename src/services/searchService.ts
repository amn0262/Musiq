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

export class SearchService {
  public static async getRemoteSuggestions(query: string): Promise<string[]> {
    const q = query.trim();
    if (!q) return [];
    try {
      const res = await fetch(`/api/youtube/suggestions?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.suggestions && Array.isArray(data.suggestions)) {
          return data.suggestions;
        }
      }
    } catch {
      // ignore
    }
    return this.getSuggestions(q);
  }

  /**
   * Generates fast real-time search suggestions while typing
   */
  public static getSuggestions(query: string, max: number = 6): string[] {
    const q = query.trim();
    if (!q) return [];

    const suggestions = new Set<string>();

    // Check artists
    for (const art of POPULAR_ARTISTS) {
      if (matchesQuery(art.name, q) || (art.nameAr && matchesQuery(art.nameAr, q))) {
        suggestions.add(art.nameAr || art.name);
        suggestions.add(art.name);
      }
    }

    // Check song titles
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
      };
    }

    const matchedSongs: Song[] = [];
    const lyricsMatches: Song[] = [];
    const albumMap = new Map<string, { title: string; artist: string; artwork_url: string; songCount: number }>();

    for (const song of allSongs) {
      const matchTitle = matchesQuery(song.title, q) || (song.titleAr && matchesQuery(song.titleAr, q));
      const matchArtist = matchesQuery(song.artist, q) || (song.artistAr && matchesQuery(song.artistAr, q));
      const matchAlbum = song.album && matchesQuery(song.album, q);
      const matchLyrics = (song.lyrics && matchesQuery(song.lyrics, q)) || 
                          (song.lyricsAr && matchesQuery(song.lyricsAr, q));

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

    return {
      songs: matchedSongs,
      artists: matchedArtists,
      albums: matchedAlbums,
      lyricsMatches,
    };
  }

  /**
   * Real-time YouTube search integration via backend API
   */
  public static async searchYouTubeMusic(query: string, apiKey?: string): Promise<Song[]> {
    const q = query.trim();
    if (!q) return [];

    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && Array.isArray(data.results) && data.results.length > 0) {
          return data.results;
        }
      }
    } catch (e) {
      console.warn('Backend YouTube search endpoint error, trying fallback:', e);
    }

    // Direct YouTube API fallback if client API key provided
    if (apiKey) {
      try {
        const musicQuery = encodeURIComponent(`${q} music official`);
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=10&q=${musicQuery}&key=${apiKey}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.items && Array.isArray(data.items)) {
            return data.items.map((item: any, idx: number) => {
              const snippet = item.snippet;
              return {
                id: `yt-${item.id.videoId || idx}`,
                title: snippet.title.replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
                artist: snippet.channelTitle.replace(' - Topic', ''),
                album: 'YouTube Music Official',
                artwork_url: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
                duration: 210,
                category: 'trending',
                source: 'youtube',
                provider_track_id: item.id.videoId,
                plays_count: 500000,
              };
            });
          }
        }
      } catch (e) {
        console.warn('YouTube search request error:', e);
      }
    }

    return [];
  }
}
