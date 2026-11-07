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

                      if (videos.length >= 75) break;
                    }
                  }
                  if (videos.length >= 75) break;
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

        // 3. YouTube Lyrics & Captions Endpoint
        if (req.url.startsWith('/api/youtube/lyrics')) {
          try {
            const parsedUrl = new URL(req.url, 'http://localhost');
            const videoId = (parsedUrl.searchParams.get('videoId') || '').trim();
            const title = (parsedUrl.searchParams.get('title') || '').trim();
            const artist = (parsedUrl.searchParams.get('artist') || '').trim();

            if (!videoId && !title) {
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ lyrics: null }));
            }

            let foundLyrics: string | null = null;
            let source: string = 'none';

            // A. Check YouTube Video Page for CC / captions or Description lyrics
            if (videoId) {
              try {
                const ytPageResp = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
                  headers: {
                    'User-Agent':
                      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept-Language': 'en,ar;q=0.9',
                    Cookie: 'CONSENT=YES+cb.20210328-17-p0.en+FX+478;',
                  },
                });

                if (ytPageResp.ok) {
                  const html = await ytPageResp.text();

                  // 1. Try captions track from timedtext
                  const captionMatch = html.match(/"captionTracks":\s*(\[.+?\])/);
                  if (captionMatch && captionMatch[1]) {
                    try {
                      const captionTracks = JSON.parse(captionMatch[1]);
                      if (Array.isArray(captionTracks) && captionTracks.length > 0) {
                        const trackUrl = captionTracks[0].baseUrl;
                        if (trackUrl) {
                          const capResp = await fetch(trackUrl);
                          if (capResp.ok) {
                            const capXml = await capResp.text();
                            const lines = Array.from(capXml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/gi))
                              .map((m) =>
                                m[1]
                                  .replace(/&amp;/g, '&')
                                  .replace(/&quot;/g, '"')
                                  .replace(/&#39;/g, "'")
                                  .replace(/&lt;/g, '<')
                                  .replace(/&gt;/g, '>')
                                  .replace(/<[^>]+>/g, '')
                                  .trim()
                              )
                              .filter((l) => l.length > 0 && !/^\[.+\]$/.test(l));

                            if (lines.length > 4) {
                              foundLyrics = lines.join('\n');
                              source = 'youtube_captions';
                            }
                          }
                        }
                      }
                    } catch {}
                  }

                  // 2. Try description if captions not found
                  if (!foundLyrics) {
                    const descMatch = html.match(/"shortDescription":\s*"([\s\S]*?)"/);
                    if (descMatch && descMatch[1]) {
                      const unescaped = descMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
                      const lyricsHeaderMatch = unescaped.match(
                        /(?:lyrics|الكلمات|كلمات الاغنية|كلمات الأغنية)[\s\S]*?(?:[\n\r]{2,}|$)/i
                      );
                      if (lyricsHeaderMatch && lyricsHeaderMatch[0].length > 40) {
                        foundLyrics = lyricsHeaderMatch[0].trim();
                        source = 'youtube_description';
                      }
                    }
                  }
                }
              } catch {}
            }

            // B. If not found on YouTube, query open lyrics database (LRCLIB)
            if (!foundLyrics && title) {
              try {
                const cleanTitle = title
                  .replace(/\(.*?\)/g, '')
                  .replace(/\[.*?\]/g, '')
                  .replace(/official video/gi, '')
                  .replace(/official audio/gi, '')
                  .replace(/video/gi, '')
                  .replace(/audio/gi, '')
                  .trim();
                const cleanArtist = artist.replace(/- Topic/gi, '').trim();

                const lrcUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(
                  cleanArtist
                )}&track_name=${encodeURIComponent(cleanTitle)}`;
                const lrcResp = await fetch(lrcUrl, {
                  headers: { 'User-Agent': 'MUSIQ-Audio-Platform (aymenbakkour@gmail.com)' },
                });

                if (lrcResp.ok) {
                  const lrcData = await lrcResp.json();
                  const raw = lrcData.plainLyrics || lrcData.syncedLyrics;
                  if (raw) {
                    foundLyrics = raw.replace(/\[\d+:\d+\.\d+\]/g, '').trim();
                    source = 'lrclib';
                  }
                }
              } catch {}
            }

            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ lyrics: foundLyrics, source }));
          } catch (e: any) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ lyrics: null, error: e.message }));
          }
        }

        // 4. YouTube MP3 Download Info Endpoint
        if (req.url.startsWith('/api/youtube/download-info')) {
          try {
            const parsedUrl = new URL(req.url, 'http://localhost');
            const videoId = (parsedUrl.searchParams.get('videoId') || '').trim();
            const title = (parsedUrl.searchParams.get('title') || '').trim();

            if (!videoId) {
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: 'Missing videoId' }));
            }

            const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;
            res.setHeader('Content-Type', 'application/json');
            return res.end(
              JSON.stringify({
                videoId,
                title,
                formats: ['320kbps', '192kbps', '128kbps'],
                downloadUrls: {
                  server1: `https://ytmp3.nu/${videoId}`,
                  server2: `https://y2mate.nu/convert?url=${encodeURIComponent(ytUrl)}`,
                  server3: `https://loader.to/api/button/?url=${encodeURIComponent(ytUrl)}&f=mp3`,
                  server4: `https://ezmp3.cc/`,
                },
              })
            );
          } catch (e: any) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: e.message }));
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
