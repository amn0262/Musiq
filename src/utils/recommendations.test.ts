import { test, describe } from 'node:test';
import assert from 'node:assert';

describe('Recommendations and Timer logic', () => {
  test('Timer formatting helper correctly formats 180 seconds into 03:00', () => {
    const formatTimer = (totalSeconds: number) => {
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    assert.strictEqual(formatTimer(180), '03:00');
    assert.strictEqual(formatTimer(175), '02:55');
    assert.strictEqual(formatTimer(65), '01:05');
    assert.strictEqual(formatTimer(9), '00:09');
    assert.strictEqual(formatTimer(0), '00:00');
  });

  test('Empty playlist state allows user creation flow', () => {
    const initialPlaylists: any[] = [];
    assert.strictEqual(initialPlaylists.length, 0);

    const createCustomPlaylist = (name: string) => ({
      id: `pl-${Date.now()}`,
      name,
      song_ids: [],
      is_custom: true,
    });

    const userPlaylist = createCustomPlaylist('طرب ليلي خاص');
    assert.strictEqual(userPlaylist.name, 'طرب ليلي خاص');
    assert.strictEqual(userPlaylist.song_ids.length, 0);
    assert.strictEqual(userPlaylist.is_custom, true);
  });
});
