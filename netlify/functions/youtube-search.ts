export default async (req: Request) => {
  try {
    const url = new URL(req.url);
    const query = (url.searchParams.get('q') || '').trim();

    if (!query) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const ytSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const response = await fetch(ytSearchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en;q=0.9',
        Cookie:
          'CONSENT=YES+cb.20210328-17-p0.en+FX+478; SOCS=CAESEwgDEgk0ODE3Nzk3MjQaAmVuIAEaBgiA_LyaBg',
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
                'YouTube';

              let duration = 210;
              const durationStr = vr.lengthText?.simpleText;
              if (durationStr) {
                const parts = durationStr.split(':').map(Number);
                if (parts.length === 2) duration = (parts[0] || 0) * 60 + (parts[1] || 0);
                if (parts.length === 3) duration = (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
              }

              videos.push({
                id: `yt-${videoId}`,
                provider_track_id: videoId,
                title: title.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&'),
                artist: artist.replace(' - Topic', ''),
                album: 'YouTube Music',
                artwork_url: '',
                duration,
                source: 'youtube',
                category: 'trending',
                plays_count: 500000,
              });

              if (videos.length >= 75) break;
            }
          }
          if (videos.length >= 75) break;
        }

        if (videos.length > 0) {
          return new Response(JSON.stringify({ results: videos }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          });
        }
      }
    }

    return new Response(JSON.stringify({ results: [] }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ results: [], error: err?.message }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};
