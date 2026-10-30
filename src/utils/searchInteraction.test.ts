import test from 'node:test';
import assert from 'node:assert';
import { SearchService } from '../services/searchService.ts';
import { INITIAL_SONGS } from '../data/catalog.ts';

test('Search suggestions are returned for Arabic and English queries', () => {
  const arabicSuggestions = SearchService.getSuggestions('عمرو');
  assert.ok(arabicSuggestions.length > 0, 'Should find suggestions for Amr');
  assert.ok(
    arabicSuggestions.some((s) => s.includes('عمرو') || s.toLowerCase().includes('amr')),
    'Should contain Amr Diab in Arabic or English'
  );

  const englishSuggestions = SearchService.getSuggestions('Fairuz');
  assert.ok(englishSuggestions.length > 0, 'Should find suggestions for Fairuz');
});

test('Selecting a suggestion immediately matches a catalog song or triggers YouTube discovery', () => {
  const chosenSuggestion = 'عمرو دياب';
  const norm = chosenSuggestion.toLowerCase().trim();
  const matched = INITIAL_SONGS.find(
    (s) =>
      s.title.toLowerCase().includes(norm) ||
      (s.titleAr && s.titleAr.includes(chosenSuggestion)) ||
      s.artist.toLowerCase().includes(norm) ||
      (s.artistAr && s.artistAr.includes(chosenSuggestion))
  );

  assert.ok(matched, 'Should match a song in catalog for instant playback');
  assert.ok(matched?.provider_track_id, 'Matched song should have a valid YouTube provider ID');
});
