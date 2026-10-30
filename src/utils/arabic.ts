/**
 * Arabic text normalization and fuzzy matching utilities for MUSIQ search
 */

// Regex for Arabic diacritics (tashkeel)
const TASHKEEL_REGEX = /[\u064B-\u0652\u0670\u0640]/g;

/**
 * Normalizes Arabic text by removing tashkeel and harmonizing letter shapes
 * (alif variations, yaa/alif maqsura, taa marbuta/haa)
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  
  return text
    .trim()
    .toLowerCase()
    // Remove diacritics / tashkeel and tatweel
    .replace(TASHKEEL_REGEX, '')
    // Normalize alif with hamza (أ, إ, آ, ٱ) -> ا
    .replace(/[أإآٱ]/g, 'ا')
    // Normalize alif maqsura (ى) -> ي
    .replace(/ى/g, 'ي')
    // Normalize taa marbuta (ة) -> ه
    .replace(/ة/g, 'ه')
    // Normalize Persian/Urdu kaf/gaf/yeh if any
    .replace(/ك/g, 'ك')
    .replace(/ي/g, 'ي')
    // Normalize multiple spaces
    .replace(/\s+/g, ' ');
}

/**
 * Checks if target string matches search query, with full Arabic normalization
 * and latin case-insensitivity.
 */
export function matchesQuery(target: string, query: string): boolean {
  if (!query || !query.trim()) return true;
  if (!target) return false;

  const normQuery = normalizeArabic(query.trim());
  const normTarget = normalizeArabic(target.trim());

  // Direct substring match after normalization
  if (normTarget.includes(normQuery)) return true;

  // Split query into words to check all words present
  const words = normQuery.split(' ').filter(Boolean);
  if (words.length > 1) {
    return words.every((word) => normTarget.includes(word));
  }

  return false;
}
