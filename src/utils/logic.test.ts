import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeArabic, matchesQuery } from './arabic';
import { formatDuration, formatRemaining, formatCompactNumber } from './formatters';
import {
  shuffleQueue,
  getNextTrackIndex,
  getPrevTrackIndex,
  canAddSongToPlaylist,
  reorderList,
} from './playlistRules';

test('Arabic normalization strips tashkeel and harmonizes letters', () => {
  // Tashkeel removal
  assert.equal(normalizeArabic('مُوسِيقَى'), 'موسيقي');
  // Alif variations
  assert.equal(normalizeArabic('أحمد إبراهيم آمال ٱلله'), 'احمد ابراهيم امال الله');
  // Taa marbuta to haa
  assert.equal(normalizeArabic('أغنية جميلة'), 'اغنيه جميله');
});

test('Arabic search matches fuzzy queries and artist name spellings', () => {
  // Matching with tashkeel differences
  assert.equal(matchesQuery('فيروز - زهرة المدائن', 'فيروز'), true);
  assert.equal(matchesQuery('أم كلثوم - أنت عمري', 'ام كلثوم'), true);
  assert.equal(matchesQuery('عمرو دياب - نور العين', 'عمرو دياب'), true);
  assert.equal(matchesQuery('Fairuz - Li Beirut', 'fairuz'), true);
  assert.equal(matchesQuery('Nancy Ajram - Ah W Noss', 'Nancy'), true);
});

test('Formatters return correct music time strings', () => {
  assert.equal(formatDuration(0), '0:00');
  assert.equal(formatDuration(65), '1:05');
  assert.equal(formatDuration(215), '3:35');
  assert.equal(formatRemaining(15, 215), '-3:20');
  assert.equal(formatCompactNumber(1500), '1.5K');
  assert.equal(formatCompactNumber(2400000), '2.4M');
});

test('Playback queue next & previous navigation with repeat modes', () => {
  const queueLen = 5;
  // Repeat 'all'
  assert.equal(getNextTrackIndex(0, queueLen, 'all'), 1);
  assert.equal(getNextTrackIndex(4, queueLen, 'all'), 0); // loops to first
  
  // Repeat 'off'
  assert.equal(getNextTrackIndex(4, queueLen, 'off'), -1);

  // Repeat 'one'
  assert.equal(getNextTrackIndex(2, queueLen, 'one'), 2);

  // Previous track behavior
  const restartCurrent = getPrevTrackIndex(2, queueLen, 10);
  assert.equal(restartCurrent.shouldRewind, true);
  assert.equal(restartCurrent.targetIndex, 2);

  const prevTrack = getPrevTrackIndex(2, queueLen, 1);
  assert.equal(prevTrack.shouldRewind, false);
  assert.equal(prevTrack.targetIndex, 1);
});

test('Playlist duplicate prevention and reordering', () => {
  const existing = ['song-1', 'song-2', 'song-3'];
  const resDuplicate = canAddSongToPlaylist(existing, 'song-2', false);
  assert.equal(resDuplicate.allowed, false);
  assert.equal(resDuplicate.isDuplicate, true);

  const resNew = canAddSongToPlaylist(existing, 'song-4', false);
  assert.equal(resNew.allowed, true);

  const reordered = reorderList(['a', 'b', 'c', 'd'], 0, 2);
  assert.deepEqual(reordered, ['b', 'c', 'a', 'd']);
});
