export default async (req: Request) => {
  try {
    const url = new URL(req.url);
    const videoId = (url.searchParams.get('videoId') || '').trim();
    const title = (url.searchParams.get('title') || '').trim();
    const artist = (url.searchParams.get('artist') || '').trim();

    if (!videoId && !title) {
      return new Response(JSON.stringify({ lyrics: null }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    let foundLyrics: string | null = null;
    let source = 'none';

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

    return new Response(JSON.stringify({ lyrics: foundLyrics, source }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ lyrics: null, error: e.message }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};
