/**
 * Pure math and frequency analysis helpers for audio visualizer
 */

export interface AudioFrequencyBands {
  subBass: number;
  bass: number;
  mid: number;
  treble: number;
  overallEnergy: number;
}

export function extractFrequencyBands(freqData: Uint8Array | null): AudioFrequencyBands {
  if (!freqData || freqData.length === 0) {
    return {
      subBass: 0,
      bass: 0,
      mid: 0,
      treble: 0,
      overallEnergy: 0,
    };
  }

  const len = freqData.length;
  const subBassEnd = Math.max(1, Math.floor(len * 0.05));
  const bassEnd = Math.max(subBassEnd + 1, Math.floor(len * 0.18));
  const midEnd = Math.max(bassEnd + 1, Math.floor(len * 0.55));

  let subBassSum = 0;
  for (let i = 0; i < subBassEnd; i++) subBassSum += freqData[i];

  let bassSum = 0;
  for (let i = subBassEnd; i < bassEnd; i++) bassSum += freqData[i];

  let midSum = 0;
  for (let i = bassEnd; i < midEnd; i++) midSum += freqData[i];

  let trebleSum = 0;
  for (let i = midEnd; i < len; i++) trebleSum += freqData[i];

  let totalSum = subBassSum + bassSum + midSum + trebleSum;

  const subBass = subBassSum / (subBassEnd * 255);
  const bass = bassSum / ((bassEnd - subBassEnd) * 255);
  const mid = midSum / ((midEnd - bassEnd) * 255);
  const treble = trebleSum / ((len - midEnd) * 255);
  const overallEnergy = totalSum / (len * 255);

  return { subBass, bass, mid, treble, overallEnergy };
}

export function smoothValue(current: number, target: number, factor: number): number {
  const f = Math.max(0, Math.min(1, factor));
  return current + (target - current) * f;
}

export function updatePeakCaps(
  currentHeights: number[],
  peakCaps: number[],
  peakVelocities: number[],
  gravity: number = 0.45
): { peaks: number[]; caps: number[]; velocities: number[] } {
  const n = currentHeights.length;
  const newCaps: number[] = new Array(n);
  const newVelocities: number[] = new Array(n);

  for (let i = 0; i < n; i++) {
    const curH = currentHeights[i] || 0;
    let cap = peakCaps[i] ?? curH;
    let vel = peakVelocities[i] ?? 0;

    if (curH >= cap) {
      cap = curH;
      vel = 0;
    } else {
      vel += gravity;
      cap -= vel;
      if (cap < curH) {
        cap = curH;
        vel = 0;
      }
    }

    newCaps[i] = Math.max(0, cap);
    newVelocities[i] = vel;
  }

  return { peaks: newCaps, caps: newCaps, velocities: newVelocities };
}

export function getIOSVisualizerColors(style: string) {
  switch (style) {
    case 'bars':
      return {
        primary: 'rgb(240, 240, 245)',
        secondary: 'rgb(180, 180, 195)',
        accent: 'rgb(255, 255, 255)',
        glow: 'rgba(255, 255, 255, 0.25)',
        backgroundGradient: ['rgba(25, 25, 35, 0.4)', 'rgba(10, 10, 14, 0.8)'] as [string, string],
      };
    case 'circle':
      return {
        primary: 'rgb(220, 220, 235)',
        secondary: 'rgb(140, 140, 160)',
        accent: 'rgb(255, 255, 255)',
        glow: 'rgba(255, 255, 255, 0.2)',
        backgroundGradient: ['rgba(20, 20, 30, 0.3)', 'rgba(10, 10, 14, 0.7)'] as [string, string],
      };
    case 'particles':
    case 'ribbon':
    case 'wave':
    default:
      return {
        primary: 'rgb(245, 245, 250)',
        secondary: 'rgb(160, 160, 180)',
        accent: 'rgb(255, 255, 255)',
        glow: 'rgba(255, 255, 255, 0.3)',
        backgroundGradient: ['rgba(30, 30, 42, 0.4)', 'rgba(12, 12, 16, 0.8)'] as [string, string],
      };
  }
}

export interface PerceptualOptions {
  trebleBoost?: number;
  bassBoost?: number;
  minThreshold?: number;
}

export function getPerceptualFrequencyDistribution(
  freqData: Uint8Array | null,
  targetCount: number,
  options?: PerceptualOptions
): number[] {
  if (!freqData || freqData.length === 0 || targetCount <= 0) {
    return new Array(targetCount).fill(0);
  }

  const result = new Array(targetCount);
  const dataLen = freqData.length;
  const trebleBoost = options?.trebleBoost ?? 1;
  const bassBoost = options?.bassBoost ?? 1;
  const minThreshold = options?.minThreshold ?? 0;

  for (let i = 0; i < targetCount; i++) {
    // Logarithmic curve distribution
    const norm = (i + 1) / targetCount;
    const logIndex = Math.floor(Math.pow(norm, 1.8) * (dataLen - 1));
    const clamped = Math.max(0, Math.min(dataLen - 1, logIndex));
    let val = (freqData[clamped] || 0) / 255;

    // Apply optional frequency band boosts
    const boost = norm < 0.3 ? bassBoost : norm > 0.7 ? trebleBoost : 1;
    val = Math.max(minThreshold, Math.min(1, val * boost));

    result[i] = val;
  }

  return result;
}

export function getSymmetricalSpectrum(input: number[]): number[] {
  if (!input || input.length === 0) return [];
  const n = input.length;
  const result = new Array(n * 2);

  // Left mirrored (reversed)
  for (let i = 0; i < n; i++) {
    result[i] = input[n - 1 - i];
  }
  // Right normal
  for (let i = 0; i < n; i++) {
    result[n + i] = input[i];
  }

  return result;
}
