import React, { useState, useEffect, useCallback } from 'react';
import { useMusic } from '../context/MusicContext';
import {
  X,
  FileText,
  Loader2,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';

export const LyricsModal: React.FC = () => {
  const { isLyricsModalOpen, closeLyricsModal, currentSong } = useMusic();

  const [fetchedLyrics, setFetchedLyrics] = useState<string | null>(null);
  const [lyricsSource, setLyricsSource] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [lyricsError, setLyricsError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchLyrics = useCallback(async () => {
    if (!currentSong) return;
    setIsLoading(true);
    setLyricsError(null);

    try {
      const videoId = currentSong.provider_track_id || '';
      const title = currentSong.title;
      const artist = currentSong.artist;
      const res = await fetch(
        `/api/youtube/lyrics?videoId=${encodeURIComponent(videoId)}&title=${encodeURIComponent(
          title
        )}&artist=${encodeURIComponent(artist)}`
      );

      if (res.ok) {
        const data = await res.json();
        if (data.lyrics) {
          setFetchedLyrics(data.lyrics);
          let label = 'YouTube';
          if (data.source === 'youtube_captions') label = 'YouTube Subtitles (CC)';
          else if (data.source === 'youtube_description') label = 'YouTube Video Description';
          else if (data.source === 'lrclib') label = 'Music Database';
          setLyricsSource(label);
        } else {
          setFetchedLyrics(null);
          setLyricsError('لم يتم العثور على كلمات لهذا المقطع');
        }
      } else {
        setLyricsError('تعذر الاتصال بخدمة الكلمات');
      }
    } catch (e: any) {
      console.warn('Lyrics fetch error:', e);
      setLyricsError('تعذر جلب الكلمات حالياً');
    } finally {
      setIsLoading(false);
    }
  }, [currentSong]);

  useEffect(() => {
    if (isLyricsModalOpen && currentSong) {
      if (!currentSong.lyrics && !currentSong.lyricsAr && !fetchedLyrics && !isLoading) {
        fetchLyrics();
      }
    }
  }, [isLyricsModalOpen, currentSong, fetchedLyrics, isLoading, fetchLyrics]);

  useEffect(() => {
    setFetchedLyrics(null);
    setLyricsSource('');
    setLyricsError(null);
  }, [currentSong?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLyricsModalOpen) {
        closeLyricsModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLyricsModalOpen, closeLyricsModal]);

  if (!isLyricsModalOpen) return null;

  const rawLyrics = currentSong?.lyricsAr || currentSong?.lyrics || fetchedLyrics;

  const handleCopy = () => {
    if (!rawLyrics) return;
    navigator.clipboard.writeText(rawLyrics);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="كلمات الأغنية"
    >
      <div className="relative w-full max-w-xl max-h-[85vh] bg-[#121218] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#161620]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white truncate max-w-[240px] sm:max-w-md">
                {currentSong ? currentSong.title : 'كلمات الأغنية'}
              </h2>
              <p className="text-xs text-gray-400">
                {currentSong ? currentSong.artist : 'لا يوجد مقطع مشغل'}
                {lyricsSource ? ` • ${lyricsSource}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {rawLyrics && (
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="نسخ الكلمات"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
            <button
              onClick={fetchLyrics}
              disabled={isLoading || !currentSong}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors cursor-pointer"
              title="إعادة تحميل الكلمات"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={closeLyricsModal}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lyrics Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
              <p className="text-xs">جاري البحث عن كلمات المقطع...</p>
            </div>
          ) : rawLyrics ? (
            <div className="text-center sm:text-right font-sans text-sm sm:text-base leading-relaxed text-gray-200 whitespace-pre-line select-text">
              {rawLyrics}
            </div>
          ) : (
            <div className="py-20 text-center text-gray-500 space-y-3">
              <FileText className="w-10 h-10 mx-auto text-gray-600 opacity-60" />
              <p className="text-sm font-semibold text-gray-300">
                {lyricsError || 'لم تتوفر كلمات لهذا المقطع بعد'}
              </p>
              {currentSong && (
                <button
                  onClick={fetchLyrics}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  إعادة المحاولة
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
