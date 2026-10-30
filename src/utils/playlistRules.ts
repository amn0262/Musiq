/**
 * Core playlist, queue, shuffle and repeat rules
 */

export type RepeatMode = 'off' | 'all' | 'one';

/**
 * Modern Fisher-Yates array shuffle, optionally keeping the current active item at index 0
 */
export function shuffleQueue<T>(items: T[], activeItemIndex: number = -1): T[] {
  if (!items || items.length <= 1) return [...items];

  const result = [...items];
  const activeItem = activeItemIndex >= 0 && activeItemIndex < items.length ? result[activeItemIndex] : null;

  // Extract active item temporarily if present so it can remain first or pinned
  const remaining = activeItem !== null 
    ? result.filter((_, idx) => idx !== activeItemIndex)
    : result;

  for (let i = remaining.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
  }

  return activeItem !== null ? [activeItem, ...remaining] : remaining;
}

/**
 * Calculates next index in queue considering repeat mode
 */
export function getNextTrackIndex(
  currentIndex: number,
  queueLength: number,
  repeatMode: RepeatMode = 'all'
): number {
  if (queueLength <= 0) return -1;
  if (repeatMode === 'one') return currentIndex;
  
  if (currentIndex < queueLength - 1) {
    return currentIndex + 1;
  }
  
  // At the end of queue
  if (repeatMode === 'all') {
    return 0; // loop back to first
  }
  
  return -1; // End reached and repeat is off
}

/**
 * Calculates previous track index.
 * If currentTime > 3 seconds, standard music player behavior resets current track to start,
 * otherwise goes to previous track.
 */
export function getPrevTrackIndex(
  currentIndex: number,
  queueLength: number,
  currentTime: number = 0
): { targetIndex: number; shouldRewind: boolean } {
  if (queueLength <= 0) return { targetIndex: -1, shouldRewind: false };

  if (currentTime > 3) {
    return { targetIndex: currentIndex, shouldRewind: true };
  }

  if (currentIndex > 0) {
    return { targetIndex: currentIndex - 1, shouldRewind: false };
  }

  return { targetIndex: Math.max(0, queueLength - 1), shouldRewind: false };
}

/**
 * Validates adding a song to a playlist
 */
export function canAddSongToPlaylist(
  playlistSongIds: string[],
  songId: string,
  allowDuplicates: boolean = false
): { allowed: boolean; isDuplicate: boolean; reason?: string } {
  const isDuplicate = playlistSongIds.includes(songId);
  if (isDuplicate && !allowDuplicates) {
    return {
      allowed: false,
      isDuplicate: true,
      reason: 'This song is already in this playlist.',
    };
  }
  return { allowed: true, isDuplicate };
}

/**
 * Reorders items in queue / playlist
 */
export function reorderList<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length) {
    return [...list];
  }
  const result = [...list];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}
