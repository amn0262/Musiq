import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addSearchQueryToHistory,
  removeSearchQueryFromHistory,
  formatSearchKeyword,
} from './searchRules';

test('addSearchQueryToHistory adds new query to the front', () => {
  const initial = ['Fairuz', 'Amr Diab'];
  const result = addSearchQueryToHistory(initial, 'Adele');
  assert.deepEqual(result, ['Adele', 'Fairuz', 'Amr Diab']);
});

test('addSearchQueryToHistory dedupes case-insensitively and moves to top', () => {
  const initial = ['Fairuz', 'Adele', 'Amr Diab'];
  const result = addSearchQueryToHistory(initial, 'adele');
  assert.deepEqual(result, ['adele', 'Fairuz', 'Amr Diab']);
});

test('addSearchQueryToHistory ignores empty or whitespace string', () => {
  const initial = ['Fairuz', 'Amr Diab'];
  const result = addSearchQueryToHistory(initial, '   ');
  assert.deepEqual(result, ['Fairuz', 'Amr Diab']);
});

test('addSearchQueryToHistory caps maximum history items', () => {
  const initial = ['1', '2', '3', '4', '5'];
  const result = addSearchQueryToHistory(initial, 'new', 4);
  assert.equal(result.length, 4);
  assert.equal(result[0], 'new');
});

test('removeSearchQueryFromHistory removes query case-insensitively', () => {
  const initial = ['Fairuz', 'Amr Diab', 'Adele'];
  const result = removeSearchQueryFromHistory(initial, 'amr diab');
  assert.deepEqual(result, ['Fairuz', 'Adele']);
});

test('formatSearchKeyword trims whitespace', () => {
  assert.equal(formatSearchKeyword('   Coldplay   '), 'Coldplay');
});
