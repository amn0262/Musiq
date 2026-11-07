import test from 'node:test';
import assert from 'node:assert/strict';
import { Song } from '../types/music';
import {
  filterSameArtist,
  filterSameGenre,
  combineRecommendations,
  getArabicGenreLabel,
} from './recommendationRules';

const mockSongs: Song[] = [
  {
    id: 's-1',
    title: 'نسم علينا الهوى',
    artist: 'فيروز',
    duration: 250,
    category: 'classical',
    source: 'youtube',
    provider_track_id: 'yt-1',
    album: 'أغاني زمان',
    artwork_url: '',
  },
  {
    id: 's-2',
    title: 'سهر الليالي',
    artist: 'فيروز',
    duration: 220,
    category: 'classical',
    source: 'youtube',
    provider_track_id: 'yt-2',
    album: 'أغاني زمان',
    artwork_url: '',
  },
  {
    id: 's-3',
    title: 'تملي معاك',
    artist: 'عمرو دياب',
    duration: 260,
    category: 'pop',
    source: 'youtube',
    provider_track_id: 'yt-3',
    album: 'تملي معاك',
    artwork_url: '',
  },
  {
    id: 's-4',
    title: 'أنت عمري',
    artist: 'أم كلثوم',
    duration: 400,
    category: 'classical',
    source: 'youtube',
    provider_track_id: 'yt-4',
    album: 'روائع كوكب الشرق',
    artwork_url: '',
  },
];

test('filterSameArtist returns songs by the same artist excluding current', () => {
  const current = mockSongs[0]; // فيروز نسم علينا الهوى
  const sameArtist = filterSameArtist(mockSongs, current);

  assert.equal(sameArtist.length, 1);
  assert.equal(sameArtist[0].title, 'سهر الليالي');
});

test('filterSameGenre returns songs of the same category excluding current', () => {
  const current = mockSongs[0]; // classical
  const sameGenre = filterSameGenre(mockSongs, current);

  // s-2 (فيروز) and s-4 (أم كلثوم) are classical
  assert.equal(sameGenre.length, 2);
  assert.ok(sameGenre.some((s) => s.id === 's-4'));
});

test('combineRecommendations dedupes and orders artist first, then genre', () => {
  const current = mockSongs[0];
  const sameArtist = [mockSongs[1]];
  const sameGenre = [mockSongs[1], mockSongs[3]]; // mockSongs[1] is both same artist and same genre

  const combined = combineRecommendations(sameArtist, sameGenre, current.id);
  assert.equal(combined.length, 2);
  assert.equal(combined[0].song.id, 's-2');
  assert.equal(combined[0].reason, 'artist');
  assert.equal(combined[1].song.id, 's-4');
  assert.equal(combined[1].reason, 'genre');
});

test('getArabicGenreLabel returns friendly Arabic labels', () => {
  assert.equal(getArabicGenreLabel('classical'), 'طرب وكلاسيك');
  assert.equal(getArabicGenreLabel('pop'), 'بوب معاصر');
  assert.equal(getArabicGenreLabel('unknown'), 'نفس النمط الموسيقي');
});
