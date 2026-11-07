/**
 * Pure helper functions for search history and keyword management
 */

export function addSearchQueryToHistory(existing: string[], query: string, maxItems: number = 15): string[] {
  const trimmed = query.trim();
  if (!trimmed) return existing;
  
  // Remove existing duplicate (case-insensitive)
  const filtered = existing.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
  // Prepend to top
  const updated = [trimmed, ...filtered];
  return updated.slice(0, maxItems);
}

export function removeSearchQueryFromHistory(existing: string[], queryToRemove: string): string[] {
  const target = queryToRemove.trim().toLowerCase();
  return existing.filter((item) => item.trim().toLowerCase() !== target);
}

export function formatSearchKeyword(query: string): string {
  return query.trim();
}
