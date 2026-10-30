/**
 * Formatting utilities for playback time and metrics
 */

export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function formatRemaining(currentSec: number, totalDuration: number): string {
  if (isNaN(totalDuration) || totalDuration <= 0) return '-0:00';
  const remaining = Math.max(0, totalDuration - (isNaN(currentSec) ? 0 : currentSec));
  return `-${formatDuration(remaining)}`;
}

export function formatCompactNumber(num: number): string {
  if (isNaN(num)) return '0';
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}
