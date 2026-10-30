export interface SongTheme {
  id: string;
  genreKey: string;
  genreNameAr: string;
  genreNameEn: string;
  language: 'arabic' | 'turkish' | 'english' | 'french' | 'spanish' | 'other';
  languageNameAr: string;
  languageNameEn: string;
  colorNameAr: string;
  colorNameEn: string;
  primary: string;
  primaryHover: string;
  primaryRgb: string;
  background: string;
  surface: string;
  surfaceElevate: string;
  border: string;
  glow: string;
  badgeClass: string;
  textAccent: string;
}

export const THEMES: Record<string, SongTheme> = {
  tarab_amber: {
    id: 'tarab_amber',
    genreKey: 'classical',
    genreNameAr: 'طرب أصيل وكلاسيك',
    genreNameEn: 'Classical & Tarab',
    language: 'arabic',
    languageNameAr: 'عربي',
    languageNameEn: 'Arabic',
    colorNameAr: 'العنبري الذهبي الملكي',
    colorNameEn: 'Royal Amber Gold',
    primary: '#f59e0b',
    primaryHover: '#d97706',
    primaryRgb: '245, 158, 11',
    background: '#120d05',
    surface: '#1c1407',
    surfaceElevate: '#261b0a',
    border: 'rgba(245, 158, 11, 0.28)',
    glow: 'rgba(245, 158, 11, 0.45)',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    textAccent: 'text-amber-400',
  },
  pop_arabic_rose: {
    id: 'pop_arabic_rose',
    genreKey: 'pop_arabic',
    genreNameAr: 'بوب عربي حديث',
    genreNameEn: 'Modern Arab Pop',
    language: 'arabic',
    languageNameAr: 'عربي',
    languageNameEn: 'Arabic',
    colorNameAr: 'الياقوتي الوردي الحيوي',
    colorNameEn: 'Vibrant Ruby Rose',
    primary: '#f43f5e',
    primaryHover: '#e11d48',
    primaryRgb: '244, 63, 94',
    background: '#15070e',
    surface: '#200c16',
    surfaceElevate: '#2d1120',
    border: 'rgba(244, 63, 94, 0.28)',
    glow: 'rgba(244, 63, 94, 0.45)',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    textAccent: 'text-rose-400',
  },
  khaleeji_gold: {
    id: 'khaleeji_gold',
    genreKey: 'khaleeji',
    genreNameAr: 'موسيقى خليجية وشيلات',
    genreNameEn: 'Khaleeji & Gulf Beats',
    language: 'arabic',
    languageNameAr: 'عربي (خليجي)',
    languageNameEn: 'Arabic (Khaleeji)',
    colorNameAr: 'الذهبي الصحراوي الأصيل',
    colorNameEn: 'Desert Sunset Gold',
    primary: '#eab308',
    primaryHover: '#ca8a04',
    primaryRgb: '234, 179, 8',
    background: '#131004',
    surface: '#1c1706',
    surfaceElevate: '#292209',
    border: 'rgba(234, 179, 8, 0.28)',
    glow: 'rgba(234, 179, 8, 0.45)',
    badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    textAccent: 'text-yellow-400',
  },
  rai_emerald: {
    id: 'rai_emerald',
    genreKey: 'rai',
    genreNameAr: 'موسيقى الراي ومغاربي',
    genreNameEn: 'Rai & Maghrebi',
    language: 'arabic',
    languageNameAr: 'عربي (مغاربي)',
    languageNameEn: 'Arabic (Maghrebi)',
    colorNameAr: 'الزمردي المغاربي الأندلسي',
    colorNameEn: 'North African Emerald',
    primary: '#10b981',
    primaryHover: '#059669',
    primaryRgb: '16, 185, 129',
    background: '#04130d',
    surface: '#081f15',
    surfaceElevate: '#0d2d1f',
    border: 'rgba(16, 185, 129, 0.28)',
    glow: 'rgba(16, 185, 129, 0.45)',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    textAccent: 'text-emerald-400',
  },
  rap_lime: {
    id: 'rap_lime',
    genreKey: 'rap',
    genreNameAr: 'راب وهيب هوب',
    genreNameEn: 'Rap & Hip-Hop',
    language: 'arabic',
    languageNameAr: 'عربي / عالمي',
    languageNameEn: 'Arabic / Global',
    colorNameAr: 'الأخضر النيون الحماسي',
    colorNameEn: 'Cyber Electric Lime',
    primary: '#84cc16',
    primaryHover: '#65a30d',
    primaryRgb: '132, 204, 22',
    background: '#091204',
    surface: '#111f08',
    surfaceElevate: '#192c0c',
    border: 'rgba(132, 204, 22, 0.28)',
    glow: 'rgba(132, 204, 22, 0.45)',
    badgeClass: 'bg-lime-500/20 text-lime-300 border-lime-500/40',
    textAccent: 'text-lime-400',
  },
  turkish_crimson: {
    id: 'turkish_crimson',
    genreKey: 'turkish',
    genreNameAr: 'موسيقى تركية وأنغام البوسفور',
    genreNameEn: 'Turkish & Anatolian',
    language: 'turkish',
    languageNameAr: 'تركي',
    languageNameEn: 'Turkish',
    colorNameAr: 'القرمزي العثماني الفاخر',
    colorNameEn: 'Ottoman Byzantine Crimson',
    primary: '#e11d48',
    primaryHover: '#be123c',
    primaryRgb: '225, 29, 72',
    background: '#15050b',
    surface: '#200811',
    surfaceElevate: '#2c0c17',
    border: 'rgba(225, 29, 72, 0.28)',
    glow: 'rgba(225, 29, 72, 0.45)',
    badgeClass: 'bg-red-500/20 text-red-300 border-red-500/40',
    textAccent: 'text-red-400',
  },
  western_violet: {
    id: 'western_violet',
    genreKey: 'western_pop',
    genreNameAr: 'بوب عالمي وإلكترونيك',
    genreNameEn: 'Global Pop & Electronic',
    language: 'english',
    languageNameAr: 'إنجليزي / عالمي',
    languageNameEn: 'English / Global',
    colorNameAr: 'البنفسجي الكوني الكهربائي',
    colorNameEn: 'Electric Cosmic Violet',
    primary: '#a855f7',
    primaryHover: '#9333ea',
    primaryRgb: '168, 85, 247',
    background: '#0e0618',
    surface: '#160a26',
    surfaceElevate: '#210f39',
    border: 'rgba(168, 85, 247, 0.28)',
    glow: 'rgba(168, 85, 247, 0.45)',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    textAccent: 'text-purple-400',
  },
  rock_sapphire: {
    id: 'rock_sapphire',
    genreKey: 'rock',
    genreNameAr: 'روك وأنغام غربية كلاسيكية',
    genreNameEn: 'Rock & Classic West',
    language: 'english',
    languageNameAr: 'إنجليزي',
    languageNameEn: 'English',
    colorNameAr: 'الأزرق النيلي الملكي',
    colorNameEn: 'Electric Sapphire Blue',
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    primaryRgb: '59, 130, 246',
    background: '#050d18',
    surface: '#091526',
    surfaceElevate: '#0d1f38',
    border: 'rgba(59, 130, 246, 0.28)',
    glow: 'rgba(59, 130, 246, 0.45)',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    textAccent: 'text-blue-400',
  },
  relaxing_cyan: {
    id: 'relaxing_cyan',
    genreKey: 'relaxing',
    genreNameAr: 'استرخاء وتأمل وموسيقى هادئة',
    genreNameEn: 'Relaxing & Ambient',
    language: 'other',
    languageNameAr: 'موسيقى نقية / عالمي',
    languageNameEn: 'Instrumental / Pure',
    colorNameAr: 'السماوي الهادئ المائي',
    colorNameEn: 'Serene Oceanic Cyan',
    primary: '#06b6d4',
    primaryHover: '#0891b2',
    primaryRgb: '6, 182, 212',
    background: '#031116',
    surface: '#061c22',
    surfaceElevate: '#09262f',
    border: 'rgba(6, 182, 212, 0.28)',
    glow: 'rgba(6, 182, 212, 0.45)',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    textAccent: 'text-cyan-400',
  },
  latin_orange: {
    id: 'latin_orange',
    genreKey: 'latin',
    genreNameAr: 'موسيقى لاتينية وإسبانية',
    genreNameEn: 'Latin & Flamenco',
    language: 'spanish',
    languageNameAr: 'إسباني / لاتيني',
    languageNameEn: 'Spanish / Latin',
    colorNameAr: 'البرتقالي الأندلسي المتوهج',
    colorNameEn: 'Flamenco Sunset Orange',
    primary: '#f97316',
    primaryHover: '#ea580c',
    primaryRgb: '249, 115, 22',
    background: '#150903',
    surface: '#210e05',
    surfaceElevate: '#2e1407',
    border: 'rgba(249, 115, 22, 0.28)',
    glow: 'rgba(249, 115, 22, 0.45)',
    badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    textAccent: 'text-orange-400',
  },
  trending_indigo: {
    id: 'trending_indigo',
    genreKey: 'trending',
    genreNameAr: 'الأكثر رواجاً وتريند',
    genreNameEn: 'Trending & Viral',
    language: 'other',
    languageNameAr: 'عالمي',
    languageNameEn: 'Global',
    colorNameAr: 'النيلي الساطع الرائج',
    colorNameEn: 'Electric Neon Indigo',
    primary: '#6366f1',
    primaryHover: '#4f46e5',
    primaryRgb: '99, 102, 241',
    background: '#090918',
    surface: '#111026',
    surfaceElevate: '#191737',
    border: 'rgba(99, 102, 241, 0.28)',
    glow: 'rgba(99, 102, 241, 0.45)',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    textAccent: 'text-indigo-400',
  },
};

