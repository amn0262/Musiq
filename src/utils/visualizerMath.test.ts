import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractFrequencyBands,
  smoothValue,
  updatePeakCaps,
  getPerceptualFrequencyDistribution,
  getSymmetricalSpectrum,
} from './visualizerMath';

test('smoothValue interpolates smoothly towards target', () => {
  const current = 10;
  const target = 20;
  const smoothed = smoothValue(current, target, 0.5);
  assert.equal(smoothed, 15);
});

test('smoothValue handles zero and one factor edge cases', () => {
  assert.equal(smoothValue(5, 10, 0), 5);
  assert.equal(smoothValue(5, 10, 1), 10);
});

test('extractFrequencyBands handles null or empty data', () => {
  const emptyResult = extractFrequencyBands(null);
  assert.equal(emptyResult.overallEnergy, 0);
  assert.equal(emptyResult.bass, 0);
});

test('extractFrequencyBands calculates energy correctly from Uint8Array', () => {
  const data = new Uint8Array([255, 255, 255, 255]);
  const bands = extractFrequencyBands(data);
  assert.ok(bands.overallEnergy > 0.9);
});

test('updatePeakCaps tracks peaks and gravity decay', () => {
  const currentHeights = [50, 80];
  const peakCaps = [60, 70];
  const peakVelocities = [0, 0];

  const result = updatePeakCaps(currentHeights, peakCaps, peakVelocities, 1);
  assert.ok(result.peaks[1] >= 80, 'Peak cap should jump to current height if height is higher');
  assert.ok(result.peaks[0] < 60, 'Peak cap should decay if height is lower');
});

test('getSymmetricalSpectrum mirrors the input', () => {
  const input = [1, 2, 3];
  const mirrored = getSymmetricalSpectrum(input);
  assert.deepEqual(mirrored, [3, 2, 1, 1, 2, 3]);
});

test('getPerceptualFrequencyDistribution produces target length array', () => {
  const data = new Uint8Array(64).fill(128);
  const dist = getPerceptualFrequencyDistribution(data, 10);
  assert.equal(dist.length, 10);
});
