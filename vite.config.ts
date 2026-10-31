import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

function parseDurationText(str?: string): number {
  if (!str) return 210;
  const parts = str.split(':').map(Number);
  if (parts.length === 2) return (parts[0] || 0) * 60 + (parts[1] || 0);
  if (parts.length === 3) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  return 210;
}

function youtubeApiPlugin(): Plugin {
  return {
    name: 'youtube-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next();

        // 1. YouTube Live Search Endpoint
        if (req.url.startsWith('/api/youtube/search')) {
          try {
            const parsedUrl = new URL(req.url, 'http://localhost');
            const query = (parsedUrl.searchParams.get('q') || '').trim();

            if (!query) {
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ results: [] }));
            }

            // Check if YouTube API key is available
            const apiKey = process.env.YOUTUBE_API_KEY;
            if (apiKey) {
              const musicQuery = encodeURIComponent(`${query} music`);
              const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=15&q=${musicQuery}&key=${apiKey}`;
              const ytResponse = await fetch(apiUrl);
              if (ytResponse.ok) {
                const data = await ytResponse.json();
                if (data.items && Array.isArray(data.items)) {
                  const songs = data.items.map((item: any) => ({
                    id: `yt-${item.id.videoId}`,
                    provider_track_id: item.id.videoId,
                    title: item.snippet.title.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&'),
                    artist: item.snippet.channelTitle.replace(' - Topic', ''),
                    album: 'YouTube Official',
                    artwork_url: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
                    duration: 215,
                    source: 'youtube',
                    category: 'trending',
                    plays_count: 500000,
                  }));
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({ results: songs }));
                }
              }
            }

            // Real-time YouTube search parser
            const ytSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
            const response = await fetch(ytSearchUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'ar,en;q=0.9',
                'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+478; SOCS=CAESEwgDEgk0ODE3Nzk3MjQaAmVuIAEaBgiA_LyaBg',
              },
            });

            if (response.ok) {
              const html = await response.text();
              const match =
                html.match(/(?:var\s+)?ytInitialData\s*=\s*({.+?});<\/script>/s) ||
                html.match(/window\["ytInitialData"\]\s*=\s*({.+?});<\/script>/s);

              if (match && match[1]) {
                const parsedData = JSON.parse(match[1]);
                const sections =
                  parsedData.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
                const videos: any[] = [];
                const seenIds = new Set<string>();

                for (const sec of sections) {
                  const items = sec.itemSectionRenderer?.contents || [];
                  for (const item of items) {
                    const vr = item.videoRenderer || item.compactVideoRenderer;
                    if (vr && vr.videoId && !seenIds.has(vr.videoId)) {
                      seenIds.add(vr.videoId);
                      const videoId = vr.videoId;
                      const title =
                        vr.title?.runs?.map((r: any) => r.text).join('') || vr.title?.simpleText || 'Unknown Song';
                      const artist =
                        vr.ownerText?.runs?.map((r: any) => r.text).join('') ||
                        vr.shortBylineText?.runs?.map((r: any) => r.text).join('') ||
                        'YouTube Artist';
                      const durationStr = vr.lengthText?.simpleText;
                      const thumb =
                        vr.thumbnail?.thumbnails?.slice(-1)[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

                      videos.push({
                        id: `yt-${videoId}`,
                        provider_track_id: videoId,
                        title: title.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&'),
                        artist: artist.replace(' - Topic', ''),
                        album: 'YouTube Music',
                        artwork_url: thumb,
                        duration: parseDurationText(durationStr),
                        source: 'youtube',
                        category: 'trending',
                        plays_count: 750000,
                      });

                      if (videos.length >= 25) break;
                    }
                  }
                  if (videos.length >= 25) break;
                }

                if (videos.length > 0) {
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({ results: videos }));
                }
              }
            }

            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ results: [] }));
          } catch (e: any) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ results: [], error: e.message }));
          }
        }

        // 2. YouTube Suggestions Endpoint
        if (req.url.startsWith('/api/youtube/suggestions')) {
          try {
            const parsedUrl = new URL(req.url, 'http://localhost');
            const query = (parsedUrl.searchParams.get('q') || '').trim();

            if (!query) {
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ suggestions: [] }));
            }

            const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`;
            const response = await fetch(url, {
              headers: { 'Accept-Language': 'ar,en;q=0.9' },
            });

            if (response.ok) {
              const data = await response.json();
              if (Array.isArray(data) && Array.isArray(data[1])) {
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ suggestions: data[1].slice(0, 8) }));
              }
            }

            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ suggestions: [] }));
          } catch {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ suggestions: [] }));
          }
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), youtubeApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.', '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