/**
 * Intelligent classifier that analyzes a song's genre, language, title, and artist
 * to return the exact unified signature color theme.
 */
export function detectSongTheme(song?: {
  title?: string;
  titleAr?: string;
  artist?: string;
  artistAr?: string;
  category?: string;
  album?: string;
  lyrics?: string;
}): SongTheme {
  if (!song) return THEMES.tarab_amber;

  const titleCombined = `${song.title || ''} ${song.titleAr || ''} ${song.album || ''}`.toLowerCase();
  const artistCombined = `${song.artist || ''} ${song.artistAr || ''}`.toLowerCase();
  const textCombined = `${titleCombined} ${artistCombined} ${song.lyrics || ''}`.toLowerCase();

  // 1. Turkish Detection (Tarkan, Tatlises, Şımarık, Turkish chars)
  const isTurkish =
    artistCombined.includes('tarkan') ||
    artistCombined.includes('tatlises') ||
    artistCombined.includes('kaya') ||
    artistCombined.includes('ibrahim') ||
    titleCombined.includes('şımarık') ||
    titleCombined.includes('ölürüm') ||
    titleCombined.includes('turkish') ||
    titleCombined.includes('turk') ||
    /[ğüşöçıİĞÜŞÖÇ]/.test(textCombined);

  if (isTurkish) {
    return THEMES.turkish_crimson;
  }

  // 2. Classical Arabic & Tarab (Fairuz, Umm Kulthum, Abdel Halim, etc.)
  const isTarab =
    song.category === 'classical' ||
    artistCombined.includes('fairuz') ||
    artistCombined.includes('فيروز') ||
    artistCombined.includes('kulthum') ||
    artistCombined.includes('كلثوم') ||
    artistCombined.includes('halim') ||
    artistCombined.includes('حليم') ||
    artistCombined.includes('warda') ||
    artistCombined.includes('وردة') ||
    artistCombined.includes('asmahan') ||
    artistCombined.includes('أسمهان') ||
    artistCombined.includes('atrash') ||
    artistCombined.includes('أطرش') ||
    titleCombined.includes('بيروت') ||
    titleCombined.includes('عمري') ||
    titleCombined.includes('أطلال') ||
    titleCombined.includes('طرب');

  if (isTarab) {
    return THEMES.tarab_amber;
  }

  // 3. Khaleeji (Hussain Al Jassmi, Rashed, Majid Al Mohandis, Abdul Majeed, Sheilat)
  const isKhaleeji =
    artistCombined.includes('jassmi') ||
    artistCombined.includes('جسمي') ||
    artistCombined.includes('mohandis') ||
    artistCombined.includes('المهندس') ||
    artistCombined.includes('rashed') ||
    artistCombined.includes('راشد') ||
    artistCombined.includes('abdulmajeed') ||
    artistCombined.includes('عبدالمجيد') ||
    artistCombined.includes('abadi') ||
    titleCombined.includes('هتان') ||
    titleCombined.includes('بالبنط العريض') ||
    titleCombined.includes('شيلة') ||
    titleCombined.includes('خليجي');

  if (isKhaleeji) {
    return THEMES.khaleeji_gold;
  }

  // 4. Rai & Maghreb (Khaled, Mami, Saad Lamjarred, Soolking, Rai)
  const isRai =
    artistCombined.includes('khaled') ||
    artistCombined.includes('خالد') ||
    artistCombined.includes('lamjarred') ||
    artistCombined.includes('لمجرد') ||
    artistCombined.includes('soolking') ||
    artistCombined.includes('mami') ||
    artistCombined.includes('راي') ||
    titleCombined.includes('didi') ||
    titleCombined.includes('aicha') ||
    titleCombined.includes('مغاربي') ||
    titleCombined.includes('راي');

  if (isRai) {
    return THEMES.rai_emerald;
  }

  // 5. Rap & Hip-Hop (Wegz, Marwan Pablo, Travis Scott, Drake, Eminem, etc.)
  const isRap =
    song.category === 'rap' ||
    artistCombined.includes('wegz') ||
    artistCombined.includes('ويجز') ||
    artistCombined.includes('pablo') ||
    artistCombined.includes('بابلو') ||
    artistCombined.includes('moussa') ||
    artistCombined.includes('موسى') ||
    artistCombined.includes('afroto') ||
    artistCombined.includes('عفروتو') ||
    artistCombined.includes('travis') ||
    artistCombined.includes('eminem') ||
    artistCombined.includes('drake') ||
    titleCombined.includes('البخت') ||
    titleCombined.includes('rap') ||
    titleCombined.includes('راب');

  if (isRap) {
    return THEMES.rap_lime;
  }

  // 6. Relaxing / Ambient / Classical Piano
  const isRelaxing =
    song.category === 'relaxing' ||
    artistCombined.includes('einaudi') ||
    artistCombined.includes('yiruma') ||
    artistCombined.includes('chopin') ||
    artistCombined.includes('beethoven') ||
    titleCombined.includes('piano') ||
    titleCombined.includes('bianche') ||
    titleCombined.includes('relax') ||
    titleCombined.includes('هدوء') ||
    titleCombined.includes('استرخاء') ||
    titleCombined.includes('تأمل');

  if (isRelaxing) {
    return THEMES.relaxing_cyan;
  }

  // 7. Latin / Flamenco / Spanish
  const isLatin =
    artistCombined.includes('rosalia') ||
    artistCombined.includes('enrique') ||
    artistCombined.includes('shakira') ||
    artistCombined.includes('maluma') ||
    artistCombined.includes('bad bunny') ||
    artistCombined.includes('fonsi') ||
    titleCombined.includes('despacito') ||
    titleCombined.includes('flamenco') ||
    titleCombined.includes('latino') ||
    titleCombined.includes('spanish');

  if (isLatin) {
    return THEMES.latin_orange;
  }

  // 8. Modern Arab Pop (Amr Diab, Nancy Ajram, Elissa, Hamaki, Tamer Hosny)
  const isArabicPop =
    song.category === 'pop' &&
    (/[\u0600-\u06FF]/.test(textCombined) ||
      artistCombined.includes('diab') ||
      artistCombined.includes('دياب') ||
      artistCombined.includes('ajram') ||
      artistCombined.includes('عجرم') ||
      artistCombined.includes('elissa') ||
      artistCombined.includes('إليسا') ||
      artistCombined.includes('hamaki') ||
      artistCombined.includes('حماقي') ||
      artistCombined.includes('tamer') ||
      artistCombined.includes('تامر'));

  if (isArabicPop) {
    return THEMES.pop_arabic_rose;
  }

  // 9. Western & International Pop (The Weeknd, Taylor Swift, Dua Lipa, Billie Eilish)
  const isWesternPop =
    song.category === 'pop' ||
    song.category === 'international' ||
    artistCombined.includes('weeknd') ||
    artistCombined.includes('swift') ||
    artistCombined.includes('lipa') ||
    artistCombined.includes('eilish') ||
    artistCombined.includes('ariana') ||
    artistCombined.includes('bruno');

  if (isWesternPop) {
    return THEMES.western_violet;
  }

  // 10. Trending & Viral
  if (song.category === 'trending') {
    return THEMES.trending_indigo;
  }

  // 11. Arabic general fallback
  if (/[\u0600-\u06FF]/.test(textCombined) || song.category === 'arabic') {
    return THEMES.tarab_amber;
  }

  // Default international theme
  return THEMES.western_violet;
}

/**
 * Applies CSS variables directly to the root document or container element
 */
export function applyThemeVariables(theme: SongTheme, target: HTMLElement = document.documentElement) {
  if (typeof window === 'undefined' || !target) return;
  target.style.setProperty('--theme-primary', theme.primary);
  target.style.setProperty('--theme-primary-hover', theme.primaryHover);
  target.style.setProperty('--theme-primary-rgb', theme.primaryRgb);
  target.style.setProperty('--theme-bg', theme.background);
  target.style.setProperty('--theme-surface', theme.surface);
  target.style.setProperty('--theme-surface-elevate', theme.surfaceElevate);
  target.style.setProperty('--theme-border', theme.border);
  target.style.setProperty('--theme-glow', theme.glow);
}
