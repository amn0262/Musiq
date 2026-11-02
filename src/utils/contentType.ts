import { ContentType } from '../types/music';

export interface ContentTypeInfo {
  type: ContentType;
  label: string;
  badgeClass: string;
}

export function detectContentType(title: string, artist = ''): ContentType {
  const text = `${title} ${artist}`.toLowerCase();

  // Movie / Film / Trailer / Series
  if (
    /\b(trailer|official trailer|teaser|movie|film|cinema|soundtrack|ost|short film|scene|episode|series)\b/i.test(text) ||
    /(فيلم|فلم|تريلر|إعلان رسمي|إعلان فيلم|مسلسل|حلقة|سينما|مقطع من فيلم)/.test(text)
  ) {
    return 'movie';
  }

  // Podcast / Interview / Talk
  if (
    /\b(podcast|interview|talk show|dialogue|discussion|monologue)\b/i.test(text) ||
    /(بودكاست|حوار|لقاء|مقابلة|حديث|برنامج|نقاش)/.test(text)
  ) {
    return 'podcast';
  }

  // Live / Concert
  if (
    /\b(live|concert|live performance|live stream|unplugged|in concert|at festival)\b/i.test(text) ||
    /(حفل|حفلة|بث مباشر|مباشر|لايف|حفلات)/.test(text)
  ) {
    return 'live';
  }

  // Standard Music / Song
  if (
    /\b(song|music|audio|official video|official audio|remix|acoustic|cover|instrumental|feat|ft\.|prod|album|track|lyric|lyrics)\b/i.test(text) ||
    /(أغنية|اغنية|كليب|فيديو كليب|موسيقى|لحن|ريمكس|طرب|عزف|ألبوم)/.test(text)
  ) {
    return 'music';
  }

  return 'music';
}

export function getContentTypeInfo(type: ContentType): ContentTypeInfo {
  switch (type) {
    case 'movie':
      return {
        type: 'movie',
        label: 'Movie / Film',
        badgeClass: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
      };
    case 'podcast':
      return {
        type: 'podcast',
        label: 'Podcast',
        badgeClass: 'text-purple-300 bg-purple-500/10 border-purple-500/20',
      };
    case 'live':
      return {
        type: 'live',
        label: 'Live',
        badgeClass: 'text-rose-300 bg-rose-500/10 border-rose-500/20',
      };
    case 'video':
      return {
        type: 'video',
        label: 'Video',
        badgeClass: 'text-blue-300 bg-blue-500/10 border-blue-500/20',
      };
    case 'music':
    default:
      return {
        type: 'music',
        label: 'Music',
        badgeClass: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
      };
  }
}
